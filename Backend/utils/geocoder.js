const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// It's best practice to store your token as an environment variable
const MAPBOX_TOKEN = process.env.MAPBOX_API_KEY;

async function geocode(locationName) {
  if (!locationName) {
    return null;
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].center;
      return { lat, lon };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    // Depending on requirements, you might want to throw the error
    // or return null to indicate failure without stopping the process.
    return null;
  }
}

module.exports = { geocode }; 