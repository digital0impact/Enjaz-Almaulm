
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Platform, ImageBackground } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from '@/styles/common-styles';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors, globalStyles } = useGlobalTheme();
  const [selectedCalendar, setSelectedCalendar] = useState<'gregorian' | 'hijri'>('gregorian');
  const [currentDate, setCurrentDate] = useState(new Date());

  const gregorianMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const hijriMonths = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  const getCurrentGregorianDate = () => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: gregorianMonths[today.getMonth()],
      year: today.getFullYear(),
      weekDay: today.toLocaleDateString('ar-SA', { weekday: 'long' })
    };
  };

  const getCurrentHijriDate = () => {
    const today = new Date();
    const hijriDate = today.toLocaleDateString('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    const parts = hijriDate.split(' ');
    return {
      day: parts[0],
      month: parts[1],
      year: parts[2],
      weekDay: parts[3] || 'الأحد'
    };
  };

  const gregorianDate = getCurrentGregorianDate();
  const hijriDate = getCurrentHijriDate();

  const navigateToCalendar = (type: string) => {
    if (type === 'monthly') {
      router.push('/monthly-calendar');
    } else {
      Alert.alert('قريباً', `سيتم إضافة ${type} قريباً`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground 
        source={require('@/assets/images/background.png')} 
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.1 }}
      >
        <ExpoLinearGradient
          colors={['rgba(173, 216, 230, 0.3)', 'rgba(240, 248, 255, 0.5)', 'rgba(255, 255, 255, 0.8)']}
          style={styles.gradientOverlay}
        >
          <ScrollView style={[styles.scrollView, commonStyles.scrollViewWithBottomNav]}>
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
                التقويم الهجري والميلادي
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                تصفح التاريخ الهجري والميلادي
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              {/* Calendar Type Selector */}
              <ThemedView style={[styles.selectorContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    selectedCalendar === 'gregorian' && styles.selectorButtonActive
                  ]}
                  onPress={() => setSelectedCalendar('gregorian')}
                >
                  <IconSymbol 
                    size={20} 
                    name="calendar" 
                    color={selectedCalendar === 'gregorian' ? '#fff' : colors.primary} 
                  />
                  <ThemedText style={[
                    styles.selectorText,
                    selectedCalendar === 'gregorian' && styles.selectorTextActive
                  ]}>
                    التقويم الميلادي
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    selectedCalendar === 'hijri' && styles.selectorButtonActive
                  ]}
                  onPress={() => setSelectedCalendar('hijri')}
                >
                  <IconSymbol 
                    size={20} 
                    name="moon.fill" 
                    color={selectedCalendar === 'hijri' ? '#fff' : colors.primary} 
                  />
                  <ThemedText style={[
                    styles.selectorText,
                    selectedCalendar === 'hijri' && styles.selectorTextActive
                  ]}>
                    التقويم الهجري
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* Current Date Display */}
              {selectedCalendar === 'gregorian' ? (
                <ThemedView style={[styles.dateCard, { backgroundColor: colors.card }]}>
                  <ThemedView style={styles.dateHeader}>
                    <IconSymbol size={30} name="calendar" color={colors.primary} />
                    <ThemedText style={[styles.dateTitle, { color: colors.text }]}>
                      التاريخ الميلادي اليوم
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.dateContent}>
                    <ThemedView style={styles.dateRow}>
                      <ThemedText style={[styles.dateLabel, { color: colors.text }]}>
                        اليوم:
                      </ThemedText>
                      <ThemedText style={[styles.dateValue, { color: colors.primary }]}>
                        {gregorianDate.weekDay}
                      </ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.dateRow}>
                      <ThemedText style={[styles.dateLabel, { color: colors.text }]}>
                        التاريخ:
                      </ThemedText>
                      <ThemedText style={[styles.dateValue, { color: colors.primary }]}>
                        {gregorianDate.day} {gregorianDate.month} {gregorianDate.year}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ) : (
                <ThemedView style={[styles.dateCard, { backgroundColor: colors.card }]}>
                  <ThemedView style={styles.dateHeader}>
                    <IconSymbol size={30} name="moon.fill" color={colors.primary} />
                    <ThemedText style={[styles.dateTitle, { color: colors.text }]}>
                      التاريخ الهجري اليوم
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.dateContent}>
                    <ThemedView style={styles.dateRow}>
                      <ThemedText style={[styles.dateLabel, { color: colors.text }]}>
                        اليوم:
                      </ThemedText>
                      <ThemedText style={[styles.dateValue, { color: colors.primary }]}>
                        {hijriDate.weekDay}
                      </ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.dateRow}>
                      <ThemedText style={[styles.dateLabel, { color: colors.text }]}>
                        التاريخ:
                      </ThemedText>
                      <ThemedText style={[styles.dateValue, { color: colors.primary }]}>
                        {hijriDate.day} {hijriDate.month} {hijriDate.year}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              )}

              {/* Calendar Features */}
              <ThemedView style={[styles.featuresContainer, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  🗓️ أدوات التقويم
                </ThemedText>
                
                <TouchableOpacity
                  style={[styles.featureButton, globalStyles.primaryButton]}
                  onPress={() => navigateToCalendar('monthly')}
                >
                  <IconSymbol size={20} name="calendar.circle" color="#fff" />
                  <ThemedText style={[styles.featureButtonText, globalStyles.primaryButtonText]}>
                    التقويم الشهري
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.featureButton, globalStyles.secondaryButton]}
                  onPress={() => navigateToCalendar('yearly')}
                >
                  <IconSymbol size={20} name="calendar.badge.clock" color={colors.primary} />
                  <ThemedText style={[styles.featureButtonText, globalStyles.secondaryButtonText]}>
                    التقويم السنوي
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.featureButton, globalStyles.secondaryButton]}
                  onPress={() => Alert.alert('تحويل التاريخ', 'تحويل بين التاريخ الهجري والميلادي')}
                >
                  <IconSymbol size={20} name="arrow.triangle.2.circlepath" color={colors.primary} />
                  <ThemedText style={[styles.featureButtonText, globalStyles.secondaryButtonText]}>
                    تحويل التاريخ
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.featureButton, globalStyles.secondaryButton]}
                  onPress={() => router.push('/official-holidays')}
                >
                  <IconSymbol size={20} name="star.circle" color={colors.primary} />
                  <ThemedText style={[styles.featureButtonText, globalStyles.secondaryButtonText]}>
                    المناسبات والإجازات
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* Information Section */}
              <ThemedView style={[styles.infoContainer, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  📚 معلومات مفيدة
                </ThemedText>
                
                <ThemedView style={styles.infoCard}>
                  <IconSymbol size={24} name="info.circle" color={colors.primary} />
                  <ThemedView style={styles.infoContent}>
                    <ThemedText style={[styles.infoTitle, { color: colors.text }]}>
                      التقويم الميلادي
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: colors.text }]}>
                      التقويم المعتمد عالمياً والذي يعتمد على دورة الأرض حول الشمس
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.infoCard}>
                  <IconSymbol size={24} name="moon.circle" color={colors.primary} />
                  <ThemedView style={styles.infoContent}>
                    <ThemedText style={[styles.infoTitle, { color: colors.text }]}>
                      التقويم الهجري
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: colors.text }]}>
                      التقويم الإسلامي الذي يعتمد على دورة القمر ويبدأ من هجرة الرسول ﷺ
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    backgroundColor: '#add4ce',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
  selectorContainer: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  selectorButtonActive: {
    backgroundColor: '#4CAF50',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  selectorTextActive: {
    color: '#fff',
  },
  dateCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateContent: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  featureButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
});
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from '@/styles/common-styles';

