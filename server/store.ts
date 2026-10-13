// Where Rosa Maria keeps its data. Firestore in production (only this server can reach it, using the
// Cloud Run identity); an in-memory copy for local runs and tests (DATA_STORE=memory).
import type { LibraryPiece, PieceStatus } from './library';
import { checkRedeem, type AccountDoc, type InviteDoc, type Membership, type RedeemResult, type WaitlistDoc } from './accounts';

export interface UserDoc {
  /** Set once an invite is redeemed (or for the founder). */
  member?: Membership;
  /** The Google account signed in on this user, for display. */
  account?: { email: string; name: string };
  createdAt: string;
  updatedAt: string;
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
  listLibrary(status?: PieceStatus): Promise<LibraryPiece[]>;
  getPiece(id: string): Promise<LibraryPiece | null>;
  putPiece(piece: LibraryPiece): Promise<void>;
  /** Adds pieces whose ids aren't there yet; returns how many were added. */
  seedLibrary(pieces: LibraryPiece[]): Promise<number>;
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

// ---------- In memory ----------

export class MemoryStore implements Store {
  kind = 'memory' as const;
  private users = new Map<string, UserDoc>();
  private usage = new Map<string, number>();
  private library = new Map<string, LibraryPiece>();
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
  async listLibrary(status?: PieceStatus) {
    return [...this.library.values()].filter((p) => !status || p.status === status).map((p) => structuredClone(p));
  }
  async getPiece(id: string) {
    const p = this.library.get(id);
    return p ? structuredClone(p) : null;
  }
  async putPiece(piece: LibraryPiece) {
    this.library.set(piece.id, structuredClone(piece));
  }
  async seedLibrary(pieces: LibraryPiece[]) {
    const fresh = pieces.filter((p) => !this.library.has(p.id));
    fresh.forEach((p) => this.library.set(p.id, structuredClone(p)));
    return fresh.length;
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
    async listLibrary(status) {
      const ref = db.collection('library');
      const snap = await (status ? ref.where('status', '==', status) : ref).get();
      return snap.docs.map((d) => d.data() as LibraryPiece);
    },
    async getPiece(id) {
      const snap = await db.collection('library').doc(id).get();
      return snap.exists ? (snap.data() as LibraryPiece) : null;
    },
    async putPiece(piece) {
      await db.collection('library').doc(piece.id).set(piece);
    },
    async seedLibrary(pieces) {
      const existing = new Set((await db.collection('library').select().get()).docs.map((d) => d.id));
      const fresh = pieces.filter((p) => !existing.has(p.id));
      for (let i = 0; i < fresh.length; i += 400) {
        const batch = db.batch();
        fresh.slice(i, i + 400).forEach((p) => batch.set(db.collection('library').doc(p.id), p));
        await batch.commit();
      }
      return fresh.length;
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
