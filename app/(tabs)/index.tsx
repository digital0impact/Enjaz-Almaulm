
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
      <ThemedView style={styles.container}>
        <IconSymbol size={80} name="graduationcap.fill" color="#4CAF50" />
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
    );
  }

  if (currentScreen === 'login') {
    return (
      <ThemedView style={styles.container}>
        <IconSymbol size={60} name="person.circle.fill" color="#2196F3" />
        <ThemedText type="title" style={styles.title}>
          تسجيل الدخول
        </ThemedText>
        
        <TouchableOpacity 
          style={[styles.loginButton, styles.emailButton]}
          onPress={() => handleLogin('email')}
        >
          <IconSymbol size={24} name="envelope.fill" color="white" />
          <ThemedText style={styles.buttonText}>البريد الإلكتروني</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, styles.googleButton]}
          onPress={() => handleLogin('google')}
        >
          <IconSymbol size={24} name="globe" color="white" />
          <ThemedText style={styles.buttonText}>حساب Google</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, styles.appleButton]}
          onPress={() => handleLogin('apple')}
        >
          <IconSymbol size={24} name="apple.logo" color="white" />
          <ThemedText style={styles.buttonText}>حساب Apple</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentScreen('welcome')}
        >
          <ThemedText style={styles.backText}>العودة</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (currentScreen === 'dashboard') {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.dashboardTitle}>
            لوحة التحكم الرئيسية
          </ThemedText>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutText}>تسجيل خروج</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.sectionsContainer}>
          <TouchableOpacity 
            style={[styles.sectionCard, styles.basicDataCard]}
            onPress={() => setCurrentScreen('basicData')}
          >
            <IconSymbol size={40} name="person.text.rectangle.fill" color="#4CAF50" />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              البيانات الأساسية
            </ThemedText>
            <ThemedText style={styles.cardDescription}>
              المعلومات الشخصية والمهنية الأساسية
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sectionCard, styles.performanceCard]}
            onPress={() => setCurrentScreen('performance')}
          >
            <IconSymbol size={40} name="chart.bar.fill" color="#FF9800" />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              مجالات الأداء المهني
            </ThemedText>
            <ThemedText style={styles.cardDescription}>
              التقييمات والإنجازات المهنية
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sectionCard, styles.toolsCard]}
            onPress={() => setCurrentScreen('tools')}
          >
            <IconSymbol size={40} name="wrench.and.screwdriver.fill" color="#2196F3" />
            <ThemedText type="subtitle" style={styles.cardTitle}>
              الأدوات المساعدة
            </ThemedText>
            <ThemedText style={styles.cardDescription}>
              أدوات وموارد لتطوير الأداء
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  // الشاشات الفرعية
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={() => setCurrentScreen('dashboard')}
          style={styles.backButton}
        >
          <IconSymbol size={24} name="arrow.left" color="#2196F3" />
          <ThemedText style={styles.backText}>العودة للوحة التحكم</ThemedText>
        </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.8,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 8,
    width: '80%',
    gap: 10,
  },
  emailButton: {
    backgroundColor: '#2196F3',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  backText: {
    color: '#2196F3',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  sectionsContainer: {
    flex: 1,
    width: '100%',
    gap: 15,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  basicDataCard: {
    backgroundColor: '#E8F5E8',
  },
  performanceCard: {
    backgroundColor: '#FFF3E0',
  },
  toolsCard: {
    backgroundColor: '#E3F2FD',
  },
  cardTitle: {
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  cardDescription: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  sectionContent: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: 30,
  },
  dataItem: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 15,
  },
});
