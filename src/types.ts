export type ProductCategory =
  | 'all'
  | 'special_set'
  | 'cat_1_popular_metal'
  | 'cat_2_score_metal'
  | 'cat_3_popular_powder'
  | 'cat_4_score_powder'
  | 'commemorative_coin'
  | 'sacred_powder'
  | 'bucha_statue'
  | 'royal_project_heritage';

export type SpecimenStyle =
  | 'bronze_oval'
  | 'silver_octagonal'
  | 'gold_lotus'
  | 'terracotta_tablet'
  | 'brass_shield'
  | 'oxidized_arch';

export type AngleType = 'front' | 'back' | 'edge' | 'box';

export interface ProductAngleImage {
  angle: AngleType;
  label: string;
  caption: string;
  imageUrl?: string;
}

export interface SetBreakdownItem {
  item: string;
  count: string;
  mold?: string;
}

export interface AmuletProduct {
  id: string;
  code: string;
  name: string;
  series: string;
  yearBE: number;
  category: Exclude<ProductCategory, 'all'>;
  categoryLabel: string;
  price: number;
  stock: number;
  initialStock?: number;
  bookedCount?: number;
  isMadeToOrder?: boolean;
  requiresNumberSelection?: boolean;
  moldType?: 'พิมพ์นิยม' | 'พิมพ์คะแนน' | 'ครบทั้ง ๒ พิมพ์';
  material: string;
  dimensions: string;
  moldDimensionsNote?: string;
  setBreakdown?: SetBreakdownItem[];
  weightGrams: number;
  condition: string;
  certificateInfo: string;
  purposeSummary: string;
  description: string;
  shippingFee: number;
  isFeatured: boolean;
  isVisible: boolean;
  specimenStyle: SpecimenStyle;
  angles: ProductAngleImage[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedNumbers?: number[];
}

/** 'locked' = kept back by staff (e.g. reserved for a guest); customers cannot pick it. */
export type RajaSlotStatus = 'available' | 'held' | 'booked' | 'locked';

export interface RajaSetSlot {
  slotNumber: number; // 1 to 99
  status: RajaSlotStatus;
  sessionId: string;
  heldAt: number;
  heldUntil: number;
  orderNumber: string;
  updatedAt: string;
  /** Staff note for a locked number (who it is kept for) */
  lockNote?: string;
  // Admin / enriched display fields (derived from ReservationOrder):
  customerName?: string;
  organization?: string;
  customerPhone?: string;
  paymentStatus?: PaymentStatus;
}

export type PaymentStatus =
  | 'pending_verification'
  | 'verified_paid'
  | 'payment_rejected';

export type PreparationStatus =
  | 'awaiting_payment'
  | 'inspecting_artifact'
  | 'packed_ready';

export type ShippingStatus =
  | 'not_shipped'
  | 'in_transit'
  | 'delivered';

export interface OrderStatusLog {
  id: string;
  timestamp: string;
  actor: string;
  paymentStatus: PaymentStatus;
  preparationStatus: PreparationStatus;
  shippingStatus: ShippingStatus;
  note: string;
}

export interface OrderLineItem {
  productId: string;
  productCode: string;
  productName: string;
  series: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selectedNumbers?: number[];
}

export type DeliveryMethod = 'shipping' | 'pickup_bpp';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  reservationDateThai?: string;
  customerName: string;
  organization?: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod?: DeliveryMethod;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: 'promptpay' | 'bank_transfer' | 'cash';
  transferReference?: string;
  /** 'admin' = created by staff in the back office (counter / phone sale) */
  salesChannel?: 'online' | 'admin';
  adminNote?: string;
  /** Payment slip (the image itself is stored separately; see server /api/orders/slip) */
  slipUploadedAt?: string;
  slipCount?: number;
  slipTransferAmount?: number;
  slipTransferTime?: string;
  /** When the reservation certificate was last emailed to customerEmail */
  receiptEmailedAt?: string;
  items: OrderLineItem[];
  selectedNumbers?: number[];
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  grandTotalThaiText?: string;
  paymentStatus: PaymentStatus;
  preparationStatus: PreparationStatus;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  carrierName?: string;
  statusHistory: OrderStatusLog[];
  sessionId?: string;
  isDemoOrder: boolean;
}

export interface PublicTrackedOrder {
  orderNumber: string;
  createdAt: string;
  reservationDateThai?: string;
  customerName?: string;
  organization?: string;
  customerPhone?: string;
  maskedCustomerName: string;
  maskedPhone: string;
  deliveryMethod?: DeliveryMethod;
  shippingAddress?: string;
  postalCode: string;
  paymentMethod: 'promptpay' | 'bank_transfer' | 'cash';
  transferReference?: string;
  slipUploadedAt?: string;
  slipTransferAmount?: number;
  slipTransferTime?: string;
  /** When staff emailed the signed certificate */
  receiptEmailedAt?: string;
  items: OrderLineItem[];
  selectedNumbers?: number[];
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  grandTotalThaiText?: string;
  paymentStatus: PaymentStatus;
  preparationStatus: PreparationStatus;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  carrierName?: string;
  statusHistory: OrderStatusLog[];
  isDemoOrder: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  sourceReference: string;
  excerpt: string;
  content: string[];
  illustrationType: 'ceremony' | 'highlands' | 'archive';
  posterUrl?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  presidingMonk?: string;
  broadcastChannel?: string;
}

export interface PaymentChannelConfig {
  enableBankTransfer: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  enablePromptPay: boolean;
  promptPayId: string;
}

export interface SiteConfig {
  brandTitleThai: string;
  brandTitleEnglish: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  announcementBanner: string;
  historyHeading: string;
  historyLead: string;
  historyParagraphs: string[];
  purposeBullets: { title: string; detail: string }[];
  contactUnitName: string;
  contactAddress: string;
  contactPhone: string;
  contactHours: string;
  contactEmail: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  paymentChannels: PaymentChannelConfig;
  privacyPolicySummary: string;
  termsSummary: string;
  /** Admin sales switch; reservations are refused when false (missing = open). */
  salesOpen?: boolean;
}

export interface ContactInquiry {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  orderNumber?: string;
}
