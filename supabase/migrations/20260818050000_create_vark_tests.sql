-- ميزة: تحليل أنماط تعلم الطلاب (استبيان VARK)
-- المعلم ينشئ "اختبارًا" برابط عام، الطالب يفتح الرابط بدون تسجيل دخول
-- ويعبئ الاستبيان، والنتائج تُجمَّع للمعلم حسب الصف.
-- يتبع نفس نمط shared_achievements / shared_achievement_comments
-- (token نصي بلا FK فعلي، قراءة عامة بالرمز، إدراج عام بلا تسجيل دخول).

CREATE TABLE IF NOT EXISTS vark_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vark_tests_token ON vark_tests(token);
CREATE INDEX IF NOT EXISTS idx_vark_tests_user_id ON vark_tests(user_id);

ALTER TABLE vark_tests ENABLE ROW LEVEL SECURITY;

-- المعلم يدير اختباراته الخاصة فقط
CREATE POLICY "Users can insert own vark_tests"
  ON vark_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own vark_tests"
  ON vark_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own vark_tests"
  ON vark_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vark_tests"
  ON vark_tests FOR DELETE
  USING (auth.uid() = user_id);

-- القراءة بالرمز (لصفحة الاستبيان العامة التي يفتحها الطالب بلا تسجيل دخول)
CREATE POLICY "Allow read by anyone with token"
  ON vark_tests FOR SELECT
  USING (true);

COMMENT ON TABLE vark_tests IS 'اختبارات نمط التعلم (VARK) التي ينشئها المعلم؛ كل اختبار له رابط عام بالرمز (token) يفتحه الطالب بلا تسجيل دخول';


CREATE TABLE IF NOT EXISTS vark_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_token TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  style_counts JSONB NOT NULL DEFAULT '{}',
  dominant_style TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vark_responses_test_token ON vark_responses(test_token);
CREATE INDEX IF NOT EXISTS idx_vark_responses_class_name ON vark_responses(class_name);

ALTER TABLE vark_responses ENABLE ROW LEVEL SECURITY;

-- أي طالب يمكنه إرسال إجاباته بلا تسجيل دخول (بمعرفة رابط الاختبار فقط)
CREATE POLICY "Anyone can insert vark response"
  ON vark_responses FOR INSERT
  WITH CHECK (true);

-- القراءة مقصورة على المعلم صاحب الاختبار فقط (خصوصية نتائج الطلاب)
CREATE POLICY "Test owner can read vark_responses"
  ON vark_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vark_tests
      WHERE vark_tests.token = vark_responses.test_token
        AND vark_tests.user_id = auth.uid()
    )
  );

COMMENT ON TABLE vark_responses IS 'إجابات الطلاب على استبيان نمط التعلم (VARK)؛ الإدراج عام بلا تسجيل دخول، والقراءة مقصورة على المعلم صاحب الاختبار';
