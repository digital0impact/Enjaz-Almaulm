import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StudentData {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'ضعف' | 'صعوبات تعلم' | 'يحتاج إلى تطوير';
  subjects: { [key: string]: number };
  attendance: number;
  behavior: 'ممتاز' | 'جيد' | 'مقبول' | 'يحتاج تحسين';
  notes: string;
  parentContact: string;
  lastUpdate: string;
}

export default function StudentTrackingScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<StudentData>>({
    name: '',
    grade: '',
    status: 'تفوق',
    subjects: {},
    attendance: 100,
    behavior: 'ممتاز',
    notes: '',
    parentContact: ''
  });

  useEffect(() => {
    loadStudentsData();
  }, []);

  const loadStudentsData = async () => {
    try {
      // Clear all student data
      setStudents([]);
      await AsyncStorage.removeItem('studentsData');
    } catch (error) {
      console.error('Error clearing students data:', error);
    }
  };

  const saveStudentsData = async (studentsData: StudentData[]) => {
    try {
      await AsyncStorage.setItem('studentsData', JSON.stringify(studentsData));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error saving students data:', error);
    }
  };

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.grade) {
      Alert.alert('خطأ', 'يرجى ملء الحقول المطلوبة');
      return;
    }

    const studentData: StudentData = {
      id: Date.now().toString(),
      name: newStudent.name!,
      grade: newStudent.grade!,
      status: newStudent.status || 'تفوق',
      subjects: newStudent.subjects || {},
      attendance: newStudent.attendance || 100,
      behavior: newStudent.behavior || 'ممتاز',
      notes: newStudent.notes || '',
      parentContact: newStudent.parentContact || '',
      lastUpdate: new Date().toLocaleDateString('ar-SA')
    };

    const updatedStudents = [...students, studentData];
    await saveStudentsData(updatedStudents);
    setShowAddForm(false);
    setNewStudent({
      name: '',
      grade: '',
      status: 'تفوق',
      subjects: {},
      attendance: 100,
      behavior: 'ممتاز',
      notes: '',
      parentContact: ''
    });
    Alert.alert('نجح', 'تم إضافة الطالب بنجاح');
  };

  const deleteStudent = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الطالب؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updatedStudents = students.filter(student => student.id !== id);
            await saveStudentsData(updatedStudents);
            Alert.alert('تم', 'تم حذف الطالب');
          }
        }
      ]
    );
  };

  const getBehaviorColor = (behavior: string) => {
    switch (behavior) {
      case 'ممتاز': return '#4CAF50';
      case 'جيد': return '#2196F3';
      case 'مقبول': return '#FF9800';
      case 'يحتاج تحسين': return '#F44336';
      default: return '#666666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تفوق': return '#4CAF50';
      case 'ضعف': return '#F44336';
      case 'صعوبات تعلم': return '#FF9800';
      case 'يحتاج إلى تطوير': return '#2196F3';
      default: return '#666666';
    }
  };

  const getSubjectsDisplay = (subjects: { [key: string]: number }) => {
    return Object.entries(subjects).map(([subject, grade]) => (
      `${subject}: ${grade}%`
    )).join(' • ');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          متابعة حالة متعلم
        </ThemedText>
        <TouchableOpacity 
          onPress={() => setShowAddForm(true)} 
          style={styles.addButton}
        >
          <IconSymbol size={24} name="plus" color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showAddForm && (
          <ThemedView style={styles.addForm}>
            <ThemedText style={styles.formTitle}>إضافة طالب جديد</ThemedText>

            <TextInput
              style={styles.input}
              placeholder="اسم الطالب"
              value={newStudent.name}
              onChangeText={(text) => setNewStudent({...newStudent, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="الصف الدراسي"
              value={newStudent.grade}
              onChangeText={(text) => setNewStudent({...newStudent, grade: text})}
            />

            <ThemedView style={styles.pickerContainer}>
              <ThemedText style={styles.pickerLabel}>نوع الحالة:</ThemedText>
              <ThemedView style={styles.statusButtons}>
                {['تفوق', 'ضعف', 'صعوبات تعلم', 'يحتاج إلى تطوير'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      newStudent.status === status && styles.statusButtonActive,
                      { backgroundColor: newStudent.status === status ? getStatusColor(status) : '#F0F0F0' }
                    ]}
                    onPress={() => setNewStudent({...newStudent, status: status as any})}
                  >
                    <ThemedText style={[
                      styles.statusButtonText,
                      { color: newStudent.status === status ? '#FFFFFF' : '#333333' }
                    ]}>
                      {status}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            <TextInput
              style={styles.input}
              placeholder="رقم هاتف ولي الأمر"
              value={newStudent.parentContact}
              onChangeText={(text) => setNewStudent({...newStudent, parentContact: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="ملاحظات"
              value={newStudent.notes}
              onChangeText={(text) => setNewStudent({...newStudent, notes: text})}
              multiline
            />

            <ThemedView style={styles.formButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={addStudent}>
                <ThemedText style={styles.buttonText}>حفظ</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddForm(false)}
              >
                <ThemedText style={styles.buttonText}>إلغاء</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}

        {students.map((student) => (
          <ThemedView key={student.id} style={styles.studentCard}>
            <ThemedView style={styles.studentHeader}>
              <ThemedView style={{ flex: 1 }}>
                <ThemedText style={styles.studentName}>{student.name}</ThemedText>
                <ThemedText style={styles.studentGrade}>{student.grade}</ThemedText>
                <ThemedView style={styles.statusContainer}>
                  <ThemedText style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(student.status), color: '#FFFFFF' }
                  ]}>
                    {student.status}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <TouchableOpacity 
                onPress={() => deleteStudent(student.id)}
                style={styles.deleteButton}
              >
                <IconSymbol size={20} name="trash" color="#F44336" />
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.studentInfo}>
              <ThemedView style={styles.infoRow}>
                <IconSymbol size={16} name="book.fill" color="#4CAF50" />
                <ThemedText style={styles.infoLabel}>المواد الدراسية:</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoValue}>
                {Object.keys(student.subjects).length > 0 ? 
                  getSubjectsDisplay(student.subjects) : 
                  'لم يتم إضافة درجات بعد'
                }
              </ThemedText>

              <ThemedView style={styles.infoRow}>
                <IconSymbol size={16} name="calendar" color="#2196F3" />
                <ThemedText style={styles.infoLabel}>نسبة الحضور:</ThemedText>
                <ThemedText style={styles.infoValue}>{student.attendance}%</ThemedText>
              </ThemedView>

              <ThemedView style={styles.infoRow}>
                <IconSymbol size={16} name="star.fill" color={getBehaviorColor(student.behavior)} />
                <ThemedText style={styles.infoLabel}>السلوك:</ThemedText>
                <ThemedText style={[styles.infoValue, { color: getBehaviorColor(student.behavior) }]}>
                  {student.behavior}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.infoRow}>
                <IconSymbol size={16} name="phone.fill" color="#FF9800" />
                <ThemedText style={styles.infoLabel}>ولي الأمر:</ThemedText>
                <ThemedText style={styles.infoValue}>{student.parentContact}</ThemedText>
              </ThemedView>

              {student.notes && (
                <ThemedView style={styles.notesSection}>
                  <ThemedText style={styles.notesTitle}>ملاحظات:</ThemedText>
                  <ThemedText style={styles.notesText}>{student.notes}</ThemedText>
                </ThemedView>
              )}

              <ThemedText style={styles.lastUpdate}>
                آخر تحديث: {student.lastUpdate}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ))}

        {students.length === 0 && !showAddForm && (
          <ThemedView style={styles.emptyState}>
            <IconSymbol size={64} name="person.crop.circle.badge.plus" color="#CCCCCC" />
            <ThemedText style={styles.emptyText}>لا توجد بيانات طلاب</ThemedText>
            <ThemedText style={styles.emptySubtext}>اضغط على + لإضافة طالب جديد</ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    writingDirection: 'rtl',
  },
  addButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addForm: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#000000',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  studentCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  studentGrade: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 15,
  },
  studentInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoValue: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notesSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999999',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 5,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#000000',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 5,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
});