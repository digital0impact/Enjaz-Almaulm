-- سياسات مبسطة للـ Storage
-- قم بتشغيل هذا الملف في SQL Editor

-- 1. تفعيل RLS على storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. سياسة بسيطة للوصول العام إلى attachments
DROP POLICY IF EXISTS "Public Access to Attachments" ON storage.objects;
CREATE POLICY "Public Access to Attachments" ON storage.objects
FOR ALL USING (bucket_id = 'attachments');

-- 3. سياسة بسيطة للوصول العام إلى profile-images
DROP POLICY IF EXISTS "Public Access to Profile Images" ON storage.objects;
CREATE POLICY "Public Access to Profile Images" ON storage.objects
FOR ALL USING (bucket_id = 'profile-images');

-- 4. سياسة بسيطة للمستخدمين المسجلين
DROP POLICY IF EXISTS "Authenticated Access" ON storage.objects;
CREATE POLICY "Authenticated Access" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated');

-- 5. تفعيل RLS على file_attachments
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- 6. سياسة بسيطة لجدول file_attachments
DROP POLICY IF EXISTS "Public Access to File Attachments" ON file_attachments;
CREATE POLICY "Public Access to File Attachments" ON file_attachments
FOR ALL USING (true);

-- رسالة تأكيد
SELECT 'Simple storage policies have been set up successfully!' as status; 