import React from 'react';
import { PublicTrackedOrder, SiteConfig } from '../types';
import {
  formatThaiDate,
  numberToThaiBahtText,
  resolveOrderDeliveryMethod,
} from '../utils/commerceRules';
import { BppCrestLogo } from './SacredArtwork';

/**
 * The formal reservation certificate (ใบจองวัตถุมงคล). Staff print it from the admin dashboard,
 * sign it, and email the signed scan to the buyer.
 */
export const ReservationCertificate: React.FC<{
  order: PublicTrackedOrder;
  siteConfig: SiteConfig;
}> = ({ order, siteConfig }) => {
  const slipTotalThaiText =
    order.grandTotalThaiText || numberToThaiBahtText(order.grandTotal);
  const slipDateThai =
    order.reservationDateThai || formatThaiDate(order.createdAt);

  return (
    <div
      id="printable-reservation-slip"
      className="printable-reservation-slip bg-[#FAF6EC] text-[#18140E] border-2 border-[#8A6D2F] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6"
    >
      {/* Header with Official BPP 75th Crest */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#8A6D2F] pb-5">
        <div className="flex items-center gap-4">
          <BppCrestLogo className="w-20 h-16 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#8A6D2F] uppercase tracking-wider">
              กองบัญชาการตำรวจตระเวนชายแดน · วาระครบรอบ ๗๕ ปี
            </p>
            <h2 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#18140E]">
              ใบจองวัตถุมงคล &ldquo;สมเด็จพิทักษ์แผ่นดิน&rdquo; ๗๕ ปี ตชด.
            </h2>
            <p className="text-xs text-[#5A5244]">
              เอกสารหลักฐานการสั่งจองอย่างเป็นทางการ (Official Reservation Certificate)
            </p>
          </div>
        </div>

        <div className="bg-[#18140E] text-[#FCE694] px-4 py-3 rounded-xl border border-[#C9A45C] text-right shrink-0">
          <span className="block text-[11px] text-[#E5C158]">
            เลขที่ใบจอง (Reservation No.)
          </span>
          <span className="font-tabular text-lg sm:text-xl font-bold tracking-wide">
            {order.orderNumber}
          </span>
          <span className="block text-[11px] text-[#F7F2E8]/85 mt-0.5">
            วันที่จอง: {slipDateThai}
          </span>
        </div>
      </div>

      {/* Reserver Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#F1E9D6] border border-[#C9A45C]/60 rounded-xl p-4 text-xs sm:text-sm">
        <div>
          <span className="block text-[11px] font-semibold text-[#787062]">
            ชื่อผู้จอง
          </span>
          <span className="font-bold text-[#18140E] text-sm sm:text-base">
            {order.customerName || order.maskedCustomerName}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-[#787062]">
            หน่วยงาน / สังกัด
          </span>
          <span className="font-bold text-[#18140E] text-sm sm:text-base">
            {order.organization || 'ประชาชนทั่วไป'}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-[#787062]">
            เบอร์โทรศัพท์
          </span>
          <span className="font-tabular font-bold text-[#18140E] text-sm sm:text-base">
            {order.customerPhone || order.maskedPhone}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-semibold text-[#787062]">
            วันที่ทำรายการจอง
          </span>
          <span className="font-bold text-[#18140E] text-sm sm:text-base">
            {slipDateThai}
          </span>
        </div>
      </div>

      {/* Delivery / Pickup Method Information on Slip */}
      <div className="bg-[#FFFFFF] border border-[#C9A45C] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#787062]">
              วิธีการรับวัตถุมงคล:
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#18140E] text-[#FCE694] text-xs font-bold">
              {resolveOrderDeliveryMethod(order) === 'pickup_bpp'
                ? 'มารับเองที่ บช.ตชด.'
                : 'จัดส่งทางไปรษณีย์ (EMS)'}
            </span>
          </div>
          <p className="font-semibold text-[#18140E]">
            {order.shippingAddress ||
              (resolveOrderDeliveryMethod(order) === 'pickup_bpp'
                ? 'กองบัญชาการตำรวจตระเวนชายแดน (บช.ตชด.) ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400'
                : '-')}
            {resolveOrderDeliveryMethod(order) === 'shipping' &&
              order.postalCode &&
              !String(order.shippingAddress || '').includes(
                order.postalCode
              ) &&
              ` (รหัสไปรษณีย์ ${order.postalCode})`}
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <span className="block text-[11px] font-semibold text-[#787062]">
            ช่องทางชำระเงินที่เลือก
          </span>
          <span className="font-bold text-[#8A6D2F]">
            {order.paymentMethod === 'promptpay'
              ? 'สแกน QR พร้อมเพย์ (PromptPay)'
              : `โอนผ่านบัญชีธนาคาร (${order.transferReference || siteConfig.paymentChannels.bankName})`}
          </span>
        </div>
      </div>

      {/* Selected Numbers Highlight (if ช1 was booked) */}
      {order.selectedNumbers &&
        order.selectedNumbers.length > 0 && (
          <div className="bg-[#18140E] text-[#FCE694] border border-[#C9A45C] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#E5C158] block">
                หมายเลขประจำชุด ช1 ชุดทองคำใหญ่ราชาฤกษ์ (1–99) ที่ได้รับสิทธิ์:
              </span>
              <p className="text-base sm:text-lg font-tabular font-bold text-[#FCE694] mt-0.5">
                {order.selectedNumbers
                  .map((n) => `หมายเลข #${String(n).padStart(2, '0')}`)
                  .join(' , ')}
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#2C2111] border border-[#FCE694] text-xs font-bold">
              รวม {order.selectedNumbers.length} ชุด
            </span>
          </div>
        )}

      {/* Itemized Table */}
      <div className="overflow-x-auto border border-[#C9A45C]/70 rounded-xl">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#18140E] text-[#FCE694]">
              <th className="p-3 font-semibold">ลำดับ</th>
              <th className="p-3 font-semibold">รหัส</th>
              <th className="p-3 font-semibold">รายการวัตถุมงคล</th>
              <th className="p-3 font-semibold text-right">ราคา/หน่วย</th>
              <th className="p-3 font-semibold text-center">จำนวน</th>
              <th className="p-3 font-semibold text-right">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C9A45C]/40 bg-[#FFFFFF]">
            {order.items.map((item, idx) => (
              <tr key={`${item.productId}-${idx}`}>
                <td className="p-3 font-tabular text-[#5A5244]">
                  {idx + 1}
                </td>
                <td className="p-3 font-tabular font-bold text-[#18140E]">
                  {item.productCode}
                </td>
                <td className="p-3">
                  <p className="font-bold text-[#18140E]">
                    {item.productName}
                  </p>
                  <p className="text-xs text-[#787062]">{item.series}</p>
                  {item.selectedNumbers &&
                    item.selectedNumbers.length > 0 && (
                      <p className="text-xs font-bold text-[#8A6D2F] mt-0.5">
                        หมายเลขที่เลือก:{' '}
                        {item.selectedNumbers
                          .map((n) => `#${String(n).padStart(2, '0')}`)
                          .join(', ')}
                      </p>
                    )}
                </td>
                <td className="p-3 text-right font-tabular">
                  ฿{item.unitPrice.toLocaleString()}
                </td>
                <td className="p-3 text-center font-tabular font-bold">
                  {item.quantity}
                </td>
                <td className="p-3 text-right font-tabular font-bold text-[#18140E]">
                  ฿{item.lineTotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grand Total Numeric & Thai Baht Text */}
      <div className="bg-[#F1E9D6] border-2 border-[#8A6D2F] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#5A5244] block">
            ยอดรวมทั้งสิ้น (ตัวอักษรไทย):
          </span>
          <p
            data-testid="confirmed-thai-baht-text"
            className="font-serif-heritage text-base sm:text-xl font-bold text-[#18140E]"
          >
            ({slipTotalThaiText})
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs font-semibold text-[#5A5244] block">
            ยอดรวมทั้งสิ้น (ตัวเลข):
          </span>
          <span
            data-testid="confirmed-grand-total"
            className="font-tabular text-2xl sm:text-3xl font-bold text-[#18140E]"
          >
            ฿{order.grandTotal.toLocaleString()} บาท
          </span>
        </div>
      </div>

      {/* Footer Signatures & Payment Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs text-[#5A5244] border-t border-[#C9A45C]/50">
        <div className="space-y-1">
          <p className="font-bold text-[#18140E]">
            ช่องทางชำระเงินบำรุงกองทุน:
          </p>
          <p>
            {siteConfig.paymentChannels.bankName} · เลขบัญชี{' '}
            {siteConfig.paymentChannels.accountNumber}
          </p>
          <p>ชื่อบัญชี: {siteConfig.paymentChannels.accountName}</p>
          <p>สถานะ: ชำระเงินแล้ว (ตรวจสอบโดยเจ้าหน้าที่)</p>
        </div>

        <div className="flex flex-col sm:items-end justify-end space-y-1">
          <div className="pt-6 pb-2 text-center sm:w-64 space-y-1">
            <p>ลงชื่อ ........................................</p>
            <p>(........................................)</p>
            <p className="font-bold text-[#18140E]">เจ้าหน้าที่ผู้ตรวจสอบ</p>
            <p>วันที่ ............/............/............</p>
          </div>
          <p className="font-bold text-[#18140E]">
            กองบัญชาการตำรวจตระเวนชายแดน
          </p>
          <p>{siteConfig.contactAddress}</p>
          <p>โทร. {siteConfig.contactPhone}</p>
        </div>
      </div>
    </div>
  );
};
