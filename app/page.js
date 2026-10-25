'use client';
import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Instagram, ArrowRight } from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      alert('Error fetching analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/60 border border-purple-500/30 rounded-full text-purple-300 text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" /> 13 Instagram Agent Skills Engine
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Instagram Creator Intelligence
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Hook Formulas • Caption Linter • AI Humanizer • Viral Outlier Detection
        </p>
      </div>

      {/* Input Box */}
      <form onSubmit={handleAnalyze} className="flex gap-2 max-w-md mx-auto mb-8">
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
          {loading ? 'Auditing...' : <>Audit <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {/* Results Section */}
      {data && (
        <div className="space-y-6">
          {/* Profile Overview Card */}
          <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-gray-950 rounded-full flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-pink-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold">{data.profile.fullName}</h2>
                <p className="text-gray-400 text-xs">@{data.profile.username}</p>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div className="bg-gray-950/60 px-4 py-2 rounded-xl border border-gray-800/80">
                <p className="text-xs text-gray-500">Followers</p>
                <p className="font-bold text-sm">{data.profile.followers.toLocaleString()}</p>
              </div>
              <div className="bg-gray-950/60 px-4 py-2 rounded-xl border border-gray-800/80">
                <p className="text-xs text-gray-500">Bio CTA</p>
                <p className="font-bold text-sm text-green-400">{data.bioAudit.hasCta ? 'Present' : 'Missing'}</p>
              </div>
            </div>
          </div>

          {/* Reel Hooks & Linter Results */}
          <div className="grid md:grid-cols-2 gap-4">
            {data.analysis.map((item, idx) => (
              <div key={idx} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-purple-900/40 border border-purple-700/30 text-purple-300 rounded-lg">
                    Formula: {item.hookScore.formula}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">Hook Score: </span>
                    <span className="text-sm font-bold text-pink-400">{item.hookScore.score}/100</span>
                  </div>
                </div>

                <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-800 text-xs text-gray-300 font-mono">
                  "{item.lint.foldPreview}..."
                </div>

                {/* Lint Issues */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400">Linter Diagnostics:</p>
                  {item.lint.issues.length === 0 ? (
                    <p className="text-xs text-green-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reel & Caption follow all viral guidelines
                    </p>
                  ) : (
                    item.lint.issues.map((iss, i) => (
                      <p key={i} className="text-xs text-amber-400/90 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {iss.text}
                      </p>
                    ))
                  )}
                </div>

                {/* AI Humanizer Badge */}
                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-emerald-400/90">
                    <ShieldCheck className="w-3.5 h-3.5" /> AI Invisible Artifacts Stripped
                  </span>
                  <span>{item.lint.hashtagCount} tags</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
