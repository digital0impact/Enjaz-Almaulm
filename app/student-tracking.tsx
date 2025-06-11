
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
  subjects: string;
  behavior: string;
  achievements: string;
  skillsLevel: number;
  suggestions: string;
  notes: string;
  lastUpdated: string;
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
    subjects: '',
    behavior: '',
    achievements: '',
    skillsLevel: 1,
    suggestions: '',
    notes: ''
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
            grade: 'الأول الثانوي',
            subjects: 'الرياضيات، الفيزياء، الكيمياء',
            behavior: 'ممتاز',
            achievements: 'حصل على المركز الأول في مسابقة الرياضيات',
            skillsLevel: 4,
            suggestions: 'يحتاج لتطوير مهارات التواصل',
            notes: 'طالب متميز ومجتهد',
            lastUpdated: new Date().toISOString()
          },
          {
            id: '2',
            name: 'فاطمة عبدالله',
            studentId: '2024002',
            grade: 'الثاني الثانوي',
            subjects: 'الأحياء، الكيمياء، الرياضيات',
            behavior: 'جيد جداً',
            achievements: 'مشاركة فعالة في النشاطات المدرسية',
            skillsLevel: 3,
            suggestions: 'تحتاج لمزيد من التركيز في الدروس',
            notes: 'طالبة مجتهدة تحب المشاركة',
            lastUpdated: new Date().toISOString()
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
      Alert.alert('خطأ', 'يرجى ملء الحقول المطلوبة');
      return;
    }

    const student: Student = {
      id: Date.now().toString(),
      name: newStudent.name!,
      studentId: newStudent.studentId!,
      grade: newStudent.grade!,
      subjects: newStudent.subjects!,
      behavior: newStudent.behavior!,
      achievements: newStudent.achievements!,
      skillsLevel: newStudent.skillsLevel!,
      suggestions: newStudent.suggestions!,
      notes: newStudent.notes!,
      lastUpdated: new Date().toISOString()
    };

    const updatedStudents = [...students, student];
    await saveStudents(updatedStudents);
    setIsAddingStudent(false);
    setNewStudent({
      name: '',
      studentId: '',
      grade: '',
      subjects: '',
      behavior: '',
      achievements: '',
      skillsLevel: 1,
      suggestions: '',
      notes: ''
    });
    Alert.alert('تم الحفظ', 'تم إضافة الطالب بنجاح');
  };

  const renderSkillsLevel = (level: number) => {
    return (
      <ThemedView style={styles.skillsContainer}>
        {[1, 2, 3, 4, 5].map((item) => (
          <ThemedView
            key={item}
            style={[
              styles.skillBox,
              item <= level ? styles.skillBoxFilled : styles.skillBoxEmpty
            ]}
          />
        ))}
      </ThemedView>
    );
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.studentId.includes(searchText)
  );

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
            متابعة حالة متعلم
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.searchSection}>
          <ThemedView style={styles.searchContainer}>
            <IconSymbol size={20} name="magnifyingglass" color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="البحث عن طالب..."
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

        <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.table}>
            {/* Table Header */}
            <ThemedView style={styles.tableHeader}>
              <ThemedText style={[styles.headerCell, styles.nameColumn]}>اسم المتعلم</ThemedText>
              <ThemedText style={[styles.headerCell, styles.gradeColumn]}>الصف</ThemedText>
              <ThemedText style={[styles.headerCell, styles.subjectsColumn]}>المواد</ThemedText>
              <ThemedText style={[styles.headerCell, styles.behaviorColumn]}>السلوك</ThemedText>
              <ThemedText style={[styles.headerCell, styles.skillsColumn]}>مستوى المهارات</ThemedText>
            </ThemedView>

            {/* Table Rows */}
            {filteredStudents.map((student, index) => (
              <TouchableOpacity
                key={student.id}
                style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
                onPress={() => setSelectedStudent(student)}
              >
                <ThemedText style={[styles.cell, styles.nameColumn]}>{student.name}</ThemedText>
                <ThemedText style={[styles.cell, styles.gradeColumn]}>{student.grade}</ThemedText>
                <ThemedText style={[styles.cell, styles.subjectsColumn]} numberOfLines={2}>
                  {student.subjects}
                </ThemedText>
                <ThemedText style={[styles.cell, styles.behaviorColumn]}>{student.behavior}</ThemedText>
                <ThemedView style={[styles.cell, styles.skillsColumn]}>
                  {renderSkillsLevel(student.skillsLevel)}
                </ThemedView>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ScrollView>

        {/* Bottom sections */}
        <ThemedView style={styles.bottomSection}>
          <ThemedView style={styles.notesSection}>
            <ThemedText style={styles.sectionTitle}>التوجيهات</ThemedText>
            <ThemedView style={styles.notesBox}>
              <ThemedText style={styles.notesText}>
                {selectedStudent?.suggestions || 'اختر طالباً لعرض التوجيهات'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.achievementsSection}>
            <ThemedText style={styles.sectionTitle}>الإنجازات</ThemedText>
            <ThemedView style={styles.achievementsBox}>
              <ThemedText style={styles.achievementsText}>
                {selectedStudent?.achievements || 'اختر طالباً لعرض الإنجازات'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.additionalNotesSection}>
          <ThemedText style={styles.sectionTitle}>ملاحظات</ThemedText>
          <ThemedView style={styles.additionalNotesBox}>
            <ThemedText style={styles.additionalNotesText}>
              {selectedStudent?.notes || 'اختر طالباً لعرض الملاحظات الإضافية'}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Add Student Modal */}
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
              <ThemedText style={styles.inputLabel}>المواد</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newStudent.subjects}
                onChangeText={(text) => setNewStudent({...newStudent, subjects: text})}
                placeholder="أدخل المواد التي يدرسها الطالب"
                multiline
                numberOfLines={3}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>السلوك</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newStudent.behavior}
                onChangeText={(text) => setNewStudent({...newStudent, behavior: text})}
                placeholder="تقييم سلوك الطالب"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>الإنجازات</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newStudent.achievements}
                onChangeText={(text) => setNewStudent({...newStudent, achievements: text})}
                placeholder="أدخل إنجازات الطالب"
                multiline
                numberOfLines={3}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>مستوى المهارات (1-5)</ThemedText>
              <ThemedView style={styles.skillsInput}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.skillButton,
                      newStudent.skillsLevel === level && styles.skillButtonActive
                    ]}
                    onPress={() => setNewStudent({...newStudent, skillsLevel: level})}
                  >
                    <ThemedText style={[
                      styles.skillButtonText,
                      newStudent.skillsLevel === level && styles.skillButtonTextActive
                    ]}>
                      {level}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>التوجيهات</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newStudent.suggestions}
                onChangeText={(text) => setNewStudent({...newStudent, suggestions: text})}
                placeholder="أدخل التوجيهات للطالب"
                multiline
                numberOfLines={3}
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>ملاحظات إضافية</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newStudent.notes}
                onChangeText={(text) => setNewStudent({...newStudent, notes: text})}
                placeholder="أدخل ملاحظات إضافية"
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
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  table: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  nameColumn: {
    flex: 2.5,
  },
  gradeColumn: {
    flex: 1.5,
  },
  subjectsColumn: {
    flex: 2,
  },
  behaviorColumn: {
    flex: 1.5,
  },
  skillsColumn: {
    flex: 2,
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  skillBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  skillBoxFilled: {
    backgroundColor: '#4CAF50',
  },
  skillBoxEmpty: {
    backgroundColor: '#E0E0E0',
  },
  bottomSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  notesSection: {
    flex: 1,
  },
  achievementsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  achievementsBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  achievementsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  additionalNotesSection: {
    marginBottom: 20,
  },
  additionalNotesBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  additionalNotesText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
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
  skillsInput: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  skillButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skillButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  skillButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  skillButtonTextActive: {
    color: '#fff',
  },
});
