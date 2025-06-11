
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#fff" />
        </TouchableOpacity>
        <IconSymbol size={60} name="bell.fill" color="#fff" />
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
              <IconSymbol size={28} name="bell.badge.fill" color="#007AFF" />
              <ThemedText style={styles.statNumber}>{alerts.length}</ThemedText>
              <ThemedText style={styles.statLabel}>إجمالي التنبيهات</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.statCard, { backgroundColor: '#4CAF5015' }]}>
              <IconSymbol size={28} name="bell.fill" color="#4CAF50" />
              <ThemedText style={styles.statNumber}>{activeAlerts}</ThemedText>
              <ThemedText style={styles.statLabel}>نشطة</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.statCard, { backgroundColor: '#FF980015' }]}>
              <IconSymbol size={28} name="clock.fill" color="#FF9800" />
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
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addButtonsContainer}>
            {[
              { type: 'اختبار', icon: 'doc.text.fill', color: '#FF5722' },
              { type: 'اجتماع', icon: 'person.3.fill', color: '#2196F3' },
              { type: 'مهمة', icon: 'checkmark.circle.fill', color: '#4CAF50' },
              { type: 'تدريب', icon: 'graduationcap.fill', color: '#9C27B0' },
              { type: 'شخصي', icon: 'person.fill', color: '#607D8B' },
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
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
                      <ThemedView style={[styles.alertIcon, { backgroundColor: `${getAlertColor(alert.type)}15` }]}>
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
            onPress={() => Alert.alert('إعدادات الصوت', 'تخصيص أصوات التنبيهات والاهتزاز')}
          >
            <IconSymbol size={24} name="speaker.wave.2.fill" color="#007AFF" />
            <ThemedText style={styles.settingButtonText}>إعدادات الصوت والاهتزاز</ThemedText>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => Alert.alert('عدم الإزعاج', 'تحديد أوقات عدم إرسال التنبيهات')}
          >
            <IconSymbol size={24} name="moon.fill" color="#9C27B0" />
            <ThemedText style={styles.settingButtonText}>أوقات عدم الإزعاج</ThemedText>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => Alert.alert('نسخ احتياطي', 'إنشاء نسخة احتياطية من التنبيهات')}
          >
            <IconSymbol size={24} name="icloud.and.arrow.up.fill" color="#4CAF50" />
            <ThemedText style={styles.settingButtonText}>النسخ الاحتياطي</ThemedText>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#F44336',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 15,
  },
  subtitle: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
    color: '#333',
  },
  addButtonsContainer: {
    flexDirection: 'row',
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
  },
  filterSection: {
    marginBottom: 25,
  },
  filterRow: {
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  typeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 8,
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeFilterButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeFilterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  typeFilterButtonTextActive: {
    color: '#fff',
  },
  alertsSection: {
    marginBottom: 25,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 18,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertDateTime: {
    fontSize: 12,
    color: '#999',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
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
  },
  pastText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  daysUntilText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  toggleButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
});
