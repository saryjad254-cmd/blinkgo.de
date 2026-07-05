import { notFound } from 'next/navigation';
import { MapPin, Phone, Store as StoreIcon } from 'lucide-react';
import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { OrderTracker } from '@/components/customer/OrderTracker';
import type { Order, OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getOrder(id: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: order, error } = await supabase
    .from('orders')
    .select(`*, restaurants (name, phone, address)`)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  return {
    order: order as Order,
    items: (items ?? []) as OrderItem[],
  };
}

export default async function OrderTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole('customer');
  const data = await getOrder(params.id);
  if (!data) notFound();

  const { order, items } = data;

  return (
    <>
      <PageHeader
        title={`طلب #${order.order_number}`}
        subtitle={new Date(order.created_at).toLocaleString('ar-SA')}
        back
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Tracker */}
        <OrderTracker initialOrder={order} />

        {/* Driver info if assigned */}
        {order.driver_id && order.status !== 'delivered' && (
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                🚗
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">السائق في الطريق</p>
                <p className="text-xs text-gray-500">سيتم التسليم قريبًا</p>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant info */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-brand" />
            {order.restaurants?.name ?? 'المطعم'}
          </h3>
          {order.restaurants?.address && (
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
              {order.restaurants.address}
            </p>
          )}
          {order.restaurants?.phone && (
            <a
              href={`tel:${order.restaurants.phone}`}
              className="text-sm text-brand flex items-center gap-2 mt-2"
            >
              <Phone className="w-4 h-4" />
              {order.restaurants.phone}
            </a>
          )}
        </div>

        {/* Order items */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3">العناصر ({items.length})</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  <span className="font-medium">{item.quantity}×</span> {item.product_name}
                </span>
                <span className="font-bold text-gray-900">
                  {Number(item.subtotal).toFixed(2)} ر.س
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span>
              <span>{Number(order.subtotal).toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>التوصيل</span>
              <span>{Number(order.delivery_fee).toFixed(2)} ر.س</span>
            </div>
            {Number(order.tip) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>البقشيش</span>
                <span>{Number(order.tip).toFixed(2)} ر.س</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
              <span>الإجمالي</span>
              <span className="text-brand">{Number(order.total).toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        {typeof order.delivery_address === 'object' && order.delivery_address && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand" />
              عنوان التوصيل
            </h3>
            <p className="text-sm text-gray-700">
              {(order.delivery_address as any).address ?? '—'}
            </p>
            {order.delivery_instructions && (
              <p className="text-xs text-gray-500 mt-2">
                ملاحظات: {order.delivery_instructions}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}