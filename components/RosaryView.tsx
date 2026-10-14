import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listPrayers, type PrayerView } from '../services/rosaApi';
import { MYSTERIES, MYSTERY_SETS, mysteriesFor, rosarySteps, type MysterySet } from '../shared/rosary';
import { BeadRing } from './BeadRing';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Before praying: today's Mysteries (or another set), the optional Fatima Prayer, and Begin.
const StartScreen: React.FC<{
  set: MysterySet;
  onSet: (s: MysterySet) => void;
  fatima: boolean;
  onFatima: (on: boolean) => void;
  awaiting: number | null;
  onBegin: () => void;
  onBack: () => void;
  /** "Pray a decade with me": which decade (0..4), or undefined for the whole Rosary. */
  decade?: number;
  onDecade?: (d: number) => void;
}> = ({ set, onSet, fatima, onFatima, awaiting, onBegin, onBack, decade, onDecade }) => {
  const today = mysteriesFor(new Date());
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <button onClick={onBack} className="text-marian-700 hover:text-marian-600 font-semibold">
        ← Back
      </button>
      <div className="space-y-1">
        <p className="text-gray-600">{decade !== undefined ? 'Pray a decade' : DAYS[new Date().getDay()]}</p>
        <h1 className="font-serif text-3xl text-marian-800">{MYSTERIES[set].name}</h1>
        {set === today && <p className="text-gray-600">Today's Mysteries</p>}
      </div>
      {decade === undefined ? (
        <ol className="space-y-1.5 font-serif text-xl text-ink list-decimal pl-6">
          {MYSTERIES[set].mysteries.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
      ) : (
        <div className="space-y-2">
          <p className="text-gray-700">One decade: the Mystery, an Our Father, ten Hail Marys and a Glory Be. Choose the Mystery:</p>
          {MYSTERIES[set].mysteries.map((m, i) => (
            <label key={m} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer bg-white ${i === decade ? 'border-marian-500' : 'border-marian-100'}`}>
              <input type="radio" name="decade" checked={i === decade} onChange={() => onDecade?.(i)} />
              <span className="font-serif text-lg text-ink">{m}</span>
            </label>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Pray other Mysteries instead:</p>
        <div className="flex flex-wrap gap-2">
          {MYSTERY_SETS.map((s) => (
            <button
              key={s}
              onClick={() => onSet(s)}
              className={`rounded-full px-3 py-1.5 text-sm border ${s === set ? 'bg-marian-700 text-white border-marian-700' : 'bg-white text-gray-700 border-marian-200'}`}
            >
              {MYSTERIES[s].name.replace(' Mysteries', '')}
              {s === today ? ' (today)' : ''}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-gray-700">
        <input type="checkbox" checked={fatima} onChange={(e) => onFatima(e.target.checked)} className="h-4 w-4" />
        Include the Fatima Prayer after each decade
      </label>
      {awaiting !== null && awaiting > 0 && (
        <p className="text-sm text-gray-600 rounded-xl bg-white border border-marian-100 p-3">
          {awaiting === 1
            ? "1 prayer is still awaiting review. You'll see its name at the right moment; please pray it from memory or your own prayer book."
            : `${awaiting} prayers are still awaiting review. You'll see their names at the right moment; please pray them from memory or your own prayer book.`}
        </p>
      )}
      <button onClick={onBegin} className="w-full bg-marian-700 hover:bg-marian-600 text-white font-semibold text-lg py-3.5 rounded-2xl">
        Begin
      </button>
    </div>
  );
};

// Pray the Rosary: today's Mysteries, bead by bead. Tap anywhere to move on. No sign-in needed.
export const RosaryView: React.FC<{ onBack: () => void; oneDecade?: boolean }> = ({ onBack, oneDecade }) => {
  const [set, setSet] = useState<MysterySet>(() => mysteriesFor(new Date()));
  const [fatima, setFatima] = useState(true);
  const [decade, setDecade] = useState(0);
  const [prayers, setPrayers] = useState<Map<string, PrayerView> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null); // null: not started
  const steps = useMemo(() => rosarySteps(set, { fatima, decade: oneDecade ? decade : undefined }), [set, fatima, oneDecade, decade]);

  useEffect(() => {
    listPrayers()
      .then((list) => setPrayers(new Map(list.map((p) => [p.id, p]))))
      .catch((e) => setLoadError(e.message));
  }, []);

  const finished = index !== null && index >= steps.length;
  const next = useCallback(() => setIndex((i) => (i === null ? i : Math.min(i + 1, steps.length))), [steps.length]);
  const prev = useCallback(() => setIndex((i) => (i === null ? i : Math.max(i - 1, 0))), []);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') setIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, next, prev]);

  const used = new Set(steps.flatMap((s) => (s.kind === 'prayer' ? [s.prayerId] : [])));
  const awaiting = prayers ? [...used].filter((id) => prayers.get(id)?.status !== 'reviewed').length : null;

  if (index === null) {
    return (
      <>
        {loadError && <p className="max-w-xl mx-auto mb-4 text-red-700">{loadError}</p>}
        <StartScreen
          set={set}
          onSet={setSet}
          fatima={fatima}
          onFatima={setFatima}
          awaiting={awaiting}
          onBegin={() => setIndex(0)}
          onBack={onBack}
          decade={oneDecade ? decade : undefined}
          onDecade={setDecade}
        />
      </>
    );
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  if (finished) {
    return (
      <div className="fixed inset-0 z-20 bg-cream flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in">
        <BeadRing done={steps.map((s) => s.place)} current={null} className="h-40" />
        <h1 className="font-serif text-3xl text-marian-800">Amen.</h1>
        <p className="text-lg text-gray-700">
          {oneDecade ? `You have prayed a decade: ${MYSTERIES[set].mysteries[decade]}.` : `You have prayed the ${MYSTERIES[set].name}.`}
        </p>
        <div className="flex gap-3">
          <button onClick={() => setIndex(0)} className="bg-white border border-marian-200 text-marian-800 font-semibold py-2.5 px-5 rounded-xl">
            Pray again
          </button>
          <button onClick={onBack} className="bg-marian-700 hover:bg-marian-600 text-white font-semibold py-2.5 px-5 rounded-xl">
            {oneDecade ? 'Back to the card' : 'Home'}
          </button>
        </div>
      </div>
    );
  }

  const step = steps[index];
  const prayer = step.kind === 'prayer' ? prayers?.get(step.prayerId) : undefined;

  return (
    <div
      className="fixed inset-0 z-20 bg-cream flex flex-col select-none cursor-pointer"
      onClick={next}
      role="button"
      aria-label="Continue to the next prayer"
    >
      <div className="flex items-center justify-between px-4 pt-3 text-sm text-gray-600" onClick={stop}>
        <button onClick={() => setIndex(null)} className="py-2 pr-3 font-semibold text-marian-700 whitespace-nowrap" aria-label="Stop praying">
          ✕ Stop
        </button>
        <span className="whitespace-nowrap">
          {index + 1} of {steps.length}
        </span>
        <div className="flex rounded-full border border-marian-200 overflow-hidden text-xs whitespace-nowrap" aria-label="Language">
          <span className="px-2.5 py-1 bg-marian-700 text-white">English</span>
          <span className="px-2.5 py-1 text-gray-400" title="Filipino texts are added once copied from an official CBCP source">
            Filipino (soon)
          </span>
        </div>
      </div>

      <BeadRing done={steps.slice(0, index).map((s) => s.place)} current={step.place} className="h-40 sm:h-48 mx-auto mt-2 shrink-0" />
      <p className="text-center text-sm text-gray-500">{MYSTERIES[set].name}</p>

      <div key={index} className="flex-1 overflow-y-auto px-6 pb-4 pt-3 max-w-2xl mx-auto w-full animate-fade-in">
        {step.kind === 'mystery' ? (
          <div className="text-center space-y-3 pt-6">
            <p className="text-gray-600 uppercase tracking-wide text-sm">{step.title}</p>
            <h1 className="font-serif text-4xl text-marian-800 leading-tight">{step.name}</h1>
            <p className="text-gray-600 pt-4">Take a moment to reflect on this mystery.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="font-serif text-2xl text-marian-800">{prayer?.title || '…'}</h1>
              {step.note && <span className="text-sm text-gray-500 shrink-0">{step.note}</span>}
            </div>
            {!prayers && !loadError && <p className="text-gray-500">Loading the prayers…</p>}
            {loadError && <p className="text-red-700">{loadError}</p>}
            {prayer?.status === 'reviewed' && (
              <p className="font-serif text-[1.35rem] leading-relaxed whitespace-pre-line text-ink">{prayer.text}</p>
            )}
            {prayer && prayer.status !== 'reviewed' && (
              <p className="text-lg text-gray-600 italic leading-relaxed">
                The words of this prayer are awaiting review. Please pray it from memory or your own prayer book.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 pb-5 pt-2 text-sm text-gray-500">
        <button onClick={(e) => { stop(e); prev(); }} disabled={index === 0} className="py-2 pr-4 font-semibold text-marian-700 disabled:opacity-30">
          ← Back
        </button>
        <span>Tap anywhere to continue</span>
      </div>
    </div>
  );
};
