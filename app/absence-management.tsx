import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, Platform, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from '@/styles/common-styles';

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
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAbsences: 0,
    withExcuse: 0,
    withoutExcuse: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadAbsenceData();
  }, []);

  // إعادة تحميل البيانات عند العودة للصفحة
  useFocusEffect(
    React.useCallback(() => {
      loadAbsenceData();
    }, [])
  );

  const loadAbsenceData = async () => {
    try {
      setRefreshing(true);
      const stored = await AsyncStorage.getItem('absenceRecords');
      if (stored) {
        const records = JSON.parse(stored);
        // ترتيب السجلات حسب التاريخ (الأحدث أولاً)
        const sortedRecords = records.sort((a: AbsenceRecord, b: AbsenceRecord) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAbsenceRecords(sortedRecords);
        calculateStats(sortedRecords);
      }
    } catch (error) {
      console.error('Error loading absence data:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل البيانات');
    } finally {
      setRefreshing(false);
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

  const deleteAbsenceRecord = async (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا السجل؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRecords = absenceRecords.filter(record => record.id !== id);
              await AsyncStorage.setItem('absenceRecords', JSON.stringify(updatedRecords));
              setAbsenceRecords(updatedRecords);
              calculateStats(updatedRecords);
              Alert.alert('تم الحذف', 'تم حذف السجل بنجاح');
            } catch (error) {
              console.error('Error deleting absence record:', error);
              Alert.alert('خطأ', 'حدث خطأ في حذف السجل');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: AbsenceRecord['type']) => {
    switch (type) {
      case 'مرضي':
        return { name: 'cross.case.fill', color: '#FF6B6B' };
      case 'شخصي':
        return { name: 'person.circle.fill', color: '#4ECDC4' };
      case 'رسمي':
        return { name: 'building.2.fill', color: '#007AFF' };
      case 'بدون عذر':
        return { name: 'xmark.circle.fill', color: '#FF851B' };
      default:
        return { name: 'questionmark.circle.fill', color: '#666666' };
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadAbsenceData}
                colors={['#1c1f33']}
                tintColor="#1c1f33"
              />
            }
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
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
              {/* إضافة غياب جديد */}
              <TouchableOpacity 
                style={styles.addAbsenceCard}
                onPress={() => router.push('/add-absence')}
              >
                <ThemedView style={styles.addAbsenceIconWrapper}>
                  <IconSymbol size={32} name="plus.circle.fill" color="#1c1f33" />
                </ThemedView>
                <ThemedText style={styles.addAbsenceTitle}>إضافة غياب جديد</ThemedText>
                <ThemedText style={styles.addAbsenceDescription}>تسجيل يوم غياب جديد مع تحديد السبب والفترة</ThemedText>
              </TouchableOpacity>

              {/* إحصائيات سريعة */}
              <ThemedView style={styles.statsContainer}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  الإحصائيات السريعة
                </ThemedText>

                <ThemedView style={styles.statsGrid}>
                  <ThemedView style={styles.statCard}>
                    <ThemedView style={styles.iconWrapper}>
                      <IconSymbol size={28} name="chart.bar.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedView style={styles.statContent}>
                      <ThemedText style={styles.statLabel}>إجمالي الغياب</ThemedText>
                      <ThemedText style={styles.statNumber}>{stats.totalAbsences}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.statCard}>
                    <ThemedView style={styles.iconWrapper}>
                      <IconSymbol size={28} name="checkmark.circle.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedView style={styles.statContent}>
                      <ThemedText style={styles.statLabel}>بعذر</ThemedText>
                      <ThemedText style={styles.statNumber}>{stats.withExcuse}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.statCard}>
                    <ThemedView style={styles.iconWrapper}>
                      <IconSymbol size={28} name="xmark.circle.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedView style={styles.statContent}>
                      <ThemedText style={styles.statLabel}>بدون عذر</ThemedText>
                      <ThemedText style={styles.statNumber}>{stats.withoutExcuse}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.statCard}>
                    <ThemedView style={styles.iconWrapper}>
                      <IconSymbol size={28} name="calendar.circle.fill" color="#1c1f33" />
                    </ThemedView>
                    <ThemedView style={styles.statContent}>
                      <ThemedText style={styles.statLabel}>هذا الشهر</ThemedText>
                      <ThemedText style={styles.statNumber}>{stats.thisMonth}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </ThemedView>

              {/* قائمة سجلات الغياب */}
              <ThemedView style={styles.recordsContainer}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  سجلات الغياب ({absenceRecords.length})
                </ThemedText>

                {absenceRecords.length === 0 ? (
                  <ThemedView style={styles.emptyState}>
                    <IconSymbol size={60} name="doc.text" color="#CCCCCC" />
                    <ThemedText style={styles.emptyStateText}>
                      لا توجد سجلات غياب
                    </ThemedText>
                    <ThemedText style={styles.emptyStateSubtext}>
                      اضغط على «إضافة غياب جديد» لبدء التسجيل
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.recordsList}>
                    {absenceRecords.map((record) => {
                      const typeIcon = getTypeIcon(record.type);
                      return (
                        <ThemedView key={record.id} style={styles.recordCard}>
                          <ThemedView style={styles.recordHeader}>
                            <ThemedView style={styles.recordTypeContainer}>
                              <IconSymbol size={24} name={typeIcon.name as any} color={typeIcon.color} />
                              <ThemedText style={styles.recordType}>{record.type}</ThemedText>
                            </ThemedView>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => deleteAbsenceRecord(record.id)}
                            >
                              <IconSymbol size={20} name="trash.fill" color="#FF3B30" />
                            </TouchableOpacity>
                          </ThemedView>

                          <ThemedView style={styles.recordDetails}>
                            <ThemedView style={styles.recordDetail}>
                              <IconSymbol size={16} name="calendar" color="#666" />
                              <ThemedText style={styles.recordDetailText}>
                                {formatDate(record.date)}
                              </ThemedText>
                            </ThemedView>

                            <ThemedView style={styles.recordDetail}>
                              <IconSymbol 
                                size={16} 
                                name={record.withExcuse ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                                color={record.withExcuse ? "#4ECDC4" : "#FF6B6B"} 
                              />
                              <ThemedText style={styles.recordDetailText}>
                                {record.withExcuse ? 'بعذر' : 'بدون عذر'}
                              </ThemedText>
                            </ThemedView>

                            {record.reason && (
                              <ThemedView style={styles.recordDetail}>
                                <IconSymbol size={16} name="text.bubble" color="#666" />
                                <ThemedText style={styles.recordDetailText}>
                                  {record.reason}
                                </ThemedText>
                              </ThemedView>
                            )}
                          </ThemedView>
                        </ThemedView>
                      );
                    })}
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          </ScrollView>
          <BottomNavigationBar />
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
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
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
    flexDirection: 'column',
    gap: 15,
  },
  statCard: {
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
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    padding: 15,
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
  statContent: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 5,
  },
  addAbsenceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 24,
    marginBottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    minHeight: 160,
  },
  addAbsenceIconWrapper: {
    backgroundColor: '#E8E8E8',
    borderRadius: 50,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addAbsenceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  addAbsenceDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  recordsContainer: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  recordsList: {
    gap: 15,
  },
  recordCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFE5E5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  recordDetails: {
    gap: 10,
  },
  recordDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDetailText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },

});
