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
  Text,
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

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLiveUpdate, setIsLiveUpdate] = useState(true);

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
      setCurrentTime(now);

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

      // التاريخ الهجري (تقريبي) - محسن
      try {
        // استخدام Intl.DateTimeFormat للحصول على التاريخ الهجري
        const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric'
        });
        
        const hijriParts = hijriFormatter.formatToParts(now);
        const hijriDay = hijriParts.find(part => part.type === 'day')?.value || '1';
        const hijriMonth = hijriParts.find(part => part.type === 'month')?.value || '1';
        const hijriYear = hijriParts.find(part => part.type === 'year')?.value || '1446';

        const hijriDate = {
          date: `${hijriDay}/${hijriMonth}/${hijriYear}`,
          day: hijriDay,
          month: hijriMonth,
          year: hijriYear,
          monthName: hijriMonths[parseInt(hijriMonth) - 1] || hijriMonths[0],
          dayName: weekDays[now.getDay()],
          fullDate: `${weekDays[now.getDay()]}، ${hijriDay} ${hijriMonths[parseInt(hijriMonth) - 1] || hijriMonths[0]} ${hijriYear} هـ`,
        };

        setTodayInfo({
          gregorian: gregorianDate,
          hijri: hijriDate,
        });
      } catch (error) {
        console.error('خطأ في حساب التاريخ الهجري:', error);
        // حساب تقريبي للتاريخ الهجري كخيار احتياطي
        const gregorianYear = now.getFullYear();
        const gregorianMonth = now.getMonth() + 1;
        const gregorianDay = now.getDate();
        
        // تحويل تقريبي من الميلادي إلى الهجري (622 سنة فرق تقريبي)
        const approximateHijriYear = Math.floor(gregorianYear - 579.3);
        const currentMonthIndex = Math.floor((gregorianMonth + 8) % 12);
        const approximateHijriMonth = currentMonthIndex + 1;
        
        setTodayInfo({
          gregorian: gregorianDate,
          hijri: {
            date: `${gregorianDay}/${approximateHijriMonth}/${approximateHijriYear}`,
            day: gregorianDay.toString(),
            month: approximateHijriMonth.toString(),
            year: approximateHijriYear.toString(),
            monthName: hijriMonths[currentMonthIndex] || 'محرم',
            dayName: weekDays[now.getDay()],
            fullDate: `${weekDays[now.getDay()]}، ${gregorianDay} ${hijriMonths[currentMonthIndex] || 'محرم'} ${approximateHijriYear} هـ`,
          },
        });
      }
    };

    updateTodayInfo();

    // تحديث الوقت كل ثانية للساعة الحية
    const timeInterval = setInterval(() => {
      if (isLiveUpdate) {
        setCurrentTime(new Date());
      }
    }, 1000);

    // تحديث التاريخ كل دقيقة
    const dateInterval = setInterval(updateTodayInfo, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dateInterval);
    };
  }, [isLiveUpdate]);

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
            {/* الساعة الرقمية الحية */}
            <ThemedView style={[styles.liveClockSection, { backgroundColor: colors.card }]}>
              <ThemedView style={styles.clockHeader}>
                <IconSymbol size={20} name="clock.fill" color="#4ECDC4" />
                <ThemedText style={[styles.clockTitle, { color: colors.text }]}>
                  الوقت الحالي
                </ThemedText>
                <TouchableOpacity 
                  onPress={() => setIsLiveUpdate(!isLiveUpdate)}
                  style={[styles.liveToggle, { backgroundColor: isLiveUpdate ? '#4ECDC4' : '#ccc' }]}
                >
                  <IconSymbol 
                    size={12} 
                    name={isLiveUpdate ? "play.fill" : "pause.fill"} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={styles.digitalClock}>
                <ThemedText style={[styles.timeDisplay, { color: colors.text }]}>
                  {currentTime.toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </ThemedText>
                <ThemedText style={[styles.dateDisplay, { color: colors.text }]}>
                  {currentTime.toLocaleDateString('ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.timeInfo}>
                <ThemedView style={styles.timeCard}>
                  <IconSymbol size={16} name="sun.max.fill" color="#FF9800" />
                  <ThemedText style={[styles.timeLabel, { color: colors.text }]}>
                    الساعة: {currentTime.getHours()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.timeCard}>
                  <IconSymbol size={16} name="clock.arrow.circlepath" color="#2196F3" />
                  <ThemedText style={[styles.timeLabel, { color: colors.text }]}>
                    الدقيقة: {currentTime.getMinutes()}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.timeCard}>
                  <IconSymbol size={16} name="timer" color="#4CAF50" />
                  <ThemedText style={[styles.timeLabel, { color: colors.text }]}>
                    الثانية: {currentTime.getSeconds()}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* تاريخ اليوم - القسم الرئيسي */}
            <ThemedView style={[styles.todaySection, { backgroundColor: colors.card }]}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  🌟 تاريخ اليوم
                </ThemedText>
                <ThemedView style={[styles.liveBadge, { backgroundColor: isLiveUpdate ? '#4ECDC4' : '#ccc' }]}>
                  <ThemedText style={styles.liveBadgeText}>
                    {isLiveUpdate ? 'مباشر' : 'متوقف'}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

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

  // أنماط الساعة الرقمية الحية
  liveClockSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  clockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  clockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    flex: 1,
    textAlign: 'center',
  },
  liveToggle: {
    width: 30,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitalClock: {
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dateDisplay: {
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'transparent',
  },
  timeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  liveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
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