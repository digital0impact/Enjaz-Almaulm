import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
  ImageBackground,
} from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from '@/styles/common-styles';

const { width } = Dimensions.get('window');

interface TodayInfo {
  gregorian: {
    date: string;
    day: string;
    month: string;
    year: string;
    monthName: string;
    dayName: string;
    fullDate: string;
  };
  hijri: {
    date: string;
    day: string;
    month: string;
    year: string;
    monthName: string;
    dayName: string;
    fullDate: string;
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
    primary: '#4ECDC4',
  };

  const [todayInfo, setTodayInfo] = useState<TodayInfo>({
    gregorian: {
      date: '',
      day: '',
      month: '',
      year: '',
      monthName: '',
      dayName: '',
      fullDate: '',
    },
    hijri: {
      date: '',
      day: '',
      month: '',
      year: '',
      monthName: '',
      dayName: '',
      fullDate: '',
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
    const updateTodayInfo = () => {
      const now = new Date();

      // التاريخ الميلادي
      const gregorianDate = {
        date: now.toLocaleDateString('ar-SA'),
        day: now.getDate().toString(),
        month: (now.getMonth() + 1).toString(),
        year: now.getFullYear().toString(),
        monthName: gregorianMonths[now.getMonth()],
        dayName: weekDays[now.getDay()],
        fullDate: `${weekDays[now.getDay()]}، ${now.getDate()} ${gregorianMonths[now.getMonth()]} ${now.getFullYear()}`,
      };

      // التاريخ الهجري (تقريبي)
      try {
        const hijriDateString = now.toLocaleDateString('ar-SA-u-ca-islamic');
        const hijriParts = hijriDateString.split('/');
        const hijriDay = hijriParts[0] || '15';
        const hijriMonth = hijriParts[1] || '8';
        const hijriYear = hijriParts[2] || '1446';

        const hijriDate = {
          date: hijriDateString,
          day: hijriDay,
          month: hijriMonth,
          year: hijriYear,
          monthName: hijriMonths[parseInt(hijriMonth) - 1] || 'شعبان',
          dayName: weekDays[now.getDay()],
          fullDate: `${weekDays[now.getDay()]}، ${hijriDay} ${hijriMonths[parseInt(hijriMonth) - 1] || 'شعبان'} ${hijriYear} هـ`,
        };

        setTodayInfo({
          gregorian: gregorianDate,
          hijri: hijriDate,
        });
      } catch (error) {
        // fallback if hijri conversion fails
        setTodayInfo({
          gregorian: gregorianDate,
          hijri: {
            date: 'غير متاح',
            day: '15',
            month: '8',
            year: '1446',
            monthName: 'شعبان',
            dayName: weekDays[now.getDay()],
            fullDate: `${weekDays[now.getDay()]}، 15 شعبان 1446 هـ`,
          },
        });
      }
    };

    updateTodayInfo();

    // تحديث التاريخ كل دقيقة
    const interval = setInterval(updateTodayInfo, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const navigateToMonthlyCalendar = () => {
    router.push('/monthly-calendar');
  };

  const convertToHijri = () => {
    Alert.alert(
      'تحويل التاريخ',
      'سيتم إضافة ميزة تحويل التاريخ قريباً',
      [{ text: 'حسناً', style: 'default' }]
    );
  };

  const navigateToOfficialHolidays = () => {
    router.push('/official-holidays');
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
          {/* Header */}
          <ThemedView style={[styles.header, { backgroundColor: 'transparent' }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
            </TouchableOpacity>

            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="calendar" color="#1c1f33" />
            </ThemedView>

            <ThemedText type="title" style={styles.title}>
              📅 التقويم الهجري والميلادي
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              تصفح التاريخ الهجري والميلادي
            </ThemedText>
          </ThemedView>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={{ flexGrow: 1, ...commonStyles.scrollViewWithBottomNav }}
          >
            {/* تاريخ اليوم - القسم الرئيسي */}
            <ThemedView style={[styles.todaySection, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                🌟 تاريخ اليوم
              </ThemedText>

              {/* التاريخ الميلادي لليوم */}
              <ThemedView style={[styles.todayCard, { backgroundColor: 'rgba(78, 205, 196, 0.1)', borderColor: '#4ECDC4' }]}>
                <ThemedView style={styles.todayHeader}>
                  <IconSymbol size={32} name="calendar.circle" color="#4ECDC4" />
                  <ThemedText style={[styles.todayType, { color: '#4ECDC4' }]}>
                    التاريخ الميلادي
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.todayContent}>
                  <ThemedText style={[styles.todayFullDate, { color: colors.text }]}>
                    {todayInfo.gregorian.fullDate}
                  </ThemedText>
                  <ThemedText style={[styles.todayBigDate, { color: '#4ECDC4' }]}>
                    {todayInfo.gregorian.day}
                  </ThemedText>
                  <ThemedText style={[styles.todayMonthYear, { color: colors.text }]}>
                    {todayInfo.gregorian.monthName} {todayInfo.gregorian.year}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {/* التاريخ الهجري لليوم */}
              <ThemedView style={[styles.todayCard, { backgroundColor: 'rgba(230, 126, 34, 0.1)', borderColor: '#E67E22' }]}>
                <ThemedView style={styles.todayHeader}>
                  <IconSymbol size={32} name="moon.circle.fill" color="#E67E22" />
                  <ThemedText style={[styles.todayType, { color: '#E67E22' }]}>
                    التاريخ الهجري
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.todayContent}>
                  <ThemedText style={[styles.todayFullDate, { color: colors.text }]}>
                    {todayInfo.hijri.fullDate}
                  </ThemedText>
                  <ThemedText style={[styles.todayBigDate, { color: '#E67E22' }]}>
                    {todayInfo.hijri.day}
                  </ThemedText>
                  <ThemedText style={[styles.todayMonthYear, { color: colors.text }]}>
                    {todayInfo.hijri.monthName} {todayInfo.hijri.year} هـ
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
                        borderColor: parseInt(todayInfo.gregorian.month) === (index + 1) ? '#4ECDC4' : colors.border
                      }
                    ]}
                  >
                    <ThemedText style={[
                      styles.monthText,
                      { 
                        color: parseInt(todayInfo.gregorian.month) === (index + 1) ? '#4ECDC4' : colors.text 
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
                        borderColor: todayInfo.hijri.monthName === month ? '#E67E22' : colors.border
                      }
                    ]}
                  >
                    <ThemedText style={[
                      styles.monthText,
                      { 
                        color: todayInfo.hijri.monthName === month ? '#E67E22' : colors.text 
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

            {/* أدوات التقويم */}
            <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                🔧 أدوات التقويم
              </ThemedText>

              <TouchableOpacity
                style={[styles.toolButton, { backgroundColor: '#4ECDC4' }]}
                onPress={navigateToMonthlyCalendar}
              >
                <IconSymbol size={24} name="calendar.circle" color="#fff" />
                <ThemedText style={styles.toolButtonText}>
                  التقويم الشهري
                </ThemedText>
                <ThemedText style={styles.toolButtonDesc}>
                  عرض التقويم الشهري مع المناسبات
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolButton, { backgroundColor: colors.background, borderWidth: 2, borderColor: '#4ECDC4' }]}
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

              <TouchableOpacity
                style={[styles.toolButton, { backgroundColor: colors.background, borderWidth: 2, borderColor: '#E67E22' }]}
                onPress={navigateToOfficialHolidays}
              >
                <IconSymbol size={24} name="star.circle" color="#E67E22" />
                <ThemedText style={[styles.toolButtonText, { color: colors.text }]}>
                  المناسبات والإجازات
                </ThemedText>
                <ThemedText style={[styles.toolButtonDesc, { color: colors.text }]}>
                  عرض المناسبات الرسمية والإجازات
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* معلومات مفيدة */}
            <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                📚 معلومات مفيدة
              </ThemedText>

              <ThemedView style={[styles.infoCard, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}>
                <IconSymbol size={24} name="info.circle" color="#4ECDC4" />
                <ThemedView style={styles.infoContent}>
                  <ThemedText style={[styles.infoTitle, { color: colors.text }]}>
                    التقويم الميلادي
                  </ThemedText>
                  <ThemedText style={[styles.infoText, { color: colors.text }]}>
                    التقويم المعتمد عالمياً والذي يعتمد على دورة الأرض حول الشمس
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={[styles.infoCard, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}>
                <IconSymbol size={24} name="moon.circle" color="#E67E22" />
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
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
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
  scrollView: {
    flex: 1,
    padding: 20,
  },

  // أنماط قسم تاريخ اليوم المحسنة
  todaySection: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  todayCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  todayType: {
    fontSize: 18,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  todayContent: {
    alignItems: 'center',
    gap: 8,
  },
  todayFullDate: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  todayBigDate: {
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  todayMonthYear: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  toolButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#fff',
  },
  toolButtonDesc: {
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
});