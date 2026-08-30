-- ميزة: مساعد الذكاء الاصطناعي في "بطاقة متابعة متعلم (الخطط العلاجية والاثرائية)"
-- متاح بلا حدود لأصحاب الخطط المدفوعة (نصف سنوي/سنوي)، ومرة واحدة فقط
-- لأصحاب الخطة المجانية. العدّاد والتحقق من الخطة يتمّان في قاعدة البيانات
-- (لا في التطبيق فقط) حتى لا يمكن تجاوزهما من جهة العميل، ويُستدعيان من
-- Edge Function واحدة (ai-assistant) عبر RPC بجلسة المستخدم نفسه.

CREATE TABLE IF NOT EXISTS student_card_ai_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_uses_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_card_ai_usage ENABLE ROW LEVEL SECURITY;

-- القراءة فقط لصاحبة السجل؛ لا سياسات INSERT/UPDATE مباشرة — التعديل
-- حصرًا عبر الدالة الآمنة (SECURITY DEFINER) أدناه لضمان عدم تجاوز الحد
CREATE POLICY "Users can view own student_card_ai_usage"
  ON student_card_ai_usage FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE student_card_ai_usage IS 'عدّاد استخدام مساعد الذكاء الاصطناعي في بطاقة متابعة متعلم لأصحاب الخطة المجانية (حد مرة واحدة)';

-- تتحقق من خطة المستخدم الحالية (نفس منطق SubscriptionService.getCurrentSubscription:
-- آخر اشتراك status='active' مرتبًا بـ end_date تنازليًا). إن كانت الخطة مدفوعة
-- (غير 'free') تُسمح دائمًا دون عدّ. إن كانت مجانية أو بلا اشتراك، تُستهلك
-- استخدام واحد فقط من العدّاد ثم تُرفض المحاولات التالية.
CREATE OR REPLACE FUNCTION public.check_and_consume_student_card_ai_usage(p_free_limit INT DEFAULT 1)
RETURNS TABLE(allowed BOOLEAN, remaining INT, plan_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT;
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, NULL::TEXT;
    RETURN;
  END IF;

  SELECT s.plan_type INTO v_plan
  FROM subscriptions s
  WHERE s.user_id = v_user_id AND s.status = 'active'
  ORDER BY s.end_date DESC
  LIMIT 1;

  IF v_plan IS NOT NULL AND v_plan <> 'free' THEN
    RETURN QUERY SELECT true, -1, v_plan;
    RETURN;
  END IF;

  INSERT INTO student_card_ai_usage (user_id, free_uses_count)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT free_uses_count INTO v_count FROM student_card_ai_usage WHERE user_id = v_user_id;

  IF v_count < p_free_limit THEN
    UPDATE student_card_ai_usage
      SET free_uses_count = free_uses_count + 1, updated_at = NOW()
      WHERE user_id = v_user_id;
    RETURN QUERY SELECT true, (p_free_limit - v_count - 1), COALESCE(v_plan, 'free');
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, COALESCE(v_plan, 'free');
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_consume_student_card_ai_usage(INT) TO authenticated;

COMMENT ON FUNCTION public.check_and_consume_student_card_ai_usage IS 'تتحقق من صلاحية استخدام مساعد الذكاء الاصطناعي في بطاقة متابعة متعلم وتستهلك محاولة من عدّاد الخطة المجانية عند الحاجة؛ تُستدعى عبر RPC بجلسة المستخدم';
