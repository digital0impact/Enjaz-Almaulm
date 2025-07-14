-- إنشاء جدول أسعار الاشتراكات
CREATE TABLE IF NOT EXISTS subscription_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_type VARCHAR(50) NOT NULL UNIQUE,
    localized_price VARCHAR(100) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول اشتراكات المستخدمين
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    transaction_receipt TEXT,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expiration_date ON user_subscriptions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_subscription_prices_is_active ON subscription_prices(is_active);

-- إدراج الأسعار الافتراضية
INSERT INTO subscription_prices (plan_type, localized_price, currency) 
VALUES 
    ('yearly', '50 ريال / سنوياً', 'SAR'),
    ('half_yearly', '30 ريال / 6 أشهر', 'SAR')
ON CONFLICT (plan_type) DO UPDATE SET
    localized_price = EXCLUDED.localized_price,
    updated_at = NOW();

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_subscription_prices_updated_at 
    BEFORE UPDATE ON subscription_prices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء سياسات الأمان (RLS)
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- سياسات subscription_prices (للقراءة فقط)
CREATE POLICY "subscription_prices_read_policy" ON subscription_prices
    FOR SELECT USING (is_active = true);

-- سياسات user_subscriptions
CREATE POLICY "user_subscriptions_read_policy" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_insert_policy" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_update_policy" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT SELECT ON subscription_prices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated; 