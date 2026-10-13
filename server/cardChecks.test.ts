import assert from 'node:assert/strict';
import test from 'node:test';
import { combineFlags, describeFlags, noteQuestions } from './cardChecks';

test('JEV adds a flag only when fairly sure; the plain rules work without it', () => {
  assert.deepEqual(combineFlags('Send this to 10 people', null), ['chain']);
  assert.deepEqual(combineFlags('Praying for you', { promise: { noul: 0.9 }, luck: { noul: 0.4 } }), ['promise']);
  assert.deepEqual(combineFlags('Praying for you', { promise: { noul: 0.59 } }), []);
  assert.deepEqual(Object.keys(noteQuestions()), ['chain', 'promise', 'luck', 'curse']);
});

test('only chain letters block a card; the rest are kind suggestions', () => {
  assert.equal(describeFlags(['chain']).blocked, true);
  assert.equal(describeFlags(['luck', 'promise']).blocked, false);
  assert.match(describeFlags(['luck']).flags[0].message, /God bless you/);
});
