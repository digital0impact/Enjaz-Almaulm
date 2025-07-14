-- إنشاء جدول أسعار الاشتراكات - نسخة مبسطة
-- تشغيل هذا الملف في Supabase SQL Editor

-- إنشاء الجدول
CREATE TABLE IF NOT EXISTS subscription_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type VARCHAR(20) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    localized_price VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج البيانات
INSERT INTO subscription_prices (plan_type, price, localized_price) 
VALUES 
    ('yearly', 50.00, '50 ريال / سنوياً'),
    ('half_yearly', 30.00, '30 ريال / 6 أشهر')
ON CONFLICT (plan_type) DO NOTHING;

-- تفعيل RLS
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات
CREATE POLICY "Allow public read access" ON subscription_prices
    FOR SELECT USING (true);

-- عرض النتائج
SELECT 'تم إنشاء جدول subscription_prices بنجاح' as message;
SELECT * FROM subscription_prices; 