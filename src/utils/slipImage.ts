// Shrinks a payment-slip photo in the browser before upload (phone photos are often 5 MB+).
// The server only accepts small JPEG/PNG/WebP data URLs, so this keeps every upload well inside the limit.

export const SLIP_MAX_FILE_BYTES = 12 * 1024 * 1024;
export const SLIP_MAX_DATA_URL_CHARS = 900_000;
// Target for new slips: ~150 KB keeps the free database from filling up; numbers stay readable.
const SLIP_TARGET_DATA_URL_CHARS = 220_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('เปิดไฟล์รูปไม่ได้ กรุณาเลือกไฟล์ภาพสลิป (JPG / PNG / WebP)'));
    };
    img.src = url;
  });
}

/** Shrinks a photo to a JPEG data URL under maxChars (defaults suit payment slips). */
export async function compressSlipImage(
  file: File,
  { maxSide: startSide = 1100, maxChars = SLIP_TARGET_DATA_URL_CHARS }: { maxSide?: number; maxChars?: number } = {},
): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error('รองรับเฉพาะไฟล์ภาพ JPG, PNG หรือ WebP');
  }
  if (file.size > SLIP_MAX_FILE_BYTES) {
    throw new Error('ไฟล์ใหญ่เกิน 12 MB กรุณาเลือกภาพที่เล็กลง');
  }
  const img = await loadImage(file);

  let maxSide = startSide;
  let quality = 0.78;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับการย่อรูป กรุณาลองเบราว์เซอร์อื่น');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= maxChars - 50_000) return dataUrl;
    maxSide = Math.round(maxSide * 0.8);
    quality = Math.max(0.5, quality - 0.08);
  }
  throw new Error('ย่อรูปให้เล็กพอไม่ได้ กรุณาครอปภาพให้เหลือเฉพาะสลิป');
}
