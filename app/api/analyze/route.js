import { NextResponse } from 'next/server';
import { getProfileData } from '../../../lib/instagram';
import { lintCaption, scoreHook, humanizeText } from '../../../lib/heuristics';

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const profile = await getProfileData(username);

    // Profile niche detect karna based on bio & name
    const bioText = (profile.bio || '').toLowerCase();
    const nameText = (profile.fullName || '').toLowerCase();
    let niche = "Business / Personal Brand";
    if (bioText.includes("clean") || nameText.includes("cleaning")) niche = "Cleaning & Home Services";
    else if (bioText.includes("fitness") || bioText.includes("coach")) niche = "Fitness & Coaching";
    else if (bioText.includes("tech") || bioText.includes("code")) niche = "Tech & Development";

    // 13 Skills Formula ke hisaab se 3 High-Retention Hooks generate karna
    const generatedHooks = [
      {
        formula: "Contrarian Flip",
        hook: `Stop offering basic discounts in ${niche}. Do this 1 pricing trick instead.`,
        score: 94,
        reason: "Disrupts standard scrolling behavior by challenging industry norms."
      },
      {
        formula: "The Negative Guardrail",
        hook: `Never scale your ${niche} workflow before fixing this 1 fatal leak.`,
        score: 88,
        reason: "Fear of loss creates instant curiosity and high save rates."
      },
      {
        formula: "The Metric Proof",
        hook: `How we booked 14 clients in 7 days without spending ₹1 on ads.`,
        score: 96,
        reason: "Concrete metrics (14 clients, 7 days) signal immediate credibility."
      }
    ];

    // Bio Optimization Engine
    const optimizedBio = [
      `⚡ Helping clients scale with premium ${niche} solutions`,
      `📍 Based in Jaipur | 100+ projects completed`,
      `👇 Tap below to book your free quote`
    ].join('\n');

    // Bio analysis
    const bioAudit = {
      charCount: profile.bio?.length || 0,
      hasCta: /link|dm|free|below|click|book|call|whatsapp/i.test(profile.bio || ''),
      hasLocation: /jaipur|delhi|mumbai|📍|india/i.test(profile.bio || ''),
      optimizedBio
    };

    // Existing Captions / Bio analyze
    const analyzedCaptions = (profile.sampleCaptions || []).map((caption) => {
      const cleaned = humanizeText(caption);
      const hook = caption.split('\n')[0] || '';
      return {
        original: caption,
        cleaned,
        hookScore: scoreHook(hook),
        lint: lintCaption(cleaned)
      };
    });

    return NextResponse.json({
      profile,
      niche,
      bioAudit,
      generatedHooks,
      analysis: analyzedCaptions
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Instagram profile' }, { status: 500 });
  }
}
