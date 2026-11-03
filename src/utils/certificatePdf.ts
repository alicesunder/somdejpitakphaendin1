import type { OrderRecord, SiteConfig } from '../types';
import { formatThaiDate, numberToThaiBahtText, resolveOrderDeliveryMethod } from './commerceRules';
import { SANS, loadFonts, wrap } from './orderPdf';

/**
 * The official reservation certificate (ใบจองวัตถุมงคล) as a one-page A4 PDF with the officer's
 * signature and a faint BPP logo watermark, ready to be emailed to the buyer. Drawn on a canvas so
 * the browser shapes the Thai text, then wrapped into a PDF with pdf-lib (same approach as the
 * per-day order export).
 */
const PX_W = 1240; // A4 at 150 dpi
const PX_H = 1754;
const PT_W = 595.28;
const PT_H = 841.89;
const M = 80;
const INK = '#18140E';
const MUTED = '#5A5244';
const GOLD = '#8A6D2F';
const LINE = '#C9A45C';
const MAX_ROWS = 6;

export const WATERMARK_URL = '/assets/watermark-bpp.png';

const baht = (n: number) => `฿${Number(n || 0).toLocaleString('th-TH')}`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปไม่สำเร็จ'));
    img.src = src;
  });
}

export interface CertificateAssets {
  /** PNG data URL of the signature (transparent background) */
  signature: HTMLImageElement;
  watermark: HTMLImageElement | null;
}

export async function loadCertificateAssets(signatureDataUrl: string): Promise<CertificateAssets> {
  await loadFonts();
  const [signature, watermark] = await Promise.all([
    loadImage(signatureDataUrl),
    loadImage(WATERMARK_URL).catch(() => null), // a missing watermark must not block sending
  ]);
  return { signature, watermark };
}

