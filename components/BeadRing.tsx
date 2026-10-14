import React from 'react';
import type { BeadPlace } from '../shared/rosary';

// A picture of the Rosary: 5 decades in a loop, joined at the medal, with the pendant and crucifix below.
// Beads already prayed are filled; the current one glows.

const key = (p: BeadPlace) => {
  switch (p.on) {
    case 'pendant-small':
      return `ps${p.index}`;
    case 'decade-large':
      return `dl${p.decade}`;
    case 'decade-small':
      return `ds${p.decade}-${p.index}`;
    default:
      return p.on;
  }
};

const CX = 100;
const CY = 80;
const R = 66;
const SLOTS = 58; // 55 beads around the loop, with room for the medal at the bottom
const around = (slot: number) => {
  const a = Math.PI / 2 + (slot * 2 * Math.PI) / SLOTS;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
};

type Bead = { id: string; x: number; y: number; r: number };
const BEADS: Bead[] = [];
for (let d = 0; d < 5; d++) {
  const big = around(2 + d * 11);
  BEADS.push({ id: `dl${d}`, ...big, r: 4 });
  for (let i = 0; i < 10; i++) BEADS.push({ id: `ds${d}-${i}`, ...around(3 + d * 11 + i), r: 2.7 });
}
const MEDAL = { x: CX, y: CY + R };
[178, 168, 158].forEach((y, i) => BEADS.push({ id: `ps${i}`, x: CX, y: y + 2, r: 2.7 }));
BEADS.push({ id: 'pendant-large', x: CX, y: 194, r: 4 });

export const BeadRing: React.FC<{ done: BeadPlace[]; current: BeadPlace | null; className?: string }> = ({ done, current, className }) => {
  const doneKeys = new Set(done.map(key));
  const now = current ? key(current) : '';
  const fill = (id: string) => (id === now ? '#cf5a77' : doneKeys.has(id) ? '#26437e' : '#ffffff');
  const stroke = (id: string) => (id === now ? '#b3445f' : doneKeys.has(id) ? '#26437e' : '#8fade0');
  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label="Your place on the Rosary">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#dfe8f8" strokeWidth={1.2} />
      <line x1={CX} y1={MEDAL.y} x2={CX} y2={205} stroke="#dfe8f8" strokeWidth={1.2} />
      {BEADS.map((b) => (
        <circle key={b.id} cx={b.x} cy={b.y} r={b.id === now ? b.r + 1.4 : b.r} fill={fill(b.id)} stroke={stroke(b.id)} strokeWidth={1}>
          {b.id === now && <animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite" />}
        </circle>
      ))}
      <ellipse cx={MEDAL.x} cy={MEDAL.y} rx={5} ry={6.5} fill={fill('medal')} stroke={stroke('medal')} strokeWidth={1.2} />
      <g stroke={now === 'crucifix' ? '#cf5a77' : doneKeys.has('crucifix') ? '#26437e' : '#8fade0'} strokeWidth={3} strokeLinecap="round">
        <line x1={CX} y1={206} x2={CX} y2={234} />
        <line x1={CX - 8} y1={214} x2={CX + 8} y2={214} />
      </g>
    </svg>
  );
};
