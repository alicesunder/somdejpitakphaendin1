import { BOOKING_CLOSED_MESSAGE, SALES_PAUSED_MESSAGE, isBookingOpen } from '../config/booking';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  ImagePlus,
  Grid,
  MapPin,
  Minus,
  Package,
  Plus,
  QrCode,
  RefreshCw,
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
  validateCheckoutForm,
} from '../utils/commerceRules';
import { compressSlipImage } from '../utils/slipImage';
import { OrderCelebration } from './OrderCelebration';
import { fetchWithConflictRetry } from '../utils/conflictRetry';
import { SpecimenPlate } from './SacredArtwork';
import { RajaNumberGridModal } from './RajaNumberGridModal';
import LineContact from './LineContact';

interface CartCheckoutViewProps {
  bookingOpen: boolean;
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
  bookingOpen,
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
  const [customerEmail, setCustomerEmail] = useState('');
  // The transfer slip is required before the reservation can be submitted.
  const [slipImage, setSlipImage] = useState('');
  const [slipError, setSlipError] = useState('');
  const [slipTime, setSlipTime] = useState('');
  const slipInputRef = React.useRef<HTMLInputElement>(null);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup_bpp');
  const [shippingAddress, setShippingAddress] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [postalCode, setPostalCode] = useState('10400');
  const promptPayOn = siteConfig.paymentChannels.enablePromptPay !== false;
  const bankOn = siteConfig.paymentChannels.enableBankTransfer !== false || !promptPayOn;
  const [paymentMethod, setPaymentMethod] = useState<
    'promptpay' | 'bank_transfer'
  >(() => (promptPayOn ? 'promptpay' : 'bank_transfer'));
  // Settings arrive after the first render; never leave a switched-off channel selected.
  useEffect(() => {
    if (paymentMethod === 'promptpay' && !promptPayOn) setPaymentMethod('bank_transfer');
    if (paymentMethod === 'bank_transfer' && !bankOn) setPaymentMethod('promptpay');
  }, [paymentMethod, promptPayOn, bankOn]);
  const [selectedBank, setSelectedBank] = useState('ธนาคารกรุงไทย');
  const [showRajaModal, setShowRajaModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmedOrder, setConfirmedOrder] =
    useState<PublicTrackedOrder | null>(null);
  const [celebrating, setCelebrating] = useState(false);
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

  const handlePickSlip = async (file: File | undefined) => {
    setSlipError('');
    if (!file) return;
    try {
      setSlipImage(await compressSlipImage(file));
    } catch (err) {
      setSlipImage('');
      setSlipError(err instanceof Error ? err.message : 'เลือกไฟล์ไม่สำเร็จ');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!bookingOpen) {
      setErrorMsg(isBookingOpen() ? SALES_PAUSED_MESSAGE : BOOKING_CLOSED_MESSAGE);
      return;
    }
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
      paymentMethod === 'bank_transfer' ? selectedBank : 'PromptPay QR';

    const check = validateCheckoutForm({
      customerName,
      organization: cleanOrg,
      customerPhone,
      customerEmail,
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
          : 'กรุณากรอกข้อมูลผู้จอง (ชื่อผู้จอง, หน่วยงาน, เบอร์โทรศัพท์, อีเมล) ให้ครบถ้วน'
      );
      return;
    }

    if (!calculation.valid) {
      setErrorMsg(
        calculation.errors[0] || 'กรุณาตรวจสอบรายการในตะกร้าก่อนยืนยันใบจอง'
      );
      return;
    }

    if (!slipImage) {
      setSlipError('กรุณาแนบสลิปการโอนเงิน');
      setErrorMsg('กรุณาโอนเงินและแนบสลิปการโอนก่อนกดสั่งจอง');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // Same idempotency key on every retry, so a booking can never be created twice.
      const response = await fetchWithConflictRetry('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerName: customerName.trim(),
          organization: cleanOrg,
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          deliveryMethod,
          shippingAddress: effectiveAddress,
          postalCode: effectivePostal,
          paymentMethod,
          transferReference: effectiveTransferRef,
          sessionId,
          idempotencyKey,
          slip: {
            image: slipImage,
            transferAmount: calculation.grandTotal,
            transferTime: slipTime.trim(),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'ไม่สามารถบันทึกใบจองได้');
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          if (data.fieldErrors.slip) setSlipError(data.fieldErrors.slip);
        }
        setSubmitting(false);
        return;
      }

      const createdOrder: PublicTrackedOrder = data.order;

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
      setCelebrating(true);
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
    return (
      <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 px-4 sm:px-6">
        {celebrating && (
          <OrderCelebration
            orderNumber={confirmedOrder.orderNumber}
            onClose={() => setCelebrating(false)}
          />
        )}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Action Bar (Hidden when printing) */}
          <div className="no-print sacred-shrine-pedestal rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border border-[#FCE694]/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#221A0E] border border-[#FCE694] text-[#FCE694] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-300">
                  รับคำสั่งจองและล็อกสต็อก/หมายเลขเรียบร้อยแล้ว
                </p>
                <h1 className="font-serif-heritage text-xl sm:text-2xl font-bold text-[#FCE694]">
                  เลขที่คำสั่งจอง: {confirmedOrder.orderNumber}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onGoToTracking(confirmedOrder.orderNumber)}
                className="px-4 py-2.5 rounded-xl bg-[#221A0E] border border-[#C9A45C]/70 text-[#FCE694] text-xs font-bold hover:border-[#FCE694]"
              >
                ตรวจสอบสถานะใบจอง →
              </button>
            </div>
          </div>

