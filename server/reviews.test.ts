import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PRAYERS, prayerById } from '../shared/prayers';
import { textHash, reviewFor, publicPrayer, deskPrayer, cleanReviewer, type Review } from './reviews';
import { MemoryStore } from './store';

const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

test('every English prayer is copied word for word from the Rosary notes (nothing reworded)', () => {
  const doc = flat(readFileSync(new URL('../docs/rosary-basics.md', import.meta.url), 'utf8'));
  for (const p of PRAYERS.filter((p) => p.language === 'en')) {
    assert.ok(doc.includes(flat(p.text)), `${p.id} is not in docs/rosary-basics.md exactly as written`);
  }
});

test('every prayer has an id, a title, its text and a source to check against', () => {
  const ids = new Set<string>();
  for (const p of PRAYERS) {
    assert.ok(p.id && p.title && p.text.trim() && p.source && /^https:\/\//.test(p.sourceUrl), p.id);
    assert.ok(['en', 'fil'].includes(p.language), p.id);
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
  }
  for (const id of ['sign-of-the-cross', 'apostles-creed', 'our-father', 'hail-mary', 'glory-be', 'fatima-prayer', 'hail-holy-queen', 'rosary-closing-prayer']) {
    assert.ok(prayerById(id), `missing ${id}`);
  }
});

const hailMary = prayerById('hail-mary')!;
const review = (text: string): Map<string, Review> =>
  new Map([['hail-mary', { itemId: 'hail-mary', textHash: textHash(text), reviewedBy: 'Fr. Test', reviewedOn: '2026-10-14' }]]);

test('an unreviewed prayer shows "awaiting review" and never its words', () => {
  const view = publicPrayer(hailMary, new Map());
  assert.equal(view.status, 'awaiting-review');
  assert.ok(!('text' in view));
});

test('a reviewed prayer shows its words, who checked it and when', () => {
  const view = publicPrayer(hailMary, review(hailMary.text));
  assert.equal(view.status, 'reviewed');
  assert.equal(view.status === 'reviewed' && view.text, hailMary.text);
  assert.equal(view.status === 'reviewed' && view.reviewedBy, 'Fr. Test');
});

test('changing even one word cancels the review', () => {
  const edited = { ...hailMary, text: hailMary.text.replace('grace', 'Grace') };
  const reviews = review(hailMary.text);
  assert.equal(reviewFor(edited, reviews), null);
  assert.equal(publicPrayer(edited, reviews).status, 'awaiting-review');
  assert.equal(deskPrayer(edited, reviews).changedSinceReview, true);
  assert.equal(deskPrayer(hailMary, reviews).changedSinceReview, false);
});

test('reviewer names are tidied', () => {
  assert.equal(cleanReviewer('  Fr.   Juan  dela Cruz '), 'Fr. Juan dela Cruz');
  assert.equal(cleanReviewer(undefined), '');
});

test('the store keeps one review per prayer, and can undo it', async () => {
  const s = new MemoryStore();
  const r: Review = { itemId: 'hail-mary', textHash: 'x', reviewedBy: 'A', reviewedOn: '2026-10-14' };
  await s.putReview(r);
  await s.putReview({ ...r, reviewedBy: 'B' });
  assert.deepEqual((await s.listReviews()).map((x) => x.reviewedBy), ['B']);
  await s.deleteReview('hail-mary');
  assert.equal((await s.listReviews()).length, 0);
});

test('a saint is shown only once signed off, and any edit to the entry cancels it', async () => {
  const { SAINTS } = await import('../shared/saints');
  const { saintHash, saintKey, publicSaints, deskSaint } = await import('./reviews');
  const lorenzo = SAINTS[0];
  const reviews = new Map([[saintKey(lorenzo.id), { itemId: saintKey(lorenzo.id), textHash: saintHash(lorenzo), reviewedBy: 'A', reviewedOn: '2026-10-14' }]]);
  assert.deepEqual(publicSaints(SAINTS, new Map()), []);
  assert.deepEqual(publicSaints(SAINTS, reviews).map((s) => s.id), ['lorenzo-ruiz']);
  const moved = { ...lorenzo, feast: '09-29' };
  assert.deepEqual(publicSaints([moved], reviews), []);
  assert.equal(deskSaint(moved, reviews).changedSinceReview, true);
});
