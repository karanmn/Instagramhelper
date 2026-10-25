'use client';
import { useState } from 'react';
import {
  Sparkles, AlertTriangle, ShieldCheck, Instagram, ArrowRight,
  Copy, Film, Flame, FileText, Layers, Terminal, Send, RefreshCw, TrendingUp, Cpu
} from 'lucide-react';
import { scoreHook, generateBeatSheet, lintCaption, humanizeAndDetect } from '../lib/heuristics';

const SKILL_COMMANDS = [
  { cmd: '/ig-reel', label: '/ig-reel (3 Hooks + Script + Beat Sheet)', placeholder: 'e.g. 5L Handwash ₹190 wholesale reel script...' },
  { cmd: '/ig-viral', label: '/ig-viral (Outlier Spin-off Ideas)', placeholder: 'e.g. Analyze my top outlier reel and write Part 2...' },
  { cmd: '/ig-carousel', label: '/ig-carousel (8-Slide 1080x1350 Copy)', placeholder: 'e.g. Chote business ka maal poore India me kaise bhejein...' },
  { cmd: '/ig-caption', label: '/ig-caption (125-Char Hook + SEO Caption)', placeholder: 'e.g. Write wholesale catalog caption for Phenyl & Dishwash...' },
  { cmd: '/ig-dm', label: '/ig-dm (Keyword Auto-DM & Follow-ups)', placeholder: 'e.g. Rate card DM script for price inquiries...' }
];

export default function Home() {
  const [username, setUsername] = useState('');
  const [scanFocus, setScanFocus] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openrouter'); // Default to OpenRouter
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('ideas');
  const [copiedKey, setCopiedKey] = useState('');

  const [selectedCmd, setSelectedCmd] = useState(SKILL_COMMANDS[0]);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const handleScanProfile = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'scan',
          username: username.trim(),
          prompt: scanFocus.trim(),
          provider: selectedProvider
        })
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCommand = async (e) => {
    if (e) e.preventDefault();
    if (!chatPrompt.trim()) return;
    setChatLoading(true);
    setActiveTab('studio');

    try {
      const profileContext = data
        ? { username: data.profile?.username, bio: data.profile?.bio, voiceMd: data.aiData?.voiceMd }
        : { note: 'No profile scanned.' };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'command',
          command: selectedCmd.cmd,
          prompt: chatPrompt,
          profileContext,
          provider: selectedProvider
        })
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error);

      setChatHistory(prev => [{ id: Date.now(), command: selectedCmd.cmd, prompt: chatPrompt, ...result }, ...prev]);
      setChatPrompt('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & LLM Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-900/80 border border-gray-800 p-4 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-400 bg-clip-text text-transparent">
            Instagram AI Agent Studio
          </h1>
          <p className="text-xs text-gray-400">Multi-LLM Creator Engine (Claude via OpenRouter / Gemini)</p>
        </div>

        {/* LLM Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-gray-300">Active LLM:</span>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-xl text-xs font-bold text-pink-400 focus:outline-none"
          >
            <option value="openrouter">OpenRouter (Claude 3.5 Sonnet)</option>
            <option value="gemini">Google Gemini 2.5 Flash</option>
            <option value="groq">Groq (Llama 3.3)</option>
          </select>
        </div>
      </div>

      {/* Username Scanner Form */}
      <form onSubmit={handleScanProfile} className="bg-gray-900/60 border border-gray-800 p-3 rounded-2xl max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-gray-500 font-semibold">@</span>
            <input
              type="text"
              placeholder="instagram_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <input
            type="text"
            placeholder="Focus (e.g. Wholesale Phenyl & Handwash)"
            value={scanFocus}
            onChange={(e) => setScanFocus(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Scan with {selectedProvider.toUpperCase()} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="max-w-xl mx-auto p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-800">
        {[
          { id: 'ideas', label: '🔥 AI Reel Ideas', icon: Film },
          { id: 'studio', label: '💬 /ig- Command Studio', icon: Terminal },
          { id: 'swipe', label: '📊 Outlier Swipe File', icon: TrendingUp },
          { id: 'blueprint', label: '📑 Carousel & Plan', icon: Layers }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === t.id ? 'bg-pink-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          {!data ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Enter a username and click Scan to generate creative scripts using <strong className="text-pink-400">{selectedProvider.toUpperCase()}</strong>.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(data.aiData?.reelIdeas || []).map((idea) => (
                <div key={idea.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300">{idea.formula}</span>
                    <button onClick={() => copyText(idea.script, `idea-${idea.id}`)} className="text-xs text-gray-300 flex items-center gap-1">
                      <Copy className="w-3 h-3" /> {copiedKey === `idea-${idea.id}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white">{idea.title}</h4>
                  <div className="bg-purple-950/30 p-3 rounded-xl border border-purple-800/40 text-xs text-white font-medium">
                    &ldquo;{idea.hook}&rdquo;
                  </div>
                  <p className="text-xs text-gray-300 whitespace-pre-line">{idea.script}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'studio' && (
        <div className="space-y-4">
          <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {SKILL_COMMANDS.map(sc => (
                <button
                  key={sc.cmd}
                  onClick={() => setSelectedCmd(sc)}
                  className={`px-2.5 py-1 rounded text-xs font-mono ${selectedCmd.cmd === sc.cmd ? 'bg-pink-600 text-white' : 'bg-gray-950 text-gray-400 border border-gray-800'}`}
                >
                  {sc.cmd}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder={selectedCmd.placeholder}
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            />
            <button
              onClick={handleRunCommand}
              disabled={chatLoading}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              {chatLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Run Skill <Send className="w-3.5 h-3.5" /></>}
            </button>
          </div>

          <div className="space-y-3">
            {chatHistory.map(item => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300">{item.command}</span>
                <div className="text-gray-200 whitespace-pre-line">{item.cleanedOutput || item.output}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'swipe' && data?.scannedReels && (
        <div className="space-y-3">
          {data.scannedReels.map((r, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-orange-400">{r.multipleLabel} Outlier</span>
                <p className="text-white font-semibold mt-1">&ldquo;{r.caption || r.hookLine}&rdquo;</p>
              </div>
              <span className="text-gray-400">❤️ {r.likes} likes</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'blueprint' && data?.aiData?.carouselBlueprint && (
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-3 text-xs">
          <h3 className="font-bold text-white">{data.aiData.carouselBlueprint.topic}</h3>
          <div className="grid md:grid-cols-4 gap-2">
            {data.aiData.carouselBlueprint.slides.map((s, i) => (
              <div key={i} className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <span className="text-pink-400 font-mono">Slide {s.slide}</span>
                <p className="font-bold text-white mt-1">{s.headline}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
