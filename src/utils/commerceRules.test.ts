import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOLD_DURATION_MS,
  calculateOrderTotals,
  filterAndSortProducts,
  generateOrdersCsv,
  generateRajaSlotsCsv,
  generateStockCsv,
  getEffectiveSlotState,
  maskCustomerPII,
  numberToThaiBahtText,
  resolveWishlistProducts,
  toggleWishlistId,
  validateCheckoutForm,
  verifyPhoneLast4,
} from './commerceRules';
import { AmuletProduct, OrderRecord, RajaSetSlot } from '../types';

const mockProducts: AmuletProduct[] = [
  {
    id: 'prod-ch1',
    code: 'ช1',
    name: 'ช1 ชุดทองคำใหญ่ราชาฤกษ์',
    series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
    yearBE: 2569,
    category: 'special_set',
    categoryLabel: 'ชุดพิเศษ',
    price: 349999,
    stock: 99,
    initialStock: 99,
    bookedCount: 0,
    isMadeToOrder: false,
    requiresNumberSelection: true,
    material: 'รวม 20 องค์ + พระผง 100 องค์',
    dimensions: 'มาตรฐาน',
    weightGrams: 480,
    condition: 'สมบูรณ์',
    certificateInfo: 'หมายเลข 1-99',
    purposeSummary: 'สมทบทุน ตชด.',
    description: 'ชุดทองคำใหญ่ราชาฤกษ์',
    shippingFee: 0,
    isFeatured: true,
    isVisible: true,
    specimenStyle: 'gold_lotus',
    angles: [],
    createdAt: '2026-10-27T12:00:00.000Z',
  },
  {
    id: 'prod-chs1',
    code: 'ชศ1',
    name: 'ชศ1 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อทองคำ',
    series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
    yearBE: 2569,
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม',
    price: 199999,
    stock: 999999,
    initialStock: 0,
    bookedCount: 0,
    isMadeToOrder: true,
    requiresNumberSelection: false,
    material: 'เนื้อทองคำ',
    dimensions: '2.3 x 3.7 ซม.',
    weightGrams: 22,
    condition: 'สมบูรณ์',
    certificateInfo: 'ตามจอง',
    purposeSummary: 'สมทบทุน ตชด.',
    description: 'เนื้อทองคำ พิมพ์นิยม',
    shippingFee: 0,
    isFeatured: true,
    isVisible: true,
    specimenStyle: 'gold_lotus',
    angles: [],
    createdAt: '2026-10-27T11:00:00.000Z',
  },
  {
    id: 'prod-chs4',
    code: 'ชศ4',
    name: 'ชศ4 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อชนวนมวลสาร',
    series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
    yearBE: 2569,
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม',
    price: 999,
    stock: 3,
    initialStock: 999,
    bookedCount: 996,
    isMadeToOrder: false,
    requiresNumberSelection: false,
    material: 'เนื้อชนวนมวลสาร',
    dimensions: '2.3 x 3.7 ซม.',
    weightGrams: 22,
    condition: 'สมบูรณ์',
    certificateInfo: '999 องค์',
    purposeSummary: 'สมทบทุน ตชด.',
    description: 'เนื้อชนวนมวลสาร',
    shippingFee: 0,
    isFeatured: false,
    isVisible: true,
    specimenStyle: 'oxidized_arch',
    angles: [],
    createdAt: '2026-10-27T10:00:00.000Z',
  },
  {
    id: 'prod-hidden',
    code: 'HIDDEN-01',
    name: 'รายการซ่อนจากหน้าร้าน',
    series: 'รุ่นทดสอบ',
    yearBE: 2569,
    category: 'cat_4_score_powder',
    categoryLabel: 'หมวด 4',
    price: 99,
    stock: 0,
    material: 'เนื้อผงพุทธคุณ',
    dimensions: '1.2 x 2.1 ซม.',
    weightGrams: 10,
    condition: 'สมบูรณ์',
    certificateInfo: 'ไม่มี',
    purposeSummary: 'ทดสอบ',
    description: 'ซ่อน',
    shippingFee: 0,
    isFeatured: false,
    isVisible: false,
    specimenStyle: 'terracotta_tablet',
    angles: [],
    createdAt: '2026-02-01T08:00:00.000Z',
  },
];

