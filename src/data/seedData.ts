import {
  AmuletProduct,
  ContactInquiry,
  NewsArticle,
  OrderRecord,
  RajaSetSlot,
  SiteConfig,
  SpecimenStyle,
} from '../types';

export interface BrochureSheetInfo {
  pageNumber: number;
  title: string;
  subtitle: string;
  highlight: string;
  imageUrl: string;
  linkedProductId?: string;
}

export const SOMDEJ_MOLD_SIZES = {
  chartImageUrl: '/assets/aistudio/somdej_dimensions_chart.png',
  phimNiyom: {
    name: 'พิมพ์นิยม (พิมพ์ใหญ่)',
    topWidth: '2.3 ซม.',
    height: '3.7 ซม.',
    bottomWidth: '2.5 ซม.',
    thickness: '1 มม.',
    summary: 'ด้านบน 2.3 ซม. · สูง 3.7 ซม. · ด้านล่าง 2.5 ซม. · หนา 1 มม.',
  },
  phimKhaNaen: {
    name: 'พิมพ์คะแนน (พิมพ์เล็ก)',
    topWidth: '1.2 ซม.',
    height: '2.1 ซม.',
    bottomWidth: '1.3 ซม.',
    thickness: '1 มม.',
    summary: 'ด้านบน 1.2 ซม. · สูง 2.1 ซม. · ด้านล่าง 1.3 ซม. · หนา 1 มม.',
  },
};

export const SOMDEJ_BROCHURE_PAGES: BrochureSheetInfo[] = [
  {
    pageNumber: 1,
    title: 'ใบรายการหน้า ๑ : ภาพองค์พระ ด้านหน้า–ด้านหลัง ทั้ง ๑๐ เนื้อ',
    subtitle: 'เปรียบเทียบขนาด พิมพ์นิยม (พิมพ์ใหญ่) และ พิมพ์คะแนน (พิมพ์เล็ก)',
    highlight: 'ครบทั้ง 4 หมวดปกติ (ชศ1–ชศ20) ทั้งเนื้อโลหะมงคลและเนื้อผงพุทธคุณ',
    imageUrl: '/assets/aistudio/somdej_brochure_page_1.png',
    linkedProductId: 'prod-chs1',
  },
  {
    pageNumber: 2,
    title: 'ใบรายการหน้า ๒ : ช1 ชุดทองคำใหญ่ราชาฤกษ์ (มี 99 ชุด · เลือกเลข 1–99)',
    subtitle: 'รวม 20 องค์ (พิมพ์นิยม 10 เนื้อ + พิมพ์คะแนน 10 เนื้อ) · บูชา 349,999 บาท',
    highlight: 'พร้อมพระผงพุทธคุณ พิมพ์นิยม 1 กล่อง (100 องค์) รูปในพิธีและบัตรรับรอง',
    imageUrl: '/assets/aistudio/somdej_brochure_page_2.png',
    linkedProductId: 'prod-ch1',
  },
  {
    pageNumber: 3,
    title: 'ใบรายการหน้า ๓ : ช2 ชุดยกกล่อง 100 องค์ (พิมพ์นิยม · 299 กล่อง)',
    subtitle: 'รวมวัตถุมงคลพิมพ์นิยมครบ 7 รายการ รวมทั้งสิ้น 100 องค์ · บูชา 29,999 บาท',
    highlight: 'พระผง 80 · เงิน 3 · นวะ 2 · ทองเหลือง 5 · ทองแดง 5 · ตะกรุดทองคำ 3 · ตะกรุดเงิน 2',
    imageUrl: '/assets/aistudio/somdej_brochure_page_3.png',
    linkedProductId: 'prod-ch2',
  },
  {
    pageNumber: 4,
    title: 'ใบรายการหน้า ๔ : ช3 ชุดกรรมการ 5 องค์ (พิมพ์นิยม · 299 ชุด)',
    subtitle: 'คัดสรร 5 เนื้อหลักยอดนิยม พิมพ์นิยม ด้านหน้า–ด้านหลัง · บูชา 4,999 บาท',
    highlight: 'เนื้อเงิน 1 · เนื้อนวะโลหะ 1 · เนื้อทองเหลือง 1 · เนื้อทองแดง 1 · ผงตะกรุดทองคำ 1',
    imageUrl: '/assets/aistudio/somdej_brochure_page_4.png',
    linkedProductId: 'prod-ch3',
  },
];

