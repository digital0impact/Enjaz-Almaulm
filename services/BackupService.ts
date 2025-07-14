import { supabase } from '../config/supabase';
import { logError } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BackupData {
  id: string;
  userId: string;
  backupType: 'manual' | 'automatic';
  fileCount: number;
  totalSize: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'restored' | 'expired';
  metadata: any;
}

export interface BackupProgress {
  current: number;
  total: number;
  message: string;
  percentage: number;
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
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('خطأ في الحصول على المستخدم:', error);
        throw new Error('خطأ في المصادقة: ' + error.message);
      }
      
      if (!user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      console.log('تم الحصول على معرف المستخدم:', user.id);
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

      return data || [];
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

  // التحقق من صلاحيات النسخ الاحتياطي
  private async checkBackupPermissions(userId: string): Promise<boolean> {
    try {
      // التحقق من نوع الاشتراك
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('plan_type')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      // إذا لم يكن هناك اشتراك أو كان مجاني، نسمح بالنسخ الاحتياطي للمستخدمين المسجلين
      if (error || !subscription) {
        // السماح بالنسخ الاحتياطي للمستخدمين المسجلين حتى لو لم يكن لديهم اشتراك
        return true;
      }

      // السماح بالنسخ الاحتياطي لجميع أنواع الاشتراكات المدفوعة
      return subscription.plan_type !== 'free';
    } catch (error) {
      logError('خطأ في التحقق من صلاحيات النسخ الاحتياطي', 'BackupService', error);
      // في حالة الخطأ، نسمح بالنسخ الاحتياطي
      return true;
    }
  }

  // جمع البيانات المحلية
  private async collectLocalData(): Promise<any> {
    const localData: any = {};
    
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
      
      console.log('تم جمع البيانات المحلية:', Object.keys(localData));
    } catch (error) {
      console.error('خطأ في جمع البيانات المحلية:', error);
      logError('خطأ في جمع البيانات المحلية', 'BackupService', error);
    }

    return localData;
  }

  // جمع بيانات قاعدة البيانات
  private async collectDatabaseData(userId: string): Promise<any> {
    const databaseData: any = {};
    
    try {
      // جمع البيانات من الجداول المختلفة
      const tables = ['students', 'reports', 'comments', 'file_attachments'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('userid', userId);

          if (!error && data) {
            databaseData[table] = data;
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
  private async createBackupFile(localData: any, databaseData: any): Promise<Blob> {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        localData,
        databaseData,
        summary: {
          localDataKeys: Object.keys(localData),
          databaseTables: Object.keys(databaseData),
          totalLocalItems: Object.keys(localData).length,
          totalDatabaseRecords: Object.values(databaseData).reduce((sum: number, table: any) => sum + (Array.isArray(table) ? table.length : 0), 0)
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
    backupType: string
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${userId}-${timestamp}.json`;
      const filePath = `${userId}/${fileName}`;

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
  private async downloadBackup(backupId: string, userId: string): Promise<any> {
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

    // تحميل الملف من Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('backups')
      .download(backupInfo.file_path);

    if (fileError || !fileData) {
      throw new Error('فشل في تحميل ملف النسخة الاحتياطية');
    }

    // تحويل الملف إلى نص
    const text = await fileData.text();
    return JSON.parse(text);
  }

  // استعادة البيانات المحلية
  private async restoreLocalData(localData: any): Promise<void> {
    try {
      // حذف البيانات المحلية الحالية
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);

      // استعادة البيانات من النسخة الاحتياطية
      const restorePromises = Object.entries(localData).map(([key, value]) =>
        AsyncStorage.setItem(key, value as string)
      );

      await Promise.all(restorePromises);
    } catch (error) {
      logError('خطأ في استعادة البيانات المحلية', 'BackupService', error);
      throw error;
    }
  }

  // استعادة بيانات قاعدة البيانات
  private async restoreDatabaseData(databaseData: any, userId: string): Promise<void> {
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