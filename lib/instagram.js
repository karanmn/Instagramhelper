export async function getProfileData(username) {
  const cleanUsername = username.replace('@', '').trim();
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY missing on Vercel environment variables.");
  }

  try {
    // 1. Fetch Profile Info
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
      throw new Error(`RapidAPI responded with status ${res.status}`);
    }

    const raw = await res.json();
    const user = raw.data || raw.user || raw.graphql?.user || raw.result || raw;

    const fetchedUsername = user.username || cleanUsername;
    const fullName = user.full_name || user.name || fetchedUsername;
    const bio = user.biography || user.bio || '';
    const followers = user.follower_count ?? user.followers_count ?? user.edge_followed_by?.count ?? 0;
    const following = user.following_count ?? user.edge_follow?.count ?? 0;
    const postsCount = user.media_count ?? user.edge_owner_to_timeline_media?.count ?? 0;
    const category = user.category_name || user.business_category_name || '';

    // 2. Try fetching Recent Posts / Reels if present in payload or secondary endpoint
    const recentMedia = [];
    const edges =
      user.edge_owner_to_timeline_media?.edges ||
      user.edge_felix_video_timeline?.edges ||
      user.posts ||
      user.items ||
      [];

    edges.slice(0, 8).forEach((edge, idx) => {
      const node = edge.node || edge;
      const caption =
        node.edge_media_to_caption?.edges?.[0]?.node?.text ||
        node.caption?.text ||
        (typeof node.caption === 'string' ? node.caption : '') ||
        '';
      const views = node.video_view_count || node.play_count || node.view_count || 0;
      const likes = node.edge_liked_by?.count || node.like_count || 0;
      const comments = node.edge_media_to_comment?.count || node.comment_count || 0;
      const isVideo = Boolean(node.is_video || node.media_type === 2 || views > 0);

      if (caption || views || likes) {
        recentMedia.push({
          id: node.id || idx + 1,
          type: isVideo ? 'Reel' : 'Post',
          caption: caption.trim(),
          hookLine: (caption.split('\n')[0] || '').trim(),
          views,
          likes,
          comments
        });
      }
    });

    // Secondary attempt: fetch user reels/posts endpoint if edges were empty
    if (recentMedia.length === 0) {
      try {
        const postForm = new FormData();
        postForm.append('username_or_url', cleanUsername);
        const postsRes = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_user_posts.php', {
          method: 'POST',
          headers: {
            'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
            'x-rapidapi-key': apiKey
          },
          body: postForm,
          cache: 'no-store'
        });

        if (postsRes.ok) {
          const postsRaw = await postsRes.json();
          const postItems = postsRaw.posts || postsRaw.data || postsRaw.items || [];
          if (Array.isArray(postItems)) {
            postItems.slice(0, 8).forEach((item, idx) => {
              const node = item.node || item;
              const caption =
                node.caption?.text ||
                node.edge_media_to_caption?.edges?.[0]?.node?.text ||
                (typeof node.caption === 'string' ? node.caption : '') ||
                '';
              const views = node.play_count || node.video_view_count || 0;
              const likes = node.like_count || node.edge_liked_by?.count || 0;
              const comments = node.comment_count || node.edge_media_to_comment?.count || 0;

              recentMedia.push({
                id: node.pk || node.id || idx + 1,
                type: views > 0 || node.media_type === 2 ? 'Reel' : 'Post',
                caption: caption.trim(),
                hookLine: (caption.split('\n')[0] || '').trim(),
                views,
                likes,
                comments
              });
            });
          }
        }
      } catch (e) {
        console.log('Secondary posts endpoint skipped:', e.message);
      }
    }

    const sampleCaptions = recentMedia.map(m => m.caption).filter(Boolean);
    if (sampleCaptions.length === 0 && bio) {
      sampleCaptions.push(bio);
    }

    return {
      username: fetchedUsername,
      fullName,
      bio,
      category,
      followers,
      following,
      postsCount,
      isPrivate: Boolean(user.is_private),
      recentMedia,
      sampleCaptions
    };
  } catch (err) {
    console.error("Fetch profile failed:", err.message);
    throw err;
  }
}
