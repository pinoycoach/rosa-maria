import assert from 'node:assert/strict';
import test from 'node:test';
import { OCCASIONS, DESIGNS, noteFlags, cleanText, BLOCKING } from './cards';
import { prayerById } from './prayers';

test('the seven occasions each suggest real prayers and a card design', () => {
  assert.deepEqual(OCCASIONS.map((o) => o.id), ['birthday', 'safe-travel', 'healing', 'exams', 'new-baby', 'in-memory', 'thank-you']);
  for (const o of OCCASIONS) {
    assert.ok(o.prayerIds.length && o.prayerIds.every((id) => prayerById(id)), o.id);
    assert.ok(DESIGNS.some((d) => d.id === o.design), o.id);
  }
  assert.ok(DESIGNS.length >= 4 && DESIGNS.length <= 6);
});

test('chain letters are caught, in English and Tagalog', () => {
  for (const t of ['Send this to 10 people today', 'Forward to seven friends and see', "Don't break the chain!", 'Ipasa mo ito sa 12 tao', 'please pass it on']) {
    assert.ok(noteFlags(t).includes('chain'), t);
  }
  assert.deepEqual(BLOCKING, ['chain']);
});

test('promises, luck and curses get a gentle suggestion', () => {
  assert.deepEqual(noteFlags('This prayer will heal you within 3 days'), ['promise']);
  assert.deepEqual(noteFlags('Good luck on your board exam!'), ['luck']);
  assert.deepEqual(noteFlags('Share it or else something bad will happen'), ['curse']);
});

test('ordinary loving notes pass untouched', () => {
  for (const t of [
    'Happy birthday, Nanay! We love you and miss you. Praying for you always.',
    'Ingat ka sa biyahe, anak. God bless you.',
    'Praying for your healing. We will visit on Sunday.',
    'Salamat sa lahat, Tita. Share our love with the kids.',
  ]) {
    assert.deepEqual(noteFlags(t), [], t);
  }
});

test('notes and names are tidied and kept short', () => {
  assert.equal(cleanText('  hi\u0007  there \n\n\n\nbye ', 100), 'hi there \n\nbye');
  assert.equal(cleanText('x'.repeat(500), 400).length, 400);
});
