import {
  AmuletProduct,
  CartItem,
  OrderLineItem,
  OrderRecord,
  ProductCategory,
  PublicTrackedOrder,
  RajaSetSlot,
} from '../types';

export const HOLD_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

const THAI_DIGITS = [
  'ศูนย์',
  'หนึ่ง',
  'สอง',
  'สาม',
  'สี่',
  'ห้า',
  'หก',
  'เจ็ด',
  'แปด',
  'เก้า',
];

const THAI_POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

function convertSixDigitGroupToThai(num: number): string {
  if (num === 0) return '';
  const digits = String(Math.floor(num)).split('').map(Number);
  const len = digits.length;
  let result = '';

  for (let i = 0; i < len; i++) {
    const d = digits[i];
    const pos = len - 1 - i;
    if (d === 0) continue;

    if (pos === 0 && d === 1 && len > 1) {
      result += 'เอ็ด';
    } else if (pos === 1 && d === 2) {
      result += 'ยี่สิบ';
    } else if (pos === 1 && d === 1) {
      result += 'สิบ';
    } else {
      result += THAI_DIGITS[d] + THAI_POSITIONS[pos];
    }
  }
  return result;
}

function convertIntegerToThaiWords(n: number): string {
  const clean = Math.floor(Math.abs(n));
  if (clean === 0) return 'ศูนย์';

  const groups: number[] = [];
  let rem = clean;
  while (rem > 0) {
    groups.push(rem % 1000000);
    rem = Math.floor(rem / 1000000);
  }

  let output = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp > 0) {
      let groupWords = convertSixDigitGroupToThai(grp);
      // Handle edge case where a lower group is exactly 1 and higher group exists
      if (i < groups.length - 1 && grp === 1) {
        groupWords = 'เอ็ด';
      }
      output += groupWords;
    }
    if (i > 0) {
      output += 'ล้าน';
    }
  }
  return output;
}

/**
 * Converts a numeric THB amount into formal Thai Baht text.
 * Example: 349999 -> "สามแสนสี่หมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทถ้วน"
 */
export function numberToThaiBahtText(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const rounded = Math.round(amount * 100);
  const baht = Math.floor(rounded / 100);
  const satang = rounded % 100;

  const bahtText = baht > 0 ? `${convertIntegerToThaiWords(baht)}บาท` : '';
  if (satang === 0) {
    return `${bahtText || 'ศูนย์บาท'}ถ้วน`;
  }
  const satangText = `${convertSixDigitGroupToThai(satang)}สตางค์`;
  return `${bahtText}${satangText}`;
}

export function formatThaiDate(isoOrDate?: string | Date): string {
  const dateObj = isoOrDate ? new Date(isoOrDate) : new Date();
  if (Number.isNaN(dateObj.getTime())) {
    return '27 ตุลาคม 2569';
  }
  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  const day = dateObj.getDate();
  const month = thaiMonths[dateObj.getMonth()] || 'ตุลาคม';
  const rawYear = dateObj.getFullYear();
  const yearBE = rawYear >= 2400 ? rawYear : rawYear + 543;
  return `${day} ${month} ${yearBE}`;
}

export type EffectiveSlotDisplayStatus =
  | 'available'
  | 'selected_by_me'
  | 'held_by_other'
  | 'booked';

export interface EffectiveSlotState {
  slotNumber: number;
  effectiveStatus: EffectiveSlotDisplayStatus;
  remainingMs: number;
  remainingFormatted: string;
  isExpiredHold: boolean;
  orderNumber: string;
}