export function drawCertificate(order: OrderRecord, config: SiteConfig, assets: CertificateAssets, issuedAt = new Date()): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PX_W;
  canvas.height = PX_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, PX_W, PX_H);
  ctx.textBaseline = 'alphabetic';
  const right = PX_W - M;
  const W = right - M;

  // Watermark first so everything else prints over it: large, centred, very faint.
  if (assets.watermark) {
    const w = 1020;
    const h = (assets.watermark.naturalHeight / assets.watermark.naturalWidth) * w;
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.drawImage(assets.watermark, (PX_W - w) / 2, (PX_H - h) / 2 - 20, w, h);
    ctx.restore();
  }

  // Double gold frame
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 34, PX_W - 68, PX_H - 68);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, PX_W - 92, PX_H - 92);

  const text = (s: string, x: number, y: number, font: string, color = INK, align: CanvasTextAlign = 'left') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const rule = (y: number, color = LINE, w = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  };
  const box = (x: number, y: number, w: number, h: number, fill: string, stroke = LINE) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();
  };
  const lines = (s: string, max: number, font: string, maxLines: number) => {
    ctx.font = font;
    return wrap(ctx, s || '-', max, maxLines);
  };

  const dateThai = order.reservationDateThai || formatThaiDate(order.createdAt);
  const pickup = resolveOrderDeliveryMethod(order) === 'pickup_bpp';

  // Header
  const chipW = 330;
  text('กองบัญชาการตำรวจตระเวนชายแดน · วาระครบรอบ ๗๕ ปี', M, 120, `700 24px ${SANS}`, GOLD);
  const titleLines = lines('ใบจองวัตถุมงคล “สมเด็จพิทักษ์แผ่นดิน” ๗๕ ปี ตชด.', W - chipW - 30, `800 40px ${SANS}`, 2);
  titleLines.forEach((l, i) => text(l, M, 172 + i * 54, `800 40px ${SANS}`));
  const subY = 172 + (titleLines.length - 1) * 54 + 40;
  text('เอกสารหลักฐานการสั่งจองอย่างเป็นทางการ (Official Reservation Certificate)', M, subY, `500 22px ${SANS}`, MUTED);

  const chipX = right - chipW;
  box(chipX, 90, chipW, 130, '#18140E', LINE);
  text('เลขที่ใบจอง (Reservation No.)', chipX + chipW / 2, 128, `500 20px ${SANS}`, '#E5C158', 'center');
  text(order.orderNumber, chipX + chipW / 2, 176, `800 36px ${SANS}`, '#FCE694', 'center');
  text(`วันที่จอง: ${dateThai}`, chipX + chipW / 2, 206, `500 20px ${SANS}`, '#F7F2E8', 'center');

  let y = Math.max(subY, 230) + 30;
  rule(y, GOLD, 3);
  y += 28;

  // Buyer details (2 x 2)
  const gridH = 190;
  box(M, y, W, gridH, 'rgba(241,233,214,0.45)');
  const colW = W / 2;
  const cell = (label: string, value: string, cx: number, cy: number) => {
    text(label, cx, cy, `600 21px ${SANS}`, '#787062');
    const l = lines(value, colW - 50, `700 28px ${SANS}`, 2);
    l.forEach((s, i) => text(s, cx, cy + 38 + i * 36, `700 28px ${SANS}`));
  };
  cell('ชื่อผู้จอง', order.customerName, M + 28, y + 40);
  cell('หน่วยงาน / สังกัด', order.organization || 'ประชาชนทั่วไป', M + colW, y + 40);
  cell('เบอร์โทรศัพท์', order.customerPhone, M + 28, y + 118);
  cell('วันที่ทำรายการจอง', dateThai, M + colW, y + 118);
  y += gridH + 22;

  // Delivery / pickup and payment channel
  const addr =
    order.shippingAddress ||
    (pickup ? 'กองบัญชาการตำรวจตระเวนชายแดน (บช.ตชด.) ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400' : '-');
  const addrFull =
    !pickup && order.postalCode && !String(order.shippingAddress || '').includes(order.postalCode)
      ? `${addr} (รหัสไปรษณีย์ ${order.postalCode})`
      : addr;
  const addrLines = lines(addrFull, W - 60, `600 26px ${SANS}`, 3);
  const payText =
    order.paymentMethod === 'promptpay'
      ? 'สแกน QR พร้อมเพย์ (PromptPay)'
      : `โอนผ่านบัญชีธนาคาร (${order.transferReference || config.paymentChannels.bankName})`;
  const delH = 112 + addrLines.length * 36;
  box(M, y, W, delH, 'rgba(255,255,255,0.3)');
  text('วิธีการรับวัตถุมงคล:', M + 28, y + 42, `600 21px ${SANS}`, '#787062');
  text(pickup ? 'มารับเองที่ บช.ตชด.' : 'จัดส่งทางไปรษณีย์ (EMS)', M + 250, y + 42, `800 24px ${SANS}`, GOLD);
  text('ช่องทางชำระเงินที่เลือก:', right - 28, y + 42, `500 20px ${SANS}`, '#787062', 'right');
  text(payText, right - 28, y + 76, `700 22px ${SANS}`, GOLD, 'right');
  addrLines.forEach((s, i) => text(s, M + 28, y + 108 + i * 36, `600 26px ${SANS}`));
  y += delH + 22;

  // ช1 numbers
  if (order.selectedNumbers?.length) {
    const nums = order.selectedNumbers.map((n) => `หมายเลข #${String(n).padStart(2, '0')}`).join(' , ');
    const numLines = lines(nums, W - 60, `800 30px ${SANS}`, 2);
    const nh = 76 + numLines.length * 38;
    box(M, y, W, nh, '#18140E', LINE);
    text('หมายเลขประจำชุด ช1 ชุดทองคำใหญ่ราชาฤกษ์ (1–99) ที่ได้รับสิทธิ์:', M + 28, y + 40, `700 22px ${SANS}`, '#E5C158');
    numLines.forEach((s, i) => text(s, M + 28, y + 80 + i * 38, `800 30px ${SANS}`, '#FCE694'));
    y += nh + 22;
  }

  // Items table
  const rows = order.items.slice(0, MAX_ROWS);
  const xNo = M + 18;
  const xCode = M + 78;
  const xName = M + 218;
  const nameW = 390;
  const xUnit = M + 740;
  const xQty = M + 830;
  const xAmt = right - 18;
  const headH = 58;
  ctx.fillStyle = '#18140E';
  ctx.beginPath();
  ctx.roundRect(M, y, W, headH, [14, 14, 0, 0]);
  ctx.fill();
  const hy = y + 38;
  text('ลำดับ', xNo, hy, `700 22px ${SANS}`, '#FCE694');
  text('รหัส', xCode, hy, `700 22px ${SANS}`, '#FCE694');
  text('รายการวัตถุมงคล', xName, hy, `700 22px ${SANS}`, '#FCE694');
  text('ราคา/หน่วย', xUnit, hy, `700 22px ${SANS}`, '#FCE694', 'right');
  text('จำนวน', xQty, hy, `700 22px ${SANS}`, '#FCE694', 'center');
  text('จำนวนเงิน', xAmt, hy, `700 22px ${SANS}`, '#FCE694', 'right');
  y += headH;

  rows.forEach((it, idx) => {
    const nameLines = lines(it.productName, nameW, `700 24px ${SANS}`, 2);
    const numLine = it.selectedNumbers?.length ? `หมายเลขที่เลือก: ${it.selectedNumbers.map((n) => `#${String(n).padStart(2, '0')}`).join(', ')}` : '';
    const extra = numLine ? lines(numLine, nameW, `700 20px ${SANS}`, 2) : [];
    const rh = 28 + nameLines.length * 32 + extra.length * 28 + 16;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(M, y, W, rh);
    ctx.strokeStyle = 'rgba(201,164,92,0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(M, y, W, rh);
    const ty = y + 40;
    text(String(idx + 1), xNo, ty, `500 24px ${SANS}`, MUTED);
    text(it.productCode, xCode, ty, `800 24px ${SANS}`);
    nameLines.forEach((s, i) => text(s, xName, ty + i * 32, `700 24px ${SANS}`));
    extra.forEach((s, i) => text(s, xName, ty + nameLines.length * 32 + i * 28 - 2, `700 20px ${SANS}`, GOLD));
    text(baht(it.unitPrice), xUnit, ty, `500 24px ${SANS}`, INK, 'right');
    text(String(it.quantity), xQty, ty, `700 24px ${SANS}`, INK, 'center');
    text(baht(it.lineTotal), xAmt, ty, `800 24px ${SANS}`, INK, 'right');
    y += rh;
  });
  if (order.items.length > rows.length) {
    text(`และอีก ${order.items.length - rows.length} รายการ`, xName, y + 34, `500 21px ${SANS}`, MUTED);
    y += 46;
  }
  if (order.shippingTotal > 0) {
    text(`ค่าจัดส่งทางไปรษณีย์ ${baht(order.shippingTotal)}`, xAmt, y + 38, `600 22px ${SANS}`, MUTED, 'right');
    y += 52;
  }
  y += 22;

  // Grand total
  const totalH = 124;
  box(M, y, W, totalH, 'rgba(241,233,214,0.5)', GOLD);
  const thaiText = order.grandTotalThaiText || numberToThaiBahtText(order.grandTotal);
  text('ยอดรวมทั้งสิ้น (ตัวอักษรไทย):', M + 28, y + 40, `600 21px ${SANS}`, MUTED);
  const tl = lines(`(${thaiText})`, 640, `800 28px ${SANS}`, 2);
  tl.forEach((s, i) => text(s, M + 28, y + 82 + i * 36, `800 28px ${SANS}`));
  text('ยอดรวมทั้งสิ้น (ตัวเลข):', right - 28, y + 40, `600 21px ${SANS}`, MUTED, 'right');
  text(`${baht(order.grandTotal)} บาท`, right - 28, y + 92, `800 46px ${SANS}`, INK, 'right');
  y += totalH;

  // Payment info (left) and signature (right), anchored to the bottom of the page
  const footTop = Math.max(y + 36, 1360);
  const pay = config.paymentChannels;
  text('ช่องทางชำระเงินบำรุงกองทุน:', M + 6, footTop + 24, `700 22px ${SANS}`);
  text(`${pay.bankName} · เลขบัญชี ${pay.accountNumber}`, M + 6, footTop + 62, `500 21px ${SANS}`, MUTED);
  text(`ชื่อบัญชี: ${pay.accountName}`, M + 6, footTop + 94, `500 21px ${SANS}`, MUTED);
  text('สถานะ: ชำระเงินแล้ว (ตรวจสอบโดยเจ้าหน้าที่)', M + 6, footTop + 126, `500 21px ${SANS}`, MUTED);

  const sigW = 440;
  const sigH = (assets.signature.naturalHeight / assets.signature.naturalWidth) * sigW;
  const sigX = right - sigW - 10;
  ctx.drawImage(assets.signature, sigX, footTop - 10, sigW, sigH);
  text(`วันที่ออกเอกสาร ${formatThaiDate(issuedAt)}`, sigX + sigW / 2, footTop - 10 + sigH + 34, `600 21px ${SANS}`, MUTED, 'center');

  // Unit contact and how to check the reservation
  const by = PX_H - 130;
  rule(by - 30, LINE, 1.5);
  text(config.contactUnitName || 'กองบัญชาการตำรวจตระเวนชายแดน', PX_W / 2, by, `700 22px ${SANS}`, INK, 'center');
  const contact = lines(`${config.contactAddress} · โทร. ${config.contactPhone}`, W, `500 20px ${SANS}`, 2);
  contact.forEach((s, i) => text(s, PX_W / 2, by + 30 + i * 26, `500 20px ${SANS}`, MUTED, 'center'));
  text(`ตรวจสอบสถานะได้ที่ www.somdejpitakphaendin.com ด้วยเลขที่ใบจองและเบอร์โทร 4 ตัวท้าย`, PX_W / 2, PX_H - 62, `400 19px ${SANS}`, '#8A7F6A', 'center');
  return canvas;
}

