import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { NewsArticle, SiteConfig } from '../types';
import {
  BorderHighlandsArtwork,
  ThaiCornerBrackets,
} from './SacredArtwork';
import { AppView } from './Header';

interface AboutHistoryViewProps {
  siteConfig: SiteConfig;
  onNavigate: (view: AppView) => void;
}

export const AboutHistoryView: React.FC<AboutHistoryViewProps> = ({
  siteConfig,
  onNavigate,
}) => {
  return (
    <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="border-b border-[#C9A45C]/30 pb-6 space-y-2">
          <div className="text-xs text-[#E5C158] font-bold tracking-[0.14em] uppercase flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#FCE694]" />
            <span>บันทึกความเป็นมาและมาตรฐานความโปร่งใส</span>
          </div>
          <h1 className="font-serif-heritage text-2xl sm:text-4xl font-bold text-gold-shimmer">
            {siteConfig.historyHeading}
          </h1>
          <p className="text-sm sm:text-base text-[#F7F2E8]/80 max-w-3xl">
            รวบรวมข้อมูลประวัติการจัดทำเหรียญและวัตถุมงคลที่ระลึก วัตถุประสงค์ของโครงการ
            และหลักเกณฑ์การเปิดเผยข้อมูลประจำรุ่นอย่างตรงไปตรงมา
          </p>
        </div>

        {/* Hero Banner Artwork */}
        <div className="relative rounded-2xl sacred-shrine-pedestal animate-sacred-reveal overflow-hidden">
          <ThaiCornerBrackets className="inset-3 opacity-70 z-20" />
          <div className="h-56 sm:h-72 relative">
            <BorderHighlandsArtwork className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0B07]/95 via-[#0E0B07]/35 to-transparent flex items-end p-6 sm:p-8">
              <div className="max-w-2xl space-y-1.5 text-[#F7F2E8]">
                <p className="text-xs text-[#FCE694] tracking-[0.16em] uppercase font-bold">
                  เจตนารมณ์แห่งคลังที่ระลึก
                </p>
                <p className="font-serif-heritage text-lg sm:text-2xl font-bold text-gold-shimmer">
                  {siteConfig.historyLead}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Body Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div
            style={{ '--stagger-index': 0 } as React.CSSProperties}
            className="lg:col-span-7 relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-6 sm:p-8 space-y-5"
          >
            <ThaiCornerBrackets className="inset-2.5 opacity-55" />
            <h2 className="font-serif-heritage text-xl font-bold text-[#FCE694] border-b border-[#C9A45C]/30 pb-3">
              หลักการบันทึกข้อมูลและความเป็นมา
            </h2>
            <div className="space-y-4 text-sm text-[#F7F2E8]/90 leading-relaxed">
              {siteConfig.historyParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#14100A] border border-[#C9A45C]/50 space-y-1.5 text-xs text-[#F7F2E8]">
              <p className="font-bold text-[#FCE694]">
                หลักธรรมาภิบาลและการนำเสนอข้อมูล
              </p>
              <p className="text-[#F7F2E8]/80 leading-relaxed">
                เว็บไซต์นี้ยึดถือการให้ข้อมูลตามข้อเท็จจริงของวัสดุ ขนาด น้ำหนัก ปีที่จัดสร้าง
                และเอกสารกำกับองค์พระ โดยไม่กล่าวอ้างอิทธิปาฏิหาริย์หรือผลลัพธ์เหนือธรรมชาติ
              </p>
            </div>
          </div>

          <div
            style={{ '--stagger-index': 1 } as React.CSSProperties}
            className="lg:col-span-5 relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <ThaiCornerBrackets className="inset-2.5 opacity-55" />
            <h2 className="font-serif-heritage text-lg font-bold text-[#FCE694] border-b border-[#C9A45C]/30 pb-3">
              วัตถุประสงค์ของการจัดสร้างและสมทบทุน
            </h2>

            <div className="space-y-5">
              {siteConfig.purposeBullets.map((b, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-tabular text-xs font-bold text-[#FCE694] bg-[#221A0E] border border-[#C9A45C]/60 px-2.5 py-0.5 rounded-md">
                      0{i + 1}
                    </span>
                    <h3 className="font-serif-heritage text-sm font-bold text-[#FFFFFF]">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#F7F2E8]/80 leading-relaxed pl-9">
                    {b.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#C9A45C]/30">
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="w-full py-3 px-4 btn-sacred-gold text-xs sm:text-sm font-bold rounded-xl transition-all"
              >
                เลือกชมรายการวัตถุมงคลในคลัง →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NewsStoriesViewProps {
  news: NewsArticle[];
  selectedArticleId: string | null;
  onSelectArticle: (id: string | null) => void;
}

export const NewsStoriesView: React.FC<NewsStoriesViewProps> = ({
  news,
  selectedArticleId,
  onSelectArticle,
}) => {
  const [lightboxPoster, setLightboxPoster] = useState<NewsArticle | null>(
    null
  );
  const activeArticle = news.find((n) => n.id === selectedArticleId) || null;

  if (activeArticle) {
    return (
      <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <button
            type="button"
            onClick={() => onSelectArticle(null)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FCE694] hover:text-[#FFFFFF]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้ารวมโปสเตอร์ข่าวสารและกำหนดการพิธี</span>
          </button>

          <article className="relative sacred-shrine-pedestal sacred-stagger-reveal rounded-2xl p-6 sm:p-10">
            <ThaiCornerBrackets className="inset-3 opacity-55" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 5 Columns: Official High-Res Poster */}
              {activeArticle.posterUrl && (
                <div className="lg:col-span-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => setLightboxPoster(activeArticle)}
                    className="group relative w-full rounded-xl overflow-hidden border-2 border-[#C9A45C] bg-[#0B0906] shadow-[0_20px_50px_rgba(0,0,0,0.9)] block focus:outline-none"
                  >
                    <img
                      src={activeArticle.posterUrl}
                      alt={activeArticle.title}
                      className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#0E0B07]/95 border border-[#FCE694]/70 text-xs font-bold text-[#FCE694] shadow-lg">
                      คลิกเพื่อดูโปสเตอร์ขนาดใหญ่
                    </span>
                  </button>
                </div>
              )}

              {/* Right 7 Columns: Ceremony Details & Editorial Content */}
              <div
                className={`${
                  activeArticle.posterUrl ? 'lg:col-span-7' : 'lg:col-span-12'
                } space-y-6`}
              >
                <div className="space-y-3 border-b border-[#C9A45C]/30 pb-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#E5C158]/85">
                    <span className="px-2.5 py-0.5 rounded bg-[#221A0E] border border-[#C9A45C]/60 text-[#FCE694] font-bold">
                      {activeArticle.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>กำหนดการ {activeArticle.publishedAt}</span>
                  </div>

                  <h1 className="font-serif-heritage text-2xl sm:text-3xl font-bold text-gold-shimmer leading-snug">
                    {activeArticle.title}
                  </h1>

                  <p className="text-xs text-[#E5C158]/80">
                    หน่วยงาน/แหล่งอ้างอิง: {activeArticle.sourceReference}
                  </p>
                </div>

                {/* Structured Ceremony Schedule Box */}
                {(activeArticle.eventDate ||
                  activeArticle.eventLocation ||
                  activeArticle.presidingMonk ||
                  activeArticle.broadcastChannel) && (
                  <div className="rounded-xl bg-[#120E09] border border-[#C9A45C]/50 p-5 space-y-3 text-xs sm:text-sm">
                    <h2 className="font-serif-heritage text-base font-bold text-[#FCE694] border-b border-[#C9A45C]/25 pb-2">
                      รายละเอียดกำหนดการพิธีพลีมวลสารอธิษฐานจิต
                    </h2>
                    <dl className="space-y-2.5">
                      {activeArticle.presidingMonk && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                          <dt className="text-[#E5C158] font-semibold">
                            ประธานสงฆ์ / พระเถราจารย์:
                          </dt>
                          <dd className="sm:col-span-2 font-bold text-[#FCE694]">
                            {activeArticle.presidingMonk}
                          </dd>
                        </div>
                      )}
                      {activeArticle.eventDate && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                          <dt className="text-[#E5C158] font-semibold">
                            วันประกอบพิธี:
                          </dt>
                          <dd className="sm:col-span-2 font-bold text-[#FFFFFF]">
                            {activeArticle.eventDate}{' '}
                            {activeArticle.eventTime
                              ? `(${activeArticle.eventTime})`
                              : ''}
                          </dd>
                        </div>
                      )}
                      {activeArticle.eventLocation && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                          <dt className="text-[#E5C158] font-semibold">
                            สถานที่จัดพิธี:
                          </dt>
                          <dd className="sm:col-span-2 font-semibold text-[#F7F2E8]">
                            {activeArticle.eventLocation}
                          </dd>
                        </div>
                      )}
                      {activeArticle.broadcastChannel && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                          <dt className="text-[#E5C158] font-semibold">
                            การถ่ายทอดสด:
                          </dt>
                          <dd className="sm:col-span-2 font-bold text-[#FCE694]">
                            {activeArticle.broadcastChannel}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                <div className="space-y-4 text-sm sm:text-base text-[#F7F2E8]/90 leading-relaxed">
                  {activeArticle.content.map((para, index) => (
                    <p key={index}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Lightbox Modal for Active Article Poster */}
        {lightboxPoster && lightboxPoster.posterUrl && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={lightboxPoster.title}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxPoster(null)}
          >
            <div
              className="relative max-w-3xl w-full max-h-[92vh] bg-[#0E0B07] border-2 border-[#C9A45C] rounded-2xl p-4 flex flex-col gap-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-[#C9A45C]/30 pb-2.5">
                <p className="font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694] break-words min-w-0">
                  {lightboxPoster.title}
                </p>
                <button
                  type="button"
                  onClick={() => setLightboxPoster(null)}
                  className="px-3 py-1 rounded-lg bg-[#221A0E] border border-[#C9A45C]/60 text-xs font-bold text-[#FCE694] hover:bg-[#2C2111]"
                >
                  ปิดหน้าต่าง ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 flex items-center justify-center bg-[#060503] rounded-xl p-2">
                <img
                  src={lightboxPoster.posterUrl}
                  alt={lightboxPoster.title}
                  className="max-h-[78vh] w-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#C9A45C]/30 pb-6 space-y-2">
          <div className="text-xs text-[#E5C158] font-bold tracking-[0.14em] uppercase">
            คลังข่าวสาร โปสเตอร์กำหนดการพิธีพลีมวลสาร และประกาศทางการ
          </div>
          <h1 className="font-serif-heritage text-2xl sm:text-4xl font-bold text-gold-shimmer">
            โปสเตอร์ข่าวสารและกำหนดการพิธีพลีมวลสาร &ldquo;สมเด็จพิทักษ์แผ่นดิน&rdquo; ๗๕ ปี ตชด.
          </h1>
          <p className="text-sm text-[#F7F2E8]/80 max-w-3xl">
            รวบรวมโปสเตอร์ประชาสัมพันธ์พิธีพลีมวลสารอธิษฐานจิตวัตถุมงคลรุ่น ๗๕ ปี ตชด. ทั้ง 3 วาระสำคัญ
            (จ.กาฬสินธุ์, จ.เชียงราย, จ.กระบี่) พร้อมประกาศใบรายการวัตถุมงคลจากกองบัญชาการตำรวจตระเวนชายแดน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article, idx) => (
            <article
              key={article.id}
              style={{ '--stagger-index': idx } as React.CSSProperties}
              className="group relative sacred-vault-card sacred-stagger-reveal rounded-2xl overflow-hidden flex flex-col justify-between border border-[#C9A45C]/55 shadow-[0_22px_50px_rgba(0,0,0,0.85)]"
            >
              <div>
                {article.posterUrl && (
                  <div className="relative aspect-[3/4.2] w-full bg-[#090705] border-b border-[#C9A45C]/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setLightboxPoster(article)}
                      aria-label={`ขยายดูโปสเตอร์ ${article.title}`}
                      className="w-full h-full block focus:outline-none"
                    >
                      <img
                        src={article.posterUrl}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>
                    <span className="pointer-events-none absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#0E0B07]/90 border border-[#FCE694]/70 text-[11px] font-bold text-[#FCE694] shadow-lg">
                      {article.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxPoster(article)}
                      className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-[#0E0B07]/90 border border-[#C9A45C]/70 text-[11px] font-bold text-[#FCE694] hover:border-[#FCE694] shadow-lg"
                    >
                      ขยายโปสเตอร์
                    </button>
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#E5C158]">
                    <span className="font-bold text-[#FCE694]">
                      {article.eventDate || article.publishedAt}
                    </span>
                    {article.eventTime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-tabular">{article.eventTime}</span>
                      </>
                    )}
                  </div>

                  {article.presidingMonk && (
                    <p className="text-xs font-bold text-[#E5C158] bg-[#16110A] border border-[#C9A45C]/35 rounded-lg px-3 py-1.5">
                      {article.presidingMonk}
                    </p>
                  )}

                  <h2 className="font-serif-heritage text-lg font-bold text-[#FFFFFF] leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelectArticle(article.id)}
                      className="text-left hover:text-[#FCE694] transition-colors"
                    >
                      {article.title}
                    </button>
                  </h2>

                  {article.eventLocation && (
                    <p className="text-xs text-[#FCE694]/90 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E5C158]" />
                      <span>{article.eventLocation}</span>
                    </p>
                  )}

                  <p className="text-xs text-[#F7F2E8]/80 leading-relaxed break-words">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#0D0A06]/90 border-t border-[#C9A45C]/25 flex items-center justify-between text-xs">
                <span className="text-[#E5C158]/75 break-words min-w-0 max-w-[62%]">
                  {article.sourceReference}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectArticle(article.id)}
                  className="font-bold text-[#FCE694] hover:text-[#FFFFFF] whitespace-nowrap shrink-0"
                >
                  อ่านรายละเอียด →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Full-Screen Poster Lightbox Modal */}
      {lightboxPoster && lightboxPoster.posterUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPoster.title}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPoster(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[92vh] bg-[#0E0B07] border-2 border-[#C9A45C] rounded-2xl p-4 flex flex-col gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#C9A45C]/30 pb-2.5">
              <p className="font-serif-heritage text-sm sm:text-base font-bold text-[#FCE694] break-words min-w-0">
                {lightboxPoster.title}
              </p>
              <button
                type="button"
                onClick={() => setLightboxPoster(null)}
                className="px-3 py-1 rounded-lg bg-[#221A0E] border border-[#C9A45C]/60 text-xs font-bold text-[#FCE694] hover:bg-[#2C2111]"
              >
                ปิดหน้าต่าง ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 flex items-center justify-center bg-[#060503] rounded-xl p-2">
              <img
                src={lightboxPoster.posterUrl}
                alt={lightboxPoster.title}
                className="max-h-[78vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FaqContactViewProps {
  siteConfig: SiteConfig;
}

export const FaqContactView: React.FC<FaqContactViewProps> = ({
  siteConfig,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faqs = [
    {
      q: 'ขั้นตอนการสั่งจองและตรวจสอบยอดชำระเงินดำเนินการอย่างไร?',
      a: 'เมื่อท่านเลือกรายการวัตถุมงคลและกรอกที่อยู่จัดส่งในหน้าตะกร้าสั่งจองแล้ว ระบบจะออกรหัสคำสั่งจอง (เช่น BPP-2569-XXXX) สถานะเริ่มต้นจะเป็น "รอผู้ดูแลตรวจสอบยอดชำระ" เสมอ เมื่อเจ้าหน้าที่ตรวจสอบรายการโอนเงินตรงตามยอดแล้ว จึงจะปรับสถานะเป็น "ตรวจสอบยอดชำระเรียบร้อย" และดำเนินการคัดตรวจองค์พระเพื่อจัดส่งต่อไป',
    },
    {
      q: 'การจัดส่งพัสดุใช้วิธีใด และมีค่าจัดส่งเท่าใด?',
      a: `คลังวัตถุมงคลจัดส่งผ่านไปรษณีย์ด่วนพิเศษ (EMS) พร้อมบรรจุภัณฑ์กันกระแทก ค่าจัดส่งมาตรฐาน ${siteConfig.standardShippingFee} บาทต่อคำสั่งจอง และจัดส่งฟรีเมื่อมียอดรวมตั้งแต่ ${siteConfig.freeShippingThreshold.toLocaleString()} บาทขึ้นไป`,
    },
    {
      q: 'สามารถตรวจสอบสถานะพัสดุได้อย่างไรโดยปลอดภัย?',
      a: 'ท่านสามารถเข้าที่เมนู "ติดตามคำสั่งจอง" แล้วกรอกรหัสคำสั่งจองคู่กับหมายเลขโทรศัพท์ 4 ตัวท้ายของผู้รับ ระบบจะแสดงสถานะแยก 3 ขั้นตอนพร้อมเลขพัสดุ EMS โดยปิดบังชื่อ-นามสกุลและที่อยู่เพื่อคุ้มครองข้อมูลส่วนบุคคล',
    },
    {
      q: 'ภาพและข้อมูลในโหมดสาธิต (Demo Mode) ต่างจากระบบใช้งานจริงอย่างไร?',
      a: 'ในโหมดสาธิต (Demo Mode) ข้อมูลสินค้าและบัญชีธนาคารเป็นข้อมูลตัวอย่างเพื่อการทดสอบระบบ ผู้ดูแลคลังสามารถเข้าสู่ระบบ Admin Dashboard เพื่ออัปโหลดภาพถ่ายวัตถุมงคลจริง แก้ไขข้อมูลรุ่น และตั้งค่าช่องทางชำระเงินของหน่วยงานได้ทันที',
    },
  ];

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      setError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          orderNumber,
          subject,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'ไม่สามารถส่งข้อความได้');
        return;
      }
      setSubmitted(true);
      setName('');
      setPhone('');
      setOrderNumber('');
      setSubject('');
      setMessage('');
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    }
  };

  return (
    <div className="bg-[#080705] text-[#F7F2E8] min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-[#C9A45C]/30 pb-6 space-y-2">
          <div className="text-xs text-[#E5C158] font-bold tracking-[0.14em] uppercase">
            คู่มือการสั่งจองและศูนย์ประสานงานผู้ดูแลคลัง
          </div>
          <h1 className="font-serif-heritage text-2xl sm:text-4xl font-bold text-gold-shimmer">
            คำถามที่พบบ่อยและช่องทางติดต่อเรา
          </h1>
          <p className="text-sm text-[#F7F2E8]/80 max-w-2xl">
            รายละเอียดขั้นตอนการสั่งจอง การจัดส่งพัสดุ และแบบฟอร์มติดต่อเจ้าหน้าที่ผู้ดูแลคลังวัตถุมงคล
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 6 Columns: FAQ Accordion & Contact Card */}
          <div className="lg:col-span-6 space-y-8">
            <div className="relative sacred-shrine-pedestal rounded-2xl p-6 space-y-4">
              <ThaiCornerBrackets className="inset-2.5 opacity-50" />
              <h2 className="font-serif-heritage text-lg font-bold text-[#FCE694] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#FCE694]" />
                <span>คำถามที่พบบ่อย (FAQ)</span>
              </h2>

              <div className="divide-y divide-[#C9A45C]/25">
                {faqs.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="py-3.5">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenFaqIndex(isOpen ? null : idx)
                        }
                        className="w-full text-left flex items-center justify-between gap-4 text-sm font-bold text-[#F7F2E8] hover:text-[#FCE694]"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#FCE694] shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2.5 text-xs text-[#F7F2E8]/80 leading-relaxed">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Contact Info Box */}
            <div className="relative sacred-shrine-pedestal text-[#F7F2E8] rounded-2xl p-6 space-y-4">
              <ThaiCornerBrackets className="inset-2.5 opacity-60" />
              <h2 className="font-serif-heritage text-lg font-bold text-[#FCE694]">
                ข้อมูลติดต่อฝ่ายประสานงานคลังวัตถุมงคล
              </h2>
              <p className="text-sm font-semibold text-[#FFFFFF]">
                {siteConfig.contactUnitName}
              </p>
              <div className="space-y-2.5 text-xs text-[#F7F2E8]/85">
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FCE694] shrink-0 mt-0.5" />
                  <span>{siteConfig.contactAddress}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#FCE694] shrink-0" />
                  <span className="font-tabular">{siteConfig.contactPhone}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#FCE694] shrink-0" />
                  <span>{siteConfig.contactEmail}</span>
                </p>
                <p className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#FCE694] shrink-0 mt-0.5" />
                  <span>{siteConfig.contactHours}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right 6 Columns: Contact / Inquiry Form */}
          <div className="lg:col-span-6 relative sacred-shrine-pedestal rounded-2xl p-6 sm:p-8 space-y-6">
            <ThaiCornerBrackets className="inset-2.5 opacity-50" />
            <div className="border-b border-[#C9A45C]/30 pb-4">
              <h2 className="font-serif-heritage text-lg font-bold text-[#FCE694]">
                แบบฟอร์มสอบถามข้อมูล / แจ้งปัญหาการสั่งจอง
              </h2>
              <p className="text-xs text-[#F7F2E8]/75 mt-1">
                ข้อความของท่านจะถูกส่งไปยังระบบผู้ดูแลคลังวัตถุมงคลโดยตรง
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-[#18130B] border border-[#FCE694] space-y-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#FCE694] mx-auto" />
                <h3 className="font-serif-heritage text-base font-bold text-[#FCE694]">
                  ส่งข้อความถึงผู้ดูแลคลังเรียบร้อยแล้ว
                </h3>
                <p className="text-xs text-[#F7F2E8]/85">
                  เจ้าหน้าที่ได้รับข้อความของท่านแล้ว และจะติดต่อกลับตามหมายเลขโทรศัพท์ที่ระบุในเวลาทำการ
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 btn-sacred-gold text-xs font-bold rounded-xl"
                >
                  ส่งข้อความเพิ่มเติม
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold text-[#FCE694] mb-1"
                    >
                      ชื่อ – นามสกุลผู้ติดต่อ *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ระบุชื่อ-นามสกุล"
                      className="w-full px-3.5 py-2 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-bold text-[#FCE694] mb-1"
                    >
                      หมายเลขโทรศัพท์ *
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="เช่น 081-234-5678"
                      className="w-full px-3.5 py-2 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-bold text-[#FCE694] mb-1"
                    >
                      หัวข้อที่ต้องการติดต่อ *
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="เช่น สอบถามรายละเอียดรุ่น / แจ้งโอนเงิน"
                      className="w-full px-3.5 py-2 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-order-no"
                      className="block text-xs font-bold text-[#FCE694] mb-1"
                    >
                      รหัสคำสั่งจอง (ถ้ามี)
                    </label>
                    <input
                      id="contact-order-no"
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="เช่น BPP-2569-1042"
                      className="w-full px-3.5 py-2 text-sm font-tabular border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-bold text-[#FCE694] mb-1"
                  >
                    รายละเอียดข้อความ *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ระบุรายละเอียดที่ต้องการสอบถามหรือแจ้งให้ผู้ดูแลคลังทราบ"
                    className="w-full px-3.5 py-2 text-sm border border-[#C9A45C]/55 rounded-xl bg-[#110D08] text-[#F7F2E8] placeholder-[#E5C158]/45 focus:outline-none focus:border-[#FCE694]"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-xs text-red-300 font-bold">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-6 btn-sacred-gold text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>ส่งข้อความถึงผู้ดูแลคลัง</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
