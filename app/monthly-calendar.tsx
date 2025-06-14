
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';

export default function MonthlyCalendarScreen() {
  const router = useRouter();
  const { colors, globalStyles } = useGlobalTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
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
    let dayCounter = 1;

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
    const dateString = selectedDateObj.toLocaleDateString('ar-SA');
    
    Alert.alert(
      `📅 ${day} ${getCalendarData().monthName} ${getCalendarData().year}`,
      `📍 التاريخ المحدد: ${dateString}\n\n` +
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
        </TouchableOpacity>

        <ThemedView style={styles.iconContainer}>
          <IconSymbol size={60} name="calendar" color="#1c1f33" />
        </ThemedView>
        <ThemedText type="title" style={styles.title}>
          التقويم الشهري
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          تصفح الأيام والشهور وإدارة الأحداث
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {/* Month Navigation */}
        <ThemedView style={[styles.monthNavigation, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <IconSymbol size={20} name="chevron.left" color={colors.primary} />
          </TouchableOpacity>
          
          <ThemedText style={[styles.monthTitle, { color: colors.text }]}>
            {calendarData.monthName} {calendarData.year}
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <IconSymbol size={20} name="chevron.right" color={colors.primary} />
          </TouchableOpacity>
        </ThemedView>

        {/* Days Header */}
        <ThemedView style={[styles.daysHeader, { backgroundColor: colors.card }]}>
          {dayAbbreviations.map((day, index) => (
            <ThemedView key={index} style={styles.dayHeaderContainer}>
              <ThemedText style={[styles.dayHeaderText, { color: colors.text }]}>
                {day}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {/* Calendar Grid */}
        <ThemedView style={[styles.calendarGrid, { backgroundColor: colors.card }]}>
          {calendarData.days.map((day, index) => renderCalendarDay(day, index))}
        </ThemedView>

        {/* Legend */}
        <ThemedView style={[styles.legend, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.legendTitle, { color: colors.text }]}>
            📋 مفتاح الألوان:
          </ThemedText>
          <ThemedView style={styles.legendItems}>
            <ThemedView style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.primary }]} />
              <ThemedText style={[styles.legendText, { color: colors.text }]}>اليوم الحالي</ThemedText>
            </ThemedView>
            <ThemedView style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.accent }]} />
              <ThemedText style={[styles.legendText, { color: colors.text }]}>اليوم المحدد</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={[styles.quickActions, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            ⚡ إجراءات سريعة
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.actionButton, globalStyles.primaryButton]}
            onPress={() => Alert.alert('اليوم', 'الانتقال إلى تاريخ اليوم')}
          >
            <IconSymbol size={20} name="calendar.badge.clock" color="#fff" />
            <ThemedText style={[styles.actionButtonText, globalStyles.primaryButtonText]}>
              الانتقال لليوم
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, globalStyles.secondaryButton]}
            onPress={() => Alert.alert('إضافة حدث', 'إضافة حدث جديد للتقويم')}
          >
            <IconSymbol size={20} name="plus.circle" color={colors.primary} />
            <ThemedText style={[styles.actionButtonText, globalStyles.secondaryButtonText]}>
              إضافة حدث جديد
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, globalStyles.secondaryButton]}
            onPress={() => Alert.alert('عرض الأحداث', 'عرض جميع أحداث الشهر')}
          >
            <IconSymbol size={20} name="list.bullet" color={colors.primary} />
            <ThemedText style={[styles.actionButtonText, globalStyles.secondaryButtonText]}>
              عرض أحداث الشهر
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    flex: 1,
    padding: 16,
    gap: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  },
  daysHeader: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
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
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#333',
    fontWeight: 'bold',
  },
  legend: {
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    textAlign: 'right',
  },
  quickActions: {
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
