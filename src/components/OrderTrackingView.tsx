import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  PaymentStatus,
  PreparationStatus,
  PublicTrackedOrder,
  ShippingStatus,
} from '../types';
import { ThaiCornerBrackets } from './SacredArtwork';
import { PaymentPanel } from './PaymentPanel';
import { PaymentChannelConfig } from '../types';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  paymentChannels?: PaymentChannelConfig;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber = '',
  paymentChannels,
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phoneVerify, setPhoneVerify] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<PublicTrackedOrder | null>(
    null
  );

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleTrackLookup = async (
    orderNoToSearch: string,
    phoneToSearch: string
  ) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNoToSearch,
          phoneVerify: phoneToSearch,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrackedOrder(null);
        setError(data.error || 'ไม่พบข้อมูลคำสั่งจอง');
      } else {
        setTrackedOrder(data.order);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrackLookup(orderNumber, phoneVerify);
  };

  const fillDemoSample = (sampleOrder: string, sampleLast4: string) => {
    setOrderNumber(sampleOrder);
    setPhoneVerify(sampleLast4);
    handleTrackLookup(sampleOrder, sampleLast4);
  };

  const renderPaymentLabel = (status: PaymentStatus) => {
    if (status === 'verified_paid') return 'ตรวจสอบยอดชำระเรียบร้อยแล้ว';
    if (status === 'payment_rejected') return 'หลักฐานการชำระเงินไม่ถูกต้อง';
    return 'รอผู้ดูแลตรวจสอบยอดชำระเงิน';
  };

  const renderPrepLabel = (status: PreparationStatus) => {
    if (status === 'packed_ready') return 'คัดตรวจองค์พระและบรรจุกล่องนิรภัยแล้ว';
    if (status === 'inspecting_artifact')
      return 'กำลังคัดตรวจสภาพองค์พระและเอกสารประจำกล่อง';
    return 'รอการยืนยันยอดชำระเงิน';
  };

  const renderShippingLabel = (status: ShippingStatus) => {
    if (status === 'delivered') return 'นำจ่ายพัสดุสำเร็จ';
    if (status === 'in_transit') return 'จัดส่งพัสดุเข้าสู่ระบบขนส่งแล้ว';
    return 'อยู่ระหว่างรอดำเนินการจัดส่ง';
  };

  return (
    <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-[#C9A45C]/30 pb-6 space-y-2">
          <div className="text-xs text-[#E5C158] font-bold tracking-[0.14em] uppercase">
            ระบบตรวจสอบสถานะแบบคุ้มครองข้อมูลส่วนบุคคล
          </div>
          <h1 className="font-serif-heritage text-2xl sm:text-4xl font-bold text-gold-shimmer">
            ติดตามสถานะคำสั่งจองวัตถุมงคล
          </h1>
          <p className="text-sm text-[#F7F2E8]/80">
            กรอกรหัสคำสั่งจองพร้อมหมายเลขโทรศัพท์ 4 ตัวท้ายของผู้รับ เพื่อตรวจสอบสถานะการชำระเงิน
            การจัดเตรียมวัตถุมงคล และหมายเลขพัสดุ โดยระบบจะปิดบังข้อมูลส่วนบุคคลเพื่อความปลอดภัย
          </p>
        </div>

        {/* Search Form Card */}
        <div className="relative sacred-shrine-pedestal rounded-2xl p-6 space-y-5">
          <ThaiCornerBrackets className="inset-2.5 opacity-55" />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
          >
            <div className="sm:col-span-5">
              <label
                htmlFor="track-order-number"
                className="block text-xs font-bold text-[#FCE694] mb-1"
              >
                รหัสคำสั่งจอง (Order Number) *
              </label>
              <input
                id="track-order-number"
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="เช่น BPP-2569-1042"
                className="w-full px-3.5 py-2.5 text-sm font-tabular border border-[#C9A45C]/60 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="track-phone-last4"
                className="block text-xs font-bold text-[#FCE694] mb-1"
              >
                เบอร์โทรศัพท์ 4 ตัวท้าย (หรือเบอร์เต็ม) *
              </label>
              <input
                id="track-phone-last4"
                type="text"
                required
                value={phoneVerify}
                onChange={(e) => setPhoneVerify(e.target.value)}
                placeholder="เช่น 5678"
                className="w-full px-3.5 py-2.5 text-sm font-tabular border border-[#C9A45C]/60 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 btn-sacred-gold text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'กำลังค้นหา...' : 'ตรวจสอบสถานะ'}</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Samples */}
          <div className="relative z-10 pt-3 border-t border-[#C9A45C]/25 flex flex-wrap items-center gap-2 text-xs text-[#F7F2E8]/75">
            <span>ตัวอย่างข้อมูลสาธิตสำหรับทดสอบ:</span>
            <button
              type="button"
              onClick={() => fillDemoSample('BPP-2569-1042', '5678')}
              className="font-tabular text-[#FCE694] hover:text-[#FFFFFF] underline font-bold"
            >
              BPP-2569-1042 (เบอร์ท้าย 5678 - จัดส่งแล้ว)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => fillDemoSample('BPP-2569-1009', '7575')}
              className="font-tabular text-[#FCE694] hover:text-[#FFFFFF] underline font-bold"
            >
              BPP-2569-1009 (เบอร์ท้าย 7575 - ช1 หมายเลข #9)
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-950/60 border border-red-400/50 rounded-xl p-4 text-xs sm:text-sm text-red-200 flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tracked Order Result */}
        {trackedOrder && (
          <div className="relative sacred-shrine-pedestal animate-sacred-reveal rounded-2xl p-6 sm:p-8 space-y-8">
            <ThaiCornerBrackets className="inset-2.5 opacity-55" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A45C]/30 pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#E5C158] font-bold">
                    ข้อมูลคำสั่งจอง (ปกป้องข้อมูลส่วนบุคคล)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#221A0E] border border-[#FCE694]/60 text-[11px] font-bold text-[#FCE694]">
                    {trackedOrder.deliveryMethod === 'pickup_bpp' ||
                    (trackedOrder.shippingAddress || '').includes('มารับเอง')
                      ? 'มารับเองที่ บช.ตชด.'
                      : 'จัดส่งทางไปรษณีย์ (EMS)'}
                  </span>
                </div>
                <h2 className="font-serif-heritage text-xl sm:text-2xl font-bold text-[#FCE694] font-tabular">
                  {trackedOrder.orderNumber}
                </h2>
                <p className="text-xs text-[#F7F2E8]/80">
                  ผู้สั่งจอง: {trackedOrder.maskedCustomerName} ({trackedOrder.maskedPhone}) ·{' '}
                  {trackedOrder.deliveryMethod === 'pickup_bpp' ||
                  (trackedOrder.shippingAddress || '').includes('มารับเอง')
                    ? 'สถานที่รับพระ: กองบัญชาการตำรวจตระเวนชายแดน (บช.ตชด.)'
                    : `รหัสไปรษณีย์ปลายทาง ${trackedOrder.postalCode}`}
                </p>
              </div>

              {trackedOrder.trackingNumber && (
                <div className="bg-[#18130B] border border-[#FCE694]/70 rounded-xl px-4 py-2.5 text-right">
                  <span className="text-[11px] text-[#E5C158] block">
                    หมายเลขพัสดุ ({trackedOrder.carrierName || 'ไปรษณีย์ไทย EMS'})
                  </span>
                  <span className="font-tabular text-sm font-bold text-[#FCE694]">
                    {trackedOrder.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            {/* 3 Separated Status Tracks */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[#C9A45C]/40 bg-[#110D08]/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#E5C158]">
                  <span>1. การชำระเงิน</span>
                  <ShieldCheck className="w-4 h-4 text-[#FCE694]" />
                </div>
                <p
                  className={`text-sm font-bold ${
                    trackedOrder.paymentStatus === 'verified_paid'
                      ? 'text-emerald-300'
                      : trackedOrder.paymentStatus === 'payment_rejected'
                      ? 'text-red-300'
                      : 'text-[#FCE694]'
                  }`}
                >
                  {renderPaymentLabel(trackedOrder.paymentStatus)}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#C9A45C]/40 bg-[#110D08]/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#E5C158]">
                  <span>2. การจัดเตรียมวัตถุมงคล</span>
                  <Package className="w-4 h-4 text-[#FCE694]" />
                </div>
                <p className="text-sm font-bold text-[#FFFFFF]">
                  {renderPrepLabel(trackedOrder.preparationStatus)}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#C9A45C]/40 bg-[#110D08]/90 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#E5C158]">
                  <span>3. การจัดส่งพัสดุ</span>
                  <Truck className="w-4 h-4 text-[#FCE694]" />
                </div>
                <p className="text-sm font-bold text-[#FCE694]">
                  {renderShippingLabel(trackedOrder.shippingStatus)}
                </p>
              </div>
            </div>

            {paymentChannels && trackedOrder.paymentStatus === 'pending_verification' && (
              <PaymentPanel
                order={trackedOrder}
                phoneVerify={phoneVerify}
                channels={paymentChannels}
                onOrderUpdated={(o) => setTrackedOrder(o)}
              />
            )}

            {/* Status History Log */}
            <div className="relative z-10 space-y-4">
              <h3 className="font-serif-heritage text-base font-bold text-[#FCE694]">
                ประวัติการดำเนินการและตรวจสอบสถานะ
              </h3>
              <div className="space-y-3 border-l-2 border-[#C9A45C] pl-4 ml-2">
                {trackedOrder.statusHistory.map((log) => (
                  <div key={log.id} className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-[#E5C158]/85">
                      <Clock className="w-3.5 h-3.5 text-[#FCE694]" />
                      <span className="font-tabular">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#FCE694]">
                        {log.actor}
                      </span>
                    </div>
                    <p className="text-[#F7F2E8] font-medium pl-5">{log.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Itemized Summary */}
            <div className="relative z-10 pt-4 border-t border-[#C9A45C]/30 space-y-3">
              <h3 className="font-serif-heritage text-sm font-bold text-[#FCE694]">
                รายการวัตถุมงคลในคำสั่งจอง
              </h3>
              <div className="divide-y divide-[#C9A45C]/20 text-xs">
                {trackedOrder.items.map((item) => (
                  <div
                    key={item.productId}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <span className="text-[#F7F2E8]">
                      {item.productName} ({item.series}) × {item.quantity} องค์
                    </span>
                    <span className="font-tabular font-bold text-[#FCE694]">
                      ฿{item.lineTotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#C9A45C]/30 text-sm font-bold text-[#FCE694]">
                <span>ยอดรวมสุทธิ (รวมค่าจัดส่ง)</span>
                <span className="font-tabular">
                  ฿{trackedOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
