/**
 * أغلفة آمنة لعمليات AsyncStorage الشائعة: قراءة/كتابة JSON مع try/catch
 * وتسجيل الخطأ عبر logger.ts بدلاً من تكرار نفس نمط try/catch يدويًا
 * في كل خدمة (AuthService, AcademicYearService, VersionService, ...).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '@/utils/logger';

/**
 * قراءة قيمة JSON مخزّنة تحت `key`. تُعيد `fallback` إن لم توجد القيمة
 * أو فشلت القراءة/التحليل (بدلاً من رمي استثناء).
 */
export async function safeGetJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    logError(`فشل قراءة ${key} من التخزين المحلي`, 'safeStorage', error);
    return fallback;
  }
}

/**
 * قراءة قيمة نصية مخزّنة تحت `key`. تُعيد `fallback` إن لم توجد القيمة
 * أو فشلت القراءة.
 */
export async function safeGetItem(
  key: string,
  fallback: string | null = null
): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null || raw === undefined ? fallback : raw;
  } catch (error) {
    logError(`فشل قراءة ${key} من التخزين المحلي`, 'safeStorage', error);
    return fallback;
  }
}

/**
 * تخزين قيمة ككائن JSON. تُعيد true عند النجاح وfalse عند الفشل
 * (بدلاً من رمي استثناء يوقف عملية حفظ أكبر تحتوي عليها).
 */
export async function safeSetJSON(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    logError(`فشل حفظ ${key} في التخزين المحلي`, 'safeStorage', error);
    return false;
  }
}

/**
 * تخزين قيمة نصية. تُعيد true عند النجاح وfalse عند الفشل.
 */
export async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    logError(`فشل حفظ ${key} في التخزين المحلي`, 'safeStorage', error);
    return false;
  }
}
