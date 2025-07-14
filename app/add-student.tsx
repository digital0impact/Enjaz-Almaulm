import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'يحتاج إلى تطوير' | 'صعوبات التعلم' | 'ضعف' | 'ممتاز' | 'مقبول';
  lastUpdate: string;
  notes: string;
  goals: Goal[];
  needs: string[];
  performanceEvidence: PerformanceEvidence[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number; // 0-100
  status: 'محقق' | 'قيد التنفيذ' | 'لم يبدأ';
}

interface PerformanceEvidence {
  id: string;
  type: string;
  title: string;
  fileName?: string;
  fileType?: string;
  date: string;
  notes: string;
}

export default function AddStudentScreen() {
  const router = useRouter();
  const [studentData, setStudentData] = useState({
    name: '',
    grade: '',
    status: 'يحتاج إلى تطوير' as Student['status'],
    notes: '',
    goals: [] as Goal[],
    needs: [] as string[],
    performanceEvidence: [] as PerformanceEvidence[]
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    progress: 0,
    status: 'لم يبدأ' as Goal['status']
  });

  const [newNeed, setNewNeed] = useState('');
  const [newEvidence, setNewEvidence] = useState<Partial<PerformanceEvidence>>({
    type: 'اختبار',
    title: '',
    fileName: '',
    fileType: '',
    date: '',
    notes: ''
  });

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showNeedForm, setShowNeedForm] = useState(false);

  const statusOptions = [
    { value: 'صعوبات التعلم', label: 'صعوبات التعلم', color: '#F44336', icon: 'exclamationmark.triangle.fill' },
    { value: 'يحتاج إلى تطوير', label: 'يحتاج إلى تطوير', color: '#FF5722', icon: 'star' },
    { value: 'تفوق', label: 'تفوق', color: '#4CAF50', icon: 'star.fill' },
    { value: 'ضعف', label: 'ضعف', color: '#9C27B0', icon: 'minus.circle.fill' }
  ];

  const evidenceTypes = [
    { value: 'اختبار', label: 'اختبار', icon: 'doc.text' },
    { value: 'مشروع', label: 'مشروع', icon: 'folder' },
    { value: 'واجب', label: 'واجب', icon: 'pencil' },
    { value: 'مشاركة', label: 'مشاركة', icon: 'hand.raised' },
    { value: 'سلوك', label: 'سلوك', icon: 'person.circle' }
  ];

  const addGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الهدف');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      title: newGoal.title.trim(),
      description: '',
    };

    setStudentData(prev => ({
      ...prev,
      goals: [...prev.goals, goal]
    }));

    setNewGoal({
      title: '',
      description: '',
      progress: 0,
      status: 'لم يبدأ'
    });

    setShowGoalForm(false);
  };

  const addNeed = () => {
    if (!newNeed.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاحتياج');
      return;
    }

    // التحقق من عدم تكرار الاحتياج
    if (studentData.needs.includes(newNeed.trim())) {
      Alert.alert('تنبيه', 'هذا الاحتياج موجود بالفعل');
      return;
    }

    setStudentData(prev => ({
      ...prev,
      needs: [...prev.needs, newNeed.trim()]
    }));

    setNewNeed('');
    Alert.alert('تم بنجاح', 'تم إضافة الاحتياج بنجاح');
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        let fileType = 'ملف';

        // تحديد نوع الملف بناءً على النوع
        if (file.mimeType?.startsWith('image/')) {
          fileType = 'صورة';
        } else if (file.mimeType?.startsWith('video/')) {
          fileType = 'فيديو';
        } else if (file.mimeType?.includes('pdf')) {
          fileType = 'PDF';
        } else if (file.mimeType?.includes('word') || file.name?.endsWith('.docx')) {
          fileType = 'مستند Word';
        }

        console.log('تم اختيار الملف:', file);

        setNewEvidence(prev => ({
          ...prev,
          fileName: file.name || `ملف_${Date.now()}`,
          fileType: fileType
        }));

        Alert.alert('تم التحميل بنجاح', `تم تحميل ${fileType}: ${file.name || 'ملف جديد'}`);
      } else {
        console.log('تم إلغاء اختيار الملف');
      }
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      Alert.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  const pickImage = async () => {
    try {
      // طلب الإذن للوصول لمعرض الصور
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لتحميل الصور.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const image = result.assets[0];
        const fileName = `صورة_${Date.now()}.jpg`;
        
        console.log('تم اختيار الصورة:', image);

        setNewEvidence(prev => ({
          ...prev,
          fileName: fileName,
          fileType: 'صورة'
        }));

        Alert.alert('تم التحميل بنجاح', `تم تحميل الصورة: ${fileName}`);
      } else {
        console.log('تم إلغاء اختيار الصورة');
      }
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      Alert.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى.');
    }
  };

  const pickVideo = async () => {
    try {
      // طلب الإذن للوصول لمعرض الصور
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لتحميل الفيديو.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const video = result.assets[0];
        const fileName = `فيديو_${Date.now()}.mp4`;
        
        console.log('تم اختيار الفيديو:', video);

        setNewEvidence(prev => ({
          ...prev,
          fileName: fileName,
          fileType: 'فيديو'
        }));

        Alert.alert('تم التحميل بنجاح', `تم تحميل الفيديو: ${fileName}`);
      } else {
        console.log('تم إلغاء اختيار الفيديو');
      }
    } catch (error) {
      console.error('خطأ في تحميل الفيديو:', error);
      Alert.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الفيديو. يرجى المحاولة مرة أخرى.');
    }
  };

  const addEvidence = () => {
    if (!newEvidence.title?.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الشاهد');
      return;
    }

    const evidence: PerformanceEvidence = {
      id: Date.now().toString(),
      type: newEvidence.type as string,
      title: newEvidence.title?.trim() || '',
      fileName: newEvidence.fileName,
      fileType: newEvidence.fileType,
      date: newEvidence.date || new Date().toLocaleDateString('ar-SA'),
      notes: newEvidence.notes?.trim() || ''
    };

    setStudentData(prev => ({
      ...prev,
      performanceEvidence: [...prev.performanceEvidence, evidence]
    }));

    setNewEvidence({
      type: 'اختبار',
      title: '',
      fileName: '',
      fileType: '',
      date: '',
      notes: ''
    });

    setShowEvidenceForm(false);
  };

  const removeGoal = (goalId: string) => {
    setStudentData(prev => ({
      ...prev,
      goals: prev.goals.filter(goal => goal.id !== goalId)
    }));
  };

  const removeNeed = (needIndex: number) => {
    setStudentData(prev => ({
      ...prev,
      needs: prev.needs.filter((_, index) => index !== needIndex)
    }));
  };

  const removeEvidence = (evidenceId: string) => {
    setStudentData(prev => ({
      ...prev,
      performanceEvidence: prev.performanceEvidence.filter(evidence => evidence.id !== evidenceId)
    }));
  };

  const saveStudent = async () => {
    // التحقق من البيانات المطلوبة
    if (!studentData.name.trim()) {
      Alert.alert('خطأ في البيانات', 'يرجى إدخال اسم المتعلم');
      return;
    }

    if (!studentData.grade.trim()) {
      Alert.alert('خطأ في البيانات', 'يرجى إدخال الصف الدراسي');
      return;
    }

    // التحقق من طول الاسم
    if (studentData.name.trim().length < 2) {
      Alert.alert('خطأ في البيانات', 'اسم المتعلم يجب أن يكون أكثر من حرف واحد');
      return;
    }

    try {
      console.log('بدء عملية حفظ بيانات المتعلم...');
      
      // إظهار رسالة تحميل
      const loadingAlert = Alert.alert('جاري الحفظ', 'يتم حفظ بيانات المتعلم، يرجى الانتظار...');

      const existingStudents = await AsyncStorage.getItem('students');
      let students = existingStudents ? JSON.parse(existingStudents) : [];

      // التحقق من عدم تكرار الاسم
      const duplicateName = students.find((student: Student) => 
        student.name.toLowerCase().trim() === studentData.name.toLowerCase().trim()
      );

      if (duplicateName) {
        Alert.alert('تنبيه', 'يوجد متعلم بنفس الاسم، هل تريد المتابعة؟', [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'متابعة', onPress: () => proceedWithSave() }
        ]);
        return;
      }

      await proceedWithSave();

      async function proceedWithSave() {
        // تحديث التصنيفات القديمة في البيانات الموجودة
        students = students.map((student: Student) => {
          let updatedStatus = student.status;
          if (student.status === 'ممتاز' as any) {
            updatedStatus = 'تفوق';
          } else if (student.status === 'مقبول' as any) {
            updatedStatus = 'يحتاج إلى تطوير';
          } else if (student.status === 'ضعيف' as any) {
            updatedStatus = 'صعوبات التعلم';
          }

          return {
            ...student,
            status: updatedStatus as Student['status']
          };
        });

        const newStudent: Student = {
          id: Date.now().toString(),
          name: studentData.name.trim(),
          grade: studentData.grade.trim(),
          status: studentData.status,
          lastUpdate: new Date().toLocaleDateString('ar-SA'),
          notes: studentData.notes.trim(),
          goals: studentData.goals,
          needs: studentData.needs,
          performanceEvidence: studentData.performanceEvidence
        };

        students.push(newStudent);
        await AsyncStorage.setItem('students', JSON.stringify(students));

        console.log('✅ تم حفظ المتعلم بنجاح:', newStudent);

        // التحقق من الحفظ
        const savedStudents = await AsyncStorage.getItem('students');
        const parsedStudents = savedStudents ? JSON.parse(savedStudents) : [];
        const isStudentSaved = parsedStudents.find((s: Student) => s.id === newStudent.id);

        if (isStudentSaved) {
          Alert.alert(
            '✅ تم الحفظ بنجاح!', 
            `تم إضافة المتعلم "${newStudent.name}" بنجاح\n\nالتفاصيل:\n• الصف: ${newStudent.grade}\n• الحالة: ${newStudent.status}\n• عدد الأهداف: ${newStudent.goals.length}\n• عدد الاحتياجات: ${newStudent.needs.length}\n• عدد الشواهد: ${newStudent.performanceEvidence.length}`,
            [
              { 
                text: 'عرض المتعلمين', 
                onPress: () => {
                  console.log('الانتقال إلى صفحة المتعلمين...');
                  router.replace('/student-tracking');
                }
              },
              { 
                text: 'إضافة متعلم آخر', 
                onPress: () => {
                  console.log('إعادة تعيين النموذج...');
                  // إعادة تعيين البيانات لإضافة متعلم جديد
                  setStudentData({
                    name: '',
                    grade: '',
                    status: 'يحتاج إلى تطوير',
                    notes: '',
                    goals: [],
                    needs: [],
                    performanceEvidence: []
                  });
                }
              }
            ]
          );
        } else {
          throw new Error('فشل في التحقق من حفظ البيانات');
        }
      }

    } catch (error) {
      console.error('❌ خطأ في حفظ المتعلم:', error);
      Alert.alert(
        '❌ خطأ في الحفظ', 
        `حدث خطأ أثناء حفظ بيانات المتعلم.\n\nتفاصيل الخطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}\n\nيرجى المحاولة مرة أخرى أو التحقق من البيانات المدخلة.`,
        [
          { 
            text: 'إعادة المحاولة', 
            onPress: () => saveStudent(),
            style: 'default'
          },
          { 
            text: 'إلغاء', 
            style: 'cancel' 
          }
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          >
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
              bouncesZoom={true}
              alwaysBounceVertical={true}
              decelerationRate="normal"
              scrollEventThrottle={16}
              overScrollMode="always"
              fadingEdgeLength={Platform.OS === 'android' ? 100 : 0}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 100
              }}
            >
              <ThemedView style={styles.content}>
                {/* Header */}
                <ThemedView style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
                  </TouchableOpacity>

                  <ThemedView style={styles.iconContainer}>
                    <IconSymbol size={60} name="person.crop.circle.badge.plus" color="#1c1f33" />
                  </ThemedView>

                  <ThemedText type="title" style={styles.title}>
                    إضافة متعلم جديد
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    إدخال بيانات المتعلم الشاملة
                  </ThemedText>
                </ThemedView>

                {/* Form */}
                <ThemedView style={styles.formContainer}>
                  {/* البيانات الأساسية */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>البيانات الأساسية</ThemedText>

                    <ThemedView style={styles.inputGroup}>
                      <ThemedText style={styles.label}>اسم المتعلم *</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={studentData.name}
                        onChangeText={(text) => setStudentData({...studentData, name: text})}
                        placeholder="أدخل اسم المتعلم"
                        textAlign="right"
                      />
                    </ThemedView>

                    <ThemedView style={styles.inputGroup}>
                      <ThemedText style={styles.label}>الصف الدراسي *</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={studentData.grade}
                        onChangeText={(text) => setStudentData({...studentData, grade: text})}
                        placeholder="أدخل الصف الدراسي"
                        textAlign="right"
                      />
                    </ThemedView>

                    <ThemedView style={styles.inputGroup}>
                      <ThemedText style={styles.label}>حالة المتعلم</ThemedText>
                      <ThemedView style={styles.statusGrid}>
                        {statusOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.statusOption,
                              { backgroundColor: option.color },
                              studentData.status === option.value && styles.selectedStatus
                            ]}
                            onPress={() => setStudentData({...studentData, status: option.value as Student['status']})}
                          >
                            <IconSymbol size={18} name={option.icon as any} color="#fff" />
                            <ThemedText style={styles.statusText}>{option.label}</ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>

                  {/* الأهداف */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedView style={styles.sectionHeader}>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setShowGoalForm(true)}
                      >
                        <IconSymbol size={16} name="plus.circle.fill" color="#1c1f33" />
                        <ThemedText style={styles.addButtonText}>إضافة هدف</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.sectionTitle}>الأهداف التعليمية</ThemedText>
                    </ThemedView>

                    {showGoalForm && (
                      <ThemedView style={styles.formContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="عنوان الهدف"
                          value={newGoal.title}
                          onChangeText={(text) => setNewGoal(prev => ({ ...prev, title: text }))}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="نسبة تحقق الهدف (0-100)"
                          keyboardType="numeric"
                          value={newGoal.progress.toString()}
                          onChangeText={(text) => {
                            const progress = parseInt(text);
                            if (!isNaN(progress) && progress >= 0 && progress <= 100) {
                              setNewGoal(prev => ({ ...prev, progress }));
                            } else if (text === '') {
                              setNewGoal(prev => ({ ...prev, progress: 0 }));
                            }
                          }}
                        />
                        <ThemedView style={styles.buttonRow}>
                          <TouchableOpacity style={styles.addButton} onPress={addGoal}>
                            <IconSymbol size={16} name="checkmark.circle.fill" color="#1c1f33" />
                            <ThemedText style={styles.addButtonText}>حفظ</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.addButton} 
                            onPress={() => setShowGoalForm(false)}
                          >
                            <IconSymbol size={16} name="xmark.circle.fill" color="#1c1f33" />
                            <ThemedText style={styles.addButtonText}>إلغاء</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    )}

                    {studentData.goals.map((goal) => (
                      <ThemedView key={goal.id} style={styles.itemCard}>
                        <ThemedView style={styles.itemHeader}>
                          <TouchableOpacity onPress={() => removeGoal(goal.id)}>
                            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                          </TouchableOpacity>
                          <ThemedText style={styles.itemTitle}>{goal.title}</ThemedText>
                        </ThemedView>
                        
                        <ThemedView style={styles.progressContainer}>
                          <ThemedText style={styles.progressText}>{goal.progress}%</ThemedText>
                          <ThemedView style={styles.progressBar}>
                            <ThemedView 
                              style={[styles.progressFill, { width: `${goal.progress}%` }]} 
                            />
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {/* احتياجات المتعلم */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedView style={styles.sectionHeader}>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setShowNeedForm(true)}
                      >
                        <IconSymbol size={16} name="plus.circle.fill" color="#1c1f33" />
                        <ThemedText style={styles.addButtonText}>إضافة احتياج</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.sectionTitle}>احتياجات المتعلم</ThemedText>
                    </ThemedView>

                    {showNeedForm && (
                      <ThemedView style={styles.formCard}>
                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>الاحتياج</ThemedText>
                          <TextInput
                            style={styles.textInput}
                            value={newNeed}
                            onChangeText={setNewNeed}
                            placeholder="مثال: يحتاج إلى دعم إضافي في الرياضيات"
                            textAlign="right"
                            multiline
                          />
                        </ThemedView>

                        <ThemedView style={styles.buttonRow}>
                          <TouchableOpacity style={styles.addButton} onPress={addNeed}>
                            <IconSymbol size={16} name="checkmark.circle.fill" color="#1c1f33" />
                            <ThemedText style={styles.addButtonText}>حفظ</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.addButton} 
                            onPress={() => setShowNeedForm(false)}
                          >
                            <IconSymbol size={16} name="xmark.circle.fill" color="#1c1f33" />
                            <ThemedText style={styles.addButtonText}>إلغاء</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    )}

                    {studentData.needs.map((need, index) => (
                      <ThemedView key={index} style={styles.itemCard}>
                        <ThemedView style={styles.itemHeader}>
                          <TouchableOpacity onPress={() => removeNeed(index)}>
                            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                          </TouchableOpacity>
                          <ThemedText style={styles.itemTitle}>{need}</ThemedText>
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {/* شواهد الأداء */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedView style={styles.sectionHeader}>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setShowEvidenceForm(true)}
                      >
                        <IconSymbol size={16} name="plus.circle.fill" color="#1c1f33" />
                        <ThemedText style={styles.addButtonText}>إضافة شاهد</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.sectionTitle}>شواهد الأداء</ThemedText>
                    </ThemedView>

                    {showEvidenceForm && (
                      <ThemedView style={styles.formCard}>
                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>نوع الشاهد</ThemedText>
                          <ThemedView style={styles.typeGrid}>
                            {evidenceTypes.map((type) => (
                              <TouchableOpacity
                                key={type.value}
                                style={[
                                  styles.typeOption,
                                  newEvidence.type === type.value && styles.selectedType
                                ]}
                                onPress={() => setNewEvidence({...newEvidence, type: type.value as PerformanceEvidence['type']})}
                              >
                                <IconSymbol size={16} name={type.icon as any} color="#1c1f33" />
                                <ThemedText style={styles.typeText}>{type.label}</ThemedText>
                              </TouchableOpacity>
                            ))}
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>عنوان الشاهد</ThemedText>
                          <TextInput
                            style={styles.textInput}
                            value={newEvidence.title}
                            onChangeText={(text) => setNewEvidence({...newEvidence, title: text})}
                            placeholder="أدخل عنوان الشاهد"
                            textAlign="right"
                          />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>تحميل الشاهد</ThemedText>
                          
                          {/* أزرار التحميل */}
                          <ThemedView style={styles.uploadButtonsContainer}>
                            <TouchableOpacity 
                              style={[styles.uploadOptionButton, { backgroundColor: '#E3F2FD' }]}
                              onPress={pickImage}
                            >
                              <IconSymbol size={18} name="photo.fill" color="#2196F3" />
                              <ThemedText style={[styles.uploadOptionText, { color: '#2196F3' }]}>صورة</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                              style={[styles.uploadOptionButton, { backgroundColor: '#F3E5F5' }]}
                              onPress={pickVideo}
                            >
                              <IconSymbol size={18} name="video.fill" color="#9C27B0" />
                              <ThemedText style={[styles.uploadOptionText, { color: '#9C27B0' }]}>فيديو</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                              style={[styles.uploadOptionButton, { backgroundColor: '#E8F5E8' }]}
                              onPress={pickDocument}
                            >
                              <IconSymbol size={18} name="doc.fill" color="#4CAF50" />
                              <ThemedText style={[styles.uploadOptionText, { color: '#4CAF50' }]}>ملف</ThemedText>
                            </TouchableOpacity>
                          </ThemedView>

                          {/* عرض الملف المحدد */}
                          {newEvidence.fileName ? (
                            <ThemedView style={styles.selectedFileContainer}>
                              <ThemedView style={styles.fileInfo}>
                                <IconSymbol 
                                  size={20} 
                                  name={
                                    newEvidence.fileType === 'صورة' ? 'photo.fill' :
                                    newEvidence.fileType === 'فيديو' ? 'video.fill' :
                                    'doc.fill'
                                  } 
                                  color="#4CAF50" 
                                />
                                <ThemedView style={styles.fileDetails}>
                                  <ThemedText style={styles.fileInfoText}>
                                    {newEvidence.fileName}
                                  </ThemedText>
                                  <ThemedText style={styles.fileTypeText}>
                                    {newEvidence.fileType}
                                  </ThemedText>
                                </ThemedView>
                              </ThemedView>
                              <TouchableOpacity 
                                style={styles.removeFileButton}
                                onPress={() => setNewEvidence(prev => ({
                                  ...prev,
                                  fileName: '',
                                  fileType: ''
                                }))}
                              >
                                <IconSymbol size={16} name="xmark.circle.fill" color="#F44336" />
                              </TouchableOpacity>
                            </ThemedView>
                          ) : (
                            <ThemedView style={styles.noFileSelected}>
                              <IconSymbol size={24} name="doc.badge.plus" color="#999" />
                              <ThemedText style={styles.noFileText}>لم يتم اختيار ملف بعد</ThemedText>
                            </ThemedView>
                          )}
                        </ThemedView>

                        <ThemedView style={styles.buttonRow}>
                          <TouchableOpacity style={styles.addButton} onPress={addEvidence}>
                            <IconSymbol size={16} name="checkmark.circle.fill" color="#1c1f33" />
                            <ThemedText style={styles.addButtonText}>حفظ</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.addButton} 
                            onPress={() => setShowEvidenceForm(false)}
                          >
                            <IconSymbol size={16} name="xmark.circle.fill" color="#1c1f33" />
                            <ThemedText style={styles.addButtonText}>إلغاء</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    )}

                    {studentData.performanceEvidence.map((evidence) => (
                      <ThemedView key={evidence.id} style={styles.evidenceCard}>
                        <ThemedView style={styles.itemHeader}>
                          <TouchableOpacity onPress={() => removeEvidence(evidence.id)}>
                            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                          </TouchableOpacity>
                          <ThemedView style={styles.evidenceInfo}>
                            <ThemedText style={styles.itemTitle}>{evidence.title}</ThemedText>
                            <ThemedText style={styles.evidenceType}>{evidence.type}</ThemedText>
                          </ThemedView>
                        </ThemedView>
                        <ThemedView style={styles.evidenceDetails}>
                          <ThemedText style={styles.evidenceDetailText}>
                            النوع: {evidence.type}
                          </ThemedText>
                          {evidence.fileName && (
                            <ThemedView style={styles.fileDisplayInfo}>
                              <IconSymbol 
                                size={16} 
                                name={
                                  evidence.fileType === 'صورة' ? 'photo.fill' :
                                  evidence.fileType === 'فيديو' ? 'video.fill' :
                                  'doc.fill'
                                } 
                                color="#4CAF50" 
                              />
                              <ThemedText style={styles.evidenceDetailText}>
                                الملف: {evidence.fileName}
                              </ThemedText>
                              <TouchableOpacity 
                                style={styles.viewFileBtn}
                                onPress={() => Alert.alert('عرض الملف', `فتح: ${evidence.fileName}`)}
                              >
                                <IconSymbol size={14} name="eye.fill" color="#2196F3" />
                                <ThemedText style={styles.viewFileBtnText}>عرض</ThemedText>
                              </TouchableOpacity>
                            </ThemedView>
                          )}
                          <ThemedText style={styles.evidenceDetailText}>
                            التاريخ: {evidence.date}
                          </ThemedText>
                          {evidence.notes && (
                            <ThemedText style={styles.evidenceDetailText}>
                              الملاحظات: {evidence.notes}
                            </ThemedText>
                          )}
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {/* ملاحظات إضافية */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>ملاحظات إضافية</ThemedText>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={studentData.notes}
                      onChangeText={(text) => setStudentData({...studentData, notes: text})}
                      placeholder="أدخل أي ملاحظات إضافية"
                      textAlign="right"
                      multiline
                      numberOfLines={4}
                    />
                  </ThemedView>

                  {/* أزرار الحفظ والإلغاء */}
                  <ThemedView style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={saveStudent}
                      activeOpacity={0.8}
                    >
                      <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
                      <ThemedText style={styles.saveButtonText}>
                        حفظ البيانات
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => {
                        Alert.alert(
                          'تأكيد الإلغاء',
                          'هل أنت متأكد من إلغاء إضافة المتعلم؟ سيتم فقدان جميع البيانات المدخلة.',
                          [
                            { text: 'العودة', style: 'cancel' },
                            { 
                              text: 'إلغاء', 
                              style: 'destructive',
                              onPress: () => router.back()
                            }
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <IconSymbol size={18} name="xmark.circle.fill" color="#666" />
                      <ThemedText style={styles.cancelButtonText}>
                        إلغاء
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        
      </ImageBackground>
      <BottomNavigationBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    backgroundColor: '#add4ce',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  formContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
    width: '100%',
  },
  sectionContainer: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'transparent',
  },
  statusOption: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStatus: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#add4ce',
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addSmallButton: {
    backgroundColor: '#add4ce',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  needText: {
    flex: 1,
    fontSize: 14,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  needsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    gap: 5,
  },
  counterText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  needsList: {
    marginTop: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  needContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  needIndex: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    textAlign: 'center',
    minWidth: 30,
  },
  removeButton: {
    padding: 5,
  },
  emptyNeedsState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  emptyNeedsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyNeedsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedType: {
    backgroundColor: '#add4ce',
    borderColor: '#add4ce',
  },
  typeText: {
    fontSize: 12,
    color: '#1c1f33',
    fontWeight: '500',
  },
  evidenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceType: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
    backgroundColor: 'transparent',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  uploadOptionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedFileContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileDetails: {
    flex: 1,
  },
  fileInfoText: {
    fontSize: 14,
    color: '#1c1f33',
    fontWeight: '500',
    textAlign: 'right',
  },
  fileTypeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  removeFileButton: {
    padding: 5,
  },
  noFileSelected: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  noFileText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  evidenceDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  evidenceDetailText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileDisplayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 3,
  },
  viewFileBtnText: {
    fontSize: 12,
    color: '#2196F3',
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusSelector: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});
