import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ImageBackground, KeyboardAvoidingView, ScrollView, Platform, StatusBar, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AuthService from '@/services/AuthService';
import { isSupabaseConfigured } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rtlStyles } from '@/styles/rtl-styles';
import { 
  getRTLTextStyle, 
  getRTLMargins, 
  getRTLPadding, 
  getFlexDirection 
} from '@/utils/rtl-utils';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      
      if (savedEmail && savedRememberMe === 'true') {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('البريد الإلكتروني مطلوب');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('كلمة المرور مطلوبة');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    setPasswordError('');
    return true;
  };



  const handleEmailLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', email);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('rememberMe');
      }

      const user = await AuthService.signInWithEmail(email, password);

      // تحديث البيانات الأساسية بشكل لطيف (بدون كسر بيانات موجودة مثل المهنة)
      const existingBasicData = await AsyncStorage.getItem('basicData');
      let basicData: any = {
        fullName: user.name || (user.email?.split('@')[0] ?? 'المعلم'),
        email: user.email,
      };

      if (existingBasicData) {
        try {
          const parsedBasicData = JSON.parse(existingBasicData);
          basicData = {
            ...parsedBasicData,
            fullName: basicData.fullName,
            email: basicData.email,
          };
        } catch {
          // تجاهل أخطاء parsing للحفاظ على تسجيل الدخول
        }
      }

      await AsyncStorage.setItem('basicData', JSON.stringify(basicData));

      // بعد تسجيل الدخول نوجّه إلى الجذر، ونقطة الدخول (`app/index.tsx`)
      // تتكفّل بإرسال المستخدم إلى تبويب الرئيسية.
      router.replace('/');
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : '';
      if (!isSupabaseConfigured) {
        Alert.alert(
          'تسجيل الدخول غير متاح',
          'لم يتم إعداد الاتصال بقاعدة البيانات. إذا كنت تفتح التطبيق من الويب، أضف EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY في Vercel → Settings → Environment Variables ثم أعد النشر.'
        );
      } else {
        Alert.alert(
          'خطأ في تسجيل الدخول',
          message || 'تأكد من صحة البريد الإلكتروني وكلمة المرور'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };





  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني أولاً');
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    try {
      await AuthService.resetPassword(email);
      Alert.alert(
        'تم إرسال رابط إعادة التعيين',
        'يرجى التحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور'
      );
    } catch (error) {
      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء إرسال رابط إعادة التعيين. يرجى المحاولة مرة أخرى'
      );
    }
  };

  return (
    <ThemedView style={[styles.container, rtlStyles.container]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'ios' ? 'transparent' : '#E8F5F4'} 
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <ThemedView style={[styles.header, { alignItems: 'center', justifyContent: 'center' }]}>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="person.fill" color="#1c1f33" />
              </ThemedView>
              
              <ThemedText type="title" style={[styles.title, { textAlign: 'center' }]}>
                تسجيل الدخول
              </ThemedText>
              
              <ThemedText style={[styles.subtitle, { textAlign: 'center' }]}>
                أهلاً بك مجدداً! يرجى تسجيل الدخول للمتابعة
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.formContainer}>
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { textAlign: 'right', writingDirection: 'rtl' }]}>البريد الإلكتروني</ThemedText>
                <ThemedView style={[styles.inputWrapper, emailError && styles.inputError, rtlStyles.rowReverse]}>
                  <IconSymbol size={20} name="envelope.fill" color="#666666" style={[styles.inputIcon, rtlStyles.icon]} />
                  <TextInput
                    style={[styles.textInput, rtlStyles.text]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      validateEmail(text);
                    }}
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
                {emailError ? <ThemedText style={[styles.errorText, rtlStyles.text]}>{emailError}</ThemedText> : null}
              </ThemedView>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { textAlign: 'right', writingDirection: 'rtl' }]}>كلمة المرور</ThemedText>
                <ThemedView style={[styles.inputWrapper, passwordError && styles.inputError, rtlStyles.rowReverse]}>
                  <IconSymbol size={20} name="lock.shield.fill" color="#666666" style={[styles.inputIcon, rtlStyles.icon]} />
                  <TextInput
                    style={[styles.textInput, rtlStyles.text]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      validatePassword(text);
                    }}
                    placeholder="أدخل كلمة المرور"
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
                {passwordError ? <ThemedText style={[styles.errorText, rtlStyles.text]}>{passwordError}</ThemedText> : null}
              </ThemedView>

              {/* Remember Me and Forgot Password */}
              <ThemedView style={[styles.optionsContainer, { flexDirection: 'row-reverse', justifyContent: 'space-between' }]}>
                <TouchableOpacity 
                  style={[styles.rememberMeContainer, { flexDirection: 'row-reverse', alignItems: 'center' }]}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <ThemedView style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <IconSymbol size={12} name="checkmark" color="#FFFFFF" />}
                  </ThemedView>
                  <ThemedText style={[styles.rememberMeText, { marginRight: 8 }]}>تذكرني</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleForgotPassword}>
                  <ThemedText style={styles.forgotPasswordText}>نسيت كلمة المرور؟</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* Terms and Conditions - تم نقلها إلى صفحة إنشاء الحساب */}

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleEmailLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={[styles.loginButtonText, rtlStyles.text]}>
                    تسجيل الدخول
                  </ThemedText>
                )}
              </TouchableOpacity>

              <ThemedView style={[styles.footerContainer, rtlStyles.rowReverse]}>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <ThemedText style={[styles.createAccountText, rtlStyles.text]}>
                    إنشاء حساب جديد
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.footerText, rtlStyles.text]}>
                  ليس لديك حساب؟
                </ThemedText>
              </ThemedView>
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
    color: '#000000',
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
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
  inputWrapper: {
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
    paddingVertical: 0,
    minHeight: 20,
    width: '100%',
  },
  eyeButton: {
    padding: 5,
    marginRight: 5,
  },
  loginButton: {
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
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: 'transparent',
  },
  rememberMeContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  rememberMeText: {
    marginHorizontal: 8,
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#1c1f33',
    borderColor: '#1c1f33',
  },
  forgotPasswordText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  footerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'transparent',
  },
  footerText: {
    color: '#666666',
    fontSize: 18,
    marginHorizontal: 5,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  createAccountText: {
    color: '#1c1f33',
    fontSize: 18,
    fontWeight: '600',
    textDecorationLine: 'underline',
    backgroundColor: 'transparent',
  },

}); 
