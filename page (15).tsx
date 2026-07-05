import { requireRole } from '@/lib/rbac';
import { AdminLayout } from '@/components/AdminLayout';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getRestaurants() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, address, cuisine, rating, review_count, is_active, delivery_fee, estimated_delivery_time')
    .order('rating', { ascending: false })
    .limit(100);
  if (error) {
    console.error('getRestaurants failed:', error);
    return [];
  }
  return data ?? [];
}

export default async function RestaurantsPage() {
  const user = await requireRole('admin');
  const restaurants = await getRestaurants();

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المطاعم</h1>
          <p className="text-gray-600 mt-1">{restaurants.length} مطعم</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.length === 0 ? (
            <div className="col-span-full card text-center text-gray-500">
              لا يوجد مطاعم بعد
            </div>
          ) : (
            restaurants.map((r: any) => (
              <div key={r.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900">{r.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{r.address}</p>
                  </div>
                  {r.is_active ? (
                    <span className="badge-success">نشط</span>
                  ) : (
                    <span className="badge-danger">معطل</span>
                  )}
                </div>

                {r.cuisine && r.cuisine.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.cuisine.slice(0, 3).map((c: string) => (
                      <span key={c} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">التقييم</p>
                    <p className="font-bold text-gray-900">⭐ {Number(r.rating ?? 0).toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">التقييمات</p>
                    <p className="font-bold text-gray-900">{r.review_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">التوصيل</p>
                    <p className="font-bold text-gray-900">{r.delivery_fee ?? 0} ر.س</p>
                  </div>
                </div>

                {r.estimated_delivery_time && (
                  <p className="text-xs text-gray-500 text-center">
                    ⏱ {r.estimated_delivery_time}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}