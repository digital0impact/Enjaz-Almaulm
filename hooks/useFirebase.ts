
import { useState, useEffect } from 'react';
import { databaseService, TeacherData, StudentData } from '../services/DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFirebase = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    initializeFirebase();
  }, []);

  const initializeFirebase = async () => {
    try {
      setIsLoading(true);
      const storedTeacherId = await AsyncStorage.getItem('teacherId');
      if (storedTeacherId) {
        setTeacherId(storedTeacherId);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('خطأ في تهيئة Firebase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTeacher = async (teacherData: TeacherData) => {
    try {
      setIsLoading(true);
      const id = await databaseService.saveTeacherData(teacherData);
      setTeacherId(id);
      setIsConnected(true);
      return id;
    } catch (error) {
      console.error('خطأ في حفظ بيانات المعلم:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveStudent = async (studentData: Omit<StudentData, 'teacherId'>) => {
    if (!teacherId) throw new Error('لم يتم تسجيل المعلم بعد');
    
    try {
      setIsLoading(true);
      const id = await databaseService.saveStudentData({
        ...studentData,
        teacherId
      });
      return id;
    } catch (error) {
      console.error('خطأ في حفظ بيانات الطالب:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getStudents = async () => {
    if (!teacherId) return [];
    
    try {
      setIsLoading(true);
      const students = await databaseService.getStudentsByTeacher(teacherId);
      return students;
    } catch (error) {
      console.error('خطأ في جلب بيانات الطلاب:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateStudent = async (studentId: string, data: Partial<StudentData>) => {
    try {
      setIsLoading(true);
      await databaseService.updateStudentData(studentId, data);
    } catch (error) {
      console.error('خطأ في تحديث بيانات الطالب:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      setIsLoading(true);
      await databaseService.deleteStudentData(studentId);
    } catch (error) {
      console.error('خطأ في حذف بيانات الطالب:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncData = async () => {
    if (!teacherId) return;
    
    try {
      setIsLoading(true);
      // مزامنة البيانات في الاتجاهين
      await databaseService.syncLocalDataToFirebase();
      await databaseService.syncFirebaseToLocal(teacherId);
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    teacherId,
    saveTeacher,
    saveStudent,
    getStudents,
    updateStudent,
    deleteStudent,
    syncData,
  };
};
