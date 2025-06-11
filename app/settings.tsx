
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkTheme, setDarkTheme] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadUserInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setDarkTheme(parsedSettings.darkTheme || false);
        setNotifications(parsedSettings.notifications !== false);
        setAutoBackup(parsedSettings.autoBackup !== false);
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
    setDarkTheme(value);
    saveSettings({ darkTheme: value });
    Alert.alert('تم التغيير', 'سيتم تطبيق الثيم الجديد عند إعادة تشغيل التطبيق');
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
            // محاكاة عملية النسخ الاحتياطي
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

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="arrow.right" color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>الإعدادات</ThemedText>
        <ThemedView style={styles.placeholder} />
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* معلومات المستخدم */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.userInfo}>
            <ThemedView style={styles.userAvatar}>
              <IconSymbol size={40} name="person.circle.fill" color="#007AFF" />
            </ThemedView>
            <ThemedView style={styles.userDetails}>
              <ThemedText style={styles.userName}>{userInfo?.name || 'المستخدم'}</ThemedText>
              <ThemedText style={styles.userEmail}>{userInfo?.email || 'user@example.com'}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* المظهر والثيمات */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>المظهر والثيمات</ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingInfo}>
              <IconSymbol size={24} name="moon.fill" color="#8A2BE2" />
              <ThemedView style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>الوضع الليلي</ThemedText>
                <ThemedText style={styles.settingDescription}>تفعيل المظهر الداكن</ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={darkTheme}
              onValueChange={handleThemeChange}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </ThemedView>

          <TouchableOpacity style={styles.settingItem}>
            <ThemedView style={styles.settingInfo}>
              <IconSymbol size={24} name="paintbrush.fill" color="#FF6B6B" />
              <ThemedView style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>ألوان التطبيق</ThemedText>
                <ThemedText style={styles.settingDescription}>تخصيص الألوان والخطوط</ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#C7C7CC" />
          </TouchableOpacity>
        </ThemedView>

        {/* الحساب والأمان */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>الحساب والأمان</ThemedText>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <ThemedView style={styles.settingInfo}>
              <IconSymbol size={24} name="key.fill" color="#FF9500" />
              <ThemedView style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>تغيير كلمة المرور</ThemedText>
                <ThemedText style={styles.settingDescription}>تحديث كلمة المرور الخاصة بك</ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#C7C7CC" />
          </TouchableOpacity>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingInfo}>
              <IconSymbol size={24} name="bell.fill" color="#34C759" />
              <ThemedView style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>التنبيهات</ThemedText>
                <ThemedText style={styles.settingDescription}>تفعيل الإشعارات</ThemedText>
              </ThemedView>
            </ThemedView>
            <Switch
              value={notifications}
              onValueChange={handleNotificationChange}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </ThemedView>
        </ThemedView>

        {/* النسخ الاحتياطي */}
        <ThemedView style={styles.section}>
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
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
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
            <IconSymbol size={16} name="chevron.left" color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleRestoreBackup}>
            <ThemedView style={styles.settingInfo}>
              <IconSymbol size={24} name="arrow.down.circle.fill" color="#FF9500" />
              <ThemedView style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>استعادة النسخة الاحتياطية</ThemedText>
                <ThemedText style={styles.settingDescription}>استرجاع البيانات المحفوظة</ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#C7C7CC" />
          </TouchableOpacity>
        </ThemedView>

        {/* تسجيل الخروج */}
        <ThemedView style={styles.section}>
          <TouchableOpacity style={[styles.settingItem, styles.logoutItem]} onPress={handleLogout}>
            <ThemedView style={styles.settingInfo}>
              <IconSymbol size={24} name="arrow.right.square" color="#FF3B30" />
              <ThemedText style={[styles.settingTitle, styles.logoutText]}>تسجيل الخروج</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.versionText}>الإصدار 1.0.0</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  userInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 16,
  },
  userAvatar: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
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
    color: '#8E8E93',
  },
});
