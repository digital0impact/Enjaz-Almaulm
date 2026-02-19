import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Alert, Modal, View } from 'react-native';

// تطبيق RTL عند بدء الصفحة
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BackButton } from '@/components/BackButton';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { StorageService } from '@/services/StorageService';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import XLSX from 'xlsx';
import { 
  getTextDirection, 
  formatRTLText 
} from '@/utils/rtl-utils';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'يحتاج إلى تطوير' | 'صعوبات التعلم' | 'ضعف';
  lastUpdate: string;
  notes: string;
  remedialPlans?: RemedialPlan[];
  goals?: { text: string; progress: number }[];
  needs?: string[];
  evidence?: string[];
  averageProgress?: number;
}

interface RemedialPlan {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  startDate: string;
  endDate: string;
  status: 'نشط' | 'مكتمل' | 'معلق';
  progress: number; // 0-100
  goals?: string[];
  needs?: string[];
  evidence?: string[];
  notes?: string;
}

export default function RemedialPlansScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [activePlans, setActivePlans] = useState<(RemedialPlan & { studentName: string })[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ضعف');
  const [filteredPlans, setFilteredPlans] = useState<(RemedialPlan & { studentName: string })[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportModalData, setExportModalData] = useState<any>(null);
  const [excelDownloadReady, setExcelDownloadReady] = useState<{ url: string; name: string } | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');

  /** على الويب عرض التنبيهات في المتصفح لأن Alert.alert لا يظهر */
  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{ text: string; style?: 'default' | 'cancel'; onPress?: () => void }>
  ) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert([title, message].filter(Boolean).join('\n\n'));
      const action = buttons?.find((b) => b.onPress);
      if (action && action.text !== formatRTLText('حسناً')) {
        if (window.confirm(formatRTLText('هل تريد عرض خطط الاشتراك؟'))) action.onPress?.();
      }
      return;
    }
    Alert.alert(title, message, buttons);
  };

  const categories = [
    { key: 'ضعف', label: 'الضعف', color: '#9C27B0', icon: 'minus.circle.fill' },
    { key: 'تفوق', label: 'التفوق', color: '#4CAF50', icon: 'star.fill' },
    { key: 'صعوبات التعلم', label: 'صعوبات التعلم', color: '#F44336', icon: 'exclamationmark.triangle.fill' },
    { key: 'يحتاج إلى تطوير', label: 'يحتاج إلى تطوير', color: '#FF5722', icon: 'star' }
  ];

  const loadStudentsWithPlans = async () => {
    try {
      const stored = await AsyncStorage.getItem('students');
      if (stored) {
        const studentsData = JSON.parse(stored);
        console.log('Loaded students:', studentsData.length);
        
        // تحقق من وجود خطط علاجية
        const studentsWithPlans = studentsData.filter(student => 
          student.remedialPlans && student.remedialPlans.length > 0
        );
        console.log('Students with plans:', studentsWithPlans.length);
        
        setStudents(studentsData);

        // جمع جميع الخطط العلاجية مع أسماء الطلاب
        const allPlans: (RemedialPlan & { studentName: string })[] = [];
        studentsData.forEach((student: Student) => {
          if (student.remedialPlans && student.remedialPlans.length > 0) {
            student.remedialPlans.forEach((plan) => {
              allPlans.push({
                ...plan,
                studentName: student.name
              });
            });
          }
        });
        console.log('Total plans loaded:', allPlans.length);
        setActivePlans(allPlans);

        // تحديث الخطط المفلترة مباشرة
        const initialFilteredPlans = allPlans.filter(plan => {
          const student = studentsData.find(s => s.name === plan.studentName);
          return student && student.status === selectedCategory;
        });
        console.log('Initial filtered plans:', initialFilteredPlans.length);
        setFilteredPlans(initialFilteredPlans);
      } else {
        console.log('No students data found in storage');
        setStudents([]);
        setActivePlans([]);
        setFilteredPlans([]);
      }
    } catch (error) {
      console.error('Error loading students with plans:', error);
      showAlert(formatRTLText('خطأ'), formatRTLText('حدث خطأ أثناء تحميل البيانات'));
    }
  };

  useEffect(() => {
    loadStudentsWithPlans();
  }, []);

  useEffect(() => {
    const loadTeacherName = async () => {
      try {
        const basicData = await AsyncStorage.getItem('basicData');
        if (basicData) {
          const parsed = JSON.parse(basicData);
          if (parsed.fullName) setTeacherName(parsed.fullName);
        }
      } catch (_) {}
    };
    loadTeacherName();
  }, []);

  useEffect(() => {
    console.log('Category changed to:', selectedCategory);
    console.log('Active plans count:', activePlans.length);
    console.log('Students count:', students.length);

    const newFilteredPlans = activePlans.filter(plan => {
      const student = students.find(s => s.name === plan.studentName);
      const matches = student && student.status === selectedCategory;
      console.log('Student:', student?.name, 'Status:', student?.status, 'Matches:', matches);
      return matches;
    });

    console.log('New filtered plans count:', newFilteredPlans.length);
    setFilteredPlans(newFilteredPlans);
  }, [selectedCategory, activePlans, students]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return '#4CAF50';
      case 'مكتمل': return '#2196F3';
      case 'معلق': return '#FF9800';
      default: return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'نشط': return 'play.circle.fill';
      case 'مكتمل': return 'checkmark.circle.fill';
      case 'معلق': return 'pause.circle.fill';
      default: return 'circle';
    }
  };

  const generateExcelFile = async (data: any): Promise<string> => {
    const goalsText = (s: any) => {
      if (!s.goals?.length) return '-';
      return s.goals.map((g: any) => (typeof g === 'string' ? g : g.text)).join('، ');
    };
    const goalProgress = (s: any) => {
      if (!s.goals?.length) return '-';
      return `${Math.round(s.goals.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / s.goals.length)}%`;
    };

    const workbook = XLSX.utils.book_new();
    const tableHeaders = [
      ['اسم المتعلم', 'الصف', 'الأهداف', 'مدى تحقق الهدف', 'الاحتياجات', 'الشواهد', 'الملاحظات']
    ];
    const tableRows = (data.students || []).map((student: any) => [
      student.name || '-',
      student.grade || '-',
      goalsText(student),
      goalProgress(student),
      (student.needs || []).join('، ') || '-',
      (student.evidence || []).join('، ') || '-',
      student.notes || '-'
    ]);
    const titleRows = [
      ['تقرير الخطط العلاجية'],
      ['اسم المعلم: ' + (data.teacherName || 'غير محدد')],
      []
    ];
    if (data.categoryLabel) titleRows.push([`جدول: ${data.categoryLabel}`], []);
    const tableSheet = XLSX.utils.aoa_to_sheet([...titleRows, ...tableHeaders, ...tableRows]);
    tableSheet['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 35 }, { wch: 14 }, { wch: 35 }, { wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, tableSheet, 'جدول الفئة');

    const statsData = [
      ['تقرير الخطط العلاجية', data.categoryLabel || ''],
      ['اسم المعلم:', data.teacherName || 'غير محدد'],
      [],
      ['الإحصائيات العامة'],
      ['إجمالي المتعلمين', (data.students || []).length],
      ['لديهم خطط علاجية', (data.students || []).filter((s: any) => s.remedialPlans && s.remedialPlans.length > 0).length],
      ['الخطط النشطة', data.activePlans ?? 0],
      ['الخطط المكتملة', data.completedPlans ?? 0],
      ['الخطط المعلقة', data.pendingPlans ?? 0],
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'الإحصائيات');

    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    if (Platform.OS === 'web') {
      return wbout;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `الخطط_العلاجية_${timestamp}.xlsx`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      return filePath;
    } catch (error) {
      console.error('خطأ في إنشاء ملف الإكسل:', error);
      throw error;
    }
  };

  const getRemedialPlansReportHTML = (data: any): string => {
    const studentsList = data.students || [];
    const goalsText = (s: any) => {
      if (!s.goals?.length) return '-';
      return s.goals.map((g: any) => (typeof g === 'string' ? g : (g.text || ''))).join('، ');
    };
    const goalProgress = (s: any) => {
      if (!s.goals?.length) return '-';
      return `${Math.round(s.goals.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / s.goals.length)}%`;
    };
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 1cm; }
          body { 
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            color: #4CAF50;
            margin-bottom: 8px;
          }
          .teacher-name {
            font-size: 16px;
            color: #333;
            margin: 0 0 8px 0;
          }
          .stats {
            margin: 20px 0;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 8px;
          }
          .stats-title {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background-color: white;
            font-size: 12px;
          }
          .table th {
            background-color: #4CAF50;
            color: white;
            padding: 12px 8px;
            text-align: right;
            font-weight: bold;
          }
          .table td {
            padding: 8px;
            border: 1px solid #ddd;
            word-wrap: break-word;
          }
          .table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .section {
            margin-top: 30px;
            page-break-before: always;
          }
          .long-text {
            max-width: 200px;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير الخطط العلاجية${data.categoryLabel ? ' - ' + data.categoryLabel : ''}</h1>
          <p class="teacher-name">${data.teacherName || 'غير محدد'}</p>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <div class="stats">
          <h2 class="stats-title">الإحصائيات العامة</h2>
          <p>• إجمالي المتعلمين: ${studentsList.length}</p>
          <p>• لديهم خطط علاجية: ${studentsList.filter((s: any) => s.remedialPlans && s.remedialPlans.length > 0).length}</p>
          <p>• الخطط النشطة: ${data.activePlans ?? 0}</p>
          <p>• الخطط المكتملة: ${data.completedPlans ?? 0}</p>
          <p>• الخطط المعلقة: ${data.pendingPlans ?? 0}</p>
        </div>

        <h2 class="stats-title">جدول الفئة</h2>
        <table class="table">
          <thead>
            <tr>
              <th>اسم المتعلم</th>
              <th>الصف</th>
              <th>الأهداف</th>
              <th>مدى تحقق الهدف</th>
              <th>الاحتياجات</th>
              <th>الشواهد</th>
              <th>الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${studentsList.map((student: any) => `
              <tr>
                <td>${student.name || '-'}</td>
                <td>${student.grade || '-'}</td>
                <td class="long-text">${goalsText(student)}</td>
                <td>${goalProgress(student)}</td>
                <td class="long-text">${(student.needs || []).join('، ') || '-'}</td>
                <td class="long-text">${(student.evidence || []).join('، ') || '-'}</td>
                <td class="long-text">${student.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const generatePDFContent = async (data: any): Promise<string> => {
    const htmlContent = getRemedialPlansReportHTML(data);
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 842,
        height: 595,
      });
      return uri;
    } catch (error) {
      console.error('خطأ في إنشاء ملف PDF:', error);
      throw error;
    }
  };

  const exportTableData = async (data: any) => {
    try {
      let user = await AuthService.getCurrentUser();
      if (!user) user = await AuthService.checkAuthStatus();
      if (!user) {
        showAlert(
          formatRTLText('تسجيل الدخول مطلوب'),
          formatRTLText('يرجى تسجيل الدخول للسماح بتحميل الجداول.')
        );
        return;
      }
      const status = await SubscriptionService.checkSubscriptionStatus(user.id);
      if (!status?.features?.canExport) {
        showAlert(
          formatRTLText('ترقية الاشتراك مطلوبة'),
          formatRTLText('تصدير الجدول (Excel/PDF) متاح للاشتراك المدفوع. يرجى ترقية اشتراكك.'),
          [
            { text: formatRTLText('حسناً'), style: 'cancel' as const },
            { text: formatRTLText('عرض الخطط'), onPress: () => router.push('/subscription') }
          ]
        );
        return;
      }
    } catch (err) {
      console.error('Export table check error:', err);
      showAlert(
        formatRTLText('خطأ'),
        formatRTLText('تعذر التحقق من الصلاحية. يرجى المحاولة مرة أخرى.')
      );
      return;
    }
    setExportModalData(data);
    setExportModalVisible(true);
  };

  const doExportExcel = async () => {
    if (!exportModalData) return;
    setExportModalVisible(false);
    const data = { ...exportModalData };
    try {
      data.students = data.students.map((student: any) => ({
        ...student,
        averageProgress: student.remedialPlans?.length
          ? Math.round(student.remedialPlans.reduce((total: number, plan: any) => total + plan.progress, 0) / student.remedialPlans.length)
          : 0
      }));
      const result = await generateExcelFile(data);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const base64 = typeof result === 'string' ? result : '';
        if (!base64) {
          showAlert(formatRTLText('خطأ'), formatRTLText('لم يتم إنشاء بيانات الملف. تأكد من وجود بيانات للتصدير.'));
          setExportModalData(null);
          return;
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const name = `الخطط_العلاجية_${new Date().toISOString().slice(0, 10)}.xlsx`;
        setExcelDownloadReady({ url, name });
      } else {
        const filePath = result as string;
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'حفظ ملف Excel',
            UTI: 'com.microsoft.excel.xlsx'
          });
        }
        showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم إنشاء ملف Excel'));
      }
    } catch (error) {
      console.error('خطأ في تحميل Excel:', error);
      showAlert(formatRTLText('خطأ'), formatRTLText('حدث خطأ أثناء إنشاء ملف Excel'));
    }
    setExportModalData(null);
  };

  const doExportPDF = async () => {
    if (!exportModalData) return;
    setExportModalVisible(false);
    const data = { ...exportModalData };
    data.students = (data.students || []).map((student: any) => ({
      ...student,
      averageProgress: student.remedialPlans?.length
        ? Math.round(student.remedialPlans.reduce((total: number, plan: any) => total + plan.progress, 0) / student.remedialPlans.length)
        : 0
    }));
    setExportModalData(null);

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const htmlContent = getRemedialPlansReportHTML(data);
        const iframe = document.createElement('iframe');
        iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden');
        document.body.appendChild(iframe);
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const doPrint = () => {
          try {
            if (iframe.contentWindow) iframe.contentWindow.print();
          } catch (_) {}
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
        iframe.src = url;
        iframe.onload = () => setTimeout(doPrint, 400);
        setTimeout(() => { if (document.body.contains(iframe)) doPrint(); }, 3000);
        showAlert(
          formatRTLText('تم فتح نافذة الطباعة'),
          formatRTLText('اختر «حفظ كـ PDF» أو «Save as PDF» في نافذة الطباعة لحفظ التقرير.')
        );
      } catch (error) {
        console.error('خطأ في تحميل PDF:', error);
        showAlert(formatRTLText('خطأ'), formatRTLText('حدث خطأ أثناء فتح معاينة الطباعة'));
      }
      return;
    }

    try {
      const pdfUri = await generatePDFContent(data);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'حفظ ملف PDF',
          UTI: 'com.adobe.pdf'
        });
      }
      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم إنشاء ملف PDF'));
    } catch (error) {
      console.error('خطأ في تحميل PDF:', error);
      showAlert(formatRTLText('خطأ'), formatRTLText('حدث خطأ أثناء إنشاء ملف PDF'));
    }
  };

  const closeExcelDownload = () => {
    if (excelDownloadReady) {
      URL.revokeObjectURL(excelDownloadReady.url);
      setExcelDownloadReady(null);
    }
  };

  // حذف مصفوفة statusCategories
  // const statusCategories = [
  //   { key: 'جميع الحالات', label: 'جميع الحالات', color: '#666', icon: 'list.bullet' }
  // ];

  // حذف دالة getStudentsByStatus
  // const getStudentsByStatus = (status: string) => {
  //   if (status === 'جميع الحالات') {
  //     return students;
  //   }
  //   return students.filter(student => student.status === status);
  // };

  // حذف دالة getPlansByStatus
  // const getPlansByStatus = (status: string) => {
  //   if (status === 'جميع الحالات') {
  //     return activePlans;
  //   }
  //   return activePlans.filter(plan => {
  //     const student = students.find(s => s.name === plan.studentName);
  //     return student && student.status === status;
  //   });
  // };

  // دالة مساعدة للتحقق من وجود خطط للفئة المحددة
  const getPlansForCategory = (category: string) => {
    return students.filter(student => 
      student.status === category && 
      student.remedialPlans && 
      student.remedialPlans.length > 0
    ).length;
  };

  // تحديث تصيير الأزرار لعرض الجداول المنسدلة
  const renderCategoryButtons = () => {
  return (
    <ThemedView style={styles.categoriesGrid}>
      {categories.map((category, index) => {
        const plansCount = getPlansForCategory(category.key);
        const isExpanded = expandedCategory === category.key;
        const categoryStudents = students.filter(student => 
          student.status === category.key
        );
        
        console.log('Rendering category:', category.key);
        console.log('Is expanded:', isExpanded);
        console.log('Students count:', categoryStudents.length);
        
        return (
          <ThemedView key={category.key} style={styles.categoryWrapper}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                isExpanded && { backgroundColor: category.color },
              ]}
              onPress={() => {
                console.log('Category button pressed:', category.key);
                console.log('Current expanded category:', expandedCategory);
                setExpandedCategory(isExpanded ? null : category.key);
                setSelectedCategory(category.key);
              }}
            >
              <IconSymbol 
                size={24} 
                name={category.icon as any} 
                color={isExpanded ? '#fff' : category.color} 
              />
              <ThemedText style={[
                styles.categoryText,
                isExpanded && styles.selectedCategoryText
              ]}>
                {category.label}
              </ThemedText>
              <ThemedView style={[
                styles.categoryCount,
                isExpanded && { backgroundColor: '#ffffff33' }
              ]}>
                <ThemedText style={[
                  styles.categoryCountText,
                  isExpanded && { color: '#fff' }
                ]}>
                  {plansCount}
                </ThemedText>
              </ThemedView>
              <IconSymbol 
                size={20} 
                name={isExpanded ? "chevron.up" : "chevron.down"} 
                color={isExpanded ? '#fff' : '#666'} 
                style={styles.expandIcon}
              />
            </TouchableOpacity>

            {isExpanded && categoryStudents.length > 0 && (
              <ThemedView style={styles.expandedContent}>
            <ScrollView 
                  horizontal={true}
                  style={styles.tableScrollView}
                  contentContainerStyle={styles.tableScrollViewContent}
                  showsHorizontalScrollIndicator={true}
                >
                  <ThemedView style={styles.tableContainer}>
                    {/* عنوان الجدول مع زر التحميل */}
                    <ThemedView style={styles.tableHeaderSection}>
                      <ThemedText style={[styles.tableTitle, getTextDirection()]}>
                        {formatRTLText(category.label)}
                      </ThemedText>
                  <TouchableOpacity 
                        style={styles.downloadButton}
                        onPress={() => {
                          // تحضير البيانات للفئة الحالية فقط
                          const categoryData = {
                            categoryLabel: category.label,
                            teacherName: teacherName || 'غير محدد',
                            students: students.filter(s => s.status === category.key),
                            activePlans: students
                              .filter(s => s.status === category.key)
                              .reduce((total, student) => 
                                total + (student.remedialPlans?.filter(plan => plan.status === 'نشط').length || 0), 0),
                            completedPlans: students
                              .filter(s => s.status === category.key)
                              .reduce((total, student) => 
                                total + (student.remedialPlans?.filter(plan => plan.status === 'مكتمل').length || 0), 0),
                            pendingPlans: students
                              .filter(s => s.status === category.key)
                              .reduce((total, student) => 
                                total + (student.remedialPlans?.filter(plan => plan.status === 'معلق').length || 0), 0),
                          };
                          exportTableData(categoryData);
                        }}
                      >
                        <IconSymbol size={16} name="arrow.down.circle" color="#1c1f33" />
                        <ThemedText style={styles.downloadButtonText}>تحميل الجدول</ThemedText>
                  </TouchableOpacity>
                    </ThemedView>

                    {/* رأس الجدول */}
                    <ThemedView style={[styles.tableHeader, { direction: 'rtl' }]}>
                      {/* الملاحظات - أقصى اليسار */}
                      <ThemedView style={[styles.headerCell, { minWidth: 200, flex: 2 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>الملاحظات</ThemedText>
                      </ThemedView>
                      
                      {/* الشواهد */}
                      <ThemedView style={[styles.headerCell, { minWidth: 200, flex: 2 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>الشواهد</ThemedText>
                      </ThemedView>

                      {/* الاحتياجات */}
                      <ThemedView style={[styles.headerCell, { minWidth: 200, flex: 2 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>الاحتياجات</ThemedText>
                      </ThemedView>

                      {/* مدى تحقق الهدف */}
                      <ThemedView style={[styles.headerCell, { minWidth: 120, flex: 1.5 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>مدى تحقق الهدف</ThemedText>
                      </ThemedView>

                      {/* الأهداف */}
                      <ThemedView style={[styles.headerCell, { minWidth: 200, flex: 2 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>الأهداف</ThemedText>
                      </ThemedView>
                      
                      {/* الصف الدراسي */}
                      <ThemedView style={[styles.headerCell, { minWidth: 100, flex: 1 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>الصف الدراسي</ThemedText>
                      </ThemedView>

                      {/* اسم المتعلم - أقصى اليمين */}
                      <ThemedView style={[styles.headerCell, { minWidth: 150, flex: 2 }]}>
                        <ThemedText style={[styles.headerCellText, getTextDirection()]}>اسم المتعلم</ThemedText>
                      </ThemedView>
                    </ThemedView>

                    {/* محتوى الجدول */}
                    <ScrollView style={styles.tableBodyScroll}>
                      {categoryStudents.map((student, index) => (
                        <ThemedView 
                          key={student.id} 
                          style={[
                            styles.tableRow,
                            { backgroundColor: index % 2 === 0 ? '#F8F9FA' : '#FFFFFF' }
                          ]}
                        >
                          {/* الملاحظات - أقصى اليسار */}
                          <ThemedView style={[styles.cell, { minWidth: 200, flex: 2 }]}>
                            <ThemedText style={[styles.tableCellText, getTextDirection()]} numberOfLines={2}>
                              {formatRTLText(student.notes || '-')}
                            </ThemedText>
                          </ThemedView>

                          {/* الشواهد */}
                          <ThemedView style={[styles.cell, { minWidth: 200, flex: 2 }]}>
                            {student.evidence && student.evidence.length > 0 ? (
                              <ThemedView>
                                <ThemedText style={[styles.itemCount, getTextDirection()]}> 
                                  {formatRTLText(`${student.evidence.length} شواهد`)}
                                </ThemedText>
                                <ThemedText style={[styles.itemPreview, getTextDirection()]} numberOfLines={2}>
                                  {formatRTLText(student.evidence.join('، '))}
                                </ThemedText>
                              </ThemedView>
                            ) : (
                              <ThemedText style={[styles.tableCellText, getTextDirection()]}>-</ThemedText>
                            )}
                          </ThemedView>

                          {/* الاحتياجات */}
                          <ThemedView style={[styles.cell, { minWidth: 200, flex: 2 }]}>
                            {student.needs && student.needs.length > 0 ? (
                              <ThemedView>
                                <ThemedText style={[styles.itemCount, getTextDirection()]}> 
                                  {formatRTLText(`${student.needs.length} احتياج`)}
                                </ThemedText>
                                <ThemedText style={[styles.itemPreview, getTextDirection()]} numberOfLines={2}>
                                  {formatRTLText(student.needs.join('، '))}
                                </ThemedText>
                              </ThemedView>
                            ) : (
                              <ThemedText style={[styles.tableCellText, getTextDirection()]}>-</ThemedText>
                            )}
                          </ThemedView>

                          {/* مدى تحقق الهدف */}
                          <ThemedView style={[styles.cell, { minWidth: 120, flex: 1.5 }]}>
                            {student.goals && student.goals.length > 0 ? (
                              <ThemedView style={styles.progressContainer}>
                                <ThemedText style={[styles.progressText, getTextDirection()]}> 
                                  {formatRTLText(`${Math.round(student.goals.reduce((sum, goal) => sum + goal.progress, 0) / student.goals.length)}%`)}
                                </ThemedText>
                                <ThemedView style={styles.progressBar}>
                                  <ThemedView 
                                    style={[
                                      styles.progressFill,
                                      { 
                                        width: `${Math.round(student.goals.reduce((sum, goal) => sum + goal.progress, 0) / student.goals.length)}%`,
                                        backgroundColor: category.color
                                      }
                                    ]}
                                  />
                                </ThemedView>
                              </ThemedView>
                            ) : (
                              <ThemedText style={[styles.tableCellText, getTextDirection()]}>-</ThemedText>
                            )}
                          </ThemedView>

                          {/* الأهداف */}
                          <ThemedView style={[styles.cell, { minWidth: 200, flex: 2 }]}>
                            {student.goals && student.goals.length > 0 ? (
                              <ThemedView>
                                <ThemedText style={[styles.itemCount, getTextDirection()]}> 
                                  {formatRTLText(`${student.goals.length} أهداف`)}
                                </ThemedText>
                                <ThemedText style={[styles.itemPreview, getTextDirection()]} numberOfLines={2}>
                                  {formatRTLText(student.goals.map(goal => goal.text).join('، '))}
                                </ThemedText>
                            </ThemedView>
                            ) : (
                              <ThemedText style={[styles.tableCellText, getTextDirection()]}>-</ThemedText>
                            )}
                          </ThemedView>

                          {/* الصف الدراسي */}
                          <ThemedView style={[styles.cell, { minWidth: 100, flex: 1 }]}>
                            <ThemedText style={[styles.tableCellText, getTextDirection()]}>{formatRTLText(student.grade)}</ThemedText>
                          </ThemedView>

                          {/* اسم المتعلم - أقصى اليمين */}
                          <ThemedView style={[styles.cell, { minWidth: 150, flex: 2 }]}>
                            <TouchableOpacity 
                              style={styles.studentNameButton}
                              onPress={() => {
                                AsyncStorage.setItem('selectedStudentId', student.id)
                                  .then(() => router.push('/student-tracking'))
                                  .catch(error => {
                                    console.error('Error saving selected student:', error);
                                    showAlert(formatRTLText('خطأ'), formatRTLText('حدث خطأ أثناء فتح بطاقة المتعلم'));
                                  });
                              }}
                            >
                              <ThemedText style={[styles.studentNameText, getTextDirection()]}> 
                                {formatRTLText(student.name)}
                              </ThemedText>
                              <IconSymbol size={16} name="chevron.left" color="#2196F3" />
                            </TouchableOpacity>
                          </ThemedView>
                        </ThemedView>
                      ))}
                    </ScrollView>
                    </ThemedView>
                </ScrollView>
                      </ThemedView>
            )}
                      </ThemedView>
        );
      })}
                    </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
                  <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ThemedView style={styles.content}>
              {/* Header */}
              <ThemedView style={styles.header}>
                    <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.push('/student-tracking')}
                    >
                  <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
                    </TouchableOpacity>

                <ThemedView style={styles.iconContainer}>
                  <IconSymbol size={60} name="doc.text.fill" color="#1c1f33" />
                </ThemedView>
                <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
                  {formatRTLText('إدارة الخطط العلاجية والإثرائية')}
                </ThemedText>
                <ThemedText style={[styles.subtitle, getTextDirection()]}> 
                  {formatRTLText('متابعة وإدارة الخطط العلاجية والإثرائية للمتعلمين')}
                </ThemedText>
                        </ThemedView>

              {/* Main Statistics */}
              <ThemedView style={styles.statsContainer}>
                <ThemedView style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
                  <IconSymbol size={24} name="play.circle.fill" color="#4CAF50" />
                  <ThemedText style={styles.statNumber}>
                    {activePlans.filter(plan => plan.status === 'نشط').length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>خطط نشطة</ThemedText>
                        </ThemedView>

                <ThemedView style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                  <IconSymbol size={24} name="checkmark.circle.fill" color="#2196F3" />
                  <ThemedText style={styles.statNumber}>
                    {activePlans.filter(plan => plan.status === 'مكتمل').length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>خطط مكتملة</ThemedText>
                        </ThemedView>

                <ThemedView style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                  <IconSymbol size={24} name="pause.circle.fill" color="#FF9800" />
                  <ThemedText style={styles.statNumber}>
                    {activePlans.filter(plan => plan.status === 'معلق').length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>خطط معلقة</ThemedText>
                        </ThemedView>

                <ThemedView style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                  <IconSymbol size={24} name="person.2.fill" color="#9C27B0" />
                  <ThemedText style={styles.statNumber}>
                    {students.length}
                      </ThemedText>
                  <ThemedText style={styles.statLabel}>إجمالي المتعلمين</ThemedText>
                  </ThemedView>
                </ThemedView>

              {/* Categories */}
              <ThemedView style={styles.categoriesContainer}>
                {renderCategoryButtons()}
              </ThemedView>
            </ThemedView>
          </KeyboardAvoidingView>
        </ScrollView>
      </ImageBackground>

      <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.exportModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setExportModalVisible(false)} />
          <View style={styles.exportModalBox}>
            <ThemedText style={styles.exportModalTitle}>تحميل الجدول</ThemedText>
            <ThemedText style={styles.exportModalMessage}>اختر نوع الملف المطلوب</ThemedText>
            <TouchableOpacity style={styles.exportOptionButton} onPress={doExportExcel}>
              <ThemedText style={styles.exportOptionText}>ملف Excel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportOptionButton} onPress={doExportPDF}>
              <ThemedText style={styles.exportOptionText}>ملف PDF</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportOptionButton, styles.exportOptionCancel]} onPress={() => { setExportModalVisible(false); setExportModalData(null); }}>
              <ThemedText style={styles.exportOptionCancelText}>إلغاء</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!excelDownloadReady} transparent animationType="fade" onRequestClose={closeExcelDownload}>
        <View style={styles.exportModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeExcelDownload} />
          <View style={styles.exportModalBox}>
            <ThemedText style={styles.exportModalTitle}>{formatRTLText('تحميل ملف Excel')}</ThemedText>
            <ThemedText style={styles.exportModalMessage}>{formatRTLText('اضغط الزر أدناه لتحميل الملف.')}</ThemedText>
            <TouchableOpacity
              style={styles.exportOptionButton}
              onPress={() => {
                if (!excelDownloadReady) return;
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  const a = document.createElement('a');
                  a.href = excelDownloadReady.url;
                  a.download = excelDownloadReady.name;
                  a.click();
                }
                closeExcelDownload();
              }}
            >
              <ThemedText style={styles.exportOptionText}>{formatRTLText('تحميل الملف')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportOptionButton, styles.exportOptionCancel]} onPress={closeExcelDownload}>
              <ThemedText style={styles.exportOptionCancelText}>{formatRTLText('إلغاء')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <BottomNavigationBar />
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
  scrollView: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#add4ce',
    alignItems: 'center',
    justifyContent: 'center',
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
  headerIcon: {
    transform: Platform.OS === 'android' ? [] : [{ rotateY: '180deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    minWidth: '23%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.4)',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'transparent',
    direction: 'rtl',
  },
  emptyIconContainer: {
    marginBottom: 20,
    padding: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 10,
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    lineHeight: 24,
    writingDirection: 'rtl',
  },
  plansSection: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  planCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planIconWrapper: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 5,
  },
  studentName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 3,
  },
  targetArea: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
    marginBottom: 10,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  planFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  planDates: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  studentsAnalysis: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analysisCard: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  analysisNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
    color: '#000000',
  },
  analysisLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  studentsWithPlans: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  studentDetailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
  studentDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  studentInfo: {
    flex: 1,
  },
  studentDetailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 3,
  },
  studentDetailGrade: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  plansOverview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  plansSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  plansSummaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  plansSummaryText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  overallProgress: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  studentsTable: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  tableContainer: {
    width: '100%',
    direction: 'rtl',
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    width: '100%',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tableCellTextSmall: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'center',
  },
  statusTextSmall: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  plansCount: {
    alignItems: 'center',
  },
  plansCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  plansBreakdown: {
    flexDirection: 'row',
    gap: 3,
  },
  plansBreakdownText: {
    fontSize: 8,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  needsContainer: {
    alignItems: 'center',
  },
  needsCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  needsPreview: {
    fontSize: 9,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceContainer: {
    alignItems: 'center',
  },
  evidenceCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidencePreview: {
    fontSize: 9,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tableSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  summaryItem: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tableHeaderSection: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
  },
  downloadButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#1c1f33',
    marginRight: 8,
    fontWeight: '500',
  },
  plansTableContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginHorizontal: 20,
  },
  studentNameButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  studentNameText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
    marginLeft: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  studentNameIcon: {
    marginRight: 4,
  },
  goalsContainer: {
    flex: 1,
  },
  goalsCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  goalsPreview: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },

  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  categoriesGrid: {
    flexDirection: 'column',
    gap: 10,
    direction: 'rtl',
  },
  categoryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  categoryButtonLeft: {
    marginRight: 0,
  },
  categoryButtonTop: {
    marginTop: 0,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginRight: 10,
    marginLeft: 'auto',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  categoryCount: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  categoryWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  expandIcon: {
    marginRight: 10,
  },
  expandedContent: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: '100%',
  },
  headerCell: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerCellText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  itemCount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    textAlign: 'right',
  },
  itemPreview: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
  },
  tableScrollView: {
    width: '100%',
  },
  tableScrollViewContent: {
    paddingBottom: 20,
  },

  tableBodyScroll: {
    width: '100%',
  },
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  downloadButtonContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    marginRight: 16,
  },
  exportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  exportModalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    direction: 'rtl',
  },
  exportModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'right',
  },
  exportModalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'right',
  },
  exportOptionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  exportOptionText: {
    fontSize: 16,
    color: '#1c1f33',
    fontWeight: '500',
    textAlign: 'right',
  },
  exportOptionCancel: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5EA',
    marginTop: 8,
    marginBottom: 0,
  },
  exportOptionCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});

