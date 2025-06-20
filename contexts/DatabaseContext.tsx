
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import DatabaseService, { UserProfile, PerformanceData, Alert, Comment } from '../services/DatabaseService';

interface DatabaseContextType {
  // User Profile
  userProfile: UserProfile | null;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Performance Data
  performanceData: PerformanceData[];
  savePerformanceData: (data: PerformanceData) => Promise<void>;
  updatePerformanceData: (id: string, updates: Partial<PerformanceData>) => Promise<void>;
  
  // Alerts
  alerts: Alert[];
  saveAlert: (alert: Alert) => Promise<void>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  
  // Comments
  comments: Comment[];
  saveComment: (comment: Comment) => Promise<void>;
  updateComment: (id: string, updates: Partial<Comment>) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  
  // Account Management
  deleteUserAccount: () => Promise<void>;
  requestAccountDeletion: (reason?: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
  userId: string;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children, userId }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load user profile
      const profile = await DatabaseService.getUserProfile(userId);
      setUserProfile(profile);
      
      // Load performance data
      const perfData = await DatabaseService.getPerformanceData(userId);
      setPerformanceData(perfData);
      
      // Load alerts
      const userAlerts = await DatabaseService.getAlerts(userId);
      setAlerts(userAlerts);
      
      // Load comments
      const userComments = await DatabaseService.getComments(userId);
      setComments(userComments);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserProfile = async (profile: UserProfile) => {
    try {
      setError(null);
      const id = await DatabaseService.saveUserProfile({ ...profile, id: userId });
      setUserProfile({ ...profile, id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حفظ الملف الشخصي');
      throw err;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      await DatabaseService.updateUserProfile(userId, updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحديث الملف الشخصي');
      throw err;
    }
  };

  const savePerformanceData = async (data: PerformanceData) => {
    try {
      setError(null);
      const id = await DatabaseService.savePerformanceData({ ...data, userId });
      setPerformanceData(prev => [{ ...data, id }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حفظ بيانات الأداء');
      throw err;
    }
  };

  const updatePerformanceData = async (id: string, updates: Partial<PerformanceData>) => {
    try {
      setError(null);
      await DatabaseService.updatePerformanceData(id, updates);
      setPerformanceData(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحديث بيانات الأداء');
      throw err;
    }
  };

  const saveAlert = async (alert: Alert) => {
    try {
      setError(null);
      const id = await DatabaseService.saveAlert({ ...alert, userId });
      setAlerts(prev => [{ ...alert, id }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حفظ التنبيه');
      throw err;
    }
  };

  const updateAlert = async (id: string, updates: Partial<Alert>) => {
    try {
      setError(null);
      await DatabaseService.updateAlert(id, updates);
      setAlerts(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحديث التنبيه');
      throw err;
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      setError(null);
      await DatabaseService.deleteAlert(id);
      setAlerts(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حذف التنبيه');
      throw err;
    }
  };

  const saveComment = async (comment: Comment) => {
    try {
      setError(null);
      const id = await DatabaseService.saveComment({ ...comment, userId });
      setComments(prev => [{ ...comment, id }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حفظ التعليق');
      throw err;
    }
  };

  const updateComment = async (id: string, updates: Partial<Comment>) => {
    try {
      setError(null);
      await DatabaseService.updateComment(id, updates);
      setComments(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحديث التعليق');
      throw err;
    }
  };

  const deleteComment = async (id: string) => {
    try {
      setError(null);
      await DatabaseService.deleteComment(id);
      setComments(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حذف التعليق');
      throw err;
    }
  };

  const deleteUserAccount = async () => {
    try {
      setError(null);
      await DatabaseService.deleteUserAccount(userId);
      // إعادة تعيين جميع البيانات
      setUserProfile(null);
      setPerformanceData([]);
      setAlerts([]);
      setComments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في حذف الحساب');
      throw err;
    }
  };

  const requestAccountDeletion = async (reason?: string) => {
    try {
      setError(null);
      await DatabaseService.requestAccountDeletion(userId, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في طلب حذف الحساب');
      throw err;
    }
  };

  const value: DatabaseContextType = {
    userProfile,
    saveUserProfile,
    updateUserProfile,
    performanceData,
    savePerformanceData,
    updatePerformanceData,
    alerts,
    saveAlert,
    updateAlert,
    deleteAlert,
    comments,
    saveComment,
    updateComment,
    deleteComment,
    deleteUserAccount,
    requestAccountDeletion,
    isLoading,
    error
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
