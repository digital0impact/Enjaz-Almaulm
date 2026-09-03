/**
 * وضع العرض التجريبي (Demo): يسمح لزائر لم يسجّل دخولاً باستكشاف التطبيق
 * ببيانات واقعية جاهزة، دون أي حفظ حقيقي.
 *
 * الآلية: بدلاً من تعديل استيراد AsyncStorage في عشرات الملفات، نُعدِّل
 * (monkey-patch) طرق النسخة الحقيقية الوحيدة المستوردة من
 * '@react-native-async-storage/async-storage' في مكانٍ واحد فقط، بحيث
 * تُقرأ/تُكتب البيانات من/إلى ذاكرة الجلسة فقط أثناء وضع العرض (لا تصل
 * التخزين الحقيقي على الجهاز/المتصفح إطلاقًا). كل الشاشات تستورد نفس
 * النسخة (singleton)، فتنعكس عليها هذه التعديلات تلقائيًا دون أي تعديل
 * في أي ملف آخر.
 *
 * الجزء المتصل فعليًا بـSupabase (الأداء المهني، التنبيهات، التعليقات...)
 * محمي بسياسات RLS في قاعدة البيانات نفسها (انظر migration الخاصة بحساب
 * العرض التجريبي)، وليس هنا — فهذا الملف يغطي التخزين المحلي فقط.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDemoStorageEntries } from '@/data/demoSeedData';

const DEMO_FLAG_KEY = '__enjaz_demo_mode_active__';

let patched = false;
let active = false;
const demoStore = new Map<string, string>();

// الطرق الحقيقية الأصلية قبل أي تعديل، لاستخدامها خارج وضع العرض ولحفظ/قراءة
// علم تفعيل الوضع نفسه (لا يجب أن يمرّ عبر الذاكرة المؤقتة)
const real = {
  getItem: AsyncStorage.getItem.bind(AsyncStorage),
  setItem: AsyncStorage.setItem.bind(AsyncStorage),
  removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
  multiRemove: AsyncStorage.multiRemove.bind(AsyncStorage),
  getAllKeys: AsyncStorage.getAllKeys.bind(AsyncStorage),
  clear: AsyncStorage.clear.bind(AsyncStorage),
};

function patchOnce() {
  if (patched) return;
  patched = true;

  (AsyncStorage as any).getItem = async (key: string): Promise<string | null> => {
    if (active) return demoStore.has(key) ? (demoStore.get(key) as string) : null;
    return real.getItem(key);
  };
  (AsyncStorage as any).setItem = async (key: string, value: string): Promise<void> => {
    if (active) {
      demoStore.set(key, value);
      return;
    }
    return real.setItem(key, value);
  };
  (AsyncStorage as any).removeItem = async (key: string): Promise<void> => {
    if (active) {
      demoStore.delete(key);
      return;
    }
    return real.removeItem(key);
  };
  (AsyncStorage as any).multiRemove = async (keys: readonly string[]): Promise<void> => {
    if (active) {
      keys.forEach((k) => demoStore.delete(k));
      return;
    }
    return real.multiRemove(keys as string[]);
  };
  (AsyncStorage as any).getAllKeys = async (): Promise<readonly string[]> => {
    if (active) return Array.from(demoStore.keys());
    return real.getAllKeys();
  };
  (AsyncStorage as any).clear = async (): Promise<void> => {
    if (active) {
      demoStore.clear();
      return;
    }
    return real.clear();
  };
}

/** هل وضع العرض التجريبي مُفعَّل حاليًا في هذه الجلسة؟ */
export function isDemoModeActive(): boolean {
  return active;
}

/**
 * يُستدعى عند دخول صفحة العرض التجريبي (`/demo`)، قبل أي تنقّل أو تحميل
 * بيانات، حتى تُقرأ البيانات المحقونة لاحقًا (seedDemoStorage) بدل الفارغة.
 */
export async function enterDemoMode(): Promise<void> {
  patchOnce();
  active = true;
  demoStore.clear();
  await real.setItem(DEMO_FLAG_KEY, 'true');
}

/** يُستدعى من زر "الخروج من الوضع التجريبي" */
export async function exitDemoMode(): Promise<void> {
  active = false;
  demoStore.clear();
  await real.removeItem(DEMO_FLAG_KEY);
}

/**
 * يُستدعى مرة عند بدء التطبيق (app/_layout.tsx) لاستعادة وضع العرض بعد
 * تحديث الصفحة (الويب) أثناء نفس زيارة الجلسة. ذاكرة الجلسة (demoStore)
 * فارغة دائمًا بعد أي تحديث للصفحة (متغيّر JS عادي، لا يُخزَّن)، فيلزم
 * إعادة حقن نفس البيانات التجريبية الثابتة هنا أيضًا — وإلا يبقى الوضع
 * التجريبي "مفعّلاً" ظاهريًا لكن بلا أي بيانات (AsyncStorage.getItem يعيد
 * null لكل شيء)، وهي بالضبط المشكلة التي كانت تحدث قبل هذا الإصلاح.
 */
export async function restoreDemoModeIfActive(): Promise<boolean> {
  patchOnce();
  const flag = await real.getItem(DEMO_FLAG_KEY);
  if (flag === 'true') {
    active = true;
    demoStore.clear();
    seedDemoStorage(buildDemoStorageEntries());
  }
  return active;
}

/** حقن بيانات العرض التجريبي في ذاكرة الجلسة (بعد enterDemoMode) */
export function seedDemoStorage(entries: Record<string, string>): void {
  Object.entries(entries).forEach(([key, value]) => demoStore.set(key, value));
}
