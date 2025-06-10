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