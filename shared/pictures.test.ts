import assert from 'node:assert/strict';
import test from 'node:test';
import { checkPicturePrompt, pictureIsSafe, ownsPicture, PICTURE_IDEAS, pictureInstruction } from './pictures';

test('holy figures are never drawn by AI, however they are written', () => {
  for (const p of ['Jesus in a garden', 'Mama Mary with roses', 'the Santo Niño', 'St. Jude', 'an angel over the sea', 'Our Lady of Manaoag', 'Birhen ng Antipolo', 'Sacred Heart']) {
    const r = checkPicturePrompt(p);
    assert.ok(!r.ok && r.reason === 'holy', p);
  }
});

test('no people either; places and flowers are welcome', () => {
  for (const p of ['my lola smiling', 'a baby sleeping', 'a family at the beach', 'portrait of a nurse']) {
    const r = checkPicturePrompt(p);
    assert.ok(!r.ok && r.reason === 'people', p);
  }
  for (const p of [...PICTURE_IDEAS, 'a rosary on a wooden table', 'mountains at dusk in Baguio', 'a lighthouse in the rain']) {
    assert.deepEqual(checkPicturePrompt(p), { ok: true }, p);
  }
  assert.equal(checkPicturePrompt('   ').ok, false);
  assert.match(pictureInstruction('roses'), /no people/);
});

test('a picture is offered only when the check clearly found nothing wrong', () => {
  assert.equal(pictureIsSafe({ people: false, holyFigure: false, text: false, inappropriate: false }), true);
  assert.equal(pictureIsSafe({ people: true, holyFigure: false, text: false, inappropriate: false }), false);
  assert.equal(pictureIsSafe({ people: false, holyFigure: false }), false); // incomplete answer
  assert.equal(pictureIsSafe(null), false);
});

test('a card can only use pictures its sender made', () => {
  const uid = 'a'.repeat(32);
  assert.ok(ownsPicture(`pictures/${uid}/0123456789abcdef.jpg`, uid));
  assert.ok(!ownsPicture(`pictures/${'b'.repeat(32)}/0123456789abcdef.jpg`, uid));
  assert.ok(!ownsPicture(`pictures/${uid}/../x.jpg`, uid));
});
