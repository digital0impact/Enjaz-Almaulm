import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  ImageBackground, 
  Platform, 
  Alert, 
  RefreshControl, 
  StatusBar, 
  I18nManager,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { Student } from '@/types';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

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

export default function StudentTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

        // تحديث التصنيفات القديمة للتصنيفات الجديدة
        students = students.map((student: Student) => {
          let updatedStatus = student.status;
          if (student.status === 'ممتاز') {
            updatedStatus = 'تفوق';
          } else if (student.status === 'مقبول') {
            updatedStatus = 'يحتاج إلى تطوير';
          } else if (student.status === 'ضعيف' || student.status === 'ضعف') {
            updatedStatus = 'صعوبات التعلم';
          }

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
    Alert.alert(
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
    const excellentStudents = students.filter(s => s.status === 'تفوق' || s.status === 'ممتاز').length;
    const needsDevelopment = students.filter(s => s.status === 'يحتاج إلى تطوير' || s.status === 'مقبول').length;
    const learningDifficulties = students.filter(s => s.status === 'صعوبات التعلم' || s.status === 'ضعيف' || s.status === 'ضعف').length;

    return (
      <ThemedView style={styles.statsCard}>
                        <ThemedText style={styles.statsTitle}>إحصائيات المتعلمين</ThemedText>
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={styles.statItem}>
            <IconSymbol size={30} name="person.3.fill" color="#4CAF50" />
                          <ThemedText style={styles.statNumber}>{totalStudents}</ThemedText>
              <ThemedText style={styles.statLabel}>إجمالي المتعلمين</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statItem}>
            <IconSymbol size={30} name="star.fill" color="#4CAF50" />
                          <ThemedText style={styles.statNumber}>{excellentStudents}</ThemedText>
              <ThemedText style={styles.statLabel}>متفوقون</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statItem}>
            <IconSymbol size={30} name="star" color="#FF5722" />
                          <ThemedText style={styles.statNumber}>{needsDevelopment}</ThemedText>
              <ThemedText style={styles.statLabel}>يحتاجون تطوير</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statItem}>
            <IconSymbol size={30} name="exclamationmark.triangle.fill" color="#F44336" />
                          <ThemedText style={styles.statNumber}>{learningDifficulties}</ThemedText>
              <ThemedText style={styles.statLabel}>صعوبات التعلم</ThemedText>
          </ThemedView>
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
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <ThemedView style={[styles.header, { paddingTop: insets.top + 20 }]}> 
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.push('/(tabs)')}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                تتبع حالة المتعلمين
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                متابعة وتقييم حالة الطلاب
              </ThemedText>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/add-student')}
              >
                <IconSymbol size={20} name="plus" color="#1c1f33" />
                <ThemedText style={styles.addButtonText}>إضافة متعلم جديد</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addButton, { marginTop: 10 }]}
                onPress={() => router.push('/remedial-plans')}
              >
                <IconSymbol size={20} name="doc.text.fill" color="#1c1f33" />
                <ThemedText style={styles.addButtonText}>إدارة الخطط العلاجية</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* باقي الصفحة ... */}
            {renderStatsCard()}
            <ThemedView style={styles.studentsList}>
              {students.map((student) => (
                <React.Fragment key={student.id}>
                  {renderStudentCard(student)}
                </React.Fragment>
              ))}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: 'transparent',
    position: 'relative',
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
    justifyContent: 'space-between',
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