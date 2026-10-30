import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  flake: boolean;
  spin: number;
  angle: number;
}

/**
 * Celebration after a reservation goes through: rays of golden light, two bursts of gold
 * sparks and slowly falling gold leaf around a "จองสำเร็จ" seal. Closes itself after a few
 * seconds (or on tap / Esc). Canvas-based with one pre-rendered glow sprite; users who
 * prefer reduced motion get the seal without the moving light. Rendered into <body> so no
 * animated (transformed) page wrapper can trap its fixed positioning.
 */
export const OrderCelebration: React.FC<{ orderNumber: string; onClose: () => void }> = ({
  orderNumber,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(onClose, 6500);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d')!;
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 250, 220, 1)');
    g.addColorStop(0.2, 'rgba(255, 221, 120, 0.9)');
    g.addColorStop(0.55, 'rgba(229, 180, 70, 0.25)');
    g.addColorStop(1, 'rgba(229, 180, 70, 0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    const sparks: Spark[] = [];
    const burst = (cx: number, cy: number, count: number, speed: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.35 + Math.random() * 0.65);
        sparks.push({
          x: cx, y: cy,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.25,
          life: 0, max: 70 + Math.random() * 50,
          size: (6 + Math.random() * 10) * dpr,
          flake: false, spin: 0, angle: 0,
        });
      }
    };
    const leaf = () => {
      sparks.push({
        x: Math.random() * canvas.width, y: -20 * dpr,
        vx: (Math.random() - 0.5) * 0.6 * dpr, vy: (0.8 + Math.random() * 1.2) * dpr,
        life: 0, max: 260,
        size: (4 + Math.random() * 6) * dpr,
        flake: true, spin: (Math.random() - 0.5) * 0.12, angle: Math.random() * Math.PI,
      });
    };

    const W = () => canvas.width;
    const H = () => canvas.height;
    burst(W() / 2, H() * 0.42, 140, 9 * dpr);
    const second = window.setTimeout(() => {
      burst(W() * 0.25, H() * 0.35, 60, 7 * dpr);
      burst(W() * 0.75, H() * 0.35, 60, 7 * dpr);
    }, 450);

    let frame = 0;
    let tick = 0;
    const draw = () => {
      tick += 1;
      if (tick < 200 && tick % 3 === 0) leaf();
      ctx.clearRect(0, 0, W(), H());
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += 1;
        if (p.flake) {
          p.angle += p.spin;
          p.x += p.vx + Math.sin((p.life + i) / 18) * 0.6 * dpr;
          p.y += p.vy;
        } else {
          p.vx *= 0.97;
          p.vy = p.vy * 0.97 + 0.12 * dpr;
          p.x += p.vx;
          p.y += p.vy;
        }
        const fade = 1 - p.life / p.max;
        if (fade <= 0 || p.y > H() + 40) {
          sparks.splice(i, 1);
          continue;
        }
        if (p.flake) {
          // A tumbling flake of gold leaf.
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(1, Math.abs(Math.cos(p.angle * 1.7)) * 0.8 + 0.2);
          ctx.globalAlpha = Math.min(1, fade * 1.4) * 0.9;
          ctx.fillStyle = '#F2CF6B';
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.globalAlpha = fade;
          ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      }
      ctx.globalAlpha = 1;
      if (sparks.length > 0 || tick < 200) frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(second);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebrate-title"
      className="celebrate-backdrop no-print fixed inset-0 z-[9999] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div aria-hidden="true" className="celebrate-rays" />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="celebrate-card relative text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-seal mx-auto">
          <CheckCircle2 className="w-14 h-14 text-[#18140E]" strokeWidth={2.4} />
        </div>
        <h2 id="celebrate-title" className="mt-5 font-serif-heritage text-3xl sm:text-4xl font-bold text-gold-shimmer">
          จองสำเร็จ
        </h2>
        <p className="mt-2 text-sm text-[#F7F2E8]/90">ขออนุโมทนาบุญ ที่ร่วมบูชาวัตถุมงคล</p>
        <p className="mt-3 inline-block rounded-full border border-[#FCE694]/60 bg-[#18120A]/80 px-4 py-1.5 font-tabular text-sm font-bold text-[#FCE694]">
          เลขที่คำสั่งจอง {orderNumber}
        </p>
        <p className="mt-3 text-xs text-[#F7F2E8]/75">
          เจ้าหน้าที่จะตรวจสอบสลิป แล้วส่งใบจองที่ลงนามแล้วไปทางอีเมล
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-5 px-6 py-2.5 rounded-xl btn-sacred-gold font-bold text-sm"
        >
          ดูรายละเอียดคำสั่งจอง
        </button>
      </div>
    </div>,
    document.body,
  );
};
