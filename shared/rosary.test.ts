import assert from 'node:assert/strict';
import test from 'node:test';
import { rosarySteps, mysteriesFor, MYSTERIES, MYSTERY_SETS } from './rosary';
import { prayerById } from './prayers';

const count = (set: Parameters<typeof rosarySteps>[0], id: string, opts = {}) =>
  rosarySteps(set, opts).filter((s) => s.kind === 'prayer' && s.prayerId === id).length;

test('a Rosary has 5 decades, 53 Hail Marys and 6 Our Fathers', () => {
  for (const set of MYSTERY_SETS) {
    const steps = rosarySteps(set);
    assert.equal(steps.filter((s) => s.kind === 'mystery').length, 5);
    assert.equal(count(set, 'hail-mary'), 53);
    assert.equal(count(set, 'our-father'), 6);
    assert.equal(count(set, 'glory-be'), 6);
    assert.equal(count(set, 'apostles-creed'), 1);
    assert.equal(count(set, 'hail-holy-queen'), 1);
    assert.equal(count(set, 'rosary-closing-prayer'), 1);
  }
});

test('the order: crucifix, Creed, Our Father, 3 Hail Marys, Glory Be, then each decade', () => {
  const ids = rosarySteps('joyful').slice(0, 10).map((s) => (s.kind === 'prayer' ? s.prayerId : `mystery:${s.name}`));
  assert.deepEqual(ids, [
    'sign-of-the-cross', 'apostles-creed', 'our-father', 'hail-mary', 'hail-mary', 'hail-mary', 'glory-be',
    'mystery:The Annunciation', 'our-father', 'hail-mary',
  ]);
  const last = rosarySteps('joyful').slice(-3).map((s) => (s.kind === 'prayer' ? s.prayerId : ''));
  assert.deepEqual(last, ['hail-holy-queen', 'rosary-closing-prayer', 'sign-of-the-cross']);
});

test('each decade ends with Glory Be and the optional Fatima Prayer', () => {
  assert.equal(count('glorious', 'fatima-prayer'), 5);
  assert.equal(count('glorious', 'fatima-prayer', { fatima: false }), 0);
  assert.equal(count('glorious', 'hail-mary', { fatima: false }), 53);
});

test('Mysteries by day: Joyful Mon/Sat, Sorrowful Tue/Fri, Glorious Wed/Sun, Luminous Thu', () => {
  // 2026-10-11 is a Sunday.
  const day = (n: number) => mysteriesFor(new Date(2026, 9, 11 + n));
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(day), ['glorious', 'joyful', 'sorrowful', 'glorious', 'luminous', 'sorrowful', 'joyful']);
});

test('every Mystery title and every prayer the Rosary uses exists', () => {
  const step = rosarySteps('luminous').find((s) => s.kind === 'mystery');
  assert.equal(step?.kind === 'mystery' && step.title, 'The First Luminous Mystery');
  for (const set of MYSTERY_SETS) {
    assert.equal(MYSTERIES[set].mysteries.length, 5);
    for (const s of rosarySteps(set)) if (s.kind === 'prayer') assert.ok(prayerById(s.prayerId), s.prayerId);
  }
});

test('the Mystery names match the Rosary notes', async () => {
  const { readFileSync } = await import('node:fs');
  const doc = readFileSync(new URL('../docs/rosary-basics.md', import.meta.url), 'utf8');
  for (const set of MYSTERY_SETS) {
    for (const m of MYSTERIES[set].mysteries) assert.ok(doc.includes(m.replace(/^The /, 'the ')) || doc.includes(m), m);
  }
});

test('"Pray a decade with me" is one decade between two Signs of the Cross', () => {
  const steps = rosarySteps('joyful', { decade: 2 });
  const ids = steps.map((s) => (s.kind === 'prayer' ? s.prayerId : `mystery:${s.name}`));
  assert.equal(ids[0], 'sign-of-the-cross');
  assert.equal(ids[1], 'mystery:The Nativity');
  assert.equal(ids.filter((x) => x === 'hail-mary').length, 10);
  assert.equal(ids.filter((x) => x === 'our-father').length, 1);
  assert.deepEqual(ids.slice(-3), ['glory-be', 'fatima-prayer', 'sign-of-the-cross']);
});
