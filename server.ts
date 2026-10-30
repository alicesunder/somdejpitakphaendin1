import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  createInitialRajaSlots,
  initialInquiries,
  initialNews,
  initialOrders,
  initialProducts,
  initialSiteConfig,
} from './src/data/seedData';
import {
  AmuletProduct,
  ContactInquiry,
  NewsArticle,
  OrderRecord,
  PaymentStatus,
  PreparationStatus,
  RajaSetSlot,
  ShippingStatus,
  SiteConfig,
} from './src/types';
import {
  calculateOrderTotals,
  formatThaiDate,
  HOLD_DURATION_MS,
  maskCustomerPII,
  numberToThaiBahtText,
  validateCheckoutForm,
  verifyPhoneLast4,
} from './src/utils/commerceRules';
import {
  ColName,
  createFirestoreStore,
  isFirestoreConfigured,
} from './server/firestoreStore';
import { createPostgresStore, isPostgresConfigured } from './server/postgresStore';
import { HitFn, memoryHit, rateLimiter } from './server/rateLimit';
import { BOOKING_CLOSED_MESSAGE, SALES_PAUSED_MESSAGE, isBookingOpen } from './src/config/booking';
import { isMailConfigured, sendReceiptEmail } from './server/mailer';

interface StoreData {
  siteConfig: SiteConfig;
  products: AmuletProduct[];
  orders: OrderRecord[];
  rajaSlots: RajaSetSlot[];
  news: NewsArticle[];
  inquiries: ContactInquiry[];
}

// Production (Vercel) persists to Supabase Postgres (DATABASE_URL), or Firestore when only that
// is configured; local dev falls back to a JSON file. With both set, the first start copies the
// Firestore data into an empty Postgres database.
const seedStore = () => ({
  siteConfig: structuredClone(initialSiteConfig),
  products: structuredClone(initialProducts),
  rajaSlots: createInitialRajaSlots(),
  news: structuredClone(initialNews),
});
const legacyFirestore = isFirestoreConfigured() ? createFirestoreStore(seedStore) : null;
const postgresStore = isPostgresConfigured()
  ? createPostgresStore(seedStore, legacyFirestore ? legacyFirestore.exportAll : undefined)
  : null;
const remoteStore = postgresStore ?? legacyFirestore;
const useRemoteStore = remoteStore !== null;
// Rate-limit counters are shared through Postgres; without it each instance counts on its own.
const rateLimitHit: HitFn = postgresStore ? postgresStore.hit : memoryHit();

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'heritage_store_v6.json');

function loadStore(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoreData;
      if (
        parsed &&
        Array.isArray(parsed.products) &&
        parsed.siteConfig &&
        Array.isArray(parsed.rajaSlots) &&
        parsed.rajaSlots.length === 99
      ) {
        if (
          !parsed.siteConfig.brandTitleThai ||
          parsed.siteConfig.brandTitleThai === 'วัตถุมงคล ตชด.'
        ) {
          parsed.siteConfig.brandTitleThai = 'สมเด็จพิทักษ์แผ่นดิน';
          parsed.siteConfig.brandTitleEnglish =
            '๗๕ ปี ตำรวจตระเวนชายแดน · BPP 75TH';
          saveStore(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Initializing fresh store data:', err);
    try {
      if (fs.existsSync(DATA_FILE)) {
        const backup = `${DATA_FILE}.corrupt-${Date.now()}`;
        fs.copyFileSync(DATA_FILE, backup);
        console.warn(`Unreadable store backed up to ${backup}`);
      }
    } catch {
      // best-effort backup only
    }
  }

  const fresh: StoreData = {
    siteConfig: structuredClone(initialSiteConfig),
    products: structuredClone(initialProducts),
    orders: structuredClone(initialOrders),
    rajaSlots: createInitialRajaSlots(),
    news: structuredClone(initialNews),
    inquiries: structuredClone(initialInquiries),
  };
  saveStore(fresh);
  return fresh;
}

function saveStore(data: StoreData): void {
  // Database mode: changes are diffed and persisted before each API response.
  if (useRemoteStore) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to persist store data:', err);
  }
}

const store: StoreData = useRemoteStore
  ? {
      siteConfig: structuredClone(initialSiteConfig),
      products: [],
      orders: [],
      rajaSlots: [],
      news: [],
      inquiries: [],
    }
  : loadStore();

/**
 * Purges any 15-minute slot holds that have expired and syncs ช1 remaining stock.
 */
function purgeExpiredRajaSlotHolds(): boolean {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let mutated = false;

  for (const slot of store.rajaSlots) {
    if (slot.status === 'held' && slot.heldUntil > 0 && slot.heldUntil <= now) {
      slot.status = 'available';
      slot.sessionId = '';
      slot.heldAt = 0;
      slot.heldUntil = 0;
      slot.orderNumber = '';
      slot.updatedAt = nowIso;
      mutated = true;
    }
  }

  // Keep ช1 stock synced with booked slots
  const rajaProduct = store.products.find(
    (p) => p.code === 'ช1' || p.requiresNumberSelection
  );
  if (rajaProduct) {
    const bookedCount = store.rajaSlots.filter((s) => s.status === 'booked').length;
    const targetStock = Math.max(0, 99 - bookedCount);
    if (rajaProduct.stock !== targetStock || rajaProduct.bookedCount !== bookedCount) {
      rajaProduct.stock = targetStock;
      rajaProduct.bookedCount = bookedCount;
      mutated = true;
    }
  }

  if (mutated) {
    saveStore(store);
  }
  return mutated;
}

// Admin session store (Server-side verification)
const ADMIN_EMAIL = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'adminbpp'; // login user name
// No hardcoded passcode: set ADMIN_PASSCODE in the environment. Outside production a
// random one is generated per start and printed to the server console.
let ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';
if (!ADMIN_PASSCODE && process.env.NODE_ENV !== 'production') {
  ADMIN_PASSCODE = crypto.randomBytes(9).toString('base64url');
  console.warn(
    `ADMIN_PASSCODE not set — temporary dev admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSCODE}`,
  );
} else if (!ADMIN_PASSCODE) {
  console.error('ADMIN_PASSCODE is not set; admin login is disabled.');
}
// Stateless signed admin tokens (serverless instances share no memory).
const TOKEN_SECRET =
  process.env.ADMIN_TOKEN_SECRET ||
  crypto.createHash('sha256').update(`bpp-admin:${ADMIN_PASSCODE}`).digest('hex');
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

function signAdminToken(email: string): string {
  const exp = Date.now() + ADMIN_TOKEN_TTL_MS;
  const body = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const [body, sig] = token.split('.');
  if (!body || !sig || !ADMIN_PASSCODE) return false;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบผู้ดูแลก่อนดำเนินการ' });
    return;
  }

  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'เซสชันผู้ดูแลหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    return;
  }

  next();
}

