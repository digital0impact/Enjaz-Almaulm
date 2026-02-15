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
      '[Supabase] EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY غير معرّفة. أضفها في Vercel → Settings → Environment Variables ثم أعد النشر.'
    );
  }
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
