
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function InteractiveReportScreen() {
  const router = useRouter();
  const [selectedChart, setSelectedChart] = useState('overall');
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // تحميل البيانات الفعلية من AsyncStorage
  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setPerformanceData(parsedData);
      } else {
        // إذا لم توجد بيانات محفوظة، استخدم البيانات الافتراضية
        setPerformanceData(getDefaultPerformanceData());
      }
      setLoading(false);
    } catch (error) {
      console.log('Error loading performance data:', error);
      setPerformanceData(getDefaultPerformanceData());
      setLoading(false);
    }
  };

  const getDefaultPerformanceData = () => [
    {
      id: 1,
      title: 'أداء الواجبات الوظيفية',
      score: 0,
      weight: 10,
      category: 'وظيفي'
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 0,
      weight: 10,
      category: 'تفاعلي'
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 0,
      weight: 10,
      category: 'تفاعلي'
    },
    {
      id: 4,
      title: 'تنويع استراتيجيات التدريس',
      score: 0,
      weight: 10,
      category: 'تعليمي'
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 0,
      weight: 10,
      category: 'تعليمي'
    },
    {
      id: 6,
      title: 'إعداد خطة وتنفيذ التعلم',
      score: 0,
      weight: 10,
      category: 'تخطيطي'
    },
    {
      id: 7,
      title: 'توظيف تقنيات ووسائل التعلم',
      score: 0,
      weight: 10,
      category: 'تقني'
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 0,
      weight: 5,
      category: 'بيئي'
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 0,
      weight: 5,
      category: 'إداري'
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 0,
      weight: 10,
      category: 'تحليلي'
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 0,
      weight: 10,
      category: 'تقويمي'
    },
  ];

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
    if (performanceData.length === 0) return 0;
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
    const maxScore = Math.max(...categories.map(cat => cat.average), 1);
    
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
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, 0);
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>جاري تحميل البيانات...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

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
          <ThemedView style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
            </TouchableOpacity>
            <ThemedView style={styles.headerContent}>
              <IconSymbol size={50} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
              <ThemedText type="title" style={styles.headerTitle}>
                التقرير التفاعلي
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                تحليل شامل لأداءك المهني مع مؤشرات تفاعلية
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ScrollView style={styles.content}>
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
                  style={[styles.selectorButton, selectedChart === 'statistics' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('statistics')}
                >
                  <IconSymbol size={16} name="chart.pie.fill" color={selectedChart === 'statistics' ? '#fff' : '#666'} />
                  <ThemedText style={[styles.selectorButtonText, selectedChart === 'statistics' && styles.activeSelectorButtonText]}>
                    الإحصائيات
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
                  style={[styles.selectorButton, selectedChart === 'categories' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('categories')}
                >
                  <IconSymbol size={16} name="chart.bar.fill" color={selectedChart === 'categories' ? '#fff' : '#666'} />
                  <ThemedText style={[styles.selectorButtonText, selectedChart === 'categories' && styles.activeSelectorButtonText]}>
                    الفئات
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
                {performanceData.filter(item => item.score < 85).length === 0 && (
                  <ThemedView style={styles.recommendationItem}>
                    <ThemedText style={styles.recommendationText}>
                      • ممتاز! جميع المحاور تحصل على درجات عالية. استمر في الأداء المتميز.
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleExportReport}
              >
                <IconSymbol size={20} name="square.and.arrow.up.fill" color="#1c1f33" />
                <ThemedText style={styles.buttonText}>تصدير التقرير</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.printButton}
                onPress={handlePrintReport}
              >
                <IconSymbol size={20} name="printer.fill" color="#1c1f33" />
                <ThemedText style={styles.buttonText}>طباعة</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ScrollView>
        </ExpoLinearGradient>
      </ImageBackground>
      <BottomNavigationBar />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1c1f33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#1c1f33',
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
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
    borderRadius: 15,
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
    backgroundColor: '#1c1f33',
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
    borderRadius: 15,
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
    color: '#1c1f33',
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
    borderRadius: 15,
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
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  buttonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
