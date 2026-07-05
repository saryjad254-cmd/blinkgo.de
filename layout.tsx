import { requireRole } from '@/lib/rbac';
import { AdminLayout } from '@/components/AdminLayout';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getAnalytics() {
  const supabase = createServerClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [ordersRes, byStatusRes, topRestaurantsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('status')
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('orders')
      .select('restaurant_id, total, restaurants(name)')
      .eq('status', 'delivered')
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(500),
  ]);

  return {
    orders: ordersRes.data ?? [],
    byStatus: byStatusRes.data ?? [],
    topRestaurants: topRestaurantsRes.data ?? [],
  };
}

export default async function AnalyticsPage() {
  const user = await requireRole('admin');
  const { orders, byStatus, topRestaurants } = await getAnalytics();

  // تجميع الطلبات حسب اليوم
  const byDay = new Map<string, { count: number; revenue: number }>();
  for (const o of orders as any[]) {
    const day = new Date(o.created_at).toISOString().split('T')[0];
    const prev = byDay.get(day) ?? { count: 0, revenue: 0 };
    byDay.set(day, {
      count: prev.count + 1,
      revenue: prev.revenue + Number(o.total ?? 0),
    });
  }
  const daily = Array.from(byDay.entries()).sort();

  // تجميع حسب الحالة
  const statusCounts: Record<string, number> = {};
  for (const o of byStatus as any[]) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  // أفضل المطاعم
  const restaurantRevenue = new Map<string, { name: string; revenue: number; orders: number }>();
  for (const o of topRestaurants as any[]) {
    const id = o.restaurant_id;
    const prev = restaurantRevenue.get(id) ?? {
      name: o.restaurants?.name ?? 'Unknown',
      revenue: 0,
      orders: 0,
    };
    restaurantRevenue.set(id, {
      name: prev.name,
      revenue: prev.revenue + Number(o.total ?? 0),
      orders: prev.orders + 1,
    });
  }
  const topR = Array.from(restaurantRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalRevenue = (orders as any[]).reduce((s, o) => s + Number(o.total ?? 0), 0);

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحليلات</h1>
          <p className="text-gray-600 mt-1">آخر 7 أيام</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600">إجمالي الطلبات</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
            <p className="text-3xl font-bold text-brand mt-2">{totalRevenue.toFixed(2)} ر.س</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">متوسط قيمة الطلب</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0'} ر.س
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">الطلبات اليومية</h2>
          <div className="space-y-2">
            {daily.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد طلبات في آخر 7 أيام</p>
            ) : (
              daily.map(([day, data]) => (
                <div key={day} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-600">{day}</span>
                  <div className="flex gap-4">
                    <span className="font-medium">{data.count} طلب</span>
                    <span className="font-medium text-brand">{data.revenue.toFixed(2)} ر.س</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">توزيع الحالات</h2>
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <StatusBadge status={status} />
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">أفضل المطاعم</h2>
            <div className="space-y-2">
              {topR.length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد بيانات</p>
              ) : (
                topR.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-900">{i + 1}. {r.name}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-gray-500">{r.orders} طلب</span>
                      <span className="font-bold text-brand">{r.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'قيد الانتظار', cls: 'badge bg-gray-100 text-gray-800' },
    confirmed: { label: 'مؤكد', cls: 'badge-info' },
    preparing: { label: 'قيد التحضير', cls: 'badge-warning' },
    ready: { label: 'جاهز', cls: 'badge-info' },
    assigned: { label: 'تم التعيين', cls: 'badge-info' },
    picked_up: { label: 'تم الاستلام', cls: 'badge-warning' },
    delivering: { label: 'قيد التوصيل', cls: 'badge-warning' },
    delivered: { label: 'مُسلَّم', cls: 'badge-success' },
    cancelled: { label: 'ملغي', cls: 'badge-danger' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge' };
  return <span className={cls}>{label}</span>;
}