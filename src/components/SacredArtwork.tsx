import React, { useState } from 'react';
import { AngleType, SpecimenStyle } from '../types';

const REF_IMAGE_PATH =
  '/assets/aistudio/_____________________.____________a3ca9b6b.webp';

export const NEW_HERO_BG_PATH =
  '/assets/aistudio/_________________________0c5d9010.webp';

export const OFFICIAL_LOGO_PATH =
  '/assets/aistudio/____________________________13__3ac81af0.webp';

export const OFFICIAL_BROCHURE_PDF_PATH =
  '/assets/aistudio/______4_____1__e43ec0fe.pdf';

export const OFFICIAL_STUDIO_PHOTOS_PDF_PATH =
  '/assets/aistudio/_______________________________09b0e8a2.pdf';

export const BppCrestLogo: React.FC<{ className?: string }> = ({
  className = 'w-12 h-12',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none overflow-hidden rounded-lg ${className}`}
    >
      <img
        src={OFFICIAL_LOGO_PATH}
        alt="ตราสัญลักษณ์ ๗๕ ปี ตชด. กองบัญชาการตำรวจตระเวนชายแดน"
        className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(229,193,88,0.35)]"
      />
    </div>
  );
};

export const ThaiCornerBrackets: React.FC<{
  className?: string;
  colorClass?: string;
}> = ({ className = '', colorClass = 'text-[#E5C158]/75' }) => {
  return (
    <div
      className={`pointer-events-none absolute inset-2 select-none ${colorClass} ${className}`}
      aria-hidden="true"
    >
      {/* Top-Left Ruen-Kaew Stepped Corner */}
      <svg
        viewBox="0 0 28 28"
        className="w-5 h-5 absolute top-0 left-0 fill-none stroke-current"
      >
        <path d="M 1 22 L 1 5 L 5 5 L 5 1 L 22 1" strokeWidth="1.5" />
        <rect x="4" y="4" width="3" height="3" fill="currentColor" />
      </svg>
      {/* Top-Right Ruen-Kaew Stepped Corner */}
      <svg
        viewBox="0 0 28 28"
        className="w-5 h-5 absolute top-0 right-0 fill-none stroke-current"
      >
        <path d="M 27 22 L 27 5 L 23 5 L 23 1 L 6 1" strokeWidth="1.5" />
        <rect x="21" y="4" width="3" height="3" fill="currentColor" />
      </svg>
      {/* Bottom-Left Ruen-Kaew Stepped Corner */}
      <svg
        viewBox="0 0 28 28"
        className="w-5 h-5 absolute bottom-0 left-0 fill-none stroke-current"
      >
        <path d="M 1 6 L 1 23 L 5 23 L 5 27 L 22 27" strokeWidth="1.5" />
        <rect x="4" y="21" width="3" height="3" fill="currentColor" />
      </svg>
      {/* Bottom-Right Ruen-Kaew Stepped Corner */}
      <svg
        viewBox="0 0 28 28"
        className="w-5 h-5 absolute bottom-0 right-0 fill-none stroke-current"
      >
        <path d="M 27 6 L 27 23 L 23 23 L 23 27 L 6 27" strokeWidth="1.5" />
        <rect x="21" y="21" width="3" height="3" fill="currentColor" />
      </svg>
    </div>
  );
};

export const SacredMandalaAura: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`pointer-events-none select-none flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* Breathing Warm Gold Light Halo */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(252,230,148,0.28)_0%,rgba(201,164,92,0.12)_42%,transparent_72%)] animate-halo-breath" />

      {/* Slowly Rotating Sacred Thai Lotus & Dhammachakra Geometric Mandala */}
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full text-[#E5C158]/35 animate-mandala-slow"
      >
        <circle
          cx="120"
          cy="120"
          r="112"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="3 5"
        />
        <circle
          cx="120"
          cy="120"
          r="96"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="120"
          cy="120"
          r="74"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
        />
        {/* 8-Pointed Sacred Star / Ruen-Kaew Geometry */}
        <polygon
          points="120,16 146,94 224,120 146,146 120,224 94,146 16,120 94,94"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polygon
          points="120,16 146,94 224,120 146,146 120,224 94,146 16,120 94,94"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          transform="rotate(45 120 120)"
        />
      </svg>
    </div>
  );
};

