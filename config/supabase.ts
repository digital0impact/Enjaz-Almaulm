import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// قم بتحديث هذه القيم بالمعرفات الجديدة من مشروع Supabase الخاص بك
const supabaseUrl = 'https://feidqejihjnvayikhbli.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaWRxZWppaGpudmF5aWtoYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjI0NDIsImV4cCI6MjA2Njk5ODQ0Mn0.w-NSSW2xCjkOOnEcr78x9e0o0mB9PDa5oEIIYy-yzkA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
