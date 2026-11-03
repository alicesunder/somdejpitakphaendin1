import type { OrderRecord } from '../types';
import { wrap as wrapByChar } from './orderImage';

/**
 * Per-day export of order details: one A4 page per order with the buyer's details, what to send
 * and where, the payment and the transfer slip. Pages are drawn on a canvas (so the browser
 * shapes the Thai text correctly) and assembled into a PDF with pdf-lib in the staff member's
 * own browser — nothing is generated on the server and no data leaves the dashboard.
 */
export const PDF_PART_SIZE = 25;

const PX_W = 1240; // A4 at 150 dpi
const PX_H = 1754;
const PT_W = 595.28;
const PT_H = 841.89;
const M = 70;
export const SANS = "'IBM Plex Sans Thai', 'Noto Sans Thai', Tahoma, sans-serif";
const INK = '#18140E';
const MUTED = '#6B6458';
const RULE = '#C9A45C';

export type DayBasis = 'booked' | 'paid';

/** yyyy-mm-dd in Thailand time */
export const bangkokDay = (isoOrMs: string | number | Date) =>
  new Date(new Date(isoOrMs).getTime() + 7 * 3600_000).toISOString().slice(0, 10);

/**
 * The moment the buyer paid: when staff confirmed it, otherwise when the slip was sent,
 * otherwise (cash / counter sales) the booking time.
 */
export function paidAt(o: OrderRecord): string {
  if (o.paymentStatus === 'verified_paid') {
    const entry = [...o.statusHistory].reverse().find((h) => h.paymentStatus === 'verified_paid');
    if (entry) return entry.timestamp;
  }
  return o.slipUploadedAt || o.createdAt;
}

export function ordersForDay(orders: OrderRecord[], day: string, basis: DayBasis, includeCancelled: boolean) {
  const at = (o: OrderRecord) => (basis === 'booked' ? o.createdAt : paidAt(o));
  return orders
    .filter((o) => (includeCancelled || o.paymentStatus !== 'payment_rejected') && bangkokDay(at(o)) === day)
    .sort((a, b) => new Date(at(a)).getTime() - new Date(at(b)).getTime());
}

const baht = (n: number) => `฿${Number(n || 0).toLocaleString('th-TH')}`;
const thaiDateTime = (iso: string) =>
  new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long', timeStyle: 'short' }) + ' น.';

const PAY_LABEL: Record<string, string> = {
  pending_verification: 'รอตรวจสอบ',
  verified_paid: 'ชำระแล้ว',
  payment_rejected: 'ยกเลิก',
};
const PREP_LABEL: Record<string, string> = {
  awaiting_payment: 'รอชำระเงิน',
  inspecting_artifact: 'กำลังตรวจสอบ/เตรียมองค์พระ',
  packed_ready: 'บรรจุกล่องพร้อมส่ง',
};
const SHIP_LABEL: Record<string, string> = { not_shipped: 'ยังไม่จัดส่ง', in_transit: 'อยู่ระหว่างจัดส่ง', delivered: 'ส่งถึงแล้ว' };

// Thai has no spaces, so break lines between dictionary words (Intl.Segmenter) instead of in the
// middle of one; falls back to breaking by character where the browser has no Thai dictionary.
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new (Intl as any).Segmenter('th', { granularity: 'word' }) : null;
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
  if (!segmenter) return wrapByChar(ctx, text, maxWidth, maxLines);
  const words: string[] = Array.from(segmenter.segment(text), (x: { segment: string }) => x.segment);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (ctx.measureText(line + w).width <= maxWidth || !line) {
      line += w;
      // A single very long word (a URL, a long number) still has to be cut somewhere.
      while (ctx.measureText(line).width > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
        if (lines.length >= maxLines) break;
      }
    } else {
      lines.push(line.trimEnd());
      line = w.trimStart();
    }
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line.trimEnd());
  const used = lines.join("").length;
  if (lines.length === maxLines && used < text.replace(/\s/g, "").length - 1) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
  }
  return lines.length ? lines : [""];
}

export async function loadFonts() {
  try {
    await Promise.all([400, 600, 700, 800].map((w) => document.fonts.load(`${w} 30px ${SANS}`)));
    await document.fonts.ready;
  } catch {
    /* use whatever is available */
  }
}

