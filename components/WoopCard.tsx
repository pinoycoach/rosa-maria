import React, { useEffect, useState } from 'react';
import type { SeriesEpisode } from '../types';
import { saveToJournal } from '../services/inspireApi';

const STEP_LABEL: Record<NonNullable<SeriesEpisode['woop']>['step'], string> = {
  wish: 'Wish',
  outcome: 'Outcome',
  obstacle: 'Obstacle',
  plan: 'Plan (if-then)',
  practice: 'Practice',
  review: 'Review',
};

// One WOOP step for this episode: the prompt, an example, a box to answer, and "save to my journal".
export const WoopCard: React.FC<{ woop: NonNullable<SeriesEpisode['woop']> }> = ({ woop }) => {
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnswer('');
    setSaved(false);
    setError(null);
  }, [woop.prompt]);

  const save = async () => {
    setError(null);
    try {
      await saveToJournal(`WOOP · ${STEP_LABEL[woop.step]}: ${answer.trim()}`, null, []);
      setSaved(true);
    } catch (e: any) {
      setError(e.message || 'Could not save.');
    }
  };

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-amber-400/30 text-left text-xs space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">🎯 Your WOOP · {STEP_LABEL[woop.step]}</div>
      <p className="text-gray-100">{woop.prompt}</p>
      <p className="text-gray-400 italic">e.g. {woop.example}</p>
      <textarea
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setSaved(false);
        }}
        rows={2}
        maxLength={400}
        aria-label={`Your ${STEP_LABEL[woop.step]}`}
        className="w-full rounded-lg bg-gray-900/80 border border-gray-700 p-2 text-gray-100 text-xs"
      />
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={save}
          disabled={!answer.trim() || saved}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-1.5 px-3 rounded-lg"
        >
          {saved ? 'Saved to your journal' : 'Save to my journal'}
        </button>
        <span className="text-[10px] text-gray-500">WOOP by Dr. Gabriele Oettingen, NYU</span>
      </div>
      {error && <p className="text-red-300">{error}</p>}
    </div>
  );
};
