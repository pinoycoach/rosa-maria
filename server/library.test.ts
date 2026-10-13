import assert from 'node:assert/strict';
import test from 'node:test';
import { applyLabels, type LibraryPiece } from './library';
import { MemoryStore } from './store';

const piece = (id: string, extra: Partial<LibraryPiece> = {}): LibraryPiece => ({
  id, text: 'words', author: 'A', kind: 'teaching', status: 'pending', flags: [], createdAt: '1', ...extra,
});

test('labels turn into curator flags', () => {
  const r = applyLabels({ theme: { choice: 'grief' }, prediction: { noul: 0.8 }, preachy: { noul: 0.1 }, attribution: { noul: 0.2 } });
  assert.equal(r.labels?.theme, 'grief');
  assert.deepEqual(r.flags, ['Sounds like a prediction or fortune-telling', 'Check who really said this']);
  assert.deepEqual(applyLabels(null).flags, ['Not labeled yet (JEV unavailable)']);
  assert.equal(applyLabels({ theme: { choice: 'astrology' } }).labels?.theme, undefined); // unknown choices are dropped
});

test('nothing is approved until a person approves it, and seeding twice adds nothing', async () => {
  const pieces = [piece('a'), piece('b')];
  const s = new MemoryStore();
  assert.equal(await s.seedLibrary(pieces), 2);
  assert.equal(await s.seedLibrary(pieces), 0);
  assert.equal((await s.listLibrary('approved')).length, 0);
  await s.putPiece({ ...piece('a'), status: 'approved' });
  assert.deepEqual((await s.listLibrary('approved')).map((p) => p.id), ['a']);
});