test('numberToThaiBahtText converts prices into formal Thai Baht text accurately', () => {
  assert.equal(
    numberToThaiBahtText(349999),
    'สามแสนสี่หมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทถ้วน'
  );
  assert.equal(
    numberToThaiBahtText(29999),
    'สองหมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทถ้วน'
  );
  assert.equal(
    numberToThaiBahtText(199999),
    'หนึ่งแสนเก้าหมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทถ้วน'
  );
  assert.equal(numberToThaiBahtText(101), 'หนึ่งร้อยเอ็ดบาทถ้วน');
  assert.equal(numberToThaiBahtText(21), 'ยี่สิบเอ็ดบาทถ้วน');
});

test('getEffectiveSlotState enforces 15-minute hold timeout and distinguishes selected_by_me vs held_by_other', () => {
  const now = 1_700_000_000_000;
  const heldSlot: RajaSetSlot = {
    slotNumber: 88,
    status: 'held',
    sessionId: 'buyer-A',
    heldAt: now - 60_000,
    heldUntil: now + HOLD_DURATION_MS - 60_000,
    orderNumber: '',
    updatedAt: new Date(now).toISOString(),
  };

  assert.equal(
    getEffectiveSlotState(heldSlot, 'buyer-A', now).effectiveStatus,
    'selected_by_me'
  );
  assert.equal(
    getEffectiveSlotState(heldSlot, 'buyer-B', now).effectiveStatus,
    'held_by_other'
  );

  // After 15 minutes have elapsed, the slot automatically becomes available
  const afterExpiry = now + HOLD_DURATION_MS + 1000;
  assert.equal(
    getEffectiveSlotState(heldSlot, 'buyer-B', afterExpiry).effectiveStatus,
    'available'
  );
});

test('calculateOrderTotals enforces 1-99 number selection for ช1 and supports unlimited stock for ตามจอง items', () => {
  // Missing selectedNumbers for ช1 should fail validation
  const missingNumbers = calculateOrderTotals(
    [{ productId: 'prod-ch1', quantity: 1, selectedNumbers: [] }],
    mockProducts,
    0,
    0
  );
  assert.equal(missingNumbers.valid, false);

  // Valid selection of 2 numbers (#5, #99) for ช1 + 10 units of ตามจอง ชศ1
  const validOrder = calculateOrderTotals(
    [
      { productId: 'prod-ch1', quantity: 2, selectedNumbers: [5, 99] },
      { productId: 'prod-chs1', quantity: 10 },
    ],
    mockProducts,
    0,
    0
  );
  assert.equal(validOrder.valid, true);
  assert.equal(validOrder.subtotal, 349999 * 2 + 199999 * 10);
  assert.ok(validOrder.grandTotalThaiText.endsWith('บาทถ้วน'));

  // Limited stock item ชศ4 (stock = 3) rejects quantity = 5
  const overStock = calculateOrderTotals(
    [{ productId: 'prod-chs4', quantity: 5 }],
    mockProducts,
    0,
    0
  );
  assert.equal(overStock.valid, false);
});

