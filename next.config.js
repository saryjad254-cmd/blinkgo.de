import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // غير مسجل — يعرض landing page
    return <Landing />;
  }

  // مسجل — وجلب الدور لتوجيهه
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  switch (userData?.role) {
    case 'admin':
      redirect('/dashboard');
    case 'customer':
      redirect('/restaurants');
    case 'driver':
      redirect('/driver/dashboard');
    case 'restaurant':
      redirect('/login?error=restaurant_not_implemented');
    default:
      redirect('/login');
  }
}

import Link from 'next/link';
import { ChefHat, ArrowLeft } from 'lucide-react';

function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand text-white shadow-lg mb-4">
            <ChefHat className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BlinkGo</h1>
          <p className="text-gray-600">منصة توصيل الطعام</p>
        </div>

        <div className="card space-y-3">
          <Link href="/login" className="btn-primary w-full">
            <ArrowLeft className="w-4 h-4 ml-2" />
            تسجيل الدخول
          </Link>
          <p className="text-xs text-center text-gray-500">
            للزبائن، السائقين، والمديرين
          </p>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          © 2024 BlinkGo MVP
        </p>
      </div>
    </main>
  );
}