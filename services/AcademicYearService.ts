/**
 * خدمة العام الدراسي: تخزين واستعادة بيانات كل عام منفصل، وإنهاء العام وبدء عام جديد.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CURRENT_ACADEMIC_YEAR_KEY,
  YEAR_SCOPED_STORAGE_KEYS,
  getDefaultAcademicYearKey,
  getNextAcademicYearKey,
  type YearScopedKey,
} from '@/constants/academicYear';
import { logError } from '@/utils/logger';

const ARCHIVE_PREFIX = 'archive_';

export interface AcademicYearInfo {
  yearKey: string;
  label: string;
}

export const AcademicYearService = {
  /**
   * الحصول على العام الدراسي الحالي (المخزّن أو الافتراضي).
   */
  async getCurrentAcademicYear(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_ACADEMIC_YEAR_KEY);
      if (stored) return stored;
      const def = getDefaultAcademicYearKey();
      await AsyncStorage.setItem(CURRENT_ACADEMIC_YEAR_KEY, def);
      return def;
    } catch (e) {
      logError('getCurrentAcademicYear', 'AcademicYearService', e);
      return getDefaultAcademicYearKey();
    }
  },

  /**
   * تعيين العام الدراسي الحالي (عند التبديل إلى عام سابق أو جديد).
   */
  async setCurrentAcademicYear(yearKey: string): Promise<void> {
    await AsyncStorage.setItem(CURRENT_ACADEMIC_YEAR_KEY, yearKey);
  },

  /**
   * قائمة الأعوام المحفوظة (أرشيف) + العام الحالي.
   */
  async getArchivedYearKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const yearKeys = keys
        .filter((k) => k.startsWith(ARCHIVE_PREFIX))
        .map((k) => k.replace(ARCHIVE_PREFIX, ''));
      const current = await this.getCurrentAcademicYear();
      const set = new Set([current, ...yearKeys]);
      return Array.from(set).sort((a, b) => b.localeCompare(a));
    } catch (e) {
      logError('getArchivedYearKeys', 'AcademicYearService', e);
      return [await this.getCurrentAcademicYear()];
    }
  },

  /**
   * حفظ بيانات العام الحالي في أرشيف ثم تفريغ البيانات الحالية وبدء عام جديد.
   * يُنصح بعمل نسخة احتياطية (Backup) قبل الاستدعاء إن أردت نسخاً على السحابة.
   */
  async endYearAndStartNew(): Promise<{ success: boolean; newYearKey: string; error?: string }> {
    try {
      const currentYear = await this.getCurrentAcademicYear();
      const archiveKey = ARCHIVE_PREFIX + currentYear;

      const data: Record<string, string> = {};
      for (const key of YEAR_SCOPED_STORAGE_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value != null) data[key] = value;
      }
      await AsyncStorage.setItem(archiveKey, JSON.stringify(data));

      const newYearKey = getNextAcademicYearKey(currentYear);
      await this.setCurrentAcademicYear(newYearKey);

      for (const key of YEAR_SCOPED_STORAGE_KEYS) {
        await AsyncStorage.removeItem(key);
      }

      return { success: true, newYearKey };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logError('endYearAndStartNew', 'AcademicYearService', e);
      return { success: false, newYearKey: '', error: msg };
    }
  },

  /**
   * التبديل إلى عام دراسي محفوظ (استعادة بيانات ذلك العام إلى المفاتيح الحالية).
   */
  async switchToYear(yearKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const archiveKey = ARCHIVE_PREFIX + yearKey;
      const raw = await AsyncStorage.getItem(archiveKey);
      await this.setCurrentAcademicYear(yearKey);

      if (raw) {
        let obj: Record<string, string>;
        try {
          obj = JSON.parse(raw);
        } catch {
          return { success: false, error: 'تنسيق أرشيف العام غير صالح' };
        }
        for (const key of YEAR_SCOPED_STORAGE_KEYS) {
          if (obj[key] != null) await AsyncStorage.setItem(key, obj[key]);
          else await AsyncStorage.removeItem(key);
        }
      } else {
        for (const key of YEAR_SCOPED_STORAGE_KEYS) {
          await AsyncStorage.removeItem(key);
        }
      }
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logError('switchToYear', 'AcademicYearService', e);
      return { success: false, error: msg };
    }
  },

  /**
   * ترحيل البيانات الحالية: إن وُجدت بيانات في المفاتيح القديمة (بدون عام) وليس هناك أرشيف للعام الحالي،
   * ننسخها إلى أرشيف العام الحالي ثم نترك المفاتيح كما هي (لا حذف).
   * يُستدعى مرة عند بدء التطبيق أو عند أول استخدام للميزة.
   */
  async migrateToAcademicYearIfNeeded(): Promise<void> {
    try {
      const currentYear = await this.getCurrentAcademicYear();
      const archiveKey = ARCHIVE_PREFIX + currentYear;
      const hasArchive = (await AsyncStorage.getItem(archiveKey)) != null;
      if (hasArchive) return;

      let hasAnyData = false;
      const data: Record<string, string> = {};
      for (const key of YEAR_SCOPED_STORAGE_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value != null && value.length > 0) {
          data[key] = value;
          hasAnyData = true;
        }
      }
      if (hasAnyData) {
        await AsyncStorage.setItem(archiveKey, JSON.stringify(data));
      }
    } catch (e) {
      logError('migrateToAcademicYearIfNeeded', 'AcademicYearService', e);
    }
  },
};
