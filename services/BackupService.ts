import { supabase } from '../config/supabase';
import { logError } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionService } from './SubscriptionService';
import AuthService from '@/services/AuthService';

export interface BackupData {
  id: string;
  userId: string;
  backupType: 'manual' | 'automatic';
  fileCount: number;
  totalSize: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'restored' | 'expired';
  metadata: Record<string, unknown>;
}

export interface BackupProgress {
  current: number;
  total: number;
  message: string;
  percentage: number;
}

/** أسماء الجداول المدعومة حاليًا في النسخ الاحتياطي/الاستعادة */
export type BackupTableName = 'students' | 'reports' | 'comments' | 'file_attachments';

/** بيانات AsyncStorage المحلية المجمَّعة: كل قيمة كما خُزِّنت (نص JSON أو نص عادي) */
export type LocalBackupData = Record<string, string>;

/** صفوف كل جدول مدعوم؛ بلا نوع صف محدد لأن الأعمدة تختلف بين الجداول */
export type DatabaseBackupTables = Record<BackupTableName, Record<string, unknown>[]>;

export interface BackupFileSummary {
  localDataKeys: string[];
  databaseTables: string[];
  totalLocalItems: number;
  totalDatabaseRecords: number;
}

/** الشكل الكامل لملف JSON الناتج عن إنشاء نسخة احتياطية (وما تتوقعه الاستعادة عند التحميل) */
export interface BackupFileContents {
  version: string;
  timestamp: string;
  localData: LocalBackupData;
  databaseData: DatabaseBackupTables;
  summary: BackupFileSummary;
}

