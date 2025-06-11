
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Student {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  academicLevel: string;
  behaviorLevel: string;
  attendanceRate: number;
  notes: string;
  lastUpdated: string;
  parentContact: string;
  subjects: {
    [key: string]: {
      grade: number;
      notes: string;
    };
  };
}

export default function StudentTrackingScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchText, setSearchText] = useState('');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    studentId: '',
    grade: '',
    academicLevel: 'جيد',
    behaviorLevel: 'ممتاز',
    attendanceRate: 95,
    notes: '',
    parentContact: '',
    subjects: {}
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const storedStudents = await AsyncStorage.getItem('studentTracking');
      if (storedStudents) {
        setStudents(JSON.parse(storedStudents));
      } else {
        // بيانات تجريبية
        const sampleStudents: Student[] = [
          {
            id: '1',
            name: 'أحمد محمد علي',
            studentId: '2024001',
            grade: 'الصف الأول الثانوي',
            academicLevel: 'ممتاز',
            behaviorLevel: 'ممتاز',
            attendanceRate: 98,
            notes: 'طالب متميز ومشارك في الأنشطة',
            lastUpdated: new Date().toISOString(),
            parentContact: '+966501234567',
            subjects: {
              'الرياضيات': { grade: 95, notes: 'أداء ممتاز' },
              'الفيزياء': { grade: 92, notes: 'جيد جداً' }
            }
          },
          {
            id: '2',
            name: 'فاطمة عبدالله',
            studentId: '2024002',
            grade: 'الصف الثاني الثانوي',
            academicLevel: 'جيد جداً',
            behaviorLevel: 'جيد',
            attendanceRate: 89,
            notes: 'تحتاج لمتابعة في الحضور',
            lastUpdated: new Date().toISOString(),
            parentContact: '+966509876543',
            subjects: {
              'الرياضيات': { grade: 87, notes: 'جيد جداً' },
              'الكيمياء': { grade: 84, notes: 'جيد' }
            }
          }
        ];
        setStudents(sampleStudents);
        await AsyncStorage.setItem('studentTracking', JSON.stringify(sampleStudents));
      }
    } catch (error) {
      console.log('Error loading students:', error);
    }
  };

  const saveStudents = async (updatedStudents: Student[]) => {
    try {
      await AsyncStorage.setItem('studentTracking', JSON.stringify(updatedStudents));
      setStudents(updatedStudents);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.studentId || !newStudent.grade) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const student: Student = {
      id: Date.now().toString(),
      name: newStudent.name!,
      studentId: newStudent.studentId!,
      grade: newStudent.grade!,
      academicLevel: newStudent.academicLevel!,
      behaviorLevel: newStudent.behaviorLevel!,
      attendanceRate: newStudent.attendanceRate!,
      notes: newStudent.notes!,
      parentContact: newStudent.parentContact!,
      subjects: newStudent.subjects!,
      lastUpdated: new Date().toISOString()
    };

    const updatedStudents = [...students, student];
    await saveStudents(updatedStudents);
    setIsAddingStudent(false);
    setNewStudent({
      name: '',
      studentId: '',
      grade: '',
      academicLevel: 'جيد',
      behaviorLevel: 'ممتاز',
      attendanceRate: 95,
      notes: '',
      parentContact: '',
      subjects: {}
    });
    Alert.alert('تم الحفظ', 'تم إضافة الطالب بنجاح');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ممتاز': return '#4CAF50';
      case 'جيد جداً': return '#8BC34A';
      case 'جيد': return '#FF9800';
      case 'مقبول': return '#FFC107';
      case 'ضعيف': return '#F44336';
      default: return '#666';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return '#4CAF50';
    if (rate >= 85) return '#8BC34A';
    if (rate >= 75) return '#FF9800';
    if (rate >= 65) return '#FFC107';
    return '#F44336';
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.studentId.includes(searchText)
  );

  const renderStudentCard = (student: Student) => (
    <TouchableOpacity
      key={student.id}
      style={styles.studentCard}
      onPress={() => setSelectedStudent(student)}
    >
      <ThemedView style={styles.studentHeader}>
        <ThemedView style={styles.studentInfo}>
          <ThemedText style={styles.studentName}>{student.name}</ThemedText>
          <ThemedText style={styles.studentId}>رقم الطالب: {student.studentId}</ThemedText>
          <ThemedText style={styles.studentGrade}>{student.grade}</ThemedText>
        </ThemedView>
        <IconSymbol size={24} name="chevron.left" color="#666" />
      </ThemedView>

      <ThemedView style={styles.studentStats}>
        <ThemedView style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: getLevelColor(student.academicLevel) }]}>
            {student.academicLevel}
          </ThemedText>
          <ThemedText style={styles.statLabel}>المستوى الأكاديمي</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: getLevelColor(student.behaviorLevel) }]}>
            {student.behaviorLevel}
          </ThemedText>
          <ThemedText style={styles.statLabel}>السلوك</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: getAttendanceColor(student.attendanceRate) }]}>
            {student.attendanceRate}%
          </ThemedText>
          <ThemedText style={styles.statLabel}>الحضور</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  const renderStudentDetails = () => {
    if (!selectedStudent) return null;

    return (
      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedStudent(null)}>
              <IconSymbol size={24} name="xmark" color="#007AFF" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.modalTitle}>
              تفاصيل الطالب
            </ThemedText>
            <TouchableOpacity>
              <IconSymbol size={24} name="pencil" color="#007AFF" />
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.modalContent}>
            <ThemedView style={styles.detailSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                المعلومات الأساسية
              </ThemedText>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>الاسم:</ThemedText>
                <ThemedText style={styles.detailValue}>{selectedStudent.name}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>رقم الطالب:</ThemedText>
                <ThemedText style={styles.detailValue}>{selectedStudent.studentId}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>الصف:</ThemedText>
                <ThemedText style={styles.detailValue}>{selectedStudent.grade}</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>رقم ولي الأمر:</ThemedText>
                <ThemedText style={styles.detailValue}>{selectedStudent.parentContact}</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.detailSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                الأداء الأكاديمي
              </ThemedText>
              
              <ThemedView style={styles.performanceGrid}>
                <ThemedView style={[styles.performanceCard, { backgroundColor: getLevelColor(selectedStudent.academicLevel) + '20' }]}>
                  <IconSymbol size={32} name="graduationcap.fill" color={getLevelColor(selectedStudent.academicLevel)} />
                  <ThemedText style={[styles.performanceValue, { color: getLevelColor(selectedStudent.academicLevel) }]}>
                    {selectedStudent.academicLevel}
                  </ThemedText>
                  <ThemedText style={styles.performanceLabel}>المستوى الأكاديمي</ThemedText>
                </ThemedView>

                <ThemedView style={[styles.performanceCard, { backgroundColor: getLevelColor(selectedStudent.behaviorLevel) + '20' }]}>
                  <IconSymbol size={32} name="heart.fill" color={getLevelColor(selectedStudent.behaviorLevel)} />
                  <ThemedText style={[styles.performanceValue, { color: getLevelColor(selectedStudent.behaviorLevel) }]}>
                    {selectedStudent.behaviorLevel}
                  </ThemedText>
                  <ThemedText style={styles.performanceLabel}>السلوك</ThemedText>
                </ThemedView>

                <ThemedView style={[styles.performanceCard, { backgroundColor: getAttendanceColor(selectedStudent.attendanceRate) + '20' }]}>
                  <IconSymbol size={32} name="checkmark.circle.fill" color={getAttendanceColor(selectedStudent.attendanceRate)} />
                  <ThemedText style={[styles.performanceValue, { color: getAttendanceColor(selectedStudent.attendanceRate) }]}>
                    {selectedStudent.attendanceRate}%
                  </ThemedText>
                  <ThemedText style={styles.performanceLabel}>الحضور</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {Object.keys(selectedStudent.subjects).length > 0 && (
              <ThemedView style={styles.detailSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  درجات المواد
                </ThemedText>
                
                {Object.entries(selectedStudent.subjects).map(([subject, data]) => (
                  <ThemedView key={subject} style={styles.subjectRow}>
                    <ThemedText style={styles.subjectName}>{subject}</ThemedText>
                    <ThemedText style={[styles.subjectGrade, { color: data.grade >= 90 ? '#4CAF50' : data.grade >= 80 ? '#FF9800' : '#F44336' }]}>
                      {data.grade}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}

            {selectedStudent.notes && (
              <ThemedView style={styles.detailSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  الملاحظات
                </ThemedText>
                <ThemedText style={styles.notesText}>{selectedStudent.notes}</ThemedText>
              </ThemedView>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#fff" />
        </TouchableOpacity>
        <ThemedView style={styles.headerContent}>
          <IconSymbol size={50} name="person.crop.circle.fill" color="#fff" />
          <ThemedText type="title" style={styles.headerTitle}>
            متابعة حالة المتعلمين
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            متابعة وتقييم أداء الطلاب الأكاديمي والسلوكي
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.searchSection}>
          <ThemedView style={styles.searchContainer}>
            <IconSymbol size={20} name="magnifyingglass" color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="البحث عن طالب بالاسم أو الرقم..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </ThemedView>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsAddingStudent(true)}
          >
            <IconSymbol size={20} name="plus" color="#fff" />
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statCard}>
            <IconSymbol size={28} name="person.3.fill" color="#4CAF50" />
            <ThemedText style={styles.statNumber}>{students.length}</ThemedText>
            <ThemedText style={styles.statLabel}>إجمالي الطلاب</ThemedText>
          </ThemedView>

          <ThemedView style={styles.statCard}>
            <IconSymbol size={28} name="star.fill" color="#FF9800" />
            <ThemedText style={styles.statNumber}>
              {students.filter(s => s.academicLevel === 'ممتاز').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>المتميزون</ThemedText>
          </ThemedView>

          <ThemedView style={styles.statCard}>
            <IconSymbol size={28} name="exclamationmark.triangle.fill" color="#F44336" />
            <ThemedText style={styles.statNumber}>
              {students.filter(s => s.attendanceRate < 85).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>يحتاجون متابعة</ThemedText>
          </ThemedView>
        </ThemedView>

        <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
          {filteredStudents.map(renderStudentCard)}
        </ScrollView>
      </ThemedView>

      {renderStudentDetails()}

      <Modal
        visible={isAddingStudent}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAddingStudent(false)}>
              <IconSymbol size={24} name="xmark" color="#007AFF" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.modalTitle}>
              إضافة طالب جديد
            </ThemedText>
            <TouchableOpacity onPress={addStudent}>
              <IconSymbol size={24} name="checkmark" color="#007AFF" />
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.modalContent}>
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>اسم الطالب *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newStudent.name}
                onChangeText={(text) => setNewStudent({...newStudent, name: text})}
                placeholder="أدخل اسم الطالب"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>رقم الطالب *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newStudent.studentId}
                onChangeText={(text) => setNewStudent({...newStudent, studentId: text})}
                placeholder="أدخل رقم الطالب"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>الصف *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newStudent.grade}
                onChangeText={(text) => setNewStudent({...newStudent, grade: text})}
                placeholder="أدخل الصف الدراسي"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>رقم ولي الأمر</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newStudent.parentContact}
                onChangeText={(text) => setNewStudent({...newStudent, parentContact: text})}
                placeholder="أدخل رقم هاتف ولي الأمر"
                keyboardType="phone-pad"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>الملاحظات</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newStudent.notes}
                onChangeText={(text) => setNewStudent({...newStudent, notes: text})}
                placeholder="أدخل ملاحظات عن الطالب"
                multiline
                numberOfLines={4}
              />
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#E91E63',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addButton: {
    backgroundColor: '#E91E63',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  studentsList: {
    flex: 1,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  studentGrade: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  performanceCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subjectGrade: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
