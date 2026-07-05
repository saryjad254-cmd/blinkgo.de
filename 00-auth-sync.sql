# BlinkGo — Web Admin (Next.js 14)

> لوحة الإدارة لـ BlinkGo MVP — جاهزة للنشر على Vercel.

## 📋 المتطلبات

- Node.js >= 18.18
- حساب Supabase (المشروع: `rhdaffhlrglyknxtucux`)
- حساب Vercel (مجاني)

## 🚀 النشر على Vercel (5 دقائق)

### 1. ارفع على GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/blinkgo.git
git push -u origin main
```

### 2. أنشئ مشروع على Vercel

1. اذهب إلى https://vercel.com/new
2. Import الـ repo من GitHub
3. في **Configure Project**:
   - Framework Preset: **Next.js** (تلقائي)
   - Root Directory: **`web`** ⚠️ (مهم للـ monorepo)
   - Build Command: `npm run build` (تلقائي)
   - Install Command: `npm install` (تلقائي)

### 3. أضف Environment Variables

في **Project Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL = https://rhdaffhlrglyknxtucux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <من Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY = <من Supabase Dashboard>
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
NEXT_TELEMETRY_DISABLED = 1
```

### 4. Deploy

اضغط **Deploy**. خلال دقيقتين تحصل على رابط مثل `https://blinkgo-xxx.vercel.app`.

## 🔑 حساب الأدمن التجريبي

```
Email:    admin@blinkgo.com
Password: DemoAdmin!2024
```

## 🧪 اختبر بعد النشر

```bash
# Health check
curl https://your-app.vercel.app/api/health

# يفترض يرجع: {"status":"ok","service":"blinkgo-web",...}
```

## 📁 هيكل المشروع

```
.
├── web/                    # Next.js 14 admin app
│   ├── app/
│   │   ├── (auth)/login/   # صفحة تسجيل الدخول
│   │   ├── (admin)/        # الراوتات المحمية
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── restaurants/
│   │   │   ├── drivers/
│   │   │   └── analytics/
│   │   ├── api/health/
│   │   ├── layout.tsx
│   │   ├── page.tsx        # الصفحة الرئيسية
│   │   └── globals.css
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase/
│   │   └── rbac.ts
│   ├── public/
│   ├── .env.example
│   ├── middleware.ts
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── deploy/supabase/        # SQL migrations (تُشغّل على Supabase)
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

## 🛠️ التطوير المحلي

```bash
# 1. ثبّت الاعتماديات
npm install

# 2. انسخ env
cp web/.env.example web/.env.local
# عدّل القيم بمفاتيحك الفعلية

# 3. شغّل
npm run dev
# → http://localhost:3000
```

## ⚠️ استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `Cannot find module 'next'` | تأكد Root Directory = `web` في Vercel |
| `Invalid API key` | تحقق من env vars في Vercel Dashboard |
| `permission denied for table users` | نفّذ `01-rls-fixes.sql` على Supabase |
| Build fails with Tailwind errors | تأكد من `tailwind.config.js` و `postcss.config.js` |
| Login يعمل لكن Dashboard فارغ | نفّذ `02-aggregations.sql` و `03-helpers.sql` |

## 📄 الترخيص

Private — جميع الحقوق محفوظة.