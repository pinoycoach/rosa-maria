import React, { useEffect, useRef, useState } from 'react';
import { listMyInvites } from '../services/inspireApi';
import { toPng } from 'html-to-image';
import { saveImage } from '../services/saveImage';
import { UserGamification, UserBrandSettings } from '../types';
import { X, Download, Share2, Flame, Trophy, Sparkles, CheckCircle2, Check, Copy } from './icons/LucideIcons';
import { Twitter, Instagram, Threads, LinkedIn } from './icons/PlatformIcons';
import { soundFX } from '../services/audioToneService';

interface BraggingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: UserGamification;
  brandSettings: UserBrandSettings;
  onShareBonusClaimed?: () => void;
  /** Invite-only beta and this person is a member: shares can carry an invite. */
  inviteOnly?: boolean;
}

export const BraggingCardModal: React.FC<BraggingCardModalProps> = ({
  isOpen,
  onClose,
  gamification,
  brandSettings,
  onShareBonusClaimed,
  inviteOnly = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [handle, setHandle] = useState(brandSettings.brandHandle || '@sovereign.builder');
  const [name, setName] = useState(brandSettings.brandName || 'Reality Architect');
  const [quoteSelection, setQuoteSelection] = useState(
    'I move like someone who already belongs in the room.'
  );
  // Sharing doubles as an invitation: the link always, and (if the member ticks it) one unused invite code.
  const [includeInvite, setIncludeInvite] = useState(false);
  const [openCode, setOpenCode] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen || !inviteOnly) return;
    listMyInvites()
      .then((list) => setOpenCode(list.find((i) => !i.used)?.code || null))
      .catch(() => setOpenCode(null));
  }, [isOpen, inviteOnly]);
  const [theme, setTheme] = useState<'cosmic' | 'gold' | 'emerald' | 'cyber'>('cosmic');
  const [aspect, setAspect] = useState<'story' | 'square'>('story');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [bonusEarned, setBonusEarned] = useState(false);

  if (!isOpen) return null;

  const themes = {
    cosmic: {
      bg: 'bg-gradient-to-b from-indigo-950 via-purple-900 to-black',
      border: 'border-purple-500/40',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      accentText: 'text-purple-400',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.25)]',
    },
    gold: {
      bg: 'bg-gradient-to-b from-amber-950 via-yellow-950 to-black',
      border: 'border-amber-500/50',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      accentText: 'text-amber-400',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.25)]',
    },
    emerald: {
      bg: 'bg-gradient-to-b from-emerald-950 via-teal-950 to-black',
      border: 'border-emerald-500/50',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      accentText: 'text-emerald-400',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]',
    },
    cyber: {
      bg: 'bg-gradient-to-b from-rose-950 via-slate-950 to-black',
      border: 'border-rose-500/40',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      accentText: 'text-rose-400',
      glow: 'shadow-[0_0_50px_rgba(244,63,94,0.25)]',
    },
  };

  const currentTheme = themes[theme];

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      soundFX.playSparkSound();
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 0.98,
      });

      await saveImage(dataUrl, `bragging-rights-${handle.replace('@', '')}-${Date.now()}.png`);

      if (!bonusEarned && onShareBonusClaimed) {
        setBonusEarned(true);
        onShareBonusClaimed();
        soundFX.playLevelUp();
      }
    } catch (err) {
      console.error('Failed to export bragging card', err);
    } finally {
      setIsExporting(false);
    }
  };

  /** The caption for every share: streak, quote, how to join and (optionally) an invite code. */
  const buildShareText = (withLink: boolean) => {
    const parts = [`🔥 Day ${gamification.streakDays} manifestation streak on Inspire · ${gamification.rankTitle}`, `"${quoteSelection}"`];
    if (withLink) parts.push(inviteOnly ? `Inspire is invite-only right now. Join: ${window.location.origin}` : `Try it: ${window.location.origin}`);
    if (inviteOnly && includeInvite && openCode) parts.push(`Invite code: ${openCode}`);
    parts.push('#manifest #Inspire #DailyStreak');
    return parts.join('\n\n');
  };

  const handleNativeShare = async () => {
    soundFX.playAmbientChime();
    const shareText = buildShareText(!navigator.share);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Sovereign Bragging Rights',
          text: shareText,
          url: window.location.origin,
        });
        if (!bonusEarned && onShareBonusClaimed) {
          setBonusEarned(true);
          onShareBonusClaimed();
          soundFX.playLevelUp();
        }
      } catch (e) {
        console.warn('Share dismissed', e);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (!bonusEarned && onShareBonusClaimed) {
        setBonusEarned(true);
        onShareBonusClaimed();
        soundFX.playLevelUp();
      }
    }
  };

  const handleOpenTwitter = () => {
    const text = encodeURIComponent(buildShareText(true));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    if (!bonusEarned && onShareBonusClaimed) {
      setBonusEarned(true);
      onShareBonusClaimed();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-gray-900 border border-purple-500/30 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20 text-white">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Bragging Rights Flex Card
              <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                Viral Social Proof
              </span>
            </h2>
            <p className="text-sm text-gray-400">
              Generate an aesthetic, undeniable proof card of your streak and sovereign mindset to flex on Instagram Stories, TikTok, X, and LinkedIn.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Preview Column */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={cardRef}
              className={`w-full max-w-[360px] ${
                aspect === 'story' ? 'aspect-[9/16]' : 'aspect-square'
              } ${currentTheme.bg} border-2 ${currentTheme.border} ${currentTheme.glow} rounded-3xl p-6 flex flex-col justify-between text-white relative overflow-hidden select-none transition-all duration-300`}
            >
              {/* Card Ambient Background Grid */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Card Top Header */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest font-black text-gray-300">
                      INSPIRE ENGINE
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono tracking-wider">
                      PROOF OF MINDSET
                    </div>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${currentTheme.badgeBg} flex items-center gap-1`}>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  VERIFIED
                </div>
              </div>

              {/* Streak & Rank Hero Display */}
              <div className="relative z-10 my-auto text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
                    {gamification.streakDays} Day Unbroken Streak
                  </span>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-gray-400 mb-1">
                    MANIFESTATION RANK
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-amber-200">
                    {gamification.rankTitle}
                  </h3>
                </div>

                {/* Central Quote / Decree */}
                <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-left">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5 flex items-center justify-between">
                    <span>Active Decree</span>
                    <span className="text-amber-400 font-bold">100% Certainty</span>
                  </div>
                  <p className="text-sm font-medium italic text-gray-100 leading-snug">
                    "{quoteSelection}"
                  </p>
                </div>
              </div>

              {/* Card Footer / Sovereign Moniker & Barcode Stamp */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-end justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    {name}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    {handle}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[9px] text-gray-400 tracking-wider">
                    ID #ARC-{(Date.now() % 10000).toString().padStart(4, '0')}
                  </div>
                  <div className="text-[8px] text-gray-500 uppercase tracking-widest">
                    AI Studio Certified
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Dimension Toggle */}
            <div className="flex gap-2 mt-4 bg-gray-800 p-1 rounded-xl border border-gray-700">
              <button
                onClick={() => setAspect('story')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  aspect === 'story'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                9:16 Story / Reel (IG/TikTok)
              </button>
              <button
                onClick={() => setAspect('square')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  aspect === 'square'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                1:1 Square (Feed/X/LinkedIn)
              </button>
            </div>
          </div>

          {/* Controls & Social Sharing Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Customization Options */}
            <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                1. Customize Flex Data
              </h4>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Your Name / Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Social Handle</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Affirmation / Decree</label>
                <textarea
                  rows={2}
                  value={quoteSelection}
                  onChange={(e) => setQuoteSelection(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2">Visual Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cosmic', 'gold', 'emerald', 'cyber'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`py-2 px-3 text-xs capitalize rounded-xl font-bold border transition ${
                        theme === t
                          ? 'border-purple-400 bg-purple-600/30 text-white'
                          : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions & Export */}
            <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-gray-900 border border-purple-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-purple-300">
                  2. Export & Share Viral Flex
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  +50 Sparks on Share
                </span>
              </div>

              {/* Main Download Button */}
              <button
                onClick={handleDownloadCard}
                disabled={isExporting}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Generating Ultra-Res Card...' : 'Download Card Graphic (PNG)'}
              </button>

              {inviteOnly && (
                <label className="flex items-start gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={includeInvite}
                    disabled={!openCode}
                    onChange={(e) => setIncludeInvite(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    {openCode
                      ? <>Include one of my invites (<span className="font-mono text-amber-200">{openCode}</span>). Anyone who sees the post can use it.</>
                      : 'All your invites are used. The post still links to the waitlist.'}
                  </span>
                </label>
              )}

              {/* 1-Click Social Shares */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleNativeShare}
                  className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4 text-purple-400" />
                  {copiedLink ? 'Copied Flex Caption!' : '1-Click Share Sheet'}
                </button>

                <button
                  onClick={handleOpenTwitter}
                  className="py-2.5 px-3 bg-black hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Twitter className="w-4 h-4 text-blue-400" />
                  Post to X / Twitter
                </button>
              </div>

              {bonusEarned && (
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400" />
                  Bragging bonus claimed! +50 Sparks & +100 XP added to your balance.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