interface PageDraw {
  canvas: HTMLCanvasElement;
  /** Where the slip goes, in canvas pixels */
  slip: { x: number; y: number; w: number; h: number };
}

function drawPage(o: OrderRecord, index: number, total: number, printedAt: string, hasSlip: boolean): PageDraw {
  const canvas = document.createElement('canvas');
  canvas.width = PX_W;
  canvas.height = PX_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PX_W, PX_H);
  ctx.textBaseline = 'alphabetic';

  // Two columns under the header: details on the left, the (tall, phone-shaped) slip on the right
  // so it prints large enough to read.
  const right = PX_W - M;
  const COL_W = 640;
  const slipX = M + COL_W + 40;
  const text = (s: string, x: number, y: number, font: string, color = INK, align: CanvasTextAlign = 'left') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const rule = (y: number, x1 = M, x2 = M + COL_W, color = '#E5DCC3', w = 1.5) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  };

  // Header
  text('ข้อมูลผู้สั่งจอง · สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.', M, 78, `600 26px ${SANS}`, MUTED);
  text(`ใบที่ ${index + 1} / ${total}`, right, 78, `600 26px ${SANS}`, MUTED, 'right');
  text(o.orderNumber, M, 148, `800 62px ${SANS}`);

  const pay = PAY_LABEL[o.paymentStatus] || o.paymentStatus;
  ctx.font = `700 30px ${SANS}`;
  const pillW = ctx.measureText(pay).width + 52;
  ctx.fillStyle = o.paymentStatus === 'verified_paid' ? '#047857' : o.paymentStatus === 'payment_rejected' ? '#B91C1C' : '#B45309';
  ctx.beginPath();
  ctx.roundRect(right - pillW, 100, pillW, 58, 29);
  ctx.fill();
  text(pay, right - pillW / 2, 140, `700 30px ${SANS}`, '#FFFFFF', 'center');

  text(
    `จองเมื่อ ${thaiDateTime(o.createdAt)} · ${o.salesChannel === 'admin' ? 'เจ้าหน้าที่สร้างให้' : 'จองผ่านเว็บไซต์'}`,
    M,
    196,
    `500 27px ${SANS}`,
    MUTED,
  );
  rule(222, M, right, RULE, 2);

  let y = 222;
  const section = (title: string) => {
    y += 58;
    text(title, M, y, `700 31px ${SANS}`, '#8A6D2F');
    y += 6;
  };
  const LABEL_W = 170;
  /** label on the left, value (wrapped) on the right */
  const row = (label: string, value: string, opts: { size?: number; weight?: number; lines?: number } = {}) => {
    const size = opts.size ?? 28;
    const weight = opts.weight ?? 600;
    ctx.font = `${weight} ${size}px ${SANS}`;
    const lines = wrap(ctx, value || '-', COL_W - LABEL_W, opts.lines ?? 2);
    y += size + 12;
    text(label, M, y, `500 ${size - 3}px ${SANS}`, MUTED);
    lines.forEach((l, i) => text(l, M + LABEL_W, y + i * (size + 8), `${weight} ${size}px ${SANS}`));
    y += (size + 8) * (lines.length - 1);
  };
  /** a block of text across the whole column (addresses) */
  const block = (label: string, value: string, size: number, lines: number) => {
    y += 40;
    text(label, M, y, `500 ${size - 6}px ${SANS}`, MUTED);
    ctx.font = `700 ${size}px ${SANS}`;
    const wrapped = wrap(ctx, value || '-', COL_W, lines);
    wrapped.forEach((l, i) => text(l, M, y + 12 + size + i * (size + 10), `700 ${size}px ${SANS}`));
    y += 12 + size + (wrapped.length - 1) * (size + 10);
  };

  // Buyer
  section('ผู้สั่งจอง');
  y += 8;
  ctx.font = `700 36px ${SANS}`;
  const nameLines = wrap(ctx, o.customerName, COL_W, 2);
  nameLines.forEach((l, i) => text(l, M, y + 36 + i * 46, `700 36px ${SANS}`));
  y += 36 + (nameLines.length - 1) * 46;
  row('หน่วยงาน', o.organization || 'ประชาชนทั่วไป');
  row('โทรศัพท์', o.customerPhone);
  row('อีเมล', o.customerEmail || '-');

  // Delivery
  const pickup = o.deliveryMethod === 'pickup_bpp';
  y += 18;
  rule(y);
  section(pickup ? 'การรับวัตถุมงคล' : 'ที่อยู่สำหรับจัดส่ง');
  if (pickup) {
    row('วิธีรับ', 'มารับเองที่ บช.ตชด. (ไม่มีค่าจัดส่ง)', { weight: 700 });
    if (o.shippingAddress && !/^มารับเอง/.test(o.shippingAddress)) block('หมายเหตุ', o.shippingAddress, 26, 3);
  } else {
    row('จัดส่งทาง', 'ไปรษณีย์ (EMS)', { weight: 700 });
    block('ที่อยู่', o.shippingAddress, 31, 5);
    row('รหัสไปรษณีย์', o.postalCode, { size: 32, weight: 800 });
    if (o.trackingNumber) row('เลขพัสดุ', `${o.carrierName ? o.carrierName + ' · ' : ''}${o.trackingNumber}`);
  }

  // Items
  y += 18;
  rule(y);
  section('รายการที่สั่งจอง');
  const items = o.items.slice(0, 6);
  for (const it of items) {
    const name = it.productName.startsWith(it.productCode) ? it.productName : `${it.productCode} ${it.productName}`;
    ctx.font = `500 26px ${SANS}`;
    const line = wrap(ctx, `${name} × ${it.quantity}`, COL_W - 170, 1)[0];
    y += 40;
    text(line, M, y, `500 26px ${SANS}`);
    text(baht(it.lineTotal), M + COL_W, y, `600 26px ${SANS}`, INK, 'right');
  }
  if (o.items.length > items.length) {
    y += 38;
    text(`และอีก ${o.items.length - items.length} รายการ (ดูในระบบหลังบ้าน)`, M, y, `500 24px ${SANS}`, MUTED);
  }
  if (o.selectedNumbers?.length) {
    y += 44;
    ctx.font = `700 28px ${SANS}`;
    const nums = wrap(ctx, `หมายเลข ช1: ${o.selectedNumbers.map((n) => `#${String(n).padStart(2, '0')}`).join(', ')}`, COL_W, 2);
    nums.forEach((l, i) => text(l, M, y + i * 36, `700 28px ${SANS}`, '#8A6D2F'));
    y += (nums.length - 1) * 36;
  }
  if (o.shippingTotal > 0) {
    y += 40;
    text('ค่าจัดส่งทางไปรษณีย์', M, y, `500 26px ${SANS}`);
    text(baht(o.shippingTotal), M + COL_W, y, `600 26px ${SANS}`, INK, 'right');
  }
  y += 54;
  text('ยอดรวมทั้งสิ้น', M, y, `700 32px ${SANS}`);
  text(baht(o.grandTotal), M + COL_W, y, `800 38px ${SANS}`, INK, 'right');

  // Payment
  y += 18;
  rule(y);
  section('การชำระเงิน');
  const method = o.paymentMethod === 'promptpay' ? 'พร้อมเพย์' : o.paymentMethod === 'cash' ? 'เงินสด / ชำระกับเจ้าหน้าที่' : 'โอนบัญชีธนาคาร';
  row('ช่องทาง', `${method}${o.transferReference ? ` (${o.transferReference})` : ''}`, { size: 26 });
  row('ยอดในสลิป', o.slipTransferAmount ? baht(o.slipTransferAmount) : 'ไม่ได้ระบุ', { size: 26 });
  if (o.slipTransferTime) row('เวลาโอน', o.slipTransferTime, { size: 26 });
  row('ส่งสลิปเมื่อ', o.slipUploadedAt ? thaiDateTime(o.slipUploadedAt) : 'ยังไม่มีสลิป', { size: 26 });
  row('สถานะ', `${pay} · ${PREP_LABEL[o.preparationStatus] || ''} · ${SHIP_LABEL[o.shippingStatus] || ''}`, { size: 26, lines: 3 });
  if (o.adminNote) row('หมายเหตุภายใน', o.adminNote, { size: 24, lines: 2 });

  // Slip: the whole right column
  const slipTitleY = 270;
  text('หลักฐานการโอนเงิน (สลิป)', slipX, slipTitleY, `700 30px ${SANS}`, '#8A6D2F');
  const slipTop = slipTitleY + 22;
  const slipBottom = PX_H - 110;
  const slip = { x: slipX, y: slipTop, w: right - slipX, h: slipBottom - slipTop };
  ctx.strokeStyle = '#D8CDAE';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(slip.x, slip.y, slip.w, slip.h);
  ctx.setLineDash([]);
  if (!hasSlip) {
    text(o.slipUploadedAt ? 'โหลดสลิปไม่สำเร็จ' : 'ไม่มีสลิปแนบ', slip.x + slip.w / 2, slip.y + 90, `600 30px ${SANS}`, MUTED, 'center');
  }

  // Footer
  text(
    `พิมพ์จากระบบหลังบ้านเมื่อ ${printedAt} · เอกสารนี้มีข้อมูลส่วนบุคคล โปรดเก็บรักษาและทำลายเมื่อไม่ใช้งาน`,
    PX_W / 2,
    PX_H - 44,
    `400 22px ${SANS}`,
    MUTED,
    'center',
  );
  return { canvas, slip };
}

