-- سياسات الأمان لـ bucket backups
DROP POLICY IF EXISTS "Users can upload their own backups" ON storage.objects;
CREATE POLICY "Users can upload their own backups"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own backups" ON storage.objects;
CREATE POLICY "Users can view their own backups"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own backups" ON storage.objects;
CREATE POLICY "Users can update their own backups"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own backups" ON storage.objects;
CREATE POLICY "Users can delete their own backups"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]); 