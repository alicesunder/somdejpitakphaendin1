import nodemailer from 'nodemailer';
import type { OrderRecord, SiteConfig } from '../src/types';

/**
 * Sends the reservation certificate (ใบจอง) to the buyer once staff have approved the slip.
 *
 * Configured with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and optionally MAIL_FROM
 * (e.g. a Gmail account with an app password: smtp.gmail.com, port 465).
 * Without them nothing is sent and the caller is told why.
 */
export type ReceiptEmailResult =
  | { sent: true; to: string }
  | { sent: false; reason: 'no_email' | 'not_configured' | 'failed'; error?: string };

const SITE_URL = 'https://www.somdejpitakphaendin.com';

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

type Transport = ReturnType<typeof nodemailer.createTransport>;
let transport: Transport | null = null;
function getTransport(): Transport {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // A serverless function has 30 s in total; give up well before that.
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  });
  return transport;
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const baht = (n: number) => `${Number(n || 0).toLocaleString('th-TH')} บาท`;
// Product names usually already start with their code (e.g. "ช2 ชุดยกกล่อง").
const itemLabel = (it: { productCode: string; productName: string }) =>
  it.productName.startsWith(it.productCode) ? it.productName : `${it.productCode} ${it.productName}`;
const thaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric' });

export function buildReceiptEmail(order: OrderRecord, config: SiteConfig) {
  const pickup = order.deliveryMethod === 'pickup_bpp';
  const pay = config.paymentChannels;
  const date = order.reservationDateThai || thaiDate(order.createdAt);
  const numbers = order.selectedNumbers?.length
    ? order.selectedNumbers.map((n) => `#${String(n).padStart(2, '0')}`).join(', ')
    : '';
  const trackUrl = `${SITE_URL}/?track=${encodeURIComponent(order.orderNumber)}`;

  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #E5D9B8">${esc(itemLabel(it))}</td>
        <td style="padding:8px;border-bottom:1px solid #E5D9B8;text-align:center">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #E5D9B8;text-align:right">${baht(it.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const subject = `ใบจองวัตถุมงคล สมเด็จพิทักษ์แผ่นดิน เลขที่ ${order.orderNumber}`;

  const html = `<!doctype html><html lang="th"><body style="margin:0;background:#F3EEE2;font-family:Tahoma,'Noto Sans Thai',sans-serif;color:#18140E">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
  <div style="background:#FAF6EC;border:2px solid #8A6D2F;border-radius:16px;padding:24px">
    <p style="margin:0;font-size:12px;color:#8A6D2F;font-weight:bold">กองบัญชาการตำรวจตระเวนชายแดน · วาระครบรอบ ๗๕ ปี</p>
    <h1 style="margin:6px 0 4px;font-size:22px">ใบจองวัตถุมงคล “สมเด็จพิทักษ์แผ่นดิน” ๗๕ ปี ตชด.</h1>
    <p style="margin:0 0 16px;font-size:13px;color:#5A5244">เลขที่ใบจอง <b style="color:#18140E">${esc(order.orderNumber)}</b> · วันที่จอง ${esc(date)}</p>

    <div style="background:#E8F5E9;border:1px solid #81C784;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:16px">
      ✅ เจ้าหน้าที่ตรวจสอบการชำระเงินเรียบร้อยแล้ว ใบจองนี้ใช้เป็นหลักฐานการสั่งจองได้
    </div>

    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:12px">
      <tr><td style="padding:3px 0;color:#5A5244;width:130px">ชื่อผู้จอง</td><td><b>${esc(order.customerName)}</b></td></tr>
      <tr><td style="padding:3px 0;color:#5A5244">หน่วยงาน</td><td>${esc(order.organization || 'ประชาชนทั่วไป')}</td></tr>
      <tr><td style="padding:3px 0;color:#5A5244">โทรศัพท์</td><td>${esc(order.customerPhone)}</td></tr>
      <tr><td style="padding:3px 0;color:#5A5244">การรับวัตถุมงคล</td><td>${esc(pickup ? 'มารับเองที่ บช.ตชด.' : 'จัดส่งทางไปรษณีย์')}</td></tr>
      <tr><td style="padding:3px 0;color:#5A5244;vertical-align:top">${pickup ? 'สถานที่รับ' : 'ที่อยู่จัดส่ง'}</td><td>${esc(order.shippingAddress)}</td></tr>
      ${numbers ? `<tr><td style="padding:3px 0;color:#5A5244">หมายเลขที่จอง</td><td><b>${esc(numbers)}</b></td></tr>` : ''}
    </table>

    <table style="width:100%;font-size:13px;border-collapse:collapse">
      <thead><tr style="background:#18140E;color:#FCE694">
        <th style="padding:8px;text-align:left">รายการ</th><th style="padding:8px">จำนวน</th><th style="padding:8px;text-align:right">รวม</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:100%;font-size:13px;margin-top:8px">
      ${order.shippingTotal ? `<tr><td style="text-align:right;color:#5A5244">ค่าจัดส่ง</td><td style="text-align:right;width:140px">${baht(order.shippingTotal)}</td></tr>` : ''}
      <tr><td style="text-align:right;font-weight:bold">ยอดรวมทั้งสิ้น</td><td style="text-align:right;font-size:18px;font-weight:bold">${baht(order.grandTotal)}</td></tr>
      ${order.grandTotalThaiText ? `<tr><td colspan="2" style="text-align:right;color:#5A5244">(${esc(order.grandTotalThaiText)})</td></tr>` : ''}
    </table>

    <hr style="border:none;border-top:1px solid #C9A45C;margin:18px 0">
    <p style="font-size:12px;color:#5A5244;margin:0 0 4px">ชำระเงินเข้าบัญชี: ${esc(pay.bankName)} เลขที่ ${esc(pay.accountNumber)} ชื่อบัญชี ${esc(pay.accountName)}</p>
    <p style="font-size:12px;color:#5A5244;margin:0 0 4px">ติดตามสถานะการเตรียมและจัดส่ง: <a href="${trackUrl}" style="color:#8A6D2F">${esc(SITE_URL.replace('https://', ''))}</a> (ใช้เลขที่ใบจองและเบอร์โทร 4 ตัวท้าย)</p>
    <p style="font-size:12px;color:#5A5244;margin:0">${esc(config.contactUnitName || 'กองบัญชาการตำรวจตระเวนชายแดน')} · โทร. ${esc(config.contactPhone)}</p>
  </div>
  <p style="font-size:11px;color:#8A7F6A;text-align:center;margin-top:12px">อีเมลนี้ส่งอัตโนมัติจากระบบสั่งจองวัตถุมงคล กรุณาเก็บไว้เป็นหลักฐาน</p>
</div></body></html>`;

  const text = [
    subject,
    `วันที่จอง ${date}`,
    'เจ้าหน้าที่ตรวจสอบการชำระเงินเรียบร้อยแล้ว',
    '',
    `ชื่อผู้จอง: ${order.customerName}`,
    `หน่วยงาน: ${order.organization || 'ประชาชนทั่วไป'}`,
    `โทรศัพท์: ${order.customerPhone}`,
    `การรับวัตถุมงคล: ${pickup ? 'มารับเองที่ บช.ตชด.' : 'จัดส่งทางไปรษณีย์'} — ${order.shippingAddress}`,
    numbers ? `หมายเลขที่จอง: ${numbers}` : '',
    '',
    ...order.items.map((it) => `- ${itemLabel(it)} x${it.quantity} = ${baht(it.lineTotal)}`),
    order.shippingTotal ? `ค่าจัดส่ง ${baht(order.shippingTotal)}` : '',
    `ยอดรวมทั้งสิ้น ${baht(order.grandTotal)}`,
    '',
    `ติดตามสถานะ: ${trackUrl}`,
    `${config.contactUnitName || 'กองบัญชาการตำรวจตระเวนชายแดน'} โทร. ${config.contactPhone}`,
  ]
    .filter((l) => l !== '')
    .join('\n');

  return { subject, html, text };
}

export async function sendReceiptEmail(order: OrderRecord, config: SiteConfig): Promise<ReceiptEmailResult> {
  const to = String(order.customerEmail || '').trim();
  if (!to || !isValidEmail(to)) return { sent: false, reason: 'no_email' };
  if (!isMailConfigured()) return { sent: false, reason: 'not_configured' };
  const { subject, html, text } = buildReceiptEmail(order, config);
  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM || `"ระบบสั่งจองวัตถุมงคล ๗๕ ปี ตชด." <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { sent: true, to };
  } catch (err) {
    console.error('[mail] receipt failed:', (err as Error).message);
    return { sent: false, reason: 'failed', error: (err as Error).message };
  }
}
