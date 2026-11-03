import assert from 'node:assert/strict';
import test from 'node:test';
import { slipBucket, slipFailReason } from './orderBuckets';

const base = {
  paymentStatus: 'pending_verification' as const,
  slipUploadedAt: '2026-11-01T10:00:00.000Z',
  slipTransferAmount: 4999,
  grandTotal: 4999,
  slipReview: undefined,
};

test('a pending order whose stated amount matches is ready to confirm', () => {
  assert.equal(slipBucket(base), 'ready');
  assert.equal(slipFailReason(base), null);
});

test('a different or missing amount goes to the failed box with a reason', () => {
  assert.equal(slipBucket({ ...base, slipTransferAmount: 4900 }), 'failed');
  assert.match(slipFailReason({ ...base, slipTransferAmount: 4900 })!, /ยอดไม่ตรง/);
  assert.equal(slipBucket({ ...base, slipTransferAmount: undefined }), 'failed');
});

test('staff can flag a matching slip as failed', () => {
  assert.equal(slipBucket({ ...base, slipReview: 'failed' }), 'failed');
});

test('orders without a slip, confirmed and cancelled orders are not in the failed box', () => {
  assert.equal(slipBucket({ ...base, slipUploadedAt: undefined }), 'no_slip');
  assert.equal(slipBucket({ ...base, paymentStatus: 'verified_paid', slipTransferAmount: 1 }), 'paid');
  assert.equal(slipBucket({ ...base, paymentStatus: 'payment_rejected' }), 'rejected');
  assert.equal(slipFailReason({ ...base, paymentStatus: 'verified_paid', slipTransferAmount: 1 }), null);
});
