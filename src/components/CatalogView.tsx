import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Download,
  Expand,
  Grid,
  Heart,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AmuletProduct, ProductCategory, RajaSetSlot } from '../types';
import {
  SOMDEJ_BROCHURE_PAGES,
  SOMDEJ_MOLD_SIZES,
} from '../data/seedData';
import {
  filterAndSortProducts,
  resolveWishlistProducts,
} from '../utils/commerceRules';
import {
  OFFICIAL_BROCHURE_PDF_PATH,
  OFFICIAL_STUDIO_PHOTOS_PDF_PATH,
  SpecimenPlate,
  ThaiCornerBrackets,
} from './SacredArtwork';
import { RajaNumberGridModal } from './RajaNumberGridModal';

interface CatalogViewProps {
  products: AmuletProduct[];
  rajaSlots: RajaSetSlot[];
  sessionId: string;
  selectedRajaNumbers: number[];
  onToggleRajaSlot: (slotNumber: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  initialSearchQuery?: string;
  initialCategory?: ProductCategory;
  cartCount?: number;
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: AmuletProduct, qty?: number) => void;
  onNavigateHome?: () => void;
  onNavigateCheckout?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  rajaSlots,
  sessionId,
  selectedRajaNumbers,
  onToggleRajaSlot,
  wishlist,
  onToggleWishlist,
  initialSearchQuery = '',
  initialCategory = 'all',
  cartCount = 0,
  onSelectProduct,
  onAddToCart,
  onNavigateHome,
  onNavigateCheckout,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(350000);
  const [stockFilter, setStockFilter] = useState<
    'all' | 'in_stock' | 'low_stock'
  >('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>(
    'newest'
  );
  const [onlySavedFilter, setOnlySavedFilter] = useState<boolean>(false);
  const [activeBrochurePage, setActiveBrochurePage] = useState<number | null>(
    null
  );
  const [showRajaGridModal, setShowRajaGridModal] = useState<boolean>(false);
  const [quickQtys, setQuickQtys] = useState<Record<string, number>>({});

  React.useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const rajaProduct = useMemo(
    () =>
      products.find((p) => p.code === 'ช1' || p.requiresNumberSelection) ||
      products[0],
    [products]
  );

  const savedProducts = useMemo(
    () => resolveWishlistProducts(products, wishlist),
    [products, wishlist]
  );

  const categories: { id: ProductCategory; label: string; count: number }[] =
    useMemo(() => {
      const visible = products.filter((p) => p.isVisible);
      return [
        {
          id: 'all',
          label: 'ทั้งหมด (ครบทั้ง 23 รหัส · ช1–ช3 & ชศ1–ชศ20)',
          count: visible.length,
        },
        {
          id: 'special_set',
          label: 'ชุดพิเศษ (ช1 ชุดทองคำใหญ่ราชาฤกษ์ · ช2 · ช3)',
          count: visible.filter((p) => p.category === 'special_set').length,
        },
        {
          id: 'cat_1_popular_metal',
          label: 'หมวด 1 พิมพ์นิยม เนื้อโลหะ (ชศ1–ชศ7)',
          count: visible.filter((p) => p.category === 'cat_1_popular_metal')
            .length,
        },
        {
          id: 'cat_2_score_metal',
          label: 'หมวด 2 พิมพ์คะแนน เนื้อโลหะ (ชศ8–ชศ14)',
          count: visible.filter((p) => p.category === 'cat_2_score_metal')
            .length,
        },
        {
          id: 'cat_3_popular_powder',
          label: 'หมวด 3 เนื้อผงพุทธคุณ พิมพ์นิยม (ชศ15–ชศ17)',
          count: visible.filter((p) => p.category === 'cat_3_popular_powder')
            .length,
        },
        {
          id: 'cat_4_score_powder',
          label: 'หมวด 4 เนื้อผงพุทธคุณ พิมพ์คะแนน (ชศ18–ชศ20)',
          count: visible.filter((p) => p.category === 'cat_4_score_powder')
            .length,
        },
      ];
    }, [products]);

