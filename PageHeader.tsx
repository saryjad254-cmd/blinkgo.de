import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { OnlineToggle } from '@/components/driver/OnlineToggle';
import { OrderActions } from '@/components/driver/OrderActions';
import { Truck, MapPin, DollarSign, Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getDriverData() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [statusRes, activeRes, completedRes] = await Promise.all([
    supabase.from('driver_status').select('*').eq('driver_id', user.id).single(),
    supabase
      .from('orders')
      .select('*, restaurants(name, address)')
      .eq('driver_id', user.id)
      .in('status', ['assigned', 'picked_up', 'delivering'])
      .order('created_at', { ascending: true })
      .limit(1),
    supabase
      .from('orders')
      .select('total, created_at, delivered_at')
      .eq('driver_id', user.id)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false })
      .limit(50),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDeliveries = (completedRes.data ?? []).filter(
    (o: any) => new Date(o.delivered_at ?? o.created_at) >= today
  );
  const todayEarnings = todayDeliveries.reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);

  return {
    isOnline: statusRes.data?.is_online ?? false,
    activeOrder: (activeRes.data?.[0] as Order) ?? null,
    todayCount: todayDeliveries.length,
    todayEarnings,
  };
}

export default async function DriverDashboard() {
  await requireRole('driver');
  const data = await getDriverData();
  if (!data) return null;

  return (
    <>
      <PageHeader title="لوحة السائق" subtitle="مرحبًا، جاهز للتوصيل؟" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Online Toggle */}
        <OnlineToggle initialOnline={data.isOnline} />

        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <Truck className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500">توصيلات اليوم</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.todayCount}</p>
          </div>
          <div className="card text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500">أرباح اليوم</p>
            <p className="text-2xl font-bold text-brand mt-1">
              {data.todayEarnings.toFixed(0)} <span className="text-sm">ر.س</span>
            </p>
          </div>
        </div>

        {/* Active order */}
        {data.activeOrder ? (
          <Link
            href={`/driver/orders/${data.activeOrder.id}`}
            className="block card border-2 border-brand hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-brand">طلب نشط</span>
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">
              {data.activeOrder.restaurants?.name ?? 'مطعم'}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{data.activeOrder.restaurants?.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>الحالة: {data.activeOrder.status}</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="card text-center text-gray-500 text-sm py-8">
            {data.isOnline
              ? 'في انتظار طلب جديد...'
              : 'فعّل الاتصال لتبدأ باستقبال الطلبات'}
          </div>
        )}
      </div>
    </>
  );
}