-- إضافة اشتراك يدوياً لمستخدم حسب رقم الجوال (حل فوري إذا لم يظهر الاشتراك بعد الشراء)
-- شغّل في Supabase → SQL Editor. استبدل رقم الجوال ونوع الخطة ثم شغّل القسم المناسب.

-- ============================================================
-- الخطوة 1: البحث عن المستخدم برقم الجوال
-- ============================================================
-- استبدل 0512345678 برقم الجوال الذي اشتريت به (مثال: 0512345678 أو 966512345678)
-- المطابقة تعتمد على آخر 9 أرقام (5xxxxxxxx) لاستيعاب اختلاف كتابة 966 / 0

WITH target AS (
  SELECT right(regexp_replace('0512345678', '[^0-9]', '', 'g'), 9) AS last9
),
profiles_match AS (
  SELECT p.id
  FROM public.user_profiles p, target t
  WHERE p.phone_number IS NOT NULL AND p.phone_number != ''
    AND right(regexp_replace(p.phone_number, '[^0-9]', '', 'g'), 9) = t.last9
  LIMIT 1
),
users_match AS (
  SELECT u.id::uuid AS id
  FROM public.users u, target t
  WHERE u.phone_number IS NOT NULL AND u.phone_number != ''
    AND right(regexp_replace(u.phone_number, '[^0-9]', '', 'g'), 9) = t.last9
  LIMIT 1
)
(SELECT id AS user_id, 'user_profiles' AS source FROM profiles_match
UNION ALL
SELECT id, 'users' FROM users_match WHERE NOT EXISTS (SELECT 1 FROM profiles_match))
LIMIT 1;

-- انسخ قيمة user_id من النتيجة واستخدمها في الخطوة 2.

-- ============================================================
-- الخطوة 2: إدراج الاشتراك للمستخدم
-- ============================================================
-- استبدل:
--   YOUR_USER_UUID  →  قيمة id من الخطوة 1 (مثال: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
--   yearly          →  yearly أو half_yearly حسب ما اشتريته

/*
INSERT INTO public.subscriptions (user_id, plan_type, start_date, end_date, status, price, transaction_id, purchase_verified)
VALUES (
  'YOUR_USER_UUID'::uuid,
  'yearly',
  NOW(),
  NOW() + 365 * INTERVAL '1 day',
  'active',
  49.99,
  'manual-' || replace(gen_random_uuid()::text, '-', ''),
  true
);
*/

-- نسخة جاهزة للسنوي (فك التعليق واستبدل YOUR_USER_UUID فقط):
-- INSERT INTO public.subscriptions (user_id, plan_type, start_date, end_date, status, price, transaction_id, purchase_verified)
-- VALUES ('YOUR_USER_UUID'::uuid, 'yearly', NOW(), NOW() + 365 * INTERVAL '1 day', 'active', 49.99, 'manual-' || replace(gen_random_uuid()::text, '-', ''), true);

-- نسخة جاهزة للنصف سنوي (فك التعليق واستبدل YOUR_USER_UUID فقط):
-- INSERT INTO public.subscriptions (user_id, plan_type, start_date, end_date, status, price, transaction_id, purchase_verified)
-- VALUES ('YOUR_USER_UUID'::uuid, 'half_yearly', NOW(), NOW() + 180 * INTERVAL '1 day', 'active', 29.99, 'manual-' || replace(gen_random_uuid()::text, '-', ''), true);
