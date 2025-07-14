import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, I18nManager, Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

type Evidence = {
  name: string;
  available: boolean;
};

type PerformanceItem = {
  id: number | string;
  title: string;
  score: number;
  weight: number;
  category: string;
  evidence?: Evidence[];
};

export default function InteractiveReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedChart, setSelectedChart] = useState('overall');
  const [performanceData, setPerformanceData] = useState<PerformanceItem[]>([]);
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
        // معالجة: إضافة category افتراضي إذا لم يوجد
        const normalizedData = Array.isArray(parsedData)
          ? parsedData.map(item => ({
              ...item,
              category: item.category || 'غير محدد',
            }))
          : [];
        if (Array.isArray(normalizedData) && normalizedData.length > 0) {
          setPerformanceData(normalizedData);
          console.log('Loaded performanceData from AsyncStorage:', normalizedData);
        } else {
          setPerformanceData(getDefaultPerformanceData());
          console.log('No valid data in AsyncStorage, using default data');
        }
      } else {
        setPerformanceData(getDefaultPerformanceData());
        console.log('No data in AsyncStorage, using default data');
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
      score: 85,
      weight: 10,
      category: 'وظيفي'
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 78,
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
      title: 'تنويع استراتيجيات التدريس',
      score: 88,
      weight: 10,
      category: 'تعليمي'
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 75,
      weight: 10,
      category: 'تعليمي'
    },
    {
      id: 6,
      title: 'إعداد خطة وتنفيذ التعلم',
      score: 82,
      weight: 10,
      category: 'تخطيطي'
    },
    {
      id: 7,
      title: 'توظيف تقنيات ووسائل التعلم',
      score: 90,
      weight: 10,
      category: 'تقني'
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 85,
      weight: 5,
      category: 'بيئي'
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 88,
      weight: 5,
      category: 'إداري'
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 80,
      weight: 10,
      category: 'تحليلي'
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 85,
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
    if (!category || !performanceData || performanceData.length === 0) {
      return 0;
    }
    
    const categoryItems = performanceData.filter(item => item.category === category);
    if (categoryItems.length === 0) return 0;
    const sum = categoryItems.reduce((acc, item) => acc + (item.score || 0), 0);
    return Math.round(sum / categoryItems.length);
  };

  const getCategories = () => {
    if (!performanceData || performanceData.length === 0) {
      return [];
    }
    
    // استخدام عناوين المحاور بدلاً من الفئات
    return performanceData.map(item => ({
      name: item.title || 'غير محدد',
      average: item.score || 0,
      count: 1
    }));
  };

  const renderProgressChart = () => {
    const sortedData = [...performanceData].sort((a, b) => b.score - a.score);
    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>ترتيب المحاور حسب الأداء</ThemedText>
        <ThemedView>
          {sortedData.map((item, index) => (
            <ThemedView key={item.id} style={{ marginBottom: 8 }}>
              <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>{item.title}</ThemedText>
                <ThemedText style={{ fontSize: 12, color: getScoreColor(item.score) }}>{item.score}%</ThemedText>
              </ThemedView>
              <ThemedView style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                <ThemedView 
                  style={{ 
                    height: '100%', 
                    backgroundColor: getScoreColor(item.score),
                    width: `${Math.min(100, item.score)}%`,
                    borderRadius: 10
                  }} 
                />
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderStatistics = () => {
    const overallAverage = calculateOverallAverage();
    const categories = getCategories();

    return (
      <ThemedView style={styles.statisticsContainer}>
        <ThemedText style={styles.sectionTitle}>الإحصائيات العامة</ThemedText>
        
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: getScoreColor(overallAverage) }]}>
              {overallAverage}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>المعدل العام</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {performanceData.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>عدد المحاور</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {categories.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>عدد الفئات</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {getScoreLevel(overallAverage)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>المستوى</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderCategoriesChart = () => {
    const categories = getCategories();
    const screenWidth = Dimensions.get('window').width - 40;
    const minBarWidth = 80; // عرض أدنى لكل عمود
    const chartWidth = Math.max(screenWidth, categories.length * minBarWidth);

    // التأكد من وجود بيانات
    if (!categories || categories.length === 0) {
      return (
        <ThemedView style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>لا توجد بيانات متاحة للعرض</ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }

    // التأكد من أن البيانات صحيحة
    const validCategories = categories.filter(cat => cat && cat.name && typeof cat.average === 'number');
    
    if (validCategories.length === 0) {
      return (
        <ThemedView style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>البيانات غير صحيحة</ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }

    const data = {
      labels: validCategories.map(cat => {
        const name = String(cat.name || 'غير محدد');
        // تقصير العناوين أكثر لأندرويد
        return name.length > 6 ? name.substring(0, 6) + '...' : name;
      }),
      datasets: [
        {
          data: validCategories.map(cat => Math.max(0, cat.average || 0)),
        }
      ]
    };

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1, index) => {
        const score = validCategories[index]?.average || 0;
        const color = getScoreColor(score);
        // تحويل اللون إلى rgba
        if (color === '#4CAF50') return `rgba(76, 175, 80, ${opacity})`; // أخضر
        if (color === '#2196F3') return `rgba(33, 150, 243, ${opacity})`; // أزرق
        if (color === '#FF9800') return `rgba(255, 152, 0, ${opacity})`; // برتقالي
        if (color === '#F44336') return `rgba(244, 67, 54, ${opacity})`; // أحمر
        return `rgba(33, 150, 243, ${opacity})`; // لون افتراضي
      },
      labelColor: (opacity = 1) => `rgba(28, 31, 51, ${opacity})`,
      style: {
        borderRadius: 16
      },
      barPercentage: 0.6,
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: 'rgba(0, 0, 0, 0.1)',
        strokeWidth: 1,
      },
      propsForLabels: {
        fontSize: 9,
        fontWeight: 'bold',
        fill: '#1c1f33',
      },
      propsForVerticalLabels: {
        fontSize: 9,
        fontWeight: 'bold',
        fill: '#1c1f33',
      },
      propsForValues: {
        fontSize: 11,
        fontWeight: 'bold',
        fill: '#1c1f33',
      },
    };



    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>

        {/* محاولة عرض الرسم البياني مع معالجة خاصة لأندرويد */}
        {Platform.OS === 'android' ? (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            indicatorStyle="black"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ marginVertical: 10 }}
          >
            <BarChart
              data={data}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              fromZero={true}
              showBarTops={true}
              showValuesOnTopOfBars={true}
              withInnerLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={5}
              bezier={false}
              withDots={false}
              withShadow={false}
              yAxisLabel=""
              yAxisSuffix=""
              yLabelsOffset={10}
              xLabelsOffset={-10}
            />
          </ScrollView>
                ) : (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            indicatorStyle="black"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ marginVertical: 10 }}
          >
            <BarChart
              data={data}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              fromZero={true}
              showBarTops={true}
              showValuesOnTopOfBars={true}
              withInnerLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={5}
              bezier={false}
              withDots={false}
              withShadow={false}
            />
          </ScrollView>
        )}


        

      </ThemedView>
    );
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'statistics':
        return renderStatistics();
      case 'overall':
        return renderProgressChart();
      case 'categories':
        return renderCategoriesChart();
      default:
        return renderStatistics();
    }
  };

  const generateReportHTML = async () => {
    const averageScore = calculateOverallAverage();
    const categories = getCategories();
    const scores = performanceData.map(item => item.score);
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, 0);
    const excellentCount = scores.filter(score => score >= 90).length;
    const goodCount = scores.filter(score => score >= 80 && score < 90).length;
    const needsImprovementCount = scores.filter(score => score < 70).length;

    // تحميل البيانات الشخصية والمهنية
    let userData = {
      fullName: 'غير محدد',
      specialty: 'غير محدد',
      experience: 'غير محدد',
      education: 'غير محدد',
      school: 'غير محدد',
      educationDepartment: 'غير محدد',
      gradeLevel: 'غير محدد',
      vision: 'غير محدد',
      mission: 'غير محدد',
      email: 'غير محدد',
      phone: 'غير محدد'
    };

    // تحميل الشواهد المرفقة
    let uploadedFiles = {};
    let performanceDataWithEvidence = [];

    try {
      const storedData = await AsyncStorage.getItem('basicData');
      if (storedData) {
        userData = { ...userData, ...JSON.parse(storedData) };
      }

      // تحميل بيانات الأداء مع الشواهد
      const storedPerformanceData = await AsyncStorage.getItem('performanceData');
      if (storedPerformanceData) {
        performanceDataWithEvidence = JSON.parse(storedPerformanceData);
      }

      // تحميل الملفات المرفقة
      const storedFiles = await AsyncStorage.getItem('uploadedFiles');
      if (storedFiles) {
        uploadedFiles = JSON.parse(storedFiles);
      }
    } catch (error) {
      console.log('Error loading data for report:', error);
    }

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>التقرير التفاعلي للأداء المهني</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1c1f33;
        }
        .logo-section {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
        }
        .logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .ministry-info {
          text-align: center;
        }
        .ministry-title {
          font-size: 24px;
          font-weight: bold;
          color: #1c1f33;
          margin: 0;
        }
        .ministry-subtitle {
          font-size: 16px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .header h1 {
          color: #1c1f33;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 16px;
        }
        .personal-info-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 30px;
          border: 2px solid #dee2e6;
        }
        .personal-info-title {
          color: #1c1f33;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          border-bottom: 2px solid #1c1f33;
          padding-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 15px;
          background: white;
          border-radius: 8px;
          border-right: 4px solid #add4ce;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 14px;
        }
        .info-value {
          color: #333;
          font-size: 14px;
          max-width: 200px;
          text-align: left;
        }

        .summary-section {
          background: linear-gradient(135deg, #add4ce 0%, #e1f5f4 100%);
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 30px;
          text-align: center;
        }
        .summary-row {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 32px;
          font-weight: bold;
          color: ${getScoreColor(averageScore)};
          margin-bottom: 5px;
        }
        .summary-label {
          font-size: 14px;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 2px solid #e9ecef;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin: 10px 0;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
        }
        .categories-section {
          margin: 30px 0;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin-bottom: 10px;
          background: #f8f9fa;
          border-radius: 10px;
          border-right: 5px solid ${getScoreColor(averageScore)};
        }
        .category-name {
          font-weight: bold;
          color: #333;
        }
        .category-score {
          font-weight: bold;
          font-size: 18px;
        }
        .performance-list {
          margin-top: 30px;
        }
        .performance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-radius: 8px;
          border-right: 4px solid #ddd;
        }
        .recommendations {
          background: #fff8e1;
          padding: 25px;
          border-radius: 15px;
          margin-top: 30px;
          border-right: 5px solid #ff9800;
        }
        .recommendations h3 {
          color: #333;
          margin-bottom: 15px;
        }
        .recommendation-item {
          margin-bottom: 10px;
          padding: 10px;
          background: rgba(255, 152, 0, 0.1);
          border-radius: 8px;
        }
        .evidence-section {
          background: #f0f8ff;
          padding: 25px;
          border-radius: 15px;
          margin-top: 30px;
          border-right: 5px solid #4A90E2;
        }
        .evidence-section h3 {
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }
        .performance-evidence {
          margin-bottom: 25px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e1f5fe;
        }
        .performance-evidence h4 {
          color: #1c1f33;
          margin-bottom: 15px;
          border-bottom: 2px solid #4A90E2;
          padding-bottom: 8px;
        }
        .evidence-list {
          margin-left: 20px;
        }
        .evidence-item {
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border-right: 3px solid #4A90E2;
        }
        .evidence-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        .evidence-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .evidence-available {
          background: #4CAF50;
          color: white;
        }
        .evidence-unavailable {
          background: #F44336;
          color: white;
        }
        .evidence-files {
          margin-top: 10px;
        }
        .file-item {
          display: flex;
          align-items: center;
          padding: 8px;
          background: #e3f2fd;
          border-radius: 6px;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .file-icon {
          margin-left: 8px;
          font-size: 16px;
        }
        .file-info {
          flex: 1;
        }
        .file-name {
          font-weight: bold;
          color: #1976d2;
        }
        .file-details {
          color: #666;
          font-size: 11px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          color: #666;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            <img src="https://i.ibb.co/7XqJqK7/moe-logo.png" alt="شعار وزارة التعليم" class="logo">
            <div class="ministry-info">
              <h2 class="ministry-title">المملكة العربية السعودية</h2>
              <p class="ministry-subtitle">وزارة التعليم</p>
            </div>
          </div>
          <h1>📊 التقرير التفاعلي للأداء المهني</h1>
          <p>تحليل شامل لأداءك المهني مع مؤشرات تفاعلية</p>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <div class="personal-info-section">
          <h3 class="personal-info-title">البيانات الشخصية والمهنية</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">الاسم الكامل:</span>
              <span class="info-value">${userData.fullName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">التخصص:</span>
              <span class="info-value">${userData.specialty}</span>
            </div>
            <div class="info-item">
              <span class="info-label">سنوات الخبرة:</span>
              <span class="info-value">${userData.experience}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المؤهل العلمي:</span>
              <span class="info-value">${userData.education}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المدرسة:</span>
              <span class="info-value">${userData.school}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الإدارة التعليمية:</span>
              <span class="info-value">${userData.educationDepartment}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المرحلة الدراسية:</span>
              <span class="info-value">${userData.gradeLevel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">البريد الإلكتروني:</span>
              <span class="info-value">${userData.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">رقم الهاتف:</span>
              <span class="info-value">${userData.phone}</span>
            </div>
          </div>
        </div>



        <div class="summary-section">
          <h2>ملخص الأداء العام</h2>
          <div class="summary-row">
            <div class="summary-item">
              <div class="summary-value">${averageScore}%</div>
              <div class="summary-label">المتوسط العام</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${getScoreLevel(averageScore)}</div>
              <div class="summary-label">مستوى الأداء</div>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${maxScore}%</div>
            <div class="stat-label">أعلى درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${minScore}%</div>
            <div class="stat-label">أقل درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${excellentCount}</div>
            <div class="stat-label">محاور ممتازة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${goodCount}</div>
            <div class="stat-label">محاور جيدة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${needsImprovementCount}</div>
            <div class="stat-label">تحتاج تحسين</div>
          </div>
        </div>

        <div class="categories-section">
          <h3>متوسط الدرجات حسب الفئة</h3>
          ${categories.map(category => `
            <div class="category-item">
              <span class="category-name">${category.name}</span>
              <span class="category-score" style="color: ${getScoreColor(category.average)}">${category.average}%</span>
            </div>
          `).join('')}
        </div>

        <div class="page-break"></div>

        <div class="performance-list">
          <h3>تفاصيل جميع المحاور</h3>
          ${performanceData
            .sort((a, b) => b.score - a.score)
            .map((item, index) => `
              <div class="performance-item">
                <span>${index + 1}. ${item.title}</span>
                <span style="color: ${getScoreColor(item.score)}; font-weight: bold;">${item.score}%</span>
              </div>
            `).join('')}
        </div>

        <div class="recommendations">
          <h3>🔍 توصيات للتحسين</h3>
          ${performanceData
            .filter(item => item.score < 85)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map(item => `
              <div class="recommendation-item">
                • ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.score}%)
              </div>
            `).join('')}
          ${performanceData.filter(item => item.score < 85).length === 0 ? 
            '<div class="recommendation-item">• ممتاز! جميع المحاور تحصل على درجات عالية. استمر في الأداء المتميز.</div>' : ''}
        </div>

        <div class="page-break"></div>

        <div class="evidence-section">
          <h3>📎 الشواهد المرفقة</h3>
          ${performanceDataWithEvidence.length > 0 ? 
            performanceDataWithEvidence
              .filter(item => item.evidence && item.evidence.length > 0)
              .map((item, index) => `
                <div class="performance-evidence">
                  <h4>${index + 1}. ${item.title}</h4>
                  <div class="evidence-list">
                    ${item.evidence.map((evidence, evidenceIndex) => {
                      const fileKey = `${item.id}_${evidenceIndex}`;
                      const files = uploadedFiles[fileKey] || [];
                      return `
                        <div class="evidence-item">
                          <div class="evidence-name">${evidence.name}</div>
                          <div class="evidence-status ${evidence.available ? 'evidence-available' : 'evidence-unavailable'}">
                            ${evidence.available ? 'متوفر' : 'غير متوفر'}
                          </div>
                          ${files.length > 0 ? `
                            <div class="evidence-files">
                              <strong>الملفات المرفقة:</strong>
                              ${files.map(file => `
                                <div class="file-item">
                                  <span class="file-icon">📎</span>
                                  <div class="file-info">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-details">${file.size} • ${file.type} • ${file.date}</div>
                                  </div>
                                </div>
                              `).join('')}
                            </div>
                          ` : '<div class="evidence-files"><em>لا توجد ملفات مرفقة</em></div>'}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('') : 
            '<div class="performance-evidence"><p>لا توجد شواهد مرفقة حالياً</p></div>'
          }
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام تقييم الأداء المهني</p>
          <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  const handleExportReport = () => {
    Alert.alert(
      'تصدير التقرير',
      'اختر تنسيق التصدير:',
      [
        {
          text: 'PDF',
          onPress: exportToPDF
        },
        {
          text: 'HTML',
          onPress: exportToHTML
        },
        {
          text: 'نص عادي',
          onPress: exportToText
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

  const exportToPDF = async () => {
    try {
      const htmlContent = await generateReportHTML();
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf'
        });
      } else {
        const pdfName = `تقرير_الأداء_${new Date().toISOString().split('T')[0]}.pdf`;
        const pdfUri = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({
          from: uri,
          to: pdfUri
        });
        await Sharing.shareAsync(pdfUri);
      }

      Alert.alert('تم بنجاح', 'تم تصدير التقرير كملف PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('خطأ', 'فشل في تصدير التقرير كملف PDF');
    }
  };

  const exportToHTML = async () => {
    try {
      const htmlContent = await generateReportHTML();
      const fileName = `تقرير_الأداء_${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, htmlContent);
      await Sharing.shareAsync(fileUri);

      Alert.alert('تم بنجاح', 'تم تصدير التقرير كملف HTML');
    } catch (error) {
      console.error('Error exporting HTML:', error);
      Alert.alert('خطأ', 'فشل في تصدير التقرير كملف HTML');
    }
  };

  const exportToText = async () => {
    try {
      const averageScore = calculateOverallAverage();
      const categories = getCategories();

      // تحميل البيانات الشخصية والمهنية
      let userData = {
        fullName: 'غير محدد',
        specialty: 'غير محدد',
        experience: 'غير محدد',
        education: 'غير محدد',
        school: 'غير محدد',
        educationDepartment: 'غير محدد',
        gradeLevel: 'غير محدد',
        vision: 'غير محدد',
        mission: 'غير محدد',
        email: 'غير محدد',
        phone: 'غير محدد'
      };

      // تحميل الشواهد المرفقة
      let uploadedFiles = {};
      let performanceDataWithEvidence = [];

      try {
        const storedData = await AsyncStorage.getItem('basicData');
        if (storedData) {
          userData = { ...userData, ...JSON.parse(storedData) };
        }

        // تحميل بيانات الأداء مع الشواهد
        const storedPerformanceData = await AsyncStorage.getItem('performanceData');
        if (storedPerformanceData) {
          performanceDataWithEvidence = JSON.parse(storedPerformanceData);
        }

        // تحميل الملفات المرفقة
        const storedFiles = await AsyncStorage.getItem('uploadedFiles');
        if (storedFiles) {
          uploadedFiles = JSON.parse(storedFiles);
        }
      } catch (error) {
        console.log('Error loading data for text export:', error);
      }

      const textContent = `
📊 التقرير التفاعلي للأداء المهني
========================================

🇸🇦 المملكة العربية السعودية - وزارة التعليم

تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}

👤 البيانات الشخصية والمهنية:
========================================
الاسم الكامل: ${userData.fullName}
التخصص: ${userData.specialty}
سنوات الخبرة: ${userData.experience}
المؤهل العلمي: ${userData.education}
المدرسة: ${userData.school}
الإدارة التعليمية: ${userData.educationDepartment}
المرحلة الدراسية: ${userData.gradeLevel}
البريد الإلكتروني: ${userData.email}
رقم الهاتف: ${userData.phone}



📈 ملخص الأداء العام:
- المتوسط العام: ${averageScore}%
- مستوى الأداء: ${getScoreLevel(averageScore)}

📊 الإحصائيات التفصيلية:
- أعلى درجة: ${Math.max(...performanceData.map(item => item.score), 0)}%
- أقل درجة: ${Math.min(...performanceData.map(item => item.score), 0)}%
- محاور ممتازة: ${performanceData.filter(item => item.score >= 90).length}
- محاور جيدة: ${performanceData.filter(item => item.score >= 80 && item.score < 90).length}
- تحتاج تحسين: ${performanceData.filter(item => item.score < 70).length}

📋 متوسط الدرجات حسب الفئة:
${categories.map(cat => `- ${cat.name}: ${cat.average}%`).join('\n')}

📝 تفاصيل جميع المحاور:
${performanceData
  .sort((a, b) => b.score - a.score)
  .map((item, index) => `${index + 1}. ${item.title}: ${item.score}%`)
  .join('\n')}

💡 توصيات للتحسين:
${performanceData
  .filter(item => item.score < 85)
  .sort((a, b) => a.score - b.score)
  .slice(0, 3)
  .map(item => `• ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.score}%)`)
  .join('\n')}

${performanceData.filter(item => item.score < 85).length === 0 ? 
  '• ممتاز! جميع المحاور تحصل على درجات عالية. استمر في الأداء المتميز.' : ''}

📎 الشواهد المرفقة:
========================================
${performanceDataWithEvidence.length > 0 ? 
  performanceDataWithEvidence
    .filter(item => item.evidence && item.evidence.length > 0)
    .map((item, index) => `
${index + 1}. ${item.title}:
${item.evidence.map((evidence, evidenceIndex) => {
  const fileKey = `${item.id}_${evidenceIndex}`;
  const files = uploadedFiles[fileKey] || [];
  return `
  - ${evidence.name} (${evidence.available ? 'متوفر' : 'غير متوفر'})
    ${files.length > 0 ? 
      files.map(file => `    📎 ${file.name} (${file.size}, ${file.type}, ${file.date})`).join('\n') : 
      '    لا توجد ملفات مرفقة'
    }`;
}).join('\n')}`
    ).join('\n\n') : 
  'لا توجد شواهد مرفقة حالياً'
}

========================================
تم إنشاء هذا التقرير تلقائياً بواسطة نظام تقييم الأداء المهني
© ${new Date().getFullYear()} - جميع الحقوق محفوظة
      `;

      const fileName = `تقرير_الأداء_${new Date().toISOString().split('T')[0]}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, textContent);
      await Sharing.shareAsync(fileUri);

      Alert.alert('تم بنجاح', 'تم تصدير التقرير كملف نصي');
    } catch (error) {
      console.error('Error exporting text:', error);
      Alert.alert('خطأ', 'فشل في تصدير التقرير كملف نصي');
    }
  };

  const handlePrintReport = async () => {
    try {
      const htmlContent = await generateReportHTML();

      if (Platform.OS === 'ios') {
        await Print.printAsync({
          html: htmlContent,
          printerUrl: undefined, // يستخدم الطابعة الافتراضية
        });
      } else {
        // في الأندرويد، نعرض معاينة الطباعة
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false
        });

        Alert.alert(
          'طباعة التقرير',
          'تم إنشاء ملف PDF للطباعة',
          [
            {
              text: 'مشاركة للطباعة',
              onPress: async () => {
                await Sharing.shareAsync(uri, {
                  UTI: '.pdf',
                  mimeType: 'application/pdf'
                });
              }
            },
            {
              text: 'طباعة مباشرة',
              onPress: async () => {
                await Print.printAsync({
                  uri: uri
                });
              }
            },
            {
              text: 'إلغاء',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('خطأ', 'فشل في طباعة التقرير');
    }
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
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'ios' ? 'transparent' : '#E8F5F4'} 
        translucent={Platform.OS === 'ios'}
      />
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={true}
            indicatorStyle="black"
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                التقرير التفاعلي
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                تحليل شامل لأداءك المهني مع مؤشرات تفاعلية
              </ThemedText>
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
                  style={[styles.selectorButton, selectedChart === 'statistics' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('statistics')}
                >
                  <IconSymbol size={16} name="chart.pie.fill" color={selectedChart === 'statistics' ? '#fff' : '#666'} />
                  <ThemedText style={[styles.selectorButtonText, selectedChart === 'statistics' && styles.activeSelectorButtonText]}>
                    الإحصائيات
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectorButton, selectedChart === 'overall' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('overall')}
                >
                  <IconSymbol size={16} name="list.bullet" color={selectedChart === 'overall' ? '#fff' : '#666'} />
                  <ThemedText style={[styles.selectorButtonText, selectedChart === 'overall' && styles.activeSelectorButtonText]}>
                    الترتيب
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectorButton, selectedChart === 'categories' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('categories')}
                >
                  <IconSymbol size={16} name="chart.bar.fill" color={selectedChart === 'categories' ? '#fff' : '#666'} />
                  <ThemedText style={[styles.selectorButtonText, selectedChart === 'categories' && styles.activeSelectorButtonText]}>
                    الفئة
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
                        • ركز على تحسين &quot;{item.title}&quot; (الدرجة الحالية: {item.score}%)
                      </ThemedText>
                    </ThemedView>
                  ))}
                {performanceData.filter(item => item.score < 85).length === 0 && (
                  <ThemedView key="no-improvements-needed" style={styles.recommendationItem}>
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
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
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
  scrollContainer: {
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
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 2,
  },
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 120,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(173, 212, 206, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(173, 212, 206, 0.3)',
    minHeight: 80,
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 36,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    lineHeight: 20,
  },
  chartSelector: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 10,
  },
  selectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeSelectorButton: {
    backgroundColor: '#add4ce',
    borderColor: '#add4ce',
  },
  selectorButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  activeSelectorButtonText: {
    color: '#1c1f33',
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    alignItems: 'center',
  },
  horizontalScrollContainer: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  colorLegend: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  legendText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 15,
  },
  pieLegendContainer: {
    marginTop: 20,
    width: '100%',
  },
  pieLegendItem: {
    marginBottom: 15,
  },
  pieLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pieColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pieInfo: {
    flex: 1,
  },
  pieLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 4,
  },
  pieDetails: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 2,
  },
  pieAverage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 15,
  },
  progressRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    minWidth: 60,
    height: 60,
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    backgroundColor: '#add4ce',
    borderRadius: 30,
    lineHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    fontWeight: '500',
  },
  progressScore: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(173, 212, 206, 0.1)',
    borderRadius: 10,
    alignSelf: 'center',
  },
  progressBarWrapper: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#add4ce',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  recommendationsCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 15,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    backgroundColor: 'rgba(173, 212, 206, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#add4ce',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
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
    textDirection: 'rtl',
    textAlign: 'center',
  },
  statisticsContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 15,
  },
  // أنماط التمثيل البصري الجديد
  visualRepresentation: {
    gap: 12,
  },
  visualItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#add4ce',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    lineHeight: 18,
  },
  scoreContainer: {
    minWidth: 50,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
});
