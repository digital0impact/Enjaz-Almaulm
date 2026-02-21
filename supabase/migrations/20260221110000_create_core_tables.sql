-- جداول التطبيق الأساسية (user_profiles, users, performance_data, alerts, comments, account_deletion_requests)
-- متوافق مع DatabaseService.ts ووثائق supabase-code-connection-verify.md

-- ========== 1) user_profiles ==========
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  work_location TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can read own user_profiles"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can insert own user_profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can update own user_profiles"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

COMMENT ON TABLE public.user_profiles IS 'الملف الشخصي للمعلم؛ مرتبط بـ auth.users؛ رقم الجوال لربط ويب هوك المتجر';

-- إنشاء سجل في user_profiles تلقائياً عند تسجيل مستخدم جديد في Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, phone_number, job_title, work_location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========== 2) users (نسخة المستخدم للتطبيق وربط الجوال) ==========
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT,
  "subscriptionPlan" TEXT,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ,
  "isDisabled" BOOLEAN DEFAULT false,
  phone_number TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number) WHERE phone_number IS NOT NULL AND phone_number != '';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own users row" ON public.users;
CREATE POLICY "Users can read own users row"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can insert own users row" ON public.users;
CREATE POLICY "Users can insert own users row"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own users row" ON public.users;
CREATE POLICY "Users can update own users row"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id);

COMMENT ON TABLE public.users IS 'نسخة المستخدم في التطبيق؛ يُحدَّث عند التسجيل والبيانات الأساسية؛ رقم الجوال لربط ويب هوك المتجر';

-- ========== 3) performance_data ==========
CREATE TABLE IF NOT EXISTS public.performance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_id TEXT NOT NULL,
  axis_title TEXT NOT NULL,
  evidences JSONB NOT NULL DEFAULT '[]',
  score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_data_userid ON public.performance_data(userid);
CREATE INDEX IF NOT EXISTS idx_performance_data_created_at ON public.performance_data(created_at);

ALTER TABLE public.performance_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own performance_data" ON public.performance_data;
CREATE POLICY "Users can manage own performance_data"
  ON public.performance_data FOR ALL
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

COMMENT ON TABLE public.performance_data IS 'بيانات أداء المعلم (محاور، أدلة، درجات)';

-- ========== 4) alerts ==========
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_userid ON public.alerts(userid);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own alerts" ON public.alerts;
CREATE POLICY "Users can manage own alerts"
  ON public.alerts FOR ALL
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

COMMENT ON TABLE public.alerts IS 'تنبيهات المعلم';

-- ========== 5) comments ==========
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_userid ON public.comments(userid);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own comments" ON public.comments;
CREATE POLICY "Users can manage own comments"
  ON public.comments FOR ALL
  USING (auth.uid() = userid)
  WITH CHECK (auth.uid() = userid);

COMMENT ON TABLE public.comments IS 'تعليقات المعلم';

-- ========== 6) account_deletion_requests ==========
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_userid ON public.account_deletion_requests(userid);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own account_deletion_request" ON public.account_deletion_requests;
CREATE POLICY "Users can insert own account_deletion_request"
  ON public.account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = userid);

DROP POLICY IF EXISTS "Users can read own account_deletion_requests" ON public.account_deletion_requests;
CREATE POLICY "Users can read own account_deletion_requests"
  ON public.account_deletion_requests FOR SELECT
  USING (auth.uid() = userid);

COMMENT ON TABLE public.account_deletion_requests IS 'طلبات حذف الحساب';

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT ON public.account_deletion_requests TO authenticated;

-- service_role للويب هوك والإدارة (قراءة user_profiles و users للربط بالجوال)
GRANT SELECT ON public.user_profiles TO service_role;
GRANT SELECT ON public.users TO service_role;