export const initialSiteConfig: SiteConfig = {
  brandTitleThai: 'สมเด็จพิทักษ์แผ่นดิน',
  brandTitleEnglish: '๗๕ ปี ตำรวจตระเวนชายแดน · BPP 75TH',
  heroTitle: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
  heroSubtitle: 'ศรัทธา • เกียรติภูมิ • แผ่นดิน',
  heroDescription:
    'ระบบสั่งจองวัตถุมงคล "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. กองบัญชาการตำรวจตระเวนชายแดน ครบทั้ง 4 หมวดปกติ (ชศ1–ชศ20) และ 3 ชุดพิเศษ (ช1 เลือกเลข 1–99 แบบเรียลไทม์, ช2 ชุดยกกล่อง 100 องค์, ช3 ชุดกรรมการ 5 องค์)',
  heroPrimaryCta: 'สั่งจองวัตถุมงคล / เลือกเลข ช1',
  heroSecondaryCta: 'เรียนรู้ความเป็นมา',
  announcementBanner: '',
  historyHeading: 'ประวัติความเป็นมาและเจตนารมณ์การจัดสร้าง "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด.',
  historyLead:
    'ร่วมสืบสานพระพุทธศาสนา และสนับสนุนภารกิจ กองบัญชาการตำรวจตระเวนชายแดน เพื่อการศึกษา สาธารณสุข และพัฒนาคุณภาพชีวิตของเยาวชนในพื้นที่ห่างไกล',
  historyParagraphs: [
    'วัตถุมงคลรุ่น "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. จัดสร้างโดยกองบัญชาการตำรวจตระเวนชายแดน ในวาระมหามงคลครบรอบ 75 ปี โดยออกแบบพิมพ์ทรงพระสมเด็จฐานสามชั้นในซุ้มเรือนแก้ว ด้านหลังประทับตราอาร์มกองบัญชาการตำรวจตระเวนชายแดนและอักษร "๗๕ ปี ตชด." อย่างคมชัด',
    'จัดสร้างใน 2 ขนาดพิมพ์มาตรฐาน ได้แก่ พิมพ์นิยม (พิมพ์ใหญ่: ด้านบน 2.3 ซม. สูง 3.7 ซม. ด้านล่าง 2.5 ซม. หนา 1 มม.) และ พิมพ์คะแนน (พิมพ์เล็ก: ด้านบน 1.2 ซม. สูง 2.1 ซม. ด้านล่าง 1.3 ซม. หนา 1 มม.) แบ่งเป็น 4 หมวดหลัก (ชศ1–ชศ20) และชุดจัดสร้างพิเศษ 3 ชุด (ช1, ช2, ช3)',
    'พิเศษสำหรับ ช1 ชุดทองคำใหญ่ราชาฤกษ์ (จัดสร้าง 99 ชุด บูชาชุดละ 349,999 บาท) ผู้มีจิตศรัทธาสามารถเลือกหมายเลขประจำชุด 1–99 ได้ด้วยตนเองผ่านตารางเลขแบบเรียลไทม์ พร้อมระบบล็อกเลขอัตโนมัติและออกใบสรุปรายการจองเป็น PDF ได้ทันที',
  ],
  purposeBullets: [
    {
      title: 'สมทบทุนการศึกษาโรงเรียนตำรวจตระเวนชายแดน',
      detail:
        'สนับสนุนสื่อการเรียนการสอน อุปกรณ์การศึกษา และทุนอาหารกลางวันแก่เด็กและเยาวชนบนดอยและพื้นที่ชายแดนกว่า 220 แห่งทั่วประเทศ',
    },
    {
      title: 'สนับสนุนภารกิจสาธารณสุขและช่วยเหลือประชาชน',
      detail:
        'จัดหาเวชภัณฑ์ ชุดปฐมพยาบาล และสนับสนุนงานพัฒนาคุณภาพชีวิตของชุมชนในพื้นที่ห่างไกลทุรกันดาร',
    },
    {
      title: 'สวัสดิการและขวัญกำลังใจกำลังพลชายแดน',
      detail:
        'ดูแลสวัสดิการกำลังพลและครอบครัวผู้ปฏิบัติหน้าที่เสียสละเพื่อความมั่นคงของผืนแผ่นดินไทย',
    },
  ],
  contactUnitName: 'โครงการจัดสร้างวัตถุมงคล "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. กองบัญชาการตำรวจตระเวนชายแดน',
  contactAddress:
    'เลขที่ 1279 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400',
  contactPhone: '02-279-9500 ต่อ 402',
  contactHours: 'เปิดบริการทุกวัน เวลา 08:30 – 17:30 น.',
  contactEmail: 'heritage@bpp-amulet.org',
  freeShippingThreshold: 0,
  standardShippingFee: 0,
  paymentChannels: {
    enableBankTransfer: true,
    bankName: 'บมจ.ธนาคารกรุงไทย',
    accountName: 'เงินทุนสร้างพระเก่า',
    accountNumber: '0341427632',
    // No PromptPay ID for this account yet: transfers go to the Krung Thai account only.
    enablePromptPay: false,
    promptPayId: '',
  },
  privacyPolicySummary:
    'ระบบจัดเก็บเฉพาะชื่อ หน่วยงาน หมายเลขโทรศัพท์ และอีเมลเพื่อใช้ในการออกใบจองวัตถุมงคลและตรวจสอบสถานะเท่านั้น',
  termsSummary:
    'วัตถุมงคลสมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด. ทุกรายการผ่านการตรวจสอบความสมบูรณ์พร้อมกล่องเดิมและบัตรรับรองก่อนส่งมอบ',
};

const MOLD_SIZE_NOTE_BOTH =
  'พิมพ์นิยม (พิมพ์ใหญ่): ด้านบน 2.3 × สูง 3.7 × ด้านล่าง 2.5 ซม. หนา 1 มม. | พิมพ์คะแนน (พิมพ์เล็ก): ด้านบน 1.2 × สูง 2.1 × ด้านล่าง 1.3 ซม. หนา 1 มม.';

const DIM_NIYOM = 'ด้านบน 2.3 ซม. · สูง 3.7 ซม. · ด้านล่าง 2.5 ซม. · หนา 1 มม.';
const DIM_KHANAEN = 'ด้านบน 1.2 ซม. · สูง 2.1 ซม. · ด้านล่าง 1.3 ซม. · หนา 1 มม.';

interface MaterialAssetConfig {
  prefix: string;
  style: SpecimenStyle;
  materialDesc: string;
}

const MATERIAL_ASSETS: Record<string, MaterialAssetConfig> = {
  gold: {
    prefix: 'mat_01_gold',
    style: 'gold_lotus',
    materialDesc: 'เนื้อทองคำบริสุทธิ์สุกปลั่ง ประทับตราอาร์ม ตชด. และ ๗๕ ปี ตชด.',
  },
  pinkgold: {
    prefix: 'mat_02_pinkgold',
    style: 'bronze_oval',
    materialDesc: 'เนื้อนาก (Pink Gold) โลหะผสมทองคำสีกุหลาบโบราณ',
  },
  silver: {
    prefix: 'mat_03_silver',
    style: 'silver_octagonal',
    materialDesc: 'เนื้อเงินบริสุทธิ์ขัดผิวซาตินโบราณ',
  },
  chanuan: {
    prefix: 'mat_04_chanuan',
    style: 'oxidized_arch',
    materialDesc: 'เนื้อชนวนมวลสารศักดิ์สิทธิ์หลอมรวมแผ่นยันต์เกจิทั่วประเทศ',
  },
  nawa: {
    prefix: 'mat_05_nawa',
    style: 'bronze_oval',
    materialDesc: 'เนื้อนวะโลหะตามสูตรโบราณ โลหะมงคล 9 ชนิด',
  },
  brass: {
    prefix: 'mat_06_brass',
    style: 'gold_lotus',
    materialDesc: 'เนื้อทองเหลืองขัดเงาประกายทองคมชัด',
  },
  copper: {
    prefix: 'mat_07_copper',
    style: 'brass_shield',
    materialDesc: 'เนื้อทองแดงผิวไฟธรรมชาติ',
  },
  powder: {
    prefix: 'mat_08_powder',
    style: 'terracotta_tablet',
    materialDesc: 'เนื้อผงพุทธคุณผสมมวลสารศักดิ์สิทธิ์ทั่วประเทศ',
  },
  powder_gold: {
    prefix: 'mat_09_powder_gold',
    style: 'terracotta_tablet',
    materialDesc: 'เนื้อผงพุทธคุณ ฝังตะกรุดทองคำแท้ด้านหน้า 1 ดอก',
  },
  powder_silver: {
    prefix: 'mat_10_powder_silver',
    style: 'terracotta_tablet',
    materialDesc: 'เนื้อผงพุทธคุณ ฝังตะกรุดเงินแท้ด้านหน้า 1 ดอก',
  },
};

