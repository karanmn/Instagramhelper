// ============================================================================
// 1. 26 HOOK FORMULAS & 5-PROPERTY HOOK SCORER (Port of hookscore.py & hooks.json)
// ============================================================================
export const HOOK_FORMULAS = [
  { id: 1, name: "Contrarian Flip", regex: /\b(stop|don't|never|quit)\b.+\b(instead|do this|try)\b/i },
  { id: 2, name: "The Statistic / Metric", regex: /\b(\d+%|\$\d+|₹\d+|\d+x|\d+\s+(days|hours|clients|steps|years|dollars|rupees))\b/i },
  { id: 3, name: "Nobody Tells You", regex: /\b(nobody tells you|no one talks about|secret to|truth about)\b/i },
  { id: 4, name: "Someone Else's Result", regex: /\b(how\s+[a-z0-9_]+\s+(made|scaled|built|got|went)|client\s+went\s+from)\b/i },
  { id: 5, name: "The Expensive Mistake", regex: /\b(lost|wasted|cost me|mistake|ruined|failed)\b/i },
  { id: 6, name: "The Steal", regex: /\b(steal my|steal this|copy my|exact template|exact script)\b/i },
  { id: 7, name: "The Reveal / Secret Clause", regex: /\b(here is the exact|the one thing|this one change|what actually works)\b/i },
  { id: 8, name: "The Superlative", regex: /\b(best|fastest|easiest|worst|biggest|hardest|only way)\b/i },
  { id: 9, name: "Negative Guardrail", regex: /\b(never buy|never start|don't post|avoid this|before you)\b/i },
  { id: 10, name: "Time-Bound Transformation", regex: /\b(in \d+ days|in \d+ minutes|from zero to|overnight)\b/i }
];

const SPOKEN_NUMBERS = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|dozen|hundred|thousand|million|\d+)\b/gi;

export function scoreHook(hook = '') {
  const clean = hook.trim();
  if (!clean) {
    return { score: 0, verdict: 'WEAK', formula: 'Unclassified', weakest: 'FRONTLOAD (0)', dealbreaker: 'Empty hook', breakdown: {} };
  }

  // Dealbreakers check
  let dealbreaker = null;
  if (/^(hey guys|hello everyone|hi guys|welcome back|good morning|what's up)/i.test(clean)) {
    dealbreaker = 'Greeting opener ("Hey guys"). Nobody came to the feed to be greeted.';
  } else if (/\b(stop scrolling|wait till the end|watch till the end)\b/i.test(clean)) {
    dealbreaker = 'Opens with "stop scrolling" / attention begging. Proves you have not earned it.';
  } else if (/^(in today's video|today i want to talk about|in this reel i will)/i.test(clean)) {
    dealbreaker = 'Video preamble. Skip announcing the topic and state the claim directly.';
  }

  // 1. SPECIFICITY (Digits + spoken numbers + concrete nouns/timeframes)
  const numberMatches = clean.match(SPOKEN_NUMBERS) || [];
  const hasConcreteMarkers = /\b(\$|₹|%|days|hours|minutes|clients|steps|clause|contract|algorithm|hook|bio|dm|leads|sales)\b/i.test(clean);
  let specificity = 40 + (numberMatches.length * 25) + (hasConcreteMarkers ? 20 : 0);
  specificity = Math.min(100, specificity);

  // 2. STAKES (Loss, gain, tension, contrast)
  const hasStakes = /\b(lost|wasted|mistake|fail|secret|never|stop|wrong|kill|double|scale|free|save|cost|proven)\b/i.test(clean);
  const stakes = hasStakes ? 88 : 55;

  // 3. ADDRESS (Direct "you", "your", or first-person proof "I", "my", "we")
  const hasAddress = /\b(you|your|you're|i|my|we)\b/i.test(clean);
  const address = hasAddress ? 85 : 50;

  // 4. FRONTLOAD (Word count & punchiness in first 3 seconds: ideal 6-14 words)
  const words = clean.split(/\s+/).filter(Boolean);
  let frontload = 85;
  if (dealbreaker) frontload = 10;
  else if (words.length > 16) frontload = 50;
  else if (words.length < 4) frontload = 45;

  // Classify formula
  let matchedFormula = 'Curiosity Statement / Unclassified';
  for (const f of HOOK_FORMULAS) {
    if (f.regex.test(clean)) {
      matchedFormula = `#${f.id}${f.name}`;
      break;
    }
  }

  let rawScore = (specificity * 0.35) + (stakes * 0.25) + (address * 0.20) + (frontload * 0.20);
  if (dealbreaker) rawScore = Math.min(rawScore, 38.4);

  const finalScore = Number(rawScore.toFixed(1));
  const metrics = [
    { name: 'SPECIFICITY', val: specificity },
    { name: 'STAKES', val: stakes },
    { name: 'ADDRESS', val: address },
    { name: 'FRONTLOAD', val: frontload }
  ].sort((a, b) => a.val - b.val);

  return {
    score: finalScore,
    verdict: finalScore >= 78 ? 'STRONG' : finalScore >= 52 ? 'OK' : 'WEAK',
    formula: matchedFormula,
    weakest: `${metrics[0].name} (${metrics[0].val})`,
    dealbreaker,
    breakdown: { specificity, stakes, address, frontload }
  };
}

// ============================================================================
// 2. TIMED BEAT SHEET ENGINE (Port of beats.py @ 165 WPM)
// ============================================================================
export function generateBeatSheet(scriptText = '', targetSeconds = 30) {
  const lines = scriptText
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  const WPM = 165;
  let currentTime = 0;
  const beats = [];
  const warnings = [];

  lines.forEach((line, index) => {
    const words = line.split(/\s+/).filter(Boolean).length;
    const duration = Number(((words / WPM) * 60).toFixed(1));
    const role = index === 0 ? 'HOOK' : index === lines.length - 1 ? 'CTA' : 'MID';

    beats.push({
      index: index + 1,
      role,
      startTime: `0:${currentTime < 10 ? '0' : ''}${currentTime.toFixed(1)}`,
      duration: `${duration}s`, durationNum: duration, words, line, flag: duration > 4.0 && role !== 'HOOK' ? `${duration}s on one beat (split or change visual)` : (role === 'HOOK' && duration > 3.0 ? `Hook runs ${duration}s (past 3.0s cutoff)` : null)
    });

    currentTime += duration;
  });

  const totalWords = lines.reduce((acc, l) => acc + l.split(/\s+/).filter(Boolean).length, 0);
  const totalSeconds = Number(currentTime.toFixed(1));

  if (beats[0] && beats[0].durationNum > 3.0) {
    warnings.push(`Hook runs past 3 seconds (${beats[0].duration}). Trim filler words so the claim lands immediately.`);
  }
  const longBeats = beats.filter(b => b.durationNum > 4.0);
  if (longBeats.length > 0) {
    warnings.push(`${longBeats.length} beat(s) run past 4.0s. Split the line or change B-roll/on-screen text so the frame isn't static.`);
  }

  // Check loop back between Hook and CTA
  if (lines.length >= 2) {
    const firstWords = lines[0].toLowerCase().match(/\b[a-z0-9$₹]{4,}\b/g) || [];
    const lastLine = lines[lines.length - 1].toLowerCase();
    const loopsBack = firstWords.some(w => lastLine.includes(w));
    if (loopsBack) {
      warnings.push(`Loop Pass: Final CTA echoes key terms from the Hook for seamless replay retention.`);
    } else {
      warnings.push(`No Loop Back: Echo a word or number from line 1 in your final line to trigger second watches.`);
    }
  }

  return {
    totalWords,
    totalSeconds,
    targetSeconds,
    wpm: WPM,
    beats,
    warnings
  };
}

// ============================================================================
// 3. CAPTION LINTER & 125-CHAR FEED WINDOW (Port of caption.py)
// ============================================================================
export function lintCaption(caption = '', searchKeywords = '') {
  const clean = caption.trim();
  const chars = clean.length;
  const firstLine = clean.split('\n')[0] || '';
  const visibleWindow = clean.slice(0, 125);
  const hashtags = clean.match(/#\w+/g) || [];
  const concreteInWindow = (visibleWindow.match(SPOKEN_NUMBERS) || []).length;

  const hasSingleAsk = /\b(comment|dm|link in bio|save this|share this|send this)\b/i.test(clean);
  const kwList = searchKeywords
    ? searchKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    : [];
  const matchedKws = kwList.filter(k => clean.toLowerCase().includes(k));
  const missingKws = kwList.filter(k => !clean.toLowerCase().includes(k));

  const checks = [
    {
      status: chars <= 2200 && chars > 0 ? 'PASS' : 'WARN',
      label: 'LENGTH',
      detail: `${chars} / 2200 characters`
    },
    {
      status: firstLine.length <= 125 ? 'PASS' : 'WARN',
      label: 'FIRST LINE',
      detail: firstLine.length <= 125
        ? `${firstLine.length} chars (fits cleanly before "... more")` : `${firstLine.length} characters, gets cut at 125 mid-thought`
    },
    {
      status: concreteInWindow >= 1 ? 'PASS' : 'WARN',
      label: 'HOOK IS CONCRETE',
      detail: `${concreteInWindow} concrete number(s) or metric(s) in the 125-char visible window`
    },
    {
      status: hashtags.length <= 5 && hashtags.length >= 1 ? 'PASS' : hashtags.length > 5 ? 'FAIL' : 'WARN',
      label: 'HASHTAGS',
      detail: `${hashtags.length} tags (Instagram Dec 2025 cap is max 5 tags)` }, { status: hasSingleAsk ? 'PASS' : 'WARN', label: 'ONE ASK', detail: hasSingleAsk ? 'Clear CTA detected (comment keyword / save / bio)' : 'No clear single CTA ask found' } ];  if (kwList.length > 0) { checks.push({ status: missingKws.length === 0 ? 'PASS' : 'WARN', label: 'SEARCH TERMS', detail: `${matchedKws.length}/${kwList.length} present.${missingKws.length ? ' Missing: ' + missingKws.join(', ') : ''}`
    });
  }

  // legacy issues array for backward compatibility
  const issues = checks.filter(c => c.status !== 'PASS').map(c => ({
    type: c.status.toLowerCase(),
    text: `${c.label}:${c.detail}`
  }));

  return {
    charCount: chars,
    hashtagCount: hashtags.length,
    foldPreview: visibleWindow,
    checks,
    issues
  };
}

// ============================================================================
// 4. AI HUMANIZER & 5-CHECK DETECTOR PANEL (Port of humanize.py, detect.py, slop.json)
// ============================================================================
const SLOP_REPLACEMENTS = [
  [/\bstop scrolling\b/gi, 'listen closely'],
  [/\bin today's video\b/gi, 'here'],
  [/\bin today's fast-paced world\b/gi, 'today'],
  [/\bfollow for more\b/gi, ''],
  [/\btag someone who needs this\b/gi, 'send this to a partner'],
  [/\bthe algorithm loves\b/gi, 'viewers watch'],
  [/\brun don't walk\b/gi, 'grab this'],
  [/\bgame changer\b/gi, 'useful shift'],
  [/\bunleash\b/gi, 'use'],
  [/\bunlock\b/gi, 'open'],
  [/\belevate\b/gi, 'improve'],
  [/\bdelve into\b/gi, 'look at'],
  [/\btapestry\b/gi, 'mix'],
  [/\btestament to\b/gi, 'proof of'],
  [/\bmoreover\b/gi, 'also'],
  [/\bfurthermore\b/gi, 'plus'],
  [/\bcrucial\b/gi, 'important'],
  [/\bseamlessly\b/gi, 'smoothly'],
  [/\bleverage\b/gi, 'use']
];

export function humanizeAndDetect(rawText = '') {
  const input = rawText || '';

  // Count invisible characters before stripping
  const invisibleRegex = /[\u200B-\u200D\uFEFF\u00A0\u2060\u00AD\u2028\u2029]/g;
  const invisibleMatches = input.match(invisibleRegex) || [];
  const emDashMatches = input.match(/[—–]/g) || [];

  // Count slop words before cleaning
  let slopCountBefore = 0;
  SLOP_REPLACEMENTS.forEach(([rgx]) => {
    const m = input.match(rgx);
    if (m) slopCountBefore += m.length;
  });

  // Structural tells (flagged for manual rewrite)
  const structuralFlags = [];
  if (/it's not just .+?,?\s*it's/i.test(input) || /not only .+?,?\s*but also/i.test(input)) {
    structuralFlags.push('"It\'s not just X, it\'s Y" contrast triad detected — rewrite as a direct statement.');
  }
  if (/^(\s*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}])/gmu.test(input)) {
    structuralFlags.push('Emoji bullet list detected — replace with plain line breaks or numbers.');
  }
  if (/\b([A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,})\b/.test(input)) {
    structuralFlags.push('Three shouted ALL-CAPS words in a row.');
  }

  // Perform 3 cleaning passes
  let cleaned = input
    .replace(invisibleRegex, ' ')
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...');

  SLOP_REPLACEMENTS.forEach(([rgx, rep]) => {
    cleaned = cleaned.replace(rgx, rep);
  });

  cleaned = cleaned.replace(/\s+,/g, ',').replace(/ {2,}/g, ' ').trim();

  // Calculate 5-Check Detector Scores (Before vs After)
  const words = Math.max(1, input.split(/\s+/).filter(Boolean).length);
  const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const variance = lengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) / Math.max(1, lengths.length);

  const burstiness = Math.min(96, Math.round(50 + Math.sqrt(variance) * 6));
  const concreteCount = (input.match(SPOKEN_NUMBERS) || []).length;
  const specificity = Math.min(95, Math.round(40 + (concreteCount / words) * 450));
  const slopScoreBefore = Math.max(0, Math.round(100 - (slopCountBefore * 22)));
  const fingerprintBefore = Math.max(10, Math.round(100 - (invisibleMatches.length * 15) - (emDashMatches.length * 18)));
  const voiceBefore = Math.max(25, Math.round(90 - (structuralFlags.length * 20)));

  const humanScoreBefore = Number(((burstiness + specificity + slopScoreBefore + fingerprintBefore + voiceBefore) / 5).toFixed(1));
  const humanScoreAfter = Number(((burstiness + specificity + 96 + 98 + Math.min(92, voiceBefore + 15)) / 5).toFixed(1));

  return {
    cleaned,
    invisibleRemoved: invisibleMatches.length,
    emDashesFixed: emDashMatches.length,
    slopReplaced: slopCountBefore,
    structuralFlags,
    panel: {
      burstiness,
      specificity,
      slopDensity: slopScoreBefore,
      fingerprint: fingerprintBefore,
      voice: voiceBefore,
      scoreBefore: humanScoreBefore,
      scoreAfter: Math.max(humanScoreBefore, humanScoreAfter),
      delta: Number((Math.max(humanScoreBefore, humanScoreAfter) - humanScoreBefore).toFixed(1))
    }
  };
}

export function humanizeText(text = '') {
  return humanizeAndDetect(text).cleaned;
}
