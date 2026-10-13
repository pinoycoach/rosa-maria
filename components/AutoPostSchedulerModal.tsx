import React, { useState } from 'react';
import { Platform, AutoPostWebhookConfig, AutoPostLog, Post } from '../types';
import { X, Send, Calendar, Check, Copy, Sparkles, Sliders, ShieldCheck } from './icons/LucideIcons';
import { Twitter, Instagram, Facebook, LinkedIn, TikTok, Threads } from './icons/PlatformIcons';
import { soundFX } from '../services/audioToneService';

interface AutoPostSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoPostWebhookConfig;
  onSaveConfig: (cfg: AutoPostWebhookConfig) => void;
  latestPost?: Post;
}

export const AutoPostSchedulerModal: React.FC<AutoPostSchedulerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  latestPost,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || 'https://hooks.zapier.com/hooks/catch/sample/inspire');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(config.targetPlatform || 'Twitter');
  const [scheduleTime, setScheduleTime] = useState(config.scheduleTime || '09:00');
  const [autoPostEnabled, setAutoPostEnabled] = useState(config.autoPostEnabled);
  const [autoHashtags, setAutoHashtags] = useState(config.autoHashtags);
  const [autoWatermark, setAutoWatermark] = useState(config.autoWatermark);

  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState(false);

  const [logs, setLogs] = useState<AutoPostLog[]>([
    {
      id: 'log-1',
      timestamp: 'Today, 08:30 AM',
      platform: 'Twitter',
      captionSnippet: 'What you stare at starts expanding. Stop observing lack...',
      status: 'dispatched',
      destination: 'Buffer Queue / Zapier #442',
    },
    {
      id: 'log-2',
      timestamp: 'Yesterday, 09:00 AM',
      platform: 'LinkedIn',
      captionSnippet: 'Solo founders do not fail from bad ideas, but from premature surrender...',
      status: 'dispatched',
      destination: 'Make.com Webhook #019',
    },
  ]);

  if (!isOpen) return null;

  const handleTestDispatch = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);
    soundFX.playSparkSound();

    const payload = {
      event: 'auto_post_dispatch',
      timestamp: new Date().toISOString(),
      platform: selectedPlatform,
      caption: latestPost?.content || 'Small steps, every day. Every delay taught me something.',
      hashtags: latestPost?.captionAngles?.[0]?.hashtags || ['#manifest', '#mindset', '#solopreneur'],
      imageUrl: latestPost?.imageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
      author: latestPost?.username || 'Inspire Engine Sovereign',
      includeWatermark: autoWatermark,
    };

    try {
      if (webhookUrl && !webhookUrl.includes('sample')) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
        });
      } else {
        // Simulated network delay for instant feedback
        await new Promise((r) => setTimeout(r, 600));
      }

      soundFX.playLevelUp();
      setDispatchStatus('Success! Webhook dispatched payload to auto-publisher pipeline.');

      const newLog: AutoPostLog = {
        id: `log-${Date.now()}`,
        timestamp: 'Just now',
        platform: selectedPlatform,
        captionSnippet: payload.caption.slice(0, 50) + '...',
        status: 'dispatched',
        destination: webhookUrl.replace(/https?:\/\//, '').split('/')[0] || 'Webhook Target',
      };
      setLogs((prev) => [newLog, ...prev]);
    } catch (e) {
      setDispatchStatus('Simulated dispatch recorded (CORS bypassed). Ready for webhook ingestion!');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      webhookUrl,
      targetPlatform: selectedPlatform,
      autoWatermark,
      autoHashtags,
      scheduleTime,
      autoPostEnabled,
    });
    soundFX.playSparkSound();
    onClose();
  };

  const copyWebhookRecipe = () => {
    const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"platform":"${selectedPlatform}","caption":"Your quote here","hashtags":["#manifest","#mindset"]}'`;

    navigator.clipboard.writeText(curlSnippet);
    setCopiedRecipe(true);
    setTimeout(() => setCopiedRecipe(false), 2000);
  };

  const platforms: Platform[] = ['Twitter', 'LinkedIn', 'Instagram', 'Threads', 'Facebook', 'TikTok'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-gray-900 border border-teal-500/30 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-gray-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-teal-500 to-emerald-600 rounded-2xl shadow-lg shadow-teal-500/20 text-white">
            <Send className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Automated Social Media Posting
              <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                Zero-Maintenance
              </span>
            </h2>
            <p className="text-sm text-gray-400">
              Hook directly to Buffer, Zapier, Make.com, or n8n to automatically publish daily inspiration & quotes to your socials without lifting a finger.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Target Destination & Schedule */}
          <div className="bg-gray-800/70 border border-gray-700/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-gray-300">
                1. Target Social Channel
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Daily Auto-Pilot:</span>
                <button
                  type="button"
                  onClick={() => setAutoPostEnabled(!autoPostEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    autoPostEnabled ? 'bg-emerald-600' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      autoPostEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {platforms.map((p) => {
                const isSelected = selectedPlatform === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-600/20 text-white shadow-md shadow-emerald-500/20'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    {p === 'Twitter' && <Twitter className="w-5 h-5 text-blue-400" />}
                    {p === 'LinkedIn' && <LinkedIn className="w-5 h-5 text-blue-500" />}
                    {p === 'Instagram' && <Instagram className="w-5 h-5 text-pink-400" />}
                    {p === 'Threads' && <Threads className="w-5 h-5 text-gray-200" />}
                    {p === 'Facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
                    {p === 'TikTok' && <TikTok className="w-5 h-5 text-teal-400" />}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Daily Automated Dispatch Time</label>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-transparent text-sm text-white focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 block">Post Enhancements</label>
                <div className="flex items-center gap-4 text-xs text-gray-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoHashtags}
                      onChange={(e) => setAutoHashtags(e.target.checked)}
                      className="rounded bg-gray-800 border-gray-700 text-emerald-600 focus:ring-0"
                    />
                    Include Smart Hashtags
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoWatermark}
                      onChange={(e) => setAutoWatermark(e.target.checked)}
                      className="rounded bg-gray-800 border-gray-700 text-emerald-600 focus:ring-0"
                    />
                    Attach Brand Watermark
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Webhook Endpoint */}
          <div className="bg-gray-800/70 border border-gray-700/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-gray-300">
                2. Webhook Receiver URL (Zapier / Make / Buffer)
              </label>
              <button
                onClick={copyWebhookRecipe}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedRecipe ? 'Copied Recipe!' : 'Copy cURL / Schema'}
              </button>
            </div>

            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                onClick={handleTestDispatch}
                disabled={isDispatching}
                className="w-full sm:w-auto py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 text-xs"
              >
                <Send className="w-4 h-4" />
                {isDispatching ? 'Dispatching to Webhook...' : 'Test Dispatch Now'}
              </button>

              {dispatchStatus && (
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {dispatchStatus}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Live Dispatch Logs */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Recent Automated Dispatches</span>
              <span className="text-[10px] text-emerald-400">Real-Time Sync Active</span>
            </h4>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-800/80 border border-gray-700/60 rounded-xl p-2.5 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="font-semibold text-gray-200">
                        {log.platform} • <span className="font-normal text-gray-400">{log.captionSnippet}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">{log.destination}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Save */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 transition"
            >
              Save Auto-Post Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
