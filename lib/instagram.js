export async function getProfileData(username) {
  const cleanUsername = username.replace('@', '').trim();
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    console.warn("⚠️ RAPIDAPI_KEY is not defined in process.env");
    throw new Error("RAPIDAPI_KEY missing on Vercel. Please check Environment Variables.");
  }

  try {
    const url = `https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_user_info.php?username_or_id_or_url=${cleanUsername}`;
    
    console.log(`Fetching from RapidAPI for: ${cleanUsername}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      },
      cache: 'no-store' // Cache bypass taaki live data mile
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`RapidAPI HTTP Error ${res.status}:`, errText);
      throw new Error(`RapidAPI responded with status ${res.status}`);
    }

    const raw = await res.json();
    console.log("RapidAPI Raw Response:", JSON.stringify(raw).slice(0, 300));

    // Handle all potential schema variations from this specific provider
    const user = raw.response?.body || raw.user || raw.data || raw.graphql?.user || raw;

    // Extract fields safely
    const fetchedUsername = user.username || cleanUsername;
    const fullName = user.full_name || user.name || fetchedUsername;
    const bio = user.biography || user.bio || '';
    const followers = user.follower_count ?? user.edge_followed_by?.count ?? user.followers ?? 0;
    const following = user.following_count ?? user.edge_follow?.count ?? user.following ?? 0;
    const postsCount = user.media_count ?? user.edge_owner_to_timeline_media?.count ?? user.posts ?? 0;

    // Captions extract: user bio + recent post caption if present
    const sampleCaptions = [];
    if (bio) sampleCaptions.push(bio);

    // Agar provider posts bhi return kar raha ho
    const edges = user.edge_owner_to_timeline_media?.edges || user.recent_posts || [];
    edges.slice(0, 3).forEach(edge => {
      const node = edge.node || edge;
      const cap = node.edge_media_to_caption?.edges?.[0]?.node?.text || node.caption || '';
      if (cap) sampleCaptions.push(cap);
    });

    if (sampleCaptions.length === 0) {
      sampleCaptions.push("No public caption or bio found on this profile.");
    }

    return {
      username: fetchedUsername,
      fullName,
      bio,
      followers,
      following,
      postsCount,
      isPrivate: Boolean(user.is_private),
      sampleCaptions
    };
  } catch (err) {
    console.error("Scraper execution failure:", err.message);
    throw err; // Fail explicitly so we know what broke instead of silent mock data
  }
}
