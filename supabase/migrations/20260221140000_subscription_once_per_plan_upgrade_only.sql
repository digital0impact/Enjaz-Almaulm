-- قواعد الاشتراك: نفس الباقة مرة واحدة فقط لكل مستخدم، والترقية إلى باقة أعلى فقط
-- Plan order: free(0) < half_yearly(1) < yearly(2)

-- 1) منع وجود أكثر من اشتراك فعّال لنفس الباقة لنفس المستخدم
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_plan_active_unique
  ON public.subscriptions (user_id, plan_type)
  WHERE status = 'active';

-- 2) دالة ترتيب الباقات (للتحقق من الترقية فقط)
CREATE OR REPLACE FUNCTION public.subscription_plan_level(plan_type TEXT)
RETURNS INT AS $$
BEGIN
  RETURN CASE plan_type
    WHEN 'free' THEN 0
    WHEN 'half_yearly' THEN 1
    WHEN 'yearly' THEN 2
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3) عند الإدراج: السماح فقط إذا لم يكن للمستخدم اشتراك فعّال لنفس الباقة، والسماح بالترقية فقط
CREATE OR REPLACE FUNCTION public.subscriptions_validate_insert()
RETURNS TRIGGER AS $$
DECLARE
  current_max_level INT := 0;
  new_level INT;
  existing_plan TEXT;
BEGIN
  new_level := public.subscription_plan_level(NEW.plan_type);

  -- أعلى باقة فعّالة حالياً لهذا المستخدم
  SELECT COALESCE(MAX(public.subscription_plan_level(plan_type)), 0)
    INTO current_max_level
    FROM public.subscriptions
    WHERE user_id = NEW.user_id AND status = 'active';

  -- إذا وُجد اشتراك فعّال: يجب أن تكون الباقة الجديدة أرفع (ترقية فقط)
  IF current_max_level > 0 AND new_level <= current_max_level THEN
    SELECT plan_type INTO existing_plan
      FROM public.subscriptions
      WHERE user_id = NEW.user_id AND status = 'active'
      ORDER BY public.subscription_plan_level(plan_type) DESC
      LIMIT 1;
    IF new_level = current_max_level THEN
      RAISE EXCEPTION 'subscription_same_plan_once'
        USING HINT = 'لا يمكن الاشتراك في نفس الباقة لنفس الحساب أكثر من مرة. يمكن الترقية إلى الباقة الأعلى فقط.';
    ELSE
      RAISE EXCEPTION 'subscription_upgrade_only'
        USING HINT = 'يمكن الترقية إلى الباقة الأعلى فقط. الباقة الحالية أعلى أو مساوية.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_validate_insert_trigger ON public.subscriptions;
CREATE TRIGGER subscriptions_validate_insert_trigger
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.subscriptions_validate_insert();

COMMENT ON FUNCTION public.subscription_plan_level(TEXT) IS 'ترتيب الباقات: free=0, half_yearly=1, yearly=2';
COMMENT ON FUNCTION public.subscriptions_validate_insert() IS 'التحقق عند إدراج اشتراك: عدم تكرار نفس الباقة والترقية فقط';
