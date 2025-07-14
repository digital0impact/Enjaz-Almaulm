// سكريبت اختبار الاتصال بـ Supabase
// تشغيل: node scripts/test-connection.js

const { createClient } = require('@supabase/supabase-js');

// إعدادات Supabase
const supabaseUrl = 'https://feidqejihjnvayikhbli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaWRxZWppaGpudmF5aWtoYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjI0NDIsImV4cCI6MjA2Njk5ODQ0Mn0.w-NSSW2xCjkOOnEcr78x9e0o0mB9PDa5oEIIYy-yzkA';

async function testConnection() {
  try {
    console.log('📡 إنشاء اتصال بـ Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ تم إنشاء الاتصال بنجاح');

    console.log('\n🔐 اختبار المصادقة...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ خطأ في المصادقة:', authError.message);
      console.log('💡 هذا طبيعي إذا لم تكن مسجل الدخول');
    } else if (user) {
      console.log('✅ المستخدم مسجل الدخول:', user.id);
    } else {
      console.log('ℹ️ لا يوجد مستخدم مسجل الدخول');
    }

    console.log('\n🗄️ اختبار الاتصال بقاعدة البيانات...');
    const { data: tables, error: tableError } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ خطأ في الاتصال بقاعدة البيانات:', tableError.message);
    } else {
      console.log('✅ الاتصال بقاعدة البيانات ناجح');
    }

    console.log('\n📦 اختبار Storage...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ خطأ في الوصول للـ Storage:', bucketError.message);
    } else {
      console.log('✅ الاتصال بالـ Storage ناجح');
      console.log('📁 Buckets المتاحة:', buckets?.map(b => b.name).join(', ') || 'لا توجد');
    }

    console.log('\n🎉 اختبار الاتصال مكتمل!');

  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error.message);
    console.error('Stack:', error.stack);
  }
}

// تشغيل الاختبار
testConnection(); 