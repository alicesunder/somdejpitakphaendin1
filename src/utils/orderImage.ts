import type { PublicTrackedOrder } from '../types';

/**
 * Draws a picture of the buyer's booking (order number, items, total, how to follow it up)
 * so they can keep it in their photos. Not the signed certificate — that comes later by email.
 */
const W = 1080;
const H = 1440;
const GOLD = '#FCE694';
const GOLD_DIM = '#C9A45C';
const INK = '#F7F2E8';
const SANS = "'IBM Plex Sans Thai', 'Noto Sans Thai', Tahoma, sans-serif";
const SERIF = "'Border Patrol Police Bold', 'Noto Serif Thai', 'IBM Plex Sans Thai', serif";

const baht = (n: number) => `฿${Number(n || 0).toLocaleString('th-TH')}`;

/** Thai has no spaces between words, so wrap by measuring character by character. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 3): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of Array.from(text)) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = ch.trimStart();
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && text.length > lines.join('').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, '…');
  }
  return lines;
}

export async function drawOrderImage(
  order: PublicTrackedOrder,
  opts: { siteUrl: string; customerEmail?: string },
): Promise<Blob> {
  // Thai web fonts must be ready before drawing, or the canvas falls back to a system font.
  try {
    await Promise.all([
      document.fonts.load(`700 40px ${SERIF}`),
      document.fonts.load(`400 30px ${SANS}`),
      document.fonts.load(`700 30px ${SANS}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* draw with whatever is available */
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background: black lacquer with a gold glow at the top
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1E170D');
  bg.addColorStop(1, '#080705');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.8);
  glow.addColorStop(0, 'rgba(252, 220, 140, 0.28)');
  glow.addColorStop(1, 'rgba(252, 220, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Gold frame
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = 'rgba(252, 230, 148, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = GOLD_DIM;
  ctx.font = `600 28px ${SANS}`;
  ctx.fillText('กองบัญชาการตำรวจตระเวนชายแดน · ๗๕ ปี ตชด.', W / 2, 130);

  ctx.fillStyle = GOLD;
  ctx.font = `700 56px ${SERIF}`;
  ctx.fillText('สมเด็จพิทักษ์แผ่นดิน', W / 2, 205);

  ctx.fillStyle = INK;
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText('บันทึกคำสั่งจองวัตถุมงคล', W / 2, 262);

  // Order number panel
  const panelY = 305;
  ctx.fillStyle = 'rgba(252, 230, 148, 0.08)';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(110, panelY, W - 220, 220, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD_DIM;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText('เลขที่คำสั่งจอง', W / 2, panelY + 66);
  ctx.fillStyle = GOLD;
  ctx.font = `800 96px ${SANS}`;
  ctx.fillText(order.orderNumber, W / 2, panelY + 170);

  // Details
  ctx.textAlign = 'left';
  const left = 120;
  const right = W - 120;
  let y = panelY + 300;
  const row = (label: string, value: string) => {
    ctx.fillStyle = GOLD_DIM;
    ctx.font = `500 28px ${SANS}`;
    ctx.fillText(label, left, y);
    ctx.fillStyle = INK;
    ctx.font = `600 30px ${SANS}`;
    const lines = wrap(ctx, value, right - left - 230, 2);
    lines.forEach((l, i) => ctx.fillText(l, left + 230, y + i * 40));
    y += 40 * Math.max(1, lines.length) + 18;
  };
  row('วันที่จอง', order.reservationDateThai || new Date(order.createdAt).toLocaleDateString('th-TH', { dateStyle: 'long' }));
  if (order.customerName) row('ผู้จอง', order.customerName);
  row('การรับ', order.deliveryMethod === 'pickup_bpp' ? 'มารับเองที่ บช.ตชด.' : 'จัดส่งทางไปรษณีย์');
  if (order.selectedNumbers?.length) {
    row('หมายเลข ช1', order.selectedNumbers.map((n) => `#${String(n).padStart(2, '0')}`).join(', '));
  }

  // Items
  y += 6;
  ctx.strokeStyle = 'rgba(201, 164, 92, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left, y - 30);
  ctx.lineTo(right, y - 30);
  ctx.stroke();
  const items = order.items.slice(0, 5);
  for (const it of items) {
    const name = it.productName.startsWith(it.productCode) ? it.productName : `${it.productCode} ${it.productName}`;
    ctx.fillStyle = INK;
    ctx.font = `500 28px ${SANS}`;
    ctx.textAlign = 'left';
    ctx.fillText(wrap(ctx, `${name} × ${it.quantity}`, right - left - 220, 1)[0], left, y);
    ctx.textAlign = 'right';
    ctx.fillText(baht(it.lineTotal), right, y);
    y += 44;
  }
  if (order.items.length > items.length) {
    ctx.textAlign = 'left';
    ctx.fillStyle = GOLD_DIM;
    ctx.fillText(`และอีก ${order.items.length - items.length} รายการ`, left, y);
    y += 44;
  }
  if (order.shippingTotal > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.fillText('ค่าจัดส่งทางไปรษณีย์', left, y);
    ctx.textAlign = 'right';
    ctx.fillText(baht(order.shippingTotal), right, y);
    y += 44;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = `700 36px ${SANS}`;
  ctx.fillText('ยอดรวมทั้งสิ้น', left, y + 14);
  ctx.textAlign = 'right';
  ctx.font = `800 48px ${SANS}`;
  ctx.fillText(baht(order.grandTotal), right, y + 18);

  // Footer: status and how to follow up
  ctx.textAlign = 'center';
  let fy = H - 250;
  ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
  ctx.beginPath();
  ctx.roundRect(110, fy - 50, W - 220, 70, 20);
  ctx.fill();
  ctx.fillStyle = '#A7F3D0';
  ctx.font = `600 28px ${SANS}`;
  ctx.fillText('ได้รับสลิปแล้ว · รอเจ้าหน้าที่ตรวจสอบ', W / 2, fy - 6);
  fy += 62;
  ctx.fillStyle = INK;
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText(
    opts.customerEmail
      ? `ใบจองที่ลงนามแล้วจะส่งไปที่ ${opts.customerEmail}`
      : 'ใบจองที่ลงนามแล้วจะส่งให้ทางอีเมลหลังตรวจสอบสลิป',
    W / 2,
    fy,
  );
  fy += 44;
  ctx.fillStyle = GOLD_DIM;
  ctx.fillText(`ติดตามสถานะ: ${opts.siteUrl.replace(/^https?:\/\//, '')} (เลขที่คำสั่งจอง + เบอร์โทร 4 ตัวท้าย)`, W / 2, fy);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('สร้างรูปไม่สำเร็จ'))), 'image/png'),
  );
}

/** Saves the picture: the share sheet on phones (has "Save Image"), otherwise a normal download. */
export async function saveOrderImage(blob: Blob, orderNumber: string, preferShare: boolean): Promise<'shared' | 'downloaded'> {
  const filename = `คำสั่งจอง-${orderNumber}.png`;
  const file = new File([blob], filename, { type: 'image/png' });
  if (preferShare && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `คำสั่งจอง ${orderNumber}` });
      return 'shared';
    } catch {
      /* cancelled or not allowed: fall back to a download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
