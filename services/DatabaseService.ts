
import { firestore } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TeacherData {
  id?: string;
  name: string;
  subject: string;
  school: string;
  email: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentData {
  id?: string;
  name: string;
  grade: string;
  behavior: number;
  academic: number;
  participation: number;
  teacherId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class DatabaseService {
  private collection = firestore();

  // حفظ بيانات المعلم
  async saveTeacherData(data: TeacherData): Promise<string> {
    try {
      const docRef = await this.collection
        .collection('teachers')
        .add({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      
      // حفظ ID المعلم محلياً للاستخدام السريع
      await AsyncStorage.setItem('teacherId', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('خطأ في حفظ بيانات المعلم:', error);
      throw error;
    }
  }

  // جلب بيانات المعلم
  async getTeacherData(teacherId: string): Promise<TeacherData | null> {
    try {
      const doc = await this.collection
        .collection('teachers')
        .doc(teacherId)
        .get();
      
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as TeacherData;
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في جلب بيانات المعلم:', error);
      throw error;
    }
  }

  // حفظ بيانات الطالب
  async saveStudentData(data: StudentData): Promise<string> {
    try {
      const docRef = await this.collection
        .collection('students')
        .add({
          ...data,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      
      return docRef.id;
    } catch (error) {
      console.error('خطأ في حفظ بيانات الطالب:', error);
      throw error;
    }
  }

  // جلب جميع الطلاب للمعلم
  async getStudentsByTeacher(teacherId: string): Promise<StudentData[]> {
    try {
      const snapshot = await this.collection
        .collection('students')
        .where('teacherId', '==', teacherId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentData[];
    } catch (error) {
      console.error('خطأ في جلب بيانات الطلاب:', error);
      throw error;
    }
  }

  // تحديث بيانات الطالب
  async updateStudentData(studentId: string, data: Partial<StudentData>): Promise<void> {
    try {
      await this.collection
        .collection('students')
        .doc(studentId)
        .update({
          ...data,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('خطأ في تحديث بيانات الطالب:', error);
      throw error;
    }
  }

  // حذف بيانات الطالب
  async deleteStudentData(studentId: string): Promise<void> {
    try {
      await this.collection
        .collection('students')
        .doc(studentId)
        .delete();
    } catch (error) {
      console.error('خطأ في حذف بيانات الطالب:', error);
      throw error;
    }
  }

  // مزامنة البيانات المحلية مع Firebase
  async syncLocalDataToFirebase(): Promise<void> {
    try {
      const teacherId = await AsyncStorage.getItem('teacherId');
      if (!teacherId) return;

      // جلب البيانات المحلية
      const localStudents = await AsyncStorage.getItem('students');
      if (localStudents) {
        const students = JSON.parse(localStudents);
        
        // رفع كل طالب إلى Firebase
        for (const student of students) {
          if (!student.id) {
            await this.saveStudentData({ ...student, teacherId });
          }
        }
      }
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
    }
  }

  // جلب البيانات من Firebase وحفظها محلياً
  async syncFirebaseToLocal(teacherId: string): Promise<void> {
    try {
      const students = await this.getStudentsByTeacher(teacherId);
      await AsyncStorage.setItem('students', JSON.stringify(students));
    } catch (error) {
      console.error('خطأ في مزامنة البيانات من Firebase:', error);
    }
  }
}

export const databaseService = new DatabaseService();
