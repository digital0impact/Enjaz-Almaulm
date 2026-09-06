-- إصلاح أمني: تقييد سياسات "القراءة العامة بالرمز" لتنطبق فقط على
-- الزوار غير المسجّلين (anon)، بدل أي شخص بما فيهم المعلمات المسجّلات
-- دخولهن في حساباتهن الخاصة.
--
-- المشكلة: سياسات RLS التالية مكتوبة USING (true) بلا أي قيد على الدور
-- (role)، فتنطبق على anon و authenticated معًا. بما أن Postgres يجمع كل
-- السياسات المسموحة (permissive) بـ OR، هذا يُلغي فعليًا قيد "صاحب
-- السجل فقط" الموجود في سياسة أخرى لنفس الجدول: أي معلمة مسجّلة دخولها
-- في حسابها الخاص يمكنها استدعاء واجهة Supabase مباشرة وقراءة **كل**
-- الصفوف في هذه الجداول (كل تقارير كل المعلمات، بما فيها المُعلَّمة
-- "خاصة" في shared_achievements، وكل اختبارات VARK لكل المعلمات) - لا
-- فقط الصف الذي تملك رابطه.
--
-- التحقق: من تفتح روابط المشاركة هذه (شاشات app/share/[token].tsx
-- وvark الاستبيان العام) هم دائمًا زوار بلا حساب في التطبيق (مشرف/لجنة
-- تقييم/طالب يعبّئ استبيانًا)، فتقييد القراءة العامة على دور anon فقط
-- لا يكسر أي استخدام شرعي حالي، ويمنع أي حساب معلم مسجّل من تصفّح بيانات
-- زميلاتها.
--
-- ملاحظة: هذا لا يمنع تعداد الصفوف بالكامل من زائر anon (قيد معروف في
-- RLS العادية لا يمكن تجاوزه إلا بدالة RPC مخصّصة)، لكنه يقلّص نطاق
-- التسريب من "كل حساب معلم مسجّل في التطبيق" (عدد كبير معروف) إلى
-- "استدعاء مباشر متعمَّد لواجهة API بدون تسجيل دخول" (نطاق أضيق بكثير)،
-- وهذا هو الإصلاح المتناسب هنا دون تغيير معماري أكبر.
--
-- جدول vark_shared_results (نتائج VARK المشاركة بين المعلمات) مُستثنى
-- عمدًا من هذا الإصلاح: تصميمه يتطلب أن تقرأه معلمة أخرى مسجّلة دخولها
-- فعليًا (لتضغط "إضافة إلى اختباراتي")، فتقييده على anon فقط سيكسر هذه
-- الميزة. البيانات المكشوفة فيه أصلاً ملخص صفوف مجمّع لا يحتوي أسماء
-- طلاب أو إجابات فردية، فالمخاطرة المتبقية منخفضة نسبيًا.

DROP POLICY IF EXISTS "Allow read by anyone for shared link view" ON shared_achievements;
CREATE POLICY "Allow read by anyone for shared link view"
  ON shared_achievements FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anyone can read comments by token" ON shared_achievement_comments;
CREATE POLICY "Anyone can read comments by token"
  ON shared_achievement_comments FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow read by anyone with token" ON vark_tests;
CREATE POLICY "Allow read by anyone with token"
  ON vark_tests FOR SELECT
  TO anon
  USING (true);
