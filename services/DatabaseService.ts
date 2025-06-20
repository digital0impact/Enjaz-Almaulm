
import { supabase } from '../config/supabase';

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
        console.error('Error:', error);
        throw error;
      }
      console.log('Users:', data);
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // إضافة مستخدم جديد
  async addUser(name: string, email: string, phoneNumber?: string, jobTitle?: string, workLocation?: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ 
          name, 
          email, 
          phone_number: phoneNumber || '',
          job_title: jobTitle || '',
          work_location: workLocation || ''
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      console.log('User added:', data);
      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  // User Profile Operations
  async saveUserProfile(userProfile: UserProfile): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([userProfile])
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving user profile:', error);
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
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Performance Data Operations
  async savePerformanceData(performanceData: PerformanceData): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('performance_data')
        .insert([{...performanceData, userid: performanceData.userId}])
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving performance data:', error);
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
      return data || [];
    } catch (error) {
      console.error('Error getting performance data:', error);
      throw error;
    }
  }

  async updatePerformanceData(performanceId: string, updates: Partial<PerformanceData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_data')
        .update(updates)
        .eq('id', performanceId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating performance data:', error);
      throw error;
    }
  }

  // Alerts Operations
  async saveAlert(alert: Alert): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([{...alert, userid: alert.userId}])
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving alert:', error);
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
      return data || [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update(updates)
        .eq('id', alertId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating alert:', error);
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
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  // Comments Operations
  async saveComment(comment: Comment): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{...comment, userid: comment.userId}])
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving comment:', error);
      throw error;
    }
  }

  async getComments(userId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('userid', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', commentId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Delete Account Operations
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      console.log('Deleting account for userId:', userId);
      
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
        console.warn('Error deleting comments:', commentsError);
      }
      
      // حذف التنبيهات
      const { error: alertsError } = await supabase
        .from('alerts')
        .delete()
        .eq('userid', userId);
      
      if (alertsError) {
        console.warn('Error deleting alerts:', alertsError);
      }
      
      // حذف بيانات الأداء
      const { error: performanceError } = await supabase
        .from('performance_data')
        .delete()
        .eq('userid', userId);
      
      if (performanceError) {
        console.warn('Error deleting performance data:', performanceError);
      }
      
      // حذف الملف الشخصي أخيراً
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw new Error(`خطأ في حذف الملف الشخصي: ${profileError.message}`);
      }
      
      console.log('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

  async requestAccountDeletion(userId: string, reason?: string): Promise<void> {
    try {
      console.log('Requesting account deletion for userId:', userId);
      
      if (!userId) {
        throw new Error('معرف المستخدم مطلوب');
      }

      // التحقق من وجود الجدول أولاً
      const { data: tableCheck, error: tableError } = await supabase
        .from('account_deletion_requests')
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        console.error('Table check error:', tableError);
        throw new Error(`الجدول غير موجود أو خطأ في الاتصال: ${tableError.message || tableError.details || 'خطأ غير معروف'}`);
      }

      // إنشاء طلب حذف الحساب في جدول منفصل
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert([{
          userid: userId,
          reason: reason || '',
          status: 'pending',
          requested_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        const errorMessage = error.message || error.details || error.hint || 'خطأ غير معروف في قاعدة البيانات';
        throw new Error(`خطأ في إضافة طلب الحذف: ${errorMessage}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('فشل في إنشاء طلب الحذف - لم يتم إرجاع أي بيانات');
      }
      
      console.log('Account deletion request created successfully:', data);
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      // التأكد من أن الخطأ يحتوي على رسالة واضحة
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('خطأ غير متوقع في طلب حذف الحساب');
      }
    }
  }
}

export default new DatabaseService();
