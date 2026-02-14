#!/usr/bin/env node
/**
 * التحقق من اتصال التطبيق بـ Supabase
 * تشغيل: npm run supabase:verify   أو   node scripts/verify-supabase-connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 التحقق من اتصال Supabase...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ متغيرات البيئة غير موجودة.');
  console.log('تأكد من وجود ملف .env ويحتوي على:');
  console.log('  EXPO_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"');
  console.log('  EXPO_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"');
  console.log('\nانسخ .env.example إلى .env ثم عدّل القيم من لوحة Supabase → Project Settings → API.');
  process.exit(1);
}

console.log('✅ تم العثور على متغيرات البيئة');
console.log('   URL:', supabaseUrl.replace(/\/$/, ''));

async function verify() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1) اختبار وصول API بعملية بسيطة (جدول subscription_prices يسمح بالقراءة للجميع)
    const { data, error } = await supabase
      .from('subscription_prices')
      .select('plan_type, price')
      .limit(2);

    if (error) {
      // إذا كان الجدول غير موجود، نجرب Auth للتأكد أن الاتصال يعمل
      const { error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('\n❌ فشل الاتصال بـ Supabase:', error.message);
        console.log('\nتأكد من:');
        console.log('  1. صحة الرابط والمفتاح من Supabase Dashboard → Project Settings → API');
        console.log('  2. أن المشروع يعمل (لم يُوقف)');
        process.exitCode = 1;
        return;
      }
      console.log('✅ الاتصال بـ Supabase يعمل (Auth متاح)');
      console.log('   ملاحظة: جدول subscription_prices قد يكون غير موجود أو RLS يمنع القراءة.');
      console.log('   يمكنك إنشاؤه من scripts/setup-subscription-prices.sql في Supabase SQL Editor.');
      console.log('\n🎉 الكود متصل بـ Supabase بشكل صحيح.');
      exitClean(0);
      return;
    }

    console.log('✅ الاتصال ناجح والقراءة من قاعدة البيانات تعمل.');
    if (data && data.length > 0) {
      console.log('   عينة من subscription_prices:', data);
    } else {
      console.log('   (جدول subscription_prices فارغ أو لا توجد صفوف)');
    }
    console.log('\n🎉 الكود متصل بـ Supabase بشكل صحيح.');
    exitClean(0);
  } catch (err) {
    console.error('\n❌ خطأ:', err.message);
    exitClean(1);
  }
}

function exitClean(code) {
  process.exitCode = code;
  setTimeout(() => process.exit(code), 100);
}

verify();
