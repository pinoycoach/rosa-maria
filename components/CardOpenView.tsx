import React, { useEffect, useState } from 'react';
import { openCard, type CardView } from '../services/rosaApi';
import { occasionById, type DesignId } from '../shared/cards';
import { CardArt } from './CardArt';

// What the person who receives a card sees: the card, the sender's note, the prayer, and two invitations.
export const CardOpenView: React.FC<{ id: string; onPrayDecade: () => void; onSendBack: (toName: string) => void }> = ({ id, onPrayDecade, onSendBack }) => {
  const [card, setCard] = useState<CardView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    openCard(id).then(setCard).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto space-y-3 text-center pt-10">
        <h1 className="font-serif text-3xl text-marian-800">Card not found</h1>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }
  if (!card) return <p className="text-center text-gray-600 pt-10">Opening your card…</p>;

  const greeting = occasionById(card.occasion)?.greeting || 'A prayer for you';
  const prayer = card.prayer;
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <CardArt design={card.design as DesignId} greeting={greeting} toName={card.toName} fromName={card.fromName} picture={card.picture} animate />

      <div className="space-y-6 animate-fade-in-late">
        {card.note && (
          <section className="rounded-2xl bg-white border border-marian-100 p-5 space-y-1">
            <p className="text-sm text-gray-500">A note from {card.fromName || 'the sender'}</p>
            <p className="text-lg leading-relaxed whitespace-pre-line text-ink">{card.note}</p>
          </section>
        )}

        {prayer && (
          <section className="rounded-2xl bg-white border border-marian-100 p-5 space-y-2">
            <h2 className="font-serif text-2xl text-marian-800">{prayer.title}</h2>
            {prayer.status === 'reviewed' ? (
              <>
                <p className="font-serif text-xl leading-relaxed whitespace-pre-line text-ink">{prayer.text}</p>
                <p className="text-sm text-gray-500">Source: {prayer.source}</p>
              </>
            ) : (
              <p className="text-gray-600 italic">This prayer is being checked again against the Church's approved text.</p>
            )}
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={onPrayDecade} className="bg-marian-700 hover:bg-marian-600 text-white font-semibold py-3.5 rounded-2xl">
            Pray a decade with me
          </button>
          <button onClick={() => onSendBack(card.fromName)} className="bg-white border border-rosa-200 hover:bg-rosa-50 text-ink font-semibold py-3.5 rounded-2xl">
            Send one back
          </button>
        </div>
        <p className="text-center text-xs text-gray-500">Rosa Maria · free prayer cards and a guided Rosary</p>
      </div>
    </div>
  );
};
