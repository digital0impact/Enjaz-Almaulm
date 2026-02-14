import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ImageBackground, KeyboardAvoidingView, ScrollView, Platform, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

export default function TestLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    
    try {
      // تسجيل دخول مؤقت للاختبار
      const mockUser = {
        id: '1',
        email: email,
        name: email.split('@')[0] || 'المعلم'
      };

      // حفظ بيانات المستخدم
      await AsyncStorage.setItem('userInfo', JSON.stringify(mockUser));
      await AsyncStorage.setItem('userToken', 'test-token-' + Date.now());
      await AsyncStorage.setItem('basicData', JSON.stringify({ 
        fullName: mockUser.name,
        email: mockUser.email 
      }));

      Alert.alert('نجح', 'تم تسجيل الدخول بنجاح!');
      router.replace('/');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#E8F5F4" 
      />
      
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <ThemedView style={styles.header}>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="lock.shield.fill" color="#1c1f33" />
              </ThemedView>
              
              <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
                {formatRTLText('تسجيل الدخول للاختبار')}
              </ThemedText>
              
              <ThemedText style={[styles.subtitle, getTextDirection()]}> 
                {formatRTLText('أدخل أي بريد إلكتروني وكلمة مرور للاختبار')}
              </ThemedText>
            </ThemedView>

            {/* Login Form */}
            <ThemedView style={styles.formContainer}>
              <ThemedView style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, getTextDirection()]}>البريد الإلكتروني</ThemedText>
                <ThemedView style={styles.inputWrapper}>
                  <IconSymbol size={20} name="envelope.fill" color="#666666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, getTextDirection()]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={formatRTLText('أدخل بريدك الإلكتروني')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#999999"
                    textAlign="right"
                  />
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, getTextDirection()]}>كلمة المرور</ThemedText>
                <ThemedView style={styles.inputWrapper}>
                  <IconSymbol size={20} name="lock.shield.fill" color="#666666" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, getTextDirection()]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={formatRTLText('أدخل كلمة المرور')}
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#999999"
                    textAlign="right"
                  />
                </ThemedView>
              </ThemedView>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={[styles.loginButtonText, getTextDirection()]}> 
                    {formatRTLText('تسجيل الدخول للاختبار')}
                  </ThemedText>
                )}
              </TouchableOpacity>

              <ThemedView style={styles.footerContainer}>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <ThemedText style={[styles.createAccountText, getTextDirection()]}> 
                    {formatRTLText('العودة لتسجيل الدخول العادي')}
                  </ThemedText>
                </TouchableOpacity>
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
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 20,
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
    marginBottom: 10,
    textAlign: 'center',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    padding: 20,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 50,
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
  },
  loginButton: {
    backgroundColor: '#1c1f33',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 