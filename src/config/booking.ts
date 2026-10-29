// Reservation window. Browsing is always open; placing reservations is blocked
// until this moment (1 พฤศจิกายน 2569 = 1 Nov 2026, Thailand time).
export const BOOKING_OPENS_AT = '2026-11-01T00:00:00+07:00';
export const BOOKING_OPEN_DATE_TEXT = '1 พฤศจิกายน 2569';
export const BOOKING_CLOSED_MESSAGE = `ยังไม่เปิดให้จอง — เปิดให้จองวันที่ ${BOOKING_OPEN_DATE_TEXT}`;

export function isBookingOpen(
  now: number = Date.now(),
  opensAt: string = BOOKING_OPENS_AT,
): boolean {
  const t = Date.parse(opensAt);
  return Number.isNaN(t) ? true : now >= t;
}