          <div
            role="status"
            className="no-print rounded-2xl border border-emerald-400/50 bg-emerald-950/40 p-5 flex items-start gap-3 text-emerald-100"
          >
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-300" />
            <div className="text-sm space-y-1">
              <p className="font-bold">ได้รับสลิปการโอนเงินแล้ว — รอเจ้าหน้าที่ตรวจสอบ</p>
              <p className="text-xs text-emerald-100/80">
                ยอด ฿{confirmedOrder.grandTotal.toLocaleString()} · ปกติตรวจสอบภายใน 1 วันทำการ
                หากแนบสลิปผิด แนบใหม่ได้ที่เมนู “ตรวจสอบสถานะ”
              </p>
            </div>
          </div>

          <section
            aria-labelledby="receipt-next"
            className="no-print rounded-2xl border border-[#C9A45C]/60 bg-[#110D08]/90 p-5 sm:p-6 space-y-3"
          >
            <h2 id="receipt-next" className="font-serif-heritage text-lg font-bold text-[#FCE694] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              ใบจองจะได้รับหลังเจ้าหน้าที่ตรวจสอบสลิป
            </h2>
            <p className="text-sm text-[#F7F2E8]/85 leading-relaxed">
              เมื่อเจ้าหน้าที่ตรวจสอบสลิปแล้ว จะส่งใบจองที่ลงนามโดยเจ้าหน้าที่ไปที่อีเมล{' '}
              <strong className="text-[#FCE694] break-all">{customerEmail.trim()}</strong>{' '}
              ติดตามสถานะได้ที่เมนู “ตรวจสอบสถานะ” (ใช้เลขที่คำสั่งจองและเบอร์โทร 4 ตัวท้าย)
            </p>
            <ul className="text-xs text-[#F7F2E8]/80 space-y-1">
              {confirmedOrder.items.map((item, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span>
                    {item.productName.startsWith(item.productCode) ? item.productName : `${item.productCode} ${item.productName}`} × {item.quantity}
                  </span>
                  <span className="font-tabular">฿{item.lineTotal.toLocaleString()}</span>
                </li>
              ))}
              {confirmedOrder.selectedNumbers && confirmedOrder.selectedNumbers.length > 0 && (
                <li className="text-[#E5C158]">
                  หมายเลขที่ล็อกไว้:{' '}
                  {confirmedOrder.selectedNumbers.map((n) => `#${String(n).padStart(2, '0')}`).join(', ')}
                </li>
              )}
            </ul>
          </section>

          <div className="no-print">
            <button
              type="button"
              onClick={onContinueShopping}
              className="px-5 py-2.5 border border-[#C9A45C]/65 text-[#FCE694] text-xs font-bold rounded-xl hover:bg-[#221A0E]"
            >
              ← กลับสู่หน้าใบรายการวัตถุมงคล
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

            <LineContact variant="full" />
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
                        placeholder="เช่น ส.ต.ต. ชัยโรจน์ สหัสภูริพัฒน์"
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
                        placeholder="เช่น กก.ตชด.31 / บช.ตชด. / ประชาชนทั่วไป"
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
                        placeholder="0656541786"
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

                  <div>
                    <label
                      htmlFor="checkout-email"
                      className="block text-xs font-semibold text-[#FCE694] mb-1"
                    >
                      อีเมล (สำหรับรับใบจอง) *
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      maxLength={120}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="เช่น name@gmail.com"
                      className="w-full px-3.5 py-2.5 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                    />
                    {fieldErrors.customerEmail ? (
                      <p className="text-xs text-red-300 mt-1">{fieldErrors.customerEmail}</p>
                    ) : (
                      <p className="text-[11px] text-[#E5C158]/80 mt-1">
                        เจ้าหน้าที่จะส่งใบจองที่ลงนามแล้วไปที่อีเมลนี้ หลังตรวจสอบสลิปการโอน
                      </p>
                    )}
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
                            {siteConfig.standardShippingFee > 0 && (
                              <span className="text-xs font-bold font-tabular text-[#18140E] bg-[#FCE694] rounded-full px-2 py-0.5">
                                +฿{siteConfig.standardShippingFee.toLocaleString()}
                              </span>
                            )}
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

                  {promptPayOn && (
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
                  )}

