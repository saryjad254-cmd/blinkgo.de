import { requireRole } from '@/lib/rbac';
import { AdminLayout } from '@/components/AdminLayout';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getStats() {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_admin_stats');
  if (error) {
    console.error('get_admin_stats failed:', error);
    return null;
  }
  return data;
}

export default async function DashboardPage() {
  const user = await requireRole('admin');
  const stats = await getStats();

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">نظرة عامة على النظام</p>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="إجمالي المستخدمين" value={stats.total_users} />
              <StatCard title="العملاء" value={stats.total_customers} color="blue" />
              <StatCard title="السائقون" value={stats.total_drivers} color="purple" />
              <StatCard title="المطاعم النشطة" value={stats.active_restaurants} color="green" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="إجمالي الطلبات" value={stats.total_orders} />
              <StatCard title="طلبات اليوم" value={stats.orders_today} color="blue" />
              <StatCard title="قيد التجهيز" value={stats.orders_pending} color="yellow" />
              <StatCard title="قيد التوصيل" value={stats.orders_delivering} color="purple" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RevenueCard title="إيرادات اليوم" value={stats.revenue_today} />
              <RevenueCard title="إجمالي الإيرادات" value={stats.revenue_total} />
              <StatCard title="السائقون المتصلون" value={stats.online_drivers} color="green" />
            </div>
          </>
        ) : (
          <div className="card text-center text-gray-500">
            تعذّر تحميل الإحصائيات. تأكد من تشغيل دالة <code>get_admin_stats()</code> على قاعدة البيانات.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  color = 'gray',
}: {
  title: string;
  value: number | string;
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-900',
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    yellow: 'bg-yellow-50 text-yellow-900',
    purple: 'bg-purple-50 text-purple-900',
  };

  return (
    <div className="card">
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <div className={`inline-block px-3 py-1 rounded-lg text-2xl font-bold ${colors[color]}`}>
        {value}
      </div>
    </div>
  );
}

function RevenueCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <p className="text-2xl font-bold text-brand">
        {typeof value === 'number' ? `${value.toFixed(2)} ر.س` : value}
      </p>
    </div>
  );
}