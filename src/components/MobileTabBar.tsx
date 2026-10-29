import React from 'react';
import { ClipboardCheck, Home, MessageCircle, ShoppingCart, Store } from 'lucide-react';
import type { AppView } from './Header';

interface MobileTabBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  cartCount: number;
}

const TABS: {
  id: AppView;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'home', label: 'หน้าหลัก', Icon: Home },
  { id: 'catalog', label: 'สั่งจอง', Icon: Store },
  { id: 'checkout', label: 'ตะกร้า', Icon: ShoppingCart },
  { id: 'tracking', label: 'ใบจอง', Icon: ClipboardCheck },
  { id: 'faq', label: 'ติดต่อ', Icon: MessageCircle },
];

/** App-style bottom navigation for phones. */
export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentView,
  onNavigate,
  cartCount,
}) => (
  <nav
    aria-label="เมนูหลักมือถือ"
    className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0906]/95 backdrop-blur-md border-t border-[#C9A45C]/55 shadow-[0_-8px_28px_rgba(0,0,0,0.75)] pb-[env(safe-area-inset-bottom)]"
  >
    <ul className="grid grid-cols-5">
      {TABS.map(({ id, label, Icon }) => {
        const active = currentView === id || (id === 'catalog' && currentView === 'detail');
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => {
                onNavigate(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={active ? 'page' : undefined}
              className={`relative w-full min-h-[60px] flex flex-col items-center justify-center gap-1 transition-colors active:bg-[#1E170D] ${
                active ? 'text-[#FCE694]' : 'text-[#F7F2E8]/70'
              }`}
            >
              {active && (
                <span className="absolute top-0 h-[3px] w-10 rounded-b-full bg-gradient-to-r from-[#C9A45C] via-[#FCE694] to-[#C9A45C]" />
              )}
              <span className="relative">
                <Icon className="w-6 h-6" />
                {id === 'checkout' && cartCount > 0 && (
                  <span className="font-tabular absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FCE694] text-[#0E0B07] text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
