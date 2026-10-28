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

interface StoreData {
  siteConfig: SiteConfig;
  products: AmuletProduct[];
  orders: OrderRecord[];
  rajaSlots: RajaSetSlot[];
  news: NewsArticle[];
  inquiries: ContactInquiry[];
}

// Production (Vercel) persists to Firestore; local dev falls back to a JSON file.
const useFirestore = isFirestoreConfigured();
const firestoreStore = useFirestore
  ? createFirestoreStore(() => ({
      siteConfig: structuredClone(initialSiteConfig),
      products: structuredClone(initialProducts),
      rajaSlots: createInitialRajaSlots(),
      news: structuredClone(initialNews),
    }))
  : null;

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
  // Firestore mode: changes are diffed and persisted before each API response.
  if (useFirestore) return;
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

const store: StoreData = useFirestore
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
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bpp-heritage.demo';
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

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

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
        if (process.env.VERCEL && !useFirestore) {
          res.status(503).json({
            error: 'ระบบฐานข้อมูลยังไม่ได้ตั้งค่า (FIREBASE_SERVICE_ACCOUNT)',
          });
          return;
        }
        if (firestoreStore) {
          const cols: ColName[] = [];
          if (req.path.startsWith('/orders') || req.path.startsWith('/admin')) {
            cols.push('orders');
          }
          if (req.path.startsWith('/admin')) cols.push('inquiries');
          await firestoreStore.load(store as unknown as Record<string, any>, cols);
        }
        if (firestoreStore) {
          const originalJson = res.json.bind(res);
          res.json = ((body?: unknown) => {
            firestoreStore
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
    purgeExpiredRajaSlotHolds();
    res.json({
      rajaSlots: store.rajaSlots,
      serverTime: Date.now(),
    });
  });

  app.post('/api/raja-slots/toggle', (req, res) => {
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
  app.post('/api/orders', (req, res) => {
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

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BPP-2569-${randomSuffix}`;

    // Lock selected Raja slots (1-99) atomically as 'booked'
    for (const num of calc.selectedNumbers) {
      const slot = store.rajaSlots.find((s) => s.slotNumber === num);
      if (slot) {
        slot.status = 'booked';
        slot.sessionId = cleanSession;
        slot.heldUntil = 0;
        slot.orderNumber = orderNumber;
        slot.updatedAt = nowIso;
      }
    }

    // Deduct stock for limited items and increment bookedCount for all items
    for (const line of calc.lineItems) {
      const prod = store.products.find((p) => p.id === line.productId);
      if (prod) {
        prod.bookedCount = (prod.bookedCount || 0) + line.quantity;
        if (prod.requiresNumberSelection) {
          const totalBookedSlots = store.rajaSlots.filter(
            (s) => s.status === 'booked'
          ).length;
          prod.stock = Math.max(0, 99 - totalBookedSlots);
        } else if (!prod.isMadeToOrder) {
          prod.stock = Math.max(0, prod.stock - line.quantity);
        }
      }
    }

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
      id: `ord-${now}`,
      orderNumber,
      createdAt: nowIso,
      reservationDateThai,
      customerName: String(customerName).trim(),
      organization: cleanOrg,
      customerPhone: String(customerPhone).trim(),
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
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
  app.post('/api/admin/login', (req, res) => {
    const { email, passcode } = req.body || {};
    if (
      ADMIN_PASSCODE &&
      String(email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      String(passcode || '').trim() === ADMIN_PASSCODE
    ) {
      const token = signAdminToken(ADMIN_EMAIL);
      res.json({
        token,
        adminEmail: ADMIN_EMAIL,
      });
      return;
    }

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

  // 9. Admin Order Status & Tracking Update (With Audit Trail & Raja Slot Release on Reject)
  app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
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
      const nowIso = new Date().toISOString();
      if (Array.isArray(order.selectedNumbers)) {
        for (const num of order.selectedNumbers) {
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
      }
      for (const line of order.items) {
        const prod = store.products.find((p) => p.id === line.productId);
        if (prod) {
          prod.bookedCount = Math.max(0, (prod.bookedCount || 0) - line.quantity);
          if (!prod.isMadeToOrder && !prod.requiresNumberSelection) {
            prod.stock += line.quantity;
          }
        }
      }
      purgeExpiredRajaSlotHolds();
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

    saveStore(store);
    res.json({ order, rajaSlots: enrichRajaSlotsForAdmin() });
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
  // in Firestore mode expiry is purged on each request).
  if (!useFirestore) {
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
