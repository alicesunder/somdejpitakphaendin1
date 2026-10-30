import React, { useEffect, useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';

interface VisitDay {
  day: string;
  visitors: number;
  views: number;
}
interface VisitStats {
  today: { visitors: number; views: number };
  total: { visitors: number; views: number };
  days: VisitDay[];
}

const nf = (n: number) => n.toLocaleString('th-TH');
const shortDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * Admin card: how many people visited the storefront. "คน" counts distinct browsers,
 * "ครั้ง" counts page loads. Last 14 days as a small bar chart.
 */
export const VisitStatsCard: React.FC<{ adminToken: string }> = ({ adminToken }) => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/visits', { headers: { Authorization: `Bearer ${adminToken}` } });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.today) {
        setError((data && data.error) || 'โหลดสถิติผู้เข้าชมไม่สำเร็จ');
        return;
      }
      setStats(data);
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const max = Math.max(1, ...(stats?.days.map((d) => d.visitors) ?? [1]));
  const week = stats?.days.slice(-7).reduce((a, d) => a + d.visitors, 0) ?? 0;

  return (
    <section className="rounded-2xl border border-[#E8E2D5] bg-white p-5 space-y-4" aria-labelledby="visit-stats-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="visit-stats-title" className="font-bold text-sm text-[#14100A] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#8A6D2F]" />
          ผู้เข้าชมเว็บไซต์
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="px-3 py-1.5 min-h-[36px] rounded-lg border border-[#C9A45C]/60 text-xs font-semibold text-[#14100A] inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-[#77717C]">วันนี้</p>
              <p className="font-tabular text-2xl font-bold text-[#14100A]">{nf(stats.today.visitors)} <span className="text-sm font-semibold">คน</span></p>
              <p className="text-[11px] text-[#77717C]">เปิดหน้าเว็บ {nf(stats.today.views)} ครั้ง</p>
            </div>
            <div>
              <p className="text-[11px] text-[#77717C]">7 วันล่าสุด</p>
              <p className="font-tabular text-2xl font-bold text-[#14100A]">{nf(week)} <span className="text-sm font-semibold">คน-วัน</span></p>
              <p className="text-[11px] text-[#77717C]">รวมผู้เข้าชมของแต่ละวัน</p>
            </div>
            <div>
              <p className="text-[11px] text-[#77717C]">ทั้งหมด</p>
              <p className="font-tabular text-2xl font-bold text-emerald-800">{nf(stats.total.visitors)} <span className="text-sm font-semibold">คน</span></p>
              <p className="text-[11px] text-[#77717C]">เปิดหน้าเว็บ {nf(stats.total.views)} ครั้ง</p>
            </div>
          </div>

          <div>
            <div className="flex items-end gap-1 h-24" role="img" aria-label="จำนวนผู้เข้าชม 14 วันล่าสุด">
              {stats.days.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${shortDay(d.day)}: ${nf(d.visitors)} คน · ${nf(d.views)} ครั้ง`}>
                  <span className="text-[9px] font-tabular text-[#5A5244] leading-none mb-0.5">{d.visitors || ''}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#B88928] to-[#F2CF6B]"
                    style={{ height: `${Math.max(d.visitors ? 6 : 2, (d.visitors / max) * 100)}%`, opacity: d.visitors ? 1 : 0.25 }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#77717C] mt-1">
              <span>{shortDay(stats.days[0].day)}</span>
              <span>วันนี้</span>
            </div>
          </div>
          <p className="text-[11px] text-[#77717C]">
            นับ 1 คนต่อ 1 อุปกรณ์/เบราว์เซอร์ต่อวัน ไม่เก็บข้อมูลส่วนบุคคล · ไม่นับการเข้าหน้าหลังบ้าน
          </p>
        </>
      )}
    </section>
  );
};
