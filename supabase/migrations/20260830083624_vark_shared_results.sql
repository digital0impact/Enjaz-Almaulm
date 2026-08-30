-- ميزة: مشاركة نتائج اختبار أنماط التعلم (VARK) بين المعلمين
-- المعلمة صاحبة الاختبار تنشئ رابط مشاركة يحتوي على ملخص النتائج
-- (عدد الطلاب حسب النمط لكل صف فقط، دون أسماء الطلاب أو إجاباتهم)،
-- وأي معلمة أخرى تفتح الرابط وتضغط "إضافة إلى اختباراتي" فتُحفظ
-- نسخة من هذا الملخص في حسابها هي (بدل إنشاء اختبار جديد وإرسال رابط
-- جديد لنفس الطلاب). يتبع نفس نمط shared_achievements (لقطة/snapshot
-- عامة القراءة بالرمز، لا يُعاد الاستعلام مباشرة عن vark_responses
-- لأن قراءتها مقصورة على صاحبة الاختبار الأصلي فقط).

CREATE TABLE IF NOT EXISTS vark_shared_results (
  token TEXT PRIMARY KEY REFERENCES vark_tests(token) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  class_summary JSONB NOT NULL,
  total_responses INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vark_shared_results_owner ON vark_shared_results(owner_user_id);

ALTER TABLE vark_shared_results ENABLE ROW LEVEL SECURITY;

-- صاحبة الاختبار (أو صاحبة أي نسخة مستوردة منه، فلكل نسخة token خاص بها)
-- فقط من تنشئ/تحدّث رابط مشاركة نتائجها
CREATE POLICY "Owner can insert vark_shared_results"
  ON vark_shared_results FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update own vark_shared_results"
  ON vark_shared_results FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- القراءة عامة بالرمز (لأي معلمة تفتح رابط النتائج المُشارَك)
CREATE POLICY "Allow read by anyone with token"
  ON vark_shared_results FOR SELECT
  USING (true);

COMMENT ON TABLE vark_shared_results IS 'لقطة (snapshot) لملخص نتائج اختبار VARK حسب الصف، تُنشر بالرمز لمشاركتها مع معلمات أخرى دون كشف بيانات الطلاب الفردية';

-- عمود يُميّز اختبار "نسخة مستوردة" من معلمة أخرى: يحمل لقطة الملخص
-- المجمّدة وقت الإضافة بدل بيانات استجابات فعلية (لا توجد صفوف vark_responses
-- مرتبطة بتوكن النسخة المستوردة، فلا داعي ولا صلاحية لقراءتها لاحقًا)
ALTER TABLE vark_tests ADD COLUMN IF NOT EXISTS imported_summary JSONB;
ALTER TABLE vark_tests ADD COLUMN IF NOT EXISTS imported_total INT;

COMMENT ON COLUMN vark_tests.imported_summary IS 'إن كانت غير فارغة: هذا الاختبار نسخة مستوردة من نتائج مشارَكة من معلمة أخرى، وهذه القيمة هي لقطة الملخص المجمّدة وقت الإضافة';
COMMENT ON COLUMN vark_tests.imported_total IS 'إجمالي عدد الاستجابات في لقطة الملخص المستوردة (imported_summary)';
