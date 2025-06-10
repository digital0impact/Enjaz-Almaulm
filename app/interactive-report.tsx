
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function InteractiveReportScreen() {
  const router = useRouter();
  const [selectedChart, setSelectedChart] = useState('overall');
  const [performanceData] = useState([
    {
      id: 1,
      title: 'أداء الواجبات الوظيفية',
      score: 95,
      weight: 10,
      category: 'وظيفي'
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 88,
      weight: 10,
      category: 'تفاعلي'
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 92,
      weight: 10,
      category: 'تفاعلي'
    },
    {
      id: 4,
      title: 'التنويع في استراتيجيات التدريس',
      score: 87,
      weight: 10,
      category: 'تعليمي'
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 85,
      weight: 10,
      category: 'تعليمي'
    },
    {
      id: 6,
      title: 'إعداد وتنفيذ خطة التعلم',
      score: 90,
      weight: 10,
      category: 'تخطيطي'
    },
    {
      id: 7,
      title: 'توظيف التقنيات ووسائل التعلم',
      score: 82,
      weight: 10,
      category: 'تقني'
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 89,
      weight: 5,
      category: 'بيئي'
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 93,
      weight: 5,
      category: 'إداري'
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 86,
      weight: 10,
      category: 'تحليلي'
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 84,
      weight: 10,
      category: 'تقويمي'
    },
  ]);

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
    const weightedSum = performanceData.reduce((acc, item) => acc + (item.score * item.weight), 0);
    const totalWeight = performanceData.reduce((acc, item) => acc + item.weight, 0);
    return Math.round(weightedSum / totalWeight);
  };

  const getCategoryAverage = (category: string) => {
    const categoryItems = performanceData.filter(item => item.category === category);
    if (categoryItems.length === 0) return 0;
    const sum = categoryItems.reduce((acc, item) => acc + item.score, 0);
    return Math.round(sum / categoryItems.length);
  };

  const getCategories = () => {
    const categories = [...new Set(performanceData.map(item => item.category))];
    return categories.map(category => ({
      name: category,
      average: getCategoryAverage(category),
      count: performanceData.filter(item => item.category === category).length
    }));
  };

  const renderBarChart = () => {
    const categories = getCategories();
    const maxScore = Math.max(...categories.map(cat => cat.average));
    
    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>متوسط الدرجات حسب الفئة</ThemedText>
        <ThemedView style={styles.barsContainer}>
          {categories.map((category, index) => (
            <ThemedView key={index} style={styles.barWrapper}>
              <ThemedView 
                style={[
                  styles.bar,
                  { 
                    height: (category.average / maxScore) * 120,
                    backgroundColor: getScoreColor(category.average)
                  }
                ]}
              />
              <ThemedText style={styles.barLabel}>{category.name}</ThemedText>
              <ThemedText style={[styles.barValue, { color: getScoreColor(category.average) }]}>
                {category.average}%
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderProgressChart = () => {
    const sortedData = [...performanceData].sort((a, b) => b.score - a.score);
    
    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>ترتيب المحاور حسب الأداء</ThemedText>
        <ThemedView style={styles.progressList}>
          {sortedData.map((item, index) => (
            <ThemedView key={item.id} style={styles.progressItem}>
              <ThemedView style={styles.progressHeader}>
                <ThemedText style={styles.progressRank}>#{index + 1}</ThemedText>
                <ThemedText style={styles.progressTitle} numberOfLines={1}>{item.title}</ThemedText>
                <ThemedText style={[styles.progressScore, { color: getScoreColor(item.score) }]}>
                  {item.score}%
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.progressBarWrapper}>
                <ThemedView 
                  style={[
                    styles.progressBar,
                    { 
                      width: `${item.score}%`,
                      backgroundColor: getScoreColor(item.score)
                    }
                  ]}
                />
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderStatistics = () => {
    const scores = performanceData.map(item => item.score);
    const averageScore = calculateOverallAverage();
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const excellentCount = scores.filter(score => score >= 90).length;
    const goodCount = scores.filter(score => score >= 80 && score < 90).length;
    const needsImprovementCount = scores.filter(score => score < 70).length;

    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>الإحصائيات التفصيلية</ThemedText>
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <IconSymbol size={24} name="chart.bar.fill" color="#4CAF50" />
            <ThemedText style={styles.statValue}>{averageScore}%</ThemedText>
            <ThemedText style={styles.statLabel}>المتوسط العام</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <IconSymbol size={24} name="arrow.up.circle.fill" color="#2196F3" />
            <ThemedText style={styles.statValue}>{maxScore}%</ThemedText>
            <ThemedText style={styles.statLabel}>أعلى درجة</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <IconSymbol size={24} name="arrow.down.circle.fill" color="#FF9800" />
            <ThemedText style={styles.statValue}>{minScore}%</ThemedText>
            <ThemedText style={styles.statLabel}>أقل درجة</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
            <IconSymbol size={24} name="star.fill" color="#9C27B0" />
            <ThemedText style={styles.statValue}>{excellentCount}</ThemedText>
            <ThemedText style={styles.statLabel}>محاور ممتازة</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <IconSymbol size={24} name="checkmark.circle.fill" color="#4CAF50" />
            <ThemedText style={styles.statValue}>{goodCount}</ThemedText>
            <ThemedText style={styles.statLabel}>محاور جيدة</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: needsImprovementCount > 0 ? '#FFEBEE' : '#E8F5E8' }]}>
            <IconSymbol size={24} name="exclamationmark.triangle.fill" color={needsImprovementCount > 0 ? "#F44336" : "#4CAF50"} />
            <ThemedText style={styles.statValue}>{needsImprovementCount}</ThemedText>
            <ThemedText style={styles.statLabel}>تحتاج تحسين</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'categories':
        return renderBarChart();
      case 'progress':
        return renderProgressChart();
      case 'statistics':
        return renderStatistics();
      default:
        return renderBarChart();
    }
  };

  const handleExportReport = () => {
    Alert.alert(
      'تصدير التقرير',
      'اختر تنسيق التصدير:',
      [
        {
          text: 'PDF',
          onPress: () => Alert.alert('تصدير PDF', 'سيتم تصدير التقرير كملف PDF قريباً')
        },
        {
          text: 'Excel',
          onPress: () => Alert.alert('تصدير Excel', 'سيتم تصدير التقرير كملف Excel قريباً')
        },
        {
          text: 'مشاركة',
          onPress: () => Alert.alert('مشاركة', 'سيتم مشاركة التقرير قريباً')
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

  const handlePrintReport = () => {
    Alert.alert('طباعة التقرير', 'سيتم فتح معاينة الطباعة قريباً');
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
        <ThemedView style={styles.headerContent}>
          <IconSymbol size={50} name="chart.line.uptrend.xyaxis" color="#fff" />
          <ThemedText type="title" style={styles.headerTitle}>
            التقرير التفاعلي
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            تحليل شامل لأداءك المهني مع مؤشرات تفاعلية
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedView style={styles.summaryCard}>
          <ThemedText type="subtitle" style={styles.summaryTitle}>
            ملخص الأداء العام
          </ThemedText>
          <ThemedView style={styles.summaryRow}>
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={[styles.summaryValue, { color: getScoreColor(calculateOverallAverage()) }]}>
                {calculateOverallAverage()}%
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>المتوسط العام</ThemedText>
            </ThemedView>
            <ThemedView style={styles.summaryItem}>
              <ThemedText style={[styles.summaryValue, { color: getScoreColor(calculateOverallAverage()) }]}>
                {getScoreLevel(calculateOverallAverage())}
              </ThemedText>
              <ThemedText style={styles.summaryLabel}>مستوى الأداء</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.chartSelector}>
          <ThemedText style={styles.selectorTitle}>اختر نوع التحليل:</ThemedText>
          <ThemedView style={styles.selectorButtons}>
            <TouchableOpacity
              style={[styles.selectorButton, selectedChart === 'categories' && styles.activeSelectorButton]}
              onPress={() => setSelectedChart('categories')}
            >
              <IconSymbol size={16} name="chart.bar.fill" color={selectedChart === 'categories' ? '#fff' : '#666'} />
              <ThemedText style={[styles.selectorButtonText, selectedChart === 'categories' && styles.activeSelectorButtonText]}>
                الفئات
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectorButton, selectedChart === 'progress' && styles.activeSelectorButton]}
              onPress={() => setSelectedChart('progress')}
            >
              <IconSymbol size={16} name="list.bullet" color={selectedChart === 'progress' ? '#fff' : '#666'} />
              <ThemedText style={[styles.selectorButtonText, selectedChart === 'progress' && styles.activeSelectorButtonText]}>
                الترتيب
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectorButton, selectedChart === 'statistics' && styles.activeSelectorButton]}
              onPress={() => setSelectedChart('statistics')}
            >
              <IconSymbol size={16} name="chart.pie.fill" color={selectedChart === 'statistics' ? '#fff' : '#666'} />
              <ThemedText style={[styles.selectorButtonText, selectedChart === 'statistics' && styles.activeSelectorButtonText]}>
                الإحصائيات
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {renderChart()}

        <ThemedView style={styles.recommendationsCard}>
          <ThemedText style={styles.recommendationsTitle}>
            <IconSymbol size={20} name="lightbulb.fill" color="#FF9800" /> توصيات للتحسين
          </ThemedText>
          <ThemedView style={styles.recommendationsList}>
            {performanceData
              .filter(item => item.score < 85)
              .sort((a, b) => a.score - b.score)
              .slice(0, 3)
              .map((item, index) => (
                <ThemedView key={item.id} style={styles.recommendationItem}>
                  <ThemedText style={styles.recommendationText}>
                    • ركز على تحسين "{item.title}" (الدرجة الحالية: {item.score}%)
                  </ThemedText>
                </ThemedView>
              ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportReport}
          >
            <IconSymbol size={20} name="square.and.arrow.up.fill" color="white" />
            <ThemedText style={styles.buttonText}>تصدير التقرير</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.printButton}
            onPress={handlePrintReport}
          >
            <IconSymbol size={20} name="printer.fill" color="white" />
            <ThemedText style={styles.buttonText}>طباعة</ThemedText>
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
    backgroundColor: '#2E8B57',
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
    fontSize: 24,
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
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  chartSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  selectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 5,
  },
  activeSelectorButton: {
    backgroundColor: '#2E8B57',
  },
  selectorButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeSelectorButtonText: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  bar: {
    width: 25,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  progressRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E8B57',
    minWidth: 25,
  },
  progressTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarWrapper: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
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
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C757D',
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
