import type { OrderRecord } from '../types';

/**
 * Sorting orders into the back-office boxes:
 *  - ready:    slip attached, buyer-stated amount equals the order total, nobody flagged it
 *  - failed:   slip attached but the amount is missing / different, or staff flagged it ("ไม่ผ่าน")
 *  - no_slip:  still waiting for the buyer's slip
 *  - paid:     payment confirmed ("ผ่านแล้ว")
 *  - rejected: cancelled
 * Note the amount is what the buyer typed when attaching the slip, not something read from the image,
 * so "ready" only means "nothing looks wrong yet" and staff still check it against the bank.
 */
export type SlipBucket = 'ready' | 'failed' | 'no_slip' | 'paid' | 'rejected';

type BucketFields = Pick<OrderRecord, 'paymentStatus' | 'slipUploadedAt' | 'slipTransferAmount' | 'grandTotal' | 'slipReview'>;

const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.005;

/** Why a pending order with a slip is in the "ไม่ผ่าน" box; null when it is not. */
export function slipFailReason(o: BucketFields): string | null {
  if (o.paymentStatus !== 'pending_verification' || !o.slipUploadedAt) return null;
  if (o.slipReview === 'failed') return 'เจ้าหน้าที่คัดสลิปออก';
  if (o.slipTransferAmount === undefined) return 'ผู้จองไม่ได้ระบุยอดโอน';
  if (!sameAmount(o.slipTransferAmount, o.grandTotal)) {
    return `ยอดไม่ตรง: แจ้ง ฿${o.slipTransferAmount.toLocaleString('th-TH')} / ใบจอง ฿${o.grandTotal.toLocaleString('th-TH')}`;
  }
  return null;
}

export function slipBucket(o: BucketFields): SlipBucket {
  if (o.paymentStatus === 'verified_paid') return 'paid';
  if (o.paymentStatus === 'payment_rejected') return 'rejected';
  if (!o.slipUploadedAt) return 'no_slip';
  return slipFailReason(o) ? 'failed' : 'ready';
}
