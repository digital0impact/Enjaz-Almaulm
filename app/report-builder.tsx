import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';

import { AlertService } from '@/services/AlertService';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { formatRTLText, getTextDirection } from '@/utils/rtl-utils';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const GREEN = '#059669';

const GOAL_OPTIONS = [
  'تنمية المهارات الاجتماعية',
  'تعزيز القيم الإسلامية والوطنية',
  'تعزيز التفكير الناقد والإبداع',
  'تعزيز روح التعاون والعمل الجماعي',
  'ترسيخ وتعزيز الصحة النفسية',
];
const MEANS_OPTIONS = [
  'عرض شرائح / بوربوينت',
  'فيديو تعليمي / توعوي',
  'أوراق عمل',
  'أنشطة عملية / تجارب',
  'حوار ومناقشة جماعية',
  'ملصقات أو مطويات',
  'مسابقات وألعاب تعليمية',
];
const RESULTS_OPTIONS = [
  'تفاعل الطالب/ة مع النشاط',
  'تحقيق الهدف التعليمي المحدد',
  'زيادة دافعية الطالب/ة',
  'تنمية مهارة جديدة',
  'مشاركة جماعية فعالة',
];
const CHALLENGES_OPTIONS = [
  'ضيق الوقت',
  'ضعف مشاركة بعض الطلاب/الطالبات',
  'نقص الوسائل التعليمية',
  'مشاكل تقنية (جهاز - عرض - صوت)',
];
const SUGGESTIONS_OPTIONS = [
  'توفير دعم مادي (أجهزة/تجهيزات)',
  'تكرار النشاط في مناسبات أخرى',
  'تنويع طرق التنفيذ',
];

type ReportForm = {
  schoolName: string;
  educationAdministration: string;
  teacherName: string;
  semester: 'الأول' | 'الثاني';
  gradeDetails: string;
  week: string;
  domain: string;
  program: string;
  goals: string[];
  goalsOther: string;
  means: string[];
  meansOther: string;
  results: string[];
  resultsOther: string;
  steps: string[];
  challenges: string[];
  challengesOther: string;
  suggestions: string[];
  suggestionsOther: string;
  evidenceNotes: string;
  implementationDate: string;
  activityLeaderName: string;
  principalName: string;
};

type SavedReport = ReportForm & { id: string; savedAt: string };

const EMPTY_FORM: ReportForm = {
  schoolName: '',
  educationAdministration: '',
  teacherName: '',
  semester: 'الأول',
  gradeDetails: '',
  week: '',
  domain: '',
  program: '',
  goals: [],
  goalsOther: '',
  means: [],
  meansOther: '',
  results: [],
  resultsOther: '',
  steps: ['', '', ''],
  challenges: [],
  challengesOther: '',
  suggestions: [],
  suggestionsOther: '',
  evidenceNotes: '',
  implementationDate: '',
  activityLeaderName: '',
  principalName: '',
};

