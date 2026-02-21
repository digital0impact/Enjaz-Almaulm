-- التحقق من جاهزية ربط متجر سلة بـ Supabase
-- شغّل في Supabase → SQL Editor

-- 1) وجود الجداول المطلوبة للويب هوك
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') AS subscriptions_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') AS user_profiles_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS users_exists;

-- 2) عدد المستخدمين الذين يمكن ربط الطلب بهم (بريد أو جوال غير فارغ في user_profiles و users)
SELECT
  (SELECT COUNT(*) FROM public.user_profiles WHERE email IS NOT NULL AND trim(email) != '') AS profiles_with_email,
  (SELECT COUNT(*) FROM public.user_profiles WHERE phone_number IS NOT NULL AND trim(phone_number) != '') AS profiles_with_phone,
  (SELECT COUNT(*) FROM public.users WHERE phone_number IS NOT NULL AND trim(phone_number) != '') AS users_with_phone;

-- 3) عدد سجلات الاشتراكات الحالية (للاطلاع)
SELECT COUNT(*) AS subscriptions_count FROM public.subscriptions WHERE status = 'active';

-- 4) عينة من آخر 5 اشتراكات (للتأكد من أن البيانات تُسجّل)
SELECT id, user_id, plan_type, status, end_date, transaction_id, created_at
FROM public.subscriptions
ORDER BY created_at DESC
LIMIT 5;
