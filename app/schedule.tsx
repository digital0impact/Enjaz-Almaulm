import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';

const { width } = Dimensions.get('window');

interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  class: string;
  type: 'حصة' | 'مناوبة' | 'انتظار' | 'حصص انتظار' | 'فراغ';
  color: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('الأحد');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

  const [formData, setFormData] = useState({
    day: 'الأحد',
    time: '',
    subject: '',
    class: '',
    type: 'حصة' as 'حصة' | 'مناوبة' | 'انتظار' | 'حصص انتظار' | 'فراغ'
  });

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timeSlots = [
    'الحصة الأولى',
    'الحصة الثانية',
    'الحصة الثالثة',
    'الحصة الرابعة',
    'استراحة',
    'الحصة الخامسة',
    'الحصة السادسة',
    'الحصة السابعة',
    'الحصة الثامنة'
  ];

  const entryTypes = [
    { value: 'حصة', color: '#4CAF50', icon: 'book.fill' },
    { value: 'مناوبة', color: '#2196F3', icon: 'eye.fill' },
    { value: 'انتظار', color: '#FF9800', icon: 'clock.fill' },
    { value: 'حصص انتظار', color: '#9C27B0', icon: 'hourglass.fill' },
    { value: 'فراغ', color: '#9E9E9E', icon: 'pause.circle.fill' }
  ];

  useEffect(() => {
    loadScheduleData();
    setCurrentWeek(getCurrentWeek());
  }, []);

  const loadScheduleData = async () => {
    try {
      const stored = await AsyncStorage.getItem('teacherSchedule');
      if (stored) {
        setSchedule(JSON.parse(stored));
      } else {
        // إنشاء جدول افتراضي
        const defaultSchedule = createDefaultSchedule();
        setSchedule(defaultSchedule);
        await AsyncStorage.setItem('teacherSchedule', JSON.stringify(defaultSchedule));
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const saveScheduleData = async (newSchedule: ScheduleEntry[]) => {
    try {
      await AsyncStorage.setItem('teacherSchedule', JSON.stringify(newSchedule));
      setSchedule(newSchedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const createDefaultSchedule = (): ScheduleEntry[] => {
    const defaultEntries: ScheduleEntry[] = [];
    days.forEach((day, dayIndex) => {
      timeSlots.forEach((time, timeIndex) => {
        if (time === 'استراحة') {
          defaultEntries.push({
            id: `${dayIndex}-${timeIndex}`,
            day,
            time,
            subject: 'استراحة',
            class: '',
            type: 'فراغ',
            color: '#E0E0E0'
          });
        } else {
          defaultEntries.push({
            id: `${dayIndex}-${timeIndex}`,
            day,
            time,
            subject: '',
            class: '',
            type: 'فراغ',
            color: '#F5F5F5'
          });
        }
      });
    });
    return defaultEntries;
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
    return `${startOfWeek.toLocaleDateString('ar-SA')} - ${endOfWeek.toLocaleDateString('ar-SA')}`;
  };

  const addOrUpdateEntry = () => {
    if (!formData.time) {
      Alert.alert('خطأ', 'يرجى اختيار رقم الحصة');
      return;
    }

    const entryType = entryTypes.find(type => type.value === formData.type);
    const newEntry: ScheduleEntry = {
      id: editingEntry ? editingEntry.id : `${Date.now()}`,
      day: formData.day,
      time: formData.time,
      subject: formData.subject,
      class: formData.class,
      type: formData.type,
      color: entryType?.color || '#4CAF50'
    };

    let updatedSchedule;
    if (editingEntry) {
      updatedSchedule = schedule.map(entry => 
        entry.id === editingEntry.id ? newEntry : entry
      );
    } else {
      // التحقق من عدم وجود تعارض في الوقت
      const conflict = schedule.find(entry => 
        entry.day === formData.day && 
        entry.time === formData.time && 
        entry.subject !== ''
      );

      if (conflict) {
        Alert.alert('تعارض في الحصة', 'يوجد حصة أخرى في نفس الوقت');
        return;
      }

      // العثور على الخانة الفارغة وتحديثها
      updatedSchedule = schedule.map(entry => 
        entry.day === formData.day && entry.time === formData.time 
          ? newEntry 
          : entry
      );
    }

    saveScheduleData(updatedSchedule);
    resetForm();
    setShowAddForm(false);
    setEditingEntry(null);
    Alert.alert('تم', editingEntry ? 'تم تحديث الحصة بنجاح' : 'تم إضافة الحصة بنجاح');
  };

  const editEntry = (entry: ScheduleEntry) => {
    setFormData({
      day: entry.day,
      time: entry.time,
      subject: entry.subject,
      class: entry.class,
      type: entry.type
    });
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  const deleteEntry = (entryId: string) => {
    Alert.alert(
      'حذف الحصة',
      'هل أنت متأكد من رغبتك في حذف هذه الحصة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const entry = schedule.find(e => e.id === entryId);
            if (entry) {
              const updatedSchedule = schedule.map(e => 
                e.id === entryId 
                  ? { ...e, subject: '', class: '', type: 'فراغ' as const, color: '#F5F5F5' }
                  : e
              );
              saveScheduleData(updatedSchedule);
              Alert.alert('تم', 'تم حذف الحصة بنجاح');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      day: selectedDay,
      time: '',
      subject: '',
      class: '',
      type: 'حصة'
    });
  };

  const exportSchedule = () => {
    Alert.alert(
      'تصدير الجدول',
      'اختر صيغة التصدير:',
      [
        {
          text: 'PDF',
          onPress: () => Alert.alert('PDF', 'سيتم تصدير الجدول كملف PDF')
        },
        {
          text: 'صورة',
          onPress: () => Alert.alert('صورة', 'سيتم حفظ الجدول كصورة')
        },
        {
          text: 'طباعة',
          onPress: () => Alert.alert('طباعة', 'سيتم فتح معاينة الطباعة')
        },
        { text: 'إلغاء', style: 'cancel' }
      ]
    );
  };

  const getDaySchedule = (day: string) => {
    return schedule.filter(entry => entry.day === day).sort((a, b) => {
      const timeA = timeSlots.indexOf(a.time);
      const timeB = timeSlots.indexOf(b.time);
      return timeA - timeB;
    });
  };

  const getScheduleStats = () => {
    const totalClasses = schedule.filter(entry => entry.type === 'حصة' && entry.subject).length;
    const totalAdditional = schedule.filter(entry => entry.type === 'انتظار').length;
    const totalWaitingClasses = schedule.filter(entry => entry.type === 'حصص انتظار').length;
    const freeSlots = schedule.filter(entry => entry.type === 'فراغ' && entry.subject !== 'استراحة').length;

    return { totalClasses, totalAdditional, totalWaitingClasses, freeSlots };
  };

  const stats = getScheduleStats();

  if (showAddForm) {
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
                  onPress={() => setShowAddForm(false)}
                >
                  <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
                </TouchableOpacity>

                <ThemedView style={styles.iconContainer}>
                  <IconSymbol size={60} name="plus.circle.fill" color="#1c1f33" />
                </ThemedView>
                <ThemedText type="title" style={styles.title}>
                  {editingEntry ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  إدخال تفاصيل الحصة الجديدة
                </ThemedText>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addOrUpdateEntry}
                >
                  <IconSymbol size={24} name="checkmark" color="#1c1f33" />
                  <ThemedText style={styles.addButtonText}>
                    {editingEntry ? 'تحديث الحصة' : 'إضافة الحصة'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={styles.content}>
          <ThemedView style={styles.formCard}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>الأيام</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daysScrollContainer}
                style={styles.daysScrollView}
              >
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayButton, formData.day === day && styles.dayButtonSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, day }))}
                  >
                    <ThemedText style={[styles.dayButtonText, formData.day === day && styles.dayButtonTextSelected]}>
                      {day}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>الحصة</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeScrollContainer}
                style={styles.timeScrollView}
              >
                {timeSlots.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeSlot, formData.time === time && styles.timeSlotSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, time }))}
                  >
                    <ThemedText style={[styles.timeText, formData.time === time && styles.timeTextSelected]}>
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ThemedView>

            {(
              <>
                <ThemedView style={styles.formGroup}>
                  <ThemedText style={styles.label}>المادة</ThemedText>
                  <ThemedView style={styles.inputContainer}>
                    <IconSymbol size={20} name="book.fill" color="#666" />
                    <TextInput
                      style={styles.textInput}
                      value={formData.subject}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, subject: text }))}
                      placeholder="أدخل اسم المادة..."
                      placeholderTextColor="#999"
                      textAlign="right"
                    />
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.formGroup}>
                  <ThemedText style={styles.label}>الصف</ThemedText>
                  <ThemedView style={styles.inputContainer}>
                    <IconSymbol size={20} name="person.2.fill" color="#666" />
                    <TextInput
                      style={styles.textInput}
                      value={formData.class}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, class: text }))}
                      placeholder="أدخل اسم الصف..."
                      placeholderTextColor="#999"
                      textAlign="right"
                    />
                  </ThemedView>
                </ThemedView>


              </>
            )}

            <ThemedView style={styles.formActions}>
              <TouchableOpacity style={styles.saveButton} onPress={addOrUpdateEntry}>
                <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
                <ThemedText style={styles.saveButtonText}>
                  {editingEntry ? 'تحديث' : 'إضافة'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  resetForm();
                }}
              >
                <IconSymbol size={20} name="xmark.circle.fill" color="#1c1f33" />
                <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
            </ThemedView>
          </ScrollView>
        
        </ImageBackground>
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
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="calendar.badge.clock" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                الجدول الدراسي
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                إدارة وتنظيم جدولك الأسبوعي
              </ThemedText>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <IconSymbol size={24} name="plus" color="#1c1f33" />
                <ThemedText style={styles.addButtonText}>إضافة حصة جديدة</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.content}>
          {/* إحصائيات سريعة */}
          <ThemedView style={styles.statsCard}>
            <ThemedText style={styles.statsTitle}>إحصائيات الجدول</ThemedText>
            <ThemedView style={styles.statsGrid}>
              <ThemedView style={[styles.statItem, { backgroundColor: '#4CAF5015' }]}>
                <IconSymbol size={24} name="book.fill" color="#4CAF50" />
                <ThemedText style={styles.statNumber}>{stats.totalClasses}</ThemedText>
                <ThemedText style={styles.statLabel}>حصص دراسية</ThemedText>
              </ThemedView>

              <ThemedView style={[styles.statItem, { backgroundColor: '#FF980015' }]}>
                <IconSymbol size={24} name="plus.circle.fill" color="#FF9800" />
                <ThemedText style={styles.statNumber}>{stats.totalAdditional}</ThemedText>
                <ThemedText style={styles.statLabel}>حصص إضافية</ThemedText>
              </ThemedView>

              <ThemedView style={[styles.statItem, { backgroundColor: '#9C27B015' }]}>
                <IconSymbol size={24} name="hourglass.fill" color="#9C27B0" />
                <ThemedText style={styles.statNumber}>{stats.totalWaitingClasses}</ThemedText>
                <ThemedText style={styles.statLabel}>حصص انتظار</ThemedText>
              </ThemedView>

              <ThemedView style={[styles.statItem, { backgroundColor: '#9E9E9E15' }]}>
                <IconSymbol size={24} name="pause.circle.fill" color="#9E9E9E" />
                <ThemedText style={styles.statNumber}>{stats.freeSlots}</ThemedText>
                <ThemedText style={styles.statLabel}>فراغات</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* الجدول الأسبوعي الشامل */}
          <ThemedView style={styles.weeklyScheduleCard}>
            <ThemedView style={styles.scheduleHeader}>
              <ThemedText style={styles.scheduleTitle}>الجدول الأسبوعي الشامل</ThemedText>
            </ThemedView>

            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
              <ThemedView style={[styles.weeklyTable, { direction: 'rtl' }]}>
                {/* رأس الجدول - الحصص */}
                <ThemedView style={styles.tableHeader}>
                  <ThemedView style={styles.dayColumnHeader}>
                    <ThemedText style={styles.headerText}>اليوم</ThemedText>
                  </ThemedView>
                  {timeSlots.map(timeSlot => (
                    <ThemedView key={timeSlot} style={styles.timeColumnHeader}>
                      <ThemedText style={styles.headerText}>{timeSlot}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>

                {/* صفوف الأيام */}
                {days.map((day, dayIndex) => (
                  <ThemedView key={day} style={styles.tableRow}>
                    <ThemedView style={styles.dayCell}>
                      <ThemedText style={styles.dayCellText}>{day}</ThemedText>
                    </ThemedView>

                    {timeSlots.map(timeSlot => {
                      const entry = schedule.find(e => e.day === day && e.time === timeSlot);
                      const isBreakTime = timeSlot === 'استراحة';

                      return (
                        <TouchableOpacity
                          key={`${day}-${timeSlot}`}
                          style={[
                            styles.scheduleCell,
                            { backgroundColor: entry?.color || (isBreakTime ? '#E0E0E0' : '#F8F9FA') },
                            isBreakTime && styles.breakCell
                          ]}
                          onPress={() => {
                            if (entry && entry.subject && !isBreakTime) {
                              editEntry(entry);
                            } else if (!isBreakTime) {
                              setFormData({
                                day: day,
                                time: timeSlot,
                                subject: '',
                                class: '',
                                type: 'حصة'
                              });
                              setShowAddForm(true);
                            }
                          }}
                          onLongPress={() => {
                            if (entry && entry.subject && !isBreakTime) {
                              deleteEntry(entry.id);
                            }
                          }}
                        >
                          {isBreakTime ? (
                            <ThemedText style={styles.breakText}>استراحة</ThemedText>
                          ) : entry?.subject ? (
                            <ThemedView style={styles.cellContent}>
                              <ThemedText style={styles.cellSubject} numberOfLines={2}>
                                {entry.subject}
                              </ThemedText>
                              {entry.class && (
                                <ThemedText style={styles.cellClass} numberOfLines={1}>
                                  {entry.class}
                                </ThemedText>
                              )}
                              <ThemedView style={styles.cellTypeBadge}>
                                <ThemedText style={styles.cellTypeText}>{entry.type}</ThemedText>
                              </ThemedView>
                            </ThemedView>
                          ) : (
                            <ThemedView style={styles.emptyCellContent}>
                              <IconSymbol size={16} name="plus.circle" color="#CCC" />
                              <ThemedText style={styles.emptyCellText}>فراغ</ThemedText>
                            </ThemedView>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ThemedView>
                ))}
              </ThemedView>
            </ScrollView>
          </ThemedView>

          {/* أزرار الإجراءات */}
          <ThemedView style={styles.actionButtons}>
            <TouchableOpacity style={styles.exportButton} onPress={exportSchedule}>
              <IconSymbol size={20} name="square.and.arrow.up" color="#1c1f33" />
              <ThemedText style={styles.buttonText}>تصدير الجدول</ThemedText>
            </TouchableOpacity>
          </ThemedView>
            </ThemedView>
          </ScrollView>
        
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
    paddingBottom: 30,
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1c1f33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#1c1f33',
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
    marginTop: 5,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.4)',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statItem: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  weeklyScheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  horizontalScroll: {
    marginTop: 10,
  },
  weeklyTable: {
    minWidth: 1100,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E8B57',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  timeColumnHeader: {
    width: 85,
    padding: 8,
    backgroundColor: '#1F5F3F',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#fff',
  },
  dayColumnHeader: {
    width: 120,
    padding: 12,
    backgroundColor: '#1F5F3F',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayCell: {
    width: 120,
    padding: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  dayCellText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scheduleCell: {
    width: 85,
    minHeight: 80,
    padding: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakCell: {
    backgroundColor: '#E0E0E0',
  },
  breakText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  cellContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cellSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 3,
  },
  cellClass: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    opacity: 1,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  cellTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cellTypeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
  },
  emptyCellContent: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyCellText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  scheduleList: {
    gap: 10,
  },
  scheduleEntry: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 100,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  entryDetails: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  entrySubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  entryInfoText: {
    fontSize: 14,
    color: '#2E8B57',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  emptySlot: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editIcon: {
    padding: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  exportButton: {
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
  buttonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  ////  نموذج الإضافة
  formCard: {
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  radioButtonSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextSelected: {
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  daysScrollView: {
    maxHeight: 60,
  },
  daysScrollContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  dayButtonSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeScrollView: {
    maxHeight: 60,
  },
  timeScrollContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  timeSlot: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  timeSlotSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  timeTextSelected: {
    color: '#fff',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
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
  saveButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
