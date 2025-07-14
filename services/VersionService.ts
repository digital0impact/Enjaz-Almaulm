import AsyncStorage from '@react-native-async-storage/async-storage';
import { VERSION_INFO } from '@/constants/Version';
import { logError } from '@/utils/logger';

export class VersionService {
  private static readonly VERSION_KEY = 'app_version_info';
  private static readonly UPDATES_KEY = 'version_updates_log';

  // حفظ معلومات الإصدار الحالي
  static async saveCurrentVersion(): Promise<void> {
    try {
      const versionData = {
        ...VERSION_INFO.getVersionInfo(),
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.VERSION_KEY, JSON.stringify(versionData));
    } catch (error) {
      logError('خطأ في حفظ معلومات الإصدار', 'VersionService', error);
    }
  }

  // استرجاع معلومات الإصدار المحفوظة
  static async getSavedVersion(): Promise<any> {
    try {
      const savedVersion = await AsyncStorage.getItem(this.VERSION_KEY);
      return savedVersion ? JSON.parse(savedVersion) : null;
    } catch (error) {
      logError('خطأ في استرجاع معلومات الإصدار', 'VersionService', error);
      return null;
    }
  }

  // تسجيل تحديث الإصدار
  static async logVersionUpdate(oldVersion: string, newVersion: string): Promise<void> {
    try {
      const updateLog = {
        oldVersion,
        newVersion,
        timestamp: new Date().toISOString(),
        type: this.getUpdateType(oldVersion, newVersion)
      };

      const existingLogs = await this.getUpdateLogs();
      existingLogs.push(updateLog);

      await AsyncStorage.setItem(this.UPDATES_KEY, JSON.stringify(existingLogs));
    } catch (error) {
      logError('خطأ في تسجيل تحديث الإصدار', 'VersionService', error);
    }
  }

  // استرجاع سجل التحديثات
  static async getUpdateLogs(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem(this.UPDATES_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      logError('خطأ في استرجاع سجل التحديثات', 'VersionService', error);
      return [];
    }
  }

  // تحديد نوع التحديث (رئيسي، فرعي، إصلاح)
  private static getUpdateType(oldVersion: string, newVersion: string): string {
    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);

    if (newParts[0] > oldParts[0]) return 'تحديث رئيسي';
    if (newParts[1] > oldParts[1]) return 'تحديث فرعي';
    if (newParts[2] > oldParts[2]) return 'إصلاح أخطاء';
    return 'تحديث بناء';
  }

  // فحص التحديثات
  static async checkForUpdates(): Promise<boolean> {
    try {
      const savedVersion = await this.getSavedVersion();
      const currentVersion = VERSION_INFO.getFullVersion();
      
      if (!savedVersion) {
        await this.saveCurrentVersion();
        return false;
      }

      if (savedVersion.fullVersion !== currentVersion) {
        await this.logVersionUpdate(savedVersion.fullVersion, currentVersion);
        await this.saveCurrentVersion();
        return true;
      }

      return false;
    } catch (error) {
      logError('خطأ في فحص التحديثات', 'VersionService', error);
      return false;
    }
  }

  // الحصول على إحصائيات الإصدار
  static async getVersionStats(): Promise<{
    currentVersion: string;
    totalUpdates: number;
    lastUpdate: string | null;
    installDate: string | null;
  }> {
    try {
      const logs = await this.getUpdateLogs();
      const savedVersion = await this.getSavedVersion();
      
      return {
        currentVersion: VERSION_INFO.getFullVersion(),
        totalUpdates: logs.length,
        lastUpdate: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
        installDate: savedVersion?.timestamp || null
      };
    } catch (error) {
      logError('خطأ في الحصول على إحصائيات الإصدار', 'VersionService', error);
      return {
        currentVersion: VERSION_INFO.getFullVersion(),
        totalUpdates: 0,
        lastUpdate: null,
        installDate: null
      };
    }
  }
}
