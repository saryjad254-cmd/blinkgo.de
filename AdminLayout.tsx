'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, MapPin } from 'lucide-react';
import { useCart } from '@/lib/cart-store';
import { createBrowserClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

export default function CartPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const clearCart = useCart((s) => s.clear);
  const tip = useCart((s) => s.tip);
  const setTip = useCart((s) => s.setTip);
  const notes = useCart((s) => s.notes);
  const setNotes = useCart((s) => s.setNotes);

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = 5;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + deliveryFee + serviceFee + tip;

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="السلة" back />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <EmptyState
            icon={ShoppingBag}
            title="السلة فارغة"
            description="ابدأ بتصفح المطاعم وإضافة منتجات للسلة"
            action={
              <Link href="/restaurants" className="btn-primary">
                تصفح المطاعم
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const restaurantName = items[0]?.restaurant_name ?? 'مطعم';

  async function handleCheckout() {
    if (!address.trim()) {
      setError('الرجاء إدخال عنوان التوصيل');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // جهّز العناصر
      const itemsPayload = items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_price: i.product_price,
        quantity: i.quantity,
      }));

      const { data, error: rpcError } = await supabase.rpc('create_order_with_items', {
        p_restaurant_id: items[0].restaurant_id,
        p_items: itemsPayload,
        p_delivery_address: { address, notes },
        p_payment_method: paymentMethod,
        p_delivery_instructions: notes || null,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error('فشل إنشاء الطلب');

      clearCart();
      router.push(`/orders/${data.order_id}`);
    } catch (err: any) {
      setError(err.message ?? 'فشل إنشاء الطلب');
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="السلة" subtitle={restaurantName} back />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    🍽️
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {item.product_name}
                </h4>
                <p className="text-sm text-gray-500">
                  {item.product_price.toFixed(2)} ر.س
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  aria-label="إنقاص"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  aria-label="زيادة"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(item.product_id)}
                  className="w-8 h-8 rounded-full text-red-600 hover:bg-red-50 flex items-center justify-center ml-1"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery address */}
        <div className="card mb-4">
          <label className="label flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" />
            عنوان التوصيل
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="مثال: شارع الملك فهد، الرياض"
            className="input min-h-[80px]"
          />
          <label className="label mt-3">ملاحظات (اختياري)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات للسائق..."
            className="input min-h-[60px]"
          />
        </div>

        {/* Tip */}
        <div className="card mb-4">
          <label className="label">البقشيش</label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 5, 10, 15].map((amount) => (
              <button
                key={amount}
                onClick={() => setTip(amount)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  tip === amount
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {amount} ر.س
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="card mb-4">
          <label className="label">طريقة الدفع</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-brand bg-orange-50 text-brand'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              💵 نقدي
            </button>
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`p-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                paymentMethod === 'stripe'
                  ? 'border-brand bg-orange-50 text-brand'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              💳 بطاقة
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="card mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">المجموع الفرعي</span>
            <span className="font-medium">{subtotal.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">رسوم التوصيل</span>
            <span className="font-medium">{deliveryFee.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">رسوم الخدمة</span>
            <span className="font-medium">{serviceFee.toFixed(2)} ر.س</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">البقشيش</span>
              <span className="font-medium">{tip.toFixed(2)} ر.س</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-base">
            <span className="font-bold text-gray-900">الإجمالي</span>
            <span className="font-bold text-brand">{total.toFixed(2)} ر.س</span>
          </div>
        </div>

        {/* Confirm button */}
        <div className="fixed bottom-20 md:bottom-6 inset-x-0 px-4 z-20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleCheckout}
              disabled={submitting || !address.trim()}
              className="btn-primary w-full text-base py-3 shadow-lg"
            >
              {submitting ? 'جارٍ إنشاء الطلب...' : `تأكيد الطلب • ${total.toFixed(2)} ر.س`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}