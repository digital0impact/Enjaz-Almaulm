import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'يحتاج إلى تطوير' | 'صعوبات التعلم' | 'ضعف';
  lastUpdate: string;
  notes: string;
  remedialPlans?: RemedialPlan[];
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
}

export default function StudentTrackingScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
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
          } else if (student.status === 'ضعيف') {
            updatedStatus = 'صعوبات التعلم';
          }

          return {
            ...student,
            status: updatedStatus as Student['status']
          };
        });

        // حفظ البيانات المحدثة
        await AsyncStorage.setItem('students', JSON.stringify(students));
        setStudents(students);
      }
    } catch (error) {
      console.log('Error loading students:', error);
    }
  };

  const deleteStudent = async (studentId: string, studentName: string) => {
    try {
      const updatedStudents = students.filter(student => student.id !== studentId);
      await AsyncStorage.setItem('students', JSON.stringify(updatedStudents));
      setStudents(updatedStudents);
      console.log(`تم حذف المتعلم: ${studentName}`);
    } catch (error) {
      console.log('Error deleting student:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تفوق': return '#4CAF50';  // تفوق - أخضر
      case 'يحتاج إلى تطوير': return '#FF5722'; // يحتاج إلى تطوير - برتقالي
      case 'صعوبات التعلم': return '#F44336'; // صعوبات التعلم - أحمر
      case 'ضعف': return '#9C27B0';  // ضعف - بنفسجي
      default: return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'تفوق': return 'star.fill';                    // تفوق
      case 'يحتاج إلى تطوير': return 'star';                        // يحتاج إلى تطوير
      case 'صعوبات التعلم': return 'exclamationmark.triangle.fill'; // صعوبات التعلم
      case 'ضعف': return 'minus.circle.fill';             // ضعف
      default: return 'person.circle';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <ThemedView style={styles.content}>
                {/* Header */}
                <ThemedView style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
                  </TouchableOpacity>

                  <ThemedView style={styles.iconContainer}>
                    <IconSymbol size={60} name="person.crop.circle.badge.plus" color="#1c1f33" />
                  </ThemedView>

                  <ThemedText type="title" style={styles.title}>
                    تتبع حالة متعلم
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    متابعة تقدم وأداء الطلاب
                  </ThemedText>
                </ThemedView>

                {/* Add Student Button */}
                <ThemedView style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => router.push('/add-student')}
                  >
                    <IconSymbol size={20} name="plus" color="#1c1f33" />
                    <ThemedText style={styles.buttonText}>إضافة متعلم جديد</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => router.push('/remedial-plans')}
                  >
                    <IconSymbol size={20} name="heart.text.square" color="#1c1f33" />
                    <ThemedText style={styles.buttonText}>إدارة الخطط العلاجية</ThemedText>
                  </TouchableOpacity>
                </ThemedView>

                {/* Students List or Empty State */}
                {students.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <ThemedView style={styles.emptyIconContainer}>
                      <IconSymbol size={80} name="person.crop.circle.badge.plus" color="#ccc" />
                    </ThemedView>
                    <ThemedText style={styles.emptyTitle}>لا توجد بيانات متعلمين</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>اضغط على "إضافة متعلم جديد" لبدء المتابعة</ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.studentsSection}>
                    <ThemedText style={styles.sectionTitle}>قائمة المتعلمين</ThemedText>

                    {/* Statistics */}
                    <ThemedView style={styles.statsContainer}>
                      <ThemedView style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
                        <IconSymbol size={24} name="person.3.fill" color="#4CAF50" />
                        <ThemedText style={styles.statNumber}>{students.length}</ThemedText>
                        <ThemedText style={styles.statLabel}>إجمالي المتعلمين</ThemedText>
                      </ThemedView>

                      <ThemedView style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                        <IconSymbol size={24} name="star.fill" color="#FF9800" />
                        <ThemedText style={styles.statNumber}>
                          {students.filter(s => s.status === 'تفوق').length}
                        </ThemedText>
                        <ThemedText style={styles.statLabel}>متفوقين</ThemedText>
                      </ThemedView>

                      <ThemedView style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                        <IconSymbol size={24} name="heart.text.square" color="#F44336" />
                        <ThemedText style={styles.statNumber}>
                          {students.reduce((total, student) => 
                            total + (student.remedialPlans?.filter(plan => plan.status === 'نشط').length || 0), 0
                          )}
                        </ThemedText>
                        <ThemedText style={styles.statLabel}>خطط علاجية نشطة</ThemedText>
                      </ThemedView>
                    </ThemedView>

                    {/* Students Grid */}
                    <ThemedView style={styles.studentsGrid}>
                      {students.map((student) => (
                        <TouchableOpacity 
                          key={student.id}
                          style={styles.studentCard}
                          onPress={() => router.push(`/student-details?id=${student.id}`)}
                        >
                          <ThemedView style={styles.studentHeader}>
                            <ThemedView style={styles.studentIconWrapper}>
                              <IconSymbol 
                                size={24} 
                                name={getStatusIcon(student.status)} 
                                color={getStatusColor(student.status)} 
                              />
                            </ThemedView>
                            <ThemedView style={styles.studentHeaderActions}>
                              <ThemedView style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
                                <ThemedText style={styles.statusText}>{student.status}</ThemedText>
                              </ThemedView>
                              <TouchableOpacity 
                                style={styles.deleteButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  confirmDeleteStudent(student.id, student.name);
                                }}
                              >
                                <IconSymbol size={16} name="trash.fill" color="#F44336" />
                              </TouchableOpacity>
                            </ThemedView>
                          </ThemedView>

                          <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                          <ThemedText style={styles.studentGrade}>{student.grade}</ThemedText>

                          {/* Goals Section */}
                          {student.goals && student.goals.length > 0 && (
                            <ThemedView style={styles.goalsSection}>
                              <ThemedView style={styles.sectionHeader}>
                                <IconSymbol size={14} name="target" color="#2196F3" />
                                <ThemedText style={styles.sectionTitle}>الأهداف</ThemedText>
                              </ThemedView>
                              {student.goals.slice(0, 2).map((goal, index) => (
                                <ThemedView key={goal.id} style={styles.goalItem}>
                                  <ThemedText style={styles.goalTitle} numberOfLines={1}>
                                    • {goal.title}
                                  </ThemedText>
                                  <ThemedView style={styles.goalProgress}>
                                    <ThemedText style={styles.goalProgressText}>
                                      {goal.progress}%
                                    </ThemedText>
                                    <ThemedView style={styles.goalProgressBar}>
                                      <ThemedView 
                                        style={[
                                          styles.goalProgressFill,
                                          { 
                                            width: `${goal.progress}%`,
                                            backgroundColor: goal.progress >= 70 ? '#4CAF50' : goal.progress >= 40 ? '#FF9800' : '#F44336'
                                          }
                                        ]}
                                      />
                                    </ThemedView>
                                  </ThemedView>
                                </ThemedView>
                              ))}
                              {student.goals.length > 2 && (
                                <ThemedText style={styles.moreItemsText}>
                                  +{student.goals.length - 2} أهداف أخرى
                                </ThemedText>
                              )}
                            </ThemedView>
                          )}

                          {/* Needs Section */}
                          {student.needs && student.needs.length > 0 && (
                            <ThemedView style={styles.needsSection}>
                              <ThemedView style={styles.sectionHeader}>
                                <IconSymbol size={14} name="exclamationmark.circle" color="#FF5722" />
                                <ThemedText style={styles.sectionTitle}>الاحتياجات</ThemedText>
                              </ThemedView>
                              <ThemedView style={styles.needsList}>
                                {student.needs.slice(0, 3).map((need, index) => (
                                  <ThemedView key={index} style={styles.needItem}>
                                    <ThemedText style={styles.needText} numberOfLines={1}>
                                      • {need}
                                    </ThemedText>
                                  </ThemedView>
                                ))}
                                {student.needs.length > 3 && (
                                  <ThemedText style={styles.moreItemsText}>
                                    +{student.needs.length - 3} احتياجات أخرى
                                  </ThemedText>
                                )}
                              </ThemedView>
                            </ThemedView>
                          )}

                          {/* Remedial Plans Indicator */}
                          {student.remedialPlans && student.remedialPlans.length > 0 && (
                            <ThemedView style={styles.remedialPlansIndicator}>
                              <IconSymbol size={16} name="heart.text.square" color="#F44336" />
                              <ThemedText style={styles.remedialPlansText}>
                                {student.remedialPlans.filter(plan => plan.status === 'نشط').length} نشطة | {student.remedialPlans.filter(plan => plan.status === 'مكتمل').length} مكتملة
                              </ThemedText>
                            </ThemedView>
                          )}

                          <ThemedView style={styles.studentFooter}>
                            <ThemedText style={styles.lastUpdate}>
                              آخر تحديث: {student.lastUpdate}
                            </ThemedText>
                          </ThemedView>
                        </TouchableOpacity>
                      ))}
                    </ThemedView>
                  </ThemedView>
                )}
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        </ExpoLinearGradient>
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
  gradientOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  header: {
    padding: 20,
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: 10,
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
    color: '#666666',
    writingDirection: 'rtl',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'transparent',
    gap: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#add4ce',
  },
  buttonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'transparent',
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
    textAlign: 'center',
    marginBottom: 10,
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl',
  },
  studentsSection: {
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
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
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
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  studentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  studentCard: {
    width: '48%',
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
    marginBottom: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentIconWrapper: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  studentHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 5,
  },
  studentGrade: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  studentFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  remedialPlansIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  remedialPlansText: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressSummary: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalsSection: {
    marginBottom: 12,
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  needsSection: {
    marginBottom: 12,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  goalItem: {
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 11,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 3,
    fontWeight: '500',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalProgressText: {
    fontSize: 10,
    color: '#666',
    minWidth: 30,
    textAlign: 'center',
  },
  goalProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  needsList: {
    gap: 2,
  },
  needItem: {
    marginBottom: 2,
  },
  needText: {
    fontSize: 11,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  moreItemsText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
    writingDirection: 'rtl',
  },
});