export class BackupService {
  private static instance: BackupService;
  private currentUserId: string | null = null;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private async getCurrentUserId(): Promise<string> {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    try {
      const user = await AuthService.getCurrentUser();

      if (!user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      this.currentUserId = user.id;
      return user.id;
    } catch (error) {
      console.error('خطأ في getCurrentUserId:', error);
      throw error;
    }
  }

  // إنشاء نسخة احتياطية من جميع بيانات المستخدم
  async createBackup(
    backupType: 'manual' | 'automatic' = 'manual',
    onProgress?: (progress: BackupProgress) => void
  ): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      console.log('بدء إنشاء النسخة الاحتياطية للمستخدم:', userId);
      
      // التحقق من صلاحيات النسخ الاحتياطي
      const canBackup = await this.checkBackupPermissions(userId);
      if (!canBackup) {
        return {
          success: false,
          error: 'لا تملك صلاحية إنشاء نسخ احتياطية. يرجى ترقية اشتراكك.'
        };
      }

      // جمع البيانات المحلية
      console.log('جاري جمع البيانات المحلية...');
      const localData = await this.collectLocalData();
      onProgress?.({
        current: 1,
        total: 4,
        message: 'جاري جمع البيانات المحلية...',
        percentage: 25
      });

      // جمع بيانات قاعدة البيانات
      console.log('جاري جمع بيانات قاعدة البيانات...');
      const databaseData = await this.collectDatabaseData(userId);
      onProgress?.({
        current: 2,
        total: 4,
        message: 'جاري جمع بيانات قاعدة البيانات...',
        percentage: 50
      });

      // إنشاء ملف النسخة الاحتياطية
      console.log('جاري إنشاء ملف النسخة الاحتياطية...');
      const backupFile = await this.createBackupFile(localData, databaseData);
      onProgress?.({
        current: 3,
        total: 4,
        message: 'جاري إنشاء ملف النسخة الاحتياطية...',
        percentage: 75
      });

      // رفع النسخة الاحتياطية إلى Storage
      console.log('جاري رفع النسخة الاحتياطية...');
      const backupId = await this.uploadBackup(backupFile, userId, backupType);
      onProgress?.({
        current: 4,
        total: 4,
        message: 'جاري رفع النسخة الاحتياطية...',
        percentage: 100
      });

      console.log('تم إنشاء النسخة الاحتياطية بنجاح:', backupId);
      return {
        success: true,
        backupId
      };

    } catch (error) {
      console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
      logError('خطأ في إنشاء النسخة الاحتياطية', 'BackupService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // استعادة نسخة احتياطية
  async restoreBackup(
    backupId: string,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      console.log('بدء استعادة النسخة الاحتياطية:', backupId, 'للمستخدم:', userId);
      
      onProgress?.({
        current: 1,
        total: 3,
        message: 'جاري تحميل النسخة الاحتياطية...',
        percentage: 33
      });

      // تحميل النسخة الاحتياطية
      const backupData = await this.downloadBackup(backupId, userId);
      if (!backupData) {
        console.error('فشل في تحميل النسخة الاحتياطية');
        return {
          success: false,
          error: 'فشل في تحميل النسخة الاحتياطية'
        };
      }

      console.log('تم تحميل النسخة الاحتياطية بنجاح');

      onProgress?.({
        current: 2,
        total: 3,
        message: 'جاري استعادة البيانات...',
        percentage: 66
      });

      // استعادة البيانات المحلية
      console.log('جاري استعادة البيانات المحلية...');
      await this.restoreLocalData(backupData.localData);

      // استعادة بيانات قاعدة البيانات
      console.log('جاري استعادة بيانات قاعدة البيانات...');
      await this.restoreDatabaseData(backupData.databaseData, userId);

      onProgress?.({
        current: 3,
        total: 3,
        message: 'تم استعادة النسخة الاحتياطية بنجاح',
        percentage: 100
      });

      console.log('تم استعادة النسخة الاحتياطية بنجاح');
      return { success: true };

    } catch (error) {
      console.error('خطأ في استعادة النسخة الاحتياطية:', error);
      logError('خطأ في استعادة النسخة الاحتياطية', 'BackupService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  /**
   * يحوّل صف الجدول الخام (أعمدة snake_case كما في backups: user_id, backup_type,
   * total_size, created_at, ...) إلى BackupData (camelCase). قبل هذا التحويل كانت
   * getUserBackups تُرجع الصفوف الخام مباشرة مع الادعاء بأنها BackupData - ما كان
   * يجعل settings.tsx's lastBackup.createdAt/.totalSize/.backupType دائمًا undefined
   * (تاريخ غير صالح، حجم "غير محدد"، ونوع "تلقائية" دائمًا) - اكتُشف أثناء تحسين
   * الأنواع (المرحلة 13) وأُصلح بموافقة صريحة.
   */
  private mapBackupRow(row: Record<string, unknown>): BackupData {
    return {
      id: String(row.id ?? ''),
      userId: String(row.user_id ?? ''),
      backupType: (row.backup_type as BackupData['backupType']) ?? 'manual',
      fileCount: Number(row.file_count ?? 0),
      totalSize: Number(row.total_size ?? 0),
      createdAt: String(row.created_at ?? ''),
      expiresAt: String(row.expires_at ?? ''),
      status: (row.status as BackupData['status']) ?? 'active',
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    };
  }

  // الحصول على قائمة النسخ الاحتياطية للمستخدم
  async getUserBackups(): Promise<BackupData[]> {
    try {
      const userId = await this.getCurrentUserId();

      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في الحصول على النسخ الاحتياطية:', error);
        // إذا كان الخطأ بسبب عدم وجود الجدول، نعيد مصفوفة فارغة
        if (error.message?.includes('relation "backups" does not exist')) {
          console.log('جدول backups غير موجود، سيتم إنشاؤه تلقائياً');
          return [];
        }
        throw error;
      }

      return (data || []).map((row) => this.mapBackupRow(row as Record<string, unknown>));
    } catch (error) {
      logError('خطأ في الحصول على النسخ الاحتياطية', 'BackupService', error);
      return [];
    }
  }

  // حذف نسخة احتياطية
  async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      logError('خطأ في حذف النسخة الاحتياطية', 'BackupService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // التحقق من صلاحيات النسخ الاحتياطي (الاشتراك المجاني = لا يسمح بالنسخ الاحتياطي)
  private async checkBackupPermissions(userId: string): Promise<boolean> {
    try {
      const subscription = await SubscriptionService.getCurrentSubscription(userId);
      if (!subscription || subscription.plan_type === 'free') {
        return false;
      }
      return true;
    } catch (error) {
      logError('خطأ في التحقق من صلاحيات النسخ الاحتياطي', 'BackupService', error);
      return false;
    }
  }

  // جمع البيانات المحلية
  private async collectLocalData(): Promise<LocalBackupData> {
    const localData: LocalBackupData = {};

    try {
      // جمع البيانات المحفوظة في AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      console.log('المفاتيح الموجودة في AsyncStorage:', keys);
      
      for (const key of keys) {
        try {
          if (key.startsWith('user') || key.startsWith('app') || key.startsWith('settings')) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              localData[key] = value;
            }
          }
        } catch (keyError) {
          console.log(`خطأ في قراءة المفتاح ${key}:`, keyError);
          // نستمر مع المفاتيح الأخرى
        }
      }
      
      console.log('تم جمع البيانات المحلية:', localData ? Object.keys(localData) : []);
    } catch (error) {
      console.error('خطأ في جمع البيانات المحلية:', error);
      logError('خطأ في جمع البيانات المحلية', 'BackupService', error);
    }

    return localData;
  }

  // جمع بيانات قاعدة البيانات
  private async collectDatabaseData(userId: string): Promise<DatabaseBackupTables> {
    const databaseData: DatabaseBackupTables = {
      students: [],
      reports: [],
      comments: [],
      file_attachments: [],
    };

    try {
      // جمع البيانات من الجداول المختلفة
      const tables: BackupTableName[] = ['students', 'reports', 'comments', 'file_attachments'];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('userid', userId);

          if (!error && data) {
            databaseData[table] = data as Record<string, unknown>[];
          } else if (error) {
            console.log(`خطأ في جمع بيانات الجدول ${table}:`, error);
            // نستمر مع الجداول الأخرى حتى لو فشل جدول واحد
            databaseData[table] = [];
          }
        } catch (tableError) {
          console.log(`خطأ في الوصول للجدول ${table}:`, tableError);
          databaseData[table] = [];
        }
      }
    } catch (error) {
      logError('خطأ في جمع بيانات قاعدة البيانات', 'BackupService', error);
    }

    return databaseData;
  }

