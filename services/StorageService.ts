import { supabase } from '../config/supabase';
import { logError } from '@/utils/logger';

export interface FileUploadOptions {
  bucket?: string;
  path?: string;
  fileType?: string;
  description?: string;
  relatedTable?: string;
  relatedId?: string;
}

export interface FileAttachment {
  id: string;
  userid: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  bucket_name: string;
  related_table?: string;
  related_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class StorageService {
  // رفع ملف إلى Storage
  static async uploadFile(
    file: File | Blob,
    fileName: string,
    options: FileUploadOptions = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const {
        bucket = 'attachments',
        path = '',
        fileType = 'application/octet-stream',
        description = '',
        relatedTable,
        relatedId
      } = options;

      // إنشاء مسار الملف
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const filePath = path ? `${path}/${fileName}` : `${userId}/${fileName}`;

      // رفع الملف
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: fileType,
          upsert: true
        });

      if (error) {
        throw error;
      }

      // حفظ معلومات الملف في قاعدة البيانات
      const { error: dbError } = await supabase
        .from('file_attachments')
        .insert({
          userid: userId,
          file_name: fileName,
          file_path: filePath,
          file_size: file instanceof File ? file.size : undefined,
          file_type: fileType,
          bucket_name: bucket,
          related_table: relatedTable,
          related_id: relatedId,
          description
        });

      if (dbError) {
        logError('خطأ في حفظ معلومات الملف', 'StorageService', dbError);
      }

      return {
        success: true,
        filePath: data.path
      };
    } catch (error) {
      logError('خطأ في رفع الملف', 'StorageService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // تحميل ملف من Storage
  static async downloadFile(bucket: string, filePath: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logError('خطأ في تحميل الملف', 'StorageService', error);
      return null;
    }
  }

  // الحصول على URL الملف
  static getFileUrl(bucket: string, filePath: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // حذف ملف من Storage
  static async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logError('خطأ في حذف الملف', 'StorageService', error);
      return false;
    }
  }

  // الحصول على قائمة ملفات المستخدم
  static async getUserFiles(userId?: string): Promise<FileAttachment[]> {
    try {
      const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!currentUserId) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('userid', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logError('خطأ في الحصول على ملفات المستخدم', 'StorageService', error);
      return [];
    }
  }

  // الحصول على ملفات مرتبطة بسجل معين
  static async getRelatedFiles(relatedTable: string, relatedId: string): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('related_table', relatedTable)
        .eq('related_id', relatedId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logError('خطأ في الحصول على الملفات المرتبطة', 'StorageService', error);
      return [];
    }
  }

  // حذف ملف من قاعدة البيانات
  static async deleteFileRecord(fileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      logError('خطأ في حذف سجل الملف', 'StorageService', error);
      return false;
    }
  }

  // رفع صورة شخصية
  static async uploadProfileImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const fileName = `profile-${userId}.jpg`;
      const filePath = `${userId}/${fileName}`;

      // رفع الصورة
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        throw error;
      }

      // الحصول على URL العام
      const url = this.getFileUrl('profile-images', filePath);

      return {
        success: true,
        url
      };
    } catch (error) {
      logError('خطأ في رفع الصورة الشخصية', 'StorageService', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
    }
  }

  // رفع وثيقة
  static async uploadDocument(
    file: File,
    description: string = '',
    relatedTable?: string,
    relatedId?: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return this.uploadFile(file, file.name, {
      bucket: 'documents',
      fileType: file.type,
      description,
      relatedTable,
      relatedId
    });
  }

  // رفع ملف مرفق عام
  static async uploadAttachment(
    file: File,
    description: string = '',
    relatedTable?: string,
    relatedId?: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return this.uploadFile(file, file.name, {
      bucket: 'attachments',
      fileType: file.type,
      description,
      relatedTable,
      relatedId
    });
  }
} 