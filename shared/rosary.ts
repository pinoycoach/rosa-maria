// The Rosary's order, bead by bead, and which Mysteries are prayed on which day. Pure rules only, so they
// can be unit-tested. The order and the Mysteries follow docs/rosary-basics.md sections 2 and 3.

export type MysterySet = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';

export const MYSTERIES: Record<MysterySet, { name: string; mysteries: string[] }> = {
  joyful: {
    name: 'Joyful Mysteries',
    mysteries: ['The Annunciation', 'The Visitation', 'The Nativity', 'The Presentation in the Temple', 'The Finding of Jesus in the Temple'],
  },
  sorrowful: {
    name: 'Sorrowful Mysteries',
    mysteries: ['The Agony in the Garden', 'The Scourging at the Pillar', 'The Crowning with Thorns', 'The Carrying of the Cross', 'The Crucifixion'],
  },
  glorious: {
    name: 'Glorious Mysteries',
    mysteries: ['The Resurrection', 'The Ascension', 'The Descent of the Holy Spirit', 'The Assumption', 'The Coronation of Mary'],
  },
  luminous: {
    name: 'Luminous Mysteries',
    mysteries: ['The Baptism of the Lord', 'The Wedding at Cana', 'The Proclamation of the Kingdom', 'The Transfiguration', 'The Institution of the Eucharist'],
  },
};

export const MYSTERY_SETS = Object.keys(MYSTERIES) as MysterySet[];

/** Sunday = 0 … Saturday = 6 (as Date.getDay()). */
const BY_WEEKDAY: MysterySet[] = ['glorious', 'joyful', 'sorrowful', 'glorious', 'luminous', 'sorrowful', 'joyful'];

/** Today's Mysteries, by the person's own local day. */
export const mysteriesFor = (date: Date): MysterySet => BY_WEEKDAY[date.getDay()];

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

/**
 * Where a step sits on the beads. The loop has 5 decades of 1 large + 10 small beads, joined at the centre
 * medal; the pendant has the crucifix, 1 large bead and 3 small beads.
 */
export type BeadPlace =
  | { on: 'crucifix' }
  | { on: 'pendant-large' }
  | { on: 'pendant-small'; index: number } // 0..2
  | { on: 'medal' }
  | { on: 'decade-large'; decade: number } // 0..4
  | { on: 'decade-small'; decade: number; index: number }; // index 0..9

export type RosaryStep =
  | { kind: 'prayer'; prayerId: string; place: BeadPlace; note?: string }
  | { kind: 'mystery'; set: MysterySet; decade: number; title: string; name: string; place: BeadPlace };

/** One decade (0..4): announce the Mystery, Our Father, 10 Hail Marys, Glory Be (and Fatima Prayer). */
function decadeSteps(set: MysterySet, d: number, fatima: boolean): RosaryStep[] {
  const name = MYSTERIES[set].mysteries[d];
  const title = `The ${ORDINALS[d]} ${MYSTERIES[set].name.replace(/ies$/, 'y')}`;
  const steps: RosaryStep[] = [
    { kind: 'mystery', set, decade: d, title, name, place: { on: 'decade-large', decade: d } },
    { kind: 'prayer', prayerId: 'our-father', place: { on: 'decade-large', decade: d } },
  ];
  for (let i = 0; i < 10; i++) {
    steps.push({ kind: 'prayer', prayerId: 'hail-mary', place: { on: 'decade-small', decade: d, index: i }, note: `${i + 1} of 10` });
  }
  const end: BeadPlace = { on: 'decade-small', decade: d, index: 9 };
  steps.push({ kind: 'prayer', prayerId: 'glory-be', place: end });
  if (fatima) steps.push({ kind: 'prayer', prayerId: 'fatima-prayer', place: end, note: 'Optional' });
  return steps;
}

/**
 * Every step of one Rosary of the given Mysteries, in order. With `decade` (0..4), just that one decade,
 * opened and closed with the Sign of the Cross ("Pray a decade with me").
 */
export function rosarySteps(set: MysterySet, opts: { fatima?: boolean; decade?: number } = {}): RosaryStep[] {
  const fatima = opts.fatima ?? true;
  if (opts.decade !== undefined) {
    const d = Math.max(0, Math.min(4, Math.floor(opts.decade)));
    return [
      { kind: 'prayer', prayerId: 'sign-of-the-cross', place: { on: 'crucifix' } },
      ...decadeSteps(set, d, fatima),
      { kind: 'prayer', prayerId: 'sign-of-the-cross', place: { on: 'crucifix' } },
    ];
  }
  const steps: RosaryStep[] = [
    { kind: 'prayer', prayerId: 'sign-of-the-cross', place: { on: 'crucifix' } },
    { kind: 'prayer', prayerId: 'apostles-creed', place: { on: 'crucifix' } },
    { kind: 'prayer', prayerId: 'our-father', place: { on: 'pendant-large' } },
  ];
  const virtues = ['for faith', 'for hope', 'for charity'];
  for (let i = 0; i < 3; i++) {
    steps.push({ kind: 'prayer', prayerId: 'hail-mary', place: { on: 'pendant-small', index: i }, note: `${i + 1} of 3 · ${virtues[i]}` });
  }
  steps.push({ kind: 'prayer', prayerId: 'glory-be', place: { on: 'medal' } });
  for (let d = 0; d < 5; d++) steps.push(...decadeSteps(set, d, fatima));
  steps.push({ kind: 'prayer', prayerId: 'hail-holy-queen', place: { on: 'medal' } });
  steps.push({ kind: 'prayer', prayerId: 'rosary-closing-prayer', place: { on: 'medal' } });
  steps.push({ kind: 'prayer', prayerId: 'sign-of-the-cross', place: { on: 'crucifix' } });
  return steps;
}
