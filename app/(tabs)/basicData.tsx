import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  I18nManager,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme hook

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
    socialMedia: '',
    appointmentDate: '2014/09/01',
    rank: 'معلم',
    experiences: 'تدريس الرياضيات للمرحلة الثانوية، تدريب المعلمين الجدد، إعداد المناهج الدراسية',
  });

  const { colors } = useTheme(); // Use the useTheme hook to get the current theme

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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'}
        backgroundColor={Platform.OS === 'android' ? '#4ECDC4' : undefined}
        translucent={false}
      />
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.scrollContainer}>
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
                      <IconSymbol size={16} name="plus" color="#1c1f33" />
                    </TouchableOpacity>

                    {profileImage && (
                      <TouchableOpacity 
                        style={[styles.imageButton, styles.removeButton]}
                        onPress={removeImage}
                      >
                        <IconSymbol size={16} name="trash" color="#1c1f33" />
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
              style={[styles.editButton, { 
                backgroundColor: 'transparent',
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }]}
              onPress={() => setIsEditing(true)}
            >
              <IconSymbol size={20} name="pencil" color={'#1c1f33'} />
              <ThemedText style={[styles.buttonText, { color: '#1c1f33' }]}>تعديل البيانات</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedView style={styles.editActions}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveUserData}
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
                  setIsEditing(false);
                  loadUserData();
                }}
                activeOpacity={0.8}
              >
                <IconSymbol size={18} name="xmark.circle.fill" color="#666" />
                <ThemedText style={styles.cancelButtonText}>
                  إلغاء
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
          <ThemedText type="subtitle" style={styles.sectionTitleMain}>
            المعلومات الشخصية
          </ThemedText>

          {/* الصف الأول: الاسم الكامل والبريد الإلكتروني */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.labelMain, { color: colors.textSecondary }]}>الاسم الكامل</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.fullName}
                  onChangeText={(text) => updateField('fullName', text)}
                  placeholder="أدخل الاسم الكامل"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.fullName}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.labelMain, { color: colors.textSecondary }]}>البريد الإلكتروني</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="أدخل البريد الإلكتروني"
                  keyboardType="email-address"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.email}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف الثاني: رقم الهاتف ووسائل التواصل الاجتماعي */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.labelMain, { color: colors.textSecondary }]}>رقم الهاتف</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  placeholder="أدخل رقم الهاتف"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.phone}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.labelMain, { color: colors.textSecondary }]}>وسائل التواصل الاجتماعي</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.socialMedia}
                  onChangeText={(text) => updateField('socialMedia', text)}
                  placeholder="أدخل روابط وسائل التواصل الاجتماعي"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.socialMedia}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
          <ThemedText type="subtitle" style={styles.sectionTitleMain}>
            المعلومات المهنية
          </ThemedText>

          {/* الصف الأول: المؤهل العلمي والتخصص */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>المؤهل العلمي</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.education}
                  onChangeText={(text) => updateField('education', text)}
                  placeholder="أدخل المؤهل العلمي"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.education}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>التخصص</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.specialty}
                  onChangeText={(text) => updateField('specialty', text)}
                  placeholder="أدخل التخصص"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.specialty}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف الثاني: تاريخ التعيين والرتبة */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>تاريخ التعيين</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.appointmentDate}
                  onChangeText={(text) => updateField('appointmentDate', text)}
                  placeholder="أدخل تاريخ التعيين"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.appointmentDate}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>الرتبة</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.rank}
                  onChangeText={(text) => updateField('rank', text)}
                  placeholder="أدخل الرتبة"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.rank}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف الثالث: عدد سنوات الخبرة */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.gridItem, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>عدد سنوات الخبرة</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.experience}
                  onChangeText={(text) => updateField('experience', text)}
                  placeholder="أدخل عدد سنوات الخبرة"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.experience}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف الرابع: الخبرات */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.fullWidth, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>الخبرات</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.experiences}
                  onChangeText={(text) => updateField('experiences', text)}
                  placeholder="أدخل الخبرات المهنية"
                  multiline
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.experiences}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف الخامس: الإدارة التعليمية */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.fullWidth, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>الإدارة التعليمية</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.educationDepartment}
                  onChangeText={(text) => updateField('educationDepartment', text)}
                  placeholder="أدخل اسم الإدارة التعليمية"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.educationDepartment}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف السادس: المدرسة */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.fullWidth, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>المدرسة</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.school}
                  onChangeText={(text) => updateField('school', text)}
                  placeholder="أدخل اسم المدرسة"
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.school}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>

          {/* الصف السابع: المرحلة والصفوف الدراسية */}
          <ThemedView style={styles.gridContainer}>
            <ThemedView style={[styles.dataItem, styles.fullWidth, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>المرحلة والصفوف الدراسية</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.inputMain, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                  value={userData.gradeLevel}
                  onChangeText={(text) => updateField('gradeLevel', text)}
                  placeholder="أدخل المرحلة والصفوف الدراسية"
                  multiline
                  placeholderTextColor={colors.inputPlaceholder}
                />
              ) : (
                <ThemedText style={[styles.value, { color: colors.text }]}>{userData.gradeLevel}</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            الرؤية والرسالة
          </ThemedText>

          <ThemedView style={[styles.dataItem, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>الرؤية</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.inputMain, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                value={userData.vision}
                onChangeText={(text) => updateField('vision', text)}
                placeholder="أدخل رؤيتك التعليمية"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.inputPlaceholder}
              />
            ) : (
              <ThemedText style={[styles.value, { color: colors.text }]}>{userData.vision}</ThemedText>
            )}
          </ThemedView>

          <ThemedView style={[styles.dataItem, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>الرسالة</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.inputMain, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
                value={userData.mission}
                onChangeText={(text) => updateField('mission', text)}
                placeholder="أدخل رسالتك التعليمية"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.inputPlaceholder}
              />
            ) : (
              <ThemedText style={[styles.value, { color: colors.text }]}>{userData.mission}</ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
          </ScrollView>
          </KeyboardAvoidingView>
      </ImageBackground>
    </KeyboardAvoidingView>
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
    backgroundColor: '#add4ce',
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
    marginBottom: 5,
  },
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  actionButtons: {
    marginBottom: 0,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButtonMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    marginBottom: 15,
  },
  saveButtonTextMain: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
  },
  cancelButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  buttonText: {
    color: '#1c1f33',
    fontSize: 18,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  dataSection: {
    marginBottom: 30,
  },
  sectionTitleMain: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dataItem: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    gap: 8,
  },
  labelMain: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#666666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#1c1f33',
    fontWeight: '500',
    lineHeight: 24,
  },
  inputMain: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gridContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    gap: 15,
  },
  gridItem: {
    width: '48%',
    marginBottom: 20,
    minHeight: 140,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fullWidth: {
    width: '100%',
    minHeight: 140,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 25,
    color: '#1c1f33',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  saveButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
});
