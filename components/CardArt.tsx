import React from 'react';
import type { DesignId } from '../shared/cards';

// The six card designs: soft colours and simple drawn flowers, stars, a sunrise and a candle.
// Never AI-made pictures, and never images of Mary, Jesus or the saints.

const THEMES: Record<DesignId, { bg: string; ink: string; accent: string }> = {
  marian: { bg: 'linear-gradient(160deg, #f1f5fc 0%, #dfe8f8 100%)', ink: '#203866', accent: '#3f67b4' },
  rose: { bg: 'linear-gradient(160deg, #fdf3f5 0%, #fbe5ea 100%)', ink: '#782f42', accent: '#cf5a77' },
  sampaguita: { bg: 'linear-gradient(160deg, #f6faf3 0%, #e6f0df 100%)', ink: '#2f4a2a', accent: '#5f8a4f' },
  dawn: { bg: 'linear-gradient(170deg, #fff8ea 0%, #fde8c8 100%)', ink: '#6b4316', accent: '#d39b3f' },
  lily: { bg: 'linear-gradient(160deg, #fdfbf6 0%, #f1ece0 100%)', ink: '#3f3a2e', accent: '#a8956a' },
  candle: { bg: 'linear-gradient(170deg, #f5f2ee 0%, #e4ded6 100%)', ink: '#3b3530', accent: '#c9893a' },
};

const Flower: React.FC<{ x: number; y: number; r: number; petal: string; centre: string; petals?: number; rot?: number }> = ({
  x, y, r, petal, centre, petals = 5, rot = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {Array.from({ length: petals }, (_, i) => (
      <ellipse key={i} cx={0} cy={-r * 0.62} rx={r * 0.42} ry={r * 0.62} fill={petal} transform={`rotate(${(360 / petals) * i})`} />
    ))}
    <circle r={r * 0.28} fill={centre} />
  </g>
);

const Rose: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#eda2b3" />
    <circle r={r * 0.72} fill="#e07b93" />
    <path d={`M ${-r * 0.45} 0 a ${r * 0.45} ${r * 0.45} 0 1 1 ${r * 0.9} 0`} fill="none" stroke="#b3445f" strokeWidth={r * 0.12} />
    <circle r={r * 0.25} fill="#cf5a77" />
    <ellipse cx={r * 1.15} cy={r * 0.7} rx={r * 0.55} ry={r * 0.25} fill="#7f9f6f" transform={`rotate(30 ${r * 1.15} ${r * 0.7})`} />
  </g>
);

const Ornament: React.FC<{ design: DesignId }> = ({ design }) => {
  switch (design) {
    case 'marian':
      return (
        <g fill="#3f67b4" opacity={0.75}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={150 + 46 * Math.cos(a)} cy={58 + 46 * Math.sin(a)} r={i % 3 === 0 ? 3.6 : 2.2} />;
          })}
          <path d="M150 42 l4.5 10 11 1 -8.3 7.3 2.5 10.7 -9.7 -5.7 -9.7 5.7 2.5 -10.7 -8.3 -7.3 11 -1z" />
        </g>
      );
    case 'rose':
      return (
        <g>
          <Rose x={118} y={62} r={16} />
          <Rose x={152} y={44} r={20} />
          <Rose x={186} y={64} r={15} />
        </g>
      );
    case 'sampaguita':
      return (
        <g>
          <ellipse cx={130} cy={74} rx={20} ry={7} fill="#7f9f6f" transform="rotate(-25 130 74)" />
          <ellipse cx={172} cy={74} rx={20} ry={7} fill="#7f9f6f" transform="rotate(25 172 74)" />
          <Flower x={126} y={52} r={13} petal="#ffffff" centre="#f2e6b8" petals={8} />
          <Flower x={152} y={40} r={16} petal="#ffffff" centre="#f2e6b8" petals={8} rot={12} />
          <Flower x={178} y={54} r={12} petal="#ffffff" centre="#f2e6b8" petals={8} rot={25} />
        </g>
      );
    case 'dawn':
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI + (i / 8) * Math.PI;
            return <line key={i} x1={150 + 30 * Math.cos(a)} y1={80 + 30 * Math.sin(a)} x2={150 + 52 * Math.cos(a)} y2={80 + 52 * Math.sin(a)} stroke="#e7b86a" strokeWidth={3} strokeLinecap="round" />;
          })}
          <path d="M122 80 a28 28 0 0 1 56 0z" fill="#f2c879" />
          <line x1={92} y1={81} x2={208} y2={81} stroke="#d39b3f" strokeWidth={2} />
        </g>
      );
    case 'lily':
      return (
        <g>
          <path d="M150 88 C 150 70, 140 56, 128 48 M150 88 C 150 66, 158 50, 172 42" stroke="#7f9f6f" strokeWidth={2.5} fill="none" />
          <Flower x={126} y={46} r={14} petal="#ffffff" centre="#e5c766" petals={6} rot={10} />
          <Flower x={174} y={40} r={16} petal="#ffffff" centre="#e5c766" petals={6} rot={-8} />
        </g>
      );
    case 'candle':
      return (
        <g>
          <circle cx={150} cy={36} r={24} fill="#f7dca4" opacity={0.45} />
          <path d="M150 20 C 158 32, 156 42, 150 46 C 144 42, 142 32, 150 20z" fill="#e9a84a" />
          <path d="M150 30 C 153 36, 152 41, 150 43 C 148 41, 147 36, 150 30z" fill="#fff4d6" />
          <rect x={140} y={48} width={20} height={42} rx={3} fill="#fbf7f1" stroke="#cdbfae" />
        </g>
      );
  }
};

export const CardArt: React.FC<{
  design: DesignId;
  greeting: string;
  toName?: string;
  fromName?: string;
  animate?: boolean;
  className?: string;
  /** The sender's own photo or an AI picture, shown instead of the drawn design. */
  picture?: { url: string; kind: 'photo' | 'ai' } | null;
}> = ({ design, greeting, toName, fromName, animate, className = '', picture }) => {
  const t = THEMES[design];
  if (picture) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl shadow-md aspect-[5/4] flex flex-col items-center justify-end text-center px-6 pb-7 text-white ${animate ? 'animate-card-in' : ''} ${className}`}
      >
        <img src={picture.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        {picture.kind === 'ai' && (
          <span className="absolute top-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white/90">Picture made with AI</span>
        )}
        <div className="relative">
          {toName && <p className="text-base opacity-90">For {toName}</p>}
          <p className="font-serif text-[1.65rem] sm:text-3xl leading-tight drop-shadow">{greeting}</p>
          {fromName && <p className="mt-1 text-sm opacity-90">with love, {fromName}</p>}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-3xl shadow-md border border-white/70 aspect-[5/4] flex flex-col items-center justify-end text-center px-6 pb-7 ${animate ? 'animate-card-in' : ''} ${className}`}
      style={{ background: t.bg, color: t.ink }}
    >
      <svg viewBox="0 0 300 100" className={`absolute top-5 left-0 w-full h-[46%] ${animate ? 'animate-float' : ''}`} aria-hidden="true">
        <Ornament design={design} />
      </svg>
      {toName && <p className="text-base opacity-80">For {toName}</p>}
      <p className="font-serif text-[1.65rem] sm:text-3xl leading-tight">{greeting}</p>
      {fromName && <p className="mt-1 text-sm opacity-80">with love, {fromName}</p>}
      <div className="absolute bottom-0 inset-x-0 h-1.5" style={{ background: t.accent, opacity: 0.35 }} />
    </div>
  );
};
