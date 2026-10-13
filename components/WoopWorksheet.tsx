import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { ManifestSeries } from '../types';
import { Sparkles } from './icons/LucideIcons';
import { getStatus, listMyInvites } from '../services/inspireApi';

// A one-page, print-friendly worksheet for a WOOP series: fill it in by hand. Seven days fit on one
// Letter or A4 page, so keep each day to its prompt, one example and two writing lines.
// It's also Inspire's front door on paper: the brand, the address and a QR code lead back to the app.
const LINES_PER_DAY = 2;

export const WoopWorksheet: React.FC<{ series: ManifestSeries; onBack: () => void }> = ({ series, onBack }) => {
  const steps = series.episodes.filter((e) => e.woop);
  const site = window.location.origin;
  const [qr, setQr] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [printInvite, setPrintInvite] = useState(false);

  useEffect(() => {
    // Drawn here in the browser: the address never goes to an outside service.
    QRCode.toString(site, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(null));
  }, [site]);

  useEffect(() => {
    // Members of the invite-only beta may print one unused invite code on their copy.
    getStatus()
      .then((s) => (s.inviteOnly && s.member ? listMyInvites() : []))
      .then((list) => setInviteCode(list.find((i) => !i.used)?.code || null))
      .catch(() => setInviteCode(null));
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white text-gray-900 rounded-2xl p-6 sm:p-10 space-y-6 print:space-y-3 print:rounded-none print:p-0 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button onClick={onBack} className="text-indigo-600 font-semibold">← Back to Series</button>
        <div className="flex flex-wrap items-center gap-3">
          {inviteCode && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={printInvite} onChange={(e) => setPrintInvite(e.target.checked)} />
              Print one of my invite codes on it
            </label>
          )}
          <button onClick={() => window.print()} className="bg-gray-900 text-white text-sm font-semibold py-2 px-4 rounded-lg">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
      <header className="space-y-1 border-b border-gray-300 pb-4 print:pb-2">
        <div className="flex items-center gap-2 pb-2 print:pb-1">
          <span className="bg-gray-900 text-white p-1.5 rounded-lg print:[print-color-adjust:exact]">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-lg font-black tracking-tight">Inspire</span>
          <span className="text-xs text-gray-500">· Small steps, kept honest.</span>
          <span className="ml-auto text-xs uppercase tracking-widest text-gray-500">7-day worksheet</span>
        </div>
        <h1 className="text-2xl font-black print:text-xl">{series.title}</h1>
        <p className="text-sm text-gray-600 print:text-xs">{series.hook}</p>
        <p className="text-sm text-gray-600 pt-2 print:pt-1">Week of: ______________________</p>
      </header>
      <ol className="space-y-5 print:space-y-2">
        {steps.map((e) => (
          <li key={e.id} className="break-inside-avoid space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Day {e.episodeNumber} · {e.title}
            </p>
            <p className="font-semibold text-[15px] leading-snug print:text-sm">{e.woop!.prompt}</p>
            <p className="text-sm text-gray-500 italic leading-snug print:text-xs">e.g. {e.woop!.example}</p>
            <div className="space-y-6 pt-4 print:space-y-4 print:pt-2" aria-hidden="true">
              {Array.from({ length: LINES_PER_DAY }, (_, i) => <div key={i} className="border-b border-gray-300" />)}
            </div>
          </li>
        ))}
      </ol>
      <footer className="flex items-end justify-between gap-4 text-xs text-gray-500 border-t border-gray-300 pt-3 print:pt-2 break-inside-avoid">
        <p className="max-w-sm">
          WOOP (Wish, Outcome, Obstacle, Plan) by Dr. Gabriele Oettingen, NYU. Inspire doesn't promise outcomes — you build them.
        </p>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-semibold text-gray-800">Do it daily on your phone</p>
            <p className="break-all">{site.replace(/^https?:\/\//, '')}</p>
            {printInvite && inviteCode && (
              <p data-testid="worksheet-invite">
                Invite code: <span className="font-mono font-semibold text-gray-800">{inviteCode}</span>
              </p>
            )}
          </div>
          {qr && (
            <div
              role="img"
              aria-label={`QR code for ${site}`}
              data-testid="worksheet-qr"
              className="w-16 h-16 shrink-0 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          )}
        </div>
      </footer>
    </div>
  );
};
