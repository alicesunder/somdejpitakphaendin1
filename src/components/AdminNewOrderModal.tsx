import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Minus, Plus, X } from 'lucide-react';
import { AmuletProduct, OrderRecord, RajaSetSlot } from '../types';
import { calculateOrderTotals } from '../utils/commerceRules';

interface Props {
  adminToken: string;
  products: AmuletProduct[];
  rajaSlots: RajaSetSlot[];
  standardShippingFee: number;
  freeShippingThreshold: number;
  onClose: () => void;
  onCreated: (order: OrderRecord) => void;
}

const field =
  'w-full px-3 py-2.5 min-h-[44px] text-sm border border-[#E8E2D5] rounded-lg bg-white focus:outline-none focus:border-[#8A6D2F]';
const label = 'block text-xs font-semibold text-[#29222E] mb-1';

/** Staff create an order for a customer (counter, phone or LINE sale), including picking numbers 1–99. */
export const AdminNewOrderModal: React.FC<Props> = ({
  adminToken,
  products,
  rajaSlots,
  standardShippingFee,
  freeShippingThreshold,
  onClose,
  onCreated,
}) => {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [numbers, setNumbers] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('ประชาชนทั่วไป');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [delivery, setDelivery] = useState<'pickup_bpp' | 'shipping'>('pickup_bpp');
  const [address, setAddress] = useState('');
  const [postal, setPostal] = useState('');
  const [method, setMethod] = useState<'cash' | 'promptpay' | 'bank_transfer'>('cash');
  const [paid, setPaid] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<OrderRecord | null>(null);
  const [search, setSearch] = useState('');

  const visible = useMemo(() => products.filter((p) => p.isVisible), [products]);
  const rajaProduct = visible.find((p) => p.requiresNumberSelection);

  const items = useMemo(
    () =>
      visible
        .map((p) =>
          p.requiresNumberSelection
            ? { productId: p.id, quantity: numbers.length, selectedNumbers: numbers }
            : { productId: p.id, quantity: qty[p.id] || 0 }
        )
        .filter((i) => i.quantity > 0),
    [visible, qty, numbers]
  );

  const calc = useMemo(
    () =>
      calculateOrderTotals(
        items,
        products,
        delivery === 'pickup_bpp' ? 0 : standardShippingFee,
        freeShippingThreshold
      ),
    [items, products, delivery, standardShippingFee, freeShippingThreshold]
  );

  const free = (n: number) => rajaSlots.find((s) => s.slotNumber === n)?.status === 'available';

  const toggleNumber = (n: number) =>
    setNumbers((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (items.length === 0) {
      setError('กรุณาเลือกวัตถุมงคลอย่างน้อย 1 รายการ');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          items,
          customerName: name,
          organization: org,
          customerPhone: phone,
          customerEmail: email,
          deliveryMethod: delivery,
          shippingAddress: address,
          postalCode: postal,
          paymentMethod: method,
          paid,
          note,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'สร้างใบจองไม่สำเร็จ');
        return;
      }
      setDone(data.order as OrderRecord);
      onCreated(data.order as OrderRecord);
    } catch {
      setError('เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  const shown = visible.filter(
    (p) => !p.requiresNumberSelection && (!search || `${p.code} ${p.name}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="สร้างใบจองใหม่" className="fixed inset-0 z-50 bg-black/70 flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-4 border border-[#E8E2D5]">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#E8E2D5]">
          <div>
            <h3 className="font-serif-heritage text-lg font-bold text-[#14100A]">สร้างใบจองใหม่ (ขายหน้าร้าน / โทรศัพท์ / LINE)</h3>
            <p className="text-xs text-[#77717C]">เลือกรายการและหมายเลข 1–99 ให้ลูกค้า ระบบล็อกเลขและตัดสต็อกให้ทันที</p>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="p-2 rounded-lg hover:bg-[#F7F2E8] min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="font-bold text-lg text-[#14100A]">สร้างใบจองเรียบร้อย</p>
            <p className="font-tabular text-2xl font-bold text-[#8A6D2F]">{done.orderNumber}</p>
            <p className="text-sm text-[#5A5244]">
              {done.customerName} · ฿{done.grandTotal.toLocaleString()}
              {done.selectedNumbers?.length ? ` · เลข ${done.selectedNumbers.map((n) => '#' + n).join(', ')}` : ''}
            </p>
            <p className="text-xs text-[#77717C]">ลูกค้าตรวจสถานะได้ด้วยเลขที่ใบจองนี้ + เบอร์โทร 4 ตัวท้าย</p>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl bg-[#14100A] text-[#FCE694] font-bold text-sm min-h-[44px]">
              เสร็จสิ้น
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-4 sm:p-5 space-y-6">
            {/* 1. products */}
            <section className="space-y-3">
              <h4 className="font-bold text-sm text-[#14100A]">1. เลือกวัตถุมงคล</h4>
              <input className={field} placeholder="ค้นหารหัสหรือชื่อ เช่น ช2, ชศ5" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="ค้นหาวัตถุมงคล" />
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E8E2D5] border border-[#E8E2D5] rounded-xl">
                {shown.map((p) => {
                  const n = qty[p.id] || 0;
                  const out = !p.isMadeToOrder && p.stock <= 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#14100A] break-words">
                          [{p.code}] {p.name}
                        </p>
                        <p className="text-[11px] text-[#77717C]">
                          ฿{p.price.toLocaleString()} · {p.isMadeToOrder ? 'ผลิตตามสั่ง' : `คงเหลือ ${p.stock}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button type="button" aria-label={`ลดจำนวน ${p.code}`} disabled={n === 0} onClick={() => setQty((q) => ({ ...q, [p.id]: Math.max(0, n - 1) }))} className="w-11 h-11 rounded-lg border border-[#E8E2D5] disabled:opacity-40 flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-tabular w-8 text-center font-bold" aria-live="polite">{n}</span>
                        <button type="button" aria-label={`เพิ่มจำนวน ${p.code}`} disabled={out || (!p.isMadeToOrder && n >= p.stock)} onClick={() => setQty((q) => ({ ...q, [p.id]: n + 1 }))} className="w-11 h-11 rounded-lg bg-[#14100A] text-[#FCE694] disabled:opacity-40 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {shown.length === 0 && <p className="p-4 text-xs text-[#77717C]">ไม่พบรายการ</p>}
              </div>
            </section>

            {/* 2. numbers */}
            {rajaProduct && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#14100A]">
                    2. เลือกหมายเลขชุดทองคำใหญ่ราชาฤกษ์ [{rajaProduct.code}] ฿{rajaProduct.price.toLocaleString()} / ชุด
                  </h4>
                  <p className="text-xs text-[#5A5244]">
                    เลือกแล้ว {numbers.length} ชุด {numbers.length > 0 && <strong className="font-tabular">({numbers.map((n) => '#' + n).join(', ')})</strong>}
                  </p>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-11 gap-1.5" role="group" aria-label="หมายเลข 1 ถึง 99">
                  {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => {
                    const ok = free(n);
                    const on = numbers.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={!ok}
                        aria-pressed={on}
                        aria-label={`หมายเลข ${n} ${ok ? (on ? 'เลือกอยู่' : 'ว่าง') : 'ไม่ว่าง'}`}
                        onClick={() => toggleNumber(n)}
                        className={`font-tabular text-xs font-bold min-h-[40px] rounded-lg border transition-colors ${
                          on
                            ? 'bg-[#14100A] text-[#FCE694] border-[#14100A]'
                            : ok
                            ? 'bg-white border-[#C9A45C] text-[#14100A] hover:bg-[#F7F2E8]'
                            : 'bg-[#EFEAE0] text-[#A59E92] border-[#E8E2D5] line-through cursor-not-allowed'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#77717C]">ตัวเลขสีเทาขีดฆ่า = ถูกจองหรือมีลูกค้ากำลังเลือกอยู่</p>
              </section>
            )}

            {/* 3. buyer */}
            <section className="space-y-3">
              <h4 className="font-bold text-sm text-[#14100A]">3. ข้อมูลผู้ซื้อ</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={label} htmlFor="an-name">ชื่อ–นามสกุล *</label>
                  <input id="an-name" required className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <label className={label} htmlFor="an-org">หน่วยงาน / สังกัด</label>
                  <input id="an-org" className={field} value={org} onChange={(e) => setOrg(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="an-phone">เบอร์โทรศัพท์ * (ใช้ตรวจสถานะ 4 ตัวท้าย)</label>
                  <input id="an-phone" required inputMode="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="an-email">อีเมล (ถ้ามี)</label>
                  <input id="an-email" type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="an-delivery">วิธีรับพระ</label>
                  <select id="an-delivery" className={field} value={delivery} onChange={(e) => setDelivery(e.target.value as 'pickup_bpp' | 'shipping')}>
                    <option value="pickup_bpp">มารับเองที่ บช.ตชด.</option>
                    <option value="shipping">จัดส่งทางไปรษณีย์</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="an-method">ช่องทางชำระเงิน</label>
                  <select id="an-method" className={field} value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'promptpay' | 'bank_transfer')}>
                    <option value="cash">เงินสด / ชำระกับเจ้าหน้าที่</option>
                    <option value="promptpay">พร้อมเพย์</option>
                    <option value="bank_transfer">โอนบัญชีธนาคาร</option>
                  </select>
                </div>
                {delivery === 'shipping' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className={label} htmlFor="an-address">ที่อยู่จัดส่ง *</label>
                      <input id="an-address" required className={field} value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div>
                      <label className={label} htmlFor="an-postal">รหัสไปรษณีย์ *</label>
                      <input id="an-postal" required inputMode="numeric" maxLength={5} className={field} value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="an-note">หมายเหตุภายใน (ไม่บังคับ)</label>
                  <input id="an-note" className={field} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ลูกค้าโทรสั่ง / ฝากเจ้าหน้าที่หน่วย..." />
                </div>
              </div>
              <label className="flex items-start gap-2.5 rounded-xl border border-[#E8E2D5] p-3 cursor-pointer">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#8A6D2F]" />
                <span className="text-sm text-[#14100A]">
                  <strong>รับชำระเงินแล้ว</strong> — บันทึกเป็น “ชำระเงินแล้ว” ทันที
                  <span className="block text-xs text-[#77717C]">ไม่ติ๊ก = สร้างเป็น “รอชำระเงิน” ลูกค้าโอนและแนบสลิปเองได้ที่หน้าตรวจสอบสถานะ</span>
                </span>
              </label>
            </section>

            <div className="rounded-xl bg-[#F7F2E8] p-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-[#29222E]">
                {calc.totalQuantity} รายการ{calc.shippingTotal > 0 ? ` · ค่าส่ง ฿${calc.shippingTotal.toLocaleString()}` : ''}
              </span>
              <span className="font-tabular text-xl font-bold text-[#14100A]">รวม ฿{calc.grandTotal.toLocaleString()}</span>
            </div>

            {(error || (!calc.valid && items.length > 0 && calc.errors[0])) && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-300 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || calc.errors[0]}</span>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} className="px-5 py-3 min-h-[44px] rounded-xl border border-[#E8E2D5] text-sm font-semibold">
                ยกเลิก
              </button>
              <button type="submit" disabled={busy || !calc.valid} className="px-6 py-3 min-h-[44px] rounded-xl bg-[#14100A] text-[#FCE694] font-bold text-sm disabled:opacity-50">
                {busy ? 'กำลังสร้างใบจอง...' : 'สร้างใบจอง'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
