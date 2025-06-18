import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, I18nManager, ImageBackground, Image } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function BasicDataScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
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
      
      const storedImage = await AsyncStorage.getItem('profileImage');
      if (storedImage) {
        setProfileImage(storedImage);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem('basicData', JSON.stringify(userData));
      if (profileImage) {
        await AsyncStorage.setItem('profileImage', profileImage);
      }
      setIsEditing(false);
      Alert.alert('تم الحفظ', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  const updateField = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    // طلب الصلاحيات
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('عذراً', 'نحتاج إلى صلاحية الوصول للصور لتتمكن من رفع صورتك الشخصية');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'حذف الصورة',
      'هل أنت متأكد من حذف الصورة الشخصية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            setProfileImage(null);
            AsyncStorage.removeItem('profileImage');
          }
        }
      ]
    );
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
          <ScrollView style={styles.scrollContainer}>
            <ThemedView style={styles.header}>
              <ThemedView style={styles.profileImageContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <ThemedView style={styles.iconContainer}>
                    <IconSymbol size={60} name="person.circle.fill" color="#1c1f33" />
                  </ThemedView>
                )}
                
                {isEditing && (
                  <ThemedView style={styles.imageActions}>
                    <TouchableOpacity 
                      style={styles.imageButton}
                      onPress={pickImage}
                    >
                      <IconSymbol size={16} name="plus" color="white" />
                    </TouchableOpacity>
                    
                    {profileImage && (
                      <TouchableOpacity 
                        style={[styles.imageButton, styles.removeButton]}
                        onPress={removeImage}
                      >
                        <IconSymbol size={16} name="trash" color="white" />
                      </TouchableOpacity>
                    )}
                  </ThemedView>
                )}
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                البيانات الأساسية
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                معلوماتك الشخصية والمهنية
              </ThemedText>
            </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={[styles.actionButtons, { backgroundColor: 'transparent' }]}>
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

        <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
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
            <ThemedText style={styles.label}>منصة X</ThemedText>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.twitter}
                onChangeText={(text) => updateField('twitter', text)}
                placeholder="أدخل اسم المستخدم على منصة X"
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

        <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
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

        <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
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
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'transparent',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  iconContainer: {
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
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#add4ce',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 5,
  },
  imageButton: {
    backgroundColor: '#add4ce',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
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
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  actionButtons: {
    marginBottom: 20,
  },
  editButton: {
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
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonText: {
    color: '#1c1f33',
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
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dataItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
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