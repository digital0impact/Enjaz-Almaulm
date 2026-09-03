import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  ActivityIndicator,
  TextInput,
  Modal,
  View,
  StyleSheet
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { AIAssistButton } from '@/components/AIAssistButton';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { isDemoModeActive } from '@/services/DemoModeGuard';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const TEAL_DARK = '#0b4f47';
const GREEN = '#059669';

/**
 * نُبقي هذه الأنواع محلية (بدل استيراد Student من @/types) لأنها تطابق شكل البيانات
 * الفعلي المحفوظ في AsyncStorage تاريخياً (حالة الأهداف/الشواهد هنا تختلف عن types/index.ts).
 */
interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate?: string;
  progress: number; // 0-100
  status: 'محقق' | 'قيد التنفيذ' | 'لم يبدأ';
}

interface PerformanceEvidence {
  id: string;
  type: string;
  title: string;
  fileName?: string;
  fileType?: string;
  date: string;
  notes: string;
}

interface RemedialPlan {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  startDate: string;
  endDate: string;
  status: 'نشط' | 'مكتمل' | 'معلق';
  progress: number;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'يحتاج إلى تطوير' | 'صعوبات التعلم' | 'ضعف' | 'ممتاز' | 'مقبول';
  lastUpdate: string;
  notes: string;
  goals: Goal[];
  needs: string[];
  performanceEvidence: PerformanceEvidence[];
}

const EMPTY_STUDENT_FORM: Student = {
  id: '',
  name: '',
  grade: '',
  status: 'يحتاج إلى تطوير',
  lastUpdate: '',
  notes: '',
  goals: [],
  needs: [],
  performanceEvidence: [],
};

const STATUS_OPTIONS = [
  { value: 'صعوبات التعلم', label: 'صعوبات التعلم', color: '#F44336', icon: 'exclamationmark.triangle.fill' },
  { value: 'يحتاج إلى تطوير', label: 'يحتاج إلى تطوير', color: '#FF5722', icon: 'star' },
  { value: 'تفوق', label: 'تفوق', color: '#4CAF50', icon: 'star.fill' },
  { value: 'ضعف', label: 'ضعف', color: '#9C27B0', icon: 'minus.circle.fill' },
] as const;

const EVIDENCE_TYPES = [
  { value: 'اختبار', label: 'اختبار', icon: 'doc.text' },
  { value: 'مشروع', label: 'مشروع', icon: 'folder' },
  { value: 'واجب', label: 'واجب', icon: 'pencil' },
  { value: 'مشاركة', label: 'مشاركة', icon: 'hand.raised' },
  { value: 'سلوك', label: 'سلوك', icon: 'person.circle' },
] as const;

/** ===== بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية ) ===== */

const DIFFICULTY_NEEDS_OPTIONS = [
  'ضعف فهم المفهوم',
  'صعوبة تطبيق الخطوات',
  'أخطاء في المهارات الأساسية',
  'حاجة إلى تدريب إضافي',
];

type DifficultyEntry = {
  id: string;
  studentName: string;
  skill: string;
  masteryPercent: string;
  afterPercent: string;
  plan: string;
  followUpDate: string;
  responsible: string;
};

type SkillPlan = {
  objective: string;
  strategy: string;
  resources: string;
  duration: string;
  measurementTool: string;
};

type DifficultyCard = {
  subjectGrade: string;
  schoolType: string;
  schoolName: string;
  masteryCriteria: string;
  measurementType: string;
  followUpPeriod: string;
  deputyName: string;
  teacherName: string;
  needs: string[];
  needsOther: string;
  entries: DifficultyEntry[];
  skillPlans: Record<string, SkillPlan>;
  highlightAchieved: string;
  stillNeedsSupport: string;
  nextAction: string;
  reviewDate: string;
};

const EMPTY_DIFFICULTY_ENTRY = (): DifficultyEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  studentName: '',
  skill: '',
  masteryPercent: '',
  afterPercent: '',
  plan: '',
  followUpDate: '',
  responsible: 'المعلم',
});

const EMPTY_DIFFICULTY_CARD: DifficultyCard = {
  subjectGrade: '',
  schoolType: '',
  schoolName: '',
  masteryCriteria: '80',
  measurementType: '',
  followUpPeriod: '',
  deputyName: '',
  teacherName: '',
  needs: [],
  needsOther: '',
  entries: [],
  skillPlans: {},
  highlightAchieved: '',
  stillNeedsSupport: '',
  nextAction: '',
  reviewDate: '',
};

/** يحدد مستوى الأداء بمقارنة نسبة الإتقان بمعيار الإتقان المعتمد */
const getPerformanceLevel = (percent: number, criteria: number): { label: string; color: string } => {
  const gap = criteria - percent;
  if (gap <= 0) return { label: 'متقن', color: '#22c55e' };
  if (gap <= 10) return { label: 'قريب من الإتقان', color: '#f59e0b' };
  return { label: 'يحتاج إلى دعم', color: '#ef4444' };
};