test('validateCheckoutForm requires customerName, organization, and valid Thai phone number', () => {
  const invalid = validateCheckoutForm({
    customerName: 'กข',
    organization: '',
    customerPhone: '123',
    paymentMethod: 'promptpay',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.fieldErrors.customerName);
  assert.ok(invalid.fieldErrors.organization);
  assert.ok(invalid.fieldErrors.customerPhone);

  const valid = validateCheckoutForm({
    customerName: 'พ.ต.อ. กิตติพงศ์ วงศ์สุวรรณ',
    organization: 'กก.ตชด. 23 (สกลนคร)',
    customerPhone: '081-234-5678',
    paymentMethod: 'promptpay',
  });
  assert.equal(valid.valid, true);
});

test('filterAndSortProducts excludes hidden products and sorts by price ascending', () => {
  const result = filterAndSortProducts(mockProducts, {
    sortBy: 'price_asc',
  });
  assert.equal(result.length, 3);
  assert.equal(result[0].code, 'ชศ4');
  assert.equal(result[2].code, 'ช1');
});

test('maskCustomerPII and CSV generators produce valid output', () => {
  const sampleOrder: OrderRecord = {
    id: 'ord-1',
    orderNumber: 'BPP-2569-1009',
    createdAt: '2026-10-26T10:00:00.000Z',
    reservationDateThai: '26 ตุลาคม 2569',
    customerName: 'กิตติพงศ์ วงศ์สุวรรณ',
    organization: 'บก.ตชด.',
    customerPhone: '081-234-5678',
    shippingAddress: 'กรุงเทพฯ',
    postalCode: '10400',
    paymentMethod: 'promptpay',
    selectedNumbers: [9],
    items: [
      {
        productId: 'prod-ch1',
        productCode: 'ช1',
        productName: 'ช1 ชุดทองคำใหญ่ราชาฤกษ์',
        series: 'สมเด็จพิทักษ์แผ่นดิน',
        unitPrice: 349999,
        quantity: 1,
        lineTotal: 349999,
        selectedNumbers: [9],
      },
    ],
    subtotal: 349999,
    shippingTotal: 0,
    grandTotal: 349999,
    grandTotalThaiText: 'สามแสนสี่หมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทถ้วน',
    paymentStatus: 'verified_paid',
    preparationStatus: 'packed_ready',
    shippingStatus: 'not_shipped',
    statusHistory: [],
    isDemoOrder: true,
  };

  const masked = maskCustomerPII(sampleOrder);
  assert.equal(masked.maskedCustomerName, 'กิตติพงศ์ ว***');
  assert.equal(masked.maskedPhone, 'XXX-XXX-5678');
  assert.equal(verifyPhoneLast4(sampleOrder.customerPhone, '5678'), true);

  const ordersCsv = generateOrdersCsv([sampleOrder]);
  assert.ok(ordersCsv.includes('BPP-2569-1009'));
  assert.ok(ordersCsv.includes('บก.ตชด.'));

  const slotsCsv = generateRajaSlotsCsv(
    [
      {
        slotNumber: 9,
        status: 'booked',
        sessionId: 'demo-session-009',
        heldAt: 0,
        heldUntil: 0,
        orderNumber: 'BPP-2569-1009',
        updatedAt: '2026-10-26T10:00:00.000Z',
      },
    ],
    [sampleOrder]
  );
  assert.ok(slotsCsv.includes('ถูกจองแล้ว'));
  assert.ok(slotsCsv.includes('กิตติพงศ์ วงศ์สุวรรณ'));

  const stockCsv = generateStockCsv(mockProducts);
  assert.ok(stockCsv.includes('ตามจอง'));
});

test('toggleWishlistId and resolveWishlistProducts work cleanly', () => {
  const step1 = toggleWishlistId([], 'prod-ch1');
  assert.deepEqual(step1.nextIds, ['prod-ch1']);
  const resolved = resolveWishlistProducts(mockProducts, [
    'prod-ch1',
    'prod-hidden',
  ]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].code, 'ช1');
});

test('initialProducts from seedData includes all 23 official catalog codes (ช1-ช3 and ชศ1-ชศ20) matching exact prices and stocks', async () => {
  const { initialProducts, createInitialRajaSlots } = await import(
    '../data/seedData'
  );

  assert.equal(initialProducts.length, 23);

  const ch1 = initialProducts.find((p) => p.code === 'ช1');
  const ch2 = initialProducts.find((p) => p.code === 'ช2');
  const ch3 = initialProducts.find((p) => p.code === 'ช3');
  assert.ok(ch1 && ch1.price === 349999 && ch1.requiresNumberSelection === true);
  assert.ok(ch2 && ch2.price === 29999 && ch2.initialStock === 299);
  assert.ok(ch3 && ch3.price === 4999 && ch3.initialStock === 299);

  // Check sample codes across Categories 1-4
  const chs1 = initialProducts.find((p) => p.code === 'ชศ1');
  const chs8 = initialProducts.find((p) => p.code === 'ชศ8');
  const chs15 = initialProducts.find((p) => p.code === 'ชศ15');
  const chs20 = initialProducts.find((p) => p.code === 'ชศ20');

  assert.ok(chs1 && chs1.price === 199999 && chs1.isMadeToOrder === true);
  assert.ok(chs8 && chs8.price === 69999 && chs8.isMadeToOrder === true);
  assert.ok(chs15 && chs15.price === 199 && chs15.stock === 15000);
  assert.ok(chs20 && chs20.price === 299 && chs20.stock === 1500);

  const slots = createInitialRajaSlots();
  assert.equal(slots.length, 99);
});
