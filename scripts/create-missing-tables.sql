-- إنشاء الجداول الناقصة في Supabase
-- (backups, shared_achievements, shared_achievement_comments)
-- شغّله في Supabase → SQL Editor مرة واحدة

-- ========== 1) shared_achievements ==========
CREATE TABLE IF NOT EXISTS public.shared_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL DEFAULT 'private' CHECK (share_type IN ('public', 'private')),
  report_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_achievements_token ON public.shared_achievements(token);
CREATE INDEX IF NOT EXISTS idx_shared_achievements_user_id ON public.shared_achievements(user_id);

ALTER TABLE public.shared_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own shared_achievements" ON public.shared_achievements;
CREATE POLICY "Users can insert own shared_achievements"
  ON public.shared_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shared_achievements" ON public.shared_achievements;
CREATE POLICY "Users can update own shared_achievements"
  ON public.shared_achievements FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shared_achievements" ON public.shared_achievements;
CREATE POLICY "Users can delete own shared_achievements"
  ON public.shared_achievements FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow read by anyone for shared link view" ON public.shared_achievements;
CREATE POLICY "Allow read by anyone for shared link view"
  ON public.shared_achievements FOR SELECT
  USING (true);

COMMENT ON TABLE public.shared_achievements IS 'روابط مشاركة الإنجازات (عام/خاص) لعرض التقرير مع المشرف أو المدرسة أو لجنة التقييم';

-- ========== 2) shared_achievement_comments ==========
CREATE TABLE IF NOT EXISTS public.shared_achievement_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL,
  author_name TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_achievement_comments_token ON public.shared_achievement_comments(token);

ALTER TABLE public.shared_achievement_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments by token" ON public.shared_achievement_comments;
CREATE POLICY "Anyone can read comments by token"
  ON public.shared_achievement_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert comment" ON public.shared_achievement_comments;
CREATE POLICY "Anyone can insert comment"
  ON public.shared_achievement_comments FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.shared_achievement_comments IS 'تعليقات الزوار على تقرير الإنجازات المشترك؛ الزائر يعرض التقرير ويعقّب فقط دون إمكانية التحرير';

-- ========== 3) backups ==========
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')) DEFAULT 'manual',
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'restored', 'expired')) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backups_user_id ON public.backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON public.backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_expires_at ON public.backups(expires_at);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own backups" ON public.backups;
CREATE POLICY "Users can view their own backups"
  ON public.backups FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own backups" ON public.backups;
CREATE POLICY "Users can create their own backups"
  ON public.backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own backups" ON public.backups;
CREATE POLICY "Users can update their own backups"
  ON public.backups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own backups" ON public.backups;
CREATE POLICY "Users can delete their own backups"
  ON public.backups FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_backups_updated_at_trigger ON public.backups;
CREATE TRIGGER update_backups_updated_at_trigger
  BEFORE UPDATE ON public.backups
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_backups_updated_at();

-- التحقق: يجب أن تعيد كلها true
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backups') AS backups,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_achievements') AS shared_achievements,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_achievement_comments') AS shared_achievement_comments;