export const SacredArchDivider: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-14 flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 64"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="goldLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.05" />
            <stop offset="25%" stopColor="#E5C158" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFF0B8" stopOpacity="1" />
            <stop offset="75%" stopColor="#E5C158" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C9A45C" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M 0 44 L 460 44 L 600 10 L 740 44 L 1200 44"
          fill="none"
          stroke="url(#goldLineGrad)"
          strokeWidth="1.8"
        />
        <path
          d="M 120 50 L 465 50 L 600 18 L 735 50 L 1080 50"
          fill="none"
          stroke="url(#goldLineGrad)"
          strokeWidth="0.8"
          strokeOpacity="0.55"
        />
      </svg>
      {/* Center Sacred Diamond Lotus Emblem */}
      <div className="absolute -top-2 w-12 h-12 flex items-center justify-center animate-float-slow">
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[0_4px_16px_rgba(252,230,148,0.65)]">
          <polygon
            points="24,2 44,24 24,46 4,24"
            fill="#17120B"
            stroke="#E5C158"
            strokeWidth="2"
          />
          <polygon
            points="24,7 39,24 24,41 9,24"
            fill="none"
            stroke="#C9A45C"
            strokeWidth="1"
          />
          <path
            d="M24 12 C20 18 17 22 17 27 C17 31 20 34 24 34 C28 34 31 31 31 27 C31 22 28 18 24 12 Z"
            fill="#FCE694"
          />
        </svg>
      </div>
    </div>
  );
};

