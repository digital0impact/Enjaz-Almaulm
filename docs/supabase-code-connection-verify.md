# التحقق من اتصال الجداول بين الكود و Supabase (تطبيق إنjaz المعلم)

تم فحص كل الجداول التي يستدعيها الكود ومقارنتها بجدول Supabase الفعلي.

---

## ملخص سريع

| الجدول | في Supabase | أعمدة الكود ↔ القاعدة | ملاحظات |
|--------|-------------|-------------------------|----------|
| user_profiles | ✅ | ✅ متطابقة | |
| users | ✅ | ✅ متطابقة | |
| performance_data | ✅ | ✅ متطابقة | |
| alerts | ✅ | ✅ متطابقة | |
| comments | ✅ | ✅ متطابقة | |
| account_deletion_requests | ✅ | ✅ متطابقة | |
| subscriptions | ✅ | ✅ متطابقة | |
| subscription_prices | ✅ | ✅ متطابقة | |
| file_attachments | ✅ | ✅ تم التصحيح | كان الكود يستخدم `userid` و`file_type`؛ تم توحيدها مع `user_id` و`mime_type` |
| backups | ✅ | ✅ متطابقة | |

---

## تفاصيل كل جدول

### 1) user_profiles
- **الملف:** `DatabaseService.ts`
- **Supabase:** جدول `public.user_profiles` (id uuid, name, email, phone_number, job_title, work_location, created_at, updated_at)
- **الكود:** يستخدم نفس الأسماء مع تحويل camelCase → snake_case (مثل `phoneNumber` → `phone_number`)
- **الحالة:** ✅ متطابق

### 2) users
- **الملف:** `DatabaseService.ts`
- **Supabase:** جدول `public.users` (id text, email, name, role, subscriptionPlan, createdAt, updatedAt, isDisabled, phone_number)
- **الكود:** upsert بـ id, email, name, phone_number, updatedAt
- **الحالة:** ✅ متطابق

### 3) performance_data
- **الملف:** `DatabaseService.ts`
- **Supabase:** userid (uuid), axis_id, axis_title, evidences (jsonb), score, created_at, updated_at
- **الكود:** userid, axis_id, axis_title, evidences, score
- **الحالة:** ✅ متطابق

### 4) alerts
- **الملف:** `DatabaseService.ts`
- **Supabase:** userid, title, description, date, time, is_active, created_at, updated_at
- **الكود:** userid, title, description, date, time, is_active
- **الحالة:** ✅ متطابق

### 5) comments
- **الملف:** `DatabaseService.ts`
- **Supabase:** userid, title, content, date, created_at, updated_at
- **الكود:** استدعاء حذف بـ .eq('userid', userId)
- **الحالة:** ✅ متطابق

### 6) account_deletion_requests
- **الملف:** `DatabaseService.ts`
- **Supabase:** userid, reason, status, requested_at
- **الكود:** insert بـ userid, reason, status, requested_at
- **الحالة:** ✅ متطابق

### 7) subscriptions
- **الملف:** `SubscriptionService.ts`, `supabase/functions/store-subscription-webhook/index.ts`
- **Supabase:** user_id, plan_type, start_date, end_date, status, price, transaction_id, purchase_verified, created_at, updated_at
- **الكود:** select بـ user_id؛ insert بنفس الأعمدة
- **الحالة:** ✅ متطابق

### 8) subscription_prices
- **الملف:** `PriceManagementService.ts`
- **Supabase:** plan_type, price, currency, localized_price, is_active, created_at, updated_at
- **الكود:** select, update, insert بنفس الأعمدة
- **الحالة:** ✅ متطابق

### 9) file_attachments
- **الملف:** `StorageService.ts`
- **Supabase:** user_id (uuid), file_name, file_path, file_size, mime_type, bucket_name, created_at, updated_at (لا يوجد related_table ولا related_id)
- **الكود:** كان يستخدم `userid` و`file_type` و related_table/related_id — تم التصحيح لاستخدام `user_id` و`mime_type` وإزالة الأعمدة غير الموجودة؛ getRelatedFiles يعتمد على user_id ومسار الملف
- **الحالة:** ✅ تم التصحيح ومتطابق

### 10) backups
- **الملف:** `BackupService.ts`
- **Supabase:** user_id, file_path, backup_type, file_count, total_size, expires_at, status, metadata, created_at
- **الكود:** insert و select بنفس الأعمدة
- **الحالة:** ✅ متطابق

---

## ملاحظة عن التخزين (Storage)

- الكود يستخدم **Storage** (ليس الجداول) عبر `supabase.storage.from('attachments')` لرفع الملفات. اسم الـ bucket هو `attachments` ويجب أن يكون معرّفاً في Supabase → Storage.

---

## خلاصة

جميع الجداول المستخدمة في تطبيق إنjaz المعلم **موجودة في Supabase** ومطابقة للأعمدة بعد تصحيح **file_attachments** في `StorageService.ts` (user_id بدل userid، mime_type بدل file_type، وإزالة related_table/related_id من الـ insert).
