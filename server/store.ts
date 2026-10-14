// Where Rosa Maria keeps its data. Firestore in production (only this server can reach it, using the
// Cloud Run identity); an in-memory copy for local runs and tests (DATA_STORE=memory).
import type { Review } from './reviews';
import type { DesignId, OccasionId } from '../shared/cards';
import { checkRedeem, type AccountDoc, type InviteDoc, type Membership, type RedeemResult, type WaitlistDoc } from './accounts';

export interface UserDoc {
  /** Set once an invite is redeemed (or for the founder). */
  member?: Membership;
  /** The Google account signed in on this user, for display. */
  account?: { email: string; name: string };
  createdAt: string;
  updatedAt: string;
}

/** A sent prayer card. Anyone with its unguessable id can open it; "Delete my data" removes the sender's cards. */
export interface CardDoc {
  id: string;
  occasion: OccasionId;
  design: DesignId;
  prayerId: string;
  toName: string;
  fromName: string;
  note: string;
  /** The card's own picture (an uploaded photo or an AI picture), when not one of the drawn designs. */
  picture?: { path: string; kind: 'photo' | 'ai' };
  /** Checks the sender chose to set aside ("keep my note as it is"). */
  flags: string[];
  senderUid: string;
  createdAt: string;
}

/** A saint name written in a card note that isn't on the verified list, for a person to look at. */
export interface SaintFlag {
  name: string;
  count: number;
  lastSeen: string;
}

export interface Store {
  kind: 'firestore' | 'memory';
  getUser(uid: string): Promise<UserDoc | null>;
  /** Read-modify-write in one transaction, so two quick taps can't race. */
  updateUser(uid: string, fn: (current: UserDoc | null) => UserDoc): Promise<UserDoc>;
  deleteUser(uid: string): Promise<void>;
  /** Adds 1 to a daily counter and returns the new count. */
  bumpUsage(key: string): Promise<number>;
  getUsage(key: string): Promise<number>;
  listReviews(): Promise<Review[]>;
  /** One review per prayer: a new one replaces the old. */
  putReview(review: Review): Promise<void>;
  deleteReview(itemId: string): Promise<void>;
  putCard(card: CardDoc): Promise<void>;
  getCard(id: string): Promise<CardDoc | null>;
  deleteCardsBy(senderUid: string): Promise<void>;
  flagSaintName(name: string): Promise<void>;
  listSaintFlags(limit: number): Promise<SaintFlag[]>;
  dismissSaintFlag(name: string): Promise<void>;
  getAccount(sub: string): Promise<AccountDoc | null>;
  /** Creates the link unless one exists; returns the link that's stored (the existing one wins). */
  linkAccount(account: AccountDoc): Promise<AccountDoc>;
  listAccounts(limit: number): Promise<AccountDoc[]>;
  deleteAccountsForUid(uid: string): Promise<void>;
  addInvites(invites: InviteDoc[]): Promise<void>;
  listInvites(createdBy: string, limit: number): Promise<InviteDoc[]>;
  /** Marks the invite used by `uid` if allowed, in one transaction. */
  redeemInvite(code: string, uid: string): Promise<{ result: RedeemResult; createdBy?: string }>;
  deleteUnusedInvites(createdBy: string): Promise<void>;
  /** False when the email is already on the list. */
  addToWaitlist(entry: WaitlistDoc): Promise<boolean>;
  listWaitlist(limit: number): Promise<WaitlistDoc[]>;
  markWaitlistInvited(email: string, code: string): Promise<void>;
}

/** Where card pictures live: Cloud Storage in production, memory for local runs and tests. */
export interface MediaStore {
  kind: 'gcs' | 'memory';
  put(path: string, data: Buffer, contentType: string): Promise<void>;
  get(path: string): Promise<{ data: Buffer; contentType: string } | null>;
  deletePrefix(prefix: string): Promise<void>;
}

export class MemoryMedia implements MediaStore {
  kind = 'memory' as const;
  private files = new Map<string, { data: Buffer; contentType: string }>();
  async put(path: string, data: Buffer, contentType: string) {
    this.files.set(path, { data, contentType });
  }
  async get(path: string) {
    return this.files.get(path) || null;
  }
  async deletePrefix(prefix: string) {
    for (const k of [...this.files.keys()]) if (k.startsWith(prefix)) this.files.delete(k);
  }
}

export async function createGcsMedia(bucketName: string): Promise<MediaStore> {
  const { Storage } = await import('@google-cloud/storage');
  const bucket = new Storage().bucket(bucketName);
  return {
    kind: 'gcs',
    async put(path, data, contentType) {
      await bucket.file(path).save(data, { contentType, resumable: false });
    },
    async get(path) {
      const file = bucket.file(path);
      const [exists] = await file.exists();
      if (!exists) return null;
      const [[data], [meta]] = await Promise.all([file.download(), file.getMetadata()]);
      return { data, contentType: meta.contentType || 'application/octet-stream' };
    },
    async deletePrefix(prefix) {
      await bucket.deleteFiles({ prefix, force: true });
    },
  };
}

