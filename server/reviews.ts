// Reviews. A person checks a prayer (word for word) or a saint's entry against its source and signs it off;
// the sign-off is tied to a fingerprint of exactly what they checked. If that ever changes, the old sign-off no
// longer matches and the item goes back to "awaiting review". Pure functions only, so they can be unit-tested.
import crypto from "crypto";
import type { Prayer } from "../shared/prayers";
import type { Saint } from "../shared/saints";

export interface Review {
  /** A prayer's id, or "saint:<id>" for a saint. */
  itemId: string;
  /** Fingerprint of the exact words that were checked. */
  textHash: string;
  reviewedBy: string;
  /** YYYY-MM-DD */
  reviewedOn: string;
}

export const textHash = (text: string) => crypto.createHash("sha256").update(text.normalize("NFC"), "utf8").digest("hex");

/** The review that still applies to this prayer's current words, or null. */
export const reviewFor = (prayer: Prayer, reviews: Map<string, Review>): Review | null => {
  const r = reviews.get(prayer.id);
  return r && r.textHash === textHash(prayer.text) ? r : null;
};

/** What visitors get: the words only once reviewed; otherwise just the title and "awaiting review". */
export const publicPrayer = (prayer: Prayer, reviews: Map<string, Review>) => {
  const r = reviewFor(prayer, reviews);
  const base = { id: prayer.id, title: prayer.title, language: prayer.language, source: prayer.source, sourceUrl: prayer.sourceUrl };
  return r
    ? { ...base, status: "reviewed" as const, text: prayer.text, reviewedBy: r.reviewedBy, reviewedOn: r.reviewedOn }
    : { ...base, status: "awaiting-review" as const };
};

/** What the reviewer sees: everything, including whether an old sign-off went stale after an edit. */
export const deskPrayer = (prayer: Prayer, reviews: Map<string, Review>) => {
  const old = reviews.get(prayer.id);
  const current = reviewFor(prayer, reviews);
  return {
    ...prayer,
    textHash: textHash(prayer.text),
    status: current ? ("reviewed" as const) : ("awaiting-review" as const),
    reviewedBy: current?.reviewedBy || null,
    reviewedOn: current?.reviewedOn || null,
    changedSinceReview: !!old && !current,
  };
};

/** A reviewer's name as typed: trimmed and kept short. Empty when there's nothing usable. */
export const cleanReviewer = (name: unknown) => String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);

// ---------- Saints ----------

export const saintKey = (id: string) => `saint:${id}`;

/** Fingerprint of everything shown about a saint, so any edit cancels the sign-off. */
export const saintHash = (s: Saint) =>
  textHash(JSON.stringify([s.name, s.feast, s.calendar, s.canonized || "", s.about, s.source, s.sourceUrl]));

export const saintReviewFor = (saint: Saint, reviews: Map<string, Review>): Review | null => {
  const r = reviews.get(saintKey(saint.id));
  return r && r.textHash === saintHash(saint) ? r : null;
};

/** Visitors only ever see signed-off saints. */
export const publicSaints = (saints: Saint[], reviews: Map<string, Review>) =>
  saints
    .filter((s) => saintReviewFor(s, reviews))
    .map(({ aliases, ...s }) => s);

export const deskSaint = (saint: Saint, reviews: Map<string, Review>) => {
  const old = reviews.get(saintKey(saint.id));
  const current = saintReviewFor(saint, reviews);
  return {
    ...saint,
    textHash: saintHash(saint),
    status: current ? ("reviewed" as const) : ("awaiting-review" as const),
    reviewedBy: current?.reviewedBy || null,
    reviewedOn: current?.reviewedOn || null,
    changedSinceReview: !!old && !current,
  };
};
