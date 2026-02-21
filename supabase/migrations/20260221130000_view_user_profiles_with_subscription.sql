-- عرض يجمع الملف الشخصي مع الاشتراك الحالي (للمراجعة في Table Editor)
-- الاشتراكات مخزنة في جدول subscriptions وليست داخل user_profiles؛ هذا العرض يربطهما لعرض واحد

CREATE OR REPLACE VIEW public.user_profiles_with_subscription AS
SELECT
  p.id,
  p.name,
  p.email,
  p.phone_number,
  p.job_title,
  p.work_location,
  p.created_at AS profile_created_at,
  p.updated_at AS profile_updated_at,
  s.id AS subscription_id,
  s.plan_type AS subscription_plan,
  s.status AS subscription_status,
  s.end_date AS subscription_end_date,
  s.purchase_verified AS subscription_verified
FROM public.user_profiles p
LEFT JOIN LATERAL (
  SELECT id, plan_type, status, end_date, purchase_verified
  FROM public.subscriptions
  WHERE user_id = p.id AND status = 'active'
  ORDER BY end_date DESC
  LIMIT 1
) s ON true;

COMMENT ON VIEW public.user_profiles_with_subscription IS 'الملف الشخصي مع آخر اشتراك فعّال؛ للمراجعة في لوحة Supabase';

-- صلاحية القراءة (للمصادقين قراءة بياناتهم فقط عبر RLS على الجداول الأساسية؛
-- العرض نفسه لا يملك RLS فاستخدمه من SQL Editor أو بحساب يقرأ الجداول)
GRANT SELECT ON public.user_profiles_with_subscription TO authenticated;
GRANT SELECT ON public.user_profiles_with_subscription TO service_role;
