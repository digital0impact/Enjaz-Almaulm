
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

  const handleAlertsManagement = () => {
    const alerts = [
      { id: 1, title: 'موعد الاختبار النهائي', date: '2025-01-25', time: '08:00', type: 'اختبار', active: true },
      { id: 2, title: 'اجتماع أولياء الأمور', date: '2025-01-30', time: '16:00', type: 'اجتماع', active: true },
      { id: 3, title: 'تسليم التقارير الشهرية', date: '2025-01-28', time: '14:00', type: 'مهمة', active: false },
      { id: 4, title: 'يوم التأسيس السعودي', date: '2025-02-22', time: '09:00', type: 'إجازة', active: true },
      { id: 5, title: 'ورشة التطوير المهني', date: '2025-02-05', time: '10:00', type: 'تدريب', active: true }
    ];

    const activeAlerts = alerts.filter(alert => alert.active).length;
    const totalAlerts = alerts.length;

    Alert.alert(
      'إدارة التنبيهات',
      `📊 إحصائيات التنبيهات:\n` +
      `• إجمالي التنبيهات: ${totalAlerts}\n` +
      `• التنبيهات النشطة: ${activeAlerts}\n` +
      `• التنبيهات المعطلة: ${totalAlerts - activeAlerts}\n\n` +
      `اختر العملية المطلوبة:`,
      [
        {
          text: 'عرض جميع التنبيهات',
          onPress: () => handleViewAllAlerts(alerts)
        },
        {
          text: 'إضافة تنبيه جديد',
          onPress: () => handleAddNewAlert()
        },
        {
          text: 'التنبيهات النشطة',
          onPress: () => handleActiveAlerts(alerts.filter(alert => alert.active))
        },
        {
          text: 'إعدادات التنبيهات',
          onPress: () => handleAlertSettings()
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

  const handleViewAllAlerts = (alerts: any[]) => {
    const alertsList = alerts.map(alert => 
      `${alert.active ? '🔔' : '🔕'} ${alert.title}\n` +
      `📅 ${alert.date} - ⏰ ${alert.time}\n` +
      `🏷️ النوع: ${alert.type}\n` +
      `${alert.active ? '✅ نشط' : '⏸️ معطل'}`
    ).join('\n\n');

    Alert.alert(
      'جميع التنبيهات',
      `📋 قائمة التنبيهات الكاملة:\n\n${alertsList}`,
      [
        {
          text: 'تصفية حسب النوع',
          onPress: () => handleFilterAlerts(alerts)
        },
        {
          text: 'تصدير القائمة',
          onPress: () => Alert.alert('تصدير', 'سيتم تصدير قائمة التنبيهات إلى ملف PDF')
        },
        {
          text: 'تعديل تنبيه',
          onPress: () => handleEditAlert(alerts)
        },
        {
          text: 'عودة',
          onPress: () => handleAlertsManagement()
        }
      ]
    );
  };

  const handleAddNewAlert = () => {
    Alert.alert(
      'إضافة تنبيه جديد',
      'اختر نوع التنبيه الجديد:',
      [
        {
          text: '📚 تنبيه دراسي',
          onPress: () => handleCreateAlert('دراسي')
        },
        {
          text: '👥 تنبيه اجتماع',
          onPress: () => handleCreateAlert('اجتماع')
        },
        {
          text: '📝 تنبيه مهمة',
          onPress: () => handleCreateAlert('مهمة')
        },
        {
          text: '🎯 تنبيه شخصي',
          onPress: () => handleCreateAlert('شخصي')
        },
        {
          text: '🏖️ تنبيه إجازة',
          onPress: () => handleCreateAlert('إجازة')
        },
        {
          text: 'عودة',
          onPress: () => handleAlertsManagement()
        }
      ]
    );
  };

  const handleCreateAlert = (type: string) => {
    Alert.alert(
      `إضافة تنبيه ${type}`,
      `سيتم فتح نموذج إنشاء تنبيه جديد من نوع "${type}":\n\n` +
      `📝 العنوان: مطلوب\n` +
      `📅 التاريخ: مطلوب\n` +
      `⏰ الوقت: مطلوب\n` +
      `📋 الوصف: اختياري\n` +
      `🔔 نوع التنبيه: ${type}\n` +
      `🔄 التكرار: اختياري\n\n` +
      `✅ تم حفظ التنبيه بنجاح`,
      [
        {
          text: 'حفظ وإضافة آخر',
          onPress: () => handleAddNewAlert()
        },
        {
          text: 'حفظ وإنهاء',
          onPress: () => Alert.alert('نجح الحفظ', `تم إضافة تنبيه ${type} جديد بنجاح`)
        },
        {
          text: 'إلغاء',
          onPress: () => handleAddNewAlert()
        }
      ]
    );
  };

  const handleActiveAlerts = (activeAlerts: any[]) => {
    if (activeAlerts.length === 0) {
      Alert.alert('التنبيهات النشطة', 'لا توجد تنبيهات نشطة حالياً');
      return;
    }

    const alertsList = activeAlerts.map(alert => 
      `🔔 ${alert.title}\n📅 ${alert.date} - ⏰ ${alert.time}\n🏷️ ${alert.type}`
    ).join('\n\n');

    Alert.alert(
      'التنبيهات النشطة',
      `📱 التنبيهات النشطة (${activeAlerts.length}):\n\n${alertsList}`,
      [
        {
          text: 'إيقاف تنبيه',
          onPress: () => Alert.alert('إيقاف', 'اختر التنبيه المراد إيقافه')
        },
        {
          text: 'تأجيل تنبيه',
          onPress: () => Alert.alert('تأجيل', 'سيتم تأجيل التنبيه لـ 15 دقيقة')
        },
        {
          text: 'عودة',
          onPress: () => handleAlertsManagement()
        }
      ]
    );
  };

  const handleFilterAlerts = (alerts: any[]) => {
    const types = [...new Set(alerts.map(alert => alert.type))];
    
    Alert.alert(
      'تصفية التنبيهات',
      'اختر نوع التنبيهات لعرضها:',
      [
        ...types.map(type => ({
          text: `${type} (${alerts.filter(alert => alert.type === type).length})`,
          onPress: () => {
            const filteredAlerts = alerts.filter(alert => alert.type === type);
            const alertsList = filteredAlerts.map(alert => 
              `${alert.active ? '🔔' : '🔕'} ${alert.title}\n📅 ${alert.date} - ⏰ ${alert.time}`
            ).join('\n\n');
            
            Alert.alert(
              `تنبيهات ${type}`,
              alertsList,
              [
                { text: 'عودة للتصفية', onPress: () => handleFilterAlerts(alerts) },
                { text: 'إغلاق', style: 'cancel' }
              ]
            );
          }
        })),
        {
          text: 'عرض الكل',
          onPress: () => handleViewAllAlerts(alerts)
        },
        {
          text: 'عودة',
          onPress: () => handleAlertsManagement()
        }
      ]
    );
  };

  const handleEditAlert = (alerts: any[]) => {
    const alertsList = alerts.map(alert => 
      `${alert.id}. ${alert.title} (${alert.date})`
    ).join('\n');

    Alert.alert(
      'تعديل التنبيهات',
      `اختر التنبيه المراد تعديله:\n\n${alertsList}`,
      [
        {
          text: 'تعديل التنبيه الأول',
          onPress: () => Alert.alert(
            'تعديل التنبيه',
            `تعديل: ${alerts[0].title}\n\n` +
            `الخيارات المتاحة:\n` +
            `• تغيير العنوان\n` +
            `• تغيير التاريخ والوقت\n` +
            `• تغيير النوع\n` +
            `• تفعيل/إلغاء التفعيل\n` +
            `• حذف التنبيه`
          )
        },
        {
          text: 'تعديل متعدد',
          onPress: () => Alert.alert('تعديل متعدد', 'سيتم فتح واجهة تعديل التنبيهات المتعددة')
        },
        {
          text: 'عودة',
          onPress: () => handleViewAllAlerts(alerts)
        }
      ]
    );
  };

  const handleAlertSettings = () => {
    Alert.alert(
      'إعدادات التنبيهات',
      '⚙️ إعدادات التنبيهات العامة:\n\n' +
      '🔔 الصوت: مفعل\n' +
      '📳 الاهتزاز: مفعل\n' +
      '🕐 التنبيه المسبق: 15 دقيقة\n' +
      '🔄 التكرار التلقائي: معطل\n' +
      '🌙 عدم الإزعاج: 22:00 - 06:00\n' +
      '📱 إشعارات الشاشة: مفعل',
      [
        {
          text: 'تغيير الصوت',
          onPress: () => Alert.alert('صوت التنبيه', 'اختر صوت التنبيه المفضل')
        },
        {
          text: 'أوقات عدم الإزعاج',
          onPress: () => Alert.alert('عدم الإزعاج', 'حدد الأوقات التي لا تريد تلقي تنبيهات فيها')
        },
        {
          text: 'نسخ احتياطي',
          onPress: () => Alert.alert('نسخ احتياطي', 'سيتم إنشاء نسخة احتياطية من جميع التنبيهات')
        },
        {
          text: 'عودة',
          onPress: () => handleAlertsManagement()
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
    } else if (tool === 'التنبيهات') {
      handleAlertsManagement();
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

  const getToolUsageStats = () => {
    return {
      totalTools: tools.length,
      frequentlyUsed: 2,
      recentlyUsed: 3
    };
  };

  const stats = getToolUsageStats();

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
        <ThemedView style={styles.summaryCard}>
          <ThemedText type="subtitle" style={styles.summaryTitle}>
            إحصائيات الأدوات
          </ThemedText>
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.totalTools}</ThemedText>
              <ThemedText style={styles.statLabel}>إجمالي الأدوات</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.frequentlyUsed}</ThemedText>
              <ThemedText style={styles.statLabel}>الأكثر استخداماً</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.recentlyUsed}</ThemedText>
              <ThemedText style={styles.statLabel}>المستخدمة مؤخراً</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.toolsList}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            الأدوات المتاحة
          </ThemedText>

          {tools.map((tool, index) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => handleToolPress(tool.title)}
            >
              <ThemedView style={styles.cardHeader}>
                <ThemedView style={styles.cardTitleContainer}>
                  <ThemedText style={styles.itemNumber}>
                    {index + 1}.
                  </ThemedText>
                  <ThemedView style={styles.cardContent}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {tool.title}
                    </ThemedText>
                    <ThemedText style={styles.cardDescription}>
                      {tool.description}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={[styles.iconContainer, { backgroundColor: `${tool.color}15` }]}>
                  <IconSymbol size={32} name={tool.icon as any} color={tool.color} />
                </ThemedView>
              </ThemedView>

              <IconSymbol 
                size={16} 
                name="chevron.left" 
                color="#666666" 
                style={styles.expandIcon}
              />
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert('المساعدة والدعم', 'يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف للحصول على المساعدة')}
          >
            <IconSymbol size={20} name="questionmark.circle.fill" color="white" />
            <ThemedText style={styles.buttonText}>المساعدة والدعم</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.feedbackButton}
            onPress={() => Alert.alert('التقييم والاقتراحات', 'شاركنا رأيك واقتراحاتك لتحسين الأدوات')}
          >
            <IconSymbol size={20} name="star.fill" color="white" />
            <ThemedText style={styles.buttonText}>التقييم والاقتراحات</ThemedText>
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
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
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
  summaryCard: {
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
  summaryTitle: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#2196F3',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  toolsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
    color: '#2196F3',
  },
  toolCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 15,
  },
  cardTitleContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: I18nManager.isRTL ? 0 : 10,
    marginLeft: I18nManager.isRTL ? 10 : 0,
    minWidth: 25,
  },
  cardContent: {
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
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: I18nManager.isRTL ? 0 : 15,
    marginRight: I18nManager.isRTL ? 15 : 0,
  },
  expandIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  helpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
