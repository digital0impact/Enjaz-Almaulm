
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PerformanceScreen() {
  const [performanceData, setPerformanceData] = useState([
    {
      id: 1,
      title: 'التخطيط للتدريس',
      score: 95,
      description: 'إعداد الخطط الدراسية والتحضير للدروس',
      details: 'تقييم ممتاز في إعداد الخطط السنوية والفصلية',
    },
    {
      id: 2,
      title: 'استراتيجيات التدريس',
      score: 88,
      description: 'استخدام طرق تدريس متنوعة وفعالة',
      details: 'تنويع جيد في استراتيجيات التدريس مع التركيز على التعلم النشط',
    },
    {
      id: 3,
      title: 'إدارة الصف',
      score: 92,
      description: 'تنظيم البيئة الصفية وإدارة سلوك الطلاب',
      details: 'مهارات متميزة في إدارة الصف وتحفيز الطلاب',
    },
    {
      id: 4,
      title: 'التقويم والتقييم',
      score: 85,
      description: 'استخدام أساليب تقويم متنوعة',
      details: 'تنويع جيد في أساليب التقويم مع الحاجة لتطوير التقويم التكويني',
    },
    {
      id: 5,
      title: 'التطوير المهني',
      score: 90,
      description: 'المشاركة في البرامج التدريبية والتطويرية',
      details: 'مشاركة فعالة في البرامج التدريبية وتطبيق المعرفة الجديدة',
    },
    {
      id: 6,
      title: 'التواصل والتفاعل',
      score: 93,
      description: 'التواصل مع الطلاب وأولياء الأمور والزملاء',
      details: 'تواصل ممتاز مع جميع أطراف العملية التعليمية',
    },
  ]);

  const [selectedPerformance, setSelectedPerformance] = useState<number | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        setPerformanceData(JSON.parse(storedData));
      }
    } catch (error) {
      console.log('Error loading performance data:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#FF9800';
    if (score >= 70) return '#FFC107';
    return '#F44336';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    return 'يحتاج تحسين';
  };

  const calculateOverallAverage = () => {
    const sum = performanceData.reduce((acc, item) => acc + item.score, 0);
    return Math.round(sum / performanceData.length);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="chart.bar.fill" color="#FF9800" />
        <ThemedText type="title" style={styles.title}>
          محاور الأداء المهني
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          تقييم شامل لأدائك في المجالات المهنية المختلفة
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.summaryCard}>
          <ThemedText type="subtitle" style={styles.summaryTitle}>
            المتوسط العام للأداء
          </ThemedText>
          <ThemedView style={styles.averageContainer}>
            <ThemedText style={[styles.averageScore, { color: getScoreColor(calculateOverallAverage()) }]}>
              {calculateOverallAverage()}%
            </ThemedText>
            <ThemedText style={styles.averageLevel}>
              {getScoreLevel(calculateOverallAverage())}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.performanceList}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            تفاصيل محاور الأداء
          </ThemedText>

          {performanceData.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.performanceCard}
              onPress={() => 
                setSelectedPerformance(selectedPerformance === item.id ? null : item.id)
              }
            >
              <ThemedView style={styles.cardHeader}>
                <ThemedView style={styles.cardTitleContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {item.title}
                  </ThemedText>
                  <ThemedText style={styles.cardDescription}>
                    {item.description}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.scoreContainer}>
                  <ThemedText style={[styles.score, { color: getScoreColor(item.score) }]}>
                    {item.score}%
                  </ThemedText>
                  <ThemedText style={[styles.scoreLevel, { color: getScoreColor(item.score) }]}>
                    {getScoreLevel(item.score)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.progressBar}>
                <ThemedView 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${item.score}%`,
                      backgroundColor: getScoreColor(item.score)
                    }
                  ]} 
                />
              </ThemedView>

              {selectedPerformance === item.id && (
                <ThemedView style={styles.detailsContainer}>
                  <ThemedText style={styles.detailsTitle}>تفاصيل التقييم:</ThemedText>
                  <ThemedText style={styles.detailsText}>{item.details}</ThemedText>
                </ThemedView>
              )}

              <IconSymbol 
                size={16} 
                name={selectedPerformance === item.id ? "chevron.up" : "chevron.down"} 
                color="#666666" 
                style={styles.expandIcon}
              />
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => Alert.alert('تقرير مفصل', 'سيتم إنشاء تقرير مفصل عن الأداء المهني قريباً')}
          >
            <IconSymbol size={20} name="doc.text.fill" color="white" />
            <ThemedText style={styles.buttonText}>تقرير مفصل</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.improveButton}
            onPress={() => Alert.alert('خطة التحسين', 'سيتم إنشاء خطة لتحسين الأداء قريباً')}
          >
            <IconSymbol size={20} name="chart.line.uptrend.xyaxis" color="white" />
            <ThemedText style={styles.buttonText}>خطة التحسين</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageScore: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  averageLevel: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
  },
  performanceList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
  },
  performanceCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
  },
  detailsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  expandIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  improveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
