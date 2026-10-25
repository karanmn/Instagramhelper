export async function getProfileData(username) {
  const cleanUsername = username.replace('@', '').trim();
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY missing on Vercel environment variables.");
  }

  try {
    // Screenshot ke exact cURL ke anusaar FormData taiyar karna
    const formData = new FormData();
    formData.append('data', 'basic');
    formData.append('username_or_url', cleanUsername);

    const res = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile.php', {
      method: 'POST',
      headers: {
        'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      },
      body: formData,
      cache: 'no-store'
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("RapidAPI Error Text:", errText);
      throw new Error(`RapidAPI responded with status ${res.status}`);
    }

    const raw = await res.json();
    console.log("RapidAPI response:", raw);

    // Response structure extraction
    const user = raw.data || raw.user || raw.graphql?.user || raw.result || raw;

    const fetchedUsername = user.username || cleanUsername;
    const fullName = user.full_name || user.name || fetchedUsername;
    const bio = user.biography || user.bio || '';
    const followers = user.follower_count ?? user.followers_count ?? user.edge_followed_by?.count ?? 0;
    const following = user.following_count ?? user.edge_follow?.count ?? 0;
    const postsCount = user.media_count ?? user.edge_owner_to_timeline_media?.count ?? 0;

    const sampleCaptions = [];
    if (bio) sampleCaptions.push(bio);

    const posts = user.edge_owner_to_timeline_media?.edges || user.posts || [];
    posts.slice(0, 3).forEach(p => {
      const cap = p.node?.edge_media_to_caption?.edges?.[0]?.node?.text || p.caption || '';
      if (cap) sampleCaptions.push(cap);
    });

    if (sampleCaptions.length === 0) {
      sampleCaptions.push(bio || "Creator profile analyzed successfully.");
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
    console.error("Fetch profile failed:", err.message);
    throw err;
  }
}
