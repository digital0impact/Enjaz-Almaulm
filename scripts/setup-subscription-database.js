const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// قراءة متغيرات البيئة
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ خطأ: متغيرات البيئة غير موجودة');
  console.log('تأكد من وجود:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSubscriptionDatabase() {
  try {
    console.log('🚀 بدء إعداد قاعدة بيانات الاشتراكات...');

    // قراءة ملف SQL
    const sqlFilePath = path.join(__dirname, 'setup-subscription-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 تنفيذ أوامر SQL...');

    // تقسيم الملف إلى أوامر منفصلة
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ تنفيذ الأمر ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️ تحذير في الأمر ${i + 1}:`, error.message);
          } else {
            console.log(`✅ تم تنفيذ الأمر ${i + 1} بنجاح`);
          }
        } catch (err) {
          console.warn(`⚠️ خطأ في الأمر ${i + 1}:`, err.message);
        }
      }
    }

    // التحقق من إنشاء الجداول
    console.log('🔍 التحقق من إنشاء الجداول...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['subscription_prices', 'user_subscriptions']);

    if (tablesError) {
      console.error('❌ خطأ في التحقق من الجداول:', tablesError);
    } else {
      console.log('✅ الجداول الموجودة:', tables.map(t => t.table_name));
    }

    // التحقق من البيانات
    console.log('🔍 التحقق من البيانات...');
    
    const { data: prices, error: pricesError } = await supabase
      .from('subscription_prices')
      .select('*');

    if (pricesError) {
      console.error('❌ خطأ في جلب الأسعار:', pricesError);
    } else {
      console.log('✅ الأسعار المدرجة:', prices);
    }

    console.log('🎉 تم إعداد قاعدة بيانات الاشتراكات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
    process.exit(1);
  }
}

// تشغيل الإعداد
setupSubscriptionDatabase(); 