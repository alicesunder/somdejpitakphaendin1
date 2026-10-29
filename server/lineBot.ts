import { Router, Request, Response } from 'express';
import { Buffer } from 'node:buffer';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { AmuletProduct, OrderRecord, SiteConfig } from '../src/types';
import { calculateOrderTotals, verifyPhoneLast4 } from '../src/utils/commerceRules';

type BotStore = {
  products: AmuletProduct[];
  orders: OrderRecord[];
  siteConfig: SiteConfig;
};

type ReservationStage =
  | 'name'
  | 'phone'
  | 'organization'
  | 'delivery'
  | 'address'
  | 'postal'
  | 'payment'
  | 'confirm';

type ReservationSession = {
  stage: ReservationStage;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  idempotencyKey: string;
  customerName?: string;
  customerPhone?: string;
  organization?: string;
  deliveryMethod?: 'shipping' | 'pickup_bpp';
  shippingAddress?: string;
  postalCode?: string;
  paymentMethod?: 'promptpay' | 'bank_transfer';
  createdAt: number;
  updatedAt: number;
};

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const localSessions = new Map<string, ReservationSession>();
let sessionsDb: Firestore | null | undefined;

function getSessionsDb(): Firestore | null {
  if (sessionsDb !== undefined) return sessionsDb;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    sessionsDb = null;
    return null;
  }

  try {
    const serviceAccountText = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf-8');
    const credentials = JSON.parse(serviceAccountText);
    if (typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    const app =
      getApps()[0] ??
      initializeApp({ credential: cert(credentials) });
    sessionsDb = getFirestore(app, process.env.FIREBASE_DATABASE_ID || '(default)');
    return sessionsDb;
  } catch (error) {
    console.error('Could not initialize Firestore session storage:', error);
    throw new Error('LINE reservation sessions could not access Firestore.');
  }
}

async function loadReservationSession(userId: string): Promise<ReservationSession | null> {
  const db = getSessionsDb();
  let session: ReservationSession | undefined;

  if (db) {
    const snapshot = await db.collection('lineBotSessions').doc(userId).get();
    session = snapshot.exists ? (snapshot.data()?.session as ReservationSession) : undefined;
  } else {
    if (process.env.VERCEL) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is required for LINE reservation sessions on Vercel.');
    }
    session = localSessions.get(userId);
  }

  if (!session) return null;
  if (!session.updatedAt || Date.now() - session.updatedAt > SESSION_TTL_MS) {
    await deleteReservationSession(userId);
    return null;
  }
  return session;
}

async function saveReservationSession(userId: string, session: ReservationSession): Promise<void> {
  session.updatedAt = Date.now();
  const db = getSessionsDb();
  if (db) {
    await db.collection('lineBotSessions').doc(userId).set({
      session,
      updatedAt: new Date(session.updatedAt).toISOString(),
    });
    return;
  }
  if (process.env.VERCEL) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is required for LINE reservation sessions on Vercel.');
  }
  localSessions.set(userId, session);
}

async function deleteReservationSession(userId: string): Promise<void> {
  const db = getSessionsDb();
  if (db) {
    await db.collection('lineBotSessions').doc(userId).delete();
    return;
  }
  localSessions.delete(userId);
}

function textMessageWithOptions(
  text: string,
  options: Array<[string, string]>,
): LineMessage {
  return {
    type: 'text',
    text,
    quickReply: {
      items: options.slice(0, 13).map(([label, value]) => ({
        type: 'action',
        action: { type: 'message', label: label.slice(0, 20), text: value.slice(0, 300) },
      })),
    },
  };
}

function availablePaymentOptions(config: SiteConfig): Array<[string, string]> {
  const options: Array<[string, string]> = [];
  if (config.paymentChannels?.enablePromptPay) options.push(['พร้อมเพย์', 'พร้อมเพย์']);
  if (config.paymentChannels?.enableBankTransfer) options.push(['โอนเงิน', 'โอนเงิน']);
  return options;
}

