import pg from 'pg';
import type { ColName } from './firestoreStore';
import { lastDays, type VisitStore } from './visits';

/**
 * Postgres (Supabase) persistence for the storefront — same contract as the Firestore store.
 *
 * Tables live in schema `bpp` (see the `bpp_amulet_store` migration): the small sections are
 * rows of `bpp.docs` guarded by a revision counter, so two serverless instances can't silently
 * overwrite each other; orders and inquiries are one row each; slip images sit in `bpp.slips`.
 *
 * On the very first start against an empty database the data is copied over from the old
 * store (Firestore) when `importLegacy` is given, otherwise the seed data is written.
 */
const DOCS = ['siteConfig', 'products', 'rajaSlots', 'news'] as const;
const COLS = ['orders', 'inquiries'] as const;
type DocName = (typeof DOCS)[number];

export interface LegacyDump {
  docs: Partial<Record<DocName, { rev: number; value: unknown }>>;
  orders: any[];
  inquiries: any[];
  slips: { orderId: string; data: Record<string, unknown> }[];
}

interface Seed {
  siteConfig: unknown;
  products: unknown[];
  rajaSlots: unknown[];
  news: unknown[];
}

type Store = Record<string, any>;

class ConflictError extends Error {
  conflict = true;
}

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function createPostgresStore(seed: () => Seed, importLegacy?: () => Promise<LegacyDump | null>) {
  let pool: pg.Pool | null = null;
  const getPool = (): pg.Pool => {
    if (pool) return pool;
    // sslmode in the URL would force strict certificate checks; TLS is set explicitly instead.
    const url = process.env.DATABASE_URL!.trim().replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    pool = new pg.Pool({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
    pool.on('error', (e) => console.warn('[db] idle client error:', e.message));
    return pool;
  };

  async function inTx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query('begin');
      const out = await fn(client);
      await client.query('commit');
      return out;
    } catch (err) {
      try {
        await client.query('rollback');
      } catch {
        /* connection already broken */
      }
      throw err;
    } finally {
      client.release();
    }
  }

  const docSnap: Partial<Record<DocName, string>> = {};
  const docRev: Partial<Record<DocName, number>> = {};
  const colSnap: Record<ColName, Map<string, string>> = {
    orders: new Map(),
    inquiries: new Map(),
  };
  const colLoaded = new Set<ColName>();
  // When the in-memory copy was last known to match the database; lets busy read-only
  // endpoints skip a round trip.
  let syncedAt = 0;
  let ready: Promise<void> | null = null;

  const json = (v: unknown) => JSON.stringify(v ?? null);

  async function ensureSeeded(): Promise<void> {
    const [{ n }] = (await getPool().query('select count(*)::int as n from bpp.docs')).rows;
    if (n >= DOCS.length) return;

    const legacy = importLegacy ? await importLegacy() : null;
    const s = seed() as Record<DocName, unknown>;
    await inTx(async (c) => {
      // Only one instance writes the first copy; the rest find the rows already there.
      await c.query("select pg_advisory_xact_lock(hashtext('bpp_seed'))");
      for (const name of DOCS) {
        const old = legacy?.docs[name];
        const value = old && old.value !== undefined && old.value !== null ? old.value : s[name];
        await c.query(
          'insert into bpp.docs (name, rev, value) values ($1, $2, $3::jsonb) on conflict (name) do nothing',
          [name, old?.rev ?? 1, json(value)],
        );
      }
      if (!legacy) return;
      for (const col of COLS) {
        for (const item of legacy[col]) {
          if (!item?.id) continue;
          await c.query(
            `insert into bpp.${col} (id, created_at, data) values ($1, $2, $3::jsonb) on conflict (id) do nothing`,
            [item.id, String(item.createdAt ?? ''), json(item)],
          );
        }
      }
      for (const slip of legacy.slips) {
        await c.query(
          'insert into bpp.slips (order_id, data) values ($1, $2::jsonb) on conflict (order_id) do nothing',
          [slip.orderId, json(slip.data)],
        );
      }
    });
    console.log(
      legacy
        ? `[db] copied store from Firestore: ${legacy.orders.length} orders, ${legacy.inquiries.length} inquiries, ${legacy.slips.length} slips`
        : '[db] wrote seed data to an empty database',
    );
  }

  async function load(store: Store, cols: ColName[], opts: { maxAgeMs?: number } = {}): Promise<void> {
    if (opts.maxAgeMs && cols.length === 0 && syncedAt > 0 && Date.now() - syncedAt < opts.maxAgeMs) {
      return;
    }
    syncedAt = 0;
    if (!ready) {
      ready = ensureSeeded().catch((err) => {
        ready = null;
        throw err;
      });
    }
    await ready;

    const p = getPool();
    const rows = (await p.query('select name, rev, value from bpp.docs')).rows;
    const byName = new Map(rows.map((r) => [r.name as string, r]));
    for (const name of DOCS) {
      const row = byName.get(name);
      store[name] = row ? row.value : null;
      docRev[name] = row ? row.rev : 0;
      docSnap[name] = JSON.stringify(store[name]);
    }

    colLoaded.clear();
    for (const c of COLS) {
      colSnap[c] = new Map();
      store[c] = [];
    }
    for (const c of cols) {
      const items = (await p.query(`select data from bpp.${c} order by created_at desc`)).rows.map((r) => r.data);
      store[c] = items;
      colSnap[c] = new Map(items.map((i: any) => [i.id, JSON.stringify(i)]));
      colLoaded.add(c);
    }
    syncedAt = Date.now();
  }

  async function persist(store: Store): Promise<void> {
    const changedDocs = DOCS.filter((n) => JSON.stringify(store[n]) !== docSnap[n]);
    const colWrites: { col: ColName; item: any }[] = [];
    const colDeletes: { col: ColName; id: string }[] = [];
    for (const c of COLS) {
      const seen = new Set<string>();
      for (const item of store[c] as any[]) {
        seen.add(item.id);
        if (colSnap[c].get(item.id) !== JSON.stringify(item)) colWrites.push({ col: c, item });
      }
      if (colLoaded.has(c)) {
        for (const id of colSnap[c].keys()) {
          if (!seen.has(id)) colDeletes.push({ col: c, id });
        }
      }
    }
    if (!changedDocs.length && !colWrites.length && !colDeletes.length) return;

    // Until the write succeeds the in-memory copy may differ from the database.
    syncedAt = 0;
    await inTx(async (c) => {
      for (const name of changedDocs) {
        const r = await c.query('update bpp.docs set value = $1::jsonb, rev = rev + 1 where name = $2 and rev = $3', [
          json(store[name]),
          name,
          docRev[name] ?? 0,
        ]);
        if (r.rowCount !== 1) throw new ConflictError('stale revision');
      }
      for (const w of colWrites) {
        await c.query(
          `insert into bpp.${w.col} (id, created_at, data) values ($1, $2, $3::jsonb)
           on conflict (id) do update set created_at = excluded.created_at, data = excluded.data`,
          [w.item.id, String(w.item.createdAt ?? ''), json(w.item)],
        );
      }
      for (const x of colDeletes) await c.query(`delete from bpp.${x.col} where id = $1`, [x.id]);
    });

    for (const name of changedDocs) {
      docRev[name] = (docRev[name] ?? 0) + 1;
      docSnap[name] = JSON.stringify(store[name]);
    }
    for (const w of colWrites) colSnap[w.col].set(w.item.id, JSON.stringify(w.item));
    for (const x of colDeletes) colSnap[x.col].delete(x.id);
    syncedAt = Date.now();
  }

  // Slip images are only read when someone opens a slip, never with the order list.
  async function saveSlip(orderId: string, rec: Record<string, unknown>): Promise<void> {
    await getPool().query(
      `insert into bpp.slips (order_id, data) values ($1, $2::jsonb)
       on conflict (order_id) do update set data = excluded.data, updated_at = now()`,
      [orderId, json(rec)],
    );
  }
  async function deleteSlip(orderId: string): Promise<void> {
    await getPool().query('delete from bpp.slips where order_id = $1', [orderId]);
  }
  async function getSlip(orderId: string): Promise<Record<string, any> | null> {
    const rows = (await getPool().query('select data from bpp.slips where order_id = $1', [orderId])).rows;
    return rows.length ? rows[0].data : null;
  }

  /**
   * Adds `inc` to the counter `key` (0 just reads it) and returns the new value. The counter
   * starts over once `windowSec` has passed since its window began. Shared by every instance.
   */
  async function hit(key: string, windowSec: number, inc = 1): Promise<number> {
    const p = getPool();
    const rows = (
      await p.query(
        `insert into bpp.rate_limits as r (key, count, window_start) values ($1, $3, now())
         on conflict (key) do update set
           count = case when r.window_start < now() - make_interval(secs => $2::float8) then $3 else r.count + $3 end,
           window_start = case when r.window_start < now() - make_interval(secs => $2::float8) then now() else r.window_start end
         returning count`,
        [key, windowSec, inc],
      )
    ).rows;
    if (Math.random() < 0.01) {
      p.query("delete from bpp.rate_limits where window_start < now() - interval '1 day'").catch(() => {});
    }
    return rows[0].count;
  }

  const BKK_DAY = "(now() at time zone 'Asia/Bangkok')::date";
  const visits: VisitStore = {
    async record(vid) {
      await getPool().query(
        `insert into bpp.visits (day, vid) values (${BKK_DAY}, $1)
         on conflict (day, vid) do update set views = bpp.visits.views + 1`,
        [vid],
      );
    },
    async stats() {
      const p = getPool();
      const [sum] = (
        await p.query(
          `select
             (select count(*) from bpp.visits where day = ${BKK_DAY})::int as today_visitors,
             (select coalesce(sum(views), 0) from bpp.visits where day = ${BKK_DAY})::int as today_views,
             (select count(distinct vid) from bpp.visits)::int as total_visitors,
             (select coalesce(sum(views), 0) from bpp.visits)::int as total_views`,
        )
      ).rows;
      const days = (
        await p.query(
          `select to_char(day, 'YYYY-MM-DD') as day, count(*)::int as visitors, sum(views)::int as views
           from bpp.visits where day > ${BKK_DAY} - 14 group by day`,
        )
      ).rows;
      return {
        today: { visitors: sum.today_visitors, views: sum.today_views },
        total: { visitors: sum.total_visitors, views: sum.total_views },
        days: lastDays(days),
      };
    },
  };

  return { load, persist, saveSlip, getSlip, deleteSlip, hit, visits };
}
