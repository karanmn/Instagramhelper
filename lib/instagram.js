export async function getProfileData(username) {
  const cleanUsername = username.replace('@', '').trim();
  const apiKey = process.env.RAPIDAPI_KEY;

  if (apiKey) {
    try {
      const res = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${cleanUsername}`, {
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        }
      });
      const data = await res.json();
      const user = data.data || {};
      return {
        username: cleanUsername,
        fullName: user.full_name || cleanUsername,
        bio: user.biography || '',
        followers: user.follower_count || 0,
        following: user.following_count || 0,
        postsCount: user.media_count || 0,
        isPrivate: user.is_private || false,
        sampleCaptions: [
          user.biography || "No caption found",
          "Stop building apps the old way in 2026. Here is the 3-step AI stack. #coding #tech #ai",
          "How 1 developer hit $10k MRR with zero ad spend using 1 simple reel format. #buildinpublic"
        ]
      };
    } catch (err) {
      console.error("API error, fallback active:", err);
    }
  }

  // Fallback / Demo data agar API key na ho:
  return {
    username: cleanUsername,
    fullName: `${cleanUsername.toUpperCase()} (Analyzed)`,
    bio: "Creator & Builder | Sharing daily systems for modern creators & scaling workflows.",
    followers: 24500,
    following: 340,
    postsCount: 184,
    isPrivate: false,
    sampleCaptions: [
      "Stop wasting 4 hours on Reels editing. Here are 3 formulas that bring 100k views with zero edits. #creators #instagramtips #viralreels #growth #reels",
      "Most people think virality is luck. It's actually a 2-second hook retention game.",
      "How this 1 simple layout brought $15,000 in inbound leads last week."
    ]
  };
}
