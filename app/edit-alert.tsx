
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ImageBackground } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  reminderBefore: number;
  createdAt: string;
}

export default function EditAlertScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<AlertItem['type']>('اختبار');
  const [priority, setPriority] = useState<AlertItem['priority']>('متوسط');
  const [reminderBefore, setReminderBefore] = useState(15);
  const [active, setActive] = useState(true);
  const [repeat, setRepeat] = useState<AlertItem['repeat']>('none');

  useEffect(() => {
    loadAlert();
  }, []);

  const loadAlert = async () => {
    try {
      const stored = await AsyncStorage.getItem('alerts');
      if (stored) {
        const alerts: AlertItem[] = JSON.parse(stored);
        const foundAlert = alerts.find(a => a.id === id);
        if (foundAlert) {
          setAlert(foundAlert);
          setTitle(foundAlert.title);
          setDescription(foundAlert.description || '');
          setDate(foundAlert.date);
          setTime(foundAlert.time);
          setType(foundAlert.type);
          setPriority(foundAlert.priority);
          setReminderBefore(foundAlert.reminderBefore);
          setActive(foundAlert.active);
          setRepeat(foundAlert.repeat || 'none');
        } else {
          Alert.alert('خطأ', 'لم يتم العثور على التنبيه');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading alert:', error);
      Alert.alert('خطأ', 'فشل في تحميل التنبيه');
      router.back();
    }
  };

  const saveAlert = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان التنبيه');
      return;
    }

    if (!date) {
      Alert.alert('خطأ', 'يرجى اختيار تاريخ التنبيه');
      return;
    }

    if (!time) {
      Alert.alert('خطأ', 'يرجى اختيار وقت التنبيه');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('alerts');
      if (stored) {
        let alerts: AlertItem[] = JSON.parse(stored);
        const index = alerts.findIndex(a => a.id === id);
        
        if (index !== -1) {
          alerts[index] = {
            ...alerts[index],
            title: title.trim(),
            description: description.trim(),
            date,
            time,
            type,
            priority,
            reminderBefore,
            active,
            repeat,
          };

          await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
          const isNewAlert = alert?.title === `تنبيه ${alert?.type} جديد`;
          Alert.alert(
            isNewAlert ? 'تم الإنشاء' : 'تم الحفظ', 
            isNewAlert ? 'تم إنشاء التنبيه بنجاح' : 'تم تحديث التنبيه بنجاح', 
            [{ text: 'موافق', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('خطأ', 'لم يتم العثور على التنبيه');
        }
      }
    } catch (error) {
      console.error('Error saving alert:', error);
      Alert.alert('خطأ', 'فشل في حفظ التنبيه');
    }
  };

  const deleteAlert = () => {
    Alert.alert(
      'حذف التنبيه',
      'هل أنت متأكد من رغبتك في حذف هذا التنبيه؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('alerts');
              if (stored) {
                let alerts: AlertItem[] = JSON.parse(stored);
                alerts = alerts.filter(a => a.id !== id);
                await AsyncStorage.setItem('alerts', JSON.stringify(alerts));
                Alert.alert('تم الحذف', 'تم حذف التنبيه بنجاح', [
                  { text: 'موافق', onPress: () => router.back() }
                ]);
              }
            } catch (error) {
              console.error('Error deleting alert:', error);
              Alert.alert('خطأ', 'فشل في حذف التنبيه');
            }
          }
        }
      ]
    );
  };

  const alertTypes = [
    { value: 'اختبار', label: 'اختبار', icon: 'doc.text.fill', color: '#FF5722' },
    { value: 'اجتماع', label: 'اجتماع', icon: 'person.3.fill', color: '#2196F3' },
    { value: 'مهمة', label: 'مهمة', icon: 'checkmark.circle.fill', color: '#4CAF50' },
    { value: 'إجازة', label: 'إجازة', icon: 'calendar.badge.plus', color: '#FF9800' },
    { value: 'تدريب', label: 'تدريب', icon: 'graduationcap.fill', color: '#9C27B0' },
    { value: 'شخصي', label: 'شخصي', icon: 'person.fill', color: '#607D8B' },
  ];

  const priorities = [
    { value: 'عالي', label: 'عالي', color: '#F44336' },
    { value: 'متوسط', label: 'متوسط', color: '#FF9800' },
    { value: 'منخفض', label: 'منخفض', color: '#4CAF50' },
  ];

  const repeatOptions = [
    { value: 'none', label: 'لا يتكرر' },
    { value: 'daily', label: 'يومياً' },
    { value: 'weekly', label: 'أسبوعياً' },
    { value: 'monthly', label: 'شهرياً' },
    { value: 'yearly', label: 'سنوياً' },
  ];

  const reminderOptions = [
    { value: 0, label: 'في الوقت المحدد' },
    { value: 5, label: '5 دقائق قبل' },
    { value: 15, label: '15 دقيقة قبل' },
    { value: 30, label: '30 دقيقة قبل' },
    { value: 60, label: 'ساعة قبل' },
    { value: 120, label: 'ساعتان قبل' },
    { value: 1440, label: 'يوم قبل' },
  ];

  if (!alert) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>جاري التحميل...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
          <ScrollView style={styles.scrollContainer}>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={24} name="chevron.right" color="#1c1f33" />
              </TouchableOpacity>
              
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="gear.fill" color="#1c1f33" />
              </ThemedView>
              
              <ThemedText type="title" style={styles.title}>
                {alert?.title === `تنبيه ${alert?.type} جديد` ? 'إضافة تنبيه جديد' : 'تعديل التنبيه'}
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                {alert?.title === `تنبيه ${alert?.type} جديد` ? 'أدخل تفاصيل التنبيه الجديد' : 'قم بتحديث معلومات التنبيه'}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              {/* عنوان التنبيه */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>عنوان التنبيه</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="أدخل عنوان التنبيه"
                  textAlign="right"
                />
              </ThemedView>

              {/* وصف التنبيه */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>الوصف (اختياري)</ThemedText>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="أدخل وصف التنبيه"
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </ThemedView>

              {/* نوع التنبيه */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>نوع التنبيه</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ThemedView style={styles.optionsRow}>
                    {alertTypes.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.optionCard,
                          type === item.value && [styles.optionCardActive, { borderColor: item.color }]
                        ]}
                        onPress={() => setType(item.value as AlertItem['type'])}
                      >
                        <IconSymbol 
                          size={24} 
                          name={item.icon as any} 
                          color={type === item.value ? item.color : '#666'} 
                        />
                        <ThemedText style={[
                          styles.optionText,
                          type === item.value && { color: item.color, fontWeight: 'bold' }
                        ]}>
                          {item.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ScrollView>
              </ThemedView>

              {/* التاريخ والوقت */}
              <ThemedView style={styles.row}>
                <ThemedView style={[styles.section, { flex: 1, marginRight: 10 }]}>
                  <ThemedText style={styles.sectionTitle}>التاريخ</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    textAlign="right"
                  />
                </ThemedView>
                
                <ThemedView style={[styles.section, { flex: 1, marginLeft: 10 }]}>
                  <ThemedText style={styles.sectionTitle}>الوقت</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={time}
                    onChangeText={setTime}
                    placeholder="HH:MM"
                    textAlign="right"
                  />
                </ThemedView>
              </ThemedView>

              {/* الأولوية */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>الأولوية</ThemedText>
                <ThemedView style={styles.optionsRow}>
                  {priorities.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.optionCard,
                        priority === item.value && [styles.optionCardActive, { borderColor: item.color }]
                      ]}
                      onPress={() => setPriority(item.value as AlertItem['priority'])}
                    >
                      <ThemedView style={[
                        styles.priorityDot,
                        { backgroundColor: item.color }
                      ]} />
                      <ThemedText style={[
                        styles.optionText,
                        priority === item.value && { color: item.color, fontWeight: 'bold' }
                      ]}>
                        {item.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ThemedView>

              {/* التكرار */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>التكرار</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ThemedView style={styles.optionsRow}>
                    {repeatOptions.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.optionCard,
                          repeat === item.value && styles.optionCardActive
                        ]}
                        onPress={() => setRepeat(item.value as AlertItem['repeat'])}
                      >
                        <ThemedText style={[
                          styles.optionText,
                          repeat === item.value && { color: '#007AFF', fontWeight: 'bold' }
                        ]}>
                          {item.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ScrollView>
              </ThemedView>

              {/* التذكير المسبق */}
              <ThemedView style={styles.section}>
                <ThemedText style={styles.sectionTitle}>التذكير المسبق</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <ThemedView style={styles.optionsRow}>
                    {reminderOptions.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.optionCard,
                          reminderBefore === item.value && styles.optionCardActive
                        ]}
                        onPress={() => setReminderBefore(item.value)}
                      >
                        <ThemedText style={[
                          styles.optionText,
                          reminderBefore === item.value && { color: '#007AFF', fontWeight: 'bold' }
                        ]}>
                          {item.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ScrollView>
              </ThemedView>

              {/* حالة التنبيه */}
              <ThemedView style={styles.section}>
                <TouchableOpacity
                  style={[styles.toggleCard, active && styles.toggleCardActive]}
                  onPress={() => setActive(!active)}
                >
                  <IconSymbol 
                    size={24} 
                    name={active ? 'bell.fill' : 'bell.slash.fill'} 
                    color={active ? '#4CAF50' : '#999'} 
                  />
                  <ThemedText style={[
                    styles.toggleText,
                    active && styles.toggleTextActive
                  ]}>
                    {active ? 'التنبيه نشط' : 'التنبيه معطل'}
                  </ThemedText>
                  <IconSymbol 
                    size={20} 
                    name={active ? 'checkmark.circle.fill' : 'circle'} 
                    color={active ? '#4CAF50' : '#ccc'} 
                  />
                </TouchableOpacity>
              </ThemedView>

              {/* أزرار الحفظ والحذف */}
              <ThemedView style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={saveAlert}
                >
                  <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                  <ThemedText style={styles.actionButtonText}>
                    {alert?.title === `تنبيه ${alert?.type} جديد` ? 'إضافة التنبيه' : 'حفظ التغييرات'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={deleteAlert}
                >
                  <IconSymbol size={20} name="trash.fill" color="#fff" />
                  <ThemedText style={styles.actionButtonText}>حذف التنبيه</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
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
    top: 40,
    right: 20,
    padding: 10,
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
  section: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textInput: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  optionCardActive: {
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 12,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleCard: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  toggleCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5010',
  },
  toggleText: {
    flex: 1,
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginHorizontal: 15,
  },
  toggleTextActive: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonsContainer: {
    gap: 15,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
});
