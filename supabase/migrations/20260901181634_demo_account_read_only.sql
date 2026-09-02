-- حماية حساب العرض التجريبي (Demo) على مستوى قاعدة البيانات: يمنع أي
-- INSERT/UPDATE/DELETE من هذا الحساب تحديدًا على كل جدول تطبيقي حقيقي،
-- بصرف النظر عمّا يفعله كود الواجهة (services/DemoModeGuard.ts يغطي
-- التخزين المحلي فقط، وليس هذه الجداول). القراءة (SELECT) تبقى مسموحة
-- كالمعتاد حسب سياسات كل جدول الحالية.
--
-- الحساب يُحدَّد بالبريد الإلكتروني الثابت وليس UUID مضبوط يدويًا، حتى
-- تعمل هذه الـmigration فور إنشاء الحساب دون تعديل لاحق.
--
-- ملاحظة: هذه إضافة (سياسات RESTRICTIVE) فوق سياسات RLS الحالية لكل
-- جدول، ولا تُفعِّل RLS من جديد على أي جدول — إن كان جدول لم يُفعَّل
-- عليه RLS أصلاً فلن يكون لهذه الإضافة أثر عليه (لم نتحقق من ذلك هنا
-- لعدم توفر رؤية كاملة على المخطط الفعلي المباشر).

CREATE OR REPLACE FUNCTION public.is_demo_account()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'demo@enjaz-almaulm.com'
  );
$func$;

DO $block$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'account_deletion_requests', 'alerts', 'attachments', 'backups',
    'comments', 'file_attachments', 'performance_data', 'professional_growth',
    'shared_achievement_comments', 'shared_achievements', 'subscription_prices',
    'subscriptions', 'user_profiles', 'users', 'vark_responses',
    'vark_shared_results', 'vark_tests'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "demo_account_block_insert" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "demo_account_block_insert" ON public.%I '
        || 'AS RESTRICTIVE FOR INSERT TO authenticated '
        || 'WITH CHECK (NOT public.is_demo_account())',
        t
      );

      EXECUTE format('DROP POLICY IF EXISTS "demo_account_block_update" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "demo_account_block_update" ON public.%I '
        || 'AS RESTRICTIVE FOR UPDATE TO authenticated '
        || 'USING (NOT public.is_demo_account())',
        t
      );

      EXECUTE format('DROP POLICY IF EXISTS "demo_account_block_delete" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "demo_account_block_delete" ON public.%I '
        || 'AS RESTRICTIVE FOR DELETE TO authenticated '
        || 'USING (NOT public.is_demo_account())',
        t
      );
    END IF;
  END LOOP;
END $block$;
