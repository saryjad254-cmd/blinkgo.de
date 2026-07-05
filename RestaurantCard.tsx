import Link from 'next/link';
import { ChevronLeft, Package } from 'lucide-react';
import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getOrders(): Promise<Order[]> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants (name, logo_url)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('getOrders:', error);
    return [];
  }
  return (data ?? []) as Order[];
}

export default async function OrdersPage() {
  await requireRole('customer');
  const orders = await getOrders();

  return (
    <>
      <PageHeader title="طلباتي" subtitle={`${orders.length} طلب`} back />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="لا توجد طلبات بعد"
            description="ابدأ بطلب وجبتك الأولى"
            action={
              <Link href="/restaurants" className="btn-primary">
                تصفح المطاعم
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500" dir="ltr">
          #{order.order_number}
        </span>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 truncate">
            {order.restaurants?.name ?? 'مطعم'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleString('ar-SA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <div className="text-left flex-shrink-0">
          <p className="font-bold text-gray-900">{Number(order.total).toFixed(2)} ر.س</p>
          <ChevronLeft className="w-4 h-4 text-gray-400 mt-1" />
        </div>
      </div>
    </Link>
  );
}