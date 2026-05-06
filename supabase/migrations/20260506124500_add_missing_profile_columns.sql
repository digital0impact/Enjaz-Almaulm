-- Add missing profile columns expected by DatabaseService.updateUserProfile
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS specialization TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS profession TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS hire_date TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS rank TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS experiences TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS education_administration TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS school_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS school_stage TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS teaching_grades TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS professional_growth TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.user_profiles.education_administration IS 'الإدارة التعليمية';
