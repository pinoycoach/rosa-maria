// Streaks, sparks and XP. The server applies these rules (so nobody can award themselves sparks
// from the browser); the page only shows the result. Dates are UTC days (YYYY-MM-DD).
import type { UserGamification } from '../types';
import { STREAK_MILESTONES } from '../data/streakRewardsData';
import { MANIFEST_SERIES_LIST } from '../data/manifestSeriesData';

export type GamificationAction =
  | { type: 'check-in' }
  | { type: 'claim-milestone'; day: number }
  | { type: 'unlock-series'; seriesId: string }
  | { type: 'complete-series'; seriesId: string }
  | { type: 'post-created' }
  | { type: 'share-bonus' };

export class GameRuleError extends Error {}

// Stored per user. Day-limited rewards remember the day they were last given.
export interface StoredGamification extends UserGamification {
  postRewardsDay?: string;
  postRewardsToday?: number;
  shareBonusDay?: string;
}

export const POST_REWARDS_PER_DAY = 5;

const MILESTONE_SPARKS: Record<number, number> = { 1: 25, 3: 50, 7: 100, 14: 200, 30: 500 };

export const rankFor = (xp: number): UserGamification['rankTitle'] =>
  xp >= 700 ? 'Sovereign Master' : xp >= 300 ? 'Reality Architect' : xp >= 100 ? 'Mindset Alchemist' : 'Novice Seeker';

export const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);

const previousDay = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDay(d);
};

export const newGamification = (): StoredGamification => ({
  streakDays: 0,
  lastCheckInDate: '',
  checkInHistory: [],
  claimedMilestoneDays: [],
  sparksBalance: 45, // a welcome balance: enough to unlock one series
  xp: 0,
  rankTitle: 'Novice Seeker',
  unlockedSeriesIds: [],
  completedSeriesIds: [],
  claimedDailyDecree: false,
});

/** What the page sees: the streak shows 0 once a day has been missed, and "checked in today" is derived. */
export const viewOf = (state: StoredGamification, today: string): UserGamification => {
  const alive = state.lastCheckInDate === today || state.lastCheckInDate === previousDay(today);
  return {
    streakDays: alive ? state.streakDays : 0,
    lastCheckInDate: state.lastCheckInDate,
    checkInHistory: state.checkInHistory || [],
    claimedMilestoneDays: state.claimedMilestoneDays || [],
    sparksBalance: state.sparksBalance,
    xp: state.xp,
    rankTitle: rankFor(state.xp),
    unlockedSeriesIds: state.unlockedSeriesIds || [],
    completedSeriesIds: state.completedSeriesIds || [],
    claimedDailyDecree: state.lastCheckInDate === today,
  };
};

const seriesCost = (seriesId: string) => MANIFEST_SERIES_LIST.find((s) => s.id === seriesId)?.sparksCost;

/** Applies one action and returns the new stored state plus a short message. Throws GameRuleError when not allowed. */
export function applyAction(
  prev: StoredGamification,
  action: GamificationAction,
  today: string
): { state: StoredGamification; message: string } {
  const s: StoredGamification = {
    ...prev,
    checkInHistory: [...(prev.checkInHistory || [])],
    claimedMilestoneDays: [...(prev.claimedMilestoneDays || [])],
    unlockedSeriesIds: [...(prev.unlockedSeriesIds || [])],
    completedSeriesIds: [...(prev.completedSeriesIds || [])],
  };
  const award = (sparks: number, xp: number) => {
    s.sparksBalance += sparks;
    s.xp += xp;
    s.rankTitle = rankFor(s.xp);
  };

  switch (action.type) {
    case 'check-in': {
      if (s.lastCheckInDate === today) throw new GameRuleError("You've already checked in today. Come back tomorrow!");
      s.streakDays = s.lastCheckInDate === previousDay(today) ? s.streakDays + 1 : 1;
      s.lastCheckInDate = today;
      s.checkInHistory = [...s.checkInHistory!.filter((d) => d !== today), today].slice(-60);
      award(25, 50);
      return { state: s, message: '🔥 Daily Streak Extended! +25 Sparks & +50 XP granted.' };
    }
    case 'claim-milestone': {
      const milestone = STREAK_MILESTONES.find((m) => m.day === action.day);
      if (!milestone) throw new GameRuleError('That milestone does not exist.');
      if (s.claimedMilestoneDays!.includes(milestone.day)) throw new GameRuleError('Already claimed.');
      if (viewOf(s, today).streakDays < milestone.day) throw new GameRuleError(`Reach a ${milestone.day}-day streak first.`);
      s.claimedMilestoneDays!.push(milestone.day);
      award(MILESTONE_SPARKS[milestone.day] || 0, 50);
      return { state: s, message: `🎁 Unlocked ${milestone.title}! Reward claimed.` };
    }
    case 'unlock-series': {
      const cost = seriesCost(action.seriesId);
      if (cost === undefined) throw new GameRuleError('That series does not exist.');
      if (s.unlockedSeriesIds.includes(action.seriesId)) return { state: s, message: 'Already unlocked.' };
      if (s.sparksBalance < cost) {
        throw new GameRuleError(`You need ${cost} Sparks. Current balance: ${s.sparksBalance} Sparks. Check in daily to earn more!`);
      }
      s.sparksBalance -= cost;
      s.unlockedSeriesIds.push(action.seriesId);
      award(0, 80);
      return { state: s, message: `Unlocked with ${cost} Sparks!` };
    }
    case 'complete-series': {
      if (seriesCost(action.seriesId) === undefined) throw new GameRuleError('That series does not exist.');
      if (!s.unlockedSeriesIds.includes(action.seriesId)) throw new GameRuleError('Unlock the series first.');
      if (s.completedSeriesIds.includes(action.seriesId)) return { state: s, message: 'Already mastered.' };
      s.completedSeriesIds.push(action.seriesId);
      award(50, 250);
      return { state: s, message: 'Series Mastered! Sovereign Completion Certificate unlocked.' };
    }
    case 'post-created': {
      const count = s.postRewardsDay === today ? s.postRewardsToday || 0 : 0;
      s.postRewardsDay = today;
      s.postRewardsToday = count + 1;
      if (count >= POST_REWARDS_PER_DAY) return { state: s, message: 'Inspiration successfully posted!' };
      award(10, 40);
      return { state: s, message: 'Inspiration successfully posted! +10 Sparks & +40 XP' };
    }
    case 'share-bonus': {
      if (s.shareBonusDay === today) throw new GameRuleError('Share bonus already claimed today.');
      s.shareBonusDay = today;
      award(50, 100);
      return { state: s, message: 'Bragging rights bonus unlocked! +50 Sparks & +100 XP' };
    }
    default:
      throw new GameRuleError('Unknown action.');
  }
}
