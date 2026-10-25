'use client';
import { useState } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Instagram,
  ArrowRight, Copy, Wand2, Lightbulb, Film, Flame, FileText,
  Layers, Calendar, MessageSquare, Send, Repeat, BarChart3, Clock
} from 'lucide-react';
import { scoreHook, generateBeatSheet, lintCaption, humanizeAndDetect } from '../lib/heuristics';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [copiedKey, setCopiedKey] = useState('');

  // Interactive Sandbox States (work anytime, updated when profile loads)
  const [customHook, setCustomHook] = useState('I lost ₹45,000 because of one missing clause in my contract.');
  const [customScript, setCustomScript] = useState(
    'I lost ₹45,000 because of one missing clause in my contract.\nHere is the exact clause I now put in every single project.\nSection 4: Payment on delivery, not on approval.\nApproval is a feeling. Delivery is a date.\nThat one word change is worth ₹45,000 to me.'
  );
  const [customCaption, setCustomCaption] = useState(
    'I lost ₹45,000 because of one missing clause in a contract, and the worst part is that I had read the thing twice before I signed.\n\nComment "CLAUSE" and I will DM you the template.\n\n#freelance #contracts #businessindia'
  );
  const [customKeywords, setCustomKeywords] = useState('contract, template');
  const [customDraft, setCustomDraft] = useState(
    "In today's fast-paced world, stop scrolling! — It's not just a checklist, it's a seamless game changer that the algorithm loves. Follow for more!"
  );

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || `Server error (${res.status})`);
      setData(result);
      if (result.skills?.reelEngine?.defaultScript) {
        setCustomScript(result.skills.reelEngine.defaultScript);
        setCustomHook(result.skills.reelEngine.hooks?.[0]?.hook || customHook);
      }
      if (result.skills?.captionEngine?.sampleCaption) {
        setCustomCaption(result.skills.captionEngine.sampleCaption);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch analysis.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Live computed outputs for the 5 Python-ported tools
  const liveHookScore = scoreHook(customHook);
  const liveBeatSheet = generateBeatSheet(customScript, 30);
  const liveCaptionLint = lintCaption(customCaption, customKeywords);
  const liveHumanizer = humanizeAndDetect(customDraft);

  const tabs = [
    { id: 'profile', label: '1. /ig-profile (100-Pt Rubric)', icon: Wand2 },
    { id: 'reel', label: '2. /ig-reel + Hooks & Beats', icon: Film },
    { id: 'caption', label: '3. /ig-caption Linter', icon: FileText },
    { id: 'human', label: '4. /ig-human Detector', icon: ShieldCheck },
    { id: 'formats', label: '5. /ig-carousel, story & plan', icon: Layers },
    { id: 'viral', label: '6. /ig-viral, repurpose & audit', icon: Flame },
    { id: 'outreach', label: '7. /ig-dm, comment & reply', icon: MessageSquare }
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/60 border border-purple-500/30 rounded-full text-purple-300 text-xs mb-2">
          <Sparkles className="w-3.5 h-3.5" /> All 13 Claude Skills + 5 Heuristic Engines Active
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Instagram Agent Command Center
        </h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1">
          Enter any Instagram username to run all 13 skills, or use the live tools below
        </p>
      </div>

      {/* Username Search Bar */}
      <form onSubmit={handleAnalyze} className="flex gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-gray-500 font-semibold">@</span>
          <input
            type="text"
            placeholder="instagram_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-medium text-white hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {loading ? 'Running 13 Skills...' : <>Run All Skills <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {/* Error Message */}
      {errorMsg && (
        <div className="max-w-md mx-auto p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Header Banner (Shows when profile is fetched) */}
      {data && data.profile && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-gray-950 rounded-full flex items-center justify-center">
                <Instagram className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">{data.profile.fullName}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/40">
                  {data.niche}
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">@{data.profile.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase">Followers</p>
              <p className="font-bold text-sm">{(data.profile.followers || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase">Profile Score</p>
              <p className="font-bold text-sm text-pink-400">{data.skills?.profileAudit?.score || 78}/100</p>
            </div>
            <div className="bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase">Bio CTA</p>
              <p className={`font-bold text-sm ${data.skills?.profileAudit?.hasCta ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.skills?.profileAudit?.hasCta ? 'Active' : 'Missing'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs for All 13 Skills */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition ${
                active
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-900/70 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: /ig-profile — 12-PART RUBRIC SCORE & BIO REWRITER
      ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          {!data ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
              Enter any Instagram username above and tap <strong>Run All Skills</strong> to score their profile against the 12-part rubric.
            </div>
          ) : (
            <>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-400" /> /ig-profile — Fix-First Bio Rewrite
                  </h3>
                  <button
                    onClick={() => copyText(data.skills.profileAudit.optimizedBio, 'bio')}
                    className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3" /> {copiedKey === 'bio' ? 'Copied!' : 'Copy Rewrite'}
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800 text-xs text-gray-300">
                    <p className="text-[10px] font-mono uppercase text-gray-500 mb-1.5">Current Bio ({data.profile.bio?.length || 0} chars):</p>
                    <p className="whitespace-pre-line">{data.profile.bio || 'No bio set on profile.'}</p>
                  </div>
                  <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-700/40 text-xs text-purple-200">
                    <p className="text-[10px] font-mono uppercase text-purple-400 mb-1.5">100-Pt Rubric Rewrite (SEO Name + Outcome + Proof + 1 Ask):</p>
                    <p className="whitespace-pre-line font-medium">{data.skills.profileAudit.optimizedBio}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">12-Part Profile Rubric Breakdown</h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-pink-950 text-pink-300 border border-pink-800/40">
                    Total Score: {data.skills.profileAudit.score} / 100
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.skills.profileAudit.rubric.map((r) => (
                    <div key={r.id} className="bg-gray-950/70 border border-gray-800 p-3.5 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-200">{r.id}. {r.label}</span>
                        <span className={`font-mono font-bold ${r.score === r.max ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {r.score}/{r.max}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">Fix: {r.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: /ig-reel — 26 HOOK FORMULAS, HOOKSCORER & BEAT SHEET TIMER
      ===================================================================== */}
      {activeTab === 'reel' && (
        <div className="space-y-6">
          {/* Generated Profile Hooks */}
          {data?.skills?.reelEngine?.hooks && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-pink-400" /> 3 Scored Hooks Generated for @{data.profile.username}
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {data.skills.reelEngine.hooks.map((h, i) => (
                  <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                          {h.formula}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">{h.score} ({h.verdict})</span>
                      </div>
                      <p className="text-xs font-semibold text-white">"{h.hook}"</p>
                      <p className="text-[11px] text-gray-400 font-mono">On-Screen: [{h.onScreenText}]</p>
                    </div>
                    <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-[11px] text-gray-500">
                      <span>Weakest: {h.weakest}</span>
                      <button
                        onClick={() => setCustomHook(h.hook)}
                        className="text-pink-400 hover:underline"
                      >
                        Test in Scorer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Tool #1: hookscore.py */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-400" /> Interactive Hook Scorer (hookscore.py — 26 Formulas & 5-Check Panel)
              </h3>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                liveHookScore.verdict === 'STRONG' ? 'bg-emerald-950 text-emerald-300' : liveHookScore.verdict === 'OK' ? 'bg-amber-950 text-amber-300' : 'bg-red-950 text-red-300'
              }`}>
                {liveHookScore.score} / 100 · {liveHookScore.verdict}
              </span>
            </div>

            <input
              type="text"
              value={customHook}
              onChange={(e) => setCustomHook(e.target.value)}
              placeholder="Type or paste any Reel hook to score it..."
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-pink-500"
            />

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 font-mono text-xs space-y-2">
              <div className="flex flex-wrap justify-between gap-2 text-gray-300">
                <span>MATCHED FORMULA: <strong className="text-purple-400">{liveHookScore.formula}</strong></span>
                <span>WEAKEST: <strong className="text-amber-400">{liveHookScore.weakest}</strong></span>
              </div>
              {liveHookScore.dealbreaker && (
                <p className="text-red-400 bg-red-950/30 p-2 rounded border border-red-800/40">
                  DEALBREAKER: {liveHookScore.dealbreaker}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                <div className="bg-gray-900 p-2 rounded border border-gray-800">SPECIFICITY: <strong>{liveHookScore.breakdown.specificity}</strong></div>
                <div className="bg-gray-900 p-2 rounded border border-gray-800">STAKES: <strong>{liveHookScore.breakdown.stakes}</strong></div>
                <div className="bg-gray-900 p-2 rounded border border-gray-800">ADDRESS: <strong>{liveHookScore.breakdown.address}</strong></div>
                <div className="bg-gray-900 p-2 rounded border border-gray-800">FRONTLOAD: <strong>{liveHookScore.breakdown.frontload}</strong></div>
              </div>
            </div>
          </div>

          {/* Interactive Tool #2: beats.py Timed Beat Sheet */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Timed Beat Sheet Estimator (beats.py @ 165 WPM)
              </h3>
              <span className="text-xs font-mono text-gray-400">
                {liveBeatSheet.totalWords} words · ~{liveBeatSheet.totalSeconds}s / target {liveBeatSheet.targetSeconds}s
              </span>
            </div>

            <textarea
              rows={5}
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Enter one beat/sentence per line..."
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
            />

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 font-mono text-xs space-y-2 overflow-x-auto">
              <p className="text-gray-500 border-b border-gray-800 pb-1.5">
                BEAT SHEET · {liveBeatSheet.totalWords} words · ~{liveBeatSheet.totalSeconds}s at 165 wpm
              </p>
              {liveBeatSheet.beats.map((b) => (
                <div key={b.index} className="space-y-1 py-1 border-b border-gray-900">
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 shrink-0">{b.startTime}</span>
                    <span className="text-purple-400 shrink-0 w-10">{b.duration}</span>
                    <span className={`shrink-0 px-1.5 rounded text-[10px] ${
                      b.role === 'HOOK' ? 'bg-pink-950 text-pink-300' : b.role === 'CTA' ? 'bg-emerald-950 text-emerald-300' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {b.role}
                    </span>
                    <span className="text-gray-200">{b.line}</span>
                  </div>
                  {b.flag && <p className="text-amber-400 pl-24 text-[11px]">^ {b.flag}</p>}
                </div>
              ))}
              <div className="pt-2 space-y-1">
                {liveBeatSheet.warnings.map((w, i) => (
                  <p key={i} className="text-gray-400 text-[11px]">- {w}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: /ig-caption — 125-CHAR FEED BOX PREVIEW & CAPTION LINTER
      ===================================================================== */}
      {activeTab === 'caption' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" /> /ig-caption — 125-Char Truncation Window & Linter (caption.py)
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs text-gray-400 block">Draft Caption:</label>
              <textarea
                rows={6}
                value={customCaption}
                onChange={(e) => setCustomCaption(e.target.value)}
                className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <div>
                <label className="text-xs text-gray-400 block mb-1">Target SEO Search Keywords (comma-separated):</label>
                <input
                  type="text"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono"
                />
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Exact 125-Char Feed Box */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                <p className="text-gray-500 text-[11px] mb-2">WHAT THE FEED SHOWS (FIRST 125 CHARS BEFORE TAP):</p>
                <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200">
                  {liveCaptionLint.foldPreview}
                  <span className="text-gray-500"> ... more</span>
                </div>
              </div>

              {/* 6-Check Panel */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                {liveCaptionLint.checks.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      c.status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : c.status === 'FAIL' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-gray-400 w-32 shrink-0">{c.label}</span>
                    <span className="text-gray-200">{c.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: /ig-human — AI HUMANIZER & 5-CHECK DETECTOR PANEL
      ===================================================================== */}
      {activeTab === 'human' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> /ig-human — Invisible Watermark Stripper & 5-Check Detector (humanize.py + detect.py)
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              HUMAN SCORE: {liveHumanizer.panel.scoreBefore} → {liveHumanizer.panel.scoreAfter} PASS (+{liveHumanizer.panel.delta})
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Paste AI Draft (Before):</label>
              <textarea
                rows={5}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-emerald-400 font-medium">Cleaned Output (After humanize.py):</label>
                <button
                  onClick={() => copyText(liveHumanizer.cleaned, 'human')}
                  className="text-xs px-2.5 py-1 bg-gray-800 rounded text-gray-200 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {copiedKey === 'human' ? 'Copied!' : 'Copy Clean Text'}
                </button>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-100 font-mono min-h-[115px] whitespace-pre-line">
                {liveHumanizer.cleaned}
              </div>
            </div>
          </div>

          {/* 5-Check Detector Bars */}
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 font-mono text-xs space-y-2.5">
            <p className="text-gray-400 text-[11px]">5-CHECK DETECTOR DIAGNOSTICS:</p>
            {[
              { name: 'BURSTINESS', val: liveHumanizer.panel.burstiness, note: 'Sentence length variation' },
              { name: 'SPECIFICITY', val: liveHumanizer.panel.specificity, note: 'Concrete numbers & markers' },
              { name: 'SLOP DENSITY', val: liveHumanizer.panel.slopDensity, note: `${liveHumanizer.slopReplaced} stock AI terms stripped` },
              { name: 'FINGERPRINT', val: liveHumanizer.panel.fingerprint, note: `${liveHumanizer.invisibleRemoved} invisible chars, ${liveHumanizer.emDashesFixed} em-dashes fixed` },
              { name: 'VOICE', val: liveHumanizer.panel.voice, note: `${liveHumanizer.structuralFlags.length} structural tells flagged` }
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-3 md:col-span-2 text-gray-300">{item.name}</span>
                <div className="col-span-4 md:col-span-4 bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${item.val}%` }} />
                </div>
                <span className="col-span-1 text-right text-pink-400 font-bold">{item.val}</span>
                <span className="col-span-4 md:col-span-5 text-gray-500 text-[11px] truncate">{item.note}</span>
              </div>
            ))}

            {liveHumanizer.structuralFlags.length > 0 && (
              <div className="pt-2 border-t border-gray-800 space-y-1">
                <p className="text-amber-400 text-[11px]">STRUCTURAL TELLS FLAGGED FOR MANUAL REWRITE:</p>
                {liveHumanizer.structuralFlags.map((f, i) => (
                  <p key={i} className="text-amber-300/90 text-[11px]">• {f}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: /ig-carousel, /ig-story & /ig-plan
      ===================================================================== */}
      {activeTab === 'formats' && (
        <div className="space-y-6">
          {!data ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
              Enter an Instagram username above and tap <strong>Run All Skills</strong> to generate tailored Carousels, Story Sequences, and a 7-Day Content Plan.
            </div>
          ) : (
            <>
              {/* /ig-carousel */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-400" /> /ig-carousel — 8-Slide Swipe Blueprint (1080x1350)
                </h3>
                <div className="grid md:grid-cols-4 gap-3">
                  {data.skills.carouselEngine.map((s) => (
                    <div key={s.slide} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-mono text-pink-400 uppercase">Slide {s.slide} · {s.role}</span>
                      <p className="text-xs font-bold text-white">{s.headline}</p>
                      <p className="text-[11px] text-gray-400">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* /ig-story */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">/ig-story — 5-Frame Daily Story Sequence & DM Funnel</h3>
                <div className="grid md:grid-cols-5 gap-3">
                  {data.skills.storyEngine.map((st) => (
                    <div key={st.frame} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 rounded">
                        Frame {st.frame}
                      </span>
                      <p className="text-xs font-semibold text-gray-200">{st.type}</p>
                      <p className="text-[11px] text-pink-400 font-mono">Sticker: {st.sticker}</p>
                      <p className="text-[11px] text-gray-400">"{st.copy}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* /ig-plan */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" /> /ig-plan — 7-Day Content Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-2.5">
                  {data.skills.weeklyPlan.map((d, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 p-3 rounded-xl flex justify-between items-center gap-3 text-xs">
                      <div>
                        <span className="font-bold text-purple-400">{d.day}</span> · <span className="text-gray-300 font-medium">{d.format}</span>
                        <p className="text-gray-400 text-[11px] mt-0.5">{d.topic}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-1 bg-gray-900 border border-gray-800 rounded text-gray-400 shrink-0">
                        {d.goal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 6: /ig-viral, /ig-repurpose & /ig-audit
      ===================================================================== */}
      {activeTab === 'viral' && (
        <div className="space-y-6">
          {!data ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
              Enter an Instagram username above and tap <strong>Run All Skills</strong> to generate the Niche Outlier Swipe File, Repurpose Matrix, and Audit Diagnostics.
            </div>
          ) : (
            <>
              {/* /ig-viral */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" /> /ig-viral — Outlier Swipe File (Ranked by Multiple Over Account Median)
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    Baseline Median: ~{data.skills.viralSwipe.medianViews.toLocaleString()} views
                  </span>
                </div>
                <div className="space-y-2.5">
                  {data.skills.viralSwipe.swipeFile.map((item, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-orange-950 text-orange-300 border border-orange-800/40 rounded">
                            {item.outlierMultiple} Outlier
                          </span>
                          <span className="text-xs font-mono text-purple-400">{item.formula}</span>
                          <span className="text-xs text-gray-500">· Hook Score: {item.hookScore}</span>
                        </div>
                        <p className="text-xs font-semibold text-white">{item.hook}</p>
                        <p className="text-[11px] text-gray-400">{item.whyItWorked}</p>
                      </div>
                      <div className="text-right font-mono text-xs text-gray-400 shrink-0">
                        <p className="text-white font-bold">{item.views} views</p>
                        <p className="text-[10px]">vs {item.accountMedian} median</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* /ig-repurpose */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-emerald-400" /> /ig-repurpose — 1 Pillar Topic Into 5 Standalone Posts
                </h3>
                <div className="grid md:grid-cols-5 gap-3">
                  {data.skills.repurposeEngine.map((rep, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-1.5">
                      <p className="text-xs font-bold text-emerald-400">{rep.asset}</p>
                      <p className="text-xs text-gray-200">{rep.angle}</p>
                      <p className="text-[10px] font-mono text-gray-500">{rep.format}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* /ig-audit */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pink-400" /> /ig-audit — Post-Mortem & Sends-Per-Reach Diagnostics
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.skills.auditEngine.map((aud, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-pink-400">{aud.metric}</p>
                      <p className="text-xs text-gray-300">{aud.diagnosis}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 7: /ig-dm, /ig-comment & /ig-reply
      ===================================================================== */}
      {activeTab === 'outreach' && (
        <div className="space-y-6">
          {!data ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
              Enter an Instagram username above and tap <strong>Run All Skills</strong> to unlock the DM Funnel Scripts, Comment Frameworks, and 6-Bucket Reply Triage.
            </div>
          ) : (
            <>
              {/* /ig-dm */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-400" /> /ig-dm — Keyword Delivery, First Touch, Collab Pitch & 2 Follow-Ups (Max 2)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(data.skills.dmEngine).map(([key, val]) => (
                    <div key={key} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase text-purple-400">{key}</span>
                        <button
                          onClick={() => copyText(val, key)}
                          className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> {copiedKey === key ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-200">"{val}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* /ig-reply */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">/ig-reply — 6-Bucket Comment Thread Triage (Priority Order)</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.skills.replyEngine.map((rep, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-pink-400 font-bold">{rep.bucket}</span>
                      <p className="text-xs text-gray-400">Comment: {rep.sample}</p>
                      <p className="text-xs text-emerald-300 font-medium">Reply: {rep.reply}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* /ig-comment */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">/ig-comment — High-Visibility Outbound Comments (Never "🔥🔥🔥")</h3>
                <div className="space-y-2">
                  {data.skills.commentEngine.map((c, i) => (
                    <div key={i} className="bg-gray-950 border border-gray-800 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-purple-300 shrink-0">{c.type}:</span>
                      <span className="text-gray-300 flex-1">{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
