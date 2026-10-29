import React, { useEffect, useState } from 'react';
import { BppCrestLogo } from './SacredArtwork';

const SEEN_KEY = 'bpp_intro_seen';

function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.sessionStorage.getItem(SEEN_KEY)) return false;
  } catch {
    // storage blocked: just play it
  }
  return true;
}

// Decided once, before React renders, so the hero can wait for the intro (see index.css).
const PLAY = shouldPlayIntro();
if (PLAY && typeof document !== 'undefined') {
  document.documentElement.classList.add('intro-playing');
}

const SHOW_MS = 2100;
const FADE_MS = 700;

/** Full-screen opening: glowing crest + title, then lifts away. Plays once per visit; tap to skip. */
export const IntroSplash: React.FC<{ title: string }> = ({ title }) => {
  const [phase, setPhase] = useState<'show' | 'leave' | 'done'>(PLAY ? 'show' : 'done');

  useEffect(() => {
    if (!PLAY) return;
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignore
    }
    const leave = window.setTimeout(() => setPhase('leave'), SHOW_MS);
    const done = window.setTimeout(() => setPhase('done'), SHOW_MS + FADE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'show') document.documentElement.classList.remove('intro-playing');
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      onClick={() => setPhase('leave')}
      className={`no-print fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#050403] transition-opacity ease-out ${
        phase === 'leave' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="intro-glow absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_45%,rgba(229,193,88,0.22)_0%,rgba(5,4,3,0)_70%)]" />
      <div className="intro-crest relative">
        <BppCrestLogo className="w-28 h-24 sm:w-36 sm:h-32 drop-shadow-[0_0_28px_rgba(252,230,148,0.55)]" />
      </div>
      <div className="intro-title relative text-center px-6">
        <p className="font-bpp-official text-3xl sm:text-4xl font-bold tracking-wide text-gold-shimmer">
          {title}
        </p>
        <p className="mt-2 font-bpp-motto text-sm sm:text-base tracking-[0.25em] text-[#FCE694]/85">
          ๗๕ ปี ตำรวจตระเวนชายแดน
        </p>
      </div>
      <div className="relative h-[2px] w-40 sm:w-56 overflow-hidden rounded-full bg-[#C9A45C]/20">
        <div className="intro-line h-full bg-gradient-to-r from-transparent via-[#FCE694] to-transparent" />
      </div>
    </div>
  );
};
