// Rosa Maria's own API: the prayers, account status, the beta and the review desk.
import { apiFetch, setSession } from './apiFetch';

const call = async <T,>(url: string, init: RequestInit = {}, fallback = 'Something went wrong'): Promise<T> => {
  const res = await apiFetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${fallback} (status ${res.status})`);
  return data as T;
};

export const deleteMyData = () => call<{ deleted: boolean }>('/api/me', { method: 'DELETE' }, 'Could not delete your data');

// ---------- Prayers ----------

/** A prayer as visitors see it: the words only once a person has checked them. */
export type PrayerView = {
  id: string;
  title: string;
  language: 'en' | 'fil';
  source: string;
  sourceUrl: string;
} & ({ status: 'reviewed'; text: string; reviewedBy: string; reviewedOn: string } | { status: 'awaiting-review' });

export const listPrayers = async () => (await call<{ prayers: PrayerView[] }>('/api/prayers', {}, 'Could not load the prayers')).prayers;

// ---------- Saints ----------

/** A saint a person has signed off (only these are ever sent). */
export interface SaintView {
  id: string;
  name: string;
  feast: string;
  calendar: string;
  canonized?: string;
  about: string;
  source: string;
  sourceUrl: string;
}

export const listSaints = async () => (await call<{ saints: SaintView[] }>('/api/saints', {}, 'Could not load the saints')).saints;

// ---------- Prayer cards ----------

export interface NoteCheck {
  flags: Array<{ kind: 'chain' | 'promise' | 'luck' | 'curse'; message: string }>;
  blocked: boolean;
}

export interface CardView {
  id: string;
  occasion: string;
  design: string;
  prayerId: string;
  toName: string;
  fromName: string;
  note: string;
  createdAt: string;
  prayer: PrayerView | null;
}

export const checkNote = (note: string) =>
  call<NoteCheck>('/api/cards/check', { method: 'POST', body: JSON.stringify({ note }) }, 'Could not check the note');

export type SendResult = { ok: true; card: CardView } | { ok: false; check: NoteCheck };

/** Sends a card. A note with suggestions comes back unsent, unless the sender chose to keep it as it is. */
export const sendCard = async (card: {
  occasion: string;
  design: string;
  prayerId: string;
  toName: string;
  fromName: string;
  note: string;
  keepNote: boolean;
}): Promise<SendResult> => {
  const res = await apiFetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) return { ok: false, check: data as NoteCheck };
  if (!res.ok) throw new Error(data.error || `Could not send the card (status ${res.status})`);
  return { ok: true, card: data.card };
};

/** Opening a card needs no passcode or account. */
export const openCard = async (id: string): Promise<CardView> => {
  const res = await fetch(`/api/cards/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not open the card.');
  return data.card;
};

// ---------- Review desk (needs the reviewer code) ----------

const CURATOR_KEY = 'rosa.curator';
export const getCuratorCode = () => {
  try {
    return sessionStorage.getItem(CURATOR_KEY) || '';
  } catch {
    return '';
  }
};
export const setCuratorCode = (code: string) => {
  try {
    if (code) sessionStorage.setItem(CURATOR_KEY, code);
    else sessionStorage.removeItem(CURATOR_KEY);
  } catch {
    /* private mode: the code just isn't remembered */
  }
};
const curator = <T,>(url: string, init: RequestInit = {}) =>
  call<T>(url, { ...init, headers: { 'x-admin-code': getCuratorCode(), ...(init.headers || {}) } }, 'Review desk request failed');

/** A prayer as the reviewer sees it on the desk. */
export interface DeskPrayer {
  id: string;
  title: string;
  language: 'en' | 'fil';
  text: string;
  source: string;
  sourceUrl: string;
  /** Fingerprint of the words shown; sent back with a sign-off. */
  textHash: string;
  status: 'reviewed' | 'awaiting-review';
  reviewedBy: string | null;
  reviewedOn: string | null;
  /** It was signed off once, but its words have changed since. */
  changedSinceReview: boolean;
}

