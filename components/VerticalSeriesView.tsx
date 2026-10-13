import React, { useState } from 'react';
import { ManifestSeries, SeriesEpisode, UserGamification, UserBrandSettings } from '../types';
import { MANIFEST_SERIES_LIST } from '../data/manifestSeriesData';
import { StreakProgressCalendar } from './StreakProgressCalendar';
import { WoopCard } from './WoopCard';
import { WoopWorksheet } from './WoopWorksheet';
import { 
  Play, 
  Lock, 
  Unlock, 
  Flame, 
  Trophy, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Share2, 
  DollarSign, 
  X, 
  Check 
} from './icons/LucideIcons';
import { soundFX } from '../services/audioToneService';
import type { GamificationAction } from '../services/inspireApi';

interface VerticalSeriesViewProps {
  gamification: UserGamification;
  brandSettings: UserBrandSettings;
  /** Runs a reward or unlock on the server; resolves true when it succeeded. */
  onAction: (action: GamificationAction) => Promise<boolean>;
  onOpenBraggingCard: () => void;
  onOpenAutoPost: () => void;
  onOpenPhoneCaseStudio?: () => void;
}

export const VerticalSeriesView: React.FC<VerticalSeriesViewProps> = ({
  gamification,
  brandSettings,
  onAction,
  onOpenBraggingCard,
  onOpenAutoPost,
  onOpenPhoneCaseStudio,
}) => {
  const [activeSeries, setActiveSeries] = useState<ManifestSeries | null>(null);
  // A printable worksheet for WOOP series (free, no unlock needed).
  const [worksheetSeries, setWorksheetSeries] = useState<ManifestSeries | null>(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [pendingEpisodeIndex, setPendingEpisodeIndex] = useState<number | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  const isSeriesUnlocked = (seriesId: string) => {
    return gamification.unlockedSeriesIds.includes(seriesId);
  };

  const handleStartSeries = (series: ManifestSeries, episodeIdx = 0) => {
    soundFX.playAmbientChime();
    setActiveSeries(series);
    setCurrentEpisodeIndex(episodeIdx);
    setShowPaywallModal(false);
  };

  const handleNextEpisode = () => {
    if (!activeSeries) return;

    const nextIdx = currentEpisodeIndex + 1;
    if (nextIdx >= activeSeries.episodes.length) {
      // Completed Series!
      handleCompleteSeries(activeSeries.id);
      return;
    }

    const nextEp = activeSeries.episodes[nextIdx];
    const isUnlocked = nextEp.isFree || isSeriesUnlocked(activeSeries.id);

    if (isUnlocked) {
      soundFX.playAmbientChime();
      setCurrentEpisodeIndex(nextIdx);
    } else {
      // Cliffhanger paywall hit!
      soundFX.playSparkSound();
      setPendingEpisodeIndex(nextIdx);
      setShowPaywallModal(true);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      soundFX.playAmbientChime();
      setCurrentEpisodeIndex(currentEpisodeIndex - 1);
    }
  };

  const handleUnlockWithSparks = async (cost: number) => {
    if (!activeSeries) return;
    if (gamification.sparksBalance < cost) {
      alert(`You need ${cost} Sparks. Current balance: ${gamification.sparksBalance} Sparks. Check in daily to earn more!`);
      return;
    }
    if (!(await onAction({ type: 'unlock-series', seriesId: activeSeries.id }))) return;
    soundFX.playLevelUp();

    setShowPaywallModal(false);
    if (pendingEpisodeIndex !== null) {
      setCurrentEpisodeIndex(pendingEpisodeIndex);
      setPendingEpisodeIndex(null);
    }
    setPurchaseSuccessMessage(`Unlocked "${activeSeries.title}" with ${cost} Sparks!`);
    setTimeout(() => setPurchaseSuccessMessage(null), 3500);
  };

  // Payments aren't set up while Inspire is free, so the one-time pass isn't sold yet.
  const handleUnlockWithMicroPay = (_priceUsd: number) => {
    setPurchaseSuccessMessage('Series passes are coming soon. For now, unlock with Sparks: check in daily to earn them!');
    setTimeout(() => setPurchaseSuccessMessage(null), 4000);
  };

  const handleCompleteSeries = async (seriesId: string) => {
    if (gamification.completedSeriesIds.includes(seriesId)) return;
    if (!(await onAction({ type: 'complete-series', seriesId }))) return;
    soundFX.playLevelUp();
    setPurchaseSuccessMessage('Series Mastered! Sovereign Completion Certificate unlocked.');
  };

  const handleDailyCheckIn = async () => {
    if (gamification.claimedDailyDecree) return;
    if (await onAction({ type: 'check-in' })) soundFX.playLevelUp();
  };

  const currentEpisode = activeSeries ? activeSeries.episodes[currentEpisodeIndex] : null;

  if (worksheetSeries) return <WoopWorksheet series={worksheetSeries} onBack={() => setWorksheetSeries(null)} />;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {purchaseSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          {purchaseSuccessMessage}
        </div>
      )}

      {/* Gamification Streak & Milestone Calendar Component */}
      <StreakProgressCalendar
        gamification={gamification}
        onAction={onAction}
        onOpenPhoneCaseStudio={onOpenPhoneCaseStudio}
        onOpenBraggingCard={onOpenBraggingCard}
      />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          The Vertical Drama Micro-Series Model
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Bite-Sized Manifestation & Mindset Arcs
        </h2>
        <p className="text-sm text-amber-200/90">
          Manifesting on Inspire = decide what you want, picture the steps, take one today. We don't promise outcomes — you build them.
        </p>
        <p className="text-sm text-gray-400">
          Capture high viral retention: Binge episodic cliffhanger decrees. Free to sample the first 2 episodes, micro-pay $1.99–$2.99 or spend daily streak Sparks to unlock the entire series. No dreaded subscriptions.
        </p>
      </div>

      {/* Vertical Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MANIFEST_SERIES_LIST.map((series) => {
          const unlocked = isSeriesUnlocked(series.id);
          const completed = gamification.completedSeriesIds.includes(series.id);

          return (
            <div
              key={series.id}
              className="bg-gray-800/80 border border-gray-700/80 hover:border-purple-500/50 rounded-3xl overflow-hidden shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between group"
            >
              {/* Cover Poster with 16:9 or 3:4 Aspect */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={series.coverImage}
                  alt={series.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    {series.categoryLabel}
                  </span>
                  {completed ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md border border-emerald-500/60 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Mastered
                    </span>
                  ) : unlocked ? (
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/30 backdrop-blur-md border border-purple-500/60 text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/30 backdrop-blur-md border border-amber-500/60 text-[10px] font-bold text-amber-200">
                      Ep 1 & 2 Free
                    </span>
                  )}
                </div>

                {/* Duration & Episodes count */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-gray-200 font-medium">
                  <span>{series.totalEpisodes} Vertical Episodes</span>
                  <span className="text-amber-400 font-bold">
                    {unlocked ? 'All-Access Pass' : `$${series.priceUsd.toFixed(2)} to Own`}
                  </span>
                </div>
              </div>

              {/* Series Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                    {series.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {series.hook}
                  </p>
                </div>

                {/* Completion Badge Preview */}
                <div className="p-3 bg-gray-900/70 border border-gray-700/60 rounded-2xl flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="text-[11px]">
                    <div className="font-bold text-gray-200">
                      Badge: {series.completionBadge.title}
                    </div>
                    <div className="text-gray-400 text-[10px]">
                      {series.completionBadge.description}
                    </div>
                  </div>
                </div>

                {/* Watch Now Button */}
                <button
                  onClick={() => handleStartSeries(series, 0)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition text-sm"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Binge Vertical Series
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 9:16 Vertical Reel Player Modal */}
      {activeSeries && currentEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-lg overflow-y-auto">
          <div className="relative w-full max-w-md aspect-[9/16] max-h-[94vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between bg-black text-white select-none">
            {/* Top Close & Series Info */}
            <div className="relative z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              {/* Story Progress Indicators */}
              <div className="flex gap-1 mb-3">
                {activeSeries.episodes.map((ep, idx) => (
                  <div
                    key={ep.id}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx < currentEpisodeIndex
                        ? 'bg-purple-400'
                        : idx === currentEpisodeIndex
                        ? 'bg-amber-400 shadow-sm shadow-amber-400'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                    <span>EPISODE {currentEpisode.episodeNumber} OF {activeSeries.totalEpisodes}</span>
                    {currentEpisode.isFree ? (
                      <span className="px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded text-[9px] font-bold">
                        FREE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-purple-500/30 text-purple-300 rounded text-[9px] font-bold">
                        PRO PASS
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate max-w-[240px]">
                    {activeSeries.title}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                {activeSeries.worksheetReviewedOn && activeSeries.episodes.some((e) => e.woop) && (
                  <button
                    onClick={() => {
                      setWorksheetSeries(activeSeries);
                      setActiveSeries(null);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 transition"
                    title="A one-page worksheet to fill in by hand"
                  >
                    🖨️ Worksheet
                  </button>
                )}
                <button
                  onClick={() => setActiveSeries(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
                </div>
              </div>
            </div>

            {/* Episode Center Stage / Vertical Drama Content */}
            <div className={`flex-1 p-6 flex flex-col justify-center items-center text-center bg-gradient-to-b ${currentEpisode.bgGradient} relative overflow-hidden`}>
              {/* Ambient visual aura */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

              <div className="relative z-10 space-y-4 max-w-xs">
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] uppercase font-bold tracking-widest text-amber-300 border border-white/20">
                  {currentEpisode.title}
                </span>

                <h3 className="text-2xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                  "{currentEpisode.decreeText}"
                </h3>

                <p className="text-xs text-purple-200/90 italic font-medium leading-relaxed">
                  {currentEpisode.tagline}
                </p>

                {/* Action of the Day */}
                <div className="mt-4 p-3.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 text-left text-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-1">
                    ⚡ Today's Manifest Step
                  </div>
                  <p className="text-gray-200 text-xs">
                    {currentEpisode.manifestAction}
                  </p>
                </div>
                {currentEpisode.woop && <WoopCard woop={currentEpisode.woop} />}

                {/* Cliffhanger Hook Banner */}
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-300 font-medium">
                  {currentEpisode.cliffhanger}
                </div>
              </div>
            </div>

            {/* Player Bottom Controls */}
            <div className="relative z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-3">
              <button
                onClick={handlePrevEpisode}
                disabled={currentEpisodeIndex === 0}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 disabled:opacity-30 transition"
              >
                Previous
              </button>

              <button
                onClick={onOpenBraggingCard}
                className="p-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-1"
                title="Bragging Rights Flex"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Flex
              </button>

              <button
                onClick={handleNextEpisode}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 transition"
              >
                <span>
                  {currentEpisodeIndex + 1 >= activeSeries.episodes.length
                    ? 'Complete Series 🎉'
                    : 'Next Episode'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Cliffhanger Micro-Payment Modal */}
      {showPaywallModal && activeSeries && pendingEpisodeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-gray-900 border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-gray-100 space-y-6">
            <button
              onClick={() => setShowPaywallModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Cliffhanger Badge */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  CLIFFHANGER REACHED • EPISODE {pendingEpisodeIndex + 1}
                </span>
                <h3 className="text-xl font-black text-white">
                  Unlock the Rest of {activeSeries.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-gray-300">
              You’ve enjoyed the free pilot episodes! Just like vertical reels, you can unlock this complete series immediately with zero recurring subscription trap.
            </p>

            {/* Pricing Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Whole Series Micro-Payment ($2.99) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-gray-800 border-2 border-purple-500/50 hover:border-purple-400 transition flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Binge All Episodes
                  </span>
                  <div className="text-2xl font-black text-white mt-2">
                    ${activeSeries.priceUsd.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    One-time payment • Lifetime Series Pass
                  </div>
                </div>

                <button
                  onClick={() => handleUnlockWithMicroPay(activeSeries.priceUsd)}
                  className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition"
                >
                  <DollarSign className="w-4 h-4" />
                  Unlock Series Pass
                </button>
              </div>

              {/* Option 2: Spend Streak Sparks */}
              <div className="p-4 rounded-2xl bg-gray-800/80 border border-gray-700 hover:border-amber-500/50 transition flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Gamified Streak Sparks
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-2 flex items-center gap-1">
                    <Zap className="w-6 h-6" />
                    {activeSeries.sparksCost} Sparks
                  </div>
                  <div className="text-xs text-gray-400">
                    Your balance: {gamification.sparksBalance} Sparks
                  </div>
                </div>

                <button
                  onClick={() => handleUnlockWithSparks(activeSeries.sparksCost)}
                  disabled={gamification.sparksBalance < activeSeries.sparksCost}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  {gamification.sparksBalance >= activeSeries.sparksCost
                    ? 'Unlock with Sparks'
                    : 'Insufficient Sparks'}
                </button>
              </div>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-xl text-center text-xs text-gray-400">
              No subscription charges. Instant impulse gratification. High margin, low support.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
