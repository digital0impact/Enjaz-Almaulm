
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
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
          <ScrollView style={styles.scrollContainer}>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={24} name="chevron.right" color="#1c1f33" />
              </TouchableOpacity>
              
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="person.crop.circle.badge.xmark" color="#1c1f33" />
              </ThemedView>
              
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
                    <ThemedView style={styles.buttonIconWrapper}>
                      <IconSymbol size={28} name="medical.thermometer.fill" color="#fff" />
                    </ThemedView>
                    <ThemedText style={styles.buttonText}>غياب مرضي</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.absenceButton, styles.personalButton]}
                    onPress={() => addNewAbsence('شخصي', true)}
                  >
                    <ThemedView style={styles.buttonIconWrapper}>
                      <IconSymbol size={28} name="person.fill" color="#fff" />
                    </ThemedView>
                    <ThemedText style={styles.buttonText}>غياب شخصي</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.absenceButton, styles.officialButton]}
                    onPress={() => addNewAbsence('رسمي', true)}
                  >
                    <ThemedView style={styles.buttonIconWrapper}>
                      <IconSymbol size={28} name="building.2.fill" color="#fff" />
                    </ThemedView>
                    <ThemedText style={styles.buttonText}>غياب رسمي</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.absenceButton, styles.noExcuseButton]}
                    onPress={() => addNewAbsence('بدون عذر', false)}
                  >
                    <ThemedView style={styles.buttonIconWrapper}>
                      <IconSymbol size={28} name="exclamationmark.triangle.fill" color="#fff" />
                    </ThemedView>
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
                  <TouchableOpacity onPress={exportReport} style={styles.exportButton}>
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
                  style={styles.toolCard}
                  onPress={() => Alert.alert('التقرير الشهري', 'سيتم فتح التقرير الشهري المفصل')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={24} name="chart.pie.fill" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>التقرير الشهري</ThemedText>
                  <ThemedText style={styles.toolDescription}>عرض تقرير شهري مفصل لسجلات الغياب</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => Alert.alert('تصدير البيانات', 'سيتم تصدير جميع سجلات الغياب')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={24} name="doc.fill" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>تصدير البيانات</ThemedText>
                  <ThemedText style={styles.toolDescription}>تصدير جميع سجلات الغياب والإحصائيات</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => Alert.alert('الإعدادات', 'سيتم فتح إعدادات إدارة الغياب')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={24} name="gearshape.fill" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>الإعدادات</ThemedText>
                  <ThemedText style={styles.toolDescription}>إعدادات وتخصيص إدارة الغياب</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  content: {
    backgroundColor: 'transparent',
    gap: 15,
  },
  statsContainer: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#000000',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 10,
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
    writingDirection: 'rtl',
  },
  addSection: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  absenceButton: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 10,
  },
  buttonIconWrapper: {
    marginBottom: 10,
    backgroundColor: 'transparent',
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
    writingDirection: 'rtl',
  },
  recordsSection: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  exportButton: {
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
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
    writingDirection: 'rtl',
  },
  recordType: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
  },
  recordDuration: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toolsSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  toolCard: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 15,
  },
  toolIconWrapper: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
});
