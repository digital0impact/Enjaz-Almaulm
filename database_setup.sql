
-- إنشاء الجداول المطلوبة لتطبيق المعلمين

-- جدول الملفات الشخصية للمستخدمين
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  job_title TEXT,
  work_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول بيانات الأداء
CREATE TABLE IF NOT EXISTS performance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL,
  axisid TEXT NOT NULL,
  axistitle TEXT NOT NULL,
  evidences JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التنبيهات
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  isactive BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التعليقات
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول طلبات حذف الحساب
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_performance_data_userid ON performance_data(userid);
CREATE INDEX IF NOT EXISTS idx_alerts_userid ON alerts(userid);
CREATE INDEX IF NOT EXISTS idx_comments_userid ON comments(userid);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_userid ON account_deletion_requests(userid);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON account_deletion_requests(status);

-- إضافة سياسات الأمان (RLS) - اختيارية للتطوير
-- يمكن تفعيلها لاحقاً لمزيد من الأمان
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
