-- سكربت لسرد الجداول والأعمدة الموجودة فعلياً في Supabase
-- شغّله في Supabase → SQL Editor لمقارنة النتيجة مع الجداول المعرّفة في الكود

-- 1) قائمة الجداول في schema public
SELECT
  t.table_schema,
  t.table_name,
  obj_description((t.table_schema || '.' || t.table_name)::regclass, 'pg_class') AS table_comment
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 2) الأعمدة لكل جدول (الاسم، النوع، قابلية NULL)
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3) تحقق سريع: وجود الجداول التي يتوقعها التطبيق
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') AS subscriptions,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') AS user_profiles,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS users,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance_data') AS performance_data,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') AS alerts,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') AS comments,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'account_deletion_requests') AS account_deletion_requests,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'file_attachments') AS file_attachments,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backups') AS backups,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_prices') AS subscription_prices,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_achievements') AS shared_achievements,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_achievement_comments') AS shared_achievement_comments;
