import React, { useState } from 'react';
import {
  Heart,
  Menu,
  PackageSearch,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { SiteConfig } from '../types';
import { BppCrestLogo } from './SacredArtwork';

export type AppView =
  | 'home'
  | 'catalog'
  | 'detail'
  | 'about'
  | 'news'
  | 'checkout'
  | 'tracking'
  | 'faq'
  | 'admin';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  cartCount: number;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  siteConfig: SiteConfig;
  onQuickSearch: (query: string) => void;
  isAdminLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  cartCount,
  wishlistCount = 0,
  onOpenWishlist,
  siteConfig,
  onQuickSearch,
  isAdminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const navItems: { id: AppView; label: string }[] = [
    { id: 'home', label: 'หน้าหลัก' },
    { id: 'catalog', label: 'สั่งจองวัตถุมงคล' },
    { id: 'about', label: 'ประวัติและวัตถุประสงค์' },
    { id: 'news', label: 'ข่าวสารพิธี' },
    { id: 'tracking', label: 'ตรวจสอบใบจอง' },
    { id: 'faq', label: 'ติดต่อเรา' },
  ];

  const displayBrandTitle =
    !siteConfig.brandTitleThai || siteConfig.brandTitleThai === 'วัตถุมงคล ตชด.'
      ? 'สมเด็จพิทักษ์แผ่นดิน'
      : siteConfig.brandTitleThai;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(searchInput.trim());
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0A0805]/95 via-[#18130B]/95 to-[#0A0805]/95 backdrop-blur-md text-[#F7F2E8] border-b border-[#C9A45C]/55 shadow-[0_6px_24px_rgba(0,0,0,0.78)]">
      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Official Crest Emblem + Brand Lockup in Official BPP Font */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 sm:gap-3.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C158] rounded min-w-0"
        >
          <BppCrestLogo className="w-11 h-10 sm:w-14 sm:h-12" />
          {/* Brand text only on phones; from sm up the crest alone leads (the text was being truncated) */}
          <div className="leading-tight min-w-0 sm:hidden">
            <span className="block font-bpp-official text-base leading-snug sm:text-2xl lg:text-[1.75rem] font-bold tracking-wide text-gold-shimmer group-hover:brightness-110 transition-all sm:break-words min-w-0">
              {displayBrandTitle}
            </span>
            <span className="hidden sm:block font-bpp-motto text-[11px] sm:text-xs text-[#FCE694] tracking-wider break-words min-w-0">
              ศรัทธา • เกียรติภูมิ • แผ่นดิน · ๗๕ ปี ตชด.
            </span>
          </div>
        </button>

        {/* Zone 2: Desktop Navigation Links */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden xl:flex items-center gap-6 text-sm"
        >
          {navItems.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'catalog' && currentView === 'detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1.5 transition-all whitespace-nowrap shrink-0 border-b-2 font-bpp-official text-base tracking-wide ${
                  isActive
                    ? 'border-[#FCE694] text-[#FCE694] font-bold'
                    : 'border-transparent text-[#F7F2E8]/90 hover:text-[#FCE694] hover:border-[#C9A45C]/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Clear, Easy-to-Use Actions (Search, Wishlist, Admin, Prominent Reservation Cart) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="ค้นหาวัตถุมงคล"
            title="ค้นหารหัสหรือเนื้อพระ"
            className="p-2 rounded-xl border border-[#C9A45C]/35 bg-[#16110B]/80 text-[#F7F2E8]/90 hover:text-[#FCE694] hover:border-[#FCE694] transition-colors"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenWishlist) {
                onOpenWishlist();
              } else {
                onNavigate('catalog');
              }
            }}
            aria-label={`รายการวัตถุมงคลที่บันทึกไว้ จำนวน ${wishlistCount} รายการ`}
            title="รายการที่บันทึกไว้"
            className="relative hidden sm:block p-2 rounded-xl border border-[#C9A45C]/35 bg-[#16110B]/80 text-[#F7F2E8] hover:text-[#FCE694] hover:border-[#FCE694] transition-colors"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                wishlistCount > 0
                  ? 'text-[#FCE694] fill-[#FCE694]'
                  : 'text-[#F7F2E8]/90'
              }`}
            />
            {wishlistCount > 0 && (
              <span className="font-tabular absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1C150C] border border-[#FCE694] text-[#FCE694] text-[10px] font-bold flex items-center justify-center shadow">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('checkout')}
            aria-label={`ตะกร้าสั่งจอง จำนวน ${cartCount} รายการ`}
            className="btn-sacred-gold px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline font-bpp-official text-sm tracking-wide">
              ตะกร้าสั่งจอง
            </span>
            <span className="font-tabular min-w-[20px] h-5 px-1.5 rounded-full bg-[#0E0B07] text-[#FCE694] text-xs font-bold flex items-center justify-center">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
            aria-expanded={mobileMenuOpen}
            className="xl:hidden p-2 rounded-xl border border-[#C9A45C]/45 bg-[#16110B] text-[#FCE694] hover:bg-[#2B2112]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="bg-[#120E09] border-t border-[#C9A45C]/35 px-4 py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-3xl mx-auto flex items-center gap-3"
          >
            <label htmlFor="header-quick-search" className="sr-only">
              ค้นหาตามชื่อวัตถุมงคล ชื่อรุ่น หรือรหัสประจำรุ่น
            </label>
            <input
              id="header-quick-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="พิมพ์รหัส เช่น ช1, ช2, ช3, ชศ1 หรือพิมพ์เนื้อพระที่ต้องการค้นหา..."
              className="flex-1 bg-[#1C160E] text-[#F7F2E8] placeholder-[#E5C158]/55 text-sm px-4 py-2.5 rounded-xl border border-[#C9A45C]/55 focus:outline-none focus:ring-2 focus:ring-[#E5C158]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 btn-sacred-gold font-bold text-sm rounded-xl transition-all whitespace-nowrap shrink-0"
            >
              ค้นหาทันที
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="เมนูมือถือ"
          className="xl:hidden bg-[#110D08] border-t border-[#C9A45C]/35 px-4 py-4 space-y-1.5"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 min-h-[48px] rounded-xl font-bpp-official text-base tracking-wide transition-colors flex items-center justify-between ${
                currentView === item.id
                  ? 'bg-[#2A2012] text-[#FCE694] border border-[#C9A45C]/65 font-bold'
                  : 'text-[#F7F2E8]/90 hover:bg-[#1E170D]'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sm:hidden pt-2 mt-2 border-t border-[#C9A45C]/25 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                if (onOpenWishlist) {
                  onOpenWishlist();
                } else {
                  onNavigate('catalog');
                }
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 min-h-[48px] rounded-xl font-bpp-official text-base text-[#F7F2E8]/90 hover:bg-[#1E170D] flex items-center justify-between"
            >
              <span>รายการที่บันทึกไว้</span>
              <span className="font-tabular text-sm text-[#FCE694]">{wishlistCount}</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
