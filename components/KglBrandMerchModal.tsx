import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { saveImage } from '../services/saveImage';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  Share2, 
  Gift, 
  CheckCircle2, 
  Layers,
  Crown,
  Zap
} from './icons/LucideIcons';
import { 
  KGL_PHONE_MODELS, 
  KGL_FINISHES, 
  KGL_DEFAULT_AFFIRMATIONS, 
  GENERATE_KGL_CLAUDE_MARKDOWN, 
  GENERATE_KGL_MCP_JSON 
} from '../data/kglBrandData';
import { soundFX } from '../services/audioToneService';

interface KglBrandMerchModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays?: number;
}

export const KglBrandMerchModal: React.FC<KglBrandMerchModalProps> = ({
  isOpen,
  onClose,
  streakDays = 4,
}) => {
  const [activeTab, setActiveTab] = useState<'case_designer' | 'claude_spec' | 'mcp_manifest'>('case_designer');
  
  // Customizer state
  const [selectedModelId, setSelectedModelId] = useState<string>('iphone-16-pro-max');
  const [selectedFinishId, setSelectedFinishId] = useState<string>('obsidian-stealth');
  const [customAffirmation, setCustomAffirmation] = useState<string>(
    'KEEP your sovereign peace.\nGIVE unconditional value.\nLIVE without hesitation.'
  );
  const [showMonogram, setShowMonogram] = useState<boolean>(true);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [orderPlacedMessage, setOrderPlacedMessage] = useState<string | null>(null);

  const phoneCaseRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const selectedModel = KGL_PHONE_MODELS.find((m) => m.id === selectedModelId) || KGL_PHONE_MODELS[0];
  const selectedFinish = KGL_FINISHES.find((f) => f.id === selectedFinishId) || KGL_FINISHES[0];

  const handleDownloadPng = async () => {
    if (!phoneCaseRef.current) return;
    setIsExportingPng(true);
    soundFX.playAmbientChime();

    try {
      const dataUrl = await toPng(phoneCaseRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        quality: 0.98,
      });
      await saveImage(dataUrl, `kgl-bespoke-case-${selectedModel.id}.png`);
    } catch (err) {
      console.error('Failed to export phone case mockup', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleDownloadMarkdown = () => {
    soundFX.playAmbientChime();
    const markdownContent = GENERATE_KGL_CLAUDE_MARKDOWN();
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'KGL_BRAND_DNA_CLAUDE_SPEC.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMcpJson = () => {
    soundFX.playAmbientChime();
    const jsonContent = GENERATE_KGL_MCP_JSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kgl_mcp_server_spec.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleOrderCase = () => {
    soundFX.playLevelUp();
    setOrderPlacedMessage('🎉 Custom KGL Case Spec generated! Ready for on-demand manufacturing.');
    setTimeout(() => setOrderPlacedMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-b from-gray-900 to-gray-950 border border-purple-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  KGL • Studio & Bespoke Merch
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase font-mono">
                  Keep • Give • Live
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Design custom phone cases, download Claude AI specifications, or manufacture on-demand
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-800 bg-gray-950/60 px-6 pt-2 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('case_designer')}
            className={`pb-3 px-3 font-semibold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'case_designer'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Phone Case 3D Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('claude_spec')}
            className={`pb-3 px-3 font-semibold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'claude_spec'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>KGL Claude AI Spec (.md)</span>
          </button>

          <button
            onClick={() => setActiveTab('mcp_manifest')}
            className={`pb-3 px-3 font-semibold text-xs transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'mcp_manifest'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>MCP Server Manifest (.json)</span>
          </button>
        </div>

        {/* Order success notification */}
        {orderPlacedMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-6 py-2.5 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {orderPlacedMessage}
            </span>
            <button onClick={() => setOrderPlacedMessage(null)} className="text-emerald-400 hover:text-white">×</button>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: PHONE CASE DESIGNER & LIVE RENDER */}
          {activeTab === 'case_designer' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: 3D Phone Case Mockup */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-2 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>300 DPI Sublimation Preview</span>
                </div>

                {/* The Phone Case Container for toPng capture */}
                <div 
                  ref={phoneCaseRef}
                  className="w-64 sm:w-72 relative rounded-[44px] p-3 shadow-2xl border-4 border-gray-700/80 bg-gray-900 transition-all duration-300"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Outer phone case bumper shell */}
                  <div className={`relative w-full rounded-[36px] overflow-hidden bg-gradient-to-br ${selectedFinish.bgGradient} p-5 flex flex-col justify-between min-h-[480px] border ${selectedFinish.accentBorder} shadow-inner`}>
                    
                    {/* Gloss / Light reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                    {/* Camera Island Island Cutout */}
                    <div className="relative z-10">
                      {selectedModel.cameraLayout === 'triple_triangle' && (
                        <div className="w-24 h-24 rounded-[26px] bg-black/80 border-2 border-gray-700/60 p-2.5 shadow-2xl relative">
                          <div className="w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-600/70 shadow-inner flex items-center justify-center absolute top-2 left-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-950/80 border border-blue-500/40" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-600/70 shadow-inner flex items-center justify-center absolute bottom-2 left-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-950/80 border border-blue-500/40" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-600/70 shadow-inner flex items-center justify-center absolute top-5 right-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-950/80 border border-blue-500/40" />
                          </div>
                          <div className="w-2 h-2 rounded-full bg-amber-400/90 absolute top-2.5 right-3.5 shadow-sm" />
                        </div>
                      )}

                      {selectedModel.cameraLayout === 'triple_vertical' && (
                        <div className="w-12 h-32 rounded-2xl bg-black/80 border-2 border-gray-700/60 p-2 shadow-2xl flex flex-col justify-between items-center">
                          <div className="w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-blue-900/60" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-blue-900/60" />
                          </div>
                          <div className="w-7 h-7 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-blue-900/60" />
                          </div>
                        </div>
                      )}

                      {selectedModel.cameraLayout === 'visor' && (
                        <div className="w-full h-14 rounded-2xl bg-black/90 border-2 border-gray-700/60 px-4 py-2 shadow-2xl flex items-center justify-between">
                          <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-900" />
                          </div>
                          <div className="w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-900" />
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        </div>
                      )}
                    </div>

                    {/* Center Artwork & KGL Mantra */}
                    <div className="my-auto text-center px-2 py-4 relative z-10 space-y-3">
                      {showMonogram && (
                        <div className="flex justify-center mb-2">
                          <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                            <span className="font-black text-sm tracking-tighter text-amber-400 font-mono">
                              KGL
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-white/50 block font-bold">
                          KEEP • GIVE • LIVE
                        </span>
                        <h4 className={`text-sm sm:text-base font-black uppercase tracking-tight whitespace-pre-line leading-snug drop-shadow-md ${selectedFinish.textColor}`}>
                          {customAffirmation}
                        </h4>
                      </div>

                      <div className="w-8 h-0.5 bg-amber-400/60 mx-auto rounded-full" />
                    </div>

                    {/* Bottom Sovereign Micro-Branding */}
                    <div className="relative z-10 pt-2 flex items-center justify-between border-t border-white/10 text-[9px] font-mono text-white/40">
                      <span>{selectedModel.brand.toUpperCase()} EDITION</span>
                      <span className="font-bold text-white/70">KGL.STUDIO</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions for mockup */}
                <div className="mt-4 flex items-center gap-2 w-full max-w-xs">
                  <button
                    onClick={handleDownloadPng}
                    disabled={isExportingPng}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-black" />
                    <span>{isExportingPng ? 'Rendering...' : 'Download PNG'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="py-2.5 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition"
                    title="Download complete spec for Claude"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Spec (.md)</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Customization & Manufacturing Controls */}
              <div className="md:col-span-7 space-y-5">
                
                {/* 1. Device Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    1. Select Device Model
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {KGL_PHONE_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModelId(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          selectedModelId === m.id
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <span className="block font-bold text-xs text-white leading-tight">{m.name}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{m.brand}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Finish & Texture Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    2. Select Case Finish
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {KGL_FINISHES.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFinishId(f.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                          selectedFinishId === f.id
                            ? 'bg-purple-900/30 border-purple-500 text-purple-200 ring-1 ring-purple-500/50'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div>
                          <span className="block font-bold text-xs text-white">{f.name}</span>
                          <span className="text-[10px] text-gray-400">{f.finishType}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-amber-400 border border-gray-700">
                          {f.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Affirmation / Decree */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      3. Affirmation or Personal Decree
                    </label>
                    <button
                      onClick={() => setShowMonogram(!showMonogram)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                        showMonogram ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}
                    >
                      {showMonogram ? 'KGL Monogram: ON' : 'KGL Monogram: OFF'}
                    </button>
                  </div>

                  {/* Preset quick pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {KGL_DEFAULT_AFFIRMATIONS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCustomAffirmation(preset.text)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-semibold border border-gray-700 transition"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={customAffirmation}
                    onChange={(e) => setCustomAffirmation(e.target.value)}
                    maxLength={120}
                    placeholder="Enter your personal sovereign decree..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Keep it punchy (3 lines max recommended)</span>
                    <span>{customAffirmation.length}/120 characters</span>
                  </div>
                </div>

                {/* 4. Manufacturing & Order Flow */}
                <div className="bg-gradient-to-r from-gray-950 via-purple-950/40 to-gray-950 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span>Bespoke On-Demand Manufacturing</span>
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        UV Sublimation • Shockproof Polycarbonate • 300 DPI
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-400">$29.00</span>
                      <span className="block text-[9px] text-emerald-400 font-bold">
                        {streakDays >= 30 ? 'FREE with 30d Streak!' : 'Free Ship Worldwide'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleOrderCase}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                    >
                      <Zap className="w-4 h-4 fill-black" />
                      <span>Order On-Demand Print</span>
                    </button>

                    <button
                      onClick={handleDownloadMarkdown}
                      className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs border border-gray-700 flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Send to Claude</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CLAUDE AI SPECIFICATION (.MD) */}
          {activeTab === 'claude_spec' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-950/40 border border-purple-500/30 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Downloadable File for Claude: KGL_BRAND_DNA_CLAUDE_SPEC.md</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Feed this complete markdown specification directly into Claude Desktop, Claude Projects, or Cursor. Claude will act as your dedicated KGL Bespoke Designer.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(GENERATE_KGL_CLAUDE_MARKDOWN(), 'md')}
                    className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition"
                  >
                    {copiedText === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'md' ? 'Copied!' : 'Copy Markdown'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md File</span>
                  </button>
                </div>
              </div>

              {/* Markdown Preview Area */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 sm:p-5 max-h-96 overflow-y-auto font-mono text-xs text-gray-300 leading-relaxed space-y-2 whitespace-pre-wrap select-all">
                {GENERATE_KGL_CLAUDE_MARKDOWN()}
              </div>
            </div>
          )}

          {/* TAB 3: MCP SERVER JSON MANIFEST */}
          {activeTab === 'mcp_manifest' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-950/40 border border-cyan-500/30 p-4 rounded-2xl">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Model Context Protocol (MCP) Manifest: kgl_mcp_server_spec.json</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Connect this MCP tool definition to Claude Desktop, Cursor, or your backend so AI agents can query KGL quotes and generate print manifests programmatically.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(GENERATE_KGL_MCP_JSON(), 'json')}
                    className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition"
                  >
                    {copiedText === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'json' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>

                  <button
                    onClick={handleDownloadMcpJson}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .json File</span>
                  </button>
                </div>
              </div>

              {/* JSON Code Area */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 sm:p-5 max-h-96 overflow-y-auto font-mono text-xs text-cyan-300 leading-relaxed whitespace-pre select-all">
                {GENERATE_KGL_MCP_JSON()}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-800 bg-gray-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-gray-400 text-[11px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>KGL Manufacturing Engine • 3-5 Business Days Delivery</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-600/50 text-purple-200 font-bold text-xs flex items-center gap-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Get Claude .md File</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
