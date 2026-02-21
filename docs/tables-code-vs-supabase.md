# مقارنة الجداول: الكود مقابل Supabase

مراجعة الجداول المعرّفة في المستودع (هجرات + سكربتات) وما يُفترض أن يكون في Supabase بعد تطبيقها.

---

## كيف تقارن بنفسك

1. **شغّل في Supabase → SQL Editor** السكربت: **`scripts/list-supabase-tables.sql`**  
   يعطيك قائمة الجداول والأعمدة الموجودة فعلياً في مشروعك.
2. قارن النتيجة مع الجداول والأعمدة الموضحة أدناه (من الكود).

---

## ملخص مصدر كل جدول

| الجدول | في الهجرات (migrations) | في السكربتات فقط (scripts) | مستخدم في الكود |
|--------|--------------------------|-----------------------------|------------------|
| **subscriptions** | ✅ `20260221100000` | `create-subscriptions-table.sql` | SubscriptionService، store-subscription-webhook |
| **user_profiles** | ✅ `20260221110000` | — | DatabaseService، store-subscription-webhook |
| **users** | ✅ `20260221110000` | — | DatabaseService، store-subscription-webhook |
| **performance_data** | ✅ `20260221110000` | — | DatabaseService |
| **alerts** | ✅ `20260221110000` | — | DatabaseService |
| **comments** | ✅ `20260221110000` | — | DatabaseService |
| **account_deletion_requests** | ✅ `20260221110000` | — | DatabaseService |
| **file_attachments** | ✅ `20260211085612` | `complete-storage-setup.sql`, `fix-file-attachments.sql` | StorageService، BackupService |
| **backups** | ❌ | `create-backup-table.sql`, `create-backups-bucket.sql` | BackupService |
| **subscription_prices** | ❌ | `setup-subscription-prices.sql`, `setup-subscription-schema.sql` | PriceManagementService |
| **shared_achievements** | ✅ `20260220000000` | — | share-achievements، share/[token] |
| **shared_achievement_comments** | ✅ `20260220100000` | — | share/[token] |

**عرض (View):**  
- **user_profiles_with_subscription** معرّف في هجرة `20260221130000` (يجمع user_profiles + آخر اشتراك فعّال).

---

## إن كانت الجداول ناقصة في Supabase

- **إذا كنت تستخدم `supabase db push` أو `supabase migration up`:**  
  الجداول التي في **الهجرات فقط** ستُنشأ تلقائياً. الجداول **الموجودة في السكربتات فقط** (**backups**, **subscription_prices**) لن تُنشأ إلا إذا شغّلت السكربتات يدوياً في SQL Editor.
- **إذا كنت تشغّل SQL يدوياً:**  
  تأكد من تشغيل كل الهجرات بالترتيب (انظر `docs/supabase-tables-review.md`) ثم سكربتات **backups** و **subscription_prices** إن احتجتها.

---

## تعريفات الجداول من الكود (للمقارنة)

### 1) subscriptions  
**الملف:** `supabase/migrations/20260221100000_create_subscriptions_table.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| plan_type | TEXT | NOT NULL, CHECK (yearly, half_yearly, free) |
| start_date | TIMESTAMPTZ | NOT NULL |
| end_date | TIMESTAMPTZ | NOT NULL |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK (active, expired, cancelled) |
| price | NUMERIC | NOT NULL, DEFAULT 0 |
| transaction_id | TEXT | |
| purchase_verified | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 2) user_profiles  
**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL, DEFAULT '' |
| email | TEXT | NOT NULL, DEFAULT '' |
| phone_number | TEXT | NOT NULL, DEFAULT '' |
| job_title | TEXT | NOT NULL, DEFAULT '' |
| work_location | TEXT | NOT NULL, DEFAULT '' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 3) users  
**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | TEXT | PRIMARY KEY |
| email | TEXT | |
| name | TEXT | |
| role | TEXT | |
| subscriptionPlan | TEXT | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |
| isDisabled | BOOLEAN | DEFAULT false |
| phone_number | TEXT | NOT NULL, DEFAULT '' |

---

### 4) performance_data  
**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| userid | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| axis_id | TEXT | NOT NULL |
| axis_title | TEXT | NOT NULL |
| evidences | JSONB | NOT NULL, DEFAULT '[]' |
| score | NUMERIC | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 5) alerts  
**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| userid | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| description | TEXT | DEFAULT '' |
| date | TEXT | NOT NULL |
| time | TEXT | NOT NULL |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 6) comments  
**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| userid | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| title | TEXT | |
| content | TEXT | |
| date | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 7) account_deletion_requests  
**الملف:** `supabase/migrations/20260221110000_create_core_tables.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| userid | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| reason | TEXT | |
| status | TEXT | NOT NULL, DEFAULT 'pending' |
| requested_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

---