function reservationQuote(
  session: ReservationSession,
  store: BotStore,
): { valid: boolean; text: string } {
  const product = store.products.find((item) => item.id === session.productId && item.isVisible);
  if (!product) {
    return { valid: false, text: 'ขออภัย รายการนี้ไม่พร้อมให้จองแล้ว กรุณาพิมพ์ “รายการพระ” เพื่อเลือกใหม่ครับ' };
  }

  const totals = calculateOrderTotals(
    [{ productId: session.productId, quantity: session.quantity }],
    store.products,
    session.deliveryMethod === 'pickup_bpp' ? 0 : store.siteConfig.standardShippingFee,
    store.siteConfig.freeShippingThreshold,
  );
  if (!totals.valid) {
    return { valid: false, text: totals.errors[0] || 'รายการนี้ไม่สามารถจองได้ในขณะนี้ กรุณาเลือกใหม่ครับ' };
  }

  return {
    valid: true,
    text: [
      'กรุณาตรวจสอบข้อมูลก่อนยืนยันใบจอง',
      `รายการ: ${product.name} (${product.code})`,
      `จำนวน: ${session.quantity}`,
      `ราคาต่อรายการ: ${formatBaht(product.price)} บาท`,
      `ค่าจัดส่ง: ${formatBaht(totals.shippingTotal)} บาท`,
      `ยอดรวม: ${formatBaht(totals.grandTotal)} บาท`,
      `ผู้จอง: ${session.customerName}`,
      `โทรศัพท์: XXX-XXX-${(session.customerPhone || '').replace(/\\D/g, '').slice(-4)}`,
      `หน่วยงาน: ${session.organization || 'ประชาชนทั่วไป'}`,
      `วิธีรับ: ${session.deliveryMethod === 'pickup_bpp' ? 'รับเองที่ บช.ตชด.' : 'จัดส่งทางไปรษณีย์'}`,
      `วิธีชำระ: ${session.paymentMethod === 'promptpay' ? 'พร้อมเพย์' : 'โอนเงิน'}`,
      '',
      'ยอดรวมสุดท้ายจะถูกตรวจสอบอีกครั้งโดยเว็บไซต์ก่อนบันทึกใบจอง.',
    ].join('\\n'),
  };
}

