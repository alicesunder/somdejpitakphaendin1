import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AlertCircle, CheckCircle2, Copy, Download, ImagePlus, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { PaymentChannelConfig, PublicTrackedOrder } from '../types';
import { buildPromptPayPayload } from '../utils/promptpay';
import { compressSlipImage } from '../utils/slipImage';

interface PaymentPanelProps {
  order: PublicTrackedOrder;
  /** Last 4 digits (or the whole number) of the booking phone: proves who is uploading */
  phoneVerify: string;
  channels: PaymentChannelConfig;
  onOrderUpdated?: (order: PublicTrackedOrder) => void;
}

const money = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt('คัดลอกข้อความนี้', text);
        }
      }}
      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#C9A45C]/60 text-[11px] font-bold text-[#FCE694] hover:bg-[#221A0E] min-h-[34px]"
      aria-label={`คัดลอก${label}`}
    >
      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{done ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
    </button>
  );
};

/** QR with the exact order total baked in, so nothing has to be typed in the banking app. */
const PromptPayQr: React.FC<{ promptPayId: string; amount: number; orderNumber: string }> = ({
  promptPayId,
  amount,
  orderNumber,
}) => {
  const [dataUrl, setDataUrl] = useState('');
  const payload = buildPromptPayPayload(promptPayId, amount);

  useEffect(() => {
    let alive = true;
    if (!payload) return;
    QRCode.toDataURL(payload, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
      .then((u) => alive && setDataUrl(u))
      .catch(() => alive && setDataUrl(''));
    return () => {
      alive = false;
    };
  }, [payload]);

  if (!payload) {
    return <p className="text-xs text-red-200">รหัสพร้อมเพย์ไม่ถูกต้อง กรุณาโอนผ่านบัญชีธนาคารหรือแจ้งเจ้าหน้าที่</p>;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-2xl bg-white p-3 shadow-lg">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR พร้อมเพย์ ยอด ${money(amount)}`} className="w-52 h-52 sm:w-56 sm:h-56" />
        ) : (
          <div className="w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center text-[#5A5244]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </div>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`PromptPay-${orderNumber}.png`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FCE694] underline underline-offset-2 min-h-[32px]"
        >
          <Download className="w-3.5 h-3.5" />
          บันทึกรูป QR ไว้สแกนจากแอปธนาคาร
        </a>
      )}
    </div>
  );
};

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ order, phoneVerify, channels, onOrderUpdated }) => {
  const [method, setMethod] = useState<'promptpay' | 'bank_transfer'>(order.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'promptpay');
  const [preview, setPreview] = useState('');
  const [image, setImage] = useState('');
  const [amount, setAmount] = useState(String(order.grandTotal));
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justSent, setJustSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadedAt, setUploadedAt] = useState(order.slipUploadedAt || '');
  useEffect(() => setUploadedAt(order.slipUploadedAt || ''), [order.slipUploadedAt]);

  const paid = order.paymentStatus === 'verified_paid';
  const rejected = order.paymentStatus === 'payment_rejected';

  if (paid) {
    return (
      <div className="no-print rounded-2xl border border-emerald-400/50 bg-emerald-950/40 p-5 flex items-start gap-3 text-emerald-100">
        <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-300" />
        <div className="text-sm">
          <p className="font-bold">เจ้าหน้าที่ยืนยันการชำระเงินเรียบร้อยแล้ว</p>
          <p className="text-xs text-emerald-100/80">ติดตามการเตรียมและจัดส่งวัตถุมงคลได้ที่เมนู “ตรวจสอบสถานะ”</p>
        </div>
      </div>
    );
  }
  if (rejected) return null;

  const pick = async (file: File | undefined) => {
    setError('');
    if (!file) return;
    try {
      const url = await compressSlipImage(file);
      setImage(url);
      setPreview(url);
    } catch (e) {
      setImage('');
      setPreview('');
      setError(e instanceof Error ? e.message : 'เลือกไฟล์ไม่สำเร็จ');
    }
  };

  const send = async () => {
    if (!image || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/orders/slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          phoneVerify,
          image,
          transferAmount: Number(amount) || undefined,
          transferTime: when,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'แนบสลิปไม่สำเร็จ กรุณาลองอีกครั้ง');
        return;
      }
      setUploadedAt(data.order?.slipUploadedAt || new Date().toISOString());
      setJustSent(true);
      setImage('');
      setPreview('');
      if (fileRef.current) fileRef.current.value = '';
      if (data.order) onOrderUpdated?.(data.order as PublicTrackedOrder);
    } catch {
      setError('เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full px-3 py-2.5 min-h-[44px] text-sm border border-[#C9A45C]/50 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]';

  return (
    <section className="no-print sacred-shrine-pedestal rounded-2xl p-5 sm:p-7 space-y-6" aria-labelledby="pay-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="pay-title" className="font-serif-heritage text-xl font-bold text-[#FCE694]">
            ขั้นตอนต่อไป: ชำระเงินและแนบสลิป
          </h2>
          <p className="text-xs text-[#F7F2E8]/75">ใบจอง {order.orderNumber} · โอนแล้วอัปโหลดสลิป เจ้าหน้าที่จะตรวจสอบและยืนยันให้</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="block text-[11px] text-[#E5C158]">ยอดที่ต้องชำระ</span>
          <span className="font-tabular text-2xl font-bold text-[#FCE694]">{money(order.grandTotal)}</span>
        </div>
      </div>

      {/* Step 1 – pay */}
      <div className="rounded-xl border border-[#C9A45C]/40 bg-[#110D08]/90 p-4 sm:p-5 space-y-4">
        <p className="text-sm font-bold text-[#FCE694]">
          <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-[#FCE694] text-[#18140E] text-xs mr-2">1</span>
          โอนเงิน
        </p>
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="ช่องทางชำระเงิน">
          {([
            ['promptpay', 'พร้อมเพย์ (สแกน QR)'],
            ['bank_transfer', 'โอนบัญชีธนาคาร'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={method === k}
              onClick={() => setMethod(k)}
              className={`min-h-[44px] rounded-xl border text-xs sm:text-sm font-bold transition-colors ${
                method === k ? 'border-[#FCE694] bg-[#2A200F] text-[#FCE694]' : 'border-[#C9A45C]/40 text-[#F7F2E8]/80 hover:bg-[#1C160C]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {method === 'promptpay' ? (
          <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
            <PromptPayQr promptPayId={channels.promptPayId} amount={order.grandTotal} orderNumber={order.orderNumber} />
            <ul className="text-xs text-[#F7F2E8]/85 space-y-2 leading-relaxed">
              <li>เปิดแอปธนาคาร → เลือก “สแกน QR” → สแกนรูปนี้ ยอดเงินจะขึ้นให้อัตโนมัติ</li>
              <li>
                ผู้รับเงิน: <strong className="text-[#FCE694]">{channels.accountName}</strong>
              </li>
              <li>
                ตรวจชื่อผู้รับก่อนกดยืนยันทุกครั้ง · ยอด <strong className="text-[#FCE694]">{money(order.grandTotal)}</strong>
              </li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#C9A45C]/30 p-3">
              <div className="min-w-0">
                <p className="text-[11px] text-[#E5C158]">{channels.bankName}</p>
                <p className="font-tabular text-lg font-bold text-[#FCE694] break-all">{channels.accountNumber}</p>
                <p className="text-xs text-[#F7F2E8]/80 break-words">ชื่อบัญชี {channels.accountName}</p>
              </div>
              <CopyButton text={channels.accountNumber.replace(/\D/g, '')} label="เลขบัญชี" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#C9A45C]/30 p-3">
              <div>
                <p className="text-[11px] text-[#E5C158]">ยอดโอน</p>
                <p className="font-tabular text-lg font-bold text-[#FCE694]">{money(order.grandTotal)}</p>
              </div>
              <CopyButton text={String(order.grandTotal)} label="ยอดเงิน" />
            </div>
          </div>
        )}
      </div>

      {/* Step 2 – slip */}
      <div className="rounded-xl border border-[#C9A45C]/40 bg-[#110D08]/90 p-4 sm:p-5 space-y-4">
        <p className="text-sm font-bold text-[#FCE694]">
          <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-[#FCE694] text-[#18140E] text-xs mr-2">2</span>
          แนบสลิปการโอน
        </p>

        {uploadedAt && (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-3 text-xs text-emerald-100">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
            <span>
              {justSent ? 'ส่งสลิปเรียบร้อยแล้ว' : 'มีสลิปในระบบแล้ว'} (เมื่อ {new Date(uploadedAt).toLocaleString('th-TH')}) — รอเจ้าหน้าที่ตรวจสอบ
              ปกติภายใน 1 วันทำการ หากโอนผิดหรือแนบผิดรูป แนบใหม่ได้ด้านล่าง
            </span>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="slip-file" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? (
          <div className="flex items-start gap-3">
            <img src={preview} alt="ตัวอย่างสลิปที่เลือก" className="w-28 max-h-44 object-contain rounded-lg border border-[#C9A45C]/50 bg-white" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FCE694] underline underline-offset-2 min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              เลือกรูปอื่น
            </button>
          </div>
        ) : (
          <label
            htmlFor="slip-file"
            className="flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-xl border-2 border-dashed border-[#C9A45C]/60 hover:bg-[#1C160C] cursor-pointer text-center px-4 py-5"
          >
            <ImagePlus className="w-8 h-8 text-[#FCE694]" />
            <span className="text-sm font-bold text-[#FCE694]">แตะเพื่อเลือกรูปสลิป</span>
            <span className="text-[11px] text-[#F7F2E8]/70">JPG / PNG / WebP · ระบบย่อขนาดให้อัตโนมัติ</span>
          </label>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="slip-amount" className="block text-[11px] font-semibold text-[#E5C158] mb-1">
              ยอดที่โอน (บาท)
            </label>
            <input id="slip-amount" inputMode="decimal" className={input} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
          </div>
          <div>
            <label htmlFor="slip-time" className="block text-[11px] font-semibold text-[#E5C158] mb-1">
              วัน-เวลาที่โอน (ไม่บังคับ)
            </label>
            <input id="slip-time" className={input} value={when} maxLength={40} placeholder="เช่น 14:30 น. วันนี้" onChange={(e) => setWhen(e.target.value)} />
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-950/60 border border-red-400/50 text-xs text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={send}
          disabled={!image || busy}
          className="w-full min-h-[48px] rounded-xl btn-sacred-gold disabled:opacity-50 font-bold text-sm inline-flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {busy ? 'กำลังส่งสลิป...' : uploadedAt ? 'ส่งสลิปใหม่แทนอันเดิม' : 'ส่งสลิปให้เจ้าหน้าที่ตรวจสอบ'}
        </button>
        <p className="text-[11px] text-[#F7F2E8]/60">สลิปใช้ตรวจสอบการชำระเงินของใบจองนี้เท่านั้น เห็นได้เฉพาะเจ้าหน้าที่ผู้ดูแลระบบ</p>
      </div>
    </section>
  );
};
