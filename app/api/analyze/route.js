import { NextResponse } from 'next/server';
import { getProfileData } from '../../../lib/instagram';
import { lintCaption, scoreHook, generateBeatSheet, humanizeAndDetect } from '../../../lib/heuristics';

// Universal Multi-LLM Router with Dynamic Model ID Support
async function callSelectedLLM(provider, modelId, systemPrompt, userPrompt, jsonMode = false) {
  let endpoint = '';
  let headers = { 'Content-Type': 'application/json' };
  let body = {};

  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY is missing in Vercel Environment Variables.");
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    headers['Authorization'] = `Bearer ${key}`;
    headers['HTTP-Referer'] = 'https://insta-app-agent-alpha.vercel.app';
    headers['X-Title'] = 'Instagram Agent Studio';

    const selectedModel = modelId || 'meta-llama/llama-3.3-70b-instruct:free';
    body = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.75
    };
  } else if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing in Vercel Environment Variables.");
    const geminiModel = modelId || 'gemini-2.5-flash';
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`;
    body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {}
    };
  } else if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is missing in Vercel Environment Variables.");
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    headers['Authorization'] = `Bearer ${key}`;
    body = {
      model: modelId || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.75,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    };
  } else {
    // Free Keyless Pollinations Fallback
    endpoint = 'https://text.pollinations.ai/openai';
    body = {
      model: 'openai',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.75,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.toUpperCase()} (${modelId || 'default'}) Error ${res.status}: ${errText.slice(0, 180)}`);
  }

  const data = await res.json();
  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    return data.choices?.[0]?.message?.content || '';
  }
}

// Safely extract JSON object even if free OpenRouter models wrap it in markdown or <think> tags
function extractCleanJson(rawText = '') {
  const withoutThink = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const firstBrace = withoutThink.indexOf('{');
  const lastBrace = withoutThink.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(withoutThink.slice(firstBrace, lastBrace + 1));
  }
  return JSON.parse(withoutThink);
}

