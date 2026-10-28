import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Grid,
  Lock,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Settings,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  AmuletProduct,
  ContactInquiry,
  NewsArticle,
  OrderRecord,
  PaymentStatus,
  PreparationStatus,
  RajaSetSlot,
  ShippingStatus,
  SiteConfig,
  SpecimenStyle,
} from '../types';
import {
  formatThaiDate,
  generateOrdersCsv,
  generateRajaSlotsCsv,
  generateStockCsv,
  numberToThaiBahtText,
} from '../utils/commerceRules';

interface AdminDashboardViewProps {
  adminToken: string | null;
  onLoginSuccess: (token: string, email: string) => void;
  onLogout: () => void;
  onStoreUpdated: () => void;
}

interface DashboardPayload {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    verifiedRevenue: number;
    totalReservationAmount?: number;
    totalStockCount: number;
    lowStockCount: number;
    bookedRajaSlotsCount?: number;
  };
  products: AmuletProduct[];
  orders: OrderRecord[];
  rajaSlots: RajaSetSlot[];
  news: NewsArticle[];
  siteConfig: SiteConfig;
  inquiries: ContactInquiry[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  adminToken,
  onLoginSuccess,
  onLogout,
  onStoreUpdated,
}) => {
  const [email, setEmail] = useState('admin@bpp-heritage.demo');
  const [passcode, setPasscode] = useState('BPP-Admin-2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'orders' | 'raja_slots' | 'stock' | 'overview' | 'content'
  >('orders');

  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [slotFilter, setSlotFilter] = useState<'all' | 'booked' | 'available'>('all');

  // New / Edit Product Modal State
  const [editingProduct, setEditingProduct] =
    useState<Partial<AmuletProduct> | null>(null);

  // Order Update State
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderPaymentStatus, setOrderPaymentStatus] =
    useState<PaymentStatus>('pending_verification');
  const [orderPrepStatus, setOrderPrepStatus] =
    useState<PreparationStatus>('awaiting_payment');
  const [orderShippingStatus, setOrderShippingStatus] =
    useState<ShippingStatus>('not_shipped');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Site Config Editor State
  const [configDraft, setConfigDraft] = useState<SiteConfig | null>(null);

  const fetchDashboard = async (tokenToUse: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setDashboardData(data);
      setConfigDraft(data.siteConfig);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchDashboard(adminToken);
    }
  }, [adminToken]);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 3500);
  };

  const downloadCsvFile = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว`);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }
      onLoginSuccess(data.token, data.adminEmail);
    } catch {
      setLoginError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ยืนยันตัวตนได้');
    }
  };

  const handleReleaseRajaSlot = async (slotNumber: number) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/raja-slots/${slotNumber}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'available' }),
    });
    if (res.ok) {
      await fetchDashboard(adminToken);
      onStoreUpdated();
      showToast(`ปล่อยหมายเลข #${slotNumber} กลับเป็นสถานะ "ว่าง" เรียบร้อยแล้ว`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingProduct) return;

    const isExisting = Boolean(editingProduct.id);
    const url = isExisting
      ? `/api/admin/products/${editingProduct.id}`
      : '/api/admin/products';
    const method = isExisting ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(editingProduct),
    });

    if (res.ok) {
      setEditingProduct(null);
      await fetchDashboard(adminToken);
      onStoreUpdated();
      showToast(
        isExisting
          ? 'บันทึกการแก้ไขข้อมูลและสต็อกวัตถุมงคลเรียบร้อยแล้ว'
          : 'เพิ่มรายการวัตถุมงคลใหม่เข้าสู่คลังเรียบร้อยแล้ว'
      );
    }
  };

  const handleToggleProductVisibility = async (prod: AmuletProduct) => {
    if (!adminToken) return;
    await fetch(`/api/admin/products/${prod.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isVisible: !prod.isVisible }),
    });
    await fetchDashboard(adminToken);
    onStoreUpdated();
    showToast(`เปลี่ยนสถานะการแสดงผลของ "${prod.code} ${prod.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!adminToken) return;
    await fetch(`/api/admin/products/${prodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await fetchDashboard(adminToken);
    onStoreUpdated();
    showToast('ลบรายการวัตถุมงคลออกจากระบบแล้ว');
  };

  const handleOpenOrderModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setOrderPaymentStatus(order.paymentStatus);
    setOrderPrepStatus(order.preparationStatus);
    setOrderShippingStatus(order.shippingStatus);
    setOrderTrackingNumber(order.trackingNumber || '');
    setOrderNote('');
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedOrder) return;

    const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        paymentStatus: orderPaymentStatus,
        preparationStatus: orderPrepStatus,
        shippingStatus: orderShippingStatus,
        trackingNumber: orderTrackingNumber,
        note: orderNote,
      }),
    });

    if (res.ok) {
      setSelectedOrder(null);
      await fetchDashboard(adminToken);
      onStoreUpdated();
      showToast(
        `อัปเดตสถานะใบจอง ${selectedOrder.orderNumber} เรียบร้อยแล้ว`
      );
    }
  };

  const handleSaveSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !configDraft) return;
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(configDraft),
    });
    if (res.ok) {
      await fetchDashboard(adminToken);
      onStoreUpdated();
      showToast('บันทึกการตั้งค่าเนื้อหาหน้าเว็บไซต์และช่องทางชำระเงินเรียบร้อยแล้ว');
    }
  };

  const filteredRajaSlots = useMemo(() => {
    if (!dashboardData?.rajaSlots) return [];
    const now = Date.now();
    return dashboardData.rajaSlots.filter((s) => {
      const isOccupied =
        s.status === 'booked' || (s.status === 'held' && s.heldUntil > now);
      if (slotFilter === 'booked') return isOccupied;
      if (slotFilter === 'available') return !isOccupied;
      return true;
    });
  }, [dashboardData?.rajaSlots, slotFilter]);

  // Unauthenticated Admin Login Screen
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl p-8 space-y-6 shadow-lg">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#14100A] text-[#C9A45C] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif-heritage text-2xl font-semibold text-[#14100A]">
              หลังบ้านผู้ดูแลระบบ (Admin Backoffice)
            </h1>
            <p className="text-xs text-[#77717C]">
              จัดการใบจอง สถานะชำระเงิน สต็อก 23 รหัส ตารางเลข 1–99 และส่งออก CSV
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-[#29222E] mb-1"
              >
                อีเมลผู้ดูแลระบบ
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#E8E2D5] rounded-lg bg-[#F7F2E8]/40 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#14100A]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-medium text-[#29222E] mb-1"
              >
                รหัสผ่านผู้ดูแลระบบ
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#E8E2D5] rounded-lg bg-[#F7F2E8]/40 focus:bg-[#FFFFFF] focus:outline-none focus:border-[#14100A]"
              />
            </div>

            {loginError && (
              <p role="alert" className="text-xs text-red-700 font-medium">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#14100A] text-[#F7F2E8] hover:bg-[#8A6D2F] text-sm font-semibold rounded-xl transition-colors"
            >
              เข้าสู่ระบบหลังบ้าน (แอดมิน)
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-[#F7F2E8] border border-[#E8E2D5] text-xs text-[#77717C] space-y-1">
            <p className="font-semibold text-[#14100A]">
              ข้อมูลบัญชีผู้ดูแล (กรอกไว้ให้อัตโนมัติ กดปุ่มเข้าสู่ระบบได้ทันที):
            </p>
            <p className="font-tabular">Email: admin@bpp-heritage.demo</p>
            <p className="font-tabular">Passcode: BPP-Admin-2026</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Admin Header & Quick CSV Export Bar */}
      <div className="bg-[#14100A] text-[#F7F2E8] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-[#C9A45C]/40">
        <div>
          <span className="text-xs text-[#C9A45C] font-semibold">
            ระบบบริหารจัดการหลังบ้าน · สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.
          </span>
          <h1 className="font-serif-heritage text-2xl font-bold text-[#FFFFFF]">
            รายการจองทั้งหมด · ตารางเลข 1–99 · สต็อกคงเหลือ 23 รหัส · ส่งออก CSV
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {dashboardData && (
            <>
              <button
                type="button"
                onClick={() =>
                  downloadCsvFile(
                    generateOrdersCsv(dashboardData.orders),
                    `bpp75-orders-${new Date().toISOString().slice(0, 10)}.csv`
                  )
                }
                className="px-3.5 py-2 rounded-xl btn-sacred-gold text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออกรายการจอง (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadCsvFile(
                    generateRajaSlotsCsv(
                      dashboardData.rajaSlots,
                      dashboardData.orders
                    ),
                    `bpp75-raja-slots-1-99-${new Date()
                      .toISOString()
                      .slice(0, 10)}.csv`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#261D10] border border-[#FCE694]/60 text-[#FCE694] text-xs font-bold flex items-center gap-1.5 hover:bg-[#342816]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออกตารางเลข 1–99 (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadCsvFile(
                    generateStockCsv(dashboardData.products),
                    `bpp75-stock-23-codes-${new Date()
                      .toISOString()
                      .slice(0, 10)}.csv`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#261D10] border border-[#C9A45C]/60 text-[#F7F2E8] text-xs font-bold flex items-center gap-1.5 hover:bg-[#342816]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออกสต็อก (CSV)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl border border-[#C9A45C]/50 text-xs font-semibold text-[#F7F2E8] hover:bg-[#8A6D2F]/40 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#FFFFFF] border border-[#C9A45C] text-xs sm:text-sm text-[#14100A] font-medium flex items-center gap-2 shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-[#8A6D2F] shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-5 space-y-1 shadow-xs">
            <span className="text-xs text-[#77717C]">ใบจองทั้งหมดในระบบ</span>
            <p className="font-tabular text-2xl font-bold text-[#14100A]">
              {dashboardData.metrics.totalOrders} ใบจอง
            </p>
            <span className="text-[11px] text-[#8A6D2F] font-semibold">
              รอตรวจสอบชำระเงิน {dashboardData.metrics.pendingOrders} รายการ
            </span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-5 space-y-1 shadow-xs">
            <span className="text-xs text-[#77717C]">
              ยอดจองรวม / ยอดชำระยืนยันแล้ว
            </span>
            <p className="font-tabular text-2xl font-bold text-emerald-800">
              ฿
              {(
                dashboardData.metrics.totalReservationAmount ??
                dashboardData.metrics.verifiedRevenue
              ).toLocaleString()}
            </p>
            <span className="text-[11px] text-[#77717C]">
              ยืนยันชำระเงินแล้ว ฿
              {dashboardData.metrics.verifiedRevenue.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-5 space-y-1 shadow-xs">
            <span className="text-xs text-[#77717C]">
              ชุดทองคำใหญ่ราชาฤกษ์ (ช1 · เลข 1–99)
            </span>
            <p className="font-tabular text-2xl font-bold text-[#14100A]">
              จองแล้ว {dashboardData.metrics.bookedRajaSlotsCount ?? 1} / 99 ชุด
            </p>
            <span className="text-[11px] text-[#8A6D2F] font-semibold">
              คงเหลือว่าง{' '}
              {99 - (dashboardData.metrics.bookedRajaSlotsCount ?? 1)} หมายเลข
            </span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-5 space-y-1 shadow-xs">
            <span className="text-xs text-[#77717C]">
              รหัสวัตถุมงคลทั้งหมดในระบบ
            </span>
            <p className="font-tabular text-2xl font-bold text-[#14100A]">
              {dashboardData.products.length} รหัส
            </p>
            <span className="text-[11px] text-[#77717C]">
              ชุดพิเศษ ช1–ช3 และหมวดที่ 1–4 (ชศ1–ชศ20)
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2D5] pb-3">
        {[
          {
            id: 'orders',
            label: '1. รายการจองทั้งหมด & สถานะชำระเงิน',
            icon: FileText,
          },
          {
            id: 'raja_slots',
            label: '2. ตารางเลข 1–99 (ช1 ใครจองเลขไหน)',
            icon: Grid,
          },
          {
            id: 'stock',
            label: '3. สต็อกคงเหลือของแต่ละรหัส (23 รหัส)',
            icon: ShoppingBag,
          },
          {
            id: 'content',
            label: '4. ตั้งค่าช่องทางชำระเงินและเว็บไซต์',
            icon: Settings,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | 'orders'
                    | 'raja_slots'
                    | 'stock'
                    | 'overview'
                    | 'content'
                )
              }
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#14100A] text-[#F7F2E8]'
                  : 'bg-[#FFFFFF] text-[#29222E] border border-[#E8E2D5] hover:border-[#14100A]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#C9A45C]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading || !dashboardData ? (
        <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-12 text-center text-sm text-[#77717C]">
          กำลังโหลดข้อมูลหลังบ้าน...
        </div>
      ) : (
        <>
          {/* TAB 1: ALL RESERVATIONS & PAYMENT STATUS */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-heritage text-lg font-bold text-[#14100A]">
                    รายการจองทั้งหมด ({dashboardData.orders.length} ใบจอง)
                  </h2>
                  <p className="text-xs text-[#77717C]">
                    แสดงเลขที่ใบจอง ชื่อผู้จอง หน่วยงาน เบอร์โทรศัพท์ วันที่จอง รายการและเลขชุด 1–99 ยอดรวม และสถานะการชำระเงิน
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadCsvFile(
                      generateOrdersCsv(dashboardData.orders),
                      `bpp75-orders-${new Date().toISOString().slice(0, 10)}.csv`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#14100A] text-[#FCE694] text-xs font-bold flex items-center gap-1.5 hover:bg-[#2B2214]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export รายการจองเป็น CSV</span>
                </button>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F2E8] border-b border-[#E8E2D5] text-[#14100A] font-semibold">
                      <th className="p-3.5">เลขที่ใบจอง / วันที่</th>
                      <th className="p-3.5">ชื่อผู้จอง / หน่วยงาน / เบอร์โทร</th>
                      <th className="p-3.5">รายการที่จอง & เลขชุด ช1</th>
                      <th className="p-3.5 text-right">ยอดรวมสุทธิ</th>
                      <th className="p-3.5">สถานะการชำระเงิน</th>
                      <th className="p-3.5 text-right">จัดการสถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {dashboardData.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F7F2E8]/40">
                        <td className="p-3.5 align-top">
                          <p className="font-tabular font-bold text-[#14100A]">
                            {ord.orderNumber}
                          </p>
                          <p className="text-[11px] text-[#77717C]">
                            {ord.reservationDateThai ||
                              formatThaiDate(ord.createdAt)}
                          </p>
                        </td>

                        <td className="p-3.5 align-top space-y-0.5">
                          <p className="font-bold text-[#14100A]">
                            {ord.customerName}
                          </p>
                          <p className="text-[#8A6D2F] font-semibold">
                            หน่วยงาน: {ord.organization || 'ประชาชนทั่วไป'}
                          </p>
                          <p className="font-tabular text-[#5A5244]">
                            โทร. {ord.customerPhone}
                          </p>
                          <div className="pt-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.deliveryMethod === 'pickup_bpp' ||
                                (ord.shippingAddress || '').includes('มารับเอง')
                                  ? 'bg-[#14100A] text-[#FCE694]'
                                  : 'bg-[#F7F2E8] text-[#14100A] border border-[#C9A45C]'
                              }`}
                            >
                              {ord.deliveryMethod === 'pickup_bpp' ||
                              (ord.shippingAddress || '').includes('มารับเอง')
                                ? 'มารับเองที่ บช.ตชด.'
                                : 'จัดส่งทางไปรษณีย์'}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 align-top space-y-1">
                          {ord.items.map((item, iIdx) => (
                            <div key={iIdx} className="text-[#29222E]">
                              <span className="font-bold text-[#14100A]">
                                [{item.productCode}]
                              </span>{' '}
                              {item.productName} × {item.quantity}
                              {item.selectedNumbers &&
                                item.selectedNumbers.length > 0 && (
                                  <span className="ml-1.5 inline-block px-2 py-0.5 rounded bg-[#14100A] text-[#FCE694] font-tabular font-bold text-[11px]">
                                    เลขที่เลือก:{' '}
                                    {item.selectedNumbers
                                      .map((n) => `#${String(n).padStart(2, '0')}`)
                                      .join(', ')}
                                  </span>
                                )}
                            </div>
                          ))}
                        </td>

                        <td className="p-3.5 text-right align-top">
                          <p className="font-tabular text-sm font-bold text-[#14100A]">
                            ฿{ord.grandTotal.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#77717C]">
                            (
                            {ord.grandTotalThaiText ||
                              numberToThaiBahtText(ord.grandTotal)}
                            )
                          </p>
                        </td>

                        <td className="p-3.5 align-top">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              ord.paymentStatus === 'verified_paid'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : ord.paymentStatus === 'payment_rejected'
                                ? 'bg-red-100 text-red-900 border border-red-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {ord.paymentStatus === 'verified_paid'
                              ? 'ชำระเงินยืนยันแล้ว'
                              : ord.paymentStatus === 'payment_rejected'
                              ? 'ยกเลิกใบจอง (ปล่อยเลขแล้ว)'
                              : 'รอตรวจสอบการชำระเงิน'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right align-top">
                          <button
                            type="button"
                            onClick={() => handleOpenOrderModal(ord)}
                            className="px-3 py-1.5 bg-[#14100A] text-[#F7F2E8] rounded-lg font-semibold hover:bg-[#8A6D2F]"
                          >
                            อัปเดตสถานะ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder && (
                <div
                  role="dialog"
                  aria-modal="true"
                  className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                >
                  <form
                    onSubmit={handleUpdateOrderStatus}
                    className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl max-w-lg w-full p-6 space-y-4"
                  >
                    <h3 className="font-serif-heritage text-lg font-bold text-[#14100A] border-b border-[#E8E2D5] pb-3">
                      อัปเดตสถานะใบจอง: {selectedOrder.orderNumber}
                    </h3>

                    <div className="text-xs space-y-1 bg-[#F7F2E8] p-3 rounded-xl">
                      <p>
                        <strong>ผู้จอง:</strong> {selectedOrder.customerName} (
                        {selectedOrder.organization || 'ประชาชนทั่วไป'})
                      </p>
                      <p>
                        <strong>เบอร์โทรศัพท์:</strong>{' '}
                        {selectedOrder.customerPhone}
                      </p>
                      <p>
                        <strong>วิธีการรับพระ:</strong>{' '}
                        {selectedOrder.deliveryMethod === 'pickup_bpp' ||
                        (selectedOrder.shippingAddress || '').includes('มารับเอง')
                          ? 'มารับเองที่ บช.ตชด.'
                          : 'จัดส่งทางไปรษณีย์'}
                      </p>
                      <p>
                        <strong>สถานที่รับ / ที่อยู่จัดส่ง:</strong>{' '}
                        {selectedOrder.shippingAddress || '-'}
                      </p>
                      <p>
                        <strong>ยอดรวม:</strong> ฿
                        {selectedOrder.grandTotal.toLocaleString()} บาท
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1">
                          1. สถานะการชำระเงิน
                        </label>
                        <select
                          value={orderPaymentStatus}
                          onChange={(e) =>
                            setOrderPaymentStatus(
                              e.target.value as PaymentStatus
                            )
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                        >
                          <option value="pending_verification">
                            รอตรวจสอบยอดชำระเงิน
                          </option>
                          <option value="verified_paid">
                            ชำระเงินแล้ว (ยืนยันยอดเรียบร้อย)
                          </option>
                          <option value="payment_rejected">
                            ยกเลิกใบจอง / ไม่ชำระภายในกำหนด (คืนสต็อก & ปล่อยเลข 1–99)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          2. สถานะการจัดเตรียมวัตถุมงคล
                        </label>
                        <select
                          value={orderPrepStatus}
                          onChange={(e) =>
                            setOrderPrepStatus(
                              e.target.value as PreparationStatus
                            )
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                        >
                          <option value="awaiting_payment">
                            รอยืนยันการชำระเงิน
                          </option>
                          <option value="inspecting_artifact">
                            กำลังคัดตรวจองค์พระและตอกหมายเลข
                          </option>
                          <option value="packed_ready">
                            บรรจุกล่องพร้อมส่งมอบ
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          3. สถานะการจัดส่ง
                        </label>
                        <select
                          value={orderShippingStatus}
                          onChange={(e) =>
                            setOrderShippingStatus(
                              e.target.value as ShippingStatus
                            )
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                        >
                          <option value="not_shipped">ยังไม่จัดส่ง</option>
                          <option value="in_transit">อยู่ระหว่างจัดส่ง</option>
                          <option value="delivered">ส่งมอบเรียบร้อยแล้ว</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          เลขพัสดุไปรษณีย์ (ถ้ามี)
                        </label>
                        <input
                          type="text"
                          value={orderTrackingNumber}
                          onChange={(e) =>
                            setOrderTrackingNumber(e.target.value)
                          }
                          placeholder="เช่น EMS TH-88492019TH"
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg font-tabular"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">
                          บันทึกหมายเหตุผู้ดูแล
                        </label>
                        <input
                          type="text"
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          placeholder="ระบุหมายเหตุการตรวจสอบ"
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E8E2D5] flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 border border-[#E8E2D5] rounded-lg text-xs font-medium"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#14100A] text-[#FCE694] rounded-lg text-xs font-bold hover:bg-[#8A6D2F]"
                      >
                        บันทึกสถานะใบจอง
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 1-99 RAJA SET NUMBER RESERVATION TABLE & GRID */}
          {activeTab === 'raja_slots' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-heritage text-lg font-bold text-[#14100A]">
                    ตารางหมายเลข 1–99 ชุดทองคำใหญ่ราชาฤกษ์ (ช1 · 349,999 บาท)
                  </h2>
                  <p className="text-xs text-[#77717C]">
                    ตรวจสอบว่าใครจองหมายเลขไหน พร้อมเลขที่ใบจอง หน่วยงาน เบอร์โทรศัพท์ และปุ่มปล่อยเลขว่าง
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: 'ทั้งหมด (99 เลข)' },
                    { id: 'booked', label: 'เฉพาะเลขที่มีผู้จอง/กำลังเลือก' },
                    { id: 'available', label: 'เฉพาะเลขว่าง' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setSlotFilter(f.id as 'all' | 'booked' | 'available')
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        slotFilter === f.id
                          ? 'bg-[#14100A] text-[#FCE694] border-[#14100A]'
                          : 'bg-[#FFFFFF] text-[#14100A] border-[#E8E2D5]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      downloadCsvFile(
                        generateRajaSlotsCsv(
                          dashboardData.rajaSlots,
                          dashboardData.orders
                        ),
                        `bpp75-raja-slots-1-99-${new Date()
                          .toISOString()
                          .slice(0, 10)}.csv`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-[#14100A] text-[#FCE694] text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export ตารางเลข 1–99 (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Detailed 1-99 Table */}
              <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F2E8] border-b border-[#E8E2D5] text-[#14100A] font-semibold">
                      <th className="p-3">หมายเลขชุด</th>
                      <th className="p-3">สถานะหมายเลข</th>
                      <th className="p-3">เลขที่ใบจอง</th>
                      <th className="p-3">ชื่อผู้จอง</th>
                      <th className="p-3">หน่วยงาน</th>
                      <th className="p-3">เบอร์โทรศัพท์</th>
                      <th className="p-3">สถานะชำระเงิน</th>
                      <th className="p-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {filteredRajaSlots.map((slot) => {
                      const isBooked = slot.status === 'booked';
                      const isHeld =
                        slot.status === 'held' && slot.heldUntil > Date.now();

                      return (
                        <tr
                          key={slot.slotNumber}
                          className={
                            isBooked
                              ? 'bg-amber-50/70'
                              : isHeld
                              ? 'bg-orange-50/60'
                              : 'hover:bg-[#F7F2E8]/40'
                          }
                        >
                          <td className="p-3 font-tabular font-bold text-sm text-[#14100A]">
                            #{String(slot.slotNumber).padStart(2, '0')}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isBooked
                                  ? 'bg-red-100 text-red-900 border border-red-300'
                                  : isHeld
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}
                            >
                              {isBooked
                                ? 'ถูกจองแล้ว'
                                : isHeld
                                ? 'กำลังเลือก (ล็อก 15 นาที)'
                                : 'ว่าง'}
                            </span>
                          </td>
                          <td className="p-3 font-tabular font-semibold text-[#14100A]">
                            {slot.orderNumber || '-'}
                          </td>
                          <td className="p-3 font-bold text-[#14100A]">
                            {slot.customerName || '-'}
                          </td>
                          <td className="p-3 text-[#5A5244]">
                            {slot.organization || '-'}
                          </td>
                          <td className="p-3 font-tabular text-[#5A5244]">
                            {slot.customerPhone || '-'}
                          </td>
                          <td className="p-3">
                            {slot.paymentStatus === 'verified_paid' ? (
                              <span className="font-bold text-emerald-800">
                                ชำระเงินแล้ว
                              </span>
                            ) : slot.paymentStatus ===
                              'pending_verification' ? (
                              <span className="font-bold text-amber-800">
                                รอตรวจสอบชำระเงิน
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {(isBooked || isHeld) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleReleaseRajaSlot(slot.slotNumber)
                                }
                                className="px-2.5 py-1 rounded bg-red-50 border border-red-300 text-red-800 text-[11px] font-semibold hover:bg-red-100 inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>ปล่อยเลขว่าง</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STOCK OF EACH OF THE 23 CODES */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif-heritage text-lg font-bold text-[#14100A]">
                    ตารางสต็อกคงเหลือของแต่ละรหัส ({dashboardData.products.length} รหัส)
                  </h2>
                  <p className="text-xs text-[#77717C]">
                    ชุดพิเศษ (ช1–ช3) และหมวดที่ 1–4 (ชศ1–ชศ20) · รายการ &ldquo;ตามจอง&rdquo; ไม่จำกัดสต็อก ส่วนรายการจำกัดจำนวนตัดสต็อกตามยอดจองจริง
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadCsvFile(
                        generateStockCsv(dashboardData.products),
                        `bpp75-stock-23-codes-${new Date()
                          .toISOString()
                          .slice(0, 10)}.csv`
                      )
                    }
                    className="px-4 py-2 bg-[#14100A] text-[#FCE694] text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export สต็อกคงเหลือ (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        code: `ชศ${dashboardData.products.length + 1}`,
                        name: '',
                        series: 'สมเด็จพิทักษ์แผ่นดิน ๗๕ ปี ตชด.',
                        yearBE: 2569,
                        category: 'cat_1_popular_metal',
                        categoryLabel: 'หมวด 1 สมเด็จพิทักษ์แผ่นดิน พิมพ์นิยม',
                        price: 999,
                        stock: 100,
                        isMadeToOrder: false,
                        material: 'เนื้อโลหะมงคล',
                        dimensions: '2.3 × 3.7 × 2.5 ซม.',
                        condition: 'สภาพสมบูรณ์พร้อมกล่องเดิม',
                        certificateInfo: 'ตอกโค้ดและหมายเลขกำกับ',
                        purposeSummary: 'สมทบทุนกองทุนสวัสดิการและโรงเรียน ตชด.',
                        description: '',
                        isFeatured: false,
                        isVisible: true,
                        specimenStyle: 'bronze_oval',
                      })
                    }
                    className="px-4 py-2 bg-[#8A6D2F] text-[#FFFFFF] text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มรหัสใหม่</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F2E8] border-b border-[#E8E2D5] text-[#14100A] font-semibold">
                      <th className="p-3.5">รหัส</th>
                      <th className="p-3.5">หมวดหมู่</th>
                      <th className="p-3.5">ชื่อรายการวัตถุมงคล</th>
                      <th className="p-3.5 text-right">ราคาบูชา (บาท)</th>
                      <th className="p-3.5 text-center">จำนวนจัดสร้าง</th>
                      <th className="p-3.5 text-center">จองแล้ว</th>
                      <th className="p-3.5 text-right">สต็อกคงเหลือ</th>
                      <th className="p-3.5 text-center">สถานะ</th>
                      <th className="p-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {dashboardData.products.map((prod) => {
                      const outOfStock = !prod.isMadeToOrder && prod.stock <= 0;
                      return (
                        <tr key={prod.id} className="hover:bg-[#F7F2E8]/40">
                          <td className="p-3.5 font-tabular font-bold text-sm text-[#14100A]">
                            {prod.code}
                          </td>
                          <td className="p-3.5 text-[#5A5244]">
                            {prod.categoryLabel}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-[#14100A]">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-[#77717C]">
                              {prod.material}
                            </p>
                          </td>
                          <td className="p-3.5 text-right font-tabular font-bold text-[#14100A]">
                            ฿{prod.price.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center font-tabular">
                            {prod.isMadeToOrder
                              ? 'ตามจอง'
                              : (prod.initialStock ?? prod.stock).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center font-tabular font-semibold text-[#8A6D2F]">
                            {(prod.bookedCount ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right font-tabular font-bold text-sm">
                            {prod.isMadeToOrder ? (
                              <span className="text-emerald-800">
                                ตามจอง (ไม่จำกัด)
                              </span>
                            ) : outOfStock ? (
                              <span className="text-red-700">0 (หมด)</span>
                            ) : (
                              <span className="text-[#14100A]">
                                {prod.stock.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                outOfStock
                                  ? 'bg-red-100 text-red-800'
                                  : prod.isMadeToOrder
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {outOfStock
                                ? 'หมด'
                                : prod.isMadeToOrder
                                ? 'เปิดรับตามจอง'
                                : 'พร้อมจอง'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(prod)}
                              className="px-2.5 py-1 bg-[#F7F2E8] border border-[#E8E2D5] rounded text-[#14100A] font-semibold hover:bg-[#EFE7D6]"
                            >
                              แก้ไขสต็อก
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProductVisibility(prod)
                              }
                              className="p-1 text-[#8A6D2F] hover:text-[#14100A]"
                              title="ซ่อน/แสดงผล"
                            >
                              {prod.isVisible ? (
                                <Eye className="w-4 h-4 inline" />
                              ) : (
                                <EyeOff className="w-4 h-4 inline text-[#77717C]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              aria-label={`ลบ ${prod.name}`}
                              className="p-1 text-[#77717C] hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add/Edit Product Modal */}
              {editingProduct && (
                <div
                  role="dialog"
                  aria-modal="true"
                  className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
                >
                  <form
                    onSubmit={handleSaveProduct}
                    className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8"
                  >
                    <h3 className="font-serif-heritage text-lg font-bold text-[#14100A] border-b border-[#E8E2D5] pb-3">
                      {editingProduct.id
                        ? `แก้ไขข้อมูล/สต็อก: ${editingProduct.code} ${editingProduct.name}`
                        : 'เพิ่มรหัสวัตถุมงคลใหม่'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-medium mb-1">
                          รหัสใบจอง *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.code || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              code: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg font-tabular"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-medium mb-1">
                          ชื่อรายการวัตถุมงคล *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct.name || ''}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block font-medium mb-1">
                          ราคาบูชา (บาท) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={editingProduct.price || 0}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg font-tabular"
                        />
                      </div>
                      <div>
                        <label className="block font-medium mb-1">
                          สต็อกคงเหลือ *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={editingProduct.stock ?? 0}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              stock: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg font-tabular"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.isMadeToOrder)}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                isMadeToOrder: e.target.checked,
                              })
                            }
                          />
                          <span>เปิดรับ &ldquo;ตามจอง&rdquo; (ไม่จำกัดสต็อก)</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8E2D5] flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 border border-[#E8E2D5] rounded-lg text-xs font-medium"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#14100A] text-[#FCE694] rounded-lg text-xs font-bold hover:bg-[#8A6D2F]"
                      >
                        บันทึกข้อมูล
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SITE CONFIG & PAYMENT CHANNELS */}
          {activeTab === 'content' && configDraft && (
            <form
              onSubmit={handleSaveSiteConfig}
              className="bg-[#FFFFFF] border border-[#E8E2D5] rounded-xl p-6 space-y-5 text-xs"
            >
              <h2 className="font-serif-heritage text-lg font-bold text-[#14100A] border-b border-[#E8E2D5] pb-3">
                ตั้งค่าข้อมูลหน่วยรับจองและบัญชีธนาคาร
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    ชื่อธนาคารรับโอน
                  </label>
                  <input
                    type="text"
                    value={configDraft.paymentChannels.bankName}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        paymentChannels: {
                          ...configDraft.paymentChannels,
                          bankName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    ชื่อบัญชีรับโอน
                  </label>
                  <input
                    type="text"
                    value={configDraft.paymentChannels.accountName}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        paymentChannels: {
                          ...configDraft.paymentChannels,
                          accountName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-[#E8E2D5] rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#14100A] text-[#FCE694] rounded-xl font-bold"
              >
                บันทึกการตั้งค่า
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};
