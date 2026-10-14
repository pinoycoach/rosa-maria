// Prayer cards: the occasions, the designs, and the gentle checks on a sender's note. Cards only ever carry
// prayers a person has checked; the note is the sender's own words and is labelled as theirs.

export type OccasionId = 'birthday' | 'safe-travel' | 'healing' | 'exams' | 'new-baby' | 'in-memory' | 'thank-you';

export interface Occasion {
  id: OccasionId;
  /** What the sender picks. */
  label: string;
  /** The greeting at the top of the card. */
  greeting: string;
  /** Prayers offered for this occasion, best first. Only checked ones are ever shown. */
  prayerIds: string[];
  design: DesignId;
}

export type DesignId = 'marian' | 'rose' | 'sampaguita' | 'dawn' | 'candle' | 'lily';

export const DESIGNS: Array<{ id: DesignId; name: string }> = [
  { id: 'marian', name: 'Marian blue' },
  { id: 'rose', name: 'Roses' },
  { id: 'sampaguita', name: 'Sampaguita' },
  { id: 'dawn', name: 'Dawn' },
  { id: 'lily', name: 'Lilies' },
  { id: 'candle', name: 'Candle' },
];

export const OCCASIONS: Occasion[] = [
  { id: 'birthday', label: 'Birthday', greeting: 'Happy birthday', prayerIds: ['glory-be', 'hail-mary', 'our-father'], design: 'dawn' },
  { id: 'safe-travel', label: 'Safe travel', greeting: 'Safe travels', prayerIds: ['hail-mary', 'hail-holy-queen', 'our-father'], design: 'marian' },
  { id: 'healing', label: 'Sickness and healing', greeting: 'Praying for your healing', prayerIds: ['hail-mary', 'hail-holy-queen', 'our-father'], design: 'lily' },
  { id: 'exams', label: 'Exams', greeting: 'Praying for you on your exams', prayerIds: ['our-father', 'hail-mary', 'glory-be'], design: 'marian' },
  { id: 'new-baby', label: 'New baby', greeting: 'Welcome, little one', prayerIds: ['hail-mary', 'glory-be', 'our-father'], design: 'sampaguita' },
  { id: 'in-memory', label: 'In loving memory (pasiyam)', greeting: 'In loving memory', prayerIds: ['hail-holy-queen', 'our-father', 'hail-mary'], design: 'candle' },
  { id: 'thank-you', label: 'Thank you', greeting: 'Thank you, and God bless you', prayerIds: ['glory-be', 'our-father', 'hail-mary'], design: 'rose' },
];

export const occasionById = (id: string) => OCCASIONS.find((o) => o.id === id) || null;
export const isDesign = (id: unknown): id is DesignId => DESIGNS.some((d) => d.id === id);

export const NOTE_MAX = 400;
export const NAME_MAX = 40;

export type NoteFlagKind = 'chain' | 'promise' | 'luck' | 'curse';

/** Kind words for the sender: a suggestion, never a scolding. */
export const NOTE_SUGGESTIONS: Record<NoteFlagKind, string> = {
  chain:
    'Rosa Maria cards are never chain letters, so please leave out asking people to pass it on or send it to others. Your card can simply be a gift.',
  promise:
    "Prayer isn't a promise of a result. You might write what you're hoping and praying for instead, like “praying for your healing”.",
  luck: 'Rosa Maria keeps to prayer rather than luck. Something like “God bless you” may fit well here.',
  curse: "This card is meant to bring comfort, so we'd gently suggest leaving out words about curses or bad things happening.",
};

/** Only chain letters stop a card from being sent; the rest are suggestions the sender may set aside. */
export const BLOCKING: NoteFlagKind[] = ['chain'];

const RULES: Record<NoteFlagKind, RegExp[]> = {
  chain: [
    /\b(send|forward|share|pass|repost)\b[^.!?\n]{0,40}\b(\d+|three|five|seven|ten|twelve|all your|everyone you)\b[^.!?\n]{0,15}\b(people|persons|friends|contacts|others|groups?|kids)\b/i,
    /\b(pass (it|this) on|break (the|this) chain|chain (letter|prayer)|don'?t (break|ignore) this)\b/i,
    /\b(ipasa|i-?forward|i-?share)\s+(mo\s+)?(ito|to)\b/i,
    /\bsa\s+\d+\s+(tao|kaibigan)\b/i,
  ],
  promise: [
    /\b(this|the) (prayer|novena|card) (will|is guaranteed to|never fails)\b/i,
    /\b(never fails|guaranteed|100%|within \d+ (hours|days))\b/i,
    /\b(will|shall) (surely|definitely|certainly) (be|get|come|happen|heal|win|pass)\b/i,
  ],
  luck: [/\b(good luck|lucky|luckiest|bad luck|swerte|suwerte|malas|fortune)\b/i],
  curse: [/\b(curse[sd]?|sumpa|or else|something bad will happen|misfortune|karma will)\b/i],
};

/** The note's flags from the plain rules (no network). JEV adds its own on the server. */
export const noteFlags = (note: string): NoteFlagKind[] =>
  (Object.keys(RULES) as NoteFlagKind[]).filter((k) => RULES[k].some((re) => re.test(note)));

export const cleanText = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);

export const CARD_ID = /^[A-Za-z0-9_-]{16}$/;
