-- تعليقات الزوار على روابط مشاركة الإنجازات (الزائر يعرض فقط ويعلق، لا يحرر)
CREATE TABLE IF NOT EXISTS shared_achievement_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL,
  author_name TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_achievement_comments_token ON shared_achievement_comments(token);

ALTER TABLE shared_achievement_comments ENABLE ROW LEVEL SECURITY;

-- أي شخص يمكنه قراءة التعليقات الخاصة برابط معين (للعرض في صفحة الرابط المشترك)
CREATE POLICY "Anyone can read comments by token"
  ON shared_achievement_comments FOR SELECT
  USING (true);

-- أي شخص يمكنه إدراج تعليق (الزائر يعلق بدون تسجيل دخول)
CREATE POLICY "Anyone can insert comment"
  ON shared_achievement_comments FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE shared_achievement_comments IS 'تعليقات الزوار على تقرير الإنجازات المشترك؛ الزائر يعرض التقرير ويعقّب فقط دون إمكانية التحرير';
