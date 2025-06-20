const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

// const axios = require('axios');
const supabase = require('../Database/supabase');


const geocodeLocation = async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "Description required" });

  const cacheKey = `geocode:${description}`;

  try {
    // Step 1: Check Supabase cache first
    const { data: cached, error: cacheError } = await supabase
      .from('cache')
      .select('value')
      .eq('key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached?.value) {
      return res.status(200).json({ source: 'cache', ...cached.value });
    }

    // Step 2: Extract location name using Gemini
    const geminiPrompt = `Extract the location mentioned in: "${description}"`;

    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: geminiPrompt }] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    const locationName = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!locationName) {
      return res.status(400).json({ error: "No location extracted" });
    }

    // Step 3: Geocode using Mapbox
    const mapboxRes = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json`,
      {
        params: {
          access_token: MAPBOX_API_KEY,
          limit: 1
        }
      }
    );

    const [lon, lat] = mapboxRes.data.features?.[0]?.center || [];

    if (!lat || !lon) {
      return res.status(404).json({ error: "Unable to geocode location" });
    }

    const result = {
      location_name: locationName,
      lat,
      lon
    };

    // Step 4: Cache result in Supabase
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // TTL 1 hour
    await supabase.from('cache').upsert({
      key: cacheKey,
      value: result,
      expires_at: expiresAt.toISOString()
    });

    res.status(200).json({ source: 'fresh', ...result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Geocoding failed" });
  }
};

module.exports = {  geocodeLocation };
