import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BasicDataScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    fullName: 'المعلم محمد أحمد',
    specialty: 'الرياضيات',
    experience: '10 سنوات',
    education: 'بكالوريوس تربية رياضيات',
    school: 'مدرسة الأمل الثانوية',
    educationDepartment: 'إدارة تعليم الرياض',
    gradeLevel: 'المرحلة الثانوية - الصف الأول والثاني',
    vision: 'إعداد جيل متميز قادر على مواجهة تحديات المستقبل',
    mission: 'تقديم تعليم نوعي يركز على بناء الشخصية المتكاملة للطالب',
    email: 'teacher@example.com',
    phone: '+966123456789',
    twitter: '',
    linkedin: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('basicData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem('basicData', JSON.stringify(userData));
      setIsEditing(false);
      Alert.alert('تم الحفظ', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  const updateField = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="person.text.rectangle.fill" color="#4CAF50" />
        <ThemedText type="title" style={styles.title}>
          البيانات الأساسية
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          معلوماتك الشخصية والمهنية
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.actionButtons}>
          {!isEditing ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <IconSymbol size={20} name="pencil" color="white" />
              <ThemedText style={styles.buttonText}>تعديل البيانات</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedView style={styles.editActions}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveUserData}
              >
                <IconSymbol size={20} name="checkmark" color="white" />
                <ThemedText style={styles.buttonText}>حفظ</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  loadUserData();
                }}
              >
                <IconSymbol size={20} name="xmark" color="white" />
                <ThemedText style={styles.buttonText}>إلغاء</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.dataSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            المعلومات الشخصية
          </ThemedText>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>الاسم الكامل</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.fullName}
                onChangeText={(text) => updateField('fullName', text)}
                placeholder="أدخل الاسم الكامل"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.fullName}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>البريد الإلكتروني</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="أدخل البريد الإلكتروني"
                keyboardType="email-address"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.email}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>رقم الهاتف</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="أدخل رقم الهاتف"
                keyboardType="phone-pad"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.phone}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>تويتر</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.twitter}
                onChangeText={(text) => updateField('twitter', text)}
                placeholder="أدخل اسم المستخدم على تويتر"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.twitter}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>لينكدإن</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.linkedin}
                onChangeText={(text) => updateField('linkedin', text)}
                placeholder="أدخل رابط الملف الشخصي على لينكدإن"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.linkedin}</ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.dataSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            المعلومات المهنية
          </ThemedText>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>التخصص</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.specialty}
                onChangeText={(text) => updateField('specialty', text)}
                placeholder="أدخل التخصص"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.specialty}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>سنوات الخبرة</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.experience}
                onChangeText={(text) => updateField('experience', text)}
                placeholder="أدخل سنوات الخبرة"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.experience}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>المؤهل العلمي</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.education}
                onChangeText={(text) => updateField('education', text)}
                placeholder="أدخل المؤهل العلمي"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.education}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>المدرسة</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.school}
                onChangeText={(text) => updateField('school', text)}
                placeholder="أدخل اسم المدرسة"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.school}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>الإدارة التعليمية</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.educationDepartment}
                onChangeText={(text) => updateField('educationDepartment', text)}
                placeholder="أدخل اسم الإدارة التعليمية"
              />
            ) : (
              <ThemedText style={styles.value}>{userData.educationDepartment}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>المرحلة والصفوف الدراسية</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.gradeLevel}
                onChangeText={(text) => updateField('gradeLevel', text)}
                placeholder="أدخل المرحلة والصفوف الدراسية"
                multiline
              />
            ) : (
              <ThemedText style={styles.value}>{userData.gradeLevel}</ThemedText>
            )}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.dataSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            الرؤية والرسالة
          </ThemedText>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>الرؤية</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={userData.vision}
                onChangeText={(text) => updateField('vision', text)}
                placeholder="أدخل رؤيتك التعليمية"
                multiline
                numberOfLines={3}
              />
            ) : (
              <ThemedText style={styles.value}>{userData.vision}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.dataItem}>
            <ThemedText style={styles.label}>الرسالة</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={userData.mission}
                onChangeText={(text) => updateField('mission', text)}
                placeholder="أدخل رسالتك التعليمية"
                multiline
                numberOfLines={3}
              />
            ) : (
              <ThemedText style={styles.value}>{userData.mission}</ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  actionButtons: {
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  dataSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dataItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  value: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});