const toBlob = (canvas: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('draw failed'))), type, q));

/** Slips arrive as data URLs (JPEG, PNG or WebP); pdf-lib takes JPEG and PNG, so convert WebP. */
async function slipBytes(dataUrl: string): Promise<{ bytes: Uint8Array; kind: 'jpg' | 'png' } | null> {
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  let kind: 'jpg' | 'png' = m[1] === 'png' ? 'png' : 'jpg';
  let base64 = m[2];
  if (m[1] === 'webp') {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext('2d')!;
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, c.width, c.height);
    cx.drawImage(img, 0, 0);
    base64 = c.toDataURL('image/jpeg', 0.85).split(',')[1];
    kind = 'jpg';
  }
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, kind };
}

export interface BuildOptions {
  /** Position of this file's first order among the whole day's orders, for "ใบที่ x / y" */
  offset: number;
  total: number;
  fetchSlips: (ids: string[]) => Promise<Record<string, string | null>>;
  onProgress?: (done: number, of: number) => void;
  shouldCancel?: () => boolean;
}

export async function buildOrdersPdf(orders: OrderRecord[], opts: BuildOptions): Promise<Blob | null> {
  const { PDFDocument } = await import('pdf-lib');
  await loadFonts();
  const doc = await PDFDocument.create();
  doc.setTitle('orders');
  const printedAt = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' });
  const SLIP_BATCH = 6;
  let done = 0;

  for (let start = 0; start < orders.length; start += SLIP_BATCH) {
    if (opts.shouldCancel?.()) return null;
    const group = orders.slice(start, start + SLIP_BATCH);
    const withSlip = group.filter((o) => o.slipUploadedAt).map((o) => o.id);
    const slips = withSlip.length ? await opts.fetchSlips(withSlip) : {};

    for (const [i, o] of group.entries()) {
      // Embed the slip first so the page can say so when it is missing or unreadable.
      let slipImage: Awaited<ReturnType<typeof doc.embedJpg>> | null = null;
      const raw = slips[o.id];
      const parsed = raw ? await slipBytes(raw).catch(() => null) : null;
      if (parsed) {
        try {
          slipImage = parsed.kind === 'png' ? await doc.embedPng(parsed.bytes) : await doc.embedJpg(parsed.bytes);
        } catch {
          slipImage = null;
        }
      }

      const { canvas, slip } = drawPage(o, opts.offset + start + i, opts.total, printedAt, Boolean(slipImage));
      const page = doc.addPage([PT_W, PT_H]);
      const pageJpg = await doc.embedJpg(await (await toBlob(canvas, 'image/jpeg', 0.8)).arrayBuffer());
      page.drawImage(pageJpg, { x: 0, y: 0, width: PT_W, height: PT_H });

      if (slipImage) {
        const k = PT_W / PX_W;
        const box = { x: slip.x * k, y: PT_H - (slip.y + slip.h) * k, w: slip.w * k, h: slip.h * k };
        const scale = Math.min((box.w - 8) / slipImage.width, (box.h - 8) / slipImage.height);
        const w = slipImage.width * scale;
        const h = slipImage.height * scale;
        // Top-aligned so the slip sits right beside the buyer details.
        page.drawImage(slipImage, { x: box.x + (box.w - w) / 2, y: box.y + box.h - h - 4, width: w, height: h });
      }
      done += 1;
      opts.onProgress?.(done, orders.length);
    }
  }
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
