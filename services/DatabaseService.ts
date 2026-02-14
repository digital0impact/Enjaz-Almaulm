import { supabase } from '../config/supabase';
import { logError } from '@/utils/logger';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  workLocation: string;
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceData {
  id?: string;
  userId: string;
  axisId: string;
  axisTitle: string;
  evidences: Evidence[];
  score: number;
  created_at?: string;
  updated_at?: string;
}

export interface Evidence {
  id: string;
  title: string;
  description: string;
  files: FileAttachment[];
  score: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
}

export interface Alert {
  id?: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id?: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

class DatabaseService {
  // مثال لجلب جميع المستخدمين
  async fetchUsers() {
    try {
      const { data, error } = await supabase.from('user_profiles').select('*');
      if (error) {
        logError('Error fetching users', 'DatabaseService', error);
        throw error;
      }
      return data;
    } catch (error) {
      logError('Error fetching users', 'DatabaseService', error);
      throw error;
    }
  }

  // إضافة/تحديث الملف الشخصي للمستخدم الحالي (يُستدعى مع معرف المستخدم من auth)
  async addUser(name: string, email: string, phoneNumber?: string, jobTitle?: string, workLocation?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('يجب تسجيل الدخول أولاً');
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: user.id,
            name,
            email,
            phone_number: phoneNumber || '',
            job_title: jobTitle || '',
            work_location: workLocation || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();
      if (error) {
        logError('Insert error', 'DatabaseService', error);
        throw error;
      }
      return data;
    } catch (error) {
      logError('Error adding user', 'DatabaseService', error);
      throw error;
    }
  }

