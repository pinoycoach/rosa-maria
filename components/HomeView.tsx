import React from 'react';

export type Door = 'rosary' | 'cards';

const DOORS: Array<{ id: Door; title: string; text: string; tone: string }> = [
  {
    id: 'rosary',
    title: 'Pray the Rosary',
    text: "A calm, bead-by-bead guide, with today's Mysteries chosen for you.",
    tone: 'bg-marian-700 hover:bg-marian-600 text-white',
  },
  {
    id: 'cards',
    title: 'Send a prayer card',
    text: 'Choose a gentle card and a prayer, add a note, and send it by Messenger, Viber or text.',
    tone: 'bg-white hover:bg-rosa-50 text-ink border border-rosa-200',
  },
];

// The home page: two doors.
export const HomeView: React.FC<{ onOpen: (door: Door) => void; onPrayers: () => void }> = ({ onOpen, onPrayers }) => (
  <div className="space-y-8 animate-fade-in">
    <div className="text-center space-y-2 pt-2">
      <h1 className="font-serif text-3xl sm:text-4xl text-marian-800">Welcome. Let us pray.</h1>
      <p className="text-gray-600">Free to pray, always. For families here and at home.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {DOORS.map((d) => (
        <button
          key={d.id}
          onClick={() => onOpen(d.id)}
          className={`text-left rounded-2xl p-6 shadow-sm transition-colors ${d.tone}`}
        >
          <span className="block font-serif text-2xl">{d.title}</span>
          <span className="block mt-3 leading-relaxed opacity-90">{d.text}</span>
        </button>
      ))}
    </div>
    <p className="text-center">
      <button onClick={onPrayers} className="text-marian-700 hover:text-marian-600 underline underline-offset-4">
        Read the prayers of the Rosary
      </button>
    </p>
  </div>
);

const SOON: Record<Door, { title: string; text: string }> = {
  rosary: {
    title: 'Pray the Rosary',
    text: "The guided Rosary is being prepared. Every prayer in it is copied from the Church's approved text and checked by a person before it appears here, so it will come a little later.",
  },
  cards: {
    title: 'Send a prayer card',
    text: "Prayer cards are being prepared. They'll only ever carry prayers that a person has checked against the Church's approved text.",
  },
};

// Until each part is built: an honest note, never a guessed prayer.
export const ComingSoonView: React.FC<{ door: Door; onBack: () => void }> = ({ door, onBack }) => (
  <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
    <button onClick={onBack} className="text-marian-700 hover:text-marian-600 font-semibold">
      ← Back
    </button>
    <h1 className="font-serif text-3xl text-marian-800">{SOON[door].title}</h1>
    <p className="text-lg leading-relaxed text-gray-700">{SOON[door].text}</p>
    <p className="text-gray-500">Thank you for waiting.</p>
  </div>
);
