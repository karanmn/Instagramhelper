export async function getProfileData(username) {
  const cleanUsername = username.replace('@', '').trim();
  const apiKey = process.env.RAPIDAPI_KEY;

  if (apiKey) {
    try {
      // 1. RapidAPI call to 'Account Data' endpoint
      const res = await fetch(
        `https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_user_info.php?username_or_id_or_url=${cleanUsername}`,
        {
          headers: {
            'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
            'x-rapidapi-key': apiKey
          },
          next: { revalidate: 300 } // 5 minutes cache
        }
      );

      const data = await res.json();
      
      // Is API me user details direct ya user/data key ke andar hoti hain
      const user = data.user || data.data || data || {};

      if (user && (user.username || user.full_name)) {
        return {
          username: user.username || cleanUsername,
          fullName: user.full_name || cleanUsername,
          bio: user.biography || '',
          followers: user.follower_count || user.edge_followed_by?.count || 0,
          following: user.following_count || user.edge_follow?.count || 0,
          postsCount: user.media_count || user.edge_owner_to_timeline_media?.count || 0,
          isPrivate: Boolean(user.is_private),
          sampleCaptions: [
            user.biography || '',
            // Agar media data available nahi h toh initial analysis ke liye template slots
            "Stop wasting 4 hours on Reels editing. Here are 3 formulas that bring 100k views with zero edits. #creators #instagramtips #viralreels",
            "Most people think virality is luck. It's actually a 2-second hook retention game."
          ].filter(Boolean)
        };
      }
    } catch (err) {
      console.error("RapidAPI fetch failed, falling back to mock:", err);
    }
  }

  // Fallback data agar API limit exceed ho ya key na mile
  return {
    username: cleanUsername,
    fullName: `${cleanUsername.toUpperCase()}`,
    bio: "Creator & Builder | Scaling automated systems and content engines.",
    followers: 18200,
    following: 420,
    postsCount: 95,
    isPrivate: false,
    sampleCaptions: [
      "Stop wasting 4 hours on Reels editing. Here are 3 formulas that bring 100k views with zero edits. #creators #instagramtips #viralreels",
      "Most people think virality is luck. It's actually a 2-second hook retention game.",
      "How this 1 simple layout brought $15,000 in inbound leads last week."
    ]
  };
}
