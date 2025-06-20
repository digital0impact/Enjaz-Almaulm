
-- إنشاء جدول الملفات الشخصية للمستخدمين
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  job_title TEXT,
  work_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول بيانات الأداء
CREATE TABLE performance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT NOT NULL,
  axisId TEXT NOT NULL,
  axisTitle TEXT NOT NULL,
  evidences JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول التنبيهات
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول التعليقات
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء سياسات الأمان (للسماح بجميع العمليات مؤقتاً)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON performance_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON comments FOR ALL USING (true);

-- إنشاء جدول طلبات حذف الحساب
CREATE TABLE account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة سياسة للسماح بجميع العمليات
CREATE POLICY "Allow all operations" ON account_deletion_requests FOR ALL USING (true);
