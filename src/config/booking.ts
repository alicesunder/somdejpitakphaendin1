// Reservation window. Browsing is always open; placing reservations is blocked
// until this moment (opened early on 30 ตุลาคม 2569 = 30 Oct 2026, Thailand time).
export const BOOKING_OPENS_AT = '2026-10-30T00:00:00+07:00';
export const BOOKING_OPEN_DATE_TEXT = '30 ตุลาคม 2569';
export const BOOKING_CLOSED_MESSAGE = `ยังไม่เปิดให้จอง — เปิดให้จองวันที่ ${BOOKING_OPEN_DATE_TEXT}`;
// Shown when staff have switched sales off from the admin dashboard (siteConfig.salesOpen === false).
export const SALES_PAUSED_MESSAGE = 'ปิดรับจองชั่วคราว — กรุณาติดตามประกาศจากเจ้าหน้าที่';

export function isBookingOpen(
  now: number = Date.now(),
  opensAt: string = BOOKING_OPENS_AT,
): boolean {
  const t = Date.parse(opensAt);
  return Number.isNaN(t) ? true : now >= t;
}