function buildStandardItem(params: {
  id: string;
  code: string;
  name: string;
  category:
    | 'cat_1_popular_metal'
    | 'cat_2_score_metal'
    | 'cat_3_popular_powder'
    | 'cat_4_score_powder';
  categoryLabel: string;
  moldType: 'พิมพ์นิยม' | 'พิมพ์คะแนน';
  price: number;
  stock: number;
  isMadeToOrder: boolean;
  assetKey: keyof typeof MATERIAL_ASSETS;
  isFeatured?: boolean;
  createdAt: string;
}): AmuletProduct {
  const asset = MATERIAL_ASSETS[params.assetKey];
  const isNiyom = params.moldType === 'พิมพ์นิยม';
  const stockDesc = params.isMadeToOrder
    ? 'จัดสร้างตามจำนวนสั่งจอง (ตามจอง · ไม่จำกัดสต็อก)'
    : `จำนวนจัดสร้าง ${params.stock.toLocaleString()} องค์ (ตัดสต็อกตามยอดจองจริง)`;

  return {
    id: params.id,
    code: params.code,
    name: params.name,
    series: `สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด. (${params.moldType})`,
    yearBE: 2569,
    category: params.category,
    categoryLabel: params.categoryLabel,
    moldType: params.moldType,
    price: params.price,
    stock: params.isMadeToOrder ? 999999 : params.stock,
    initialStock: params.isMadeToOrder ? 0 : params.stock,
    bookedCount: 0,
    isMadeToOrder: params.isMadeToOrder,
    requiresNumberSelection: false,
    material: `${asset.materialDesc} (${params.moldType})`,
    dimensions: isNiyom ? DIM_NIYOM : DIM_KHANAEN,
    moldDimensionsNote: MOLD_SIZE_NOTE_BOTH,
    weightGrams: isNiyom ? 22.0 : 12.5,
    condition: 'ใหม่ พร้อมกล่องประจำรุ่นจากกองบัญชาการตำรวจตระเวนชายแดน',
    certificateInfo: `${stockDesc} · รหัส ${params.code}`,
    purposeSummary: 'สมทบทุนการศึกษาโรงเรียนตำรวจตระเวนชายแดนและสวัสดิการกำลังพล',
    description: `${params.name} (${params.code}) รุ่น "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. ขนาด${params.moldType} (${isNiyom ? DIM_NIYOM : DIM_KHANAEN}) ${asset.materialDesc} ${stockDesc}`,
    shippingFee: 0,
    isFeatured: Boolean(params.isFeatured),
    isVisible: true,
    specimenStyle: asset.style,
    angles: [
      {
        angle: 'front',
        label: `ด้านหน้า (${params.moldType})`,
        caption: `ด้านหน้า ${params.name} (${params.code})`,
        imageUrl: `/assets/aistudio/${asset.prefix}_front.png`,
      },
      {
        angle: 'back',
        label: 'ด้านหลัง (ตราอาร์ม ตชด.)',
        caption: `ด้านหลังประทับตราอาร์ม ตชด. และ ๗๕ ปี ตชด. (${params.code})`,
        imageUrl: `/assets/aistudio/${asset.prefix}_back.png`,
      },
      {
        angle: 'edge',
        label: 'คู่ด้านหน้า–หลัง',
        caption: `ภาพคู่ด้านหน้าและด้านหลัง ${params.name}`,
        imageUrl: `/assets/aistudio/${asset.prefix}_pair.png`,
      },
      {
        angle: 'box',
        label: 'เปรียบเทียบ ๒ พิมพ์',
        caption: `เปรียบเทียบขนาด พิมพ์นิยม และ พิมพ์คะแนน จากใบรายการทางการ`,
        imageUrl: `/assets/aistudio/${asset.prefix}_full.png`,
      },
    ],
    createdAt: params.createdAt,
  };
}

