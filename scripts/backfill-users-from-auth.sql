-- ملء جداول user_profiles و users من مستخدمي Authentication الموجودين
-- شغّل هذا السكربت مرة واحدة في Supabase → SQL Editor (بعد تطبيق هجرة الجداول الأساسية)
-- يتطلب تشغيله بحساب يقرأ من auth.users (مثل جلسة SQL Editor في لوحة Supabase)

-- 1) ملء user_profiles من auth.users
INSERT INTO public.user_profiles (id, name, email, phone_number, job_title, work_location)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1), 'المعلم'),
  COALESCE(u.email, ''),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'phone_number'), ''), ''),
  '',
  ''
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  name = COALESCE(NULLIF(TRIM(EXCLUDED.name), ''), public.user_profiles.name),
  email = COALESCE(EXCLUDED.email, public.user_profiles.email),
  phone_number = COALESCE(NULLIF(TRIM(EXCLUDED.phone_number), ''), public.user_profiles.phone_number),
  updated_at = NOW();

-- 2) ملء users من auth.users (لربط الجوال والويب هوك)
INSERT INTO public.users (id, email, name, "updatedAt", phone_number)
SELECT
  u.id::text,
  u.email,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1), 'المعلم'),
  NOW(),
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'phone_number'), ''), '')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, public.users.email),
  name = COALESCE(NULLIF(TRIM(EXCLUDED.name), ''), public.users.name),
  phone_number = COALESCE(NULLIF(TRIM(EXCLUDED.phone_number), ''), public.users.phone_number),
  "updatedAt" = NOW();

-- عرض عدد السجلات بعد الملء (للتحقق)
SELECT
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.user_profiles) AS user_profiles_count,
  (SELECT COUNT(*) FROM public.users) AS users_count;
