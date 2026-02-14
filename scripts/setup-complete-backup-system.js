// سكريبت إعداد نظام النسخ الاحتياطية بالكامل
// تشغيل: node scripts/setup-complete-backup-system.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// قراءة متغيرات البيئة
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// هذا السكربت يقوم بعمليات إدارية (Storage policies/buckets) لذا يتطلب service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ خطأ: متغيرات البيئة غير موجودة');
  console.log('تأكد من وجود:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 بدء إعداد نظام النسخ الاحتياطية بالكامل...\n');

async function setupCompleteBackupSystem() {
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
        console.log('💡 تأكد من صلاحيات الوصول للـ Storage');
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
          console.log('💡 قم بإنشاؤه يدوياً في Supabase Dashboard > Storage');
          console.log('📋 الإعدادات المطلوبة:');
          console.log('   - اسم البكت: backups');
          console.log('   - Public: false');
          console.log('   - File size limit: 50MB');
          console.log('   - Allowed MIME types: application/json');
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
        
        // SQL لإنشاء جدول backups
        const createTableSQL = `
-- إنشاء جدول backups
CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')) DEFAULT 'manual',
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('active', 'restored', 'expired')) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للجدول
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_expires_at ON backups(expires_at);

-- تمكين RLS على جدول backups
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان لجدول backups
DROP POLICY IF EXISTS "Users can view their own backups" ON backups;
CREATE POLICY "Users can view their own backups"
  ON backups FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own backups" ON backups;
CREATE POLICY "Users can create their own backups"
  ON backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own backups" ON backups;
CREATE POLICY "Users can update their own backups"
  ON backups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own backups" ON backups;
CREATE POLICY "Users can delete their own backups"
  ON backups FOR DELETE
  USING (auth.uid() = user_id);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_backups_updated_at_trigger ON backups;
CREATE TRIGGER update_backups_updated_at_trigger
  BEFORE UPDATE ON backups
  FOR EACH ROW
  EXECUTE FUNCTION update_backups_updated_at();
        `;

        console.log('📄 سكريبت SQL لإنشاء جدول backups:');
        console.log('='.repeat(60));
        console.log(createTableSQL);
        console.log('='.repeat(60));
        
        console.log('\n💡 قم بتنفيذ السكريبت أعلاه في Supabase SQL Editor');
        console.log('📋 خطوات التنفيذ:');
        console.log('1. اذهب إلى Supabase Dashboard > SQL Editor');
        console.log('2. انسخ والصق السكريبت أعلاه');
        console.log('3. اضغط على Run لتنفيذ السكريبت');
        
      } else if (tableError) {
        console.log('❌ خطأ في الوصول لجدول backups:', tableError.message);
      } else {
        console.log('✅ جدول backups موجود بالفعل');
      }
    } catch (error) {
      console.log('⚠️ خطأ في التحقق من جدول backups:', error.message);
    }

    // 3. إنشاء سياسات Storage
    console.log('\n3️⃣ إنشاء سياسات Storage...');
    try {
      const storagePoliciesSQL = `
-- سياسات الأمان لـ bucket backups
DROP POLICY IF EXISTS "Users can upload their own backups" ON storage.objects;
CREATE POLICY "Users can upload their own backups"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own backups" ON storage.objects;
CREATE POLICY "Users can view their own backups"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own backups" ON storage.objects;
CREATE POLICY "Users can update their own backups"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own backups" ON storage.objects;
CREATE POLICY "Users can delete their own backups"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);
      `;

      console.log('📄 سكريبت SQL لسياسات Storage:');
      console.log('='.repeat(60));
      console.log(storagePoliciesSQL);
      console.log('='.repeat(60));
      
      console.log('\n💡 قم بتنفيذ سكريبت سياسات Storage في Supabase SQL Editor');
      
    } catch (error) {
      console.log('⚠️ خطأ في إنشاء سياسات Storage:', error.message);
    }

    // 4. اختبار النظام
    console.log('\n4️⃣ اختبار النظام...');
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
        console.log('💡 تأكد من إنشاء bucket backups أولاً');
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
    console.log('\n📋 الخطوات المطلوبة:');
    console.log('1. اذهب إلى Supabase Dashboard > SQL Editor');
    console.log('2. انسخ والصق سكريبت إنشاء الجدول (الخطوة 2)');
    console.log('3. اضغط على Run');
    console.log('4. انسخ والصق سكريبت سياسات Storage (الخطوة 3)');
    console.log('5. اضغط على Run');
    console.log('6. شغل: node scripts/test-backup-infrastructure.js');
    console.log('7. شغل: node scripts/test-backup-button.js (بعد تسجيل الدخول)');

    console.log('\n📁 ملفات SQL المحفوظة:');
    console.log('• scripts/create-backups-bucket.sql - سكريبت شامل');
    console.log('• scripts/setup-complete-backup-system.js - هذا الملف');

  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error.message);
    console.error('Stack:', error.stack);
  }
}

// تشغيل الإعداد
setupCompleteBackupSystem(); 