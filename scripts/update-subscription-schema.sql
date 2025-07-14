-- تحديث جدول الاشتراكات لدعم التحقق من الدفع
-- تشغيل هذا الملف في Supabase SQL Editor

-- إضافة الأعمدة الجديدة
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS purchase_verified BOOLEAN DEFAULT false;

-- تحديث الاشتراكات الموجودة لتكون غير متحقق منها
UPDATE subscriptions 
SET purchase_verified = false 
WHERE transaction_id IS NULL;

-- تحديث الاشتراكات المجانية لتكون متحقق منها
UPDATE subscriptions 
SET purchase_verified = true 
WHERE plan_type = 'free';

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_verified 
ON subscriptions(purchase_verified);

-- إضافة قيود للبيانات
ALTER TABLE subscriptions 
ADD CONSTRAINT check_verified_paid_subscription 
CHECK (
  (plan_type = 'free' AND purchase_verified = true) OR
  (plan_type IN ('yearly', 'half_yearly') AND transaction_id IS NOT NULL)
); 