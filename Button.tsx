import { DollarSign, TrendingUp, Calendar, Truck } from 'lucide-react';
import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/PageHeader';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getEarnings() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('id, total, delivered_at, created_at')
    .eq('driver_id', user.id)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })
    .limit(200);

  if (error || !data) return { today: 0, week: 0, month: 0, total: 0, count: 0, recent: [] };

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  let today = 0, week = 0, month = 0, total = 0;
  for (const o of data as any[]) {
    const date = new Date(o.delivered_at ?? o.created_at);
    const amt = Number(o.total ?? 0);
    total += amt;
    if (date >= startOfDay) today += amt;
    if (date >= startOfWeek) week += amt;
    if (date >= startOfMonth) month += amt;
  }

  return {
    today,
    week,
    month,
    total,
    count: data.length,
    recent: (data as any[]).slice(0, 10),
  };
}

export default async function DriverEarningsPage() {
  await requireRole('driver');
  const e = await getEarnings();
  if (!e) return null;

  return (
    <>
      <PageHeader title="الأرباح" subtitle="ملخص دخل السائق" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Hero: today */}
        <div className="card bg-gradient-to-br from-brand to-orange-600 text-white">
          <div className="flex items-center gap-2 text-orange-100 text-sm">
            <DollarSign className="w-4 h-4" />
            أرباح اليوم
          </div>
          <p className="text-5xl font-bold mt-2">{e.today.toFixed(2)}</p>
          <p className="text-sm text-orange-100 mt-1">ريال سعودي</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              هذا الأسبوع
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {e.week.toFixed(0)} <span className="text-sm">ر.س</span>
            </p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-3.5 h-3.5" />
              هذا الشهر
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {e.month.toFixed(0)} <span className="text-sm">ر.س</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Truck className="w-3.5 h-3.5" />
              إجمالي التوصيلات
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{e.count}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <DollarSign className="w-3.5 h-3.5" />
              إجمالي الأرباح
            </div>
            <p className="text-2xl font-bold text-brand mt-2">
              {e.total.toFixed(0)} <span className="text-sm">ر.س</span>
            </p>
          </div>
        </div>

        {/* Recent deliveries */}
        {e.recent.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">آخر التوصيلات</h3>
            <div className="space-y-2 text-sm">
              {e.recent.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-gray-900 font-medium">
                      {Number(o.total).toFixed(2)} ر.س
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(o.delivered_at ?? o.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <span className="badge-success">✓ تم</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}