import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Text,
  KeyboardAvoidingView,
} from 'react-native';
import { AlertService } from '@/services/AlertService';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from '@/styles/common-styles';
import axios from 'axios';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

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
  const [isLoadingHijri, setIsLoadingHijri] = useState(false);
  const [selectedHijriYear, setSelectedHijriYear] = useState<number | null>(null);

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

  // دالة للحصول على التاريخ الهجري من API خارجي محدث ومحسن
  const fetchHijriDateFromAPI = async (gregorianDate: Date) => {
    try {
      setIsLoadingHijri(true);
      const day = gregorianDate.getDate();
      const month = gregorianDate.getMonth() + 1;
      const year = gregorianDate.getFullYear();

      // قائمة بـ APIs موثوقة ومحدثة
      const apis = [
        // API الأول - Aladhan (محدث)
        {
          name: 'Aladhan',
          url: `https://api.aladhan.com/v1/gToH/${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`,
          handler: (data: any) => {
            if (data && data.code === 200 && data.data && data.data.hijri) {
              const hijriData = data.data.hijri;
              if (hijriData.day && hijriData.month && hijriData.year) {
                const hijriMonth = parseInt(hijriData.month.number);
                const hijriDay = parseInt(hijriData.day);
                const hijriYear = parseInt(hijriData.year);

                if (hijriDay && hijriMonth && hijriYear && hijriMonth >= 1 && hijriMonth <= 12) {
                  return {
                    date: `${hijriDay}/${hijriMonth}/${hijriYear}`,
                    day: hijriDay.toString(),
                    month: hijriMonth.toString(),
                    year: hijriYear.toString(),
                    monthName: (hijriData.month && hijriData.month.ar) ? hijriData.month.ar : hijriMonths[hijriMonth - 1],
                    dayName: (hijriData.weekday && hijriData.weekday.ar) ? hijriData.weekday.ar : weekDays[gregorianDate.getDay()],
                    fullDate: `${(hijriData.weekday && hijriData.weekday.ar) ? hijriData.weekday.ar : weekDays[gregorianDate.getDay()]}، ${hijriDay} ${(hijriData.month && hijriData.month.ar) ? hijriData.month.ar : hijriMonths[hijriMonth - 1]} ${hijriYear} هـ`,
                  };
                }
              }
            }
            return null;
          }
        },
        // API الثاني - Islamic Network
        {
          name: 'IslamicNetwork',
          url: `https://api.islamicnetwork.com/v1/calendar/dateConversion?date=${day}-${month}-${year}&dateType=gregorian`,
          handler: (data: any) => {
            if (data && data.data && data.data.hijri) {
              const hijriData = data.data.hijri;
              const hijriMonth = parseInt(hijriData.month);
              const hijriDay = parseInt(hijriData.day);
              const hijriYear = parseInt(hijriData.year);

              if (hijriDay && hijriMonth && hijriYear && hijriMonth >= 1 && hijriMonth <= 12) {
                return {
                  date: `${hijriDay}/${hijriMonth}/${hijriYear}`,
                  day: hijriDay.toString(),
                  month: hijriMonth.toString(),
                  year: hijriYear.toString(),
                  monthName: hijriMonths[hijriMonth - 1],
                  dayName: weekDays[gregorianDate.getDay()],
                  fullDate: `${weekDays[gregorianDate.getDay()]}، ${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear} هـ`,
                };
              }
            }
            return null;
          }
        },
        // API الثالث - HijriDate
        {
          name: 'HijriDate',
          url: `https://api.habibur.com/islamic-date/gregorian-to-hijri?gregorian=${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          handler: (data: any) => {
            if (data && data.hijri) {
              const hijriData = data.hijri;
              const hijriMonth = parseInt(hijriData.month);
              const hijriDay = parseInt(hijriData.day);
              const hijriYear = parseInt(hijriData.year);

              if (hijriDay && hijriMonth && hijriYear && hijriMonth >= 1 && hijriMonth <= 12) {
                return {
                  date: `${hijriDay}/${hijriMonth}/${hijriYear}`,
                  day: hijriDay.toString(),
                  month: hijriMonth.toString(),
                  year: hijriYear.toString(),
                  monthName: hijriMonths[hijriMonth - 1],
                  dayName: weekDays[gregorianDate.getDay()],
                  fullDate: `${weekDays[gregorianDate.getDay()]}، ${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear} هـ`,
                };
              }
            }
            return null;
          }
        },
        // API الرابع - Islamic Calendar
        {
          name: 'IslamicCalendar',
          url: `https://islamic-calendar-api.herokuapp.com/api/gregorian-to-hijri?date=${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          handler: (data: any) => {
            if (data && data.hijri_date) {
              const hijriParts = data.hijri_date.split('-');
              if (hijriParts.length === 3) {
                const hijriYear = parseInt(hijriParts[0]);
                const hijriMonth = parseInt(hijriParts[1]);
                const hijriDay = parseInt(hijriParts[2]);

                if (hijriDay && hijriMonth && hijriYear && hijriMonth >= 1 && hijriMonth <= 12) {
                  return {
                    date: `${hijriDay}/${hijriMonth}/${hijriYear}`,
                    day: hijriDay.toString(),
                    month: hijriMonth.toString(),
                    year: hijriYear.toString(),
                    monthName: hijriMonths[hijriMonth - 1],
                    dayName: weekDays[gregorianDate.getDay()],
                    fullDate: `${weekDays[gregorianDate.getDay()]}، ${hijriDay} ${hijriMonths[hijriMonth - 1]} ${hijriYear} هـ`,
                  };
                }
              }
            }
            return null;
          }
        }
      ];

      // جرب كل API بشكل متسلسل
      for (const api of apis) {
        try {
          console.log(`🔄 جاري محاولة ${api.name} API...`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

          const response = await axios.get(api.url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });

          clearTimeout(timeoutId);

          if (response.status === 200) {
            const data = response.data;
            const result = api.handler(data);

            if (result) {
              console.log(`✅ تم جلب التاريخ الهجري بنجاح من ${api.name}`);
              return result;
            } else {
              console.warn(`⚠️ ${api.name} لم يُرجع بيانات صحيحة`);
            }
          } else {
            console.warn(`⚠️ ${api.name} أرجع رمز خطأ: ${response.status}`);
          }
        } catch (apiError: any) {
          if (apiError.name === 'AbortError') {
            console.warn(`⏰ انتهت مهلة ${api.name} API`);
          } else {
            console.warn(`❌ خطأ في ${api.name} API:`, apiError.message);
          }
          continue; // جرب API التالي
        }
      }

      // إذا فشلت جميع APIs، استخدم الحساب المحلي
      console.warn('⚠️ فشلت جميع APIs الخارجية، استخدام الحساب المحلي...');
      return convertToHijriLocal(gregorianDate);

    } catch (error) {
      console.error('❌ خطأ عام في جلب التاريخ الهجري:', error);
      return convertToHijriLocal(gregorianDate);
    } finally {
      setIsLoadingHijri(false);
    }
  };



  // دالة للحساب المحلي كخيار احتياطي محسنة
  const convertToHijriLocal = (gregorianDate: Date) => {
    // تاريخ البداية المصحح: 1 محرم 1 هـ = 15 يوليو 622 م
    const epochDate = new Date(622, 6, 15); // يوليو = الشهر 6 (0-indexed)
    const timeDiff = gregorianDate.getTime() - epochDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // حساب محسن للسنة الهجرية (354.37 يوم تقريباً)
    const hijriYear = Math.floor(daysDiff / 354.37) + 1;
    const remainingDays = daysDiff - Math.floor((hijriYear - 1) * 354.37);

    // أشهر السنة الهجرية (أيام كل شهر) - نموذج أكثر دقة
    const monthDays = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];

    let hijriMonth = 1;
    let hijriDay = Math.max(1, remainingDays + 1);

    // حساب الشهر واليوم
    for (let i = 0; i < 12; i++) {
      if (hijriDay <= monthDays[i]) {
        hijriMonth = i + 1;
        break;
      }
      hijriDay -= monthDays[i];
      if (i === 11) {
        // إذا تجاوزنا 12 شهر، ننتقل للسنة التالية
        hijriMonth = 1;
        hijriDay = Math.max(1, hijriDay);
      }
    }

    // التأكد من صحة القيم
    hijriMonth = Math.max(1, Math.min(12, hijriMonth));
    hijriDay = Math.max(1, Math.min(monthDays[hijriMonth - 1], hijriDay));

    return {
      date: `${hijriDay}/${hijriMonth}/${hijriYear}`,
      day: hijriDay.toString(),
      month: hijriMonth.toString(),
      year: hijriYear.toString(),
      monthName: hijriMonths[hijriMonth - 1] || hijriMonths[0],
      dayName: weekDays[gregorianDate.getDay()],
      fullDate: `${weekDays[gregorianDate.getDay()]}، ${hijriDay} ${hijriMonths[hijriMonth - 1] || hijriMonths[0]} ${hijriYear} هـ`,
    };
  };

  // دالة للحساب التقريبي كخيار احتياطي
  const getApproximateHijriDate = (gregorianDate: Date) => {
    const currentYear = gregorianDate.getFullYear();
    const approximateHijriYear = Math.floor((currentYear - 579) * 1.030684);
    const currentMonth = gregorianDate.getMonth() + 1;
    const currentDay = gregorianDate.getDate();

    // تقدير الشهر الهجري بناءً على الشهر الميلادي
    const monthOffset = Math.floor((currentMonth - 1) * 0.97) + 1;
    let hijriMonth = monthOffset > 12 ? monthOffset - 12 : monthOffset;
    let hijriYear = approximateHijriYear;

    if (monthOffset > 12) {
      hijriYear += 1;
    }

    return {
      date: `${currentDay}/${hijriMonth}/${hijriYear}`,
      day: currentDay.toString(),
      month: hijriMonth.toString(),
      year: hijriYear.toString(),
      monthName: hijriMonths[hijriMonth - 1] || hijriMonths[0],
      dayName: weekDays[gregorianDate.getDay()],
      fullDate: `${weekDays[gregorianDate.getDay()]}، ${currentDay} ${hijriMonths[hijriMonth - 1] || hijriMonths[0]} ${hijriYear} هـ`,
    };
  };

  useEffect(() => {
    const updateTodayInfo = async () => {
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

      // التاريخ الهجري - من APIs خارجية محدثة مع معالجة محسنة للأخطاء
      try {
        const hijriDate = await fetchHijriDateFromAPI(now);
        setTodayInfo({
          gregorian: gregorianDate,
          hijri: hijriDate,
        });
      } catch (error) {
        console.error('❌ خطأ عام في جلب التاريخ الهجري:', error);
        // حساب محلي كخيار نهائي آمن
        const localHijriDate = convertToHijriLocal(now);
        setTodayInfo({
          gregorian: gregorianDate,
          hijri: localHijriDate,
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

  const showDateConverterAlert = () => {
    AlertService.alert(
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
      >
          {/* Header */}
          <ThemedView style={[styles.header, { backgroundColor: 'transparent' }]}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
            </TouchableOpacity>

            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="calendar" color="#1c1f33" />
            </ThemedView>

            <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
              {formatRTLText('📅 التقويم الهجري والميلادي')}
            </ThemedText>
            <ThemedText style={[styles.subtitle, getTextDirection()]}> 
              {formatRTLText('تصفح التاريخ الهجري والميلادي')}
            </ThemedText>
          </ThemedView>

          <ScrollView 
            style={[styles.scrollView, commonStyles.scrollViewWithBottomNav]}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* الساعة الرقمية الحية */}
            <ThemedView style={[styles.liveClockSection, { backgroundColor: colors.card }]}>
              <ThemedView style={styles.clockHeader}>
                <IconSymbol size={20} name="clock.fill" color="#4ECDC4" />
                <ThemedText style={[styles.clockTitle, getTextDirection(), { color: colors.text }]}> 
                  {formatRTLText('الوقت الحالي')}
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

              <ThemedView style={[styles.digitalClock, { backgroundColor: colors.card, borderColor: colors.primary }]}>
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
                <ThemedText style={[styles.sectionTitle, getTextDirection(), { color: colors.text, textAlign: 'right' }]}> 
                  {formatRTLText('تاريخ اليوم')}
                </ThemedText>
              </ThemedView>

              {/* Container for Gregorian and Hijri cards */}
              <View style={styles.cardsContainer}>
                {/* التاريخ الميلادي لليوم */}
                <ThemedView style={[styles.todayCardSmall, { backgroundColor: 'rgba(78, 205, 196, 0.1)', borderColor: '#4ECDC4' }]}>
                  <ThemedView style={styles.todayHeaderSmall}>
                    <IconSymbol size={24} name="calendar.circle" color="#4ECDC4" />
                    <ThemedText style={[styles.todayTypeSmall, getTextDirection(), { color: '#4ECDC4' }]}> 
                      {formatRTLText('التاريخ الميلادي')}
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
                    <ThemedText style={[styles.todayTypeSmall, getTextDirection(), { color: '#E67E22' }]}> 
                      {formatRTLText('التاريخ الهجري')}
                    </ThemedText>
                    {isLoadingHijri ? (
                      <ThemedView style={styles.loadingIndicator}>
                        <IconSymbol size={16} name="arrow.clockwise" color="#E67E22" />
                      </ThemedView>
                    ) : (
                      <TouchableOpacity 
                        onPress={async () => {
                          const now = new Date();
                          try {
                            console.log('🔄 بدء تحديث التاريخ الهجري...');
                            const hijriDate = await fetchHijriDateFromAPI(now);
                            setTodayInfo(prev => ({
                              ...prev,
                              hijri: hijriDate
                            }));
                            console.log('✅ تم تحديث التاريخ الهجري بنجاح');
                          } catch (error) {
                            console.error('❌ خطأ في تحديث التاريخ الهجري:', error);
                            // استخدام الحساب المحلي كحل أخير آمن
                            const localHijriDate = convertToHijriLocal(now);
                            setTodayInfo(prev => ({
                              ...prev,
                              hijri: localHijriDate
                            }));
                            console.log('🔄 تم استخدام الحساب المحلي كبديل');
                          }
                        }}
                        style={styles.refreshButton}
                      >
                        <IconSymbol size={14} name="arrow.clockwise" color="#E67E22" />
                      </TouchableOpacity>
                    )}
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

            {/* التقويم السنوي الهجري */}
            <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
              <ThemedView style={styles.yearNavigationHeader}>
                <IconSymbol size={24} name="calendar.badge.clock" color="#E67E22" />
                <ThemedText style={[styles.sectionTitle, getTextDirection(), { color: colors.text }]}> 
                  {formatRTLText('التقويم السنوي الهجري')}
                </ThemedText>
              </ThemedView>

              {/* التنقل بين السنوات */}
              <ThemedView style={[styles.yearNavigation, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}>
                <TouchableOpacity 
                  style={[styles.yearNavButton, { backgroundColor: '#E67E22' }]}
                  onPress={() => {
                    const currentYear = selectedHijriYear || parseInt(todayInfo.hijri.year);
                    const nextYear = currentYear + 1;
                    setSelectedHijriYear(nextYear);
                    AlertService.alert(
                      'السنة القادمة', 
                      `تم الانتقال للسنة الهجرية ${nextYear} هـ\n\nسيتم عرض تقويم السنة الجديدة`,
                      [{ text: 'حسناً', style: 'default' }]
                    );
                  }}
                >
                  <ThemedText style={[styles.yearNavText, getTextDirection()]}>السنة القادمة</ThemedText>
                  <IconSymbol size={16} name="chevron.left" color="#fff" />
                </TouchableOpacity>

                <ThemedView style={styles.currentYearContainer}>
                  <ThemedText style={[styles.currentYear, getTextDirection(), { color: colors.text }]}> 
                    {selectedHijriYear || todayInfo.hijri.year} هـ
                  </ThemedText>
                  <ThemedText style={[styles.currentYearLabel, getTextDirection(), { color: colors.text }]}> 
                    {selectedHijriYear ? formatRTLText('السنة المختارة') : formatRTLText('السنة الهجرية الحالية')}
                  </ThemedText>
                  {selectedHijriYear && (
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedHijriYear(null);
                        AlertService.alert('العودة للسنة الحالية', 'تم العودة للسنة الهجرية الحالية');
                      }}
                      style={styles.resetYearButton}
                    >
                      <ThemedText style={[styles.resetYearText, getTextDirection(), { color: '#E67E22' }]}> 
                        {formatRTLText('العودة للسنة الحالية')}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>

                <TouchableOpacity 
                  style={[styles.yearNavButton, { backgroundColor: '#E67E22' }]}
                  onPress={() => {
                    const currentYear = selectedHijriYear || parseInt(todayInfo.hijri.year);
                    const prevYear = currentYear - 1;
                    setSelectedHijriYear(prevYear);
                    AlertService.alert(
                      'السنة السابقة', 
                      `تم الانتقال للسنة الهجرية ${prevYear} هـ\n\nسيتم عرض تقويم السنة السابقة`,
                      [{ text: 'حسناً', style: 'default' }]
                    );
                  }}
                >
                  <IconSymbol size={16} name="chevron.right" color="#fff" />
                  <ThemedText style={[styles.yearNavText, getTextDirection()]}>السنة السابقة</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* التقويم الشهري الشبكي */}
              <ThemedView style={styles.annualCalendarContainer}>
                <ThemedView style={styles.monthsGridWrapper}>
                {hijriMonths.map((month, monthIndex) => {
                  const isCurrentMonth = monthIndex + 1 === parseInt(todayInfo.hijri.month);
                  const monthDays = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
                  const daysInMonth = monthDays[monthIndex];

                  // إنشاء أيام الشهر
                  const calendarDays = [];
                  for (let day = 1; day <= daysInMonth; day++) {
                    calendarDays.push(day);
                  }

                  return (
                    <ThemedView 
                      key={monthIndex}
                      style={[
                        styles.monthGridContainer,
                        { 
                          backgroundColor: isCurrentMonth 
                            ? 'rgba(230, 126, 34, 0.1)' 
                            : 'rgba(255, 255, 255, 0.8)',
                          borderColor: isCurrentMonth ? '#E67E22' : '#ddd',
                          borderWidth: isCurrentMonth ? 2 : 1,
                        }
                      ]}
                    >
                      {/* رأس الشهر */}
                      <ThemedView style={[styles.monthGridHeader, { backgroundColor: isCurrentMonth ? '#E67E22' : '#999' }]}>
                        <ThemedText style={[styles.monthGridTitle, getTextDirection()]}> 
                          {formatRTLText(`${month} ${selectedHijriYear || todayInfo.hijri.year} هـ`)}
                        </ThemedText>
                        <ThemedText style={[styles.monthGridInfo, getTextDirection()]}> 
                          {formatRTLText(`${daysInMonth} يوم (${daysInMonth === 30 ? 'كامل' : 'ناقص'})`)}
                        </ThemedText>
                        {isCurrentMonth && (
                          <ThemedView style={styles.currentMonthIndicator}>
                            <IconSymbol size={16} name="star.fill" color="#fff" />
                          </ThemedView>
                        )}
                      </ThemedView>

                      {/* أيام الأسبوع */}
                      <ThemedView style={styles.weekdaysRow}>
                        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((day, index) => (
                          <ThemedView key={index} style={styles.weekdayCell}>
                            <ThemedText style={[styles.weekdayText, { color: colors.text }]}>
                              {day}
                            </ThemedText>
                          </ThemedView>
                        ))}
                      </ThemedView>

                      {/* شبكة أيام الشهر */}
                      <ThemedView style={styles.monthDaysGrid}>
                        {calendarDays.map((day) => {
                          const isToday = isCurrentMonth && day === parseInt(todayInfo.hijri.day);

                          return (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.dayCell,
                                isToday && styles.todayCell,
                                { backgroundColor: isToday ? '#E67E22' : 'transparent' }
                              ]}
                              onPress={() => {
                                AlertService.alert(
                                  `${day} ${month} ${selectedHijriYear || todayInfo.hijri.year} هـ`,
                                  `📅 التاريخ: ${day}/${monthIndex + 1}/${selectedHijriYear || todayInfo.hijri.year} هـ\n` +
                                  `📊 الشهر: ${month}\n` +
                                  `🌙 اليوم: ${day} من ${daysInMonth}\n` +
                                  `${isToday ? '🔥 هذا هو اليوم الحالي' : ''}` +
                                  `${selectedHijriYear ? '\n🔄 سنة مختارة (ليست السنة الحالية)' : ''}`,
                                  [{ text: 'إغلاق', style: 'cancel' }]
                                );
                              }}
                            >
                              <ThemedText style={[
                                styles.dayCellText,
                                { color: isToday ? '#fff' : colors.text }
                              ]}>
                                {day}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </ThemedView>
                    </ThemedView>
                  );
                })}
                </ThemedView>
              </ThemedView>

              </ThemedView>
          </ScrollView>

          <BottomNavigationBar />
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    minHeight: 100,
    justifyContent: 'center',
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace',
    color: '#1c1f33',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
    lineHeight: 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dateDisplay: {
    fontSize: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#2c3e50',
    fontWeight: '600',
    opacity: 0.9,
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
    backgroundColor: 'transparent',
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
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  todayHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    minHeight: 30,
  },
  todayTypeSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    flex: 1,
    textAlign: 'center',
    lineHeight: 18,
    includeFontPadding: false,
  },
  todayContentSmall: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  todayBigDateSmall: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  todayMonthYearSmall: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
    includeFontPadding: false,
    paddingVertical: 2,
  },
  todayYearSmall: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
    lineHeight: 16,
    includeFontPadding: false,
    paddingVertical: 1,
  },
  fullDateContainer: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  fullDateText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    textAlign: 'right',
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
  yearNavigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  yearNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  yearNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  yearNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  currentYearContainer: {
    alignItems: 'center',
  },
  currentYear: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  currentYearLabel: {
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
  },
  annualCalendarContainer: {
    marginBottom: 16,
  },
  monthsGridWrapper: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  monthGridContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: (width - 48) / 2, // اثنان في كل صف بدلاً من ثلاثة
    marginHorizontal: 4,
    marginVertical: 4,
  },
  monthGridHeader: {
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  monthGridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  monthGridInfo: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
  },
  currentMonthIndicator: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -6,
  },
  weekdaysRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  dayCell: {
    width: `${100/7}%`,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
    margin: 0.5,
  },
  todayCell: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  dayCellText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingIndicator: {
    marginLeft: 8,
    animation: 'spin 1s linear infinite',
  },
  refreshButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
  },
  resetYearButton: {
    marginTop: 4,
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
  },
  resetYearText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

});