const { width } = Dimensions.get('window');

interface DateInfo {
  gregorian: {
    date: string;
    day: string;
    month: string;
    year: string;
    monthName: string;
    dayName: string;
  };
  hijri: {
    date: string;
    day: string;
    month: string;
    year: string;
    monthName: string;
    dayName: string;
  };
}

export default function CalendarScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const colors = {
    background: backgroundColor,
    text: useThemeColor({}, 'text'),
    card: useThemeColor({}, 'background'),
    border: '#E5E5EA',
  };

  const [currentDate, setCurrentDate] = useState<DateInfo>({
    gregorian: {
      date: '',
      day: '',
      month: '',
      year: '',
      monthName: '',
      dayName: '',
    },
    hijri: {
      date: '',
      day: '',
      month: '',
      year: '',
      monthName: '',
      dayName: '',
    },
  });

  const gregorianMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const hijriMonths = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  const weekDays = [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  useEffect(() => {
    const now = new Date();
    
    // التاريخ الميلادي
    const gregorianDate = {
      date: now.toLocaleDateString('ar-SA'),
      day: now.getDate().toString(),
      month: (now.getMonth() + 1).toString(),
      year: now.getFullYear().toString(),
      monthName: gregorianMonths[now.getMonth()],
      dayName: weekDays[now.getDay()],
    };

    // التاريخ الهجري (تقريبي)
    const hijriDate = {
      date: now.toLocaleDateString('ar-SA-u-ca-islamic'),
      day: '15',
      month: '8',
      year: '1446',
      monthName: 'شعبان',
      dayName: weekDays[now.getDay()],
    };

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate,
    });
  }, []);

  const handleBack = () => {
    router.back();
  };

  const convertToHijri = () => {
    Alert.alert(
      'تحويل التاريخ',
      'سيتم إضافة ميزة تحويل التاريخ قريباً',
      [{ text: 'حسناً', style: 'default' }]
    );
  };

  return (
    <ThemedView style={[styles.container, commonStyles.containerWithBottomNav, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#1c1f33" />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          📅 التقويم الهجري والميلادي
        </ThemedText>
        <View style={styles.placeholder} />
      </ThemedView>

      <ScrollView 
        style={[styles.scrollView, commonStyles.scrollViewWithBottomNav]}
        showsVerticalScrollIndicator={false}
      >
        {/* التاريخ الحالي */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            📆 التاريخ الحالي
          </ThemedText>

          {/* التاريخ الميلادي */}
          <ThemedView style={[styles.dateCard, { backgroundColor: colors.background }]}>
            <ThemedView style={styles.dateHeader}>
              <IconSymbol size={28} name="calendar" color="#4ECDC4" />
              <ThemedText style={[styles.calendarType, { color: colors.text }]}>
                التقويم الميلادي
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.dateContent}>
              <ThemedText style={[styles.dayName, { color: colors.text }]}>
                {currentDate.gregorian.dayName}
              </ThemedText>
              <ThemedText style={[styles.dateNumber, { color: '#4ECDC4' }]}>
                {currentDate.gregorian.day}
              </ThemedText>
              <ThemedText style={[styles.monthYear, { color: colors.text }]}>
                {currentDate.gregorian.monthName} {currentDate.gregorian.year}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* التاريخ الهجري */}
          <ThemedView style={[styles.dateCard, { backgroundColor: colors.background }]}>
            <ThemedView style={styles.dateHeader}>
              <IconSymbol size={28} name="moon.fill" color="#E67E22" />
              <ThemedText style={[styles.calendarType, { color: colors.text }]}>
                التقويم الهجري
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.dateContent}>
              <ThemedText style={[styles.dayName, { color: colors.text }]}>
                {currentDate.hijri.dayName}
              </ThemedText>
              <ThemedText style={[styles.dateNumber, { color: '#E67E22' }]}>
                {currentDate.hijri.day}
              </ThemedText>
              <ThemedText style={[styles.monthYear, { color: colors.text }]}>
                {currentDate.hijri.monthName} {currentDate.hijri.year} هـ
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* الأشهر الميلادية */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            📅 الأشهر الميلادية
          </ThemedText>
          <ThemedView style={styles.monthsGrid}>
            {gregorianMonths.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthItem,
                  { 
                    backgroundColor: colors.background,
                    borderColor: parseInt(currentDate.gregorian.month) === (index + 1) ? '#4ECDC4' : colors.border
                  }
                ]}
              >
                <ThemedText style={[
                  styles.monthText,
                  { 
                    color: parseInt(currentDate.gregorian.month) === (index + 1) ? '#4ECDC4' : colors.text 
                  }
                ]}>
                  {month}
                </ThemedText>
                <ThemedText style={[styles.monthNumber, { color: colors.text }]}>
                  {index + 1}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* الأشهر الهجرية */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            🌙 الأشهر الهجرية
          </ThemedText>
          <ThemedView style={styles.monthsGrid}>
            {hijriMonths.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthItem,
                  { 
                    backgroundColor: colors.background,
                    borderColor: currentDate.hijri.monthName === month ? '#E67E22' : colors.border
                  }
                ]}
              >
                <ThemedText style={[
                  styles.monthText,
                  { 
                    color: currentDate.hijri.monthName === month ? '#E67E22' : colors.text 
                  }
                ]}>
                  {month}
                </ThemedText>
                <ThemedText style={[styles.monthNumber, { color: colors.text }]}>
                  {index + 1}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* أدوات إضافية */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            🔧 أدوات إضافية
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.toolButton, { backgroundColor: colors.background }]}
            onPress={convertToHijri}
          >
            <IconSymbol size={24} name="arrow.triangle.2.circlepath" color="#4ECDC4" />
            <ThemedText style={[styles.toolButtonText, { color: colors.text }]}>
              محول التاريخ
            </ThemedText>
            <ThemedText style={[styles.toolButtonDesc, { color: colors.text }]}>
              تحويل التاريخ بين الهجري والميلادي
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      <BottomNavigationBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    writingDirection: 'rtl',
  },
  dateCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  calendarType: {
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  dateContent: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    writingDirection: 'rtl',
  },
  dateNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthItem: {
    width: (width - 80) / 3,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 10,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  monthNumber: {
    fontSize: 12,
    opacity: 0.7,
  },
  toolButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    gap: 10,
  },
  toolButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  toolButtonDesc: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
