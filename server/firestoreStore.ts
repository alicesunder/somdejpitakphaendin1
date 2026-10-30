import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Firestore persistence for the storefront.
 *
 * Small, tightly-coupled sections live in single documents under `store/<name>`
 * (guarded by a revision counter so two serverless instances can't silently
 * overwrite each other). Orders and inquiries grow without bound, so each one
 * is its own document in the `orders` / `inquiries` collections.
 */
const DOCS = ['siteConfig', 'products', 'rajaSlots', 'news'] as const;
const COLS = ['orders', 'inquiries'] as const;
type DocName = (typeof DOCS)[number];
export type ColName = (typeof COLS)[number];

export class ConflictError extends Error {
  conflict = true;
}

interface Seed {
  siteConfig: unknown;
  products: unknown[];
  rajaSlots: unknown[];
  news: unknown[];
}

type Store = Record<string, any>;

function parseServiceAccount(raw: string) {
  const text = raw.trim().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf-8');
  const json = JSON.parse(text);
  if (typeof json.private_key === 'string') {
    json.private_key = json.private_key.replace(/\n/g, '\n');
  }
  return json;
}

export function isFirestoreConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

export function createFirestoreStore(seed: () => Seed) {
  let db: Firestore | null = null;
  const getDb = (): Firestore => {
    if (db) return db;
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert(parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT!)),
      });
    db = getFirestore(app, process.env.FIREBASE_DATABASE_ID || '(default)');
    return db;
  };

  const docSnap: Partial<Record<DocName, string>> = {};
  const docRev: Partial<Record<DocName, number>> = {};
  const colSnap: Record<ColName, Map<string, string>> = {
    orders: new Map(),
    inquiries: new Map(),
  };
  const colLoaded = new Set<ColName>();
  // When the in-memory copy was last known to match Firestore. Lets busy read-only
  // endpoints skip Firestore reads (the free tier allows only 50k reads/day).
  let syncedAt = 0;

  // JSON round-trip drops `undefined` values, which Firestore rejects.
  const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  const payloadOf = (name: DocName, value: unknown, rev: number) =>
    name === 'siteConfig' ? { rev, value: clean(value) } : { rev, items: clean(value) };

  async function load(
    store: Store,
    cols: ColName[],
    opts: { maxAgeMs?: number } = {},
  ): Promise<void> {
    if (
      opts.maxAgeMs &&
      cols.length === 0 &&
      syncedAt > 0 &&
      Date.now() - syncedAt < opts.maxAgeMs
    ) {
      return;
    }
    syncedAt = 0;
    const d = getDb();
    const refs = DOCS.map((n) => d.collection('store').doc(n));
    const snaps = await d.getAll(...refs);

    if (!snaps[0].exists) {
      const s = seed() as Record<DocName, unknown>;
      const batch = d.batch();
      DOCS.forEach((n, i) => batch.set(refs[i], payloadOf(n, s[n], 1)));
      await batch.commit();
      DOCS.forEach((n) => {
        store[n] = s[n];
        docRev[n] = 1;
        docSnap[n] = JSON.stringify(s[n]);
      });
    } else {
      DOCS.forEach((n, i) => {
        const data = snaps[i].data() || {};
        const value = n === 'siteConfig' ? data.value : data.items;
        store[n] = value;
        docRev[n] = data.rev ?? 0;
        docSnap[n] = JSON.stringify(value);
      });
    }

    colLoaded.clear();
    for (const c of COLS) {
      colSnap[c] = new Map();
      store[c] = [];
    }
    for (const c of cols) {
      const qs = await d.collection(c).get();
      const items = qs.docs.map((x) => x.data());
      items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      store[c] = items;
      colSnap[c] = new Map(items.map((i) => [i.id, JSON.stringify(i)]));
      colLoaded.add(c);
    }
    syncedAt = Date.now();
  }

  async function persist(store: Store): Promise<void> {
    const d = getDb();
    const changedDocs = DOCS.filter((n) => JSON.stringify(store[n]) !== docSnap[n]);
    const colWrites: { col: ColName; id: string; item: any }[] = [];
    const colDeletes: { col: ColName; id: string }[] = [];
    for (const c of COLS) {
      const seen = new Set<string>();
      for (const item of store[c] as any[]) {
        seen.add(item.id);
        if (colSnap[c].get(item.id) !== JSON.stringify(item)) {
          colWrites.push({ col: c, id: item.id, item });
        }
      }
      if (colLoaded.has(c)) {
        for (const id of colSnap[c].keys()) {
          if (!seen.has(id)) colDeletes.push({ col: c, id });
        }
      }
    }
    if (!changedDocs.length && !colWrites.length && !colDeletes.length) return;

    // Until the write succeeds the in-memory copy may differ from Firestore.
    syncedAt = 0;
    await d.runTransaction(async (tx) => {
      const refs = changedDocs.map((n) => d.collection('store').doc(n));
      const current = await Promise.all(refs.map((r) => tx.get(r)));
      current.forEach((s, i) => {
        if ((s.data()?.rev ?? 0) !== docRev[changedDocs[i]]) {
          throw new ConflictError('stale revision');
        }
      });
      changedDocs.forEach((n, i) =>
        tx.set(refs[i], payloadOf(n, store[n], (docRev[n] ?? 0) + 1)),
      );
      for (const w of colWrites) tx.set(d.collection(w.col).doc(w.id), clean(w.item));
      for (const x of colDeletes) tx.delete(d.collection(x.col).doc(x.id));
    });

    changedDocs.forEach((n) => {
      docRev[n] = (docRev[n] ?? 0) + 1;
      docSnap[n] = JSON.stringify(store[n]);
    });
    for (const w of colWrites) colSnap[w.col].set(w.id, JSON.stringify(w.item));
    for (const x of colDeletes) colSnap[x.col].delete(x.id);
    syncedAt = Date.now();
  }

  // Payment-slip images live in their own collection (one document per order) so they are
  // only read when someone opens a slip, never with the order list.
  async function saveSlip(orderId: string, rec: Record<string, unknown>): Promise<void> {
    await getDb().collection('slips').doc(orderId).set(rec);
  }
  async function deleteSlip(orderId: string): Promise<void> {
    await getDb().collection('slips').doc(orderId).delete();
  }
  async function getSlip(orderId: string): Promise<Record<string, any> | null> {
    const snap = await getDb().collection('slips').doc(orderId).get();
    return snap.exists ? (snap.data() as Record<string, any>) : null;
  }

  /** Everything stored in Firestore, for the one-time copy into Postgres. */
  async function exportAll() {
    const d = getDb();
    const snaps = await d.getAll(...DOCS.map((n) => d.collection('store').doc(n)));
    if (!snaps[0].exists) return null;
    const docs: Partial<Record<DocName, { rev: number; value: unknown }>> = {};
    DOCS.forEach((n, i) => {
      const data = snaps[i].data();
      if (data) docs[n] = { rev: data.rev ?? 1, value: n === 'siteConfig' ? data.value : data.items };
    });
    const [orders, inquiries, slips] = await Promise.all(
      ['orders', 'inquiries', 'slips'].map((c) => d.collection(c).get()),
    );
    return {
      docs,
      orders: orders.docs.map((x) => x.data()),
      inquiries: inquiries.docs.map((x) => x.data()),
      slips: slips.docs.map((x) => ({ orderId: x.id, data: x.data() })),
    };
  }

  return { load, persist, saveSlip, getSlip, deleteSlip, exportAll };
}
