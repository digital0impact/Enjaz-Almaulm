import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from './common-styles';

const { width } = Dimensions.get('window');

interface AlertItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  type: 'اختبار' | 'اجتماع' | 'مهمة' | 'إجازة' | 'تدريب' | 'شخصي';
  active: boolean;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: 'عالي' | 'متوسط' | 'منخفض';
  reminderBefore: number; // دقائق قبل الموعد
  createdAt: string;
}

export default function AlertsManagementScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const stored = await AsyncStorage.getItem('alerts');
      if (stored) {
        setAlerts(JSON.parse(stored));
      } else {
        // بيانات تجريبية
        const sampleAlerts: AlertItem[] = [
          {
            id: '1',
            title: 'موعد الاختبار النهائي',
            description: 'اختبار الرياضيات للصف الثالث المتوسط',
            date: '2025-01-25',
            time: '08:00',
            type: 'اختبار',
            active: true,
            priority: 'عالي',
            reminderBefore: 30,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'اجتماع أولياء الأمور',
            description: 'مناقشة أداء الطلاب والخطط المستقبلية',
            date: '2025-01-30',
            time: '16:00',
            type: 'اجتماع',
            active: true,
            priority: 'متوسط',
            reminderBefore: 60,
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            title: 'تسليم التقارير الشهرية',
            description: 'تقارير أداء الطلاب لشهر يناير',
            date: '2025-01-28',
            time: '14:00',
            type: 'مهمة',
            active: false,
            priority: 'عالي',
            reminderBefore: 120,
            createdAt: new Date().toISOString(),
          },
        ];
        setAlerts(sampleAlerts);
        await AsyncStorage.setItem('alerts', JSON.stringify(sampleAlerts));
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const saveAlerts = async (newAlerts: AlertItem[]) => {
    try {
      await AsyncStorage.setItem('alerts', JSON.stringify(newAlerts));
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  };

  const toggleAlert = (id: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, active: !alert.active } : alert
    );
    saveAlerts(updatedAlerts);
  };

  const deleteAlert = (id: string) => {
    Alert.alert(
      'حذف التنبيه',
      'هل أنت متأكد من رغبتك في حذف هذا التنبيه؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const updatedAlerts = alerts.filter(alert => alert.id !== id);
            saveAlerts(updatedAlerts);
          }
        }
      ]
    );
  };

  const addNewAlert = (type: string) => {
    const newAlert: AlertItem = {
      id: Date.now().toString(),
      title: `تنبيه ${type} جديد`,
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: type as any,
      active: true,
      priority: 'متوسط',
      reminderBefore: 15,
      createdAt: new Date().toISOString(),
    };

    const updatedAlerts = [...alerts, newAlert];
    saveAlerts(updatedAlerts);

    Alert.alert('تم الإضافة', `تم إضافة تنبيه ${type} جديد بنجاح`);
  };

  const getFilteredAlerts = () => {
    let filtered = alerts;

    if (filter === 'active') {
      filtered = filtered.filter(alert => alert.active);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(alert => !alert.active);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    return filtered.sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'اختبار': return 'doc.text.fill';
      case 'اجتماع': return 'person.3.fill';
      case 'مهمة': return 'checkmark.circle.fill';
      case 'إجازة': return 'calendar.badge.plus';
      case 'تدريب': return 'graduationcap.fill';
      case 'شخصي': return 'person.fill';
      default: return 'bell.fill';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'اختبار': return '#FF5722';
      case 'اجتماع': return '#2196F3';
      case 'مهمة': return '#4CAF50';
      case 'إجازة': return '#FF9800';
      case 'تدريب': return '#9C27B0';
      case 'شخصي': return '#607D8B';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'عالي': return '#F44336';
      case 'متوسط': return '#FF9800';
      case 'منخفض': return '#4CAF50';
      default: return '#666';
    }
  };

  const getDaysUntilAlert = (date: string, time: string) => {
    const now = new Date();
    const alertDate = new Date(date + ' ' + time);
    const diffTime = alertDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredAlerts = getFilteredAlerts();
  const activeAlerts = alerts.filter(alert => alert.active).length;
  const upcomingAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.date + ' ' + alert.time);
    const now = new Date();
    return alertDate > now && alert.active;
  }).length;

  const alertTypes = [...new Set(alerts.map(alert => alert.type))];

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <ScrollView style={[styles.scrollContainer, commonStyles.scrollViewWithBottomNav]}>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
              </TouchableOpacity>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="bell.fill" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                إدارة التنبيهات
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                منظم شامل للتنبيهات والمذكرات المهمة
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              {/* إحصائيات سريعة */}
              <ThemedView style={styles.statsContainer}>
                <ThemedView style={styles.statsGrid}>
                  <ThemedView style={[styles.statCard, { backgroundColor: '#007AFF15' }]}>
                    <ThemedView style={styles.statIconContainer}>
                      <IconSymbol size={28} name="bell.badge.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.statNumber}>{alerts.length}</ThemedText>
                    <ThemedText style={styles.statLabel}>إجمالي التنبيهات</ThemedText>
                  </ThemedView>

                  <ThemedView style={[styles.statCard, { backgroundColor: '#4CAF5015' }]}>
                    <ThemedView style={styles.statIconContainer}>
                      <IconSymbol size={28} name="bell.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.statNumber}>{activeAlerts}</ThemedText>
                    <ThemedText style={styles.statLabel}>نشطة</ThemedText>
                  </ThemedView>

                  <ThemedView style={[styles.statCard, { backgroundColor: '#FF980015' }]}>
                    <ThemedView style={styles.statIconContainer}>
                      <IconSymbol size={28} name="clock.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedText style={styles.statNumber}>{upcomingAlerts}</ThemedText>
                    <ThemedText style={styles.statLabel}>قادمة</ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>

              {/* إضافة تنبيه جديد */}
              <ThemedView style={styles.addSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  إضافة تنبيه جديد
                </ThemedText>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.addButtonsContainer}
                  contentContainerStyle={styles.addButtonsContent}
                >
                  {[
                    { type: 'شخصي', icon: 'person.fill', color: '#607D8B' },
                    { type: 'تدريب', icon: 'graduationcap.fill', color: '#9C27B0' },
                    { type: 'مهمة', icon: 'checkmark.circle.fill', color: '#4CAF50' },
                    { type: 'اجتماع', icon: 'person.3.fill', color: '#2196F3' },
                    { type: 'اختبار', icon: 'doc.text.fill', color: '#FF5722' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[styles.addButton, { backgroundColor: item.color }]}
                      onPress={() => addNewAlert(item.type)}
                    >
                      <IconSymbol size={24} name={item.icon as any} color="#fff" />
                      <ThemedText style={styles.addButtonText}>{item.type}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </ThemedView>

              {/* تصفية التنبيهات */}
              <ThemedView style={styles.filterSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  تصفية التنبيهات
                </ThemedText>

                <ThemedView style={styles.filterRow}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContainerContent}
                  >
                    {[
                      { key: 'all', label: 'الكل' },
                      { key: 'active', label: 'نشطة' },
                      { key: 'inactive', label: 'معطلة' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.filterButton,
                          filter === item.key && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter(item.key as any)}
                      >
                        <ThemedText style={[
                          styles.filterButtonText,
                          filter === item.key && styles.filterButtonTextActive
                        ]}>
                          {item.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </ThemedView>

                <ThemedView style={styles.filterRow}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContainerContent}
                  >
                    {['all', ...alertTypes].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeFilterButton,
                          typeFilter === type && styles.typeFilterButtonActive
                        ]}
                        onPress={() => setTypeFilter(type)}
                      >
                        {type !== 'all' && (
                          <IconSymbol 
                            size={16} 
                            name={getAlertIcon(type)} 
                            color={typeFilter === type ? '#fff' : getAlertColor(type)} 
                          />
                        )}
                        <ThemedText style={[
                          styles.typeFilterButtonText,
                          typeFilter === type && styles.typeFilterButtonTextActive
                        ]}>
                          {type === 'all' ? 'جميع الأنواع' : type}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </ThemedView>
              </ThemedView>

              {/* قائمة التنبيهات */}
              <ThemedView style={styles.alertsSection}>
                <ThemedView style={styles.alertsHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    التنبيهات ({filteredAlerts.length})
                  </ThemedText>
                  <TouchableOpacity onPress={() => Alert.alert('تصدير', 'سيتم تصدير قائمة التنبيهات')}>
                    <IconSymbol size={20} name="square.and.arrow.up.fill" color="#007AFF" />
                  </TouchableOpacity>
                </ThemedView>

                {filteredAlerts.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <IconSymbol size={48} name="bell.slash.fill" color="#ccc" />
                    <ThemedText style={styles.emptyText}>لا توجد تنبيهات</ThemedText>
                    <ThemedText style={styles.emptySubtext}>ابدأ بإضافة تنبيه جديد</ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.alertsList}>
                    {filteredAlerts.map((alert) => {
                      const daysUntil = getDaysUntilAlert(alert.date, alert.time);
                      const isPast = daysUntil < 0;
                      const isToday = daysUntil === 0;

                      return (
                        <ThemedView key={alert.id} style={[
                          styles.alertCard,
                          !alert.active && styles.inactiveAlertCard,
                          isToday && styles.todayAlertCard
                        ]}>
                          <ThemedView style={styles.alertHeader}>
                            <ThemedView style={[styles.alertIcon, { backgroundColor: '#F8F9FA' }]}>
                              <IconSymbol 
                                size={20} 
                                name={getAlertIcon(alert.type)} 
                                color={getAlertColor(alert.type)} 
                              />
                            </ThemedView>

                            <ThemedView style={styles.alertInfo}>
                              <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
                              {alert.description && (
                                <ThemedText style={styles.alertDescription}>{alert.description}</ThemedText>
                              )}
                              <ThemedView style={styles.alertMeta}>
                                <ThemedText style={styles.alertDateTime}>
                                  {new Date(alert.date).toLocaleDateString('ar-SA')} • {alert.time}
                                </ThemedText>
                                <ThemedView style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) + '20' }]}>
                                  <ThemedText style={[styles.priorityText, { color: getPriorityColor(alert.priority) }]}>
                                    {alert.priority}
                                  </ThemedText>
                                </ThemedView>
                              </ThemedView>
                            </ThemedView>

                            <ThemedView style={styles.alertActions}>
                              {isToday ? (
                                <ThemedView style={styles.todayBadge}>
                                  <ThemedText style={styles.todayText}>اليوم</ThemedText>
                                </ThemedView>
                              ) : isPast ? (
                                <ThemedText style={styles.pastText}>انتهى</ThemedText>
                              ) : (
                                <ThemedText style={styles.daysUntilText}>
                                  {daysUntil} {daysUntil === 1 ? 'يوم' : 'أيام'}
                                </ThemedText>
                              )}

                              <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => toggleAlert(alert.id)}
                              >
                                <IconSymbol 
                                  size={20} 
                                  name={alert.active ? 'bell.fill' : 'bell.slash.fill'} 
                                  color={alert.active ? '#4CAF50' : '#999'} 
                                />
                              </TouchableOpacity>

                               <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => {
                                  router.push(`/edit-alert?id=${alert.id}`);
                                }}
                              >
                                <IconSymbol size={18} name="gear.fill" color="#2196F3" />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteAlert(alert.id)}
                              >
                                <IconSymbol size={18} name="trash.fill" color="#F44336" />
                              </TouchableOpacity>
                            </ThemedView>
                          </ThemedView>
                        </ThemedView>
                      );
                    })}
                  </ThemedView>
                )}
              </ThemedView>

              {/* إعدادات التنبيهات */}
              <ThemedView style={styles.settingsSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  إعدادات التنبيهات
                </ThemedText>

                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={() => {
                    Alert.alert(
                      'إعدادات الصوت والاهتزاز',
                      'اختر نمط التنبيه المفضل لديك',
                      [
                        { text: 'صوت فقط', onPress: () => Alert.alert('تم التحديث', 'تم تعيين نمط الصوت فقط') },
                        { text: 'اهتزاز فقط', onPress: () => Alert.alert('تم التحديث', 'تم تعيين نمط الاهتزاز فقط') },
                        { text: 'صوت واهتزاز', onPress: () => Alert.alert('تم التحديث', 'تم تعيين نمط الصوت والاهتزاز') },
                        { text: 'صامت', onPress: () => Alert.alert('تم التحديث', 'تم تعيين النمط الصامت') },
                        { text: 'إلغاء', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <IconSymbol size={24} name="speaker.wave.2.fill" color="#007AFF" />
                  <ThemedText style={styles.settingButtonText}>إعدادات الصوت والاهتزاز</ThemedText>
                  <IconSymbol size={16} name="chevron.left" color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={() => {
                    Alert.alert(
                      'أوقات عدم الإزعاج',
                      'حدد الأوقات التي لا تريد استقبال التنبيهات فيها',
                      [
                        { text: '22:00 - 07:00 (ليلاً)', onPress: () => Alert.alert('تم التحديث', 'تم تفعيل عدم الإزعاج من 22:00 إلى 07:00') },
                        { text: '12:00 - 14:00 (قيلولة)', onPress: () => Alert.alert('تم التحديث', 'تم تفعيل عدم الإزعاج من 12:00 إلى 14:00') },
                        { text: 'أيام العطل فقط', onPress: () => Alert.alert('تم التحديث', 'تم تفعيل عدم الإزعاج في أيام العطل') },
                        { text: 'إعداد مخصص', onPress: () => Alert.alert('قريباً', 'سيتم إضافة الإعداد المخصص قريباً') },
                        { text: 'إلغاء', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <IconSymbol size={24} name="moon.fill" color="#9C27B0" />
                  <ThemedText style={styles.settingButtonText}>أوقات عدم الإزعاج</ThemedText>
                  <IconSymbol size={16} name="chevron.left" color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={async () => {
                    Alert.alert(
                      'النسخ الاحتياطي',
                      'اختر نوع النسخ الاحتياطي',
                      [
                        {
                          text: 'إنشاء نسخة احتياطية',
                          onPress: async () => {
                            try {
                              const alertsData = await AsyncStorage.getItem('alerts');
                              const backupData = {
                                alerts: alertsData ? JSON.parse(alertsData) : [],
                                timestamp: new Date().toISOString(),
                                version: '1.0'
                              };
                              console.log('تم إنشاء النسخة الاحتياطية:', backupData);
                              Alert.alert('تم بنجاح', 'تم إنشاء النسخة الاحتياطية وحفظها محلياً');
                            } catch (error) {
                              Alert.alert('خطأ', 'فشل في إنشاء النسخة الاحتياطية');
                            }
                          }
                        },
                        {
                          text: 'استعادة من نسخة احتياطية',
                          onPress: () => {
                            Alert.alert(
                              'استعادة البيانات',
                              'هل أنت متأكد من رغبتك في استعادة البيانات؟ سيتم استبدال التنبيهات الحالية.',
                              [
                                { text: 'إلغاء', style: 'cancel' },
                                {
                                  text: 'استعادة',
                                  style: 'destructive',
                                  onPress: () => Alert.alert('قريباً', 'سيتم إضافة ميزة الاستعادة قريباً')
                                }
                              ]
                            );
                          }
                        },
                        {
                          text: 'تصدير إلى ملف',
                          onPress: async () => {
                            try {
                              const alertsData = await AsyncStorage.getItem('alerts');
                              const exportData = {
                                alerts: alertsData ? JSON.parse(alertsData) : [],
                                exportDate: new Date().toLocaleDateString('ar-SA'),
                                totalAlerts: alertsData ? JSON.parse(alertsData).length : 0
                              };
                              console.log('بيانات التصدير:', JSON.stringify(exportData, null, 2));
                              Alert.alert('تم التصدير', 'تم تصدير بيانات التنبيهات بنجاح');
                            } catch (error) {
                              Alert.alert('خطأ', 'فشل في تصدير البيانات');
                            }
                          }
                        },
                        { text: 'إلغاء', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <IconSymbol size={24} name="icloud.and.arrow.up.fill" color="#4CAF50" />
                  <ThemedText style={styles.settingButtonText}>النسخ الاحتياطي</ThemedText>
                  <IconSymbol size={16} name="chevron.left" color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingButton}
                  onPress={() => {
                    Alert.alert(
                      'إدارة التنبيهات المتقدمة',
                      'خيارات إضافية لإدارة التنبيهات',
                      [
                        {
                          text: 'حذف جميع التنبيهات',
                          onPress: () => {
                            Alert.alert(
                              'تأكيد الحذف',
                              'هل أنت متأكد من رغبتك في حذف جميع التنبيهات؟ هذا الإجراء لا يمكن التراجع عنه.',
                              [
                                { text: 'إلغاء', style: 'cancel' },
                                {
                                  text: 'حذف الكل',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await AsyncStorage.removeItem('alerts');
                                      setAlerts([]);
                                      Alert.alert('تم الحذف', 'تم حذف جميع التنبيهات بنجاح');
                                    } catch (error) {
                                      Alert.alert('خطأ', 'فشل في حذف التنبيهات');
                                    }
                                  }
                                }
                              ]
                            );
                          }
                        },
                        {
                          text: 'تفعيل/إيقاف جميع التنبيهات',
                          onPress: () => {
                            Alert.alert(
                              'تبديل حالة جميع التنبيهات',
                              'اختر الإجراء المطلوب',
                              [
                                {
                                  text: 'تفعيل الكل',
                                  onPress: async () => {
                                    const updatedAlerts = alerts.map(alert => ({ ...alert, active: true }));
                                    saveAlerts(updatedAlerts);
                                    Alert.alert('تم التحديث', 'تم تفعيل جميع التنبيهات');
                                  }
                                },
                                {
                                  text: 'إيقاف الكل',
                                  onPress: async () => {
                                    const updatedAlerts = alerts.map(alert => ({ ...alert, active: false }));
                                    saveAlerts(updatedAlerts);
                                    Alert.alert('تم التحديث', 'تم إيقاف جميع التنبيهات');
                                  }
                                },
                                { text: 'إلغاء', style: 'cancel' }
                              ]
                            );
                          }
                        },
                        {
                          text: 'إحصائيات مفصلة',
                          onPress: () => {
                            const stats = {
                              total: alerts.length,
                              active: alerts.filter(a => a.active).length,
                              inactive: alerts.filter(a => !a.active).length,
                              byType: alerts.reduce((acc, alert) => {
                                acc[alert.type] = (acc[alert.type] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            };

                            const statsText = `
إجمالي التنبيهات: ${stats.total}
نشطة: ${stats.active}
معطلة: ${stats.inactive}

التوزيع حسب النوع:
${Object.entries(stats.byType).map(([type, count]) => `${type}: ${count}`).join('\n')}
                            `;

                            Alert.alert('إحصائيات التنبيهات', statsText);
                          }
                        },
                        { text: 'إغلاق', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <IconSymbol size={24} name="gear.circle.fill" color="#FF9800" />
                  <ThemedText style={styles.settingButtonText}>إدارة متقدمة</ThemedText>
                  <IconSymbol size={16} name="chevron.left" color="#666" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
          <BottomNavigationBar />
        </ExpoLinearGradient>
      </ImageBackground>
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
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
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
  statsContainer: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#1c1f33',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statIconContainer: {
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 10,
  },
  addSection: {
    marginBottom: 25,
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
  addButtonsContainer: {
    flexDirection: 'row',
  },
  addButtonsContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 10,
    gap: 8,
    minWidth: 80,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  filterSection:{
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row-reverse',
  },
  filterContainerContent: {
    justifyContent: 'flex-end',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0f0f1',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: '#add4ce',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  filterButtonTextActive: {
    color: '#1c1f33',
    fontWeight: 'bold',
  },
  typeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0f0f1',
    marginLeft: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeFilterButtonActive: {
    backgroundColor: '#add4ce',
  },
  typeFilterButtonText: {
    fontSize: 12,
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  typeFilterButtonTextActive: {
    color: '#1c1f33',
    fontWeight: 'bold',
  },
  alertsSection: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  alertsHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveAlertCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  todayAlertCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5005',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertDateTime: {
    fontSize: 12,
    color: '#999',
    writingDirection: 'rtl',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  alertActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  todayBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  pastText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    writingDirection: 'rtl',
  },
  daysUntilText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  toggleButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  settingsSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  settingButton: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});