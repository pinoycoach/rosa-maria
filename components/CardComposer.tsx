import React, { useEffect, useMemo, useState } from 'react';
import { listPrayers, makePicture, sendCard, uploadPicture, type CardView, type NewPicture, type NoteCheck, type PrayerView } from '../services/rosaApi';
import { resizePhoto } from '../services/resizePhoto';
import { checkPicturePrompt, PICTURE_IDEAS, PICTURE_PROMPT_MAX } from '../shared/pictures';
import { DESIGNS, NAME_MAX, NOTE_MAX, OCCASIONS, occasionById, type DesignId, type OccasionId } from '../shared/cards';
import { CardArt } from './CardArt';

const cardLink = (id: string) => `${window.location.origin}/c/${id}`;

// After sending: the link, and the ways to pass it on.
const ShareCard: React.FC<{ card: CardView; onAnother: () => void; onHome: () => void }> = ({ card, onAnother, onHome }) => {
  const [copied, setCopied] = useState(false);
  const link = cardLink(card.id);
  const greeting = occasionById(card.occasion)?.greeting || 'A prayer for you';
  const message = `${card.toName ? `${card.toName}, ` : ''}${card.fromName ? `${card.fromName} sent you` : "I've sent you"} a prayer card: ${greeting}. ${link}`;
  const enc = encodeURIComponent(message);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', link);
    }
  };
  const share = () => navigator.share?.({ title: 'A prayer card', text: message, url: link }).catch(() => {});

  const linkBtn = 'block text-center rounded-xl border border-marian-200 bg-white py-2.5 font-semibold text-marian-800 hover:bg-marian-50';
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
      <h1 className="font-serif text-3xl text-marian-800">Your card is ready</h1>
      <CardArt design={card.design as DesignId} greeting={greeting} toName={card.toName} fromName={card.fromName} picture={card.picture} />
      <p className="text-gray-700">Send this private link. Whoever opens it will see your card, your note and the prayer.</p>
      <div className="rounded-xl bg-white border border-marian-100 p-3 flex items-center gap-2">
        <span className="flex-1 min-w-0 truncate font-mono text-sm text-gray-700">{link}</span>
        <button onClick={copy} className="shrink-0 bg-marian-700 hover:bg-marian-600 text-white text-sm font-semibold py-2 px-3 rounded-lg">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      {'share' in navigator && (
        <button onClick={share} className="w-full bg-marian-700 hover:bg-marian-600 text-white font-semibold py-3 rounded-xl">
          Share…
        </button>
      )}
      <div className="grid grid-cols-2 gap-2">
        <a className={linkBtn} href={`fb-messenger://share/?link=${encodeURIComponent(link)}`}>Messenger</a>
        <a className={linkBtn} href={`viber://forward?text=${enc}`}>Viber</a>
        <a className={linkBtn} href={`https://wa.me/?text=${enc}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className={linkBtn} href={`sms:?&body=${enc}`}>Text message</a>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onAnother} className="text-marian-700 underline">Make another card</button>
        <button onClick={onHome} className="text-gray-600 underline">Home</button>
      </div>
    </div>
  );
};

// Make a prayer card: occasion, design, a checked prayer, and a short note of your own.
export const CardComposer: React.FC<{ onHome: () => void; replyTo?: string; pictureAI?: boolean }> = ({ onHome, replyTo, pictureAI }) => {
  const [picMode, setPicMode] = useState<'designs' | 'photo' | 'ai'>('designs');
  const [picture, setPicture] = useState<NewPicture | null>(null);
  const [picPrompt, setPicPrompt] = useState('');
  const [picBusy, setPicBusy] = useState(false);
  const [picError, setPicError] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<OccasionId>('birthday');
  const [design, setDesign] = useState<DesignId>('dawn');
  const [prayers, setPrayers] = useState<PrayerView[] | null>(null);
  const [prayerId, setPrayerId] = useState('');
  const [toName, setToName] = useState(replyTo || '');
  const [fromName, setFromName] = useState('');
  const [note, setNote] = useState('');
  const [check, setCheck] = useState<NoteCheck | null>(null);
  const [checkedNote, setCheckedNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<CardView | null>(null);

  useEffect(() => {
    listPrayers().then(setPrayers).catch((e) => setError(e.message));
  }, []);

  const occ = occasionById(occasion)!;
  const offered = useMemo(
    () => occ.prayerIds.map((id) => prayers?.find((p) => p.id === id)).filter((p): p is PrayerView => p?.status === 'reviewed'),
    [occ, prayers]
  );
  useEffect(() => {
    if (!offered.some((p) => p.id === prayerId)) setPrayerId(offered[0]?.id || '');
  }, [offered, prayerId]);

  const pickOccasion = (id: OccasionId) => {
    setOccasion(id);
    setDesign(occasionById(id)!.design);
  };

  const send = async (keepNote: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const pic = picMode !== 'designs' && picture ? { path: picture.path, kind: picture.kind } : undefined;
      const r = await sendCard({ occasion, design, prayerId, toName, fromName, note, keepNote, picture: pic });
      if ('check' in r) {
        setCheck(r.check);
        setCheckedNote(note);
      } else {
        setSent(r.card);
        window.scrollTo(0, 0);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <ShareCard
        card={sent}
        onHome={onHome}
        onAnother={() => {
          setSent(null);
          setNote('');
          setCheck(null);
        }}
      />
    );
  }

  const showCheck = check && checkedNote === note && check.flags.length > 0;
  const chip = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-sm border ${on ? 'bg-marian-700 text-white border-marian-700' : 'bg-white text-gray-700 border-marian-200'}`;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <button onClick={onHome} className="text-marian-700 hover:text-marian-600 font-semibold">
        ← Back
      </button>
      <h1 className="font-serif text-3xl text-marian-800">Send a prayer card</h1>

      <section className="space-y-2">
        <h2 className="font-semibold text-marian-800">1. The occasion</h2>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button key={o.id} onClick={() => pickOccasion(o.id)} className={chip(o.id === occasion)}>
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-marian-800">2. The card</h2>
        <CardArt
          design={design}
          greeting={occ.greeting}
          toName={toName.trim()}
          fromName={fromName.trim()}
          picture={picMode !== 'designs' ? picture : null}
        />
        <div className="grid grid-cols-3 rounded-xl border border-marian-200 overflow-hidden text-sm font-semibold">
          {([['designs', 'Our designs'], ['photo', 'Your photo'], ...(pictureAI ? [['ai', 'Make a picture']] : [])] as Array<[typeof picMode, string]>).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setPicMode(m);
                setPicture(null);
                setPicError(null);
              }}
              className={`py-2 ${picMode === m ? 'bg-marian-700 text-white' : 'bg-white text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {picMode === 'designs' && (
          <div className="flex flex-wrap gap-2">
            {DESIGNS.map((d) => (
              <button key={d.id} onClick={() => setDesign(d.id)} className={chip(d.id === design)}>
                {d.name}
              </button>
            ))}
          </div>
        )}
        {picMode === 'photo' && (
          <div className="space-y-2">
            <label className="block w-full text-center rounded-xl border-2 border-dashed border-marian-200 bg-white py-4 cursor-pointer text-marian-800 font-semibold">
              {picBusy ? 'Adding your photo…' : picture ? 'Choose a different photo' : 'Choose a photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={picBusy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setPicBusy(true);
                  setPicError(null);
                  try {
                    setPicture(await uploadPicture(await resizePhoto(file)));
                  } catch (err: any) {
                    setPicError(err.message);
                  } finally {
                    setPicBusy(false);
                  }
                }}
              />
            </label>
            <p className="text-xs text-gray-500">A family photo, your parish, flowers from the garden. Only people with the card's link can see it.</p>
          </div>
        )}
        {picMode === 'ai' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={picPrompt}
                onChange={(e) => setPicPrompt(e.target.value)}
                maxLength={PICTURE_PROMPT_MAX}
                placeholder="Describe a picture, e.g. white lilies by a window"
                className="flex-1 min-w-0 rounded-lg bg-white border border-marian-200 px-3 py-2 text-ink"
              />
              <button
                disabled={picBusy || !picPrompt.trim()}
                onClick={async () => {
                  const ok = checkPicturePrompt(picPrompt);
                  if (!ok.ok) return setPicError(ok.message || null);
                  setPicBusy(true);
                  setPicError(null);
                  try {
                    setPicture(await makePicture(picPrompt));
                  } catch (err: any) {
                    setPicError(err.message);
                  } finally {
                    setPicBusy(false);
                  }
                }}
                className="shrink-0 bg-marian-700 hover:bg-marian-600 disabled:opacity-50 text-white font-semibold px-4 rounded-lg"
              >
                {picBusy ? 'Making…' : picture ? 'Try again' : 'Make it'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PICTURE_IDEAS.map((idea) => (
                <button key={idea} onClick={() => setPicPrompt(idea)} className="rounded-full bg-white border border-marian-100 px-2.5 py-1 text-xs text-gray-700">
                  {idea}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Out of reverence, AI pictures never show Our Lord, Our Lady, the saints, angels or any person. Each is labelled
              "Picture made with AI".
            </p>
          </div>
        )}
        {picError && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">{picError}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-marian-800">3. The prayer</h2>
        {!prayers && !error && <p className="text-gray-600">Loading the prayers…</p>}
        {prayers && offered.length === 0 && (
          <p className="text-gray-700 rounded-xl bg-white border border-marian-100 p-3">
            The prayers for this card are still being checked against the Church's approved text, so it can't be sent yet.
          </p>
        )}
        <div className="space-y-2">
          {offered.map((p) => (
            <label key={p.id} className={`block rounded-xl border p-3 cursor-pointer ${p.id === prayerId ? 'border-marian-500 bg-white' : 'border-marian-100 bg-white/60'}`}>
              <span className="flex items-center gap-2">
                <input type="radio" name="prayer" checked={p.id === prayerId} onChange={() => setPrayerId(p.id)} />
                <span className="font-serif text-lg text-marian-800">{p.title}</span>
              </span>
              {p.id === prayerId && p.status === 'reviewed' && (
                <span className="block mt-2 font-serif text-ink leading-relaxed whitespace-pre-line">{p.text}</span>
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-marian-800">4. Your note (optional)</h2>
        <div className="grid grid-cols-2 gap-2">
          <input value={toName} onChange={(e) => setToName(e.target.value)} maxLength={NAME_MAX} placeholder="To (e.g. Lola Cora)"
            className="min-w-0 rounded-lg bg-white border border-marian-200 px-3 py-2 text-ink" />
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} maxLength={NAME_MAX} placeholder="From (your name)"
            className="min-w-0 rounded-lg bg-white border border-marian-200 px-3 py-2 text-ink" />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={NOTE_MAX} rows={4}
          placeholder="A few words of your own…" className="w-full rounded-xl bg-white border border-marian-200 p-3 text-ink" />
        <p className="text-xs text-gray-500 text-right">{note.length}/{NOTE_MAX}</p>
        {showCheck && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2 text-amber-900">
            {check!.flags.map((f) => (
              <p key={f.kind}>{f.message}</p>
            ))}
            {!check!.blocked && (
              <button onClick={() => send(true)} disabled={busy} className="text-sm underline disabled:opacity-50">
                Keep my note as it is and send
              </button>
            )}
          </div>
        )}
      </section>

      {error && <p className="text-red-700">{error}</p>}
      <button
        onClick={() => send(false)}
        disabled={busy || !prayerId || (!!showCheck && check!.blocked)}
        className="w-full bg-marian-700 hover:bg-marian-600 disabled:opacity-50 text-white font-semibold text-lg py-3.5 rounded-2xl"
      >
        {busy ? 'Making your card…' : 'Make my card'}
      </button>
      {prayers && offered.length === 0 && (
        <p className="text-sm text-gray-600 text-center -mt-3">A card can be sent once at least one of its prayers has been checked.</p>
      )}
      {picMode !== 'designs' && !picture && (
        <p className="text-sm text-gray-600 text-center -mt-3">No picture chosen yet, so the card will use the {DESIGNS.find((d) => d.id === design)?.name} design.</p>
      )}
      <p className="text-xs text-gray-500 text-center">Free, always. Your note is shown as yours, never as a prayer of the Church.</p>
    </div>
  );
};
