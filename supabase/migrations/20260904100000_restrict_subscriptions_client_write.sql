-- إصلاح أمني: منع أي مستخدم من منح نفسه اشتراكًا مدفوعًا مجانًا.
--
-- المشكلة: سياسات RLS لجدول subscriptions كانت تسمح لأي مستخدم مصادَق
-- بإدراج/تحديث صفّه الخاص بأي قيم (plan_type, status, purchase_verified,
-- end_date...) دون أي تحقق فعلي من الدفع. التحقق من إيصال الشراء
-- (Apple/Google) كان يحدث بالكامل داخل التطبيق نفسه، وهو غير موثوق (أي
-- عميل مُعدَّل يمكنه تجاوزه أو استدعاء واجهة Supabase مباشرة دون المرور
-- بالتطبيق إطلاقًا).
--
-- الإصلاح: حذف سياستَي الإدراج والتحديث المتاحتين للعميل تمامًا. من الآن
-- فصاعدًا كل كتابة على subscriptions يجب أن تمر عبر مسار موثوق بصلاحية
-- service_role (التي تتجاوز RLS أصلاً): دالة verify-iap-purchase الجديدة
-- (تتحقق من الإيصال فعليًا مع Apple/Google) أو ويب هوك متجر سلة
-- (store-subscription-webhook / salla-webhook) الموجودين مسبقًا وكانا
-- يستخدمان service_role بأمان بالفعل.
--
-- لا يؤثر هذا على الخطة المجانية: عدم وجود أي صف اشتراك للمستخدم يُعامَل
-- أصلاً كخطة مجانية افتراضيًا (راجع SubscriptionService.checkSubscriptionStatus)،
-- فلا حاجة لإدراج صف من العميل لتفعيلها.

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

-- القراءة تبقى متاحة للمستخدم على اشتراكه الخاص فقط (بدون تغيير)
