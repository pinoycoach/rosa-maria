// Card pictures: a person's own photo, or a picture made with AI from a short description. AI pictures never
// show Mary, Jesus, the saints, angels or any person (the plan forbids AI images of holy figures, and pictures of
// people invite misuse), so descriptions are checked here first and every picture is checked again after.

export const PICTURE_PROMPT_MAX = 200;
export const PICTURE_MAX_BYTES = 5 * 1024 * 1024;
export const PICTURE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Ideas shown under the box, all safe. */
export const PICTURE_IDEAS = [
  'Sampaguita flowers in morning light',
  'A quiet chapel in green hills',
  'White lilies by a window',
  'A sunrise over the sea',
  'Candles glowing softly in a church',
  'Roses on a wooden table',
];

// Holy figures and people, in English and Tagalog. A description naming any of these is gently refused.
const HOLY = [
  'jesus', 'christ', 'kristo', 'hesus', 'mary', 'maria', 'mama mary', 'virgin', 'birhen', 'our lady', 'madonna', 'blessed mother',
  'santo nino', 'santo niño', 'nino', 'niño', 'saint', 'saints', 'santo', 'santa', 'san', 'st', 'sto', 'sta', 'pope', 'papa',
  'angel', 'angels', 'anghel', 'god', 'diyos', 'panginoon', 'lord', 'holy family', 'nativity', 'crucifix', 'crucified',
  'apostle', 'disciple', 'prophet', 'messiah', 'holy spirit', 'espiritu santo', 'trinity', 'divine', 'sacred heart',
];
const PEOPLE = [
  'person', 'people', 'man', 'men', 'woman', 'women', 'boy', 'girl', 'child', 'children', 'kid', 'kids', 'baby', 'babies',
  'face', 'faces', 'portrait', 'selfie', 'family', 'mother', 'father', 'mom', 'dad', 'lola', 'lolo', 'nanay', 'tatay', 'ina',
  'ama', 'anak', 'priest', 'pari', 'nun', 'madre', 'bishop', 'friar', 'monk', 'bride', 'groom', 'couple', 'nurse', 'doctor',
  'soldier', 'body', 'nude', 'naked', 'hands', 'tao', 'bata', 'sanggol',
];
const OTHER = ['logo', 'text', 'words', 'letters', 'flag', 'celebrity', 'president', 'blood', 'gore', 'weapon', 'gun', 'devil', 'demon', 'satan'];

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hits = (text: string, words: string[]) => {
  const t = ` ${fold(text)} `;
  return words.filter((w) => t.includes(` ${fold(w)} `));
};

export type PromptCheck = { ok: boolean; reason?: 'holy' | 'people' | 'other' | 'empty'; message?: string };

/** Whether a picture description may be sent to the AI. */
export function checkPicturePrompt(prompt: string): PromptCheck {
  if (!fold(prompt)) return { ok: false, reason: 'empty', message: 'Describe the picture you would like, for example “sampaguita flowers in morning light”.' };
  if (hits(prompt, HOLY).length) {
    return {
      ok: false,
      reason: 'holy',
      message:
        "Out of reverence, Rosa Maria doesn't make AI pictures of Our Lord, Our Lady, the saints or angels. Try flowers, a chapel, candles or a sunrise instead, or upload your own photo.",
    };
  }
  if (hits(prompt, PEOPLE).length) {
    return {
      ok: false,
      reason: 'people',
      message: 'AI pictures here never show people. Try a place or flowers, or upload your own family photo instead.',
    };
  }
  if (hits(prompt, OTHER).length) {
    return { ok: false, reason: 'other', message: "That isn't something we can make for a prayer card. Try flowers, a chapel, candles or a sunrise." };
  }
  return { ok: true };
}

/** The full instruction sent to the image model: the person's words inside firm limits. */
export const pictureInstruction = (prompt: string) =>
  `A gentle, peaceful, softly lit painting for a Catholic prayer card, in warm natural colours: ${prompt.trim()}.
Strict rules: show no people or human figures of any kind, no faces, no hands, no religious figures (no Jesus, Mary, saints or angels),
no crucifix with a figure, and no text, letters, logos or watermarks. Nothing frightening or dark.`;

/** Question asked about every finished picture before it is offered. */
export const PICTURE_CHECK_QUESTION = `Look at this picture. Answer with JSON only: {"people": boolean, "holyFigure": boolean, "text": boolean, "inappropriate": boolean}.
"people": any person, face, hand or human figure appears. "holyFigure": Jesus, Mary, a saint, an angel or any religious figure appears (a plain cross or a church building is fine).
"text": readable letters or words appear. "inappropriate": anything violent, frightening, sexual or unsuitable for a prayer card.`;

export type PictureVerdict = { people: boolean; holyFigure: boolean; text: boolean; inappropriate: boolean };

/** True only when the check answered and found nothing wrong. Anything unclear counts as not safe. */
export const pictureIsSafe = (v: Partial<PictureVerdict> | null) =>
  !!v && v.people === false && v.holyFigure === false && v.text === false && v.inappropriate === false;

/** A picture kept for a card: `pictures/<owner uid>/<16 hex>.<ext>`. */
export const PICTURE_PATH = /^pictures\/[a-f0-9]{32}\/[a-f0-9]{16}\.(jpg|png|webp)$/;
export const ownsPicture = (path: string, uid: string) => PICTURE_PATH.test(path) && path.startsWith(`pictures/${uid}/`);
