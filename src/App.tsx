/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Heart } from 'lucide-react';
import {
  BOOKING_CLOSED_MESSAGE,
  BOOKING_OPEN_DATE_TEXT,
  SALES_PAUSED_MESSAGE,
  isBookingOpen,
} from './config/booking';
import {
  createInitialRajaSlots,
  initialNews,
  initialProducts,
  initialSiteConfig,
} from './data/seedData';
import {
  AmuletProduct,
  CartItem,
  NewsArticle,
  PublicTrackedOrder,
  RajaSetSlot,
  SiteConfig,
} from './types';
import {
  getEffectiveSlotState,
  toggleWishlistId,
} from './utils/commerceRules';
import { AppView, Header } from './components/Header';
import { Footer } from './components/Footer';
import { IntroSplash } from './components/IntroSplash';
import { MobileTabBar } from './components/MobileTabBar';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { ProductDetailView } from './components/ProductDetailView';
import { CartCheckoutView } from './components/CartCheckoutView';
import { OrderTrackingView } from './components/OrderTrackingView';
import {
  AboutHistoryView,
  FaqContactView,
  NewsStoriesView,
} from './components/HistoryNewsFaqViews';
const AdminDashboardView = lazy(() =>
  import('./components/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView })),
);
import { RajaNumberGridModal } from './components/RajaNumberGridModal';

function getOrCreateBuyerSessionId(): string {
  try {
    const existing = localStorage.getItem('bpp_session_id_v1');
    if (existing && existing.length >= 8) return existing;
    const created = `sess-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    localStorage.setItem('bpp_session_id_v1', created);
    return created;
  } catch {
    return `sess-${Date.now().toString(36)}`;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [products, setProducts] = useState<AmuletProduct[]>(initialProducts);
  const [rajaSlots, setRajaSlots] = useState<RajaSetSlot[]>(() =>
    createInitialRajaSlots()
  );
  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(initialSiteConfig);
  const [sessionId] = useState<string>(() => getOrCreateBuyerSessionId());
  const [globalRajaModalOpen, setGlobalRajaModalOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProducts[0]?.id || ''
  );
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [catalogCategory, setCatalogCategory] =
    useState<import('./types').ProductCategory>('all');
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bpp_heritage_cart_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage error
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bpp_heritage_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((id): id is string => typeof id === 'string');
        }
      }
    } catch {
      // ignore storage error
    }
    return [];
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('bpp_admin_token');
    } catch {
      return null;
    }
  });

  const [cartToast, setCartToast] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(() => isBookingOpen());
  useEffect(() => {
    if (dateOpen) return;
    const timer = window.setInterval(() => {
      if (isBookingOpen()) setDateOpen(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [dateOpen]);
  // Reservations need both the opening date and the admin's sales switch (siteConfig.salesOpen).
  const bookingOpen = dateOpen && siteConfig.salesOpen !== false;
  const closedMessage = dateOpen ? SALES_PAUSED_MESSAGE : BOOKING_CLOSED_MESSAGE;
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

  const fetchStoreBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.rajaSlots)) {
        setRajaSlots(data.rajaSlots);
      }
      if (Array.isArray(data.news)) setNews(data.news);
      if (data.siteConfig) setSiteConfig(data.siteConfig);
    } catch {
      // fallback to seedData already loaded
    }
  }, []);

  useEffect(() => {
    fetchStoreBootstrap();
  }, [fetchStoreBootstrap]);

  // Keep the 1–99 slot grid fresh by polling the server (single source of truth)
  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/raja-slots');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.rajaSlots)) setRajaSlots(data.rajaSlots);
        }
      } catch {
        // ignore network error
      }
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Compute numbers currently held by this buyer's session
  const selectedRajaNumbers = useMemo(() => {
    const now = Date.now();
    return rajaSlots
      .filter(
        (slot) =>
          getEffectiveSlotState(slot, sessionId, now).effectiveStatus ===
          'selected_by_me'
      )
      .map((slot) => slot.slotNumber)
      .sort((a, b) => a - b);
  }, [rajaSlots, sessionId]);

  // Keep cart item for ช1 (prod-ch1) automatically synchronized with selectedRajaNumbers
  useEffect(() => {
    setCart((prev) => {
      const existingCh1 = prev.find((i) => i.productId === 'prod-ch1');
      if (selectedRajaNumbers.length === 0) {
        if (!existingCh1) return prev;
        return prev.filter((i) => i.productId !== 'prod-ch1');
      }

      const sameNumbers =
        existingCh1 &&
        existingCh1.quantity === selectedRajaNumbers.length &&
        Array.isArray(existingCh1.selectedNumbers) &&
        existingCh1.selectedNumbers.length === selectedRajaNumbers.length &&
        existingCh1.selectedNumbers.every(
          (n, idx) => n === selectedRajaNumbers[idx]
        );

      if (sameNumbers) return prev;

      if (existingCh1) {
        return prev.map((item) =>
          item.productId === 'prod-ch1'
            ? {
                ...item,
                quantity: selectedRajaNumbers.length,
                selectedNumbers: selectedRajaNumbers,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: 'prod-ch1',
          quantity: selectedRajaNumbers.length,
          selectedNumbers: selectedRajaNumbers,
        },
      ];
    });
  }, [selectedRajaNumbers]);

  useEffect(() => {
    try {
      localStorage.setItem('bpp_heritage_cart_v5', JSON.stringify(cart));
    } catch {
      // ignore storage error
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('bpp_heritage_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore storage error
    }
  }, [wishlist]);

  // Enhance depth & dimension as the user scrolls by triggering sacred-stagger-reveal when below-the-fold grid elements enter the viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('.sacred-stagger-reveal')
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (el.dataset.scrollPending === 'true') {
              delete el.dataset.scrollPending;
              el.style.animation = 'none';
              void el.offsetHeight;
              el.style.animation = '';
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
    );

    const viewportHeight = window.innerHeight || 900;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > viewportHeight * 0.96) {
        el.dataset.scrollPending = 'true';
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [currentView, selectedProductId, selectedNewsId, products.length]);

  const totalCartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // The receipt email links to /?track=<order number> to open the tracking page directly.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const track = params.get('track');
    if (!track) return;
    setTrackingOrderNumber(track.slice(0, 40));
    setCurrentView('tracking');
    params.delete('track');
    const rest = params.toString();
    history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
  }, []);

  // The back office is not linked anywhere public: staff open it with /#admin
  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
        history.replaceState(null, '', window.location.pathname + window.location.search);
        window.scrollTo(0, 0);
      }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'news') {
      setSelectedNewsId(null);
    }
    if (view === 'catalog') {
      setCatalogCategory('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleWishlist = (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const { nextIds, added } = toggleWishlistId(prev, productId);
      if (targetProduct) {
        setWishlistToast(
          added
            ? `บันทึก "${targetProduct.name}" ลงในรายการที่ชื่นชอบแล้ว`
            : `นำ "${targetProduct.name}" ออกจากรายการที่ชื่นชอบแล้ว`
        );
        setTimeout(() => setWishlistToast(null), 2800);
      }
      return nextIds;
    });
  };

  const handleToggleRajaSlot = useCallback(
    async (
      slotNumber: number
    ): Promise<{ success: boolean; error?: string }> => {
      if (!bookingOpen) {
        return { success: false, error: closedMessage };
      }
      try {
        const res = await fetch('/api/raja-slots/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotNumber, sessionId }),
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: data.error || 'ไม่สามารถเลือกหมายเลขนี้ได้',
          };
        }
        if (Array.isArray(data.rajaSlots)) {
          setRajaSlots(data.rajaSlots);
        }
        if (data.action === 'held') {
          setCartToast(
            `ล็อกหมายเลข #${String(slotNumber).padStart(2, '0')} ชุดทองคำใหญ่ราชาฤกษ์ (ช1) ลงในตะกร้าแล้ว`
          );
          setTimeout(() => setCartToast(null), 2800);
        }
        return { success: true };
      } catch {
        return {
          success: false,
          error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        };
      }
    },
    [sessionId, bookingOpen, closedMessage]
  );

  const handleAddToCart = (product: AmuletProduct, quantity = 1) => {
    if (!bookingOpen) {
      setCartToast(closedMessage);
      setTimeout(() => setCartToast(null), 4000);
      return;
    }
    if (product.requiresNumberSelection) {
      if (selectedRajaNumbers.length === 0) {
        setGlobalRajaModalOpen(true);
        return;
      }
      setCartToast(
        `บันทึก ช1 ชุดทองคำใหญ่ราชาฤกษ์ (${selectedRajaNumbers.length} ชุด: ${selectedRajaNumbers
          .map((n) => `#${n}`)
          .join(', ')}) ในตะกร้าแล้ว`
      );
      setTimeout(() => setCartToast(null), 2800);
      return;
    }

    if (!product.isMadeToOrder && product.stock <= 0) return;

    const maxStock = product.isMadeToOrder ? 9999 : product.stock;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(maxStock, existing.quantity + quantity);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      return [
        ...prev,
        { productId: product.id, quantity: Math.min(maxStock, quantity) },
      ];
    });

    setCartToast(
      `เพิ่ม "${product.name}" (${quantity} รายการ) ลงในตะกร้าสั่งจองแล้ว`
    );
    setTimeout(() => setCartToast(null), 2800);
  };

  const handleBuyNow = (product: AmuletProduct, quantity = 1) => {
    if (!bookingOpen) {
      setCartToast(closedMessage);
      setTimeout(() => setCartToast(null), 4000);
      return;
    }
    if (product.requiresNumberSelection && selectedRajaNumbers.length === 0) {
      setGlobalRajaModalOpen(true);
      return;
    }
    handleAddToCart(product, quantity);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (productId === 'prod-ch1') return;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    if (productId === 'prod-ch1' && selectedRajaNumbers.length > 0) {
      selectedRajaNumbers.forEach((num) => {
        void handleToggleRajaSlot(num);
      });
    }
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = (skipSlotRelease = false) => {
    if (!skipSlotRelease && selectedRajaNumbers.length > 0) {
      selectedRajaNumbers.forEach((num) => {
        void handleToggleRajaSlot(num);
      });
    }
    setCart([]);
  };

  const handleQuickSearch = (query: string) => {
    setCatalogSearchQuery(query);
    setCatalogCategory('all');
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectNews = (articleId: string) => {
    setSelectedNewsId(articleId);
    setCurrentView('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCreated = (
    _order: PublicTrackedOrder,
    updatedSlots?: RajaSetSlot[],
    updatedProducts?: AmuletProduct[]
  ) => {
    if (Array.isArray(updatedSlots)) setRajaSlots(updatedSlots);
    if (Array.isArray(updatedProducts)) setProducts(updatedProducts);
    fetchStoreBootstrap();
  };

  const handleGoToTracking = (orderNumber: string) => {
    setTrackingOrderNumber(orderNumber);
    setCurrentView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const relatedProducts = useMemo(() => {
    if (!activeProduct) return [];
    return products.filter(
      (p) => p.id !== activeProduct.id && p.isVisible
    );
  }, [products, activeProduct]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#080705] text-[#F7F2E8] ${
        currentView === 'admin' ? '' : 'pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0'
      }`}
    >
      <IntroSplash
        title={
          !siteConfig.brandTitleThai || siteConfig.brandTitleThai === 'วัตถุมงคล ตชด.'
            ? 'สมเด็จพิทักษ์แผ่นดิน'
            : siteConfig.brandTitleThai
        }
      />
      <div className="no-print">
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          cartCount={totalCartCount}
          wishlistCount={wishlist.length}
          onOpenWishlist={() => handleNavigate('catalog')}
          siteConfig={siteConfig}
          onQuickSearch={handleQuickSearch}
          isAdminLoggedIn={Boolean(adminToken)}
        />
      </div>

      {!bookingOpen && (
        <div
          role="status"
          className="no-print bg-gradient-to-r from-[#2B2112] via-[#3A2C14] to-[#2B2112] border-b border-[#C9A45C]/60 text-[#FCE694]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-3 text-center">
            <CalendarClock className="w-5 h-5 shrink-0" aria-hidden="true" />
            <p className="text-sm sm:text-base font-bold leading-snug">
              {dateOpen ? 'ปิดรับจองชั่วคราว' : 'ยังไม่เปิดให้จอง'}
              <span className="block sm:inline sm:ml-2 font-semibold text-[#F7F2E8]">
                {dateOpen
                  ? 'กรุณาติดตามประกาศจากเจ้าหน้าที่'
                  : `เปิดให้จองวันที่ ${BOOKING_OPEN_DATE_TEXT}`}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Animated Floating Cart & Wishlist Feedback Toasts */}
      {cartToast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-24 md:bottom-5 right-4 md:right-5 max-w-[calc(100vw-2rem)] z-50 sacred-shrine-pedestal animate-sacred-reveal text-[#F7F2E8] px-4 py-3.5 rounded-xl flex items-center gap-3 text-xs sm:text-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-[#FCE694] shrink-0" />
          <span>{cartToast}</span>
          <button
            type="button"
            onClick={() => handleNavigate('checkout')}
            className="ml-2 text-[#FCE694] font-bold underline whitespace-nowrap"
          >
            ดูตะกร้า →
          </button>
        </div>
      )}

      {wishlistToast && !cartToast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-24 md:bottom-5 right-4 md:right-5 max-w-[calc(100vw-2rem)] z-50 sacred-shrine-pedestal animate-sacred-reveal text-[#F7F2E8] px-4 py-3.5 rounded-xl flex items-center gap-3 text-xs sm:text-sm"
        >
          <Heart className="w-4 h-4 text-[#FCE694] fill-[#FCE694] shrink-0" />
          <span>{wishlistToast}</span>
          <button
            type="button"
            onClick={() => handleNavigate('catalog')}
            className="ml-2 text-[#FCE694] font-bold underline whitespace-nowrap"
          >
            ดูรายการที่บันทึก →
          </button>
        </div>
      )}

      <main className="flex-1">
        <div
          key={`${currentView}-${selectedProductId}-${selectedNewsId || 'list'}`}
          className="animate-sacred-reveal"
        >
          {currentView === 'home' && (
            <HomeView
              siteConfig={siteConfig}
              products={products}
              news={news}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onNavigate={handleNavigate}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              onSelectNews={handleSelectNews}
            />
          )}

          {currentView === 'catalog' && (
            <CatalogView
              products={products}
              rajaSlots={rajaSlots}
              sessionId={sessionId}
              selectedRajaNumbers={selectedRajaNumbers}
              onToggleRajaSlot={handleToggleRajaSlot}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              initialSearchQuery={catalogSearchQuery}
              initialCategory={catalogCategory}
              cartCount={totalCartCount}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              onNavigateHome={() => handleNavigate('home')}
              onNavigateCheckout={() => handleNavigate('checkout')}
            />
          )}

          {currentView === 'detail' && activeProduct && (
            <ProductDetailView
              product={activeProduct}
              relatedProducts={relatedProducts}
              siteConfig={siteConfig}
              rajaSlots={rajaSlots}
              sessionId={sessionId}
              selectedRajaNumbers={selectedRajaNumbers}
              onToggleRajaSlot={handleToggleRajaSlot}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onBackToCatalog={() => handleNavigate('catalog')}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onNavigateCheckout={() => handleNavigate('checkout')}
            />
          )}

          {currentView === 'checkout' && (
            <div className="bg-[#080705] text-[#F7F2E8] min-h-screen">
              <CartCheckoutView
                bookingOpen={bookingOpen}
                cart={cart}
                products={products}
                rajaSlots={rajaSlots}
                sessionId={sessionId}
                selectedRajaNumbers={selectedRajaNumbers}
                onToggleRajaSlot={handleToggleRajaSlot}
                siteConfig={siteConfig}
                onUpdateQty={handleUpdateCartQty}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onOrderCreated={handleOrderCreated}
                onContinueShopping={() => handleNavigate('catalog')}
                onGoToTracking={handleGoToTracking}
              />
            </div>
          )}

          {currentView === 'tracking' && (
            <OrderTrackingView initialOrderNumber={trackingOrderNumber} paymentChannels={siteConfig.paymentChannels} siteConfig={siteConfig} />
          )}

          {currentView === 'about' && (
            <AboutHistoryView
              siteConfig={siteConfig}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'news' && (
            <NewsStoriesView
              news={news}
              selectedArticleId={selectedNewsId}
              onSelectArticle={setSelectedNewsId}
            />
          )}

          {currentView === 'faq' && (
            <FaqContactView siteConfig={siteConfig} />
          )}

          {currentView === 'admin' && (
            <div className="bg-gradient-to-b from-[#F7F2E8] to-[#EFE7D6] text-[#18140E] min-h-screen">
              <Suspense fallback={<div className="p-10 text-center">กำลังโหลด...</div>}>
<AdminDashboardView
                adminToken={adminToken}
                onLoginSuccess={(token) => {
                  setAdminToken(token);
                  try {
                    sessionStorage.setItem('bpp_admin_token', token);
                  } catch {
                    // ignore
                  }
                }}
                onLogout={() => {
                  setAdminToken(null);
                  try {
                    sessionStorage.removeItem('bpp_admin_token');
                  } catch {
                    // ignore
                  }
                }}
                onStoreUpdated={fetchStoreBootstrap}
              />
</Suspense>
            </div>
          )}
        </div>
      </main>

      <div className="no-print">
        <Footer siteConfig={siteConfig} onNavigate={handleNavigate} />
        {currentView !== 'admin' && (
          <MobileTabBar
            currentView={currentView}
            onNavigate={handleNavigate}
            cartCount={totalCartCount}
          />
        )}
      </div>

      {/* Global 1-99 Number Selection Modal for ช1 ชุดทองคำใหญ่ราชาฤกษ์ */}
      {globalRajaModalOpen && (
        <RajaNumberGridModal
          product={
            products.find((p) => p.id === 'prod-ch1') || initialProducts[0]
          }
          rajaSlots={rajaSlots}
          sessionId={sessionId}
          selectedNumbers={selectedRajaNumbers}
          onToggleSlot={handleToggleRajaSlot}
          onConfirmProceed={() => {
            setGlobalRajaModalOpen(false);
            handleNavigate('checkout');
          }}
          onClose={() => setGlobalRajaModalOpen(false)}
          mode="modal"
        />
      )}
    </div>
  );
}
