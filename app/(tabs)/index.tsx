import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, TouchableOpacity, ImageBackground, KeyboardAvoidingView, ScrollView, Platform, StatusBar, Animated, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { VersionTracker } from '@/components/VersionTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';

import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import AuthService from '@/services/AuthService';

const isWeb = Platform.OS === 'web';
const WELCOME_MAX_CONTENT_WIDTH = 420;
const LOGO_MAX_SIZE = 280;
const LOGO_MIN_SIZE = 160;

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [teacherName, setTeacherName] = useState('المعلم');
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // متغير للدوران
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // أحجام متجاوبة لصفحة الشعار (هواتف + ويب)
  const logoSize = Math.max(LOGO_MIN_SIZE, Math.min(screenWidth * 0.55, LOGO_MAX_SIZE));
  const contentWidth = isWeb ? Math.min(screenWidth, WELCOME_MAX_CONTENT_WIDTH) : screenWidth;
  const horizontalPadding = screenWidth < 380 ? 16 : 24;
  const subtitleFontSize = screenWidth < 380 ? 16 : 20;
  


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
      // المحاولة الأولى: جلسة Supabase الفعلية
      let user = await AuthService.checkAuthStatus();

      // في الويب أحياناً لا تُحمَّل الجلسة بشكل صحيح، فنستخدم نسخة محلية محفوظة
      if (!user) {
        const storedUser = await AsyncStorage.getItem('userInfo');
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch {
            user = null;
          }
        }
      }

      if (user) {
        const userData = await AsyncStorage.getItem('userInfo');
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          
          setUserInfo(parsedUser);
          setIsLoggedIn(true);
          setCurrentScreen('dashboard');
          
          if (parsedUser.name) {
            const firstName = parsedUser.name.split(' ')[0];
            setTeacherName(firstName);
          }
        } else {
          setUserInfo(user as any);
          setIsLoggedIn(true);
          setCurrentScreen('dashboard');
        }
      } else {
        // لا توجد جلسة ولا مستخدم محلي -> نبقي على شاشة الترحيب
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
      await AuthService.signOut();
      setIsLoggedIn(false);
      setUserInfo(null);
      setCurrentScreen('welcome');
    } catch (error) {
      // إن فشل signOut من Supabase نمسح التخزين المحلي فقط
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setUserInfo(null);
      setCurrentScreen('welcome');
    }
  };

  console.log('Current screen:', currentScreen, 'isLoggedIn:', isLoggedIn, 'userInfo:', userInfo);
  
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
          <ScrollView
            contentContainerStyle={[
              styles.welcomeScrollContent,
              { minHeight: screenHeight, paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.welcomeContent, { width: contentWidth, maxWidth: '100%', alignSelf: 'center', backgroundColor: 'transparent' }]}>
              <ThemedView style={[styles.heroSection, { backgroundColor: 'transparent' }]}>
                <ThemedView style={[styles.logoContainer, { backgroundColor: 'transparent', width: logoSize, height: logoSize, borderRadius: logoSize / 2, marginBottom: screenHeight < 600 ? 8 : 10, overflow: 'hidden' }]}>
                  <Animated.View
                    style={{
                      transform: [{
                        rotateY: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}
                  >
                    <Image 
                      source={require('@/assets/images/Logo.png')} 
                      style={{ width: logoSize, height: logoSize, backgroundColor: 'transparent' }}
                      resizeMode="cover"
                    />
                  </Animated.View>
                </ThemedView>
                <ThemedText type="title" style={[styles.title, getTextDirection(), { backgroundColor: 'transparent' }]}> 
            
                </ThemedText>
                <ThemedText style={[styles.subtitle, getTextDirection(), { textAlign: 'center', fontSize: subtitleFontSize, color: '#1c1f33', backgroundColor: 'transparent', paddingHorizontal: 8 }]}> 
                  {formatRTLText('منصتك المتكاملة لإدارة وعرض إنجازاتك المهنية')}
                </ThemedText>
              </ThemedView>

              <ThemedView style={[styles.featuresSection, { marginBottom: 4, backgroundColor: 'transparent' }]}>
                <ThemedView style={[styles.featureItem, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={[styles.featureText, { backgroundColor: 'transparent' }]}></ThemedText>
                </ThemedView>
                <ThemedView style={[styles.featureItem, { backgroundColor: 'transparent' }]}>
                  <ThemedText style={[styles.featureText, { backgroundColor: 'transparent' }]}></ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.welcomeButtons, { backgroundColor: 'transparent' }]}>
                <TouchableOpacity 
                  style={[styles.getStartedButton, { backgroundColor: 'rgba(173, 212, 206, 0.9)', minWidth: screenWidth < 340 ? 140 : 160 }]}
                  onPress={handleGetStarted}
                >
                  <ThemedText style={[styles.buttonText, getTextDirection(), { backgroundColor: 'transparent' }]}> 
                    {formatRTLText('ابدأ الآن')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.loginLinkButton, { backgroundColor: 'transparent' }]}
                  onPress={() => router.push('/login')}
                >
                  <ThemedText style={[styles.loginLinkText, getTextDirection(), { fontSize: screenWidth < 380 ? 14 : 15, backgroundColor: 'transparent' }]}> 
                    {formatRTLText('لديك حساب؟ تسجيل الدخول')}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <VersionTracker 
                showBuildInfo={false}
                style={[styles.versionContainer, { backgroundColor: 'transparent' }]}
              />
            </View>
          </ScrollView>
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
                <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
                  {formatRTLText(`مرحباً ${teacherName}`)}
                </ThemedText>
                <ThemedText style={[styles.subtitle, getTextDirection()]}> 
                  {formatRTLText('لوحة التحكم الرئيسية')}
                </ThemedText>
                
                <ThemedView style={styles.headerButtons}>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => router.push('/settings')}
                  >
                    <IconSymbol size={20} name="wrench.fill" color="#1c1f33" />
                    <ThemedText style={[styles.headerButtonText, getTextDirection()]}>الإعدادات</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={handleLogout}
                  >
                    <IconSymbol size={20} name="arrow.right.square" color="#1c1f33" />
                    <ThemedText style={[styles.headerButtonText, getTextDirection()]}>تسجيل الخروج</ThemedText>
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
                    <ThemedText style={[styles.toolTitle, getTextDirection()]}>أذكاري</ThemedText>
                    <ThemedText style={[styles.toolDescription, getTextDirection()]}>مجموعة من الأذكار اليومية المفيدة</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/schedule')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="calendar" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={[styles.toolTitle, getTextDirection()]}>الجدول</ThemedText>
                    <ThemedText style={[styles.toolDescription, getTextDirection()]}>إدارة الجدول الدراسي والحصص</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/interactive-report')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={[styles.toolTitle, getTextDirection()]}>التقرير التفاعلي للأداء المهني</ThemedText>
                    <ThemedText style={[styles.toolDescription, getTextDirection()]}>تقييم وتحليل أدائك المهني كمعلم</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/student-tracking')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="person.crop.circle.badge.plus" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={[styles.toolTitle, getTextDirection()]}>تتبع حالة المتعلمين</ThemedText>
                    <ThemedText style={[styles.toolDescription, getTextDirection()]}>متابعة وتقييم حالة الطلاب</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.toolCard}
                    onPress={() => router.push('/password-tracker')}
                  >
                    <ThemedView style={styles.toolIconWrapper}>
                      <IconSymbol size={28} name="lock.shield.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={[styles.toolTitle, getTextDirection()]}>متتبع المواقع وكلمات المرور</ThemedText>
                    <ThemedText style={[styles.toolDescription, getTextDirection()]}>إدارة كلمات المرور والمواقع المهمة</ThemedText>
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
    overflow: 'hidden',
  },
  logoImage: {
    width: 380,
    height: 380,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
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
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  welcomeScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  welcomeContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
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
    marginBottom: 8,
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
  welcomeButtons: {
    alignItems: 'center',
    gap: 12,
    marginTop: 0,
  },
  loginLinkButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  loginLinkText: {
    color: '#1c1f33',
    fontSize: 15,
    textDecorationLine: 'underline',
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
    flexDirection: 'row-reverse', // RTL for Arabic app
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
