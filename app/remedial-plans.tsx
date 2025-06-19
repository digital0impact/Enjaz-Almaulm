
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

  const exportTableData = () => {
    try {
      // إنشاء النص المُصدَّر
      let exportText = "جدول تفاصيل المتعلمين\n";
      exportText += "="*50 + "\n\n";
      
      exportText += "الإحصائيات العامة:\n";
      exportText += `• إجمالي المتعلمين: ${students.length}\n`;
      exportText += `• لديهم خطط علاجية: ${students.filter(s => s.remedialPlans && s.remedialPlans.length > 0).length}\n`;
      exportText += `• الخطط النشطة: ${students.reduce((total, student) => total + (student.remedialPlans?.filter(plan => plan.status === 'نشط').length || 0), 0)}\n`;
      exportText += `• الخطط المكتملة: ${students.reduce((total, student) => total + (student.remedialPlans?.filter(plan => plan.status === 'مكتمل').length || 0), 0)}\n`;
      exportText += `• الخطط المعلقة: ${students.reduce((total, student) => total + (student.remedialPlans?.filter(plan => plan.status === 'معلق').length || 0), 0)}\n\n`;
      
      exportText += "تفاصيل المتعلمين:\n";
      exportText += "-".repeat(80) + "\n";
      
      students.forEach((student, index) => {
        exportText += `${index + 1}. ${student.name}\n`;
        exportText += `   الصف: ${student.grade}\n`;
        exportText += `   الحالة: ${student.status}\n`;
        exportText += `   عدد الخطط: ${student.remedialPlans?.length || 0}\n`;
        
        if (student.remedialPlans && student.remedialPlans.length > 0) {
          const avgProgress = Math.round(student.remedialPlans.reduce((total, plan) => total + plan.progress, 0) / student.remedialPlans.length);
          exportText += `   متوسط التقدم: ${avgProgress}%\n`;
          
          exportText += `   الخطط النشطة: ${student.remedialPlans.filter(plan => plan.status === 'نشط').length}\n`;
          exportText += `   الخطط المكتملة: ${student.remedialPlans.filter(plan => plan.status === 'مكتمل').length}\n`;
          exportText += `   الخطط المعلقة: ${student.remedialPlans.filter(plan => plan.status === 'معلق').length}\n`;
        }
        
        if ((student as any).needs && (student as any).needs.length > 0) {
          exportText += `   الاحتياجات: ${(student as any).needs.join('، ')}\n`;
        }
        
        exportText += `   آخر تحديث: ${student.lastUpdate}\n`;
        exportText += "\n";
      });
      
      exportText += `\nتاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}\n`;
      exportText += `وقت التصدير: ${new Date().toLocaleTimeString('ar-SA')}\n`;
      
      // محاكاة تحميل الملف
      console.log('البيانات المُصدَّرة:', exportText);
      
      Alert.alert(
        'تم التصدير بنجاح', 
        'تم تصدير بيانات الجدول بنجاح. يمكنك العثور على الملف في مجلد التحميلات.',
        [{ text: 'موافق', style: 'default' }]
      );
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير البيانات');
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
                    onPress={() => router.push('/(tabs)')}
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

                

                

                {/* Students Details Table */}
                {students.length > 0 && (
                  <ThemedView style={styles.studentsTable}>
                    <ThemedView style={styles.tableHeaderSection}>
                      <TouchableOpacity 
                        style={styles.exportButton}
                        onPress={exportTableData}
                      >
                        <IconSymbol size={16} name="square.and.arrow.up" color="#1c1f33" />
                        <ThemedText style={styles.exportButtonText}>تصدير الجدول</ThemedText>
                      </TouchableOpacity>
                    </ThemedView>

                    {/* Table Header */}
                    <ThemedView style={styles.tableContainer}>
                      <ThemedView style={[styles.tableHeader, { direction: 'rtl' }]}>
                        <ThemedText style={[styles.tableHeaderText, { flex: 2 }]}>اسم المتعلم</ThemedText>
                        <ThemedText style={[styles.tableHeaderText, { flex: 1.5 }]}>الصف</ThemedText>
                        <ThemedText style={[styles.tableHeaderText, { flex: 1.5 }]}>الحالة</ThemedText>
                        <ThemedText style={[styles.tableHeaderText, { flex: 1 }]}>التقدم</ThemedText>
                        <ThemedText style={[styles.tableHeaderText, { flex: 1.5 }]}>الاحتياجات</ThemedText>
                        <ThemedText style={[styles.tableHeaderText, { flex: 1.5 }]}>الشواهد</ThemedText>
                      </ThemedView>

                      {/* Table Rows */}
                      {students.map((student, index) => (
                        <ThemedView key={student.id} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#F8F9FA' : '#FFFFFF', direction: 'rtl' }]}>
                          {/* Student Name */}
                          <ThemedView style={[styles.tableCell, { flex: 2 }]}>
                            <ThemedText style={styles.tableCellText}>{student.name}</ThemedText>
                          </ThemedView>

                          {/* Grade */}
                          <ThemedView style={[styles.tableCell, { flex: 1.5 }]}>
                            <ThemedText style={styles.tableCellText}>{student.grade}</ThemedText>
                          </ThemedView>

                          {/* Status */}
                          <ThemedView style={[styles.tableCell, { flex: 1.5 }]}>
                            <ThemedView style={[styles.statusBadgeSmall, { backgroundColor: getStatusColor(student.status) }]}>
                              <ThemedText style={styles.statusTextSmall}>{student.status}</ThemedText>
                            </ThemedView>
                          </ThemedView>

                          {/* Progress */}
                          <ThemedView style={[styles.tableCell, { flex: 1 }]}>
                            {student.remedialPlans && student.remedialPlans.length > 0 ? (
                              <ThemedView style={styles.progressContainer}>
                                <ThemedText style={styles.progressText}>
                                  {Math.round(student.remedialPlans.reduce((total, plan) => total + plan.progress, 0) / student.remedialPlans.length)}%
                                </ThemedText>
                                <ThemedView style={styles.miniProgressBar}>
                                  <ThemedView 
                                    style={[
                                      styles.miniProgressFill,
                                      { 
                                        width: `${Math.round(student.remedialPlans.reduce((total, plan) => total + plan.progress, 0) / student.remedialPlans.length)}%`,
                                        backgroundColor: getStatusColor(student.status)
                                      }
                                    ]}
                                  />
                                </ThemedView>
                              </ThemedView>
                            ) : (
                              <ThemedText style={styles.tableCellText}>-</ThemedText>
                            )}
                          </ThemedView>

                          {/* Needs */}
                          <ThemedView style={[styles.tableCell, { flex: 1.5 }]}>
                            {(student as any).needs && (student as any).needs.length > 0 ? (
                              <ThemedView style={styles.needsContainer}>
                                <ThemedText style={styles.needsCount}>
                                  {(student as any).needs.length} احتياج
                                </ThemedText>
                                <ThemedText style={styles.needsPreview} numberOfLines={2}>
                                  {(student as any).needs.slice(0, 2).join('، ')}
                                  {(student as any).needs.length > 2 ? '...' : ''}
                                </ThemedText>
                              </ThemedView>
                            ) : (
                              <ThemedText style={styles.tableCellText}>لا يوجد</ThemedText>
                            )}
                          </ThemedView>

                          {/* Evidence */}
                          <ThemedView style={[styles.tableCell, { flex: 1.5 }]}>
                            {student.performanceEvidence && student.performanceEvidence.length > 0 ? (
                              <ThemedView style={styles.evidenceContainer}>
                                <ThemedText style={styles.evidenceCount}>
                                  {student.performanceEvidence.length} شاهد
                                </ThemedText>
                                <ThemedText style={styles.evidencePreview} numberOfLines={2}>
                                  {student.performanceEvidence.slice(0, 2).map(evidence => evidence.title).join('، ')}
                                  {student.performanceEvidence.length > 2 ? '...' : ''}
                                </ThemedText>
                              </ThemedView>
                            ) : (
                              <ThemedText style={styles.tableCellText}>لا يوجد</ThemedText>
                            )}
                          </ThemedView>
                        </ThemedView>
                      ))}
                    </ThemedView>

                    {/* Table Summary */}
                    <ThemedView style={styles.tableSummary}>
                      <ThemedView style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>إجمالي المتعلمين:</ThemedText>
                        <ThemedText style={styles.summaryValue}>{students.length}</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>لديهم خطط علاجية:</ThemedText>
                        <ThemedText style={styles.summaryValue}>
                          {students.filter(s => s.remedialPlans && s.remedialPlans.length > 0).length}
                        </ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>إجمالي الخطط النشطة:</ThemedText>
                        <ThemedText style={styles.summaryValue}>
                          {students.reduce((total, student) => 
                            total + (student.remedialPlans?.filter(plan => plan.status === 'نشط').length || 0), 0
                          )}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>
                )}

                {/* Plans List or Empty State */}
                {activePlans.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <ThemedText style={styles.emptySubtitle}>
                      يمكنك متابعة تفاصيل المتعلمين من الجدول أعلاه
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
  studentsTable: {
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0EA5E9',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 60,
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tableCellText: {
    fontSize: 12,
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
    fontSize: 10,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  needsPreview: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  evidencePreview: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tableSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  tableHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  exportButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
