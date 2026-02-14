# ربط التطبيق بـ Supabase

## 1. إنشاء مشروع Supabase

1. ادخل إلى [Supabase](https://supabase.com) وأنشئ مشروعاً جديداً.
2. من **Project Settings** → **API** انسخ:
   - **Project URL** (مثل: `https://xxxx.supabase.co`)
   - **anon public** key

## 2. إعداد المتغيرات في التطبيق

1. انسخ الملف `.env.example` إلى `.env`:
   ```bash
   cp .env.example .env
   ```
2. عدّل ملف `.env` وضع القيم الحقيقية:
   ```env
   EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
   ```
3. لا ترفع ملف `.env` إلى Git (موجود في `.gitignore`).

## 3. التحقق من الاتصال

بعد إعداد `.env` يمكنك التأكد من أن الكود يتصل بـ Supabase:

```bash
npm run supabase:verify
```

أو مباشرة:

```bash
node scripts/verify-supabase-connection.js
```

- إذا ظهرت رسالة **"الكود متصل بـ Supabase بشكل صحيح"** فالاتصال والإعداد سليمان.
- إذا ظهر خطأ **"متغيرات البيئة غير موجودة"** فتحقق من وجود ملف `.env` وقيم `EXPO_PUBLIC_SUPABASE_URL` و `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- إذا ظهر خطأ من Supabase (مثلاً جدول غير موجود) فطبق السكربتات SQL من مجلد `scripts/` في Supabase → SQL Editor.

## 4. الجداول المُنشأة (تم تطبيقها على المشروع)

| الجدول | الوظيفة |
|--------|---------|
| `user_profiles` | الملف الشخصي للمعلم (مرتبط بـ `auth.users`) |
| `performance_data` | بيانات الأداء الوظيفي والمحاور والأدلة |
| `alerts` | تنبيهات المعلم |
| `comments` | تعليقات المعلم |
| `account_deletion_requests` | طلبات حذف الحساب |
| `backups` | سجل النسخ الاحتياطية |
| `subscriptions` | اشتراكات المستخدمين (سنوي / نصف سنوي / مجاني) |
| `subscription_prices` | أسعار الخطط (للعرض والإدارة) |

تم تفعيل **Row Level Security (RLS)** على كل الجداول بحيث كل مستخدم يصل فقط لبياناته.

## 5. المزامنة التلقائية

- عند **تسجيل مستخدم جديد** في Auth يتم إنشاء سجل تلقائي في `user_profiles` (Trigger: `on_auth_user_created`).

## 6. مكان الربط في الكود

- **الإعداد:** `config/supabase.ts` — إنشاء عميل Supabase مع AsyncStorage للجلسة.
- **المصادقة:** `services/AuthService.ts` — تسجيل الدخول، التسجيل، تسجيل الخروج.
- **البيانات:** `services/DatabaseService.ts` — الملف الشخصي، الأداء، التنبيهات، التعليقات، حذف الحساب.
- **الاشتراكات:** `services/SubscriptionService.ts` و `services/PriceManagementService.ts`.
- **النسخ الاحتياطي:** `services/BackupService.ts`.
- **الملفات:** `services/StorageService.ts` — جدول `file_attachments` و bucket الملفات.

## 7. التخزين (Storage)

إنشاء الـ buckets التالية من لوحة Supabase → Storage إذا احتجتها:

- `profile-images` — صور الملف الشخصي.
- `backups` — ملفات النسخ الاحتياطية (خاص بالمستخدم).

بعد هذا الإعداد يعمل التطبيق مع Supabase والجداول المُنشأة.
