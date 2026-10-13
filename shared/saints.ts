// Saints and feast days. Only from the Church's own lists (General Roman Calendar, the Philippine and US
// calendars, the Dicastery for the Causes of Saints), each with its source. Like the prayers, a saint is shown
// only after a person checks the entry against that source on the review desk (/#curate); editing an entry
// cancels its sign-off. A name that isn't on this list is never shown as a saint.

export interface Saint {
  id: string;
  /** As the calendar names the celebration. */
  name: string;
  /** Other names people use for the same saint, for spotting them in card notes. */
  aliases: string[];
  /** Feast day, "MM-DD". */
  feast: string;
  /** Which calendar keeps that feast. */
  calendar: string;
  canonized?: string;
  /** One plain sentence, factual only. */
  about: string;
  source: string;
  sourceUrl: string;
}

export const SAINTS: Saint[] = [
  {
    id: 'lorenzo-ruiz',
    name: 'Saint Lorenzo Ruiz and Companions, Martyrs',
    aliases: ['Lorenzo Ruiz', 'Lawrence Ruiz', 'Lorenzo Ruiz de Manila', 'San Lorenzo Ruiz'],
    feast: '09-28',
    calendar: 'General Roman Calendar',
    canonized: '1987-10-18',
    about: 'The first Filipino saint, a layman from Binondo, Manila, martyred in Nagasaki, Japan, in 1637; widely invoked as patron of Filipino overseas workers.',
    source: 'General Roman Calendar; Dicastery for the Causes of Saints',
    sourceUrl: 'https://www.vatican.va/content/john-paul-ii/en/homilies/1987/documents/hf_jp-ii_hom_19871018_canonizzaz-martiri.html',
  },
  {
    id: 'pedro-calungsod',
    name: 'Saint Pedro Calungsod, Martyr',
    aliases: ['Pedro Calungsod', 'Peter Calungsod', 'San Pedro Calungsod'],
    feast: '04-02',
    calendar: 'Philippine liturgical calendar',
    canonized: '2012-10-21',
    about: 'A young Visayan catechist, martyred in Guam in 1672 with Blessed Diego Luis de San Vitores.',
    source: 'Philippine liturgical calendar (CBCP); Dicastery for the Causes of Saints',
    sourceUrl: 'https://www.vatican.va/content/benedict-xvi/en/homilies/2012/documents/hf_ben-xvi_hom_20121021_canonizzazioni.html',
  },
];

export const saintById = (id: string) => SAINTS.find((s) => s.id === id) || null;

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Saint names written in a note: "St. Jude", "Saint Rita", "San Roque", "Sta. Clara", "Santo Niño"… */
export function saintNamesIn(text: string): string[] {
  const re = /\b(?:St\.?|Sts\.?|Saint|Saints|San|Santa|Santo|Sta\.?|Sto\.?)\s+((?:[A-ZÀ-Ý][\p{L}'’-]+)(?:\s+(?:de|del|dela|de la|of|ng)?\s*[A-ZÀ-Ý][\p{L}'’-]+)*)/gu;
  const out: string[] = [];
  for (const m of text.matchAll(re)) out.push(m[0].replace(/\s+/g, ' ').trim());
  return [...new Set(out)];
}

const HONORIFIC = /^(st|sts|saint|saints|san|santa|santo|sta|sto) /;

/** The listed saint this written name refers to, or null when it isn't on the list. */
export function matchSaint(written: string, saints: Saint[] = SAINTS): Saint | null {
  const name = fold(written).replace(HONORIFIC, '');
  return (
    saints.find((s) =>
      [s.name, ...s.aliases].some((n) => {
        // "Saint Lorenzo Ruiz and Companions, Martyrs" is also written "San Lorenzo Ruiz". A first name alone
        // ("San Pedro") could be another saint, so it is not matched.
        const known = fold(n).replace(HONORIFIC, '').replace(/ and companions.*| martyrs?$/, '');
        return known === name || name.startsWith(`${known} `);
      })
    ) || null
  );
}

/** Saint names in a note that aren't on the verified list. */
export const unknownSaintNames = (text: string, saints: Saint[] = SAINTS) => saintNamesIn(text).filter((n) => !matchSaint(n, saints));

/** "MM-DD" for a date, in the person's own time zone. */
export const monthDay = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The saint(s) of the day, else the next feast coming up (wrapping into next year). */
export function saintOfTheDay<T extends { feast: string }>(saints: T[], today: Date): { today: T[]; next: T | null } {
  const md = monthDay(today);
  const todays = saints.filter((s) => s.feast === md);
  const sorted = [...saints].sort((a, b) => a.feast.localeCompare(b.feast));
  const next = sorted.find((s) => s.feast > md) || sorted[0] || null;
  return { today: todays, next: todays.length ? null : next };
}
