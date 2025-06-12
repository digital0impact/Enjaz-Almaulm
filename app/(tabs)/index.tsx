import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Image, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [teacherName, setTeacherName] = useState('المعلم');

  useEffect(() => {
    checkLoginStatus();
    loadTeacherName();
  }, []);

  const loadTeacherName = async () => {
    try {
      const basicData = await AsyncStorage.getItem('basicData');
      if (basicData) {
        const parsedData = JSON.parse(basicData);
        if (parsedData.fullName) {
          // استخراج الاسم الأول من الاسم الكامل
          const firstName = parsedData.fullName.split(' ')[0];
          setTeacherName(firstName);
        }
      }
    } catch (error) {
      console.log('Error loading teacher name:', error);
    }
  };

  const checkLoginStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (userToken) {
        const userData = await AsyncStorage.getItem('userInfo');
        if (userData) {
          setUserInfo(JSON.parse(userData));
        }
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
        // تحديث اسم المعلم عند تسجيل الدخول
        loadTeacherName();
      }
    } catch (error) {
      console.log('Error checking login status:', error);
    }
  };

  const handleLogin = async (method: string) => {
    try {
      const token = 'user_token_' + Date.now();
      const userData = {
        name: 'المعلم محمد أحمد',
        email: 'teacher@example.com',
        method: method
      };
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
      setUserInfo(userData);
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
      setUserInfo(null);
      setCurrentScreen('welcome');
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  if (currentScreen === 'welcome') {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.gradientBackground}>
          <ThemedView style={styles.welcomeContent}>
            <ThemedView style={styles.heroSection}>
              <ThemedView style={styles.logoContainer}>
                <IconSymbol size={80} name="book.fill" color="#007AFF" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                البورتفوليو الرقمي للمعلم
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                منصتك المتكاملة لإدارة وعرض إنجازاتك المهنية
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.featuresSection}>
              <ThemedView style={styles.featureItem}>
                <IconSymbol size={32} name="chart.bar.fill" color="#4CAF50" />
                <ThemedText style={styles.featureText}>تتبع الأداء المهني</ThemedText>
              </ThemedView>
              <ThemedView style={styles.featureItem}>
                <IconSymbol size={32} name="person.text.rectangle.fill" color="#FF9800" />
                <ThemedText style={styles.featureText}>إدارة البيانات الأساسية</ThemedText>
              </ThemedView>
              <ThemedView style={styles.featureItem}>
                <IconSymbol size={32} name="wrench.and.screwdriver.fill" color="#2196F3" />
                <ThemedText style={styles.featureText}>أدوات متنوعة</ThemedText>
              </ThemedView>
            </ThemedView>

            <TouchableOpacity 
              style={styles.getStartedButton}
              onPress={() => setCurrentScreen('login')}
            >
              <ThemedText style={styles.buttonText}>ابدأ الآن</ThemedText>
              <IconSymbol size={20} name="arrow.left" color="white" />
            </TouchableOpacity>

            <ThemedText style={styles.versionText}>
              الإصدار 1.0 - تطوير المعلم المحترف
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  }

  if (currentScreen === 'login') {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.gradientBackground}>
          <ThemedView style={styles.loginContent}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="person.circle.fill" color="#007AFF" />
            </ThemedView>
            <ThemedText type="title" style={styles.title}>
              تسجيل الدخول
            </ThemedText>

            <ThemedView style={styles.loginButtons}>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => handleLogin('email')}
              >
                <IconSymbol size={24} name="envelope.fill" color="white" />
                <ThemedText style={styles.loginButtonText}>البريد الإلكتروني</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => handleLogin('google')}
              >
                <IconSymbol size={24} name="globe" color="white" />
                <ThemedText style={styles.loginButtonText}>حساب Google</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginButton}
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
              <IconSymbol size={24} name="arrow.left" color="#007AFF" />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  }

  // Dashboard screen
  return (
    <ThemedView style={[styles.container, styles.gradientBackground]}>
      <ThemedView style={styles.gradientBackground}>
        <ThemedView style={styles.dashboardContent}>
          <ThemedView style={styles.dashboardHeader}>
            <ThemedView style={{ flex: 1 }}>
              <ThemedText type="title" style={[styles.welcomeTitle, { textAlign: 'center' }]}>
                مرحباً {teacherName}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.headerButtons}>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
                <IconSymbol size={24} name="wrench.fill" color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <IconSymbol size={24} name="arrow.right.square" color="#007AFF" />
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.quickActions}>
            <ThemedView style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <IconSymbol size={28} name="plus.circle.fill" color="#4CAF50" />
                <ThemedText style={styles.actionText}>عرض التقرير التفاعلي</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/azkar')}
              >
                <IconSymbol size={28} name="doc.text.fill" color="#FF9800" />
                <ThemedText style={styles.actionText}>أذكاري</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/password-tracker')}
              >
                <IconSymbol size={28} name="lock.shield.fill" color="#6A1B9A" />
                <ThemedText style={styles.actionText}>متتبع المواقع وكلمات المرور</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/student-tracking')}
              >
                <IconSymbol size={28} name="person.crop.circle.badge.plus" color="#E91E63" />
                <ThemedText style={styles.actionText}>تتبع حالة متعلم</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <IconSymbol size={28} name="envelope.fill" color="#2196F3" />
                <ThemedText style={styles.actionText}>التعليقات</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => router.push('/schedule')}
              >
                <IconSymbol size={28} name="calendar" color="#9C27B0" />
                <ThemedText style={styles.actionText}>الجدول</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  gradientBackground: {
    backgroundColor: '#a8e6cf',
    flex: 1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    color: '#555555',
    writingDirection: 'rtl',
  },
  versionText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
    writingDirection: 'rtl',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  dashboardContent: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
    color: '#000000',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
    color: '#666666',
    writingDirection: 'rtl',
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#007AFF',
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
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loginButtons: {
    width: '100%',
    gap: 15,
  },
  loginButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    gap: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 5,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsButton: {
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quickActions: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#000000',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

});