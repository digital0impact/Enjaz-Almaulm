-- تحديث Trigger: عند إنشاء مستخدم جديد في Auth نملأ user_profiles و users معاً
-- حتى يظهر المستخدم في الجداول فوراً دون انتظار التطبيق

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1) user_profiles
  INSERT INTO public.user_profiles (id, name, email, phone_number, job_title, work_location)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1), 'المعلم'),
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone_number'), ''), ''),
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NULLIF(TRIM(EXCLUDED.name), ''), public.user_profiles.name),
    email = COALESCE(EXCLUDED.email, public.user_profiles.email),
    phone_number = COALESCE(NULLIF(TRIM(EXCLUDED.phone_number), ''), public.user_profiles.phone_number),
    updated_at = NOW();

  -- 2) users (لربط الجوال والويب هوك)
  INSERT INTO public.users (id, email, name, "updatedAt", phone_number)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1), 'المعلم'),
    NOW(),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'phone_number'), ''), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    name = COALESCE(NULLIF(TRIM(EXCLUDED.name), ''), public.users.name),
    phone_number = COALESCE(NULLIF(TRIM(EXCLUDED.phone_number), ''), public.users.phone_number),
    "updatedAt" = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعادة ربط الـ Trigger (قد يكون موجوداً من هجرة سابقة)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'يملأ user_profiles و users عند تسجيل مستخدم جديد في Auth';