function enrichRajaSlotsForAdmin(): RajaSetSlot[] {
  purgeExpiredRajaSlotHolds();
  const orderByNo = new Map<string, OrderRecord>();
  const orderBySlot = new Map<number, OrderRecord>();

  for (const ord of store.orders) {
    orderByNo.set(ord.orderNumber, ord);
    if (Array.isArray(ord.selectedNumbers)) {
      for (const n of ord.selectedNumbers) {
        orderBySlot.set(n, ord);
      }
    }
    for (const item of ord.items) {
      if (Array.isArray(item.selectedNumbers)) {
        for (const n of item.selectedNumbers) {
          orderBySlot.set(n, ord);
        }
      }
    }
  }

  return store.rajaSlots.map((slot) => {
    const matchedOrder =
      (slot.orderNumber && orderByNo.get(slot.orderNumber)) ||
      (slot.status === 'booked' ? orderBySlot.get(slot.slotNumber) : undefined);

    return {
      ...slot,
      orderNumber: slot.orderNumber || matchedOrder?.orderNumber || '',
      customerName: matchedOrder?.customerName || undefined,
      organization: matchedOrder?.organization || undefined,
      customerPhone: matchedOrder?.customerPhone || undefined,
      paymentStatus: matchedOrder?.paymentStatus || undefined,
    };
  });
}

// BOOKING_OPENS_AT (ISO date) can override the default opening time via the environment.
function bookingOpen(): boolean {
  return isBookingOpen(Date.now(), process.env.BOOKING_OPENS_AT || undefined);
}

/** Why reservations are refused right now (opening date, or the admin's sales switch), or null. */
function salesClosedReason(): string | null {
  if (!bookingOpen()) return BOOKING_CLOSED_MESSAGE;
  if (store.siteConfig.salesOpen === false) return SALES_PAUSED_MESSAGE;
  return null;
}

const SLIP_DIR = path.join(DATA_DIR, 'slips');
const slipFile = (orderId: string) => path.join(SLIP_DIR, `${orderId.replace(/[^\w-]/g, '_')}.json`);

interface SlipRecord {
  orderId: string;
  orderNumber: string;
  dataUrl: string;
  uploadedAt: string;
}

async function writeSlip(rec: SlipRecord): Promise<void> {
  if (remoteStore) {
    await remoteStore.saveSlip(rec.orderId, rec as unknown as Record<string, unknown>);
    return;
  }
  fs.mkdirSync(SLIP_DIR, { recursive: true });
  fs.writeFileSync(slipFile(rec.orderId), JSON.stringify(rec), 'utf-8');
}

async function removeSlip(orderId: string): Promise<void> {
  if (remoteStore) {
    await remoteStore.deleteSlip(orderId);
    return;
  }
  fs.rmSync(slipFile(orderId), { force: true });
}

async function readSlip(orderId: string): Promise<SlipRecord | null> {
  if (remoteStore) return (await remoteStore.getSlip(orderId)) as SlipRecord | null;
  try {
    return JSON.parse(fs.readFileSync(slipFile(orderId), 'utf-8')) as SlipRecord;
  } catch {
    return null;
  }
}

const SLIP_MAX_CHARS = 900_000;
const SLIP_MAX_UPLOADS = 5;

/** Accepts only small JPEG/PNG/WebP data URLs whose bytes really start like that image type. */
function parseSlipDataUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > SLIP_MAX_CHARS) return null;
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!m) return null;
  const head = Buffer.from(m[2].slice(0, 24), 'base64');
  const ok =
    (m[1] === 'jpeg' && head[0] === 0xff && head[1] === 0xd8) ||
    (m[1] === 'png' && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) ||
    (m[1] === 'webp' && head.subarray(0, 4).toString('ascii') === 'RIFF' && head.subarray(8, 12).toString('ascii') === 'WEBP');
  return ok ? raw : null;
}

/** Undoes applyBookingEffects for a cancelled or deleted order: frees its numbers and stock. */
function releaseOrderReservations(order: OrderRecord): void {
  const nowIso = new Date().toISOString();
  for (const num of order.selectedNumbers || []) {
    const slot = store.rajaSlots.find((s) => s.slotNumber === num);
    if (slot && slot.orderNumber === order.orderNumber) {
      slot.status = 'available';
      slot.sessionId = '';
      slot.heldAt = 0;
      slot.heldUntil = 0;
      slot.orderNumber = '';
      slot.updatedAt = nowIso;
    }
  }
  for (const line of order.items) {
    const prod = store.products.find((p) => p.id === line.productId);
    if (!prod) continue;
    prod.bookedCount = Math.max(0, (prod.bookedCount || 0) - line.quantity);
    if (prod.requiresNumberSelection) {
      const totalBookedSlots = store.rajaSlots.filter((s) => s.status === 'booked').length;
      prod.stock = Math.max(0, 99 - totalBookedSlots);
    } else if (!prod.isMadeToOrder) {
      prod.stock += line.quantity;
    }
  }
  purgeExpiredRajaSlotHolds();
}