async function handleReservationSession(
  rawText: string,
  session: ReservationSession,
  store: BotStore,
  userId: string,
): Promise<LineMessage[]> {
  const text = rawText.trim();
  const digits = text.replace(/\\D/g, '');

  if (/^(ยกเลิก|cancel)$/i.test(text)) {
    await deleteReservationSession(userId);
    return [textMessage('ยกเลิกขั้นตอนจองแล้วครับ หากต้องการเริ่มใหม่ พิมพ์ “รายการพระ” หรือ “จอง ชศ1 1” ได้เลย')];
  }

  if (session.stage === 'name') {
    if (text.length < 3) {
      return [textMessageWithOptions('กรุณาพิมพ์ชื่อ–นามสกุลผู้จองอย่างน้อย 3 ตัวอักษรครับ', [['ยกเลิกการจอง', 'ยกเลิก']])];
    }
    session.customerName = text;
    session.stage = 'phone';
    await saveReservationSession(userId, session);
    return [textMessageWithOptions('ขอหมายเลขโทรศัพท์ที่ติดต่อได้ 9–10 หลักครับ', [['ยกเลิกการจอง', 'ยกเลิก']])];
  }

  if (session.stage === 'phone') {
    if (digits.length < 9 || digits.length > 10) {
      return [textMessageWithOptions('กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก ตัวอย่าง 0812345678', [['ยกเลิกการจอง', 'ยกเลิก']])];
    }
    session.customerPhone = text;
    session.stage = 'organization';
    await saveReservationSession(userId, session);
    return [textMessageWithOptions('ระบุหน่วยงาน/สังกัด หรือเลือก “ประชาชนทั่วไป” ครับ', [['ประชาชนทั่วไป', 'ประชาชนทั่วไป'], ['ยกเลิกการจอง', 'ยกเลิก']])];
  }

  if (session.stage === 'organization') {
    if (text.length < 2) {
      return [textMessageWithOptions('กรุณาระบุหน่วยงาน หรือเลือก “ประชาชนทั่วไป” ครับ', [['ประชาชนทั่วไป', 'ประชาชนทั่วไป'], ['ยกเลิกการจอง', 'ยกเลิก']])];
    }
    session.organization = text;
    session.stage = 'delivery';
    await saveReservationSession(userId, session);
    return [textMessageWithOptions('ต้องการรับวัตถุมงคลแบบใดครับ?', [['จัดส่งไปรษณีย์', 'จัดส่ง'], ['รับเองที่ บช.ตชด.', 'รับเอง'], ['ยกเลิกการจอง', 'ยกเลิก']])];
  }

  if (session.stage === 'delivery') {
    if (/^(จัดส่ง|ส่ง|จัดส่งไปรษณีย์|จัดส่งทางไปรษณีย์)$/i.test(text)) {
      session.deliveryMethod = 'shipping';
      session.stage = 'address';
      await saveReservationSession(userId, session);
      return [textMessageWithOptions('กรุณาพิมพ์ที่อยู่จัดส่งให้ครบ (บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด) ครับ', [['ยกเลิกการจอง', 'ยกเลิก']])];
    }
    if (/^(รับเอง|รับที่บช\.ตชด\.|รับเองที่บช\.ตชด\.)$/i.test(text)) {
      session.deliveryMethod = 'pickup_bpp';
      session.postalCode = '10400';
      session.stage = 'payment';
      await saveReservationSession(userId, session);
      const options = availablePaymentOptions(store.siteConfig);
      if (!options.length) {
        return [textMessage('ขณะนี้ยังไม่มีช่องทางชำระเงินที่เปิดใช้งานในระบบ กรุณาติดต่อเจ้าหน้าที่ก่อนยืนยันการจองครับ')];
      }
      return [textMessageWithOptions('โปรดเลือกช่องทางชำระเงินครับ', options.concat([['ยกเลิกการจอง', 'ยกเลิก']]))];
    }
    return [textMessageWithOptions('กรุณาเลือก “จัดส่งไปรษณีย์” หรือ “รับเองที่ บช.ตชด.” ครับ', [['จัดส่งไปรษณีย์', 'จัดส่ง'], ['รับเองที่ บช.ตชด.', 'รับเอง'], ['ยกเลิกการจอง', 'ยกเลิก']])];
  }

  if (session.stage === 'address') {
    if (text.length < 8) {
      return [textMessageWithOptions('ที่อยู่ยังไม่ครบ กรุณาระบุบ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต และจังหวัดครับ', [['ยกเลิกการจอง', 'ยกเลิก']])];
    }
    session.shippingAddress = text;
    session.stage = 'postal';
    await saveReservationSession(userId, session);
    return [textMessageWithOptions('กรุณาระบุรหัสไปรษณีย์ 5 หลักครับ', [['ยกเลิกการจอง', 'ยกเลิก']])];
  }

  if (session.stage === 'postal') {
    if (!/^\\d{5}$/.test(text)) {
      return [textMessageWithOptions('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลักครับ', [['ยกเลิกการจอง', 'ยกเลิก']])];
    }
    session.postalCode = text;
    session.stage = 'payment';
    await saveReservationSession(userId, session);
    const options = availablePaymentOptions(store.siteConfig);
    if (!options.length) {
      return [textMessage('ขณะนี้ยังไม่มีช่องทางชำระเงินที่เปิดใช้งานในระบบ กรุณาติดต่อเจ้าหน้าที่ก่อนยืนยันการจองครับ')];
    }
    return [textMessageWithOptions('โปรดเลือกช่องทางชำระเงินครับ', options.concat([['ยกเลิกการจอง', 'ยกเลิก']]))];
  }

  if (session.stage === 'payment') {
    const method = /^(พร้อมเพย์|promptpay|qr)$/i.test(text)
      ? 'promptpay'
      : /^(โอนเงิน|โอนธนาคาร|bank_transfer)$/i.test(text)
      ? 'bank_transfer'
      : undefined;
    const optionLabels = availablePaymentOptions(store.siteConfig);
    if (!method || !optionLabels.some(([, value]) =>
      (method === 'promptpay' && /พร้อมเพย์/i.test(value)) ||
      (method === 'bank_transfer' && /โอนเงิน/i.test(value))
    )) {
      return [textMessageWithOptions('กรุณาเลือกช่องทางชำระเงินจากตัวเลือกที่แสดงครับ', optionLabels.concat([['ยกเลิกการจอง', 'ยกเลิก']]))];
    }
    session.paymentMethod = method;
    session.stage = 'confirm';
    await saveReservationSession(userId, session);
    const quote = reservationQuote(session, store);
    if (!quote.valid) {
      await deleteReservationSession(userId);
      return [textMessage(quote.text)];
    }
    return [textMessageWithOptions(quote.text, [['ยืนยันการจอง', 'ยืนยัน'], ['ยกเลิกการจอง', 'ยกเลิก']])];
  }

  if (session.stage === 'confirm') {
    if (!/^(ยืนยัน|ยืนยันการจอง|confirm)$/i.test(text)) {
      return [textMessageWithOptions('กรุณากด “ยืนยันการจอง” หรือ “ยกเลิกการจอง” ครับ', [['ยืนยันการจอง', 'ยืนยัน'], ['ยกเลิกการจอง', 'ยกเลิก']])];
    }

    const quote = reservationQuote(session, store);
    if (!quote.valid) {
      await deleteReservationSession(userId);
      return [textMessage(quote.text)];
    }

    const siteUrl = getSiteUrl();
    let response: globalThis.Response;
    let body: Record<string, any> = {};
    try {
      response = await fetch(`${siteUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: session.productId, quantity: session.quantity }],
          customerName: session.customerName,
          organization: session.organization || 'ประชาชนทั่วไป',
          customerPhone: session.customerPhone,
          deliveryMethod: session.deliveryMethod,
          shippingAddress: session.deliveryMethod === 'pickup_bpp'
            ? 'มารับเองที่ บช.ตชด.'
            : session.shippingAddress,
          postalCode: session.postalCode || '',
          paymentMethod: session.paymentMethod,
          sessionId: `LINE-${userId}`,
          idempotencyKey: session.idempotencyKey,
        }),
      });
      body = (await response.json().catch(() => ({}))) as Record<string, any>;
    } catch (error) {
      console.error('Failed to create reservation through storefront API:', error);
      return [textMessageWithOptions('เชื่อมต่อระบบใบจองไม่สำเร็จชั่วคราว ข้อมูลที่กรอกยังถูกเก็บไว้ กรุณากด “ยืนยัน” อีกครั้งภายหลัง หรือเข้าเว็บไซต์โดยตรงครับ', [['ยืนยันอีกครั้ง', 'ยืนยัน'], ['ยกเลิกการจอง', 'ยกเลิก']])];
    }

    if (!response.ok) {
      if (response.status >= 500) {
        return [textMessageWithOptions('ระบบใบจองขัดข้องชั่วคราว ข้อมูลที่กรอกยังถูกเก็บไว้ กรุณากด “ยืนยัน” อีกครั้งภายหลังครับ', [['ยืนยันอีกครั้ง', 'ยืนยัน'], ['ยกเลิกการจอง', 'ยกเลิก']])];
      }
      await deleteReservationSession(userId);
      const reason = typeof body.error === 'string' ? body.error : 'ระบบไม่สามารถสร้างใบจองได้';
      return [textMessage(`ยังไม่สามารถสร้างใบจองได้: ${reason}\\n\\nกรุณาพิมพ์ “รายการพระ” เพื่อเริ่มใหม่ หรือเปิดเว็บไซต์ ${siteUrl}`)];
    }

    await deleteReservationSession(userId);
    const order = body.order as { orderNumber?: string; grandTotal?: number } | undefined;
    if (!order?.orderNumber) {
      return [textMessage(`ระบบรับคำขอแล้ว แต่ไม่พบเลขที่ใบจองในคำตอบ กรุณาตรวจสอบผ่านเว็บไซต์ ${siteUrl}`)];
    }
    return [
      textMessage(
        [
          '✅ บันทึกใบจองเรียบร้อยแล้ว',
          `เลขที่ใบจอง: ${order.orderNumber}`,
          `ยอดรวม: ${formatBaht(Number(order.grandTotal ?? 0))} บาท`,
          'สถานะการชำระเงิน: รอเจ้าหน้าที่ตรวจสอบ',
          '',
          `ติดตามสถานะโดยพิมพ์ “ติดตาม ${order.orderNumber} โทรศัพท์ 4 หลักท้าย”`,
          `รายละเอียดช่องทางชำระเงินและเงื่อนไขรับวัตถุมงคล โปรดตรวจสอบบนเว็บไซต์: ${siteUrl}`,
        ].join('\\n'),
      ),
    ];
  }

  await deleteReservationSession(userId);
  return [textMessage('ขั้นตอนจองไม่ถูกต้อง ระบบยกเลิกขั้นตอนเดิมแล้ว กรุณาพิมพ์ “รายการพระ” เพื่อเริ่มใหม่ครับ')];
}


type RequestWithRawBody = Request & { rawBody?: Buffer };
type LineMessage = Record<string, unknown>;
type LineEvent = {
  type?: string;
  replyToken?: string;
  message?: { type?: string; text?: string };
  postback?: { data?: string };
};

const DEFAULT_SITE_URL = 'https://www.somdejpitakphaendin.com';

function getSiteUrl(): string {
  return (process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

function formatBaht(value: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s\u200B]+/g, '').trim();
}

function quickReplyItems() {
  const options = [
    ['รายการพระ', 'รายการพระ'],
    ['ชุดพิเศษ', 'ชุดพิเศษ'],
    ['วิธีจอง', 'วิธีจอง'],
    ['ติดตามใบจอง', 'ติดตาม'],
    ['ติดต่อเจ้าหน้าที่', 'ติดต่อเจ้าหน้าที่'],
  ];
  return {
    items: options.map(([label, text]) => ({
      type: 'action',
      action: { type: 'message', label, text },
    })),
  };
}

function textMessage(text: string, withQuickReply = true): LineMessage {
  return {
    type: 'text',
    text,
    ...(withQuickReply ? { quickReply: quickReplyItems() } : {}),
  };
}

function productAvailability(product: AmuletProduct): string {
  if (product.isMadeToOrder) return 'เปิดรับจองตามเงื่อนไขที่ประกาศ';
  if (product.requiresNumberSelection) {
    return product.stock > 0
      ? `หมายเลขคงเหลือโดยประมาณ ${product.stock} ชุด · ตรวจสอบเลขก่อนยืนยัน`
      : 'โปรดตรวจสอบหมายเลขคงเหลือบนเว็บไซต์';
  }
  if (product.stock > 0) return `คงเหลือตามระบบ ${product.stock} รายการ`;
  return 'โปรดสอบถามเจ้าหน้าที่เรื่องจำนวนคงเหลือ';
}

function productBubble(product: AmuletProduct, siteUrl: string): Record<string, unknown> {
  const contents: Record<string, unknown>[] = [
    {
      type: 'text',
      text: product.name,
      weight: 'bold',
      size: 'md',
      wrap: true,
      color: '#2C2112',
    },
    {
      type: 'text',
      text: `รหัส ${product.code}`,
      size: 'sm',
      color: '#99712A',
      wrap: true,
      margin: 'sm',
    },
    {
      type: 'text',
      text: `บูชา ${formatBaht(product.price)} บาท`,
      weight: 'bold',
      size: 'lg',
      color: '#875A16',
      margin: 'md',
      wrap: true,
    },
    {
      type: 'text',
      text: product.material || product.categoryLabel,
      size: 'sm',
      color: '#6E675C',
      wrap: true,
      margin: 'sm',
    },
    {
      type: 'text',
      text: productAvailability(product),
      size: 'xs',
      color: '#6E675C',
      wrap: true,
      margin: 'sm',
    },
  ];

  const frontImage = product.angles?.find((angle) => angle.angle === 'front')?.imageUrl;
  const hero =
    frontImage && /^https:\/\//i.test(frontImage)
      ? {
          type: 'image',
          url: frontImage,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
        }
      : undefined;

  return {
    type: 'bubble',
    size: 'mega',
    ...(hero ? { hero } : {}),
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#8A6425',
          action: {
            type: 'uri',
            label: 'ดูและจองบนเว็บไซต์',
            uri: siteUrl,
          },
        },
      ],
    },
    styles: {
      body: { backgroundColor: '#FFF9ED' },
      footer: { backgroundColor: '#FFF9ED' },
    },
  };
}

function productFlex(products: AmuletProduct[], siteUrl: string): LineMessage {
  const chosen = products.slice(0, 8);
  const bubbles = chosen.map((product) => productBubble(product, siteUrl));
  const contents =
    bubbles.length === 1
      ? bubbles[0]
      : { type: 'carousel', contents: bubbles };

  return {
    type: 'flex',
    altText:
      chosen.length === 1
        ? `${chosen[0].name} ราคา ${formatBaht(chosen[0].price)} บาท`
        : `รายการวัตถุมงคล ${chosen.length} รายการ`,
    contents,
  };
}

function findProductCode(text: string): string | undefined {
  const match = text.match(/(?:ชศ|ช)\s*\d{1,2}/i);
  return match?.[0].replace(/\s+/g, '');
}

function getOrderStatus(order: OrderRecord): string {
  const payment: Record<string, string> = {
    pending_verification: 'รอเจ้าหน้าที่ตรวจสอบการชำระเงิน',
    verified_paid: 'ยืนยันการชำระเงินแล้ว',
    payment_rejected: 'การชำระเงินมีประเด็นที่ต้องตรวจสอบเพิ่มเติม',
  };
  const preparation: Record<string, string> = {
    awaiting_payment: 'รอชำระเงิน',
    inspecting_artifact: 'กำลังตรวจสอบและจัดเตรียมวัตถุมงคล',
    packed_ready: 'จัดเตรียมเรียบร้อย',
  };
  const shipping: Record<string, string> = {
    not_shipped: 'ยังไม่จัดส่ง',
    in_transit: 'จัดส่งแล้ว',
    delivered: 'จัดส่งสำเร็จ',
  };

  const lines = [
    `เลขที่ใบจอง: ${order.orderNumber}`,
    `การชำระเงิน: ${payment[order.paymentStatus] || 'กรุณาติดต่อเจ้าหน้าที่'}`,
    `การจัดเตรียม: ${preparation[order.preparationStatus] || 'อยู่ระหว่างตรวจสอบ'}`,
    `สถานะจัดส่ง: ${shipping[order.shippingStatus] || 'อยู่ระหว่างตรวจสอบ'}`,
    `ยอดรวม: ${formatBaht(order.grandTotal)} บาท`,
    `รายการ: ${order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}`,
  ];
  if (order.trackingNumber) {
    lines.push(`เลขพัสดุ: ${order.trackingNumber}`);
    if (order.carrierName) lines.push(`บริษัทขนส่ง: ${order.carrierName}`);
  }
  return lines.join('\n');
}

function processText(rawText: string, store: BotStore): LineMessage[] {
  const text = rawText.trim();
  const siteUrl = getSiteUrl();

  if (!text) {
    return [textMessage('พิมพ์ “รายการพระ” เพื่อดูวัตถุมงคล หรือ “วิธีจอง” เพื่อดูขั้นตอนการจองครับ')];
  }

  if (/^(สวัสดี|เริ่ม|เริ่มต้น|เมนู|menu|start|ช่วยเหลือ|help)$/i.test(text)) {
    return [
      textMessage(
        'ยินดีต้อนรับสู่ระบบสอบถามวัตถุมงคล “สมเด็จพิทักษ์แผ่นดิน” ๗๕ ปี ตชด.\n\nพิมพ์ชื่อเนื้อหรือรหัสจอง เช่น “ชศ1”, “ราคาเนื้อเงิน” หรือเลือกเมนูด้านล่างได้เลยครับ',
      ),
    ];
  }

  if (/^(วิธีจอง|จองอย่างไร|ขั้นตอนจอง|วิธีสั่งจอง)$/i.test(text)) {
    return [
      textMessage(
        'ขั้นตอนการจอง\n๑. เลือกรายการวัตถุมงคลและตรวจสอบราคา\n๒. กด “ดูและจองบนเว็บไซต์”\n๓. เลือกรายการและจำนวนที่ต้องการ กรอกข้อมูลผู้จองให้ครบ\n๔. ตรวจสอบยอดรวมและส่งใบจอง\n๕. ติดตามสถานะได้โดยพิมพ์ “ติดตาม เลขที่ใบจอง โทรศัพท์4หลักท้าย”\n\nระบบใช้เว็บไซต์เดิมในการบันทึกคำสั่งจองเป็นข้อมูลกลาง',
      ),
    ];
  }

  if (/^(ติดต่อเจ้าหน้าที่|ติดต่อแอดมิน|สอบถามเจ้าหน้าที่)$/i.test(text)) {
    return [
      textMessage(
        `หากต้องการสอบถามเจ้าหน้าที่ กรุณาเปิดเว็บไซต์และใช้ช่องทางติดต่อที่ระบุไว้: ${siteUrl}\n\nโปรดอย่าส่งข้อมูลบัตรประชาชนหรือข้อมูลการเงินที่ไม่จำเป็นในแชตนี้`,
      ),
    ];
  }

  if (/^(ติดตาม|สถานะ|ติดตามใบจอง|ตรวจสอบใบจอง|เช็กสถานะ|เช็คสถานะ)$/i.test(text) ||
      /(ติดตาม|สถานะใบจอง|ตรวจสอบใบจอง|เช็กสถานะ|เช็คสถานะ)/i.test(text)) {
    const orderNumber = text.match(/BPP-\d{4}-\d{4}/i)?.[0]?.toUpperCase();
    if (!orderNumber) {
      return [
        textMessage(
          'เพื่อตรวจสอบสถานะ กรุณาพิมพ์เลขที่ใบจองและโทรศัพท์ 4 หลักท้ายในรูปแบบนี้\n\nติดตาม BPP-2569-1234 5678\n\nตัวอย่างเป็นรูปแบบเท่านั้น โปรดใช้ข้อมูลจริงจากใบจองของคุณ',
        ),
      ];
    }

    const withoutOrderNo = text.replace(new RegExp(orderNumber, 'i'), ' ');
    const fourDigitTokens = withoutOrderNo.match(/\d{4,}/g) || [];
    const phoneLast4 = fourDigitTokens.length
      ? fourDigitTokens[fourDigitTokens.length - 1].slice(-4)
      : '';
    if (phoneLast4.length !== 4) {
      return [textMessage('กรุณาใส่โทรศัพท์ 4 หลักท้ายต่อท้ายเลขที่ใบจอง เช่น “ติดตาม BPP-2569-1234 5678”')];
    }

    const order = store.orders.find(
      (item) => item.orderNumber.toUpperCase() === orderNumber,
    );
    if (!order || !verifyPhoneLast4(order.customerPhone, phoneLast4)) {
      return [
        textMessage(
          'ไม่พบใบจองที่ตรงกับข้อมูล หรือโทรศัพท์ 4 หลักท้ายไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง หากยังไม่พบให้ติดต่อเจ้าหน้าที่ผ่านเว็บไซต์',
        ),
      ];
    }
    return [textMessage(getOrderStatus(order))];
  }

  if (/ชุดพิเศษ|ชุดทองคำใหญ่|ชุดยกกล่อง|ชุดกรรมการ/i.test(text) && !findProductCode(text)) {
    const special = store.products
      .filter((p) => p.isVisible && (p.category === 'special_set' || /^ช[123]$/i.test(p.code)))
      .sort((a, b) => a.code.localeCompare(b.code, 'th'));
    if (special.length) {
      return [
        textMessage('รายการชุดพิเศษที่มีในระบบ คลิกการ์ดเพื่อดูรายละเอียดและไปยังเว็บไซต์จอง'),
        productFlex(special, siteUrl),
      ];
    }
  }

  const code = findProductCode(text);
  if (code) {
    const matched = store.products.filter(
      (product) => product.isVisible && normalize(product.code) === normalize(code),
    );
    if (matched.length) {
      return [
        textMessage(`พบรายการรหัส ${code} ในระบบ ราคาและจำนวนคงเหลืออ้างอิงจากข้อมูลเว็บไซต์ล่าสุด`),
        productFlex(matched, siteUrl),
      ];
    }
    return [textMessage(`ไม่พบรหัส ${code} ในรายการที่เผยแพร่ กรุณาพิมพ์ “รายการพระ” หรือสอบถามเจ้าหน้าที่`)];
  }

  if (/^(รายการพระ|ดูรายการพระ|รายการทั้งหมด|สินค้า|ดูสินค้า|catalog|พระทั้งหมด)$/i.test(text)) {
    const products = store.products
      .filter((p) => p.isVisible)
      .sort((a, b) => a.code.localeCompare(b.code, 'th'));
    if (!products.length) return [textMessage('ขณะนี้ยังไม่มีรายการที่เผยแพร่ในระบบ กรุณาติดต่อเจ้าหน้าที่')];
    return [
      textMessage('รายการวัตถุมงคลที่เผยแพร่ในเว็บไซต์ (แสดงได้สูงสุด 8 รายการต่อครั้ง)'),
      productFlex(products, siteUrl),
    ];
  }

  if (/^(จอง|สั่งจอง|สั่งซื้อ|ซื้อพระ)$/i.test(text)) {
    return [
      textMessage(
        `การจองจะบันทึกผ่านเว็บไซต์เดิม เพื่อให้ข้อมูลรายการ ยอดรวม และสต็อกตรงกับระบบกลาง\n\nเปิดเว็บไซต์: ${siteUrl}\n\nพิมพ์รหัสจอง เช่น “ชศ1” เพื่อดูราคาของรายการนั้นโดยตรง`,
      ),
    ];
  }

  const query = text
    .replace(/^(ขอรายละเอียด|รายละเอียด|ค้นหา|ดู|ราคา|ราคาของ|พระ|เนื้อ)\s*/i, '')
    .trim();
  const queryNorm = normalize(query);
  if (queryNorm.length >= 2) {
    const matches = store.products
      .filter((p) => p.isVisible)
      .filter((p) => {
        const searchable = normalize([
          p.code,
          p.name,
          p.material,
          p.categoryLabel,
          p.moldType || '',
          p.series,
        ].join(' '));
        return searchable.includes(queryNorm) || queryNorm.includes(normalize(p.code));
      })
      .slice(0, 8);
    if (matches.length) {
      return [
        textMessage(`พบรายการที่เกี่ยวข้องกับ “${query}”`),
        productFlex(matches, siteUrl),
      ];
    }
  }

  if (/^(เว็บไซต์|เว็บ|เปิดเว็บ)$/i.test(text)) {
    return [textMessage(`เปิดเว็บไซต์สั่งจองได้ที่ ${siteUrl}`)];
  }

  return [
    textMessage(
      'ขออภัยครับ ยังไม่พบคำตอบที่ตรงกับข้อความนี้\n\nลองพิมพ์ “รายการพระ”, “ชุดพิเศษ”, “ราคา ชศ1”, “วิธีจอง” หรือ “ติดตาม” ได้ครับ',
    ),
  ];
}

async function replyToLine(replyToken: string, messages: LineMessage[]): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured; cannot reply to LINE.');
    return;
  }

  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ replyToken, messages: messages.slice(0, 5) }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`LINE reply API returned ${response.status}: ${body.slice(0, 300)}`);
  }
}

function isValidSignature(rawBody: Buffer, signature: string, channelSecret: string): boolean {
  const expected = createHmac('sha256', channelSecret).update(rawBody).digest('base64');
  const receivedBytes = Buffer.from(signature || '');
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}

export function createLineBotRouter(store: BotStore) {
  const router = Router();

  router.post('/webhook', async (req: Request, res: Response) => {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const signature = req.header('x-line-signature') || '';
    const rawBody = (req as RequestWithRawBody).rawBody;

    if (!channelSecret) {
      res.status(503).json({ error: 'LINE bot is not configured: LINE_CHANNEL_SECRET is missing.' });
      return;
    }
    if (!rawBody || !isValidSignature(rawBody, signature, channelSecret)) {
      res.status(401).json({ error: 'Invalid LINE webhook signature.' });
      return;
    }

    const events = Array.isArray(req.body?.events) ? (req.body.events as LineEvent[]) : [];
    try {
      for (const event of events) {
        if (!event.replyToken) continue;
        let messages: LineMessage[];

        if (event.type === 'follow') {
          messages = [
            textMessage(
              'ยินดีต้อนรับครับ 🙏\nนี่คือ LINE Chatbot สอบถามวัตถุมงคล “สมเด็จพิทักษ์แผ่นดิน” ๗๕ ปี ตชด.\n\nพิมพ์ “รายการพระ” เพื่อดูราคา หรือ “วิธีจอง” เพื่อเริ่มสั่งจอง',
            ),
          ];
        } else if (event.type === 'message' && event.message?.type === 'text') {
          messages = processText(event.message.text || '', store);
        } else if (event.type === 'postback') {
          messages = processText(event.postback?.data || '', store);
        } else {
          messages = [textMessage('บอตรองรับข้อความตัวอักษรครับ พิมพ์ “รายการพระ” เพื่อเริ่มต้น')];
        }

        try {
          await replyToLine(event.replyToken, messages);
        } catch (error) {
          console.error('Failed to reply to LINE event:', error);
        }
      }
      // LINE retries are avoided here after the event has been accepted. The reply failure, if any,
      // is logged; users can retry the text command in the chat.
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('LINE webhook processing failed:', error);
      res.status(500).json({ error: 'LINE webhook processing failed.' });
    }
  });

  return router;
}

/**
 * Optional staff notifications for orders created through the existing website checkout.
 * Configure LINE_ADMIN_USER_IDS as a comma-separated list of LINE user IDs.
 */
export async function notifyLineAdminsNewOrder(order: OrderRecord): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminIds = (process.env.LINE_ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (!accessToken || !adminIds.length) return;

  const itemText = order.items
    .map((item) => `• ${item.productCode} ${item.productName} × ${item.quantity}`)
    .join('\n');
  const message = [
    '🔔 มีใบจองวัตถุมงคลใหม่จากเว็บไซต์',
    `เลขที่ใบจอง: ${order.orderNumber}`,
    itemText,
    `ยอดรวม: ${formatBaht(order.grandTotal)} บาท`,
    `สถานะชำระเงิน: ${order.paymentStatus}`,
    'กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียด',
  ].join('\n').slice(0, 4500);

  const results = await Promise.all(
    adminIds.map(async (to) => {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, messages: [{ type: 'text', text: message }] }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`LINE admin push failed (${response.status}): ${body.slice(0, 200)}`);
      }
    }),
  );
  void results;
}
