import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('welcome');

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.log('Error checking login status:', error);
    }
  };

  const handleLogin = async (method: string) => {
    try {
      // محاكاة عملية تسجيل الدخول
      const token = 'user_token_' + Date.now();
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify({
        name: 'المعلم محمد أحمد',
        email: 'teacher@example.com',
        method: method
      }));
      setIsLoggedIn(true);
      setCurrentScreen('dashboard');
      Alert.alert('تم بنجاح', 'تم تسجيل الدخول بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في تسجيل الدخول');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setCurrentScreen('welcome');
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  if (currentScreen === 'welcome') {
    return (
      <ImageBackground 
        source={require('@/assets/images/background.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.welcomeContent}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={80} name="graduationcap.fill" color="#4CAF50" />
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              البورتفوليو الرقمي للمعلم
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              منصتك المتكاملة لإدارة وعرض إنجازاتك المهنية
            </ThemedText>

            <TouchableOpacity 
              style={styles.getStartedButton}
              onPress={() => setCurrentScreen('login')}
            >
              <ThemedText style={styles.buttonText}>ابدأ الآن</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ImageBackground>
    );
  }

  if (currentScreen === 'login') {
    return (
      <ImageBackground 
        source={require('@/assets/images/background.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.loginContent}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="person.circle.fill" color="#2196F3" />
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              تسجيل الدخول
            </ThemedText>

            <ThemedView style={styles.loginButtons}>
              <TouchableOpacity 
                style={[styles.loginButton]}
                onPress={() => handleLogin('email')}
              >
                <IconSymbol size={24} name="envelope.fill" color="white" />
                <ThemedText style={styles.loginButtonText}>البريد الإلكتروني</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginButton]}
                onPress={() => handleLogin('google')}
              >
                <IconSymbol size={24} name="globe" color="white" />
                <ThemedText style={styles.loginButtonText}>حساب Google</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginButton]}
                onPress={() => handleLogin('apple')}
              >
                <IconSymbol size={24} name="apple.logo" color="white" />
                <ThemedText style={styles.loginButtonText}>حساب Apple</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentScreen('welcome')}
            >
              <IconSymbol size={24} name="arrow.left" color="#2196F3" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ImageBackground>
    );
  }

  if (currentScreen === 'dashboard') {
    return (
      <ImageBackground 
        source={require('@/assets/images/background.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <ThemedView style={styles.overlay}>
          <ThemedView style={styles.dashboardContent}>
            <ThemedView style={styles.dashboardHeader}>
              <ThemedText type="title" style={styles.welcomeTitle}>
                لوحة التحكم الرئيسية
              </ThemedText>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <IconSymbol size={24} name="arrow.right.square" color="#2E8B57" />
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.sectionsContainer}>
              <TouchableOpacity 
                style={[styles.sectionCard]}
                onPress={() => setCurrentScreen('basicData')}
              >
                <IconSymbol size={40} name="person.text.rectangle.fill" color="#4CAF50" />
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  البيانات الأساسية
                </ThemedText>
                <ThemedText style={styles.sectionDescription}>
                  المعلومات الشخصية والمهنية الأساسية
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sectionCard]}
                onPress={() => setCurrentScreen('performance')}
              >
                <IconSymbol size={40} name="chart.bar.fill" color="#FF9800" />
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  مجالات الأداء المهني
                </ThemedText>
                <ThemedText style={styles.sectionDescription}>
                  التقييمات والإنجازات المهنية
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sectionCard]}
                onPress={() => setCurrentScreen('tools')}
              >
                <IconSymbol size={40} name="wrench.and.screwdriver.fill" color="#2196F3" />
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  الأدوات المساعدة
                </ThemedText>
                <ThemedText style={styles.sectionDescription}>
                  أدوات وموارد لتطوير الأداء
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ImageBackground>
    );
  }

  // الشاشات الفرعية
  return (
    <ImageBackground 
      source={require('@/assets/images/background.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <ThemedView style={styles.overlay}>
        <ThemedView style={styles.dashboardContent}>
          <ThemedView style={styles.dashboardHeader}>
            <TouchableOpacity 
              onPress={() => setCurrentScreen('dashboard')}
              style={styles.backButton}
            >
              <IconSymbol size={24} name="arrow.left" color="#2196F3" />
            </TouchableOpacity>
            <ThemedText style={styles.welcomeTitle}>العودة للوحة التحكم</ThemedText>
          </ThemedView>

          {currentScreen === 'basicData' && (
            <ThemedView style={styles.sectionContent}>
              <ThemedText type="title" style={styles.sectionTitle}>
                البيانات الأساسية
              </ThemedText>
              <ThemedView style={styles.dataItem}>
                <ThemedText type="subtitle">الاسم الكامل</ThemedText>
                <ThemedText>المعلم محمد أحمد</ThemedText>
              </ThemedView>
              <ThemedView style={styles.dataItem}>
                <ThemedText type="subtitle">التخصص</ThemedText>
                <ThemedText>الرياضيات</ThemedText>
              </ThemedView>
              <ThemedView style={styles.dataItem}>
                <ThemedText type="subtitle">سنوات الخبرة</ThemedText>
                <ThemedText>10 سنوات</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {currentScreen === 'performance' && (
            <ThemedView style={styles.sectionContent}>
              <ThemedText type="title" style={styles.sectionTitle}>
                مجالات الأداء المهني
              </ThemedText>
              <ThemedView style={styles.performanceItem}>
                <ThemedText type="subtitle">التخطيط للتدريس</ThemedText>
                <ThemedText>ممتاز - 95%</ThemedText>
              </ThemedView>
              <ThemedView style={styles.performanceItem}>
                <ThemedText type="subtitle">استراتيجيات التدريس</ThemedText>
                <ThemedText>جيد جداً - 88%</ThemedText>
              </ThemedView>
              <ThemedView style={styles.performanceItem}>
                <ThemedText type="subtitle">إدارة الصف</ThemedText>
                <ThemedText>ممتاز - 92%</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {currentScreen === 'tools' && (
            <ThemedView style={styles.sectionContent}>
              <ThemedText type="title" style={styles.sectionTitle}>
                الأدوات المساعدة
              </ThemedText>
              <TouchableOpacity style={styles.toolItem}>
                <IconSymbol size={32} name="book.fill" color="#4CAF50" />
                <ThemedText type="subtitle">مكتبة الموارد التعليمية</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem}>
                <IconSymbol size={32} name="calendar" color="#FF9800" />
                <ThemedText type="subtitle">مخطط الدروس</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem}>
                <IconSymbol size={32} name="chart.line.uptrend.xyaxis" color="#2196F3" />
                <ThemedText type="subtitle">تقارير الأداء</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  dashboardContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresPreview: {
    width: '100%',
    marginBottom: 40,
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  getStartedButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    backgroundColor: '#2E8B6F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  loginButtons: {
    width: '100%',
    gap: 15,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: '#2E8B6F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(46, 139, 111, 0.1)',
    borderRadius: 20,
  },
  sectionsContainer: {
    gap: 20,
  },
  sectionCard: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});