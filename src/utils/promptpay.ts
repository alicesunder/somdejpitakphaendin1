// PromptPay "Thai QR Payment" (EMVCo) payload. The amount is baked into the QR so the
// customer's banking app opens with the exact total and nothing can be mistyped.

function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const tlv = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, '0')}${value}`;

/** Returns null when the PromptPay ID is not a phone number (10 digits) or a national/tax ID (13 digits). */
export function buildPromptPayPayload(promptPayId: string, amount?: number): string | null {
  const digits = (promptPayId || '').replace(/\D/g, '');
  let target: string;
  let kind: string;
  if (digits.length === 10 && digits.startsWith('0')) {
    kind = '01';
    target = `0066${digits.slice(1)}`;
  } else if (digits.length === 13) {
    kind = '02';
    target = digits;
  } else {
    return null;
  }

  const hasAmount = typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  const body =
    tlv('00', '01') +
    tlv('01', hasAmount ? '12' : '11') +
    tlv('29', tlv('00', 'A000000677010111') + tlv(kind, target)) +
    tlv('53', '764') +
    (hasAmount ? tlv('54', (amount as number).toFixed(2)) : '') +
    tlv('58', 'TH');
  const withCrcTag = `${body}6304`;
  return withCrcTag + crc16(withCrcTag);
}
