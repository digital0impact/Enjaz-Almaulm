import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform, Alert, Modal, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'يحتاج إلى تطوير' | 'صعوبات التعلم' | 'ضعف';
  lastUpdate: string;
  notes: string;
  goals?: string[];
  needs?: string[];
  evidence?: string[];
}

const StudentCategoryDetailsScreen = () => {
  const router = useRouter();
  const { category, categoryLabel, categoryColor } = useLocalSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const stored = await AsyncStorage.getItem('students');
      if (stored) {
        const studentsData = JSON.parse(stored);
        const filteredStudents = studentsData.filter(
          (student: Student) => student.status === category
        );
        setStudents(filteredStudents);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات المتعلمين');
    }
  };

  const exportToExcel = async () => {
    try {
      const ws = XLSX.utils.json_to_sheet(students.map(student => ({
        'اسم المتعلم': student.name,
        'الصف الدراسي': student.grade,
        'الأهداف': student.goals?.join(', ') || '-',
        'احتياجات المتعلم': student.needs?.join(', ') || '-',
        'الشواهد': student.evidence?.join(', ') || '-',
        'ملاحظات': student.notes || '-'
      })));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, categoryLabel as string);

      const fileName = `${categoryLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('نجاح', `تم حفظ الملف بنجاح`);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير الملف');
    }
  };

  const exportToPDF = async () => {
    try {
      const tableRows = students.map(student => `
        <tr>
          <td>${student.name}</td>
          <td>${student.grade}</td>
          <td>${student.goals?.join(', ') || '-'}</td>
          <td>${student.needs?.join(', ') || '-'}</td>
          <td>${student.evidence?.join(', ') || '-'}</td>
          <td>${student.notes || '-'}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html dir="rtl">
          <head>
            <style>
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th { background-color: ${categoryColor || '#4CAF50'}; color: white; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${categoryLabel}</h1>
              <p>عدد المتعلمين: ${students.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>اسم المتعلم</th>
                  <th>الصف الدراسي</th>
                  <th>الأهداف</th>
                  <th>احتياجات المتعلم</th>
                  <th>الشواهد</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('نجاح', `تم حفظ الملف بنجاح`);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تصدير الملف');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            {/* Header */}
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.right" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.headerContent}>
                <ThemedText style={styles.title}>
                  {categoryLabel}
                </ThemedText>
                <ThemedView style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={() => setShowExportOptions(true)}
                  >
                    <IconSymbol size={20} name="arrow.down.circle" color="#1c1f33" />
                    <ThemedText style={styles.downloadButtonText}>تحميل الجدول</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.subtitle}>
                    {students.length} متعلم
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* Students Table */}
            {students.length > 0 ? (
              <ThemedView style={styles.tableContainer}>
                {/* Table Header */}
                <ThemedView style={[styles.tableHeader, { backgroundColor: categoryColor || '#4CAF50' }]}>
                  <ThemedText style={[styles.headerCell, { flex: 2 }]}>اسم المتعلم</ThemedText>
                  <ThemedText style={[styles.headerCell, { flex: 1.5 }]}>الصف الدراسي</ThemedText>
                  <ThemedText style={[styles.headerCell, { flex: 2 }]}>الأهداف</ThemedText>
                  <ThemedText style={[styles.headerCell, { flex: 2 }]}>احتياجات المتعلم</ThemedText>
                  <ThemedText style={[styles.headerCell, { flex: 2 }]}>الشواهد</ThemedText>
                  <ThemedText style={[styles.headerCell, { flex: 2 }]}>ملاحظات</ThemedText>
                </ThemedView>

                {/* Table Rows */}
                {students.map((student, index) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.tableRow,
                      { backgroundColor: index % 2 === 0 ? '#F8F9FA' : '#FFFFFF' }
                    ]}
                    onPress={() => {
                      AsyncStorage.setItem('selectedStudentId', student.id)
                        .then(() => {
                          router.push('/student-tracking');
                        })
                        .catch(error => {
                          console.error('Error saving selected student:', error);
                          Alert.alert('خطأ', 'حدث خطأ أثناء فتح بطاقة المتعلم');
                        });
                    }}
                  >
                    <ThemedView style={[styles.cell, { flex: 2 }]}>
                      <ThemedText style={[styles.cellText, styles.studentName]}>
                        {student.name}
                      </ThemedText>
                    </ThemedView>

                    <ThemedView style={[styles.cell, { flex: 1.5 }]}>
                      <ThemedText style={styles.cellText}>
                        {student.grade}
                      </ThemedText>
                    </ThemedView>

                    <ThemedView style={[styles.cell, { flex: 2 }]}>
                      {student.goals && student.goals.length > 0 ? (
                        <ThemedView>
                          <ThemedText style={styles.itemCount}>
                            {student.goals.length} أهداف
                          </ThemedText>
                          <ThemedText style={styles.itemPreview} numberOfLines={2}>
                            {student.goals.slice(0, 2).join('، ')}
                            {student.goals.length > 2 ? '...' : ''}
                          </ThemedText>
                        </ThemedView>
                      ) : (
                        <ThemedText style={styles.cellText}>-</ThemedText>
                      )}
                    </ThemedView>

                    <ThemedView style={[styles.cell, { flex: 2 }]}>
                      {student.needs && student.needs.length > 0 ? (
                        <ThemedView>
                          <ThemedText style={styles.itemCount}>
                            {student.needs.length} احتياج
                          </ThemedText>
                          <ThemedText style={styles.itemPreview} numberOfLines={2}>
                            {student.needs.slice(0, 2).join('، ')}
                            {student.needs.length > 2 ? '...' : ''}
                          </ThemedText>
                        </ThemedView>
                      ) : (
                        <ThemedText style={styles.cellText}>-</ThemedText>
                      )}
                    </ThemedView>

                    <ThemedView style={[styles.cell, { flex: 2 }]}>
                      {student.evidence && student.evidence.length > 0 ? (
                        <ThemedView>
                          <ThemedText style={styles.itemCount}>
                            {student.evidence.length} شواهد
                          </ThemedText>
                          <ThemedText style={styles.itemPreview} numberOfLines={2}>
                            {student.evidence.slice(0, 2).join('، ')}
                            {student.evidence.length > 2 ? '...' : ''}
                          </ThemedText>
                        </ThemedView>
                      ) : (
                        <ThemedText style={styles.cellText}>-</ThemedText>
                      )}
                    </ThemedView>

                    <ThemedView style={[styles.cell, { flex: 2 }]}>
                      <ThemedText style={styles.cellText} numberOfLines={2}>
                        {student.notes || '-'}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            ) : (
              <ThemedView style={styles.emptyState}>
                <ThemedView style={styles.emptyIconContainer}>
                  <IconSymbol size={80} name="person.2.slash" color="#ccc" />
                </ThemedView>
                <ThemedText style={styles.emptyTitle}>لا يوجد متعلمين</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  لا يوجد متعلمين في هذه الفئة حالياً
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </ImageBackground>
      <BottomNavigationBar />

      <Modal
        visible={showExportOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExportOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>اختر صيغة التحميل</ThemedText>
            
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => {
                exportToExcel();
                setShowExportOptions(false);
              }}
            >
              <IconSymbol size={24} name="doc.text" color="#1c1f33" />
              <ThemedText style={styles.exportOptionText}>Excel تحميل بصيغة</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => {
                exportToPDF();
                setShowExportOptions(false);
              }}
            >
              <IconSymbol size={24} name="doc.pdf" color="#1c1f33" />
              <ThemedText style={styles.exportOptionText}>PDF تحميل بصيغة</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.exportOption, styles.cancelButton]}
              onPress={() => setShowExportOptions(false)}
            >
              <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default StudentCategoryDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingBottom: 100,
    direction: 'rtl',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  downloadButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#1c1f33',
    marginRight: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 4,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
  },
  tableContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    direction: 'rtl',
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
  },
  studentName: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  itemCount: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    textAlign: 'right',
  },
  itemPreview: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
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
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1c1f33',
  },
  exportOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 10,
  },
  exportOptionText: {
    fontSize: 16,
    color: '#1c1f33',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
}); 