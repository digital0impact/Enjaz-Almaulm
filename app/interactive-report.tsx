import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { commonStyles } from '@/styles/common-styles';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

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
          <ThemedView style={[styles.statCard, { backgroundColor: 'rgba(232, 245, 232, 0.7)' }]}>
            <IconSymbol size={24} name="chart.bar.fill" color="#4CAF50" />
            <ThemedText style={styles.statValue}>{averageScore}%</ThemedText>
            <ThemedText style={styles.statLabel}>المتوسط العام</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: 'rgba(227, 242, 253, 0.7)' }]}>
            <IconSymbol size={24} name="arrow.up.circle.fill" color="#2196F3" />
            <ThemedText style={styles.statValue}>{maxScore}%</ThemedText>
            <ThemedText style={styles.statLabel}>أعلى درجة</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: 'rgba(255, 243, 224, 0.7)' }]}>
            <IconSymbol size={24} name="arrow.down.circle.fill" color="#FF9800" />
            <ThemedText style={styles.statValue}>{minScore}%</ThemedText>
            <ThemedText style={styles.statLabel}>أقل درجة</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: 'rgba(243, 229, 245, 0.7)' }]}>
            <IconSymbol size={24} name="star.fill" color="#9C27B0" />
            <ThemedText style={styles.statValue}>{excellentCount}</ThemedText>
            <ThemedText style={styles.statLabel}>محاور ممتازة</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: 'rgba(232, 245, 232, 0.7)' }]}>
            <IconSymbol size={24} name="checkmark.circle.fill" color="#4CAF50" />
            <ThemedText style={styles.statValue}>{goodCount}</ThemedText>
            <ThemedText style={styles.statLabel}>محاور جيدة</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: needsImprovementCount > 0 ? 'rgba(255, 235, 238, 0.7)' : 'rgba(232, 245, 232, 0.7)' }]}>
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

    try {
      const storedData = await AsyncStorage.getItem('basicData');
      if (storedData) {
        userData = { ...userData, ...JSON.parse(storedData) };
      }
    } catch (error) {
      console.log('Error loading user data for report:', error);
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

      try {
        const storedData = await AsyncStorage.getItem('basicData');
        if (storedData) {
          userData = { ...userData, ...JSON.parse(storedData) };
        }
      } catch (error) {
        console.log('Error loading user data for text export:', error);
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

          <ScrollView 
              style={styles.content}
              contentContainerStyle={{ flexGrow: 1, ...commonStyles.scrollViewWithBottomNav }}
            >
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 248, 225, 0.3)',
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