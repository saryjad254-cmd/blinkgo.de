import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { RestaurantCard } from '@/components/customer/RestaurantCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Store } from 'lucide-react';
import type { Restaurant } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getRestaurants(query?: string): Promise<Restaurant[]> {
  const supabase = createServerClient();
  let q = supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(50);

  if (query) {
    q = q.ilike('name', `%${query}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error('getRestaurants:', error);
    return [];
  }
  return (data ?? []) as Restaurant[];
}

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireRole('customer');
  const restaurants = await getRestaurants(searchParams.q);

  return (
    <>
      <PageHeader
        title="المطاعم"
        subtitle={`${restaurants.length} مطعم متاح`}
      />

      {/* Search bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form className="relative">
            <input
              type="search"
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="ابحث عن مطعم..."
              className="input pr-10"
            />
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {restaurants.length === 0 ? (
          <EmptyState
            icon={Store}
            title="لا توجد مطاعم"
            description="جرب تعديل البحث أو تحقق لاحقًا"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {restaurants.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}