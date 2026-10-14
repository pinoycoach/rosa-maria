import React, { useCallback, useEffect, useState } from 'react';
import { curatorBeta, curatorInviteFromWaitlist, curatorMakeInvites, type BetaOverview } from '../services/rosaApi';

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '–');

// The review desk's view of the invite-only beta: make codes, see who joined, invite the waitlist.
export const CuratorBeta: React.FC = () => {
  const [data, setData] = useState<BetaOverview | null>(null);
  const [count, setCount] = useState(5);
  const [note, setNote] = useState('');
  const [fresh, setFresh] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => curatorBeta().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  const make = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await curatorMakeInvites(count, note.trim() || undefined);
      setFresh(r.codes);
      setNote('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inviteWaitlist = async (email: string) => {
    setError(null);
    try {
      await curatorInviteFromWaitlist(email);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => window.prompt('Copy:', text));

  if (!data) return <p className="text-sm text-gray-600">{error || 'Loading…'}</p>;
  const openCodes = data.invites.filter((i) => !i.used);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-700">{error}</p>}

      <section className="rounded-xl bg-white border border-marian-100 p-4 space-y-3">
        <h2 className="font-semibold text-ink">Make invite codes</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="w-20 rounded-lg bg-white border border-marian-200 p-2 text-ink"
            aria-label="How many codes"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional), e.g. coaching group"
            className="flex-1 min-w-0 rounded-lg bg-white border border-marian-200 p-2 text-ink text-sm"
          />
          <button onClick={make} disabled={busy} className="bg-marian-700 hover:bg-marian-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg">
            {busy ? '…' : 'Make codes'}
          </button>
        </div>
        {fresh.length > 0 && (
          <div className="rounded-lg bg-marian-50 p-3">
            <p className="text-xs text-gray-600 mb-2">New codes:</p>
            <p className="font-mono text-marian-800 text-sm break-words">{fresh.join('  ')}</p>
            <button onClick={() => copy(fresh.join('\n'))} className="text-xs text-marian-700 underline mt-2">Copy all</button>
          </div>
        )}
        <p className="text-xs text-gray-500">
          {openCodes.length} of your codes are unused, {data.invites.length - openCodes.length} used.
        </p>
        {openCodes.length > 0 && (
          <details>
            <summary className="text-sm text-gray-700 cursor-pointer">Unused codes</summary>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-sm">
              {openCodes.map((i) => (
                <li key={i.code} className="font-mono text-marian-800">
                  <button onClick={() => copy(i.code)} className="hover:underline">{i.code}</button>
                  {i.note && <span className="text-gray-500 font-sans"> · {i.note}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="rounded-xl bg-white border border-marian-100 p-4">
        <h2 className="font-semibold text-ink mb-2">Members ({data.members.filter((m) => m.member).length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600 text-left">
              <tr>
                <th className="py-1 pr-3">Name</th>
                <th className="py-1 pr-3">Joined</th>
                <th className="py-1 pr-3">Invited by</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.email} className="border-t border-marian-100">
                  <td className="py-1.5 pr-3 text-ink">
                    {m.name}
                    <span className="block text-xs text-gray-500">{m.email}</span>
                  </td>
                  <td className="py-1.5 pr-3 text-gray-700">{m.member ? day(m.since) : <span className="text-amber-700">no invite yet</span>}</td>
                  <td className="py-1.5 pr-3 text-gray-700">{m.invitedBy || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white border border-marian-100 p-4">
        <h2 className="font-semibold text-ink mb-2">Waitlist ({data.waitlist.length})</h2>
        <ul className="space-y-2 text-sm">
          {data.waitlist.length === 0 && <li className="text-gray-500">No one yet.</li>}
          {data.waitlist.map((w) => (
            <li key={w.email} className="flex flex-wrap items-center gap-2">
              <span className="text-ink">{w.email}</span>
              <span className="text-gray-500">{day(w.createdAt)}</span>
              {w.invitedCode ? (
                <button onClick={() => copy(w.invitedCode!)} className="ml-auto font-mono text-marian-800 hover:underline">{w.invitedCode}</button>
              ) : (
                <button onClick={() => inviteWaitlist(w.email)} className="ml-auto text-marian-700 underline">Make their invite</button>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-2">Copy the code and send it to them yourself. Rosa Maria doesn't send emails.</p>
      </section>
    </div>
  );
};
