import type { Request, Response, NextFunction } from 'express';

/** Adds `inc` to counter `key` (0 just reads it) and returns the new value; resets after `windowSec`. */
export type HitFn = (key: string, windowSec: number, inc?: number) => Promise<number>;

/** Per-instance fallback for local development (and the old Firestore mode). */
export function memoryHit(): HitFn {
  const counters = new Map<string, { count: number; start: number }>();
  return async (key, windowSec, inc = 1) => {
    const now = Date.now();
    let c = counters.get(key);
    if (!c || now - c.start > windowSec * 1000) {
      c = { count: 0, start: now };
      counters.set(key, c);
    }
    c.count += inc;
    return c.count;
  };
}

export function clientIp(req: Request): string {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown');
}

const TOO_MANY = 'มีการส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่';

interface Rule {
  method: string;
  path: string;
  /** Requests allowed per IP within the window. */
  perIp: number;
  windowSec: number;
  /**
   * Failed lookups (status 401/404) allowed per order number within `failWindowSec`,
   * counted across all IPs so the 4-digit phone check can't be brute-forced.
   */
  failKey?: (req: Request) => string | null;
  maxFails?: number;
  failWindowSec?: number;
  failMessage?: string;
}

const orderKey = (req: Request) => {
  const n = String(req.body?.orderNumber || '').trim().toUpperCase();
  return n ? `fail:order:${n}` : null;
};

// Mobile networks put many customers behind one IP, so the per-IP limits for booking are generous.
const RULES: Rule[] = [
  // Per IP only: a shared counter would let anyone lock the real admin out.
  { method: 'POST', path: '/admin/login', perIp: 10, windowSec: 15 * 60 },
  {
    method: 'POST',
    path: '/orders/track',
    perIp: 120,
    windowSec: 10 * 60,
    failKey: orderKey,
    maxFails: 10,
    failWindowSec: 60 * 60,
    failMessage: 'ตรวจสอบใบจองนี้ผิดหลายครั้ง กรุณารอ 1 ชั่วโมง หรือติดต่อเจ้าหน้าที่ทาง LINE',
  },
  {
    method: 'POST',
    path: '/orders/slip',
    perIp: 60,
    windowSec: 10 * 60,
    failKey: orderKey,
    maxFails: 10,
    failWindowSec: 60 * 60,
    failMessage: 'ตรวจสอบใบจองนี้ผิดหลายครั้ง กรุณารอ 1 ชั่วโมง หรือติดต่อเจ้าหน้าที่ทาง LINE',
  },
  // Whole offices often share one public IP (e.g. staff on the same Wi-Fi), so these are generous.
  { method: 'POST', path: '/orders', perIp: 120, windowSec: 10 * 60 },
  { method: 'POST', path: '/raja-slots/toggle', perIp: 400, windowSec: 10 * 60 },
  { method: 'POST', path: '/inquiries', perIp: 20, windowSec: 10 * 60 },
  // Visit counter: generous (shared mobile IPs), but stops one script from inflating the numbers.
  { method: 'POST', path: '/visit', perIp: 300, windowSec: 10 * 60 },
];

/** Mounted on `/api` before the request queue, so refused requests never touch the store. */
export function rateLimiter(getHit: () => HitFn) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const rule = RULES.find((r) => r.method === req.method && r.path === req.path);
    if (!rule) return next();
    const hit = getHit();
    try {
      const ip = clientIp(req);
      const n = await hit(`ip:${rule.path}:${ip}`, rule.windowSec);
      if (n > rule.perIp) {
        res.set('Retry-After', String(rule.windowSec));
        res.status(429).json({ error: TOO_MANY });
        return;
      }
      const fk = rule.failKey?.(req);
      if (fk) {
        const fails = await hit(fk, rule.failWindowSec!, 0);
        if (fails >= rule.maxFails!) {
          res.set('Retry-After', String(rule.failWindowSec));
          res.status(429).json({ error: rule.failMessage });
          return;
        }
        // Count the failure before the response goes out: a serverless function may be frozen
        // as soon as it has answered.
        const send = res.json.bind(res);
        res.json = ((body?: unknown) => {
          if (res.statusCode !== 401 && res.statusCode !== 404) return send(body);
          hit(fk, rule.failWindowSec!)
            .catch(() => 0)
            .then(() => send(body));
          return res;
        }) as typeof res.json;
      }
    } catch (err) {
      // A broken counter must not take the shop down: let the request through.
      console.warn('[rate-limit] skipped:', (err as Error).message);
    }
    next();
  };
}
