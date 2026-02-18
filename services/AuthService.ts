import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { logError } from '@/utils/logger';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

const USER_STORAGE_KEY = 'userInfo';
const TOKEN_STORAGE_KEY = 'userToken';

class AuthService {
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('فشل في تسجيل الدخول');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
      };

      await this.saveUserLocally(user, data.session?.access_token);
      return user;
    } catch (error) {
      logError('Sign in error', 'AuthService', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, name: string, phoneNumber?: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            ...(phoneNumber ? { phone_number: phoneNumber } : {}),
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('فشل في إنشاء الحساب');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: name,
      };

      await this.saveUserLocally(user, data.session?.access_token);
      return user;
    } catch (error) {
      logError('Sign up error', 'AuthService', error);
      throw error;
    }
  }

  async signInWithApple(): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'enjazalmualm://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.url) {
        throw new Error('فشل في إنشاء رابط تسجيل الدخول');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'enjazalmualm://auth/callback'
      );

      if (result.type === 'success') {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (!code) {
          throw new Error('لم يتم العثور على رمز المصادقة');
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!sessionData.user) {
          throw new Error('فشل في الحصول على بيانات المستخدم');
        }

        const user: User = {
          id: sessionData.user.id,
          email: sessionData.user.email || '',
          name: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name,
          avatar_url: sessionData.user.user_metadata?.avatar_url,
        };

        await this.saveUserLocally(user, sessionData.session?.access_token);
        return user;
      } else if (result.type === 'cancel') {
        throw new Error('تم إلغاء تسجيل الدخول');
      } else {
        throw new Error('حدث خطأ أثناء تسجيل الدخول');
      }
    } catch (error) {
      logError('Apple sign in error', 'AuthService', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      await this.clearLocalData();
    } catch (error) {
      logError('Sign out error', 'AuthService', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw new Error(error.message);
      }

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
      };
    } catch (error) {
      logError('Get current user error', 'AuthService', error);
      return null;
    }
  }

  private async saveUserLocally(user: User, token?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch (error) {
      logError('Error saving user locally', 'AuthService', error);
    }
  }

  private async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      logError('Error clearing local data', 'AuthService', error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'enjazalmualm://auth/reset-password',
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      logError('Reset password error', 'AuthService', error);
      throw error;
    }
  }

  async checkAuthStatus(): Promise<User | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      if (!session?.user) {
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        avatar_url: session.user.user_metadata?.avatar_url,
      };
    } catch (error) {
      logError('Check auth status error', 'AuthService', error);
      return null;
    }
  }
}

export default new AuthService();
