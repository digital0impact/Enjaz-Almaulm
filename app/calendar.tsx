
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function CalendarScreen() {
  const router = useRouter();

  const getCurrentDate = () => {
    const today = new Date();
    const gregorian = today.toLocaleDateString('ar-SA');
    const hijri = today.toLocaleDateString('ar-SA-u-ca-islamic');
    return { gregorian, hijri };
  };

  const handleMonthlyCalendar = () => {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    // إنشاء تقويم الشهر
    let calendarDays = '';
    let dayCounter = 1;
    
    // أسماء أيام الأسبوع
    calendarDays += 'ح   ن   ث   ر   خ   ج   س\n';
    calendarDays += '―――――――――――――――――――――\n';
    
    // إضافة الأسابيع
    for (let week = 0; week < 6; week++) {
      let weekRow = '';
      for (let day = 0; day < 7; day++) {
        const currentDayPosition = week * 7 + day;
        if (currentDayPosition < startDayOfWeek || dayCounter > daysInMonth) {
          weekRow += '   ';
        } else {
          const dayStr = dayCounter < 10 ? ` ${dayCounter}` : `${dayCounter}`;
          // تمييز اليوم الحالي
          if (dayCounter === currentDate.getDate()) {
            weekRow += `[${dayStr}]`;
          } else {
            weekRow += ` ${dayStr}`;
          }
          dayCounter++;
        }
        if (day < 6) weekRow += ' ';
      }
      calendarDays += weekRow + '\n';
      if (dayCounter > daysInMonth) break;
    }

    Alert.alert(
      '📅 التقويم الشهري',
      `🗓️ ${currentDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}\n\n` +
      `${calendarDays}\n` +
      `📝 ملاحظات:\n` +
      `• اليوم الحالي محاط بأقواس [${currentDate.getDate()}]\n` +
      `• ح=الأحد، ن=الاثنين، ث=الثلاثاء، ر=الأربعاء\n` +
      `• خ=الخميس، ج=الجمعة، س=السبت`,
      [
        {
          text: '📅 التقويم الهجري',
          onPress: () => handleHijriCalendar()
        },
        {
          text: '📋 إضافة حدث',
          onPress: () => Alert.alert('إضافة حدث', 'سيتم فتح نموذج إضافة حدث جديد للتقويم')
        },
        {
          text: '📊 عرض الأحداث',
          onPress: () => handleViewEvents()
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const handleHijriCalendar = () => {
    Alert.alert(
      '🌙 التقويم الهجري',
      `📅 السنة الهجرية: 1446\n` +
      `🗓️ الشهر الحالي: ربيع الآخر 1446\n\n` +
      `📋 معلومات مهمة:\n` +
      `• بداية الشهر الهجري تعتمد على رؤية الهلال\n` +
      `• السنة الهجرية تحتوي على 354 يوماً تقريباً\n` +
      `• الفرق بين السنة الهجرية والميلادية حوالي 11 يوماً\n\n` +
      `🌙 الأشهر الهجرية:\n` +
      `محرم، صفر، ربيع الأول، ربيع الآخر،\n` +
      `جمادى الأولى، جمادى الآخرة، رجب، شعبان،\n` +
      `رمضان، شوال، ذو القعدة، ذو الحجة`,
      [
        {
          text: '🕌 الشهور المقدسة',
          onPress: () => Alert.alert(
            'الشهور المقدسة',
            '🕌 الأشهر الحرم في الإسلام:\n\n' +
            '• ذو القعدة\n• ذو الحجة\n• محرم\n• رجب\n\n' +
            'هذه الأشهر محرم فيها القتال وهي أشهر مقدسة'
          )
        },
        {
          text: '🌙 رمضان 1446',
          onPress: () => Alert.alert(
            'شهر رمضان المبارك',
            '🌙 معلومات شهر رمضان 1446:\n\n' +
            '📅 بداية رمضان المتوقعة: فبراير 2025\n' +
            '🌅 عدد ساعات الصيام: متغيرة حسب المنطقة\n' +
            '🕌 ليلة القدر: في العشر الأواخر\n' +
            '🎉 عيد الفطر: 1 شوال 1446'
          )
        },
        {
          text: 'عودة',
          onPress: () => handleMonthlyCalendar()
        }
      ]
    );
  };

  const handleDateConverter = () => {
    Alert.alert(
      '🔄 محول التاريخ',
      '🔧 أداة تحويل التاريخ بين الهجري والميلادي\n\n' +
      '📝 الميزات المتاحة:\n' +
      '• تحويل من ميلادي إلى هجري\n' +
      '• تحويل من هجري إلى ميلادي\n' +
      '• حساب الفرق بين التواريخ\n' +
      '• عرض أيام الأسبوع\n' +
      '• حفظ التواريخ المفضلة\n\n' +
      '💡 مثال:\n' +
      '1 يناير 2025 = 1 رجب 1446',
      [
        {
          text: '📅 تحويل ميلادي لهجري',
          onPress: () => Alert.alert(
            'تحويل ميلادي لهجري',
            'أدخل التاريخ الميلادي:\n\nمثال: 15/01/2025\nالنتيجة: 15 رجب 1446\n\n⚠️ سيتم فتح واجهة إدخال التاريخ'
          )
        },
        {
          text: '🌙 تحويل هجري لميلادي',
          onPress: () => Alert.alert(
            'تحويل هجري لميلادي',
            'أدخل التاريخ الهجري:\n\nمثال: 15 رجب 1446\nالنتيجة: 15/01/2025\n\n⚠️ سيتم فتح واجهة إدخال التاريخ'
          )
        },
        {
          text: '📊 حاسبة المدة',
          onPress: () => Alert.alert(
            'حاسبة المدة',
            'احسب الفرق بين تاريخين:\n\n' +
            '• عدد الأيام\n• عدد الأسابيع\n• عدد الشهور\n• عدد السنوات\n\n' +
            'سيتم فتح أداة حساب المدة'
          )
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const handleImportantEvents = () => {
    Alert.alert(
      '📋 الأحداث المهمة',
      '🗓️ الأحداث المسجلة في التقويم:\n\n' +
      '🎯 الأحداث القادمة:\n' +
      '• 25 يناير - امتحان نهاية الفصل\n' +
      '• 30 يناير - اجتماع أولياء الأمور\n' +
      '• 22 فبراير - يوم التأسيس\n' +
      '• 30 مارس - عيد الفطر (متوقع)\n\n' +
      '📝 الأحداث الشخصية:\n' +
      '• 28 يناير - تسليم التقارير\n' +
      '• 15 فبراير - دورة تدريبية\n\n' +
      '🔔 تم إعداد تنبيهات لجميع الأحداث',
      [
        {
          text: '➕ إضافة حدث جديد',
          onPress: () => handleAddEvent()
        },
        {
          text: '✏️ تعديل الأحداث',
          onPress: () => Alert.alert('تعديل الأحداث', 'سيتم فتح قائمة الأحداث للتعديل والحذف')
        },
        {
          text: '📱 مزامنة مع الهاتف',
          onPress: () => Alert.alert('مزامنة', 'سيتم مزامنة الأحداث مع تقويم الهاتف الشخصي')
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const handleAddEvent = () => {
    Alert.alert(
      '➕ إضافة حدث جديد',
      '📝 اختر نوع الحدث:',
      [
        {
          text: '📚 حدث دراسي',
          onPress: () => Alert.alert(
            'حدث دراسي',
            'تفاصيل الحدث الدراسي:\n\n' +
            '📝 العنوان: مطلوب\n' +
            '📅 التاريخ: مطلوب\n' +
            '⏰ الوقت: اختياري\n' +
            '📋 الوصف: اختياري\n' +
            '🔔 التنبيه: مفعل تلقائياً\n\n' +
            '✅ تم حفظ الحدث بنجاح'
          )
        },
        {
          text: '🎉 حدث شخصي',
          onPress: () => Alert.alert(
            'حدث شخصي',
            'تفاصيل الحدث الشخصي:\n\n' +
            '📝 العنوان: مطلوب\n' +
            '📅 التاريخ: مطلوب\n' +
            '⏰ الوقت: اختياري\n' +
            '🔄 التكرار: اختياري\n' +
            '🔔 التنبيه: حسب الاختيار\n\n' +
            '✅ تم حفظ الحدث بنجاح'
          )
        },
        {
          text: '📋 مهمة عمل',
          onPress: () => Alert.alert(
            'مهمة عمل',
            'تفاصيل مهمة العمل:\n\n' +
            '📝 العنوان: مطلوب\n' +
            '📅 تاريخ التسليم: مطلوب\n' +
            '⭐ الأولوية: عالي/متوسط/منخفض\n' +
            '👥 المسؤول: اختياري\n' +
            '🔔 تذكير قبل: 1 يوم\n\n' +
            '✅ تم حفظ المهمة بنجاح'
          )
        },
        {
          text: 'عودة',
          onPress: () => handleImportantEvents()
        }
      ]
    );
  };

  const handleViewEvents = () => {
    Alert.alert(
      '📊 عرض الأحداث',
      '🗓️ أحداث الأسبوع الحالي:\n\n' +
      '🔴 الأحد 19 يناير:\n• لا توجد أحداث\n\n' +
      '🟡 الاثنين 20 يناير:\n• اجتماع المعلمين - 2:00 م\n\n' +
      '🟢 الثلاثاء 21 يناير:\n• حصة إضافية - 3:00 م\n\n' +
      '🔵 الأربعاء 22 يناير:\n• ورشة عمل - 10:00 ص\n\n' +
      '🟠 الخميس 23 يناير:\n• تقييم الطلاب - طوال اليوم\n\n' +
      '🟣 الجمعة 24 يناير:\n• إجازة أسبوعية\n\n' +
      '⚫ السبت 25 يناير:\n• امتحان نهائي - 8:00 ص',
      [
        {
          text: '📅 الأسبوع القادم',
          onPress: () => Alert.alert(
            'الأسبوع القادم',
            'أحداث الأسبوع من 26 يناير - 1 فبراير:\n\n' +
            '• 26 يناير: مراجعة الدرجات\n' +
            '• 28 يناير: تسليم التقارير\n' +
            '• 30 يناير: اجتماع أولياء الأمور\n' +
            '• 1 فبراير: بداية الفصل الثاني'
          )
        },
        {
          text: '📋 عرض شهري',
          onPress: () => handleMonthlyCalendar()
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const handleCalendarSettings = () => {
    Alert.alert(
      '⚙️ إعدادات التقويم',
      '🔧 إعدادات التقويم الحالية:\n\n' +
      '📅 التقويم الافتراضي: الميلادي\n' +
      '🌙 عرض التقويم الهجري: مفعل\n' +
      '🔔 التنبيهات: مفعلة\n' +
      '⏰ تنبيه افتراضي: 15 دقيقة قبل الحدث\n' +
      '📱 مزامنة مع الهاتف: مفعلة\n' +
      '🌍 المنطقة الزمنية: الرياض (UTC+3)\n' +
      '📊 عرض نهاية الأسبوع: مفعل\n' +
      '🎨 سمة التقويم: افتراضية',
      [
        {
          text: '🔄 تغيير التقويم الافتراضي',
          onPress: () => Alert.alert(
            'التقويم الافتراضي',
            'اختر التقويم الافتراضي:\n\n' +
            '📅 الميلادي (حالياً)\n' +
            '🌙 الهجري\n' +
            '🔄 عرض الاثنين معاً\n\n' +
            'سيتم تطبيق التغيير على جميع التقويمات'
          )
        },
        {
          text: '🔔 إعدادات التنبيهات',
          onPress: () => Alert.alert(
            'إعدادات التنبيهات',
            '🔔 خيارات التنبيهات:\n\n' +
            '⏰ وقت التنبيه الافتراضي:\n' +
            '• 5 دقائق قبل الحدث\n' +
            '• 15 دقيقة قبل الحدث ✓\n' +
            '• 30 دقيقة قبل الحدث\n' +
            '• ساعة قبل الحدث\n' +
            '• يوم قبل الحدث\n\n' +
            '🔊 صوت التنبيه: الافتراضي\n' +
            '📳 اهتزاز: مفعل'
          )
        },
        {
          text: '🎨 تخصيص المظهر',
          onPress: () => Alert.alert(
            'تخصيص المظهر',
            '🎨 خيارات المظهر:\n\n' +
            '🌈 السمات المتاحة:\n' +
            '• السمة الافتراضية ✓\n' +
            '• السمة الداكنة\n' +
            '• السمة الملونة\n' +
            '• السمة البسيطة\n\n' +
            '📱 تتبع سمة النظام: مفعل\n' +
            '🔤 حجم الخط: متوسط\n' +
            '📊 عرض الأرقام: عربي'
          )
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const { gregorian, hijri } = getCurrentDate();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.left" color="#fff" />
        </TouchableOpacity>
        <IconSymbol size={60} name="calendar.badge.plus" color="#fff" />
        <ThemedText type="title" style={styles.title}>
          التقويم الهجري والميلادي
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          عرض التواريخ الهجرية والميلادية مع التحويل بينهما
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.dateCard}>
          <ThemedText type="subtitle" style={styles.dateTitle}>
            📅 التاريخ اليوم
          </ThemedText>
          <ThemedView style={styles.dateInfo}>
            <ThemedView style={styles.dateRow}>
              <ThemedText style={styles.dateLabel}>التاريخ الميلادي:</ThemedText>
              <ThemedText style={styles.dateValue}>{gregorian}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.dateRow}>
              <ThemedText style={styles.dateLabel}>التاريخ الهجري:</ThemedText>
              <ThemedText style={styles.dateValue}>{hijri}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.actionsList}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            أدوات التقويم
          </ThemedText>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleMonthlyCalendar}
          >
            <ThemedView style={styles.cardContent}>
              <ThemedView style={[styles.iconContainer, { backgroundColor: '#4CAF5015' }]}>
                <IconSymbol size={32} name="calendar" color="#4CAF50" />
              </ThemedView>
              <ThemedView style={styles.cardText}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  عرض التقويم الشهري
                </ThemedText>
                <ThemedText style={styles.cardDescription}>
                  عرض التقويم الشهري مع تمييز اليوم الحالي
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleDateConverter}
          >
            <ThemedView style={styles.cardContent}>
              <ThemedView style={[styles.iconContainer, { backgroundColor: '#2196F315' }]}>
                <IconSymbol size={32} name="arrow.2.squarepath" color="#2196F3" />
              </ThemedView>
              <ThemedView style={styles.cardText}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  محول التاريخ
                </ThemedText>
                <ThemedText style={styles.cardDescription}>
                  تحويل التواريخ بين الهجري والميلادي
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleImportantEvents}
          >
            <ThemedView style={styles.cardContent}>
              <ThemedView style={[styles.iconContainer, { backgroundColor: '#FF980015' }]}>
                <IconSymbol size={32} name="calendar.badge.clock" color="#FF9800" />
              </ThemedView>
              <ThemedView style={styles.cardText}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  الأحداث المهمة
                </ThemedText>
                <ThemedText style={styles.cardDescription}>
                  عرض وإدارة الأحداث والمناسبات المهمة
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCalendarSettings}
          >
            <ThemedView style={styles.cardContent}>
              <ThemedView style={[styles.iconContainer, { backgroundColor: '#9C27B015' }]}>
                <IconSymbol size={32} name="gear" color="#9C27B0" />
              </ThemedView>
              <ThemedView style={styles.cardText}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  إعدادات التقويم
                </ThemedText>
                <ThemedText style={styles.cardDescription}>
                  تخصيص إعدادات التقويم والتنبيهات
                </ThemedText>
              </ThemedView>
            </ThemedView>
            <IconSymbol size={16} name="chevron.left" color="#666" />
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
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
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
  dateCard: {
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
  dateTitle: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#4CAF50',
  },
  dateInfo: {
    gap: 10,
  },
  dateRow: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  actionsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
    color: '#4CAF50',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: I18nManager.isRTL ? 0 : 15,
    marginRight: I18nManager.isRTL ? 15 : 0,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    textAlign: 'right',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'right',
    color: '#666',
  },
});
