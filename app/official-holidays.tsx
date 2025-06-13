
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Modal, TextInput } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

interface Holiday {
  id: string;
  nameAr: string;
  nameEn: string;
  date: string;
  hijriDate?: string;
  duration: number;
  type: 'fixed' | 'variable' | 'religious';
  category: 'national' | 'religious' | 'international';
  description: string;
  isOfficial: boolean;
}

export default function OfficialHolidaysScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'national' | 'religious' | 'international'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    nameAr: '',
    nameEn: '',
    date: '',
    hijriDate: '',
    duration: 1,
    type: 'fixed' as 'fixed' | 'variable',
    category: 'national' as 'national' | 'religious' | 'international',
    description: '',
    isOfficial: true
  });
  const [holidays, setHolidays] = useState<Holiday[]>([
    {
      id: '1',
      nameAr: 'رأس السنة الميلادية',
      nameEn: 'New Year\'s Day',
      date: '2025-01-01',
      duration: 1,
      type: 'fixed',
      category: 'international',
      description: 'بداية العام الميلادي الجديد',
      isOfficial: true,
    },
    {
      id: '2',
      nameAr: 'يوم الرياضة السعودي',
      nameEn: 'Saudi Sports Day',
      date: '2025-02-11',
      duration: 1,
      type: 'fixed',
      category: 'national',
      description: 'يوم مخصص لتعزيز الرياضة في المملكة',
      isOfficial: true,
    },
    {
      id: '3',
      nameAr: 'يوم التأسيس',
      nameEn: 'Founding Day',
      date: '2025-02-22',
      duration: 1,
      type: 'fixed',
      category: 'national',
      description: 'ذكرى تأسيس الدولة السعودية الأولى',
      isOfficial: true,
    },
    {
      id: '4',
      nameAr: 'عيد الفطر المبارك',
      nameEn: 'Eid Al-Fitr',
      date: '2025-03-30',
      hijriDate: '1 شوال 1446',
      duration: 3,
      type: 'variable',
      category: 'religious',
      description: 'عيد انتهاء شهر رمضان المبارك',
      isOfficial: true,
    },
    {
      id: '5',
      nameAr: 'يوم عرفة',
      nameEn: 'Arafat Day',
      date: '2025-06-05',
      hijriDate: '9 ذو الحجة 1446',
      duration: 1,
      type: 'variable',
      category: 'religious',
      description: 'اليوم الذي يقف فيه الحجاج على جبل عرفة',
      isOfficial: true,
    },
    {
      id: '6',
      nameAr: 'عيد الأضحى المبارك',
      nameEn: 'Eid Al-Adha',
      date: '2025-06-06',
      hijriDate: '10 ذو الحجة 1446',
      duration: 4,
      type: 'variable',
      category: 'religious',
      description: 'عيد الحج وذكرى فداء إبراهيم عليه السلام',
      isOfficial: true,
    },
    {
      id: '7',
      nameAr: 'اليوم الوطني السعودي',
      nameEn: 'Saudi National Day',
      date: '2025-09-23',
      duration: 1,
      type: 'fixed',
      category: 'national',
      description: 'ذكرى توحيد المملكة العربية السعودية',
      isOfficial: true,
    },
  ]);

  const addNewHoliday = () => {
    if (!newHoliday.nameAr || !newHoliday.date || !newHoliday.description) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const holiday: Holiday = {
      id: Date.now().toString(),
      ...newHoliday
    };

    setHolidays([...holidays, holiday]);
    setNewHoliday({
      nameAr: '',
      nameEn: '',
      date: '',
      hijriDate: '',
      duration: 1,
      type: 'fixed',
      category: 'national',
      description: '',
      isOfficial: true
    });
    setShowAddModal(false);
    Alert.alert('تم بنجاح', 'تم إضافة الإجازة الجديدة');
  };

  const filteredHolidays = selectedCategory === 'all' 
    ? holidays 
    : holidays.filter(holiday => holiday.category === selectedCategory);

  const getNextHoliday = () => {
    const today = new Date();
    const upcoming = holidays
      .filter(holiday => new Date(holiday.date) > today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] || null;
  };

  const getDaysUntilHoliday = (date: string) => {
    const today = new Date();
    const holidayDate = new Date(date);
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getHolidayIcon = (category: string, type: string) => {
    if (category === 'religious') return 'moon.stars.fill';
    if (category === 'national') return 'flag.fill';
    return 'calendar.badge.plus';
  };

  const getHolidayColor = (category: string) => {
    switch (category) {
      case 'religious': return '#4CAF50';
      case 'national': return '#2196F3';
      case 'international': return '#FF9800';
      default: return '#666';
    }
  };

  const nextHoliday = getNextHoliday();

  const exportCalendar = () => {
    Alert.alert(
      'تصدير التقويم',
      'اختر صيغة التصدير:',
      [
        {
          text: 'ملف PDF',
          onPress: () => Alert.alert('PDF', 'سيتم إنشاء ملف PDF للتقويم السنوي')
        },
        {
          text: 'تقويم الهاتف',
          onPress: () => Alert.alert('التقويم', 'سيتم إضافة جميع الإجازات لتقويم الهاتف')
        },
        {
          text: 'ملف Excel',
          onPress: () => Alert.alert('Excel', 'سيتم إنشاء جدول Excel بجميع التواريخ')
        },
        { text: 'إلغاء', style: 'cancel' }
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
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <ScrollView style={styles.scrollView}>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={24} name="chevron.right" color="#1c1f33" />
              </TouchableOpacity>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={48} name="calendar.badge.clock" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                الإجازات الرسمية
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                تقويم شامل للإجازات والمناسبات الرسمية
              </ThemedText>
            </ThemedView>

        <ThemedView style={styles.content}>
          {/* الإجازة القادمة */}
          {nextHoliday && (
            <ThemedView style={styles.nextHolidayCard}>
              <ThemedView style={styles.nextHolidayHeader}>
                <ThemedView style={styles.toolIconWrapper}>
                  <IconSymbol size={32} name={getHolidayIcon(nextHoliday.category, nextHoliday.type)} color="#1c1f33" />
                </ThemedView>
                <ThemedView style={styles.nextHolidayInfo}>
                  <ThemedText style={styles.nextHolidayLabel}>الإجازة القادمة</ThemedText>
                  <ThemedText style={styles.nextHolidayName}>{nextHoliday.nameAr}</ThemedText>
                  <ThemedText style={styles.nextHolidayDate}>
                    {new Date(nextHoliday.date).toLocaleDateString('ar-SA')}
                    {nextHoliday.hijriDate && ` - ${nextHoliday.hijriDate}`}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.countdownContainer}>
                  <ThemedText style={styles.countdownNumber}>{getDaysUntilHoliday(nextHoliday.date)}</ThemedText>
                  <ThemedText style={styles.countdownLabel}>يوم</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedText style={styles.nextHolidayDescription}>
                {nextHoliday.description}
              </ThemedText>
            </ThemedView>
          )}

          {/* فلترة الفئات */}
          <ThemedView style={styles.filterSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              تصفية الإجازات
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
              {[
                { key: 'all', label: 'الكل', icon: 'list.bullet' },
                { key: 'national', label: 'وطنية', icon: 'flag.fill' },
                { key: 'religious', label: 'دينية', icon: 'moon.stars.fill' },
                { key: 'international', label: 'دولية', icon: 'globe' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedCategory === filter.key && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedCategory(filter.key as any)}
                >
                  <IconSymbol 
                    size={20} 
                    name={filter.icon as any} 
                    color={selectedCategory === filter.key ? '#fff' : '#1c1f33'} 
                  />
                  <ThemedText style={[
                    styles.filterButtonText,
                    selectedCategory === filter.key && styles.filterButtonTextActive
                  ]}>
                    {filter.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>

          {/* قائمة الإجازات */}
          <ThemedView style={styles.holidaysSection}>
            <ThemedView style={styles.holidaysHeader}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <IconSymbol size={18} name="plus" color="#fff" />
                <ThemedText style={styles.addButtonText}>إضافة إجازة</ThemedText>
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                إجازات العام 2025 ({filteredHolidays.length})
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.holidaysList}>
              {filteredHolidays.map((holiday) => {
                const daysUntil = getDaysUntilHoliday(holiday.date);
                const isPast = daysUntil < 0;
                const isToday = daysUntil === 0;

                return (
                  <TouchableOpacity
                    key={holiday.id}
                    style={[
                      styles.holidayCard,
                      isPast && styles.pastHolidayCard,
                      isToday && styles.todayHolidayCard
                    ]}
                    onPress={() => Alert.alert(
                      holiday.nameAr,
                      `${holiday.description}\n\nالتاريخ: ${new Date(holiday.date).toLocaleDateString('ar-SA')}\n${holiday.hijriDate ? `الهجري: ${holiday.hijriDate}\n` : ''}المدة: ${holiday.duration} ${holiday.duration === 1 ? 'يوم' : 'أيام'}\nالنوع: ${holiday.type === 'fixed' ? 'ثابت' : 'متغير'}`
                    )}
                  >
                    <ThemedView style={styles.holidayHeader}>
                      <ThemedView style={styles.toolIconWrapper}>
                        <IconSymbol 
                          size={24} 
                          name={getHolidayIcon(holiday.category, holiday.type)} 
                          color="#1c1f33" 
                        />
                      </ThemedView>

                      <ThemedView style={styles.holidayInfo}>
                        <ThemedText style={[styles.holidayName, isPast && styles.pastText]}>
                          {holiday.nameAr}
                        </ThemedText>
                        <ThemedText style={[styles.holidayDate, isPast && styles.pastText]}>
                          {new Date(holiday.date).toLocaleDateString('ar-SA')}
                          {holiday.hijriDate && ` • ${holiday.hijriDate}`}
                        </ThemedText>
                        <ThemedText style={[styles.holidayDescription, isPast && styles.pastText]}>
                          {holiday.description}
                        </ThemedText>
                      </ThemedView>

                      <ThemedView style={styles.holidayMeta}>
                        {isToday ? (
                          <ThemedView style={styles.todayBadge}>
                            <ThemedText style={styles.todayText}>اليوم</ThemedText>
                          </ThemedView>
                        ) : isPast ? (
                          <ThemedText style={styles.pastLabel}>انتهت</ThemedText>
                        ) : (
                          <ThemedView style={styles.countdownSmall}>
                            <ThemedText style={styles.countdownSmallNumber}>{daysUntil}</ThemedText>
                            <ThemedText style={styles.countdownSmallLabel}>يوم</ThemedText>
                          </ThemedView>
                        )}

                        {holiday.duration > 1 && (
                          <ThemedView style={styles.durationBadge}>
                            <ThemedText style={styles.durationText}>
                              {holiday.duration} أيام
                            </ThemedText>
                          </ThemedView>
                        )}
                      </ThemedView>
                    </ThemedView>
                  </TouchableOpacity>
                );
              })}
            </ThemedView>
          </ThemedView>
        </ThemedView>
          </ScrollView>

          {/* Modal إضافة إجازة جديدة */}
          <Modal
            visible={showAddModal}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <ThemedView style={styles.modalContainer}>
              <ThemedView style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
                </TouchableOpacity>
                <ThemedText type="title" style={styles.modalTitle}>
                  إضافة إجازة جديدة
                </ThemedText>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={addNewHoliday}
                >
                  <ThemedText style={styles.saveButtonText}>حفظ</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ScrollView style={styles.modalContent}>
                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>اسم الإجازة (بالعربية) *</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={newHoliday.nameAr}
                    onChangeText={(text) => setNewHoliday({...newHoliday, nameAr: text})}
                    placeholder="مثل: يوم التأسيس"
                    textAlign="right"
                  />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>اسم الإجازة (بالإنجليزية)</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={newHoliday.nameEn}
                    onChangeText={(text) => setNewHoliday({...newHoliday, nameEn: text})}
                    placeholder="Founding Day"
                    textAlign="left"
                  />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>التاريخ *</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={newHoliday.date}
                    onChangeText={(text) => setNewHoliday({...newHoliday, date: text})}
                    placeholder="YYYY-MM-DD"
                    textAlign="right"
                  />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>التاريخ الهجري</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={newHoliday.hijriDate}
                    onChangeText={(text) => setNewHoliday({...newHoliday, hijriDate: text})}
                    placeholder="مثل: 1 شوال 1446"
                    textAlign="right"
                  />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>عدد الأيام</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={newHoliday.duration.toString()}
                    onChangeText={(text) => setNewHoliday({...newHoliday, duration: parseInt(text) || 1})}
                    placeholder="1"
                    keyboardType="numeric"
                    textAlign="right"
                  />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>الفئة</ThemedText>
                  <ThemedView style={styles.categoryButtons}>
                    {(['national', 'religious', 'international'] as const).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButton,
                          newHoliday.category === cat && styles.categoryButtonActive
                        ]}
                        onPress={() => setNewHoliday({...newHoliday, category: cat})}
                      >
                        <ThemedText style={[
                          styles.categoryButtonText,
                          newHoliday.category === cat && styles.categoryButtonTextActive
                        ]}>
                          {cat === 'national' ? 'وطنية' : cat === 'religious' ? 'دينية' : 'دولية'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>النوع</ThemedText>
                  <ThemedView style={styles.categoryButtons}>
                    {(['fixed', 'variable'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.categoryButton,
                          newHoliday.type === type && styles.categoryButtonActive
                        ]}
                        onPress={() => setNewHoliday({...newHoliday, type: type})}
                      >
                        <ThemedText style={[
                          styles.categoryButtonText,
                          newHoliday.type === type && styles.categoryButtonTextActive
                        ]}>
                          {type === 'fixed' ? 'ثابت' : 'متغير'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>الوصف *</ThemedText>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={newHoliday.description}
                    onChangeText={(text) => setNewHoliday({...newHoliday, description: text})}
                    placeholder="وصف الإجازة..."
                    multiline
                    numberOfLines={3}
                    textAlign="right"
                  />
                </ThemedView>
              </ScrollView>
            </ThemedView>
          </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 50,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    color: '#000000',
    textAlign: 'center',
    marginVertical: 15,
    fontSize: 28,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
  },
  nextHolidayCard: {
    backgroundColor: '#e0f0f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  nextHolidayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextHolidayInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  nextHolidayLabel: {
    fontSize: 12,
    color: '#8e9aaf',
    textAlign: 'right',
  },
  nextHolidayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    marginVertical: 2,
  },
  nextHolidayDate: {
    fontSize: 14,
    color: '#8e9aaf',
    textAlign: 'right',
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#1c1f3315',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  countdownNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#1c1f33',
  },
  nextHolidayDescription: {
    fontSize: 14,
    color: '#8e9aaf',
    textAlign: 'right',
    lineHeight: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
    color: '#1c1f33',
    fontSize: 18,
    fontWeight: '600',
    width: '100%',
    paddingRight: 0,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0f0f1',
    marginRight: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterButtonActive: {
    backgroundColor: '#add4ce',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1c1f33',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  holidaysSection: {
    marginBottom: 25,
  },
  holidaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    width: '100%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  holidaysList: {
    gap: 12,
  },
  holidayCard: {
    backgroundColor: '#e0f0f1',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  pastHolidayCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  todayHolidayCard: {
    borderWidth: 2,
    borderColor: '#add4ce',
    backgroundColor: '#add4ce15',
  },
  holidayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  toolIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    marginBottom: 4,
  },
  holidayDate: {
    fontSize: 14,
    color: '#8e9aaf',
    textAlign: 'right',
    marginBottom: 4,
  },
  holidayDescription: {
    fontSize: 12,
    color: '#8e9aaf',
    textAlign: 'right',
    lineHeight: 16,
  },
  holidayMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  countdownSmall: {
    alignItems: 'center',
    backgroundColor: '#1c1f3315',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  countdownSmallNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
  },
  countdownSmallLabel: {
    fontSize: 10,
    color: '#1c1f33',
  },
  todayBadge: {
    backgroundColor: '#1c1f33',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  todayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pastLabel: {
    fontSize: 12,
    color: '#8e9aaf',
    fontStyle: 'italic',
  },
  durationBadge: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e8e9ea',
  },
  durationText: {
    fontSize: 10,
    color: '#1c1f33',
    fontWeight: '600',
  },
  pastText: {
    color: '#8e9aaf',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#1c1f33',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1c1f33',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#1c1f33',
    borderColor: '#1c1f33',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#1c1f33',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
});
