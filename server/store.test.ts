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
