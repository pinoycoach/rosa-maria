import React, { useCallback, useEffect, useState } from 'react';
import { deskSaints, dismissSaintFlag, markSaintReviewed, undoSaintReview, type DeskSaint, type SaintFlagView } from '../services/rosaApi';

const SaintCard: React.FC<{ saint: DeskSaint; reviewer: string; onChanged: (s: DeskSaint) => void }> = ({ saint, reviewer, onChanged }) => {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const act = async (fn: () => Promise<DeskSaint>) => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await fn());
      setChecked(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const reviewed = saint.status === 'reviewed';
  return (
    <li className={`rounded-2xl bg-white border p-5 space-y-2 ${reviewed ? 'border-emerald-200' : 'border-marian-100'}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-serif text-2xl text-marian-800">{saint.name}</h2>
        {reviewed ? (
          <span className="rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-0.5 text-sm">
            Checked by {saint.reviewedBy} on {saint.reviewedOn}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 text-amber-800 px-2.5 py-0.5 text-sm">Awaiting review</span>
        )}
      </div>
      {saint.changedSinceReview && <p className="text-sm text-amber-800">This entry changed after an earlier sign-off, so it needs checking again.</p>}
      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-ink">
        <dt className="text-gray-500">Feast</dt>
        <dd>{saint.feast} (month-day) · {saint.calendar}</dd>
        {saint.canonized && (
          <>
            <dt className="text-gray-500">Canonized</dt>
            <dd>{saint.canonized}</dd>
          </>
        )}
        <dt className="text-gray-500">About</dt>
        <dd>{saint.about}</dd>
        <dt className="text-gray-500">Also written</dt>
        <dd>{saint.aliases.join(', ')}</dd>
      </dl>
      <p className="text-sm text-gray-600">
        Check against: <b>{saint.source}</b> ·{' '}
        <a href={saint.sourceUrl} target="_blank" rel="noreferrer" className="text-marian-700 underline">
          open the source
        </a>
      </p>
      {reviewed ? (
        <button onClick={() => act(() => undoSaintReview(saint))} disabled={busy} className="text-sm text-gray-600 underline disabled:opacity-50">
          Undo this sign-off
        </button>
      ) : (
        <div className="space-y-3 rounded-xl bg-marian-50 p-3">
          <label className="flex items-start gap-2 text-ink">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1.5 h-4 w-4" />
            <span>I checked the name, feast day, calendar and dates against the Church's own list, and they are right.</span>
          </label>
          <button
            onClick={() => act(() => markSaintReviewed(saint, reviewer))}
            disabled={busy || !checked || !reviewer.trim()}
            className="bg-marian-700 hover:bg-marian-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg"
          >
            {busy ? 'Saving…' : 'Sign off this saint'}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </li>
  );
};

// The review desk's Saints tab: sign off each saint, and see saint names people wrote in card notes that aren't
// on the list (only the names are kept, never the notes).
export const SaintsDesk: React.FC<{ reviewer: string }> = ({ reviewer }) => {
  const [saints, setSaints] = useState<DeskSaint[] | null>(null);
  const [flagged, setFlagged] = useState<SaintFlagView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    deskSaints()
      .then((r) => {
        setSaints(r.saints);
        setFlagged(r.flagged);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const dismiss = async (name: string) => {
    try {
      await dismissSaintFlag(name);
      setFlagged((f) => f.filter((x) => x.name !== name));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-marian-800">Saints</h1>
        <p className="text-gray-700">
          Only saints on the Church's own lists belong here, each signed off by a person. Visitors see "Saint of the day"
          only for signed-off saints.
        </p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!saints && !error && <p className="text-gray-600">Loading…</p>}
      <ul className="space-y-4">
        {(saints || []).map((s) => (
          <SaintCard key={s.id} saint={s} reviewer={reviewer} onChanged={(n) => setSaints((all) => (all || []).map((x) => (x.id === n.id ? n : x)))} />
        ))}
      </ul>
      <section className="rounded-2xl bg-white border border-marian-100 p-5 space-y-2">
        <h2 className="font-semibold text-marian-800">Saint names in card notes that aren't on the list</h2>
        <p className="text-sm text-gray-600">
          If one is a real saint on the Church's calendar, ask for it to be added with its source. Clear it once looked at.
        </p>
        {flagged.length === 0 ? (
          <p className="text-sm text-gray-500">None so far.</p>
        ) : (
          <ul className="divide-y divide-marian-100">
            {flagged.map((f) => (
              <li key={f.name} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-ink">{f.name}</span>
                <span className="text-sm text-gray-500">{f.count}×</span>
                <button onClick={() => dismiss(f.name)} className="text-sm text-marian-700 underline">Clear</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
