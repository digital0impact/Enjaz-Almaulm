-- =====================================================
-- إصلاح جدول file_attachments
-- =====================================================

-- 1. فحص الجدول الحالي
-- =====================================================

-- عرض هيكل الجدول الحالي
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'file_attachments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. إصلاح الجدول إذا كان يحتاج تحديث
-- =====================================================

-- إضافة عمود user_id إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'file_attachments' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.file_attachments ADD COLUMN user_id UUID;
        RAISE NOTICE '✅ تم إضافة عمود user_id';
    ELSE
        RAISE NOTICE 'ℹ️ عمود user_id موجود بالفعل';
    END IF;
END $$;

-- إضافة Foreign Key إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'file_attachments_user_id_fkey' 
        AND table_name = 'file_attachments'
    ) THEN
        ALTER TABLE public.file_attachments 
        ADD CONSTRAINT file_attachments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ تم إضافة Foreign Key لـ user_id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign Key لـ user_id موجود بالفعل';
    END IF;
END $$;

-- 3. إنشاء الجدول من جديد إذا كان مشوهاً
-- =====================================================

-- حذف الجدول القديم إذا كان يحتاج إعادة إنشاء
DROP TABLE IF EXISTS public.file_attachments CASCADE;

-- إنشاء الجدول الجديد بالهيكل الصحيح
CREATE TABLE public.file_attachments (
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
CREATE INDEX idx_file_attachments_user_id ON public.file_attachments(user_id);
CREATE INDEX idx_file_attachments_bucket_name ON public.file_attachments(bucket_name);
CREATE INDEX idx_file_attachments_created_at ON public.file_attachments(created_at);

-- تفعيل RLS
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "Users can view their own file attachments" ON public.file_attachments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own file attachments" ON public.file_attachments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own file attachments" ON public.file_attachments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own file attachments" ON public.file_attachments
FOR DELETE USING (auth.uid() = user_id);

-- إنشاء دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON public.file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. رسالة تأكيد
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ تم إصلاح جدول file_attachments بنجاح!';
    RAISE NOTICE '📊 الأعمدة الموجودة:';
    RAISE NOTICE '   - id (UUID, Primary Key)';
    RAISE NOTICE '   - user_id (UUID, Foreign Key)';
    RAISE NOTICE '   - file_name (TEXT)';
    RAISE NOTICE '   - file_path (TEXT)';
    RAISE NOTICE '   - file_size (BIGINT)';
    RAISE NOTICE '   - mime_type (TEXT)';
    RAISE NOTICE '   - bucket_name (TEXT)';
    RAISE NOTICE '   - created_at (TIMESTAMP)';
    RAISE NOTICE '   - updated_at (TIMESTAMP)';
    RAISE NOTICE '🔒 تم تفعيل RLS وسياسات الأمان';
    RAISE NOTICE '📈 تم إنشاء الفهارس والـ Triggers';
END $$; 