  const filteredProducts = useMemo(() => {
    const base = filterAndSortProducts(products, {
      searchQuery,
      category,
      minPrice: 0,
      maxPrice,
      stockFilter,
      sortBy,
    });
    if (onlySavedFilter) {
      return base.filter((p) => wishlist.includes(p.id));
    }
    return base;
  }, [
    products,
    searchQuery,
    category,
    maxPrice,
    stockFilter,
    sortBy,
    onlySavedFilter,
    wishlist,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setMaxPrice(350000);
    setStockFilter('all');
    setSortBy('newest');
    setOnlySavedFilter(false);
  };

  const getQtyForProduct = (prod: AmuletProduct) => {
    const val = quickQtys[prod.id];
    if (!val || val < 1) return 1;
    if (!prod.isMadeToOrder && val > prod.stock) {
      return Math.max(1, prod.stock);
    }
    return val;
  };

  const handleQuickQtyChange = (prod: AmuletProduct, nextVal: number) => {
    const maxAllowed = prod.isMadeToOrder ? 999 : Math.max(1, prod.stock);
    const clamped = Math.max(1, Math.min(maxAllowed, nextVal));
    setQuickQtys((prev) => ({ ...prev, [prod.id]: clamped }));
  };

  return (
    <div className="relative min-h-screen bg-[#080705] text-[#F7F2E8] py-8 sm:py-12 overflow-hidden">
      {/* Ambient Museum Spotlight Cone */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[980px] h-[440px] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(212,175,55,0.28) 0%, rgba(140,105,36,0.16) 48%, rgba(8,7,5,0) 75%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb & Quick Checkout Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-[#E5C158]/85"
          >
            <button
              type="button"
              onClick={onNavigateHome}
              className="hover:text-[#FCE694] transition-colors"
            >
              หน้าหลัก
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#FFFFFF] font-medium">
              ใบรายการสั่งจองวัตถุมงคล (ครบ 23 รหัส)
            </span>
          </nav>

          {cartCount > 0 && onNavigateCheckout && (
            <button
              type="button"
              onClick={onNavigateCheckout}
              className="btn-sacred-gold px-4 py-2 rounded-xl font-bpp-official text-sm sm:text-base font-bold flex items-center gap-2 shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>เลือกไว้แล้ว {cartCount} รายการ · ไปหน้ายืนยันใบจอง →</span>
            </button>
          )}
        </div>

        {/* Page Title & Top Search/Sort Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end border-b border-[#C9A45C]/25 pb-6">
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bpp-motto text-[#FCE694] tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FCE694]" />
              <span>ศรัทธา • เกียรติภูมิ • แผ่นดิน · ครบรอบ ๗๕ ปี ตชด.</span>
            </div>
            <h1 className="font-bpp-official text-3xl sm:text-5xl font-bold text-gold-shimmer">
              สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.
            </h1>
            <p className="text-xs text-[#F7F2E8]/80">
              ชุดพิเศษ ช1–ช3 และหมวดที่ 1–4 (ชศ1–ชศ20) · รายการ &ldquo;ตามจอง&rdquo; ไม่จำกัดสต็อก · รายการจำกัดจำนวนตัดสต็อกอัตโนมัติ
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <label htmlFor="catalog-search" className="sr-only">
                ค้นหาวัตถุมงคล / รหัส ช1, ช2, ช3, ชศ1-ชศ20
              </label>
              <Search className="w-4 h-4 text-[#E5C158] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส (เช่น ช1, ช2, ชศ1, ชศ15) หรือเนื้อพระ..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-[#14100A]/95 text-[#F7F2E8] placeholder-[#E5C158]/55 rounded-xl border border-[#C9A45C]/60 focus:outline-none focus:ring-2 focus:ring-[#FCE694] shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#14100A]/95 text-[#F7F2E8] px-4 py-2.5 rounded-xl border border-[#C9A45C]/60 shrink-0 shadow-inner">
              <label
                htmlFor="sort-order"
                className="text-xs text-[#E5C158] font-semibold whitespace-nowrap"
              >
                เรียงตาม:
              </label>
              <select
                id="sort-order"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'newest' | 'price_asc' | 'price_desc'
                  )
                }
                className="bg-[#14100A] text-xs sm:text-sm font-bold text-[#FCE694] focus:outline-none"
              >
                <option value="newest">ตามลำดับใบรายการ</option>
                <option value="price_asc">ราคา: น้อย → มาก</option>
                <option value="price_desc">ราคา: มาก → น้อย</option>
              </select>
            </div>
          </div>
        </div>

        {/* Highlight Banner for ช1 ชุดทองคำใหญ่ราชาฤกษ์ (เลือกเลข 1-99) */}
        {rajaProduct && (
          <section
            aria-label="ช1 ชุดทองคำใหญ่ราชาฤกษ์ เลือกหมายเลข 1-99"
            className="relative sacred-shrine-pedestal rounded-2xl p-5 sm:p-6 border-2 border-[#FCE694]/70 space-y-4 overflow-hidden"
          >
            <ThaiCornerBrackets className="inset-2.5 opacity-70" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-lg btn-sacred-gold text-xs font-bold">
                    รหัส ช1 · ชุดเอกลักษณ์สูงสุด (มี 99 ชุด)
                  </span>
                  <span className="text-xs font-tabular font-bold text-[#FCE694]">
                    คงเหลือ {rajaProduct.stock} / 99 ชุด · เลือกหมายเลข 1–99 ได้แบบ Realtime
                  </span>
                </div>
                <h2 className="font-serif-heritage text-xl sm:text-2xl font-bold text-[#FCE694]">
                  ช1 ชุดทองคำใหญ่ราชาฤกษ์ — บูชาชุดละ ฿349,999 บาท
                </h2>
                <p className="text-xs sm:text-sm text-[#F7F2E8]/90 max-w-3xl">
                  รวม 20 องค์ (พิมพ์นิยม 10 เนื้อ + พิมพ์คะแนน 10 เนื้อ: ทองคำ, นาก, เงิน, นวะ, ชนวนมวลสาร, ทองเหลือง, ทองแดง, ผงตะกรุดทองคำ, ผงตะกรุดเงิน, ผงพุทธคุณ) พร้อมพระผงพุทธคุณ พิมพ์นิยม 1 กล่อง (100 องค์) พร้อมรูปในพิธีและบัตรรับรอง
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRajaGridModal(true)}
                  className="px-5 py-3 rounded-xl btn-sacred-gold font-bold text-xs sm:text-sm flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  <span>
                    เปิดตารางเลือกหมายเลข 1–99
                    {selectedRajaNumbers.length > 0
                      ? ` (เลือกไว้ ${selectedRajaNumbers.length} เลข)`
                      : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectProduct(rajaProduct.id)}
                  className="px-4 py-3 rounded-xl bg-[#1A140B] border border-[#C9A45C]/60 text-xs sm:text-sm font-bold text-[#FCE694] hover:border-[#FCE694]"
                >
                  ดูรายละเอียดชุด ช1
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Quick Category Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  active
                    ? 'btn-sacred-gold border-[#FCE694]'
                    : 'bg-[#14100A] text-[#F7F2E8]/90 border-[#C9A45C]/45 hover:border-[#FCE694] hover:text-[#FCE694]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 font-tabular opacity-85">
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Dedicated Saved Wishlist Shrine Section */}
        {savedProducts.length > 0 && (
          <section
            aria-label="รายการวัตถุมงคลที่บันทึกไว้"
            className="relative sacred-shrine-pedestal animate-sacred-reveal rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden"
          >
            <ThaiCornerBrackets className="inset-2.5 opacity-65" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#C9A45C]/30 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#241B10] border border-[#FCE694]/70 flex items-center justify-center text-[#FCE694] shadow-md">
                  <Heart className="w-4 h-4 fill-[#FCE694]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-serif-heritage text-lg sm:text-xl font-bold text-[#FCE694]">
                      รายการวัตถุมงคลที่บันทึกไว้ (Wishlist)
                    </h2>
                    <span className="text-xs text-[#E5C158] font-tabular font-bold">
                      · {savedProducts.length} รายการ
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOnlySavedFilter((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  onlySavedFilter
                    ? 'btn-sacred-gold border-[#FCE694]'
                    : 'bg-[#14100A] text-[#FCE694] border-[#C9A45C]/50 hover:border-[#FCE694]'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    onlySavedFilter ? 'fill-[#0E0B07]' : 'fill-[#FCE694]'
                  }`}
                />
                <span>
                  {onlySavedFilter
                    ? 'กำลังแสดงเฉพาะรายการที่บันทึก'
                    : 'กรองเฉพาะที่บันทึกไว้'}
                </span>
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProducts.map((item, idx) => {
                const frontAngle = item.angles.find((a) => a.angle === 'front');
                const outOfStock = !item.isMadeToOrder && item.stock <= 0;
                return (
                  <div
                    key={item.id}
                    style={{ '--stagger-index': idx % 6 } as React.CSSProperties}
                    className="bg-[#110D08]/95 border border-[#C9A45C]/55 hover:border-[#FCE694] rounded-xl p-3 flex items-center gap-3.5 transition-all shadow-lg sacred-stagger-reveal"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectProduct(item.id)}
                      className="w-20 h-20 rounded-lg overflow-hidden border border-[#C9A45C]/60 shrink-0 focus:outline-none"
                    >
                      <SpecimenPlate
                        style={item.specimenStyle}
                        angle="front"
                        code={item.code}
                        yearBE={item.yearBE}
                        imageUrl={frontAngle?.imageUrl}
                        alt={item.name}
                        variant="thumbnail"
                        className="w-full h-full"
                      />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="block text-[10px] font-tabular text-[#E5C158]">
                        รหัส {item.code} · {item.categoryLabel}
                      </span>
                      <h3 className="font-serif-heritage text-sm font-bold text-[#FFFFFF] truncate">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(item.id)}
                          className="text-left hover:text-[#FCE694] transition-colors truncate block w-full"
                        >
                          {item.name}
                        </button>
                      </h3>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="font-tabular text-sm font-bold text-[#FCE694]">
                          ฿{item.price.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(item.id)}
                            className="px-2.5 py-1 rounded bg-[#221A0F] border border-[#C9A45C]/50 text-[11px] font-semibold text-[#FCE694] hover:border-[#FCE694]"
                          >
                            ดูองค์พระ
                          </button>
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() =>
                              item.requiresNumberSelection
                                ? setShowRajaGridModal(true)
                                : onAddToCart(item, 1)
                            }
                            aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
                            className="w-7 h-7 rounded btn-sacred-gold flex items-center justify-center disabled:opacity-40"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(item.id)}
                            aria-label={`นำ ${item.name} ออกจากรายการที่บันทึกไว้`}
                            className="w-7 h-7 rounded bg-[#221A0F] border border-[#C9A45C]/40 text-[#F7F2E8]/80 hover:text-red-300 hover:border-red-400/60 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Main Split: Left Sidebar Filters (3 cols) + Right Product Grid (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-1">
          {/* Left Filter Sidebar */}
          <aside
            style={{ '--stagger-index': 0 } as React.CSSProperties}
            className="lg:col-span-3 relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-5 space-y-6"
          >
            <ThaiCornerBrackets className="inset-2.5 opacity-55" />

            {/* Category Filter */}
            <div className="relative z-10 space-y-3">
              <h2 className="font-serif-heritage text-base font-bold text-[#FCE694] border-b border-[#C9A45C]/25 pb-2">
                หมวดหมู่ตามใบจอง
              </h2>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`w-full flex items-center justify-between text-xs py-2.5 px-3 rounded-xl transition-all text-left ${
                        active
                          ? 'bg-[#2C2111] text-[#FCE694] font-semibold border border-[#FCE694]/60 shadow-inner'
                          : 'text-[#F7F2E8]/85 hover:bg-[#1E170D]'
                      }`}
                    >
                      <span className="flex items-center gap-2 pr-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                            active
                              ? 'border-[#FCE694] bg-[#E5C158] text-[#0E0B07]'
                              : 'border-[#C9A45C]/60'
                          }`}
                        >
                          {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span className="leading-snug">{cat.label}</span>
                      </span>
                      <span className="font-tabular text-xs text-[#E5C158]/80 shrink-0">
                        ({cat.count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="relative z-10 space-y-3 pt-2 border-t border-[#C9A45C]/25">
              <h2 className="font-serif-heritage text-base font-bold text-[#FCE694]">
                ช่วงราคาบูชา
              </h2>
              <input
                type="range"
                min={99}
                max={350000}
                step={500}
                value={maxPrice}
                aria-label="กรองตามช่วงราคาสูงสุด"
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#E5C158] cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs font-tabular text-[#F7F2E8]/90">
                <span>฿99</span>
                <span className="text-[#FCE694] font-semibold">
                  สูงสุด ฿{maxPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Mold Size Quick Reference inside Sidebar */}
            <div className="relative z-10 space-y-2.5 pt-2 border-t border-[#C9A45C]/25 text-xs">
              <h2 className="font-serif-heritage text-sm font-bold text-[#FCE694]">
                ขนาดมาตรฐาน ๒ พิมพ์
              </h2>
              <div className="rounded-xl bg-[#110D08] border border-[#C9A45C]/35 p-3 space-y-2">
                <div>
                  <p className="font-bold text-[#FCE694]">
                    {SOMDEJ_MOLD_SIZES.phimNiyom.name}
                  </p>
                  <p className="text-[11px] text-[#F7F2E8]/85 font-tabular">
                    {SOMDEJ_MOLD_SIZES.phimNiyom.summary}
                  </p>
                </div>
                <div className="pt-1.5 border-t border-[#C9A45C]/20">
                  <p className="font-bold text-[#FCE694]">
                    {SOMDEJ_MOLD_SIZES.phimKhaNaen.name}
                  </p>
                  <p className="text-[11px] text-[#F7F2E8]/85 font-tabular">
                    {SOMDEJ_MOLD_SIZES.phimKhaNaen.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Status Filter */}
            <div className="relative z-10 space-y-2.5 pt-2 border-t border-[#C9A45C]/25">
              <h2 className="font-serif-heritage text-base font-bold text-[#FCE694]">
                สถานะสต็อก
              </h2>
              {[
                { id: 'all', label: 'ทั้งหมด (รวมรายการหมด)' },
                { id: 'in_stock', label: 'พร้อมจอง (ตามจอง & มีสต็อก)' },
                { id: 'low_stock', label: 'เหลือน้อย (≤ 5)' },
              ].map((st) => {
                const active = stockFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      setStockFilter(
                        st.id as 'all' | 'in_stock' | 'low_stock'
                      )
                    }
                    className={`w-full flex items-center gap-2 text-xs py-2 px-3 rounded-xl transition-all ${
                      active
                        ? 'bg-[#2C2111] text-[#FCE694] font-semibold border border-[#FCE694]/60 shadow-inner'
                        : 'text-[#F7F2E8]/85 hover:bg-[#1E170D]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${
                        active
                          ? 'border-[#FCE694] bg-[#E5C158] text-[#0E0B07]'
                          : 'border-[#C9A45C]/60'
                      }`}
                    >
                      {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="relative z-10 w-full py-2.5 px-4 rounded-xl btn-sacred-gold font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          </aside>

          {/* Right 9 Columns: Official Brochure Bar + 3-Column Illuminated Vault Product Grid */}
          <div className="lg:col-span-9 space-y-6">
            {/* Official 4-Page Brochure Quick-Inspector Strip */}
            <div className="sacred-shrine-pedestal rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#FCE694]" />
                  <h2 className="font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694]">
                    เอกสารใบรายการวัตถุมงคล &ldquo;สมเด็จพิทักษ์แผ่นดิน&rdquo; ๗๕ ปี ตชด. (ครบทั้ง 4 หน้า)
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <a
                    href={OFFICIAL_BROCHURE_PDF_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A140B] border border-[#C9A45C]/55 text-[#FCE694] hover:border-[#FCE694] font-semibold"
                  >
                    <Download className="w-3 h-3" />
                    <span>ใบรายการ 4 หน้า (PDF)</span>
                  </a>
                  <a
                    href={OFFICIAL_STUDIO_PHOTOS_PDF_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A140B] border border-[#C9A45C]/55 text-[#FCE694] hover:border-[#FCE694] font-semibold"
                  >
                    <Download className="w-3 h-3" />
                    <span>ภาพสตูดิโอองค์พระ (PDF)</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SOMDEJ_BROCHURE_PAGES.map((sheet) => (
                  <button
                    key={sheet.pageNumber}
                    type="button"
                    onClick={() => setActiveBrochurePage(sheet.pageNumber)}
                    className="group text-left rounded-xl overflow-hidden bg-[#110D08] border border-[#C9A45C]/50 hover:border-[#FCE694] transition-all flex flex-col justify-between shadow-md"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#080604]">
                      <img
                        src={sheet.imageUrl}
                        alt={sheet.title}
                        loading="lazy"
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#110D08]/90 border border-[#FCE694]/60 text-[10px] font-bold text-[#FCE694] flex items-center gap-1">
                        <Expand className="w-2.5 h-2.5" />
                        <span>หน้า {sheet.pageNumber}</span>
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-[#FCE694] line-clamp-1">
                        {sheet.title}
                      </p>
                      <p className="text-[10px] text-[#F7F2E8]/80 line-clamp-1 mt-0.5">
                        {sheet.highlight}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="sacred-shrine-pedestal rounded-2xl p-12 text-center space-y-4">
                <p className="font-serif-heritage text-xl font-bold text-[#FCE694]">
                  ไม่พบรายการวัตถุมงคลที่ตรงกับเงื่อนไขการค้นหา
                </p>
                <p className="text-xs text-[#F7F2E8]/75 max-w-md mx-auto">
                  ลองเปลี่ยนคำค้นหา เลือกหมวดหมู่อื่น หรือกดปุ่มล้างตัวกรองเพื่อแสดงรายการทั้งหมด
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-sacred-gold text-xs font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((item, idx) => {
                  const frontAngle = item.angles.find(
                    (a) => a.angle === 'front'
                  );
                  const outOfStock = !item.isMadeToOrder && item.stock <= 0;
                  const isSaved = wishlist.includes(item.id);
                  const currentQty = getQtyForProduct(item);

                  const badgeLabel = outOfStock
                    ? 'หมด'
                    : item.requiresNumberSelection
                    ? 'เลือกเลข 1-99'
                    : item.isMadeToOrder
                    ? 'ตามจอง'
                    : `เหลือ ${item.stock}`;

                  return (
                    <article
                      key={item.id}
                      style={{ '--stagger-index': idx % 6 } as React.CSSProperties}
                      className="group relative sacred-vault-card sacred-stagger-reveal amulet-specular-sheen rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(item.id)}
                            className="w-full aspect-[4/4.2] block text-left focus:outline-none overflow-hidden"
                          >
                            <SpecimenPlate
                              style={item.specimenStyle}
                              angle="front"
                              code={item.code}
                              yearBE={item.yearBE}
                              imageUrl={frontAngle?.imageUrl}
                              alt={`${item.code} ${item.name}`}
                              badgeText={badgeLabel as 'แนะนำ'}
                              className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          </button>

                          {/* Code Pill Top-Left */}
                          <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-[#0E0B07]/95 border border-[#FCE694] text-xs font-tabular font-bold text-[#FCE694] shadow-md">
                            รหัส {item.code}
                          </span>

                          {/* Heart Wishlist Button on Product Card */}
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(item.id)}
                            aria-pressed={isSaved}
                            aria-label={
                              isSaved
                                ? `นำ ${item.name} ออกจากรายการโปรด`
                                : `บันทึก ${item.name} เป็นรายการโปรด`
                            }
                            className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center border transition-all shadow-lg ${
                              isSaved
                                ? 'bg-[#281E10] border-[#FCE694] text-[#FCE694] scale-105'
                                : 'bg-[#0E0B07]/90 border-[#C9A45C]/70 text-[#F7F2E8]/90 hover:text-[#FCE694] hover:border-[#FCE694]'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform ${
                                isSaved ? 'fill-[#FCE694] scale-110' : ''
                              }`}
                            />
                          </button>
                        </div>

                        <div className="p-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-[11px] font-tabular">
                            <span className="text-[#E5C158] font-semibold truncate">
                              {item.categoryLabel}
                            </span>
                            <span
                              className={`font-bold shrink-0 ${
                                outOfStock
                                  ? 'text-red-400'
                                  : item.isMadeToOrder
                                  ? 'text-emerald-300'
                                  : 'text-[#FCE694]'
                              }`}
                            >
                              {outOfStock
                                ? 'หมด'
                                : item.isMadeToOrder
                                ? 'ตามจอง'
                                : `คงเหลือ ${item.stock.toLocaleString()}`}
                            </span>
                          </div>

                          <h2 className="font-serif-heritage text-base sm:text-lg font-bold text-[#FFFFFF] group-hover:text-[#FCE694] transition-colors line-clamp-1">
                            <button
                              type="button"
                              onClick={() => onSelectProduct(item.id)}
                              className="text-left"
                            >
                              {item.code} {item.name}
                            </button>
                          </h2>

                          <p className="text-xs text-[#E5C158]/90 line-clamp-1">
                            {item.material}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-3 border-t border-[#C9A45C]/20 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-tabular text-lg sm:text-xl font-bold text-[#FCE694]">
                            ฿{item.price.toLocaleString()}
                          </span>

                          <button
                            type="button"
                            onClick={() => onSelectProduct(item.id)}
                            className="text-xs font-semibold text-[#E5C158] hover:text-[#FCE694] underline"
                          >
                            รายละเอียด
                          </button>
                        </div>

                        {item.requiresNumberSelection ? (
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => setShowRajaGridModal(true)}
                            className="w-full py-2.5 px-3 rounded-xl btn-sacred-gold font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                          >
                            <Grid className="w-3.5 h-3.5" />
                            <span>
                              {outOfStock
                                ? 'หมดแล้ว'
                                : selectedRajaNumbers.length > 0
                                ? `เลือกเลข 1–99 (เลือกไว้ ${selectedRajaNumbers.length} เลข)`
                                : 'เลือกหมายเลข 1–99'}
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-[#C9A45C]/50 rounded-lg bg-[#110D08] px-1">
                              <button
                                type="button"
                                disabled={outOfStock || currentQty <= 1}
                                onClick={() =>
                                  handleQuickQtyChange(item, currentQty - 1)
                                }
                                aria-label={`ลดจำนวน ${item.name}`}
                                className="w-6 h-8 text-[#FCE694] font-bold disabled:opacity-40"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={item.isMadeToOrder ? 999 : item.stock}
                                disabled={outOfStock}
                                value={currentQty}
                                aria-label={`จำนวนจอง ${item.name}`}
                                onChange={(e) =>
                                  handleQuickQtyChange(
                                    item,
                                    Number(e.target.value) || 1
                                  )
                                }
                                className="w-11 text-center bg-transparent text-xs font-tabular font-bold text-[#FCE694] focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={
                                  outOfStock ||
                                  (!item.isMadeToOrder &&
                                    currentQty >= item.stock)
                                }
                                onClick={() =>
                                  handleQuickQtyChange(item, currentQty + 1)
                                }
                                aria-label={`เพิ่มจำนวน ${item.name}`}
                                className="w-6 h-8 text-[#FCE694] font-bold disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={outOfStock}
                              onClick={() => onAddToCart(item, currentQty)}
                              className="flex-1 py-2 px-3 rounded-lg btn-sacred-gold disabled:opacity-40 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>{outOfStock ? 'หมด' : 'ใส่ตะกร้า'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for 1-99 Number Selection (ช1 ชุดทองคำใหญ่ราชาฤกษ์) */}
      {showRajaGridModal && rajaProduct && (
        <RajaNumberGridModal
          mode="modal"
          product={rajaProduct}
          rajaSlots={rajaSlots}
          sessionId={sessionId}
          selectedNumbers={selectedRajaNumbers}
          onToggleSlot={onToggleRajaSlot}
          onClose={() => setShowRajaGridModal(false)}
          onConfirmProceed={() => {
            setShowRajaGridModal(false);
            if (onNavigateCheckout) {
              onNavigateCheckout();
            }
          }}
        />
      )}

      {/* Modal for Full-Resolution Brochure Sheet Inspection */}
      {activeBrochurePage !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ใบรายการวัตถุมงคล สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด."
          onClick={() => setActiveBrochurePage(null)}
          className="fixed inset-0 z-50 bg-[#060503]/95 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto sacred-shrine-pedestal rounded-2xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C9A45C]/30 pb-3">
              <div>
                <p className="text-xs text-[#E5C158] font-semibold">
                  เอกสารใบรายการทางการ · กองบัญชาการตำรวจตระเวนชายแดน
                </p>
                <h3 className="font-serif-heritage text-lg sm:text-xl font-bold text-[#FCE694]">
                  {
                    SOMDEJ_BROCHURE_PAGES.find(
                      (p) => p.pageNumber === activeBrochurePage
                    )?.title
                  }
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {SOMDEJ_BROCHURE_PAGES.map((p) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => setActiveBrochurePage(p.pageNumber)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeBrochurePage === p.pageNumber
                        ? 'btn-sacred-gold'
                        : 'bg-[#17120A] text-[#FCE694] border border-[#C9A45C]/40'
                    }`}
                  >
                    หน้า {p.pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveBrochurePage(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#241B10] text-[#FCE694] border border-[#C9A45C]/60 text-xs font-bold flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>ปิด</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#080604] border border-[#C9A45C]/40 flex justify-center max-h-[75vh] overflow-y-auto">
              <img
                src={
                  SOMDEJ_BROCHURE_PAGES.find(
                    (p) => p.pageNumber === activeBrochurePage
                  )?.imageUrl
                }
                alt={`ใบรายการหน้าที่ ${activeBrochurePage}`}
                className="w-full max-w-3xl h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
