
# إعداد Supabase لتطبيق المعلمين

## الخطوات المطلوبة لإعداد Supabase:

### 1. إنشاء مشروع Supabase
1. اذهب إلى [Supabase Dashboard](https://app.supabase.com/)
2. انقر على "New project"
3. أدخل اسم المشروع (مثل: teacher-performance-app)
4. اختر كلمة مرور قوية لقاعدة البيانات
5. اختر المنطقة الأقرب إليك
6. انقر على "Create new project"

### 2. الحصول على مفاتيح API
1. في لوحة تحكم Supabase، اذهب إلى Settings > API
2. انسخ:
   - Project URL
   - anon (public) key

### 3. تحديث ملف التكوين
1. افتح ملف `config/supabase.ts`
2. استبدل القيم:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL'; // ضع هنا Project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // ضع هنا anon key
```

### 4. إنشاء الجداول في قاعدة البيانات

انتقل إلى Table Editor في لوحة تحكم Supabase وأنشئ الجداول التالية:

#### جدول user_profiles
```sql
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
```

#### جدول performance_data
```sql
CREATE TABLE performance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  axis_id TEXT NOT NULL,
  axis_title TEXT NOT NULL,
  evidences JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### جدول alerts
```sql
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### جدول comments
```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. إعداد Row Level Security (RLS)

لكل جدول، قم بتفعيل RLS وإضافة السياسات:

```sql
-- تفعيل RLS لجميع الجداول
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- سياسات للسماح بجميع العمليات (يمكن تخصيصها لاحقاً)
CREATE POLICY "Allow all operations" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON performance_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON comments FOR ALL USING (true);
```

### 6. الاستخدام في التطبيق
```typescript
import { useDatabase } from '@/contexts/DatabaseContext';

// في أي مكون:
const { 
  saveUserProfile, 
  performanceData, 
  saveAlert, 
  isLoading 
} = useDatabase();
```

### ملاحظات مهمة:
- تأكد من حفظ مفاتيح Supabase في مكان آمن
- لا تشارك مفاتيح API في ملفات عامة
- يمكنك استخدام Supabase Auth لاحقاً لتأمين أفضل
- Supabase يوفر إمكانيات أكثر مثل Real-time subscriptions و Storage

### الفوائد من استخدام Supabase:
- قاعدة بيانات PostgreSQL قوية
- API تلقائي
- Authentication مدمج
- Real-time subscriptions
- Storage للملفات
- Edge Functions
