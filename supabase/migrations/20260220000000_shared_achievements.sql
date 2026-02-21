-- جدول مشاركة الإنجازات (رابط عام أو خاص)
CREATE TABLE IF NOT EXISTS shared_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL DEFAULT 'private' CHECK (share_type IN ('public', 'private')),
  report_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_achievements_token ON shared_achievements(token);
CREATE INDEX IF NOT EXISTS idx_shared_achievements_user_id ON shared_achievements(user_id);

ALTER TABLE shared_achievements ENABLE ROW LEVEL SECURITY;

-- المستخدم المصادق يمكنه إدراج/تحديث سجلاته فقط
CREATE POLICY "Users can insert own shared_achievements"
  ON shared_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared_achievements"
  ON shared_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared_achievements"
  ON shared_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- القراءة بالرمز (لصفحة العرض العام): يسمح لأي شخص بقراءة سجل إذا عرف الرمز (الرابط)
-- نسمح بقراءة أي صف للسماح بعرض التقرير عند فتح الرابط
CREATE POLICY "Allow read by anyone for shared link view"
  ON shared_achievements FOR SELECT
  USING (true);

COMMENT ON TABLE shared_achievements IS 'روابط مشاركة الإنجازات (عام/خاص) لعرض التقرير مع المشرف أو المدرسة أو لجنة التقييم';
