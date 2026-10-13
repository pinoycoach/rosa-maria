import React, { useState } from 'react';
import { UserBrandSettings } from '../types';
import { X, Sparkles, Check, DollarSign, ShieldCheck, Sliders, Layers } from './icons/LucideIcons';

interface MonetizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandSettings: UserBrandSettings;
  onSaveSettings: (settings: UserBrandSettings) => void;
}

export const MonetizeModal: React.FC<MonetizeModalProps> = ({
  isOpen,
  onClose,
  brandSettings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'pro_settings' | 'strategy_blueprint' | 'vertical_drama'>('vertical_drama');
  const [isPro, setIsPro] = useState(brandSettings.isPro);
  const [brandName, setBrandName] = useState(brandSettings.brandName || '');
  const [brandHandle, setBrandHandle] = useState(brandSettings.brandHandle || '');
  const [removeWatermark, setRemoveWatermark] = useState(brandSettings.removeWatermark);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      isPro,
      brandName,
      brandHandle,
      removeWatermark,
      aspectRatio: brandSettings.aspectRatio || 'feed',
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700/80 flex items-center justify-between bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Monetization & Creator Pro</span>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60">
                  Low Maintenance
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Turn your content engine into a profitable, low-effort revenue stream.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-700/60 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-700/80 bg-gray-900/60 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('vertical_drama')}
            className={`pb-3 px-4 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'vertical_drama'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Vertical Drama Model (No Subscription)</span>
          </button>
          <button
            onClick={() => setActiveTab('pro_settings')}
            className={`pb-3 px-4 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'pro_settings'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Brand Kit & Watermark Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('strategy_blueprint')}
            className={`pb-3 px-4 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'strategy_blueprint'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Classic Low-Effort SaaS Playbook</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'vertical_drama' && (
            <div className="space-y-6">
              {/* Hero Callout */}
              <div className="bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-gray-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    The ReelShort / DramaBox Playbook
                  </span>
                  <span className="text-xs text-gray-400">• High Retention & Micro-Unlocks</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Free to Sample • Pay $1.99–$2.99 to Unlock the Whole Series
                </h3>
                <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                  Vertical short dramas generate $100M+ by eliminating the #1 friction point in modern consumer apps: <span className="text-amber-300 font-bold">dreaded recurring subscriptions</span>. Instead of demanding $29/month upfront, you give Ep 1 & 2 100% free, create an intoxicating cliffhanger, and offer an impulse one-time micro-pass to own the whole series or spend daily streak sparks.
                </p>
              </div>

              {/* 3 Pillars of Vertical Drama Monetization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 space-y-3">
                  <div className="text-2xl">🎣</div>
                  <h4 className="text-base font-bold text-white">1. The Free Episodic Hook</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Episodes 1 & 2 are completely free. Users build emotional momentum and conviction before hitting the cliffhanger. Perfect top-of-funnel for TikTok & IG Reels clips.
                  </p>
                  <div className="text-[11px] text-amber-400 font-semibold font-mono">
                    Conversion: 8–14% on Episode 3 cliffhanger
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 space-y-3">
                  <div className="text-2xl">⚡</div>
                  <h4 className="text-base font-bold text-white">2. Dual Micro-Economy</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Users can unlock either by checking in daily (Gamified Streak Sparks) OR instantly paying $1.99–$2.99 for the complete series pass. Zero churn, 100% upfront margin.
                  </p>
                  <div className="text-[11px] text-emerald-400 font-semibold font-mono">
                    Stripe Fee: ~30¢ | Net Profit: 85–90%
                  </div>
                </div>

                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 space-y-3">
                  <div className="text-2xl">🏆</div>
                  <h4 className="text-base font-bold text-white">3. Bragging Rights Viral Loop</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Completing a series issues an undeniable Sovereign Mindset Flex Card. Users post their streak to Instagram Stories and X to flex on peers, creating free organic traffic.
                  </p>
                  <div className="text-[11px] text-purple-400 font-semibold font-mono">
                    Zero ad spend needed
                  </div>
                </div>
              </div>

              {/* Weekend Startup 48-Hour Launch Roadmap */}
              <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                    Weekend Startup: 48-Hour Ship & Release Protocol
                  </h4>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    Target: $1K First Weekend
                  </span>
                </div>

                <div className="space-y-3 text-xs text-gray-300">
                  <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700/60 flex items-start gap-3">
                    <span className="font-mono font-bold text-amber-400 text-sm">DAY 1</span>
                    <div>
                      <strong className="text-white block">Curate 3 High-Voltage Micro-Series Arcs</strong>
                      <span>Pick 3 painful consumer archetypes: "The 7-Day Reality Architect", "The Stoic Sovereign", "The Weekend Startup Playbook". Write 5–7 sharp cliffhanger decrees.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700/60 flex items-start gap-3">
                    <span className="font-mono font-bold text-amber-400 text-sm">DAY 2</span>
                    <div>
                      <strong className="text-white block">Post 3 Teasers to TikTok / Reels / X</strong>
                      <span>Export the free Episode 1 graphic & audio decree. Post with the cliffhanger hook: "Episode 2 drops at 6 PM, unlock the 7-day arc inside the bio link."</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700/60 flex items-start gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm">RELEASE</span>
                    <div>
                      <strong className="text-white block">Collect Direct Stripe Micro-Payments ($2.99 / Series Pass)</strong>
                      <span>Zero database overhead. No customer support calls. Zero churn risk because there are no recurring subscriptions to cancel. Pure digital leverage.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pro_settings' && (
            <div className="space-y-6">
              {/* Creator Pro Tier Toggle */}
              <div className="bg-gradient-to-r from-indigo-950/70 via-gray-900 to-indigo-950/70 border border-indigo-700/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-base">Creator Pro Mode</h3>
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Active Simulation
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    Enables custom white-label branding, watermark customization or complete removal on all generated post graphics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPro(!isPro)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md whitespace-nowrap ${
                    isPro
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isPro ? '✓ Pro Tier Enabled' : 'Enable Pro Free Preview'}
                </button>
              </div>

              {/* Watermark & Brand Customization Form */}
              <div className="bg-gray-900/70 border border-gray-700/80 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>White-Label Branding on Downloaded Screenshots</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Custom Watermark / Brand Name
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Daily Stoic, Mindset Hub, @yourbrand"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Replaces "Inspire Engine" in the corner of every downloaded screenshot.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Agency / Creator Handle (Optional)
                    </label>
                    <input
                      type="text"
                      value={brandHandle}
                      onChange={(e) => setBrandHandle(e.target.value)}
                      placeholder="e.g. @marcus_daily"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Used for default author handle on newly created posts.
                    </p>
                  </div>
                </div>

                {/* Complete Watermark Removal Toggle */}
                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Completely Remove Watermark</p>
                    <p className="text-xs text-gray-400">
                      Produce clean, 100% unbranded graphics for client work or personal accounts.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeWatermark}
                      onChange={(e) => setRemoveWatermark(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Live Watermark Preview */}
                <div className="mt-3 p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-gray-400">Export Graphic Watermark Preview:</span>
                  <span className="font-mono font-semibold px-2.5 py-1 rounded-lg bg-gray-800 text-indigo-300 border border-gray-700">
                    {removeWatermark
                      ? '[No Watermark - Clean Canvas]'
                      : brandName.trim() || 'Inspire Engine'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategy_blueprint' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-4 sm:p-5">
                <h4 className="font-bold text-emerald-300 text-base mb-1 flex items-center gap-2">
                  <span>💡 How to Monetize With Near-Zero Maintenance Effort</span>
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  The key to low-effort monetization is selling <strong>digital products</strong>, <strong>batch subscriptions</strong>, or <strong>creator memberships</strong> where code maintenance is minimal and fulfillment is automated.
                </p>
              </div>

              {/* 4 Monetization Vectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plan 1: Micro-SaaS Freemium */}
                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Model 1</span>
                      <span className="text-xs bg-indigo-900/60 border border-indigo-700 px-2.5 py-0.5 rounded-full text-indigo-300 font-semibold">$9–$19 / month</span>
                    </div>
                    <h5 className="font-bold text-white text-base mb-1">Creator Pro Micro-SaaS</h5>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Charge creators, coaches, and social managers a monthly fee to unlock:
                    </p>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                      <li>Watermark removal & custom brand logos</li>
                      <li>Unlimited 5-angle caption generation</li>
                      <li>One-click batch graphic export (Text + Photo)</li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-emerald-400 font-medium">
                    ⚡ Maintenance: Near Zero (connects directly to Stripe Payment Links / LemonSqueezy).
                  </div>
                </div>

                {/* Plan 2: Pre-Packaged Digital Asset Deck */}
                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Model 2</span>
                      <span className="text-xs bg-purple-900/60 border border-purple-700 px-2.5 py-0.5 rounded-full text-purple-300 font-semibold">$27–$47 One-Time</span>
                    </div>
                    <h5 className="font-bold text-white text-base mb-1">365-Day Quote & Post Vault Deck</h5>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Package the quotes database and pre-rendered aesthetics into a digital bundle on Gumroad:
                    </p>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                      <li>365 Stoic & Modernized Quotes with visual prompts</li>
                      <li>Ready-to-use carousel captions & hashtags</li>
                      <li>Canva / Notion template access</li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-emerald-400 font-medium">
                    ⚡ Maintenance: 0 hrs/month (pure digital product passive sales).
                  </div>
                </div>

                {/* Plan 3: Done-For-You Monthly Content Service */}
                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Model 3</span>
                      <span className="text-xs bg-emerald-900/60 border border-emerald-700 px-2.5 py-0.5 rounded-full text-emerald-300 font-semibold">$199–$499 / client / mo</span>
                    </div>
                    <h5 className="font-bold text-white text-base mb-1">Ghostwriter "Turnkey 30-Day Pack"</h5>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Offer founders, consultants, and busy executives 30 branded quotes + 5 caption angles delivered every month:
                    </p>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                      <li>Use this app to generate 30 posts in 15 minutes</li>
                      <li>Deliver formatted in a shared Google Drive or Notion</li>
                      <li>High perceived value with minimal operator effort</li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-emerald-400 font-medium">
                    ⚡ Maintenance: ~15 mins per client once a month.
                  </div>
                </div>

                {/* Plan 4: Newsletter + Affiliate Sponsorships */}
                <div className="bg-gray-900/80 border border-gray-700/80 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Model 4</span>
                      <span className="text-xs bg-blue-900/60 border border-blue-700 px-2.5 py-0.5 rounded-full text-blue-300 font-semibold">$50–$300 / ad</span>
                    </div>
                    <h5 className="font-bold text-white text-base mb-1">Daily Wisdom Newsletter & Books</h5>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Automated "Wisdom of the Day" email pairing modernized classical quotes with curated affiliate links:
                    </p>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                      <li>Amazon / Audible affiliate links for featured philosophy books</li>
                      <li>Beehiiv / Substack sponsored slots</li>
                      <li>Organic viral driver back into the app</li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-emerald-400 font-medium">
                    ⚡ Maintenance: Set up once on autoresponder schedule.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-700/80 bg-gray-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            Brand settings are immediately applied to all exported post screenshots and cards.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium text-xs transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Brand Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
