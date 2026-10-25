// 1. Invisible character & AI Triad Stripper
export function humanizeText(text = '') {
  let cleaned = text.replace(/[\u200B-\u200D\uFEFF\u00A0\u2060]/g, '');
  cleaned = cleaned.replace(/it's not just .+?,? it's .+/gi, '');
  cleaned = cleaned.replace(/in today's (fast-paced|world|digital age)/gi, '');
  return cleaned.trim();
}

// 2. Instagram Caption Linter
export function lintCaption(caption = '') {
  const issues = [];
  const lines = caption.split('\n');
  const firstLine = lines[0] || '';
  const hashtags = (caption.match(/#\w+/g) || []);

  if (firstLine.length > 125) {
    issues.push({
      type: 'warning',
      text: `Fold Truncation: 1st line is ${firstLine.length} chars (Limit is 125 chars before "...more").`
    });
  }
  if (hashtags.length > 5) {
    issues.push({
      type: 'alert',
      text: `Hashtag Wall: Found ${hashtags.length} hashtags. Instagram algorithm recommends 3-5 hyper-targeted tags.`
    });
  }
  if (/\b(follow for more|comment below|link in bio)\b/i.test(firstLine)) {
    issues.push({
      type: 'alert',
      text: 'Early Reflex Bait: CTA placed in the hook reduces retention.'
    });
  }

  return {
    charCount: caption.length,
    hashtagCount: hashtags.length,
    foldPreview: firstLine.slice(0, 125),
    issues
  };
}

// 3. 26 Hook Formulas Classifier & Scorer
export function scoreHook(hook = '') {
  let matchedFormula = 'Curiosity Gap / Statement';
  let score = 70;

  if (/\b(stop doing|don't do|never use)\b/i.test(hook)) {
    matchedFormula = 'The Negative Guardrail / Contrarian';
    score += 15;
  } else if (/\b(\d+%|\$\d+|\d+ days|\d+ steps)\b/i.test(hook)) {
    matchedFormula = 'The Specific Metric Proof';
    score += 20;
  } else if (/\b(how i|how [a-z]+ did)\b/i.test(hook)) {
    matchedFormula = 'Case Study / Specific Result';
    score += 15;
  }

  return {
    formula: matchedFormula,
    score: Math.min(score, 98),
    highStakes: score >= 85
  };
}
