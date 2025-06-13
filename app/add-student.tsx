
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
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
  status: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
  lastUpdate: string;
  notes: string;
  goals: Goal[];
  needs: string[];
  performanceEvidence: PerformanceEvidence[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number; // 0-100
  status: 'محقق' | 'قيد التنفيذ' | 'لم يبدأ';
}

interface PerformanceEvidence {
  id: string;
  type: 'اختبار' | 'مشروع' | 'واجب' | 'مشاركة' | 'سلوك';
  title: string;
  score: number;
  date: string;
  notes: string;
}

export default function AddStudentScreen() {
  const router = useRouter();
  const [studentData, setStudentData] = useState({
    name: '',
    grade: '',
    status: 'جيد' as Student['status'],
    notes: '',
    goals: [] as Goal[],
    needs: [] as string[],
    performanceEvidence: [] as PerformanceEvidence[]
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    progress: 0,
    status: 'لم يبدأ' as Goal['status']
  });

  const [newNeed, setNewNeed] = useState('');
  const [newEvidence, setNewEvidence] = useState({
    type: 'اختبار' as PerformanceEvidence['type'],
    title: '',
    score: 0,
    date: '',
    notes: ''
  });

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  const statusOptions = [
    { value: 'ممتاز', label: 'متفوق', color: '#4CAF50', icon: 'star.fill' },
    { value: 'جيد جداً', label: 'جيد جداً', color: '#8BC34A', icon: 'star.circle.fill' },
    { value: 'جيد', label: 'جيد', color: '#FF9800', icon: 'star.circle' },
    { value: 'مقبول', label: 'يحتاج إلى تطوير', color: '#FF5722', icon: 'star' },
    { value: 'ضعيف', label: 'صعوبات تعلم', color: '#F44336', icon: 'exclamationmark.triangle.fill' }
  ];

  const evidenceTypes = [
    { value: 'اختبار', label: 'اختبار', icon: 'doc.text' },
    { value: 'مشروع', label: 'مشروع', icon: 'folder' },
    { value: 'واجب', label: 'واجب', icon: 'pencil' },
    { value: 'مشاركة', label: 'مشاركة', icon: 'hand.raised' },
    { value: 'سلوك', label: 'سلوك', icon: 'person.circle' }
  ];

  const addGoal = () => {
    if (!newGoal.title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الهدف');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
    };

    setStudentData(prev => ({
      ...prev,
      goals: [...prev.goals, goal]
    }));

    setNewGoal({
      title: '',
      description: '',
      targetDate: '',
      progress: 0,
      status: 'لم يبدأ'
    });

    setShowGoalForm(false);
  };

  const addNeed = () => {
    if (!newNeed.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاحتياج');
      return;
    }

    setStudentData(prev => ({
      ...prev,
      needs: [...prev.needs, newNeed.trim()]
    }));

    setNewNeed('');
  };

  const addEvidence = () => {
    if (!newEvidence.title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الشاهد');
      return;
    }

    const evidence: PerformanceEvidence = {
      id: Date.now().toString(),
      ...newEvidence,
      title: newEvidence.title.trim(),
      notes: newEvidence.notes.trim(),
      date: newEvidence.date || new Date().toLocaleDateString('ar-SA')
    };

    setStudentData(prev => ({
      ...prev,
      performanceEvidence: [...prev.performanceEvidence, evidence]
    }));

    setNewEvidence({
      type: 'اختبار',
      title: '',
      score: 0,
      date: '',
      notes: ''
    });

    setShowEvidenceForm(false);
  };

  const removeGoal = (goalId: string) => {
    setStudentData(prev => ({
      ...prev,
      goals: prev.goals.filter(goal => goal.id !== goalId)
    }));
  };

  const removeNeed = (needIndex: number) => {
    setStudentData(prev => ({
      ...prev,
      needs: prev.needs.filter((_, index) => index !== needIndex)
    }));
  };

  const removeEvidence = (evidenceId: string) => {
    setStudentData(prev => ({
      ...prev,
      performanceEvidence: prev.performanceEvidence.filter(evidence => evidence.id !== evidenceId)
    }));
  };

  const saveStudent = async () => {
    if (!studentData.name.trim() || !studentData.grade.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const existingStudents = await AsyncStorage.getItem('students');
      const students = existingStudents ? JSON.parse(existingStudents) : [];

      const newStudent: Student = {
        id: Date.now().toString(),
        name: studentData.name.trim(),
        grade: studentData.grade.trim(),
        status: studentData.status,
        lastUpdate: new Date().toLocaleDateString('ar-SA'),
        notes: studentData.notes.trim(),
        goals: studentData.goals,
        needs: studentData.needs,
        performanceEvidence: studentData.performanceEvidence
      };

      students.push(newStudent);
      await AsyncStorage.setItem('students', JSON.stringify(students));

      Alert.alert('نجح', 'تم إضافة المتعلم بنجاح', [
        { text: 'موافق', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
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
            <ScrollView style={styles.scrollContainer}>
              <ThemedView style={styles.content}>
                {/* Header */}
                <ThemedView style={styles.header}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <IconSymbol size={24} name="chevron.right" color="#1c1f33" />
                  </TouchableOpacity>
                  
                  <ThemedView style={styles.iconContainer}>
                    <IconSymbol size={60} name="person.crop.circle.badge.plus" color="#1c1f33" />
                  </ThemedView>
                  
                  <ThemedText type="title" style={styles.title}>
                    إضافة متعلم جديد
                  </ThemedText>
                  <ThemedText style={styles.subtitle}>
                    إدخال بيانات المتعلم الشاملة
                  </ThemedText>
                </ThemedView>

                {/* Form */}
                <ThemedView style={styles.formContainer}>
                  {/* البيانات الأساسية */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>البيانات الأساسية</ThemedText>
                    
                    <ThemedView style={styles.inputGroup}>
                      <ThemedText style={styles.label}>اسم المتعلم *</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={studentData.name}
                        onChangeText={(text) => setStudentData({...studentData, name: text})}
                        placeholder="أدخل اسم المتعلم"
                        textAlign="right"
                      />
                    </ThemedView>

                    <ThemedView style={styles.inputGroup}>
                      <ThemedText style={styles.label}>الصف الدراسي *</ThemedText>
                      <TextInput
                        style={styles.textInput}
                        value={studentData.grade}
                        onChangeText={(text) => setStudentData({...studentData, grade: text})}
                        placeholder="أدخل الصف الدراسي"
                        textAlign="right"
                      />
                    </ThemedView>

                    <ThemedView style={styles.inputGroup}>
                      <ThemedText style={styles.label}>حالة المتعلم</ThemedText>
                      <ThemedView style={styles.statusGrid}>
                        {statusOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.statusOption,
                              { backgroundColor: option.color },
                              studentData.status === option.value && styles.selectedStatus
                            ]}
                            onPress={() => setStudentData({...studentData, status: option.value as Student['status']})}
                          >
                            <IconSymbol size={24} name={option.icon} color="#fff" />
                            <ThemedText style={styles.statusText}>{option.label}</ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>

                  {/* الأهداف */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedView style={styles.sectionHeader}>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setShowGoalForm(true)}
                      >
                        <IconSymbol size={16} name="plus.circle.fill" color="#1c1f33" />
                        <ThemedText style={styles.addButtonText}>إضافة هدف</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.sectionTitle}>الأهداف التعليمية</ThemedText>
                    </ThemedView>

                    {showGoalForm && (
                      <ThemedView style={styles.formCard}>
                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>عنوان الهدف</ThemedText>
                          <TextInput
                            style={styles.textInput}
                            value={newGoal.title}
                            onChangeText={(text) => setNewGoal({...newGoal, title: text})}
                            placeholder="أدخل عنوان الهدف"
                            textAlign="right"
                          />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>وصف الهدف</ThemedText>
                          <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={newGoal.description}
                            onChangeText={(text) => setNewGoal({...newGoal, description: text})}
                            placeholder="وصف تفصيلي للهدف"
                            textAlign="right"
                            multiline
                            numberOfLines={3}
                          />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>نسبة التحقق (%)</ThemedText>
                          <TextInput
                            style={styles.textInput}
                            value={newGoal.progress.toString()}
                            onChangeText={(text) => setNewGoal({...newGoal, progress: parseInt(text) || 0})}
                            placeholder="0-100"
                            keyboardType="numeric"
                            textAlign="right"
                          />
                        </ThemedView>

                        <ThemedView style={styles.buttonRow}>
                          <TouchableOpacity style={styles.saveSmallButton} onPress={addGoal}>
                            <ThemedText style={styles.saveSmallButtonText}>حفظ</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.cancelSmallButton} 
                            onPress={() => setShowGoalForm(false)}
                          >
                            <ThemedText style={styles.cancelSmallButtonText}>إلغاء</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    )}

                    {studentData.goals.map((goal) => (
                      <ThemedView key={goal.id} style={styles.itemCard}>
                        <ThemedView style={styles.itemHeader}>
                          <TouchableOpacity onPress={() => removeGoal(goal.id)}>
                            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                          </TouchableOpacity>
                          <ThemedText style={styles.itemTitle}>{goal.title}</ThemedText>
                        </ThemedView>
                        <ThemedText style={styles.itemDescription}>{goal.description}</ThemedText>
                        <ThemedView style={styles.progressContainer}>
                          <ThemedText style={styles.progressText}>{goal.progress}%</ThemedText>
                          <ThemedView style={styles.progressBar}>
                            <ThemedView 
                              style={[styles.progressFill, { width: `${goal.progress}%` }]} 
                            />
                          </ThemedView>
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {/* احتياجات المتعلم */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>احتياجات المتعلم</ThemedText>
                    
                    <ThemedView style={styles.inputGroup}>
                      <ThemedView style={styles.inputWithButton}>
                        <TouchableOpacity style={styles.addSmallButton} onPress={addNeed}>
                          <IconSymbol size={16} name="plus" color="#1c1f33" />
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.textInput, { flex: 1 }]}
                          value={newNeed}
                          onChangeText={setNewNeed}
                          placeholder="أدخل احتياج المتعلم"
                          textAlign="right"
                        />
                      </ThemedView>
                    </ThemedView>

                    {studentData.needs.map((need, index) => (
                      <ThemedView key={index} style={styles.needItem}>
                        <TouchableOpacity onPress={() => removeNeed(index)}>
                          <IconSymbol size={18} name="xmark.circle.fill" color="#F44336" />
                        </TouchableOpacity>
                        <ThemedText style={styles.needText}>{need}</ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {/* شواهد الأداء */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedView style={styles.sectionHeader}>
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => setShowEvidenceForm(true)}
                      >
                        <IconSymbol size={16} name="plus.circle.fill" color="#1c1f33" />
                        <ThemedText style={styles.addButtonText}>إضافة شاهد</ThemedText>
                      </TouchableOpacity>
                      <ThemedText style={styles.sectionTitle}>شواهد الأداء</ThemedText>
                    </ThemedView>

                    {showEvidenceForm && (
                      <ThemedView style={styles.formCard}>
                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>نوع الشاهد</ThemedText>
                          <ThemedView style={styles.typeGrid}>
                            {evidenceTypes.map((type) => (
                              <TouchableOpacity
                                key={type.value}
                                style={[
                                  styles.typeOption,
                                  newEvidence.type === type.value && styles.selectedType
                                ]}
                                onPress={() => setNewEvidence({...newEvidence, type: type.value as PerformanceEvidence['type']})}
                              >
                                <IconSymbol size={16} name={type.icon} color="#1c1f33" />
                                <ThemedText style={styles.typeText}>{type.label}</ThemedText>
                              </TouchableOpacity>
                            ))}
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>عنوان الشاهد</ThemedText>
                          <TextInput
                            style={styles.textInput}
                            value={newEvidence.title}
                            onChangeText={(text) => setNewEvidence({...newEvidence, title: text})}
                            placeholder="أدخل عنوان الشاهد"
                            textAlign="right"
                          />
                        </ThemedView>

                        <ThemedView style={styles.inputGroup}>
                          <ThemedText style={styles.label}>الدرجة أو التقدير</ThemedText>
                          <TextInput
                            style={styles.textInput}
                            value={newEvidence.score.toString()}
                            onChangeText={(text) => setNewEvidence({...newEvidence, score: parseFloat(text) || 0})}
                            placeholder="الدرجة أو التقدير"
                            keyboardType="numeric"
                            textAlign="right"
                          />
                        </ThemedView>

                        <ThemedView style={styles.buttonRow}>
                          <TouchableOpacity style={styles.saveSmallButton} onPress={addEvidence}>
                            <ThemedText style={styles.saveSmallButtonText}>حفظ</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.cancelSmallButton} 
                            onPress={() => setShowEvidenceForm(false)}
                          >
                            <ThemedText style={styles.cancelSmallButtonText}>إلغاء</ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    )}

                    {studentData.performanceEvidence.map((evidence) => (
                      <ThemedView key={evidence.id} style={styles.evidenceCard}>
                        <ThemedView style={styles.itemHeader}>
                          <TouchableOpacity onPress={() => removeEvidence(evidence.id)}>
                            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
                          </TouchableOpacity>
                          <ThemedView style={styles.evidenceInfo}>
                            <ThemedText style={styles.itemTitle}>{evidence.title}</ThemedText>
                            <ThemedText style={styles.evidenceType}>{evidence.type}</ThemedText>
                          </ThemedView>
                        </ThemedView>
                        <ThemedView style={styles.evidenceScore}>
                          <ThemedText style={styles.scoreText}>الدرجة: {evidence.score}</ThemedText>
                          <ThemedText style={styles.dateText}>{evidence.date}</ThemedText>
                        </ThemedView>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {/* ملاحظات إضافية */}
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>ملاحظات إضافية</ThemedText>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={studentData.notes}
                      onChangeText={(text) => setStudentData({...studentData, notes: text})}
                      placeholder="أدخل أي ملاحظات إضافية"
                      textAlign="right"
                      multiline
                      numberOfLines={4}
                    />
                  </ThemedView>

                  {/* أزرار الحفظ والإلغاء */}
                  <ThemedView style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.saveButton} onPress={saveStudent}>
                      <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                      <ThemedText style={styles.saveButtonText}>حفظ البيانات</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                      <IconSymbol size={20} name="xmark.circle" color="#666" />
                      <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
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
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
  formContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionContainer: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1c1f33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 8,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStatus: {
    borderWidth: 3,
    borderColor: '#1c1f33',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 5,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  saveSmallButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveSmallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelSmallButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelSmallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addSmallButton: {
    backgroundColor: '#add4ce',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  needText: {
    flex: 1,
    fontSize: 14,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
  },
  selectedType: {
    backgroundColor: '#add4ce',
  },
  typeText: {
    fontSize: 12,
    color: '#1c1f33',
    fontWeight: '500',
  },
  evidenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceType: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
    backgroundColor: 'transparent',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
