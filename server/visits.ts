/**
 * Anonymous visitor counting for the admin dashboard.
 *
 * Each browser keeps a random id (no personal data) and reports one page load per visit;
 * the server keeps one row per id per day (Thailand time) with a view count. Stored in
 * Postgres (bpp.visits) when DATABASE_URL is set, otherwise in memory for local development.
 */
export interface VisitDay {
  day: string;
  visitors: number;
  views: number;
}

export interface VisitStats {
  today: { visitors: number; views: number };
  total: { visitors: number; views: number };
  /** The last 14 days, oldest first, including days without visits */
  days: VisitDay[];
}

export interface VisitStore {
  record(vid: string): Promise<void>;
  stats(): Promise<VisitStats>;
}

export const isVisitorId = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(v);

/** yyyy-mm-dd in Thailand time */
export const bangkokDay = (d = new Date()) =>
  new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

/** Fills in the days without visits so the chart always shows 14 bars. */
export function lastDays(rows: VisitDay[], count = 14, today = bangkokDay()): VisitDay[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: VisitDay[] = [];
  const end = new Date(`${today}T00:00:00Z`).getTime();
  for (let i = count - 1; i >= 0; i--) {
    const day = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    out.push(byDay.get(day) ?? { day, visitors: 0, views: 0 });
  }
  return out;
}

export function memoryVisits(): VisitStore {
  const days = new Map<string, Map<string, number>>();
  return {
    async record(vid) {
      const day = bangkokDay();
      const m = days.get(day) ?? new Map<string, number>();
      m.set(vid, (m.get(vid) ?? 0) + 1);
      days.set(day, m);
    },
    async stats() {
      const rows: VisitDay[] = [...days].map(([day, m]) => ({
        day,
        visitors: m.size,
        views: [...m.values()].reduce((a, b) => a + b, 0),
      }));
      const all = new Set<string>();
      days.forEach((m) => m.forEach((_v, vid) => all.add(vid)));
      const today = rows.find((r) => r.day === bangkokDay());
      return {
        today: { visitors: today?.visitors ?? 0, views: today?.views ?? 0 },
        total: { visitors: all.size, views: rows.reduce((a, r) => a + r.views, 0) },
        days: lastDays(rows),
      };
    },
  };
}
