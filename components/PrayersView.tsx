import React, { useEffect, useState } from 'react';
import { listPrayers, type PrayerView } from '../services/rosaApi';

// "The prayers": every prayer of the Rosary. Its words appear only once a person has checked them against the
// Church's approved text; until then it says so honestly.
export const PrayersView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prayers, setPrayers] = useState<PrayerView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPrayers().then(setPrayers).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={onBack} className="text-marian-700 hover:text-marian-600 font-semibold">
        ← Back
      </button>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-marian-800">The prayers of the Rosary</h1>
        <p className="text-gray-700 leading-relaxed">
          Every prayer here is copied from the Church's approved text and checked word for word by a person before it
          appears. None is written or changed by AI.
        </p>
      </div>
      {error && <p className="text-red-700">{error}</p>}
      {!prayers && !error && <p className="text-gray-600">Loading…</p>}
      <ul className="space-y-4">
        {(prayers || []).map((p) => (
          <li key={p.id} className="rounded-2xl bg-white border border-marian-100 p-5 space-y-2">
            <h2 className="font-serif text-2xl text-marian-800">{p.title}</h2>
            {p.status === 'reviewed' ? (
              <>
                <p className="font-serif text-xl leading-relaxed whitespace-pre-line text-ink">{p.text}</p>
                <p className="text-sm text-gray-500">
                  Source: {p.source} · checked by {p.reviewedBy} on {p.reviewedOn}
                </p>
              </>
            ) : (
              <p className="text-gray-600 italic">Awaiting review. It will appear once a person has checked it against {p.source}.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
