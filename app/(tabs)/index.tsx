import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, TouchableOpacity, I18nManager, ImageBackground, Alert, KeyboardAvoidingView, ScrollView, Platform, StatusBar, Animated } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { VersionTracker } from '@/components/VersionTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import AuthService, { User } from '@/services/AuthService';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [teacherName, setTeacherName] = useState('المعلم');
  
  // متغير للدوران
  const rotateAnim = useRef(new Animated.Value(0)).current;
  


  useEffect(() => {
    checkLoginStatus();
    loadTeacherName();
  }, []);

  // وظيفة الدوران العمودي مع توقف
  useEffect(() => {
    const startRotation = () => {
      const runRotationSequence = () => {
        // إعادة تعيين القيمة إلى 0
        rotateAnim.setValue(0);
        
        // الدوران السريع دورة واحدة (3 ثوان)
        Animated.timing(rotateAnim, {
          toValue: 1, // دورة واحدة كاملة
          duration: 3000, // 3 ثوان للدورة الواحدة
          useNativeDriver: true,
        }).start(() => {
          // بعد انتهاء الدوران، انتظار 10 ثوان ثم إعادة الكرة
          setTimeout(() => {
            runRotationSequence();
          }, 10000);
        });
      };

      runRotationSequence();
    };

    if (currentScreen === 'welcome') {
      startRotation();
    }
  }, [currentScreen, rotateAnim]);

  useEffect(() => {
    // إخفاء شريط التنقل في شاشات الترحيب وتسجيل الدخول فقط
    if (currentScreen === 'welcome' || currentScreen === 'login') {
      navigation.setOptions({
        tabBarStyle: { display: 'none' }
      });
    } else {
      navigation.setOptions({
        tabBarStyle: { 
          display: 'flex',
          position: 'absolute',
          backgroundColor: '#E8F5F4',
        }
      });
    }
  }, [currentScreen, navigation]);

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
          const user = JSON.parse(userData);
          setUserInfo(user);
          setIsLoggedIn(true);
          setCurrentScreen('dashboard');
          // تحديث اسم المعلم عند تسجيل الدخول
          if (user.name) {
            const firstName = user.name.split(' ')[0];
            setTeacherName(firstName);
          }
        }
      }
    } catch (error) {
      console.log('Error checking login status:', error);
    }
  };



  const handleGetStarted = () => {
    // توجيه المستخدم إلى صفحة إنشاء الحساب مباشرة
    router.push('/signup');
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <ThemedView style={[styles.welcomeContent, { backgroundColor: 'transparent' }]}>
            <ThemedView style={[styles.heroSection, { backgroundColor: 'transparent' }]}>
              <ThemedView style={[styles.logoContainer, { backgroundColor: 'transparent' }]}>
                <Animated.View
                  style={[
                    styles.logoWithShadow,
                    {
                      transform: [{
                        rotateY: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'] // دورة واحدة كاملة
                        })
                      }]
                    }
                  ]}
                >
                  <Image 
                    source={require('@/assets/images/Logo.png')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </ThemedView>
              <ThemedText type="title" style={[styles.title, { backgroundColor: 'transparent' }]}>

              </ThemedText>
              <ThemedText style={[styles.subtitle, { textAlign: 'center', fontSize: 20, color: '#1c1f33', backgroundColor: 'transparent' }]}>
                منصتك المتكاملة لإدارة وعرض إنجازاتك المهنية
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.featuresSection, { marginBottom: 10, backgroundColor: 'transparent' }]}>
              <ThemedView style={[styles.featureItem, { backgroundColor: 'transparent' }]}>
                <ThemedText style={[styles.featureText, { backgroundColor: 'transparent' }]}></ThemedText>
              </ThemedView>
              <ThemedView style={[styles.featureItem, { backgroundColor: 'transparent' }]}>
                <ThemedText style={[styles.featureText, { backgroundColor: 'transparent' }]}></ThemedText>
              </ThemedView>
            </ThemedView>

            <TouchableOpacity 
              style={[styles.getStartedButton, { backgroundColor: 'rgba(173, 212, 206, 0.9)' }]}
              onPress={handleGetStarted}
            >
              <ThemedText style={[styles.buttonText, { backgroundColor: 'transparent' }]}>
                ابدأ الآن
              </ThemedText>
            </TouchableOpacity>

            <VersionTracker 
              showBuildInfo={false}
              style={[styles.versionContainer, { backgroundColor: 'transparent' }]}
            />
          </ThemedView>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }



  // Dashboard screen
  return (
    <ThemedView style={styles.dashboardContainer}>
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
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedView style={styles.header}>
                <ThemedView style={styles.iconContainer}>
                  <IconSymbol size={60} name="person.circle.fill" color="#1c1f33" />
                </ThemedView>
                <ThemedText type="title" style={styles.title}>
                  مرحباً {teacherName}
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  لوحة التحكم الرئيسية
                </ThemedText>
                
                <ThemedView style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => router.push('/settings')}
                  >
                    <IconSymbol size={20} name="wrench.fill" color="#1c1f33" />
                    <ThemedText style={styles.headerButtonText}>الإعدادات</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleLogout}
                  >
                    <IconSymbol size={20} name="arrow.right.square" color="#1c1f33" />
                    <ThemedText style={styles.headerButtonText}>تسجيل الخروج</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.content}>
                <ThemedView style={styles.toolsGrid}>
                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/azkar')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="doc.text.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.toolTitle}>أذكاري</ThemedText>
                    <ThemedText style={styles.toolDescription}>مجموعة من الأذكار اليومية المفيدة</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/interactive-report')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.toolTitle}>التقرير التفاعلي للأداء المهني</ThemedText>
                    <ThemedText style={styles.toolDescription}>تقييم وتحليل أدائك المهني كمعلم</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/student-tracking')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="person.crop.circle.badge.plus" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.toolTitle}>تتبع حالة المتعلمين</ThemedText>
                    <ThemedText style={styles.toolDescription}>متابعة وتقييم حالة الطلاب</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/password-tracker')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="lock.shield.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.toolTitle}>متتبع المواقع وكلمات المرور</ThemedText>
                    <ThemedText style={styles.toolDescription}>إدارة كلمات المرور والمواقع المهمة</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/schedule')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="calendar" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.toolTitle}>الجدول</ThemedText>
                    <ThemedText style={styles.toolDescription}>إدارة الجدول الدراسي والحصص</ThemedText>
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
    padding: 20,
  },
  dashboardContainer: {
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
  logoContainer: {
    width: 320,
    height: 320,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  logoWithShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  logoImage: {
    width: 380,
    height: 380,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
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
  versionContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonText: {
    color: '#1c1f33',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
  loginButtons: {
    width: '100%',
    gap: 15,
  },
  loginButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dashboardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    padding: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: 5,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  settingsButton: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButton: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  quickActions: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
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
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#000000',
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 30,
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    marginHorizontal: 10,
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
  content: {
    backgroundColor: 'transparent',
    gap: 15,
  },
  toolsGrid: {
    flexDirection: 'column',
    gap: 15,
    backgroundColor: 'transparent',
  },
  toolCard: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 15,
  },
  toolIconWrapper: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  headerButtonText: {
    color: '#1c1f33',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  actionButtons: {
    marginBottom: 20,
    flexDirection: 'row',
    gap: 10,
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
  dataSection: {
    marginBottom: 30,
  },
  dataItem: {
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
    alignItems: 'center',
    width: '48%',
  },
  iconWrapper: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: 'transparent',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },


});
