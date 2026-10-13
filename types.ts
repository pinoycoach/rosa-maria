
export type Platform = 'Twitter' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'TikTok' | 'Threads';

export type CaptionAngleType = 'inspirational' | 'question' | 'informative' | 'humorous' | 'cta';

export interface CaptionAngle {
  angle: CaptionAngleType;
  title: string;
  content: string;
  hashtags: string[];
}

export interface Post {
  id: string;
  platform: Platform;
  avatar: string;
  username: string;
  handle: string;
  content: string;
  captionAngles?: CaptionAngle[];
  activeAngle?: CaptionAngleType;
  imageUrl?: string;
  videoUrl?: string;
  prompt?: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface Persona {
  id: string | number;
  name: string;
  description: string;
  avatar: string;
  promptFragment: string;
  category: 'original' | 'philosopher' | 'visionary' | 'leader' | 'artist' | 'custom';
}

export interface UserBrandSettings {
  isPro: boolean;
  brandName: string;
  brandHandle: string;
  removeWatermark: boolean;
  aspectRatio: 'feed' | 'story' | 'square';
}

export interface SeriesEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  tagline: string;
  cliffhanger: string;
  decreeText: string;
  manifestAction: string;
  /** A step of WOOP (Wish, Outcome, Obstacle, Plan; Oettingen) for the person to answer. */
  woop?: { step: 'wish' | 'outcome' | 'obstacle' | 'plan' | 'practice' | 'review'; prompt: string; example: string };
  visualMood: string;
  bgGradient: string;
  durationSec: number;
  isFree: boolean;
}

export interface ManifestSeries {
  id: string;
  title: string;
  hook: string;
  category: 'abundance' | 'stoic' | 'reality_shift' | 'creative_breakthrough' | 'sovereign_leader';
  categoryLabel: string;
  coverImage: string;
  accentColor: string;
  totalEpisodes: number;
  freeEpisodesCount: number;
  priceUsd: number;
  sparksCost: number;
  /**
   * The date a person read the printed worksheet start to finish and signed it off. Worksheets are few and
   * hand-checked: without this date the series has no Worksheet button.
   */
  worksheetReviewedOn?: string;
  completionBadge: {
    title: string;
    rarity: 'Common' | 'Rare' | 'Mythic' | 'Legendary';
    description: string;
  };
  episodes: SeriesEpisode[];
}

export interface UserGamification {
  streakDays: number;
  lastCheckInDate: string;
  checkInHistory?: string[];
  claimedMilestoneDays?: number[];
  sparksBalance: number;
  xp: number;
  rankTitle: 'Novice Seeker' | 'Mindset Alchemist' | 'Reality Architect' | 'Sovereign Master';
  unlockedSeriesIds: string[];
  completedSeriesIds: string[];
  claimedDailyDecree: boolean;
  customAffirmation?: string;
}

export interface AutoPostWebhookConfig {
  webhookUrl: string;
  targetPlatform: Platform;
  autoWatermark: boolean;
  autoHashtags: boolean;
  scheduleTime: string;
  autoPostEnabled: boolean;
}

export interface AutoPostLog {
  id: string;
  timestamp: string;
  platform: Platform;
  captionSnippet: string;
  status: 'dispatched' | 'scheduled' | 'failed';
  destination: string;
}