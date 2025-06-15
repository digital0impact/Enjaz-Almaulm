
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
        .insert([performanceData])
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
        .eq('userId', userId)
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
        .insert([alert])
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
        .eq('userId', userId)
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
        .insert([comment])
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
        .eq('userId', userId)
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
}

export default new DatabaseService();