function rankRealOutliers(recentMedia = []) {
  if (!recentMedia.length) return { medianLikes: 0, ranked: [] };
  const likesList = recentMedia.map(m => m.likes || 0).sort((a, b) => a - b);
  const mid = Math.floor(likesList.length / 2);
  const medianLikes = likesList.length % 2 !== 0
    ? likesList[mid]
    : Math.max(1, Math.round((likesList[mid - 1] + likesList[mid]) / 2));

  const ranked = recentMedia.map((item) => {
    const metric = item.views > 0 ? item.views : item.likes;
    const multiple = Number((metric / Math.max(1, medianLikes)).toFixed(1));
    const hookText = item.hookLine || item.caption || 'Reel';
    return {
      ...item,
      multiple,
      multipleLabel: `${multiple}x`,
      isOutlier: multiple >= 2.5,
      hookAnalysis: scoreHook(hookText)
    };
  }).sort((a, b) => b.multiple - a.multiple);

  return { medianLikes, ranked };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      mode = 'scan',
      username,
      command,
      prompt,
      profileContext,
      provider = 'openrouter',
      modelId = 'meta-llama/llama-3.3-70b-instruct:free'
    } = body;

    // MODE A: Interactive /ig- Command Studio
    if (mode === 'command') {
      const systemPrompt = `You are the Instagram Agent Engine (from Jakeschincariol/instagram-agent-skill) running 13 specialized skills:
/ig-reel, /ig-viral, /ig-caption, /ig-carousel, /ig-story, /ig-profile, /ig-plan, /ig-human, /ig-comment, /ig-reply, /ig-dm, /ig-repurpose, /ig-audit.
Write strictly in the creator's exact language (Hinglish/Hindi/English mix), exact product/business universe, and natural voice. Never use generic templates or AI slop.
Creator Context & voice.md: ${JSON.stringify(profileContext || {})}`;

      const rawOutput = await callSelectedLLM(
        provider,
        modelId,
        systemPrompt,
        `Active Skill: ${command}\nUser Request: ${prompt}\nProvide a complete, creative, copy-ready response.`,
        false
      );
      const cleanText = rawOutput.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const humanized = humanizeAndDetect(cleanText);

      return NextResponse.json({
        usedModel: `${provider} / ${modelId}`,
        output: cleanText,
        cleanedOutput: humanized.cleaned,
        humanizer: humanized,
        hookScore: scoreHook(cleanText.split('\n')[0] || prompt),
        beatSheet: generateBeatSheet(cleanText.slice(0, 700), 25),
        captionLint: lintCaption(cleanText)
      });
    }

    // MODE B: Full Profile Scan + Auto voice.md + Dynamic Reel Ideas
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const profile = await getProfileData(username);
    const { medianLikes, ranked: scannedReels } = rankRealOutliers(profile.recentMedia || []);
    const reelsSummary = scannedReels
      .map((r, i) => `${i + 1}. "${r.caption || r.hookLine}" [Likes: ${r.likes}, Comments: ${r.comments}, Outlier: ${r.multipleLabel}]`)
      .join('\n');

    const systemPrompt = `You are the core engine of Jakeschincariol/instagram-agent-skill.
Analyze this real Instagram creator's bio and their actual recent Reels/Posts.
Build everything strictly around their REAL products, price points, language (Hinglish/Hindi/English), and outlier patterns (e.g. if they post about 5L Handwash ₹190, Dishwash ₹215, Phenyl ₹25 vs ₹40, pan-India shipping, and founder mindset, write scripts ONLY about those exact themes).

Return ONLY valid JSON (no markdown codeblocks, no extra commentary) with this exact structure:
{
  "voiceMd": {
    "whatTheyActuallyDo": "Accurate summary of their exact products/business and content",
    "toneAndCadence": "Their speaking style, Hinglish mix, punctuation habits (like || or ₹)",
    "winningPatterns": "Why their top outlier reel beat their median"
  },
  "reelIdeas": [
    {
      "id": 1,
      "title": "Catchy idea title",
      "formula": "#2 The Statistic",
      "inspiredBy": "Which of their real reels/products inspired this",
      "hook": "Exact spoken first 3-second hook in their natural Hinglish/Hindi style",
      "onScreenText": "Short 5-word text on screen",
      "visual": "Camera action for 0-3s, 3-15s, 15-25s",
      "script": "Full 5-6 line spoken script (1 line per beat, ending with a loop back to the hook)",
      "caption": "Ready caption with 125-char hook, CTA, and max 5 hashtags"
    }
  ],
  "carouselBlueprint": {
    "topic": "7-slide carousel topic for their exact audience",
    "slides": [
      { "slide": 1, "role": "Cover", "headline": "...", "sub": "..." }
    ]
  },
  "profileFixes": {
    "score": 86,
    "optimizedBio": "4-line high-converting bio for their exact business",
    "top3Fixes": ["Fix 1", "Fix 2", "Fix 3"]
  },
  "weeklyPlan": [
    { "day": "Monday", "format": "Reel", "topic": "...", "hookFormula": "..." }
  ]
}
Provide 6 creative reelIdeas, 7 carousel slides, and 7 days in weeklyPlan.`;

    const userPrompt = `Creator: @${profile.username} (${profile.fullName})
Bio: ${profile.bio || 'No bio'}
Followers: ${profile.followers} | Account Median Likes: ${medianLikes}
Actual Recent Reels:
${reelsSummary || 'Infer from Name and Bio'}
${prompt ? `User Extra Direction: ${prompt}` : ''}
Output valid JSON only.`;

    const rawResponse = await callSelectedLLM(provider, modelId, systemPrompt, userPrompt, true);
    const aiData = extractCleanJson(rawResponse);

    const enrichedIdeas = (aiData?.reelIdeas || []).map((idea, idx) => ({
      ...idea,
      id: idx + 1,
      hookMetrics: scoreHook(idea.hook || ''),
      beatSheet: generateBeatSheet(idea.script || '', 25)
    }));

    return NextResponse.json({
      usedModel: `${provider} / ${modelId}`,
      profile,
      medianLikes,
      scannedReels,
      aiData: { ...aiData, reelIdeas: enrichedIdeas }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
