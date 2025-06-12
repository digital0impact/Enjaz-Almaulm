import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedHeader } from '@/components/ThemedHeader';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemedButton } from '@/components/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useThemedStyles, useGlobalTheme } from '@/hooks/useGlobalTheme';

interface Student {
  id: string;
  name: string;
  description: string;
  status: 'ضعف' | 'تفوق' | 'صعوبات تعلم' | 'يحتاج تطوير';
  goals: string[];
  goalCompletion?: boolean[];
  goalProgress: number;
  needs: string[];
  hasEvidence: boolean;
}

export default function StudentTrackingScreen() {
  const router = useRouter();
  const styles = useThemedStyles();
  const { colors } = useGlobalTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    description: '',
    status: 'يحتاج تطوير' as Student['status'],
    goals: [''],
    needs: ['']
  });

  const toggleGoalCompletion = (studentId: string, goalIndex: number) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        const newCompletion = [...(student.goalCompletion || [])];
        newCompletion[goalIndex] = !newCompletion[goalIndex];
        return { ...student, goalCompletion: newCompletion };
      }
      return student;
    }));
  };

  const addStudent = () => {
    if (newStudent.name.trim()) {
      const student: Student = {
        id: Date.now().toString(),
        name: newStudent.name,
        description: newStudent.description,
        status: newStudent.status,
        goals: newStudent.goals.filter(goal => goal.trim()),
        goalCompletion: newStudent.goals.filter(goal => goal.trim()).map(() => false),
        goalProgress: 0,
        needs: newStudent.needs.filter(need => need.trim()),
        hasEvidence: false
      };
      setStudents([...students, student]);
      setNewStudent({
        name: '',
        description: '',
        status: 'يحتاج تطوير',
        goals: [''],
        needs: ['']
      });
      setShowAddForm(false);
      Alert.alert('تم بنجاح', 'تم إضافة المتعلم بنجاح');
    } else {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المتعلم');
    }
  };

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'تفوق': return '#4CAF50';
      case 'ضعف': return '#F44336';
      case 'صعوبات تعلم': return '#FF9800';
      case 'يحتاج تطوير': return '#2196F3';
      default: return '#757575';
    }
  };



  if (showAddForm) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowAddForm(false)}
          >
            <IconSymbol size={24} name="chevron.left" color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            إضافة متعلم جديد
          </ThemedText>
        </ThemedView>

        <ScrollView style={styles.content}>
          <ThemedView style={styles.formCard}>
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>اسم المتعلم *</ThemedText>
              <ThemedView style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={newStudent.name}
                  onChangeText={(text) => setNewStudent({ ...newStudent, name: text })}
                  placeholder="أدخل اسم المتعلم..."
                  placeholderTextColor="#999"
                  textAlign="right"
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>صف المتعلم</ThemedText>
              <ThemedView style={[styles.inputContainer, styles.textArea]}>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={newStudent.description}
                  onChangeText={(text) => setNewStudent({ ...newStudent, description: text })}
                  placeholder="أدخل صف المتعلم..."
                  placeholderTextColor="#999"
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>حالة المتعلم</ThemedText>
              <ThemedView style={styles.statusOptions}>
                {(['ضعف', 'تفوق', 'صعوبات تعلم', 'يحتاج تطوير'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      { backgroundColor: getStatusColor(status) + '20' },
                      newStudent.status === status && { backgroundColor: getStatusColor(status) }
                    ]}
                    onPress={() => setNewStudent({ ...newStudent, status })}
                  >
                    <ThemedText style={[
                      styles.statusText,
                      newStudent.status === status && { color: 'white' }
                    ]}>
                      {status}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>الأهداف الخاصة بالتطوير</ThemedText>
              {newStudent.goals.map((goal, index) => (
                <ThemedView key={index} style={styles.dynamicInputRow}>
                  <TextInput
                    style={styles.dynamicInput}
                    value={goal}
                    onChangeText={(text) => {
                      const updatedGoals = [...newStudent.goals];
                      updatedGoals[index] = text;
                      setNewStudent({ ...newStudent, goals: updatedGoals });
                    }}
                    placeholder={`الهدف ${index + 1}...`}
                    placeholderTextColor="#999"
                    textAlign="right"
                  />
                  {newStudent.goals.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => {
                        const updatedGoals = newStudent.goals.filter((_, i) => i !== index);
                        setNewStudent({ ...newStudent, goals: updatedGoals });
                      }}
                    >
                      <IconSymbol size={18} name="minus.circle.fill" color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </ThemedView>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setNewStudent({ ...newStudent, goals: [...newStudent.goals, ''] })}
              >
                <IconSymbol size={18} name="plus.circle.fill" color="#007AFF" />
                <ThemedText style={styles.addButtonText}>إضافة هدف جديد</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>الاحتياجات</ThemedText>
              {newStudent.needs.map((need, index) => (
                <ThemedView key={index} style={styles.dynamicInputRow}>
                  <TextInput
                    style={styles.dynamicInput}
                    value={need}
                    onChangeText={(text) => {
                      const updatedNeeds = [...newStudent.needs];
                      updatedNeeds[index] = text;
                      setNewStudent({ ...newStudent, needs: updatedNeeds });
                    }}
                    placeholder={`الاحتياج ${index + 1}...`}
                    placeholderTextColor="#999"
                    textAlign="right"
                  />
                  {newStudent.needs.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => {
                        const updatedNeeds = newStudent.needs.filter((_, i) => i !== index);
                        setNewStudent({ ...newStudent, needs: updatedNeeds });
                      }}
                    >
                      <IconSymbol size={18} name="minus.circle.fill" color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </ThemedView>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setNewStudent({ ...newStudent, needs: [...newStudent.needs, ''] })}
              >
                <IconSymbol size={18} name="plus.circle.fill" color="#007AFF" />
                <ThemedText style={styles.addButtonText}>إضافة احتياج جديد</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>حفظ الشواهد</ThemedText>
              <TouchableOpacity 
                style={styles.evidenceUploadButton}
                onPress={() => Alert.alert('حفظ الشواهد', 'سيتم إضافة ميزة رفع الشواهد قريباً')}
              >
                <IconSymbol size={20} name="cloud.upload.fill" color="#007AFF" />
                <ThemedText style={styles.evidenceUploadText}>رفع الشواهد والمستندات</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.evidenceNote}>
                يمكنك رفع الصور، الفيديوهات، والمستندات المتعلقة بالمتعلم
              </ThemedText>
            </ThemedView>
</ThemedView>
            <TouchableOpacity style={styles.saveButton} onPress={addStudent}>
              <IconSymbol size={24} name="checkmark.circle.fill" color="white" />
              <ThemedText style={styles.saveButtonText}>حفظ المتعلم</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* الهيدر الموحد */}
      <ThemedHeader 
        title="تتبع حالة متعلم"
        rightButton={{
          icon: "plus",
          onPress: addStudent
        }}
      />

      {/* شريط الأدوات المتقدم */}
      <ThemedView style={styles.toolbar}>
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => Alert.alert('البحث', 'سيتم فتح أداة البحث في المتعلمين')}
        >
          <IconSymbol size={20} name="magnifyingglass" color="#007AFF" />
          <ThemedText style={styles.toolButtonText}>بحث</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => Alert.alert('التصفية', 'تصفية المتعلمين حسب:\n• الحالة\n• التقدم\n• الأهداف المكتملة')}
        >
          <IconSymbol size={20} name="line.3.horizontal.decrease.circle" color="#FF9800" />
          <ThemedText style={styles.toolButtonText}>تصفية</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => Alert.alert('التصدير', 'تصدير البيانات بصيغة:\n• PDF\n• Excel\n• CSV')}
        >
          <IconSymbol size={20} name="square.and.arrow.up" color="#4CAF50" />
          <ThemedText style={styles.toolButtonText}>تصدير</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => Alert.alert('الإحصائيات', 'عرض إحصائيات شاملة:\n• عدد المتعلمين حسب الحالة\n• معدل التقدم\n• الأهداف المكتملة')}
        >
          <IconSymbol size={20} name="chart.bar.fill" color="#9C27B0" />
          <ThemedText style={styles.toolButtonText}>إحصائيات</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => Alert.alert('الإعدادات', 'إعدادات تتبع المتعلمين:\n• إعدادات التنبيهات\n• قوالب الأهداف\n• إعدادات التصدير')}
        >
          <IconSymbol size={20} name="gearshape.fill" color="#666" />
          <ThemedText style={styles.toolButtonText}>إعدادات</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        {students.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol size={60} name="person.crop.circle.badge.plus" color="#ccc" />
            <ThemedText style={styles.emptyTitle}>لا توجد بيانات متعلمين</ThemedText>
            <ThemedText style={styles.emptySubtitle}>اضغط على + لإضافة متعلم جديد</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.studentsList}>
            {students.map((student) => (
              <ThemedCard key={student.id} style={styles.studentCard}>
                <ThemedView style={styles.studentHeader}>
                  <ThemedView style={styles.studentInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.studentName}>
                      {student.name}
                    </ThemedText>
                    <ThemedText style={styles.studentDescription}>
                      {student.description}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView 
                    style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(student.status) }
                    ]}
                  >
                    <ThemedText style={styles.statusBadgeText}>{student.status}</ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.studentDetails}>
                  <ThemedView style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>الأهداف الخاصة بالتطوير:</ThemedText>
                    {student.goals.map((goal, index) => (
                      <ThemedView key={index} style={styles.goalItemVertical}>
                        <TouchableOpacity 
                          style={styles.goalCheckbox}
                          onPress={() => toggleGoalCompletion(student.id, index)}
                        >
                          <IconSymbol 
                            size={20} 
                            name={student.goalCompletion?.[index] ? "checkmark.circle.fill" : "circle"} 
                            color={student.goalCompletion?.[index] ? "#4CAF50" : "#666"} 
                          />
                        </TouchableOpacity>
                        <ThemedText style={[
                          styles.goalTextVertical,
                          student.goalCompletion?.[index] && styles.completedGoal
                        ]}>
                          {goal}
                        </ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  <ThemedView style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>الاحتياجات:</ThemedText>
                    {student.needs.map((need, index) => (
                      <ThemedView key={index} style={styles.needItem}>
                        <IconSymbol size={16} name="hand.raised.fill" color="#FF9800" />
                        <ThemedText style={styles.needText}>{need}</ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>
                </ThemedView>
              </ThemedCard>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// استخدام الأنماط الموحدة من useThemedStyles