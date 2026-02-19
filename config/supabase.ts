import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isWeb = typeof window !== 'undefined';
const hasEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasEnv && !isWeb) {
  throw new Error(
    'Missing Supabase env vars. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

if (!hasEnv && isWeb) {
  supabaseUrl = 'https://placeholder.supabase.co';
  supabaseAnonKey = 'placeholder-key';
  if (typeof console !== 'undefined') {
    console.warn(
      '[Supabase] EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY غير معرّفة. للتشغيل المحلي: أنشئ ملف .env من .env.example وضَع القيم ثم أعد تشغيل التطبيق.'
    );
  }
}

/** true إذا تم تعيين متغيرات Supabase الحقيقية (غير الوضع المؤقت على الويب) */
export const isSupabaseConfigured = hasEnv;

// على الويب نترك التخزين الافتراضي (localStorage) حتى تثبت الجلسة وتعمل بشكل صحيح
// استخدام AsyncStorage على الويب قد يسبب فشل تسجيل الدخول أو فقدان الجلسة
const authStorage = isWeb ? undefined : AsyncStorage;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(authStorage ? { storage: authStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,
  },
});
