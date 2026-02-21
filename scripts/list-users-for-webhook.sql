-- عرض البريد والجوال المخزّن (للمقارنة مع ما يرسله الويب هوك)
-- شغّل في Supabase → SQL Editor ثم قارن القيم مع ما تُرسله في الطلب

-- من user_profiles (الملف الشخصي)
SELECT 'user_profiles' AS source, id, email, phone_number, name
FROM public.user_profiles
ORDER BY updated_at DESC;

-- من users (جدول المستخدمين للربط)
SELECT 'users' AS source, id, email, name, phone_number
FROM public.users
WHERE (email IS NOT NULL AND trim(email) != '') OR (phone_number IS NOT NULL AND trim(phone_number) != '')
ORDER BY "updatedAt" DESC;

-- ملاحظة: الدالة تبحث عن البريد في auth.users ثم في user_profiles/users للجوال.
-- تأكد أن البريد في الطلب يطابق تماماً (بدون مسافات، نفس الحروف).
-- للجوال: المطابقة على آخر 9 أرقام (5xxxxxxxx).
