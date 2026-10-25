import { NextResponse } from 'next/server';
import { getProfileData } from '../../../lib/instagram';
import { lintCaption, scoreHook, generateBeatSheet, humanizeAndDetect } from '../../../lib/heuristics';

// Universal Multi-LLM Router
async function callSelectedLLM(provider, systemPrompt, userPrompt, jsonMode = false) {
  let endpoint = '';
  let headers = { 'Content-Type': 'application/json' };
  let body = {};

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is missing in Vercel settings.");
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {}
    };
  } else if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is missing in Vercel settings.");
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    headers['Authorization'] = `Bearer ${key}`;
    body = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    };
  } else if (provider === 'mistral') {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) throw new Error("MISTRAL_API_KEY is missing in Vercel settings.");
    endpoint = 'https://api.mistral.ai/v1/chat/completions';
    headers['Authorization'] = `Bearer ${key}`;
    body = {
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    };
  } else {
    // Default fallback to Free Pollinations / OpenRouter
    endpoint = 'https://text.pollinations.ai/openai';
    body = {
      model: 'openai',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
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
    throw new Error(`${provider} API Error (${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();

  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    return data.choices?.[0]?.message?.content || '';
  }
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
    const { mode = 'scan', username, command, prompt, profileContext, provider = 'gemini' } = body;

    if (mode === 'command') {
      const systemPrompt = `You are the Instagram Agent Engine (Jakeschincariol/instagram-agent-skill) running 13 creator skills. Follow the creator's exact voice, products, and Hinglish tone. Creator Context: ${JSON.stringify(profileContext || {})}`;
      const rawOutput = await callSelectedLLM(provider, systemPrompt, `Skill: ${command}\nRequest: ${prompt}`, false);
      const humanized = humanizeAndDetect(rawOutput);

      return NextResponse.json({
        output: rawOutput,
        cleanedOutput: humanized.cleaned,
        humanizer: humanized,
        hookScore: scoreHook(rawOutput.slice(0, 60)),
        beatSheet: generateBeatSheet(rawOutput, 25),
        captionLint: lintCaption(rawOutput)
      });
    }

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const profile = await getProfileData(username);
    const { medianLikes, ranked: scannedReels } = rankRealOutliers(profile.recentMedia || []);
    const reelsSummary = scannedReels.map((r, i) => `${i + 1}. "${r.caption || r.hookLine}" [Likes: ${r.likes}, Outlier: ${r.multipleLabel}]`).join('\n');

    const systemPrompt = `Analyze this real Instagram creator and their recent reels. Return ONLY valid JSON matching this structure:
{
  "voiceMd": { "whatTheyActuallyDo": "...", "toneAndCadence": "...", "winningPatterns": "..." },
  "reelIdeas": [
    {
      "id": 1,
      "title": "...",
      "formula": "#2 The Statistic",
      "hook": "...",
      "onScreenText": "...",
      "visual": "...",
      "script": "...",
      "caption": "..."
    }
  ],
  "carouselBlueprint": { "topic": "...", "slides": [{ "slide": 1, "role": "Cover", "headline": "...", "sub": "..." }] },
  "profileFixes": { "score": 85, "optimizedBio": "...", "top3Fixes": ["..."] },
  "weeklyPlan": [{ "day": "Monday", "format": "Reel", "topic": "...", "hookFormula": "..." }]
}`;

    const userPrompt = `Creator: @${profile.username} (${profile.fullName})\nBio: ${profile.bio}\nMedian Likes: ${medianLikes}\nRecent Reels:\n${reelsSummary}\n${prompt ? `Focus: ${prompt}` : ''}`;

    let aiData = null;
    try {
      const rawJson = await callSelectedLLM(provider, systemPrompt, userPrompt, true);
      const clean = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      aiData = JSON.parse(clean);
    } catch (e) {
      console.error('LLM JSON parse error:', e.message);
    }

    const enrichedIdeas = (aiData?.reelIdeas || []).map((idea, idx) => ({
      ...idea,
      id: idx + 1,
      hookMetrics: scoreHook(idea.hook || ''),
      beatSheet: generateBeatSheet(idea.script || '', 25)
    }));

    return NextResponse.json({
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
