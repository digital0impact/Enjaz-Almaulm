
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  class: string;
  type: 'حصة' | 'مناوبة' | 'انتظار' | 'فراغ';
  color: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
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
    type: 'حصة' as 'حصة' | 'مناوبة' | 'انتظار' | 'فراغ'
  });

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timeSlots = [
    '7:00 - 7:45',
    '7:45 - 8:30',
    '8:30 - 9:15',
    '9:15 - 10:00',
    '10:00 - 10:15', // استراحة
    '10:15 - 11:00',
    '11:00 - 11:45',
    '11:45 - 12:30',
    '12:30 - 1:15'
  ];

  const entryTypes = [
    { value: 'حصة', color: '#4CAF50', icon: 'book.fill' },
    { value: 'مناوبة', color: '#2196F3', icon: 'eye.fill' },
    { value: 'انتظار', color: '#FF9800', icon: 'clock.fill' },
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
        if (time === '10:00 - 10:15') {
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
      Alert.alert('خطأ', 'يرجى اختيار وقت الحصة');
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
        Alert.alert('تعارض في الوقت', 'يوجد حصة أخرى في نفس الوقت');
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
    const totalSupervision = schedule.filter(entry => entry.type === 'مناوبة').length;
    const totalWaiting = schedule.filter(entry => entry.type === 'انتظار').length;
    const freeSlots = schedule.filter(entry => entry.type === 'فراغ' && entry.subject !== 'استراحة').length;

    return { totalClasses, totalSupervision, totalWaiting, freeSlots };
  };

  const stats = getScheduleStats();

  if (showAddForm) {
    return (
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowAddForm(false)}
          >
            <IconSymbol size={24} name="chevron.right" color="#fff" />
          </TouchableOpacity>
          <IconSymbol size={50} name="plus.circle.fill" color="#fff" />
          <ThemedText type="title" style={styles.headerTitle}>
            {editingEntry ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedView style={styles.formCard}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>اليوم</ThemedText>
              <ThemedView style={styles.radioGroup}>
                {days.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.radioButton, formData.day === day && styles.radioButtonSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, day }))}
                  >
                    <ThemedText style={[styles.radioText, formData.day === day && styles.radioTextSelected]}>
                      {day}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>الوقت</ThemedText>
              <ThemedView style={styles.timeGrid}>
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
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>نوع النشاط</ThemedText>
              <ThemedView style={styles.typeGrid}>
                {entryTypes.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      { borderColor: type.color },
                      formData.type === type.value && { backgroundColor: type.color + '20' }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  >
                    <IconSymbol size={20} name={type.icon} color={type.color} />
                    <ThemedText style={[styles.typeText, { color: type.color }]}>
                      {type.value}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            {formData.type === 'حصة' && (
              <>
                <ThemedView style={styles.formGroup}>
                  <ThemedText style={styles.label}>المادة</ThemedText>
                  <ThemedView style={styles.inputContainer}>
                    <IconSymbol size={20} name="book.fill" color="#666" />
                    <ThemedText 
                      style={styles.textInput}
                      onPress={() => {
                        Alert.prompt(
                          'اسم المادة',
                          'أدخل اسم المادة:',
                          [
                            { text: 'إلغاء', style: 'cancel' },
                            { 
                              text: 'تأكيد', 
                              onPress: (text) => text && setFormData(prev => ({ ...prev, subject: text }))
                            }
                          ],
                          'plain-text',
                          formData.subject
                        );
                      }}
                    >
                      {formData.subject || 'اضغط لإدخال المادة'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.formGroup}>
                  <ThemedText style={styles.label}>الصف</ThemedText>
                  <ThemedView style={styles.inputContainer}>
                    <IconSymbol size={20} name="person.2.fill" color="#666" />
                    <ThemedText 
                      style={styles.textInput}
                      onPress={() => {
                        Alert.prompt(
                          'الصف',
                          'أدخل اسم الصف:',
                          [
                            { text: 'إلغاء', style: 'cancel' },
                            { 
                              text: 'تأكيد', 
                              onPress: (text) => text && setFormData(prev => ({ ...prev, class: text }))
                            }
                          ],
                          'plain-text',
                          formData.class
                        );
                      }}
                    >
                      {formData.class || 'اضغط لإدخال الصف'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                
              </>
            )}

            <ThemedView style={styles.formActions}>
              <TouchableOpacity style={styles.saveButton} onPress={addOrUpdateEntry}>
                <IconSymbol size={20} name="checkmark.circle.fill" color="white" />
                <ThemedText style={styles.buttonText}>
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
                <IconSymbol size={20} name="xmark.circle.fill" color="white" />
                <ThemedText style={styles.buttonText}>إلغاء</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#fff" />
        </TouchableOpacity>
        <IconSymbol size={60} name="calendar.badge.clock" color="#fff" />
        <ThemedText type="title" style={styles.headerTitle}>
          الجدول الدراسي
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          إدارة وتنظيم جدولك الأسبوعي
        </ThemedText>
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
            
            <ThemedView style={[styles.statItem, { backgroundColor: '#2196F315' }]}>
              <IconSymbol size={24} name="eye.fill" color="#2196F3" />
              <ThemedText style={styles.statNumber}>{stats.totalSupervision}</ThemedText>
              <ThemedText style={styles.statLabel}>مناوبات</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.statItem, { backgroundColor: '#FF980015' }]}>
              <IconSymbol size={24} name="clock.fill" color="#FF9800" />
              <ThemedText style={styles.statNumber}>{stats.totalWaiting}</ThemedText>
              <ThemedText style={styles.statLabel}>انتظار</ThemedText>
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
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <IconSymbol size={20} name="plus.circle.fill" color="#4CAF50" />
              <ThemedText style={styles.addButtonText}>إضافة حصة</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <ThemedView style={styles.weeklyTable}>
              {/* رأس الجدول - الأيام */}
              <ThemedView style={styles.tableHeader}>
                <ThemedView style={styles.timeColumnHeader}>
                  <ThemedText style={styles.headerText}>الوقت</ThemedText>
                </ThemedView>
                {days.map(day => (
                  <ThemedView key={day} style={styles.dayColumnHeader}>
                    <ThemedText style={styles.headerText}>{day}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>

              {/* صفوف الأوقات */}
              {timeSlots.map((timeSlot, timeIndex) => (
                <ThemedView key={timeSlot} style={styles.tableRow}>
                  <ThemedView style={styles.timeCell}>
                    <ThemedText style={styles.timeCellText}>{timeSlot}</ThemedText>
                  </ThemedView>
                  
                  {days.map(day => {
                    const entry = schedule.find(e => e.day === day && e.time === timeSlot);
                    const isBreakTime = timeSlot === '10:00 - 10:15';
                    
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
            <IconSymbol size={20} name="square.and.arrow.up" color="white" />
            <ThemedText style={styles.buttonText}>تصدير الجدول</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => {
              Alert.alert(
                'عرض الجدول الكامل',
                'عرض جدول الأسبوع كاملاً؟',
                [
                  { text: 'إلغاء', style: 'cancel' },
                  { text: 'عرض', onPress: () => setSelectedDay('') }
                ]
              );
            }}
          >
            <IconSymbol size={20} name="calendar" color="white" />
            <ThemedText style={styles.buttonText}>عرض شامل</ThemedText>
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
    backgroundColor: '#2E8B57',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
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
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E8B57',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  timeColumnHeader: {
    width: 120,
    padding: 12,
    backgroundColor: '#1F5F3F',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
  },
  dayColumnHeader: {
    width: 140,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#fff',
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
  timeCell: {
    width: 120,
    padding: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  timeCellText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  scheduleCell: {
    width: 140,
    minHeight: 60,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  cellClass: {
    fontSize: 9,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 2,
  },
  cellTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
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
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E8',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    fontSize: 10,
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
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptySlot: {
    fontSize: 14,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  viewAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C757D',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // نموذج الإضافة
  formCard: {
    backgroundColor: '#fff',
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    minWidth: 100,
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
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
});
