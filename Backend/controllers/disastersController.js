const supabase = require('../Database/supabase');
const crypto=require("crypto")
const wkx = require('wkx'); // Add this at top
const { geocode } = require('../utils/geocoder');

const createDisaster = async (req, res) => {
  const { title, location_name, description, tags, owner_id } = req.body;

  try {
    // Get coordinates from location name using Mapbox
    const coords = await geocode(location_name);
    
    // Basic audit entry
    const audit = [{
      action: "create",
      user_id: owner_id,
      timestamp: new Date().toISOString()
    }];

    // Convert lat/lon to PostGIS-compatible POINT text (WKT format)
    let locationWKT = null;
    if (coords) {
      locationWKT = `SRID=4326;POINT(${coords.lon} ${coords.lat})`; // Make sure lon comes first!
    }

    const insertData = {
      title,
      location_name,
      description,
      tags,
      owner_id,
      audit_trail: audit,
    };

    // Inject location if present
    if (locationWKT) {
      insertData.location = locationWKT;
    }

    const { data, error } = await supabase
      .from('disasters')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
    // Attach lat/lon from location
    if (data && data.location) {
      try {
        const buffer = Buffer.from(data.location, 'hex');
        const geom = wkx.Geometry.parse(buffer);
        if (geom && geom.x && geom.y) {
          data.lon = geom.x;
          data.lat = geom.y;
        }
      } catch (err) {
        console.error('Failed to parse WKB location:', err);
      }
    }
    if (req.io) {
      req.io.emit('disaster_created', data);
    }
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDisasters = async (req, res) => {
  const { tag } = req.query;

  try {
    let query = supabase
      .from('disasters')
      .select('*')
      .order('created_at', { ascending: false });

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch disasters" });
    }

    // Convert WKT POINT to lat/lon
    const parsedData = data.map(d => {
      let lat = null, lon = null;
    
      try {
        if (d.location) {
          const buffer = Buffer.from(d.location, 'hex'); // Convert hex to binary
          const geom = wkx.Geometry.parse(buffer); // Decode WKB
          if (geom && geom.x && geom.y) {
            lon = geom.x;
            lat = geom.y;
          }
        }
      } catch (err) {
        console.error('WKB parse error:', err);
      }
    
      return {
        ...d,
        lat,
        lon
      };
    });

    res.status(200).json(parsedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
  
const updateDisaster = async (req, res) => {
  const { id } = req.params;
  const { title, location_name, description, tags, owner_id } = req.body;

  try {
    // Get coordinates from location name using Mapbox
    const coords = await geocode(location_name);
    
    // Prepare new audit log entry
    const auditEntry = {
      action: "update",
      user_id: owner_id,
      timestamp: new Date().toISOString()
    };

    // Fetch current audit_trail
    const { data: existing, error: fetchError } = await supabase
      .from('disasters')
      .select('audit_trail')
      .eq('id', id)
      .single();

    if (fetchError) return res.status(404).json({ error: "Disaster not found" });

    const updatedTrail = existing.audit_trail || [];
    updatedTrail.push(auditEntry);

    const updateData = {
      title,
      location_name,
      description,
      tags,
      owner_id,
      audit_trail: updatedTrail
    };

    if (coords) {
      updateData.location = `SRID=4326;POINT(${coords.lon} ${coords.lat})`;
    }

    const { data, error } = await supabase
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Update failed" });
    // Attach lat/lon from location
    if (data && data.location) {
      try {
        const buffer = Buffer.from(data.location, 'hex');
        const geom = wkx.Geometry.parse(buffer);
        if (geom && geom.x && geom.y) {
          data.lon = geom.x;
          data.lat = geom.y;
        }
      } catch (err) {
        console.error('Failed to parse WKB location:', err);
      }
    }
    if (req.io) {
      req.io.emit('disaster_updated', data);
    }
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteDisaster = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: "Delete failed or disaster not found" });
    if (req.io) {
      req.io.emit('disaster_deleted', data);
    }
    res.status(200).json({ message: "Disaster deleted", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
  
const getNearbyResources = async (req, res) => {
  const { id } = req.params;

  try {
    // Simple fetch of all resources for this disaster
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: "Failed to fetch resources" });
    }

    console.log('Resources found:', data);
    res.status(200).json(data || []);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: "Server error" });
  }
};
  
const postResource = async (req, res) => {
  const { id: disaster_id } = req.params;
  const { name, location_name, type } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Only admins can add resources." });
  }

  if (!name || !location_name || !type) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Get coordinates from location name using Mapbox
    const coords = await geocode(location_name);
    
    if (!coords) {
      return res.status(400).json({ error: "Could not geocode the location. Please provide a valid location name." });
    }

    const point = `SRID=4326;POINT(${coords.lon} ${coords.lat})`;

    const insertData = {
      id: crypto.randomUUID(),
      disaster_id,
      name,
      location_name,
      location: point,
      type,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('resources')
      .insert([insertData])
      .select();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to add resource." });
    }

    if (!data || data.length === 0) {
      return res.status(500).json({ error: "No data returned from Supabase." });
    }

    // Emit socket event for new resource
    if (req.io) {
      req.io.emit('resource_created', data[0]);
    }

    res.status(201).json({ message: "Resource added successfully", resource: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
};
    

const { agent, loginToBluesky } = require('../utils/blueskyClient');

const getSocialMedia = async (req, res) => {
  const { id: disasterId } = req.params;

  try {
    const { data: disaster, error } = await supabase
      .from('disasters')
      .select('tags')
      .eq('id', disasterId)
      .single();

    if (error) return res.status(404).json({ error: "Disaster not found" });

    const tags = disaster.tags || [];
    const cacheKey = `social_${disasterId}`;

    // 1. Check Cache
    const { data: cached } = await supabase
      .from('cache')
      .select('*')
      .eq('key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached?.value) {
      return res.json({ source: "cache", posts: cached.value });
    }

    // 2. Login to Bluesky
    await loginToBluesky();

    let posts = [];

    // 3. Search Bluesky for each tag
    for (const tag of tags) {
      // const result = await agent.searchPosts({ q: `#${tag}`, limit: 10 });
      const result = await agent.app.bsky.feed.searchPosts({ q: `#${tag}`, limit: 10 });

      const foundPosts = result.data.posts.map(post => ({
        user: post.author.handle,
        post: post.record.text,
        uri: post.uri,
        indexedAt: post.indexedAt
      }));

      posts.push(...foundPosts);
    }

    // Optional: Remove duplicates
    posts = [...new Map(posts.map(p => [p.uri, p])).values()];

    // 4. Cache for 1 hour
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: posts,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

    return res.json({ source: "live", posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch from Bluesky" });
  }
};

const {model} = require('../utils/geminiClient');

// const verifyImage = async (req, res) => {
//   const { id: disasterId } = req.params;
//   const { image_url, report_id } = req.body;

//   if (!image_url || !report_id) {
//     return res.status(400).json({ error: "Missing image_url or report_id." });
//   }

//   const cacheKey = `verify_${report_id}`;

//   // Check Cache
//   const { data: cached } = await supabase
//     .from('cache')
//     .select('*')
//     .eq('key', cacheKey)
//     .gt('expires_at', new Date().toISOString())
//     .maybeSingle();

//   if (cached?.value) {
//     console.log("✅ Gemini result from cache");
//     return res.json({ source: "cache", result: cached.value });
//   }

//   try {
//     // Step 1: Fetch image bytes
//     const response = await fetch(image_url);
//     const imageBuffer = await response.arrayBuffer();

//     // Step 2: Analyze with Gemini
//     const result = await model.generateContent([
//       { text: "Analyze this image for signs of manipulation or disaster context. Respond clearly if this appears real or fake and what disaster it matches." },
//       {
//         inlineData: {
//           mimeType: "image/jpeg",
//           data: Buffer.from(imageBuffer).toString("base64")
//         }
//       }
//     ]);

//     const text = result.response.text();

//     // Step 3: Cache result
//     await supabase.from('cache').upsert({
//       key: cacheKey,
//       value: text,
//       expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
//     });

//     // Step 4: Update report's verification_status
//     await supabase.from('reports')
//       .update({ verification_status: text })
//       .eq('id', report_id);

//     return res.json({ source: "live", result: text });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Image verification failed" });
//   }
// };

const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const verifyImageWithGemini = async (image_url, report_id) => {
  const cacheKey = `verify_${report_id}`;

  // Check cache
  const { data: cached } = await supabase
    .from('cache')
    .select('*')
    .eq('key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached?.value) {
    return { source: "cache", result: cached.value };
  }

  try {
    const response = await fetch(image_url);
    const imageBuffer = await response.arrayBuffer();

    // Stream Gemini response
    const result = await model.generateContentStream([
      { text: "Analyze this image for signs of manipulation or disaster context. Respond clearly if this appears real or fake and what disaster it matches." },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: Buffer.from(imageBuffer).toString("base64")
        }
      }
    ]);

    let geminiResponse = "";
    for await (const chunk of result.stream) {
      geminiResponse += chunk.text();
    }

    // Cache it
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: geminiResponse,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

    // Update report
    await supabase.from('reports')
      .update({ verification_status: geminiResponse })
      .eq('id', report_id);

    return { source: "live", result: geminiResponse };
  } catch (err) {
    console.error("Gemini verification failed:", err);
    return { source: "error", result: "Image verification failed." };
  }
};



// const model = require('../utils/geminiClient'); // make sure you've already set this up
const { createHash } = require("crypto");

const createReport = async (req, res) => {
  const { id: disaster_id } = req.params;
  const { content, image_url } = req.body;
  const user_id = req.headers['x-user-id'];
  // const content = req.body.content;
  // const image_url = req.body.image_url;

  if (!user_id || !content) {
    return res.status(400).json({ error: "Missing user_id or content" });
  }

  try {
    // Step 1: Insert report with pending status
    const { data: inserted, error } = await supabase
      .from('reports')
      .insert([{
        disaster_id,
        user_id,
        content,
        image_url: image_url || null,
        verification_status: "pending"
      }])
      .select('*');

    if (error) throw error;

    const report_id = inserted[0].id;
    let verificationResult = null;

    // Step 2: Verify image (if provided)
    if (image_url) {
      verificationResult = await verifyImageWithGemini(image_url, report_id);
    }

    // Emit socket event for new report
    if (req.io) {
      req.io.emit('report_created', {
        ...inserted[0],
        verification_status: verificationResult?.result || "pending"
      });
    }

    return res.status(201).json({
      message: "Report created successfully",
      report_id,
      verification_status: verificationResult?.result || "pending",
      source: verificationResult?.source || "skipped"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create report" });
  }
};


const cheerio = require('cheerio');

// const fetch = require("node-fetch");
// const cheerio = require("cheerio");
const {  generateWithGemini } = require('../utils/geminiClient');
const getOfficialUpdates = async (req, res) => {
  const { id: disasterId } = req.params;
  const cacheKey = `updates_${disasterId}`;

  // 1. Check cache
  const { data: cached } = await supabase
    .from('cache')
    .select('*')
    .eq('key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached?.value?.length > 0) {
    console.log("✅ Official updates from cache");
    return res.json({ source: "cache", updates: cached.value });
  }

  try {
    // 2. Fetch disaster details
    const { data: disaster, error } = await supabase
      .from('disasters')
      .select('location_name, title, tags')
      .eq('id', disasterId)
      .maybeSingle();

    if (!disaster || error) {
      return res.status(404).json({ error: "Disaster not found." });
    }

    const { location_name = '', title = '', tags = [] } = disaster;
    const keywords = [...tags].join(', ');

    // 3. Call Gemini API to generate updates
    const prompt = `Generate a JSON array with 1 short official disaster relief update from Red Cross or you can scrape it for a disaster with tags: ${keywords}. Each update should be an object with 'title', 'source', and 'url' fields. Respond ONLY with the JSON array, no explanation or markdown.`;

    const rawGemini = await generateWithGemini(prompt);
    console.log('Raw Gemini response for official updates:', rawGemini);

    let updates = [];
    if (Array.isArray(rawGemini)) {
      updates = rawGemini;
    } else if (typeof rawGemini === 'string') {
      try {
        updates = JSON.parse(rawGemini);
      } catch (e) {
        console.error('Failed to parse Gemini string as JSON:', rawGemini);
        updates = [];
      }
    }

    if (!updates || !Array.isArray(updates)) {
      throw new Error("AI did not return structured updates");
    }

    // 4. Cache the result
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: updates,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

    return res.json({ source: "ai", updates });

  } catch (err) {
    console.error("❌ Error fetching AI-based updates:", err);
    return res.status(500).json({ error: "Failed to fetch AI-generated updates" });
  }
};

const getReports = async (req, res) => {
  const { id: disaster_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('disaster_id', disaster_id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const getNearbyHospitals = async (req, res) => {
  const { id } = req.params;
  // Fetch disaster to get coordinates
  const { data: disaster, error } = await supabase
    .from('disasters')
    .select('location')
    .eq('id', id)
    .single();

  console.log('Fetched disaster for nearby hospitals:', disaster);

  if (error || !disaster) {
    console.error('Disaster not found or error:', error);
    return res.status(404).json({ error: 'Disaster not found' });
  }

  // Parse WKB location to get lat/lon
  let lat = null, lon = null;
  try {
    if (disaster.location) {
      const buffer = Buffer.from(disaster.location, 'hex');
      const geom = wkx.Geometry.parse(buffer);
      if (geom && geom.x && geom.y) {
        lon = geom.x;
        lat = geom.y;
      }
    }
  } catch (err) {
    console.error('Failed to parse WKB location:', err);
  }

  if (!lat || !lon) {
    console.error('Disaster found but missing coordinates:', disaster);
    return res.status(400).json({ error: 'No coordinates for this disaster' });
  }

  // Overpass QL for hospitals within 5km
  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:5000,${lat},${lon});
      way["amenity"="hospital"](around:5000,${lat},${lon});
      relation["amenity"="hospital"](around:5000,${lat},${lon});
    );
    out center;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json({ hospitals: (data.elements || []).slice(0, 5) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

module.exports = { createDisaster,getDisasters,updateDisaster,deleteDisaster,getNearbyResources,postResource,getSocialMedia,createReport,getOfficialUpdates, getReports, getNearbyHospitals };