  // User Profile Operations
  async saveUserProfile(userProfile: UserProfile): Promise<string> {
    try {
      const id = userProfile.id;
      if (!id) throw new Error('معرف المستخدم مطلوب لحفظ الملف الشخصي');
      const row = {
        id,
        name: userProfile.name,
        email: userProfile.email,
        phone_number: userProfile.phoneNumber ?? '',
        job_title: userProfile.jobTitle ?? '',
        work_location: userProfile.workLocation ?? '',
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data.id;
    } catch (error) {
      logError('Error saving user profile', 'DatabaseService', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name ?? '',
        email: data.email ?? '',
        phoneNumber: data.phone_number ?? '',
        jobTitle: data.job_title ?? '',
        workLocation: data.work_location ?? '',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      logError('Error getting user profile', 'DatabaseService', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.email !== undefined) row.email = updates.email;
      if (updates.phoneNumber !== undefined) row.phone_number = updates.phoneNumber;
      if (updates.jobTitle !== undefined) row.job_title = updates.jobTitle;
      if (updates.workLocation !== undefined) row.work_location = updates.workLocation;
      const { error } = await supabase.from('user_profiles').update(row).eq('id', userId);
      if (error) throw error;
    } catch (error) {
      logError('Error updating user profile', 'DatabaseService', error);
      throw error;
    }
  }

  // Performance Data Operations
  async savePerformanceData(performanceData: PerformanceData): Promise<string> {
    try {
      const row = {
        userid: performanceData.userId,
        axis_id: performanceData.axisId,
        axis_title: performanceData.axisTitle,
        evidences: performanceData.evidences ?? [],
        score: performanceData.score,
      };
      const { data, error } = await supabase
        .from('performance_data')
        .insert([row])
        .select()
        .single();
      if (error) throw error;
      return data.id;
    } catch (error) {
      logError('Error saving performance data', 'DatabaseService', error);
      throw error;
    }
  }

  async getPerformanceData(userId: string): Promise<PerformanceData[]> {
    try {
      const { data, error } = await supabase
        .from('performance_data')
        .select('*')
        .eq('userid', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id,
        userId: row.userid,
        axisId: row.axis_id,
        axisTitle: row.axis_title,
        evidences: (row.evidences as Evidence[]) ?? [],
        score: Number(row.score),
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      logError('Error getting performance data', 'DatabaseService', error);
      throw error;
    }
  }

  async updatePerformanceData(performanceId: string, updates: Partial<PerformanceData>): Promise<void> {
    try {
      const row: Record<string, unknown> = {};
      if (updates.axisId !== undefined) row.axis_id = updates.axisId;
      if (updates.axisTitle !== undefined) row.axis_title = updates.axisTitle;
      if (updates.evidences !== undefined) row.evidences = updates.evidences;
      if (updates.score !== undefined) row.score = updates.score;
      if (Object.keys(row).length === 0) return;
      const { error } = await supabase.from('performance_data').update(row).eq('id', performanceId);
      if (error) throw error;
    } catch (error) {
      logError('Error updating performance data', 'DatabaseService', error);
      throw error;
    }
  }

  // Alerts Operations
  async saveAlert(alert: Alert): Promise<string> {
    try {
      const row = {
        userid: alert.userId,
        title: alert.title,
        description: alert.description ?? '',
        date: alert.date,
        time: alert.time,
        is_active: alert.isActive ?? true,
      };
      const { data, error } = await supabase.from('alerts').insert([row]).select().single();
      if (error) throw error;
      return data.id;
    } catch (error) {
      logError('Error saving alert', 'DatabaseService', error);
      throw error;
    }
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('userid', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id,
        userId: row.userid,
        title: row.title,
        description: row.description,
        date: row.date,
        time: row.time,
        isActive: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      logError('Error getting alerts', 'DatabaseService', error);
      throw error;
    }
  }

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
    try {
      const row: Record<string, unknown> = {};
      if (updates.title !== undefined) row.title = updates.title;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.date !== undefined) row.date = updates.date;
      if (updates.time !== undefined) row.time = updates.time;
      if (updates.isActive !== undefined) row.is_active = updates.isActive;
      if (Object.keys(row).length === 0) return;
      const { error } = await supabase.from('alerts').update(row).eq('id', alertId);
      if (error) throw error;
    } catch (error) {
      logError('Error updating alert', 'DatabaseService', error);
      throw error;
    }
  }

  async deleteAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) throw error;
    } catch (error) {
      logError('Error deleting alert', 'DatabaseService', error);
      throw error;
    }
  }



  // Delete Account Operations
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      
      if (!userId) {
        throw new Error('معرف المستخدم مطلوب');
      }

      // حذف جميع البيانات المرتبطة بالمستخدم
      
      // حذف التعليقات
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('userid', userId);
      
      if (commentsError) {
        logError('Error deleting comments', 'DatabaseService', commentsError);
      }
      
      // حذف التنبيهات
      const { error: alertsError } = await supabase
        .from('alerts')
        .delete()
        .eq('userid', userId);
      
      if (alertsError) {
        logError('Error deleting alerts', 'DatabaseService', alertsError);
      }
      
      // حذف بيانات الأداء
      const { error: performanceError } = await supabase
        .from('performance_data')
        .delete()
        .eq('userid', userId);
      
      if (performanceError) {
        logError('Error deleting performance data', 'DatabaseService', performanceError);
      }
      
      // حذف الملف الشخصي أخيراً
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        logError('Error deleting user profile', 'DatabaseService', profileError);
        throw new Error(`خطأ في حذف الملف الشخصي: ${profileError.message}`);
      }
    } catch (error) {
      logError('Error deleting user account', 'DatabaseService', error);
      throw error;
    }
  }

  async requestAccountDeletion(userId: string, reason?: string): Promise<void> {
    try {
      
      if (!userId) {
        throw new Error('معرف المستخدم مطلوب');
      }

      // محاولة إنشاء طلب حذف الحساب
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert([{
          userid: userId,
          reason: reason || 'لم يتم تحديد السبب',
          status: 'pending',
          requested_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        logError('Supabase insert error', 'DatabaseService', error);
        
        // التحقق من نوع الخطأ
        if (error.code === '42P01') {
          // الجدول غير موجود
          throw new Error('جدول طلبات حذف الحساب غير موجود في قاعدة البيانات. يرجى التواصل مع المطور لإنشاء الجدول.');
        } else if (error.code === '23505') {
          // مفتاح مكرر
          throw new Error('يوجد بالفعل طلب حذف حساب قيد المعالجة لهذا المستخدم.');
        } else {
          // أخطاء أخرى
          const errorMessage = error.message || error.details || error.hint || 'خطأ غير معروف في قاعدة البيانات';
          throw new Error(`خطأ في إضافة طلب الحذف: ${errorMessage}`);
        }
      }
      
      if (!data || data.length === 0) {
        throw new Error('فشل في إنشاء طلب الحذف - لم يتم إرجاع أي بيانات');
      }
      

    } catch (error) {
      logError('Error requesting account deletion', 'DatabaseService', error);
      
      // التأكد من أن الخطأ يحتوي على رسالة واضحة
      if (error instanceof Error) {
        throw error; // إرجاع الخطأ كما هو
      } else {
        throw new Error('خطأ غير متوقع في طلب حذف الحساب');
      }
    }
  }
}

export default new DatabaseService();