export const HeroSacredScene: React.FC<{ className?: string }> = ({
  className = 'relative',
}) => {
  return (
    <div
      className={`overflow-hidden bg-[#060503] select-none ${className}`}
      role="img"
      aria-label="ภาพทิวทัศน์พระธาตุเจดีย์ทองคำบนยอดเขาและลวดลายไทยสีทอง"
    >
      <img
        src={NEW_HERO_BG_PATH}
        alt="ภาพพื้นหลังพระธาตุเจดีย์สีทองท่ามกลางขุนเขาและแสงอรุณรุ่ง"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center animate-hero-kenburns"
      />
      {/* Volumetric Golden Sunbeams matching the sunrise on the right pagoda and left foliage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_86%_38%,rgba(255,232,145,0.34)_0%,rgba(212,175,55,0.14)_38%,transparent_72%),radial-gradient(38%_45%_at_6%_24%,rgba(255,222,122,0.22)_0%,transparent_65%)] animate-sunbeam-pulse"
      />
    </div>
  );
};

interface SpecimenPlateProps {
  style: SpecimenStyle;
  angle?: AngleType;
  code?: string;
  yearBE?: number;
  imageUrl?: string;
  alt: string;
  className?: string;
  showSpecimenCaption?: boolean;
  badgeText?: string | null;
  variant?: 'stage' | 'thumbnail';
  zoomScale?: number;
  zoomOrigin?: { x: number; y: number };
}

export const SpecimenPlate: React.FC<SpecimenPlateProps> = ({
  style,
  angle = 'front',
  code = 'BPP-75',
  yearBE = 2569,
  imageUrl,
  alt,
  className = '',
  showSpecimenCaption = false,
  badgeText = null,
  variant = 'stage',
  zoomScale = 1,
  zoomOrigin = { x: 50, y: 50 },
}) => {
  const [imgError, setImgError] = useState(false);
  const isThumb = variant === 'thumbnail';

  if (imageUrl && !imgError) {
    return (
      <div
        className={`relative overflow-hidden select-none bg-[radial-gradient(circle_at_50%_36%,#1E160B_0%,#0C0906_60%,#040302_100%)] flex items-center justify-center amulet-specular-sheen ${className}`}
        role="img"
        aria-label={alt}
      >
        {/* Overhead Volumetric Museum Spotlight & Golden Rim Halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(62%_56%_at_50%_38%,rgba(252,230,148,0.22)_0%,rgba(201,164,92,0.07)_50%,transparent_76%)]"
        />

        {/* Floor Pedestal Cast Shadow under the Amulet */}
        {!isThumb && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 w-[62%] h-5 rounded-full bg-black/90 blur-md"
          />
        )}

        <img
          src={imageUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          style={{
            transform: zoomScale > 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          className={`relative z-10 w-full h-full object-contain ${
            isThumb ? 'p-1.5' : 'p-3 sm:p-4'
          } drop-shadow-[0_18px_28px_rgba(0,0,0,0.95)] transition-transform duration-500 ease-out ${
            zoomScale === 1 ? 'group-hover:scale-[1.04]' : ''
          }`}
        />

        {/* Top Specular Light Cone & Deep Chiaroscuro Edge Shadow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(75%_55%_at_50%_8%,rgba(255,244,196,0.14)_0%,transparent_60%),linear-gradient(180deg,rgba(8,6,4,0.15)_0%,transparent_45%,rgba(5,4,2,0.82)_100%)]"
        />

        {/* Subtle golden inner vignette border */}
        <div className="pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-[#C9A45C]/35" />

        {showSpecimenCaption && !isThumb && angle === 'front' && (
          <div className="pointer-events-none absolute z-20 bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-2.5 py-1 bg-[#0E0B07]/90 border-t border-b border-[#C9A45C]/45 text-[10px] text-[#FCE694]">
            <span>รหัส {code}</span>
            <span>พ.ศ. {yearBE}</span>
          </div>
        )}

        {badgeText && !isThumb && (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 px-2.5 py-0.5 rounded bg-[#14100A]/90 border border-[#C9A45C]/60 text-[10px] font-tabular font-semibold text-[#FCE694] shadow-md">
            {badgeText}
          </span>
        )}
      </div>
    );
  }

  // Base high-resolution amulet crop coordinates for each style
  const getBaseCropBox = (): { x: number; y: number; w: number; h: number } => {
    switch (style) {
      case 'bronze_oval':
        return { x: 1230, y: 76, w: 108, h: 150 };
      case 'silver_octagonal':
        return { x: 196, y: 586, w: 104, h: 80 };
      case 'terracotta_tablet':
        return { x: 335, y: 586, w: 104, h: 80 };
      case 'brass_shield':
        return { x: 473, y: 586, w: 104, h: 80 };
      case 'gold_lotus':
        return { x: 612, y: 586, w: 104, h: 80 };
      case 'oxidized_arch':
        return { x: 1104, y: 318, w: 70, h: 68 };
      default:
        return { x: 1230, y: 76, w: 108, h: 150 };
    }
  };

  const base = getBaseCropBox();

  // Compute angle-specific high-resolution crop so every angle is crisp and distinct
  const getAngleCropBox = (): { x: number; y: number; w: number; h: number } => {
    if (angle === 'back') {
      return {
        x: base.x + Math.round(base.w * 0.06),
        y: base.y + Math.round(base.h * 0.06),
        w: Math.round(base.w * 0.88),
        h: Math.round(base.h * 0.88),
      };
    }
    if (angle === 'edge') {
      return {
        x: base.x + Math.round(base.w * 0.14),
        y: base.y + Math.round(base.h * 0.28),
        w: Math.round(base.w * 0.72),
        h: Math.round(base.h * 0.62),
      };
    }
    return base;
  };

  const crop = getAngleCropBox();

  return (
    <div
      className={`relative overflow-hidden select-none bg-[#0F0C08] amulet-specular-sheen ${className}`}
      role="img"
      aria-label={alt}
    >
      {angle === 'box' ? (
        /* High-Resolution Velvet Commemorative Presentation Case View */
        <div
          style={{
            transform: zoomScale > 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          className="w-full h-full bg-gradient-to-br from-[#261D10] via-[#151009] to-[#0A0805] p-2 sm:p-4 flex flex-col justify-between items-center relative transition-transform duration-200 ease-out"
        >
          {/* Outer Gold Box Trim */}
          <div className="pointer-events-none absolute inset-1.5 sm:inset-2.5 rounded-lg border border-[#E5C158]/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
          {!isThumb && (
            <div className="pointer-events-none absolute inset-3.5 rounded border border-[#C9A45C]/30" />
          )}

          {/* Top Velvet Lid Inscription (Stage only) */}
          {!isThumb ? (
            <div className="relative z-10 text-center pt-2">
              <p className="text-[10px] tracking-[0.18em] text-[#E5C158] font-semibold uppercase">
                BORDER PATROL POLICE · พ.ศ. {yearBE}
              </p>
              <p className="font-serif-heritage text-xs sm:text-sm font-bold text-[#FCE694]">
                กล่องกำมะหยี่ที่ระลึกประจำรุ่น
              </p>
            </div>
          ) : (
            <div />
          )}

          {/* Center Recessed Velvet Cushion Holding the Amulet */}
          <div
            className={`relative z-10 mx-auto ${
              isThumb ? 'w-[70%] -mt-2' : 'w-[62%]'
            } aspect-square rounded-lg overflow-hidden border-2 border-[#E5C158]/80 shadow-[0_8px_28px_rgba(0,0,0,0.92)] bg-[#110D08]`}
          >
            <svg
              viewBox={`${base.x} ${base.y} ${base.w} ${base.h}`}
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full object-cover block"
            >
              <image href={REF_IMAGE_PATH} width="1536" height="1024" />
            </svg>
          </div>

          {/* Bottom Serial & Authenticity Seal (Stage only) */}
          {!isThumb ? (
            <div className="relative z-10 text-center pb-1.5">
              <span className="inline-block px-2.5 py-0.5 bg-[#110D08]/90 border-t border-b border-[#C9A45C]/50 text-[10px] font-tabular text-[#FCE694]">
                รหัสประจำกล่อง {code}
              </span>
            </div>
          ) : (
            <div />
          )}
        </div>
      ) : (
        /* High-Resolution Specimen View for Front, Back, and Macro Edge/Code */
        <div
          style={{
            transform: zoomScale > 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
          className="w-full h-full transition-transform duration-300 ease-out"
        >
          <svg
            viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
            preserveAspectRatio="xMidYMid slice"
            className={`w-full h-full object-cover block transition-transform duration-500 ${
              zoomScale === 1 ? 'group-hover:scale-105' : ''
            } ${angle === 'back' ? 'scale-x-[-1] contrast-110' : ''}`}
          >
            <image href={REF_IMAGE_PATH} width="1536" height="1024" />
          </svg>
        </div>
      )}

      {/* Top Museum Spotlight & Bottom Chiaroscuro Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_65%_at_50%_18%,rgba(252,230,148,0.16)_0%,transparent_65%),linear-gradient(180deg,rgba(12,9,6,0.1)_0%,transparent_55%,rgba(7,5,3,0.78)_100%)]"
      />

      {/* Stage-Only Angle-Specific Detail Overlays */}
      {!isThumb && angle === 'back' && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E0B07]/90 via-transparent to-[#0E0B07]/40 flex flex-col justify-between p-3.5">
          <div className="flex justify-end">
            <span className="px-2.5 py-1 bg-[#18130B]/95 border border-[#E5C158]/60 text-xs font-semibold text-[#FCE694] shadow">
              ด้านหลัง · ตราอาร์ม ตชด.
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-[#18130B]/95 border border-[#C9A45C]/60 rounded-lg px-3 py-2 shadow-lg">
            <BppCrestLogo className="w-7 h-7" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#FCE694] break-words min-w-0">
                จารึกอักขระมงคลและตราสัญลักษณ์ประจำรุ่น
              </p>
              <p className="text-[11px] text-[#E5C158]/90 font-tabular break-words min-w-0">
                วาระที่ระลึก พ.ศ. {yearBE} · รหัส {code}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isThumb && angle === 'edge' && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0E0B07]/90 via-transparent to-transparent flex flex-col justify-between p-3.5">
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-1 bg-[#18130B]/95 border border-[#E5C158]/60 text-xs font-semibold text-[#FCE694] shadow">
              ภาพขยายขอบเหรียญและโค้ดกำกับ
            </span>
          </div>
          <div className="bg-[#18130B]/95 border border-[#E5C158]/70 rounded-lg px-3.5 py-2 text-center shadow-lg">
            <p className="text-[10px] uppercase tracking-wider text-[#E5C158]/85">
              STAMPED HALLMARK &amp; ARCHIVAL SERIAL
            </p>
            <p className="font-tabular text-sm font-bold text-[#FCE694] tracking-widest mt-0.5">
              โค้ด &ldquo;ตชด.{yearBE}&rdquo; · NO. 0199
            </p>
          </div>
        </div>
      )}

      {/* Subtle golden inner vignette border */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#C9A45C]/40" />

      {showSpecimenCaption && !isThumb && angle === 'front' && (
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-2.5 py-1 bg-[#110D08]/90 border-t border-b border-[#C9A45C]/40 text-[10px] text-[#FCE694]">
          <span>รหัส {code}</span>
          <span>พ.ศ. {yearBE}</span>
        </div>
      )}

      {badgeText && !isThumb && (
        <span
          className={`absolute top-0 left-0 px-3 py-1 text-[11px] font-bold tracking-wider shadow-[0_4px_14px_rgba(0,0,0,0.7)] border-b border-r ${
            badgeText === 'ใหม่'
              ? 'bg-gradient-to-r from-[#B81D24] to-[#8C1318] text-[#FFF8E7] border-[#FCE694]/50'
              : 'bg-gradient-to-r from-[#FFF0B5] via-[#E5C158] to-[#C69A3A] text-[#0E0B07] border-[#FFFFFF]/60'
          }`}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
};

export const CEREMONY_PHOTO_PATH = '/assets/altar-ceremony.jpg';

/** Ceremony altar photo, graded to the site's warm yellow-gold tone. */
export const CeremonySplitBannerArt: React.FC<{
  className?: string;
  photoOnly?: boolean;
}> = ({ className = 'relative' }) => {
  return (
    <div className={`relative overflow-hidden bg-[#14100A] ${className}`}>
      <img
        src={CEREMONY_PHOTO_PATH}
        alt="โต๊ะหมู่บูชาและเทียนชัยในพิธีพลีมวลสาร สมเด็จพิทักษ์แผ่นดิน"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover object-center block [filter:sepia(0.8)_saturate(1.35)_hue-rotate(-6deg)_brightness(0.92)_contrast(1.05)]"
      />
      {/* Warm gold wash + soft vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#C9A45C]/25 mix-blend-soft-light"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_45%,transparent_55%,rgba(10,8,5,0.55)_100%)]"
      />
    </div>
  );
};

export const MISSION_BANNER_IMAGE_PATH =
  '/assets/aistudio/859676099_1412789481029434_7851781256536796607_n_2bd4dc26.webp';

export const MissionSplitBannerArt: React.FC<{ className?: string }> = ({
  className = 'relative',
}) => {
  return (
    <div className={`overflow-hidden bg-[#14100A] ${className}`}>
      <img
        src={MISSION_BANNER_IMAGE_PATH}
        alt="รายได้สมทบภารกิจ ตำรวจตระเวนชายแดน (ตชด.)"
        loading="lazy"
        className="w-full h-full object-cover object-center block"
      />
      {/* Warm Golden Chiaroscuro Scrim for Text Legibility while Preserving the Full Photo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080604]/30 via-[#0C0906]/65 to-[#0A0805]/92"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080604]/85 via-transparent to-[#080604]/25"
      />
    </div>
  );
};

export const NewsThumbnailArt: React.FC<{
  index: number;
  posterUrl?: string;
  alt?: string;
  className?: string;
}> = ({ index, posterUrl, alt = 'โปสเตอร์ข่าวสารและพิธีพลีมวลสาร', className = '' }) => {
  const defaultPosters = [
    '/assets/aistudio/_____________________75_________16__c80228c4.webp',
    '/assets/aistudio/75__________________________________12__3abcf51b.webp',
    '/assets/aistudio/_______________1__26ef883a.webp',
    '/assets/aistudio/somdej_brochure_page_1.webp',
  ];
  const resolvedPoster = posterUrl || defaultPosters[index % defaultPosters.length];

  return (
    <div className={`relative overflow-hidden bg-[#0C0906] ${className}`}>
      <img
        src={resolvedPoster}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080604]/80 via-transparent to-transparent"
      />
    </div>
  );
};

export const BorderHighlandsArtwork: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return <HeroSacredScene className={className} />;
};