/** One A4 page: the certificate canvas as a high-quality JPEG inside a PDF. */
export async function buildCertificatePdf(order: OrderRecord, config: SiteConfig, assets: CertificateAssets): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');
  const canvas = drawCertificate(order, config, assets);
  const jpg = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('draw failed'))), 'image/jpeg', 0.9));
  const doc = await PDFDocument.create();
  doc.setTitle(`ใบจอง ${order.orderNumber}`);
  const page = doc.addPage([PT_W, PT_H]);
  page.drawImage(await doc.embedJpg(await jpg.arrayBuffer()), { x: 0, y: 0, width: PT_W, height: PT_H });
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/** Loads the signature once and returns a function that makes each order's certificate as a data URL. */
export async function createCertificateMaker(adminToken: string, config: SiteConfig) {
  const res = await fetch('/api/admin/signature', { headers: { Authorization: `Bearer ${adminToken}` } });
  const sig = await res.json().catch(() => null);
  if (!res.ok || !sig?.dataUrl) throw new Error('โหลดลายเซ็นไม่สำเร็จ');
  const assets = await loadCertificateAssets(sig.dataUrl);
  return async (order: OrderRecord) => {
    const blob = await buildCertificatePdf(order, config, assets);
    return { name: certificateFileName(order), dataUrl: await blobToDataUrl(blob) };
  };
}

export const certificateFileName =(order: OrderRecord) => `ใบจอง-${order.orderNumber}.pdf`;

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    r.readAsDataURL(blob);
  });
}
