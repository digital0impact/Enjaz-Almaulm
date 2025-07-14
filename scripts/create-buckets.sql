-- إنشاء Buckets المطلوبة في Supabase
-- قم بتشغيل هذا الملف في SQL Editor في Supabase Dashboard

-- إنشاء bucket للملفات المرفقة العامة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('attachments', 'attachments', true, 52428800, ARRAY['*/*'])
ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket لملفات المستخدمين الخاصة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('user-files', 'user-files', false, 52428800, ARRAY['*/*'])
ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket للصور الشخصية
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('profile-images', 'profile-images', true, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket للوثائق
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/*'])
ON CONFLICT (id) DO NOTHING;

-- إنشاء bucket للنسخ الاحتياطية
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('backups', 'backups', false, 104857600, ARRAY['application/json', 'application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO NOTHING;

-- التحقق من إنشاء Buckets
SELECT 
    id as bucket_name,
    name as display_name,
    public as is_public,
    file_size_limit,
    created_at
FROM storage.buckets 
ORDER BY created_at;

-- رسالة تأكيد
SELECT 'All buckets have been created successfully!' as status; 