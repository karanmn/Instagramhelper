'use client';
import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Instagram, ArrowRight, Copy, Wand2, Lightbulb } from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedBio, setCopiedBio] = useState(false);
  const [customCaption, setCustomCaption] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setData(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || `Server error (${res.status})`);
      setData(result);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch analysis.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/60 border border-purple-500/30 rounded-full text-purple-300 text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" /> 13 Instagram Agent Skills Engine
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Instagram Creator Intelligence
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Profile Audit • 26 Hook Formulas • Bio Optimizer • Caption Linter
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleAnalyze} className="flex gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-gray-500 font-semibold">@</span>
          <input
            type="text"
            placeholder="instagram_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-medium text-white hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Analyzing...' : <>Audit <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {/* Error */}
      {errorMsg && (
        <div className="max-w-md mx-auto p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs">{errorMsg}</p>
        </div>
      )}

      {/* Loaded App Data */}
      {data && data.profile && (
        <div className="space-y-6 pt-2">
          {/* Top Profile Card */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-gray-950 rounded-full flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-pink-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold">{data.profile.fullName}</h2>
                <p className="text-gray-400 text-xs">@{data.profile.username} • <span className="text-purple-400 font-medium">{data.niche}</span></p>
              </div>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
                <p className="text-xs text-gray-500">Followers</p>
                <p className="font-bold text-sm">{(data.profile.followers || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
                <p className="text-xs text-gray-500">Call To Action</p>
                <p className={`font-bold text-sm ${data.bioAudit.hasCta ? 'text-green-400' : 'text-amber-400'}`}>
                  {data.bioAudit.hasCta ? 'Active' : 'Missing'}
                </p>
              </div>
            </div>
          </div>

          {/* Feature 1: Bio Optimization Engine */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" /> High-Converting Bio Recommendation
              </h3>
              <button
                onClick={() => copyToClipboard(data.bioAudit.optimizedBio)}
                className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center gap-1.5 transition"
              >
                <Copy className="w-3 h-3" /> {copiedBio ? 'Copied!' : 'Copy Bio'}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-950/70 p-3.5 rounded-xl border border-gray-800 text-xs text-gray-400">
                <p className="text-gray-500 mb-1 font-mono uppercase text-[10px]">Current Bio:</p>
                <p className="whitespace-pre-line">{data.profile.bio || 'No bio found'}</p>
              </div>
              <div className="bg-purple-950/20 p-3.5 rounded-xl border border-purple-800/40 text-xs text-purple-200">
                <p className="text-purple-400 mb-1 font-mono uppercase text-[10px]">Optimized Formula (Offer + Social Proof + CTA):</p>
                <p className="whitespace-pre-line font-medium">{data.bioAudit.optimizedBio}</p>
              </div>
            </div>
          </div>

          {/* Feature 2: 26 Hook Formulas Tailored to this Account */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-pink-400" /> 3 Viral Hook Formulas for @{data.profile.username}
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              {data.generatedHooks?.map((h, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800/40">
                        {h.formula}
                      </span>
                      <span className="text-xs font-bold text-pink-400">{h.score}/100</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-relaxed">"{h.hook}"</p>
                  </div>
                  <p className="text-[11px] text-gray-400 border-t border-gray-800/60 pt-2">{h.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 3: Live Caption Linter & AI Humanizer Sandbox */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Interactive Caption Linter & Invisible Char Stripper
            </h3>
            <p className="text-xs text-gray-400">
              Paste your upcoming Reel caption below to check the 125-char fold truncation and hashtag density:
            </p>
            <textarea
              rows={3}
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Paste any Reel caption or script here to lint..."
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
            />
            {customCaption && (
              <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 flex flex-wrap gap-4 text-xs">
                <span className="text-gray-400">Characters: <strong className="text-white">{customCaption.length}</strong></span>
                <span className="text-gray-400">First Line Fold: <strong className={customCaption.split('\n')[0].length > 125 ? 'text-amber-400' : 'text-emerald-400'}>{customCaption.split('\n')[0].length}/125</strong></span>
                <span className="text-gray-400">Hashtags: <strong className={(customCaption.match(/#\w+/g) || []).length > 5 ? 'text-amber-400' : 'text-emerald-400'}>{(customCaption.match(/#\w+/g) || []).length} / 5 max</strong></span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
