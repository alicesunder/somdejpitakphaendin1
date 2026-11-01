import React, { useMemo, useRef, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import type { OrderRecord } from '../types';
import { PDF_PART_SIZE, bangkokDay, buildOrdersPdf, ordersForDay, paidAt, type DayBasis } from '../utils/orderPdf';

const shortThaiDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'UTC' });

/**
 * Admin card: download one day's orders as PDF files, one A4 page per buyer (details, delivery
 * address, payment and the transfer slip). A busy day is split into parts of 25 buyers so each file
 * stays small enough to open and print.
 */
export const OrderPdfExport: React.FC<{ orders: OrderRecord[]; adminToken: string }> = ({ orders, adminToken }) => {
  const [day, setDay] = useState(() => bangkokDay(new Date()));
  const [basis, setBasis] = useState<DayBasis>('booked');
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [busyPart, setBusyPart] = useState<number | null>(null);
  const [progress, setProgress] = useState({ done: 0, of: 0 });
  const [error, setError] = useState('');
  const cancelRef = useRef(false);

  const dayOrders = useMemo(() => ordersForDay(orders, day, basis, includeCancelled), [orders, day, basis, includeCancelled]);
  const parts = useMemo(() => {
    const n = Math.ceil(dayOrders.length / PDF_PART_SIZE);
    return Array.from({ length: n }, (_, i) => {
      const from = i * PDF_PART_SIZE;
      return { index: i, from, orders: dayOrders.slice(from, from + PDF_PART_SIZE) };
    });
  }, [dayOrders]);

  // Quick picks: the most recent days that have orders (by the chosen basis).
  const recentDays = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of orders) {
      if (!includeCancelled && o.paymentStatus === 'payment_rejected') continue;
      const d = bangkokDay(basis === 'booked' ? o.createdAt : paidAt(o));
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
  }, [orders, basis, includeCancelled]);

  const paid = dayOrders.filter((o) => o.paymentStatus === 'verified_paid').length;
  const cancelled = dayOrders.filter((o) => o.paymentStatus === 'payment_rejected').length;
  const pending = dayOrders.length - paid - cancelled;

  const fetchSlips = async (ids: string[]) => {
    const res = await fetch('/api/admin/slips/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.slips) throw new Error((data && data.error) || 'โหลดสลิปไม่สำเร็จ');
    return data.slips as Record<string, string | null>;
  };

  const download = async (partIndex: number) => {
    const part = parts[partIndex];
    if (!part || busyPart !== null) return;
    setError('');
    setBusyPart(partIndex);
    cancelRef.current = false;
    setProgress({ done: 0, of: part.orders.length });
    try {
      const blob = await buildOrdersPdf(part.orders, {
        offset: part.from,
        total: dayOrders.length,
        fetchSlips,
        onProgress: (done, of) => setProgress({ done, of }),
        shouldCancel: () => cancelRef.current,
      });
      if (!blob) return; // cancelled
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${day}_${basis === 'paid' ? 'paid' : 'booked'}_part${partIndex + 1}of${parts.length}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สร้างไฟล์ PDF ไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setBusyPart(null);
    }
  };

  const chip = 'px-3 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold';
  return (
    <section className="rounded-2xl border border-[#E8E2D5] bg-white p-5 space-y-4" aria-labelledby="pdf-export-title">
      <div>
        <h2 id="pdf-export-title" className="font-bold text-sm text-[#14100A] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8A6D2F]" />
          ดาวน์โหลดข้อมูลผู้สั่งเป็น PDF (A4 ต่อ 1 คน) · ทีละวัน
        </h2>
        <p className="text-[11px] text-[#77717C] mt-1">
          แต่ละหน้ามีข้อมูลผู้สั่ง ที่อยู่จัดส่ง รายการ การชำระเงิน และรูปสลิป · วันที่มีคนสั่งเยอะจะแบ่งเป็นไฟล์ละ {PDF_PART_SIZE} คน
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-[#29222E]">
          เลือกวัน
          <input
            type="date"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className="block mt-1 min-h-[40px] rounded-lg border border-[#C9A45C]/60 px-3 text-sm bg-white"
          />
        </label>
        <div role="group" aria-label="นับตามวันที่" className="flex gap-1.5">
          {(
            [
              ['booked', 'ตามวันที่จอง'],
              ['paid', 'ตามวันที่ชำระ/ส่งสลิป'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={basis === k}
              onClick={() => setBasis(k)}
              className={`${chip} ${basis === k ? 'bg-[#14100A] text-[#FCE694] border-[#14100A]' : 'bg-white text-[#14100A] border-[#C9A45C]/60'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#29222E] min-h-[40px]">
          <input type="checkbox" checked={includeCancelled} onChange={(e) => setIncludeCancelled(e.target.checked)} className="w-4 h-4" />
          รวมใบจองที่ยกเลิกแล้ว
        </label>
      </div>

      {recentDays.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="วันที่มีใบจองล่าสุด">
          {recentDays.map(([d, n]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`${chip} ${d === day ? 'bg-[#FFF3C4] border-[#C9A45C]' : 'bg-white border-[#E8E2D5]'}`}
            >
              {shortThaiDay(d)} <span className="font-tabular text-[#8A6D2F]">({n})</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-[#14100A]" role="status">
        {dayOrders.length === 0 ? (
          <>วันที่ {shortThaiDay(day)} ไม่มีใบจอง</>
        ) : (
          <>
            วันที่ {shortThaiDay(day)}: <b className="font-tabular">{dayOrders.length}</b> ใบจอง · ชำระแล้ว {paid} · รอตรวจสอบ {pending}
            {cancelled > 0 ? ` · ยกเลิก ${cancelled}` : ''}
          </>
        )}
      </p>

      {parts.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-2">
          {parts.map((p) => {
            const busy = busyPart === p.index;
            return (
              <button
                key={p.index}
                type="button"
                disabled={busyPart !== null}
                onClick={() => download(p.index)}
                className="min-h-[48px] px-4 rounded-xl border border-[#C9A45C] bg-[#FFF9EA] text-left text-xs font-bold text-[#14100A] inline-flex items-center gap-2 disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Download className="w-4 h-4 shrink-0 text-[#8A6D2F]" />}
                <span>
                  {parts.length > 1 ? `ไฟล์ ${p.index + 1}/${parts.length} · ` : ''}ใบที่ {p.from + 1}–{p.from + p.orders.length}
                  {busy && <span className="block font-normal text-[#77717C]">กำลังสร้าง {progress.done}/{progress.of} หน้า...</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {busyPart !== null && (
        <button
          type="button"
          onClick={() => {
            cancelRef.current = true;
          }}
          className="text-xs font-bold text-red-700 underline min-h-[36px]"
        >
          ยกเลิกการสร้างไฟล์
        </button>
      )}
      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
      <p className="text-[11px] text-[#77717C]">
        ไฟล์มีชื่อ เบอร์โทร ที่อยู่ และสลิปของลูกค้า ดาวน์โหลดเฉพาะบนเครื่องที่ปลอดภัย และลบเมื่อไม่ใช้งาน · ระบบสร้างไฟล์ในเบราว์เซอร์ของท่าน ไม่แก้ไขข้อมูลใด ๆ
      </p>
    </section>
  );
};