export const initialProducts: AmuletProduct[] = [
  // ============================================================================
  // ชุดพิเศษ (ช1, ช2, ช3)
  // ============================================================================
  {
    id: 'prod-ch1',
    code: 'ช1',
    name: 'ช1 ชุดทองคำใหญ่ราชาฤกษ์ (รวม 20 องค์ + พระผง 100 องค์)',
    series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด. (เลือกหมายเลข 1–99)',
    yearBE: 2569,
    category: 'special_set',
    categoryLabel: 'ชุดพิเศษ (เลือกเลข 1–99)',
    moldType: 'ครบทั้ง ๒ พิมพ์',
    price: 349999,
    stock: 98, // 99 total sets, #9 booked in initial demo order -> 98 available
    initialStock: 99,
    bookedCount: 1,
    isMadeToOrder: false,
    requiresNumberSelection: true,
    material:
      'รวม 20 องค์ (พิมพ์นิยม 10 เนื้อ + พิมพ์คะแนน 10 เนื้อ) พร้อมพระผงพุทธคุณ พิมพ์นิยม 1 กล่อง (100 องค์) รูปในพิธีและบัตรรับรอง',
    dimensions: 'พิมพ์นิยม 2.3×3.7×2.5 ซม. และ พิมพ์คะแนน 1.2×2.1×1.3 ซม. (หนา 1 มม.)',
    moldDimensionsNote: MOLD_SIZE_NOTE_BOTH,
    setBreakdown: [
      {
        item: 'พิมพ์นิยม 10 เนื้อ (ทองคำ, นาก, เงิน, ชนวนมวลสาร, นวะ, ทองเหลือง, ทองแดง, ผงพุทธคุณ, ผงตะกรุดทองคำ, ผงตะกรุดเงิน)',
        count: '10 องค์',
        mold: 'พิมพ์นิยม (พิมพ์ใหญ่)',
      },
      {
        item: 'พิมพ์คะแนน 10 เนื้อ (ทองคำ, นาก, เงิน, ชนวนมวลสาร, นวะ, ทองเหลือง, ทองแดง, ผงพุทธคุณ, ผงตะกรุดทองคำ, ผงตะกรุดเงิน)',
        count: '10 องค์',
        mold: 'พิมพ์คะแนน (พิมพ์เล็ก)',
      },
      {
        item: 'สมนาคุณพิเศษ: พระผงพุทธคุณ พิมพ์นิยม ยกกล่อง',
        count: '100 องค์ (1 กล่อง)',
        mold: 'พร้อมรูปในพิธีและบัตรรับรองประจำชุด (เลือกเลข 1–99)',
      },
    ],
    weightGrams: 480,
    condition: 'ชุดปฐมฤกษ์ครบชุด เลือกหมายเลขประจำชุด 1–99 พร้อมรูปในพิธีและบัตรรับรอง',
    certificateInfo:
      'จัดสร้าง 99 ชุด (หมายเลข 1–99) · ผู้เช่าบูชาเลือกหมายเลขผ่านตารางเลข 99 ช่องแบบเรียลไทม์',
    purposeSummary:
      'กองทุนหลักเพื่อการศึกษา โรงเรียนตำรวจตระเวนชายแดน และสวัสดิการกำลังพลแนวชายแดน',
    description:
      'ช1 ชุดทองคำใหญ่ราชาฤกษ์ บูชา 349,999 บาท (จัดสร้างเพียง 99 ชุด หมายเลข 1–99) รวม 20 องค์ (พิมพ์นิยม 10 เนื้อ + พิมพ์คะแนน 10 เนื้อ: ทองคำ, นาก, เงิน, นวะ, ชนวนมวลสาร, ทองเหลือง, ทองแดง, ผงตะกรุดทองคำ, ผงตะกรุดเงิน, ผงพุทธคุณ) พร้อมพระผงพุทธคุณ พิมพ์นิยม 1 กล่อง (100 องค์) พร้อมรูปในพิธีและบัตรรับรอง ผู้ซื้อสามารถเลือกหมายเลข 1–99 ได้หลายชุด (1 เลข = 1 ชุด) โดยระบบจะกันเลขแบบ Atomic Transaction ทันทีเป็นเวลา 15 นาที',
    shippingFee: 0,
    isFeatured: true,
    isVisible: true,
    specimenStyle: 'gold_lotus',
    angles: [
      {
        angle: 'front',
        label: 'ภาพรวมชุด 20 องค์',
        caption: 'ช1 ชุดทองคำใหญ่ราชาฤกษ์ รวม 20 องค์ ครบทั้งพิมพ์นิยมและพิมพ์คะแนน',
        imageUrl: '/assets/aistudio/set_01_hero.png',
      },
      {
        angle: 'back',
        label: 'ชุดเนื้อโลหะ 14 องค์',
        caption: 'พิมพ์นิยม (พิมพ์ใหญ่) 7 องค์ และพิมพ์คะแนน (พิมพ์เล็ก) 7 องค์ เนื้อทองคำถึงเนื้อทองแดง',
        imageUrl: '/assets/aistudio/set_01_metal_large.png',
      },
      {
        angle: 'edge',
        label: 'ชุดเนื้อผง & สมนาคุณ 100 องค์',
        caption: 'ผงพุทธคุณ พิมพ์นิยม 3 องค์ + พิมพ์คะแนน 3 องค์ พร้อมพระผงพุทธคุณ 1 กล่อง (100 องค์)',
        imageUrl: '/assets/aistudio/set_01_powder_and_bonus.png',
      },
      {
        angle: 'box',
        label: 'ใบรายการชุดที่ ๑ ฉบับเต็ม',
        caption: 'เอกสารใบรายการวัตถุมงคล ช1 ชุดทองคำใหญ่ราชาฤกษ์ บูชา 349,999 บาท',
        imageUrl: '/assets/aistudio/somdej_brochure_page_2.png',
      },
    ],
    createdAt: '2026-10-27T12:00:00.000Z',
  },
  {
    id: 'prod-ch2',
    code: 'ช2',
    name: 'ช2 ชุดยกกล่อง 100 องค์ (พิมพ์นิยม)',
    series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
    yearBE: 2569,
    category: 'special_set',
    categoryLabel: 'ชุดพิเศษ',
    moldType: 'พิมพ์นิยม',
    price: 29999,
    stock: 299,
    initialStock: 299,
    bookedCount: 0,
    isMadeToOrder: false,
    requiresNumberSelection: false,
    material:
      'รวม 100 องค์ พิมพ์นิยม (ผงพุทธคุณ 80, เงิน 3, นวะโลหะ 2, ทองเหลือง 5, ทองแดง 5, ผงตะกรุดทองคำ 3, ผงตะกรุดเงิน 2)',
    dimensions: DIM_NIYOM,
    moldDimensionsNote: MOLD_SIZE_NOTE_BOTH,
    setBreakdown: [
      { item: 'พระผงพุทธคุณ (พิมพ์นิยม)', count: '80 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อเงิน (พิมพ์นิยม)', count: '3 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อนวะโลหะ (พิมพ์นิยม)', count: '2 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อทองเหลือง (พิมพ์นิยม)', count: '5 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อทองแดง (พิมพ์นิยม)', count: '5 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      {
        item: 'เนื้อผงพุทธคุณ ตะกรุดทองคำ (พิมพ์นิยม)',
        count: '3 องค์',
        mold: 'พิมพ์นิยม (พิมพ์ใหญ่)',
      },
      {
        item: 'เนื้อผงพุทธคุณ ตะกรุดเงิน (พิมพ์นิยม)',
        count: '2 องค์',
        mold: 'พิมพ์นิยม (พิมพ์ใหญ่)',
      },
    ],
    weightGrams: 1450,
    condition: 'ใหม่ยกกล่อง 100 องค์ พร้อมกล่องบรรจุประจำรุ่น',
    certificateInfo:
      'จัดสร้าง 299 กล่อง · รวมทั้งสิ้น 100 องค์ (พิมพ์นิยม) ตัดสต็อกตามจำนวนที่จอง',
    purposeSummary:
      'สมทบทุนการศึกษา ห้องสมุด และอุปกรณ์การเรียนโรงเรียนตำรวจตระเวนชายแดน',
    description:
      'ช2 ชุดยกกล่อง 100 องค์ (พิมพ์นิยม) บูชา 29,999 บาท (จัดสร้าง 299 กล่อง) ประกอบด้วย ผงพุทธคุณ 80 องค์, เนื้อเงิน 3 องค์, เนื้อนวะโลหะ 2 องค์, เนื้อทองเหลือง 5 องค์, เนื้อทองแดง 5 องค์, เนื้อผงตะกรุดทองคำ 3 องค์ และเนื้อผงตะกรุดเงิน 2 องค์ รวม 100 องค์ในกล่องเดียว',
    shippingFee: 0,
    isFeatured: true,
    isVisible: true,
    specimenStyle: 'brass_shield',
    angles: [
      {
        angle: 'front',
        label: 'ภาพชุดยกกล่อง 7 เนื้อ',
        caption: 'ช2 ชุดยกกล่อง 100 องค์ (พิมพ์นิยม) แสดงสัดส่วนทั้ง 7 เนื้อวัสดุในกล่อง',
        imageUrl: '/assets/aistudio/set_02_hero.png',
      },
      {
        angle: 'back',
        label: 'ตารางรายการ 100 องค์',
        caption: 'รายละเอียดจำนวนองค์พระแต่ละเนื้อภายในชุดยกกล่อง รวมทั้งสิ้น 100 องค์',
        imageUrl: '/assets/aistudio/set_02_table.png',
      },
      {
        angle: 'edge',
        label: 'ขนาดพิมพ์นิยมมาตรฐาน',
        caption: 'แผนผังขนาดพิมพ์นิยม (2.3 × 3.7 × 2.5 ซม. หนา 1 มม.) และพิมพ์คะแนน',
        imageUrl: '/assets/aistudio/somdej_dimensions_chart.png',
      },
      {
        angle: 'box',
        label: 'ใบรายการชุดที่ ๒ ฉบับเต็ม',
        caption: 'เอกสารใบรายการวัตถุมงคล ช2 ชุดยกกล่อง 100 องค์ บูชา 29,999 บาท',
        imageUrl: '/assets/aistudio/somdej_brochure_page_3.png',
      },
    ],
    createdAt: '2026-10-27T11:50:00.000Z',
  },
  {
    id: 'prod-ch3',
    code: 'ช3',
    name: 'ช3 ชุดกรรมการ 5 องค์ (พิมพ์นิยม)',
    series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
    yearBE: 2569,
    category: 'special_set',
    categoryLabel: 'ชุดพิเศษ',
    moldType: 'พิมพ์นิยม',
    price: 4999,
    stock: 298, // 299 total sets, 1 booked in demo order -> 298 remaining
    initialStock: 299,
    bookedCount: 1,
    isMadeToOrder: false,
    requiresNumberSelection: false,
    material:
      'รวม 5 องค์ พิมพ์นิยม (เนื้อเงิน 1, เนื้อนวะโลหะ 1, เนื้อทองเหลือง 1, เนื้อทองแดง 1, ผงตะกรุดทองคำ 1)',
    dimensions: DIM_NIYOM,
    moldDimensionsNote: MOLD_SIZE_NOTE_BOTH,
    setBreakdown: [
      { item: 'เนื้อเงิน (พิมพ์นิยม)', count: '1 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อนวะโลหะ (พิมพ์นิยม)', count: '1 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อทองเหลือง (พิมพ์นิยม)', count: '1 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      { item: 'เนื้อทองแดง (พิมพ์นิยม)', count: '1 องค์', mold: 'พิมพ์นิยม (พิมพ์ใหญ่)' },
      {
        item: 'เนื้อผงพุทธคุณ ตะกรุดทองคำ 1 ดอก (พิมพ์นิยม)',
        count: '1 องค์',
        mold: 'พิมพ์นิยม (พิมพ์ใหญ่)',
      },
    ],
    weightGrams: 95,
    condition: 'ใหม่ครบชุด 5 องค์ พร้อมกล่องเดิมจากโครงการ',
    certificateInfo:
      'จัดสร้าง 299 ชุด · ชุดกรรมการรวม 5 องค์ (พิมพ์นิยม) ตัดสต็อกตามจำนวนที่จอง',
    purposeSummary:
      'สนับสนุนทุนอาหารกลางวันและเวชภัณฑ์โรงเรียนตำรวจตระเวนชายแดน',
    description:
      'ช3 ชุดกรรมการ 5 องค์ (พิมพ์นิยม) บูชา 4,999 บาท (จัดสร้าง 299 ชุด) รวบรวมองค์พระสมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม 5 เนื้อหลัก ได้แก่ เนื้อเงิน 1 องค์, เนื้อนวะโลหะ 1 องค์, เนื้อทองเหลือง 1 องค์, เนื้อทองแดง 1 องค์ และเนื้อผงตะกรุดทองคำ 1 องค์',
    shippingFee: 0,
    isFeatured: true,
    isVisible: true,
    specimenStyle: 'silver_octagonal',
    angles: [
      {
        angle: 'front',
        label: 'ภาพชุดกรรมการ 5 องค์',
        caption: 'ช3 ชุดกรรมการ 5 องค์ (พิมพ์นิยม) แสดงด้านหน้าและด้านหลังครบทั้ง 5 เนื้อ',
        imageUrl: '/assets/aistudio/set_03_hero.png',
      },
      {
        angle: 'back',
        label: 'ตารางรายการ 5 องค์',
        caption: 'รายการภายในชุดกรรมการ 5 องค์ (เงิน, นวะโลหะ, ทองเหลือง, ทองแดง, ผงตะกรุดทองคำ)',
        imageUrl: '/assets/aistudio/set_03_table.png',
      },
      {
        angle: 'edge',
        label: 'ขนาดพิมพ์นิยมมาตรฐาน',
        caption: 'ขนาดพิมพ์นิยม ด้านบน 2.3 ซม. สูง 3.7 ซม. ด้านล่าง 2.5 ซม. หนา 1 มม.',
        imageUrl: '/assets/aistudio/somdej_dimensions_chart.png',
      },
      {
        angle: 'box',
        label: 'ใบรายการชุดที่ ๓ ฉบับเต็ม',
        caption: 'เอกสารใบรายการวัตถุมงคล ช3 ชุดกรรมการ 5 องค์ บูชา 4,999 บาท',
        imageUrl: '/assets/aistudio/somdej_brochure_page_4.png',
      },
    ],
    createdAt: '2026-10-27T11:40:00.000Z',
  },

  // ============================================================================
  // หมวด 1 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม (ชศ1 – ชศ7)
  // ============================================================================
  buildStandardItem({
    id: 'prod-chs1',
    code: 'ชศ1',
    name: 'ชศ1 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อทองคำ',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 199999,
    stock: 999999,
    isMadeToOrder: true,
    assetKey: 'gold',
    isFeatured: true,
    createdAt: '2026-10-27T11:20:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs2',
    code: 'ชศ2',
    name: 'ชศ2 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อนาก Pink Gold',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 99999,
    stock: 999999,
    isMadeToOrder: true,
    assetKey: 'pinkgold',
    isFeatured: true,
    createdAt: '2026-10-27T11:19:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs3',
    code: 'ชศ3',
    name: 'ชศ3 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อเงิน',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 3999,
    stock: 999999,
    isMadeToOrder: true,
    assetKey: 'silver',
    isFeatured: false,
    createdAt: '2026-10-27T11:18:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs4',
    code: 'ชศ4',
    name: 'ชศ4 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อชนวนมวลสาร',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 999,
    stock: 999,
    isMadeToOrder: false,
    assetKey: 'chanuan',
    createdAt: '2026-10-27T11:17:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs5',
    code: 'ชศ5',
    name: 'ชศ5 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อนวะโลหะ',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 999,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'nawa',
    createdAt: '2026-10-27T11:16:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs6',
    code: 'ชศ6',
    name: 'ชศ6 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อทองเหลือง',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 499,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'brass',
    createdAt: '2026-10-27T11:15:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs7',
    code: 'ชศ7',
    name: 'ชศ7 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม เนื้อทองแดง',
    category: 'cat_1_popular_metal',
    categoryLabel: 'หมวด 1 : พิมพ์นิยม (เนื้อโลหะ)',
    moldType: 'พิมพ์นิยม',
    price: 399,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'copper',
    createdAt: '2026-10-27T11:14:00.000Z',
  }),

  // ============================================================================
  // หมวด 2 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน (ชศ8 – ชศ14)
  // ============================================================================
  buildStandardItem({
    id: 'prod-chs8',
    code: 'ชศ8',
    name: 'ชศ8 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อทองคำ',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 69999,
    stock: 999999,
    isMadeToOrder: true,
    assetKey: 'gold',
    createdAt: '2026-10-27T11:13:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs9',
    code: 'ชศ9',
    name: 'ชศ9 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อนาก Pink Gold',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 29999,
    stock: 999999,
    isMadeToOrder: true,
    assetKey: 'pinkgold',
    createdAt: '2026-10-27T11:12:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs10',
    code: 'ชศ10',
    name: 'ชศ10 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อเงิน',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 1999,
    stock: 999999,
    isMadeToOrder: true,
    assetKey: 'silver',
    createdAt: '2026-10-27T11:11:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs11',
    code: 'ชศ11',
    name: 'ชศ11 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อชนวนมวลสาร',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 699,
    stock: 999,
    isMadeToOrder: false,
    assetKey: 'chanuan',
    createdAt: '2026-10-27T11:10:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs12',
    code: 'ชศ12',
    name: 'ชศ12 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อนวะโลหะ',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 599,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'nawa',
    createdAt: '2026-10-27T11:09:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs13',
    code: 'ชศ13',
    name: 'ชศ13 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อทองเหลือง',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 299,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'brass',
    createdAt: '2026-10-27T11:08:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs14',
    code: 'ชศ14',
    name: 'ชศ14 สมเด็จพิทักษ์แผ่นดิน พิมพ์คะแนน เนื้อทองแดง',
    category: 'cat_2_score_metal',
    categoryLabel: 'หมวด 2 : พิมพ์คะแนน (เนื้อโลหะ)',
    moldType: 'พิมพ์คะแนน',
    price: 199,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'copper',
    createdAt: '2026-10-27T11:07:00.000Z',
  }),

  // ============================================================================
  // หมวด 3 เนื้อผงพุทธคุณ พิมพ์นิยม (ชศ15 – ชศ17)
  // ============================================================================
  buildStandardItem({
    id: 'prod-chs15',
    code: 'ชศ15',
    name: 'ชศ15 เนื้อผงพุทธคุณ พิมพ์นิยม',
    category: 'cat_3_popular_powder',
    categoryLabel: 'หมวด 3 : เนื้อผงพุทธคุณ พิมพ์นิยม',
    moldType: 'พิมพ์นิยม',
    price: 199,
    stock: 15000,
    isMadeToOrder: false,
    assetKey: 'powder',
    createdAt: '2026-10-27T11:06:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs16',
    code: 'ชศ16',
    name: 'ชศ16 เนื้อผงพุทธคุณ พิมพ์นิยม ตะกรุดทองคำ 1 ดอก',
    category: 'cat_3_popular_powder',
    categoryLabel: 'หมวด 3 : เนื้อผงพุทธคุณ พิมพ์นิยม',
    moldType: 'พิมพ์นิยม',
    price: 999,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'powder_gold',
    createdAt: '2026-10-27T11:05:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs17',
    code: 'ชศ17',
    name: 'ชศ17 เนื้อผงพุทธคุณ พิมพ์นิยม ตะกรุดเงิน 1 ดอก',
    category: 'cat_3_popular_powder',
    categoryLabel: 'หมวด 3 : เนื้อผงพุทธคุณ พิมพ์นิยม',
    moldType: 'พิมพ์นิยม',
    price: 399,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'powder_silver',
    createdAt: '2026-10-27T11:04:00.000Z',
  }),

  // ============================================================================
  // หมวด 4 เนื้อผงพุทธคุณ พิมพ์คะแนน (ชศ18 – ชศ20)
  // ============================================================================
  buildStandardItem({
    id: 'prod-chs18',
    code: 'ชศ18',
    name: 'ชศ18 เนื้อผงพุทธคุณ พิมพ์คะแนน',
    category: 'cat_4_score_powder',
    categoryLabel: 'หมวด 4 : เนื้อผงพุทธคุณ พิมพ์คะแนน',
    moldType: 'พิมพ์คะแนน',
    price: 99,
    stock: 10000,
    isMadeToOrder: false,
    assetKey: 'powder',
    createdAt: '2026-10-27T11:03:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs19',
    code: 'ชศ19',
    name: 'ชศ19 เนื้อผงพุทธคุณ พิมพ์คะแนน ตะกรุดทองคำ 1 ดอก',
    category: 'cat_4_score_powder',
    categoryLabel: 'หมวด 4 : เนื้อผงพุทธคุณ พิมพ์คะแนน',
    moldType: 'พิมพ์คะแนน',
    price: 799,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'powder_gold',
    createdAt: '2026-10-27T11:02:00.000Z',
  }),
  buildStandardItem({
    id: 'prod-chs20',
    code: 'ชศ20',
    name: 'ชศ20 เนื้อผงพุทธคุณ พิมพ์คะแนน ตะกรุดเงิน 1 ดอก',
    category: 'cat_4_score_powder',
    categoryLabel: 'หมวด 4 : เนื้อผงพุทธคุณ พิมพ์คะแนน',
    moldType: 'พิมพ์คะแนน',
    price: 299,
    stock: 1500,
    isMadeToOrder: false,
    assetKey: 'powder_silver',
    createdAt: '2026-10-27T11:01:00.000Z',
  }),
];

export function createInitialRajaSlots(): RajaSetSlot[] {
  const nowIso = '2026-10-27T08:00:00.000Z';
  const slots: RajaSetSlot[] = [];
  for (let i = 1; i <= 99; i++) {
    if (i === 9) {
      slots.push({
        slotNumber: 9,
        status: 'booked',
        sessionId: 'demo-session-009',
        heldAt: 0,
        heldUntil: 0,
        orderNumber: 'BPP-2569-1009',
        updatedAt: nowIso,
      });
    } else {
      slots.push({
        slotNumber: i,
        status: 'available',
        sessionId: '',
        heldAt: 0,
        heldUntil: 0,
        orderNumber: '',
        updatedAt: nowIso,
      });
    }
  }
  return slots;
}

export const initialNews: NewsArticle[] = [
  {
    id: 'news-01',
    title:
      'พิธีพลีมวลสาร "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." ณ วัดสวนธรรมปีติ จ.กาฬสินธุ์ (LIVE ถ่ายทอดสด)',
    category: 'กำหนดการพิธีมหามงคล',
    publishedAt: '10 ต.ค. 2569',
    sourceReference:
      'กองบัญชาการตำรวจตระเวนชายแดน · POLICETV สถานีโทรทัศน์สำนักงานตำรวจแห่งชาติ',
    posterUrl: '/assets/aistudio/_____________________75_________16__c80228c4.png',
    eventDate: 'วันเสาร์ที่ 10 ตุลาคม 2569',
    eventTime: 'เวลา 09.39 น.',
    eventLocation: 'ณ วัดสวนธรรมปีติ อำเภอเมือง จังหวัดกาฬสินธุ์',
    presidingMonk: 'พระเถราจารย์ผู้ทรงคุณวุฒิ 5 รูป ร่วมประกอบพิธีพลีมวลสาร',
    broadcastChannel:
      'LIVE ถ่ายทอดสดทาง Facebook : POLICETV สถานีโทรทัศน์สำนักงานตำรวจแห่งชาติ',
    excerpt:
      'ร่วมติดตามบรรยากาศ พิธีพลีมวลสาร "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." เนื่องในโอกาส 75 ปี กองบัญชาการตำรวจตระเวนชายแดน วันเสาร์ที่ 10 ตุลาคม 2569 เวลา 09.39 น. ณ วัดสวนธรรมปีติ อ.เมือง จ.กาฬสินธุ์ พร้อมรับชมการถ่ายทอดสดทาง POLICETV',
    content: [
      'กองบัญชาการตำรวจตระเวนชายแดน ขอเชิญพุทธศาสนิกชนและผู้มีจิตศรัทธาร่วมติดตามบรรยากาศ พิธีพลีมวลสาร "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." เนื่องในโอกาสมหามงคลครบรอบ 75 ปี กองบัญชาการตำรวจตระเวนชายแดน',
      'กำหนดการประกอบพิธีใน วันเสาร์ที่ 10 ตุลาคม 2569 เวลา 09.39 น. ณ วัดสวนธรรมปีติ อำเภอเมือง จังหวัดกาฬสินธุ์ โดยได้รับเมตตาจากคณะพระเถราจารย์ผู้ทรงคุณวุฒิร่วมอธิษฐานจิตและประกอบพิธีพลีมวลสารศักดิ์สิทธิ์ตามแบบแผนโบราณ',
      'พุทธศาสนิกชนทั่วประเทศสามารถร่วมอนุโมทนาบุญและรับชมการถ่ายทอดสด (LIVE) ตลอดพิธีได้ทาง Facebook : POLICETV สถานีโทรทัศน์สำนักงานตำรวจแห่งชาติ เพื่อร่วมเป็นส่วนหนึ่งของพิธีมหามงคล 75 ปี กองบัญชาการตำรวจตระเวนชายแดน',
    ],
    illustrationType: 'ceremony',
  },
  {
    id: 'news-02',
    title:
      'วาระที่ 2 : พิธีพลีมวลสารอธิษฐานจิต "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." ณ วัดแสงแก้วโพธิญาณ จ.เชียงราย',
    category: 'พิธีพลีมวลสาร วาระที่ 2',
    publishedAt: '17 ต.ค. 2569',
    sourceReference: 'กองบัญชาการตำรวจตระเวนชายแดน · วัดแสงแก้วโพธิญาณ จ.เชียงราย',
    posterUrl: '/assets/aistudio/75__________________________________12__3abcf51b.png',
    eventDate: 'วันเสาร์ที่ 17 ตุลาคม 2569',
    eventTime: 'เวลา 13:39 น.',
    eventLocation: 'ณ วัดแสงแก้วโพธิญาณ อำเภอแม่สรวย จังหวัดเชียงราย',
    presidingMonk: 'ครูบาอริยชาติ อริยจิตฺโต (ประธานสงฆ์)',
    excerpt:
      'ขอเชิญพุทธศาสนิกชนร่วม พิธีพลีมวลสารอธิษฐานจิต "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." วาระที่ 2 โดยมี ครูบาอริยชาติ อริยจิตฺโต เป็นประธานสงฆ์ ในวันเสาร์ที่ 17 ตุลาคม 2569 เวลา 13:39 น. ณ วัดแสงแก้วโพธิญาณ อ.แม่สรวย จ.เชียงราย',
    content: [
      'กองบัญชาการตำรวจตระเวนชายแดน ขอเชิญพุทธศาสนิกชนร่วม พิธีพลีมวลสารอธิษฐานจิต วัตถุมงคลรุ่นประวัติศาสตร์ "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." (วาระที่ 2) เพื่อความเป็นสิริมงคลและสืบสานพุทธศิลป์แผ่นดินล้านนา',
      'ได้รับความเมตตาอย่างสูงสุดจาก ครูบาอริยชาติ อริยจิตฺโต เป็นประธานสงฆ์ในการประกอบพิธีพลีมวลสารและอธิษฐานจิตมวลสารศักดิ์สิทธิ์สำหรับจัดสร้างองค์พระสมเด็จพิทักษ์แผ่นดิน',
      'กำหนดจัดพิธีใน วันเสาร์ที่ 17 ตุลาคม 2569 เวลา 13:39 น. ณ วัดแสงแก้วโพธิญาณ อำเภอแม่สรวย จังหวัดเชียงราย ขอเชิญศิษยานุศิษย์และผู้มีจิตศรัทธาร่วมพิธีโดยพร้อมเพรียงกัน',
    ],
    illustrationType: 'ceremony',
  },
  {
    id: 'news-03',
    title:
      'พิธีพลีมวลสารอธิษฐานจิต "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." ณ วัดมหาธาตุวชิรมงคล พระอารามหลวง จ.กระบี่',
    category: 'พิธีพลีมวลสาร ภาคใต้',
    publishedAt: '24 ต.ค. 2569',
    sourceReference:
      'กองบัญชาการตำรวจตระเวนชายแดน · วัดมหาธาตุวชิรมงคล พระอารามหลวง จ.กระบี่',
    posterUrl: '/assets/aistudio/_______________1__26ef883a.png',
    eventDate: 'วันเสาร์ที่ 24 ตุลาคม 2569',
    eventTime: 'เวลา 09:39 น.',
    eventLocation:
      'ณ อุโบสถหลังเก่า วัดมหาธาตุวชิรมงคล พระอารามหลวง ตำบลนาเหนือ อำเภออ่าวลึก จังหวัดกระบี่',
    presidingMonk: 'พระธรรมวชิรพุทธาคม',
    excerpt:
      'ขอเชิญพุทธศาสนิกชนร่วม พิธีพลีมวลสารอธิษฐานจิต "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." โดยมี พระธรรมวชิรพุทธาคม เมตตาอธิษฐานจิต ในวันเสาร์ที่ 24 ตุลาคม 2569 เวลา 09:39 น. ณ อุโบสถหลังเก่า วัดมหาธาตุวชิรมงคล พระอารามหลวง อ.อ่าวลึก จ.กระบี่',
    content: [
      'กองบัญชาการตำรวจตระเวนชายแดน ขอเชิญพุทธศาสนิกชนร่วม พิธีพลีมวลสารอธิษฐานจิต พิธีพลีมวลสาร "สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด." เพื่อรวบรวมพลังพุทธคุณแห่งแผ่นดินภาคใต้เข้าสู่มวลสารหลักในการจัดสร้างวัตถุมงคลครบ 75 ปี ตชด.',
      'ได้รับความเมตตาจาก พระธรรมวชิรพุทธาคม เป็นประธานอธิษฐานจิตพลีมวลสารศักดิ์สิทธิ์ ณ อุโบสถหลังเก่า วัดมหาธาตุวชิรมงคล พระอารามหลวง (วัดบางโทง) ตำบลนาเหนือ อำเภออ่าวลึก จังหวัดกระบี่',
      'กำหนดการประกอบพิธีใน วันเสาร์ที่ 24 ตุลาคม 2569 เวลา 09:39 น. ณ วัดมหาธาตุวชิรมงคล อำเภออ่าวลึก จังหวัดกระบี่ เพื่อสมทบทุนภารกิจและโรงเรียนตำรวจตระเวนชายแดนทั่วประเทศ',
    ],
    illustrationType: 'ceremony',
  },
  {
    id: 'news-04',
    title: 'ประกาศใบรายการวัตถุมงคล "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. ครบทั้ง 4 หมวดปกติ (ชศ1–ชศ20) และ 3 ชุดพิเศษ (ช1–ช3)',
    category: 'ประกาศคลังวัตถุมงคล',
    publishedAt: 'ตุลาคม 2569',
    sourceReference: 'กองบัญชาการตำรวจตระเวนชายแดน',
    posterUrl: '/assets/aistudio/somdej_brochure_page_1.png',
    eventDate: 'วาระครบรอบ 75 ปี ตชด.',
    eventTime: 'เปิดจองร่วมบุญ',
    eventLocation: 'กองบัญชาการตำรวจตระเวนชายแดน',
    presidingMonk: 'พิธีมหาพุทธาภิเษกและพลีมวลสารทั่วภูมิภาค',
    excerpt:
      'เปิดเผยรายละเอียดใบรายการทางการ พิมพ์นิยม (พิมพ์ใหญ่) และพิมพ์คะแนน (พิมพ์เล็ก) ครบทั้ง 20 รหัสปกติ (ชศ1–ชศ20) พร้อม 3 ชุดพิเศษ (ช1 ชุดทองคำใหญ่ราชาฤกษ์ เลือกเลข 1–99, ช2 ชุดยกกล่อง 100 องค์, ช3 ชุดกรรมการ 5 องค์)',
    content: [
      'กองบัญชาการตำรวจตระเวนชายแดน จัดสร้างวัตถุมงคลรุ่นประวัติศาสตร์ "สมเด็จพิทักษ์แผ่นดิน" ๗๕ ปี ตชด. โดยแบ่งขนาดองค์พระเป็น พิมพ์นิยม (ด้านบน 2.3 ซม. สูง 3.7 ซม. ด้านล่าง 2.5 ซม. หนา 1 มม.) และ พิมพ์คะแนน (ด้านบน 1.2 ซม. สูง 2.1 ซม. ด้านล่าง 1.3 ซม. หนา 1 มม.)',
      'เปิดให้สั่งจองครบทั้ง หมวด 1 พิมพ์นิยมเนื้อโลหะ (ชศ1–ชศ7), หมวด 2 พิมพ์คะแนนเนื้อโลหะ (ชศ8–ชศ14), หมวด 3 เนื้อผงพุทธคุณพิมพ์นิยม (ชศ15–ชศ17), หมวด 4 เนื้อผงพุทธคุณพิมพ์คะแนน (ชศ18–ชศ20) และชุดจัดสร้างพิเศษ ช1, ช2, ช3',
    ],
    illustrationType: 'archive',
  },
];

export const initialOrders: OrderRecord[] = [
  {
    id: 'ord-demo-1009',
    orderNumber: 'BPP-2569-1009',
    createdAt: '2026-10-26T09:00:00.000Z',
    reservationDateThai: '26 ตุลาคม 2569',
    customerName: 'พล.ต.ต. กิตติพงศ์ วงศ์สุวรรณ',
    organization: 'กองบัญชาการตำรวจตระเวนชายแดน (บก.ตชด.)',
    customerPhone: '081-999-7575',
    customerEmail: 'kittipong.bpp@example.com',
    shippingAddress: 'กองบัญชาการตำรวจตระเวนชายแดน ถนนพหลโยธิน พญาไท กรุงเทพฯ',
    postalCode: '10400',
    paymentMethod: 'bank_transfer',
    transferReference: 'KTB-750009',
    selectedNumbers: [9],
    items: [
      {
        productId: 'prod-ch1',
        productCode: 'ช1',
        productName: 'ช1 ชุดทองคำใหญ่ราชาฤกษ์ (รวม 20 องค์ + พระผง 100 องค์)',
        series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด. (เลือกหมายเลข 1–99)',
        unitPrice: 349999,
        quantity: 1,
        lineTotal: 349999,
        selectedNumbers: [9],
      },
    ],
    subtotal: 349999,
    shippingTotal: 0,
    grandTotal: 349999,
    grandTotalThaiText: 'สามแสนสี่หมื่นเก้าพันเก้าร้อยเก้าสิบเก้าบาทถ้วน',
    paymentStatus: 'verified_paid',
    preparationStatus: 'packed_ready',
    shippingStatus: 'not_shipped',
    statusHistory: [
      {
        id: 'log-1009-1',
        timestamp: '2026-10-26T09:00:00.000Z',
        actor: 'ระบบสั่งจองอัตโนมัติ (Atomic Firestore Lock)',
        paymentStatus: 'verified_paid',
        preparationStatus: 'packed_ready',
        shippingStatus: 'not_shipped',
        note: 'ยืนยันการจองชุดทองคำใหญ่ราชาฤกษ์ (ช1) หมายเลข #9 ชำระเงินครบถ้วน',
      },
    ],
    sessionId: 'demo-session-009',
    isDemoOrder: true,
  },
  {
    id: 'ord-demo-1042',
    orderNumber: 'BPP-2569-1042',
    createdAt: '2026-10-26T14:30:00.000Z',
    reservationDateThai: '26 ตุลาคม 2569',
    customerName: 'พ.ต.ท. พงศ์ภัค วัฒนากูล',
    organization: 'กก.ตชด. 32 (พะเยา)',
    customerPhone: '081-234-5678',
    customerEmail: 'pongpak.demo@example.com',
    shippingAddress: '88/12 ถนนสุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร',
    postalCode: '10110',
    paymentMethod: 'promptpay',
    transferReference: 'DEMO-REF-8842',
    items: [
      {
        productId: 'prod-ch3',
        productCode: 'ช3',
        productName: 'ช3 ชุดกรรมการ 5 องค์ (พิมพ์นิยม)',
        series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
        unitPrice: 4999,
        quantity: 1,
        lineTotal: 4999,
      },
    ],
    subtotal: 4999,
    shippingTotal: 0,
    grandTotal: 4999,
    grandTotalThaiText: 'สี่พันเก้าร้อยเก้าสิบเก้าบาทถ้วน',
    paymentStatus: 'verified_paid',
    preparationStatus: 'packed_ready',
    shippingStatus: 'in_transit',
    trackingNumber: 'ED849201455TH',
    carrierName: 'ไปรษณีย์ไทย (EMS)',
    statusHistory: [
      {
        id: 'log-1',
        timestamp: '2026-10-26T14:30:00.000Z',
        actor: 'ระบบสั่งจองอัตโนมัติ',
        paymentStatus: 'pending_verification',
        preparationStatus: 'awaiting_payment',
        shippingStatus: 'not_shipped',
        note: 'บันทึกคำสั่งจองเข้าสู่ระบบ รอผู้ดูแลตรวจสอบรายการชำระเงิน',
      },
      {
        id: 'log-2',
        timestamp: '2026-10-26T16:15:00.000Z',
        actor: 'ผู้ดูแลคลังวัตถุมงคล (Admin)',
        paymentStatus: 'verified_paid',
        preparationStatus: 'packed_ready',
        shippingStatus: 'in_transit',
        note: 'ตรวจสอบยอดชำระเงินเรียบร้อย จัดส่งพัสดุ EMS เลขพัสดุ ED849201455TH',
      },
    ],
    sessionId: 'demo-session-042',
    isDemoOrder: true,
  },
];

export const initialInquiries: ContactInquiry[] = [
  {
    id: 'inq-01',
    createdAt: '2026-10-26T15:10:00.000Z',
    name: 'ธนากร รัตนโชติ',
    phone: '086-555-1234',
    subject: 'สอบถามการเลือกเลขชุดทองคำใหญ่ราชาฤกษ์ (ช1) และชุดยกกล่อง 100 องค์ (ช2)',
    message:
      'ต้องการจองชุดทองคำใหญ่ราชาฤกษ์ 2 ชุด สามารถคลิกเลือก 2 หมายเลขในตาราง 1–99 ได้พร้อมกันเลยใช่ไหมครับ',
    orderNumber: 'BPP-2569-1009',
  },
];
