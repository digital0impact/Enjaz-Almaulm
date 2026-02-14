// سكريبت إعداد نظام النسخ الاحتياطية
// تشغيل: node scripts/setup-backup-system.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// قراءة متغيرات البيئة
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// هذا السكربت يقوم بعمليات إدارية (Storage buckets) لذا يتطلب service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ خطأ: متغيرات البيئة غير موجودة');
  console.log('تأكد من وجود:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 بدء إعداد نظام النسخ الاحتياطية...\n');

async function setupBackupSystem() {
  try {
    console.log('📡 إنشاء اتصال بـ Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ تم إنشاء الاتصال بنجاح');

    // 1. إنشاء bucket backups
    console.log('\n1️⃣ إنشاء bucket backups...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.log('❌ خطأ في الوصول للـ buckets:', bucketError.message);
        return;
      }

      const backupsBucket = buckets?.find(bucket => bucket.name === 'backups');
      if (backupsBucket) {
        console.log('✅ bucket backups موجود بالفعل');
      } else {
        console.log('📦 جاري إنشاء bucket backups...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('backups', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['application/json']
        });

        if (createError) {
          console.log('❌ خطأ في إنشاء bucket:', createError.message);
          console.log('💡 قم بإنشاؤه يدوياً في Supabase Dashboard');
        } else {
          console.log('✅ تم إنشاء bucket backups بنجاح');
        }
      }
    } catch (error) {
      console.log('⚠️ خطأ في إنشاء bucket:', error.message);
    }

    // 2. إنشاء جدول backups
    console.log('\n2️⃣ إنشاء جدول backups...');
    try {
      const { data: tableTest, error: tableError } = await supabase
        .from('backups')
        .select('count')
        .limit(1);

      if (tableError && tableError.message.includes('relation "backups" does not exist')) {
        console.log('📋 جدول backups غير موجود، جاري إنشاؤه...');
        
        // قراءة سكريبت SQL
        const sqlPath = path.join(__dirname, 'create-backups-bucket.sql');
        if (fs.existsSync(sqlPath)) {
          const sqlContent = fs.readFileSync(sqlPath, 'utf8');
          console.log('📄 تم قراءة سكريبت SQL');
          console.log('💡 قم بتشغيل السكريبت التالي في Supabase SQL Editor:');
          console.log('='.repeat(50));
          console.log(sqlContent);
          console.log('='.repeat(50));
        } else {
          console.log('❌ ملف create-backups-bucket.sql غير موجود');
        }
      } else if (tableError) {
        console.log('❌ خطأ في الوصول لجدول backups:', tableError.message);
      } else {
        console.log('✅ جدول backups موجود بالفعل');
      }
    } catch (error) {
      console.log('⚠️ خطأ في التحقق من جدول backups:', error.message);
    }

    // 3. اختبار النظام
    console.log('\n3️⃣ اختبار النظام...');
    try {
      // اختبار رفع ملف صغير
      const testFile = new Blob(['test backup data'], { type: 'application/json' });
      const testPath = `test-${Date.now()}.json`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('backups')
        .upload(testPath, testFile, {
          contentType: 'application/json',
          upsert: false
        });

      if (uploadError) {
        console.log('❌ خطأ في رفع ملف الاختبار:', uploadError.message);
      } else {
        console.log('✅ تم رفع ملف الاختبار بنجاح');
        
        // حذف ملف الاختبار
        const { error: deleteError } = await supabase.storage
          .from('backups')
          .remove([testPath]);

        if (deleteError) {
          console.log('⚠️ خطأ في حذف ملف الاختبار:', deleteError.message);
        } else {
          console.log('✅ تم حذف ملف الاختبار بنجاح');
        }
      }
    } catch (error) {
      console.log('⚠️ خطأ في اختبار النظام:', error.message);
    }

    console.log('\n🎉 إعداد نظام النسخ الاحتياطية مكتمل!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. اذهب إلى Supabase Dashboard > SQL Editor');
    console.log('2. انسخ والصق محتوى ملف create-backups-bucket.sql');
    console.log('3. اضغط على Run لتنفيذ السكريبت');
    console.log('4. اختبر النسخ الاحتياطية في التطبيق');

  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error.message);
    console.error('Stack:', error.stack);
  }
}

// تشغيل الإعداد
setupBackupSystem(); 