import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, I18nManager, ImageBackground, KeyboardAvoidingView, ScrollView, Platform, StatusBar, TextInput, Alert } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AuthService from '@/services/AuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم الكامل');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await AuthService.signUpWithEmail(email, password, fullName);
      
      // حفظ البيانات الأساسية
      await AsyncStorage.setItem('basicData', JSON.stringify({ 
        fullName: user.name || fullName,
        email: user.email 
      }));

      Alert.alert('تم إنشاء الحساب بنجاح', 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني', [
        {
          text: 'حسناً',
          onPress: () => router.replace('/(tabs)')
        }
      ]);
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('خطأ في إنشاء الحساب', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <ThemedView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'ios' ? 'transparent' : '#F8F9FA'} 
        translucent={Platform.OS === 'ios'}
      />
      
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
          >
              {/* Header */}
              <ThemedView style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
                </TouchableOpacity>

                <ThemedView style={styles.iconContainer}>
                  <IconSymbol size={60} name="person.badge.plus" color="#1c1f33" />
                </ThemedView>
                
                <ThemedText type="title" style={styles.title}>
                  إنشاء حساب جديد
                </ThemedText>
                
                <ThemedText style={styles.subtitle}>
                  أدخل بياناتك لإنشاء حساب جديد
                </ThemedText>
              </ThemedView>

              {/* Signup Form */}
              <ThemedView style={styles.formContainer}>
                <ThemedView style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>الاسم الكامل</ThemedText>
                  <ThemedView style={styles.inputWrapper}>
                    <IconSymbol size={20} name="person.fill" color="#666666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="أدخل اسمك الكامل"
                      autoCapitalize="words"
                      autoCorrect={false}
                      placeholderTextColor="#999999"
                      textAlign="right"
                      textDirection="rtl"
                      writingDirection="rtl"
                    />
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>البريد الإلكتروني</ThemedText>
                  <ThemedView style={styles.inputWrapper}>
                    <IconSymbol size={20} name="envelope.fill" color="#666666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="أدخل بريدك الإلكتروني"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999999"
                      textAlign="right"
                      textDirection="rtl"
                      writingDirection="rtl"
                    />
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>كلمة المرور</ThemedText>
                  <ThemedView style={styles.inputWrapper}>
                    <IconSymbol size={20} name="lock.shield.fill" color="#666666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999999"
                      textAlign="right"
                      textDirection="rtl"
                      writingDirection="rtl"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <IconSymbol 
                        size={20} 
                        name={showPassword ? "eye" : "eye.slash"} 
                        color="#666666" 
                      />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>تأكيد كلمة المرور</ThemedText>
                  <ThemedView style={styles.inputWrapper}>
                    <IconSymbol size={20} name="lock.shield.fill" color="#666666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="أعد إدخال كلمة المرور"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999999"
                      textAlign="right"
                      textDirection="rtl"
                      writingDirection="rtl"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <IconSymbol 
                        size={20} 
                        name={showConfirmPassword ? "eye" : "eye.slash"} 
                        color="#666666" 
                      />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                <TouchableOpacity
                  style={[styles.signupButton, isLoading && styles.disabledButton]}
                  onPress={handleSignup}
                  disabled={isLoading}
                >
                  <ThemedText style={styles.signupButtonText}>
                    {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                  </ThemedText>
                </TouchableOpacity>





                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push('/login')}
                >
                  <ThemedText style={styles.loginButtonText}>
                    لديك حساب بالفعل؟ تسجيل الدخول
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        
      </ImageBackground>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    paddingHorizontal: Platform.OS === 'ios' ? 0 : 2,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    minHeight: '100%',
    paddingTop: Platform.OS === 'ios' ? 0 : 2,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 30,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
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
    marginBottom: 10,
    padding: 15,
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
    marginBottom: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  formContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 15,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    marginBottom: 4,
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 50,
    width: '100%',
  },
  inputIcon: {
    marginLeft: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    paddingVertical: 0,
    minHeight: 20,
    writingDirection: 'rtl',
    width: '100%',
  },
  eyeButton: {
    padding: 5,
    marginRight: 5,
  },
  signupButton: {
    backgroundColor: '#1c1f33',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#add4ce',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },


  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: 'transparent',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },

}); 
