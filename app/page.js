'use client';
import { useState } from 'react';
import {
  Sparkles, AlertTriangle, ShieldCheck, Instagram, ArrowRight,
  Copy, Film, Flame, Layers, Terminal, Send, RefreshCw, TrendingUp, Cpu
} from 'lucide-react';
import { scoreHook, generateBeatSheet, lintCaption, humanizeAndDetect } from '../lib/heuristics';

// Pre-configured Models per Provider (Users can also type any Custom Model ID!)
const MODEL_OPTIONS = {
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', label: '⚡ Llama 3.3 70B Instruct (FREE)' },
    { id: 'google/gemini-2.0-flash-exp:free', label: '✨ Gemini 2.0 Flash (FREE via OpenRouter)' },
    { id: 'deepseek/deepseek-chat:free', label: '🧠 DeepSeek V3 Chat (FREE)' },
    { id: 'deepseek/deepseek-r1:free', label: '🔥 DeepSeek R1 Reasoning (FREE)' },
    { id: 'qwen/qwen-2.5-72b-instruct:free', label: '🚀 Qwen 2.5 72B Instruct (FREE)' },
    { id: 'anthropic/claude-3.5-sonnet', label: '👑 Claude 3.5 Sonnet (Requires OR Credits)' },
    { id: 'anthropic/claude-3.7-sonnet', label: '👑 Claude 3.7 Sonnet (Requires OR Credits)' },
    { id: 'openai/gpt-4o-mini', label: '🤖 OpenAI GPT-4o Mini (Low Cost)' },
    { id: 'openai/gpt-4o', label: '🤖 OpenAI GPT-4o (Requires OR Credits)' },
    { id: 'custom', label: '✏️ Type Custom OpenRouter Model ID...' }
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: '⚡ Gemini 2.5 Flash (Fast & Creative)' },
    { id: 'gemini-2.5-pro', label: '👑 Gemini 2.5 Pro (Deep Reasoning)' },
    { id: 'gemini-2.0-flash', label: '✨ Gemini 2.0 Flash' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: '⚡ Llama 3.3 70B Versatile' },
    { id: 'llama-3.1-8b-instant', label: '🚀 Llama 3.1 8B Instant' },
    { id: 'mixtral-8x7b-32768', label: '🔥 Mixtral 8x7B' }
  ],
  pollinations: [
    { id: 'openai', label: '🌐 Free Keyless OpenAI Model (No Key Needed)' }
  ]
};

const SKILL_COMMANDS = [
  { cmd: '/ig-reel', label: '/ig-reel (3 Hooks + Script + Beat Sheet)', placeholder: 'e.g. 5L Handwash ₹190 vs market ₹450 quality test reel...' },
  { cmd: '/ig-viral', label: '/ig-viral (Outlier Spin-off Ideas)', placeholder: 'e.g. Analyze why my 35k likes reel worked and give 3 spin-offs...' },
  { cmd: '/ig-carousel', label: '/ig-carousel (8-Slide 1080x1350 Copy)', placeholder: 'e.g. Chote business ka maal poore India me saste courier se kaise bhejein...' },
  { cmd: '/ig-repurpose', label: '/ig-repurpose (1 Idea -> 5 Posts)', placeholder: 'e.g. Turn my 25₹ vs 40₹ Floor Cleaner phenyl video into 5 posts...' },
  { cmd: '/ig-caption', label: '/ig-caption (125-Char Hook + SEO Caption)', placeholder: 'e.g. Write a wholesale catalog caption for 5L Dishwash ₹215...' },
  { cmd: '/ig-story', label: '/ig-story (5-Frame Daily Story Funnel)', placeholder: 'e.g. Factory dispatch behind-the-scenes + distributor inquiry poll...' },
  { cmd: '/ig-dm', label: '/ig-dm (Keyword Auto-DM & 2 Follow-ups)', placeholder: 'e.g. Wholesale rate list DM script when someone comments PRICE...' },
  { cmd: '/ig-audit', label: '/ig-audit (Post-Mortem & Growth Fix)', placeholder: 'e.g. Why are my product reels getting 150 likes while mindset reel got 35k?' },
  { cmd: '/ig-plan', label: '/ig-plan (7-Day Content Calendar)', placeholder: 'e.g. Balance 50% cleaning product demos and 50% founder business tips...' },
  { cmd: '/ig-human', label: '/ig-human (Rewrite Without AI Slop)', placeholder: 'Paste any draft to strip AI vocabulary & watermarks...' }
];

