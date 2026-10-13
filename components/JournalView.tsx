import React, { useEffect, useState } from 'react';
import { listJournal, deleteJournalEntry, type JournalEntry } from '../services/inspireApi';

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** "WOOP · Wish: …" entries come from the series; everything else is a reflection. */
const split = (e: JournalEntry) => {
  const m = /^WOOP · ([^:]+): ([\s\S]*)$/.exec(e.feeling);
  return m ? { label: `WOOP · ${m[1]}`, text: m[2] } : { label: 'Reflection', text: e.feeling };
};

// Everything the person chose to save: reflections and WOOP answers, newest first.
export const JournalView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    listJournal().then(setEntries).catch((e) => setError(e.message));
  }, []);

  const remove = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      setEntries((list) => (list || []).filter((e) => e.id !== id));
      setConfirming(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const days: Array<[string, JournalEntry[]]> = [];
  for (const e of entries || []) {
    const d = dayLabel(e.createdAt);
    const last = days[days.length - 1];
    if (last && last[0] === d) last[1].push(e);
    else days.push([d, [e]]);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 print:max-w-none print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 font-semibold">← Back</button>
        {!!entries?.length && (
          <button onClick={() => window.print()} className="text-sm bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg">
            🖨️ Print / Save as PDF
          </button>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white print:text-black">My journal</h1>
        <p className="text-sm text-gray-400 mt-1 print:hidden">
          Only you can see this. Tip: copy today's entry into a paper notebook too. Writing by hand slows you down in a good way.
        </p>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {entries === null && !error && <p className="text-sm text-gray-400">Loading…</p>}
      {entries?.length === 0 && (
        <p className="rounded-xl bg-gray-800 border border-gray-700 p-5 text-gray-300">
          Nothing here yet. Save a reflection from “How are you today?” on the Feed, or your WOOP answers in Series &amp; Manifest.
        </p>
      )}
      {days.map(([day, list]) => (
        <section key={day} className="space-y-3 print:break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 print:text-black">{day}</h2>
          {list.map((e) => {
            const { label, text } = split(e);
            return (
              <article key={e.id} className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-2 print:bg-white print:border-gray-400">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-300 print:text-black">
                    {label} · {timeLabel(e.createdAt)}
                  </span>
                  <span className="print:hidden">
                    {confirming === e.id ? (
                      <span className="flex gap-2 text-xs">
                        <button onClick={() => remove(e.id)} className="text-red-300 underline">Delete</button>
                        <button onClick={() => setConfirming(null)} className="text-gray-400 underline">Keep</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirming(e.id)} className="text-xs text-gray-500 hover:text-gray-300 underline" aria-label="Delete entry">
                        Delete
                      </button>
                    )}
                  </span>
                </div>
                <p className="text-white whitespace-pre-line print:text-black">{text}</p>
                {e.reply && <p className="text-gray-300 text-sm whitespace-pre-line print:text-black">{e.reply}</p>}
                {e.pieces.length > 0 && (
                  <ul className="space-y-1">
                    {e.pieces.map((p) => (
                      <li key={p.id} className="text-sm text-gray-400 print:text-black">
                        “{p.text}” <span className="text-indigo-300 print:text-black">— {p.author}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
};
