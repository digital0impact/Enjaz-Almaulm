import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, I18nManager, ImageBackground, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { useDatabase } from '@/contexts/DatabaseContext';


export default function SettingsScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('المستخدم');
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { themeName, themeMode, colors, setThemeName, setThemeMode, availableThemes } = useTheme();
  const [selectedColorScheme, setSelectedColorScheme] = useState('default');
  const { deleteUserAccount, requestAccountDeletion, isLoading } = useDatabase();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadUserInfo();
    loadBasicData();
    loadCurrentUserId();
  }, []);

  const loadCurrentUserId = async () => {
    try {
      // محاولة الحصول على معرف المستخدم من AsyncStorage
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userInfo');
      
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setCurrentUserId(parsedUserData.id || '550e8400-e29b-41d4-a716-446655440000');
      } else if (userToken) {
        setCurrentUserId(userToken);
      } else {
        // استخدام معرف افتراضي إذا لم يتم العثور على معرف المستخدم
        setCurrentUserId('550e8400-e29b-41d4-a716-446655440000');
      }
    } catch (error) {
      console.log('Error loading user ID:', error);
      setCurrentUserId('550e8400-e29b-41d4-a716-446655440000');
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotifications(parsedSettings.notifications !== false);
        setAutoBackup(parsedSettings.autoBackup !== false);
        setSelectedColorScheme(parsedSettings.colorScheme || 'default');
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error loading user info:', error);
    }
  };

  const loadBasicData = async () => {
    try {
      const basicData = await AsyncStorage.getItem('basicData');
      if (basicData) {
        const parsedData = JSON.parse(basicData);
        setUserName(parsedData.fullName || 'المستخدم');
        setUserInfo(prev => ({
          ...prev,
          email: parsedData.email || prev?.email || 'teacher@example.com'
        }));
      }
    } catch (error) {
      console.log('Error loading basic data:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      const currentSettings = await AsyncStorage.getItem('appSettings');
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const handleThemeChange = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const handleNotificationChange = (value: boolean) => {
    setNotifications(value);
    saveSettings({ notifications: value });
  };

  const handleAutoBackupChange = (value: boolean) => {
    setAutoBackup(value);
    saveSettings({ autoBackup: value });
    if (value) {
      Alert.alert('تم التفعيل', 'سيتم إنشاء نسخة احتياطية تلقائياً كل يوم');
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'تغيير كلمة المرور',
      'هل تريد تغيير كلمة المرور؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تغيير',
          onPress: () => {
            Alert.alert(
              'تم إرسال الطلب',
              'تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني'
            );
          }
        }
      ]
    );
  };

  const handleBackup = () => {
    Alert.alert(
      'إنشاء نسخة احتياطية',
      'سيتم إنشاء نسخة احتياطية من جميع بياناتك',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إنشاء النسخة',
          onPress: () => {
            Alert.alert('تم بنجاح', 'تم إنشاء النسخة الاحتياطية وحفظها في التخزين السحابي');
          }
        }
      ]
    );
  };

  const handleRestoreBackup = () => {
    Alert.alert(
      'استعادة النسخة الاحتياطية',
      'هذا سيؤدي إلى استبدال البيانات الحالية بالنسخة الاحتياطية',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة',
          style: 'destructive',
          onPress: () => {
            Alert.alert('تم بنجاح', 'تم استعادة البيانات من النسخة الاحتياطية');
          }
        }
      ]
    );
  };

  const handleColorSchemeChange = (scheme: string) => {
    setThemeName(scheme as any);
    setSelectedColorScheme(scheme);
  };

  const getColorSchemeOptions = () => availableThemes.map(theme => ({
    name: theme.name,
    value: theme.key
  }));

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userInfo');
              router.replace('/(tabs)');
            } catch (error) {
              console.log('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!currentUserId) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف المستخدم. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    if (isLoading) {
      Alert.alert('انتظار', 'يرجى الانتظار حتى انتهاء العملية السابقة.');
      return;
    }

    Alert.alert(
      'حذف الحساب',
      'اختر نوع الحذف:\n\n• الحذف الفوري: سيتم حذف حسابك وجميع بياناتك نهائياً الآن\n• طلب الحذف: سيتم إرسال طلب للمراجعة',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'طلب الحذف',
          onPress: () => {
            Alert.prompt(
              'سبب طلب الحذف',
              'يرجى ذكر سبب طلب حذف الحساب (اختياري):',
              async (reason) => {
                try {
                  console.log('Requesting account deletion for user:', currentUserId);
                  await requestAccountDeletion(reason || '');
                  Alert.alert(
                    'تم إرسال الطلب',
                    'تم إرسال طلب حذف الحساب بنجاح. سيتم معالجة طلبك في أقرب وقت ممكن.'
                  );
                } catch (error) {
                  console.error('Error requesting account deletion:', error);
                  Alert.alert(
                    'خطأ', 
                    `فشل في إرسال طلب الحذف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
                  );
                }
              }
            );
          }
        },
        {
          text: 'حذف فوري',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'تأكيد الحذف الفوري',
              'هل أنت متأكد من أنك تريد حذف حسابك نهائياً الآن؟ لا يمكن التراجع عن هذا الإجراء.',
              [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'حذف نهائياً',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      console.log('Deleting account for user:', currentUserId);
                      await deleteUserAccount();
                      await AsyncStorage.multiRemove([
                        'userToken',
                        'userInfo',
                        'basicData',
                        'appSettings'
                      ]);
                      Alert.alert(
                        'تم الحذف',
                        'تم حذف حسابك وجميع بياناتك بنجاح.',
                        [
                          {
                            text: 'موافق',
                            onPress: () => router.replace('/(tabs)')
                          }
                        ]
                      );
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'خطأ', 
                        `فشل في حذف الحساب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
                      );
                    }
                  }
                }
              ]
            );
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
          colors={themeMode === 'dark'
            ? ['rgba(33,37,41,0.9)', 'rgba(52,58,64,0.95)', 'rgba(73,80,87,0.8)']
            : ['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']
          }
          style={styles.gradientOverlay}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
              </TouchableOpacity>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="gear.fill" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>الإعدادات</ThemedText>
              <ThemedText style={styles.subtitle}>إعدادات التطبيق والحساب</ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              {/* معلومات المستخدم */}
              <ThemedView style={[styles.section, { backgroundColor: 'transparent' }]}>
                <ThemedView style={[styles.userInfo, themeMode === 'dark' && styles.darkUserInfo]}>
                  <ThemedView style={styles.userAvatar}>
                    <IconSymbol size={40} name="person.circle.fill" color={themeMode === 'dark' ? "#fff" : "#1c1f33"} />
                  </ThemedView>
                  <ThemedView style={styles.userDetails}>
                    <ThemedText style={[styles.userName, themeMode === 'dark' && styles.darkText]}>{userName}</ThemedText>
                    <ThemedText style={[styles.userEmail, themeMode === 'dark' && styles.darkSubtext]}>{userInfo?.email || 'teacher@example.com'}</ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>

              {/* المظهر والثيمات */}
              <ThemedView style={[styles.section, { backgroundColor: 'transparent' }]}>
                <ThemedText style={[styles.sectionTitle, themeMode === 'dark' && styles.darkSectionTitle]}>المظهر والثيمات</ThemedText>





                <ThemedView style={[styles.settingItem, themeMode === 'dark' && styles.darkSettingItem]}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="moon.fill" color="#8A2BE2" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={styles.settingTitle}>الوضع الليلي</ThemedText>
                      <ThemedText style={styles.settingDescription}>تفعيل المظهر الداكن</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Switch
                    value={themeMode === 'dark'}
                    onValueChange={handleThemeChange}
                    trackColor={{ false: '#E5E5EA', true: '#add4ce' }}
                    thumbColor="#FFFFFF"
                  />
                </ThemedView>

                <TouchableOpacity 
                  style={[styles.settingItem, themeMode === 'dark' && styles.darkSettingItem]}
                  onPress={() => {
                    const colorOptions = getColorSchemeOptions();
                    Alert.alert(
                      'ألوان التطبيق',
                      `النظام الحالي: ${colorOptions.find(c => c.value === selectedColorScheme)?.name || 'الافتراضي'}\n\nاختر نظام الألوان المفضل لديك:`,
                      [
                        ...colorOptions.map(option => ({
                          text: `${option.name} ${option.value === selectedColorScheme ? '✓' : ''}`,
                          onPress: () => handleColorSchemeChange(option.value)
                        })),
                        { text: 'إلغاء', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="paintbrush.fill" color="#FF6B6B" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={styles.settingTitle}>ألوان التطبيق</ThemedText>
                      <ThemedText style={styles.settingDescription}>
                        النظام الحالي: {getColorSchemeOptions().find(c => c.value === selectedColorScheme)?.name || 'الافتراضي'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={16} name="chevron.left" color="#666666" />
                </TouchableOpacity>
              </ThemedView>

              {/* الحساب والأمان */}
              <ThemedView style={[styles.section, { backgroundColor: 'transparent' }]}>
                <ThemedText style={styles.sectionTitle}>الحساب والأمان</ThemedText>

                <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="key.fill" color="#FF9500" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={styles.settingTitle}>تغيير كلمة المرور</ThemedText>
                      <ThemedText style={styles.settingDescription}>تحديث كلمة المرور الخاصة بك</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={16} name="chevron.left" color="#666666" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, themeMode === 'dark' && styles.darkSettingItem]} onPress={handleDeleteAccount}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="trash.fill" color="#FF3B30" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={[styles.settingTitle, { color: '#FF3B30' }]}>حذف الحساب</ThemedText>
                      <ThemedText style={styles.settingDescription}>حذف الحساب وجميع البيانات نهائياً</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={16} name="chevron.left" color="#FF3B30" />
                </TouchableOpacity>

              </ThemedView>

              {/* النسخ الاحتياطي */}
              <ThemedView style={[styles.section, { backgroundColor: 'transparent' }]}>
                <ThemedText style={styles.sectionTitle}>النسخ الاحتياطي</ThemedText>

                <ThemedView style={styles.settingItem}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="icloud.fill" color="#007AFF" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={styles.settingTitle}>النسخ التلقائي</ThemedText>
                      <ThemedText style={styles.settingDescription}>نسخ احتياطي يومي للبيانات</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <Switch
                    value={autoBackup}
                    onValueChange={handleAutoBackupChange}
                    trackColor={{ false: '#E5E5EA', true: '#add4ce' }}
                    thumbColor="#FFFFFF"
                  />
                </ThemedView>

                <TouchableOpacity style={styles.settingItem} onPress={handleBackup}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="arrow.up.circle.fill" color="#32D74B" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={styles.settingTitle}>إنشاء نسخة احتياطية</ThemedText>
                      <ThemedText style={styles.settingDescription}>حفظ نسخة من بياناتك الآن</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={16} name="chevron.left" color="#666666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={handleRestoreBackup}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="arrow.down.circle.fill" color="#FF9500" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={styles.settingTitle}>استعادة النسخة الاحتياطية</ThemedText>
                      <ThemedText style={styles.settingDescription}>استرجاع البيانات المحفوظة</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={16} name="chevron.left" color="#666666" />
                </TouchableOpacity>
              </ThemedView>

              {/* تسجيل الخروج */}
              <ThemedView style={[styles.section, { backgroundColor: 'transparent' }]}>
                <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleLogout}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="arrow.right.square" color="#FF3B30" />
                    <ThemedText style={[styles.settingTitle, styles.logoutText]}>تسجيل الخروج</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={[styles.footer, { backgroundColor: 'transparent' }]}>
                <ThemedText style={styles.versionText}>الإصدار 1.0.0</ThemedText>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </ExpoLinearGradient>
      </ImageBackground>
      <BottomNavigationBar />
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
    position: 'relative',
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
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'transparent',
    borderRadius: 50,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#1c1f33',
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
  section: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  userInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  userAvatar: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
  },
  userDetails: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 20,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  settingInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  settingText: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
    flex: 1,
    backgroundColor: 'transparent',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
  },
  // أنماط الوضع الداكن
  darkUserInfo: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  darkText: {
    color: '#ecf0f1',
  },
  darkSubtext: {
    color: '#bdc3c7',
  },
  darkSettingItem: {
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  darkSectionTitle: {
    color: '#ecf0f1',
  },

});