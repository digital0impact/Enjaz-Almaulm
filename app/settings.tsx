import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform, StatusBar, KeyboardAvoidingView, Animated } from 'react-native';
import { AlertService } from '@/services/AlertService';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { BackupProgressModal } from '@/components/BackupProgressModal';
import { BackupService, BackupProgress } from '@/services/BackupService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { VERSION_INFO } from '@/constants/Version';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { AcademicYearService } from '@/services/AcademicYearService';
import { formatAcademicYearLabel } from '@/constants/academicYear';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [backupProgress, setBackupProgress] = useState<BackupProgress>({
    current: 0,
    total: 4,
    message: '',
    percentage: 0
  });
  const [showBackupProgress, setShowBackupProgress] = useState(false);
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [lastBackupInfo, setLastBackupInfo] = useState<{date: string, size: string, type: string} | null>(null);
  const [canUseBackup, setCanUseBackup] = useState<boolean | null>(null);

  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');
  const [archivedYearKeys, setArchivedYearKeys] = useState<string[]>([]);
  const [isEndingYear, setIsEndingYear] = useState(false);
  
  // معلومات الإصدار
  const [versionInfo, setVersionInfo] = useState({
    version: VERSION_INFO.getVersion(),
    releaseDate: VERSION_INFO.releaseDate
  });



  useEffect(() => {
    loadNotificationSettings();
    loadLastBackupInfo();
    loadVersionInfo();
    loadBackupPermission();
    loadAcademicYear();
    AcademicYearService.migrateToAcademicYearIfNeeded();
    
    // تحريك الصفحة عند التحميل
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // إعادة تحميل معلومات الإصدار والصلاحيات عند التركيز على الشاشة
  useFocusEffect(
    React.useCallback(() => {
      loadVersionInfo();
      loadBackupPermission();
      loadAcademicYear();
    }, [])
  );

  const loadAcademicYear = async () => {
    try {
      const [year, keys] = await Promise.all([
        AcademicYearService.getCurrentAcademicYear(),
        AcademicYearService.getArchivedYearKeys(),
      ]);
      setCurrentAcademicYear(year);
      setArchivedYearKeys(keys);
    } catch {
      setCurrentAcademicYear('');
      setArchivedYearKeys([]);
    }
  };

  const handleEndYearAndStartNew = () => {
    AlertService.alert(
      formatRTLText('إنهاء العام الدراسي وبدء عام جديد'),
      formatRTLText(
        'سيتم حفظ بيانات العام الحالي (المتعلمين، التقارير، الغياب، الجدول، التنبيهات، وغيرها) وستبدأ بعام دراسي جديد فارغ.\n\nننصح بعمل «نسخة احتياطية» قبل المتابعة إن أردت نسخة على السحابة.'
      ),
      [
        { text: formatRTLText('إلغاء'), style: 'cancel' },
        {
          text: formatRTLText('إنهاء العام وبدء جديد'),
          style: 'destructive',
          onPress: async () => {
            setIsEndingYear(true);
            const result = await AcademicYearService.endYearAndStartNew();
            setIsEndingYear(false);
            if (result.success) {
              await loadAcademicYear();
              AlertService.alert(
                formatRTLText('تم بدء عام دراسي جديد'),
                formatRTLText('تم حفظ بيانات العام السابق وبدء العام ') + formatAcademicYearLabel(result.newYearKey) + formatRTLText('.\n\nيمكنك العودة إلى الأعوام السابقة من هذه الصفحة عند الحاجة.'),
                [{ text: formatRTLText('حسناً'), onPress: () => router.replace('/') }]
              );
            } else {
              AlertService.alert(formatRTLText('خطأ'), result.error || formatRTLText('حدث خطأ أثناء إنهاء العام.'));
            }
          },
        },
      ]
    );
  };

  const handleSwitchToYear = (yearKey: string) => {
    if (yearKey === currentAcademicYear) return;
    AlertService.alert(
      formatRTLText('التبديل إلى عام آخر'),
      formatRTLText('التبديل إلى العام ') + formatAcademicYearLabel(yearKey) + formatRTLText(' سيُظهر بيانات ذلك العام. يمكنك العودة للعام الحالي لاحقاً.'),
      [
        { text: formatRTLText('إلغاء'), style: 'cancel' },
        {
          text: formatRTLText('تبديل'),
          onPress: async () => {
            const result = await AcademicYearService.switchToYear(yearKey);
            if (result.success) {
              await loadAcademicYear();
              AlertService.alert(formatRTLText('تم'), formatRTLText('تم التبديل إلى العام ') + formatAcademicYearLabel(yearKey), [
                { text: formatRTLText('حسناً'), onPress: () => router.replace('/') },
              ]);
            } else {
              AlertService.alert(formatRTLText('خطأ'), result.error || formatRTLText('حدث خطأ أثناء التبديل.'));
            }
          },
        },
      ]
    );
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotificationsEnabled(parsedSettings.enabled);
      }
    } catch (error) {
      console.log('خطأ في تحميل إعدادات الإشعارات');
    }
  };



  const loadBackupPermission = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setCanUseBackup(false);
        return;
      }
      const subscription = await SubscriptionService.getCurrentSubscription(user.id);
      setCanUseBackup(Boolean(subscription && subscription.plan_type !== 'free'));
    } catch {
      setCanUseBackup(false);
    }
  };

  const loadLastBackupInfo = async () => {
    try {
      const backupService = BackupService.getInstance();
      const backups = await backupService.getUserBackups();
      
      if (backups.length > 0) {
        const lastBackup = backups[0]; // أول عنصر هو الأحدث
        const backupDate = new Date(lastBackup.createdAt);
        const formattedDate = backupDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const backupSize = lastBackup.totalSize ? `${(lastBackup.totalSize / 1024).toFixed(1)} KB` : 'غير محدد';
        const backupType = lastBackup.backupType === 'manual' ? 'يدوية' : 'تلقائية';
        
        setLastBackupInfo({
          date: formattedDate,
          size: backupSize,
          type: backupType
        });
      }
    } catch (error) {
      console.log('خطأ في تحميل معلومات آخر نسخة احتياطية:', error);
    }
  };

  const loadVersionInfo = async () => {
    try {
      // تنسيق تاريخ الإصدار
      const releaseDate = new Date(VERSION_INFO.releaseDate);
      const formattedReleaseDate = releaseDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const currentVersion = VERSION_INFO.getVersion();
      console.log('تحميل معلومات الإصدار:', currentVersion, VERSION_INFO.releaseDate);

      setVersionInfo({
        version: currentVersion,
        releaseDate: formattedReleaseDate
      });
    } catch (error) {
      console.log('خطأ في تحميل معلومات الإصدار:', error);
      // استخدام القيم الافتراضية في حالة الخطأ
      setVersionInfo({
        version: VERSION_INFO.getVersion(),
        releaseDate: VERSION_INFO.releaseDate
      });
    }
  };

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify({
        enabled: newState
      }));
      
      // إظهار رسالة تأكيد
      AlertService.alert(
        'تم التحديث',
        newState ? 'تم تفعيل الإشعارات بنجاح' : 'تم إيقاف الإشعارات بنجاح',
        [{ text: 'حسناً', style: 'default' }]
      );
    } catch (error) {
      console.log('خطأ في حفظ إعدادات الإشعارات');
      AlertService.alert('خطأ', 'حدث خطأ في حفظ الإعدادات');
    }
  };



  const handleCreateBackup = async () => {
    if (isBackupInProgress) {
      AlertService.alert('تنبيه', 'هناك عملية نسخ احتياطية قيد التنفيذ حالياً');
      return;
    }
    if (canUseBackup === false) {
      AlertService.alert(
        formatRTLText('ترقية الاشتراك مطلوبة'),
        formatRTLText('النسخ الاحتياطي متاح للاشتراك السنوي أو النصف سنوي. يرجى ترقية اشتراكك للاستفادة من هذه الميزة.'),
        [
          { text: formatRTLText('إلغاء'), style: 'cancel' as const },
          { text: formatRTLText('عرض خطط الاشتراك'), onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }

    AlertService.alert(
      'عمل نسخة احتياطية',
      'هل تريد إنشاء نسخة احتياطية من جميع بياناتك؟\n\nملاحظة: هذه العملية قد تستغرق بضع دقائق.',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'إنشاء',
          onPress: async () => {
            await performBackup();
          }
        }
      ]
    );
  };

  const performBackup = async () => {
    setIsBackupInProgress(true);
    setShowBackupProgress(true);
    
    try {
      console.log('بدء عملية النسخ الاحتياطية...');
      const backupService = BackupService.getInstance();
      const result = await backupService.createBackup('manual', (progress) => {
        console.log('تقدم النسخ الاحتياطية:', progress);
        setBackupProgress(progress);
      });

      setShowBackupProgress(false);
      setIsBackupInProgress(false);

      if (result.success) {
        console.log('تم إنشاء النسخة الاحتياطية بنجاح:', result.backupId);
        // تحديث معلومات آخر نسخة احتياطية
        await loadLastBackupInfo();
        AlertService.alert(
          'نجح',
          'تم إنشاء النسخة الاحتياطية بنجاح!\n\nيمكنك الوصول إليها من قائمة النسخ الاحتياطية.',
          [{ text: 'حسناً', style: 'default' }]
        );
      } else {
        console.error('فشل في إنشاء النسخة الاحتياطية:', result.error);
        AlertService.alert(
          'خطأ',
          result.error || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية',
          [{ text: 'حسناً', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('خطأ غير متوقع في النسخ الاحتياطية:', error);
      setShowBackupProgress(false);
      setIsBackupInProgress(false);
      AlertService.alert(
        'خطأ',
        `حدث خطأ غير متوقع أثناء إنشاء النسخة الاحتياطية:\n${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        [{ text: 'حسناً', style: 'default' }]
      );
    }
  };

  const handleRestoreBackup = async () => {
    if (isBackupInProgress) {
      AlertService.alert('تنبيه', 'هناك عملية نسخ احتياطية قيد التنفيذ حالياً');
      return;
    }

    try {
      const backupService = BackupService.getInstance();
      const backups = await backupService.getUserBackups();

      if (backups.length === 0) {
        AlertService.alert(
          'لا توجد نسخ احتياطية',
          'لم يتم العثور على أي نسخ احتياطية. يرجى إنشاء نسخة احتياطية أولاً.',
          [{ text: 'حسناً', style: 'default' }]
        );
        return;
      }

      // عرض قائمة النسخ الاحتياطية المتاحة مع تاريخ مفصل
      const backupOptions = backups.map(backup => {
        const backupDate = new Date(backup.createdAt);
        const formattedDate = backupDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const backupSize = backup.totalSize ? `(${(backup.totalSize / 1024).toFixed(1)} KB)` : '';
        const backupType = backup.backupType === 'manual' ? 'يدوية' : 'تلقائية';
        
        return {
          text: `نسخة ${backupType} - ${formattedDate} ${backupSize}`,
          onPress: () => confirmRestoreBackup(backup.id, backup)
        };
      });

      AlertService.alert(
        'اختر النسخة الاحتياطية',
        'اختر النسخة الاحتياطية التي تريد استعادتها:',
        [
          { text: 'إلغاء', style: 'cancel' },
          ...backupOptions
        ]
      );
    } catch (error) {
      AlertService.alert(
        'خطأ',
        'حدث خطأ في تحميل قائمة النسخ الاحتياطية',
        [{ text: 'حسناً', style: 'default' }]
      );
    }
  };

  const confirmRestoreBackup = (backupId: string, backup?: any) => {
    let alertMessage = 'تحذير: استعادة النسخة الاحتياطية ستحل محل جميع البيانات الحالية. هذا الإجراء لا يمكن التراجع عنه.';
    
    if (backup) {
      const backupDate = new Date(backup.createdAt);
      const formattedDate = backupDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const backupSize = backup.totalSize ? `${(backup.totalSize / 1024).toFixed(1)} KB` : 'غير محدد';
      const backupType = backup.backupType === 'manual' ? 'يدوية' : 'تلقائية';
      
      alertMessage = `تفاصيل النسخة الاحتياطية:\n\n` +
        `📅 التاريخ: ${formattedDate}\n` +
        `📦 النوع: ${backupType}\n` +
        `💾 الحجم: ${backupSize}\n\n` +
        `تحذير: استعادة هذه النسخة ستحل محل جميع البيانات الحالية. هذا الإجراء لا يمكن التراجع عنه.\n\n` +
        `هل أنت متأكد من المتابعة؟`;
    }
    
    AlertService.alert(
      'تأكيد الاستعادة',
      alertMessage,
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'استعادة',
          style: 'destructive',
          onPress: () => performRestoreBackup(backupId)
        }
      ]
    );
  };

  const performRestoreBackup = async (backupId: string) => {
    setIsBackupInProgress(true);
    setShowBackupProgress(true);
    
    try {
      const backupService = BackupService.getInstance();
      const result = await backupService.restoreBackup(backupId, (progress) => {
        setBackupProgress(progress);
      });

      setShowBackupProgress(false);
      setIsBackupInProgress(false);

      if (result.success) {
        AlertService.alert(
          'نجح',
          'تم استعادة النسخة الاحتياطية بنجاح!\n\nسيتم إعادة تشغيل التطبيق لتطبيق التغييرات.',
          [
            {
              text: 'حسناً',
              onPress: () => {
                // إعادة تشغيل التطبيق أو إعادة تحميل البيانات
                router.replace('/');
              }
            }
          ]
        );
      } else {
        AlertService.alert(
          'خطأ',
          result.error || 'حدث خطأ أثناء استعادة النسخة الاحتياطية',
          [{ text: 'حسناً', style: 'default' }]
        );
      }
    } catch (error) {
      setShowBackupProgress(false);
      setIsBackupInProgress(false);
      AlertService.alert(
        'خطأ',
        'حدث خطأ غير متوقع أثناء استعادة النسخة الاحتياطية',
        [{ text: 'حسناً', style: 'default' }]
      );
    }
  };

  const handleDeleteAccount = async () => {
    AlertService.alert(
      'حذف الحساب',
      'هل أنت متأكد من حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف الحساب',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userInfo');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('basicData');
              await AsyncStorage.removeItem('userSettings');
              router.replace('/');
            } catch (error) {
              AlertService.alert('خطأ', 'حدث خطأ أثناء حذف الحساب');
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
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
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <Animated.ScrollView 
              style={[styles.scrollContainer, { opacity: fadeAnim }]}
              contentContainerStyle={{ 
                flexGrow: 1, 
                paddingBottom: 50,
                transform: [{ translateY: slideAnim }]
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
              }}
            >
              {/* Header */}
              <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
                </TouchableOpacity>

                <Animated.View style={[styles.iconContainer, { transform: [{ scale: fadeAnim }] }]}>
                  <IconSymbol size={60} name="gear" color="#1c1f33" />
                </Animated.View>
                
                <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
                  {formatRTLText('الإعدادات')}
                </ThemedText>
                
                <ThemedText style={[styles.subtitle, getTextDirection()]}> 
                  {formatRTLText('إدارة إعدادات التطبيق والحساب')}
                </ThemedText>
              </Animated.View>

              {/* Settings Sections */}


              <Animated.View style={[styles.settingsSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>الإشعارات</ThemedText>
                
                <ThemedView style={styles.settingItem}>
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="bell.fill" color="#FF9800" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={[styles.settingTitle, getTextDirection()]}>الإشعارات العامة</ThemedText>
                      <ThemedText style={[styles.settingDescription, getTextDirection()]}>استلام إشعارات حول التحديثات والأنشطة</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <TouchableOpacity 
                    style={[styles.toggleSwitch, notificationsEnabled && styles.toggleActive]}
                    onPress={toggleNotifications}
                    activeOpacity={0.7}
                  >
                    <ThemedView style={[styles.toggleKnob, notificationsEnabled && styles.toggleKnobActive]} />
                  </TouchableOpacity>
                </ThemedView>
              </Animated.View>

              <Animated.View style={[styles.settingsSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>الاشتراك</ThemedText>
                
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => router.push('/subscription')}
                  activeOpacity={0.8}
                >
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="creditcard.fill" color="#2196F3" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={[styles.settingTitle, getTextDirection()]}>إدارة الاشتراكات</ThemedText>
                      <ThemedText style={[styles.settingDescription, getTextDirection()]}>ترقية أو إلغاء الاشتراك</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={20} name="chevron.left" color="#666" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[styles.settingsSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>العام الدراسي</ThemedText>
                <ThemedView style={styles.backupCard}>
                  <ThemedView style={styles.backupHeader}>
                    <IconSymbol size={24} name="calendar" color="#0d9488" />
                    <ThemedText style={[styles.backupTitle, getTextDirection()]}>العام الحالي: {currentAcademicYear ? formatAcademicYearLabel(currentAcademicYear) : '—'}</ThemedText>
                  </ThemedView>
                  <ThemedText style={[styles.backupUpgradeNote, getTextDirection(), { marginTop: 8 }]}>
                    {formatRTLText('بيانات كل عام (متعلمين، تقارير، غياب، جدول، تنبيهات) تُحفظ منفصلة. يمكنك إنهاء العام وبدء عام جديد أو العودة لعام سابق.')}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.backupButton, isEndingYear && styles.disabledButton]}
                    onPress={handleEndYearAndStartNew}
                    activeOpacity={0.8}
                    disabled={isEndingYear}
                  >
                    <ThemedText style={[styles.backupButtonText, getTextDirection()]}>
                      {isEndingYear ? formatRTLText('جاري الحفظ...') : formatRTLText('إنهاء العام وحفظ البيانات وبدء عام جديد')}
                    </ThemedText>
                  </TouchableOpacity>
                  {archivedYearKeys.length > 1 && (
                    <ThemedView style={{ marginTop: 12 }}>
                      <ThemedText style={[styles.lastBackupText, getTextDirection(), { marginBottom: 6 }]}>
                        {formatRTLText('التبديل إلى عام سابق:')}
                      </ThemedText>
                      {archivedYearKeys.filter((k) => k !== currentAcademicYear).map((yearKey) => (
                        <TouchableOpacity
                          key={yearKey}
                          style={[styles.restoreButton, { marginTop: 8 }]}
                          onPress={() => handleSwitchToYear(yearKey)}
                          activeOpacity={0.8}
                        >
                          <ThemedText style={[styles.restoreButtonText, getTextDirection()]}>
                            {formatAcademicYearLabel(yearKey)}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ThemedView>
                  )}
                </ThemedView>
              </Animated.View>

              <Animated.View style={[styles.settingsSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>البيانات</ThemedText>
                
                <ThemedView style={styles.backupCard}>
                  <ThemedView style={styles.backupHeader}>
                    <IconSymbol size={24} name="arrow.clockwise" color="#4CAF50" />
                    <ThemedText style={[styles.backupTitle, getTextDirection()]}>النسخ الاحتياطي</ThemedText>
                  </ThemedView>
                  
                  {lastBackupInfo && (
                    <ThemedView style={styles.lastBackupInfo}>
                      <ThemedText style={[styles.lastBackupText, getTextDirection()]}>آخر نسخة: {lastBackupInfo.date} ({lastBackupInfo.type})</ThemedText>
                      <ThemedText style={[styles.lastBackupSize, getTextDirection()]}>الحجم: {lastBackupInfo.size}</ThemedText>
                    </ThemedView>
                  )}
                  {canUseBackup === false && (
                    <ThemedText style={[styles.backupUpgradeNote, getTextDirection()]}>
                      {formatRTLText('النسخ الاحتياطي متاح مع الاشتراك المدفوع.')}
                    </ThemedText>
                  )}
                  
                  <ThemedView style={styles.backupButtons}>
                    <TouchableOpacity 
                      style={[styles.backupButton, isBackupInProgress && styles.disabledButton]}
                      onPress={handleCreateBackup}
                      activeOpacity={0.8}
                      disabled={isBackupInProgress}
                    >
                      <ThemedText style={[styles.backupButtonText, getTextDirection()]}> 
                        {isBackupInProgress ? formatRTLText('جاري إنشاء النسخة...') : formatRTLText('عمل نسخة احتياطية')}
                      </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.restoreButton, isBackupInProgress && styles.disabledButton]}
                      onPress={handleRestoreBackup}
                      activeOpacity={0.8}
                      disabled={isBackupInProgress}
                    >
                      <ThemedText style={[styles.restoreButtonText, getTextDirection()]}> 
                        {isBackupInProgress ? formatRTLText('جاري الاستعادة...') : formatRTLText('استعادة نسخة احتياطية')}
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              </Animated.View>

              <Animated.View style={[styles.settingsSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>الحساب</ThemedText>
                
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.8}
                >
                  <ThemedView style={styles.settingInfo}>
                    <IconSymbol size={24} name="trash.fill" color="#F44336" />
                    <ThemedView style={styles.settingText}>
                      <ThemedText style={[styles.settingTitle, getTextDirection()]}>حذف الحساب</ThemedText>
                      <ThemedText style={[styles.settingDescription, getTextDirection()]}>حذف الحساب نهائياً (لا يمكن التراجع)</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={20} name="chevron.left" color="#666" />
                </TouchableOpacity>
              </Animated.View>

              {/* معلومات التطبيق */}
              <Animated.View style={[styles.versionSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <ThemedView style={styles.versionCard}>
                  <ThemedView style={styles.versionHeader}>
                    <IconSymbol size={40} name="info.circle.fill" color="#add4ce" />
                    <ThemedText style={[styles.versionTitle, getTextDirection()]}>معلومات التطبيق</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.versionInfo}>
                    <ThemedView style={styles.versionRow}>
                      <ThemedText style={[styles.versionLabel, getTextDirection()]}>رقم الإصدار:</ThemedText>
                      <ThemedText style={[styles.versionValue, getTextDirection()]}>{versionInfo.version}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.versionRow}>
                      <ThemedText style={[styles.versionLabel, getTextDirection()]}>رقم البناء:</ThemedText>
                      <ThemedText style={[styles.versionValue, getTextDirection()]}>{VERSION_INFO.build}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.versionRow}>
                      <ThemedText style={[styles.versionLabel, getTextDirection()]}>التطوير:</ThemedText>
                      <ThemedText style={[styles.versionValue, getTextDirection()]}>أ. أمل بنت علي الشامان</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.versionRow}>
                      <ThemedText style={[styles.versionLabel, getTextDirection()]}>تاريخ الإصدار:</ThemedText>
                      <ThemedText style={[styles.versionValue, getTextDirection()]}>{versionInfo.releaseDate}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </Animated.View>
            </Animated.ScrollView>
          </KeyboardAvoidingView>
        
      </ImageBackground>
      
      {/* Backup Progress Modal */}
      <BackupProgressModal
        visible={showBackupProgress}
        progress={backupProgress}
        onCancel={isBackupInProgress ? undefined : () => setShowBackupProgress(false)}
      />
      
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
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 30,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 15,
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

  settingsSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    marginRight: 12,
    marginBottom: 10,
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  settingItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  settingInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    backgroundColor: 'transparent',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
    backgroundColor: 'transparent',
  },
  versionSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  versionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  versionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  versionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    marginRight: 12,
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  versionInfo: {
    backgroundColor: 'transparent',
  },
  versionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'transparent',
  },
  versionLabel: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'right',
    backgroundColor: 'transparent',
  },
  versionValue: {
    fontSize: 15,
    color: '#1c1f33',
    fontWeight: '500',
    textAlign: 'right',
    backgroundColor: 'transparent',
  },

  backupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  backupHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  backupTitle: {
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    marginRight: 10,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  lastBackupInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  lastBackupText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'right',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  lastBackupSize: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'right',
    backgroundColor: 'transparent',
  },
  backupUpgradeNote: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'right',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  backupButtons: {
    backgroundColor: 'transparent',
  },
  backupButton: {
    backgroundColor: '#1c1f33',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  restoreButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  restoreButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
  },
  toggleSwitch: {
    width: 54,
    height: 30,
    backgroundColor: '#E5E5EA',
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleActive: {
    backgroundColor: '#FF9800',
    alignItems: 'flex-end',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleKnobActive: {
    backgroundColor: '#FFFFFF',
  },

});
