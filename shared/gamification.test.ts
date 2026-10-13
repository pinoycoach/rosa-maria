import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, GameRuleError, newGamification, viewOf, POST_REWARDS_PER_DAY } from './gamification';

const D1 = '2026-10-10';
const D2 = '2026-10-11';
const D4 = '2026-10-13';

test('check-in once per day, streak grows on consecutive days', () => {
  let s = newGamification();
  s = applyAction(s, { type: 'check-in' }, D1).state;
  assert.equal(s.streakDays, 1);
  assert.equal(s.xp, 50);
  assert.equal(s.sparksBalance, 70);
  assert.throws(() => applyAction(s, { type: 'check-in' }, D1), GameRuleError);
  s = applyAction(s, { type: 'check-in' }, D2).state;
  assert.equal(s.streakDays, 2);
  assert.equal(viewOf(s, D2).claimedDailyDecree, true);
});

test('a missed day resets the streak', () => {
  let s = applyAction(newGamification(), { type: 'check-in' }, D1).state;
  s = applyAction(s, { type: 'check-in' }, D2).state;
  assert.equal(viewOf(s, D4).streakDays, 0); // shown as broken before checking in again
  s = applyAction(s, { type: 'check-in' }, D4).state;
  assert.equal(s.streakDays, 1);
});

test('milestones need the streak and can be claimed once', () => {
  let s = newGamification();
  assert.throws(() => applyAction(s, { type: 'claim-milestone', day: 1 }, D1), /streak/);
  s = applyAction(s, { type: 'check-in' }, D1).state;
  const before = s.sparksBalance;
  s = applyAction(s, { type: 'claim-milestone', day: 1 }, D1).state;
  assert.equal(s.sparksBalance, before + 25);
  assert.throws(() => applyAction(s, { type: 'claim-milestone', day: 1 }, D1), /Already/);
  assert.throws(() => applyAction(s, { type: 'claim-milestone', day: 2 }, D1), /does not exist/);
});

test('unlocking a series needs enough sparks; completing needs it unlocked', () => {
  let s = { ...newGamification(), sparksBalance: 10 };
  assert.throws(() => applyAction(s, { type: 'unlock-series', seriesId: 'series-reality-architect' }, D1), /need 40 Sparks/);
  assert.throws(() => applyAction(s, { type: 'complete-series', seriesId: 'series-reality-architect' }, D1), /Unlock/);
  s = { ...s, sparksBalance: 45 };
  s = applyAction(s, { type: 'unlock-series', seriesId: 'series-reality-architect' }, D1).state;
  assert.equal(s.sparksBalance, 5);
  assert.deepEqual(s.unlockedSeriesIds, ['series-reality-architect']);
  s = applyAction(s, { type: 'complete-series', seriesId: 'series-reality-architect' }, D1).state;
  const xp = s.xp;
  s = applyAction(s, { type: 'complete-series', seriesId: 'series-reality-architect' }, D1).state;
  assert.equal(s.xp, xp); // no double reward
  assert.throws(() => applyAction(s, { type: 'unlock-series', seriesId: 'nope' }, D1), /does not exist/);
});

test('post rewards are capped per day and the share bonus is daily', () => {
  let s = newGamification();
  for (let i = 0; i < POST_REWARDS_PER_DAY + 3; i++) s = applyAction(s, { type: 'post-created' }, D1).state;
  assert.equal(s.xp, POST_REWARDS_PER_DAY * 40);
  s = applyAction(s, { type: 'post-created' }, D2).state;
  assert.equal(s.xp, (POST_REWARDS_PER_DAY + 1) * 40);
  s = applyAction(s, { type: 'share-bonus' }, D1).state;
  assert.throws(() => applyAction(s, { type: 'share-bonus' }, D1), /already/);
});

test('rank follows XP', () => {
  let s = { ...newGamification(), xp: 290 };
  s = applyAction(s, { type: 'check-in' }, D1).state;
  assert.equal(s.rankTitle, 'Reality Architect');
});
