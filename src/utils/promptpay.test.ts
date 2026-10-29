import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPromptPayPayload } from './promptpay';

// Independent CRC-16/CCITT-FALSE check so the QR is never rejected by a banking app.
const crc = (s: string) => {
  let c = 0xffff;
  for (const ch of Buffer.from(s, 'ascii')) {
    c ^= ch << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
};

test('PromptPay payload for a phone number is well formed', () => {
  const p = buildPromptPayPayload('081-234-5678', 100)!;
  assert.ok(p.startsWith('000201010212'));
  assert.ok(p.includes('0066812345678'));
  assert.ok(p.includes('5406100.00'));
  assert.equal(p.slice(-4), crc(p.slice(0, -4)));
});

test('PromptPay payload for a 13-digit ID uses the national-ID tag', () => {
  const p = buildPromptPayPayload('0994000759999', 29999)!;
  assert.ok(p.includes('02130994000759999'));
  assert.ok(p.includes('540829999.00'));
  assert.equal(p.slice(-4), crc(p.slice(0, -4)));
});

test('PromptPay payload is static (no amount) when amount is missing, and null for bad IDs', () => {
  assert.ok(buildPromptPayPayload('0812345678')!.startsWith('000201010211'));
  assert.equal(buildPromptPayPayload('12345'), null);
});
