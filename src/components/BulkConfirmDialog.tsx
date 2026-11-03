import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Mail, X } from 'lucide-react';
import type { OrderRecord, SiteConfig } from '../types';
import { fetchWithConflictRetry } from '../utils/conflictRetry';

interface Props {
  orders: OrderRecord[];
  adminToken: string;
  siteConfig: SiteConfig;
  mailConfigured: boolean;
  /** changed = something was saved, so the list should be reloaded */
  onClose: (changed: boolean) => void;
}

const validEmail = (v?: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Confirm payment for the given orders in one go and, if asked, email each buyer the signed
 * reservation certificate. The server re-checks every order before changing it (still pending, slip
 * attached, stated amount equals the total, not flagged); anything that fails is reported untouched.
 */
export const BulkConfirmDialog: React.FC<Props> = ({ orders, adminToken, siteConfig, mailConfigured, onClose }) => {
  const [phase, setPhase] = useState<'confirm' | 'running' | 'done'>('confirm');
  const [checked, setChecked] = useState(false);
  const [sendEmail, setSendEmail] = useState(mailConfigured);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [skipped, setSkipped] = useState<{ id: string; reason: string }[]>([]);
  const [mailed, setMailed] = useState(0);
  const [mailFailed, setMailFailed] = useState<{ id: string; reason: string }[]>([]);
  const [noEmail, setNoEmail] = useState<string[]>([]);
  const cancelRef = useRef(false);

  const byId = new Map(orders.map((o) => [o.id, o]));
  const label = (id: string) => byId.get(id)?.orderNumber || id;
  const total = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const withEmail = orders.filter((o) => validEmail(o.customerEmail)).length;
  const single = orders.length === 1;

  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` };

  const run = async () => {
    setPhase('running');
    setError('');
    cancelRef.current = false;
    let confirmed: string[] = [];
    try {
      setProgress('กำลังยืนยันการชำระเงิน...');
      const res = await fetchWithConflictRetry('/api/admin/orders/bulk-confirm', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ ids: orders.map((o) => o.id) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data && data.error) || 'ยืนยันการชำระเงินไม่สำเร็จ ไม่มีใบจองใดถูกเปลี่ยน');
        setPhase('done');
        return;
      }
      confirmed = data.confirmed || [];
      setConfirmedCount(confirmed.length);
      setSkipped(data.skipped || []);
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ไม่มีใบจองใดถูกเปลี่ยน');
      setPhase('done');
      return;
    }

    if (sendEmail && confirmed.length > 0) {
      try {
        const { createCertificateMaker } = await import('../utils/certificatePdf');
        const make = await createCertificateMaker(adminToken, siteConfig);
        let ok = 0;
        let streak = 0;
        const failed: { id: string; reason: string }[] = [];
        const missing: string[] = [];
        for (const [i, id] of confirmed.entries()) {
          if (cancelRef.current) {
            failed.push(...confirmed.slice(i).map((x) => ({ id: x, reason: 'หยุดก่อนส่ง' })));
            break;
          }
          const order = byId.get(id)!;
          if (!validEmail(order.customerEmail)) {
            missing.push(id);
            continue;
          }
          setProgress(`กำลังส่งอีเมล ${ok + failed.length + missing.length + 1} / ${confirmed.length} (${order.orderNumber})`);
          try {
            const file = await make(order);
            const r = await fetchWithConflictRetry(`/api/admin/orders/${order.id}/send-receipt`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify({ email: String(order.customerEmail).trim(), file }),
            });
            if (r.ok) {
              ok++;
              streak = 0;
            } else {
              const d = await r.json().catch(() => null);
              failed.push({ id, reason: (d && d.error) || `ส่งไม่สำเร็จ (${r.status})` });
              streak++;
            }
          } catch (err) {
            failed.push({ id, reason: err instanceof Error ? err.message : 'ส่งไม่สำเร็จ' });
            streak++;
          }
          // Three failures in a row usually means the mail account or its daily limit, so stop there.
          if (streak >= 3) {
            failed.push(...confirmed.slice(i + 1).filter((x) => validEmail(byId.get(x)?.customerEmail)).map((x) => ({ id: x, reason: 'ไม่ได้ส่ง (หยุดหลังส่งไม่สำเร็จติดกัน 3 ครั้ง)' })));
            break;
          }
          await sleep(700); // stay under the mail provider's per-second limit
        }
        setMailed(ok);
        setMailFailed(failed);
        setNoEmail(missing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'สร้างใบจองไม่สำเร็จ');
        setMailFailed(confirmed.filter((x) => validEmail(byId.get(x)?.customerEmail)).map((x) => ({ id: x, reason: 'ยังไม่ได้ส่ง' })));
      }
    } else if (confirmed.length > 0) {
      setNoEmail([]);
    }
    setProgress('');
    setPhase('done');
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="ยืนยันการชำระเงิน" className="fixed inset-0 z-[70] bg-black/70 flex items-start justify-center p-3 overflow-y-auto">
      <div className="bg-white border border-[#E8E2D5] rounded-2xl w-full max-w-lg my-auto p-5 space-y-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif-heritage text-lg font-bold text-[#14100A]">
            {single ? `ยืนยันการชำระเงิน ${orders[0].orderNumber}` : `ยืนยันการชำระเงิน ${orders.length} ใบจอง`}
          </h3>
          {phase !== 'running' && (
            <button type="button" onClick={() => onClose(phase === 'done' && confirmedCount > 0)} aria-label="ปิด" className="w-9 h-9 rounded-lg border border-[#E8E2D5] inline-flex items-center justify-center shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {phase === 'confirm' && (
          <>
            <div className="rounded-xl bg-[#F7F2E8] p-3 text-xs space-y-1">
              <p>
                <strong>{orders.length}</strong> ใบจอง · ยอดรวม <strong>฿{total.toLocaleString('th-TH')}</strong>
              </p>
              <p className="text-[#5A5244]">
                จะเปลี่ยนสถานะเป็น “ชำระเงินแล้ว” และ “กำลังคัดตรวจองค์พระ” พร้อมบันทึกประวัติ ย้อนกลับเป็นกลุ่มไม่ได้ (แก้ทีละใบได้)
              </p>
            </div>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
              <p>
                <strong>ยอดที่ “ตรง” คือยอดที่ผู้จองกรอกเองตอนแนบสลิป</strong> ไม่ได้ถูกอ่านจากรูปสลิปหรือเทียบกับธนาคาร จึงต้องตรวจกับรายการเงินเข้าบัญชีก่อนยืนยัน
              </p>
              <label className="flex items-start gap-2 font-semibold cursor-pointer">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 w-4 h-4" />
                <span>ฉันตรวจกับรายการเงินเข้าบัญชีแล้วว่าใบจองเหล่านี้ชำระจริง</span>
              </label>
            </div>

            <div className="rounded-xl border border-[#E8E2D5] p-3 text-xs space-y-1.5">
              <label className={`flex items-start gap-2 font-semibold ${mailConfigured ? 'cursor-pointer' : 'opacity-60'}`}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  disabled={!mailConfigured}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> ส่งใบจองพร้อมลายเซ็นทางอีเมลให้ผู้ซื้อทันที
                </span>
              </label>
              {!mailConfigured && <p className="text-amber-800">ยังไม่ได้ตั้งค่าอีเมลผู้ส่ง จึงส่งไม่ได้</p>}
              {sendEmail && (
                <p className="text-[#5A5244]">
                  มีอีเมลที่ใช้ได้ {withEmail} จาก {orders.length} ใบ ส่งทีละใบ ใช้เวลาราว 1–2 วินาทีต่อใบ แพ็กเกจฟรีของ Resend ส่งได้ราว 100 ฉบับต่อวัน (ใช้ร่วมกับเว็บวิ่ง)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onClose(false)} className="px-4 py-2.5 min-h-[44px] border border-[#E8E2D5] rounded-lg text-xs font-medium">
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={run}
                disabled={!checked}
                className="px-5 py-2.5 min-h-[44px] bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {sendEmail ? 'ยืนยันชำระและส่งอีเมล' : 'ยืนยันการชำระเงิน'}
              </button>
            </div>
          </>
        )}

        {phase === 'running' && (
          <div className="space-y-3" aria-live="polite">
            <p className="font-semibold text-[#14100A]">{progress || 'กำลังดำเนินการ...'}</p>
            <p className="text-xs text-[#77717C]">อย่าปิดหน้านี้จนกว่าจะเสร็จ</p>
            {sendEmail && (
              <button type="button" onClick={() => (cancelRef.current = true)} className="text-xs underline text-[#8A6D2F] font-semibold">
                หยุดการส่งอีเมลที่เหลือ (ใบที่ยืนยันแล้วจะยังเป็น “ชำระแล้ว”)
              </button>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-3 text-xs">
            {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 font-semibold">{error}</p>}
            {confirmedCount > 0 && (
              <p className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 font-semibold">
                ✓ ยืนยันการชำระเงินแล้ว {confirmedCount} ใบจอง
                {sendEmail ? ` · ส่งอีเมลสำเร็จ ${mailed} ฉบับ` : ''}
              </p>
            )}
            {skipped.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-300 text-amber-900 p-3 space-y-1">
                <p className="font-semibold">ไม่ได้เปลี่ยน {skipped.length} ใบจอง (เซิร์ฟเวอร์ตรวจแล้วไม่เข้าเงื่อนไข):</p>
                <ul className="list-disc pl-4">
                  {skipped.map((s) => (
                    <li key={s.id}>{label(s.id)} — {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {mailFailed.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 p-3 space-y-1">
                <p className="font-semibold">ส่งอีเมลไม่สำเร็จ {mailFailed.length} ใบ (ยืนยันชำระแล้ว ส่งใหม่ได้จากหน้าอัปเดตสถานะของแต่ละใบ):</p>
                <ul className="list-disc pl-4">
                  {mailFailed.map((s) => (
                    <li key={s.id}>{label(s.id)} — {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {noEmail.length > 0 && (
              <div className="rounded-lg bg-[#F7F2E8] p-3 space-y-1">
                <p className="font-semibold">ไม่มีอีเมลที่ใช้ได้ จึงไม่ได้ส่ง {noEmail.length} ใบ:</p>
                <ul className="list-disc pl-4">
                  {noEmail.map((id) => (
                    <li key={id}>{label(id)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button type="button" onClick={() => onClose(confirmedCount > 0)} className="px-5 py-2.5 min-h-[44px] bg-[#14100A] text-[#FCE694] rounded-lg text-xs font-bold">
                เสร็จสิ้น
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