/** "St. Jude", "Saint Jude" and "st jude" are one flag. */
const flagKey = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(st|sts|saint|saints|san|santa|santo|sta|sto)\b\.?/g, '')
    .replace(/[^a-z]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';

// ---------- In memory ----------

export class MemoryStore implements Store {
  kind = 'memory' as const;
  private users = new Map<string, UserDoc>();
  private usage = new Map<string, number>();
  private reviews = new Map<string, Review>();
  private cards = new Map<string, CardDoc>();
  private saintFlags = new Map<string, SaintFlag>();
  private accounts = new Map<string, AccountDoc>();
  private invites = new Map<string, InviteDoc>();
  private waitlist = new Map<string, WaitlistDoc>();

  async getUser(uid: string) {
    const u = this.users.get(uid);
    return u ? structuredClone(u) : null;
  }
  async updateUser(uid: string, fn: (current: UserDoc | null) => UserDoc) {
    const next = fn(await this.getUser(uid));
    this.users.set(uid, structuredClone(next));
    return next;
  }
  async deleteUser(uid: string) {
    this.users.delete(uid);
  }
  async bumpUsage(key: string) {
    const n = (this.usage.get(key) || 0) + 1;
    this.usage.set(key, n);
    return n;
  }
  async getUsage(key: string) {
    return this.usage.get(key) || 0;
  }
  async listReviews() {
    return [...this.reviews.values()].map((r) => ({ ...r }));
  }
  async putReview(review: Review) {
    this.reviews.set(review.itemId, { ...review });
  }
  async deleteReview(itemId: string) {
    this.reviews.delete(itemId);
  }
  async putCard(card: CardDoc) {
    this.cards.set(card.id, { ...card });
  }
  async getCard(id: string) {
    const c = this.cards.get(id);
    return c ? { ...c } : null;
  }
  async deleteCardsBy(senderUid: string) {
    for (const [id, c] of this.cards) if (c.senderUid === senderUid) this.cards.delete(id);
  }
  async flagSaintName(name: string) {
    const key = flagKey(name);
    const cur = this.saintFlags.get(key);
    this.saintFlags.set(key, { name: cur?.name || name, count: (cur?.count || 0) + 1, lastSeen: new Date().toISOString() });
  }
  async listSaintFlags(limit: number) {
    return [...this.saintFlags.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, limit);
  }
  async dismissSaintFlag(name: string) {
    this.saintFlags.delete(flagKey(name));
  }
  async getAccount(sub: string) {
    const a = this.accounts.get(sub);
    return a ? { ...a } : null;
  }
  async linkAccount(account: AccountDoc) {
    const existing = this.accounts.get(account.sub);
    if (existing) return { ...existing };
    this.accounts.set(account.sub, { ...account });
    return { ...account };
  }
  async listAccounts(limit: number) {
    return [...this.accounts.values()].sort((a, b) => b.linkedAt.localeCompare(a.linkedAt)).slice(0, limit);
  }
  async deleteAccountsForUid(uid: string) {
    for (const [sub, a] of this.accounts) if (a.uid === uid) this.accounts.delete(sub);
  }
  async addInvites(invites: InviteDoc[]) {
    invites.forEach((i) => this.invites.set(i.code, { ...i }));
  }
  async listInvites(createdBy: string, limit: number) {
    return [...this.invites.values()].filter((i) => i.createdBy === createdBy).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
  async redeemInvite(code: string, uid: string) {
    const invite = this.invites.get(code) || null;
    const result = checkRedeem(invite, uid);
    if (result === 'ok' && invite && !invite.usedBy) this.invites.set(code, { ...invite, usedBy: uid, usedAt: new Date().toISOString() });
    return { result, createdBy: invite?.createdBy };
  }
  async deleteUnusedInvites(createdBy: string) {
    for (const [code, i] of this.invites) if (i.createdBy === createdBy && !i.usedBy) this.invites.delete(code);
  }
  async addToWaitlist(entry: WaitlistDoc) {
    if (this.waitlist.has(entry.email)) return false;
    this.waitlist.set(entry.email, { ...entry });
    return true;
  }
  async listWaitlist(limit: number) {
    return [...this.waitlist.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, limit);
  }
  async markWaitlistInvited(email: string, code: string) {
    const w = this.waitlist.get(email);
    if (w) this.waitlist.set(email, { ...w, invitedCode: code });
  }
}

// ---------- Firestore ----------

export async function createFirestoreStore(): Promise<Store> {
  const { Firestore, FieldValue } = await import('@google-cloud/firestore');
  const db = new Firestore({ projectId: process.env.GOOGLE_CLOUD_PROJECT, ignoreUndefinedProperties: true });
  const userRef = (uid: string) => db.collection('users').doc(uid);

  return {
    kind: 'firestore',
    async getUser(uid) {
      const snap = await userRef(uid).get();
      return snap.exists ? (snap.data() as UserDoc) : null;
    },
    async updateUser(uid, fn) {
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef(uid));
        const next = fn(snap.exists ? (snap.data() as UserDoc) : null);
        tx.set(userRef(uid), next);
        return next;
      });
    },
    async deleteUser(uid) {
      await userRef(uid).delete();
    },
    async bumpUsage(key) {
      const ref = db.collection('usage').doc(key);
      await ref.set({ count: FieldValue.increment(1), updatedAt: new Date().toISOString() }, { merge: true });
      return ((await ref.get()).data()?.count as number) || 1;
    },
    async getUsage(key) {
      return ((await db.collection('usage').doc(key).get()).data()?.count as number) || 0;
    },
    async listReviews() {
      return (await db.collection('reviews').get()).docs.map((d) => d.data() as Review);
    },
    async putReview(review) {
      await db.collection('reviews').doc(review.itemId).set(review);
    },
    async deleteReview(itemId) {
      await db.collection('reviews').doc(itemId).delete();
    },
    async putCard(card) {
      await db.collection('cards').doc(card.id).set(card);
    },
    async getCard(id) {
      const snap = await db.collection('cards').doc(id).get();
      return snap.exists ? (snap.data() as CardDoc) : null;
    },
    async deleteCardsBy(senderUid) {
      const snap = await db.collection('cards').where('senderUid', '==', senderUid).get();
      await Promise.all(snap.docs.map((d) => d.ref.delete()));
    },
    async flagSaintName(name) {
      const ref = db.collection('saintFlags').doc(flagKey(name));
      await ref.set({ name, count: FieldValue.increment(1), lastSeen: new Date().toISOString() }, { merge: true });
    },
    async listSaintFlags(limit) {
      const snap = await db.collection('saintFlags').orderBy('lastSeen', 'desc').limit(limit).get();
      return snap.docs.map((d) => d.data() as SaintFlag);
    },
    async dismissSaintFlag(name) {
      await db.collection('saintFlags').doc(flagKey(name)).delete();
    },
    async getAccount(sub) {
      const snap = await db.collection('accounts').doc(sub).get();
      return snap.exists ? (snap.data() as AccountDoc) : null;
    },
    async linkAccount(account) {
      const ref = db.collection('accounts').doc(account.sub);
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) return snap.data() as AccountDoc;
        tx.set(ref, account);
        return account;
      });
    },
    async listAccounts(limit) {
      const snap = await db.collection('accounts').orderBy('linkedAt', 'desc').limit(limit).get();
      return snap.docs.map((d) => d.data() as AccountDoc);
    },
    async deleteAccountsForUid(uid) {
      const snap = await db.collection('accounts').where('uid', '==', uid).get();
      await Promise.all(snap.docs.map((d) => d.ref.delete()));
    },
    async addInvites(invites) {
      const batch = db.batch();
      invites.forEach((i) => batch.set(db.collection('invites').doc(i.code), i));
      await batch.commit();
    },
    async listInvites(createdBy, limit) {
      const snap = await db.collection('invites').where('createdBy', '==', createdBy).get();
      return snap.docs
        .map((d) => d.data() as InviteDoc)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },
    async redeemInvite(code, uid) {
      const ref = db.collection('invites').doc(code);
      return db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const invite = snap.exists ? (snap.data() as InviteDoc) : null;
        const result = checkRedeem(invite, uid);
        if (result === 'ok' && invite && !invite.usedBy) tx.update(ref, { usedBy: uid, usedAt: new Date().toISOString() });
        return { result, createdBy: invite?.createdBy };
      });
    },
    async deleteUnusedInvites(createdBy) {
      const snap = await db.collection('invites').where('createdBy', '==', createdBy).get();
      await Promise.all(snap.docs.filter((d) => !d.data().usedBy).map((d) => d.ref.delete()));
    },
    async addToWaitlist(entry) {
      try {
        await db.collection('waitlist').doc(entry.email).create(entry);
        return true;
      } catch (err: any) {
        if (err?.code === 6) return false; // ALREADY_EXISTS
        throw err;
      }
    },
    async listWaitlist(limit) {
      const snap = await db.collection('waitlist').orderBy('createdAt', 'asc').limit(limit).get();
      return snap.docs.map((d) => d.data() as WaitlistDoc);
    },
    async markWaitlistInvited(email, code) {
      await db.collection('waitlist').doc(email).set({ invitedCode: code }, { merge: true });
    },
  };
}
