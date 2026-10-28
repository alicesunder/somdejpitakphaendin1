import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Expand,
  FileCheck2,
  Gem,
  Grid,
  Headphones,
  Heart,
  Shield,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import {
  AmuletProduct,
  NewsArticle,
  SiteConfig,
} from '../types';
import {
  SOMDEJ_BROCHURE_PAGES,
  SOMDEJ_MOLD_SIZES,
} from '../data/seedData';
import {
  BppCrestLogo,
  CeremonySplitBannerArt,
  HeroSacredScene,
  MissionSplitBannerArt,
  NewsThumbnailArt,
  SacredArchDivider,
  SpecimenPlate,
  ThaiCornerBrackets,
} from './SacredArtwork';
import { AppView } from './Header';

interface HomeViewProps {
  siteConfig: SiteConfig;
  products: AmuletProduct[];
  news: NewsArticle[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onNavigate: (view: AppView) => void;
  onSelectProduct: (productId: string) => void;
  onAddToCart: (product: AmuletProduct, qty?: number) => void;
  onSelectNews: (articleId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  siteConfig,
  products,
  news,
  wishlist,
  onToggleWishlist,
  onNavigate,
  onSelectProduct,
  onAddToCart,
  onSelectNews,
}) => {
  const visibleProducts = products.filter((p) => p.isVisible);
  const featuredProducts = visibleProducts.slice(0, 5);
  const materialProducts = visibleProducts.filter(
    (p) =>
      p.category === 'cat_1_popular_metal' ||
      p.category === 'cat_3_popular_powder'
  );
  const setProducts = visibleProducts.filter(
    (p) => p.category === 'special_set'
  );

  const [activeBrochureSheetIdx, setActiveBrochureSheetIdx] = useState<number>(0);
  const [enlargedBrochurePage, setEnlargedBrochurePage] = useState<number | null>(null);

  const rajaProduct = visibleProducts.find(
    (p) => p.code === 'ช1' || p.requiresNumberSelection
  );

  const badgeCycle: ('แนะนำ' | 'ยอดนิยม' | 'ใหม่')[] = [
    'แนะนำ',
    'ยอดนิยม',
    'ใหม่',
    'แนะนำ',
    'ใหม่',
  ];

  return (
    <div className="bg-[#080705] text-[#F7F2E8] overflow-hidden">
      {/* SECTION 1: MINIMALIST MONUMENTAL HERO — FOCUSED ON "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตำรวจตระเวนชายแดน (ตชด.)" */}
      <section
        aria-label="สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตำรวจตระเวนชายแดน (ตชด.)"
        className="relative w-full min-h-[600px] sm:min-h-[680px] lg:min-h-[760px] flex items-center border-b border-[#C9A45C]/45 overflow-hidden"
      >
        {/* Layer 1: Full-Bleed Golden Mountain Temple Sunrise & Bottom Thai Filigree Artwork */}
        <HeroSacredScene className="absolute inset-0 w-full h-full" />

        {/* Layer 2: Subtle Chiaroscuro Vignette — Preserves the Temple Sunrise & Bottom Gold Filigree */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050403]/85 via-[#070503]/55 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_32%_46%,rgba(5,4,3,0.68)_0%,rgba(5,4,3,0.18)_62%,transparent_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#060503]/75 to-transparent"
        />

        {/* Delicate Gold Sanctuary Frame */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-5 sm:inset-8 border border-[#C9A45C]/25 rounded-2xl"
        >
          <ThaiCornerBrackets colorClass="text-[#FCE694]/65" />
        </div>

        {/* Main Hero Focal Content — Clean, Uncluttered, Monumental */}
        <div className="relative z-10 w-full max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
          <div className="max-w-3xl space-y-6 sm:space-y-8 animate-sacred-reveal">
            {/* Official BPP Crest & Subtle Kicker */}
            <div className="flex items-center gap-4">
              <BppCrestLogo className="w-16 h-14 sm:w-20 sm:h-18 drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)]" />
              <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-[#FCE694]/60 to-transparent" />
              <p className="font-bpp-motto text-xl sm:text-2xl lg:text-3xl font-bold text-[#FCE694] tracking-wider drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
                {siteConfig.heroSubtitle || 'ศรัทธา • เกียรติภูมิ • แผ่นดิน'}
              </p>
            </div>

            {/* Monumental Hero Centerpiece Typography */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-bpp-official font-bold tracking-wide drop-shadow-[0_18px_40px_rgba(0,0,0,0.98)]">
                <span className="block text-5xl sm:text-7xl lg:text-[5.6rem] leading-[1.1] text-gold-shimmer sm:whitespace-nowrap">
                  สมเด็จพิทักษ์แผ่นดิน
                </span>
                <span className="block text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.18] text-[#FCE694] mt-2 sm:mt-3">
                  ๗๕ ปี ตำรวจตระเวนชายแดน (ตชด.)
                </span>
              </h1>

              {/* Subtle Gold Ornamental Line */}
              <div
                aria-hidden="true"
                className="w-48 sm:w-72 h-[2px] bg-gradient-to-r from-[#FCE694] via-[#C9A45C]/70 to-transparent"
              />
            </div>

            {/* Clean, Minimalist Primary Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="btn-sacred-gold px-8 py-4 rounded-xl font-bpp-official font-bold text-xl sm:text-2xl tracking-wide flex items-center gap-3 shadow-[0_18px_40px_rgba(0,0,0,0.9),0_0_28px_rgba(229,193,88,0.35)] whitespace-nowrap"
              >
                <span>สั่งจองวัตถุมงคล</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {rajaProduct && (
                <button
                  type="button"
                  onClick={() => onSelectProduct(rajaProduct.id)}
                  className="px-6 py-4 rounded-xl bg-[#0E0B07]/85 border border-[#FCE694]/70 text-[#FCE694] hover:bg-[#1E170E] hover:border-[#FCE694] font-bpp-official font-bold text-lg sm:text-xl tracking-wide shadow-[0_14px_32px_rgba(0,0,0,0.85)] transition-all flex items-center gap-2.5 whitespace-nowrap backdrop-blur-md"
                >
                  <Grid className="w-4 h-4 text-[#FCE694]" />
                  <span>เลือกหมายเลข ช1 (๑–๙๙)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ILLUMINATED GILDED SANCTUARY PAVILION — 5 SACRED TRUST PILLARS */}
      <section className="relative bg-[radial-gradient(85%_75%_at_50%_0%,rgba(212,175,55,0.16)_0%,rgba(62,48,22,0.28)_45%,rgba(9,7,5,0.98)_100%),linear-gradient(180deg,#0B0906_0%,#14100A_52%,#0A0805_100%)] text-[#F7F2E8] py-14 sm:py-18 border-b border-[#C9A45C]/35 overflow-hidden">
        {/* Subtle Ambient Gold Aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[760px] h-[240px] rounded-full opacity-35 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(252,230,148,0.28) 0%, rgba(201,164,92,0.14) 48%, rgba(10,8,5,0) 75%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1C160D]/90 border border-[#C9A45C]/45 shadow-[0_0_20px_rgba(201,164,92,0.18)]">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rotate-45 bg-[#FCE694] inline-block"
              />
              <p className="font-bpp-motto text-sm sm:text-base font-semibold tracking-wider text-[#FCE694]">
                ศรัทธา • เกียรติภูมิ • แผ่นดิน — มาตรฐานการจัดสร้างอย่างเป็นทางการ
              </p>
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rotate-45 bg-[#FCE694] inline-block"
              />
            </div>
            <h2 className="font-bpp-official text-3xl sm:text-4xl lg:text-5xl font-bold text-gold-shimmer drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
              ความโปร่งใสและเกียรติภูมิแห่งการจัดสร้าง
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {[
              {
                icon: Gem,
                title: 'วัตถุมงคลแท้',
                subtitle: 'ตอกโค้ดตรวจสอบได้ทุกองค์',
              },
              {
                icon: Truck,
                title: 'จัดส่งทั่วประเทศ',
                subtitle: 'บรรจุกล่องนิรภัย EMS',
              },
              {
                icon: Shield,
                title: 'รายได้สนับสนุนภารกิจ',
                subtitle: 'เพื่อเด็กและโรงเรียน ตชด.',
              },
              {
                icon: FileCheck2,
                title: 'ข้อมูลโปร่งใส',
                subtitle: 'ระบุมวลสารและจำนวนสร้างชัดเจน',
              },
              {
                icon: Headphones,
                title: 'ติดต่อสอบถาม',
                subtitle: 'ทีมงานผู้ดูแลคลังพร้อมบริการ',
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  style={{ '--stagger-index': idx } as React.CSSProperties}
                  className={`group sacred-vault-card sacred-stagger-reveal amulet-specular-sheen rounded-2xl p-5 sm:p-6 flex flex-col items-center text-center space-y-3 relative overflow-hidden ${
                    idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <ThaiCornerBrackets
                    className="inset-2 opacity-40 group-hover:opacity-80 transition-opacity"
                    colorClass="text-[#FCE694]/65"
                  />
                  <div className="relative z-10 w-13 h-13 rounded-full bg-gradient-to-b from-[#2E2312] via-[#1C160C] to-[#0E0B06] border border-[#FCE694]/70 flex items-center justify-center text-[#FCE694] shadow-[0_10px_24px_rgba(0,0,0,0.7),0_0_20px_rgba(201,164,92,0.3)] group-hover:scale-105 group-hover:border-[#FCE694] transition-all">
                    <Icon className="w-5 h-5 drop-shadow-[0_2px_6px_rgba(252,230,148,0.45)]" />
                  </div>
                  <h3 className="relative z-10 font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694] group-hover:text-[#FFFFFF] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="relative z-10 text-xs text-[#F7F2E8]/80 leading-relaxed">
                    {pillar.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: CURATORIAL EXHIBITION GALLERY (วัตถุมงคลแนะนำ - 5 ILLUMINATED MUSEUM PEDESTALS) */}
      <section className="relative py-14 sm:py-20 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(168,130,52,0.18)_0%,rgba(12,10,7,0.98)_70%),linear-gradient(180deg,#110D08_0%,#080705_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <SacredArchDivider className="-mt-8 mb-4" />

          {/* Header Row */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#C9A45C]/35 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#E5C158] font-medium">
                <span>รายการยอดนิยมประจำใบจอง</span>
                <span aria-hidden="true">·</span>
                <span>ภาพถ่ายสตูดิโอองค์จริง คมชัดสูง</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="w-3 h-3 rotate-45 bg-gradient-to-br from-[#FCE694] to-[#C9A45C] inline-block shadow-[0_0_10px_rgba(252,230,148,0.8)]"
                />
                <h2 className="font-serif-heritage text-2xl sm:text-4xl font-bold text-[#FCE694] drop-shadow">
                  วัตถุมงคลแนะนำ
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="px-5 py-2.5 rounded-lg bg-[#1A140B] border border-[#C9A45C]/60 text-xs sm:text-sm font-semibold text-[#FCE694] hover:bg-[#2A2012] hover:border-[#FCE694] flex items-center gap-2 transition-all shadow-md whitespace-nowrap shrink-0"
            >
              <span>ดูครบทั้ง ๒๓ รายการ</span>
              <ArrowRight className="w-4 h-4 text-[#E5C158]" />
            </button>
          </div>

          {/* 5-Column Illuminated Vault Card Grid */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              aria-label="ดูรายการก่อนหน้า"
              className="hidden xl:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1C160C] border border-[#E5C158]/70 text-[#FCE694] items-center justify-center hover:bg-[#2C2213] shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
              {featuredProducts.map((item, idx) => {
                const frontAngle = item.angles.find((a) => a.angle === 'front');
                const outOfStock = !item.isMadeToOrder && item.stock <= 0;
                const badge = badgeCycle[idx % badgeCycle.length];
                const isSaved = wishlist.includes(item.id);

                return (
                  <article
                    key={item.id}
                    style={{ '--stagger-index': idx } as React.CSSProperties}
                    className="group relative sacred-vault-card sacred-stagger-reveal amulet-specular-sheen rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_18px_40px_rgba(0,0,0,0.85)]"
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
                            alt={`${item.name} ${item.series}`}
                            badgeText={badge}
                            className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        </button>

                        {/* Heart Wishlist Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(item.id)}
                          aria-pressed={isSaved}
                          aria-label={
                            isSaved
                              ? `นำ ${item.name} ออกจากรายการโปรด`
                              : `บันทึก ${item.name} เป็นรายการโปรด`
                          }
                          title={
                            isSaved
                              ? 'นำออกจากรายการโปรด'
                              : 'บันทึกเป็นรายการโปรด'
                          }
                          className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow-md ${
                            isSaved
                              ? 'bg-[#281E10] border-[#FCE694] text-[#FCE694] scale-105'
                              : 'bg-[#0E0B07]/90 border-[#C9A45C]/70 text-[#F7F2E8]/90 hover:text-[#FCE694] hover:border-[#FCE694]'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isSaved ? 'fill-[#FCE694]' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-tabular text-[#E5C158]/80">
                          <span>รหัส {item.code}</span>
                          <span>พ.ศ. {item.yearBE}</span>
                        </div>
                        <h3 className="font-serif-heritage text-sm sm:text-base font-bold text-[#FFFFFF] line-clamp-1 group-hover:text-[#FCE694] transition-colors">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(item.id)}
                            className="text-left"
                          >
                            {item.name}
                          </button>
                        </h3>
                        <p className="text-xs text-[#E5C158]/85 line-clamp-1">
                          {item.material}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-[#C9A45C]/20 flex items-center justify-between gap-2">
                      <span className="font-tabular text-base sm:text-lg font-bold text-[#FCE694]">
                        ฿{item.price.toLocaleString()}
                      </span>

                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() =>
                          item.requiresNumberSelection
                            ? onSelectProduct(item.id)
                            : onAddToCart(item, 1)
                        }
                        aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
                        title={
                          item.requiresNumberSelection
                            ? 'เลือกหมายเลข 1–99'
                            : 'เพิ่มลงตะกร้า'
                        }
                        className="btn-sacred-gold w-9 h-9 rounded-lg disabled:opacity-40 flex items-center justify-center shrink-0"
                      >
                        <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              aria-label="ดูรายการถัดไป"
              className="hidden xl:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1C160C] border border-[#E5C158]/70 text-[#FCE694] items-center justify-center hover:bg-[#2C2213] shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3B: OFFICIAL BROCHURE REGISTRY — ทำเนียบใบรายการ "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. (ครบทั้ง ๑๐ เนื้อ & ๓ ชุดจัดสร้าง) */}
      <section
        aria-label="ทำเนียบใบรายการวัตถุมงคล สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด."
        className="relative py-16 sm:py-24 bg-[radial-gradient(90%_65%_at_50%_0%,rgba(235,196,88,0.24)_0%,rgba(54,40,18,0.42)_46%,rgba(8,7,5,0.99)_100%),linear-gradient(180deg,#120E08_0%,#090704_100%)] border-t-2 border-b border-[#FCE694]/50 overflow-hidden"
      >
        {/* Ambient Royal Gold Spotlight Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[920px] h-[320px] rounded-full opacity-45 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(252,230,148,0.38) 0%, rgba(201,164,92,0.18) 50%, rgba(10,8,5,0) 78%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SacredArchDivider className="-mt-6 mb-2" />

          {/* Monumental Golden Header Pedestal */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#1A140B]/95 via-[#241B0E]/95 to-[#1A140B]/95 border-2 border-[#FCE694]/65 p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(229,193,88,0.2)] overflow-hidden">
            <ThaiCornerBrackets
              className="inset-2.5 opacity-80"
              colorClass="text-[#FCE694]"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#FCE694] font-semibold tracking-wider">
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rotate-45 bg-[#FCE694] inline-block shadow-[0_0_8px_rgba(252,230,148,0.9)]"
                  />
                  <span>เอกสารใบรายการและภาพถ่ายสตูดิโอฉบับทางการ</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#E5C158]">
                    กองบัญชาการตำรวจตระเวนชายแดน
                  </span>
                </div>

                <h2 className="font-bpp-official text-3xl sm:text-5xl lg:text-[3.35rem] font-bold text-gold-shimmer leading-[1.15] drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)]">
                  ใบรายการวัตถุมงคล &ldquo;สมเด็จพิทักษ์แผ่นดิน&rdquo; ๗๕ ปี ตชด.
                </h2>

                <p className="text-sm sm:text-base text-[#F7F2E8]/95 font-medium">
                  ข้อมูลครบทั้ง ๓ ชุดจัดสร้างพิเศษ (ช1–ช3) และภาพองค์พระ ด้านหน้า–ด้านหลัง ทั้ง ๑๐ เนื้อวัสดุ (พิมพ์นิยม &amp; พิมพ์คะแนน)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 shrink-0">
                <div className="px-4 py-2.5 rounded-xl bg-[#0D0A06]/95 border border-[#FCE694]/65 text-xs sm:text-sm text-[#F7F2E8] font-tabular shadow-inner">
                  <span className="font-bold text-[#FCE694]">
                    พิมพ์นิยม (ใหญ่):
                  </span>{' '}
                  {SOMDEJ_MOLD_SIZES.phimNiyom.summary}
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-[#0D0A06]/95 border border-[#FCE694]/65 text-xs sm:text-sm text-[#F7F2E8] font-tabular shadow-inner">
                  <span className="font-bold text-[#FCE694]">
                    พิมพ์คะแนน (เล็ก):
                  </span>{' '}
                  {SOMDEJ_MOLD_SIZES.phimKhaNaen.summary}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Official Commemorative Sets Highlight Cards — Grand Illuminated Showcase */}
          {setProducts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
              {setProducts.map((setItem, idx) => {
                const isRaja =
                  setItem.code === 'ช1' || Boolean(setItem.requiresNumberSelection);
                const cleanTitle = setItem.name.startsWith(`${setItem.code} `)
                  ? setItem.name.slice(setItem.code.length + 1)
                  : setItem.name;
                const stockCaption =
                  setItem.code === 'ช1'
                    ? `สร้างจำกัด ๙๙ ชุด (คงเหลือ ${setItem.stock} ชุด)`
                    : setItem.code === 'ช2'
                    ? `สร้างจำกัด ๒๐๐ กล่อง (คงเหลือ ${setItem.stock} กล่อง)`
                    : `สร้างจำกัด ๒,๕๐๐ ชุด (คงเหลือ ${setItem.stock.toLocaleString()} ชุด)`;

                return (
                  <div
                    key={setItem.id}
                    style={{ '--stagger-index': idx } as React.CSSProperties}
                    className={`group sacred-stagger-reveal rounded-2xl p-6 flex flex-col justify-between space-y-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${
                      isRaja
                        ? 'bg-gradient-to-b from-[#2A1F0F] via-[#171209] to-[#0D0A06] border-2 border-[#FCE694] shadow-[0_28px_64px_rgba(0,0,0,0.95),0_0_42px_rgba(252,230,148,0.28)]'
                        : 'bg-gradient-to-b from-[#21190D] via-[#140F08] to-[#0C0905] border-2 border-[#C9A45C]/75 hover:border-[#FCE694] shadow-[0_24px_56px_rgba(0,0,0,0.92),0_0_26px_rgba(201,164,92,0.16)]'
                    }`}
                  >
                    {/* Top Specular Gold Glow */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full opacity-55 blur-2xl"
                      style={{
                        background: isRaja
                          ? 'radial-gradient(circle, rgba(252,230,148,0.45) 0%, transparent 72%)'
                          : 'radial-gradient(circle, rgba(201,164,92,0.32) 0%, transparent 72%)',
                      }}
                    />

                    <ThaiCornerBrackets
                      className="inset-2.5 opacity-80"
                      colorClass="text-[#FCE694]"
                    />

                    <div className="relative z-10 space-y-4">
                      {/* Top Header Row: Tier & Code */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#FCE694]/30 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide ${
                              isRaja
                                ? 'btn-sacred-gold shadow-[0_0_16px_rgba(252,230,148,0.45)]'
                                : 'bg-[#281E10] border border-[#FCE694]/75 text-[#FCE694]'
                            }`}
                          >
                            ชุดจัดสร้างพิเศษที่ {idx + 1}
                          </span>
                          <span className="text-xs font-tabular font-semibold text-[#E5C158]">
                            · {stockCaption}
                          </span>
                        </div>

                        <span className="px-2.5 py-1 rounded-md bg-[#0B0805] border border-[#FCE694]/60 font-tabular text-xs sm:text-sm font-bold text-[#FCE694]">
                          รหัส {setItem.code}
                        </span>
                      </div>

                      {/* Illuminated Specimen Image Frame */}
                      <button
                        type="button"
                        onClick={() => onSelectProduct(setItem.id)}
                        className="relative w-full aspect-[16/10.5] rounded-xl overflow-hidden border-2 border-[#FCE694]/65 bg-[#060503] block focus:outline-none shadow-[0_14px_34px_rgba(0,0,0,0.9),0_0_24px_rgba(229,193,88,0.2)] group-hover:border-[#FCE694] transition-all"
                      >
                        <SpecimenPlate
                          style={setItem.specimenStyle}
                          angle="front"
                          code={setItem.code}
                          yearBE={setItem.yearBE}
                          imageUrl={setItem.angles[0]?.imageUrl}
                          alt={setItem.name}
                          badgeText={isRaja ? 'แนะนำ' : undefined}
                          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-md bg-[#0B0805]/90 border border-[#FCE694]/60 text-[11px] font-semibold text-[#FCE694] flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <Expand className="w-3 h-3" />
                          <span>คลิกดูรายละเอียดชุด</span>
                        </span>
                      </button>

                      {/* Bold Monumental Set Title */}
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-[#E5C158] block">
                          รหัส {setItem.code} · {setItem.material}
                        </span>
                        <h3 className="font-bpp-official text-2xl sm:text-3xl font-bold text-[#FCE694] leading-snug group-hover:text-[#FFFFFF] transition-colors">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(setItem.id)}
                            className="text-left"
                          >
                            {cleanTitle}
                          </button>
                        </h3>
                      </div>

                      {/* High-Contrast Itemized Breakdown Box */}
                      {setItem.setBreakdown && (
                        <div className="rounded-xl bg-[#090704]/95 border border-[#FCE694]/45 p-4 space-y-2 text-xs sm:text-[13px] shadow-inner">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#E5C158] border-b border-[#C9A45C]/30 pb-1.5">
                            <span>รายการองค์พระในชุดจัดสร้าง</span>
                            <span>จำนวนที่ได้รับ</span>
                          </div>
                          {setItem.setBreakdown.slice(0, 5).map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className="flex items-center justify-between gap-2 text-[#F7F2E8]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  aria-hidden="true"
                                  className="w-1.5 h-1.5 rotate-45 bg-[#FCE694] shrink-0"
                                />
                                <span className="truncate font-medium">
                                  {b.item}
                                </span>
                              </div>
                              <span className="font-tabular font-bold text-[#FCE694] shrink-0">
                                {b.count}
                              </span>
                            </div>
                          ))}
                          {setItem.setBreakdown.length > 5 && (
                            <button
                              type="button"
                              onClick={() => onSelectProduct(setItem.id)}
                              className="w-full text-left text-xs font-bold text-[#E5C158] hover:text-[#FCE694] pt-1.5 border-t border-[#C9A45C]/25 flex items-center justify-between"
                            >
                              <span>
                                + อีก {setItem.setBreakdown.length - 5} รายการในชุดนี้
                              </span>
                              <span className="underline">ดูครบทุกเนื้อ →</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Prominent Price & Action Footer */}
                    <div className="relative z-10 pt-4 border-t-2 border-[#FCE694]/35 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <span className="block text-xs font-semibold text-[#E5C158]">
                          อัตราบูชาตามใบรายการ
                        </span>
                        <span className="font-tabular text-2xl sm:text-3xl font-bold text-gold-shimmer drop-shadow">
                          ฿{setItem.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(setItem.id)}
                          className="px-4 py-2.5 rounded-xl bg-[#18120A] border border-[#FCE694]/65 text-xs sm:text-sm font-bold text-[#FCE694] hover:bg-[#261D10] hover:border-[#FCE694] transition-colors whitespace-nowrap"
                        >
                          ดูรายละเอียด
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setItem.requiresNumberSelection
                              ? onSelectProduct(setItem.id)
                              : onAddToCart(setItem, 1)
                          }
                          className="btn-sacred-gold px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(229,193,88,0.3)] whitespace-nowrap"
                        >
                          {setItem.requiresNumberSelection
                            ? 'เลือกเลข 1–99'
                            : 'ร่วมบุญบูชา'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive 10 Sacred Materials Grid + 4 Brochure Page Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: All 10 Sacred Materials (ภาพองค์พระ ด้านหน้า–ด้านหลัง ทั้ง ๑๐ เนื้อ) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-heritage text-lg sm:text-xl font-bold text-[#FCE694]">
                  ทำเนียบภาพสตูดิโอองค์พระ ด้านหน้า–ด้านหลัง ทั้ง ๑๐ เนื้อ
                </h3>
                <span className="text-xs text-[#E5C158]">
                  คลิกเลือกเนื้อพระเพื่อส่องขยายด้านหน้า–หลัง
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {materialProducts.map((mat, idx) => {
                  const pairImg =
                    mat.angles.find((a) => a.angle === 'edge')?.imageUrl ||
                    mat.angles[0]?.imageUrl;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => onSelectProduct(mat.id)}
                      className="group sacred-vault-card rounded-xl p-2.5 text-left flex flex-col justify-between space-y-2 hover:border-[#FCE694] transition-all shadow-[0_14px_30px_rgba(0,0,0,0.85)]"
                    >
                      <div className="relative aspect-[4/3.2] w-full rounded-lg overflow-hidden bg-[#050403] border border-[#C9A45C]/35">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_65%_at_50%_40%,rgba(252,230,148,0.16)_0%,transparent_75%)]" />
                        <img
                          src={pairImg}
                          alt={mat.name}
                          loading="lazy"
                          className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-105 transition-transform drop-shadow-[0_10px_18px_rgba(0,0,0,0.95)]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-tabular font-bold text-[#E5C158]">
                          เนื้อที่ {idx + 1} · {mat.code}
                        </span>
                        <p className="font-serif-heritage text-xs font-bold text-[#FFFFFF] group-hover:text-[#FCE694] line-clamp-1">
                          {mat.name
                            .replace('สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม ', '')
                            .replace('สมเด็จพิทักษ์แผ่นดิน ', '')}
                        </p>
                        <p className="font-tabular text-xs font-bold text-[#FCE694] mt-0.5">
                          ฿{mat.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Interactive 4-Page Official Brochure Sheet Viewer */}
            <div className="lg:col-span-5 sacred-shrine-pedestal rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-[0_24px_52px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9A45C]/30 pb-3">
                <span className="font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694]">
                  แผ่นพับใบรายการทางการ (๔ หน้า)
                </span>
                <div className="inline-flex rounded-lg p-1 bg-[#110D08] border border-[#C9A45C]/40 gap-1">
                  {SOMDEJ_BROCHURE_PAGES.map((sheet, idx) => (
                    <button
                      key={sheet.pageNumber}
                      type="button"
                      onClick={() => setActiveBrochureSheetIdx(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        activeBrochureSheetIdx === idx
                          ? 'btn-sacred-gold'
                          : 'text-[#E5C158] hover:text-[#FCE694]'
                      }`}
                    >
                      หน้า {sheet.pageNumber}
                    </button>
                  ))}
                </div>
              </div>

              {SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx] && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEnlargedBrochurePage(
                        SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx].pageNumber
                      )
                    }
                    className="group relative w-full rounded-xl overflow-hidden bg-[#080604] border border-[#C9A45C]/50 aspect-[16/10] block focus:outline-none"
                  >
                    <img
                      src={
                        SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx].imageUrl
                      }
                      alt={SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx].title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#0D0A06]/90 border border-[#FCE694]/70 text-[11px] font-bold text-[#FCE694] flex items-center gap-1 shadow-lg">
                      <Expand className="w-3 h-3" />
                      <span>คลิกขยายเต็มจอ</span>
                    </span>
                  </button>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#FCE694] truncate">
                        {SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx].title}
                      </p>
                      <p className="text-[11px] text-[#F7F2E8]/80 truncate">
                        {SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx].subtitle}
                      </p>
                    </div>
                    {SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx]
                      .linkedProductId && (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProduct(
                            SOMDEJ_BROCHURE_PAGES[activeBrochureSheetIdx]
                              .linkedProductId!
                          )
                        }
                        className="btn-sacred-gold px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
                      >
                        ดูรายการนี้
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CHIAROSCURO SACRED DIPTYCH (พิธีพุทธาภิเษก & รายได้สมทบภารกิจ) */}
      <section className="py-10 sm:py-14 bg-[#080705] border-t border-[#C9A45C]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Left Diptych Panel: พิธีพุทธาภิเษก */}
            <div
              style={{ '--stagger-index': 0 } as React.CSSProperties}
              className="group relative sacred-stagger-reveal rounded-2xl overflow-hidden border border-[#C9A45C]/65 min-h-[280px] sm:min-h-[320px] flex items-end sm:items-center justify-end p-6 sm:p-9 shadow-[0_24px_50px_rgba(0,0,0,0.85)]"
            >
              <CeremonySplitBannerArt className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105" />
              <ThaiCornerBrackets colorClass="text-[#FCE694]/55" />
              <div className="relative z-10 max-w-[270px] sm:max-w-[310px] text-center sm:text-left space-y-3">
                <p className="text-xs font-semibold tracking-wider text-[#E5C158]">
                  พิธีกรรมตามแบบแผนประเพณีโบราณ
                </p>
                <h2 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#FCE694] drop-shadow">
                  พิธีพลีมวลสารและพุทธาภิเษก
                </h2>
                <p className="text-xs sm:text-sm text-[#F7F2E8]/95 leading-relaxed">
                  จัดสร้างตามประเพณีโบราณ โดยพระเกจิอาจารย์ผู้ทรงคุณวุฒิ จากวัดชั้นนำทั่วประเทศ
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('news')}
                    className="btn-sacred-gold px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>ดูกำหนดการพิธีทั้งหมด</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Diptych Panel: รายได้สมทบภารกิจ */}
            <div
              style={{ '--stagger-index': 1 } as React.CSSProperties}
              className="group relative sacred-stagger-reveal rounded-2xl overflow-hidden border border-[#C9A45C]/65 min-h-[280px] sm:min-h-[320px] flex items-end sm:items-center justify-end p-6 sm:p-9 shadow-[0_24px_50px_rgba(0,0,0,0.85)]"
            >
              <MissionSplitBannerArt className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-105" />
              <ThaiCornerBrackets colorClass="text-[#FCE694]/55" />
              <div className="relative z-10 max-w-[270px] sm:max-w-[310px] text-center sm:text-left space-y-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                <p className="text-xs font-semibold tracking-wider text-[#FCE694]">
                  กองทุนเพื่อการศึกษาและสวัสดิการชายแดน
                </p>
                <h2 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-[#FCE694] drop-shadow">
                  รายได้สมทบภารกิจ ตชด.
                </h2>
                <p className="text-xs sm:text-sm text-[#F7F2E8] leading-relaxed">
                  เพื่อการศึกษา สาธารณสุข และพัฒนาคุณภาพชีวิต ของเยาวชนในพื้นที่ห่างไกล
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="btn-sacred-gold px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>อ่านประวัติและภารกิจ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ARCHIVAL CHRONICLES & SACRED OATH PAVILION (โปสเตอร์กำหนดการพิธีพลีมวลสาร & ข่าวสาร) */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-[#080705] to-[#120E09] border-t border-[#C9A45C]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C9A45C]/30 pb-4">
            <div className="space-y-1">
              <span className="text-xs text-[#E5C158] font-bold tracking-wider">
                โปสเตอร์ประชาสัมพันธ์พิธีมหามงคลอย่างเป็นทางการ
              </span>
              <h2 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-gold-shimmer">
                ข่าวสารและกำหนดการพิธีพลีมวลสาร &ldquo;สมเด็จพิทักษ์แผ่นดิน&rdquo; ๗๕ ปี ตชด.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('news')}
              className="px-4 py-2 rounded-xl border border-[#C9A45C]/60 bg-[#17120A] text-xs font-bold text-[#FCE694] hover:bg-[#241B0F] hover:border-[#FCE694] flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto transition-all"
            >
              <span>ดูโปสเตอร์และข่าวสารทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left 9 Columns: Official Ceremony Poster Cards */}
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.slice(0, 3).map((article, index) => (
                <article
                  key={article.id}
                  style={{ '--stagger-index': index } as React.CSSProperties}
                  className="group sacred-vault-card sacred-stagger-reveal rounded-2xl overflow-hidden flex flex-col justify-between border border-[#C9A45C]/55 shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
                >
                  <button
                    type="button"
                    onClick={() => onSelectNews(article.id)}
                    className="text-left block w-full focus:outline-none flex-1 flex flex-col"
                  >
                    <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-[#0A0805] border-b border-[#C9A45C]/40">
                      <NewsThumbnailArt
                        index={index}
                        posterUrl={article.posterUrl}
                        alt={article.title}
                        className="w-full h-full"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#0E0B07]/90 border border-[#FCE694]/70 text-[10px] font-bold text-[#FCE694] shadow-lg backdrop-blur-xs">
                        {article.category}
                      </div>
                      {article.eventDate && (
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-[#0D0A06]/95 border border-[#C9A45C]/60 flex items-center justify-between text-[11px] text-[#FCE694] shadow-lg">
                          <span className="font-bold">{article.eventDate}</span>
                          {article.eventTime && (
                            <span className="font-tabular text-[#E5C158]">
                              {article.eventTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        {article.presidingMonk && (
                          <p className="text-[11px] font-bold text-[#E5C158] truncate">
                            {article.presidingMonk}
                          </p>
                        )}
                        <h3 className="font-serif-heritage text-sm sm:text-base font-bold text-[#FFFFFF] group-hover:text-[#FCE694] line-clamp-2 leading-snug">
                          {article.title}
                        </h3>
                        {article.eventLocation && (
                          <p className="text-xs text-[#F7F2E8]/80 line-clamp-2 leading-relaxed">
                            {article.eventLocation}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#C9A45C]/25 flex items-center justify-between text-xs font-bold text-[#FCE694]">
                        <span>ดูโปสเตอร์และกำหนดการ</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>

            {/* Right 3 Columns: Illuminated Sacred Oath Shrine */}
            <div
              style={{ '--stagger-index': 3 } as React.CSSProperties}
              className="lg:col-span-3 relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-6 sm:p-7 flex flex-col justify-center text-center space-y-4"
            >
              <ThaiCornerBrackets colorClass="text-[#FCE694]/70" />
              <BppCrestLogo className="w-16 h-14 mx-auto" />
              <blockquote className="font-serif-heritage text-base sm:text-lg font-medium text-[#FCE694] leading-relaxed drop-shadow">
                ศรัทธา นำพาความดี
                <br />
                เกียรติภูมิ นำพาการปฏิบัติ
                <br />
                เพื่อแผ่นดิน และประชาชน
              </blockquote>
              <div className="pt-2 flex flex-col items-center">
                <div className="w-28 h-[1px] bg-gradient-to-r from-transparent via-[#FCE694] to-transparent mb-2.5" />
                <span className="text-xs tracking-[0.2em] text-[#E5C158] font-serif-heritage">
                  ตำรวจตระเวนชายแดน
                </span>
              </div>
              {news[3] && (
                <div className="pt-4 border-t border-[#C9A45C]/30 text-left space-y-2">
                  <span className="text-[10px] font-bold text-[#E5C158] tracking-wider block">
                    ประกาศคลังวัตถุมงคล
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectNews(news[3].id)}
                    className="text-xs font-bold text-[#FFFFFF] hover:text-[#FCE694] text-left line-clamp-2 leading-snug"
                  >
                    {news[3].title} →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Full-Screen Modal for Brochure Sheet Inspection on Home Page */}
      {enlargedBrochurePage !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ใบรายการวัตถุมงคล สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด."
          onClick={() => setEnlargedBrochurePage(null)}
          className="fixed inset-0 z-50 bg-[#060503]/95 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 sacred-shrine-pedestal rounded-2xl px-4 sm:px-6 py-3"
          >
            <div>
              <p className="text-xs font-bold text-[#E5C158]">
                เอกสารใบรายการวัตถุมงคล (แผ่นที่ {enlargedBrochurePage} / 4)
              </p>
              <h2 className="font-serif-heritage text-base sm:text-xl font-bold text-[#FCE694]">
                {
                  SOMDEJ_BROCHURE_PAGES.find(
                    (b) => b.pageNumber === enlargedBrochurePage
                  )?.title
                }
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {SOMDEJ_BROCHURE_PAGES.map((b) => (
                <button
                  key={b.pageNumber}
                  type="button"
                  onClick={() => setEnlargedBrochurePage(b.pageNumber)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    enlargedBrochurePage === b.pageNumber
                      ? 'btn-sacred-gold'
                      : 'bg-[#14100A] text-[#E5C158] border border-[#C9A45C]/40'
                  }`}
                >
                  หน้า {b.pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEnlargedBrochurePage(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#241B10] text-[#FCE694] border border-[#C9A45C]/60 text-xs font-bold flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>ปิด</span>
              </button>
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl w-full mx-auto my-4 rounded-2xl overflow-hidden bg-[#080604] border-2 border-[#C9A45C]/65 shadow-2xl"
          >
            <img
              src={
                SOMDEJ_BROCHURE_PAGES.find(
                  (b) => b.pageNumber === enlargedBrochurePage
                )?.imageUrl
              }
              alt="ใบรายการสมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด."
              className="w-full max-h-[78vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