                  {bankOn && (
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
                  )}

                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      slipError ? 'border-red-400/70 bg-red-950/30' : 'border-[#FCE694] bg-[#18120A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-[#F7F2E8]">แนบสลิปการโอนเงิน *</p>
                      <p className="text-right">
                        <span className="block text-[11px] text-[#E5C158]">ยอดที่ต้องโอน</span>
                        <span className="font-tabular text-lg font-bold text-[#FCE694]">
                          ฿{calculation.grandTotal.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <p className="text-[11px] text-[#F7F2E8]/75">
                      โอนเงินตามยอดเข้าบัญชีด้านบนก่อน แล้วแนบรูปสลิป จึงจะกดสั่งจองได้
                    </p>
                    <input
                      ref={slipInputRef}
                      id="checkout-slip"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => handlePickSlip(e.target.files?.[0])}
                    />
                    {slipImage ? (
                      <div className="flex items-start gap-3">
                        <img
                          src={slipImage}
                          alt="สลิปที่เลือก"
                          className="w-24 max-h-40 object-contain rounded-lg border border-[#C9A45C]/50 bg-white"
                        />
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> แนบสลิปแล้ว
                          </p>
                          <button
                            type="button"
                            onClick={() => slipInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FCE694] underline underline-offset-2 min-h-[40px]"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            เปลี่ยนรูปสลิป
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="checkout-slip"
                        className="flex flex-col items-center justify-center gap-2 min-h-[110px] rounded-xl border-2 border-dashed border-[#C9A45C]/60 hover:bg-[#1C160C] cursor-pointer text-center px-4 py-4"
                      >
                        <ImagePlus className="w-7 h-7 text-[#FCE694]" />
                        <span className="text-sm font-bold text-[#FCE694]">แตะเพื่อเลือกรูปสลิป</span>
                        <span className="text-[11px] text-[#F7F2E8]/70">JPG / PNG / WebP · ระบบย่อขนาดให้อัตโนมัติ</span>
                      </label>
                    )}
                    {slipError && <p className="text-xs text-red-300">{slipError}</p>}
                    <div>
                      <label htmlFor="checkout-slip-time" className="block text-[11px] text-[#E5C158] mb-1">
                        วัน-เวลาที่โอน (ไม่บังคับ)
                      </label>
                      <input
                        id="checkout-slip-time"
                        type="text"
                        maxLength={40}
                        value={slipTime}
                        onChange={(e) => setSlipTime(e.target.value)}
                        placeholder="เช่น 14:30 น. วันนี้"
                        className="w-full px-3 py-2 rounded-lg bg-[#110D08] border border-[#C9A45C]/50 text-[#F7F2E8] text-xs placeholder-[#E5C158]/45"
                      />
                    </div>
                  </div>

                  <ol className="rounded-xl border border-[#C9A45C]/40 bg-[#110D08]/90 p-4 text-xs text-[#F7F2E8]/85 space-y-2 list-none">
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-[#FCE694] text-[#18140E] font-bold flex items-center justify-center text-[11px]">1</span>
                      <span>โอนเงินตามยอดเข้าบัญชีด้านบน</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-[#FCE694] text-[#18140E] font-bold flex items-center justify-center text-[11px]">2</span>
                      <span>แนบรูปสลิปการโอน แล้วกด “ยืนยันการจอง” ระบบออกเลขที่คำสั่งจองและล็อกรายการให้ทันที</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="w-5 h-5 shrink-0 rounded-full bg-[#FCE694] text-[#18140E] font-bold flex items-center justify-center text-[11px]">3</span>
                      <span>เจ้าหน้าที่ตรวจสอบสลิปแล้วจะส่งใบจองให้ทางอีเมล</span>
                    </li>
                  </ol>

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
                    {calculation.shippingTotal > 0 && (
                      <div className="flex justify-between text-xs text-[#F7F2E8]/85">
                        <span>ค่าจัดส่งทางไปรษณีย์:</span>
                        <span className="font-tabular font-bold text-[#FCE694]">
                          +฿{calculation.shippingTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
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
                      disabled={submitting || !calculation.valid || !bookingOpen || !slipImage}
                      className="w-full py-3.5 px-6 rounded-xl btn-sacred-gold disabled:opacity-50 font-bold text-base transition-all"
                    >
                      {!bookingOpen
                        ? isBookingOpen()
                          ? SALES_PAUSED_MESSAGE
                          : BOOKING_CLOSED_MESSAGE
                        : submitting
                        ? 'กำลังส่งคำสั่งจองและสลิป...'
                        : !slipImage
                        ? 'แนบสลิปการโอนก่อนกดสั่งจอง'
                        : 'ยืนยันการจอง'}
                    </button>
                    <p className="text-center text-[11px] text-[#E5C158]/80">
                      ต้องแนบสลิปการโอนก่อนจึงกดสั่งจองได้ · ใบจองจะส่งทางอีเมลหลังเจ้าหน้าที่ตรวจสอบสลิป
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
