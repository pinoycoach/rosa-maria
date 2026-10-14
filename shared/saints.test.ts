import assert from 'node:assert/strict';
import test from 'node:test';
import { SAINTS, saintNamesIn, matchSaint, unknownSaintNames, saintOfTheDay } from './saints';

test('the list starts with San Lorenzo Ruiz and San Pedro Calungsod, each with a source and a feast', () => {
  assert.deepEqual(SAINTS.map((s) => s.id), ['lorenzo-ruiz', 'pedro-calungsod']);
  for (const s of SAINTS) {
    assert.match(s.feast, /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, s.id);
    assert.ok(s.source && /^https:\/\//.test(s.sourceUrl) && s.calendar && s.about, s.id);
  }
});

test('saint names are found in a note however they are written', () => {
  assert.deepEqual(saintNamesIn('Praying to St. Jude and San Lorenzo Ruiz for you'), ['St. Jude', 'San Lorenzo Ruiz']);
  assert.deepEqual(saintNamesIn('Sta. Clara at Santo Niño, ipagdasal mo kami'), ['Sta. Clara', 'Santo Niño']);
  assert.deepEqual(saintNamesIn('Happy birthday! Stay safe.'), []);
});

test('listed saints match by any of their names; others are flagged', () => {
  assert.equal(matchSaint('San Lorenzo Ruiz')?.id, 'lorenzo-ruiz');
  assert.equal(matchSaint('Saint Lawrence Ruiz')?.id, 'lorenzo-ruiz');
  assert.equal(matchSaint('St. Pedro Calungsod')?.id, 'pedro-calungsod');
  assert.equal(matchSaint('San Pedro'), null); // could be Saint Peter the Apostle: a person checks
  assert.equal(matchSaint('St. Jude'), null);
  assert.deepEqual(unknownSaintNames('St. Jude and San Lorenzo Ruiz, pray for us. Also Saint Bogus Maximus.'), ['St. Jude', 'Saint Bogus Maximus']);
});

test('saint of the day, or the next feast coming up', () => {
  const list = [{ id: 'a', feast: '04-02' }, { id: 'b', feast: '09-28' }];
  assert.deepEqual(saintOfTheDay(list, new Date(2026, 8, 28)).today.map((s) => s.id), ['b']);
  assert.equal(saintOfTheDay(list, new Date(2026, 8, 28)).next, null);
  assert.equal(saintOfTheDay(list, new Date(2026, 9, 13)).next?.id, 'a'); // after September: next year's April
  assert.equal(saintOfTheDay(list, new Date(2026, 4, 1)).next?.id, 'b');
  assert.equal(saintOfTheDay([], new Date()).next, null);
});
