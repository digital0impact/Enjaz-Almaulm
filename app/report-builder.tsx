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
const TEAL_DARK = '#0b4f47';
const GREEN = '#059669';

type ReportTypeId = 'activity' | 'lesson' | 'initiative' | 'custom';

type ReportTypeConfig = {
  id: ReportTypeId;
  chipLabel: string;
  chipIcon: 'star.fill' | 'book.fill' | 'lightbulb.fill' | 'pencil';
  docTitle: string;
  programLabel: string;
  programPlaceholder: string;
  goalsTitle: string;
  meansTitle: string;
  resultsTitle: string;
  leaderLabel: string;
  leaderPlaceholder: string;
  goals: string[];
  means: string[];
  results: string[];
  challenges: string[];
  suggestions: string[];
};

const REPORT_TYPES: ReportTypeConfig[] = [
  {
    id: 'activity',
    chipLabel: 'نشاط صفي',
    chipIcon: 'star.fill',
    docTitle: 'تقرير تنفيذ برامج النشاط الصفي',
    programLabel: 'البرنامج',
    programPlaceholder: 'اسم البرنامج',
    goalsTitle: 'الهدف من النشاط',
    meansTitle: 'الوسائل المستخدمة',
    resultsTitle: 'النتائج المتحققة',
    leaderLabel: 'رائدة النشاط',
    leaderPlaceholder: 'اسم رائدة النشاط',
    goals: [
      'تنمية المهارات الاجتماعية',
      'تعزيز القيم الإسلامية والوطنية',
      'تعزيز التفكير الناقد والإبداع',
      'تعزيز روح التعاون والعمل الجماعي',
      'ترسيخ وتعزيز الصحة النفسية',
    ],
    means: [
      'عرض شرائح / بوربوينت',
      'فيديو تعليمي / توعوي',
      'أوراق عمل',
      'أنشطة عملية / تجارب',
      'حوار ومناقشة جماعية',
      'ملصقات أو مطويات',
      'مسابقات وألعاب تعليمية',
    ],
    results: [
      'تفاعل الطالب/ة مع النشاط',
      'تحقيق الهدف التعليمي المحدد',
      'زيادة دافعية الطالب/ة',
      'تنمية مهارة جديدة',
      'مشاركة جماعية فعالة',
    ],
    challenges: [
      'ضيق الوقت',
      'ضعف مشاركة بعض الطلاب/الطالبات',
      'نقص الوسائل التعليمية',
      'مشاكل تقنية (جهاز - عرض - صوت)',
    ],
    suggestions: [
      'توفير دعم مادي (أجهزة/تجهيزات)',
      'تكرار النشاط في مناسبات أخرى',
      'تنويع طرق التنفيذ',
    ],
  },
  {
    id: 'lesson',
    chipLabel: 'درس',
    chipIcon: 'book.fill',
    docTitle: 'تقرير تنفيذ درس',
    programLabel: 'الدرس',
    programPlaceholder: 'اسم الدرس / الموضوع',
    goalsTitle: 'الهدف من الدرس',
    meansTitle: 'استراتيجيات وأساليب التدريس',
    resultsTitle: 'نواتج التعلم المتحققة',
    leaderLabel: 'معلم/ة المادة',
    leaderPlaceholder: 'اسم المعلم/ة',
    goals: [
      'تحقيق نواتج التعلم المستهدفة',
      'تنمية مهارات التفكير العليا',
      'ربط الدرس بالواقع والحياة',
      'تعزيز المشاركة والتفاعل الصفي',
      'معالجة الفروق الفردية بين المتعلمين',
    ],
    means: [
      'الحوار والمناقشة',
      'التعلم التعاوني',
      'العصف الذهني',
      'الاستقصاء وحل المشكلات',
      'الوسائل التقنية (عروض/فيديو)',
      'أوراق عمل وتقويم تكويني',
    ],
    results: [
      'تحقيق أهداف الدرس',
      'تفاعل إيجابي من المتعلمين',
      'إتقان أغلب المتعلمين للمهارة',
      'تنويع أساليب التقويم',
    ],
    challenges: [
      'ضيق الوقت المخصص للحصة',
      'تفاوت المستويات بين المتعلمين',
      'نقص الوسائل التعليمية',
      'ضعف تفاعل بعض المتعلمين',
    ],
    suggestions: [
      'تنويع استراتيجيات التقويم',
      'تخصيص وقت لمعالجة الفروق الفردية',
      'توظيف تقنيات تفاعلية إضافية',
    ],
  },
  {
    id: 'initiative',
    chipLabel: 'مبادرة',
    chipIcon: 'lightbulb.fill',
    docTitle: 'تقرير تنفيذ مبادرة',
    programLabel: 'المبادرة',
    programPlaceholder: 'اسم المبادرة',
    goalsTitle: 'أهداف المبادرة',
    meansTitle: 'آليات وشركاء التنفيذ',
    resultsTitle: 'الأثر والنتائج المتحققة',
    leaderLabel: 'قائد/ة المبادرة',
    leaderPlaceholder: 'اسم قائد/ة المبادرة',
    goals: [
      'خدمة المجتمع المدرسي',
      'تعزيز الشراكة المجتمعية',
      'الاستجابة لاحتياج فعلي محدد',
      'تنمية مهارة أو قيمة مستهدفة',
    ],
    means: [
      'تشكيل فريق عمل/متطوعين',
      'شراكة مع جهة داخل/خارج المدرسة',
      'حملات توعوية',
      'مواد وأدوات داعمة',
    ],
    results: [
      'تحقيق أثر ملموس على الفئة المستفيدة',
      'مشاركة واسعة من المستفيدين',
      'رضا الشركاء والمستفيدين',
      'استدامة قابلة للتكرار',
    ],
    challenges: [
      'محدودية الموارد المتاحة',
      'ضعف تفاعل بعض المستفيدين',
      'صعوبة التنسيق مع الشركاء',
      'ضيق الوقت لتنفيذ جميع المراحل',
    ],
    suggestions: [
      'تكرار المبادرة في مناسبات أخرى',
      'توسيع نطاق المستفيدين',
      'تعزيز الشراكات الداعمة',
      'توثيق الأثر بمؤشرات قياس واضحة',
    ],
  },
  {
    id: 'custom',
    chipLabel: 'تقرير مخصص',
    chipIcon: 'pencil',
    docTitle: 'تقرير عام',
    programLabel: 'عنوان التقرير',
    programPlaceholder: 'اكتب عنوان التقرير',
    goalsTitle: 'الهدف',
    meansTitle: 'الوسائل / الإجراءات',
    resultsTitle: 'النتائج المتحققة',
    leaderLabel: 'المسؤول عن التنفيذ',
    leaderPlaceholder: 'الاسم',
    goals: [],
    means: [],
    results: [],
    challenges: [],
    suggestions: [],
  },
];

