import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import { AmuletProduct, RajaSetSlot } from '../types';
import {
  getEffectiveSlotState,
  numberToThaiBahtText,
} from '../utils/commerceRules';
import { ThaiCornerBrackets } from './SacredArtwork';

interface RajaNumberGridProps {
  product: AmuletProduct;
  rajaSlots: RajaSetSlot[];
  sessionId: string;
  selectedNumbers: number[];
  onToggleSlot: (slotNumber: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onConfirmProceed?: () => void;
  onClose?: () => void;
  mode?: 'inline' | 'modal';
}

export const RajaNumberGridModal: React.FC<RajaNumberGridProps> = ({
  product,
  rajaSlots,
  sessionId,
  selectedNumbers,
  onToggleSlot,
  onConfirmProceed,
  onClose,
  mode = 'inline',
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'mine' | 'booked'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slotStates = useMemo(() => {
    const map = new Map<number, RajaSetSlot>();
    for (const s of rajaSlots) {
      map.set(s.slotNumber, s);
    }

    const list = [];
    for (let num = 1; num <= 99; num++) {
      const raw: RajaSetSlot = map.get(num) || {
        slotNumber: num,
        status: 'available',
        sessionId: '',
        heldAt: 0,
        heldUntil: 0,
        orderNumber: '',
        updatedAt: '',
      };
      const eff = getEffectiveSlotState(raw, sessionId, nowMs);
      const isSelectedInCart = selectedNumbers.includes(num);
      list.push({
        raw,
        ...eff,
        isSelectedByMe:
          eff.effectiveStatus === 'selected_by_me' ||
          (eff.effectiveStatus === 'available' && isSelectedInCart),
      });
    }
    return list;
  }, [rajaSlots, sessionId, nowMs, selectedNumbers]);

  const mySelectedSlots = useMemo(
    () => slotStates.filter((s) => s.isSelectedByMe),
    [slotStates]
  );

  const stats = useMemo(() => {
    let available = 0;
    let booked = 0;
    let heldByOther = 0;
    let mine = 0;

    for (const s of slotStates) {
      if (s.effectiveStatus === 'booked' || s.effectiveStatus === 'locked') booked++;
      else if (s.isSelectedByMe) mine++;
      else if (s.effectiveStatus === 'held_by_other') heldByOther++;
      else available++;
    }
    return { available, booked, heldByOther, mine };
  }, [slotStates]);

  const filteredSlots = useMemo(() => {
    if (filterMode === 'available') {
      return slotStates.filter(
        (s) => s.effectiveStatus === 'available' && !s.isSelectedByMe
      );
    }
    if (filterMode === 'mine') {
      return slotStates.filter((s) => s.isSelectedByMe);
    }
    if (filterMode === 'booked') {
      return slotStates.filter(
        (s) =>
          s.effectiveStatus === 'booked' ||
          s.effectiveStatus === 'locked' ||
          s.effectiveStatus === 'held_by_other'
      );
    }
    return slotStates;
  }, [slotStates, filterMode]);

  const totalSelectedCount = mySelectedSlots.length;
  const totalAmount = totalSelectedCount * product.price;
  const totalAmountThai = numberToThaiBahtText(totalAmount);

  const handleClickNumber = async (num: number) => {
    if (busySlot !== null) return;
    setErrorBanner(null);
    setBusySlot(num);
    try {
      const res = await onToggleSlot(num);
      if (!res.success && res.error) {
        setErrorBanner(res.error);
      }
    } finally {
      setBusySlot(null);
    }
  };

  const gridContent = (
    <div className="relative sacred-shrine-pedestal rounded-2xl p-5 sm:p-7 space-y-6 text-[#F7F2E8] border border-[#C9A45C]/60">
      <ThaiCornerBrackets className="inset-2.5 opacity-60" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-[#C9A45C]/35 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FCE694] tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#FCE694]" />
            <span>REAL-TIME ATOMIC NUMBER RESERVATION (1–99) · FIREBASE FIRESTORE</span>
          </div>
          <h2 className="font-serif-heritage text-xl sm:text-2xl font-bold text-gold-shimmer">
            ตารางเลือกหมายเลขประจำชุด (1–99) · {product.code} {product.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#F7F2E8]/85">
            1 หมายเลข = 1 ชุด (บูชาชุดละ ฿{product.price.toLocaleString()} บาท) · เลือกได้หลายหมายเลข · ระบบล็อกเลขแบบ Atomic Realtime นาน 15 นาทีต่อการเลือก
          </p>
        </div>

        {mode === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-[#241B10] hover:bg-[#332716] text-[#FCE694] border border-[#C9A45C]/60 text-xs font-bold flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>ปิดหน้าต่าง</span>
          </button>
        )}
      </div>

      {/* Status Legend & Quick Filter */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-[#110D08]/95 border border-[#C9A45C]/35 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterMode === 'all'
                ? 'btn-sacred-gold'
                : 'bg-[#1C160C] text-[#FCE694] border border-[#C9A45C]/40'
            }`}
          >
            ทั้งหมด (99)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('available')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
              filterMode === 'available'
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                : 'bg-[#14100A] border-[#C9A45C]/35 text-[#F7F2E8]/90 hover:border-[#FCE694]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>ว่าง ({stats.available})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('mine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
              filterMode === 'mine'
                ? 'bg-[#2E2210] border-[#FCE694] text-[#FCE694]'
                : 'bg-[#14100A] border-[#C9A45C]/35 text-[#FCE694] hover:border-[#FCE694]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FCE694]" />
            <span>เลขที่คุณเลือก ({stats.mine})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('booked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all ${
              filterMode === 'booked'
                ? 'bg-red-950/80 border-red-400 text-red-200'
                : 'bg-[#14100A] border-[#C9A45C]/35 text-[#F7F2E8]/80 hover:border-red-400/60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>
              ถูกจองแล้ว ({stats.booked}
              {stats.heldByOther > 0 ? ` · กำลังเลือก ${stats.heldByOther}` : ''})
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#E5C158]">
          <Clock className="w-3.5 h-3.5 text-[#FCE694]" />
          <span>หากเลือกแล้วไม่ยืนยันภายใน 15 นาที ระบบจะปล่อยเลขว่างอัตโนมัติ</span>
        </div>
      </div>

      {errorBanner && (
        <div
          role="alert"
          className="relative z-10 p-3.5 rounded-xl bg-red-950/80 border border-red-400/70 text-xs sm:text-sm text-red-200 flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* 99-Slot Grid */}
      <div
        role="group"
        aria-label="ตารางเลือกหมายเลข 1 ถึง 99 ชุดทองคำใหญ่ราชาฤกษ์"
        className="relative z-10 grid grid-cols-5 sm:grid-cols-9 md:grid-cols-11 gap-2 sm:gap-2.5"
      >
        {filteredSlots.map((slot) => {
          const isBooked = slot.effectiveStatus === 'booked';
          const isLocked = slot.effectiveStatus === 'locked';
          const isHeldOther = slot.effectiveStatus === 'held_by_other';
          const isMine = slot.isSelectedByMe;
          const isLoading = busySlot === slot.slotNumber;
          const isDisabled = isBooked || isLocked || isHeldOther || isLoading;

          const formattedNum = String(slot.slotNumber).padStart(2, '0');

          return (
            <button
              key={slot.slotNumber}
              type="button"
              disabled={isDisabled}
              onClick={() => handleClickNumber(slot.slotNumber)}
              aria-pressed={isMine}
              aria-label={
                isBooked
                  ? `หมายเลข ${slot.slotNumber} ถูกจองแล้ว`
                  : isLocked
                  ? `หมายเลข ${slot.slotNumber} สงวนไว้ ไม่เปิดให้จอง`
                  : isHeldOther
                  ? `หมายเลข ${slot.slotNumber} กำลังมีผู้เลือก เหลือเวลา ${slot.remainingFormatted}`
                  : isMine
                  ? `หมายเลข ${slot.slotNumber} คุณเลือกไว้แล้ว เหลือเวลา ${slot.remainingFormatted} กดเพื่อยกเลิก`
                  : `เลือกหมายเลข ${slot.slotNumber} ว่าง`
              }
              className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-center min-h-[66px] border transition-all select-none font-tabular ${
                isBooked
                  ? 'bg-[#1B0D0D]/90 border-red-500/45 text-red-300/75 cursor-not-allowed opacity-80'
                  : isLocked
                  ? 'bg-[#141414]/90 border-zinc-500/45 text-zinc-400 cursor-not-allowed opacity-80'
                  : isHeldOther
                  ? 'bg-[#24190B]/90 border-amber-500/50 text-amber-300/80 cursor-not-allowed'
                  : isMine
                  ? 'btn-sacred-gold border-2 border-[#FFFFFF] text-[#0D0A06] scale-[1.03] shadow-lg'
                  : 'bg-[#14100A]/95 border-[#C9A45C]/45 text-[#F7F2E8] hover:border-[#FCE694] hover:bg-[#231B10] hover:-translate-y-0.5 cursor-pointer'
              }`}
            >
              <span
                className={`text-sm sm:text-base font-bold leading-none ${
                  isMine
                    ? 'text-[#0D0A06]'
                    : isBooked
                    ? 'text-red-300 line-through'
                    : isLocked
                    ? 'text-zinc-400'
                    : 'text-[#FCE694]'
                }`}
              >
                #{formattedNum}
              </span>

              <span
                className={`mt-1 text-[10px] font-semibold leading-tight text-center ${
                  isMine
                    ? 'text-[#0D0A06] font-bold'
                    : isBooked
                    ? 'text-red-300'
                    : isLocked
                    ? 'text-zinc-400'
                    : isHeldOther
                    ? 'text-amber-300'
                    : 'text-emerald-300/90'
                }`}
              >
                {isLoading
                  ? 'กำลังล็อก...'
                  : isBooked
                  ? 'ถูกจองแล้ว'
                  : isLocked
                  ? 'สงวนไว้'
                  : isHeldOther
                  ? `ล็อก ${slot.remainingFormatted}`
                  : isMine
                  ? slot.remainingMs > 0
                    ? `เลือกแล้ว ${slot.remainingFormatted}`
                    : 'คุณเลือกเลขนี้'
                  : 'ว่าง'}
              </span>

              {(isBooked || isLocked) && (
                <Lock className={`w-2.5 h-2.5 absolute top-1.5 right-1.5 ${isLocked ? 'text-zinc-400' : 'text-red-400/80'}`} />
              )}
              {isMine && (
                <CheckCircle2 className="w-3 h-3 text-[#0D0A06] absolute top-1.5 right-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Summary Footer Bar */}
      <div className="relative z-10 rounded-xl bg-[#110D08] border border-[#FCE694]/55 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#E5C158]">
              หมายเลขชุดทองคำใหญ่ราชาฤกษ์ที่ท่านเลือก ({totalSelectedCount} ชุด):
            </span>
            {mySelectedSlots.length === 0 ? (
              <span className="text-xs text-[#F7F2E8]/70">
                ยังไม่ได้เลือกหมายเลข (กรุณาคลิกเลือกหมายเลข 1–99 ด้านบนอย่างน้อย 1 หมายเลข)
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {mySelectedSlots.map((s) => (
                  <span
                    key={s.slotNumber}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#281E10] border border-[#FCE694] text-xs font-tabular font-bold text-[#FCE694]"
                  >
                    <span>หมายเลข #{String(s.slotNumber).padStart(2, '0')}</span>
                    {s.remainingMs > 0 && (
                      <span className="text-[10px] text-emerald-300">
                        ({s.remainingFormatted})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleClickNumber(s.slotNumber)}
                      title={`ยกเลิกหมายเลข #${s.slotNumber}`}
                      className="hover:text-red-300 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {totalSelectedCount > 0 && (
            <div className="space-y-0.5">
              <p className="text-sm sm:text-base font-bold text-[#FCE694] font-tabular">
                รวมยอดบูชาชุดทองคำใหญ่ราชาฤกษ์ ({totalSelectedCount} ชุด): ฿
                {totalAmount.toLocaleString()} บาท
              </p>
              <p className="text-xs text-[#E5C158] font-medium">
                ({totalAmountThai})
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onConfirmProceed && (
            <button
              type="button"
              disabled={totalSelectedCount === 0}
              onClick={onConfirmProceed}
              className="px-6 py-3 rounded-xl btn-sacred-gold font-bold text-xs sm:text-sm disabled:opacity-40 transition-all"
            >
              {totalSelectedCount > 0
                ? `ยืนยันเลือก ${totalSelectedCount} หมายเลข → ไปที่ฟอร์มจอง`
                : 'กรุณาเลือกหมายเลข 1–99 ก่อนดำเนินการ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="เลือกหมายเลข 1-99 ชุดทองคำใหญ่ราชาฤกษ์"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-[#060503]/95 flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="max-w-5xl w-full my-4"
        >
          {gridContent}
        </div>
      </div>
    );
  }

  return gridContent;
};
