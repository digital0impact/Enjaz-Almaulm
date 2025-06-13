import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
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

  const holidays: Holiday[] = [
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
  ];

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#fff" />
        </TouchableOpacity>
        <IconSymbol size={60} name="calendar.badge.clock" color="#fff" />
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
              <IconSymbol size={32} name={getHolidayIcon(nextHoliday.category, nextHoliday.type)} color={getHolidayColor(nextHoliday.category)} />
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
                  color={selectedCategory === filter.key ? '#fff' : '#666'} 
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
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              إجازات العام 2025 ({filteredHolidays.length})
            </ThemedText>
            <TouchableOpacity onPress={exportCalendar}>
              <IconSymbol size={20} name="square.and.arrow.up.fill" color="#007AFF" />
            </TouchableOpacity>
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
                    <ThemedView style={[styles.holidayIcon, { backgroundColor: `${getHolidayColor(holiday.category)}15` }]}>
                      <IconSymbol 
                        size={24} 
                        name={getHolidayIcon(holiday.category, holiday.type)} 
                        color={getHolidayColor(holiday.category)} 
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF9800',
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
  nextHolidayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
    color: '#666',
    textAlign: 'right',
  },
  nextHolidayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginVertical: 2,
  },
  nextHolidayDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  countdownNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#4CAF50',
  },
  nextHolidayDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    lineHeight: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
    color: '#333',
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
    backgroundColor: '#fff',
    marginRight: 10,
    gap: 6,
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
  holidaysSection: {
    marginBottom: 25,
  },
  holidaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  holidaysList: {
    gap: 12,
  },
  holidayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pastHolidayCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5',
  },
  todayHolidayCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5005',
  },
  holidayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  holidayIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    marginBottom: 4,
  },
  holidayDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 4,
  },
  holidayDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    lineHeight: 16,
  },
  holidayMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  countdownSmall: {
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  countdownSmallNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  countdownSmallLabel: {
    fontSize: 10,
    color: '#007AFF',
  },
  todayBadge: {
    backgroundColor: '#4CAF50',
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
    color: '#999',
    fontStyle: 'italic',
  },
  durationBadge: {
    backgroundColor: '#FF980015',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
  },
  pastText: {
    color: '#999',
  },
});