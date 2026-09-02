import React, { useMemo, useState, useEffect } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
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

type GradeLevelKey = 'excellent' | 'veryGood' | 'good' | 'acceptable' | 'weak';
type GradeLevel = { key: GradeLevelKey; label: string; color: string; min: number };

/** سلم تقدير قياسي بالنسبة المئوية من درجة القياس (متسق مع سلم التقدير المعتمد) */
const GRADE_LEVELS: GradeLevel[] = [
  { key: 'excellent', label: 'ممتاز', color: '#22c55e', min: 90 },
  { key: 'veryGood', label: 'جيد جداً', color: '#14b8a6', min: 80 },
  { key: 'good', label: 'جيد', color: '#3b82f6', min: 70 },
  { key: 'acceptable', label: 'مقبول', color: '#f97316', min: 50 },
  { key: 'weak', label: 'ضعيف', color: '#ef4444', min: 0 },
];

type Student = { id: string; name: string; score: string };

type ResultsForm = {
  educationAdministration: string;
  schoolName: string;
  subject: string;
  gradeLevel: string;
  semester: string;
  maxScore: string;
  testLabel: string;
  teacherName: string;
  principalName: string;
  students: Student[];
};

type SavedAnalysis = ResultsForm & { id: string; savedAt: string };

const EMPTY_FORM: ResultsForm = {
  educationAdministration: '',
  schoolName: '',
  subject: '',
  gradeLevel: '',
  semester: '',
  maxScore: '40',
  testLabel: 'الاختبار النهائي',
  teacherName: '',
  principalName: '',
  students: [],
};

const DRAFT_KEY = 'resultsAnalysisDraft';
const ANALYSES_KEY = 'resultsAnalysisSaved';
const FREE_USE_KEY = 'resultsAnalysisFreeUseUsed';

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

type LevelStat = GradeLevel & { count: number; low: number; high: number; percent: number };
type Analysis = {
  count: number;
  max: number;
  min: number;
  average: number;
  sum: number;
  achievementPercent: number;
  levels: LevelStat[];
};

/** يحسب الإحصائيات وتوزيع الطلاب على مستويات التقدير بناءً على درجة القياس */
const computeAnalysis = (students: Student[], maxScore: number): Analysis | null => {
  const scores = students
    .map((s) => parseFloat(s.score))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (scores.length === 0 || !(maxScore > 0)) return null;

  const count = scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const sum = scores.reduce((a, b) => a + b, 0);
  const average = sum / count;
  const achievementPercent = (average / maxScore) * 100;

  const levels: LevelStat[] = GRADE_LEVELS.map((level, index) => {
    const low = Math.ceil((level.min / 100) * maxScore);
    const high = index === 0 ? maxScore : Math.ceil((GRADE_LEVELS[index - 1].min / 100) * maxScore) - 1;
    const nextMin = index === 0 ? Infinity : GRADE_LEVELS[index - 1].min;
    const levelCount = scores.filter((s) => {
      const pct = (s / maxScore) * 100;
      return pct >= level.min && pct < nextMin;
    }).length;
    return { ...level, low, high, count: levelCount, percent: count > 0 ? (levelCount / count) * 100 : 0 };
  });

  return { count, max, min, average, sum, achievementPercent, levels };
};

/** يحاول استخراج عمودي "اسم الطالب" و"الدرجة" من صفوف إكسل خام (مع أو بدون رأس أعمدة) */
const parseExcelRows = (rows: any[][]): Student[] => {
  if (!rows || rows.length === 0) return [];
  let startIdx = 0;
  let nameIdx = 0;
  let scoreIdx = 1;
  const header = (rows[0] || []).map((c) => String(c ?? '').trim());
  const nameHeaderIdx = header.findIndex((h) => /اسم|name/i.test(h));
  const scoreHeaderIdx = header.findIndex((h) => /درجة|نتيجة|score|grade|mark/i.test(h));
  if (nameHeaderIdx !== -1 || scoreHeaderIdx !== -1) {
    startIdx = 1;
    if (nameHeaderIdx !== -1) nameIdx = nameHeaderIdx;
    if (scoreHeaderIdx !== -1) scoreIdx = scoreHeaderIdx;
  }
  const students: Student[] = [];
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const name = String(row[nameIdx] ?? '').trim();
    const scoreRaw = row[scoreIdx];
    const score = typeof scoreRaw === 'number' ? scoreRaw : parseFloat(String(scoreRaw ?? '').replace(/[^\d.]/g, ''));
    if (!name || Number.isNaN(score)) continue;
    students.push({ id: `${Date.now()}-${i}`, name, score: String(score) });
  }
  return students;
};

