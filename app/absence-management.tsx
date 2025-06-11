
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AbsenceRecord {
  id: string;
  date: string;
  type: 'مرضي' | 'شخصي' | 'بدون عذر' | 'رسمي';
  duration: 'نصف يوم' | 'يوم كامل' | 'عدة أيام';
  reason?: string;
  withExcuse: boolean;
  createdAt: string;
}

export default function AbsenceManagementScreen() {
  const router = useRouter();
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [stats, setStats] = useState({
    totalAbsences: 0,
    withExcuse: 0,
    withoutExcuse: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadAbsenceData();
  }, []);

  const loadAbsenceData = async () => {
    try {
      const stored = await AsyncStorage.getItem('absenceRecords');
      if (stored) {
        const records = JSON.parse(stored);
        setAbsenceRecords(records);
        calculateStats(records);
      }
    } catch (error) {
      console.error('Error loading absence data:', error);
    }
  };

  const saveAbsenceData = async (records: AbsenceRecord[]) => {
    try {
      await AsyncStorage.setItem('absenceRecords', JSON.stringify(records));
      setAbsenceRecords(records);
      calculateStats(records);
    } catch (error) {
      console.error('Error saving absence data:', error);
    }
  };

  const calculateStats = (records: AbsenceRecord[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const totalAbsences = records.length;
    const withExcuse = records.filter(record => record.withExcuse).length;
    const withoutExcuse = totalAbsences - withExcuse;
    const thisMonth = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }).length;

    setStats({ totalAbsences, withExcuse, withoutExcuse, thisMonth });
  };

  const addNewAbsence = (type: string, withExcuse: boolean) => {
    const newRecord: AbsenceRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: type as any,
      duration: 'يوم كامل',
      withExcuse,
      createdAt: new Date().toISOString()
    };

    const updatedRecords = [...absenceRecords, newRecord];
    saveAbsenceData(updatedRecords);
    
    Alert.alert(
      'تم الحفظ',
      `تم تسجيل غياب ${type} ${withExcuse ? 'بعذر' : 'بدون عذر'} بنجاح`,
      [{ text: 'موافق' }]
    );
  };

  const exportReport = () => {
    const reportData = absenceRecords.map(record => 
      `التاريخ: ${record.date}, النوع: ${record.type}, ${record.withExcuse ? 'بعذر' : 'بدون عذر'}`
    ).join('\n');

    Alert.alert(
      'تقرير الغياب',
      `إجمالي السجلات: ${absenceRecords.length}\n\n${reportData}`,
      [
        {
          text: 'مشاركة',
          onPress: () => Alert.alert('مشاركة', 'سيتم فتح خيارات المشاركة')
        },
        { text: 'إغلاق' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#fff" />
        </TouchableOpacity>
        <IconSymbol size={60} name="person.crop.circle.badge.xmark" color="#fff" />
        <ThemedText type="title" style={styles.title}>
          إدارة الغياب
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          متتبع شامل لسجلات الغياب والإحصائيات
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {/* إحصائيات سريعة */}
        <ThemedView style={styles.statsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            الإحصائيات السريعة
          </ThemedText>
          
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={[styles.statCard, { backgroundColor: '#FF6B6B15' }]}>
              <IconSymbol size={32} name="chart.bar.fill" color="#FF6B6B" />
              <ThemedText style={styles.statNumber}>{stats.totalAbsences}</ThemedText>
              <ThemedText style={styles.statLabel}>إجمالي الغياب</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.statCard, { backgroundColor: '#4ECDC415' }]}>
              <IconSymbol size={32} name="checkmark.circle.fill" color="#4ECDC4" />
              <ThemedText style={styles.statNumber}>{stats.withExcuse}</ThemedText>
              <ThemedText style={styles.statLabel}>بعذر</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.statCard, { backgroundColor: '#FF851B15' }]}>
              <IconSymbol size={32} name="xmark.circle.fill" color="#FF851B" />
              <ThemedText style={styles.statNumber}>{stats.withoutExcuse}</ThemedText>
              <ThemedText style={styles.statLabel}>بدون عذر</ThemedText>
            </ThemedView>
            
            <ThemedView style={[styles.statCard, { backgroundColor: '#007AFF15' }]}>
              <IconSymbol size={32} name="calendar.circle.fill" color="#007AFF" />
              <ThemedText style={styles.statNumber}>{stats.thisMonth}</ThemedText>
              <ThemedText style={styles.statLabel}>هذا الشهر</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* إضافة غياب جديد */}
        <ThemedView style={styles.addSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            تسجيل غياب جديد
          </ThemedText>
          
          <ThemedView style={styles.buttonGrid}>
            <TouchableOpacity 
              style={[styles.absenceButton, styles.medicalButton]}
              onPress={() => addNewAbsence('مرضي', true)}
            >
              <IconSymbol size={28} name="medical.thermometer.fill" color="#fff" />
              <ThemedText style={styles.buttonText}>غياب مرضي</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.absenceButton, styles.personalButton]}
              onPress={() => addNewAbsence('شخصي', true)}
            >
              <IconSymbol size={28} name="person.fill" color="#fff" />
              <ThemedText style={styles.buttonText}>غياب شخصي</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.absenceButton, styles.officialButton]}
              onPress={() => addNewAbsence('رسمي', true)}
            >
              <IconSymbol size={28} name="building.2.fill" color="#fff" />
              <ThemedText style={styles.buttonText}>غياب رسمي</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.absenceButton, styles.noExcuseButton]}
              onPress={() => addNewAbsence('بدون عذر', false)}
            >
              <IconSymbol size={28} name="exclamationmark.triangle.fill" color="#fff" />
              <ThemedText style={styles.buttonText}>بدون عذر</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* سجلات الغياب الأخيرة */}
        <ThemedView style={styles.recordsSection}>
          <ThemedView style={styles.recordsHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              السجلات الأخيرة
            </ThemedText>
            <TouchableOpacity onPress={exportReport}>
              <IconSymbol size={20} name="square.and.arrow.up.fill" color="#007AFF" />
            </TouchableOpacity>
          </ThemedView>
          
          {absenceRecords.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <IconSymbol size={48} name="tray.fill" color="#ccc" />
              <ThemedText style={styles.emptyText}>لا توجد سجلات غياب</ThemedText>
              <ThemedText style={styles.emptySubtext}>ابدأ بتسجيل أول غياب</ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.recordsList}>
              {absenceRecords.slice(-5).reverse().map((record) => (
                <ThemedView key={record.id} style={styles.recordCard}>
                  <ThemedView style={styles.recordHeader}>
                    <ThemedView style={styles.recordInfo}>
                      <ThemedText style={styles.recordDate}>
                        {new Date(record.date).toLocaleDateString('ar-SA')}
                      </ThemedText>
                      <ThemedText style={styles.recordType}>{record.type}</ThemedText>
                    </ThemedView>
                    <ThemedView style={[
                      styles.statusBadge,
                      record.withExcuse ? styles.withExcuseBadge : styles.noExcuseBadge
                    ]}>
                      <ThemedText style={styles.badgeText}>
                        {record.withExcuse ? 'بعذر' : 'بدون عذر'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <ThemedText style={styles.recordDuration}>
                    المدة: {record.duration}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {/* أدوات إضافية */}
        <ThemedView style={styles.toolsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            أدوات إضافية
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => Alert.alert('التقرير الشهري', 'سيتم فتح التقرير الشهري المفصل')}
          >
            <IconSymbol size={24} name="chart.pie.fill" color="#007AFF" />
            <ThemedText style={styles.toolButtonText}>التقرير الشهري</ThemedText>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => Alert.alert('تصدير البيانات', 'سيتم تصدير جميع سجلات الغياب')}
          >
            <IconSymbol size={24} name="doc.fill" color="#4CAF50" />
            <ThemedText style={styles.toolButtonText}>تصدير البيانات</ThemedText>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => Alert.alert('الإعدادات', 'سيتم فتح إعدادات إدارة الغياب')}
          >
            <IconSymbol size={24} name="gearshape.fill" color="#FF9800" />
            <ThemedText style={styles.toolButtonText}>الإعدادات</ThemedText>
            <IconSymbol size={16} name="chevron.left" color="#666" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#9C27B0',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 15,
  },
  subtitle: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'right',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addSection: {
    marginBottom: 25,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  absenceButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  medicalButton: {
    backgroundColor: '#E91E63',
  },
  personalButton: {
    backgroundColor: '#2196F3',
  },
  officialButton: {
    backgroundColor: '#4CAF50',
  },
  noExcuseButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordsSection: {
    marginBottom: 25,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  recordType: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  withExcuseBadge: {
    backgroundColor: '#4CAF5020',
  },
  noExcuseBadge: {
    backgroundColor: '#FF572220',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  recordDuration: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  toolsSection: {
    marginBottom: 20,
  },
  toolButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toolButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
});
