import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryStore } from './store';

test('memory store keeps users and usage apart, and deleting a user removes them', async () => {
  const s = new MemoryStore();
  await s.updateUser('u1', () => ({ createdAt: 'x', updatedAt: 'x' }));
  assert.ok(await s.getUser('u1'));
  assert.equal(await s.getUser('u2'), null);
  assert.equal(await s.bumpUsage('k'), 1);
  assert.equal(await s.bumpUsage('k'), 2);
  await s.deleteUser('u1');
  assert.equal(await s.getUser('u1'), null);
});

test('cards are kept by id and removed with the sender; saint flags count up once per name', async () => {
  const s = new MemoryStore();
  const card = { id: 'a'.repeat(16), occasion: 'birthday' as const, design: 'rose' as const, prayerId: 'hail-mary', toName: '', fromName: '', note: '', flags: [], senderUid: 'u1', createdAt: '1' };
  await s.putCard(card);
  await s.putCard({ ...card, id: 'b'.repeat(16), senderUid: 'u2' });
  assert.equal((await s.getCard(card.id))?.senderUid, 'u1');
  await s.deleteCardsBy('u1');
  assert.equal(await s.getCard(card.id), null);
  assert.ok(await s.getCard('b'.repeat(16)));
  await s.flagSaintName('St. Jude');
  await s.flagSaintName('Saint Jude');
  assert.deepEqual((await s.listSaintFlags(10)).map((f) => [f.name, f.count]), [['St. Jude', 2]]);
  await s.dismissSaintFlag('st jude');
  assert.equal((await s.listSaintFlags(10)).length, 0);
});
