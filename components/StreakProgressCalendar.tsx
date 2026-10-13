import React, { useState } from 'react';
import { UserGamification } from '../types';
import { STREAK_MILESTONES, StreakMilestone } from '../data/streakRewardsData';
import { 
  Flame, 
  Trophy, 
  Zap, 
  Gift, 
  Crown, 
  Star, 
  CheckCircle2, 
  Check, 
  Lock, 
  Calendar as CalendarIcon, 
  ChevronRight,
  ChevronLeft,
  Sparkles
} from './icons/LucideIcons';
import { soundFX } from '../services/audioToneService';
import type { GamificationAction } from '../services/inspireApi';

interface StreakProgressCalendarProps {
  gamification: UserGamification;
  onAction: (action: GamificationAction) => Promise<boolean>;
  onOpenPhoneCaseStudio?: () => void;
  onOpenBraggingCard?: () => void;
}

export const StreakProgressCalendar: React.FC<StreakProgressCalendarProps> = ({
  gamification,
  onAction,
  onOpenPhoneCaseStudio,
  onOpenBraggingCard,
}) => {
  const [calendarView, setCalendarView] = useState<'strip' | 'full'>('strip');
  const [selectedMilestone, setSelectedMilestone] = useState<StreakMilestone | null>(null);
  const [justClaimedMessage, setJustClaimedMessage] = useState<string | null>(null);

  const streak = gamification.streakDays;
  const claimedMilestones = gamification.claimedMilestoneDays || [];

  // Find next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.day > streak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const previousMilestone = [...STREAK_MILESTONES].reverse().find((m) => m.day <= streak) || { day: 0 };
  
  // Progress percentage to next milestone
  const rangeTotal = nextMilestone.day - previousMilestone.day;
  const rangeCurrent = Math.max(0, streak - previousMilestone.day);
  const progressPercent = rangeTotal > 0 ? Math.min(100, Math.round((rangeCurrent / rangeTotal) * 100)) : 100;

  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = gamification.claimedDailyDecree || gamification.lastCheckInDate === todayStr;

  const handleDailyCheckIn = async () => {
    if (isCheckedInToday) return;
    if (!(await onAction({ type: 'check-in' }))) return;
    soundFX.playLevelUp();
    setJustClaimedMessage('🔥 Daily Streak Extended! +25 Sparks & +50 XP granted.');
    setTimeout(() => setJustClaimedMessage(null), 4000);
  };

  const handleClaimMilestone = async (milestone: StreakMilestone) => {
    if (claimedMilestones.includes(milestone.day)) return;
    if (streak < milestone.day) return;
    if (!(await onAction({ type: 'claim-milestone', day: milestone.day }))) return;
    soundFX.playLevelUp();
    setJustClaimedMessage(`🎁 Unlocked ${milestone.title}! Reward claimed.`);
    setTimeout(() => setJustClaimedMessage(null), 4000);
  };

  // Generate 7-day rolling days (past 3 days, today, next 3 days)
  const today = new Date();
  const rollingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (3 - i));
    const dayIso = d.toISOString().split('T')[0];
    const isPast = i < 3;
    const isToday = i === 3;
    const isFuture = i > 3;
    const dayStreakIndex = streak - 3 + i;
    const isChecked = isPast 
      ? dayStreakIndex > 0 
      : isToday 
      ? isCheckedInToday 
      : false;

    return {
      date: d,
      iso: dayIso,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isPast,
      isToday,
      isFuture,
      isChecked,
    };
  });

  // Render milestone icon
  const renderIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'Flame': return <Flame className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Gift': return <Gift className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'Star': return <Star className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900/95 to-purple-950/40 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Alert */}
      {justClaimedMessage && (
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{justClaimedMessage}</span>
          </div>
          <button onClick={() => setJustClaimedMessage(null)} className="text-black/70 hover:text-black font-bold">×</button>
        </div>
      )}

      {/* Top Header: Streak Status & Daily Check-In Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-gray-900 rounded-[14px] flex items-center justify-center">
                <Flame className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[11px] font-black px-1.5 py-0.2 rounded-full shadow">
              {streak}d
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/90 font-bold">
                DAILY ENGAGEMENT STREAK
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                1.5x Sparks
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              {streak} {streak === 1 ? 'Day' : 'Days'} Manifested
            </h3>
            <p className="text-xs text-gray-400">
              {isCheckedInToday 
                ? 'Today is locked in! Streak active.' 
                : 'Check in today to protect your streak & claim daily Sparks.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDailyCheckIn}
            disabled={isCheckedInToday}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition shadow-xl ${
              isCheckedInToday
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/50 cursor-default'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/20 active:scale-95'
            }`}
          >
            {isCheckedInToday ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Today's Check-in Complete</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-black" />
                <span>Claim Today (+25 Sparks)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Milestone Progress Bar Component */}
      <div className="bg-gray-950/70 border border-gray-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">Next Milestone Reward:</span>
            <span className="font-black text-amber-400 flex items-center gap-1">
              {renderIcon(nextMilestone.iconName, 'w-3.5 h-3.5 text-amber-400')}
              {nextMilestone.title} ({nextMilestone.rewardValue})
            </span>
          </div>
          <span className="text-gray-400 font-mono text-[11px]">
            {nextMilestone.day - streak > 0 
              ? `${nextMilestone.day - streak} day${nextMilestone.day - streak > 1 ? 's' : ''} away (Day ${nextMilestone.day})` 
              : 'Milestone reached!'}
          </span>
        </div>

        {/* Progress bar container */}
        <div className="relative pt-1 pb-1">
          <div className="w-full bg-gray-800/80 rounded-full h-3 overflow-hidden border border-gray-700">
            <div 
              className="bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-700 shadow-lg shadow-purple-500/20"
              style={{ width: `${Math.min(100, Math.max(5, (streak / nextMilestone.day) * 100))}%` }}
            />
          </div>

          {/* Milestone markers along the bar */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-2 px-1">
            {STREAK_MILESTONES.slice(0, 5).map((m) => {
              const reached = streak >= m.day;
              return (
                <div 
                  key={m.day} 
                  onClick={() => setSelectedMilestone(m)}
                  className={`flex flex-col items-center cursor-pointer transition ${
                    reached ? 'text-amber-400 font-bold' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mb-1 ${reached ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-gray-700'}`} />
                  <span>{m.day}d</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Calendar Component: 7-Day Strip or Full 30-Day Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Daily Streak Calendar</h4>
          </div>

          {/* Toggle View mode */}
          <div className="flex bg-gray-800/80 rounded-xl p-0.5 border border-gray-700/80 text-xs">
            <button
              onClick={() => setCalendarView('strip')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                calendarView === 'strip' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              7-Day Strip
            </button>
            <button
              onClick={() => setCalendarView('full')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                calendarView === 'full' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              30-Day Grid
            </button>
          </div>
        </div>

        {/* 7-Day Strip View */}
        {calendarView === 'strip' && (
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {rollingDays.map((item, idx) => {
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center p-2.5 sm:p-3 rounded-2xl border transition-all text-center relative ${
                    item.isToday
                      ? item.isChecked
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                      : item.isChecked
                      ? 'bg-gray-800/60 border-purple-500/30'
                      : 'bg-gray-900/60 border-gray-800/70 text-gray-500'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {item.dayName}
                  </span>
                  
                  {/* Status Indicator Icon */}
                  <div className="my-1">
                    {item.isChecked ? (
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                        <Flame className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                      </div>
                    ) : item.isToday ? (
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center animate-pulse">
                        <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-gray-800 text-gray-500 border border-gray-700 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <span className={`text-xs font-mono font-bold mt-1 ${item.isToday ? 'text-amber-300' : 'text-gray-300'}`}>
                    {item.dayNumber}
                  </span>
                  
                  {item.isToday && (
                    <span className="text-[9px] font-bold text-amber-400 mt-0.5 uppercase tracking-tighter">
                      Today
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 30-Day Grid View */}
        {calendarView === 'full' && (
          <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-3 sm:p-4">
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              {Array.from({ length: 30 }, (_, i) => {
                const dayNum = i + 1;
                const isPassed = streak >= dayNum;
                const isCurrent = streak === dayNum - 1 && !isCheckedInToday;
                const milestone = STREAK_MILESTONES.find((m) => m.day === dayNum);

                return (
                  <div
                    key={dayNum}
                    onClick={() => milestone && setSelectedMilestone(milestone)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isPassed
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : isCurrent
                        ? 'bg-purple-900/40 border-purple-400 text-purple-200 ring-1 ring-purple-400 animate-pulse'
                        : 'bg-gray-900/60 border-gray-800 text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {milestone && (
                      <span className="text-[9px] mt-0.5 text-amber-400" title={milestone.title}>
                        {renderIcon(milestone.iconName, 'w-3 h-3')}
                      </span>
                    )}
                    {isPassed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-800/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Completed Streak Days
              </span>
              <span className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-amber-400" /> Milestone Reward Days
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Rewards Showcase & Claim Deck */}
      <div className="space-y-3 pt-2 border-t border-gray-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-400" />
            <h4 className="text-sm font-bold text-white">Streak Milestone Road & Rewards</h4>
          </div>
          <span className="text-xs text-gray-400">
            {claimedMilestones.length} of {STREAK_MILESTONES.length} Claimed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STREAK_MILESTONES.map((milestone) => {
            const isUnlocked = streak >= milestone.day;
            const isClaimed = claimedMilestones.includes(milestone.day);

            return (
              <div
                key={milestone.day}
                className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                  isClaimed
                    ? 'bg-gray-900/60 border-gray-800 text-gray-400 opacity-80'
                    : isUnlocked
                    ? 'bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-gray-900 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-gray-950/60 border-gray-800/90 text-gray-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gray-800 text-amber-400 border border-gray-700">
                      DAY {milestone.day}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      milestone.rarity === 'Legendary'
                        ? 'bg-amber-500 text-black'
                        : milestone.rarity === 'Epic'
                        ? 'bg-purple-600 text-white'
                        : milestone.rarity === 'Rare'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {milestone.rarity}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {renderIcon(milestone.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-white leading-tight">{milestone.title}</h5>
                      <p className="text-[11px] text-gray-300 font-semibold mt-0.5">{milestone.shortDesc}</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{milestone.unlockedDetails}</p>
                    </div>
                  </div>
                </div>

                {/* Claim / Status CTA */}
                <div className="mt-3 pt-2 border-t border-gray-800/60">
                  {isClaimed ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Reward Claimed</span>
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleClaimMilestone(milestone)}
                      className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
                    >
                      <Gift className="w-3.5 h-3.5 text-black" />
                      <span>Claim Now!</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Unlocks in {milestone.day - streak} days</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Footers: Bragging Flex Card or Merch / Claude Studio links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800 text-xs">
        <div className="text-gray-400 text-xs flex items-center gap-2">
          <span>🔥 Daily check-in resets at 00:00 midnight local time.</span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenBraggingCard && (
            <button
              onClick={onOpenBraggingCard}
              className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/60 text-purple-300 font-bold text-xs flex items-center gap-1 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Share Streak Flex</span>
            </button>
          )}
          {onOpenPhoneCaseStudio && (
            <button
              onClick={onOpenPhoneCaseStudio}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 font-bold text-xs flex items-center gap-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>KGL Merch Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
