import assert from 'node:assert/strict';
import test from 'node:test';
import { makeCode, normalizeCode, checkRedeem, newInviteRewards, isValidEmail, parseAdminEmails, newInvite } from './accounts';
import { MemoryStore } from './store';

test('invite codes are readable and typed loosely', () => {
  const code = makeCode();
  assert.match(code, /^INSP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/);
  assert.equal(normalizeCode(code.toLowerCase().replace(/-/g, ' ')), code);
  assert.equal(normalizeCode(code.slice(5).replace('-', '')), code); // without the INSP prefix
  assert.equal(normalizeCode('INSP-0OIL-11'), null); // ambiguous letters never appear in codes
  assert.equal(normalizeCode('nope'), null);
});

test('an invite works once, and never for its own maker', () => {
  const inv = newInvite('alice');
  assert.equal(checkRedeem(null, 'bob'), 'not-found');
  assert.equal(checkRedeem(inv, 'alice'), 'own');
  assert.equal(checkRedeem(inv, 'bob'), 'ok');
  assert.equal(checkRedeem({ ...inv, usedBy: 'bob' }, 'carol'), 'used');
  assert.equal(checkRedeem({ ...inv, usedBy: 'bob' }, 'bob'), 'ok'); // a double tap by the same person is fine
});

test('the store redeems in one step: the second person is refused', async () => {
  const s = new MemoryStore();
  const inv = newInvite('alice');
  await s.addInvites([inv]);
  assert.deepEqual(await s.redeemInvite(inv.code, 'bob'), { result: 'ok', createdBy: 'alice' });
  assert.equal((await s.redeemInvite(inv.code, 'carol')).result, 'used');
  assert.equal((await s.listInvites('alice', 10))[0].usedBy, 'bob');
});

test('streak invites come at 7 and 30 days, once each', () => {
  assert.deepEqual(newInviteRewards(6), { days: [], invites: 0 });
  assert.deepEqual(newInviteRewards(7), { days: [7], invites: 1 });
  assert.deepEqual(newInviteRewards(30, [7]), { days: [30], invites: 2 });
  assert.deepEqual(newInviteRewards(31, [7, 30]), { days: [], invites: 0 });
  assert.deepEqual(newInviteRewards(30), { days: [7, 30], invites: 3 }); // first sign-in at 30 days earns both
});

test('linking keeps the first device; another device gets the same user', async () => {
  const s = new MemoryStore();
  const first = await s.linkAccount({ sub: 'g1', uid: 'phone-uid', email: 'a@b.co', name: 'A', linkedAt: '1' });
  const second = await s.linkAccount({ sub: 'g1', uid: 'laptop-uid', email: 'a@b.co', name: 'A', linkedAt: '2' });
  assert.equal(first.uid, 'phone-uid');
  assert.equal(second.uid, 'phone-uid');
  await s.deleteAccountsForUid('phone-uid');
  assert.equal(await s.getAccount('g1'), null);
});

test('waitlist keeps each email once; emails and admin lists are cleaned', async () => {
  const s = new MemoryStore();
  assert.equal(await s.addToWaitlist({ email: 'x@y.co', createdAt: '1' }), true);
  assert.equal(await s.addToWaitlist({ email: 'x@y.co', createdAt: '2' }), false);
  assert.ok(isValidEmail('x@y.co'));
  assert.ok(!isValidEmail('x/y@z.co') && !isValidEmail('nope') && !isValidEmail('a@b'));
  assert.deepEqual([...parseAdminEmails(' Me@Gmail.com, , you@x.co ')], ['me@gmail.com', 'you@x.co']);
});
