import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, I18nManager, ImageBackground, Dimensions, TextInput, Platform, Modal } from 'react-native';
import { AlertService } from '@/services/AlertService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

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

  const days = ['الخميس', 'الأربعاء', 'الثلاثاء', 'الاثنين', 'الأحد'];
  const timeSlots = [
    'الحصة الثامنة',
    'الحصة السابعة',
    'الحصة السادسة',
    'الحصة الخامسة',
    'استراحة',
    'الحصة الرابعة',
    'الحصة الثالثة',
    'الحصة الثانية',
    'الحصة الأولى'
  ];

  // مصفوفات منفصلة للجدول الأسبوعي الشامل
  const tableDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const tableTimeSlots = [
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
    // RTL is handled by the safe wrapper in utils/rtl-utils.ts
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
      AlertService.alert('خطأ', 'يرجى اختيار رقم الحصة');
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
        AlertService.alert('تعارض في الحصة', 'يوجد حصة أخرى في نفس الوقت');
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
    AlertService.alert('تم', editingEntry ? 'تم تحديث الحصة بنجاح' : 'تم إضافة الحصة بنجاح');
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
    AlertService.alert(
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
              setShowAddForm(false);
              setEditingEntry(null);
              resetForm();
              AlertService.alert('تم', 'تم حذف الحصة بنجاح');
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
              <ThemedButton
                icon="chevron.left"
                iconColor="#1c1f33"
                style={styles.backButton}
                onPress={() => router.back()}
              />

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="calendar.badge.clock" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
                {formatRTLText('الجدول الدراسي')}
              </ThemedText>
              <ThemedText style={[styles.subtitle, getTextDirection()]}>
                {formatRTLText('إدارة وتنظيم جدولك الأسبوعي')}
              </ThemedText>
              <ThemedText style={[styles.hintText, getTextDirection()]}>
                {formatRTLText('اضغط على أي خانة في الجدول أدناه لإضافة حصة أو تعديلها')}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
          {/* إحصائيات سريعة */}
          <ThemedCard style={styles.statsCard}>
            <ThemedText style={styles.statsTitle}>إحصائيات الجدول</ThemedText>
            <ThemedView style={styles.statsGrid}>
              <ThemedCard style={[styles.statItem, { backgroundColor: '#4CAF5015' }]}>
                <IconSymbol size={24} name="book.fill" color="#4CAF50" />
                <ThemedText style={styles.statNumber}>{stats.totalClasses}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>حصص دراسية</ThemedText>
              </ThemedCard>

              <ThemedCard style={[styles.statItem, { backgroundColor: '#FF980015' }]}>
                <IconSymbol size={24} name="plus.circle.fill" color="#FF9800" />
                <ThemedText style={styles.statNumber}>{stats.totalAdditional}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>حصص إضافية</ThemedText>
              </ThemedCard>

              <ThemedCard style={[styles.statItem, { backgroundColor: '#9C27B015' }]}>
                <IconSymbol size={24} name="hourglass.fill" color="#9C27B0" />
                <ThemedText style={styles.statNumber}>{stats.totalWaitingClasses}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>حصص انتظار</ThemedText>
              </ThemedCard>

              <ThemedCard style={[styles.statItem, { backgroundColor: '#9E9E9E15' }]}>
                <IconSymbol size={24} name="pause.circle.fill" color="#9E9E9E" />
                <ThemedText style={styles.statNumber}>{stats.freeSlots}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>فراغات</ThemedText>
              </ThemedCard>
            </ThemedView>
          </ThemedCard>

          {/* الجدول الأسبوعي الشامل */}
          <ThemedCard style={styles.weeklyScheduleCard}>
            <ThemedView style={styles.scheduleHeader}>
              <ThemedText style={styles.scheduleTitle}>الجدول الأسبوعي الشامل</ThemedText>
            </ThemedView>

            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
              <ThemedView style={[styles.weeklyTable, { direction: 'rtl' }]}>
                {/* رأس الجدول - الحصص */}
                <ThemedView style={styles.tableHeader}>
                  <ThemedView style={styles.dayColumnHeader}>
                    <ThemedText style={[styles.headerText, getTextDirection()]}>اليوم</ThemedText>
                  </ThemedView>
                  {tableTimeSlots.map(timeSlot => (
                    <ThemedView key={timeSlot} style={styles.timeColumnHeader}>
                      <ThemedText style={[styles.headerText, getTextDirection()]}>{formatRTLText(timeSlot)}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>

                {/* صفوف الأيام */}
                {tableDays.map((day, dayIndex) => (
                  <ThemedView key={day} style={styles.tableRow}>
                    <ThemedView style={styles.dayCell}>
                      <ThemedText style={[styles.dayCellText, getTextDirection()]}>{formatRTLText(day)}</ThemedText>
                    </ThemedView>

                    {tableTimeSlots.map(timeSlot => {
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
                            <ThemedText style={[styles.breakText, getTextDirection()]}>استراحة</ThemedText>
                          ) : entry?.subject ? (
                            <ThemedView style={styles.cellContent}>
                              <ThemedText style={[styles.cellSubject, getTextDirection()]} numberOfLines={2}>
                                {formatRTLText(entry.subject)}
                              </ThemedText>
                              {entry.class && (
                                <ThemedText style={[styles.cellClass, getTextDirection()]} numberOfLines={1}>
                                  {formatRTLText(entry.class)}
                                </ThemedText>
                              )}
                              <ThemedView style={styles.cellTypeBadge}>
                                <ThemedText style={[styles.cellTypeText, getTextDirection()]}>{formatRTLText(entry.type)}</ThemedText>
                              </ThemedView>
                            </ThemedView>
                          ) : (
                            <ThemedView style={styles.emptyCellContent}>
                              <IconSymbol size={16} name="plus.circle" color="#CCC" />
                              <ThemedText style={[styles.emptyCellText, getTextDirection()]}>فراغ</ThemedText>
                            </ThemedView>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ThemedView>
                ))}
              </ThemedView>
            </ScrollView>
          </ThemedCard>

            </ThemedView>
          </ScrollView>

      </ImageBackground>
      <BottomNavigationBar />

      {/* نافذة سريعة لإضافة/تعديل حصة: اليوم والحصة معروفان من الخانة المضغوطة،
          فلا حاجة لعرضهما كحقول قابلة للتغيير — فقط المادة والصف. */}
      <Modal
        animationType="slide"
        transparent
        visible={showAddForm}
        onRequestClose={() => {
          setShowAddForm(false);
          setEditingEntry(null);
          resetForm();
        }}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  resetForm();
                }}
              >
                <IconSymbol size={24} name="xmark.circle.fill" color="#666" />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, getTextDirection()]}>
                {formatRTLText(editingEntry ? 'تعديل الحصة' : 'إضافة حصة')}
              </ThemedText>
            </ThemedView>

            <ThemedText style={[styles.modalContextText, getTextDirection()]}>
              {formatRTLText(`${formData.day} - ${formData.time}`)}
            </ThemedText>

            <ThemedView style={styles.modalSection}>
              <ThemedText style={[styles.modalSectionTitle, getTextDirection()]}>المادة</ThemedText>
              <TextInput
                style={[styles.modalTextInput, getTextDirection()]}
                value={formData.subject}
                onChangeText={(text) => setFormData(prev => ({ ...prev, subject: text }))}
                placeholder={formatRTLText('أدخل اسم المادة...')}
                placeholderTextColor="#999"
                textAlign="right"
                writingDirection="rtl"
              />
            </ThemedView>

            <ThemedView style={styles.modalSection}>
              <ThemedText style={[styles.modalSectionTitle, getTextDirection()]}>الصف</ThemedText>
              <TextInput
                style={[styles.modalTextInput, getTextDirection()]}
                value={formData.class}
                onChangeText={(text) => setFormData(prev => ({ ...prev, class: text }))}
                placeholder={formatRTLText('أدخل اسم الصف...')}
                placeholderTextColor="#999"
                textAlign="right"
                writingDirection="rtl"
              />
            </ThemedView>

            <ThemedView style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalSaveButton]}
                onPress={addOrUpdateEntry}
              >
                <IconSymbol size={18} name="checkmark.circle.fill" color="#fff" />
                <ThemedText style={[styles.modalActionButtonText, getTextDirection()]}>
                  {formatRTLText(editingEntry ? 'حفظ التغييرات' : 'إضافة')}
                </ThemedText>
              </TouchableOpacity>

              {editingEntry && (
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalDeleteButton]}
                  onPress={() => deleteEntry(editingEntry.id)}
                >
                  <IconSymbol size={18} name="trash.fill" color="#fff" />
                  <ThemedText style={[styles.modalActionButtonText, getTextDirection()]}>
                    {formatRTLText('حذف الحصة')}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
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
    paddingBottom: 20,
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
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#1c1f33',
    opacity: 0.7,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
    direction: 'rtl',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0,
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
    textDirection: 'rtl',
    marginBottom: 15,
    alignSelf: 'center',
    width: '100%',
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
    borderWidth: 0,
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
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
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  weeklyScheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0,
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
  // عمود اليوم (120) + 9 أعمدة حصص/استراحة (85 لكل عمود) = 885. كانت القيمة
  // السابقة (1100) أكبر من العرض الفعلي لمحتوى الجدول، ما يترك عمودًا فارغًا
  // معلّقًا بجانب آخر عمود (الحصة الثامنة) تحت اتجاه RTL.
  weeklyTable: {
    minWidth: 120 + 9 * 85,
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
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
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
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
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
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
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
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
    marginBottom: 3,
  },
  cellClass: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
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
    writingDirection: 'ltr',
    textDirection: 'ltr',
  },
  emptyCellContent: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyCellText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
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
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    alignSelf: 'center',
    width: '100%',
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

  ////  نموذج الإضافة
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
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
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },

  // نافذة إضافة/تعديل الحصة السريعة (المادة والصف فقط)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#e0f0f1',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'transparent',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    flex: 1,
    marginRight: 35,
  },
  modalContextText: {
    fontSize: 14,
    color: '#1c1f33',
    opacity: 0.7,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 12,
    marginBottom: 4,
  },
  modalSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalTextInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    fontSize: 14,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalButtonsContainer: {
    gap: 12,
    padding: 20,
    paddingTop: 10,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  modalSaveButton: {
    backgroundColor: '#4CAF50',
  },
  modalDeleteButton: {
    backgroundColor: '#F44336',
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
});
