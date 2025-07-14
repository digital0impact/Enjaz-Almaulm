import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AbsenceRecord {
  id: string;
  date: string;
  type: 'مرضي' | 'شخصي' | 'بدون عذر' | 'رسمي';
  duration: 'نصف يوم' | 'يوم كامل' | 'عدة أيام';
  reason?: string;
  withExcuse: boolean;
  createdAt: string;
}

export default function AddAbsenceScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'شخصي' as AbsenceRecord['type'],
    reason: '',
    withExcuse: true
  });

  const absenceTypes = [
    { value: 'مرضي', label: 'مرضي', icon: 'cross.case.fill', color: '#FF6B6B' },
    { value: 'شخصي', label: 'شخصي', icon: 'person.circle.fill', color: '#4ECDC4' },
    { value: 'رسمي', label: 'رسمي', icon: 'building.2.fill', color: '#007AFF' },
    { value: 'بدون عذر', label: 'بدون عذر', icon: 'xmark.circle.fill', color: '#FF851B' }
  ];

  

  const saveAbsence = async () => {
    try {
      if (!formData.date) {
        Alert.alert('خطأ', 'يرجى تحديد تاريخ الغياب');
        return;
      }

      // التحقق من عدم وجود سجل غياب في نفس التاريخ
      const existingRecords = await AsyncStorage.getItem('absenceRecords');
      const records = existingRecords ? JSON.parse(existingRecords) : [];
      
      const existingRecord = records.find((record: AbsenceRecord) => record.date === formData.date);
      if (existingRecord) {
        Alert.alert(
          'تنبيه',
          'يوجد سجل غياب في هذا التاريخ بالفعل. هل تريد المتابعة؟',
          [
            {
              text: 'إلغاء',
              style: 'cancel'
            },
            {
              text: 'متابعة',
              onPress: () => saveAbsenceRecord(records)
            }
          ]
        );
        return;
      }

      await saveAbsenceRecord(records);
    } catch (error) {
      console.error('Error saving absence:', error);
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  const saveAbsenceRecord = async (existingRecords: AbsenceRecord[]) => {
    try {
      const newAbsence: AbsenceRecord = {
        id: Date.now().toString(),
        date: formData.date,
        type: formData.type,
        duration: 'يوم كامل',
        reason: formData.reason.trim(),
        withExcuse: formData.withExcuse,
        createdAt: new Date().toISOString()
      };

      existingRecords.push(newAbsence);

      await AsyncStorage.setItem('absenceRecords', JSON.stringify(existingRecords));

      Alert.alert(
        'تم الحفظ',
        'تم حفظ سجل الغياب بنجاح',
        [
          {
            text: 'عرض السجلات',
            onPress: () => router.push('/absence-management')
          },
          {
            text: 'إضافة آخر',
            onPress: () => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                type: 'شخصي',
                reason: '',
                withExcuse: true
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving absence record:', error);
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
          <ScrollView style={styles.scrollContainer}>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="plus.circle.fill" color="#1c1f33" />
              </ThemedView>

              <ThemedText type="title" style={styles.title}>
                إضافة غياب جديد
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                تسجيل يوم غياب جديد مع تحديد السبب والفترة
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              {/* تاريخ الغياب */}
              <ThemedView style={styles.formSection}>
                <ThemedText style={styles.sectionTitle}>تاريخ الغياب</ThemedText>
                <ThemedView style={styles.inputContainer}>
                  <ThemedText style={styles.dateInput}>{formData.date}</ThemedText>
                  <IconSymbol size={20} name="calendar" color="#666" />
                </ThemedView>
              </ThemedView>

              {/* نوع الغياب */}
              <ThemedView style={styles.formSection}>
                <ThemedText style={styles.sectionTitle}>نوع الغياب</ThemedText>
                <ThemedView style={styles.optionsGrid}>
                  {absenceTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.optionCard,
                        formData.type === type.value && styles.selectedOption
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type: type.value as AbsenceRecord['type'] }))}
                    >
                      <IconSymbol size={24} name={type.icon as any} color={type.color} />
                      <ThemedText style={styles.optionText}>{type.label}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ThemedView>

              {/* هل يوجد عذر */}
              <ThemedView style={styles.formSection}>
                <ThemedText style={styles.sectionTitle}>هل يوجد عذر؟</ThemedText>
                <ThemedView style={styles.excuseContainer}>
                  <TouchableOpacity
                    style={[
                      styles.excuseOption,
                      formData.withExcuse && styles.selectedExcuse
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, withExcuse: true }))}
                  >
                    <IconSymbol size={20} name="checkmark.circle.fill" color="#4ECDC4" />
                    <ThemedText style={styles.excuseText}>نعم</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.excuseOption,
                      !formData.withExcuse && styles.selectedExcuse
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, withExcuse: false }))}
                  >
                    <IconSymbol size={20} name="xmark.circle.fill" color="#FF6B6B" />
                    <ThemedText style={styles.excuseText}>لا</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              {/* سبب الغياب */}
              <ThemedView style={styles.formSection}>
                <ThemedText style={styles.sectionTitle}>سبب الغياب (اختياري)</ThemedText>
                <ThemedView style={styles.textInputContainer}>
                  <ThemedText 
                    style={styles.textInput}
                    onPress={() => {
                      Alert.prompt(
                        'سبب الغياب',
                        'أدخل سبب الغياب',
                        (text) => setFormData(prev => ({ ...prev, reason: text || '' })),
                        'plain-text',
                        formData.reason
                      );
                    }}
                  >
                    {formData.reason || 'اضغط لإدخال السبب...'}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {/* زر الحفظ */}
              <TouchableOpacity style={styles.saveButton} onPress={saveAbsence}>
                <IconSymbol size={24} name="checkmark.circle.fill" color="#fff" />
                <ThemedText style={styles.saveButtonText}>حفظ سجل الغياب</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  content: {
    backgroundColor: 'transparent',
    gap: 20,
  },
  formSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#1c1f33',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateInput: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 80,
    justifyContent: 'center',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF15',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 8,
  },
  excuseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  excuseOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  selectedExcuse: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC415',
  },
  excuseText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 60,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    padding: 15,
    minHeight: 60,
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
    marginTop: 20,
  },
  saveButtonText: {
    color: '#1c1f33',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
