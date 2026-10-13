import React, { useEffect, useState } from 'react';
import { listMyInvites, type InviteView } from '../services/rosaApi';
import { Check, Copy } from './icons/LucideIcons';

// "Your invites": codes this member can share. Shown on the home page during the invite-only beta.
export const InvitesCard: React.FC = () => {
  const [invites, setInvites] = useState<InviteView[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    listMyInvites().then(setInvites).catch(() => setInvites([]));
  }, []);

  const open = (invites || []).filter((i) => !i.used);
  if (!invites || invites.length === 0) return null;

  const copy = async (code: string) => {
    const text = `Join me on Rosa Maria, a Rosary and prayer-card app (invite-only for now): ${window.location.origin}\nYour invite code: ${code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copy this invite:', text);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-marian-100 bg-white p-5">
      <h2 className="font-semibold text-marian-800">Your invites</h2>
      <p className="text-sm text-gray-600 mb-3">
        {open.length ? `You have ${open.length} to share. Each works once.` : 'All your invites are used.'}
      </p>
      <ul className="flex flex-wrap gap-2">
        {invites.map((i) => (
          <li key={i.code}>
            {i.used ? (
              <span className="inline-block rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-400 line-through">{i.code}</span>
            ) : (
              <button
                onClick={() => copy(i.code)}
                className="flex items-center gap-2 rounded-lg bg-marian-50 border border-marian-200 hover:border-marian-500 px-3 py-2 text-sm font-mono text-marian-800"
              >
                {i.code}
                {copied === i.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
