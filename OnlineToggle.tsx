import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Star, Clock, Truck, ShoppingCart } from 'lucide-react';
import { requireRole } from '@/lib/rbac';
import { createServerClient } from '@/lib/supabase/server';
import { AddToCartButton } from '@/components/customer/AddToCartButton';
import { PageHeader } from '@/components/shared/PageHeader';
import type { Restaurant, Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getRestaurant(id: string): Promise<Restaurant | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as Restaurant;
}

async function getProducts(restaurantId: string): Promise<Product[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_available', true)
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true });

  if (error) return [];
  return (data ?? []) as Product[];
}

export default async function RestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  await requireRole('customer');
  const restaurant = await getRestaurant(params.id);
  if (!restaurant) notFound();

  const products = await getProducts(params.id);

  // تجميع حسب الفئة
  const categories = Array.from(
    new Set(products.map((p) => p.category_id).filter(Boolean))
  );

  return (
    <>
      <PageHeader title={restaurant.name} subtitle={restaurant.address} back />

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-orange-100 to-orange-50 -mt-px">
        {restaurant.cover_url ? (
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-sm text-gray-600 mb-3">{restaurant.description}</p>
          )}
          {restaurant.cuisine?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {restaurant.cuisine.map((c) => (
                <span
                  key={c}
                  className="text-xs bg-orange-50 text-brand px-2.5 py-1 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-gray-100">
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {Number(restaurant.rating || 0).toFixed(1)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{restaurant.review_count} تقييم</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                <Clock className="w-4 h-4 text-gray-400" />
                {restaurant.estimated_delivery_time}
              </div>
              <p className="text-xs text-gray-500 mt-1">وقت التوصيل</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                <Truck className="w-4 h-4 text-gray-400" />
                {restaurant.delivery_fee} ر.س
              </div>
              <p className="text-xs text-gray-500 mt-1">رسوم التوصيل</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4 pb-24">
          <h2 className="text-lg font-bold text-gray-900 mb-2">القائمة</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              لا توجد منتجات متاحة حاليًا
            </div>
          ) : (
            products.map((product) => (
              <ProductRow key={product.id} product={product} restaurant={restaurant} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function ProductRow({ product, restaurant }: { product: Product; restaurant: Restaurant }) {
  const price = Number(product.discount_price ?? product.price);
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
      {/* Image */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍽️
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-base font-bold text-gray-900">
              {price.toFixed(2)} ر.س
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through mr-2">
                {Number(product.price).toFixed(2)}
              </span>
            )}
          </div>
          <AddToCartButton product={product} restaurant={restaurant} />
        </div>
      </div>
    </div>
  );
}