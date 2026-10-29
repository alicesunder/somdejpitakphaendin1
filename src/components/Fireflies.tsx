import React, { useEffect, useRef } from 'react';

interface Firefly {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  wander: number;
  wanderSpeed: number;
  blinkSpeed: number;
  phase: number;
}

/**
 * Soft golden fireflies drifting and blinking over the hero.
 * Canvas-based (one glow sprite, drawn per particle), pauses when off-screen or the
 * tab is hidden, and draws a still frame for users who prefer reduced motion.
 */
export const Fireflies: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // One pre-rendered glow sprite keeps drawing cheap.
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 246, 200, 1)');
    grad.addColorStop(0.18, 'rgba(255, 220, 120, 0.85)');
    grad.addColorStop(0.5, 'rgba(229, 193, 88, 0.22)');
    grad.addColorStop(1, 'rgba(229, 193, 88, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);

    let width = 0;
    let height = 0;
    let flies: Firefly[] = [];
    let raf = 0;
    let visible = true;
    let last = performance.now();

    const spawn = (): Firefly => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 9 + Math.random() * 15,
      driftX: (Math.random() - 0.5) * 9,
      driftY: -2 - Math.random() * 7,
      wander: Math.random() * Math.PI * 2,
      wanderSpeed: 0.3 + Math.random() * 0.7,
      blinkSpeed: 0.5 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(16, Math.max(6, (width * height) / 80000)));
      flies = Array.from({ length: count }, spawn);
    };

    const draw = (time: number, still: boolean) => {
      ctx.clearRect(0, 0, width, height);
      for (const f of flies) {
        const blink = still
          ? 0.55
          : Math.pow(Math.max(0, Math.sin(time * f.blinkSpeed + f.phase)), 2);
        ctx.globalAlpha = 0.08 + 0.62 * blink;
        const s = f.size * (0.8 + 0.4 * blink);
        ctx.drawImage(sprite, f.x - s / 2, f.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      for (const f of flies) {
        f.wander += f.wanderSpeed * dt;
        f.x += (f.driftX + Math.sin(f.wander) * 14) * dt;
        f.y += (f.driftY + Math.cos(f.wander * 0.8) * 8) * dt;
        if (f.y < -30) {
          f.y = height + 30;
          f.x = Math.random() * width;
        }
        if (f.x < -30) f.x = width + 30;
        if (f.x > width + 30) f.x = -30;
      }
      draw(now / 1000, false);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0, true);
    });
    resizeObserver.observe(canvas);

    if (reduceMotion) {
      draw(0, true);
    } else {
      raf = requestAnimationFrame(tick);
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      last = performance.now();
    });
    intersection.observe(canvas);
    const onVisibility = () => {
      visible = !document.hidden;
      last = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
};