/** يصف مدى التحسن بين نسبتي الإتقان قبل وبعد التدخل */
const getImprovementLabel = (before: number, after: number): string => {
  const delta = after - before;
  if (delta >= 15) return 'تحسن واضح';
  if (delta >= 8) return 'تحسن جيد';
  if (delta >= 1) return 'تحسن متوسط';
  if (delta === 0) return 'استقرار';
  return 'تحسن محدود';
};

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default function StudentTrackingScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // نموذج الإضافة/التعديل — يظهر إن-لاين ضمن نفس الصفحة
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Student>(EMPTY_STUDENT_FORM);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', progress: 0, status: 'لم يبدأ' as Goal['status'] });
  const [newNeed, setNewNeed] = useState('');
  const [newEvidence, setNewEvidence] = useState<Partial<PerformanceEvidence>>({
    type: 'اختبار', title: '', fileName: '', fileType: '', date: '', notes: '',
  });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const proceedWithSaveRef = useRef<(() => Promise<void>) | null>(null);

  // بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )
  const [difficultyCardVisible, setDifficultyCardVisible] = useState(false);
  const [difficultyCard, setDifficultyCard] = useState<DifficultyCard>(EMPTY_DIFFICULTY_CARD);
  const [isExportingDifficulty, setIsExportingDifficulty] = useState(false);
  const [wordDownloadDifficulty, setWordDownloadDifficulty] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadStudents();
    checkSelectedStudent();
    loadDifficultyCardDraft();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.setItem('difficultyCardDraft', JSON.stringify(difficultyCard)).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [difficultyCard]);

  const loadDifficultyCardDraft = async () => {
    try {
      const [draft, basicData] = await Promise.all([
        AsyncStorage.getItem('difficultyCardDraft'),
        AsyncStorage.getItem('basicData'),
      ]);
      let next = { ...EMPTY_DIFFICULTY_CARD };
      if (basicData) {
        const parsed = JSON.parse(basicData);
        if (parsed.fullName) next.teacherName = parsed.fullName;
        if (parsed.school) next.schoolName = parsed.school;
      }
      if (draft) next = { ...next, ...JSON.parse(draft) };
      setDifficultyCard(next);
    } catch (e) {
      console.log('Error loading difficulty card draft:', e);
    }
  };

  const checkSelectedStudent = async () => {
    try {
      const storedId = await AsyncStorage.getItem('selectedStudentId');
      if (storedId) {
        setSelectedStudentId(storedId);
        await AsyncStorage.removeItem('selectedStudentId');
      }
    } catch (error) {
      console.error('Error checking selected student:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('students');
      if (stored) {
        let loadedStudents = JSON.parse(stored);

        // تحديث التصنيفات القديمة للتصنيفات الجديدة (بدون دمج ضعف مع صعوبات التعلم)
        loadedStudents = loadedStudents.map((student: Student) => {
          let updatedStatus = student.status;
          if (student.status === ('ممتاز' as any)) {
            updatedStatus = 'تفوق';
          } else if (student.status === ('مقبول' as any)) {
            updatedStatus = 'يحتاج إلى تطوير';
          } else if (student.status === ('ضعيف' as any)) {
            updatedStatus = 'ضعف';
          }
          return { ...student, status: updatedStatus as Student['status'] };
        });

        await AsyncStorage.setItem('students', JSON.stringify(loadedStudents));
        setStudents(loadedStudents);

        if (selectedStudentId) {
          setTimeout(() => {
            const studentCard = document.getElementById(`student-card-${selectedStudentId}`);
            if (studentCard) {
              studentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات الطلاب:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const deleteStudent = async (studentId: string) => {
    try {
      const updatedStudents = students.filter(student => student.id !== studentId);
      await AsyncStorage.setItem('students', JSON.stringify(updatedStudents));
      setStudents(updatedStudents);
    } catch (error) {
      console.error('خطأ في حذف الطالب:', error);
    }
  };

  const confirmDeleteStudent = (studentId: string, studentName: string) => {
    AlertService.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف بيانات المتعلم "${studentName}"؟\n\nسيتم حذف جميع البيانات والخطط العلاجية المرتبطة بهذا المتعلم نهائياً.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteStudent(studentId) },
      ],
      { cancelable: true }
    );
  };

  const toggleCardExpansion = (studentId: string) => {
    setExpandedCards(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تفوق':
      case 'ممتاز':
        return '#4CAF50';
      case 'يحتاج إلى تطوير':
      case 'مقبول':
        return '#FF5722';
      case 'صعوبات التعلم':
      case 'ضعيف':
      case 'ضعف':
        return '#F44336';
      default:
        return '#999';
    }
  };

  // ===== نموذج التعديل =====

  const openEditForm = (student: Student) => {
    setFormData({
      ...student,
      goals: student.goals || [],
      needs: student.needs || [],
      performanceEvidence: student.performanceEvidence || [],
    });
    setEditingId(student.id);
    setShowGoalForm(false);
    setShowNeedForm(false);
    setShowEvidenceForm(false);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingId(null);
  };

  const addGoal = () => {
    if (!newGoal.title.trim()) {
      AlertService.alert('خطأ', 'يرجى إدخال عنوان الهدف');
      return;
    }
    const goal: Goal = { id: Date.now().toString(), ...newGoal, title: newGoal.title.trim(), description: '' };
    setFormData(prev => ({ ...prev, goals: [...prev.goals, goal] }));
    setNewGoal({ title: '', description: '', progress: 0, status: 'لم يبدأ' });
    setShowGoalForm(false);
  };

  const removeGoal = (goalId: string) => {
    setFormData(prev => ({ ...prev, goals: prev.goals.filter(goal => goal.id !== goalId) }));
  };

  const addNeed = () => {
    if (!newNeed.trim()) {
      AlertService.alert('خطأ', 'يرجى إدخال الاحتياج');
      return;
    }
    if (formData.needs.includes(newNeed.trim())) {
      AlertService.alert('تنبيه', 'هذا الاحتياج موجود بالفعل');
      return;
    }
    setFormData(prev => ({ ...prev, needs: [...prev.needs, newNeed.trim()] }));
    setNewNeed('');
    setShowNeedForm(false);
  };

  const removeNeed = (needIndex: number) => {
    setFormData(prev => ({ ...prev, needs: prev.needs.filter((_, index) => index !== needIndex) }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        let fileType = 'ملف';
        if (file.mimeType?.startsWith('image/')) fileType = 'صورة';
        else if (file.mimeType?.startsWith('video/')) fileType = 'فيديو';
        else if (file.mimeType?.includes('pdf')) fileType = 'PDF';
        else if (file.mimeType?.includes('word') || file.name?.endsWith('.docx')) fileType = 'مستند Word';

        setNewEvidence(prev => ({ ...prev, fileName: file.name || `ملف_${Date.now()}`, fileType }));
      }
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      AlertService.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        AlertService.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لتحميل الصور.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const fileName = `صورة_${Date.now()}.jpg`;
        setNewEvidence(prev => ({ ...prev, fileName, fileType: 'صورة' }));
      }
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      AlertService.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى.');
    }
  };

  const pickVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        AlertService.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لتحميل الفيديو.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const fileName = `فيديو_${Date.now()}.mp4`;
        setNewEvidence(prev => ({ ...prev, fileName, fileType: 'فيديو' }));
      }
    } catch (error) {
      console.error('خطأ في تحميل الفيديو:', error);
      AlertService.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الفيديو. يرجى المحاولة مرة أخرى.');
    }
  };

  const addEvidence = () => {
    if (!newEvidence.title?.trim()) {
      AlertService.alert('خطأ', 'يرجى إدخال عنوان الشاهد');
      return;
    }
    const evidence: PerformanceEvidence = {
      id: Date.now().toString(),
      type: (newEvidence.type as string) || 'اختبار',
      title: newEvidence.title?.trim() || '',
      fileName: newEvidence.fileName,
      fileType: newEvidence.fileType,
      date: newEvidence.date || new Date().toLocaleDateString('ar-SA'),
      notes: newEvidence.notes?.trim() || '',
    };
    setFormData(prev => ({ ...prev, performanceEvidence: [...prev.performanceEvidence, evidence] }));
    setNewEvidence({ type: 'اختبار', title: '', fileName: '', fileType: '', date: '', notes: '' });
    setShowEvidenceForm(false);
  };

  const removeEvidence = (evidenceId: string) => {
    setFormData(prev => ({ ...prev, performanceEvidence: prev.performanceEvidence.filter(e => e.id !== evidenceId) }));
  };

  const saveStudentForm = async () => {
    if (!formData.name.trim()) {
      AlertService.alert('خطأ في البيانات', 'يرجى إدخال اسم المتعلم');
      return;
    }
    if (!formData.grade.trim()) {
      AlertService.alert('خطأ في البيانات', 'يرجى إدخال الصف الدراسي');
      return;
    }
    if (formData.name.trim().length < 2) {
      AlertService.alert('خطأ في البيانات', 'اسم المتعلم يجب أن يكون أكثر من حرف واحد');
      return;
    }

    try {
      const existingStudents = await AsyncStorage.getItem('students');
      const currentStudents: Student[] = existingStudents ? JSON.parse(existingStudents) : [];

      const duplicateName = currentStudents.find(
        (student) => student.id !== editingId && student.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
      );

      if (duplicateName) {
        proceedWithSaveRef.current = () => proceedWithSave(currentStudents);
        setDuplicateModalVisible(true);
        return;
      }

      await proceedWithSave(currentStudents);
    } catch (error) {
      console.error('❌ خطأ في حفظ المتعلم:', error);
      setErrorModalMessage(
        `حدث خطأ أثناء حفظ بيانات المتعلم.\n\n${error instanceof Error ? error.message : 'خطأ غير معروف'}\n\nيرجى المحاولة مرة أخرى أو التحقق من البيانات المدخلة.`
      );
      setErrorModalVisible(true);
    }
  };

  const proceedWithSave = async (currentStudents: Student[]) => {
    const savedStudent: Student = {
      id: editingId || Date.now().toString(),
      name: formData.name.trim(),
      grade: formData.grade.trim(),
      status: formData.status,
      lastUpdate: new Date().toLocaleDateString('ar-SA'),
      notes: formData.notes.trim(),
      goals: formData.goals,
      needs: formData.needs,
      performanceEvidence: formData.performanceEvidence,
    };

    const updated = editingId
      ? currentStudents.map((s) => (s.id === editingId ? savedStudent : s))
      : [...currentStudents, savedStudent];

    await AsyncStorage.setItem('students', JSON.stringify(updated));
    setStudents(updated);

    setSuccessModalMessage(
      `${editingId ? 'تم تحديث' : 'تم إضافة'} بيانات المتعلم "${savedStudent.name}" بنجاح\n\nالتفاصيل:\n• الصف: ${savedStudent.grade}\n• الحالة: ${savedStudent.status}\n• عدد الأهداف: ${savedStudent.goals.length}\n• عدد الاحتياجات: ${savedStudent.needs.length}\n• عدد الشواهد: ${savedStudent.performanceEvidence.length}`
    );
    setSuccessModalVisible(true);
  };

  const handleDuplicateContinue = async () => {
    setDuplicateModalVisible(false);
    if (proceedWithSaveRef.current) {
      await proceedWithSaveRef.current();
      proceedWithSaveRef.current = null;
    }
  };

  const handleSuccessDone = () => {
    setSuccessModalVisible(false);
    closeForm();
  };

  const handleErrorRetry = () => {
    setErrorModalVisible(false);
    saveStudentForm();
  };

  // ===== بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية ) =====

  const openDifficultyCard = () => setDifficultyCardVisible(true);

  const closeDifficultyCard = () => setDifficultyCardVisible(false);

  const resetDifficultyCard = () => {
    setDifficultyCard((prev) => ({
      ...EMPTY_DIFFICULTY_CARD,
      schoolName: prev.schoolName,
      teacherName: prev.teacherName,
    }));
  };

  const updateDifficultyField = <K extends keyof DifficultyCard>(key: K, value: DifficultyCard[K]) => {
    setDifficultyCard((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDifficultyNeed = (value: string) => {
    setDifficultyCard((prev) => ({
      ...prev,
      needs: prev.needs.includes(value) ? prev.needs.filter((n) => n !== value) : [...prev.needs, value],
    }));
  };

  const addDifficultyEntry = () => {
    setDifficultyCard((prev) => ({ ...prev, entries: [...prev.entries, EMPTY_DIFFICULTY_ENTRY()] }));
  };

  const removeDifficultyEntry = (id: string) => {
    setDifficultyCard((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));
  };

  const updateDifficultyEntry = (id: string, field: keyof DifficultyEntry, value: string) => {
    setDifficultyCard((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const updateSkillPlanField = (skill: string, field: keyof SkillPlan, value: string) => {
    setDifficultyCard((prev) => ({
      ...prev,
      skillPlans: {
        ...prev.skillPlans,
        [skill]: { ...(prev.skillPlans[skill] || { objective: '', strategy: '', resources: '', duration: '', measurementTool: '' }), [field]: value },
      },
    }));
  };

  /** يحسب ملخص النتائج (عدد الطلاب، توزيعهم على مستويات الأداء، وأفضل/أكثر المهارات احتياجاً) من صفوف جدول المتابعة */
  const computeDifficultySummary = (card: DifficultyCard) => {
    const criteria = parseFloat(card.masteryCriteria) || 0;
    const validEntries = card.entries.filter((e) => e.studentName.trim() && e.skill.trim() && e.masteryPercent.trim() !== '');
    const count = validEntries.length;
    let mastered = 0;
    let close = 0;
    let needsSupport = 0;
    const skillAverages: Record<string, { sum: number; count: number }> = {};

    validEntries.forEach((e) => {
      const percent = parseFloat(e.masteryPercent) || 0;
      const level = getPerformanceLevel(percent, criteria);
      if (level.label === 'متقن') mastered += 1;
      else if (level.label === 'قريب من الإتقان') close += 1;
      else needsSupport += 1;

      if (!skillAverages[e.skill]) skillAverages[e.skill] = { sum: 0, count: 0 };
      skillAverages[e.skill].sum += percent;
      skillAverages[e.skill].count += 1;
    });

    const skillEntries = Object.entries(skillAverages).map(([skill, v]) => ({ skill, avg: v.sum / v.count }));
    const bestSkill = skillEntries.length > 0 ? skillEntries.reduce((a, b) => (b.avg > a.avg ? b : a)).skill : '';
    const mostNeededSkill = skillEntries.length > 0 ? skillEntries.reduce((a, b) => (b.avg < a.avg ? b : a)).skill : '';

    const uniqueSkills = Object.keys(skillAverages);

    return { count, mastered, close, needsSupport, bestSkill, mostNeededSkill, criteria, validEntries, uniqueSkills };
  };

  const checkCanExportDifficulty = async (): Promise<boolean> => {
    let user = await AuthService.getCurrentUser();
    if (!user) user = await AuthService.checkAuthStatus();
    if (!user) {
      AlertService.alert(
        'تسجيل الدخول مطلوب',
        'يرجى تسجيل الدخول للسماح بتصدير البطاقة.',
        [{ text: 'حسناً', style: 'cancel' }]
      );
      return false;
    }
    const status = await SubscriptionService.checkSubscriptionStatus(user.id);
    if (!status?.features?.canExport) {
      AlertService.alert(
        'ترقية الاشتراك مطلوبة',
        'تصدير البطاقة (PDF و Word) متاح للاشتراك السنوي ونصف السنوي فقط.',
        [
          { text: 'حسناً', style: 'cancel' },
          { text: 'عرض الخطط', onPress: () => router.push('/subscription') },
        ]
      );
      return false;
    }
    return true;
  };

  /** تحميل شعار وزارة التعليم للبطاقة المصدَّرة (PDF/Word) فقط — من ملف assets/images/moe_logo.png المحلي */
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
      if (__DEV__ && typeof console !== 'undefined') console.warn('تحميل شعار الوزارة للبطاقة:', e);
    }
    return '';
  };

  const generateDifficultyHtml = async (card: DifficultyCard): Promise<string> => {
    const logoDataUri = await loadMoeLogoDataUri();
    const todayStr = new Date().toLocaleDateString('ar-SA');
    const summary = computeDifficultySummary(card);

    const needsHtml = card.needs.length > 0 || card.needsOther.trim()
      ? [...card.needs, ...(card.needsOther.trim() ? [card.needsOther.trim()] : [])]
          .map((n) => `<span class="need-badge">${escapeHtml(n)}</span>`)
          .join('')
      : '<span class="empty-hint">لا توجد بنود مضافة</span>';

    const followUpRowsHtml = summary.validEntries
      .map((e, i) => {
        const percent = parseFloat(e.masteryPercent) || 0;
        const level = getPerformanceLevel(percent, summary.criteria);
        return `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(e.studentName)}</td>
          <td>${escapeHtml(e.skill)}</td>
          <td>%${percent}</td>
          <td><span class="level-badge" style="background:${level.color}">${escapeHtml(level.label)}</span></td>
          <td>${escapeHtml(e.plan)}</td>
          <td>${escapeHtml(e.followUpDate)}</td>
          <td>${escapeHtml(e.responsible)}</td>
        </tr>`;
      })
      .join('');

    const skillPlanRowsHtml = summary.uniqueSkills
      .map((skill) => {
        const plan = card.skillPlans[skill] || { objective: '', strategy: '', resources: '', duration: '', measurementTool: '' };
        return `<tr>
          <td>${escapeHtml(skill)}</td>
          <td>${escapeHtml(plan.objective)}</td>
          <td>${escapeHtml(plan.strategy)}</td>
          <td>${escapeHtml(plan.resources)}</td>
          <td>${escapeHtml(plan.duration)}</td>
          <td>${escapeHtml(plan.measurementTool)}</td>
          <td>%${escapeHtml(card.masteryCriteria)}</td>
        </tr>`;
      })
      .join('');

    const impactRowsHtml = summary.validEntries
      .map((e) => {
        const before = parseFloat(e.masteryPercent) || 0;
        const after = e.afterPercent.trim() !== '' ? parseFloat(e.afterPercent) : before;
        const improvement = getImprovementLabel(before, after);
        const note = after >= summary.criteria ? 'تحقق الإتقان' : 'يحتاج إلى استمرار';
        const noteColor = after >= summary.criteria ? '#059669' : '#f59e0b';
        return `<tr>
          <td>${escapeHtml(e.studentName)}</td>
          <td>%${before}</td>
          <td>%${after}</td>
          <td>${escapeHtml(improvement)}</td>
          <td style="color:${noteColor}; font-weight:700;">${escapeHtml(note)}</td>
        </tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )</title>
  <style>
    @page { size: A4; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: #e5e7eb; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1c1f33; }
    .page { width: 210mm; height: 297mm; margin: 0 auto; overflow: hidden; box-sizing: border-box; padding: 9mm 11mm; background: #fff; }
    .page-inner { transform-origin: top center; }
    .doc-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .doc-logo { width: 62px; object-fit: contain; }
    .doc-tag { background: #f0fdfa; border: 1px solid ${TEAL_LIGHT}; border-radius: 8px; padding: 5px 10px; text-align: center; }
    .doc-tag-title { font-size: 10px; font-weight: 700; color: ${TEAL}; }
    .doc-tag-sub { font-size: 9px; color: #6b7280; margin-top: 2px; }
    .title-banner { background: ${TEAL_DARK}; color: #fff; text-align: center; padding: 9px 14px; border-radius: 9px; font-size: 15px; font-weight: 800; }
    .dot-divider { height: 7px; margin: 5px 0 8px; background-image: radial-gradient(circle, ${TEAL} 1.8px, transparent 2px); background-size: 12px 12px; background-repeat: repeat-x; background-position: center; opacity: 0.55; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 9px; padding: 7px 10px; margin-bottom: 7px; }
    .card-heading { font-size: 11px; font-weight: 700; color: ${TEAL_DARK}; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 3px 14px; font-size: 9.5px; color: #374151; }
    .info-item { width: 46%; }
    .info-label { font-weight: 700; color: ${TEAL_DARK}; }
    .stats-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .stat-box { flex: 1; min-width: 70px; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 7px; padding: 5px 3px; }
    .stat-value { font-size: 14px; font-weight: 800; color: #1c1f33; }
    .stat-label { font-size: 8.5px; color: #6b7280; margin-top: 2px; }
    .needs-row { display: flex; flex-wrap: wrap; gap: 5px; }
    .need-badge { background: #fef3c7; color: #92400e; border-radius: 12px; padding: 3px 10px; font-size: 9.5px; font-weight: 600; }
    .empty-hint { font-size: 9.5px; color: #9ca3af; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
    th, td { border: 1px solid #e5e7eb; padding: 3px 4px; text-align: center; }
    th { background: ${TEAL_LIGHT}; color: #fff; font-weight: 700; font-size: 8.5px; }
    .level-badge { display: inline-block; color: #fff; border-radius: 5px; padding: 1px 6px; font-weight: 700; font-size: 8px; }
    .approval-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .approval-item { flex: 1; min-width: 45%; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 7px; padding: 5px 8px; }
    .approval-item-label { font-size: 8.5px; font-weight: 700; color: ${TEAL}; margin-bottom: 2px; }
    .approval-item-value { font-size: 9.5px; color: #1c1f33; }
    .sign-row { display: flex; gap: 8px; margin-top: 6px; }
    .sign-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 7px; padding: 8px; text-align: center; background: #f9fafb; }
    .sign-label { font-size: 9.5px; font-weight: 700; color: ${TEAL}; margin-bottom: 8px; }
    .sign-name { font-size: 9.5px; color: #1c1f33; border-top: 1px dashed #d1d5db; padding-top: 6px; }
    .doc-footer { text-align: center; color: #9ca3af; font-size: 8.5px; margin-top: 3px; }
  </style>
</head>
<body>
<div class="page"><div class="page-inner">
  <div class="doc-header-top">
    <div class="doc-tag">
      <div class="doc-tag-title">متابعة تعثر</div>
      <div class="doc-tag-sub">التاريخ: ${escapeHtml(todayStr)}</div>
    </div>
    ${logoDataUri ? `<img src="${logoDataUri}" alt="شعار وزارة التعليم" class="doc-logo">` : ''}
  </div>

  <div class="title-banner">بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )</div>
  <div class="dot-divider"></div>

  <div class="card">
    <div class="card-heading">البيانات الأساسية</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">المادة والصف:</span> ${escapeHtml(card.subjectGrade) || '-'}</div>
      <div class="info-item"><span class="info-label">نوع المدرسة:</span> ${escapeHtml(card.schoolType) || '-'}</div>
      <div class="info-item"><span class="info-label">اسم المدرسة:</span> ${escapeHtml(card.schoolName) || '-'}</div>
      <div class="info-item"><span class="info-label">معيار الإتقان:</span> %${escapeHtml(card.masteryCriteria) || '-'}</div>
      <div class="info-item"><span class="info-label">نوع القياس:</span> ${escapeHtml(card.measurementType) || '-'}</div>
      <div class="info-item"><span class="info-label">فترة المتابعة:</span> ${escapeHtml(card.followUpPeriod) || '-'}</div>
      <div class="info-item"><span class="info-label">اسم وكيل المدرسة:</span> ${escapeHtml(card.deputyName) || '-'}</div>
      <div class="info-item"><span class="info-label">اسم المعلم:</span> ${escapeHtml(card.teacherName) || '-'}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-heading">ملخص النتائج</div>
    <div class="stats-row">
      <div class="stat-box"><div class="stat-value">${summary.count}</div><div class="stat-label">عدد الطلاب</div></div>
      <div class="stat-box"><div class="stat-value">${summary.mastered}</div><div class="stat-label">عدد المتقنين</div></div>
      <div class="stat-box"><div class="stat-value">${summary.close}</div><div class="stat-label">قريبون من الإتقان</div></div>
      <div class="stat-box"><div class="stat-value">${summary.needsSupport}</div><div class="stat-label">محتاجون إلى دعم</div></div>
      <div class="stat-box"><div class="stat-value" style="font-size:10px;">${escapeHtml(summary.bestSkill) || '-'}</div><div class="stat-label">الأعلى أداءً</div></div>
      <div class="stat-box"><div class="stat-value" style="font-size:10px;">${escapeHtml(summary.mostNeededSkill) || '-'}</div><div class="stat-label">الأكثر احتياجاً</div></div>
    </div>
  </div>

  <div class="card">
    <div class="card-heading">تحديد الاحتياج</div>
    <div class="needs-row">${needsHtml}</div>
  </div>

  <div class="card">
    <div class="card-heading">جدول المتابعة</div>
    <table>
      <tr><th>م</th><th>اسم الطالب</th><th>المهارة المستهدفة</th><th>نسبة الإتقان</th><th>مستوى الأداء</th><th>الخطة العلاجية المقترحة</th><th>تاريخ المتابعة</th><th>المسؤول</th></tr>
      ${followUpRowsHtml || '<tr><td colspan="8" class="empty-hint">لا توجد بيانات مضافة</td></tr>'}
    </table>
  </div>

  <div class="card">
    <div class="card-heading">الخطة العلاجية</div>
    <table>
      <tr><th>المهارة المستهدفة</th><th>الهدف</th><th>الاستراتيجية العلاجية</th><th>الموارد</th><th>المدة الزمنية</th><th>أداة القياس</th><th>معيار الإتقان</th></tr>
      ${skillPlanRowsHtml || '<tr><td colspan="7" class="empty-hint">لا توجد بيانات مضافة</td></tr>'}
    </table>
  </div>

  <div class="card">
    <div class="card-heading">قياس الأثر</div>
    <table>
      <tr><th>اسم الطالب</th><th>الإتقان قبل التدخل</th><th>الإتقان بعد التدخل</th><th>مدى التحسن</th><th>ملاحظة الأثر</th></tr>
      ${impactRowsHtml || '<tr><td colspan="5" class="empty-hint">لا توجد بيانات مضافة</td></tr>'}
    </table>
  </div>

  <div class="card">
    <div class="card-heading">المتابعة والاعتماد</div>
    <div class="approval-grid">
      <div class="approval-item"><div class="approval-item-label">أبرز ما تحقق</div><div class="approval-item-value">${escapeHtml(card.highlightAchieved) || '-'}</div></div>
      <div class="approval-item"><div class="approval-item-label">المهارة التي لا تزال تحتاج دعماً</div><div class="approval-item-value">${escapeHtml(card.stillNeedsSupport) || '-'}</div></div>
      <div class="approval-item"><div class="approval-item-label">الإجراء القادم</div><div class="approval-item-value">${escapeHtml(card.nextAction) || '-'}</div></div>
      <div class="approval-item"><div class="approval-item-label">موعد المراجعة</div><div class="approval-item-value">${escapeHtml(card.reviewDate) || '-'}</div></div>
    </div>
    <div class="sign-row">
      <div class="sign-box">
        <div class="sign-label">توقيع المعلم</div>
        <div class="sign-name">${escapeHtml(card.teacherName) || '&nbsp;'}</div>
      </div>
      <div class="sign-box">
        <div class="sign-label">توقيع وكيل المدرسة للشؤون التعليمية</div>
        <div class="sign-name">${escapeHtml(card.deputyName) || '&nbsp;'}</div>
      </div>
    </div>
  </div>

  <div class="dot-divider"></div>
  <div class="doc-footer">بطاقة أُنشئت عبر تطبيق إنجاز المعلم</div>
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

  /**
   * قالب HTML مخصّص لتصدير Word — مختلف عمدًا عن generateDifficultyHtml (المخصص لـ PDF/الطباعة).
   * محرك Word لا يدعم Flexbox أو CSS gradients أو transform (المستخدَمة في رأس البطاقة وصفوف
   * البيانات والإحصائيات والاعتماد في ذلك القالب)، فتظهر العناصر مكدّسة بلا تنسيق عند فتح الملف
   * في Word. جداول <table> (المتابعة/الخطة العلاجية/قياس الأثر) أصلًا سليمة فتبقى كما هي.
   */
  const generateDifficultyWordHtml = async (card: DifficultyCard): Promise<string> => {
    const logoDataUri = await loadMoeLogoDataUri();
    const todayStr = new Date().toLocaleDateString('ar-SA');
    const summary = computeDifficultySummary(card);

    const needsHtml = card.needs.length > 0 || card.needsOther.trim()
      ? [...card.needs, ...(card.needsOther.trim() ? [card.needsOther.trim()] : [])]
          .map((n) => `<span class="need-badge">${escapeHtml(n)}</span>`)
          .join('')
      : '<span class="empty-hint">لا توجد بنود مضافة</span>';

    const followUpRowsHtml = summary.validEntries
      .map((e, i) => {
        const percent = parseFloat(e.masteryPercent) || 0;
        const level = getPerformanceLevel(percent, summary.criteria);
        return `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(e.studentName)}</td>
          <td>${escapeHtml(e.skill)}</td>
          <td>%${percent}</td>
          <td><span class="level-badge" style="background:${level.color}">${escapeHtml(level.label)}</span></td>
          <td>${escapeHtml(e.plan)}</td>
          <td>${escapeHtml(e.followUpDate)}</td>
          <td>${escapeHtml(e.responsible)}</td>
        </tr>`;
      })
      .join('');

    const skillPlanRowsHtml = summary.uniqueSkills
      .map((skill) => {
        const plan = card.skillPlans[skill] || { objective: '', strategy: '', resources: '', duration: '', measurementTool: '' };
        return `<tr>
          <td>${escapeHtml(skill)}</td>
          <td>${escapeHtml(plan.objective)}</td>
          <td>${escapeHtml(plan.strategy)}</td>
          <td>${escapeHtml(plan.resources)}</td>
          <td>${escapeHtml(plan.duration)}</td>
          <td>${escapeHtml(plan.measurementTool)}</td>
          <td>%${escapeHtml(card.masteryCriteria)}</td>
        </tr>`;
      })
      .join('');

    const impactRowsHtml = summary.validEntries
      .map((e) => {
        const before = parseFloat(e.masteryPercent) || 0;
        const after = e.afterPercent.trim() !== '' ? parseFloat(e.afterPercent) : before;
        const improvement = getImprovementLabel(before, after);
        const note = after >= summary.criteria ? 'تحقق الإتقان' : 'يحتاج إلى استمرار';
        const noteColor = after >= summary.criteria ? '#059669' : '#f59e0b';
        return `<tr>
          <td>${escapeHtml(e.studentName)}</td>
          <td>%${before}</td>
          <td>%${after}</td>
          <td>${escapeHtml(improvement)}</td>
          <td style="color:${noteColor}; font-weight:700;">${escapeHtml(note)}</td>
        </tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1c1f33; }
    table { border-collapse: collapse; }
    .doc-tag { background: #f0fdfa; border: 1px solid ${TEAL_LIGHT}; padding: 5px 10px; text-align: center; }
    .doc-tag-title { font-size: 10px; font-weight: 700; color: ${TEAL}; }
    .doc-tag-sub { font-size: 9px; color: #6b7280; margin-top: 2px; }
    .title-banner { background: ${TEAL_DARK}; color: #fff; text-align: center; padding: 9px 14px; font-size: 15px; font-weight: 800; }
    .dot-divider { text-align: center; color: ${TEAL}; font-size: 9px; padding: 3px 0; }
    .card { background: #fff; border: 1px solid #e5e7eb; padding: 7px 10px; margin-bottom: 7px; }
    .card-heading { font-size: 11px; font-weight: 700; color: ${TEAL_DARK}; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
    .info-item { font-size: 9.5px; color: #374151; padding: 2px 4px; }
    .info-label { font-weight: 700; color: ${TEAL_DARK}; }
    .stat-box { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; padding: 5px 3px; vertical-align: top; }
    .stat-value { font-size: 14px; font-weight: 800; color: #1c1f33; }
    .stat-label { font-size: 8.5px; color: #6b7280; margin-top: 2px; }
    .need-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 10px; font-size: 9.5px; font-weight: 600; margin: 2px; }
    .empty-hint { font-size: 9.5px; color: #9ca3af; }
    .difficulty-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
    .difficulty-table th, .difficulty-table td { border: 1px solid #e5e7eb; padding: 3px 4px; text-align: center; }
    .difficulty-table th { background: ${TEAL_LIGHT}; color: #fff; font-weight: 700; font-size: 8.5px; }
    .level-badge { color: #fff; padding: 1px 6px; font-weight: 700; font-size: 8px; }
    .approval-item { background: #f9fafb; border: 1px solid #e5e7eb; padding: 5px 8px; vertical-align: top; }
    .approval-item-label { font-size: 8.5px; font-weight: 700; color: ${TEAL}; margin-bottom: 2px; }
    .approval-item-value { font-size: 9.5px; color: #1c1f33; }
    .sign-box { border: 1px solid #e5e7eb; padding: 8px; text-align: center; background: #f9fafb; }
    .sign-label { font-size: 9.5px; font-weight: 700; color: ${TEAL}; margin-bottom: 8px; }
    .sign-name { font-size: 9.5px; color: #1c1f33; border-top: 1px dashed #d1d5db; padding-top: 6px; }
    .doc-footer { text-align: center; color: #9ca3af; font-size: 8.5px; margin-top: 3px; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="70%" style="vertical-align:top;"><table cellpadding="0" cellspacing="0"><tr><td class="doc-tag">
        <div class="doc-tag-title">متابعة تعثر</div>
        <div class="doc-tag-sub">التاريخ: ${escapeHtml(todayStr)}</div>
      </td></tr></table></td>
      <td width="30%" style="vertical-align:top; text-align:left;">${logoDataUri ? `<img src="${logoDataUri}" alt="شعار وزارة التعليم" width="62">` : ''}</td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
    <tr><td class="title-banner">بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )</td></tr>
  </table>
  <div class="dot-divider">• • • • • • • • • • • • • • • • • • • • • • • • • • • •</div>

  <table width="100%" cellpadding="0" cellspacing="0" class="card">
    <tr><td colspan="2" class="card-heading">البيانات الأساسية</td></tr>
    <tr><td width="50%" class="info-item"><span class="info-label">المادة والصف:</span> ${escapeHtml(card.subjectGrade) || '-'}</td><td width="50%" class="info-item"><span class="info-label">نوع المدرسة:</span> ${escapeHtml(card.schoolType) || '-'}</td></tr>
    <tr><td class="info-item"><span class="info-label">اسم المدرسة:</span> ${escapeHtml(card.schoolName) || '-'}</td><td class="info-item"><span class="info-label">معيار الإتقان:</span> %${escapeHtml(card.masteryCriteria) || '-'}</td></tr>
    <tr><td class="info-item"><span class="info-label">نوع القياس:</span> ${escapeHtml(card.measurementType) || '-'}</td><td class="info-item"><span class="info-label">فترة المتابعة:</span> ${escapeHtml(card.followUpPeriod) || '-'}</td></tr>
    <tr><td class="info-item"><span class="info-label">اسم وكيل المدرسة:</span> ${escapeHtml(card.deputyName) || '-'}</td><td class="info-item"><span class="info-label">اسم المعلم:</span> ${escapeHtml(card.teacherName) || '-'}</td></tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" class="card">
    <tr><td colspan="6" class="card-heading">ملخص النتائج</td></tr>
    <tr>
      <td width="16%" class="stat-box"><div class="stat-value">${summary.count}</div><div class="stat-label">عدد الطلاب</div></td>
      <td width="16%" class="stat-box"><div class="stat-value">${summary.mastered}</div><div class="stat-label">عدد المتقنين</div></td>
      <td width="16%" class="stat-box"><div class="stat-value">${summary.close}</div><div class="stat-label">قريبون من الإتقان</div></td>
      <td width="16%" class="stat-box"><div class="stat-value">${summary.needsSupport}</div><div class="stat-label">محتاجون إلى دعم</div></td>
      <td width="18%" class="stat-box"><div class="stat-value" style="font-size:10px;">${escapeHtml(summary.bestSkill) || '-'}</div><div class="stat-label">الأعلى أداءً</div></td>
      <td width="18%" class="stat-box"><div class="stat-value" style="font-size:10px;">${escapeHtml(summary.mostNeededSkill) || '-'}</div><div class="stat-label">الأكثر احتياجاً</div></td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" class="card">
    <tr><td class="card-heading">تحديد الاحتياج</td></tr>
    <tr><td>${needsHtml}</td></tr>
  </table>

  <div class="card">
    <div class="card-heading">جدول المتابعة</div>
    <table class="difficulty-table">
      <tr><th>م</th><th>اسم الطالب</th><th>المهارة المستهدفة</th><th>نسبة الإتقان</th><th>مستوى الأداء</th><th>الخطة العلاجية المقترحة</th><th>تاريخ المتابعة</th><th>المسؤول</th></tr>
      ${followUpRowsHtml || '<tr><td colspan="8" class="empty-hint">لا توجد بيانات مضافة</td></tr>'}
    </table>
  </div>

  <div class="card">
    <div class="card-heading">الخطة العلاجية</div>
    <table class="difficulty-table">
      <tr><th>المهارة المستهدفة</th><th>الهدف</th><th>الاستراتيجية العلاجية</th><th>الموارد</th><th>المدة الزمنية</th><th>أداة القياس</th><th>معيار الإتقان</th></tr>
      ${skillPlanRowsHtml || '<tr><td colspan="7" class="empty-hint">لا توجد بيانات مضافة</td></tr>'}
    </table>
  </div>

  <div class="card">
    <div class="card-heading">قياس الأثر</div>
    <table class="difficulty-table">
      <tr><th>اسم الطالب</th><th>الإتقان قبل التدخل</th><th>الإتقان بعد التدخل</th><th>مدى التحسن</th><th>ملاحظة الأثر</th></tr>
      ${impactRowsHtml || '<tr><td colspan="5" class="empty-hint">لا توجد بيانات مضافة</td></tr>'}
    </table>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" class="card">
    <tr><td colspan="2" class="card-heading">المتابعة والاعتماد</td></tr>
    <tr>
      <td width="50%" class="approval-item"><div class="approval-item-label">أبرز ما تحقق</div><div class="approval-item-value">${escapeHtml(card.highlightAchieved) || '-'}</div></td>
      <td width="50%" class="approval-item"><div class="approval-item-label">المهارة التي لا تزال تحتاج دعماً</div><div class="approval-item-value">${escapeHtml(card.stillNeedsSupport) || '-'}</div></td>
    </tr>
    <tr>
      <td class="approval-item"><div class="approval-item-label">الإجراء القادم</div><div class="approval-item-value">${escapeHtml(card.nextAction) || '-'}</div></td>
      <td class="approval-item"><div class="approval-item-label">موعد المراجعة</div><div class="approval-item-value">${escapeHtml(card.reviewDate) || '-'}</div></td>
    </tr>
    <tr>
      <td style="padding-top:6px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td class="sign-box">
        <div class="sign-label">توقيع المعلم</div>
        <div class="sign-name">${escapeHtml(card.teacherName) || '&nbsp;'}</div>
      </td></tr></table></td>
      <td style="padding-top:6px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td class="sign-box">
        <div class="sign-label">توقيع وكيل المدرسة للشؤون التعليمية</div>
        <div class="sign-name">${escapeHtml(card.deputyName) || '&nbsp;'}</div>
      </td></tr></table></td>
    </tr>
  </table>

  <div class="dot-divider">• • • • • • • • • • • • • • • • • • • • • • • • • • • •</div>
  <div class="doc-footer">بطاقة أُنشئت عبر تطبيق إنجاز المعلم</div>
</body>
</html>`;
  };

  const exportDifficultyPDF = async () => {
    const canExport = await checkCanExportDifficulty();
    if (!canExport) return;
    setIsExportingDifficulty(true);
    try {
      const htmlContent = await generateDifficultyHtml(difficultyCard);
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          AlertService.alert('تنبيه', 'تصدير PDF غير متاح في هذا السياق.');
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
        AlertService.alert('تم فتح نافذة الطباعة', 'اختر «حفظ كـ PDF» أو «Save as PDF» في نافذة الطباعة لحفظ الملف.');
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false, width: 595, height: 842 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        AlertService.alert('تم إنشاء الملف', uri);
        return;
      }
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        const pdfName = `متابعة_متعلم_الخطط_العلاجية_والاثرائية_${new Date().toISOString().split('T')[0]}.pdf`;
        const dest = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({ from: uri, to: dest });
        await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'تصدير البطاقة PDF' });
      }
      AlertService.alert('تم بنجاح', 'تم تصدير البطاقة كملف PDF.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      AlertService.alert('فشل التصدير', 'تعذر تصدير PDF.' + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExportingDifficulty(false);
    }
  };

  const exportDifficultyWord = async () => {
    const canExport = await checkCanExportDifficulty();
    if (!canExport) return;
    setIsExportingDifficulty(true);
    try {
      const htmlContent = await generateDifficultyWordHtml(difficultyCard);
      const fileName = `متابعة_متعلم_الخطط_العلاجية_والاثرائية_${new Date().toISOString().split('T')[0]}.doc`;
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          AlertService.alert('تنبيه', 'تصدير Word غير متاح في هذا السياق.');
          return;
        }
        const blob = new Blob(['﻿' + htmlContent], { type: 'application/msword; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setWordDownloadDifficulty({ url, name: fileName });
        return;
      }
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, '﻿' + htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        AlertService.alert('تم إنشاء الملف', filePath);
        return;
      }
      await Sharing.shareAsync(filePath, { mimeType: 'application/msword', dialogTitle: 'تصدير البطاقة Word' });
      AlertService.alert('تم بنجاح', 'تم تصدير البطاقة كملف Word.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      AlertService.alert('فشل التصدير', 'تعذر تصدير Word.' + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExportingDifficulty(false);
    }
  };

  const closeWordDownloadDifficulty = () => {
    if (wordDownloadDifficulty) {
      URL.revokeObjectURL(wordDownloadDifficulty.url);
      setWordDownloadDifficulty(null);
    }
  };

  const renderStudentForm = () => (
    <ThemedView style={styles.pageSection}>
      <ThemedView style={[styles.pageSectionHeader, styles.pageSectionHeaderRow]}>
        <ThemedText style={[styles.pageSectionTitle, getTextDirection()]}>
          {formatRTLText('تعديل بيانات المتعلم')}
        </ThemedText>
        <TouchableOpacity onPress={closeForm}>
          <IconSymbol size={20} name="xmark.circle.fill" color="#fff" />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.sfBody}>
        {/* البيانات الأساسية */}
        <ThemedView style={styles.sfSectionContainer}>
          <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('البيانات الأساسية')}</ThemedText>

          <ThemedView style={styles.sfInputGroup}>
            <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('اسم المتعلم *')}</ThemedText>
            <TextInput
              style={[styles.sfTextInput, getTextDirection()]}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder={formatRTLText('أدخل اسم المتعلم')}
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.sfInputGroup}>
            <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الصف الدراسي *')}</ThemedText>
            <TextInput
              style={[styles.sfTextInput, getTextDirection()]}
              value={formData.grade}
              onChangeText={(text) => setFormData(prev => ({ ...prev, grade: text }))}
              placeholder={formatRTLText('أدخل الصف الدراسي')}
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.sfInputGroup}>
            <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('حالة المتعلم')}</ThemedText>
            <ThemedView style={styles.sfStatusGrid}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sfStatusOption,
                    { backgroundColor: option.color },
                    formData.status === option.value && styles.sfSelectedStatus,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, status: option.value as Student['status'] }))}
                >
                  <IconSymbol size={18} name={option.icon as any} color="#fff" />
                  <ThemedText style={styles.sfStatusText}>{formatRTLText(option.label)}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* الأهداف */}
        <ThemedView style={styles.sfSectionContainer}>
          <ThemedView style={styles.sfSectionHeaderRow}>
            <TouchableOpacity style={styles.sfActionButton} onPress={() => setShowGoalForm(true)}>
              <IconSymbol size={16} name="plus.circle.fill" color="#fff" />
              <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('إضافة هدف')}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('الأهداف التعليمية')}</ThemedText>
          </ThemedView>

          {showGoalForm && (
            <ThemedView style={styles.sfFormCard}>
              <TextInput
                style={[styles.sfInput, getTextDirection()]}
                placeholder={formatRTLText('عنوان الهدف')}
                placeholderTextColor="#999"
                value={newGoal.title}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, title: text }))}
              />
              <TextInput
                style={[styles.sfInput, getTextDirection()]}
                placeholder={formatRTLText('نسبة تحقق الهدف (0-100)')}
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newGoal.progress.toString()}
                onChangeText={(text) => {
                  const progress = parseInt(text, 10);
                  if (!Number.isNaN(progress) && progress >= 0 && progress <= 100) {
                    setNewGoal(prev => ({ ...prev, progress }));
                  } else if (text === '') {
                    setNewGoal(prev => ({ ...prev, progress: 0 }));
                  }
                }}
              />
              <ThemedView style={styles.sfButtonRow}>
                <TouchableOpacity style={styles.sfActionButton} onPress={addGoal}>
                  <IconSymbol size={16} name="checkmark.circle.fill" color="#fff" />
                  <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('حفظ')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sfActionButtonSecondary} onPress={() => setShowGoalForm(false)}>
                  <IconSymbol size={16} name="xmark.circle.fill" color="#1c1f33" />
                  <ThemedText style={[styles.sfActionButtonSecondaryText, getTextDirection()]}>{formatRTLText('إلغاء')}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          )}

          {formData.goals.map((goal) => (
            <ThemedView key={goal.id} style={styles.sfItemCard}>
              <ThemedView style={styles.sfItemHeader}>
                <TouchableOpacity onPress={() => removeGoal(goal.id)}>
                  <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                </TouchableOpacity>
                <ThemedText style={[styles.sfItemTitle, getTextDirection()]}>{goal.title}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.sfProgressContainer}>
                <ThemedText style={styles.sfProgressText}>{goal.progress}%</ThemedText>
                <ThemedView style={styles.sfProgressBar}>
                  <ThemedView style={[styles.sfProgressFill, { width: `${goal.progress}%` }]} />
                </ThemedView>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>

        {/* احتياجات المتعلم */}
        <ThemedView style={styles.sfSectionContainer}>
          <ThemedView style={styles.sfSectionHeaderRow}>
            <TouchableOpacity style={styles.sfActionButton} onPress={() => setShowNeedForm(true)}>
              <IconSymbol size={16} name="plus.circle.fill" color="#fff" />
              <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('إضافة احتياج')}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('احتياجات المتعلم')}</ThemedText>
          </ThemedView>

          {showNeedForm && (
            <ThemedView style={styles.sfFormCard}>
              <ThemedView style={styles.sfInputGroup}>
                <ThemedView style={styles.sfLabelRow}>
                  <AIAssistButton
                    type="student_tracking_need"
                    currentText={newNeed}
                    onApply={setNewNeed}
                    label={formatRTLText('اقتراح بالذكاء الاصطناعي')}
                    compact={false}
                  />
                  <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الاحتياج')}</ThemedText>
                </ThemedView>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={newNeed}
                  onChangeText={setNewNeed}
                  placeholder={formatRTLText('مثال: يحتاج إلى دعم إضافي في الرياضيات')}
                  placeholderTextColor="#999"
                  multiline
                />
              </ThemedView>
              <ThemedView style={styles.sfButtonRow}>
                <TouchableOpacity style={styles.sfActionButton} onPress={addNeed}>
                  <IconSymbol size={16} name="checkmark.circle.fill" color="#fff" />
                  <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('حفظ')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sfActionButtonSecondary} onPress={() => setShowNeedForm(false)}>
                  <IconSymbol size={16} name="xmark.circle.fill" color="#1c1f33" />
                  <ThemedText style={[styles.sfActionButtonSecondaryText, getTextDirection()]}>{formatRTLText('إلغاء')}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          )}

          {formData.needs.map((need, index) => (
            <ThemedView key={index} style={styles.sfItemCard}>
              <ThemedView style={styles.sfItemHeader}>
                <TouchableOpacity onPress={() => removeNeed(index)}>
                  <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                </TouchableOpacity>
                <ThemedText style={[styles.sfItemTitle, getTextDirection()]}>{need}</ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>

        {/* شواهد الأداء */}
        <ThemedView style={styles.sfSectionContainer}>
          <ThemedView style={styles.sfSectionHeaderRow}>
            <TouchableOpacity style={styles.sfActionButton} onPress={() => setShowEvidenceForm(true)}>
              <IconSymbol size={16} name="plus.circle.fill" color="#fff" />
              <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('إضافة شاهد')}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('شواهد الأداء')}</ThemedText>
          </ThemedView>

          {showEvidenceForm && (
            <ThemedView style={styles.sfFormCard}>
              <ThemedView style={styles.sfInputGroup}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('نوع الشاهد')}</ThemedText>
                <ThemedView style={styles.sfTypeGrid}>
                  {EVIDENCE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.sfTypeOption, newEvidence.type === type.value && styles.sfSelectedType]}
                      onPress={() => setNewEvidence(prev => ({ ...prev, type: type.value }))}
                    >
                      <IconSymbol size={16} name={type.icon as any} color="#1c1f33" />
                      <ThemedText style={[styles.sfTypeText, getTextDirection()]}>{formatRTLText(type.label)}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.sfInputGroup}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('عنوان الشاهد')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={newEvidence.title}
                  onChangeText={(text) => setNewEvidence(prev => ({ ...prev, title: text }))}
                  placeholder={formatRTLText('أدخل عنوان الشاهد')}
                  placeholderTextColor="#999"
                />
              </ThemedView>

              <ThemedView style={styles.sfInputGroup}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('تحميل الشاهد')}</ThemedText>
                <ThemedView style={styles.sfUploadButtonsContainer}>
                  <TouchableOpacity style={[styles.sfUploadOptionButton, { backgroundColor: '#E3F2FD' }]} onPress={pickImage}>
                    <IconSymbol size={18} name="photo" color="#2196F3" />
                    <ThemedText style={[styles.sfUploadOptionText, getTextDirection(), { color: '#2196F3' }]}>{formatRTLText('صورة')}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sfUploadOptionButton, { backgroundColor: '#F3E5F5' }]} onPress={pickVideo}>
                    <IconSymbol size={18} name="play.circle.fill" color="#9C27B0" />
                    <ThemedText style={[styles.sfUploadOptionText, getTextDirection(), { color: '#9C27B0' }]}>{formatRTLText('فيديو')}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sfUploadOptionButton, { backgroundColor: '#E8F5E8' }]} onPress={pickDocument}>
                    <IconSymbol size={18} name="doc.text.fill" color="#4CAF50" />
                    <ThemedText style={[styles.sfUploadOptionText, getTextDirection(), { color: '#4CAF50' }]}>{formatRTLText('ملف')}</ThemedText>
                  </TouchableOpacity>
                </ThemedView>

                {newEvidence.fileName ? (
                  <ThemedView style={styles.sfSelectedFileContainer}>
                    <ThemedView style={styles.sfFileInfo}>
                      <IconSymbol
                        size={20}
                        name={newEvidence.fileType === 'صورة' ? 'photo' : newEvidence.fileType === 'فيديو' ? 'play.circle.fill' : 'doc.text.fill'}
                        color="#4CAF50"
                      />
                      <ThemedView style={styles.sfFileDetails}>
                        <ThemedText style={[styles.sfFileInfoText, getTextDirection()]}>{newEvidence.fileName}</ThemedText>
                        <ThemedText style={[styles.sfFileTypeText, getTextDirection()]}>{newEvidence.fileType}</ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <TouchableOpacity onPress={() => setNewEvidence(prev => ({ ...prev, fileName: '', fileType: '' }))}>
                      <IconSymbol size={16} name="xmark.circle.fill" color="#F44336" />
                    </TouchableOpacity>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.sfNoFileSelected}>
                    <IconSymbol size={24} name="doc.badge.plus" color="#999" />
                    <ThemedText style={[styles.sfNoFileText, getTextDirection()]}>{formatRTLText('لم يتم اختيار ملف بعد')}</ThemedText>
                  </ThemedView>
                )}
              </ThemedView>

              <ThemedView style={styles.sfButtonRow}>
                <TouchableOpacity style={styles.sfActionButton} onPress={addEvidence}>
                  <IconSymbol size={16} name="checkmark.circle.fill" color="#fff" />
                  <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('حفظ')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sfActionButtonSecondary} onPress={() => setShowEvidenceForm(false)}>
                  <IconSymbol size={16} name="xmark.circle.fill" color="#1c1f33" />
                  <ThemedText style={[styles.sfActionButtonSecondaryText, getTextDirection()]}>{formatRTLText('إلغاء')}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          )}

          {formData.performanceEvidence.map((evidence) => (
            <ThemedView key={evidence.id} style={styles.sfEvidenceCard}>
              <ThemedView style={styles.sfItemHeader}>
                <TouchableOpacity onPress={() => removeEvidence(evidence.id)}>
                  <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                </TouchableOpacity>
                <ThemedView style={styles.sfEvidenceInfo}>
                  <ThemedText style={[styles.sfItemTitle, getTextDirection()]}>{evidence.title}</ThemedText>
                  <ThemedText style={[styles.sfEvidenceType, getTextDirection()]}>{evidence.type}</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={styles.sfEvidenceDetails}>
                {evidence.fileName && (
                  <ThemedView style={styles.sfFileDisplayInfo}>
                    <IconSymbol
                      size={16}
                      name={evidence.fileType === 'صورة' ? 'photo' : evidence.fileType === 'فيديو' ? 'play.circle.fill' : 'doc.text.fill'}
                      color="#4CAF50"
                    />
                    <ThemedText style={[styles.sfEvidenceDetailText, getTextDirection()]}>{formatRTLText(`الملف: ${evidence.fileName}`)}</ThemedText>
                  </ThemedView>
                )}
                <ThemedText style={[styles.sfEvidenceDetailText, getTextDirection()]}>{formatRTLText(`التاريخ: ${evidence.date}`)}</ThemedText>
                {evidence.notes ? (
                  <ThemedText style={[styles.sfEvidenceDetailText, getTextDirection()]}>{formatRTLText(`الملاحظات: ${evidence.notes}`)}</ThemedText>
                ) : null}
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>

        {/* ملاحظات إضافية */}
        <ThemedView style={styles.sfSectionContainer}>
          <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('ملاحظات إضافية')}</ThemedText>
          <TextInput
            style={[styles.sfTextInput, styles.sfTextArea, getTextDirection()]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder={formatRTLText('أدخل أي ملاحظات إضافية')}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </ThemedView>

        {/* أزرار الحفظ والإلغاء */}
        <ThemedView style={styles.sfButtonContainer}>
          <TouchableOpacity style={styles.sfSaveButton} onPress={saveStudentForm} activeOpacity={0.8}>
            <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
            <ThemedText style={[styles.sfSaveButtonText, getTextDirection()]}>
              {formatRTLText(editingId ? 'حفظ التعديلات' : 'حفظ البيانات')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sfCancelButton}
            onPress={() => {
              AlertService.alert(
                'تأكيد الإلغاء',
                'هل أنت متأكد من إلغاء العملية؟ سيتم فقدان أي بيانات غير محفوظة.',
                [
                  { text: 'العودة', style: 'cancel' },
                  { text: 'إلغاء', style: 'destructive', onPress: closeForm },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <IconSymbol size={18} name="xmark.circle.fill" color="#666" />
            <ThemedText style={[styles.sfCancelButtonText, getTextDirection()]}>{formatRTLText('إلغاء')}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  const renderDifficultyCard = () => {
    const summary = computeDifficultySummary(difficultyCard);
    return (
      <ThemedView style={styles.pageSection}>
        <ThemedView style={[styles.pageSectionHeader, styles.pageSectionHeaderRow]}>
          <ThemedText style={[styles.pageSectionTitle, getTextDirection()]}>
            {formatRTLText('بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )')}
          </ThemedText>
          <TouchableOpacity onPress={closeDifficultyCard}>
            <IconSymbol size={20} name="xmark.circle.fill" color="#fff" />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.sfBody}>
          <ThemedView style={styles.sfSectionContainer}>
            <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('البيانات الأساسية')}</ThemedText>
            <ThemedView style={styles.dcFieldRow}>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('المادة/الصف')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.subjectGrade}
                  onChangeText={(v) => updateDifficultyField('subjectGrade', v)}
                  placeholder={formatRTLText('مثال: رياضيات - الصف الثالث')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('نوع المدرسة')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.schoolType}
                  onChangeText={(v) => updateDifficultyField('schoolType', v)}
                  placeholder={formatRTLText('ابتدائي / متوسط / ثانوي')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('اسم المدرسة')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.schoolName}
                  onChangeText={(v) => updateDifficultyField('schoolName', v)}
                  placeholder={formatRTLText('اسم المدرسة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlockSmall}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('معيار الإتقان (%)')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.masteryCriteria}
                  onChangeText={(v) => updateDifficultyField('masteryCriteria', v)}
                  placeholder="80"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('أداة القياس')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.measurementType}
                  onChangeText={(v) => updateDifficultyField('measurementType', v)}
                  placeholder={formatRTLText('اختبار قصير / ملاحظة / بطاقة أداء')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('فترة المتابعة')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.followUpPeriod}
                  onChangeText={(v) => updateDifficultyField('followUpPeriod', v)}
                  placeholder={formatRTLText('مثال: أسبوعين')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('معلم/ة المادة')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.teacherName}
                  onChangeText={(v) => updateDifficultyField('teacherName', v)}
                  placeholder={formatRTLText('اسم المعلم/ة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('وكيل/ة شؤون التعلم')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.deputyName}
                  onChangeText={(v) => updateDifficultyField('deputyName', v)}
                  placeholder={formatRTLText('اسم الوكيل/ة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.sfSectionContainer}>
            <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('تحديد الاحتياج')}</ThemedText>
            <ThemedView style={styles.dcNeedsRow}>
              {DIFFICULTY_NEEDS_OPTIONS.map((need) => {
                const active = difficultyCard.needs.includes(need);
                return (
                  <TouchableOpacity
                    key={need}
                    style={[styles.dcNeedBadge, active && styles.dcNeedBadgeActive]}
                    onPress={() => toggleDifficultyNeed(need)}
                  >
                    <IconSymbol size={14} name={active ? 'checkmark.square.fill' : 'square'} color={active ? '#fff' : '#6b7280'} />
                    <ThemedText style={[styles.dcNeedBadgeText, active && styles.dcNeedBadgeTextActive, getTextDirection()]}>
                      {formatRTLText(need)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ThemedView>
            <ThemedView style={{ marginTop: 10 }}>
              <ThemedView style={styles.sfLabelRow}>
                <AIAssistButton
                  type="student_tracking_need"
                  currentText={difficultyCard.needsOther}
                  onApply={(text) => updateDifficultyField('needsOther', text)}
                  label={formatRTLText('اقتراح بالذكاء الاصطناعي')}
                  compact={false}
                />
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('احتياج آخر (اختياري)')}</ThemedText>
              </ThemedView>
              <TextInput
                style={[styles.sfTextInput, getTextDirection()]}
                value={difficultyCard.needsOther}
                onChangeText={(v) => updateDifficultyField('needsOther', v)}
                placeholder={formatRTLText('اكتب احتياجاً إضافياً إن وجد')}
                placeholderTextColor="#999"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.sfSectionContainer}>
            <ThemedView style={styles.sfSectionHeaderRow}>
              <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('جدول المتابعة')}</ThemedText>
              <TouchableOpacity style={styles.sfActionButton} onPress={addDifficultyEntry}>
                <IconSymbol size={16} name="plus" color="#fff" />
                <ThemedText style={[styles.sfActionButtonText, getTextDirection()]}>{formatRTLText('إضافة صف')}</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            {difficultyCard.entries.length === 0 ? (
              <ThemedText style={[styles.dcEmptyHint, getTextDirection()]}>
                {formatRTLText('لا توجد صفوف بعد — اضغط "إضافة صف" للبدء')}
              </ThemedText>
            ) : (
              difficultyCard.entries.map((entry, index) => (
                <ThemedView key={entry.id} style={styles.sfItemCard}>
                  <ThemedView style={styles.sfItemHeader}>
                    <ThemedText style={[styles.sfItemTitle, getTextDirection()]}>{formatRTLText(`صف ${index + 1}`)}</ThemedText>
                    <TouchableOpacity onPress={() => removeDifficultyEntry(entry.id)}>
                      <IconSymbol size={18} name="xmark.circle.fill" color="#dc2626" />
                    </TouchableOpacity>
                  </ThemedView>
                  <ThemedView style={styles.dcFieldRow}>
                    <ThemedView style={styles.dcFieldBlock}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('اسم المتعلم')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={entry.studentName}
                        onChangeText={(v) => updateDifficultyEntry(entry.id, 'studentName', v)}
                        placeholder={formatRTLText('اسم المتعلم')}
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={styles.dcFieldBlock}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('المهارة المستهدفة')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={entry.skill}
                        onChangeText={(v) => updateDifficultyEntry(entry.id, 'skill', v)}
                        placeholder={formatRTLText('مثال: جدول الضرب')}
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={styles.dcFieldBlockSmall}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الإتقان قبل %')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={entry.masteryPercent}
                        onChangeText={(v) => updateDifficultyEntry(entry.id, 'masteryPercent', v)}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={styles.dcFieldBlockSmall}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الإتقان بعد %')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={entry.afterPercent}
                        onChangeText={(v) => updateDifficultyEntry(entry.id, 'afterPercent', v)}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={styles.dcFieldBlockSmall}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('تاريخ المتابعة')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={entry.followUpDate}
                        onChangeText={(v) => updateDifficultyEntry(entry.id, 'followUpDate', v)}
                        placeholder={formatRTLText('١٤٤٧/٠١/٠١')}
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={styles.dcFieldBlockSmall}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('المسؤول')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={entry.responsible}
                        onChangeText={(v) => updateDifficultyEntry(entry.id, 'responsible', v)}
                        placeholder={formatRTLText('المعلم')}
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                  </ThemedView>
                  <ThemedView style={{ marginTop: 8 }}>
                    <ThemedView style={styles.sfLabelRow}>
                      {!isDemoModeActive() && (
                        <AIAssistButton
                          type="student_tracking_plan"
                          currentText={entry.plan}
                          onApply={(text) => updateDifficultyEntry(entry.id, 'plan', text)}
                          label={formatRTLText('اقتراح بالذكاء الاصطناعي')}
                          compact={false}
                        />
                      )}
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الإجراء العلاجي المختصر')}</ThemedText>
                    </ThemedView>
                    <TextInput
                      style={[styles.sfTextInput, styles.sfTextArea, getTextDirection()]}
                      value={entry.plan}
                      onChangeText={(v) => updateDifficultyEntry(entry.id, 'plan', v)}
                      placeholder={formatRTLText('صف الإجراء العلاجي بإيجاز')}
                      placeholderTextColor="#999"
                      multiline
                    />
                  </ThemedView>
                </ThemedView>
              ))
            )}
          </ThemedView>

          {summary.count > 0 && (
            <ThemedView style={styles.sfSectionContainer}>
              <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('ملخص النتائج')}</ThemedText>
              <ThemedView style={styles.dcSummaryRow}>
                <ThemedView style={styles.dcSummaryBox}>
                  <ThemedText style={styles.dcSummaryValue}>{summary.count}</ThemedText>
                  <ThemedText style={[styles.dcSummaryLabel, getTextDirection()]}>{formatRTLText('إجمالي الصفوف')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.dcSummaryBox, { backgroundColor: '#22c55e' }]}>
                  <ThemedText style={styles.dcSummaryValue}>{summary.mastered}</ThemedText>
                  <ThemedText style={[styles.dcSummaryLabel, getTextDirection()]}>{formatRTLText('متقن')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.dcSummaryBox, { backgroundColor: '#f59e0b' }]}>
                  <ThemedText style={styles.dcSummaryValue}>{summary.close}</ThemedText>
                  <ThemedText style={[styles.dcSummaryLabel, getTextDirection()]}>{formatRTLText('قريب من الإتقان')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.dcSummaryBox, { backgroundColor: '#ef4444' }]}>
                  <ThemedText style={styles.dcSummaryValue}>{summary.needsSupport}</ThemedText>
                  <ThemedText style={[styles.dcSummaryLabel, getTextDirection()]}>{formatRTLText('يحتاج دعم')}</ThemedText>
                </ThemedView>
              </ThemedView>
              {(summary.bestSkill || summary.mostNeededSkill) ? (
                <ThemedView style={{ marginTop: 8 }}>
                  {summary.bestSkill ? (
                    <ThemedText style={[styles.dcSummaryHint, getTextDirection()]}>
                      {formatRTLText(`أفضل مهارة أداءً: ${summary.bestSkill}`)}
                    </ThemedText>
                  ) : null}
                  {summary.mostNeededSkill ? (
                    <ThemedText style={[styles.dcSummaryHint, getTextDirection()]}>
                      {formatRTLText(`الأكثر احتياجاً للدعم: ${summary.mostNeededSkill}`)}
                    </ThemedText>
                  ) : null}
                </ThemedView>
              ) : null}
            </ThemedView>
          )}

          {summary.uniqueSkills.length > 0 && (
            <ThemedView style={styles.sfSectionContainer}>
              <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('الخطة العلاجية لكل مهارة')}</ThemedText>
              {summary.uniqueSkills.map((skill) => {
                const plan = difficultyCard.skillPlans[skill] || { objective: '', strategy: '', resources: '', duration: '', measurementTool: '' };
                return (
                  <ThemedView key={skill} style={styles.sfFormCard}>
                    <ThemedText style={[styles.sfItemTitle, getTextDirection()]}>{formatRTLText(skill)}</ThemedText>
                    <ThemedView style={{ marginTop: 8 }}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الهدف الإجرائي')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={plan.objective}
                        onChangeText={(v) => updateSkillPlanField(skill, 'objective', v)}
                        placeholder={formatRTLText('مثال: أن يتقن المتعلم...')}
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={{ marginTop: 8 }}>
                      <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الاستراتيجية العلاجية')}</ThemedText>
                      <TextInput
                        style={[styles.sfTextInput, getTextDirection()]}
                        value={plan.strategy}
                        onChangeText={(v) => updateSkillPlanField(skill, 'strategy', v)}
                        placeholder={formatRTLText('مثال: التعلم باللعب')}
                        placeholderTextColor="#999"
                      />
                    </ThemedView>
                    <ThemedView style={styles.dcFieldRow}>
                      <ThemedView style={styles.dcFieldBlock}>
                        <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الوسائل والموارد')}</ThemedText>
                        <TextInput
                          style={[styles.sfTextInput, getTextDirection()]}
                          value={plan.resources}
                          onChangeText={(v) => updateSkillPlanField(skill, 'resources', v)}
                          placeholder={formatRTLText('بطاقات، سبورة...')}
                          placeholderTextColor="#999"
                        />
                      </ThemedView>
                      <ThemedView style={styles.dcFieldBlockSmall}>
                        <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('المدة')}</ThemedText>
                        <TextInput
                          style={[styles.sfTextInput, getTextDirection()]}
                          value={plan.duration}
                          onChangeText={(v) => updateSkillPlanField(skill, 'duration', v)}
                          placeholder={formatRTLText('أسبوعان')}
                          placeholderTextColor="#999"
                        />
                      </ThemedView>
                      <ThemedView style={styles.dcFieldBlock}>
                        <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('أداة القياس')}</ThemedText>
                        <TextInput
                          style={[styles.sfTextInput, getTextDirection()]}
                          value={plan.measurementTool}
                          onChangeText={(v) => updateSkillPlanField(skill, 'measurementTool', v)}
                          placeholder={formatRTLText('اختبار قصير')}
                          placeholderTextColor="#999"
                        />
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          )}

          {summary.validEntries.filter((e) => e.afterPercent.trim() !== '').length > 0 && (
            <ThemedView style={styles.sfSectionContainer}>
              <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('قياس الأثر')}</ThemedText>
              {summary.validEntries
                .filter((e) => e.afterPercent.trim() !== '')
                .map((e) => {
                  const before = parseFloat(e.masteryPercent) || 0;
                  const after = parseFloat(e.afterPercent) || 0;
                  return (
                    <ThemedView key={e.id} style={styles.dcImpactRow}>
                      <ThemedText style={[styles.dcImpactName, getTextDirection()]}>
                        {formatRTLText(`${e.studentName} — ${e.skill}`)}
                      </ThemedText>
                      <ThemedText style={styles.dcImpactValue}>{`%${before} ← %${after}`}</ThemedText>
                      <ThemedText style={[styles.dcImpactLabel, getTextDirection()]}>
                        {formatRTLText(getImprovementLabel(before, after))}
                      </ThemedText>
                    </ThemedView>
                  );
                })}
            </ThemedView>
          )}

          <ThemedView style={styles.sfSectionContainer}>
            <ThemedText style={[styles.sfSectionTitle, getTextDirection()]}>{formatRTLText('المتابعة والاعتماد')}</ThemedText>
            <ThemedView style={{ marginBottom: 12 }}>
              <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('أبرز ما تحقق')}</ThemedText>
              <TextInput
                style={[styles.sfTextInput, styles.sfTextArea, getTextDirection()]}
                value={difficultyCard.highlightAchieved}
                onChangeText={(v) => updateDifficultyField('highlightAchieved', v)}
                placeholder={formatRTLText('اذكر أبرز ما تحقق خلال فترة المتابعة')}
                placeholderTextColor="#999"
                multiline
              />
            </ThemedView>
            <ThemedView style={{ marginBottom: 12 }}>
              <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('ما زال يحتاج دعماً')}</ThemedText>
              <TextInput
                style={[styles.sfTextInput, styles.sfTextArea, getTextDirection()]}
                value={difficultyCard.stillNeedsSupport}
                onChangeText={(v) => updateDifficultyField('stillNeedsSupport', v)}
                placeholder={formatRTLText('اذكر ما يحتاج دعماً إضافياً')}
                placeholderTextColor="#999"
                multiline
              />
            </ThemedView>
            <ThemedView style={styles.dcFieldRow}>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الإجراء التالي')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.nextAction}
                  onChangeText={(v) => updateDifficultyField('nextAction', v)}
                  placeholder={formatRTLText('مثال: مراجعة الخطة بعد أسبوعين')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.dcFieldBlock}>
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('تاريخ المراجعة القادمة')}</ThemedText>
                <TextInput
                  style={[styles.sfTextInput, getTextDirection()]}
                  value={difficultyCard.reviewDate}
                  onChangeText={(v) => updateDifficultyField('reviewDate', v)}
                  placeholder={formatRTLText('١٤٤٧/٠١/١٥')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.dcExportButtonsRow}>
            <TouchableOpacity
              style={[styles.dcExportButton, isExportingDifficulty && styles.dcExportButtonDisabled]}
              onPress={exportDifficultyPDF}
              disabled={isExportingDifficulty}
            >
              {isExportingDifficulty ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <IconSymbol size={20} name="doc.pdf" color="#fff" />
                  <ThemedText style={[styles.dcExportButtonText, getTextDirection()]}>{formatRTLText('تصدير PDF')}</ThemedText>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dcExportButton, styles.dcExportButtonWord, isExportingDifficulty && styles.dcExportButtonDisabled]}
              onPress={exportDifficultyWord}
              disabled={isExportingDifficulty}
            >
              {isExportingDifficulty ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <IconSymbol size={20} name="doc.text.fill" color="#fff" />
                  <ThemedText style={[styles.dcExportButtonText, getTextDirection()]}>{formatRTLText('تصدير Word')}</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.sfButtonContainer}>
            <TouchableOpacity style={styles.sfCancelButton} onPress={resetDifficultyCard} activeOpacity={0.8}>
              <IconSymbol size={18} name="arrow.clockwise" color="#374151" />
              <ThemedText style={[styles.sfCancelButtonText, getTextDirection()]}>{formatRTLText('تفريغ البطاقة')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sfCancelButton} onPress={closeDifficultyCard} activeOpacity={0.8}>
              <IconSymbol size={18} name="xmark.circle.fill" color="#374151" />
              <ThemedText style={[styles.sfCancelButtonText, getTextDirection()]}>{formatRTLText('إغلاق')}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderStudentCard = (student: Student) => {
    const isExpanded = expandedCards[student.id] || false;
    return (
      <ThemedCard style={styles.studentCard} id={`student-card-${student.id}`}>
        <TouchableOpacity
          style={[styles.studentHeader, { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => toggleCardExpansion(student.id)}
          activeOpacity={0.8}
        >
          <ThemedView style={[styles.studentDetails, { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }]}>
            <ThemedText style={styles.studentName}>{student.name}</ThemedText>
            <ThemedText style={styles.studentGrade}>الصف: {student.grade}</ThemedText>
            <ThemedView style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
              <ThemedText style={styles.statusText}>{student.status}</ThemedText>
            </ThemedView>
          </ThemedView>
          <IconSymbol size={20} name={isExpanded ? 'chevron.up' : 'chevron.down'} color="#666" />
        </TouchableOpacity>
        {isExpanded && (
          <ThemedView style={styles.expandedContent}>
            {student.notes ? (
              <ThemedCard style={styles.notesCard}>
                <ThemedText style={styles.notesText}>{student.notes}</ThemedText>
              </ThemedCard>
            ) : null}

            {student.goals && student.goals.length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>الأهداف</ThemedText>
                <ThemedView style={styles.itemsList}>
                  {student.goals.map((goal, index) => (
                    <ThemedCard key={goal.id || index} style={styles.itemCard}>
                      <ThemedText style={styles.itemTitle}>{goal.title}</ThemedText>
                      <ThemedText style={styles.progressText}>نسبة التحقق: {goal.progress}%</ThemedText>
                    </ThemedCard>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {student.needs && student.needs.length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>الاحتياجات</ThemedText>
                <ThemedView style={styles.itemsList}>
                  {student.needs.map((need, index) => (
                    <ThemedCard key={index} style={styles.itemCard}>
                      <ThemedText style={styles.itemText}>• {need}</ThemedText>
                    </ThemedCard>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {student.performanceEvidence && student.performanceEvidence.length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>الشواهد</ThemedText>
                <ThemedView style={styles.itemsList}>
                  {student.performanceEvidence.map((evidence, index) => (
                    <ThemedCard key={evidence.id || index} style={styles.itemCard}>
                      <ThemedText style={styles.itemTitle}>{evidence.title}</ThemedText>
                      <ThemedText style={styles.itemType}>النوع: {evidence.type}</ThemedText>
                      <ThemedText style={styles.itemDate}>التاريخ: {evidence.date}</ThemedText>
                    </ThemedCard>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            <ThemedView style={{ flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: '#add4ce' }]} onPress={() => openEditForm(student)}>
                <IconSymbol size={16} name="pencil" color="#1c1f33" />
                <ThemedText style={styles.addButtonText}>تعديل</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: '#F44336' }]} onPress={() => confirmDeleteStudent(student.id, student.name)}>
                <IconSymbol size={16} name="trash" color="#fff" />
                <ThemedText style={[styles.addButtonText, { color: '#fff' }]}>حذف</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedCard>
    );
  };

  // "قائمة المتعلمين" أصبحت تلخيصًا لصفوف جدول المتابعة في "بطاقة متابعة
  // متعلم" نفسها (نفس مصدر البيانات)، بدل قائمة مستقلة عنها بأهداف/
  // احتياجات/شواهد منفصلة يدويًا.
  const trackedEntries = computeDifficultySummary(difficultyCard).validEntries;

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} tintColor={TEAL} />
            }
          >
            <ThemedView style={styles.header}>
              <ThemedButton
                icon="chevron.left"
                iconColor="#1c1f33"
                style={styles.backButton}
                onPress={() => router.push('/(tabs)')}
              />
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="person.2.fill" color="#1c1f33" />
              </ThemedView>
              <ThemedView style={styles.titleRow}>
                <ThemedText type="title" style={[styles.mainTitle, getTextDirection()]}>
                  {formatRTLText('تتبع حالة المتعلمين ( الخطط العلاجية والاثرائية )')}
                </ThemedText>
              </ThemedView>
              <ThemedText style={[styles.headerSubtitle, getTextDirection()]}>
                {formatRTLText('متابعة وتقييم حالة الطلاب')}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.quickActionsSection}>
              <ThemedView style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickActionButtonTertiary} onPress={openDifficultyCard}>
                  <ThemedText style={[styles.quickActionButtonText, getTextDirection()]}>
                    {formatRTLText('بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية )')}
                  </ThemedText>
                  <IconSymbol size={20} name="plus" color="#fff" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {formVisible && renderStudentForm()}

            {difficultyCardVisible && renderDifficultyCard()}

            <ThemedView style={styles.pageSection}>
              <ThemedView style={styles.pageSectionHeader}>
                <ThemedText style={[styles.pageSectionTitle, getTextDirection()]}>
                  {formatRTLText('قائمة المتعلمين')}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.studentsListInner}>
                {trackedEntries.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <IconSymbol size={40} name="person.3.fill" color="#9ca3af" />
                    <ThemedText style={[styles.emptyTitle, getTextDirection()]}>{formatRTLText('لا يوجد متعلمون بعد')}</ThemedText>
                    <ThemedText style={[styles.emptySubtitle, getTextDirection()]}>
                      {formatRTLText('أضيفي متعلمين من «بطاقة متابعة متعلم» أعلاه ليظهروا هنا')}
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <ThemedView style={styles.trackedTable}>
                      <ThemedView style={styles.trackedHeaderRow}>
                        <ThemedText style={[styles.trackedHeaderCell, styles.trackedColName, getTextDirection()]}>{formatRTLText('اسم الطالب')}</ThemedText>
                        <ThemedText style={[styles.trackedHeaderCell, styles.trackedColDesc, getTextDirection()]}>{formatRTLText('الوصف')}</ThemedText>
                        <ThemedText style={[styles.trackedHeaderCell, styles.trackedColNeed, getTextDirection()]}>{formatRTLText('نوع الاحتياج')}</ThemedText>
                        <ThemedText style={[styles.trackedHeaderCell, styles.trackedColGoal, getTextDirection()]}>{formatRTLText('الهدف')}</ThemedText>
                        <ThemedText style={[styles.trackedHeaderCell, styles.trackedColDate, getTextDirection()]}>{formatRTLText('تاريخ المتابعة')}</ThemedText>
                      </ThemedView>
                      {trackedEntries.map((entry) => {
                        const percent = parseFloat(entry.masteryPercent) || 0;
                        const level = getPerformanceLevel(percent, parseFloat(difficultyCard.masteryCriteria) || 0);
                        return (
                          <ThemedView key={entry.id} style={styles.trackedDataRow}>
                            <ThemedText style={[styles.trackedCell, styles.trackedColName, getTextDirection()]} numberOfLines={2}>
                              {formatRTLText(entry.studentName)}
                            </ThemedText>
                            <ThemedText style={[styles.trackedCell, styles.trackedColDesc, getTextDirection()]} numberOfLines={2}>
                              {formatRTLText(entry.skill) || '-'}
                            </ThemedText>
                            <ThemedView style={styles.trackedColNeed}>
                              <ThemedView style={[styles.trackedNeedBadge, { backgroundColor: level.color }]}>
                                <ThemedText style={styles.trackedNeedBadgeText}>{formatRTLText(level.label)}</ThemedText>
                              </ThemedView>
                            </ThemedView>
                            <ThemedText style={[styles.trackedCell, styles.trackedColGoal, getTextDirection()]} numberOfLines={3}>
                              {formatRTLText(entry.plan) || '-'}
                            </ThemedText>
                            <ThemedText style={[styles.trackedCell, styles.trackedColDate, getTextDirection()]}>
                              {formatRTLText(entry.followUpDate) || '-'}
                            </ThemedText>
                          </ThemedView>
                        );
                      })}
                    </ThemedView>
                  </ScrollView>
                )}
              </ThemedView>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
      <BottomNavigationBar />

      <Modal visible={duplicateModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ThemedText style={styles.modalTitle}>تنبيه</ThemedText>
            <ThemedText style={styles.modalMessage}>يوجد متعلم بنفس الاسم، هل تريد المتابعة؟</ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setDuplicateModalVisible(false)}>
                <ThemedText style={styles.modalButtonCancelText}>إلغاء</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleDuplicateContinue}>
                <ThemedText style={styles.modalButtonConfirmText}>متابعة</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ThemedText style={styles.modalTitle}>✅ تم الحفظ بنجاح!</ThemedText>
            <ThemedText style={styles.modalMessage}>{successModalMessage}</ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleSuccessDone}>
                <ThemedText style={styles.modalButtonConfirmText}>تم</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ThemedText style={styles.modalTitle}>❌ خطأ في الحفظ</ThemedText>
            <ThemedText style={styles.modalMessage}>{errorModalMessage}</ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setErrorModalVisible(false)}>
                <ThemedText style={styles.modalButtonCancelText}>إلغاء</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleErrorRetry}>
                <ThemedText style={styles.modalButtonConfirmText}>إعادة المحاولة</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!wordDownloadDifficulty} transparent animationType="fade" onRequestClose={closeWordDownloadDifficulty}>
        <View style={styles.wordDownloadOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeWordDownloadDifficulty} />
          <View style={styles.wordDownloadBox}>
            <ThemedText style={[styles.wordDownloadTitle, getTextDirection()]}>{formatRTLText('تحميل ملف Word')}</ThemedText>
            <ThemedText style={[styles.wordDownloadHint, getTextDirection()]}>
              {formatRTLText('اضغط الزر أدناه لتحميل الملف.')}
            </ThemedText>
            <TouchableOpacity
              style={styles.wordDownloadButton}
              onPress={() => {
                if (!wordDownloadDifficulty) return;
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  const a = document.createElement('a');
                  a.href = wordDownloadDifficulty.url;
                  a.download = wordDownloadDifficulty.name;
                  a.click();
                }
                closeWordDownloadDifficulty();
              }}
            >
              <ThemedText style={styles.wordDownloadButtonText}>{formatRTLText('تحميل الملف')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.wordDownloadCancel} onPress={closeWordDownloadDifficulty}>
              <ThemedText style={styles.wordDownloadCancelText}>{formatRTLText('إلغاء')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    marginBottom: 20,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    backgroundColor: '#add4ce',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', justifyContent: 'center', backgroundColor: 'transparent' },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#1c1f33', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  quickActionsSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickActionButtonTertiary: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TEAL_DARK,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quickActionButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // ===== بطاقة متابعة متعلم ( الخطط العلاجية والاثرائية ) (dc = difficulty card) =====
  dcFieldRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  dcFieldBlock: { flex: 1, minWidth: 150 },
  dcFieldBlockSmall: { flex: 1, minWidth: 100 },
  dcNeedsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dcNeedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dcNeedBadgeActive: { backgroundColor: TEAL, borderColor: TEAL },
  dcNeedBadgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  dcNeedBadgeTextActive: { color: '#fff' },
  dcEmptyHint: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  dcSummaryRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  dcSummaryBox: {
    flex: 1,
    minWidth: 90,
    backgroundColor: TEAL,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dcSummaryValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  dcSummaryLabel: { fontSize: 11, color: '#fff', marginTop: 2, textAlign: 'center' },
  dcSummaryHint: { fontSize: 13, color: '#374151', marginTop: 4 },
  dcImpactRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  dcImpactName: { fontSize: 12, color: '#1c1f33', flex: 1.5 },
  dcImpactValue: { fontSize: 12, fontWeight: '700', color: '#374151' },
  dcImpactLabel: { fontSize: 11, fontWeight: '600', color: TEAL },
  dcExportButtonsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  dcExportButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
  },
  dcExportButtonWord: { backgroundColor: '#2563eb' },
  dcExportButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  dcExportButtonDisabled: { opacity: 0.7 },

  wordDownloadOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  wordDownloadBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, minWidth: 280, maxWidth: 360 },
  wordDownloadTitle: { fontSize: 18, fontWeight: '700', color: '#1c1f33', marginBottom: 8, textAlign: 'center' },
  wordDownloadHint: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  wordDownloadButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  wordDownloadButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  wordDownloadCancel: { alignItems: 'center', paddingVertical: 8 },
  wordDownloadCancelText: { fontSize: 15, color: '#6b7280' },

  pageSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pageSectionHeader: { backgroundColor: TEAL, paddingVertical: 12, paddingHorizontal: 16 },
  pageSectionHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  pageSectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  studentsListInner: { padding: 12, gap: 12 },
  trackedTable: { minWidth: 620 },
  trackedHeaderRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  trackedHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  trackedDataRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  trackedCell: {
    fontSize: 13,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  trackedColName: { width: 130, fontWeight: '600' },
  trackedColDesc: { width: 150 },
  trackedColNeed: { width: 110, alignItems: 'center', paddingVertical: 6 },
  trackedColGoal: { width: 170 },
  trackedColDate: { width: 90 },
  trackedNeedBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  trackedNeedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 100,
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
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  studentDetails: {
    marginBottom: 20,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  studentGrade: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 0,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 0,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#666',
  },

  // ===== نموذج الإضافة/التعديل (sf = student form) =====
  sfBody: { padding: 16 },
  sfSectionContainer: { marginBottom: 24 },
  sfSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1c1f33', marginBottom: 12 },
  sfSectionHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sfInputGroup: { marginBottom: 16 },
  sfLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  sfLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  sfTextInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1c1f33',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sfTextArea: { height: 90, textAlignVertical: 'top' },
  sfStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sfStatusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    minWidth: 100,
  },
  sfSelectedStatus: { borderWidth: 3, borderColor: '#fff' },
  sfStatusText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sfActionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: TEAL,
    borderRadius: 20,
    gap: 6,
  },
  sfActionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sfActionButtonSecondary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sfActionButtonSecondaryText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  sfFormCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sfButtonRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 6 },
  sfItemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sfItemHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  sfItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#1c1f33', flex: 1 },
  sfProgressContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  sfProgressText: { fontSize: 13, fontWeight: 'bold', color: GREEN, minWidth: 36 },
  sfProgressBar: { flex: 1, height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  sfProgressFill: { height: '100%', backgroundColor: GREEN, borderRadius: 4 },
  sfInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sfTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sfTypeOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sfSelectedType: { backgroundColor: TEAL_LIGHT, borderColor: TEAL_LIGHT },
  sfTypeText: { fontSize: 12, color: '#1c1f33', fontWeight: '500' },
  sfEvidenceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sfEvidenceInfo: { flex: 1 },
  sfEvidenceType: { fontSize: 11, color: '#6b7280' },
  sfUploadButtonsContainer: { flexDirection: 'row-reverse', gap: 8, marginBottom: 12 },
  sfUploadOptionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 4,
  },
  sfUploadOptionText: { fontSize: 11, fontWeight: '600' },
  sfSelectedFileContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sfFileInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 },
  sfFileDetails: { flex: 1 },
  sfFileInfoText: { fontSize: 13, color: '#1c1f33', fontWeight: '500' },
  sfFileTypeText: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  sfNoFileSelected: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 4,
  },
  sfNoFileText: { fontSize: 12, color: '#9ca3af' },
  sfEvidenceDetails: { marginTop: 6, gap: 4 },
  sfEvidenceDetailText: { fontSize: 12, color: '#6b7280' },
  sfFileDisplayInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  sfButtonContainer: { marginTop: 8, gap: 12 },
  sfSaveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sfSaveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sfCancelButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  sfCancelButtonText: { color: '#374151', fontSize: 14, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 12,
    textAlign: 'right',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'right',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalButtonCancel: {
    backgroundColor: '#E5E5EA',
  },
  modalButtonCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  modalButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
