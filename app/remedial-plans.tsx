
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function RemedialPlansScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [activePlans, setActivePlans] = useState<(RemedialPlan & { studentName: string })[]>([]);

  useEffect(() => {
    loadStudentsWithPlans();
  }, []);

  const loadStudentsWithPlans = async () => {
    try {
      const stored = await AsyncStorage.getItem('students');
      if (stored) {
        const studentsData = JSON.parse(stored);
        setStudents(studentsData);

        // جمع جميع الخطط العلاجية مع أسماء الطلاب
        const allPlans: (RemedialPlan & { studentName: string })[] = [];
        studentsData.forEach((student: Student) => {
          if (student.remedialPlans) {
            student.remedialPlans.forEach((plan) => {
              allPlans.push({
                ...plan,
                studentName: student.name
              });
            });
          }
        });
        setActivePlans(allPlans);
      }
    } catch (error) {
      console.log('Error loading students with plans:', error);
    }
  };

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

  const addNewPlan = () => {
    if (students.length === 0) {
      Alert.alert('تنبيه', 'يجب إضافة متعلمين أولاً لإنشاء خطط علاجية لهم');
      return;
    }
    router.push('/add-remedial-plan');
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
                    <IconSymbol size={60} name="heart.text.square" color="#F44336" />
                  </ThemedView>

                  <ThemedText type="title" style={styles.title}>
                    إدارة الخطط العلاجية
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    متابعة وإدارة الخطط العلاجية للمتعلمين
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
                </ThemedView>

                

                

                {/* Students with Plans Details */}
                {students.filter(s => s.remedialPlans && s.remedialPlans.length > 0).length > 0 && (
                  <ThemedView style={styles.studentsWithPlans}>
                    <ThemedText style={styles.sectionTitle}>المتعلمون والخطط العلاجية</ThemedText>

                    {students.filter(s => s.remedialPlans && s.remedialPlans.length > 0).map((student) => (
                      <ThemedView key={student.id} style={styles.studentDetailCard}>
                        <ThemedView style={styles.studentDetailHeader}>
                          <ThemedView style={styles.studentInfo}>
                            <ThemedText style={styles.studentDetailName}>{student.name}</ThemedText>
                            <ThemedText style={styles.studentDetailGrade}>{student.grade}</ThemedText>
                          </ThemedView>
                          <ThemedView style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
                            <ThemedText style={styles.statusText}>{student.status}</ThemedText>
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.plansOverview}>
                          <ThemedView style={styles.plansSummaryRow}>
                            <ThemedView style={styles.plansSummaryItem}>
                              <IconSymbol size={16} name="play.circle.fill" color="#4CAF50" />
                              <ThemedText style={styles.plansSummaryText}>
                                {student.remedialPlans?.filter(plan => plan.status === 'نشط').length || 0} نشطة
                              </ThemedText>
                            </ThemedView>

                            <ThemedView style={styles.plansSummaryItem}>
                              <IconSymbol size={16} name="checkmark.circle.fill" color="#2196F3" />
                              <ThemedText style={styles.plansSummaryText}>
                                {student.remedialPlans?.filter(plan => plan.status === 'مكتمل').length || 0} مكتملة
                              </ThemedText>
                            </ThemedView>

                            <ThemedView style={styles.plansSummaryItem}>
                              <IconSymbol size={16} name="pause.circle.fill" color="#FF9800" />
                              <ThemedText style={styles.plansSummaryText}>
                                {student.remedialPlans?.filter(plan => plan.status === 'معلق').length || 0} معلقة
                              </ThemedText>
                            </ThemedView>
                          </ThemedView>

                          <ThemedView style={styles.overallProgress}>
                            <ThemedText style={styles.progressLabel}>
                              التقدم العام: {Math.round(student.remedialPlans?.reduce((total, plan) => total + plan.progress, 0) / (student.remedialPlans?.length || 1))}%
                            </ThemedText>
                            <ThemedView style={styles.progressBar}>
                              <ThemedView 
                                style={[
                                  styles.progressFill,
                                  { 
                                    width: `${Math.round(student.remedialPlans?.reduce((total, plan) => total + plan.progress, 0) / (student.remedialPlans?.length || 1))}%`,
                                    backgroundColor: getStatusColor(student.status)
                                  }
                                ]}
                              />
                            </ThemedView>
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>
                )}

                {/* Plans List or Empty State */}
                {activePlans.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <ThemedView style={styles.emptyIconContainer}>
                      <IconSymbol size={80} name="heart.text.square" color="#ccc" />
                    </ThemedView>
                    <ThemedText style={styles.emptyTitle}>لا توجد خطط علاجية</ThemedText>
                    <ThemedText style={styles.emptySubtitle}>
                      اضغط على "إضافة خطة علاجية جديدة" لبدء إنشاء الخطط
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.plansSection}>
                    <ThemedText style={styles.sectionTitle}>الخطط العلاجية</ThemedText>

                    {activePlans.map((plan) => (
                      <ThemedView key={plan.id} style={styles.planCard}>
                        <ThemedView style={styles.planHeader}>
                          <ThemedView style={styles.planIconWrapper}>
                            <IconSymbol 
                              size={24} 
                              name={getStatusIcon(plan.status)} 
                              color={getStatusColor(plan.status)} 
                            />
                          </ThemedView>
                          <ThemedView style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) }]}>
                            <ThemedText style={styles.statusText}>{plan.status}</ThemedText>
                          </ThemedView>
                        </ThemedView>

                        <ThemedText style={styles.planTitle}>{plan.title}</ThemedText>
                        <ThemedText style={styles.studentName}>المتعلم: {plan.studentName}</ThemedText>
                        <ThemedText style={styles.targetArea}>المجال المستهدف: {plan.targetArea}</ThemedText>
                        <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>

                        {/* Progress Bar */}
                        <ThemedView style={styles.progressSection}>
                          <ThemedView style={styles.progressInfo}>
                            <ThemedText style={styles.progressLabel}>
                              التقدم: {plan.progress}%
                            </ThemedText>
                          </ThemedView>
                          <ThemedView style={styles.progressBar}>
                            <ThemedView 
                              style={[
                                styles.progressFill,
                                { 
                                  width: `${plan.progress}%`,
                                  backgroundColor: getStatusColor(plan.status)
                                }
                              ]}
                            />
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.planFooter}>
                          <ThemedText style={styles.planDates}>
                            من {plan.startDate} إلى {plan.endDate}
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        </ExpoLinearGradient>
      </ImageBackground>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
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
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    color: '#000000',
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
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
    borderColor: '#F44336',
  },
  buttonText: {
    color: '#F44336',
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
});
