import { useEffect } from 'react';

// Cards that get the scroll reveal and the pointer-following light.
const CARD_SELECTOR = '.sacred-vault-card, .archival-paper-card, .sacred-shrine-pedestal';

/**
 * Site-wide motion for the storefront:
 * - cards and section headings rise and fade in as they scroll into view (staggered);
 * - a soft gold light follows the pointer across cards (desktop).
 * Elements are only hidden once JavaScript has taken charge of revealing them, so nothing
 * stays invisible if this never runs. Does nothing for users who prefer reduced motion.
 */
export function useSacredMotion(enabled: boolean, viewKey: string) {
  // Scroll reveal: rescan whenever the view changes or new content is added.
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const main = document.querySelector('main');
    if (!main) return;

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
          el.classList.add('reveal-in');
          // Drop the stagger afterwards so hover effects respond immediately.
          window.setTimeout(() => (el.style.transitionDelay = ''), 1200);
          io.unobserve(el);
          i += 1;
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const scan = () => {
      const targets = main.querySelectorAll<HTMLElement>(`${CARD_SELECTOR}, section h2`);
      targets.forEach((el) => {
        if (el.dataset.reveal) return;
        // Headings inside a card move with their card.
        if (el.tagName === 'H2' && el.parentElement?.closest(CARD_SELECTOR)) return;
        // Leave fixed overlays (dialogs, sticky bars) alone, and anything with its own entrance.
        if (el.closest('[role="dialog"], .fixed')) return;
        if (el.matches('.sacred-stagger-reveal, .animate-sacred-reveal, .hero-rise')) return;
        el.dataset.reveal = '1';
        el.classList.add('reveal');
        io.observe(el);
      });
    };

    scan();
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        pending = 0;
        scan();
      });
    });
    mo.observe(main, { childList: true, subtree: true });

    // A fast flick can carry a card past the viewport between two observer checks: once
    // scrolling settles, show anything that is already above the bottom of the screen.
    let settle = 0;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        main.querySelectorAll<HTMLElement>('.reveal:not(.reveal-in)').forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('reveal-in');
            io.unobserve(el);
          }
        });
      }, 160);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      if (pending) window.cancelAnimationFrame(pending);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled, viewKey]);

  // Pointer-following light on cards.
  useEffect(() => {
    if (!enabled) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      frame = 0;
      if (!last) return;
      const card = (last.target as Element | null)?.closest?.(CARD_SELECTOR) as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${last.clientX - r.left}px`);
      card.style.setProperty('--my', `${last.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled]);
}
