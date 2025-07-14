-- إنشاء جدول backups
CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')) DEFAULT 'manual',
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'restored', 'expired')) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للجدول
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_expires_at ON backups(expires_at);

-- تمكين RLS على جدول backups
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لجدول backups
DROP POLICY IF EXISTS "Users can view their own backups" ON backups;
CREATE POLICY "Users can view their own backups"
  ON backups FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own backups" ON backups;
CREATE POLICY "Users can create their own backups"
  ON backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own backups" ON backups;
CREATE POLICY "Users can update their own backups"
  ON backups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own backups" ON backups;
CREATE POLICY "Users can delete their own backups"
  ON backups FOR DELETE
  USING (auth.uid() = user_id);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_backups_updated_at_trigger ON backups;
CREATE TRIGGER update_backups_updated_at_trigger
  BEFORE UPDATE ON backups
  FOR EACH ROW
  EXECUTE FUNCTION update_backups_updated_at(); 