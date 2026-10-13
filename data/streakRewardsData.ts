export interface StreakMilestone {
  day: number;
  title: string;
  shortDesc: string;
  rewardType: 'sparks' | 'pass' | 'badge' | 'merch_voucher' | 'feature';
  rewardValue: string;
  iconName: 'Flame' | 'Zap' | 'Trophy' | 'Gift' | 'Crown' | 'Star';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlockedDetails: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    day: 1,
    title: 'First Ignition',
    shortDesc: '+25 Sparks & Novice Seeker Badge',
    rewardType: 'sparks',
    rewardValue: '+25 Sparks',
    iconName: 'Zap',
    rarity: 'Common',
    unlockedDetails: 'Welcome to the daily discipline. 25 Sparks credited to your balance.',
  },
  {
    day: 3,
    title: 'Mindset Momentum',
    shortDesc: '+50 Sparks & 1.25x Boost',
    rewardType: 'sparks',
    rewardValue: '+50 Sparks & Boost',
    iconName: 'Flame',
    rarity: 'Common',
    unlockedDetails: '3 continuous days of alignment. 1.25x Sparks multiplier activated.',
  },
  {
    day: 5,
    title: 'Solopreneur Episode Key',
    shortDesc: '1 Free Episode Cliffhanger Skip',
    rewardType: 'feature',
    rewardValue: 'Free Skip Key',
    iconName: 'Star',
    rarity: 'Rare',
    unlockedDetails: 'Instant unlock for any locked paywalled episode across all vertical series.',
  },
  {
    day: 7,
    title: '24-Hour Binge Pass',
    shortDesc: 'Free 24h All-Access ($4.99 value) + 7-Day Badge',
    rewardType: 'pass',
    rewardValue: '24h All-Access Pass',
    iconName: 'Crown',
    rarity: 'Epic',
    unlockedDetails: 'One full week of unshakable focus! Unlock all vertical series with zero paywalls for 24 hours.',
  },
  {
    day: 14,
    title: 'Agency Watermark Waiver',
    shortDesc: '+200 Sparks & Clean Brand Export',
    rewardType: 'feature',
    rewardValue: 'Watermark Removal & +200 Sparks',
    iconName: 'Gift',
    rarity: 'Epic',
    unlockedDetails: 'Export clean, watermark-free high-res screenshots for LinkedIn, X, and Instagram Stories.',
  },
  {
    day: 21,
    title: 'Habit Transmutation',
    shortDesc: 'Reality Architect Title + Custom Decrees',
    rewardType: 'badge',
    rewardValue: 'Reality Architect Title',
    iconName: 'Flame',
    rarity: 'Epic',
    unlockedDetails: 'Neuroplastic habit lock achieved. 21 consecutive days of manifesting and creating.',
  },
  {
    day: 30,
    title: 'Legendary Sovereign Trophy',
    shortDesc: '100% Free KGL Phone Case Voucher + Master Badge',
    rewardType: 'merch_voucher',
    rewardValue: 'Free KGL Phone Case Voucher',
    iconName: 'Trophy',
    rarity: 'Legendary',
    unlockedDetails: 'The Ultimate 30-Day Milestone. Receive a voucher for a custom-manufactured physical KGL phone case with your chosen decree!',
  },
];
