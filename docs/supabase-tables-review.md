# مراجعة جداول Supabase لتطبيق إنjaz المعلم

مراجعة شاملة للجداول التي يستخدمها التطبيق ومقارنتها بما هو موجود في المستودع (سكربتات/هجرات).

---

## كيف أضيف الجداول التي لا توجد لها هجرات؟

تمت إضافة هجرة واحدة تشمل كل الجداول الأساسية الناقصة:

**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

**الجداول المُنشأة فيها:**  
`user_profiles`, `users`, `performance_data`, `alerts`, `comments`, `account_deletion_requests`

**طريقة التطبيق:**

1. **باستخدام Supabase CLI (مشروع مرتبط بـ Supabase):**
   ```bash
   supabase db push
   ```
   أو تشغيل الهجرات المعلقة:
   ```bash
   supabase migration up
   ```

2. **بدون CLI (تشغيل يدوي):**
   - افتح [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك → **SQL Editor**
   - انسخ محتوى الملف `supabase/migrations/20260221110000_create_core_tables.sql`
   - الصق في المحرر ثم اضغط **Run**

**ملاحظة:** إذا كانت بعض الجداول موجودة مسبقاً في مشروعك، استخدم `CREATE TABLE IF NOT EXISTS` (موجود في الهجرة) لتجنب أخطاء التكرار؛ السياسات تُعاد تعريفها مع `DROP POLICY IF EXISTS`.

---

## ملخص الجداول

| الجدول | مُعرّف في المستودع | الملف | مستخدم في الكود |
|--------|---------------------|-------|------------------|
| **subscriptions** | ✅ | `supabase/migrations/20260221100000_create_subscriptions_table.sql` و `scripts/create-subscriptions-table.sql` | SubscriptionService، store-subscription-webhook |
| **user_profiles** | ✅ | `supabase/migrations/20260221110000_create_core_tables.sql` | DatabaseService (ملف شخصي، رقم جوال) |
| **users** | ✅ | `supabase/migrations/20260221110000_create_core_tables.sql` | DatabaseService (مزامنة مع الملف الشخصي، رقم جوال للويب هوك) |
| **performance_data** | ✅ | `supabase/migrations/20260221110000_create_core_tables.sql` | DatabaseService (أداء، محاور، تقارير) |
| **alerts** | ✅ | `supabase/migrations/20260221110000_create_core_tables.sql` | DatabaseService |
| **comments** | ✅ | `supabase/migrations/20260221110000_create_core_tables.sql` | DatabaseService |
| **account_deletion_requests** | ✅ | `supabase/migrations/20260221110000_create_core_tables.sql` | DatabaseService |
| **file_attachments** | ✅ | `supabase/migrations/20260211085612_complete_storage_setup.sql` | StorageService، BackupService |
| **backups** | ✅ | `scripts/create-backup-table.sql` | BackupService |
| **subscription_prices** | ✅ | `scripts/setup-subscription-prices.sql` | PriceManagementService |
| **shared_achievements** | ✅ | `supabase/migrations/20260220000000_shared_achievements.sql` | share-achievements، share/[token] |
| **shared_achievement_comments** | ✅ | `supabase/migrations/20260220100000_shared_achievement_comments.sql` | share/[token] |

---

## تفاصيل حسب الجدول

### 1) subscriptions ✅
- **الهجرة:** `supabase/migrations/20260221100000_create_subscriptions_table.sql`
- **السكربت:** `scripts/create-subscriptions-table.sql` (نفس البنية تقريباً)
- **الأعمدة:** id, user_id (UUID → auth.users), plan_type, start_date, end_date, status, price, transaction_id, purchase_verified, created_at, updated_at
- **RLS:** SELECT/INSERT/UPDATE للمستخدم على صفوفه فقط. **ويب هوك المتجر يستخدم service_role** فلا يتأثر بـ RLS.
- **Realtime:** الجدول مضاف إلى `supabase_realtime` في السكربت (في `scripts/` فقط؛ في الهجرة أيضاً في نفس الملف إن وُجد).
- **ملاحظة:** تأكد من تشغيل أحد الملفين في Supabase (الهجرة أو السكربت) لإنشاء الجدول وRealtime.

### 2) user_profiles ✅
- **الهجرة:** `supabase/migrations/20260221110000_create_core_tables.sql`
- **الأعمدة:** id (UUID = auth.users.id), name, email, phone_number, job_title, work_location, created_at, updated_at
- **Trigger:** `on_auth_user_created` ينشئ سجلاً في user_profiles تلقائياً عند تسجيل مستخدم جديد في Auth.

### 3) users ✅
- **الهجرة:** `supabase/migrations/20260221110000_create_core_tables.sql`
- **الأعمدة:** id (TEXT), email, name, role, subscriptionPlan, createdAt, updatedAt, isDisabled, phone_number

### 4) performance_data ✅
- **الهجرة:** `supabase/migrations/20260221110000_create_core_tables.sql`
- **الأعمدة:** id, userid (UUID), axis_id, axis_title, evidences (JSONB), score, created_at, updated_at

### 5) alerts ✅
- **الهجرة:** `supabase/migrations/20260221110000_create_core_tables.sql`
- **الأعمدة:** id, userid, title, description, date, time, is_active, created_at, updated_at

### 6) comments ✅
- **الهجرة:** `supabase/migrations/20260221110000_create_core_tables.sql`
- **الأعمدة:** id, userid, title, content, date, created_at, updated_at

### 7) account_deletion_requests ✅
- **الهجرة:** `supabase/migrations/20260221110000_create_core_tables.sql`
- **الأعمدة:** id, userid, reason, status, requested_at

### 8) file_attachments ✅
- **الهجرة:** `supabase/migrations/20260211085612_complete_storage_setup.sql`
- **الأعمدة:** id, user_id, file_name, file_path, file_size, mime_type, bucket_name, created_at, updated_at

### 9) backups ✅
- **السكربت:** `scripts/create-backup-table.sql`
- **ملاحظة:** الـ trigger يستخدم `EXECUTE FUNCTION` (مناسب لـ PostgreSQL 13+). إن ظهر خطأ استخدم `EXECUTE PROCEDURE`.

### 10) subscription_prices ✅
- **السكربت:** `scripts/setup-subscription-prices.sql`
- **ملاحظة:** يستخدم `uuid_generate_v4()` — يتطلب تفعيل امتداد مثل `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` أو استبداله بـ `gen_random_uuid()`.

### 11) shared_achievements ✅
- **الهجرة:** `supabase/migrations/20260220000000_shared_achievements.sql`
- **ملاحظة:** الجدول بدون بادئة `public.` — في Supabase الـ default schema عادةً public فيعمل. للأمان يمكن استخدام `public.shared_achievements`.

### 12) shared_achievement_comments ✅
- **الهجرة:** `supabase/migrations/20260220100000_shared_achievement_comments.sql`

---

## سكربتات قديمة أو غير مستخدمة

- **scripts/setup-subscription-schema.sql**  
  ينشئ `user_subscriptions` و `subscription_prices` ببنية مختلفة. **التطبيق لا يستخدم `user_subscriptions`** بل يستخدم جدول **`subscriptions`**. لا تعتمد على هذا السكربت للاشتراكات الحالية؛ استخدم `create-subscriptions-table.sql` أو هجرة الاشتراكات.

---

## ترتيب التشغيل المقترح في Supabase

**عند استخدام Supabase CLI (`supabase db push` أو `supabase migration up`):**  
تُطبَّق الهجرات تلقائياً بالترتيب حسب التاريخ في اسم الملف.

**عند التشغيل اليدوي من SQL Editor (بنفس الترتيب):**

1. **Storage والملفات:**  
   `supabase/migrations/20260211085612_complete_storage_setup.sql`  
   (buckets + file_attachments + سياسات storage)

2. **مشاركة الإنجازات:**  
   `supabase/migrations/20260220000000_shared_achievements.sql`  
   ثم `supabase/migrations/20260220100000_shared_achievement_comments.sql`

3. **الاشتراكات:**  
   `supabase/migrations/20260221100000_create_subscriptions_table.sql`  
   أو `scripts/create-subscriptions-table.sql`  
   (جدول subscriptions + RLS + Realtime)

4. **جداول التطبيق الأساسية:**  
   `supabase/migrations/20260221110000_create_core_tables.sql`  
   (user_profiles، users، performance_data، alerts، comments، account_deletion_requests + Trigger لإنشاء الملف الشخصي عند التسجيل)

5. **النسخ الاحتياطية:**  
   `scripts/create-backup-table.sql`

6. **أسعار الاشتراكات (اختياري):**  
   `scripts/setup-subscription-prices.sql`  
   (إن لم يكن الجدول موجوداً؛ وتأكد من تطابق الأعمدة مع PriceManagementService)

---

## التحقق السريع

- من **Supabase → Table Editor** تأكد من وجود:  
  `subscriptions`, `user_profiles`, `users`, `performance_data`, `alerts`, `comments`, `account_deletion_requests`, `file_attachments`, `backups`, `subscription_prices`, `shared_achievements`, `shared_achievement_comments`.
- من **Database → Replication** تأكد أن جدول **subscriptions** مضاف إلى منشور Realtime حتى يصل تحديث الاشتراك فوراً بعد ويب هوك الدفع.
