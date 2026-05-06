-- Ensure profession field exists for storing selected profession values
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS profession TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.user_profiles.profession IS 'المهنة المختارة من البيانات الأساسية (مثل: محضر المختبر)';
