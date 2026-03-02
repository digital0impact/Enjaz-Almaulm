-- ============================================================
-- إضافة اشتراك يدوياً لمعلم (مثلاً: اشترك سنوياً ولم يظهر في الجدول)
-- شغّل هذا الملف من Supabase: SQL Editor (يفضّل استخدام دور يمتلك صلاحيات الكتابة)
-- ============================================================

-- 1) العثور على المعلم: استخدم بريده أو رقم جواله (غيّر القيمة ثم شغّل الاستعلام)
-- اطبع النتيجة لتعرف user_id إذا أردت استخدامه في الخطوة 2
/*
SELECT id, name, email, phone_number
FROM public.users
WHERE email = 'البريد_الإلكتروني@example.com'
   OR phone_number = '05xxxxxxxx'
   OR name ILIKE '%اسم المعلم%';
*/

-- 2) إدراج اشتراك سنوي للمعلم
-- غيّر 'USER_ID_HERE' إلى الـ UUID الفعلي للمعلم (من الخطوة 1 أو من Authentication → Users في Supabase)
-- أو استخدم الاستعلام الفرعي في الأسفل للبحث بالجوال/البريد مباشرة

-- غيّر رقم الجوال في السطر التالي إلى رقم المعلم ثم شغّل الـ INSERT بالكامل:
INSERT INTO public.subscriptions (
  user_id,
  plan_type,
  start_date,
  end_date,
  status,
  price,
  transaction_id,
  purchase_verified
)
SELECT
  u.id::uuid,
  'yearly',
  NOW(),
  NOW() + INTERVAL '1 year',
  'active',
  49.99,
  'manual-' || NOW()::text,
  true
FROM public.users u
WHERE u.phone_number = '05xxxxxxxx'   -- غيّر إلى رقم جوال المعلم
   OR u.email = 'teacher@example.com' -- أو غيّر إلى بريده
LIMIT 1;

-- إذا ظهر خطأ "violates row-level security": شغّل السكربت من SQL Editor (دور postgres/service_role يتجاوز RLS).
-- للتحقق بعد الإدراج:
-- SELECT * FROM public.subscriptions WHERE transaction_id LIKE 'manual-%' ORDER BY created_at DESC LIMIT 5;