export const deskPrayers = async () => (await curator<{ prayers: DeskPrayer[] }>('/api/admin/prayers')).prayers;

export const markReviewed = async (p: DeskPrayer, reviewedBy: string) =>
  (await curator<{ prayer: DeskPrayer }>(`/api/admin/prayers/${encodeURIComponent(p.id)}/review`, {
    method: 'POST',
    body: JSON.stringify({ reviewedBy, comparedWordForWord: true, textHash: p.textHash }),
  })).prayer;

export interface DeskSaint extends SaintView {
  aliases: string[];
  textHash: string;
  status: 'reviewed' | 'awaiting-review';
  reviewedBy: string | null;
  reviewedOn: string | null;
  changedSinceReview: boolean;
}
export interface SaintFlagView {
  name: string;
  count: number;
  lastSeen: string;
}

export const deskSaints = () => curator<{ saints: DeskSaint[]; flagged: SaintFlagView[] }>('/api/admin/saints');

export const markSaintReviewed = async (s: DeskSaint, reviewedBy: string) =>
  (await curator<{ saint: DeskSaint }>(`/api/admin/saints/${encodeURIComponent(s.id)}/review`, {
    method: 'POST',
    body: JSON.stringify({ reviewedBy, comparedWithSource: true, textHash: s.textHash }),
  })).saint;

export const undoSaintReview = async (s: DeskSaint) =>
  (await curator<{ saint: DeskSaint }>(`/api/admin/saints/${encodeURIComponent(s.id)}/review`, { method: 'DELETE' })).saint;

export const dismissSaintFlag = (name: string) =>
  curator<{ ok: boolean }>('/api/admin/saint-flags', { method: 'DELETE', body: JSON.stringify({ name }) });

export const undoReview = async (p: DeskPrayer) =>
  (await curator<{ prayer: DeskPrayer }>(`/api/admin/prayers/${encodeURIComponent(p.id)}/review`, { method: 'DELETE' })).prayer;

// ---------- Beta: sign-in, invites, waitlist ----------

export interface AccountStatus {
  inviteOnly: boolean;
  member: boolean;
  signedIn: boolean;
  email: string | null;
  name: string | null;
}
export const getStatus = () => call<AccountStatus>('/api/me/status', {}, 'Could not load your account');

/** Sends Google's sign-in token; switches this browser to the account's user when it already exists. */
export const signInWithGoogle = async (credential: string) => {
  const r = await call<{ member: boolean; email: string; name: string; token?: string }>(
    '/api/auth/google',
    { method: 'POST', body: JSON.stringify({ credential }) },
    'Google sign-in failed'
  );
  if (r.token) setSession(r.token);
  return r;
};

export const redeemInvite = (code: string) =>
  call<{ member: boolean }>('/api/invites/redeem', { method: 'POST', body: JSON.stringify({ code }) }, 'Could not use that invite');

export interface InviteView {
  code: string;
  used: boolean;
  createdAt: string;
  note?: string | null;
}
export const listMyInvites = async () => (await call<{ invites: InviteView[] }>('/api/me/invites', {}, 'Could not load your invites')).invites;

export const joinWaitlist = (email: string) =>
  call<{ ok: boolean; already: boolean }>('/api/waitlist', { method: 'POST', body: JSON.stringify({ email }) }, 'Could not join the waitlist');

export interface BetaOverview {
  members: Array<{ name: string; email: string; signedUp: string; member: boolean; since: string | null; invitedBy: string | null }>;
  invites: InviteView[];
  waitlist: Array<{ email: string; createdAt: string; invitedCode?: string }>;
}
export const curatorBeta = () => curator<BetaOverview>('/api/admin/beta');
export const curatorMakeInvites = (count: number, note?: string) =>
  curator<{ codes: string[] }>('/api/admin/invites', { method: 'POST', body: JSON.stringify({ count, note }) });
export const curatorInviteFromWaitlist = (email: string) =>
  curator<{ code: string }>('/api/admin/waitlist/invite', { method: 'POST', body: JSON.stringify({ email }) });
