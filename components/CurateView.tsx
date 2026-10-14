import React, { useCallback, useEffect, useState } from 'react';
import { deskPrayers, getCuratorCode, markReviewed, setCuratorCode, undoReview, type DeskPrayer } from '../services/rosaApi';
import { CuratorBeta } from './CuratorBeta';
import { SaintsDesk } from './SaintsDesk';

interface CurateViewProps {
  onBack: () => void;
}

const REVIEWER_KEY = 'rosa.reviewer';
const savedReviewer = () => {
  try {
    return localStorage.getItem(REVIEWER_KEY) || '';
  } catch {
    return '';
  }
};

// One prayer on the desk: its words, its source, and the sign-off.
const PrayerReviewCard: React.FC<{ prayer: DeskPrayer; reviewer: string; onChanged: (p: DeskPrayer) => void }> = ({ prayer, reviewer, onChanged }) => {
  const [compared, setCompared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (fn: () => Promise<DeskPrayer>) => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await fn());
      setCompared(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reviewed = prayer.status === 'reviewed';
  return (
    <li className={`rounded-2xl bg-white border p-5 space-y-3 ${reviewed ? 'border-emerald-200' : 'border-marian-100'}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-serif text-2xl text-marian-800">{prayer.title}</h2>
        {reviewed ? (
          <span className="rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-0.5 text-sm">
            Checked by {prayer.reviewedBy} on {prayer.reviewedOn}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 text-amber-800 px-2.5 py-0.5 text-sm">Awaiting review</span>
        )}
      </div>
      {prayer.changedSinceReview && (
        <p className="text-sm text-amber-800">The words changed after an earlier sign-off, so it needs checking again.</p>
      )}
      <p className="font-serif text-lg leading-relaxed whitespace-pre-line text-ink">{prayer.text}</p>
      <p className="text-sm text-gray-600">
        Check against: <b>{prayer.source}</b> ·{' '}
        <a href={prayer.sourceUrl} target="_blank" rel="noreferrer" className="text-marian-700 underline">
          open the source
        </a>
      </p>
      {reviewed ? (
        <button onClick={() => act(() => undoReview(prayer))} disabled={busy} className="text-sm text-gray-600 underline disabled:opacity-50">
          Undo this sign-off
        </button>
      ) : (
        <div className="space-y-3 rounded-xl bg-marian-50 p-3">
          <label className="flex items-start gap-2 text-ink">
            <input type="checkbox" checked={compared} onChange={(e) => setCompared(e.target.checked)} className="mt-1.5 h-4 w-4" />
            <span>
              I compared these words, one by one, with the source above, and they match exactly (including punctuation).
            </span>
          </label>
          <button
            onClick={() => act(() => markReviewed(prayer, reviewer))}
            disabled={busy || !compared || !reviewer.trim()}
            className="bg-marian-700 hover:bg-marian-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg"
          >
            {busy ? 'Saving…' : 'Sign off this prayer'}
          </button>
          {!reviewer.trim() && <p className="text-sm text-gray-600">Write your name at the top first.</p>}
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </li>
  );
};

// The review desk (/#curate): a person checks each prayer against its source and signs it off.
// Nothing is shown to visitors until then. Prayers can't be edited here: their words live in the code.
export const CurateView: React.FC<CurateViewProps> = ({ onBack }) => {
  const [code, setCode] = useState(getCuratorCode());
  const [codeInput, setCodeInput] = useState('');
  const [prayers, setPrayers] = useState<DeskPrayer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<'prayers' | 'saints' | 'beta'>('prayers');
  const [reviewer, setReviewer] = useState(savedReviewer());

  const load = useCallback(async () => {
    if (!getCuratorCode()) return;
    try {
      setPrayers(await deskPrayers());
      setError(null);
    } catch (e: any) {
      setError(e.message);
      if (/reviewer code/i.test(e.message)) {
        setCuratorCode('');
        setCode('');
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, code]);

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCuratorCode(codeInput.trim());
    setCode(codeInput.trim());
    setCodeInput('');
  };

  const changeReviewer = (name: string) => {
    setReviewer(name);
    try {
      localStorage.setItem(REVIEWER_KEY, name);
    } catch {
      /* not remembered */
    }
  };

  if (!code) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <button onClick={onBack} className="text-marian-700 hover:text-marian-600 font-semibold">← Back</button>
        <h1 className="font-serif text-3xl text-marian-800">Review desk</h1>
        <form onSubmit={signIn} className="space-y-3">
          <input
            type="password"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Reviewer code"
            className="w-full rounded-xl bg-white border border-marian-200 p-3 text-ink"
          />
          <button className="bg-marian-700 hover:bg-marian-600 text-white font-semibold py-2 px-5 rounded-xl">Open</button>
        </form>
        {error && <p className="text-red-700 text-sm">{error}</p>}
      </div>
    );
  }

  const waiting = (prayers || []).filter((p) => p.status !== 'reviewed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-marian-700 hover:text-marian-600 font-semibold">← Back</button>
        <button onClick={() => { setCuratorCode(''); setCode(''); }} className="text-sm text-gray-500 underline">Lock the desk</button>
      </div>
      <div className="flex gap-2">
        {(['prayers', 'saints', 'beta'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`py-1.5 px-4 rounded-lg font-semibold ${section === s ? 'bg-marian-700 text-white' : 'bg-white border border-marian-100 text-gray-700'}`}
          >
            {s === 'prayers' ? 'Prayers' : s === 'saints' ? 'Saints' : 'Beta'}
          </button>
        ))}
      </div>

      {section !== 'beta' && (
        <label className="block rounded-xl bg-white border border-marian-100 p-4">
          <span className="font-semibold text-marian-800">Your name, as it will appear on each sign-off</span>
          <input
            value={reviewer}
            onChange={(e) => changeReviewer(e.target.value)}
            placeholder="e.g. Fr. Juan dela Cruz"
            maxLength={80}
            className="mt-2 w-full rounded-lg bg-white border border-marian-200 p-2 text-ink"
          />
        </label>
      )}

      {section === 'beta' ? (
        <CuratorBeta />
      ) : section === 'saints' ? (
        <SaintsDesk reviewer={reviewer} />
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl text-marian-800">Review desk</h1>
            <p className="text-gray-700">
              A prayer is shown to visitors only after a person compares it word for word with its official source and signs
              it off here. Until then, visitors see "awaiting review". If you find a difference, don't sign it off: tell
              Napoleon which words differ, so the text can be corrected from the source.
            </p>
            {prayers && <p className="text-gray-700"><b>{waiting}</b> of {prayers.length} prayers still need checking.</p>}
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {!prayers && !error && <p className="text-gray-600">Loading…</p>}
          <ul className="space-y-4">
            {(prayers || []).map((p) => (
              <PrayerReviewCard
                key={p.id}
                prayer={p}
                reviewer={reviewer}
                onChanged={(next) => setPrayers((all) => (all || []).map((x) => (x.id === next.id ? next : x)))}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
