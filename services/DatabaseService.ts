
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  workLocation: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PerformanceData {
  id?: string;
  userId: string;
  axisId: string;
  axisTitle: string;
  evidences: Evidence[];
  score: number;
  createdAt?: any;
  updatedAt?: any;
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
  createdAt?: any;
  updatedAt?: any;
}

export interface Comment {
  id?: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  createdAt?: any;
  updatedAt?: any;
}

class DatabaseService {
  // User Profile Operations
  async saveUserProfile(userProfile: UserProfile): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'userProfiles'), {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'userProfiles', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'userProfiles', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Performance Data Operations
  async savePerformanceData(performanceData: PerformanceData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'performanceData'), {
        ...performanceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving performance data:', error);
      throw error;
    }
  }

  async getPerformanceData(userId: string): Promise<PerformanceData[]> {
    try {
      const q = query(
        collection(db, 'performanceData'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PerformanceData[];
    } catch (error) {
      console.error('Error getting performance data:', error);
      throw error;
    }
  }

  async updatePerformanceData(performanceId: string, updates: Partial<PerformanceData>): Promise<void> {
    try {
      const docRef = doc(db, 'performanceData', performanceId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating performance data:', error);
      throw error;
    }
  }

  // Alerts Operations
  async saveAlert(alert: Alert): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'alerts'), {
        ...alert,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    try {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
    try {
      const docRef = doc(db, 'alerts', alertId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  async deleteAlert(alertId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'alerts', alertId));
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  // Comments Operations
  async saveComment(comment: Comment): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        ...comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving comment:', error);
      throw error;
    }
  }

  async getComments(userId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async updateComment(commentId: string, updates: Partial<Comment>): Promise<void> {
    try {
      const docRef = doc(db, 'comments', commentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
