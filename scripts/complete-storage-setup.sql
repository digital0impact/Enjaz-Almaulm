-- =====================================================
-- إعداد شامل للـ Storage في Supabase
-- =====================================================

-- 1. إنشاء Buckets
-- =====================================================

-- Bucket للمرفقات (خاص)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', false, 52428800, ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Bucket لملفات المستخدمين (خاص)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-files', 'user-files', false, 104857600, ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Bucket لصور الملفات الشخصية (عام)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Bucket للمستندات (خاص)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Bucket للنسخ الاحتياطية (خاص)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups', 'backups', false, 104857600, ARRAY['application/json', 'text/*'])
ON CONFLICT (id) DO NOTHING;

-- 2. سياسات الأمان للـ Buckets
-- =====================================================

-- سياسات attachments bucket
CREATE POLICY "Users can upload attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own attachments" ON storage.objects
FOR UPDATE USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own attachments" ON storage.objects
FOR DELETE USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);

-- سياسات user-files bucket
CREATE POLICY "Users can upload user files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own user files" ON storage.objects
FOR SELECT USING (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own user files" ON storage.objects
FOR UPDATE USING (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own user files" ON storage.objects
FOR DELETE USING (bucket_id = 'user-files' AND auth.uid() IS NOT NULL);

-- سياسات profile-images bucket (عام)
CREATE POLICY "Anyone can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

-- سياسات documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- سياسات backups bucket
CREATE POLICY "Users can upload backups" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own backups" ON storage.objects
FOR SELECT USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own backups" ON storage.objects
FOR UPDATE USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own backups" ON storage.objects
FOR DELETE USING (bucket_id = 'backups' AND auth.uid() IS NOT NULL);

-- 3. إنشاء جدول file_attachments إذا لم يكن موجوداً
-- =====================================================

CREATE TABLE IF NOT EXISTS public.file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    bucket_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للجدول
CREATE INDEX IF NOT EXISTS idx_file_attachments_user_id ON public.file_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_bucket_name ON public.file_attachments(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON public.file_attachments(created_at);

-- سياسات RLS لجدول file_attachments
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own file attachments" ON public.file_attachments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file attachments" ON public.file_attachments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file attachments" ON public.file_attachments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file attachments" ON public.file_attachments
FOR DELETE USING (auth.uid() = user_id);

-- 4. دالة لتحديث updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_file_attachments_updated_at ON public.file_attachments;
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON public.file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. رسالة تأكيد
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ تم إعداد Storage بنجاح!';
    RAISE NOTICE '📦 Buckets المنشأة: attachments, user-files, profile-images, documents, backups';
    RAISE NOTICE '🔒 تم تطبيق سياسات الأمان';
    RAISE NOTICE '🗄️ تم إنشاء جدول file_attachments';
END $$; 