/** Locks the chosen 1–99 numbers as booked and moves stock / booked counters for a new order. */
function applyBookingEffects(
  calc: { selectedNumbers: number[]; lineItems: { productId: string; quantity: number }[] },
  orderNumber: string,
  sessionId: string,
  nowIso: string
) {
  for (const num of calc.selectedNumbers) {
    const slot = store.rajaSlots.find((s) => s.slotNumber === num);
    if (slot) {
      slot.status = 'booked';
      slot.sessionId = sessionId;
      slot.heldUntil = 0;
      slot.orderNumber = orderNumber;
      slot.updatedAt = nowIso;
    }
  }
  for (const line of calc.lineItems) {
    const prod = store.products.find((p) => p.id === line.productId);
    if (prod) {
      prod.bookedCount = (prod.bookedCount || 0) + line.quantity;
      if (prod.requiresNumberSelection) {
        const totalBookedSlots = store.rajaSlots.filter((s) => s.status === 'booked').length;
        prod.stock = Math.max(0, 99 - totalBookedSlots);
      } else if (!prod.isMadeToOrder) {
        prod.stock = Math.max(0, prod.stock - line.quantity);
      }
    }
  }
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: '2mb' }));
  app.use('/api', (_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    next();
  });
  // Before the queue below, so refused requests never wait for or touch the database.
  app.use('/api', rateLimiter(() => rateLimitHit));

  // Every API request is handled one at a time per instance: load the latest
  // data, run the handler, and persist any changes *before* the response is sent
  // (serverless functions are frozen as soon as they respond).
  let queue: Promise<void> = Promise.resolve();
  app.use('/api', (req, res, next) => {
    const prev = queue;
    let release!: () => void;
    queue = new Promise<void>((r) => (release = r));
    res.on('close', release);

    prev.then(async () => {
      try {
        // Login only checks the env-var passcode, so it doesn't need the database.
        if (req.path === '/admin/login') {
          next();
          return;
        }
        // Reservations are closed until the opening date: refuse before touching the database.
        if (
          req.method === 'POST' &&
          (req.path === '/orders' || req.path === '/raja-slots/toggle') &&
          !bookingOpen()
        ) {
          res.status(403).json({ error: BOOKING_CLOSED_MESSAGE, bookingClosed: true });
          return;
        }
        if (process.env.VERCEL && !useRemoteStore) {
          res.status(503).json({
            error: 'ระบบฐานข้อมูลยังไม่ได้ตั้งค่า (DATABASE_URL)',
          });
          return;
        }
        if (remoteStore) {
          const cols: ColName[] = [];
          if (req.path.startsWith('/orders') || req.path.startsWith('/admin')) {
            cols.push('orders');
          }
          if (req.path.startsWith('/admin')) cols.push('inquiries');
          const publicRead =
            req.method === 'GET' &&
            (req.path === '/bootstrap' || req.path === '/raja-slots');
          await remoteStore.load(store as unknown as Record<string, any>, cols, {
            maxAgeMs: publicRead ? 60_000 : 0,
          });
        }
        if (remoteStore) {
          const originalJson = res.json.bind(res);
          res.json = ((body?: unknown) => {
            remoteStore
              .persist(store as unknown as Record<string, any>)
              .then(() => originalJson(body))
              .catch((err: any) => {
                console.error('Persist failed:', err);
                res.status(err?.conflict ? 409 : 500);
                originalJson({
                  error: err?.conflict
                    ? 'มีผู้ใช้อื่นกำลังแก้ไขข้อมูลพร้อมกัน กรุณาลองอีกครั้ง'
                    : 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง',
                });
              });
            return res;
          }) as typeof res.json;
        }
        next();
      } catch (err) {
        console.error('Store load failed:', err);
        res.status(500).json({ error: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ' });
      }
    });
  });

  // 1. Public Storefront Bootstrap
  app.get('/api/bootstrap', (_req, res) => {
    res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    purgeExpiredRajaSlotHolds();
    const publicProducts = store.products.filter((p) => p.isVisible);
    res.json({
      mode: 'live',
      siteConfig: store.siteConfig,
      products: publicProducts,
      rajaSlots: store.rajaSlots,
      news: store.news,
    });
  });

  // 1b. Public Raja Slots (1–99) Real-time Status & Atomic Hold/Release
  app.get('/api/raja-slots', (_req, res) => {
    res.set('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60');
    purgeExpiredRajaSlotHolds();
    res.json({
      rajaSlots: store.rajaSlots,
      serverTime: Date.now(),
    });
  });

  app.post('/api/raja-slots/toggle', (req, res) => {
    const closed = salesClosedReason();
    if (closed) {
      res.status(403).json({ error: closed, bookingClosed: true });
      return;
    }
    purgeExpiredRajaSlotHolds();
    const { slotNumber, sessionId } = req.body || {};
    const num = Number(slotNumber);
    const cleanSession = String(sessionId || '').trim();

    if (!Number.isInteger(num) || num < 1 || num > 99 || !cleanSession) {
      res.status(400).json({ error: 'หมายเลขชุดหรือเซสชันไม่ถูกต้อง (1–99)' });
      return;
    }

    const slot = store.rajaSlots.find((s) => s.slotNumber === num);
    if (!slot) {
      res.status(404).json({ error: `ไม่พบหมายเลข #${num}` });
      return;
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (slot.status === 'booked') {
      res.status(409).json({
        error: `หมายเลข #${num} ถูกจองแล้ว ไม่สามารถเลือกซ้ำได้`,
        rajaSlots: store.rajaSlots,
      });
      return;
    }

    const isActiveHold = slot.status === 'held' && slot.heldUntil > now;
    if (isActiveHold && slot.sessionId !== cleanSession) {
      res.status(409).json({
        error: `หมายเลข #${num} กำลังมีผู้เลือกอยู่ (กันสิทธิ์ชั่วคราว 15 นาที)`,
        rajaSlots: store.rajaSlots,
      });
      return;
    }

    let action: 'held' | 'released' = 'held';
    if (isActiveHold && slot.sessionId === cleanSession) {
      slot.status = 'available';
      slot.sessionId = '';
      slot.heldAt = 0;
      slot.heldUntil = 0;
      slot.orderNumber = '';
      slot.updatedAt = nowIso;
      action = 'released';
    } else {
      slot.status = 'held';
      slot.sessionId = cleanSession;
      slot.heldAt = now;
      slot.heldUntil = now + HOLD_DURATION_MS;
      slot.orderNumber = '';
      slot.updatedAt = nowIso;
      action = 'held';
    }

    saveStore(store);
    res.json({
      success: true,
      action,
      slot,
      rajaSlots: store.rajaSlots,
      serverTime: now,
    });
  });

  app.post('/api/raja-slots/release-expired', (_req, res) => {
    const mutated = purgeExpiredRajaSlotHolds();
    res.json({
      released: mutated,
      rajaSlots: store.rajaSlots,
      serverTime: Date.now(),
    });
  });

  // 2. Server-side Cart Calculation Preview
  app.post('/api/cart/calculate', (req, res) => {
    const { items } = req.body || {};
    const calc = calculateOrderTotals(
      Array.isArray(items) ? items : [],
      store.products,
      store.siteConfig.standardShippingFee,
      store.siteConfig.freeShippingThreshold
    );
    res.json(calc);
  });

  // 3. Create Order (Server-side validation, atomic number lock 1-99, stock check, idempotency)
  app.post('/api/orders', async (req, res) => {
    const closed = salesClosedReason();
    if (closed) {
      res.status(403).json({ error: closed, bookingClosed: true });
      return;
    }
    purgeExpiredRajaSlotHolds();
    const {
      items,
      customerName,
      organization,
      customerPhone,
      customerEmail,
      deliveryMethod,
      shippingAddress,
      postalCode,
      paymentMethod,
      transferReference,
      sessionId,
      idempotencyKey,
      slip,
    } = req.body || {};

    if (idempotencyKey && typeof idempotencyKey === 'string') {
      {
        const existingOrder = store.orders.find(
          (o) => (o as OrderRecord & { idempotencyKey?: string }).idempotencyKey === idempotencyKey
        );
        if (existingOrder) {
          res.status(200).json({
            duplicatePrevented: true,
            order: maskCustomerPII(existingOrder),
          });
          return;
        }
      }
    }

    const cleanOrg =
      organization !== undefined ? String(organization).trim() : 'ประชาชนทั่วไป';

    const resolvedDeliveryMethod: 'shipping' | 'pickup_bpp' | undefined =
      deliveryMethod === 'pickup_bpp' || deliveryMethod === 'shipping'
        ? deliveryMethod
        : undefined;

    const formCheck = validateCheckoutForm({
      customerName,
      organization: cleanOrg,
      customerPhone,
      customerEmail: String(customerEmail ?? ''),
      deliveryMethod: resolvedDeliveryMethod,
      shippingAddress: shippingAddress || cleanOrg,
      postalCode: postalCode || '',
      paymentMethod: paymentMethod || 'promptpay',
      transferReference,
    });

    if (!formCheck.valid) {
      res.status(400).json({
        error:
          'กรุณากรอกข้อมูลผู้จองและรายละเอียดการรับวัตถุมงคลให้ครบถ้วน',
        fieldErrors: formCheck.fieldErrors,
      });
      return;
    }

    // Online reservations are only accepted together with the transfer slip.
    const slipDataUrl = parseSlipDataUrl(slip?.image);
    if (!slipDataUrl) {
      res.status(400).json({
        error: 'กรุณาโอนเงินและแนบสลิปการโอนก่อนกดสั่งจอง (รองรับ JPG / PNG / WebP)',
        fieldErrors: { slip: 'กรุณาแนบสลิปการโอนเงิน' },
      });
      return;
    }
    const slipAmount = Number(slip?.transferAmount);
    const slipWhen = String(slip?.transferTime || '').trim().slice(0, 40);

    const effectiveDeliveryMethod: 'shipping' | 'pickup_bpp' =
      resolvedDeliveryMethod || 'shipping';

    const calc = calculateOrderTotals(
      Array.isArray(items) ? items : [],
      store.products,
      effectiveDeliveryMethod === 'pickup_bpp'
        ? 0
        : store.siteConfig.standardShippingFee,
      store.siteConfig.freeShippingThreshold
    );

    if (!calc.valid) {
      res.status(400).json({
        error: calc.errors[0] || 'ไม่สามารถสร้างใบจองได้',
        errors: calc.errors,
      });
      return;
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const cleanSession = String(sessionId || '').trim();

    // Atomic verification of all selected numbers 1-99 for ช1 ชุดทองคำใหญ่ราชาฤกษ์
    if (calc.selectedNumbers.length > 0) {
      for (const num of calc.selectedNumbers) {
        const slot = store.rajaSlots.find((s) => s.slotNumber === num);
        if (!slot) {
          res.status(400).json({ error: `หมายเลขชุด #${num} ไม่ถูกต้อง` });
          return;
        }
        if (slot.status === 'booked') {
          res.status(409).json({
            error: `หมายเลข #${num} ถูกจองไปแล้ว กรุณาเลือกหมายเลขอื่น`,
          });
          return;
        }
        if (
          slot.status === 'held' &&
          slot.heldUntil > now &&
          slot.sessionId &&
          cleanSession &&
          slot.sessionId !== cleanSession
        ) {
          res.status(409).json({
            error: `หมายเลข #${num} กำลังถูกเลือกโดยผู้ใช้อื่น กรุณาเลือกหมายเลขอื่น`,
          });
          return;
        }
      }
    }

    // Four random digits collide quickly once there are a few hundred orders: retry until free.
    let orderNumber = '';
    do {
      orderNumber = `BPP-2569-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (store.orders.some((o) => o.orderNumber === orderNumber));
    const orderId = `ord-${now}-${crypto.randomBytes(3).toString('hex')}`;

    try {
      await writeSlip({ orderId, orderNumber, dataUrl: slipDataUrl, uploadedAt: nowIso });
    } catch (err) {
      console.error('Slip save failed:', err);
      res.status(500).json({ error: 'บันทึกสลิปไม่สำเร็จ กรุณาลองกดสั่งจองอีกครั้ง' });
      return;
    }

    applyBookingEffects(calc, orderNumber, cleanSession, nowIso);

    const reservationDateThai = formatThaiDate(nowIso);
    const grandTotalThaiText = numberToThaiBahtText(calc.grandTotal);

    const rawAddress = String(shippingAddress || '').trim();
    const formattedShippingAddress =
      effectiveDeliveryMethod === 'pickup_bpp'
        ? rawAddress && !rawAddress.includes('มารับเอง')
          ? `มารับเองที่ บช.ตชด. (กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ 10400) — หมายเหตุ: ${rawAddress}`
          : rawAddress ||
            'มารับเองที่ บช.ตชด. (กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ 10400)'
        : rawAddress || cleanOrg;

    const newOrder: OrderRecord = {
      id: orderId,
      orderNumber,
      createdAt: nowIso,
      reservationDateThai,
      customerName: String(customerName).trim(),
      organization: cleanOrg,
      customerPhone: String(customerPhone).trim(),
      customerEmail: String(customerEmail).trim(),
      deliveryMethod: effectiveDeliveryMethod,
      shippingAddress: formattedShippingAddress,
      postalCode:
        effectiveDeliveryMethod === 'pickup_bpp'
          ? '10400'
          : String(postalCode || '10400').trim(),
      paymentMethod: paymentMethod || 'promptpay',
      transferReference: transferReference
        ? String(transferReference).trim()
        : undefined,
      slipUploadedAt: nowIso,
      slipCount: 1,
      slipTransferAmount:
        Number.isFinite(slipAmount) && slipAmount > 0 ? Math.round(slipAmount * 100) / 100 : undefined,
      slipTransferTime: slipWhen || undefined,
      items: calc.lineItems,
      selectedNumbers:
        calc.selectedNumbers.length > 0 ? calc.selectedNumbers : undefined,
      subtotal: calc.subtotal,
      shippingTotal: calc.shippingTotal,
      grandTotal: calc.grandTotal,
      grandTotalThaiText,
      paymentStatus: 'pending_verification',
      preparationStatus: 'awaiting_payment',
      shippingStatus: 'not_shipped',
      sessionId: cleanSession || undefined,
      statusHistory: [
        {
          id: `log-${now}-slip`,
          timestamp: nowIso,
          actor: 'ผู้จอง (แนบสลิป)',
          paymentStatus: 'pending_verification',
          preparationStatus: 'awaiting_payment',
          shippingStatus: 'not_shipped',
          note: `แนบหลักฐานการโอนเงินพร้อมคำสั่งจอง${
            Number.isFinite(slipAmount) && slipAmount > 0 ? ` ยอด ฿${slipAmount.toLocaleString()}` : ''
          }${slipWhen ? ` เวลาโอน ${slipWhen}` : ''} รอเจ้าหน้าที่ตรวจสอบ`,
        },
        {
          id: `log-${now}`,
          timestamp: nowIso,
          actor: 'ระบบรับใบจองวัตถุมงคล ๗๕ ปี ตชด.',
          paymentStatus: 'pending_verification',
          preparationStatus: 'awaiting_payment',
          shippingStatus: 'not_shipped',
          note:
            calc.selectedNumbers.length > 0
              ? `ยืนยันใบจอง (${
                  effectiveDeliveryMethod === 'pickup_bpp'
                    ? 'มารับเองที่ บช.ตชด.'
                    : 'จัดส่งทางไปรษณีย์'
                }) พร้อมล็อกหมายเลขชุดทองคำใหญ่ราชาฤกษ์: ${calc.selectedNumbers
                  .map((n) => `#${n}`)
                  .join(', ')}`
              : `บันทึกใบจองเข้าสู่ระบบเรียบร้อยแล้ว (${
                  effectiveDeliveryMethod === 'pickup_bpp'
                    ? 'มารับเองที่ บช.ตชด.'
                    : 'จัดส่งทางไปรษณีย์'
                }) รอตรวจสอบการชำระเงิน`,
        },
      ],
      isDemoOrder: false,
    };

    store.orders.unshift(newOrder);
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      (newOrder as OrderRecord & { idempotencyKey?: string }).idempotencyKey = idempotencyKey;
    }
    saveStore(store);

    res.status(201).json({
      order: maskCustomerPII(newOrder),
      rajaSlots: store.rajaSlots,
      products: store.products.filter((p) => p.isVisible),
    });
  });

  // 4. Secure Order Tracking (Requires Order Number + Last 4 digits of Phone)
  app.post('/api/orders/track', (req, res) => {
    const { orderNumber, phoneVerify } = req.body || {};
    const cleanOrderNo = String(orderNumber || '').trim().toUpperCase();
    const cleanPhone = String(phoneVerify || '').trim();

    if (!cleanOrderNo || cleanPhone.replace(/\D/g, '').length < 4) {
      res.status(400).json({
        error: 'กรุณาระบุเลขที่ใบจอง และหมายเลขโทรศัพท์ 4 ตัวท้ายของผู้จอง',
      });
      return;
    }

    const found = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === cleanOrderNo
    );

    if (!found || !verifyPhoneLast4(found.customerPhone, cleanPhone)) {
      res.status(404).json({
        error:
          'ไม่พบข้อมูลใบจองที่ตรงกับเลขที่ใบจองและหมายเลขโทรศัพท์ 4 ตัวท้ายที่ระบุ',
      });
      return;
    }

    res.json({
      order: maskCustomerPII(found),
    });
  });

  // 4b. Customer attaches / replaces the payment slip (proved by order number + last 4 phone digits)
  app.post('/api/orders/slip', async (req, res) => {
    try {
      const { orderNumber, phoneVerify, image, transferAmount, transferTime } = req.body || {};
      const order = store.orders.find(
        (o) => o.orderNumber.toUpperCase() === String(orderNumber || '').trim().toUpperCase()
      );
      if (!order || !verifyPhoneLast4(order.customerPhone, String(phoneVerify || ''))) {
        res.status(404).json({ error: 'ไม่พบใบจองที่ตรงกับเลขที่ใบจองและเบอร์โทร 4 ตัวท้าย' });
        return;
      }
      if (order.paymentStatus === 'verified_paid') {
        res.status(409).json({ error: 'ใบจองนี้ได้รับการยืนยันการชำระเงินแล้ว ไม่ต้องแนบสลิปเพิ่ม' });
        return;
      }
      if (order.paymentStatus === 'payment_rejected') {
        res.status(409).json({ error: 'ใบจองนี้ถูกยกเลิกแล้ว กรุณาติดต่อเจ้าหน้าที่หรือจองใหม่' });
        return;
      }
      if ((order.slipCount || 0) >= SLIP_MAX_UPLOADS) {
        res.status(429).json({ error: 'แนบสลิปครบจำนวนครั้งที่กำหนดแล้ว กรุณาติดต่อเจ้าหน้าที่' });
        return;
      }
      const dataUrl = parseSlipDataUrl(image);
      if (!dataUrl) {
        res.status(400).json({ error: 'ไฟล์สลิปไม่ถูกต้องหรือใหญ่เกินไป (รองรับ JPG / PNG / WebP)' });
        return;
      }
      const amount = Number(transferAmount);
      const when = String(transferTime || '').trim().slice(0, 40);
      const nowIso = new Date().toISOString();

      await writeSlip({ orderId: order.id, orderNumber: order.orderNumber, dataUrl, uploadedAt: nowIso });
      order.slipUploadedAt = nowIso;
      order.slipCount = (order.slipCount || 0) + 1;
      order.slipTransferAmount = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : undefined;
      order.slipTransferTime = when || undefined;
      order.statusHistory.unshift({
        id: `log-${Date.now()}`,
        timestamp: nowIso,
        actor: 'ผู้จอง (แนบสลิป)',
        paymentStatus: order.paymentStatus,
        preparationStatus: order.preparationStatus,
        shippingStatus: order.shippingStatus,
        note: `แนบหลักฐานการโอนเงิน (ครั้งที่ ${order.slipCount})${
          order.slipTransferAmount ? ` ยอด ฿${order.slipTransferAmount.toLocaleString()}` : ''
        }${when ? ` เวลาโอน ${when}` : ''} รอเจ้าหน้าที่ตรวจสอบ`,
      });
      saveStore(store);
      res.status(201).json({ order: maskCustomerPII(order) });
    } catch (err) {
      console.error('Slip upload failed:', err);
      res.status(500).json({ error: 'แนบสลิปไม่สำเร็จ กรุณาลองอีกครั้ง' });
    }
  });

  // 5. Public Contact Inquiry
  app.post('/api/inquiries', (req, res) => {
    const { name, phone, subject, message, orderNumber } = req.body || {};
    if (!name || !phone || !subject || !message) {
      res.status(400).json({
        error: 'กรุณากรอกข้อมูลชื่อ เบอร์โทรศัพท์ หัวข้อ และข้อความให้ครบถ้วน',
      });
      return;
    }

    const inquiry: ContactInquiry = {
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      orderNumber: orderNumber ? String(orderNumber).trim() : undefined,
    };

    store.inquiries.unshift(inquiry);
    saveStore(store);
    res.status(201).json({ success: true, inquiryId: inquiry.id });
  });

  // 6. Admin Authentication
  // Brute-force guard: 5 wrong attempts from one address lock login for 15 minutes.
  const loginFails = new Map<string, { n: number; lockedUntil: number }>();
  app.post('/api/admin/login', (req, res) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const rec = loginFails.get(ip) || { n: 0, lockedUntil: 0 };
    if (rec.lockedUntil > Date.now()) {
      res.status(429).json({ error: 'พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่' });
      return;
    }
    const { username, email, passcode } = req.body || {};
    if (
      ADMIN_PASSCODE &&
      String(username ?? email ?? '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      String(passcode || '').trim() === ADMIN_PASSCODE
    ) {
      loginFails.delete(ip);
      const token = signAdminToken(ADMIN_EMAIL);
      res.json({
        token,
        adminEmail: ADMIN_EMAIL,
      });
      return;
    }

    rec.n += 1;
    if (rec.n >= 5) {
      rec.n = 0;
      rec.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
    loginFails.set(ip, rec);
    res.status(401).json({
      error: 'อีเมลหรือรหัสผ่านผู้ดูแลไม่ถูกต้อง',
    });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    // Tokens are stateless and expire on their own; the client discards its copy.
    res.json({ success: true });
  });

  // 7. Protected Admin Dashboard Overview & Data
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const enrichedSlots = enrichRajaSlotsForAdmin();
    const totalOrders = store.orders.length;
    const pendingOrders = store.orders.filter(
      (o) =>
        o.paymentStatus === 'pending_verification' ||
        o.shippingStatus === 'not_shipped'
    ).length;
    const verifiedRevenue = store.orders
      .filter((o) => o.paymentStatus === 'verified_paid')
      .reduce((acc, o) => acc + o.grandTotal, 0);
    const totalReservationAmount = store.orders
      .filter((o) => o.paymentStatus !== 'payment_rejected')
      .reduce((acc, o) => acc + o.grandTotal, 0);
    const totalStockCount = store.products
      .filter((p) => !p.isMadeToOrder)
      .reduce((acc, p) => acc + p.stock, 0);
    const lowStockProducts = store.products.filter(
      (p) => !p.isMadeToOrder && p.stock <= 5
    );
    const bookedRajaSlotsCount = enrichedSlots.filter(
      (s) => s.status === 'booked'
    ).length;

    res.json({
      metrics: {
        totalOrders,
        pendingOrders,
        verifiedRevenue,
        totalReservationAmount,
        totalStockCount,
        lowStockCount: lowStockProducts.length,
        bookedRajaSlotsCount,
      },
      products: store.products,
      orders: store.orders,
      rajaSlots: enrichedSlots,
      news: store.news,
      siteConfig: store.siteConfig,
      inquiries: store.inquiries,
      mailConfigured: isMailConfigured(),
    });
  });

  // 7b. Admin Raja Slot Release / Management
  app.patch(
    '/api/admin/raja-slots/:slotNumber',
    requireAdmin,
    (req, res) => {
      const num = Number(req.params.slotNumber);
      const slot = store.rajaSlots.find((s) => s.slotNumber === num);
      if (!slot) {
        res.status(404).json({ error: `ไม่พบหมายเลข #${num}` });
        return;
      }

      const { status, orderNumber } = req.body || {};
      const nowIso = new Date().toISOString();

      if (status === 'available') {
        slot.status = 'available';
        slot.sessionId = '';
        slot.heldAt = 0;
        slot.heldUntil = 0;
        slot.orderNumber = '';
        slot.updatedAt = nowIso;
      } else if (status === 'booked') {
        slot.status = 'booked';
        slot.heldUntil = 0;
        slot.orderNumber = String(orderNumber || slot.orderNumber || 'ADMIN').trim();
        slot.updatedAt = nowIso;
      }

      purgeExpiredRajaSlotHolds();
      saveStore(store);
      res.json({
        rajaSlots: enrichRajaSlotsForAdmin(),
      });
    }
  );

  // 8. Admin Product Management (Create / Update / Delete)
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body || {};
    if (!body.name || !body.code || !body.series || Number(body.price) <= 0) {
      res.status(400).json({
        error: 'กรุณาระบุชื่อวัตถุมงคล รหัส รุ่น และราคาที่ถูกต้อง',
      });
      return;
    }

    const newProduct: AmuletProduct = {
      id: `prod-${Date.now()}`,
      code: String(body.code).trim(),
      name: String(body.name).trim(),
      series: String(body.series).trim(),
      yearBE: Number(body.yearBE) || 2569,
      category: body.category || 'cat_1_popular_metal',
      categoryLabel: body.categoryLabel || 'หมวด 1 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม',
      price: Number(body.price),
      stock: Math.max(0, Number(body.stock) || 0),
      initialStock: Math.max(0, Number(body.initialStock ?? body.stock) || 0),
      bookedCount: Number(body.bookedCount) || 0,
      isMadeToOrder: Boolean(body.isMadeToOrder),
      requiresNumberSelection: Boolean(body.requiresNumberSelection),
      material: String(body.material || 'เนื้อโลหะที่ระลึก').trim(),
      dimensions: String(body.dimensions || '2.3 × 3.7 × 2.5 ซม.').trim(),
      weightGrams: Number(body.weightGrams) || 18,
      condition: String(body.condition || 'สภาพสมบูรณ์พร้อมกล่องเดิม').trim(),
      certificateInfo: String(
        body.certificateInfo || 'ตอกหมายเลขกำกับและมีเอกสารประจำกล่อง'
      ).trim(),
      purposeSummary: String(
        body.purposeSummary || 'สมทบทุนโครงการที่ระลึกและสวัสดิการ'
      ).trim(),
      description: String(body.description || '').trim(),
      shippingFee: Number(body.shippingFee) >= 0 ? Number(body.shippingFee) : 0,
      isFeatured: Boolean(body.isFeatured),
      isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : true,
      specimenStyle: body.specimenStyle || 'bronze_oval',
      angles:
        Array.isArray(body.angles) && body.angles.length > 0
          ? body.angles
          : [
              {
                angle: 'front',
                label: 'ด้านหน้า (Front)',
                caption: 'ภาพด้านหน้าของวัตถุมงคล',
                imageUrl: body.frontImageUrl || undefined,
              },
              {
                angle: 'back',
                label: 'ด้านหลัง (Reverse)',
                caption: 'ภาพด้านหลังและอักษรจารึก',
                imageUrl: body.backImageUrl || undefined,
              },
              {
                angle: 'edge',
                label: 'ขอบเหรียญ (Edge)',
                caption: 'ขอบและโค้ดหมายเลขกำกับ',
              },
              {
                angle: 'box',
                label: 'กล่องบรรจุ (Archival Box)',
                caption: 'กล่องที่ระลึกประจำรุ่น',
              },
            ],
      createdAt: new Date().toISOString(),
    };

    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'ไม่พบรายการวัตถุมงคลที่ต้องการแก้ไข' });
      return;
    }

    const current = store.products[idx];
    const body = req.body || {};

    const updated: AmuletProduct = {
      ...current,
      code: body.code !== undefined ? String(body.code).trim() : current.code,
      name: body.name !== undefined ? String(body.name).trim() : current.name,
      series:
        body.series !== undefined ? String(body.series).trim() : current.series,
      yearBE: body.yearBE !== undefined ? Number(body.yearBE) : current.yearBE,
      category: body.category || current.category,
      categoryLabel: body.categoryLabel || current.categoryLabel,
      price: body.price !== undefined ? Number(body.price) : current.price,
      stock:
        body.stock !== undefined
          ? Math.max(0, Number(body.stock))
          : current.stock,
      isMadeToOrder:
        body.isMadeToOrder !== undefined
          ? Boolean(body.isMadeToOrder)
          : current.isMadeToOrder,
      material:
        body.material !== undefined
          ? String(body.material).trim()
          : current.material,
      dimensions:
        body.dimensions !== undefined
          ? String(body.dimensions).trim()
          : current.dimensions,
      condition:
        body.condition !== undefined
          ? String(body.condition).trim()
          : current.condition,
      certificateInfo:
        body.certificateInfo !== undefined
          ? String(body.certificateInfo).trim()
          : current.certificateInfo,
      purposeSummary:
        body.purposeSummary !== undefined
          ? String(body.purposeSummary).trim()
          : current.purposeSummary,
      description:
        body.description !== undefined
          ? String(body.description).trim()
          : current.description,
      isFeatured:
        body.isFeatured !== undefined
          ? Boolean(body.isFeatured)
          : current.isFeatured,
      isVisible:
        body.isVisible !== undefined
          ? Boolean(body.isVisible)
          : current.isVisible,
      specimenStyle: body.specimenStyle || current.specimenStyle,
      angles: Array.isArray(body.angles) ? body.angles : current.angles,
    };

    store.products[idx] = updated;
    saveStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'ไม่พบรายการสินค้า' });
      return;
    }
    store.products.splice(idx, 1);
    saveStore(store);
    res.json({ success: true });
  });

  // 8a. Admin creates an order for a customer (counter / phone / LINE sale), including numbers 1–99
  app.post('/api/admin/orders', requireAdmin, (req, res) => {
    purgeExpiredRajaSlotHolds();
    const b = req.body || {};
    const cleanOrg = String(b.organization || '').trim() || 'ประชาชนทั่วไป';
    const delivery: 'shipping' | 'pickup_bpp' = b.deliveryMethod === 'shipping' ? 'shipping' : 'pickup_bpp';
    const method: 'promptpay' | 'bank_transfer' | 'cash' = ['promptpay', 'bank_transfer', 'cash'].includes(b.paymentMethod)
      ? b.paymentMethod
      : 'cash';
    const rawAddress = String(b.shippingAddress || '').trim();

    const form = validateCheckoutForm({
      customerName: b.customerName,
      organization: cleanOrg,
      customerPhone: b.customerPhone,
      deliveryMethod: delivery,
      shippingAddress: rawAddress || cleanOrg,
      postalCode: b.postalCode || '',
      paymentMethod: method,
    });
    if (!form.valid) {
      res.status(400).json({
        error: Object.values(form.fieldErrors)[0] || 'กรุณากรอกข้อมูลผู้ซื้อให้ครบถ้วน',
        fieldErrors: form.fieldErrors,
      });
      return;
    }

    const calc = calculateOrderTotals(
      Array.isArray(b.items) ? b.items : [],
      store.products,
      delivery === 'pickup_bpp' ? 0 : store.siteConfig.standardShippingFee,
      store.siteConfig.freeShippingThreshold
    );
    if (!calc.valid) {
      res.status(400).json({ error: calc.errors[0] || 'ไม่สามารถสร้างใบจองได้', errors: calc.errors });
      return;
    }

    for (const num of calc.selectedNumbers) {
      const slot = store.rajaSlots.find((x) => x.slotNumber === num);
      if (!slot) {
        res.status(400).json({ error: `หมายเลขชุด #${num} ไม่ถูกต้อง` });
        return;
      }
      if (slot.status !== 'available') {
        res.status(409).json({
          error: `หมายเลข #${num} ${slot.status === 'booked' ? 'ถูกจองไปแล้ว' : 'กำลังถูกลูกค้าเลือกอยู่'} กรุณาเลือกหมายเลขอื่น`,
        });
        return;
      }
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    let orderNumber = '';
    do {
      orderNumber = `BPP-2569-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (store.orders.some((o) => o.orderNumber === orderNumber));

    applyBookingEffects(calc, orderNumber, 'admin', nowIso);

    const paid = b.paid === true;
    const note = String(b.note || '').trim().slice(0, 300);
    const pickupText = 'มารับเองที่ บช.ตชด. (กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ 10400)';
    const newOrder: OrderRecord = {
      id: `ord-${now}`,
      orderNumber,
      createdAt: nowIso,
      reservationDateThai: formatThaiDate(nowIso),
      customerName: String(b.customerName).trim(),
      organization: cleanOrg,
      customerPhone: String(b.customerPhone).trim(),
      customerEmail: b.customerEmail ? String(b.customerEmail).trim().slice(0, 120) : undefined,
      deliveryMethod: delivery,
      shippingAddress: delivery === 'pickup_bpp' ? (rawAddress ? `${pickupText} — หมายเหตุ: ${rawAddress}` : pickupText) : rawAddress,
      postalCode: delivery === 'pickup_bpp' ? '10400' : String(b.postalCode || '').trim(),
      paymentMethod: method,
      transferReference: method === 'cash' ? 'เงินสด / ชำระกับเจ้าหน้าที่' : undefined,
      items: calc.lineItems,
      selectedNumbers: calc.selectedNumbers.length > 0 ? calc.selectedNumbers : undefined,
      subtotal: calc.subtotal,
      shippingTotal: calc.shippingTotal,
      grandTotal: calc.grandTotal,
      grandTotalThaiText: numberToThaiBahtText(calc.grandTotal),
      paymentStatus: paid ? 'verified_paid' : 'pending_verification',
      preparationStatus: paid ? 'inspecting_artifact' : 'awaiting_payment',
      shippingStatus: 'not_shipped',
      salesChannel: 'admin',
      adminNote: note || undefined,
      statusHistory: [
        {
          id: `log-${now}`,
          timestamp: nowIso,
          actor: 'ผู้ดูแลระบบ (สร้างใบจองแทนลูกค้า)',
          paymentStatus: paid ? 'verified_paid' : 'pending_verification',
          preparationStatus: paid ? 'inspecting_artifact' : 'awaiting_payment',
          shippingStatus: 'not_shipped',
          note: `เจ้าหน้าที่สร้างใบจอง${calc.selectedNumbers.length ? ` พร้อมล็อกหมายเลข ${calc.selectedNumbers.map((n) => '#' + n).join(', ')}` : ''}${
            paid ? ' และบันทึกว่าชำระเงินแล้ว' : ' รอชำระเงิน'
          }${note ? ` · ${note}` : ''}`,
        },
      ],
      isDemoOrder: false,
    };
    store.orders.unshift(newOrder);
    saveStore(store);
    res.status(201).json({ order: newOrder, rajaSlots: enrichRajaSlotsForAdmin() });
  });

  // 8b. Admin views the payment slip of one order
  app.get('/api/admin/orders/:id/slip', requireAdmin, async (req, res) => {
    try {
      const order = store.orders.find((o) => o.id === req.params.id);
      if (!order) {
        res.status(404).json({ error: 'ไม่พบรายการคำสั่งจอง' });
        return;
      }
      const rec = await readSlip(order.id);
      if (!rec) {
        res.status(404).json({ error: 'ผู้จองยังไม่ได้แนบสลิป' });
        return;
      }
      res.set('Cache-Control', 'private, no-store');
      res.json({ dataUrl: rec.dataUrl, uploadedAt: rec.uploadedAt });
    } catch (err) {
      console.error('Slip read failed:', err);
      res.status(500).json({ error: 'เปิดสลิปไม่สำเร็จ' });
    }
  });

  // 9. Admin Order Status & Tracking Update (With Audit Trail & Raja Slot Release on Reject)
  app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'ไม่พบรายการคำสั่งจอง' });
      return;
    }

    const previousPaymentStatus = order.paymentStatus;
    const {
      paymentStatus,
      preparationStatus,
      shippingStatus,
      trackingNumber,
      carrierName,
      note,
    } = req.body || {};

    if (paymentStatus) {
      order.paymentStatus = paymentStatus as PaymentStatus;
    }
    if (preparationStatus) {
      order.preparationStatus = preparationStatus as PreparationStatus;
    }
    if (shippingStatus) {
      order.shippingStatus = shippingStatus as ShippingStatus;
    }
    if (trackingNumber !== undefined) {
      order.trackingNumber = String(trackingNumber).trim() || undefined;
    }
    if (carrierName !== undefined) {
      order.carrierName = String(carrierName).trim() || undefined;
    }

    // If order is rejected/cancelled, release its Raja slots (1-99) and restore stock
    if (
      previousPaymentStatus !== 'payment_rejected' &&
      order.paymentStatus === 'payment_rejected'
    ) {
      releaseOrderReservations(order);
    }

    order.statusHistory.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'ผู้ดูแลคลังวัตถุมงคล (Admin)',
      paymentStatus: order.paymentStatus,
      preparationStatus: order.preparationStatus,
      shippingStatus: order.shippingStatus,
      note:
        String(note || '').trim() ||
        `ปรับปรุงสถานะใบจอง${
          order.trackingNumber ? ` (เลขพัสดุ: ${order.trackingNumber})` : ''
        }`,
    });

    // Approving the slip sends the reservation certificate to the buyer. It goes out before the
    // response (a serverless function stops once it has answered); a failed send never blocks the
    // approval — staff can resend from the order.
    let receiptEmail = null;
    if (previousPaymentStatus !== 'verified_paid' && order.paymentStatus === 'verified_paid') {
      receiptEmail = await sendReceiptEmail(order, store.siteConfig);
      if (receiptEmail.sent) {
        order.receiptEmailedAt = new Date().toISOString();
        order.statusHistory[0].note += ` · ส่งใบจองทางอีเมลแล้ว (${receiptEmail.to})`;
      }
    }

    saveStore(store);
    res.json({ order, rajaSlots: enrichRajaSlotsForAdmin(), receiptEmail });
  });

  // 9a. Delete an order outright (test bookings, duplicates). Frees its numbers and stock
  // unless it was already cancelled, and removes its slip image.
  app.delete('/api/admin/orders/:id', requireAdmin, async (req, res) => {
    const idx = store.orders.findIndex((o) => o.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: 'ไม่พบรายการคำสั่งจอง' });
      return;
    }
    const order = store.orders[idx];
    if (order.paymentStatus !== 'payment_rejected') releaseOrderReservations(order);
    store.orders.splice(idx, 1);
    try {
      await removeSlip(order.id);
    } catch (err) {
      console.warn('Slip delete failed:', (err as Error).message);
    }
    saveStore(store);
    res.json({ deleted: order.orderNumber, rajaSlots: enrichRajaSlotsForAdmin() });
  });

  // 9b. Re-send the reservation certificate by email (approved orders only)
  app.post('/api/admin/orders/:id/send-receipt', requireAdmin, async (req, res) => {
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'ไม่พบรายการคำสั่งจอง' });
      return;
    }
    if (order.paymentStatus !== 'verified_paid') {
      res.status(409).json({ error: 'ส่งใบจองได้หลังยืนยันการชำระเงินแล้วเท่านั้น' });
      return;
    }
    const email = String(req.body?.email ?? '').trim();
    if (email) order.customerEmail = email.slice(0, 120);
    const receiptEmail = await sendReceiptEmail(order, store.siteConfig);
    if (receiptEmail.sent) order.receiptEmailedAt = new Date().toISOString();
    saveStore(store);
    res.json({ order, receiptEmail });
  });

  // 9c. Sales switch: staff can pause and resume reservations without a redeploy
  app.patch('/api/admin/sales', requireAdmin, (req, res) => {
    const open = req.body?.open;
    if (typeof open !== 'boolean') {
      res.status(400).json({ error: 'ระบุสถานะเปิด/ปิดการขายไม่ถูกต้อง' });
      return;
    }
    store.siteConfig = { ...store.siteConfig, salesOpen: open };
    saveStore(store);
    res.json({ salesOpen: open, siteConfig: store.siteConfig });
  });

  // 10. Admin Content & Site Configuration Management
  app.put('/api/admin/config', requireAdmin, (req, res) => {
    const updates = req.body || {};
    store.siteConfig = {
      ...store.siteConfig,
      ...updates,
      paymentChannels: {
        ...store.siteConfig.paymentChannels,
        ...(updates.paymentChannels || {}),
      },
    };
    saveStore(store);
    res.json({ siteConfig: store.siteConfig });
  });

  // 11. Admin News Management
  app.post('/api/admin/news', requireAdmin, (req, res) => {
    const {
      title,
      category,
      publishedAt,
      sourceReference,
      excerpt,
      content,
      illustrationType,
    } = req.body || {};
    if (!title || !excerpt) {
      res.status(400).json({ error: 'กรุณาระบุหัวข้อข่าวและข้อความเกริ่นนำ' });
      return;
    }
    const article: NewsArticle = {
      id: `news-${Date.now()}`,
      title: String(title).trim(),
      category: String(category || 'ข่าวสารและประกาศ').trim(),
      publishedAt: String(publishedAt || 'ตุลาคม 2569').trim(),
      sourceReference: String(
        sourceReference || 'ประกาศคลังวัตถุมงคล ๗๕ ปี ตชด.'
      ).trim(),
      excerpt: String(excerpt).trim(),
      content: Array.isArray(content)
        ? content
        : [String(content || excerpt).trim()],
      illustrationType: illustrationType || 'archive',
    };
    store.news.unshift(article);
    saveStore(store);
    res.status(201).json({ article });
  });

  app.delete('/api/admin/news/:id', requireAdmin, (req, res) => {
    const idx = store.news.findIndex((n) => n.id === req.params.id);
    if (idx !== -1) {
      store.news.splice(idx, 1);
      saveStore(store);
    }
    res.json({ success: true });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Background interval to auto-release expired 15-minute slot holds (file mode only;
  // in database mode expiry is purged on each request).
  if (!useRemoteStore) {
    setInterval(() => {
      purgeExpiredRajaSlotHolds();
    }, 15_000);
  }

  // Vite middleware for dev / static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
    console.log(`Sacred Heritage Store Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.BPP_NO_LISTEN) {
  startServer();
}
