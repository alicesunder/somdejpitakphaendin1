import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Expand,
  FileCheck2,
  Grid,
  Headphones,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  Search,
  Sparkles,
  Truck,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AmuletProduct, AngleType, RajaSetSlot, SiteConfig } from '../types';
import {
  CeremonySplitBannerArt,
  SacredMandalaAura,
  SpecimenPlate,
  ThaiCornerBrackets,
} from './SacredArtwork';
import { RajaNumberGridModal } from './RajaNumberGridModal';

interface ProductDetailViewProps {
  product: AmuletProduct;
  relatedProducts: AmuletProduct[];
  siteConfig: SiteConfig;
  rajaSlots: RajaSetSlot[];
  sessionId: string;
  selectedRajaNumbers: number[];
  onToggleRajaSlot: (slotNumber: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onBackToCatalog: () => void;
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: AmuletProduct, quantity: number) => void;
  onBuyNow: (product: AmuletProduct, quantity: number) => void;
  onNavigateCheckout: () => void;
}

const SHORT_ANGLE_LABELS: Record<AngleType, string> = {
  front: 'ด้านหน้า',
  back: 'ด้านหลัง',
  edge: 'คู่หน้า–หลัง',
  box: 'เทียบ ๒ พิมพ์',
};

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  relatedProducts,
  rajaSlots,
  sessionId,
  selectedRajaNumbers,
  onToggleRajaSlot,
  wishlist,
  onToggleWishlist,
  onBackToCatalog,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onNavigateCheckout,
}) => {
  const [selectedAngle, setSelectedAngle] = useState<AngleType>('front');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<
    'detail' | 'history' | 'ceremony' | 'care'
  >('detail');

  // Inline stage zoom & full-screen lightbox states
  const [inlineZoomed, setInlineZoomed] = useState<boolean>(false);
  const [panOrigin, setPanOrigin] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<1 | 1.75 | 2.5>(1.75);

  // Reset angle and zoom when switching products
  useEffect(() => {
    setSelectedAngle('front');
    setInlineZoomed(false);
    setQuantity(1);
  }, [product.id]);

  const angleList = product.angles;
  const currentIdx = Math.max(
    0,
    angleList.findIndex((a) => a.angle === selectedAngle)
  );
  const currentAngleObj = angleList[currentIdx] || angleList[0];
  const outOfStock = !product.isMadeToOrder && product.stock <= 0;
  const isWishlisted = wishlist.includes(product.id);

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (!product.isMadeToOrder && next > product.stock) {
        return Math.max(1, product.stock);
      }
      return next;
    });
  };

  const handlePrevAngle = () => {
    const prevIdx = (currentIdx - 1 + angleList.length) % angleList.length;
    setSelectedAngle(angleList[prevIdx].angle);
  };

  const handleNextAngle = () => {
    const nextIdx = (currentIdx + 1) % angleList.length;
    setSelectedAngle(angleList[nextIdx].angle);
  };

  // Keyboard navigation inside the enlarged Lightbox modal
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevAngle();
      } else if (e.key === 'ArrowRight') {
        handleNextAngle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!inlineZoomed && !isLightboxOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(
      10,
      Math.min(90, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.max(
      10,
      Math.min(90, ((e.clientY - rect.top) / rect.height) * 100)
    );
    setPanOrigin({ x, y });
  };

  const handleAddClick = () => {
    if (outOfStock) return;
    onAddToCart(product, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  };

  return (
    <div className="relative bg-[#080705] text-[#F7F2E8] min-h-screen py-8 sm:py-12 overflow-hidden">
      {/* Ambient Museum Spotlight Cone */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[960px] h-[420px] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(212,175,55,0.28) 0%, rgba(140,105,36,0.16) 48%, rgba(8,7,5,0) 75%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#E5C158]/80"
        >
          <button
            type="button"
            onClick={onBackToCatalog}
            className="hover:text-[#FCE694] transition-colors font-medium"
          >
            หน้าหลัก
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button
            type="button"
            onClick={onBackToCatalog}
            className="hover:text-[#FCE694] transition-colors font-medium"
          >
            วัตถุมงคล
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#FCE694] font-bold">
            รหัส {product.code} · {product.name}
          </span>
        </nav>

        {/* Main Split Module: 3D Shrine Inspection Stage Left | Sacred Curatorial Ledger Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left 5 Columns: Main Amulet Inspection Stage + Clickable Thumbnail Gallery + Quantity Stepper */}
          <div className="lg:col-span-5 space-y-4">
            {/* Large Main Amulet Inspection Shrine Frame */}
            <div className="relative rounded-2xl overflow-hidden sacred-shrine-pedestal">
              {/* Top Inspection Toolbar */}
              <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-[#15110B]/95 border-b border-[#C9A45C]/35 text-xs">
                <span className="font-semibold text-[#FCE694] flex items-center gap-1.5 break-words min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#FCE694] shrink-0" />
                  <span>
                    มุมมองที่ {currentIdx + 1}/{angleList.length}:{' '}
                    {currentAngleObj?.label}
                  </span>
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInlineZoomed((z) => !z)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors border ${
                      inlineZoomed
                        ? 'bg-[#C9A45C] text-[#0E0B07] border-[#FCE694]'
                        : 'bg-[#221A0E] text-[#FCE694] border-[#C9A45C]/50 hover:border-[#FCE694]'
                    }`}
                  >
                    {inlineZoomed ? (
                      <>
                        <ZoomOut className="w-3.5 h-3.5" />
                        <span>ย่อ 1x</span>
                      </>
                    ) : (
                      <>
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>ส่อง 2x</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLightboxZoom(1);
                      setIsLightboxOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg btn-sacred-gold text-[11px] font-bold flex items-center gap-1"
                  >
                    <Expand className="w-3.5 h-3.5" />
                    <span>ขยายภาพใหญ่</span>
                  </button>
                </div>
              </div>

              {/* Interactive Main Image Viewport with Sacred Mandala & 3D Angle Transition */}
              <div
                onMouseMove={handleStageMouseMove}
                onClick={() => {
                  if (!inlineZoomed) {
                    setLightboxZoom(1);
                    setIsLightboxOpen(true);
                  }
                }}
                title="คลิกเพื่อเปิดหน้าต่างส่องขยายภาพขนาดใหญ่"
                className={`relative aspect-[4/4.3] overflow-hidden ${
                  inlineZoomed ? 'cursor-move' : 'cursor-zoom-in'
                }`}
              >
                <SacredMandalaAura className="absolute inset-0 z-0 opacity-50" />

                <div
                  key={selectedAngle}
                  className="w-full h-full relative z-10 animate-pedestal-flip"
                >
                  <SpecimenPlate
                    style={product.specimenStyle}
                    angle={selectedAngle}
                    code={product.code}
                    yearBE={product.yearBE}
                    imageUrl={currentAngleObj?.imageUrl}
                    alt={`${product.name} - ${currentAngleObj?.label || ''}`}
                    zoomScale={inlineZoomed ? 2 : 1}
                    zoomOrigin={panOrigin}
                    className="w-full h-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevAngle();
                  }}
                  aria-label="มุมมองก่อนหน้า"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#110D08]/90 text-[#FCE694] hover:bg-[#261D10] flex items-center justify-center border border-[#C9A45C]/70 shadow-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextAngle();
                  }}
                  aria-label="มุมมองถัดไป"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#110D08]/90 text-[#FCE694] hover:bg-[#261D10] flex items-center justify-center border border-[#C9A45C]/70 shadow-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Active Angle Caption Footer */}
              <div className="px-3.5 py-2.5 bg-[#15110B]/95 border-t border-[#C9A45C]/30 flex items-center justify-between gap-2 text-xs text-[#F7F2E8]/90">
                <p className="break-words min-w-0">{currentAngleObj?.caption}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxZoom(1);
                    setIsLightboxOpen(true);
                  }}
                  className="text-[11px] font-semibold text-[#FCE694] hover:underline whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  <span>คลิกเพื่อส่องมวลสาร</span>
                </button>
              </div>
            </div>

            {/* Clickable 4-Angle Thumbnail Gallery with Labels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#E5C158]/80">
                <span className="font-bold text-[#FCE694]">
                  คลิกเลือกมุมมองเพื่อดูภาพขยาย ({angleList.length} มุมมอง)
                </span>
                <span>คลิกซ้ำที่ภาพย่อเพื่อเปิดโหมดเต็มจอ</span>
              </div>

              <div
                role="group"
                aria-label="เลือกมุมมองภาพวัตถุมงคล"
                className="grid grid-cols-4 gap-3"
              >
                {product.angles.map((ang, idx) => {
                  const isSelected = ang.angle === selectedAngle;
                  return (
                    <button
                      key={ang.angle}
                      type="button"
                      aria-pressed={isSelected}
                      style={{ '--stagger-index': idx } as React.CSSProperties}
                      onClick={() => {
                        if (isSelected) {
                          setLightboxZoom(1);
                          setIsLightboxOpen(true);
                        } else {
                          setSelectedAngle(ang.angle);
                        }
                      }}
                      className={`group relative sacred-stagger-reveal rounded-xl overflow-hidden border-2 aspect-square transition-all text-left focus:outline-none ${
                        isSelected
                          ? 'border-[#FCE694] ring-2 ring-[#C9A45C] scale-[1.03] shadow-lg'
                          : 'border-[#8A6D2F]/55 opacity-80 hover:opacity-100 hover:border-[#C9A45C]'
                      }`}
                    >
                      <SpecimenPlate
                        style={product.specimenStyle}
                        angle={ang.angle}
                        code={product.code}
                        yearBE={product.yearBE}
                        imageUrl={ang.imageUrl}
                        alt={ang.label}
                        variant="thumbnail"
                        className="w-full h-full"
                      />

                      <div
                        className={`absolute inset-x-0 bottom-0 px-1.5 py-1 text-center text-[10px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-[#261D10]/95 text-[#FCE694]'
                            : 'bg-black/80 text-[#F7F2E8] group-hover:bg-[#261D10]/90'
                        }`}
                      >
                        {SHORT_ANGLE_LABELS[ang.angle] || ang.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper for regular products */}
            {!product.requiresNumberSelection && (
              <div className="sacred-vault-card rounded-xl px-4 py-2.5 flex items-center justify-between">
                <button
                  type="button"
                  disabled={outOfStock || quantity <= 1}
                  onClick={() => handleQtyChange(-1)}
                  aria-label="ลดจำนวน"
                  className="w-8 h-8 rounded-lg text-[#FCE694] hover:bg-[#261D10] disabled:opacity-40 flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#E5C158]">ระบุจำนวนจอง:</span>
                  <input
                    type="number"
                    min={1}
                    max={product.isMadeToOrder ? 999 : product.stock}
                    disabled={outOfStock}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      const maxVal = product.isMadeToOrder ? 999 : product.stock;
                      setQuantity(Math.max(1, Math.min(maxVal, val)));
                    }}
                    className="w-16 text-center font-tabular text-base font-bold text-[#FCE694] bg-[#110D08] border border-[#C9A45C]/50 rounded-lg py-1 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={
                    outOfStock ||
                    (!product.isMadeToOrder && quantity >= product.stock)
                  }
                  onClick={() => handleQtyChange(1)}
                  aria-label="เพิ่มจำนวน"
                  className="w-8 h-8 rounded-lg text-[#FCE694] hover:bg-[#261D10] disabled:opacity-40 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right 7 Columns: Sacred Curatorial Ledger, Specification Table, Stacked Gold & Obsidian CTAs */}
          <div
            style={{ '--stagger-index': 1 } as React.CSSProperties}
            className="lg:col-span-7 relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <ThaiCornerBrackets className="inset-3 opacity-60" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#E5C158] tracking-[0.14em] uppercase">
                <span className="px-2.5 py-0.5 rounded bg-[#241B10] border border-[#FCE694]/70 font-tabular font-bold text-[#FCE694]">
                  รหัส {product.code}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.categoryLabel}</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif-heritage text-2xl sm:text-4xl font-bold text-gold-shimmer leading-snug">
                  {product.name}
                  <span className="block text-xl sm:text-2xl text-[#F7F2E8] mt-1 font-semibold">
                    {product.series}
                  </span>
                </h1>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  aria-pressed={isWishlisted}
                  aria-label={
                    isWishlisted
                      ? `นำ ${product.name} ออกจากรายการโปรด`
                      : `บันทึก ${product.name} เป็นรายการโปรด`
                  }
                  className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${
                    isWishlisted
                      ? 'bg-[#2C2111] border-[#FCE694] text-[#FCE694]'
                      : 'bg-[#120E09] border-[#C9A45C]/65 text-[#F7F2E8] hover:border-[#FCE694] hover:text-[#FCE694]'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform ${
                      isWishlisted ? 'fill-[#FCE694] scale-110' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <span className="font-tabular text-3xl sm:text-4xl font-bold text-[#FCE694] drop-shadow">
                  ฿{product.price.toLocaleString()}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                    outOfStock
                      ? 'bg-red-950/60 border-red-400/50 text-red-300'
                      : product.isMadeToOrder
                      ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-300'
                      : 'bg-[#221A0E] border-[#FCE694]/60 text-[#FCE694]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      outOfStock
                        ? 'bg-red-400'
                        : product.isMadeToOrder
                        ? 'bg-emerald-400'
                        : 'bg-[#FCE694]'
                    }`}
                  />
                  <span>
                    {outOfStock
                      ? 'หมด'
                      : product.isMadeToOrder
                      ? 'ตามจอง (ไม่จำกัดสต็อก)'
                      : product.requiresNumberSelection
                      ? `เลือกหมายเลข 1–99 · คงเหลือ ${product.stock} / 99 ชุด`
                      : `พร้อมจอง · คงเหลือ ${product.stock.toLocaleString()} (จาก ${(
                          product.initialStock ?? product.stock
                        ).toLocaleString()})`}
                  </span>
                </span>
              </div>
            </div>

            {/* Clean Specification Table */}
            <dl className="relative z-10 divide-y divide-[#C9A45C]/25 border-t border-b border-[#C9A45C]/30 text-sm">
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#E5C158]/80 font-medium">รหัสใบจอง / หมวด</dt>
                <dd className="col-span-2 text-[#FFFFFF] font-bold">
                  {product.code} · {product.categoryLabel}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#E5C158]/80 font-medium">พิมพ์พระ</dt>
                <dd className="col-span-2 text-[#FFFFFF] font-bold">
                  {product.moldType || 'พิมพ์นิยม'} ({product.series})
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#E5C158]/80 font-medium">วัสดุ / เนื้อพระ</dt>
                <dd className="col-span-2 text-[#FFFFFF] font-bold">
                  {product.material}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#E5C158]/80 font-medium">ขนาดพิมพ์พระ</dt>
                <dd className="col-span-2 text-[#FFFFFF] font-bold font-tabular space-y-1">
                  <div>{product.dimensions}</div>
                  {product.moldDimensionsNote && (
                    <div className="text-xs font-normal text-[#E5C158]/90">
                      {product.moldDimensionsNote}
                    </div>
                  )}
                </dd>
              </div>
              <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="text-[#E5C158]/80 font-medium">จำนวนจัดสร้าง / การรับรอง</dt>
                <dd className="col-span-2 text-[#FCE694] font-bold">
                  {product.certificateInfo}
                </dd>
              </div>
            </dl>

            {/* Itemized Set Breakdown Table (รายการภายในชุด สำหรับ ช1, ช2, ช3) */}
            {product.setBreakdown && product.setBreakdown.length > 0 && (
              <div className="relative z-10 rounded-xl bg-[#110D08]/95 border border-[#C9A45C]/55 p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-[#C9A45C]/30 pb-2">
                  <h2 className="font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694]">
                    รายการภายในชุด ({product.code} {product.name})
                  </h2>
                  <span className="text-xs font-tabular text-[#E5C158]">
                    {product.setBreakdown.length} รายการ
                  </span>
                </div>
                <div className="divide-y divide-[#C9A45C]/20 text-xs sm:text-sm">
                  {product.setBreakdown.map((row, idx) => (
                    <div
                      key={idx}
                      className="py-2 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#FFFFFF]">
                          {row.item}
                        </p>
                        {row.mold && (
                          <p className="text-[11px] text-[#E5C158]/80">
                            {row.mold}
                          </p>
                        )}
                      </div>
                      <span className="font-tabular font-bold text-[#FCE694] shrink-0 bg-[#1F180D] px-2.5 py-1 rounded border border-[#C9A45C]/40">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="relative z-10 space-y-3 pt-2">
              {product.requiresNumberSelection ? (
                <div className="space-y-2.5">
                  <a
                    href="#raja-number-grid-section"
                    className="w-full py-3.5 px-6 rounded-xl btn-sacred-gold font-bold text-base flex items-center justify-center gap-2 transition-all"
                  >
                    <Grid className="w-5 h-5" />
                    <span>
                      เลือกหมายเลข 1–99 ด้านล่าง (เลือกไว้แล้ว{' '}
                      {selectedRajaNumbers.length} เลข)
                    </span>
                  </a>
                  {selectedRajaNumbers.length > 0 && (
                    <button
                      type="button"
                      onClick={onNavigateCheckout}
                      className="w-full py-3 px-6 rounded-xl bg-[#221A0E] text-[#FCE694] border border-[#FCE694] font-bold text-sm hover:bg-[#302413]"
                    >
                      ไปที่ฟอร์มจองพร้อมหมายเลข{' '}
                      {selectedRajaNumbers.map((n) => `#${n}`).join(', ')} →
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={handleAddClick}
                    className="w-full py-3.5 px-6 rounded-xl btn-sacred-gold disabled:opacity-50 font-bold text-base transition-all"
                  >
                    {outOfStock
                      ? 'สินค้าหมด (ครบจำนวนจัดสร้าง)'
                      : `เพิ่มลงตะกร้าจอง (${quantity} รายการ)`}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <button
                      type="button"
                      disabled={outOfStock}
                      onClick={() => onBuyNow(product, quantity)}
                      className="sm:col-span-8 w-full py-3.5 px-6 rounded-xl bg-[#221A0E] text-[#FCE694] border border-[#C9A45C]/70 hover:bg-[#302413] hover:border-[#FCE694] disabled:opacity-50 font-bold text-base shadow-md transition-all"
                    >
                      จองทันที (ไปที่ฟอร์มจอง)
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleWishlist(product.id)}
                      aria-pressed={isWishlisted}
                      className={`sm:col-span-4 w-full py-3.5 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        isWishlisted
                          ? 'bg-[#2C2111] border-[#FCE694] text-[#FCE694]'
                          : 'bg-[#120E09] border-[#C9A45C]/55 text-[#F7F2E8] hover:border-[#FCE694] hover:text-[#FCE694]'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 shrink-0 ${
                          isWishlisted ? 'fill-[#FCE694]' : ''
                        }`}
                      />
                      <span>{isWishlisted ? 'บันทึกแล้ว' : 'บันทึกองค์พระ'}</span>
                    </button>
                  </div>
                </>
              )}

              {addedFeedback && (
                <div
                  role="status"
                  className="p-3 rounded-xl bg-[#1A140B] border border-[#FCE694] text-xs text-[#FCE694] flex items-center gap-2 font-semibold animate-sacred-reveal"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#FCE694] shrink-0" />
                  <span>
                    เพิ่ม &ldquo;{product.code} {product.name}&rdquo; จำนวน{' '}
                    {quantity} รายการ ลงในตะกร้าจองเรียบร้อยแล้ว
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline 99-Slot Number Selection Grid for ช1 ชุดทองคำใหญ่ราชาฤกษ์ */}
        {product.requiresNumberSelection && (
          <section id="raja-number-grid-section" className="pt-2">
            <RajaNumberGridModal
              mode="inline"
              product={product}
              rajaSlots={rajaSlots}
              sessionId={sessionId}
              selectedNumbers={selectedRajaNumbers}
              onToggleSlot={onToggleRajaSlot}
              onConfirmProceed={onNavigateCheckout}
            />
          </section>
        )}

        {/* 4 Service Trust Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {[
            { icon: Truck, label: 'จัดส่งทั่วประเทศ' },
            { icon: FileCheck2, label: 'ออกเลขที่ใบจองอัตโนมัติ' },
            { icon: PackageCheck, label: 'รับใบจองทางอีเมลหลังตรวจสลิป' },
            { icon: Headphones, label: 'ทีมงานดูแล' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                style={{ '--stagger-index': i } as React.CSSProperties}
                className="sacred-vault-card sacred-stagger-reveal rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2"
              >
                <Icon className="w-6 h-6 text-[#FCE694] stroke-[1.75]" />
                <span className="text-xs sm:text-sm font-bold text-[#F7F2E8]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 4 Tabbed Content Section with Ceremony Photo */}
        <div
          style={{ '--stagger-index': 2 } as React.CSSProperties}
          className="relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <ThaiCornerBrackets className="inset-3 opacity-55" />

          <div className="relative z-10 flex flex-wrap items-center gap-6 border-b border-[#C9A45C]/30">
            {[
              { id: 'detail', label: 'รายละเอียดเพิ่มเติม' },
              { id: 'history', label: 'ประวัติการจัดสร้าง' },
              { id: 'ceremony', label: 'พิธีพุทธาภิเษก' },
              { id: 'care', label: 'วิธีการดูแลรักษา' },
            ].map((tab) => {
              const active = activeInfoTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveInfoTab(
                      tab.id as 'detail' | 'history' | 'ceremony' | 'care'
                    )
                  }
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                    active
                      ? 'border-[#FCE694] text-[#FCE694]'
                      : 'border-transparent text-[#E5C158]/75 hover:text-[#FFFFFF]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
              <div
                key={activeInfoTab}
                className="space-y-3 text-sm text-[#F7F2E8]/90 leading-relaxed animate-sacred-reveal"
              >
                {activeInfoTab === 'detail' && (
                  <>
                    <p>{product.description}</p>
                    <p>
                      <strong className="text-[#FCE694]">วัตถุประสงค์การจัดสร้าง:</strong>{' '}
                      {product.purposeSummary}
                    </p>
                  </>
                )}
                {activeInfoTab === 'history' && (
                  <p>
                    จัดสร้างขึ้นในวาระที่ระลึก {product.series} (พ.ศ.{' '}
                    {product.yearBE}) เพื่อเป็นอนุสรณ์แห่งความเสียสละของตำรวจตระเวนชายแดน
                    และนำรายได้สมทบทุนการศึกษาแก่เยาวชนในพื้นที่ห่างไกล
                  </p>
                )}
                {activeInfoTab === 'ceremony' && (
                  <p>
                    ประกอบพิธีมหาพุทธาภิเษกตามแบบแผนประเพณีโบราณ
                    โดยพระเกจิอาจารย์ผู้ทรงคุณวุฒิร่วมอธิษฐานจิต
                    พร้อมตอกโค้ดและหมายเลขกำกับประจำองค์เพื่อความโปร่งใส ({product.certificateInfo})
                  </p>
                )}
                {activeInfoTab === 'care' && (
                  <p>
                    ควรเก็บรักษาวัตถุมงคลไว้ในกล่องเดิมหรือตลับกันความชื้น
                    หลีกเลี่ยงการสัมผัสผิวเหรียญหรือองค์พระด้วยมือเปล่าโดยตรงเพื่อรักษาผิวเดิมให้งดงามสมบูรณ์
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-xl overflow-hidden border border-[#C9A45C]/70 aspect-[16/10] shadow-md">
                <CeremonySplitBannerArt photoOnly className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pt-4 space-y-5">
            <h2 className="font-serif-heritage text-xl sm:text-2xl font-bold text-[#FCE694]">
              วัตถุมงคลรายการอื่นในใบจอง
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.slice(0, 3).map((rel, idx) => {
                const relSaved = wishlist.includes(rel.id);
                return (
                  <div
                    key={rel.id}
                    style={{ '--stagger-index': idx } as React.CSSProperties}
                    className="relative sacred-vault-card sacred-stagger-reveal amulet-specular-sheen rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(rel.id);
                          setSelectedAngle('front');
                          setQuantity(1);
                        }}
                        className="w-full aspect-[4/3.6] block text-left"
                      >
                        <SpecimenPlate
                          style={rel.specimenStyle}
                          angle="front"
                          code={rel.code}
                          yearBE={rel.yearBE}
                          imageUrl={
                            rel.angles.find((a) => a.angle === 'front')?.imageUrl
                          }
                          alt={rel.name}
                          className="w-full h-full"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleWishlist(rel.id)}
                        aria-pressed={relSaved}
                        aria-label={
                          relSaved
                            ? `นำ ${rel.name} ออกจากรายการโปรด`
                            : `บันทึก ${rel.name} เป็นรายการโปรด`
                        }
                        className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow ${
                          relSaved
                            ? 'bg-[#281E10] border-[#FCE694] text-[#FCE694]'
                            : 'bg-[#110D08]/90 border-[#C9A45C]/70 text-[#F7F2E8]/90 hover:text-[#FCE694]'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            relSaved ? 'fill-[#FCE694]' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-serif-heritage text-base font-bold text-[#FFFFFF] break-words">
                        {rel.code} {rel.name}
                      </h3>
                      <p className="text-xs text-[#E5C158]/80">{rel.categoryLabel}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#C9A45C]/25">
                        <span className="font-tabular text-base font-bold text-[#FCE694]">
                          ฿{rel.price.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(rel.id);
                            setSelectedAngle('front');
                            setQuantity(1);
                          }}
                          className="text-xs font-bold text-[#E5C158] hover:text-[#FCE694]"
                        >
                          ดูรายละเอียด →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Full-Screen High-Magnification Lightbox & Loupe Inspection Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`ส่องขยายรายละเอียด ${product.name}`}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-[#060503]/95 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto"
        >
          {/* Top Modal Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 sacred-shrine-pedestal rounded-2xl px-4 sm:px-6 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-[#E5C158]">
                <span className="font-tabular font-semibold">
                  รหัส {product.code}
                </span>
                <span>·</span>
                <span>
                  มุมมองที่ {currentIdx + 1}/{angleList.length} (
                  {currentAngleObj?.label})
                </span>
              </div>
              <h2 className="font-serif-heritage text-base sm:text-xl font-bold text-[#FCE694] break-words min-w-0">
                {product.name} — {product.series}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="ระดับการขยายภาพ"
                className="inline-flex rounded-xl p-1 bg-[#110D08] border border-[#C9A45C]/40"
              >
                {([1, 1.75, 2.5] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLightboxZoom(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-tabular font-bold transition-all ${
                      lightboxZoom === lvl
                        ? 'btn-sacred-gold'
                        : 'text-[#F7F2E8]/80 hover:text-[#FCE694]'
                    }`}
                  >
                    {lvl}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="ปิดหน้าต่างส่องขยาย"
                className="px-3.5 py-2 rounded-xl bg-[#241B10] hover:bg-[#332716] text-[#FCE694] border border-[#C9A45C]/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>ปิดหน้าต่าง</span>
              </button>
            </div>
          </div>

          {/* Center High-Resolution Zoom & Pan Stage */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
          >
            <div className="lg:col-span-8 relative rounded-2xl overflow-hidden sacred-shrine-pedestal aspect-[4/3.6]">
              <div
                onMouseMove={handleStageMouseMove}
                onClick={() =>
                  setLightboxZoom((z) =>
                    z === 1 ? 1.75 : z === 1.75 ? 2.5 : 1
                  )
                }
                className="w-full h-full overflow-hidden cursor-zoom-in"
              >
                <SpecimenPlate
                  style={product.specimenStyle}
                  angle={selectedAngle}
                  code={product.code}
                  yearBE={product.yearBE}
                  imageUrl={currentAngleObj?.imageUrl}
                  alt={`${product.name} - ${currentAngleObj?.label || ''}`}
                  zoomScale={lightboxZoom}
                  zoomOrigin={panOrigin}
                  className="w-full h-full"
                />
              </div>

              <button
                type="button"
                onClick={handlePrevAngle}
                aria-label="มุมมองก่อนหน้า"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#110D08]/90 text-[#FCE694] hover:bg-[#261D10] flex items-center justify-center border border-[#C9A45C] shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextAngle}
                aria-label="มุมมองถัดไป"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#110D08]/90 text-[#FCE694] hover:bg-[#261D10] flex items-center justify-center border border-[#C9A45C] shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="lg:col-span-4 sacred-shrine-pedestal rounded-2xl p-5 space-y-4 text-[#F7F2E8]">
              <div className="space-y-1 border-b border-[#C9A45C]/30 pb-3">
                <span className="text-xs font-semibold text-[#E5C158]">
                  ข้อมูลมุมมองที่กำลังส่องขยาย
                </span>
                <h3 className="font-serif-heritage text-lg font-bold text-[#FCE694]">
                  {currentAngleObj?.label}
                </h3>
                <p className="text-xs text-[#F7F2E8]/85 leading-relaxed">
                  {currentAngleObj?.caption}
                </p>
              </div>

              <dl className="space-y-2 text-xs bg-[#110D08] border border-[#C9A45C]/30 rounded-xl p-3.5">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#E5C158]/80">เนื้อวัสดุ:</dt>
                  <dd className="font-semibold text-[#FFFFFF] text-right">
                    {product.material}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 pt-1.5 border-t border-[#C9A45C]/20">
                  <dt className="text-[#E5C158]/80">ขนาดองค์พระ:</dt>
                  <dd className="font-semibold font-tabular text-[#FFFFFF] text-right">
                    {product.dimensions}
                  </dd>
                </div>
                <div className="pt-1.5 border-t border-[#C9A45C]/20">
                  <dt className="text-[#E5C158]/80">การตอกโค้ด/หมายเลข:</dt>
                  <dd className="font-semibold text-[#FCE694] mt-0.5">
                    {product.certificateInfo}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-[#E5C158]">
                  เลือกมุมมองภาพขยาย ({angleList.length} มุมมอง)
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {product.angles.map((ang) => {
                    const active = ang.angle === selectedAngle;
                    return (
                      <button
                        key={ang.angle}
                        type="button"
                        onClick={() => setSelectedAngle(ang.angle)}
                        className={`relative rounded-xl overflow-hidden border-2 aspect-square transition-all ${
                          active
                            ? 'border-[#FCE694] scale-105'
                            : 'border-[#8A6D2F]/50 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <SpecimenPlate
                          style={product.specimenStyle}
                          angle={ang.angle}
                          code={product.code}
                          yearBE={product.yearBE}
                          imageUrl={ang.imageUrl}
                          alt={ang.label}
                          variant="thumbnail"
                          className="w-full h-full"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
