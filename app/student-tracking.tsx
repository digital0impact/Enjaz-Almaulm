import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  Platform, 
  RefreshControl, 
  StatusBar, 
  I18nManager,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { Student } from '@/types';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const GREEN = '#059669';

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

/** فئات إحصائيات حالة المتعلمين، بنفس الألوان المعتمدة سابقاً في بطاقة الإحصائيات */
const STATUS_LEVELS: Array<{ key: string; label: string; color: string; statuses: string[] }> = [
  { key: 'excellent', label: 'متفوقون', color: '#4CAF50', statuses: ['تفوق', 'ممتاز'] },
  { key: 'needsDevelopment', label: 'يحتاجون تطوير', color: '#FF5722', statuses: ['يحتاج إلى تطوير', 'مقبول'] },
  { key: 'learningDifficulties', label: 'صعوبات التعلم', color: '#9C27B0', statuses: ['صعوبات التعلم'] },
  { key: 'weak', label: 'ضعف', color: '#F44336', statuses: ['ضعف', 'ضعيف'] },
];

export default function StudentTrackingScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
    checkSelectedStudent();
  }, []);

  const checkSelectedStudent = async () => {
    try {
      const storedId = await AsyncStorage.getItem('selectedStudentId');
      if (storedId) {
        setSelectedStudentId(storedId);
        // مسح المعرف المخزن بعد استخدامه
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
        let students = JSON.parse(stored);

        // تحديث التصنيفات القديمة للتصنيفات الجديدة (بدون دمج ضعف مع صعوبات التعلم)
        students = students.map((student: Student) => {
          let updatedStatus = student.status;
          if (student.status === 'ممتاز') {
            updatedStatus = 'تفوق';
          } else if (student.status === 'مقبول') {
            updatedStatus = 'يحتاج إلى تطوير';
          } else if (student.status === 'ضعيف') {
            updatedStatus = 'ضعف';
          }
          // ضعف يبقى ضعف — لا يُحوّل إلى صعوبات التعلم

          return {
            ...student,
            status: updatedStatus as Student['status']
          };
        });

        await AsyncStorage.setItem('students', JSON.stringify(students));
        setStudents(students);
        
        // إذا كان هناك متعلم محدد، قم بالتمرير إلى بطاقته
        if (selectedStudentId) {
          const selectedStudentIndex = students.findIndex((s: Student) => s.id === selectedStudentId);
          if (selectedStudentIndex !== -1) {
            // استخدم setTimeout للسماح للقائمة بالتحميل أولاً
            setTimeout(() => {
              const studentCard = document.getElementById(`student-card-${selectedStudentId}`);
              if (studentCard) {
                studentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 500);
          }
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

  const deleteStudent = async (studentId: string, studentName: string) => {
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
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteStudent(studentId, studentName)
        }
      ],
      { cancelable: true }
    );
  };

  const toggleCardExpansion = (studentId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'تفوق':
      case 'ممتاز':
        return 'star.fill';
      case 'يحتاج إلى تطوير':
      case 'مقبول':
        return 'star';
      case 'صعوبات التعلم':
      case 'ضعيف':
      case 'ضعف':
        return 'exclamationmark.triangle.fill';
      default:
        return 'person.circle';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return '#4CAF50';
      case 'معلق':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

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
          <IconSymbol 
            size={20} 
            name={isExpanded ? 'chevron.up' : 'chevron.down'} 
            color="#666" 
          />
        </TouchableOpacity>
        {isExpanded && (
          <ThemedView style={styles.expandedContent}>
            {student.notes ? (
              <ThemedView style={styles.notesCard}>
                <ThemedText style={styles.notesText}>{student.notes}</ThemedText>
              </ThemedView>
            ) : null}

            {/* الأهداف */}
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

            {/* الاحتياجات */}
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

            {/* الشواهد */}
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

            {/* أزرار التعديل والحذف */}
            <ThemedView style={{ flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#add4ce' }]}
                onPress={() => router.push(`/add-student?id=${student.id}&edit=true`)}
              >
                <IconSymbol size={16} name="pencil" color="#1c1f33" />
                <ThemedText style={styles.addButtonText}>تعديل</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#F44336' }]}
                onPress={() => confirmDeleteStudent(student.id, student.name)}
              >
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
                <TouchableOpacity style={styles.quickActionButtonPrimary} onPress={() => router.push('/add-student')}>
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
  levelsTable: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  levelRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  levelBadge: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 12, minWidth: 120, alignItems: 'center' },
  levelBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  levelCount: { fontSize: 15, fontWeight: '700', color: '#1c1f33', flex: 1, textAlign: 'center' },
  studentsListInner: { padding: 12, gap: 12 },
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'ltr',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'ltr',
    marginBottom: 20,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'ltr',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 0,
    gap: 10,
  },
  statItem: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  studentsList: {
    paddingHorizontal: 16,
    gap: 12,
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
  studentMainInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  studentIconContainer: {
    marginLeft: 12,
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
  actionButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  reportButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    writingDirection: 'ltr',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
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
  itemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    writingDirection: 'ltr',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
}); 