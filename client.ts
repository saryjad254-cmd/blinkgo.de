import Link from 'next/link';
import { ChevronLeft, MapPin, DollarSign } from 'lucide-react';
import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AcceptOrderButton } from '@/components/driver/AcceptOrderButton';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getAvailableOrders(): Promise<Order[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`*, restaurants(name, address, latitude, longitude)`)
    .eq('status', 'ready')
    .is('driver_id', null)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('getAvailableOrders:', error);
    return [];
  }
  return (data ?? []) as Order[];
}

async function getDriverActiveOrders(): Promise<Order[]> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`*, restaurants(name, address)`)
    .eq('driver_id', user.id)
    .in('status', ['assigned', 'picked_up', 'delivering'])
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []) as Order[];
}

export default async function DriverOrdersPage() {
  await requireRole('driver');
  const [available, active] = await Promise.all([
    getAvailableOrders(),
    getDriverActiveOrders(),
  ]);

  return (
    <>
      <PageHeader title="الطلبات" subtitle={`${available.length} متاح • ${active.length} نشط`} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Active orders */}
        {active.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-700 mb-3">طلباتي النشطة</h2>
            <div className="space-y-3">
              {active.map((order) => (
                <ActiveOrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* Available orders */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">طلبات متاحة</h2>
          {available.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="لا توجد طلبات متاحة الآن"
              description="ستظهر هنا الطلبات الجاهزة للاستلام"
            />
          ) : (
            <div className="space-y-3">
              {available.map((order) => (
                <AvailableOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/driver/orders/${order.id}`}
      className="block card border-2 border-brand hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500" dir="ltr">#{order.order_number}</span>
        <StatusBadge status={order.status} />
      </div>
      <h3 className="font-bold text-gray-900">{order.restaurants?.name ?? 'مطعم'}</h3>
      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        {order.restaurants?.address}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">اضغط للتفاصيل</span>
        <ChevronLeft className="w-4 h-4 text-gray-400" />
      </div>
    </Link>
  );
}

function AvailableOrderCard({ order }: { order: Order }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500" dir="ltr">#{order.order_number}</span>
        <span className="badge bg-orange-100 text-orange-800">جاهز</span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{order.restaurants?.name ?? 'مطعم'}</h3>
      <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-3">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        {order.restaurants?.address}
      </p>

      {typeof order.delivery_address === 'object' && (
        <div className="bg-gray-50 rounded-lg p-2 mb-3">
          <p className="text-xs text-gray-500 mb-1">التوصيل إلى:</p>
          <p className="text-sm text-gray-800">
            {(order.delivery_address as any).address ?? '—'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-brand font-bold">
          <DollarSign className="w-4 h-4" />
          <span>{Number(order.total).toFixed(2)} ر.س</span>
        </div>
        <AcceptOrderButton orderId={order.id} />
      </div>
    </div>
  );
}