export function getEffectiveSlotState(
  slot: RajaSetSlot,
  currentSessionId: string,
  nowMs = Date.now()
): EffectiveSlotState {
  if (slot.status === 'booked') {
    return {
      slotNumber: slot.slotNumber,
      effectiveStatus: 'booked',
      remainingMs: 0,
      remainingFormatted: '00:00',
      isExpiredHold: false,
      orderNumber: slot.orderNumber || '',
    };
  }

  if (slot.status === 'held') {
    const remaining = slot.heldUntil - nowMs;
    if (remaining <= 0) {
      return {
        slotNumber: slot.slotNumber,
        effectiveStatus: 'available',
        remainingMs: 0,
        remainingFormatted: '00:00',
        isExpiredHold: true,
        orderNumber: '',
      };
    }

    const totalSec = Math.ceil(remaining / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return {
      slotNumber: slot.slotNumber,
      effectiveStatus:
        slot.sessionId && slot.sessionId === currentSessionId
          ? 'selected_by_me'
          : 'held_by_other',
      remainingMs: remaining,
      remainingFormatted: formatted,
      isExpiredHold: false,
      orderNumber: slot.orderNumber || '',
    };
  }

  return {
    slotNumber: slot.slotNumber,
    effectiveStatus: 'available',
    remainingMs: 0,
    remainingFormatted: '00:00',
    isExpiredHold: false,
    orderNumber: '',
  };
}

export interface ProductFilterOptions {
  searchQuery?: string;
  category?: ProductCategory;
  minPrice?: number | null;
  maxPrice?: number | null;
  stockFilter?: 'all' | 'in_stock' | 'low_stock';
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  includeHidden?: boolean;
}

export function filterAndSortProducts(
  products: AmuletProduct[],
  options: ProductFilterOptions
): AmuletProduct[] {
  const {
    searchQuery = '',
    category = 'all',
    minPrice = null,
    maxPrice = null,
    stockFilter = 'all',
    sortBy = 'newest',
    includeHidden = false,
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = products.filter((item) => {
    if (!includeHidden && !item.isVisible) {
      return false;
    }

    if (category !== 'all' && item.category !== category) {
      return false;
    }

    if (minPrice !== null && minPrice !== undefined && item.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && maxPrice !== undefined && item.price > maxPrice) {
      return false;
    }

    if (
      stockFilter === 'in_stock' &&
      !item.isMadeToOrder &&
      item.stock <= 0
    ) {
      return false;
    }

    if (
      stockFilter === 'low_stock' &&
      (item.isMadeToOrder || item.stock <= 0 || item.stock > 5)
    ) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const searchable = [
        item.name,
        item.series,
        item.code,
        item.material,
        item.categoryLabel,
        item.moldType || '',
        String(item.yearBE),
      ]
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price_desc') {
      return b.price - a.price;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export interface CalculatedOrderResult {
  valid: boolean;
  errors: string[];
  lineItems: OrderLineItem[];
  selectedNumbers: number[];
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  grandTotalThaiText: string;
  totalQuantity: number;
}

export function calculateOrderTotals(
  cartItems: CartItem[],
  products: AmuletProduct[],
  standardShippingFee = 0,
  freeShippingThreshold = 3000
): CalculatedOrderResult {
  const errors: string[] = [];
  const lineItems: OrderLineItem[] = [];
  const allSelectedNumbers: number[] = [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  if (!cartItems || cartItems.length === 0) {
    return {
      valid: false,
      errors: ['ไม่มีรายการวัตถุมงคลในตะกร้า'],
      lineItems: [],
      selectedNumbers: [],
      subtotal: 0,
      shippingTotal: 0,
      grandTotal: 0,
      grandTotalThaiText: 'ศูนย์บาทถ้วน',
      totalQuantity: 0,
    };
  }

  let subtotal = 0;
  let totalQuantity = 0;

  for (const cartItem of cartItems) {
    const product = productMap.get(cartItem.productId);
    if (!product || !product.isVisible) {
      errors.push(`ไม่พบข้อมูลวัตถุมงคลรหัส ${cartItem.productId}`);
      continue;
    }

    const selectedNums = Array.isArray(cartItem.selectedNumbers)
      ? [...new Set(cartItem.selectedNumbers)]
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 99)
          .sort((a, b) => a - b)
      : [];

    const effectiveQty = product.requiresNumberSelection
      ? selectedNums.length > 0
        ? selectedNums.length
        : cartItem.quantity
      : cartItem.quantity;

    if (!Number.isInteger(effectiveQty) || effectiveQty <= 0) {
      errors.push(`จำนวนของ "${product.name}" ไม่ถูกต้อง`);
      continue;
    }

    if (product.requiresNumberSelection && selectedNums.length !== effectiveQty) {
      errors.push(
        `กรุณาเลือกหมายเลขประจำชุด 1–99 สำหรับ "${product.name}" ให้ครบตามจำนวนชุด`
      );
      continue;
    }

    if (!product.isMadeToOrder && effectiveQty > product.stock) {
      errors.push(
        `วัตถุมงคล "${product.name}" (${product.code}) มีจำนวนคงเหลือเพียง ${product.stock}`
      );
      continue;
    }

    if (selectedNums.length > 0) {
      allSelectedNumbers.push(...selectedNums);
    }

    const lineTotal = product.price * effectiveQty;
    subtotal += lineTotal;
    totalQuantity += effectiveQty;

    lineItems.push({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      series: product.series,
      unitPrice: product.price,
      quantity: effectiveQty,
      lineTotal,
      selectedNumbers: selectedNums.length > 0 ? selectedNums : undefined,
    });
  }

  // A threshold of 0 means there is no free shipping: every postal order pays the fee.
  const shippingTotal =
    subtotal === 0 || standardShippingFee <= 0
      ? 0
      : freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
      ? 0
      : standardShippingFee;

  const grandTotal = subtotal + shippingTotal;

  return {
    valid: errors.length === 0 && lineItems.length > 0,
    errors,
    lineItems,
    selectedNumbers: allSelectedNumbers,
    subtotal,
    shippingTotal,
    grandTotal,
    grandTotalThaiText: numberToThaiBahtText(grandTotal),
    totalQuantity,
  };
}

export interface CheckoutFormInput {
  customerName: string;
  organization?: string;
  customerPhone: string;
  /** Checked only when provided (online checkout always sends it; the receipt is emailed there). */
  customerEmail?: string;
  deliveryMethod?: 'shipping' | 'pickup_bpp';
  shippingAddress?: string;
  postalCode?: string;
  paymentMethod?: 'promptpay' | 'bank_transfer' | 'cash';
  transferReference?: string;
}

export function validateCheckoutForm(input: CheckoutFormInput): {
  valid: boolean;
  fieldErrors: Partial<Record<keyof CheckoutFormInput, string>>;
} {
  const fieldErrors: Partial<Record<keyof CheckoutFormInput, string>> = {};

  const name = (input.customerName || '').trim();
  if (name.length < 3) {
    fieldErrors.customerName = 'กรุณาระบุชื่อ–นามสกุลผู้จองให้ครบถ้วน';
  }

  if (input.organization !== undefined) {
    const org = input.organization.trim();
    if (org.length < 2) {
      fieldErrors.organization = 'กรุณาระบุหน่วยงาน / สังกัด (หรือระบุ "ประชาชนทั่วไป")';
    }
  }

  const digitsOnlyPhone = (input.customerPhone || '').replace(/\D/g, '');
  if (digitsOnlyPhone.length < 9 || digitsOnlyPhone.length > 10) {
    fieldErrors.customerPhone = 'กรุณาระบุหมายเลขโทรศัพท์ 9–10 หลักที่ติดต่อได้';
  }

  if (input.customerEmail !== undefined) {
    const email = input.customerEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) {
      fieldErrors.customerEmail = 'กรุณาระบุอีเมลให้ถูกต้อง (ใช้ส่งใบจองหลังเจ้าหน้าที่ตรวจสอบสลิป)';
    }
  }

  if (input.deliveryMethod === 'shipping') {
    const address = (input.shippingAddress || '').trim();
    if (address.length < 8) {
      fieldErrors.shippingAddress =
        'กรุณาระบุที่อยู่สำหรับจัดส่งพัสดุ (บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)';
    }
    const postal = (input.postalCode || '').trim();
    if (!/^\d{5}$/.test(postal)) {
      fieldErrors.postalCode = 'กรุณาระบุรหัสไปรษณีย์ 5 หลัก';
    }
  } else if (input.deliveryMethod === 'pickup_bpp') {
    // Self-pickup at BPP HQ does not require a home shipping address or postal code
  } else if (input.organization === undefined) {
    // Legacy mode fallback when neither deliveryMethod nor organization is specified
    const address = (input.shippingAddress || '').trim();
    if (address.length < 10) {
      fieldErrors.shippingAddress =
        'กรุณาระบุบ้านเลขที่ ถนน ตำบล/แขวง และอำเภอ/เขต เพื่อการจัดส่งที่ถูกต้อง';
    }

    const postal = (input.postalCode || '').trim();
    if (!/^\d{5}$/.test(postal)) {
      fieldErrors.postalCode = 'กรุณาระบุรหัสไปรษณีย์ 5 หลัก';
    }
  } else if (input.postalCode && input.postalCode.trim().length > 0) {
    if (!/^\d{5}$/.test(input.postalCode.trim())) {
      fieldErrors.postalCode = 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก';
    }
  }

  const method = input.paymentMethod || 'promptpay';
  if (method !== 'promptpay' && method !== 'bank_transfer' && method !== 'cash') {
    fieldErrors.paymentMethod = 'กรุณาเลือกช่องทางชำระเงิน';
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export function resolveOrderDeliveryMethod(
  order: Pick<OrderRecord | PublicTrackedOrder, 'deliveryMethod' | 'shippingAddress'>
): 'shipping' | 'pickup_bpp' {
  if (order.deliveryMethod === 'pickup_bpp' || order.deliveryMethod === 'shipping') {
    return order.deliveryMethod;
  }
  const addr = (order.shippingAddress || '').trim();
  if (addr.includes('มารับเอง') || addr.includes('รับด้วยตนเอง')) {
    return 'pickup_bpp';
  }
  return 'shipping';
}

export function maskCustomerPII(order: OrderRecord): PublicTrackedOrder {
  const nameParts = order.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'ผู้สั่งบูชา';
  const maskedLastName =
    nameParts.length > 1 ? `${nameParts[1].slice(0, 1)}***` : '***';
  const maskedCustomerName = `${firstName} ${maskedLastName}`;

  const digits = order.customerPhone.replace(/\D/g, '');
  const last4 = digits.slice(-4);
  const maskedPhone = `XXX-XXX-${last4}`;
  const deliveryMethod = resolveOrderDeliveryMethod(order);

  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    reservationDateThai:
      order.reservationDateThai || formatThaiDate(order.createdAt),
    customerName: order.customerName,
    organization: order.organization || '-',
    customerPhone: order.customerPhone,
    maskedCustomerName,
    maskedPhone,
    deliveryMethod,
    shippingAddress: order.shippingAddress,
    postalCode: order.postalCode,
    paymentMethod: order.paymentMethod,
    transferReference: order.transferReference,
    slipUploadedAt: order.slipUploadedAt,
    slipTransferAmount: order.slipTransferAmount,
    slipTransferTime: order.slipTransferTime,
    receiptEmailedAt: order.receiptEmailedAt,
    items: order.items,
    selectedNumbers: order.selectedNumbers,
    subtotal: order.subtotal,
    shippingTotal: order.shippingTotal,
    grandTotal: order.grandTotal,
    grandTotalThaiText:
      order.grandTotalThaiText || numberToThaiBahtText(order.grandTotal),
    paymentStatus: order.paymentStatus,
    preparationStatus: order.preparationStatus,
    shippingStatus: order.shippingStatus,
    trackingNumber: order.trackingNumber,
    carrierName: order.carrierName,
    statusHistory: order.statusHistory,
    isDemoOrder: order.isDemoOrder,
  };
}

export function verifyPhoneLast4(
  fullPhone: string,
  phoneLast4OrFull: string
): boolean {
  const orderDigits = (fullPhone || '').replace(/\D/g, '');
  const queryDigits = (phoneLast4OrFull || '').replace(/\D/g, '');
  if (queryDigits.length < 4 || orderDigits.length < 4) {
    return false;
  }
  return orderDigits.slice(-4) === queryDigits.slice(-4);
}

export function toggleWishlistId(
  currentIds: string[],
  productId: string
): { nextIds: string[]; added: boolean } {
  const cleanId = (productId || '').trim();
  if (!cleanId) {
    return { nextIds: [...currentIds], added: false };
  }
  const exists = currentIds.includes(cleanId);
  if (exists) {
    return {
      nextIds: currentIds.filter((id) => id !== cleanId),
      added: false,
    };
  }
  return {
    nextIds: [...currentIds, cleanId],
    added: true,
  };
}

export function resolveWishlistProducts(
  products: AmuletProduct[],
  wishlistIds: string[]
): AmuletProduct[] {
  if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
    return [];
  }
  const productMap = new Map(
    products.filter((p) => p.isVisible).map((p) => [p.id, p])
  );
  const resolved: AmuletProduct[] = [];
  for (const id of wishlistIds) {
    const found = productMap.get(id);
    if (found) {
      resolved.push(found);
    }
  }
  return resolved;
}

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateOrdersCsv(orders: OrderRecord[]): string {
  const headers = [
    'เลขที่ใบจอง',
    'วันที่จอง',
    'ชื่อผู้จอง',
    'หน่วยงาน',
    'เบอร์โทรศัพท์',
    'รายการที่จอง',
    'เลขชุดทองคำใหญ่ราชาฤกษ์ (1-99)',
    'ยอดรวม (บาท)',
    'ยอดรวมตัวอักษรไทย',
    'สถานะชำระเงิน',
    'วิธีรับวัตถุมงคล',
    'ที่อยู่จัดส่ง/สถานที่รับพระ',
  ];

  const rows = orders.map((o) => {
    const itemsText = o.items
      .map((i) => {
        const numSuffix =
          i.selectedNumbers && i.selectedNumbers.length > 0
            ? ` [เลข ${i.selectedNumbers.map((n) => `#${n}`).join(', ')}]`
            : '';
        return `${i.productCode} ${i.productName} x${i.quantity}${numSuffix}`;
      })
      .join(' | ');

    const nums =
      o.selectedNumbers && o.selectedNumbers.length > 0
        ? o.selectedNumbers.join(', ')
        : '-';

    const paymentText =
      o.paymentStatus === 'verified_paid'
        ? 'ชำระเงินแล้ว'
        : o.paymentStatus === 'payment_rejected'
        ? 'ยกเลิก/ปฏิเสธ'
        : 'รอตรวจสอบชำระเงิน';

    const deliveryMethod = resolveOrderDeliveryMethod(o);
    const deliveryLabel =
      deliveryMethod === 'pickup_bpp'
        ? 'มารับเองที่ บช.ตชด.'
        : 'จัดส่งทางไปรษณีย์';

    return [
      o.orderNumber,
      o.reservationDateThai || formatThaiDate(o.createdAt),
      o.customerName,
      o.organization || '-',
      o.customerPhone,
      itemsText,
      nums,
      o.grandTotal,
      o.grandTotalThaiText || numberToThaiBahtText(o.grandTotal),
      paymentText,
      deliveryLabel,
      o.shippingAddress || '-',
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}

export function generateRajaSlotsCsv(
  slots: RajaSetSlot[],
  orders: OrderRecord[]
): string {
  const headers = [
    'หมายเลขชุด (1-99)',
    'สถานะหมายเลข',
    'เลขที่ใบจอง',
    'ชื่อผู้จอง',
    'หน่วยงาน',
    'เบอร์โทรศัพท์',
    'สถานะชำระเงิน',
  ];

  const orderByNumber = new Map<string, OrderRecord>();
  const orderBySlot = new Map<number, OrderRecord>();

  for (const ord of orders) {
    orderByNumber.set(ord.orderNumber, ord);
    if (Array.isArray(ord.selectedNumbers)) {
      for (const n of ord.selectedNumbers) {
        orderBySlot.set(n, ord);
      }
    }
    for (const item of ord.items) {
      if (Array.isArray(item.selectedNumbers)) {
        for (const n of item.selectedNumbers) {
          orderBySlot.set(n, ord);
        }
      }
    }
  }

  const sortedSlots = [...slots].sort((a, b) => a.slotNumber - b.slotNumber);
  const now = Date.now();

  const rows = sortedSlots.map((slot) => {
    const matchedOrder =
      (slot.orderNumber && orderByNumber.get(slot.orderNumber)) ||
      orderBySlot.get(slot.slotNumber);

    let statusLabel = 'ว่าง';
    if (slot.status === 'booked') {
      statusLabel = 'ถูกจองแล้ว';
    } else if (slot.status === 'held' && slot.heldUntil > now) {
      statusLabel = 'กำลังเลือก (ล็อก 15 นาที)';
    }

    const paymentLabel = matchedOrder
      ? matchedOrder.paymentStatus === 'verified_paid'
        ? 'ชำระเงินแล้ว'
        : matchedOrder.paymentStatus === 'payment_rejected'
        ? 'ยกเลิก'
        : 'รอตรวจสอบชำระเงิน'
      : '-';

    return [
      slot.slotNumber,
      statusLabel,
      slot.orderNumber || matchedOrder?.orderNumber || '-',
      slot.customerName || matchedOrder?.customerName || '-',
      slot.organization || matchedOrder?.organization || '-',
      slot.customerPhone || matchedOrder?.customerPhone || '-',
      paymentLabel,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}

export function generateStockCsv(products: AmuletProduct[]): string {
  const headers = [
    'รหัสวัตถุมงคล',
    'หมวดหมู่',
    'ชื่อรายการ',
    'ราคาบูชา (บาท)',
    'ประเภทสต็อก',
    'จำนวนจัดสร้าง',
    'จองแล้ว',
    'คงเหลือ',
    'สถานะ',
  ];

  const rows = products.map((p) => {
    const typeLabel = p.isMadeToOrder ? 'ตามจอง (ไม่จำกัด)' : 'จำกัดจำนวน';
    const initialLabel = p.isMadeToOrder
      ? 'ตามจอง'
      : String(p.initialStock ?? p.stock);
    const remainingLabel = p.isMadeToOrder ? 'ตามจอง' : String(p.stock);
    const statusLabel = p.isMadeToOrder
      ? 'เปิดรับตามจอง'
      : p.stock <= 0
      ? 'หมด'
      : 'พร้อมจอง';

    return [
      p.code,
      p.categoryLabel,
      p.name,
      p.price,
      typeLabel,
      initialLabel,
      p.bookedCount ?? 0,
      remainingLabel,
      statusLabel,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}
