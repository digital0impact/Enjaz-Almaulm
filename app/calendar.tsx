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

              {/* Container for Gregorian and Hijri cards */}
              <View style={styles.cardsContainer}>
                {/* التاريخ الميلادي لليوم */}
                <ThemedView style={[styles.todayCardSmall, { backgroundColor: 'rgba(78, 205, 196, 0.1)', borderColor: '#4ECDC4' }]}>
                  <ThemedView style={styles.todayHeaderSmall}>
                    <IconSymbol size={24} name="calendar.circle" color="#4ECDC4" />
                    <ThemedText style={[styles.todayTypeSmall, { color: '#4ECDC4' }]}>
                      التاريخ الميلادي
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={[styles.todayContentSmall, { backgroundColor: 'transparent' }]}>
                    <ThemedView style={[styles.fullDateContainer, { backgroundColor: 'transparent' }]}>
                      <ThemedText style={[styles.fullDateText, { color: colors.text }]}>
                        {todayInfo.gregorian.fullDate}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={[styles.todayBigDateSmall, { color: '#4ECDC4' }]}>
                      {todayInfo.gregorian.day}
                    </ThemedText>
                    <ThemedText style={[styles.todayMonthYearSmall, { color: colors.text }]}>
                      {todayInfo.gregorian.monthName}
                    </ThemedText>
                    <ThemedText style={[styles.todayYearSmall, { color: colors.text }]}>
                      {todayInfo.gregorian.year}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* التاريخ الهجري لليوم */}
                <ThemedView style={[styles.todayCardSmall, { backgroundColor: 'rgba(230, 126, 34, 0.1)', borderColor: '#E67E22' }]}>
                  <ThemedView style={styles.todayHeaderSmall}>
                    <IconSymbol size={24} name="moon.circle.fill" color="#E67E22" />
                    <ThemedText style={[styles.todayTypeSmall, { color: '#E67E22' }]}>
                      التاريخ الهجري
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={[styles.todayContentSmall, { backgroundColor: 'transparent' }]}>
                    <ThemedView style={[styles.fullDateContainer, { backgroundColor: 'transparent' }]}>
                      <ThemedText style={[styles.fullDateText, { color: colors.text }]}>
                        {todayInfo.hijri.fullDate}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={[styles.todayBigDateSmall, { color: '#E67E22' }]}>
                      {todayInfo.hijri.day}
                    </ThemedText>
                    <ThemedText style={[styles.todayMonthYearSmall, { color: colors.text }]}>
                      {todayInfo.hijri.monthName}
                    </ThemedText>
                    <ThemedText style={[styles.todayYearSmall, { color: colors.text }]}>
                      {todayInfo.hijri.year} هـ
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </View>
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
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },

  // أنماط قسم تاريخ اليوم المحسنة
  todaySection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 15,
  },
  todayCardSmall: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  todayHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  todayTypeSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  todayContentSmall: {
    alignItems: 'center',
    gap: 4,
  },
  todayBigDateSmall: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  todayMonthYearSmall: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  todayYearSmall: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
  },
  fullDateContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  fullDateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  section: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthItem: {
    width: (width - 80) / 3,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 6,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  monthNumber: {
    fontSize: 10,
    opacity: 0.7,
  },
  toolButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  toolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#fff',
  },
  toolButtonDesc: {
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoText: {
    fontSize: 11,
    textAlign: 'right',
    lineHeight: 16,
    writingDirection: 'rtl',
  },
});