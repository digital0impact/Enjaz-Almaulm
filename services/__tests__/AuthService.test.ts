/**
 * يتحقق من إصلاح اكتُشف أثناء اختبار يدوي: رابط إعادة تعيين كلمة المرور في
 * البريد كان يُبنى دائمًا من نطاق الصفحة الحالية (window.location.origin)
 * بدل الرابط الرسمي الثابت (EXPO_PUBLIC_APP_URL) - ما كان يجعل الرابط
 * يتوجّه لصفحة خاطئة كلما طُلبت إعادة التعيين من نطاق غير مُدرَج في قائمة
 * Redirect URLs المسموحة في Supabase (مثل رابط معاينة Vercel).
 */
import AuthService from '@/services/AuthService';

jest.mock('@/config/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

import { supabase } from '@/config/supabase';

describe('AuthService.resetPassword - رابط إعادة التوجيه الصحيح', () => {
  const originalWindow = (global as any).window;
  const originalEnv = process.env.EXPO_PUBLIC_APP_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    process.env.EXPO_PUBLIC_APP_URL = originalEnv;
  });

  it('يستخدم دائمًا EXPO_PUBLIC_APP_URL الرسمي حتى لو كان نطاق الصفحة الحالية مختلفًا (مثل معاينة Vercel)', async () => {
    process.env.EXPO_PUBLIC_APP_URL = 'https://www.enjaz-almaulm.com';
    (global as any).window = { location: { origin: 'https://enjaz-almaulm-preview123.vercel.app' } };

    await AuthService.resetPassword('teacher@example.com');

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'teacher@example.com',
      { redirectTo: 'https://www.enjaz-almaulm.com/auth/reset-password' }
    );
  });

  it('يرجع لنطاق الصفحة الحالية فقط عند عدم ضبط EXPO_PUBLIC_APP_URL إطلاقًا', async () => {
    delete process.env.EXPO_PUBLIC_APP_URL;
    (global as any).window = { location: { origin: 'https://www.enjaz-almaulm.com' } };

    await AuthService.resetPassword('teacher@example.com');

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'teacher@example.com',
      { redirectTo: 'https://www.enjaz-almaulm.com/auth/reset-password' }
    );
  });

  it('يستخدم الرابط الافتراضي الأخير عند غياب كل من APP_URL ونافذة المتصفح', async () => {
    delete process.env.EXPO_PUBLIC_APP_URL;
    delete (global as any).window;

    // بلا window (كما في بيئة native)، تُستخدم صيغة رابط native مباشرة
    await AuthService.resetPassword('teacher@example.com');

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'teacher@example.com',
      { redirectTo: 'enjazalmualm://auth/reset-password' }
    );
  });
});
