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
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
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

/** فئات إحصائيات حالة المتعلمين، بنفس الألوان المعتمدة سابقاً في بطاقة الإحصائيات */
const STATUS_LEVELS: Array<{ key: string; label: string; color: string; statuses: string[] }> = [
  { key: 'excellent', label: 'متفوقون', color: '#4CAF50', statuses: ['تفوق', 'ممتاز'] },
  { key: 'needsDevelopment', label: 'يحتاجون تطوير', color: '#FF5722', statuses: ['يحتاج إلى تطوير', 'مقبول'] },
  { key: 'learningDifficulties', label: 'صعوبات التعلم', color: '#9C27B0', statuses: ['صعوبات التعلم'] },
  { key: 'weak', label: 'ضعف', color: '#F44336', statuses: ['ضعف', 'ضعيف'] },
];

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

  useEffect(() => {
    loadStudents();
    checkSelectedStudent();
  }, []);

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

  // ===== نموذج الإضافة/التعديل =====

  const openAddForm = () => {
    setFormData(EMPTY_STUDENT_FORM);
    setEditingId(null);
    setShowGoalForm(false);
    setShowNeedForm(false);
    setShowEvidenceForm(false);
    setFormVisible(true);
  };

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

  const handleSuccessAddAnother = () => {
    setSuccessModalVisible(false);
    setFormData(EMPTY_STUDENT_FORM);
    setEditingId(null);
  };

  const handleErrorRetry = () => {
    setErrorModalVisible(false);
    saveStudentForm();
  };

  const renderStudentForm = () => (
    <ThemedView style={styles.pageSection}>
      <ThemedView style={[styles.pageSectionHeader, styles.pageSectionHeaderRow]}>
        <ThemedText style={[styles.pageSectionTitle, getTextDirection()]}>
          {formatRTLText(editingId ? 'تعديل بيانات المتعلم' : 'إضافة متعلم جديد')}
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
                <ThemedText style={[styles.sfLabel, getTextDirection()]}>{formatRTLText('الاحتياج')}</ThemedText>
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

  const renderStudentCard = (student: Student) => {
    const isExpanded = expandedCards[student.id] || false;
    return (
      <ThemedView style={styles.studentCard} id={`student-card-${student.id}`}>
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
              <ThemedView style={styles.notesCard}>
                <ThemedText style={styles.notesText}>{student.notes}</ThemedText>
              </ThemedView>
            ) : null}

            {student.goals && student.goals.length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>الأهداف</ThemedText>
                <ThemedView style={styles.itemsList}>
                  {student.goals.map((goal, index) => (
                    <ThemedView key={goal.id || index} style={styles.itemCard}>
                      <ThemedText style={styles.itemTitle}>{goal.title}</ThemedText>
                      <ThemedText style={styles.progressText}>نسبة التحقق: {goal.progress}%</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {student.needs && student.needs.length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>الاحتياجات</ThemedText>
                <ThemedView style={styles.itemsList}>
                  {student.needs.map((need, index) => (
                    <ThemedView key={index} style={styles.itemCard}>
                      <ThemedText style={styles.itemText}>• {need}</ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {student.performanceEvidence && student.performanceEvidence.length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>الشواهد</ThemedText>
                <ThemedView style={styles.itemsList}>
                  {student.performanceEvidence.map((evidence, index) => (
                    <ThemedView key={evidence.id || index} style={styles.itemCard}>
                      <ThemedText style={styles.itemTitle}>{evidence.title}</ThemedText>
                      <ThemedText style={styles.itemType}>النوع: {evidence.type}</ThemedText>
                      <ThemedText style={styles.itemDate}>التاريخ: {evidence.date}</ThemedText>
                    </ThemedView>
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
      </ThemedView>
    );
  };

  const renderStatsCard = () => {
    const totalStudents = students.length;
    const levels = STATUS_LEVELS.map((level) => ({
      ...level,
      count: students.filter((s) => level.statuses.includes(s.status)).length,
    }));

    return (
      <ThemedView style={styles.pageSection}>
        <ThemedView style={styles.pageSectionHeader}>
          <ThemedText style={[styles.pageSectionTitle, getTextDirection()]}>
            {formatRTLText('إحصائيات المتعلمين')}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={styles.statBox}>
            <ThemedText style={styles.statValue}>{totalStudents}</ThemedText>
            <ThemedText style={[styles.statLabel, getTextDirection()]}>{formatRTLText('إجمالي المتعلمين')}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView style={styles.levelsTable}>
          {levels.map((level) => (
            <ThemedView key={level.key} style={styles.levelRow}>
              <ThemedView style={[styles.levelBadge, { backgroundColor: level.color }]}>
                <ThemedText style={styles.levelBadgeText}>{formatRTLText(level.label)}</ThemedText>
              </ThemedView>
              <ThemedText style={[styles.levelCount, getTextDirection()]}>{level.count}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
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
              <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>
              <ThemedView style={styles.titleRow}>
                <ThemedView style={styles.tealBar} />
                <ThemedText type="title" style={[styles.mainTitle, getTextDirection()]}>
                  {formatRTLText('تتبع حالة المتعلمين')}
                </ThemedText>
              </ThemedView>
              <ThemedText style={[styles.headerSubtitle, getTextDirection()]}>
                {formatRTLText('متابعة وتقييم حالة الطلاب')}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.quickActionsSection}>
              <ThemedView style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.quickActionButtonPrimary} onPress={openAddForm}>
                  <IconSymbol size={20} name="person.badge.plus" color="#fff" />
                  <ThemedText style={[styles.quickActionButtonText, getTextDirection()]}>
                    {formatRTLText('إضافة متعلم جديد')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButtonSecondary} onPress={() => router.push('/remedial-plans')}>
                  <IconSymbol size={20} name="doc.text.fill" color="#fff" />
                  <ThemedText style={[styles.quickActionButtonText, getTextDirection()]}>
                    {formatRTLText('الخطط العلاجية والإثرائية')}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {formVisible && renderStudentForm()}

            {renderStatsCard()}

            <ThemedView style={styles.pageSection}>
              <ThemedView style={styles.pageSectionHeader}>
                <ThemedText style={[styles.pageSectionTitle, getTextDirection()]}>
                  {formatRTLText('قائمة المتعلمين')}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.studentsListInner}>
                {loading ? (
                  <ThemedView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={TEAL} />
                    <ThemedText style={[styles.loadingText, getTextDirection()]}>{formatRTLText('جارٍ التحميل...')}</ThemedText>
                  </ThemedView>
                ) : students.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <IconSymbol size={40} name="person.3.fill" color="#9ca3af" />
                    <ThemedText style={[styles.emptyTitle, getTextDirection()]}>{formatRTLText('لا يوجد متعلمون بعد')}</ThemedText>
                    <ThemedText style={[styles.emptySubtitle, getTextDirection()]}>
                      {formatRTLText('اضغط "إضافة متعلم جديد" للبدء')}
                    </ThemedText>
                  </ThemedView>
                ) : (
                  students.map((student) => (
                    <React.Fragment key={student.id}>{renderStudentCard(student)}</React.Fragment>
                  ))
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
              {!editingId && (
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={handleSuccessAddAnother}>
                  <ThemedText style={styles.modalButtonCancelText}>إضافة متعلم آخر</ThemedText>
                </TouchableOpacity>
              )}
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
    marginBottom: 20,
    position: 'relative',
  },
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
  quickActionsSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickActionButtonPrimary: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GREEN,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quickActionButtonSecondary: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TEAL,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  quickActionButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
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
  statBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1c1f33' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 0,
    gap: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  levelsTable: { paddingHorizontal: 12, paddingBottom: 12, gap: 8, marginTop: 12 },
  levelRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  levelBadge: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12, minWidth: 120, alignItems: 'center' },
  levelBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  levelCount: { fontSize: 15, fontWeight: '700', color: '#1c1f33', flex: 1, textAlign: 'center' },
  studentsListInner: { padding: 12, gap: 12 },
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