const DRAFT_KEY = 'reportBuilderDraft';
const REPORTS_KEY = 'reportBuilderReports';

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default function ReportBuilderScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [wordDownload, setWordDownload] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [draft, reports, basicData] = await Promise.all([
        AsyncStorage.getItem(DRAFT_KEY),
        AsyncStorage.getItem(REPORTS_KEY),
        AsyncStorage.getItem('basicData'),
      ]);

      let nextForm = { ...EMPTY_FORM };
      if (basicData) {
        const parsed = JSON.parse(basicData);
        if (parsed.fullName) nextForm.teacherName = parsed.fullName;
        if (parsed.school) nextForm.schoolName = parsed.school;
        if (parsed.educationDepartment) nextForm.educationAdministration = parsed.educationDepartment;
      }
      if (draft) {
        nextForm = { ...nextForm, ...JSON.parse(draft) };
      }
      setForm(nextForm);

      if (reports) setSavedReports(JSON.parse(reports));
    } catch (e) {
      console.log('Error loading report builder data:', e);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [form]);

  const updateField = <K extends keyof ReportForm>(key: K, value: ReportForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateStep = (index: number, value: string) => {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = value;
      return { ...prev, steps };
    });
  };

  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>
  ) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      if (destructive) {
        if (window.confirm([title, message].filter(Boolean).join('\n\n'))) destructive.onPress?.();
        return;
      }
      window.alert([title, message].filter(Boolean).join('\n\n'));
      const action = buttons?.find((b) => b.onPress);
      if (action && action.style !== 'cancel') action.onPress?.();
      return;
    }
    AlertService.alert(title, message, buttons);
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...EMPTY_FORM,
      schoolName: prev.schoolName,
      educationAdministration: prev.educationAdministration,
      teacherName: prev.teacherName,
    }));
    setEditingId(null);
  };

  const handleNewReport = () => {
    showAlert(
      formatRTLText('تقرير جديد'),
      formatRTLText('سيتم تفريغ النموذج الحالي لبدء تقرير جديد. هل تريد المتابعة؟'),
      [
        { text: formatRTLText('إلغاء'), style: 'cancel' },
        { text: formatRTLText('نعم، تفريغ'), style: 'destructive', onPress: resetForm },
      ]
    );
  };

  const handleSaveReport = async () => {
    if (!form.program.trim() && !form.domain.trim()) {
      showAlert(formatRTLText('بيانات ناقصة'), formatRTLText('يرجى إدخال اسم المجال أو البرنامج قبل الحفظ.'));
      return;
    }
    try {
      let updated: SavedReport[];
      if (editingId) {
        updated = savedReports.map((r) => (r.id === editingId ? { ...form, id: editingId, savedAt: new Date().toISOString() } : r));
      } else {
        const newReport: SavedReport = { ...form, id: `${Date.now()}`, savedAt: new Date().toISOString() };
        updated = [newReport, ...savedReports];
        setEditingId(newReport.id);
      }
      setSavedReports(updated);
      await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
      showAlert(formatRTLText('تم الحفظ'), formatRTLText('تم حفظ التقرير في قائمة التقارير المحفوظة.'));
    } catch (e) {
      showAlert(formatRTLText('خطأ'), formatRTLText('تعذر حفظ التقرير.'));
    }
  };

  const loadReportIntoForm = (report: SavedReport) => {
    const { id, savedAt, ...rest } = report;
    setForm(rest);
    setEditingId(id);
  };

  const deleteReport = (id: string) => {
    showAlert(
      formatRTLText('حذف التقرير'),
      formatRTLText('هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.'),
      [
        { text: formatRTLText('إلغاء'), style: 'cancel' },
        {
          text: formatRTLText('حذف'),
          style: 'destructive',
          onPress: async () => {
            const updated = savedReports.filter((r) => r.id !== id);
            setSavedReports(updated);
            await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
            if (editingId === id) setEditingId(null);
          },
        },
      ]
    );
  };

  const checkCanExport = async (): Promise<boolean> => {
    let user = await AuthService.getCurrentUser();
    if (!user) user = await AuthService.checkAuthStatus();
    if (!user) {
      showAlert(
        formatRTLText('تسجيل الدخول مطلوب'),
        formatRTLText('يرجى تسجيل الدخول للسماح بتصدير التقرير.'),
        [{ text: formatRTLText('حسناً'), style: 'cancel' }]
      );
      return false;
    }
    const status = await SubscriptionService.checkSubscriptionStatus(user.id);
    if (!status?.features?.canExport) {
      showAlert(
        formatRTLText('ترقية الاشتراك مطلوبة'),
        formatRTLText('تصدير التقرير (PDF و Word) متاح للاشتراك السنوي ونصف السنوي فقط.'),
        [
          { text: formatRTLText('حسناً'), style: 'cancel' },
          { text: formatRTLText('عرض الخطط'), onPress: () => router.push('/subscription') },
        ]
      );
      return false;
    }
    return true;
  };

  const checkboxLine = (checked: boolean, label: string) =>
    `<div class="check-line">${checked ? '☑' : '☐'} ${escapeHtml(label)}</div>`;

  const generateReportHtml = (data: ReportForm): string => {
    const tableBorder = '1px solid #e5e7eb';
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>تقرير تنفيذ برامج النشاط الصفي</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #1c1f33; }
    h1 { color: #1c1f33; font-size: 20px; margin-bottom: 4px; text-align: center; }
    .subtitle { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 20px; }
    .section { margin-bottom: 18px; border: ${tableBorder}; border-radius: 8px; overflow: hidden; }
    .section-header { background: ${TEAL}; color: #fff; padding: 10px 16px; font-weight: 700; font-size: 15px; }
    .form-row { display: flex; flex-wrap: wrap; gap: 10px; padding: 10px; }
    .field { flex: 1; min-width: 160px; }
    .field-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .field-value { font-size: 13px; padding: 7px; background: #f9fafb; border: ${tableBorder}; border-radius: 6px; min-height: 16px; }
    .cols3 { display: flex; }
    .col { flex: 1; border-left: ${tableBorder}; padding: 10px; }
    .col:last-child { border-left: none; }
    .col-title { font-weight: 700; font-size: 13px; color: ${TEAL}; margin-bottom: 8px; text-align: center; }
    .check-line { font-size: 12px; margin-bottom: 6px; }
    .steps-list { padding: 10px; font-size: 13px; }
    .step-line { margin-bottom: 8px; }
    .evidence-box { min-height: 90px; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; margin: 10px; text-align: center; padding: 10px; }
    table.signoff { width: 100%; border-collapse: collapse; font-size: 12px; }
    table.signoff th, table.signoff td { border: ${tableBorder}; padding: 10px; text-align: center; }
    table.signoff th { background: ${TEAL_LIGHT}; color: #fff; font-weight: 700; }
  </style>
</head>
<body>
  <h1>تقرير تنفيذ برامج النشاط الصفي</h1>
  <div class="subtitle">${escapeHtml(data.educationAdministration)} - ${escapeHtml(data.schoolName)}</div>

  <div class="section">
    <div class="section-header">بيانات التقرير</div>
    <div class="form-row">
      <div class="field"><div class="field-label">اسم المعلم/ة</div><div class="field-value">${escapeHtml(data.teacherName)}</div></div>
      <div class="field"><div class="field-label">الفصل الدراسي</div><div class="field-value">${escapeHtml(data.semester)}</div></div>
    </div>
    <div class="form-row">
      <div class="field"><div class="field-label">الصف والتفصيل</div><div class="field-value">${escapeHtml(data.gradeDetails)}</div></div>
      <div class="field"><div class="field-label">الأسبوع</div><div class="field-value">${escapeHtml(data.week)}</div></div>
    </div>
    <div class="form-row">
      <div class="field"><div class="field-label">اسم المجال</div><div class="field-value">${escapeHtml(data.domain)}</div></div>
      <div class="field"><div class="field-label">البرنامج</div><div class="field-value">${escapeHtml(data.program)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">تفاصيل التنفيذ</div>
    <div class="cols3">
      <div class="col">
        <div class="col-title">الهدف من النشاط</div>
        ${GOAL_OPTIONS.map((o) => checkboxLine(data.goals.includes(o), o)).join('')}
        ${data.goalsOther ? checkboxLine(true, data.goalsOther) : ''}
      </div>
      <div class="col">
        <div class="col-title">الوسائل المستخدمة</div>
        ${MEANS_OPTIONS.map((o) => checkboxLine(data.means.includes(o), o)).join('')}
        ${data.meansOther ? checkboxLine(true, data.meansOther) : ''}
      </div>
      <div class="col">
        <div class="col-title">النتائج المتحققة</div>
        ${RESULTS_OPTIONS.map((o) => checkboxLine(data.results.includes(o), o)).join('')}
        ${data.resultsOther ? checkboxLine(true, data.resultsOther) : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">آلية التنفيذ (خطوات مختصرة)</div>
    <div class="steps-list">
      ${data.steps.map((s, i) => `<div class="step-line">${i + 1}. ${escapeHtml(s)}</div>`).join('')}
    </div>
  </div>

  <div class="section">
    <div class="cols3">
      <div class="col">
        <div class="col-title">التحديات والمعوقات (إن وجدت)</div>
        ${CHALLENGES_OPTIONS.map((o) => checkboxLine(data.challenges.includes(o), o)).join('')}
        ${data.challengesOther ? checkboxLine(true, data.challengesOther) : ''}
      </div>
      <div class="col">
        <div class="col-title">المقترحات والتوصيات</div>
        ${SUGGESTIONS_OPTIONS.map((o) => checkboxLine(data.suggestions.includes(o), o)).join('')}
        ${data.suggestionsOther ? checkboxLine(true, data.suggestionsOther) : ''}
      </div>
      <div class="col">
        <div class="col-title">الشواهد</div>
        <div class="evidence-box">${escapeHtml(data.evidenceNotes) || 'يوضع هنا وصف أو باركود الشواهد'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">اعتماد المتابعة</div>
    <table class="signoff">
      <tr>
        <th>تاريخ التنفيذ</th>
        <th>رائدة النشاط</th>
        <th>مديرة المدرسة</th>
      </tr>
      <tr>
        <td>${escapeHtml(data.implementationDate)}</td>
        <td>${escapeHtml(data.activityLeaderName)}</td>
        <td>${escapeHtml(data.principalName)}</td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  };

  const exportPDF = async (data: ReportForm, idForState: string | null) => {
    const canExport = await checkCanExport();
    if (!canExport) return;
    if (idForState) setExportingId(idForState);
    else setIsExporting(true);
    try {
      const htmlContent = generateReportHtml(data);
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          showAlert(formatRTLText('تنبيه'), formatRTLText('تصدير PDF غير متاح في هذا السياق.'));
          return;
        }
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
        setTimeout(() => {
          if (document.body.contains(iframe)) doPrint();
        }, 3000);
        showAlert(
          formatRTLText('تم فتح نافذة الطباعة'),
          formatRTLText('اختر «حفظ كـ PDF» أو «Save as PDF» في نافذة الطباعة لحفظ الملف.')
        );
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false, width: 595, height: 842 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showAlert(formatRTLText('تم إنشاء الملف'), uri);
        return;
      }
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        const pdfName = `تقرير_نشاط_صفي_${new Date().toISOString().split('T')[0]}.pdf`;
        const dest = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({ from: uri, to: dest });
        await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: formatRTLText('تصدير التقرير PDF') });
      }
      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التقرير كملف PDF.'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showAlert(formatRTLText('فشل التصدير'), formatRTLText('تعذر تصدير PDF.') + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExporting(false);
      setExportingId(null);
    }
  };

  const exportWord = async (data: ReportForm) => {
    const canExport = await checkCanExport();
    if (!canExport) return;
    setIsExporting(true);
    try {
      const htmlContent = generateReportHtml(data);
      const fileName = `تقرير_نشاط_صفي_${new Date().toISOString().split('T')[0]}.doc`;
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          showAlert(formatRTLText('تنبيه'), formatRTLText('تصدير Word غير متاح في هذا السياق.'));
          return;
        }
        const blob = new Blob(['﻿' + htmlContent], { type: 'application/msword; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setWordDownload({ url, name: fileName });
        return;
      }
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, '﻿' + htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showAlert(formatRTLText('تم إنشاء الملف'), filePath);
        return;
      }
      await Sharing.shareAsync(filePath, { mimeType: 'application/msword', dialogTitle: formatRTLText('تصدير التقرير Word') });
      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التقرير كملف Word.'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showAlert(formatRTLText('فشل التصدير'), formatRTLText('تعذر تصدير Word.') + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExporting(false);
    }
  };

  const closeWordDownload = () => {
    if (wordDownload) {
      URL.revokeObjectURL(wordDownload.url);
      setWordDownload(null);
    }
  };

  const renderCheckboxGroup = (
    title: string,
    options: string[],
    selected: string[],
    onToggle: (value: string) => void,
    otherValue: string,
    onOtherChange: (value: string) => void
  ) => (
    <ThemedView style={styles.groupCard}>
      <ThemedText style={[styles.groupTitle, getTextDirection()]}>{formatRTLText(title)}</ThemedText>
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <TouchableOpacity key={option} style={styles.checkboxRow} onPress={() => onToggle(option)} activeOpacity={0.7}>
            <IconSymbol
              size={20}
              name={checked ? 'checkmark.square.fill' : 'square'}
              color={checked ? TEAL : '#9ca3af'}
            />
            <ThemedText style={[styles.checkboxLabel, getTextDirection()]}>{formatRTLText(option)}</ThemedText>
          </TouchableOpacity>
        );
      })}
      <TextInput
        style={[styles.otherInput, getTextDirection()]}
        value={otherValue}
        onChangeText={onOtherChange}
        placeholder={formatRTLText('تحرير (أخرى)...')}
        placeholderTextColor="#999"
      />
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ImageBackground source={require('@/assets/images/background.png')} style={styles.backgroundImage} resizeMode="cover">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
            </TouchableOpacity>
            <ThemedView style={styles.titleRow}>
              <ThemedView style={styles.tealBar} />
              <ThemedText type="title" style={[styles.mainTitle, getTextDirection()]}>
                {formatRTLText('منشئ التقارير')}
              </ThemedText>
            </ThemedView>
            <ThemedText style={[styles.headerSubtitle, getTextDirection()]}>
              {formatRTLText('تقرير تنفيذ برامج النشاط الصفي')}
            </ThemedText>
          </ThemedView>

          {savedReports.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                  {formatRTLText('التقارير المحفوظة')}
                </ThemedText>
              </ThemedView>
              <View style={styles.savedList}>
                {savedReports.map((report) => (
                  <View key={report.id} style={[styles.savedItem, editingId === report.id && styles.savedItemActive]}>
                    <TouchableOpacity style={styles.savedItemInfo} onPress={() => loadReportIntoForm(report)} activeOpacity={0.7}>
                      <ThemedText style={[styles.savedItemTitle, getTextDirection()]}>
                        {formatRTLText(report.program || report.domain || 'تقرير بدون عنوان')}
                      </ThemedText>
                      <ThemedText style={[styles.savedItemMeta, getTextDirection()]}>
                        {formatRTLText(`الأسبوع: ${report.week || '-'} | ${new Date(report.savedAt).toLocaleDateString('ar-SA')}`)}
                      </ThemedText>
                    </TouchableOpacity>
                    <View style={styles.savedItemActions}>
                      <TouchableOpacity style={styles.savedIconButton} onPress={() => exportPDF(report, report.id)} disabled={exportingId === report.id}>
                        {exportingId === report.id ? (
                          <ActivityIndicator size="small" color={TEAL} />
                        ) : (
                          <IconSymbol size={18} name="doc.pdf" color={TEAL} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.savedIconButton} onPress={() => deleteReport(report.id)}>
                        <IconSymbol size={18} name="trash.fill" color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ThemedView>
          )}

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText(editingId ? 'تعديل التقرير' : 'بيانات التقرير')}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>الإدارة العامة للتعليم</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.educationAdministration}
                  onChangeText={(v) => updateField('educationAdministration', v)}
                  placeholder={formatRTLText('الإدارة العامة للتعليم بمنطقة...')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>اسم المدرسة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.schoolName}
                  onChangeText={(v) => updateField('schoolName', v)}
                  placeholder={formatRTLText('اسم المدرسة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>اسم المعلم/ة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.teacherName}
                  onChangeText={(v) => updateField('teacherName', v)}
                  placeholder={formatRTLText('اسم المعلم/ة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>الفصل الدراسي</ThemedText>
                <View style={styles.radioRow}>
                  {(['الأول', 'الثاني'] as const).map((sem) => (
                    <TouchableOpacity
                      key={sem}
                      style={styles.radioOption}
                      onPress={() => updateField('semester', sem)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        size={18}
                        name={form.semester === sem ? 'checkmark.circle.fill' : 'circle'}
                        color={form.semester === sem ? TEAL : '#9ca3af'}
                      />
                      <ThemedText style={[styles.radioLabel, getTextDirection()]}>{formatRTLText(sem)}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>الصف والتفصيل</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.gradeDetails}
                  onChangeText={(v) => updateField('gradeDetails', v)}
                  placeholder={formatRTLText('مثال: الصف السادس - شعبة أ')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>الأسبوع</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.week}
                  onChangeText={(v) => updateField('week', v)}
                  placeholder={formatRTLText('الأسبوع')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>اسم المجال</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.domain}
                  onChangeText={(v) => updateField('domain', v)}
                  placeholder={formatRTLText('اسم المجال')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>البرنامج</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.program}
                  onChangeText={(v) => updateField('program', v)}
                  placeholder={formatRTLText('اسم البرنامج')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('تفاصيل التنفيذ')}</ThemedText>
            </ThemedView>
            <View style={styles.groupsWrap}>
              {renderCheckboxGroup(
                'الهدف من النشاط',
                GOAL_OPTIONS,
                form.goals,
                (v) => updateField('goals', toggleValue(form.goals, v)),
                form.goalsOther,
                (v) => updateField('goalsOther', v)
              )}
              {renderCheckboxGroup(
                'الوسائل المستخدمة',
                MEANS_OPTIONS,
                form.means,
                (v) => updateField('means', toggleValue(form.means, v)),
                form.meansOther,
                (v) => updateField('meansOther', v)
              )}
              {renderCheckboxGroup(
                'النتائج المتحققة',
                RESULTS_OPTIONS,
                form.results,
                (v) => updateField('results', toggleValue(form.results, v)),
                form.resultsOther,
                (v) => updateField('resultsOther', v)
              )}
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText('آلية التنفيذ (خطوات مختصرة)')}
              </ThemedText>
            </ThemedView>
            <View style={styles.stepsWrap}>
              {form.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <ThemedText style={styles.stepNumber}>{i + 1}</ThemedText>
                  <TextInput
                    style={[styles.stepInput, getTextDirection()]}
                    value={step}
                    onChangeText={(v) => updateStep(i, v)}
                    placeholder={formatRTLText(`الخطوة ${i + 1}`)}
                    placeholderTextColor="#999"
                  />
                </View>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText('التحديات والمقترحات والشواهد')}
              </ThemedText>
            </ThemedView>
            <View style={styles.groupsWrap}>
              {renderCheckboxGroup(
                'التحديات والمعوقات (إن وجدت)',
                CHALLENGES_OPTIONS,
                form.challenges,
                (v) => updateField('challenges', toggleValue(form.challenges, v)),
                form.challengesOther,
                (v) => updateField('challengesOther', v)
              )}
              {renderCheckboxGroup(
                'المقترحات والتوصيات',
                SUGGESTIONS_OPTIONS,
                form.suggestions,
                (v) => updateField('suggestions', toggleValue(form.suggestions, v)),
                form.suggestionsOther,
                (v) => updateField('suggestionsOther', v)
              )}
              <ThemedView style={styles.groupCard}>
                <ThemedText style={[styles.groupTitle, getTextDirection()]}>{formatRTLText('الشواهد')}</ThemedText>
                <TextInput
                  style={[styles.evidenceInput, getTextDirection()]}
                  value={form.evidenceNotes}
                  onChangeText={(v) => updateField('evidenceNotes', v)}
                  placeholder={formatRTLText('وصف الشواهد أو روابطها...')}
                  placeholderTextColor="#999"
                  multiline
                />
              </ThemedView>
            </View>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('اعتماد المتابعة')}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>تاريخ التنفيذ</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.implementationDate}
                  onChangeText={(v) => updateField('implementationDate', v)}
                  placeholder={formatRTLText('__ / __ / 1447هـ')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>رائدة النشاط</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.activityLeaderName}
                  onChangeText={(v) => updateField('activityLeaderName', v)}
                  placeholder={formatRTLText('اسم رائدة النشاط')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>مديرة المدرسة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.principalName}
                  onChangeText={(v) => updateField('principalName', v)}
                  placeholder={formatRTLText('اسم مديرة المدرسة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.exportSection}>
            <View style={styles.exportButtonsRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
                <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                <ThemedText style={[styles.exportButtonText, getTextDirection()]}>
                  {formatRTLText(editingId ? 'تحديث التقرير' : 'حفظ التقرير')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newButton} onPress={handleNewReport}>
                <IconSymbol size={20} name="doc.badge.plus" color="#fff" />
                <ThemedText style={[styles.exportButtonText, getTextDirection()]}>{formatRTLText('تقرير جديد')}</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.exportButtonsRow}>
              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={() => exportPDF(form, null)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol size={20} name="doc.pdf" color="#fff" />
                    <ThemedText style={[styles.exportButtonText, getTextDirection()]}>{formatRTLText('تصدير PDF')}</ThemedText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonWord, isExporting && styles.exportButtonDisabled]}
                onPress={() => exportWord(form)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol size={20} name="doc.text.fill" color="#fff" />
                    <ThemedText style={[styles.exportButtonText, getTextDirection()]}>{formatRTLText('تصدير Word')}</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>

          <ThemedView style={{ height: 100 }} />
        </ScrollView>
        <BottomNavigationBar />

        <Modal visible={!!wordDownload} transparent animationType="fade" onRequestClose={closeWordDownload}>
          <View style={styles.wordDownloadOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeWordDownload} />
            <View style={styles.wordDownloadBox}>
              <ThemedText style={[styles.wordDownloadTitle, getTextDirection()]}>{formatRTLText('تحميل ملف Word')}</ThemedText>
              <ThemedText style={[styles.wordDownloadHint, getTextDirection()]}>
                {formatRTLText('اضغط الزر أدناه لتحميل الملف.')}
              </ThemedText>
              <TouchableOpacity
                style={styles.wordDownloadButton}
                onPress={() => {
                  if (!wordDownload) return;
                  if (Platform.OS === 'web' && typeof document !== 'undefined') {
                    const a = document.createElement('a');
                    a.href = wordDownload.url;
                    a.download = wordDownload.name;
                    a.click();
                  }
                  closeWordDownload();
                }}
              >
                <ThemedText style={styles.wordDownloadButtonText}>{formatRTLText('تحميل الملف')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wordDownloadCancel} onPress={closeWordDownload}>
                <ThemedText style={styles.wordDownloadCancelText}>{formatRTLText('إلغاء')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40 },
  header: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  backButton: {
    position: 'absolute',
    left: 0,
    top: Platform.OS === 'ios' ? 0 : -8,
    backgroundColor: '#add4ce',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', justifyContent: 'center' },
  tealBar: { width: 6, height: 44, backgroundColor: TEAL, borderRadius: 3, marginLeft: 10 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#1c1f33', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: { backgroundColor: TEAL, paddingVertical: 12, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  formRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', padding: 12, gap: 12 },
  fieldBlock: { flex: 1, minWidth: 140 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1c1f33',
    backgroundColor: '#f9fafb',
  },
  radioRow: { flexDirection: 'row-reverse', gap: 16, alignItems: 'center', marginTop: 4 },
  radioOption: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  radioLabel: { fontSize: 14, color: '#374151' },
  groupsWrap: { padding: 12, gap: 12 },
  groupCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  groupTitle: { fontSize: 14, fontWeight: '700', color: TEAL, marginBottom: 10 },
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkboxLabel: { fontSize: 13, color: '#1c1f33', flex: 1 },
  otherInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1c1f33',
    backgroundColor: '#fff',
    marginTop: 4,
  },
  stepsWrap: { padding: 12, gap: 10 },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#dcfce7',
    color: GREEN,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  stepInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1c1f33',
    backgroundColor: '#f9fafb',
  },
  evidenceInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1c1f33',
    backgroundColor: '#fff',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  savedList: { padding: 12, gap: 8 },
  savedItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    marginBottom: 8,
  },
  savedItemActive: { borderColor: TEAL, backgroundColor: '#f0fdfa' },
  savedItemInfo: { flex: 1 },
  savedItemTitle: { fontSize: 14, fontWeight: '700', color: '#1c1f33' },
  savedItemMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  savedItemActions: { flexDirection: 'row-reverse', gap: 8 },
  savedIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  exportButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  saveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
    justifyContent: 'center',
  },
  newButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
    justifyContent: 'center',
  },
  exportButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
    justifyContent: 'center',
  },
  exportButtonWord: { backgroundColor: '#2563eb' },
  exportButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  exportButtonDisabled: { opacity: 0.7 },
  wordDownloadOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  wordDownloadBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, minWidth: 280, maxWidth: 360 },
  wordDownloadTitle: { fontSize: 18, fontWeight: '700', color: '#1c1f33', marginBottom: 8, textAlign: 'center' },
  wordDownloadHint: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  wordDownloadButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  wordDownloadButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  wordDownloadCancel: { alignItems: 'center', paddingVertical: 8 },
  wordDownloadCancelText: { fontSize: 15, color: '#6b7280' },
});
