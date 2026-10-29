import React, { useState } from 'react';
import { Phone, MapPin, Clock, FileText } from 'lucide-react';
import { SiteConfig } from '../types';
import { AppView } from './Header';
import { BppCrestLogo } from './SacredArtwork';
import LineContact from './LineContact';

interface FooterProps {
  siteConfig: SiteConfig;
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ siteConfig, onNavigate }) => {
  const [activePolicyModal, setActivePolicyModal] = useState<
    'privacy' | 'terms' | null
  >(null);

  const displayBrandTitle =
    !siteConfig.brandTitleThai || siteConfig.brandTitleThai === 'วัตถุมงคล ตชด.'
      ? 'สมเด็จพิทักษ์แผ่นดิน'
      : siteConfig.brandTitleThai;

  return (
    <footer className="bg-[#080604] text-[#F7F2E8] border-t border-[#D4AF37]/45">
      <div className="heritage-gold-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-[#D4AF37]/25">
          {/* Column 1: Brand Identity & Institutional Notice */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3.5">
              <BppCrestLogo className="w-16 h-14 shrink-0" />
              <div>
                <h2 className="font-bpp-official text-2xl font-bold text-gold-shimmer">
                  {displayBrandTitle}
                </h2>
                <p className="font-bpp-motto text-sm text-[#FCE694] tracking-wider">
                  ศรัทธา • เกียรติภูมิ • แผ่นดิน
                </p>
                <p className="text-[10px] tracking-[0.14em] text-[#D4AF37] mt-0.5">
                  ๗๕ ปี กองบัญชาการตำรวจตระเวนชายแดน
                </p>
              </div>
            </div>
            <p className="text-sm text-[#F7F2E8]/80 leading-relaxed">
              {siteConfig.heroDescription}
            </p>
            <p className="text-xs text-[#F7F2E8]/65 leading-relaxed">
              การนำเสนอข้อมูลเน้นความโปร่งใสของรายละเอียดมวลสาร ขนาด ปีที่จัดสร้าง
              และวัตถุประสงค์ของแต่ละโครงการ โดยไม่กล่าวอ้างผลลัพธ์เหนือธรรมชาติ
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-serif-heritage text-sm font-semibold text-[#C9A45C] tracking-wide">
              หมวดหมู่และบริการ
            </h3>
            <ul className="space-y-2 text-sm text-[#F7F2E8]/85">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#C9A45C] transition-colors"
                >
                  หน้าหลักคลังวัตถุมงคล
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-[#C9A45C] transition-colors"
                >
                  รายการวัตถุมงคลทั้งหมด
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#C9A45C] transition-colors"
                >
                  ประวัติและวัตถุประสงค์
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('news')}
                  className="hover:text-[#C9A45C] transition-colors"
                >
                  ข่าวสารและบันทึกการจัดสร้าง
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('tracking')}
                  className="hover:text-[#C9A45C] transition-colors"
                >
                  ติดตามสถานะคำสั่งจอง
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Ordering & Shipping Guide */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-serif-heritage text-sm font-semibold text-[#C9A45C] tracking-wide">
              การสั่งจองและจัดส่งพัสดุ
            </h3>
            <ul className="space-y-2.5 text-xs text-[#F7F2E8]/80 leading-relaxed">
              <li>
                • ตรวจสอบสต็อกคงเหลือและคำนวณยอดรวมจากระบบกลางก่อนยืนยันรายการทุกครั้ง
              </li>
              <li>
                • จัดส่งทางไปรษณีย์ด่วนพิเศษ (EMS) ค่าจัดส่งมาตรฐาน{' '}
                <span className="font-tabular text-[#FFFFFF]">
                  {siteConfig.standardShippingFee}
                </span>{' '}
                บาท (จัดส่งฟรีเมื่อมียอดรวมตั้งแต่{' '}
                <span className="font-tabular text-[#FFFFFF]">
                  {siteConfig.freeShippingThreshold.toLocaleString()}
                </span>{' '}
                บาทขึ้นไป)
              </li>
              <li>
                • แยกสถานะการตรวจสอบยอดชำระเงิน การคัดตรวจสภาพองค์พระ และการจัดส่งออกจากกันอย่างชัดเจน
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Details */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-serif-heritage text-sm font-semibold text-[#C9A45C] tracking-wide">
              ข้อมูลติดต่อหน่วยงาน/ผู้ดูแลคลัง
            </h3>
            <div className="space-y-2.5 text-xs text-[#F7F2E8]/85 leading-relaxed">
              <p className="font-medium text-[#FFFFFF]">
                {siteConfig.contactUnitName}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                <span>{siteConfig.contactAddress}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <span className="font-tabular">{siteConfig.contactPhone}</span>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                <span>{siteConfig.contactHours}</span>
              </p>
              <LineContact variant="compact" />
            </div>
          </div>
        </div>

        {/* Bottom Legal & Policies Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#F7F2E8]/70">
          <p>
            © {new Date().getFullYear()} {displayBrandTitle} ({siteConfig.contactUnitName})
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActivePolicyModal('privacy')}
              className="hover:text-[#C9A45C] transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>นโยบายความเป็นส่วนตัว</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePolicyModal('terms')}
              className="hover:text-[#C9A45C] transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>เงื่อนไขการสั่งจองและให้บริการ</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('faq')}
              className="hover:text-[#C9A45C] transition-colors"
            >
              แจ้งปัญหา/ติดต่อผู้ดูแล
            </button>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {activePolicyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-modal-title"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="sacred-shrine-pedestal text-[#F7F2E8] max-w-lg w-full rounded-2xl border border-[#C9A45C]/50 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#C9A45C]/30 pb-3">
              <h3
                id="policy-modal-title"
                className="font-serif-heritage text-lg font-semibold text-[#FCE694]"
              >
                {activePolicyModal === 'privacy'
                  ? 'นโยบายการคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)'
                  : 'เงื่อนไขการสั่งจองและการให้บริการ (Terms of Service)'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="text-xs font-medium text-[#E5C158] hover:text-[#FCE694] px-2 py-1"
              >
                ปิดหน้าต่าง
              </button>
            </div>
            <p className="text-sm text-[#F7F2E8]/90 leading-relaxed">
              {activePolicyModal === 'privacy'
                ? siteConfig.privacyPolicySummary
                : siteConfig.termsSummary}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-5 py-2 btn-sacred-gold text-xs font-bold rounded-lg transition-all"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