export default function Home() {
  const [username, setUsername] = useState('');
  const [scanFocus, setScanFocus] = useState('');

  // Multi-LLM Provider & Sub-Model Selector State
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModelId, setSelectedModelId] = useState(MODEL_OPTIONS.openrouter[0].id);
  const [customModelInput, setCustomModelInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('ideas');
  const [copiedKey, setCopiedKey] = useState('');

  // Interactive Command Studio State
  const [selectedCmd, setSelectedCmd] = useState(SKILL_COMMANDS[0]);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Heuristic Tools Sandbox State
  const [sandboxHook, setSandboxHook] = useState('5 LTR Handwash Rs 190 Me! Thick Wala!');
  const [sandboxScript, setSandboxScript] = useState(
    'Market me jo 5 liter handwash ₹450 ka milta hai, wo hum ₹190 me kaise de rahe hain?\nDekho sabse pehle iski thickness check karo—ek boond kafi hai.\nKyunki hum khud Jaipur me manufacture karte hain, beech me koi middleman nahi hai.\nComment me "RATE" likho, poori price list abhi DM karta hu.'
  );
  const [sandboxCaption, setSandboxCaption] = useState(
    '5 LTR Thick Handwash sirf ₹190 me! Direct factory price 🔥\n\nPoore India me home & wholesale delivery available hai.\n\nComment "RATE" for full catalog!\n\n#cleaningbusiness #jaipur #wholesaleindia #smallbusiness'
  );
  const [sandboxDraft, setSandboxDraft] = useState(
    "In today's fast-paced world, stop scrolling! — It's not just a floor cleaner, it's a seamless game changer for your business."
  );

  const handleProviderChange = (newProvider) => {
    setSelectedProvider(newProvider);
    const firstModel = MODEL_OPTIONS[newProvider]?.[0]?.id || '';
    setSelectedModelId(firstModel);
  };

  const activeModelId = selectedModelId === 'custom' ? customModelInput.trim() : selectedModelId;

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
          provider: selectedProvider,
          modelId: activeModelId
        })
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Failed to scan profile');
      setData(result);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCommand = async (e, customCmdObj = null, customPromptText = null) => {
    if (e) e.preventDefault();
    const cmdToUse = customCmdObj || selectedCmd;
    const promptToUse = customPromptText ?? chatPrompt;
    if (!promptToUse.trim()) return;

    setChatLoading(true);
    setErrorMsg('');
    setActiveTab('studio');

    try {
      const profileContext = data
        ? {
            username: data.profile?.username,
            fullName: data.profile?.fullName,
            bio: data.profile?.bio,
            voiceMd: data.aiData?.voiceMd,
            recentReels: (data.scannedReels || []).map(r => ({
              caption: r.caption,
              likes: r.likes,
              outlier: r.multipleLabel
            }))
          }
        : { note: 'No profile scanned yet.' };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'command',
          command: cmdToUse.cmd,
          prompt: promptToUse,
          profileContext,
          provider: selectedProvider,
          modelId: activeModelId
        })
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Skill execution failed');

      setChatHistory(prev => [
        {
          id: Date.now(),
          command: cmdToUse.cmd,
          prompt: promptToUse,
          ...result
        },
        ...prev
      ]);
      if (!customPromptText) setChatPrompt('');
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

  const liveHook = scoreHook(sandboxHook);
  const liveBeats = generateBeatSheet(sandboxScript, 25);
  const liveCaption = lintCaption(sandboxCaption, 'jaipur, wholesale');
  const liveHuman = humanizeAndDetect(sandboxDraft);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Bar: App Title + Multi-LLM & OpenRouter Sub-Model Selector */}
      <div className="bg-gray-900/90 border border-gray-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-purple-300 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> 13 Claude Skills + 5 Python Heuristics + Multi-Model Switcher
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Instagram AI Agent Command Center
            </h1>
          </div>

          {/* Provider + Specific Model Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl">
              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-[11px] text-gray-400">Provider:</span>
              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none"
              >
                <option value="openrouter" className="bg-gray-950">OpenRouter (Multi-Agent)</option>
                <option value="gemini" className="bg-gray-950">Google Gemini Direct</option>
                <option value="groq" className="bg-gray-950">Groq Cloud</option>
                <option value="pollinations" className="bg-gray-950">Free Keyless AI</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-950 border border-pink-500/40 px-3 py-1.5 rounded-xl">
              <span className="text-[11px] text-gray-400">Agent Model:</span>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-transparent text-xs font-bold text-pink-400 focus:outline-none max-w-[230px]"
              >
                {(MODEL_OPTIONS[selectedProvider] || []).map((m) => (
                  <option key={m.id} value={m.id} className="bg-gray-950 text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Custom Model ID Input (If user selects "Type Custom OpenRouter Model ID...") */}
        {selectedModelId === 'custom' && (
          <div className="pt-2 border-t border-gray-800 flex flex-col sm:flex-row items-center gap-2">
            <span className="text-xs text-purple-300 font-mono shrink-0">Custom Model ID:</span>
            <input
              type="text"
              placeholder="Paste any model ID from openrouter.ai/models (e.g. mistralai/mistral-nemo:free)"
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-950 border border-purple-500/50 rounded-xl text-xs text-white font-mono focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Username Scanner Form */}
      <form onSubmit={handleScanProfile} className="bg-gray-900/60 border border-gray-800 p-3 rounded-2xl max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-gray-500 font-semibold">@</span>
            <input
              type="text"
              placeholder="instagram_username (e.g. rohitsam.0)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <input
            type="text"
            placeholder="Optional Focus (e.g. 5L Handwash ₹190 & Phenyl wholesale)"
            value={scanFocus}
            onChange={(e) => setScanFocus(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Scanning with AI...
              </>
            ) : (
              <>
                Scan & Build voice.md <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {errorMsg && (
        <div className="max-w-2xl mx-auto p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Execution Error:</p>
            <p>{errorMsg}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Tip: Try switching the Agent Model dropdown at the top right to a <strong>(FREE)</strong> OpenRouter model or <strong>Free Keyless AI</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Scanned Profile + Auto-Built voice.md Banner */}
      {data && data.profile && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-gray-950 rounded-full flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-pink-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">{data.profile.fullName}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                    Generated via {data.usedModel}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">
                  @{data.profile.username} • {data.scannedReels?.length || 0} Real Reels Scanned • Median Likes: <strong>{data.medianLikes}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase">Followers</p>
                <p className="font-bold text-sm">{(data.profile.followers || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase">Top Outlier</p>
                <p className="font-bold text-sm text-orange-400">{data.scannedReels?.[0]?.multipleLabel || '1.0x'}</p>
              </div>
              <div className="bg-gray-950 px-3.5 py-2 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase">Profile Score</p>
                <p className="font-bold text-sm text-pink-400">{data.aiData?.profileFixes?.score || 85}/100</p>
              </div>
            </div>
          </div>

          {data.aiData?.voiceMd && (
            <div className="bg-gray-950/90 border border-purple-800/40 rounded-xl p-4 grid md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[10px] font-mono uppercase text-purple-400 mb-1">🧠 Auto-Built voice.md (Business):</p>
                <p className="text-gray-200 leading-relaxed">{data.aiData.voiceMd.whatTheyActuallyDo}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-pink-400 mb-1">🎙️ Voice & Hinglish Cadence:</p>
                <p className="text-gray-300 leading-relaxed">{data.aiData.voiceMd.toneAndCadence}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-emerald-400 mb-1">📈 Outlier Formula Detected:</p>
                <p className="text-gray-300 leading-relaxed">{data.aiData.voiceMd.winningPatterns}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-800">
        {[
          { id: 'ideas', label: '🔥 1. AI Reel Ideas (From Your Reels)', icon: Film },
          { id: 'studio', label: '💬 2. Interactive /ig- Command Studio', icon: Terminal },
          { id: 'swipe', label: '📊 3. Real Reels Outlier Swipe File', icon: TrendingUp },
          { id: 'blueprint', label: '📑 4. Carousel, Bio & 7-Day Plan', icon: Layers },
          { id: 'tools', label: '🛠️ 5. 5 Python Heuristics Sandbox', icon: ShieldCheck }
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
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

      {/* TAB 1: AI REEL IDEAS */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          {!data ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Upar apna Agent Model choose karein, username daalein aur <strong>Scan & Build voice.md</strong> dabayein.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(data.aiData?.reelIdeas || []).map((idea) => (
                <div key={idea.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-pink-950 text-pink-300">
                            {idea.formula}
                          </span>
                          {idea.hookMetrics && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                              Hook Score: {idea.hookMetrics.score}/100
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{idea.title}</h4>
                        {idea.inspiredBy && <p className="text-[11px] text-purple-400">Inspired by: {idea.inspiredBy}</p>}
                      </div>
                      <button
                        onClick={() => copyText(`HOOK:\n${idea.hook}\n\nVISUAL:\n${idea.visual}\n\nSCRIPT:\n${idea.script}\n\nCAPTION:\n${idea.caption}`, `idea-${idea.id}`)}
                        className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3 h-3" /> {copiedKey === `idea-${idea.id}` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="bg-purple-950/30 border border-purple-800/40 p-3 rounded-xl space-y-1">
                      <p className="text-[10px] font-mono uppercase text-purple-300">🎯 Spoken Hook (0-3s):</p>
                      <p className="text-xs font-bold text-white">&ldquo;{idea.hook}&rdquo;</p>
                      {idea.onScreenText && <p className="text-[11px] font-mono text-pink-300">📌 On-Screen: [{idea.onScreenText}]</p>}
                    </div>

                    {idea.visual && (
                      <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-xl text-xs text-gray-300">
                        <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">🎥 Camera Visual:</span>
                        {idea.visual}
                      </div>
                    )}

                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs text-gray-200 whitespace-pre-line leading-relaxed">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">🎙️ Full Script:</span>
                      {idea.script}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
                    <button
                      onClick={() => {
                        setSandboxHook(idea.hook || '');
                        setSandboxScript(idea.script || '');
                        setSandboxCaption(idea.caption || '');
                        setActiveTab('tools');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Check Beat Timing →
                    </button>
                    <button
                      onClick={() => handleRunCommand(null, SKILL_COMMANDS[0], `Expand this reel idea with 3 alternative hooks and a detailed shooting script: "${idea.title} - ${idea.hook}"`)}
                      className="text-pink-400 hover:underline font-semibold"
                    >
                      ✨ Expand in Studio →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE /ig- COMMAND STUDIO */}
      {activeTab === 'studio' && (
        <div className="space-y-6">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-pink-400" /> Interactive /ig- Skill Studio
              </h3>
              <span className="text-xs font-mono text-purple-300">
                Active Agent: {selectedProvider.toUpperCase()} / {activeModelId}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SKILL_COMMANDS.map((sc) => (
                <button
                  key={sc.cmd}
                  type="button"
                  onClick={() => setSelectedCmd(sc)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
                    selectedCmd.cmd === sc.cmd
                      ? 'bg-pink-600 text-white font-bold'
                      : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {sc.cmd}
                </button>
              ))}
            </div>

            <form onSubmit={handleRunCommand} className="space-y-3">
              <textarea
                rows={3}
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder={selectedCmd.placeholder}
                className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"
              >
                {chatLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Run {selectedCmd.cmd} <Send className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {chatHistory.map((item) => (
              <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300">{item.command}</span>
                    <span className="text-[11px] font-mono text-gray-400">{item.usedModel}</span>
                  </div>
                  <button
                    onClick={() => copyText(item.cleanedOutput || item.output, `chat-${item.id}`)}
                    className="text-xs px-2.5 py-1 bg-gray-800 rounded text-gray-200 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> {copiedKey === `chat-${item.id}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs text-gray-200 whitespace-pre-line font-mono leading-relaxed">
                  {item.cleanedOutput || item.output}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REAL REELS OUTLIER SWIPE FILE */}
      {activeTab === 'swipe' && (
        <div className="space-y-3">
          {!data?.scannedReels?.length ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
              Scan a profile first to rank their real Reels by Outlier Multiple.
            </div>
          ) : (
            data.scannedReels.map((r, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-950 text-orange-300">
                      {r.multipleLabel} {r.isOutlier ? '🔥 OUTLIER' : ''}
                    </span>
                    <span className="text-xs font-mono text-purple-400">{r.hookAnalysis?.formula}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">&ldquo;{r.caption || r.hookLine}&rdquo;</p>
                  <p className="text-xs text-gray-400 font-mono">❤️ {(r.likes || 0).toLocaleString()} likes • 💬 {r.comments || 0} comments</p>
                </div>
                <button
                  onClick={() =>
                    handleRunCommand(
                      null,
                      SKILL_COMMANDS[0],
                      `My reel "${r.caption || r.hookLine}" got ${r.likes} likes (${r.multipleLabel} my median). Write 3 Part-2 / Spin-off Reel scripts in my exact voice.`
                    )
                  }
                  className="px-3.5 py-2 bg-purple-950 hover:bg-purple-900 border border-purple-700/50 rounded-xl text-xs font-semibold text-purple-200 shrink-0"
                >
                  ✨ Spin-Off Part 2 Script →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: CAROUSEL, BIO & 7-DAY PLAN */}
      {activeTab === 'blueprint' && (
        <div className="space-y-6">
          {!data?.aiData ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-400 text-sm">
              Scan a profile first to generate custom Carousel Slides, Bio Rewrites, and 7-Day Plans.
            </div>
          ) : (
            <>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">/ig-profile — Optimized Bio Rewrite</h3>
                <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-xl text-xs text-purple-100 whitespace-pre-line">
                  {data.aiData.profileFixes?.optimizedBio}
                </div>
              </div>

              {data.aiData.carouselBlueprint && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white">/ig-carousel — {data.aiData.carouselBlueprint.topic}</h3>
                  <div className="grid md:grid-cols-4 gap-3">
                    {(data.aiData.carouselBlueprint.slides || []).map((s, idx) => (
                      <div key={idx} className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono text-pink-400">Slide {s.slide} • {s.role}</span>
                        <p className="text-xs font-bold text-white">{s.headline}</p>
                        <p className="text-[11px] text-gray-400">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 5: 5 PYTHON HEURISTICS SANDBOX */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">1. hookscore.py — Hook Scorer</h3>
              <span className="text-xs font-mono font-bold text-pink-400">
                {liveHook.score}/100 ({liveHook.verdict}) • {liveHook.formula}
              </span>
            </div>
            <input
              type="text"
              value={sandboxHook}
              onChange={(e) => setSandboxHook(e.target.value)}
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">2. beats.py — Timed Beat Sheet (@ 165 WPM)</h3>
              <span className="text-xs font-mono text-gray-400">{liveBeats.totalWords} words • ~{liveBeats.totalSeconds}s</span>
            </div>
            <textarea
              rows={4}
              value={sandboxScript}
              onChange={(e) => setSandboxScript(e.target.value)}
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono"
            />
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 font-mono text-xs space-y-1">
              {liveBeats.beats.map((b) => (
                <div key={b.index} className="flex gap-3">
                  <span className="text-gray-500">{b.startTime}</span>
                  <span className="text-purple-400 w-10">{b.duration}</span>
                  <span className="text-pink-400 w-12">{b.role}</span>
                  <span className="text-gray-200 flex-1">{b.line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">3. caption.py & humanize.py</h3>
            <textarea
              rows={3}
              value={sandboxDraft}
              onChange={(e) => setSandboxDraft(e.target.value)}
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono"
            />
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-200 font-mono">
              Cleaned (Human Score {liveHuman.panel.scoreAfter}/100): {liveHuman.cleaned}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
