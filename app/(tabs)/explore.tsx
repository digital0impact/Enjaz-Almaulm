import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ToolsScreen() {
  const getCurrentDate = () => {
    const today = new Date();
    const gregorian = today.toLocaleDateString('ar-SA');
    const hijri = today.toLocaleDateString('ar-SA-u-ca-islamic');
    return { gregorian, hijri };
  };

  const handleAbsenceManagement = () => {
    // نموذج بيانات لسجلات الغياب
    const absenceStats = {
      totalAbsences: 8,
      withExcuse: 5,
      withoutExcuse: 3,
      thisMonth: 3
    };

    Alert.alert(
      'إدارة الغياب',
      `📊 إحصائيات الغياب الحالية:\n` +
      `• إجمالي أيام الغياب: ${absenceStats.totalAbsences} يوم\n` +
      `• غياب بعذر: ${absenceStats.withExcuse} أيام\n` +
      `• غياب بدون عذر: ${absenceStats.withoutExcuse} أيام\n` +
      `• غياب هذا الشهر: ${absenceStats.thisMonth} أيام\n\n` +
      `اختر العملية المطلوبة:`,
      [
        {
          text: 'إضافة غياب جديد',
          onPress: () => handleNewAbsence()
        },
        {
          text: 'عرض سجلات الغياب',
          onPress: () => handleViewAbsenceRecords()
        },
        {
          text: 'تقرير شهري',
          onPress: () => handleMonthlyReport()
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

  const handleNewAbsence = () => {
    Alert.alert(
      'إضافة غياب جديد',
      'اختر نوع الغياب:',
      [
        {
          text: 'غياب بعذر مرضي',
          onPress: () => Alert.alert(
            'غياب بعذر مرضي',
            'تم حفظ غياب بعذر مرضي\n' +
            '📅 التاريخ: اليوم\n' +
            '⏰ المدة: يوم كامل\n' +
            '📋 النوع: مرضي (بعذر)\n' +
            '✅ تم تسجيل الغياب بنجاح'
          )
        },
        {
          text: 'غياب بعذر شخصي',
          onPress: () => Alert.alert(
            'غياب بعذر شخصي',
            'تم حفظ غياب بعذر شخصي\n' +
            '📅 التاريخ: اليوم\n' +
            '⏰ المدة: يوم كامل\n' +
            '📋 النوع: شخصي (بعذر)\n' +
            '✅ تم تسجيل الغياب بنجاح'
          )
        },
        {
          text: 'غياب بدون عذر',
          onPress: () => Alert.alert(
            'غياب بدون عذر',
            'تم حفظ غياب بدون عذر\n' +
            '📅 التاريخ: اليوم\n' +
            '⏰ المدة: يوم كامل\n' +
            '📋 النوع: بدون عذر\n' +
            '⚠️ تم تسجيل الغياب بنجاح'
          )
        },
        {
          text: 'عودة',
          onPress: () => handleAbsenceManagement()
        }
      ]
    );
  };

  const handleViewAbsenceRecords = () => {
    const sampleRecords = [
      '📅 15/01/2025 - غياب مرضي (بعذر)',
      '📅 12/01/2025 - غياب شخصي (بعذر)', 
      '📅 08/01/2025 - غياب بدون عذر',
      '📅 03/01/2025 - غياب مرضي (بعذر)',
      '📅 28/12/2024 - غياب شخصي (بعذر)'
    ];

    Alert.alert(
      'سجلات الغياب',
      '📋 آخر 5 سجلات غياب:\n\n' + sampleRecords.join('\n') + 
      '\n\n💡 لعرض التفاصيل الكاملة والتعديل',
      [
        {
          text: 'تصدير التقرير',
          onPress: () => Alert.alert('تصدير', 'سيتم تصدير جميع سجلات الغياب إلى ملف Excel')
        },
        {
          text: 'تصفية السجلات',
          onPress: () => Alert.alert('تصفية', 'سيتم فتح خيارات التصفية حسب:\n• التاريخ\n• نوع الغياب\n• وجود العذر')
        },
        {
          text: 'عودة',
          onPress: () => handleAbsenceManagement()
        }
      ]
    );
  };

  const handleMonthlyReport = () => {
    Alert.alert(
      'التقرير الشهري',
      '📊 تقرير غياب شهر يناير 2025:\n\n' +
      '📈 الإحصائيات:\n' +
      '• إجمالي أيام الغياب: 3 أيام\n' +
      '• نسبة الحضور: 87%\n' +
      '• غياب بعذر: 2 يوم\n' +
      '• غياب بدون عذر: 1 يوم\n\n' +
      '📋 التفاصيل:\n' +
      '• أكثر أنواع الغياب: مرضي\n' +
      '• متوسط أيام الغياب الشهرية: 2.5 يوم',
      [
        {
          text: 'مقارنة بالأشهر السابقة',
          onPress: () => Alert.alert('مقارنة', 'سيتم عرض مقارنة شاملة مع الأشهر السابقة والإحصائيات السنوية')
        },
        {
          text: 'طباعة التقرير',
          onPress: () => Alert.alert('طباعة', 'سيتم إعداد التقرير الشهري للطباعة بتنسيق PDF')
        },
        {
          text: 'عودة',
          onPress: () => handleAbsenceManagement()
        }
      ]
    );
  };

  const handleOfficialHolidays = () => {
    const holidays = [
      '🎉 رأس السنة الميلادية - 1 يناير',
      '🇸🇦 يوم التأسيس - 22 فبراير',
      '🇸🇦 اليوم الوطني السعودي - 23 سبتمبر',
      '🌙 عيد الفطر المبارك - 1-3 شوال (متغير)',
      '🕋 عيد الأضحى المبارك - 10-13 ذو الحجة (متغير)',
      '📅 يوم عرفة - 9 ذو الحجة (متغير)',
      '🎯 يوم الرياضة السعودي - 11 فبراير'
    ];

    Alert.alert(
      'الإجازات الرسمية',
      '📋 قائمة الإجازات الرسمية في المملكة العربية السعودية:\n\n' + 
      holidays.join('\n\n') +
      '\n\n💡 اختر للمزيد من التفاصيل:',
      [
        {
          text: 'الإجازات الثابتة',
          onPress: () => handleFixedHolidays()
        },
        {
          text: 'الإجازات المتغيرة',
          onPress: () => handleVariableHolidays()
        },
        {
          text: 'التقويم السنوي',
          onPress: () => handleYearlyCalendar()
        },
        {
          text: 'إغلاق',
          style: 'cancel'
        }
      ]
    );
  };

  const handleFixedHolidays = () => {
    Alert.alert(
      'الإجازات الثابتة',
      '📅 الإجازات ذات التواريخ الثابتة:\n\n' +
      '🎉 رأس السنة الميلادية\n' +
      '📅 التاريخ: 1 يناير من كل عام\n' +
      '⏰ المدة: يوم واحد\n' +
      '📋 النوع: إجازة رسمية\n\n' +
      '🇸🇦 يوم التأسيس\n' +
      '📅 التاريخ: 22 فبراير من كل عام\n' +
      '⏰ المدة: يوم واحد\n' +
      '📋 النوع: إجازة وطنية\n\n' +
      '🇸🇦 اليوم الوطني السعودي\n' +
      '📅 التاريخ: 23 سبتمبر من كل عام\n' +
      '⏰ المدة: يوم واحد\n' +
      '📋 النوع: إجازة وطنية\n\n' +
      '🎯 يوم الرياضة السعودي\n' +
      '📅 التاريخ: 11 فبراير من كل عام\n' +
      '⏰ المدة: يوم واحد\n' +
      '📋 النوع: إجازة رياضية',
      [
        {
          text: 'تذكير بالإجازات',
          onPress: () => Alert.alert('تذكير', 'سيتم إعداد تذكير قبل كل إجازة ثابتة')
        },
        {
          text: 'عودة',
          onPress: () => handleOfficialHolidays()
        }
      ]
    );
  };

  const handleVariableHolidays = () => {
    Alert.alert(
      'الإجازات المتغيرة',
      '🌙 الإجازات التي تعتمد على التقويم الهجري:\n\n' +
      '🌟 عيد الفطر المبارك\n' +
      '📅 التاريخ: 1-3 شوال من كل عام هجري\n' +
      '⏰ المدة: 3 أيام\n' +
      '📋 النوع: إجازة دينية\n' +
      '🔄 التاريخ الميلادي: متغير سنوياً\n\n' +
      '🕋 عيد الأضحى المبارك\n' +
      '📅 التاريخ: 10-13 ذو الحجة من كل عام هجري\n' +
      '⏰ المدة: 4 أيام\n' +
      '📋 النوع: إجازة دينية\n' +
      '🔄 التاريخ الميلادي: متغير سنوياً\n\n' +
      '⛰️ يوم عرفة\n' +
      '📅 التاريخ: 9 ذو الحجة من كل عام هجري\n' +
      '⏰ المدة: يوم واحد\n' +
      '📋 النوع: إجازة دينية\n' +
      '🔄 التاريخ الميلادي: متغير سنوياً',
      [
        {
          text: 'تواريخ هذا العام',
          onPress: () => Alert.alert(
            'تواريخ 2025',
            '📅 التواريخ المتوقعة للعام 2025:\n\n' +
            '🌟 عيد الفطر: 30 مارس - 1 أبريل 2025\n' +
            '⛰️ يوم عرفة: 5 يونيو 2025\n' +
            '🕋 عيد الأضحى: 6-9 يونيو 2025\n\n' +
            '⚠️ التواريخ تقريبية وتعتمد على رؤية الهلال'
          )
        },
        {
          text: 'تحويل التواريخ',
          onPress: () => Alert.alert('تحويل', 'سيتم فتح أداة تحويل التواريخ الهجرية إلى ميلادية')
        },
        {
          text: 'عودة',
          onPress: () => handleOfficialHolidays()
        }
      ]
    );
  };

  const handleYearlyCalendar = () => {
    Alert.alert(
      'التقويم السنوي للإجازات',
      '📊 ملخص إجازات العام 2025:\n\n' +
      '📅 يناير:\n• 1 يناير - رأس السنة الميلادية\n\n' +
      '📅 فبراير:\n• 11 فبراير - يوم الرياضة\n• 22 فبراير - يوم التأسيس\n\n' +
      '📅 مارس/أبريل:\n• 30 مارس - 1 أبريل - عيد الفطر (متوقع)\n\n' +
      '📅 يونيو:\n• 5 يونيو - يوم عرفة (متوقع)\n• 6-9 يونيو - عيد الأضحى (متوقع)\n\n' +
      '📅 سبتمبر:\n• 23 سبتمبر - اليوم الوطني\n\n' +
      '📊 إجمالي أيام الإجازات: 12-13 يوم\n' +
      '🎯 الإجازات الطويلة: عيد الأضحى (4 أيام)',
      [
        {
          text: 'تصدير التقويم',
          onPress: () => Alert.alert('تصدير', 'سيتم تصدير التقويم السنوي بصيغة PDF')
        },
        {
          text: 'إضافة للتقويم الشخصي',
          onPress: () => Alert.alert('إضافة', 'سيتم إضافة جميع الإجازات لتقويم الهاتف')
        },
        {
          text: 'عودة',
          onPress: () => handleOfficialHolidays()
        }
      ]
    );
  };

  const handleToolPress = (tool: string) => {
    if (tool === 'إدارة الغياب') {
      handleAbsenceManagement();
    } else if (tool === 'التقويم الهجري والميلادي') {
      const { gregorian, hijri } = getCurrentDate();
      Alert.alert(
        'التقويم الهجري والميلادي',
        `التاريخ الميلادي: ${gregorian}\nالتاريخ الهجري: ${hijri}`,
        [
          {
            text: 'محول التاريخ',
            onPress: () => Alert.alert('محول التاريخ', 'سيتم فتح أداة تحويل التاريخ بين الهجري والميلادي')
          },
          {
            text: 'التقويم الشهري',
            onPress: () => Alert.alert('التقويم الشهري', 'سيتم عرض التقويم الشهري بالتاريخين الهجري والميلادي')
          },
          {
            text: 'إغلاق',
            style: 'cancel'
          }
        ]
      );
    } else if (tool === 'الإجازات الرسمية') {
      handleOfficialHolidays();
    } else {
      Alert.alert('قريباً', `أداة ${tool} ستكون متاحة قريباً`);
    }
  };

  const tools = [
    {
      id: 1,
      title: 'التقويم الهجري والميلادي',
      description: 'عرض التواريخ الهجرية والميلادية مع التحويل بينهما',
      icon: 'calendar.badge.plus',
      color: '#4CAF50',
      category: 'أساسية',
    },
    {
      id: 2,
      title: 'الإجازات الرسمية',
      description: 'قائمة بالإجازات الرسمية والمناسبات الوطنية',
      icon: 'calendar.badge.clock',
      color: '#FF9800',
      category: 'أساسية',
    },
    {
      id: 3,
      title: 'التنبيهات',
      description: 'إدارة التنبيهات والمذكرات المهمة',
      icon: 'bell.fill',
      color: '#F44336',
      category: 'أساسية',
    },
    {
      id: 4,
      title: 'إدارة الغياب',
      description: 'متتبع غياب المعلم',
      icon: 'person.crop.circle.badge.xmark',
      color: '#9C27B0',
      category: 'أساسية',
    },
  ];

  const categories = [...new Set(tools.map(tool => tool.category))];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="wrench.and.screwdriver.fill" color="#2196F3" />
        <ThemedText type="title" style={styles.title}>
          الأدوات المساعدة
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          مجموعة من الأدوات لتطوير وتحسين أدائك المهني
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {categories.map((category) => (
          <ThemedView key={category} style={styles.categorySection}>
            <ThemedView style={styles.toolsGrid}>
              {tools
                .filter(tool => tool.category === category)
                .map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.toolCard}
                    onPress={() => handleToolPress(tool.title)}
                  >
                    <IconSymbol size={16} name="chevron.left" color="#666666" />
                    <ThemedView style={styles.toolContent}>
                      <ThemedText type="defaultSemiBold" style={styles.toolTitle}>
                        {tool.title}
                      </ThemedText>
                      <ThemedText style={styles.toolDescription}>
                        {tool.description}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={[styles.iconContainer, { backgroundColor: `${tool.color}15` }]}>
                      <IconSymbol size={32} name={tool.icon as any} color={tool.color} />
                    </ThemedView>
                  </TouchableOpacity>
                ))}
            </ThemedView>
          </ThemedView>
        ))}

        <ThemedView style={styles.helpSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            المساعدة والدعم
          </ThemedText>

          <TouchableOpacity 
            style={styles.helpCard}
            onPress={() => Alert.alert('المساعدة', 'يمكنك التواصل معنا عبر البريد الإلكتروني')}
          >
            <ThemedText style={styles.helpText}>الأسئلة الشائعة</ThemedText>
            <IconSymbol size={24} name="questionmark.circle.fill" color="#4CAF50" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.helpCard}
            onPress={() => Alert.alert('الدعم الفني', 'سيتم التواصل معك قريباً')}
          >
            <ThemedText style={styles.helpText}>الدعم الفني</ThemedText>
            <IconSymbol size={24} name="phone.fill" color="#2196F3" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginVertical: 15,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  content: {
    marginBottom: 30,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    marginBottom: 10,
    textAlign: 'right',
    fontSize: 18,
  },
  toolsGrid: {
    flexDirection: 'column',
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolContent: {
    flex: 1,
    marginHorizontal: 15,
  },
  toolTitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  toolDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'right',
  },
  helpSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  helpText: {
    flex: 1,
    textAlign: 'right',
  },
});