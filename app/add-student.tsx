
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
  lastUpdate: string;
  notes: string;
}

export default function AddStudentScreen() {
  const router = useRouter();
  const [studentData, setStudentData] = useState({
    name: '',
    grade: '',
    status: 'جيد' as Student['status'],
    notes: ''
  });

  const statusOptions = [
    { value: 'ممتاز', label: 'متفوق', color: '#4CAF50', icon: 'star.fill' },
    { value: 'جيد جداً', label: 'جيد جداً', color: '#8BC34A', icon: 'star.circle.fill' },
    { value: 'جيد', label: 'جيد', color: '#FF9800', icon: 'star.circle' },
    { value: 'مقبول', label: 'يحتاج إلى تطوير', color: '#FF5722', icon: 'star' },
    { value: 'ضعيف', label: 'صعوبات تعلم', color: '#F44336', icon: 'exclamationmark.triangle.fill' }
  ];

  const saveStudent = async () => {
    if (!studentData.name.trim() || !studentData.grade.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const existingStudents = await AsyncStorage.getItem('students');
      const students = existingStudents ? JSON.parse(existingStudents) : [];

      const newStudent: Student = {
        id: Date.now().toString(),
        name: studentData.name.trim(),
        grade: studentData.grade.trim(),
        status: studentData.status,
        lastUpdate: new Date().toLocaleDateString('ar-SA'),
        notes: studentData.notes.trim()
      };

      students.push(newStudent);
      await AsyncStorage.setItem('students', JSON.stringify(students));

      Alert.alert('نجح', 'تم إضافة المتعلم بنجاح', [
        { text: 'موافق', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView style={styles.scrollContainer}>
              <ThemedView style={styles.content}>
                {/* Header */}
                <ThemedView style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <IconSymbol size={24} name="chevron.right" color="#1c1f33" />
                  </TouchableOpacity>
                  
                  <ThemedView style={styles.iconContainer}>
                    <IconSymbol size={60} name="person.crop.circle.badge.plus" color="#1c1f33" />
                  </ThemedView>
                  
                  <ThemedText type="title" style={styles.title}>
                    إضافة متعلم جديد
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    إدخال بيانات المتعلم الأساسية
                  </ThemedText>
                </ThemedView>

                {/* Form */}
                <ThemedView style={styles.formContainer}>
                  {/* اسم المتعلم */}
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

                  {/* الصف الدراسي */}
                  <ThemedView style={styles.inputGroup}>
                    <ThemedText style={styles.label}>الصف الدراسي *</ThemedText>
                    <TextInput
                      style={styles.textInput}
                      value={studentData.grade}
                      onChangeText={(text) => setStudentData({...studentData, grade: text})}
                      placeholder="أدخل الصف الدراسي (مثال: الصف الأول الثانوي)"
                      textAlign="right"
                    />
                  </ThemedView>

                  {/* حالة المتعلم */}
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
                          <IconSymbol size={24} name={option.icon} color="#fff" />
                          <ThemedText style={styles.statusText}>{option.label}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ThemedView>
                  </ThemedView>

                  {/* ملاحظات */}
                  <ThemedView style={styles.inputGroup}>
                    <ThemedText style={styles.label}>ملاحظات إضافية</ThemedText>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={studentData.notes}
                      onChangeText={(text) => setStudentData({...studentData, notes: text})}
                      placeholder="أدخل أي ملاحظات أو تفاصيل إضافية عن المتعلم"
                      textAlign="right"
                      multiline
                      numberOfLines={4}
                    />
                  </ThemedView>

                  {/* أزرار الحفظ والإلغاء */}
                  <ThemedView style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.saveButton} onPress={saveStudent}>
                      <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                      <ThemedText style={styles.saveButtonText}>حفظ البيانات</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                      <IconSymbol size={20} name="xmark.circle" color="#666" />
                      <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        </ExpoLinearGradient>
      </ImageBackground>
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
  gradientOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    textAlign: 'center',
    marginBottom: 10,
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
    color: '#666666',
    writingDirection: 'rtl',
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  inputGroup: {
    marginBottom: 25,
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1c1f33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 8,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStatus: {
    borderWidth: 3,
    borderColor: '#1c1f33',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
