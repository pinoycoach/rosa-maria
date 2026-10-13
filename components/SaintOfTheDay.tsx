import React, { useEffect, useState } from 'react';
import { listSaints, type SaintView } from '../services/rosaApi';
import { saintOfTheDay } from '../shared/saints';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const feastDate = (md: string) => `${MONTHS[Number(md.slice(0, 2)) - 1]} ${Number(md.slice(3))}`;

// "Saint of the day" on the home page: only saints a person has checked against the Church's calendar.
// On other days it shows the next feast coming up; with no checked saints yet, it shows nothing.
export const SaintOfTheDay: React.FC = () => {
  const [saints, setSaints] = useState<SaintView[] | null>(null);
  useEffect(() => {
    listSaints().then(setSaints).catch(() => setSaints([]));
  }, []);
  if (!saints?.length) return null;
  const { today, next } = saintOfTheDay<SaintView>(saints, new Date());
  const shown: SaintView[] = today.length ? today : next ? [next] : [];
  if (!shown.length) return null;
  return (
    <section className="rounded-2xl bg-white border border-rosa-200 p-5 space-y-3">
      <p className="text-sm uppercase tracking-wide text-rosa-700">{today.length ? 'Saint of the day' : 'Next feast'}</p>
      {shown.map((s) => (
        <div key={s.id} className="space-y-1">
          <h2 className="font-serif text-2xl text-marian-800">{s.name}</h2>
          <p className="text-sm text-gray-500">
            {feastDate(s.feast)} · {s.calendar}
          </p>
          <p className="text-gray-700 leading-relaxed">{s.about}</p>
          <p className="text-xs text-gray-500">
            Source:{' '}
            <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline">
              {s.source}
            </a>
          </p>
        </div>
      ))}
    </section>
  );
};