export default function ResultsAnalysisScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ResultsForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [wordDownload, setWordDownload] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [draft, saved, basicData] = await Promise.all([
        AsyncStorage.getItem(DRAFT_KEY),
        AsyncStorage.getItem(ANALYSES_KEY),
        AsyncStorage.getItem('basicData'),
      ]);
      let nextForm = { ...EMPTY_FORM };
      if (basicData) {
        const parsed = JSON.parse(basicData);
        if (parsed.fullName) nextForm.teacherName = parsed.fullName;
        if (parsed.school) nextForm.schoolName = parsed.school;
        if (parsed.educationDepartment) nextForm.educationAdministration = parsed.educationDepartment;
      }
      if (draft) nextForm = { ...nextForm, ...JSON.parse(draft) };
      setForm(nextForm);
      if (saved) setSavedAnalyses(JSON.parse(saved));
    } catch (e) {
      console.log('Error loading results analysis data:', e);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [form]);

  const updateField = <K extends keyof ResultsForm>(key: K, value: ResultsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setShowAnalysis(false);
  };

  const addStudent = () => {
    setForm((prev) => ({ ...prev, students: [...prev.students, { id: `${Date.now()}`, name: '', score: '' }] }));
    setShowAnalysis(false);
  };

  const removeStudent = (id: string) => {
    setForm((prev) => ({ ...prev, students: prev.students.filter((s) => s.id !== id) }));
  };

  const updateStudent = (id: string, field: 'name' | 'score', value: string) => {
    setForm((prev) => ({ ...prev, students: prev.students.map((s) => (s.id === id ? { ...s, [field]: value } : s)) }));
    setShowAnalysis(false);
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

  const importFromExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setIsImporting(true);
      const asset = result.assets[0];
      let workbook: XLSX.WorkBook;
      if (Platform.OS === 'web') {
        const res = await fetch(asset.uri);
        const arrayBuffer = await res.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        workbook = XLSX.read(base64, { type: 'base64' });
      }
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const parsed = parseExcelRows(rows);
      if (parsed.length === 0) {
        showAlert(
          formatRTLText('تعذر استخراج البيانات'),
          formatRTLText('تأكد أن الملف يحتوي على عمودين: اسم الطالب والدرجة.')
        );
        return;
      }
      setForm((prev) => ({ ...prev, students: [...prev.students, ...parsed] }));
      setShowAnalysis(false);
      showAlert(formatRTLText('تم الاستيراد'), formatRTLText(`تمت إضافة ${parsed.length} طالب من ملف الإكسل.`));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showAlert(formatRTLText('فشل الاستيراد'), formatRTLText('تعذر قراءة ملف الإكسل.') + (msg ? ` (${msg})` : ''));
    } finally {
      setIsImporting(false);
    }
  };

  const analysis = useMemo(
    () => computeAnalysis(form.students, parseFloat(form.maxScore) || 0),
    [form.students, form.maxScore]
  );

  /** الاشتراك المجاني يتيح استخدام تحليل النتائج مرة واحدة فقط (محلياً على الجهاز)؛ الاشتراك المدفوع بلا حدود */
  const checkCanUseAnalysis = async (): Promise<boolean> => {
    try {
      const user = (await AuthService.getCurrentUser()) ?? (await AuthService.checkAuthStatus());
      if (user) {
        const status = await SubscriptionService.checkSubscriptionStatus(user.id);
        if (status.currentPlan === 'yearly' || status.currentPlan === 'half_yearly') {
          return true;
        }
      }
      const used = await AsyncStorage.getItem(FREE_USE_KEY);
      if (used === '1') {
        showAlert(
          formatRTLText('انتهت المحاولة المجانية'),
          formatRTLText('يتيح الاشتراك المجاني استخدام تحليل النتائج مرة واحدة فقط. يرجى ترقية اشتراكك لاستخدام الميزة دون حدود.'),
          [
            { text: formatRTLText('حسناً'), style: 'cancel' },
            { text: formatRTLText('عرض الخطط'), onPress: () => router.push('/subscription') },
          ]
        );
        return false;
      }
      await AsyncStorage.setItem(FREE_USE_KEY, '1');
      return true;
    } catch {
      return true;
    }
  };

  const handleAnalyze = async () => {
    if (!analysis) {
      showAlert(
        formatRTLText('بيانات غير كافية'),
        formatRTLText('يرجى إدخال درجة القياس وإضافة طالب واحد على الأقل بدرجة صحيحة.')
      );
      return;
    }
    const canUse = await checkCanUseAnalysis();
    if (!canUse) return;
    setShowAnalysis(true);
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...EMPTY_FORM,
      schoolName: prev.schoolName,
      educationAdministration: prev.educationAdministration,
      teacherName: prev.teacherName,
    }));
    setEditingId(null);
    setShowAnalysis(false);
  };

  const handleNewAnalysis = () => {
    showAlert(
      formatRTLText('تحليل جديد'),
      formatRTLText('سيتم تفريغ النموذج الحالي لبدء تحليل جديد. هل تريد المتابعة؟'),
      [
        { text: formatRTLText('إلغاء'), style: 'cancel' },
        { text: formatRTLText('نعم، تفريغ'), style: 'destructive', onPress: resetForm },
      ]
    );
  };

  const handleSaveAnalysis = async () => {
    if (!form.subject.trim()) {
      showAlert(formatRTLText('بيانات ناقصة'), formatRTLText('يرجى إدخال اسم المادة قبل الحفظ.'));
      return;
    }
    try {
      let updated: SavedAnalysis[];
      if (editingId) {
        updated = savedAnalyses.map((a) => (a.id === editingId ? { ...form, id: editingId, savedAt: new Date().toISOString() } : a));
      } else {
        const newAnalysis: SavedAnalysis = { ...form, id: `${Date.now()}`, savedAt: new Date().toISOString() };
        updated = [newAnalysis, ...savedAnalyses];
        setEditingId(newAnalysis.id);
      }
      setSavedAnalyses(updated);
      await AsyncStorage.setItem(ANALYSES_KEY, JSON.stringify(updated));
      showAlert(formatRTLText('تم الحفظ'), formatRTLText('تم حفظ التحليل في قائمة التحليلات المحفوظة.'));
    } catch {
      showAlert(formatRTLText('خطأ'), formatRTLText('تعذر حفظ التحليل.'));
    }
  };

  const loadAnalysisIntoForm = (item: SavedAnalysis) => {
    const { id, savedAt, ...rest } = item;
    setForm(rest);
    setEditingId(id);
    setShowAnalysis(false);
  };

  const deleteAnalysis = (id: string) => {
    showAlert(
      formatRTLText('حذف التحليل'),
      formatRTLText('هل أنت متأكد من حذف هذا التحليل؟ لا يمكن التراجع عن هذا الإجراء.'),
      [
        { text: formatRTLText('إلغاء'), style: 'cancel' },
        {
          text: formatRTLText('حذف'),
          style: 'destructive',
          onPress: async () => {
            const updated = savedAnalyses.filter((a) => a.id !== id);
            setSavedAnalyses(updated);
            await AsyncStorage.setItem(ANALYSES_KEY, JSON.stringify(updated));
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
        formatRTLText('يرجى تسجيل الدخول للسماح بتصدير التحليل.'),
        [{ text: formatRTLText('حسناً'), style: 'cancel' }]
      );
      return false;
    }
    const status = await SubscriptionService.checkSubscriptionStatus(user.id);
    if (!status?.features?.canExport) {
      showAlert(
        formatRTLText('ترقية الاشتراك مطلوبة'),
        formatRTLText('تصدير التحليل (PDF و Word) متاح للاشتراك السنوي ونصف السنوي فقط.'),
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

  const generateAnalysisHtml = async (data: ResultsForm): Promise<string> => {
    const result = computeAnalysis(data.students, parseFloat(data.maxScore) || 0);
    const logoDataUri = await loadMoeLogoDataUri();
    const todayStr = new Date().toLocaleDateString('ar-SA');
    const maxCount = result ? Math.max(1, ...result.levels.map((l) => l.count)) : 1;

    const statBoxesHtml = result
      ? `
      <div class="stat-item"><span class="stat-label">عدد الطلاب</span><span class="stat-value">${result.count}</span></div>
      <div class="stat-item"><span class="stat-label">أعلى درجة</span><span class="stat-value">${result.max}</span></div>
      <div class="stat-item"><span class="stat-label">أقل درجة</span><span class="stat-value">${result.min}</span></div>
      <div class="stat-item"><span class="stat-label">متوسط الدرجات</span><span class="stat-value">${result.average.toFixed(1)}</span></div>
      <div class="stat-item"><span class="stat-label">نسبة التحصيل</span><span class="stat-value">%${Math.round(result.achievementPercent)}</span></div>
      <div class="stat-item"><span class="stat-label">مجموع الدرجات</span><span class="stat-value">${result.sum}</span></div>`
      : `<div class="empty-hint">لا توجد بيانات كافية</div>`;

    const levelsTableHtml = result
      ? `
      <table class="levels-table">
        <tr><th>المستوى</th><th>النطاق</th><th>عدد الطلاب</th></tr>
        ${result.levels
          .map(
            (l) =>
              `<tr><td><span class="level-badge" style="background:${l.color}">${escapeHtml(l.label)}</span></td><td>${l.low} - ${l.high}</td><td>${l.count}</td></tr>`
          )
          .join('')}
      </table>`
      : '';

    const donutsHtml = result
      ? result.levels
          .map((l) => {
            const pct = Math.round(l.percent);
            return `
        <div class="donut-item">
          <div class="donut" style="background: conic-gradient(${l.color} 0% ${pct}%, #e5e7eb ${pct}% 100%)">
            <div class="donut-hole"><div class="donut-pct">%${pct}</div></div>
          </div>
          <div class="donut-label">${escapeHtml(l.label)}</div>
        </div>`;
          })
          .join('')
      : '';

    const barsHtml = result
      ? result.levels
          .map((l) => {
            const heightPx = Math.max(6, Math.round((l.count / maxCount) * 60));
            return `
        <div class="bar-item">
          <div class="bar-count">${l.count}</div>
          <div class="bar-fill" style="height:${heightPx}px; background:${l.color}"></div>
          <div class="bar-label">${escapeHtml(l.label)}</div>
        </div>`;
          })
          .join('')
      : '';

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>تحليل نتائج اختبار</title>
  <style>
    @page { size: A4; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #e5e7eb; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1c1f33; }
    .page { width: 210mm; height: 297mm; margin: 0 auto; overflow: hidden; box-sizing: border-box; padding: 10mm 12mm; background: #fff; }
    .page-inner { transform-origin: top center; }
    .doc-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .doc-logo { width: 70px; object-fit: contain; }
    .doc-tag { background: #f0fdfa; border: 1px solid ${TEAL_LIGHT}; border-radius: 10px; padding: 6px 12px; text-align: center; }
    .doc-tag-title { font-size: 11px; font-weight: 700; color: ${TEAL}; }
    .doc-tag-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .title-banner { background: ${TEAL_DARK}; color: #fff; text-align: center; padding: 10px 16px; border-radius: 10px; font-size: 17px; font-weight: 800; }
    .dot-divider { height: 8px; margin: 6px 0 10px; background-image: radial-gradient(circle, ${TEAL} 2px, transparent 2.2px); background-size: 14px 14px; background-repeat: repeat-x; background-position: center; opacity: 0.55; }
    .info-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .info-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; text-align: center; background: #f9fafb; }
    .info-box-label { font-size: 10px; color: #6b7280; margin-bottom: 3px; }
    .info-box-value { font-size: 12px; font-weight: 700; color: #1c1f33; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 12px; margin-bottom: 8px; }
    .card-heading { font-size: 12.5px; font-weight: 700; color: ${TEAL_DARK}; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; text-align: center; }
    .two-col { display: flex; gap: 8px; }
    .two-col .card { flex: 1; margin-bottom: 8px; }
    .stat-grid { display: flex; flex-direction: column; gap: 6px; }
    .stat-item { display: flex; justify-content: space-between; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 10px; background: #f9fafb; }
    .stat-label { font-size: 11px; color: ${TEAL}; font-weight: 700; }
    .stat-value { font-size: 13px; font-weight: 800; color: #1c1f33; }
    .empty-hint { font-size: 10.5px; color: #9ca3af; text-align: center; }
    .levels-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .levels-table th, .levels-table td { border: 1px solid #e5e7eb; padding: 6px; text-align: center; }
    .levels-table th { background: ${TEAL_LIGHT}; color: #fff; font-weight: 700; }
    .level-badge { display: inline-block; color: #fff; border-radius: 6px; padding: 2px 10px; font-weight: 700; font-size: 10.5px; }
    .donuts-row, .bars-row { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 6px; }
    .donut-item, .bar-item { width: 18%; min-width: 72px; text-align: center; }
    .donut { width: 58px; height: 58px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .donut-hole { width: 40px; height: 40px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; }
    .donut-pct { font-size: 10px; font-weight: 800; color: #1c1f33; }
    .donut-label { font-size: 10px; margin-top: 4px; color: #374151; }
    .bar-item { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100px; }
    .bar-count { font-size: 11px; font-weight: 700; margin-bottom: 3px; }
    .bar-fill { width: 32px; border-radius: 6px 6px 0 0; }
    .bar-label { font-size: 10px; margin-top: 4px; color: #374151; }
    .approval-row { display: flex; gap: 8px; }
    .approval-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; text-align: center; background: #f9fafb; }
    .approval-label { font-size: 11px; font-weight: 700; color: ${TEAL}; margin-bottom: 4px; }
    .approval-name { font-size: 11px; color: #1c1f33; min-height: 14px; }
    .doc-footer { text-align: center; color: #9ca3af; font-size: 10px; margin-top: 4px; }
  </style>
</head>
<body>
<div class="page"><div class="page-inner">
  <div class="doc-header-top">
    <div class="doc-tag">
      <div class="doc-tag-title">${escapeHtml(data.testLabel) || 'اختبار'}</div>
      <div class="doc-tag-sub">التاريخ: ${escapeHtml(todayStr)}</div>
    </div>
    <div style="text-align:left;">
      <div class="doc-tag-value" style="font-size:11px; font-weight:700; color:#1c1f33;">${escapeHtml(data.educationAdministration)}</div>
      <div class="doc-tag-value" style="font-size:11px; color:#6b7280;">${escapeHtml(data.schoolName)}</div>
    </div>
    ${logoDataUri ? `<img src="${logoDataUri}" alt="شعار وزارة التعليم" class="doc-logo">` : ''}
  </div>

  <div class="title-banner">تحليل نتائج اختبار مادة [${escapeHtml(data.subject) || '-'}]</div>
  <div class="dot-divider"></div>

  <div class="info-row">
    <div class="info-box"><div class="info-box-label">المرحلة الدراسية / الصف</div><div class="info-box-value">${escapeHtml(data.gradeLevel) || '-'}</div></div>
    <div class="info-box"><div class="info-box-label">السنة / الفصل الدراسي</div><div class="info-box-value">${escapeHtml(data.semester) || '-'}</div></div>
    <div class="info-box"><div class="info-box-label">درجة القياس (الاختبار)</div><div class="info-box-value">${escapeHtml(data.maxScore) || '-'}</div></div>
  </div>

  <div class="card">
    <div class="card-heading">الإحصائيات التفصيلية</div>
    <div class="two-col">
      <div class="stat-grid">${statBoxesHtml}</div>
      ${levelsTableHtml}
    </div>
  </div>

  <div class="card">
    <div class="card-heading">رسم بياني (نسب الطلاب لكل تقدير)</div>
    <div class="donuts-row">${donutsHtml}</div>
  </div>

  <div class="card">
    <div class="card-heading">رسم بياني (عدد الطلاب لكل تقدير)</div>
    <div class="bars-row">${barsHtml}</div>
  </div>

  <div class="approval-row">
    <div class="approval-box">
      <div class="approval-label">معلم/ة المادة - الاسم</div>
      <div class="approval-name">${escapeHtml(data.teacherName) || '&nbsp;'}</div>
    </div>
    <div class="approval-box">
      <div class="approval-label">مدير/ة المدرسة - الاسم</div>
      <div class="approval-name">${escapeHtml(data.principalName) || '&nbsp;'}</div>
    </div>
  </div>

  <div class="dot-divider"></div>
  <div class="doc-footer">تقرير أُنشئ عبر تطبيق إنجاز المعلم</div>
</div></div>
<script>
  (function () {
    function fitToPage() {
      var page = document.querySelector('.page');
      var inner = document.querySelector('.page-inner');
      if (!page || !inner) return;
      inner.style.transform = 'none';
      var pageHeight = page.clientHeight;
      var contentHeight = inner.scrollHeight;
      if (contentHeight > pageHeight && pageHeight > 0) {
        var scale = pageHeight / contentHeight;
        inner.style.transform = 'scale(' + scale + ')';
      }
    }
    if (document.readyState === 'complete') fitToPage();
    else window.addEventListener('load', fitToPage);
  })();
</script>
</body>
</html>`;
  };

  const exportPDF = async (data: ResultsForm, idForState: string | null) => {
    const canExport = await checkCanExport();
    if (!canExport) return;
    setIsExporting(true);
    try {
      const htmlContent = await generateAnalysisHtml(data);
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
        const pdfName = `تحليل_نتائج_${new Date().toISOString().split('T')[0]}.pdf`;
        const dest = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({ from: uri, to: dest });
        await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: formatRTLText('تصدير التحليل PDF') });
      }
      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التحليل كملف PDF.'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showAlert(formatRTLText('فشل التصدير'), formatRTLText('تعذر تصدير PDF.') + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExporting(false);
    }
  };

  const exportWord = async (data: ResultsForm) => {
    const canExport = await checkCanExport();
    if (!canExport) return;
    setIsExporting(true);
    try {
      const htmlContent = await generateAnalysisHtml(data);
      const fileName = `تحليل_نتائج_${new Date().toISOString().split('T')[0]}.doc`;
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
      await Sharing.shareAsync(filePath, { mimeType: 'application/msword', dialogTitle: formatRTLText('تصدير التحليل Word') });
      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التحليل كملف Word.'));
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
            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="chart.bar.fill" color="#1c1f33" />
            </ThemedView>
            <ThemedView style={styles.titleRow}>
              <ThemedText type="title" style={[styles.mainTitle, getTextDirection()]}>
                {formatRTLText('تحليل النتائج')}
              </ThemedText>
            </ThemedView>
            <ThemedText style={[styles.headerSubtitle, getTextDirection()]}>
              {formatRTLText('تحليل نتائج اختبارات المواد الدراسية')}
            </ThemedText>
          </ThemedView>

          {savedAnalyses.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('التحليلات المحفوظة')}</ThemedText>
              </ThemedView>
              <View style={styles.savedList}>
                {savedAnalyses.map((item) => (
                  <View key={item.id} style={[styles.savedItem, editingId === item.id && styles.savedItemActive]}>
                    <TouchableOpacity style={styles.savedItemInfo} onPress={() => loadAnalysisIntoForm(item)} activeOpacity={0.7}>
                      <ThemedText style={[styles.savedItemTitle, getTextDirection()]}>
                        {formatRTLText(item.subject || 'تحليل بدون مادة')}
                      </ThemedText>
                      <ThemedText style={[styles.savedItemMeta, getTextDirection()]}>
                        {formatRTLText(`${item.gradeLevel || '-'} | ${item.students.length} طالب | ${new Date(item.savedAt).toLocaleDateString('ar-SA')}`)}
                      </ThemedText>
                    </TouchableOpacity>
                    <View style={styles.savedItemActions}>
                      <TouchableOpacity style={styles.savedIconButton} onPress={() => exportPDF(item, item.id)}>
                        <IconSymbol size={18} name="doc.pdf" color={TEAL} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.savedIconButton} onPress={() => deleteAnalysis(item.id)}>
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
                {formatRTLText(editingId ? 'تعديل بيانات التحليل' : 'بيانات التحليل')}
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
                <ThemedText style={[styles.label, getTextDirection()]}>نوع الاختبار</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.testLabel}
                  onChangeText={(v) => updateField('testLabel', v)}
                  placeholder={formatRTLText('مثال: الاختبار النهائي')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>المادة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.subject}
                  onChangeText={(v) => updateField('subject', v)}
                  placeholder={formatRTLText('مثال: الرياضيات')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>المرحلة الدراسية / الصف</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.gradeLevel}
                  onChangeText={(v) => updateField('gradeLevel', v)}
                  placeholder={formatRTLText('مثال: ثاني متوسط / 2')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>السنة / الفصل الدراسي</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.semester}
                  onChangeText={(v) => updateField('semester', v)}
                  placeholder={formatRTLText('مثال: الفصل الأول 1447هـ')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>درجة القياس (الاختبار)</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.maxScore}
                  onChangeText={(v) => updateField('maxScore', v)}
                  placeholder={formatRTLText('مثال: 40')}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('بيانات الطلاب')}</ThemedText>
            </ThemedView>
            <View style={styles.importRow}>
              <TouchableOpacity style={styles.importButton} onPress={importFromExcel} disabled={isImporting}>
                {isImporting ? (
                  <ActivityIndicator size="small" color={TEAL} />
                ) : (
                  <>
                    <IconSymbol size={18} name="tablecells" color={TEAL} />
                    <ThemedText style={[styles.importButtonText, getTextDirection()]}>{formatRTLText('استيراد إكسل')}</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {form.students.length > 0 && (
              <View style={styles.studentsTable}>
                <View style={styles.studentHeaderRow}>
                  <ThemedText style={[styles.studentHeaderCell, styles.studentNameCol, getTextDirection()]}>
                    {formatRTLText('اسم الطالب')}
                  </ThemedText>
                  <ThemedText style={[styles.studentHeaderCell, styles.studentScoreCol, getTextDirection()]}>
                    {formatRTLText('الدرجة')}
                  </ThemedText>
                  <View style={styles.studentRemoveCol} />
                </View>
                {form.students.map((student, index) => (
                  <View key={student.id} style={styles.studentRow}>
                    <TextInput
                      style={[styles.studentInput, styles.studentNameCol, getTextDirection()]}
                      value={student.name}
                      onChangeText={(v) => updateStudent(student.id, 'name', v)}
                      placeholder={formatRTLText(`الطالب ${index + 1}`)}
                      placeholderTextColor="#999"
                    />
                    <TextInput
                      style={[styles.studentInput, styles.studentScoreCol, getTextDirection()]}
                      value={student.score}
                      onChangeText={(v) => updateStudent(student.id, 'score', v)}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.studentRemoveCol} onPress={() => removeStudent(student.id)}>
                      <IconSymbol size={18} name="xmark.circle.fill" color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.addStudentButton} onPress={addStudent}>
              <IconSymbol size={18} name="person.badge.plus" color={TEAL} />
              <ThemedText style={[styles.addStudentButtonText, getTextDirection()]}>{formatRTLText('إضافة طالب')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('اعتماد التقرير')}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>معلم/ة المادة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.teacherName}
                  onChangeText={(v) => updateField('teacherName', v)}
                  placeholder={formatRTLText('اسم معلم/ة المادة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>مدير/ة المدرسة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={form.principalName}
                  onChangeText={(v) => updateField('principalName', v)}
                  placeholder={formatRTLText('اسم مدير/ة المدرسة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.exportSection}>
            <View style={styles.exportButtonsRow}>
              <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                <IconSymbol size={20} name="chart.bar.fill" color="#fff" />
                <ThemedText style={[styles.exportButtonText, getTextDirection()]}>{formatRTLText('تحليل النتائج')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {showAnalysis && analysis && (
            <ThemedView style={styles.section}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('نتائج التحليل')}</ThemedText>
              </ThemedView>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{analysis.count}</ThemedText>
                  <ThemedText style={styles.statLabel}>{formatRTLText('عدد الطلاب')}</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{analysis.max}</ThemedText>
                  <ThemedText style={styles.statLabel}>{formatRTLText('أعلى درجة')}</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{analysis.min}</ThemedText>
                  <ThemedText style={styles.statLabel}>{formatRTLText('أقل درجة')}</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{analysis.average.toFixed(1)}</ThemedText>
                  <ThemedText style={styles.statLabel}>{formatRTLText('متوسط الدرجات')}</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{`%${Math.round(analysis.achievementPercent)}`}</ThemedText>
                  <ThemedText style={styles.statLabel}>{formatRTLText('نسبة التحصيل')}</ThemedText>
                </View>
                <View style={styles.statBox}>
                  <ThemedText style={styles.statValue}>{analysis.sum}</ThemedText>
                  <ThemedText style={styles.statLabel}>{formatRTLText('مجموع الدرجات')}</ThemedText>
                </View>
              </View>
              <View style={styles.levelsTable}>
                {analysis.levels.map((level) => (
                  <View key={level.key} style={styles.levelRow}>
                    <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
                      <ThemedText style={styles.levelBadgeText}>{formatRTLText(level.label)}</ThemedText>
                    </View>
                    <ThemedText style={[styles.levelRange, getTextDirection()]}>{`${level.low} - ${level.high}`}</ThemedText>
                    <ThemedText style={[styles.levelCount, getTextDirection()]}>{level.count}</ThemedText>
                  </View>
                ))}
              </View>
            </ThemedView>
          )}

          <ThemedView style={styles.exportSection}>
            <View style={styles.exportButtonsRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAnalysis}>
                <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                <ThemedText style={[styles.exportButtonText, getTextDirection()]}>
                  {formatRTLText(editingId ? 'تحديث التحليل' : 'حفظ التحليل')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newButton} onPress={handleNewAnalysis}>
                <IconSymbol size={20} name="doc.badge.plus" color="#fff" />
                <ThemedText style={[styles.exportButtonText, getTextDirection()]}>{formatRTLText('تحليل جديد')}</ThemedText>
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
  header: { alignItems: 'center', marginBottom: 20, position: 'relative', backgroundColor: 'transparent' },
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
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', justifyContent: 'center', backgroundColor: 'transparent' },
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
  importRow: { flexDirection: 'row-reverse', gap: 10, padding: 12, paddingBottom: 0 },
  importButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TEAL,
    backgroundColor: '#f0fdfa',
  },
  importButtonText: { fontSize: 13, fontWeight: '600', color: TEAL },
  studentsTable: { padding: 12, gap: 6 },
  studentHeaderRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 4 },
  studentHeaderCell: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  studentRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 },
  studentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1c1f33',
    backgroundColor: '#f9fafb',
  },
  studentNameCol: { flex: 3 },
  studentScoreCol: { flex: 1 },
  studentRemoveCol: { width: 24, alignItems: 'center' },
  addStudentButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    margin: 12,
    marginTop: 0,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: TEAL,
  },
  addStudentButtonText: { fontSize: 13, fontWeight: '600', color: TEAL },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statBox: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1c1f33' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  levelsTable: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  levelRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  levelBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, minWidth: 70, alignItems: 'center' },
  levelBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  levelRange: { fontSize: 12, color: '#374151', flex: 1, textAlign: 'center' },
  levelCount: { fontSize: 13, fontWeight: '700', color: '#1c1f33', width: 40, textAlign: 'center' },
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
  analyzeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL_DARK,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 200,
    justifyContent: 'center',
  },
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