const getReportType = (id: ReportTypeId | undefined): ReportTypeConfig =>
  REPORT_TYPES.find((t) => t.id === id) ?? REPORT_TYPES[0];

type ChecklistField = 'goals' | 'means' | 'results' | 'challenges' | 'suggestions';

type ReportForm = {
  reportType: ReportTypeId;
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
  reportType: 'activity',
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

/** مجموعة بنود قابلة للاختيار: قائمة جاهزة (checkboxes) للأنواع المعرّفة، أو قائمة حرة (إضافة/حذف) لنوع "تقرير مخصص" */
function ChecklistGroup({
  title,
  options,
  selected,
  onToggle,
  otherValue,
  onOtherChange,
  onAddCustom,
  onRemoveCustom,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  onAddCustom: (value: string) => void;
  onRemoveCustom: (value: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const isCustom = options.length === 0;

  if (isCustom) {
    const submitDraft = () => {
      const v = draft.trim();
      if (!v) return;
      onAddCustom(v);
      setDraft('');
    };
    return (
      <ThemedView style={styles.groupCard}>
        <ThemedText style={[styles.groupTitle, getTextDirection()]}>{formatRTLText(title)}</ThemedText>
        {selected.map((item) => (
          <View key={item} style={styles.customItemRow}>
            <TouchableOpacity onPress={() => onRemoveCustom(item)} style={styles.customRemoveButton}>
              <IconSymbol size={16} name="xmark.circle.fill" color="#dc2626" />
            </TouchableOpacity>
            <ThemedText style={[styles.checkboxLabel, getTextDirection(), { flex: 1 }]}>{formatRTLText(item)}</ThemedText>
          </View>
        ))}
        <View style={styles.customAddRow}>
          <TouchableOpacity style={styles.customAddButton} onPress={submitDraft}>
            <IconSymbol size={20} name="plus.circle.fill" color={TEAL} />
          </TouchableOpacity>
          <TextInput
            style={[styles.otherInput, getTextDirection(), styles.customAddInput]}
            value={draft}
            onChangeText={setDraft}
            placeholder={formatRTLText('إضافة بند...')}
            placeholderTextColor="#999"
            onSubmitEditing={submitDraft}
          />
        </View>
      </ThemedView>
    );
  }

  return (
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
}

export default function ReportBuilderScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [wordDownload, setWordDownload] = useState<{ url: string; name: string } | null>(null);

  const activeType = getReportType(form.reportType);

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

      if (reports) {
        const parsedReports: SavedReport[] = JSON.parse(reports);
        setSavedReports(parsedReports.map((r) => ({ ...r, reportType: r.reportType ?? 'activity' })));
      }
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

  const addCustomItem = (field: ChecklistField, value: string) => {
    setForm((prev) => (prev[field].includes(value) ? prev : { ...prev, [field]: [...prev[field], value] }));
  };

  const removeCustomItem = (field: ChecklistField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((v) => v !== value) }));
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
      reportType: prev.reportType,
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
      showAlert(formatRTLText('بيانات ناقصة'), formatRTLText('يرجى إدخال عنوان التقرير أو اسم المجال قبل الحفظ.'));
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
    setForm({ ...rest, reportType: rest.reportType ?? 'activity' });
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

  /** تحميل شعار وزارة التعليم للتقرير المصدَّر (PDF/Word) فقط — من ملف assets/images/moe_logo.png المحلي */
  const loadMoeLogoDataUri = async (): Promise<string> => {
    try {
      const Asset = require('expo-asset').Asset;
      const asset = Asset.fromModule(require('@/assets/images/moe_logo.png'));
      await asset.downloadAsync();

      if (Platform.OS === 'web') {
        const uri = asset.uri ?? (asset as any).localUri;
        if (uri) {
          const url = typeof uri === 'string' && uri.startsWith('/') ? `${typeof window !== 'undefined' ? window.location.origin : ''}${uri}` : uri;
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } else if (asset.localUri) {
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
        if (base64) return `data:image/png;base64,${base64}`;
      }
    } catch (e) {
      if (__DEV__ && typeof console !== 'undefined') console.warn('تحميل شعار الوزارة للتقرير:', e);
    }
    return '';
  };

  /** عناصر مُختارة فقط (بدون خيارات غير محدَّدة) كقائمة نقطية — يشمل بند "أخرى" إن وُجد */
  const bulletListHtml = (presets: string[], selected: string[], other: string): string => {
    const items = presets.length > 0 ? presets.filter((o) => selected.includes(o)) : selected;
    const all = other.trim() ? [...items, other.trim()] : items;
    if (all.length === 0) return `<div class="empty-hint">لا توجد بنود مضافة</div>`;
    return `<ul class="bullet-list">${all.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
  };

  const generateReportHtml = async (data: ReportForm): Promise<string> => {
    const type = getReportType(data.reportType);
    const logoDataUri = await loadMoeLogoDataUri();
    const todayStr = new Date().toLocaleDateString('ar-SA');

    const filledSteps = data.steps.map((s) => s.trim()).filter(Boolean);
    const evidenceItems = data.evidenceNotes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const subjectLabel = data.program.trim() || data.domain.trim() || type.docTitle;
    const summaryText =
      `يوثّق هذا التقرير تنفيذ "${subjectLabel}"` +
      (data.week.trim() ? ` خلال ${data.week.trim()}` : '') +
      (data.teacherName.trim() ? ` بإشراف ${data.teacherName.trim()}` : '') +
      (data.schoolName.trim() ? ` في ${data.schoolName.trim()}` : '') +
      `، للفصل الدراسي ${data.semester}.`;
    const conclusionText =
      `يُظهر تنفيذ "${subjectLabel}" تحقيق أهدافه المرسومة بما ينعكس إيجاباً على المستفيدين، ` +
      `مع إمكانية الاستفادة من التوصيات المذكورة أعلاه لتطوير التنفيذ مستقبلاً.`;

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(type.docTitle)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #1c1f33; background: #fff; }
    .doc-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .doc-logo { width: 90px; object-fit: contain; }
    .doc-tag { background: #f0fdfa; border: 1px solid ${TEAL_LIGHT}; border-radius: 10px; padding: 8px 14px; text-align: center; }
    .doc-tag-title { font-size: 12px; font-weight: 700; color: ${TEAL}; }
    .doc-tag-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .title-banner { background: ${TEAL_DARK}; color: #fff; text-align: center; padding: 16px 20px; border-radius: 12px; font-size: 22px; font-weight: 800; }
    .dot-divider { height: 12px; margin: 10px 0 18px; background-image: radial-gradient(circle, ${TEAL} 2.4px, transparent 2.6px); background-size: 16px 16px; background-repeat: repeat-x; background-position: center; opacity: 0.55; }
    .subtitle-line { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 18px; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card-heading { font-size: 15px; font-weight: 700; color: ${TEAL_DARK}; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .card-text { font-size: 13px; line-height: 1.9; color: #374151; }
    .bullet-list { margin: 0; padding-right: 18px; font-size: 13px; line-height: 1.9; color: #374151; }
    .bullet-list li { margin-bottom: 4px; }
    .empty-hint { font-size: 12px; color: #9ca3af; }
    .badges-row { display: flex; flex-wrap: wrap; justify-content: space-around; gap: 12px; }
    .badge-item { width: 22%; min-width: 90px; text-align: center; }
    .badge-num { width: 38px; height: 38px; line-height: 38px; border-radius: 19px; background: ${TEAL_DARK}; color: #fff; font-weight: 800; font-size: 15px; margin: 0 auto 6px; }
    .badge-label { font-size: 12px; color: #374151; }
    .evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
    .evidence-card { border: 2px dashed #d1d5db; border-radius: 10px; padding: 10px; text-align: center; background: #f9fafb; }
    .evidence-icon { font-size: 20px; margin-bottom: 4px; }
    .evidence-caption { font-size: 11px; font-weight: 700; color: ${TEAL}; margin-bottom: 4px; }
    .evidence-text { font-size: 11px; color: #6b7280; }
    .two-col { display: flex; gap: 14px; }
    .two-col .card { flex: 1; margin-bottom: 0; }
    .approval-row { display: flex; gap: 14px; margin-bottom: 10px; }
    .approval-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; text-align: center; background: #f9fafb; }
    .approval-label { font-size: 13px; font-weight: 700; color: ${TEAL}; margin-bottom: 6px; }
    .approval-name { font-size: 13px; color: #1c1f33; margin-bottom: 10px; min-height: 16px; }
    .approval-sign { font-size: 11px; color: #6b7280; border-top: 1px dashed #d1d5db; padding-top: 8px; }
    .approval-date { text-align: center; font-size: 12px; color: #374151; }
    .doc-footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="doc-header-top">
    <div class="doc-tag">
      <div class="doc-tag-title">${escapeHtml(type.chipLabel)}</div>
      <div class="doc-tag-sub">التاريخ: ${escapeHtml(todayStr)}</div>
    </div>
    ${logoDataUri ? `<img src="${logoDataUri}" alt="شعار وزارة التعليم" class="doc-logo">` : ''}
  </div>

  <div class="title-banner">${escapeHtml(type.docTitle)}</div>
  <div class="dot-divider"></div>
  <div class="subtitle-line">${escapeHtml(data.educationAdministration)} - ${escapeHtml(data.schoolName)}</div>

  <div class="card">
    <div class="card-heading">نبذة مختصرة</div>
    <div class="card-text">${escapeHtml(summaryText)}</div>
  </div>

  <div class="card">
    <div class="card-heading">${escapeHtml(type.goalsTitle)}</div>
    ${bulletListHtml(type.goals, data.goals, data.goalsOther)}
  </div>

  <div class="card">
    <div class="card-heading">${escapeHtml(type.meansTitle)}</div>
    ${bulletListHtml(type.means, data.means, data.meansOther)}
  </div>

  ${filledSteps.length > 0 ? `
  <div class="card">
    <div class="card-heading">أبرز الأعمال والإجراءات المنفذة</div>
    <div class="badges-row">
      ${filledSteps.map((s, i) => `<div class="badge-item"><div class="badge-num">${i + 1}</div><div class="badge-label">${escapeHtml(s)}</div></div>`).join('')}
    </div>
  </div>` : ''}

  <div class="card">
    <div class="card-heading">شواهد التنفيذ</div>
    <div class="evidence-grid">
      ${evidenceItems.length > 0
        ? evidenceItems.map((e, i) => `<div class="evidence-card"><div class="evidence-icon">🗂️</div><div class="evidence-caption">شاهد رقم ${i + 1}</div><div class="evidence-text">${escapeHtml(e)}</div></div>`).join('')
        : `<div class="evidence-card"><div class="evidence-icon">🗂️</div><div class="evidence-text">لا توجد شواهد مرفقة بعد</div></div>`}
    </div>
  </div>

  <div class="two-col">
    <div class="card">
      <div class="card-heading">التحديات والمعوقات (إن وجدت)</div>
      ${bulletListHtml(type.challenges, data.challenges, data.challengesOther)}
    </div>
    <div class="card">
      <div class="card-heading">المقترحات والتوصيات</div>
      ${bulletListHtml(type.suggestions, data.suggestions, data.suggestionsOther)}
    </div>
  </div>

  <div class="two-col">
    <div class="card">
      <div class="card-heading">${escapeHtml(type.resultsTitle)}</div>
      ${bulletListHtml(type.results, data.results, data.resultsOther)}
    </div>
    <div class="card">
      <div class="card-heading">خاتمة التقرير</div>
      <div class="card-text">${escapeHtml(conclusionText)}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-heading">بيانات اعتماد التقرير</div>
    <div class="approval-row">
      <div class="approval-box">
        <div class="approval-label">مديرة المدرسة</div>
        <div class="approval-name">${escapeHtml(data.principalName) || '&nbsp;'}</div>
        <div class="approval-sign">التوقيع: ..........................</div>
      </div>
      <div class="approval-box">
        <div class="approval-label">${escapeHtml(type.leaderLabel)}</div>
        <div class="approval-name">${escapeHtml(data.activityLeaderName) || '&nbsp;'}</div>
        <div class="approval-sign">التوقيع: ..........................</div>
      </div>
    </div>
    <div class="approval-date">تاريخ التنفيذ: ${escapeHtml(data.implementationDate) || '-'}</div>
  </div>

  <div class="dot-divider"></div>
  <div class="doc-footer">تقرير أُنشئ عبر تطبيق إنجاز المعلم</div>
</body>
</html>`;
  };

  const exportPDF = async (data: ReportForm, idForState: string | null) => {
    const canExport = await checkCanExport();
    if (!canExport) return;
    if (idForState) setExportingId(idForState);
    else setIsExporting(true);
    try {
      const type = getReportType(data.reportType);
      const fileBase = type.docTitle.replace(/\s+/g, '_');
      const htmlContent = await generateReportHtml(data);
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
        const pdfName = `${fileBase}_${new Date().toISOString().split('T')[0]}.pdf`;
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
      const type = getReportType(data.reportType);
      const fileBase = type.docTitle.replace(/\s+/g, '_');
      const htmlContent = await generateReportHtml(data);
      const fileName = `${fileBase}_${new Date().toISOString().split('T')[0]}.doc`;
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
              {formatRTLText(activeType.docTitle)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('نوع التقرير')}</ThemedText>
            </ThemedView>
            <View style={styles.typeChipsRow}>
              {REPORT_TYPES.map((t) => {
                const active = form.reportType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => updateField('reportType', t.id)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol size={16} name={t.chipIcon} color={active ? '#fff' : TEAL} />
                    <ThemedText style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                      {formatRTLText(t.chipLabel)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ThemedView>

          {savedReports.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                  {formatRTLText('التقارير المحفوظة')}
                </ThemedText>
              </ThemedView>
              <View style={styles.savedList}>
                {savedReports.map((report) => {
                  const reportTypeConfig = getReportType(report.reportType);
                  return (
                    <View key={report.id} style={[styles.savedItem, editingId === report.id && styles.savedItemActive]}>
                      <TouchableOpacity style={styles.savedItemInfo} onPress={() => loadReportIntoForm(report)} activeOpacity={0.7}>
                        <View style={styles.savedItemTitleRow}>
                          <IconSymbol size={14} name={reportTypeConfig.chipIcon} color={TEAL} />
                          <ThemedText style={[styles.savedItemTitle, getTextDirection()]}>
                            {formatRTLText(report.program || report.domain || 'تقرير بدون عنوان')}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.savedItemMeta, getTextDirection()]}>
                          {formatRTLText(
                            `${reportTypeConfig.chipLabel} | الأسبوع: ${report.week || '-'} | ${new Date(report.savedAt).toLocaleDateString('ar-SA')}`
                          )}
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
                  );
                })}
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
                <ThemedText style={[styles.label, getTextDirection()]}>{formatRTLText(activeType.programLabel)}</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.program}
                  onChangeText={(v) => updateField('program', v)}
                  placeholder={formatRTLText(activeType.programPlaceholder)}
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
              <ChecklistGroup
                title={activeType.goalsTitle}
                options={activeType.goals}
                selected={form.goals}
                onToggle={(v) => updateField('goals', toggleValue(form.goals, v))}
                otherValue={form.goalsOther}
                onOtherChange={(v) => updateField('goalsOther', v)}
                onAddCustom={(v) => addCustomItem('goals', v)}
                onRemoveCustom={(v) => removeCustomItem('goals', v)}
              />
              <ChecklistGroup
                title={activeType.meansTitle}
                options={activeType.means}
                selected={form.means}
                onToggle={(v) => updateField('means', toggleValue(form.means, v))}
                otherValue={form.meansOther}
                onOtherChange={(v) => updateField('meansOther', v)}
                onAddCustom={(v) => addCustomItem('means', v)}
                onRemoveCustom={(v) => removeCustomItem('means', v)}
              />
              <ChecklistGroup
                title={activeType.resultsTitle}
                options={activeType.results}
                selected={form.results}
                onToggle={(v) => updateField('results', toggleValue(form.results, v))}
                otherValue={form.resultsOther}
                onOtherChange={(v) => updateField('resultsOther', v)}
                onAddCustom={(v) => addCustomItem('results', v)}
                onRemoveCustom={(v) => removeCustomItem('results', v)}
              />
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
              <ChecklistGroup
                title="التحديات والمعوقات (إن وجدت)"
                options={activeType.challenges}
                selected={form.challenges}
                onToggle={(v) => updateField('challenges', toggleValue(form.challenges, v))}
                otherValue={form.challengesOther}
                onOtherChange={(v) => updateField('challengesOther', v)}
                onAddCustom={(v) => addCustomItem('challenges', v)}
                onRemoveCustom={(v) => removeCustomItem('challenges', v)}
              />
              <ChecklistGroup
                title="المقترحات والتوصيات"
                options={activeType.suggestions}
                selected={form.suggestions}
                onToggle={(v) => updateField('suggestions', toggleValue(form.suggestions, v))}
                otherValue={form.suggestionsOther}
                onOtherChange={(v) => updateField('suggestionsOther', v)}
                onAddCustom={(v) => addCustomItem('suggestions', v)}
                onRemoveCustom={(v) => removeCustomItem('suggestions', v)}
              />
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
                <ThemedText style={[styles.label, getTextDirection()]}>{formatRTLText(activeType.leaderLabel)}</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.activityLeaderName}
                  onChangeText={(v) => updateField('activityLeaderName', v)}
                  placeholder={formatRTLText(activeType.leaderPlaceholder)}
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
  typeChipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, padding: 12 },
  typeChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  typeChipActive: { backgroundColor: TEAL },
  typeChipText: { fontSize: 13, fontWeight: '600', color: TEAL },
  typeChipTextActive: { color: '#fff' },
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
  customItemRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  customRemoveButton: { padding: 2 },
  customAddRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 4 },
  customAddButton: { padding: 4 },
  customAddInput: { flex: 1, marginTop: 0 },
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
  savedItemTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
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
