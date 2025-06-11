
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

interface Student {
  id: string;
  name: string;
  description: string;
  status: 'ضعف' | 'تفوق' | 'صعوبات تعلم' | 'يحتاج تطوير';
  goals: string[];
  goalProgress: number;
  needs: string[];
  hasEvidence: boolean;
}

export default function StudentTrackingScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    description: '',
    status: 'يحتاج تطوير' as Student['status'],
    goals: [''],
    needs: ['']
  });

  const addStudent = () => {
    if (newStudent.name.trim()) {
      const student: Student = {
        id: Date.now().toString(),
        name: newStudent.name,
        description: newStudent.description,
        status: newStudent.status,
        goals: newStudent.goals.filter(goal => goal.trim()),
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

  const handleDownloadEvidence = (studentName: string) => {
    Alert.alert(
      'تحميل الشواهد',
      `تحميل شواهد الطالب: ${studentName}\n\nسيتم تحميل:\n• الأعمال والمشاريع\n• التقييمات\n• الصور والفيديوهات\n• التقارير`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تحميل', onPress: () => Alert.alert('تم', 'تم بدء تحميل الشواهد') }
      ]
    );
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
                <ThemedText style={styles.input}>
                  {newStudent.name || 'أدخل اسم المتعلم...'}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>وصف المتعلم</ThemedText>
              <ThemedView style={[styles.inputContainer, styles.textArea]}>
                <ThemedText style={styles.input}>
                  {newStudent.description || 'أدخل وصف المتعلم...'}
                </ThemedText>
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
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.left" color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          تتبع حالة متعلم
        </ThemedText>
        <TouchableOpacity 
          onPress={() => setShowAddForm(true)} 
          style={styles.addButton}
        >
          <IconSymbol size={24} name="plus" color="#007AFF" />
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
              <ThemedView key={student.id} style={styles.studentCard}>
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
                      <ThemedView key={index} style={styles.goalItem}>
                        <IconSymbol size={16} name="target" color="#4CAF50" />
                        <ThemedText style={styles.goalText}>{goal}</ThemedText>
                      </ThemedView>
                    ))}
                    <ThemedView style={styles.progressBar}>
                      <ThemedView 
                        style={[
                          styles.progressFill, 
                          { width: `${student.goalProgress}%` }
                        ]} 
                      />
                    </ThemedView>
                    <ThemedText style={styles.progressText}>
                      مدى التحقق: {student.goalProgress}%
                    </ThemedText>
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

                  <TouchableOpacity 
                    style={styles.evidenceButton}
                    onPress={() => handleDownloadEvidence(student.name)}
                  >
                    <IconSymbol size={20} name="arrow.down.circle.fill" color="#007AFF" />
                    <ThemedText style={styles.evidenceText}>تحميل الشواهد</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  studentsList: {
    gap: 15,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  studentDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  studentDetails: {
    gap: 15,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  needText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
  },
  evidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  evidenceText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
  },
  input: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
