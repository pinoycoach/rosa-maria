import React, { useState } from 'react';
import { reflect, saveToJournal, type ReflectResult } from '../services/inspireApi';
import type { UserGamification } from '../types';
import { BookOpen, Check, Sparkles } from './icons/LucideIcons';

interface ReflectCardProps {
  onProgress: (gamification: UserGamification, message?: string) => void;
}

// "How are you today?" — a short, kind reply built only from the curated library.
export const ReflectCard: React.FC<ReflectCardProps> = ({ onProgress }) => {
  const [feeling, setFeeling] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReflectResult | null>(null);
  const [asked, setAsked] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = feeling.trim();
    if (text.length < 3 || busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const r = await reflect(text);
      setResult(r);
      setAsked(text);
      if ('gamification' in r && r.gamification) onProgress(r.gamification, r.checkInMessage);
    } catch (err: any) {
      setError(err.message || 'Could not reflect right now.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!result || !('pieces' in result)) return;
    try {
      await saveToJournal(asked, result.reply, result.pieces.map((p) => p.id));
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Could not save.');
    }
  };

  const startOver = () => {
    setResult(null);
    setFeeling('');
    setSaved(false);
    setError(null);
  };

  return (
    <section className="mb-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-gray-800 to-gray-900 p-5 sm:p-6 shadow-lg">
      {!result ? (
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="reflect" className="flex items-center gap-2 text-lg font-bold text-white">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            How are you today?
          </label>
          <textarea
            id="reflect"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="A sentence or two is enough. English, Tagalog or Taglish."
            className="w-full rounded-xl bg-gray-900 border border-gray-700 p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              A short AI reply built from a hand-picked library of real, credited words. Not therapy, no predictions.
            </p>
            <button
              type="submit"
              disabled={busy || feeling.trim().length < 3}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-5 rounded-xl"
            >
              {busy ? 'Finding words…' : 'Reflect'}
            </button>
          </div>
        </form>
      ) : 'resources' in result ? (
        <div className="space-y-4" role="alert">
          <p className="text-lg text-white font-semibold leading-relaxed">{result.message}</p>
          <ul className="space-y-2">
            {result.resources.map((r) => (
              <li key={r.name} className="rounded-xl bg-gray-900 border border-gray-700 p-3">
                <span className="block text-sm text-gray-400">{r.name}</span>
                <span className="block text-white font-semibold">{r.contact}</span>
              </li>
            ))}
          </ul>
          <button onClick={startOver} className="text-sm text-indigo-300 underline">
            Back
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400 italic">“{asked}”</p>
          {result.reply ? (
            <p className="text-lg text-white leading-relaxed whitespace-pre-line">{result.reply}</p>
          ) : (
            <p className="text-lg text-white leading-relaxed">Here are a few words for today.</p>
          )}
          <ul className="space-y-3">
            {result.pieces.map((p) => (
              <li key={p.id} className="rounded-xl bg-gray-900/70 border border-gray-700 p-4">
                <p className="text-gray-100">“{p.text}”</p>
                {p.translation && <p className="text-sm text-gray-400 mt-1">{p.translation}</p>}
                <p className="text-sm text-indigo-300 mt-2">— {p.author}{p.source ? `, ${p.source}` : ''}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              disabled={saved}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-70 text-white font-semibold py-2 px-4 rounded-xl"
            >
              {saved ? <Check className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              {saved ? 'Saved to your journal' : 'Save to my journal'}
            </button>
            <button onClick={startOver} className="text-sm text-indigo-300 underline">
              Reflect again
            </button>
          </div>
          <p className="text-xs text-gray-500">
            AI-written from the curated library. It isn't stored unless you save it.
          </p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
};
