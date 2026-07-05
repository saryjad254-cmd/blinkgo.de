import { notFound } from 'next/navigation';
import { MapPin, Phone, Navigation, DollarSign } from 'lucide-react';
import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/PageHeader';
import { OrderActions } from '@/components/driver/OrderActions';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Order, OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getOrder(id: string) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: order, error } = await supabase
    .from('orders')
    .select(`*, restaurants(name, address, phone, latitude, longitude)`)
    .eq('id', id)
    .or(`driver_id.eq.${user.id},driver_id.is.null`)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

export default async function DriverOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole('driver');
  const data = await getOrder(params.id);
  if (!data) notFound();

  const { order, items } = data;

  return (
    <>
      <PageHeader
        title={`طلب #${order.order_number}`}
        subtitle={order.restaurants?.name ?? 'مطعم'}
        back
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4 pb-32">
        {/* Status & total */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">الحالة الحالية</p>
            <div className="mt-1">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500">المبلغ</p>
            <p className="text-2xl font-bold text-brand mt-1">
              {Number(order.total).toFixed(2)} <span className="text-sm">ر.س</span>
            </p>
          </div>
        </div>

        {/* Pickup (restaurant) */}
        <div className="card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-brand flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">استلام من</p>
              <h3 className="font-bold text-gray-900 mt-0.5">
                {order.restaurants?.name ?? 'المطعم'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {order.restaurants?.address}
              </p>
              {order.restaurants?.phone && (
                <a
                  href={`tel:${order.restaurants.phone}`}
                  className="inline-flex items-center gap-1 text-sm text-brand mt-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  اتصل بالمطعم
                </a>
              )}
            </div>
            {order.restaurants?.latitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${order.restaurants.latitude},${order.restaurants.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-brand text-white"
                aria-label="فتح في الخرائط"
              >
                <Navigation className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Delivery */}
        {typeof order.delivery_address === 'object' && (
          <div className="card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">التوصيل إلى</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {(order.delivery_address as any).address ?? '—'}
                </p>
                {order.delivery_instructions && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded p-2">
                    ملاحظات: {order.delivery_instructions}
                  </p>
                )}
              </div>
              {order.customer_latitude && order.customer_longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude},${order.customer_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-green-600 text-white"
                  aria-label="فتح في الخرائط"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3">العناصر ({items.length})</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  <span className="font-medium">{item.quantity}×</span> {item.product_name}
                </span>
                <span className="text-gray-600">{Number(item.subtotal).toFixed(2)} ر.س</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        {order.driver_id && (
          <div className="fixed bottom-20 md:bottom-6 inset-x-0 px-4 z-20">
            <div className="max-w-2xl mx-auto">
              <OrderActions orderId={order.id} currentStatus={order.status} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}