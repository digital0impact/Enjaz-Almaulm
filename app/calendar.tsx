
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, ImageBackground } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dayAbbreviations = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    const calendarDays = [];

    // إضافة الأيام الفارغة في بداية الشهر
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null);
    }

    // إضافة أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return {
      days: calendarDays,
      monthName: monthNames[month],
      year,
      today: isCurrentMonth ? today.getDate() : null
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleDatePress = (day: number) => {
    setSelectedDate(day);
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const gregorianDate = selectedDateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'gregory'
    });
    const hijriDate = selectedDateObj.toLocaleDateString('ar-SA-u-ca-islamic');
    
    Alert.alert(
      `📅 ${day} ${getCalendarData().monthName} ${getCalendarData().year}`,
      `📍 التاريخ الميلادي: ${gregorianDate}\n` +
      `🌙 التاريخ الهجري: ${hijriDate}\n\n` +
      `📋 الأحداث المتاحة لهذا اليوم:\n` +
      `• لا توجد أحداث مسجلة\n\n` +
      `✨ الإجراءات المتاحة:`,
      [
        {
          text: '➕ إضافة حدث',
          onPress: () => Alert.alert('إضافة حدث', `سيتم إضافة حدث جديد ليوم ${day} ${getCalendarData().monthName}`)
        },
        {
          text: '📋 عرض التفاصيل',
          onPress: () => Alert.alert('تفاصيل اليوم', `تفاصيل يوم ${day} ${getCalendarData().monthName} ${getCalendarData().year}`)
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (day === null) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const { today } = getCalendarData();
    const isToday = day === today;
    const isSelected = day === selectedDate;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayContainer,
          isToday && styles.todayContainer,
          isSelected && styles.selectedContainer
        ]}
        onPress={() => handleDatePress(day)}
      >
        <ThemedText
          style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedText
          ]}
        >
          {day}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const calendarData = getCalendarData();

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
          <ScrollView style={styles.scrollContainer}>
            <ThemedView style={styles.header}>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="calendar" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                التقويم الشهري
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                عرض التقويم الشهري مع التواريخ الهجرية والميلادية
              </ThemedText>
            </ThemedView>

            {/* عرض التاريخ الحالي */}
            <ThemedView style={styles.currentDateSection}>
              <ThemedText style={styles.sectionTitle}>
                📅 التاريخ اليوم
              </ThemedText>
              
              <ThemedView style={styles.dateContainer}>
                <ThemedView style={styles.dateCard}>
                  <ThemedView style={styles.dateIconWrapper}>
                    <IconSymbol size={24} name="calendar" color="#4CAF50" />
                  </ThemedView>
                  <ThemedView style={styles.dateInfo}>
                    <ThemedText style={styles.dateLabel}>التاريخ الميلادي</ThemedText>
                    <ThemedText style={styles.dateValue}>
                      {new Date().toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        calendar: 'gregory'
                      })}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.dateCard}>
                  <ThemedView style={styles.dateIconWrapper}>
                    <IconSymbol size={24} name="moon.fill" color="#FF9500" />
                  </ThemedView>
                  <ThemedView style={styles.dateInfo}>
                    <ThemedText style={styles.dateLabel}>التاريخ الهجري</ThemedText>
                    <ThemedText style={styles.dateValue}>
                      {new Date().toLocaleDateString('ar-SA-u-ca-islamic', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.content}>
              {/* Month Navigation */}
              <ThemedView style={styles.monthNavigation}>
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => navigateMonth('next')}
                >
                  <IconSymbol size={20} name="chevron.left" color="#4CAF50" />
                </TouchableOpacity>
                
                <ThemedText style={styles.monthTitle}>
                  {calendarData.monthName} {calendarData.year}
                </ThemedText>
                
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => navigateMonth('prev')}
                >
                  <IconSymbol size={20} name="chevron.right" color="#4CAF50" />
                </TouchableOpacity>
              </ThemedView>

              {/* Days Header */}
              <ThemedView style={styles.daysHeader}>
                {dayAbbreviations.map((day, index) => (
                  <ThemedView key={index} style={styles.dayHeaderContainer}>
                    <ThemedText style={styles.dayHeaderText}>
                      {day}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>

              {/* Calendar Grid */}
              <ThemedView style={styles.calendarGrid}>
                {calendarData.days.map((day, index) => renderCalendarDay(day, index))}
              </ThemedView>
            </ThemedView>
          </ScrollView>
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
    gap: 15,
  },
  currentDateSection: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  dateContainer: {
    gap: 12,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  dateIconWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    writingDirection: 'rtl',
  },
  daysHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeaderContainer: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000000',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
    backgroundColor: 'transparent',
  },
  todayContainer: {
    backgroundColor: '#4CAF50',
  },
  selectedContainer: {
    backgroundColor: '#BDC3C7',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#000000',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
