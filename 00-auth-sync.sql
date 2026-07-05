# BlinkGo — Full Stack Food Delivery Platform

> منصة توصيل طعام كاملة مع واجهات للزبون، السائق، والمدير.
> جاهزة للنشر على Vercel من أول ثانية.

## 🎯 نظرة سريعة

| الواجهة | الـ Path | الدور |
|---|---|---|
| 🌐 صفحة الهبوط | `/` | الكل |
| 🔐 تسجيل الدخول | `/login` | الكل |
| 👤 لوحة الزبون | `/restaurants`, `/cart`, `/orders` | `customer` |
| 🚗 لوحة السائق | `/driver/dashboard`, `/driver/orders`, `/driver/earnings` | `driver` |
| ⚙️ لوحة الإدارة | `/dashboard`, `/users`, `/restaurants`, `/drivers`, `/analytics` | `admin` |

## 📦 البنية الكاملة

```
.
├── web/                                ← Next.js 14 (مجلد النشر)
│   ├── app/
│   │   ├── layout.tsx                  ← Root layout (Cairo font + RTL)
│   │   ├── page.tsx                    ← Landing + توجيه ذكي حسب الدور
│   │   ├── globals.css                 ← Tailwind + ستايل مخصص
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          ← تسجيل الدخول (يتعرف على الأدوار)
│   │   ├── (admin)/                    ← محمي بـ requireRole('admin')
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx      ← لوحة التحكم + إحصائيات
│   │   │   ├── users/page.tsx          ← إدارة المستخدمين
│   │   │   ├── restaurants/page.tsx    ← إدارة المطاعم
│   │   │   ├── drivers/page.tsx        ← إدارة السائقين + موقعهم
│   │   │   └── analytics/page.tsx      ← تحليلات 7 أيام
│   │   ├── (customer)/                 ← محمي بـ requireRole('customer')
│   │   │   ├── layout.tsx
│   │   │   ├── restaurants/page.tsx    ← تصفح المطاعم
│   │   │   ├── restaurants/[id]/       ← قائمة المنتجات + Add to Cart
│   │   │   ├── cart/page.tsx           ← السلة + Checkout
│   │   │   ├── orders/page.tsx         ← طلباتي
│   │   │   └── orders/[id]/page.tsx    ← تتبع مباشر (6 مراحل)
│   │   ├── (driver)/                   ← محمي بـ requireRole('driver')
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx      ← Online toggle + إحصائيات
│   │   │   ├── orders/page.tsx         ← متاحة + نشطة
│   │   │   ├── orders/[id]/page.tsx    ← تفاصيل + تحديث الحالة + Maps
│   │   │   └── earnings/page.tsx       ← الأرباح (يوم/أسبوع/شهر)
│   │   └── api/health/route.ts         ← health check
│   ├── components/
│   │   ├── QueryProvider.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── customer/
│   │   │   ├── CustomerNav.tsx
│   │   │   ├── RestaurantCard.tsx
│   │   │   ├── AddToCartButton.tsx
│   │   │   └── OrderTracker.tsx
│   │   ├── driver/
│   │   │   ├── DriverNav.tsx
│   │   │   ├── OnlineToggle.tsx
│   │   │   ├── AcceptOrderButton.tsx
│   │   │   └── OrderActions.tsx
│   │   ├── shared/
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── EmptyState.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   ├── hooks/
│   │   └── useAdmin.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               ← @supabase/ssr browser client
│   │   │   ├── server.ts               ← @supabase/ssr server + admin
│   │   │   └── middleware.ts
│   │   ├── cart-store.ts               ← Zustand store (persistent)
│   │   ├── rbac.ts                     ← requireRole, getCurrentUser
│   │   └── types.ts                    ← TypeScript types
│   ├── middleware.ts                   ← حماية الراوتات
│   ├── .env.example
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── next-env.d.ts
│
├── deploy/supabase/                    ← SQL migrations
│   ├── 00-auth-sync.sql                ← Triggers لمزامنة auth.users
│   ├── 01-rls-fixes.sql                ← 31 RLS Policy
│   ├── 02-aggregations.sql             ← Triggers للتجميع التلقائي
│   ├── 03-helpers.sql                  ← 4 RPC functions
│   └── README.md
│
├── .gitignore
├── env.example
├── package.json                        ← root (workspaces: ["web"])
├── vercel.json                         ← monorepo config
└── README.md                           ← أنت هنا
```

## 🚀 النشر على Vercel (5 دقائق)

### 1) شغّل الـ SQL migrations على Supabase

بالتـرتيب، في **Supabase SQL Editor**:

