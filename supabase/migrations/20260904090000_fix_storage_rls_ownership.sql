-- إصلاح أمني: سياسات storage.objects للحاويات الخاصة (attachments,
-- user-files, documents, backups, profile-images) كانت تتحقق فقط من
-- auth.uid() IS NOT NULL (أي "مستخدم مسجّل دخول أيًا كان")، دون التحقق
-- أن الملف يخصّ هذا المستخدم فعلاً. بما أن التطبيق يرفع كل الملفات
-- بمسار يبدأ بمعرّف المستخدم (userId/اسم-الملف) أصلاً (راجع
-- services/BackupService.ts وservices/StorageService.ts
-- وservices/ProfessionalGrowthService.ts)، هذا الإصلاح يفرض نفس القاعدة
-- على مستوى قاعدة البيانات: كل مستخدم يرى/يعدّل/يحذف ملفاته فقط —
-- المجلد الأول في المسار (storage.foldername(name))[1] يجب أن يطابق
-- auth.uid() الخاص به.
--
-- قبل هذا الإصلاح: أي مستخدم مسجّل دخول (حتى حساب مجاني جديد) يمكنه عبر
-- استدعاء مباشر لواجهة Supabase قراءة/تعديل/حذف ملفات أي مستخدم آخر في
-- هذه الحاويات، بما في ذلك النسخ الاحتياطية الكاملة (bucket: backups).
--
-- profile-images تبقى قابلة للقراءة العامة (تصميم مقصود لعرض الصور
-- الشخصية)، لكن الرفع/التعديل/الحذف يُقيَّد بالمالك أيضًا كبقية الحاويات.

-- ========== attachments ==========
DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own attachments"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========== user-files ==========
DROP POLICY IF EXISTS "Users can upload user files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own user files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own user files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own user files" ON storage.objects;

CREATE POLICY "Users can upload user files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own user files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own user files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own user files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========== profile-images (القراءة تبقى عامة، الكتابة تُقيَّد بالمالك) ==========
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');
CREATE POLICY "Users can upload profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own profile images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own profile images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========== documents ==========
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========== backups (الأخطر: نسخ احتياطية كاملة لبيانات المستخدم) ==========
DROP POLICY IF EXISTS "Users can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own backups" ON storage.objects;

CREATE POLICY "Users can upload backups"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their own backups"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own backups"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own backups"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);
