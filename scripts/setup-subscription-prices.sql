-- إعداد جدول أسعار الاشتراكات
-- تشغيل هذا الملف في Supabase SQL Editor

-- إنشاء جدول أسعار الاشتراكات
CREATE TABLE IF NOT EXISTS subscription_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_type VARCHAR(20) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    localized_price VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج الأسعار الافتراضية (فقط إذا لم تكن موجودة)
INSERT INTO subscription_prices (plan_type, price, localized_price) 
VALUES 
    ('yearly', 49.99, '49.99 ريال / سنوياً'),
    ('half_yearly', 29.99, '29.99 ريال / 6 أشهر')
ON CONFLICT (plan_type) DO NOTHING;

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_subscription_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger (فقط إذا لم يكن موجوداً)
DROP TRIGGER IF EXISTS update_subscription_prices_updated_at ON subscription_prices;
CREATE TRIGGER update_subscription_prices_updated_at
    BEFORE UPDATE ON subscription_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_prices_updated_at();

-- إضافة سياسات الأمان
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Anyone can view subscription prices" ON subscription_prices;
DROP POLICY IF EXISTS "Only admins can update subscription prices" ON subscription_prices;
DROP POLICY IF EXISTS "Only admins can insert subscription prices" ON subscription_prices;

-- إنشاء السياسات الجديدة
CREATE POLICY "Anyone can view subscription prices"
    ON subscription_prices FOR SELECT
    USING (true);

CREATE POLICY "Only admins can update subscription prices"
    ON subscription_prices FOR UPDATE
    USING (auth.role() = 'admin');

CREATE POLICY "Only admins can insert subscription prices"
    ON subscription_prices FOR INSERT
    WITH CHECK (auth.role() = 'admin');

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_subscription_prices_plan_type ON subscription_prices(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_prices_is_active ON subscription_prices(is_active);

-- عرض النتائج
SELECT 'تم إنشاء جدول subscription_prices بنجاح' as message;
SELECT * FROM subscription_prices; 