  // إنشاء ملف النسخة الاحتياطية
  private async createBackupFile(localData: LocalBackupData, databaseData: DatabaseBackupTables): Promise<Blob> {
    try {
      const backupData: BackupFileContents = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        localData,
        databaseData,
        summary: {
          localDataKeys: localData ? Object.keys(localData) : [],
          databaseTables: databaseData ? Object.keys(databaseData) : [],
          totalLocalItems: localData ? Object.keys(localData).length : 0,
          totalDatabaseRecords: databaseData ? Object.values(databaseData).reduce((sum: number, table: Record<string, unknown>[]) => sum + (Array.isArray(table) ? table.length : 0), 0) : 0
        }
      };

      console.log('ملخص النسخة الاحتياطية:', backupData.summary);

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      console.log('تم إنشاء ملف النسخة الاحتياطية بحجم:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('خطأ في إنشاء ملف النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // رفع النسخة الاحتياطية
  private async uploadBackup(
    backupFile: Blob,
    userId: string,
    backupType: BackupData['backupType']
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${userId}-${timestamp}.json`;
      let filePath = `${userId}/${fileName}`;

      console.log('رفع الملف إلى Storage:', filePath);

      // التحقق من وجود bucket backups
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
          console.error('خطأ في التحقق من buckets:', bucketsError);
        } else {
          const backupsBucket = buckets?.find(bucket => bucket.name === 'backups');
          if (!backupsBucket) {
            console.log('bucket backups غير موجود، جاري إنشاؤه...');
            // محاولة إنشاء bucket (قد لا يعمل في الإنتاج)
            const { error: createError } = await supabase.storage.createBucket('backups', {
              public: false
            });
            if (createError) {
              console.error('خطأ في إنشاء bucket backups:', createError);
            }
          }
        }
      } catch (bucketCheckError) {
        console.log('خطأ في التحقق من buckets:', bucketCheckError);
      }

      // رفع الملف إلى Storage
      const { data, error } = await supabase.storage
        .from('backups')
        .upload(filePath, backupFile, {
          contentType: 'application/json',
          upsert: false
        });

      if (error) {
        console.error('خطأ في رفع الملف إلى Storage:', error);
        
        // محاولة رفع الملف إلى bucket attachments كبديل
        console.log('محاولة رفع الملف إلى bucket attachments كبديل...');
        const { data: altData, error: altError } = await supabase.storage
          .from('attachments')
          .upload(filePath, backupFile, {
            contentType: 'application/json',
            upsert: false
          });

        if (altError) {
          console.error('خطأ في رفع الملف إلى bucket attachments أيضاً:', altError);
          throw error; // نرمي الخطأ الأصلي
        }

        console.log('تم رفع الملف إلى bucket attachments بنجاح');
        // تحديث مسار الملف ليعكس bucket attachments
        filePath = `attachments/${filePath}`;
      }

      console.log('تم رفع الملف بنجاح، جاري حفظ المعلومات في قاعدة البيانات...');

      // حفظ معلومات النسخة الاحتياطية في قاعدة البيانات
      const { data: backupRecord, error: dbError } = await supabase
        .from('backups')
        .insert({
          user_id: userId,
          file_path: filePath,
          backup_type: backupType,
          file_count: 1, // ملف واحد فقط
          total_size: backupFile.size,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 يوم
          status: 'active',
          metadata: {
            version: '1.0',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single();

          if (dbError) {
      console.error('خطأ في حفظ معلومات النسخة الاحتياطية:', dbError);
      
      // إذا كان الخطأ بسبب عدم وجود الجدول، نعيد معرف فريد
      if (dbError.message?.includes('relation "backups" does not exist')) {
        console.log('جدول backups غير موجود، جاري إنشاء معرف فريد...');
        // إنشاء معرف فريد بدلاً من الاعتماد على قاعدة البيانات
        const backupId = `backup-${userId}-${Date.now()}`;
        console.log('تم إنشاء معرف النسخة الاحتياطية:', backupId);
        return backupId;
      }
      
      throw dbError;
    }

      console.log('تم حفظ معلومات النسخة الاحتياطية بنجاح:', backupRecord.id);
      return backupRecord.id;
    } catch (error) {
      console.error('خطأ في رفع النسخة الاحتياطية:', error);
      throw error;
    }
  }

  // تحميل النسخة الاحتياطية
  private async downloadBackup(backupId: string, userId: string): Promise<BackupFileContents> {
    // الحصول على معلومات النسخة الاحتياطية
    const { data: backupInfo, error: infoError } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .eq('user_id', userId)
      .single();

    if (infoError || !backupInfo) {
      throw new Error('النسخة الاحتياطية غير موجودة');
    }

    const filePath = String((backupInfo as Record<string, unknown>).file_path ?? '');

    // تحميل الملف من Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('backups')
      .download(filePath);

    if (fileError || !fileData) {
      throw new Error('فشل في تحميل ملف النسخة الاحتياطية');
    }

    // تحويل الملف إلى نص
    const text = await fileData.text();
    return JSON.parse(text) as BackupFileContents;
  }

  // استعادة البيانات المحلية
  private async restoreLocalData(localData: LocalBackupData): Promise<void> {
    try {
      // حذف البيانات المحلية الحالية
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);

      // استعادة البيانات من النسخة الاحتياطية
      const restorePromises = localData ? Object.entries(localData).map(([key, value]) =>
        AsyncStorage.setItem(key, value)
      ) : [];

      await Promise.all(restorePromises);
    } catch (error) {
      logError('خطأ في استعادة البيانات المحلية', 'BackupService', error);
      throw error;
    }
  }

  // استعادة بيانات قاعدة البيانات
  private async restoreDatabaseData(databaseData: DatabaseBackupTables, userId: string): Promise<void> {
    try {
      // حذف البيانات الحالية للمستخدم
      const tables = ['students', 'reports', 'comments', 'file_attachments'];
      
      for (const table of tables) {
        await supabase
          .from(table)
          .delete()
          .eq('userid', userId);
      }

      // استعادة البيانات من النسخة الاحتياطية
      for (const [table, records] of Object.entries(databaseData)) {
        if (Array.isArray(records) && records.length > 0) {
          await supabase
            .from(table)
            .insert(records);
        }
      }
    } catch (error) {
      logError('خطأ في استعادة بيانات قاعدة البيانات', 'BackupService', error);
      throw error;
    }
  }
} 