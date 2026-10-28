import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Grid,
  MapPin,
  Minus,
  Package,
  Plus,
  Printer,
  QrCode,
  Trash2,
  Truck,
} from 'lucide-react';
import {
  AmuletProduct,
  CartItem,
  DeliveryMethod,
  OrderRecord,
  PublicTrackedOrder,
  RajaSetSlot,
  SiteConfig,
} from '../types';
import {
  calculateOrderTotals,
  formatThaiDate,
  numberToThaiBahtText,
  resolveOrderDeliveryMethod,
  validateCheckoutForm,
} from '../utils/commerceRules';
import { confirmOrderInFirestoreTransaction } from '../firebase';
import { BppCrestLogo, SpecimenPlate } from './SacredArtwork';
import { RajaNumberGridModal } from './RajaNumberGridModal';

interface CartCheckoutViewProps {
  cart: CartItem[];
  products: AmuletProduct[];
  rajaSlots: RajaSetSlot[];
  sessionId: string;
  selectedRajaNumbers: number[];
  onToggleRajaSlot: (slotNumber: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  siteConfig: SiteConfig;
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: (skipSlotRelease?: boolean) => void;
  onOrderCreated: (
    order: PublicTrackedOrder,
    updatedSlots?: RajaSetSlot[],
    updatedProducts?: AmuletProduct[]
  ) => void;
  onContinueShopping: () => void;
  onGoToTracking: (orderNumber: string) => void;
}

export const CartCheckoutView: React.FC<CartCheckoutViewProps> = ({
  cart,
  products,
  rajaSlots,
  sessionId,
  selectedRajaNumbers,
  onToggleRajaSlot,
  siteConfig,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  onContinueShopping,
  onGoToTracking,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [organization, setOrganization] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup_bpp');
  const [shippingAddress, setShippingAddress] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [postalCode, setPostalCode] = useState('10400');
  const [paymentMethod, setPaymentMethod] = useState<
    'promptpay' | 'bank_transfer'
  >('promptpay');
  const [selectedBank, setSelectedBank] = useState('ธนาคารกรุงไทย');
  const [transferSlipRef, setTransferSlipRef] = useState('');
  const [showRajaModal, setShowRajaModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmedOrder, setConfirmedOrder] =
    useState<PublicTrackedOrder | null>(null);
  const [idempotencyKey] = useState(
    () => `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  const autoDateThai = useMemo(() => formatThaiDate(new Date()), []);

  const rajaProduct = useMemo(
    () =>
      products.find((p) => p.code === 'ช1' || p.requiresNumberSelection) ||
      null,
    [products]
  );

  const calculation = useMemo(() => {
    return calculateOrderTotals(
      cart,
      products,
      deliveryMethod === 'pickup_bpp' ? 0 : siteConfig.standardShippingFee,
      siteConfig.freeShippingThreshold
    );
  }, [cart, products, siteConfig, deliveryMethod]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg(null);
    const cleanOrg = organization.trim();

    const effectiveAddress =
      deliveryMethod === 'pickup_bpp'
        ? pickupNote.trim()
          ? `มารับเองที่ บช.ตชด. (กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ 10400) — หมายเหตุ: ${pickupNote.trim()}`
          : 'มารับเองที่ บช.ตชด. (กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ 10400)'
        : shippingAddress.trim();

    const effectivePostal =
      deliveryMethod === 'pickup_bpp' ? '10400' : postalCode.trim();

    const effectiveTransferRef =
      paymentMethod === 'bank_transfer'
        ? transferSlipRef.trim()
          ? `${selectedBank} (${transferSlipRef.trim()})`
          : selectedBank
        : transferSlipRef.trim()
        ? `PromptPay QR (${transferSlipRef.trim()})`
        : 'PromptPay QR';

    const check = validateCheckoutForm({
      customerName,
      organization: cleanOrg,
      customerPhone,
      deliveryMethod,
      shippingAddress: effectiveAddress,
      postalCode: effectivePostal,
      paymentMethod,
      transferReference: effectiveTransferRef,
    });

    if (!check.valid) {
      setFieldErrors(check.fieldErrors as Record<string, string>);
      setErrorMsg(
        deliveryMethod === 'shipping'
          ? 'กรุณากรอกข้อมูลผู้จอง และระบุที่อยู่จัดส่งพร้อมรหัสไปรษณีย์ 5 หลักให้ครบถ้วน'
          : 'กรุณากรอกข้อมูลผู้จอง (ชื่อผู้จอง, หน่วยงาน, เบอร์โทรศัพท์) ให้ครบถ้วน'
      );
      return;
    }

    if (!calculation.valid) {
      setErrorMsg(
        calculation.errors[0] || 'กรุณาตรวจสอบรายการในตะกร้าก่อนยืนยันใบจอง'
      );
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerName: customerName.trim(),
          organization: cleanOrg,
          customerPhone: customerPhone.trim(),
          deliveryMethod,
          shippingAddress: effectiveAddress,
          postalCode: effectivePostal,
          paymentMethod,
          transferReference: effectiveTransferRef,
          sessionId,
          idempotencyKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'ไม่สามารถบันทึกใบจองได้');
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setSubmitting(false);
        return;
      }

      const createdOrder: PublicTrackedOrder = data.order;

      // Also persist to Firebase Firestore transactionally for real-time cross-client sync
      const fullRecordForFirestore: OrderRecord = {
        id: `ord-${Date.now()}`,
        orderNumber: createdOrder.orderNumber,
        createdAt: createdOrder.createdAt,
        reservationDateThai:
          createdOrder.reservationDateThai || autoDateThai,
        customerName: customerName.trim(),
        organization: cleanOrg,
        customerPhone: customerPhone.trim(),
        shippingAddress: effectiveAddress,
        postalCode: effectivePostal,
        paymentMethod,
        items: createdOrder.items,
        selectedNumbers: createdOrder.selectedNumbers,
        subtotal: createdOrder.subtotal,
        shippingTotal: createdOrder.shippingTotal,
        grandTotal: createdOrder.grandTotal,
        grandTotalThaiText:
          createdOrder.grandTotalThaiText ||
          numberToThaiBahtText(createdOrder.grandTotal),
        paymentStatus: createdOrder.paymentStatus,
        preparationStatus: createdOrder.preparationStatus,
        shippingStatus: createdOrder.shippingStatus,
        statusHistory: createdOrder.statusHistory,
        sessionId,
        isDemoOrder: false,
      };

      void confirmOrderInFirestoreTransaction(
        fullRecordForFirestore,
        createdOrder.selectedNumbers || [],
        sessionId
      );

      setConfirmedOrder({
        ...createdOrder,
        customerName: customerName.trim(),
        organization: cleanOrg,
        customerPhone: customerPhone.trim(),
        deliveryMethod,
        shippingAddress: effectiveAddress,
        postalCode: effectivePostal,
        transferReference: effectiveTransferRef,
        reservationDateThai:
          createdOrder.reservationDateThai || autoDateThai,
        grandTotalThaiText:
          createdOrder.grandTotalThaiText ||
          numberToThaiBahtText(createdOrder.grandTotal),
      });
      onOrderCreated(createdOrder, data.rajaSlots, data.products);
      onClearCart(true);
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  // Post-Order Printable / PDF Reservation Summary Slip
  if (confirmedOrder) {
    const slipTotalThaiText =
      confirmedOrder.grandTotalThaiText ||
      numberToThaiBahtText(confirmedOrder.grandTotal);
    const slipDateThai =
      confirmedOrder.reservationDateThai ||
      formatThaiDate(confirmedOrder.createdAt);

    return (
      <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Action Bar (Hidden when printing) */}
          <div className="no-print sacred-shrine-pedestal rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border border-[#FCE694]/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#221A0E] border border-[#FCE694] text-[#FCE694] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-300">
                  ยืนยันการสั่งจองและล็อกสต็อก/หมายเลขเรียบร้อยแล้ว
                </p>
                <h1 className="font-serif-heritage text-xl sm:text-2xl font-bold text-[#FCE694]">
                  เลขที่ใบจอง: {confirmedOrder.orderNumber}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl btn-sacred-gold font-bold text-xs sm:text-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบจอง / บันทึกเป็น PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onGoToTracking(confirmedOrder.orderNumber)}
                className="px-4 py-2.5 rounded-xl bg-[#221A0E] border border-[#C9A45C]/70 text-[#FCE694] text-xs font-bold hover:border-[#FCE694]"
              >
                ตรวจสอบสถานะใบจอง →
              </button>
            </div>
          </div>

          {/* Printable Formal Reservation Slip (ใบจองวัตถุมงคล) */}
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
                  {confirmedOrder.orderNumber}
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
                  {confirmedOrder.customerName || confirmedOrder.maskedCustomerName}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[#787062]">
                  หน่วยงาน / สังกัด
                </span>
                <span className="font-bold text-[#18140E] text-sm sm:text-base">
                  {confirmedOrder.organization || 'ประชาชนทั่วไป'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-[#787062]">
                  เบอร์โทรศัพท์
                </span>
                <span className="font-tabular font-bold text-[#18140E] text-sm sm:text-base">
                  {confirmedOrder.customerPhone || confirmedOrder.maskedPhone}
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
                    {resolveOrderDeliveryMethod(confirmedOrder) === 'pickup_bpp'
                      ? 'มารับเองที่ บช.ตชด.'
                      : 'จัดส่งทางไปรษณีย์ (EMS)'}
                  </span>
                </div>
                <p className="font-semibold text-[#18140E]">
                  {confirmedOrder.shippingAddress ||
                    (resolveOrderDeliveryMethod(confirmedOrder) === 'pickup_bpp'
                      ? 'กองบัญชาการตำรวจตระเวนชายแดน (บช.ตชด.) ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400'
                      : '-')}
                  {resolveOrderDeliveryMethod(confirmedOrder) === 'shipping' &&
                    confirmedOrder.postalCode &&
                    !String(confirmedOrder.shippingAddress || '').includes(
                      confirmedOrder.postalCode
                    ) &&
                    ` (รหัสไปรษณีย์ ${confirmedOrder.postalCode})`}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="block text-[11px] font-semibold text-[#787062]">
                  ช่องทางชำระเงินที่เลือก
                </span>
                <span className="font-bold text-[#8A6D2F]">
                  {confirmedOrder.paymentMethod === 'promptpay'
                    ? 'สแกน QR พร้อมเพย์ (PromptPay)'
                    : `โอนผ่านบัญชีธนาคาร (${confirmedOrder.transferReference || siteConfig.paymentChannels.bankName})`}
                </span>
              </div>
            </div>

            {/* Selected Numbers Highlight (if ช1 was booked) */}
            {confirmedOrder.selectedNumbers &&
              confirmedOrder.selectedNumbers.length > 0 && (
                <div className="bg-[#18140E] text-[#FCE694] border border-[#C9A45C] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#E5C158] block">
                      หมายเลขประจำชุด ช1 ชุดทองคำใหญ่ราชาฤกษ์ (1–99) ที่ได้รับสิทธิ์:
                    </span>
                    <p className="text-base sm:text-lg font-tabular font-bold text-[#FCE694] mt-0.5">
                      {confirmedOrder.selectedNumbers
                        .map((n) => `หมายเลข #${String(n).padStart(2, '0')}`)
                        .join(' , ')}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-[#2C2111] border border-[#FCE694] text-xs font-bold">
                    รวม {confirmedOrder.selectedNumbers.length} ชุด
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
                  {confirmedOrder.items.map((item, idx) => (
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
                  ฿{confirmedOrder.grandTotal.toLocaleString()} บาท
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
                <p>สถานะใบจอง: รอตรวจสอบหลักฐานการชำระเงิน</p>
              </div>

              <div className="flex flex-col sm:items-end justify-end space-y-1">
                <p className="font-bold text-[#18140E]">
                  กองบัญชาการตำรวจตระเวนชายแดน
                </p>
                <p>{siteConfig.contactAddress}</p>
                <p>โทร. {siteConfig.contactPhone}</p>
              </div>
            </div>
          </div>

          <div className="no-print flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={onContinueShopping}
              className="px-5 py-2.5 border border-[#C9A45C]/65 text-[#FCE694] text-xs font-bold rounded-xl hover:bg-[#221A0E]"
            >
              ← กลับสู่หน้าใบรายการวัตถุมงคล
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-2.5 btn-sacred-gold text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบจอง / บันทึกเป็น PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {cart.length === 0 ? (
          <div className="sacred-shrine-pedestal rounded-2xl p-12 text-center space-y-5">
            <Package className="w-12 h-12 text-[#FCE694] mx-auto stroke-[1.5]" />
            <h1 className="font-serif-heritage text-2xl font-bold text-[#FCE694]">
              ยังไม่มีรายการวัตถุมงคลในใบจอง
            </h1>
            <p className="text-sm text-[#F7F2E8]/80 max-w-lg mx-auto">
              ท่านสามารถเลือกชุดทองคำใหญ่ราชาฤกษ์ (ช1 เลือกหมายเลข 1–99), ชุดยกกล่อง 100 องค์ (ช2), ชุดกรรมการ 5 องค์ (ช3) หรือรายการเดี่ยว ชศ1–ชศ20 ได้จากหน้าใบรายการ
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onContinueShopping}
                className="px-6 py-3 rounded-xl btn-sacred-gold font-bold text-sm"
              >
                ไปที่หน้าใบรายการวัตถุมงคล (ครบ 23 รหัส)
              </button>
              {rajaProduct && (
                <button
                  type="button"
                  onClick={() => setShowRajaModal(true)}
                  className="px-5 py-3 rounded-xl bg-[#221A0E] border border-[#FCE694] text-[#FCE694] font-bold text-sm flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  <span>เลือกหมายเลข 1–99 ชุดทองคำใหญ่ราชาฤกษ์ (ช1)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* SECTION A: CART & TOTAL IN NUMERIC + THAI TEXT */}
            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#C9A45C]/30 pb-4">
                <div>
                  <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wider">
                    OFFICIAL RESERVATION FORM · สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.
                  </span>
                  <h1 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-gold-shimmer">
                    ตะกร้าสั่งจองและฟอร์มใบจองวัตถุมงคล
                  </h1>
                </div>

                {rajaProduct && (
                  <button
                    type="button"
                    onClick={() => setShowRajaModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#221A0E] border border-[#FCE694]/70 text-[#FCE694] text-xs font-bold flex items-center gap-2 hover:bg-[#2E2312]"
                  >
                    <Grid className="w-4 h-4" />
                    <span>
                      เลือก/แก้ไขหมายเลข 1–99 ชุดทองคำใหญ่ราชาฤกษ์ (ช1)
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Cart Items */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="sacred-shrine-pedestal rounded-2xl p-5 divide-y divide-[#C9A45C]/25">
                    {cart.map((cartItem) => {
                      const product = products.find(
                        (p) => p.id === cartItem.productId
                      );
                      if (!product) return null;

                      const isRaja = Boolean(product.requiresNumberSelection);
                      const nums = cartItem.selectedNumbers || [];

                      return (
                        <div
                          key={cartItem.productId}
                          className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                              <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#C9A45C]/60 shrink-0">
                                <SpecimenPlate
                                  style={product.specimenStyle}
                                  angle="front"
                                  code={product.code}
                                  yearBE={product.yearBE}
                                  imageUrl={product.angles[0]?.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-[#241B10] border border-[#FCE694]/60 text-[11px] font-tabular font-bold text-[#FCE694]">
                                    {product.code}
                                  </span>
                                  <span className="text-xs text-[#E5C158]">
                                    {product.categoryLabel}
                                  </span>
                                </div>
                                <h2 className="font-serif-heritage text-base font-bold text-[#FFFFFF] mt-0.5">
                                  {product.name}
                                </h2>
                                <p className="text-xs text-[#E5C158]/85 font-tabular">
                                  ราคาต่อหน่วย ฿{product.price.toLocaleString()}{' '}
                                  บาท
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              {isRaja ? (
                                <button
                                  type="button"
                                  onClick={() => setShowRajaModal(true)}
                                  className="px-3 py-1.5 rounded-lg bg-[#221A0E] border border-[#FCE694] text-xs font-bold text-[#FCE694] hover:bg-[#302413]"
                                >
                                  เลือกเลข ({nums.length} ชุด)
                                </button>
                              ) : (
                                <div className="flex items-center border border-[#C9A45C]/50 rounded-lg bg-[#110D08]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateQty(
                                        product.id,
                                        Math.max(1, cartItem.quantity - 1)
                                      )
                                    }
                                    aria-label={`ลดจำนวน ${product.name}`}
                                    className="p-2 text-[#FCE694] hover:bg-[#221A0E]"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={
                                      product.isMadeToOrder
                                        ? 999
                                        : product.stock
                                    }
                                    value={cartItem.quantity}
                                    onChange={(e) => {
                                      const val = Number(e.target.value) || 1;
                                      const maxAllowed = product.isMadeToOrder
                                        ? 999
                                        : product.stock;
                                      onUpdateQty(
                                        product.id,
                                        Math.max(1, Math.min(maxAllowed, val))
                                      );
                                    }}
                                    className="w-12 text-center bg-transparent font-tabular text-sm font-bold text-[#FCE694] focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    disabled={
                                      !product.isMadeToOrder &&
                                      cartItem.quantity >= product.stock
                                    }
                                    onClick={() =>
                                      onUpdateQty(
                                        product.id,
                                        product.isMadeToOrder
                                          ? cartItem.quantity + 1
                                          : Math.min(
                                              product.stock,
                                              cartItem.quantity + 1
                                            )
                                      )
                                    }
                                    aria-label={`เพิ่มจำนวน ${product.name}`}
                                    className="p-2 text-[#FCE694] hover:bg-[#221A0E] disabled:opacity-40"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <span className="font-tabular text-base font-bold text-[#FCE694] min-w-[95px] text-right">
                                ฿
                                {(
                                  product.price *
                                  (isRaja
                                    ? Math.max(1, nums.length)
                                    : cartItem.quantity)
                                ).toLocaleString()}
                              </span>

                              <button
                                type="button"
                                onClick={() => onRemoveItem(product.id)}
                                aria-label={`ลบ ${product.name}`}
                                className="p-1.5 text-[#E5C158]/70 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isRaja && (
                            <div className="rounded-xl bg-[#110D08] border border-[#C9A45C]/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-[#E5C158] font-semibold">
                                หมายเลขชุดทองคำใหญ่ราชาฤกษ์ (1–99) ที่เลือก:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {nums.map((n) => (
                                  <span
                                    key={n}
                                    className="px-2.5 py-0.5 rounded bg-[#281E10] border border-[#FCE694] font-tabular font-bold text-[#FCE694]"
                                  >
                                    #{String(n).padStart(2, '0')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 5 Cols: สรุปยอดรวมตัวเลข และตัวอักษรไทย */}
                <div className="lg:col-span-5 sacred-shrine-pedestal rounded-2xl p-6 space-y-4 border border-[#FCE694]/50">
                  <div className="flex items-center justify-between border-b border-[#C9A45C]/30 pb-3">
                    <h2 className="font-serif-heritage text-lg font-bold text-[#FCE694]">
                      สรุปยอดรวมใบจองวัตถุมงคล
                    </h2>
                    <span className="text-xs font-tabular text-[#E5C158]">
                      รวม {calculation.totalQuantity} รายการ
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[#F7F2E8]/85">
                        ยอดรวมเป็นตัวเลข:
                      </span>
                      <span
                        data-testid="cart-grand-total-numeric"
                        className="font-tabular text-2xl sm:text-3xl font-bold text-[#FCE694]"
                      >
                        ฿{calculation.grandTotal.toLocaleString()} บาท
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#110D08] border border-[#FCE694]/55 p-3.5 space-y-1">
                      <span className="text-[11px] text-[#E5C158] font-semibold block">
                        ยอดรวมเป็นตัวอักษรไทย:
                      </span>
                      <p
                        data-testid="cart-grand-total-thai-text"
                        className="font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694]"
                      >
                        ({calculation.grandTotalThaiText})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION B: ฟอร์มจอง (ชื่อผู้จอง, หน่วยงาน, เบอร์โทรศัพท์, วันที่อัตโนมัติ) */}
            <section
              id="checkout-step-form"
              className="pt-6 border-t border-[#C9A45C]/30 space-y-6"
            >
              <form
                onSubmit={handleSubmitOrder}
                noValidate
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* Left 7 Cols: ฟอร์มจอง */}
                <div className="lg:col-span-7 sacred-shrine-pedestal rounded-2xl p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between border-b border-[#C9A45C]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#FCE694]" />
                      <h2 className="font-serif-heritage text-xl font-bold text-[#FCE694]">
                        ฟอร์มจองวัตถุมงคล
                      </h2>
                    </div>
                    <span className="text-xs text-[#E5C158]">
                      กรอกข้อมูลผู้จองเพื่อออกเลขที่ใบจองอัตโนมัติ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-semibold text-[#FCE694] mb-1"
                      >
                        ชื่อผู้จอง (ยศ / ชื่อ–นามสกุล) *
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="เช่น พ.ต.อ. สมชาย พิทักษ์แดนไทย"
                        className="w-full px-3.5 py-2.5 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                      />
                      {fieldErrors.customerName && (
                        <p className="text-xs text-red-300 mt-1">
                          {fieldErrors.customerName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-organization"
                        className="block text-xs font-semibold text-[#FCE694] mb-1"
                      >
                        หน่วยงาน / สังกัด *
                      </label>
                      <input
                        id="checkout-organization"
                        type="text"
                        required
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="เช่น กก.ตชด.32 / บช.ตชด. / ประชาชนทั่วไป"
                        className="w-full px-3.5 py-2.5 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                      />
                      {fieldErrors.organization && (
                        <p className="text-xs text-red-300 mt-1">
                          {fieldErrors.organization}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-semibold text-[#FCE694] mb-1"
                      >
                        เบอร์โทรศัพท์ *
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="081-234-5678"
                        className="w-full px-3.5 py-2.5 text-sm font-tabular border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                      />
                      {fieldErrors.customerPhone && (
                        <p className="text-xs text-red-300 mt-1">
                          {fieldErrors.customerPhone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-autodate"
                        className="block text-xs font-semibold text-[#FCE694] mb-1"
                      >
                        วันที่จอง (อัตโนมัติ)
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#FCE694] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="checkout-autodate"
                          type="text"
                          readOnly
                          value={autoDateThai}
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm font-bold border border-[#C9A45C]/45 rounded-xl bg-[#18120A] text-[#FCE694] cursor-default"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ตัวเลือกวิธีการรับวัตถุมงคล: มารับเองที่ บช.ตชด. หรือ จัดส่งทางไปรษณีย์ */}
                  <div className="pt-3 border-t border-[#C9A45C]/25 space-y-3">
                    <label className="block text-xs sm:text-sm font-bold text-[#FCE694]">
                      เลือกรูปแบบการรับวัตถุมงคล *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('pickup_bpp');
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.shippingAddress;
                            delete next.postalCode;
                            return next;
                          });
                        }}
                        className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                          deliveryMethod === 'pickup_bpp'
                            ? 'bg-[#221A0E] border-2 border-[#FCE694] shadow-md'
                            : 'bg-[#110D08] border-[#C9A45C]/40 hover:border-[#C9A45C]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            deliveryMethod === 'pickup_bpp'
                              ? 'bg-[#FCE694] text-[#14100A]'
                              : 'bg-[#1C150B] text-[#E5C158]'
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#FCE694]">
                              มารับเองที่ บช.ตชด.
                            </span>
                            {deliveryMethod === 'pickup_bpp' && (
                              <CheckCircle2 className="w-4 h-4 text-[#FCE694] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#F7F2E8]/80 leading-relaxed">
                            รับด้วยตนเอง ณ กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ (ไม่มีค่าจัดส่ง)
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('shipping');
                          if (postalCode === '10400' && !shippingAddress) {
                            setPostalCode('');
                          }
                        }}
                        className={`text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                          deliveryMethod === 'shipping'
                            ? 'bg-[#221A0E] border-2 border-[#FCE694] shadow-md'
                            : 'bg-[#110D08] border-[#C9A45C]/40 hover:border-[#C9A45C]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            deliveryMethod === 'shipping'
                              ? 'bg-[#FCE694] text-[#14100A]'
                              : 'bg-[#1C150B] text-[#E5C158]'
                          }`}
                        >
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#FCE694]">
                              จัดส่งทางไปรษณีย์ (EMS)
                            </span>
                            {deliveryMethod === 'shipping' && (
                              <CheckCircle2 className="w-4 h-4 text-[#FCE694] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[#F7F2E8]/80 leading-relaxed">
                            จัดส่งพัสดุด่วนพิเศษพร้อมกล่องนิรภัยตามที่อยู่ที่ท่านระบุ
                          </p>
                        </div>
                      </button>
                    </div>

                    {deliveryMethod === 'pickup_bpp' ? (
                      <div className="rounded-xl bg-[#141009] border border-[#C9A45C]/50 p-4 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-[#F7F2E8]/90">
                          <MapPin className="w-4 h-4 text-[#FCE694] shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#FCE694]">
                              สถานที่รับวัตถุมงคล: กองบัญชาการตำรวจตระเวนชายแดน (บช.ตชด.)
                            </p>
                            <p className="text-[#F7F2E8]/80">
                              {siteConfig.contactAddress} · โทร. {siteConfig.contactPhone}
                            </p>
                            <p className="text-[11px] text-[#E5C158]">
                              นำเลขที่ใบจองหรือเอกสารใบจอง (PDF) มาแสดงต่อเจ้าหน้าที่เพื่อรับวัตถุมงคล
                            </p>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="checkout-pickup-note"
                            className="block text-xs font-semibold text-[#E5C158] mb-1"
                          >
                            หมายเหตุเพิ่มเติมสำหรับการมารับเอง (ระบุหรือไม่ก็ได้)
                          </label>
                          <input
                            id="checkout-pickup-note"
                            type="text"
                            value={pickupNote}
                            onChange={(e) => setPickupNote(e.target.value)}
                            placeholder="เช่น มารับในนามหน่วยงาน / ช่วงวันที่คาดว่าจะเข้ามารับ"
                            className="w-full px-3.5 py-2 text-sm border border-[#C9A45C]/50 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-[#141009] border border-[#C9A45C]/50 p-4 space-y-3">
                        <div>
                          <label
                            htmlFor="checkout-address"
                            className="block text-xs font-semibold text-[#FCE694] mb-1"
                          >
                            ที่อยู่สำหรับจัดส่งทางไปรษณีย์ (บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด) *
                          </label>
                          <textarea
                            id="checkout-address"
                            rows={2}
                            required
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="เช่น 123/45 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร"
                            className="w-full px-3.5 py-2.5 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                          />
                          {fieldErrors.shippingAddress && (
                            <p className="text-xs text-red-300 mt-1">
                              {fieldErrors.shippingAddress}
                            </p>
                          )}
                        </div>

                        <div className="max-w-xs">
                          <label
                            htmlFor="checkout-postal"
                            className="block text-xs font-semibold text-[#FCE694] mb-1"
                          >
                            รหัสไปรษณีย์ 5 หลัก *
                          </label>
                          <input
                            id="checkout-postal"
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            required
                            value={postalCode}
                            onChange={(e) =>
                              setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                            }
                            placeholder="10400"
                            className="w-full px-3.5 py-2 text-sm font-tabular border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                          />
                          {fieldErrors.postalCode && (
                            <p className="text-xs text-red-300 mt-1">
                              {fieldErrors.postalCode}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 5 Cols: ช่องทางการชำระเงิน & ปุ่มยืนยันใบจอง */}
                <div className="lg:col-span-5 sacred-shrine-pedestal rounded-2xl p-6 space-y-5">
                  <h2 className="font-serif-heritage text-xl font-bold text-[#FCE694]">
                    ช่องทางการชำระเงินและยืนยันใบจอง
                  </h2>

                  <div
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      paymentMethod === 'promptpay'
                        ? 'border-[#FCE694] bg-[#18120A]'
                        : 'border-[#C9A45C]/40 bg-[#110D08]/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-[#F7F2E8]">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="promptpay"
                          checked={paymentMethod === 'promptpay'}
                          onChange={() => setPaymentMethod('promptpay')}
                          className="accent-[#FCE694] w-4 h-4"
                        />
                        <span>พร้อมเพย์ (PromptPay QR)</span>
                      </label>

                      <div className="w-14 h-14 rounded-lg border border-[#FCE694]/70 bg-[#1C160C] p-1.5 flex flex-col items-center justify-center shrink-0">
                        <QrCode className="w-10 h-10 text-[#FCE694]" />
                      </div>
                    </div>

                    {paymentMethod === 'promptpay' && (
                      <div className="rounded-lg bg-[#110D08] border border-[#C9A45C]/40 p-3 text-xs space-y-1">
                        <p className="text-[#E5C158]">
                          รหัสพร้อมเพย์หน่วยการเงิน บช.ตชด.:{' '}
                          <strong className="font-tabular text-[#FCE694]">
                            {siteConfig.paymentChannels.promptPayId}
                          </strong>
                        </p>
                        <p className="text-[#F7F2E8]/80">
                          ชื่อบัญชี: {siteConfig.paymentChannels.accountName}
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#FCE694] bg-[#18120A]'
                        : 'border-[#C9A45C]/40 bg-[#110D08]/90'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-[#F7F2E8]">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="accent-[#FCE694] w-4 h-4"
                      />
                      <span>โอนผ่านบัญชีธนาคาร ({siteConfig.paymentChannels.bankName})</span>
                    </label>

                    {paymentMethod === 'bank_transfer' && (
                      <div className="rounded-lg bg-[#110D08] border border-[#C9A45C]/40 p-3 text-xs space-y-2">
                        <p className="text-[#FCE694] font-bold">
                          {siteConfig.paymentChannels.bankName} · เลขที่บัญชี{' '}
                          <span className="font-tabular underline">
                            {siteConfig.paymentChannels.accountNumber}
                          </span>
                        </p>
                        <p className="text-[#F7F2E8]/85">
                          ชื่อบัญชี: {siteConfig.paymentChannels.accountName}
                        </p>
                        <div>
                          <label
                            htmlFor="checkout-bank-select"
                            className="block text-[11px] text-[#E5C158] mb-1"
                          >
                            ธนาคารต้นทางที่โอน:
                          </label>
                          <select
                            id="checkout-bank-select"
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#18120A] border border-[#C9A45C]/50 text-[#F7F2E8] text-xs"
                          >
                            <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                            <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                            <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                            <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                            <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                            <option value="ธนาคารทหารไทยธนชาต (ttb)">ธนาคารทหารไทยธนชาต (ttb)</option>
                            <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-transfer-ref"
                      className="block text-xs font-semibold text-[#E5C158] mb-1"
                    >
                      เลขอ้างอิงสลิป / เวลาที่โอนเงิน (ระบุเพื่อความรวดเร็วในการตรวจสอบ)
                    </label>
                    <input
                      id="checkout-transfer-ref"
                      type="text"
                      value={transferSlipRef}
                      onChange={(e) => setTransferSlipRef(e.target.value)}
                      placeholder="เช่น โอนเวลา 14:30 น. / เลขท้ายสลิป 4 ตัว"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-[#C9A45C]/50 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                    />
                  </div>

                  {/* Live Summary Box inside Form */}
                  <div className="rounded-xl bg-[#110D08] border border-[#C9A45C]/50 p-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-[#F7F2E8]/85">
                      <span>วิธีรับวัตถุมงคล:</span>
                      <span className="font-bold text-[#FCE694]">
                        {deliveryMethod === 'pickup_bpp'
                          ? 'มารับเองที่ บช.ตชด. (ฟรี)'
                          : 'จัดส่งทางไปรษณีย์ (EMS)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#E5C158]">
                      <span>ยอดรวมเป็นตัวเลข:</span>
                      <span className="font-tabular font-bold text-base text-[#FCE694]">
                        ฿{calculation.grandTotal.toLocaleString()} บาท
                      </span>
                    </div>
                    <div className="text-xs text-[#F7F2E8]/90">
                      <span className="text-[#E5C158]">ตัวอักษรไทย: </span>
                      <strong className="text-[#FCE694]">
                        ({calculation.grandTotalThaiText})
                      </strong>
                    </div>
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="p-3 rounded-xl bg-red-950/60 border border-red-400/50 text-xs text-red-200 flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={submitting || !calculation.valid}
                      className="w-full py-3.5 px-6 rounded-xl btn-sacred-gold disabled:opacity-50 font-bold text-base transition-all"
                    >
                      {submitting
                        ? 'กำลังสร้างเลขที่ใบจองอัตโนมัติ...'
                        : 'ยืนยันการจองและออกใบจอง (PDF)'}
                    </button>
                    <p className="text-center text-[11px] text-[#E5C158]/80">
                      เมื่อกดยืนยัน ระบบจะออกเลขที่ใบจองอัตโนมัติ และแสดงใบสรุปสำหรับพิมพ์หรือบันทึกเป็น PDF ทันที
                    </p>
                  </div>
                </div>
              </form>
            </section>
          </>
        )}
      </div>

      {showRajaModal && rajaProduct && (
        <RajaNumberGridModal
          mode="modal"
          product={rajaProduct}
          rajaSlots={rajaSlots}
          sessionId={sessionId}
          selectedNumbers={selectedRajaNumbers}
          onToggleSlot={onToggleRajaSlot}
          onClose={() => setShowRajaModal(false)}
          onConfirmProceed={() => setShowRajaModal(false)}
        />
      )}
    </div>
  );
};