```bash
deploy/supabase/00-auth-sync.sql      ← 3 Triggers + إصلاح auth_role()
deploy/supabase/01-rls-fixes.sql      ← 31 RLS Policy
deploy/supabase/02-aggregations.sql   ← 4 Triggers تلقائية
deploy/supabase/03-helpers.sql        ← 4 RPC functions
```

### 2) أنشئ حسابات تجريبية

```bash
# في SQL Editor أو عبر Supabase Dashboard → Authentication → Users
# أنشئ 4 مستخدمين يدويًا (أو استخدم Supabase Admin API):
#   - admin@blinkgo.com      → role=admin
#   - demo@blinkgo.com       → role=customer
#   - driver@blinkgo.com     → role=driver
#   - restaurant@blinkgo.com → role=restaurant
#
# ثم في Table Editor → users → حدد الـ role لكل واحد.
```

### 3) ارفع على GitHub

```bash
git init
git add .
git commit -m "Initial BlinkGo deploy"
git branch -M main
git remote add origin https://github.com/saryjad254/blinkgo.git
git push -u origin main
```

### 4) أنشئ مشروع Vercel

1. https://vercel.com/new → Import `blinkgo`
2. **Configure Project**:
   - Framework Preset: **Next.js** (تلقائي)
   - Root Directory: **`web`** ⚠️ (ضروري للـ monorepo)
   - Build Command: `npm run build`
   - Install Command: `npm install`
3. **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL      = https://rhdaffhlrglyknxtucux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <من Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY     = <من Supabase Dashboard>
NEXT_PUBLIC_APP_URL           = https://your-app.vercel.app
NEXT_TELEMETRY_DISABLED       = 1
```

4. اضغط **Deploy** → خلال دقيقتين رابط عام جاهز

## 🧪 التجربة المحلية

```bash
# 1. ثبّت
npm install

# 2. Env
cp web/.env.example web/.env.local
# ضع القيم الحقيقية

# 3. شغّل
npm run dev
# → http://localhost:3000

# 4. حسابات تجريبية
# admin@blinkgo.com    → يدخل /dashboard
# demo@blinkgo.com     → يدخل /restaurants
# driver@blinkgo.com   → يدخل /driver/dashboard
```

## 🎯 سيناريو اختبار كامل

```
1. سجّل دخول كـ customer (demo@blinkgo.com)
   → /restaurants → تصفّح → "مطعم البرجر الذهبي"
   → اختر "برجر كلاسيك" + "كولا" → أضف للسلة
   → /cart → أدخل العنوان → "تأكيد الطلب"
   → /orders/[id] → شاهد التتبع المباشر

2. سجّل خروج، ثم دخول كـ driver (driver@blinkgo.com)
   → /driver/dashboard → فعّل "متصل"
   → /driver/orders → اضغط "قبول" على الطلب
   → /driver/orders/[id] → "استلمت" → "بدأت التوصيل" → "تم التسليم"
   → /driver/earnings → شاهد الأرباح زادت

3. سجّل دخول كـ admin (admin@blinkgo.com)
   → /dashboard → شاهد الإحصائيات الحيّة
   → /analytics → تحليلات 7 أيام
```

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---|---|
| Next.js 14 (App Router) | إطار العمل |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| @supabase/ssr | Auth + SSR cookies |
| @supabase/supabase-js | Database client |
| @tanstack/react-query | Data fetching + caching |
| Zustand | Cart state (with persist) |
| lucide-react | Icons |
| Zod | Validation (optional) |

## 📡 Backend APIs (Supabase RPC)

| الدالة | الوصف |
|---|---|
| `create_order_with_items` | ينشئ طلب مع العناصر في transaction |
| `update_order_status` | يحدّث الحالة مع التحقق من الصلاحيات |
| `find_nearby_drivers` | يجد السائقين القريبين (Haversine) |
| `get_admin_stats` | إحصائيات لوحة الإدارة |

## 🔐 الأدوار والصلاحيات

| الدور | الراوتات المسموحة |
|---|---|
| `customer` | `/restaurants`, `/cart`, `/orders/*` |
| `driver` | `/driver/*` |
| `admin` | `/dashboard`, `/users`, `/restaurants`, `/drivers`, `/analytics` |
| `restaurant` | (يحتاج تطوير) |

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `Cannot find module 'next'` | Root Directory = `web` في Vercel |
| `permission denied for table users` | شغّل `01-rls-fixes.sql` |
| Cart فارغة بعد التحديث | امسح localStorage (`blinkgo-cart`) |
| `Invalid API key` | تحقق من env vars |
| Driver لا يرى طلبات | تأكد من role='driver' في users table |
| Realtime بطيء | استخدم Supabase channel بدلاً من polling |

## 📄 الترخيص

Private — جميع الحقوق محفوظة لـ BlinkGo.