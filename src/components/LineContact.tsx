import React from 'react';
import { MessageCircle } from 'lucide-react';

interface Props {
  /** compact = small card for the footer; full = banner for checkout */
  variant?: 'compact' | 'full';
}

/** "สั่งซื้อ/สอบถามทาง LINE" card with the official LINE QR code (scan from the phone's LINE app). */
const LineContact: React.FC<Props> = ({ variant = 'full' }) => {
  const qr = (
    <img
      src="/line-qr.png"
      alt="QR Code เพิ่มเพื่อน LINE สำหรับสั่งซื้อ"
      width={variant === 'full' ? 132 : 96}
      height={variant === 'full' ? 132 : 96}
      loading="lazy"
      className="rounded-lg bg-white p-1 shrink-0"
    />
  );
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[#06C755]/50 bg-[#06C755]/10 p-2.5">
        {qr}
        <div className="text-xs leading-snug">
          <p className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-[#06C755]" /> สั่งซื้อ/สอบถามทาง LINE
          </p>
          <p className="mt-1 text-[#F7F2E8]/85">สแกน QR เพื่อเพิ่มเพื่อนและแจ้งรายการที่ต้องการ</p>
        </div>
      </div>
    );
  }
  return (
    <section
      aria-label="ช่องทางสั่งซื้อทาง LINE"
      className="no-print rounded-2xl border-2 border-[#06C755]/60 bg-gradient-to-br from-[#F2FFF7] to-white p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
    >
      {qr}
      <div>
        <h3 className="font-bold text-[#18140E] text-base sm:text-lg flex items-center justify-center sm:justify-start gap-2">
          <MessageCircle className="w-5 h-5 text-[#06C755]" /> สะดวกสั่งซื้อทาง LINE
        </h3>
        <p className="mt-1 text-sm text-[#4A4132]">
          สแกน QR Code ด้วยแอป LINE เพื่อเพิ่มเพื่อน แล้วแจ้งรายการพระ/เลขที่ต้องการ ทีมงานจะช่วยดำเนินการสั่งซื้อให้
        </p>
      </div>
    </section>
  );
};

export default LineContact;