### 8) file_attachments  
**الملف:** `supabase/migrations/20260211085612_complete_storage_setup.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| user_id | UUID | REFERENCES auth.users(id) ON DELETE CASCADE |
| file_name | TEXT | NOT NULL |
| file_path | TEXT | NOT NULL |
| file_size | BIGINT | |
| mime_type | TEXT | |
| bucket_name | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 9) backups  
**الملف:** `scripts/create-backup-table.sql` أو `scripts/create-backups-bucket.sql`  
**ملاحظة:** لا يوجد هجرة لهذا الجدول؛ يجب تشغيل أحد السكربتين يدوياً.

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| user_id | UUID | REFERENCES auth.users(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| backup_type | TEXT | CHECK (manual, automatic), DEFAULT 'manual' |
| file_count | INTEGER | DEFAULT 0 |
| total_size | BIGINT | DEFAULT 0 |
| expires_at | TIMESTAMPTZ | |
| status | TEXT | CHECK (active, restored, expired), DEFAULT 'active' |
| metadata | JSONB | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

**تنبيه:** في `create-backup-table.sql` الـ trigger يستخدم `EXECUTE FUNCTION`؛ في إصدارات أقدم من PostgreSQL قد تحتاج استبداله بـ `EXECUTE PROCEDURE`.

---

### 10) subscription_prices  
**الملف:** `scripts/setup-subscription-prices.sql`  
**ملاحظة:** لا يوجد هجرة؛ يجب تشغيل السكربت يدوياً.

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| plan_type | VARCHAR(20) | NOT NULL, UNIQUE |
| price | DECIMAL(10,2) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'SAR' |
| localized_price | VARCHAR(50) | |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP |

**تنبيه:** `uuid_generate_v4()` يتطلب امتداداً مثل `uuid-ossp`. يمكن استبداله بـ `gen_random_uuid()` (متوفر افتراضياً في PostgreSQL 13+).

---

### 11) shared_achievements  
**الملف:** `supabase/migrations/20260220000000_shared_achievements.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| token | TEXT | NOT NULL, UNIQUE |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE |
| share_type | TEXT | NOT NULL, DEFAULT 'private', CHECK (public, private) |
| report_data | JSONB | NOT NULL, DEFAULT '{}' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

---

### 12) shared_achievement_comments  
**الملف:** `supabase/migrations/20260220100000_shared_achievement_comments.sql`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| token | TEXT | NOT NULL |
| author_name | TEXT | |
| comment_text | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

---

## فروقات وتعارضات داخل الكود

1. **جدول backups**  
   - معرّف في `scripts/create-backup-table.sql` و `scripts/create-backups-bucket.sql` ببنية متطابقة تقريباً.  
   - الـ trigger في `create-backup-table.sql` يستخدم `EXECUTE FUNCTION`؛ في `create-backups-bucket.sql` أيضاً `EXECUTE FUNCTION`. في بعض البيئات يُفضّل `EXECUTE PROCEDURE`.

2. **جدول subscription_prices**  
   - في `scripts/setup-subscription-prices.sql`: أعمدة مثل `plan_type`, `price`, `currency`, `localized_price`, `is_active`.  
   - في `scripts/setup-subscription-schema.sql`: بنية مختلفة ويملك أيضاً جدول `user_subscriptions` الذي **لا يستخدمه التطبيق** (التطبيق يستخدم جدول **subscriptions** فقط). لا تعتمد على `setup-subscription-schema.sql` للبنية الحالية.

3. **جدول file_attachments**  
   - معرّف في الهجرة `20260211085612_complete_storage_setup.sql` وفي `scripts/complete-storage-setup.sql` و `scripts/fix-file-attachments.sql`. البنية في الهجرة هي المرجع المعتمد.

4. **Schema صريح**  
   - معظم الهجرات تستخدم `public.` (مثل `public.user_profiles`).  
   - جداول `shared_achievements` و `shared_achievement_comments` في الهجرات بدون بادئة `public.`؛ في Supabase الـ default schema هو `public` فيعمل. للمراجعة يمكن التأكد من وجودها في `information_schema.tables` حيث `table_schema = 'public'`.

---

## تحقق سريع من Supabase

بعد تشغيل **`scripts/list-supabase-tables.sql`** راجع القسم الأخير من النتيجة (التحقق السريع). إذا ظهرت أي خانات **false** فالجداول المقابلة غير موجودة ويجب تطبيق الهجرة أو السكربت المناسب.

---

## الخلاصة

| الحالة | الجداول |
|--------|---------|
| **معرّفة في الهجرات فقط** (تطبق مع `db push`) | subscriptions, user_profiles, users, performance_data, alerts, comments, account_deletion_requests, file_attachments, shared_achievements, shared_achievement_comments |
| **معرّفة في السكربتات فقط** (تشغيل يدوي مطلوب) | backups, subscription_prices |
| **عرض (View)** | user_profiles_with_subscription |

لمقارنة الجداول الفعلية في Supabase مع الكود: شغّل `scripts/list-supabase-tables.sql` وقارن الأعمدة والنوع مع الجداول أعلاه.
