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
      analysis: analyzedCaptions,
      bioAudit: {
        charCount: profile.bio?.length || 0,
        hasCta: /link|dm|free|below|click/i.test(profile.bio || ''),
        cleanBio: humanizeText(profile.bio || '')
      }
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Instagram profile' }, { status: 500 });
  }
}
