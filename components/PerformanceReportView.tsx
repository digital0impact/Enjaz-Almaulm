import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Platform, Dimensions, View, ActivityIndicator, Linking, Modal } from 'react-native';
import { AlertService } from '@/services/AlertService';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAchievementsShareLink } from '@/hooks/useAchievementsShareLink';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { getTextDirection, formatRTLText, isRTL } from '@/utils/rtl-utils';
import { calculateOverallAverageFivePoint } from '@/utils/performance-five-point';
import { getPerformanceAxesByProfession } from '@/constants/performance-axes';
import { supabase } from '@/config/supabase';

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
  evidence?: Evidence[];
};

/** تعليق زائر تُرك على رابط التقرير العام (shared_achievement_comments). */
type VisitorComment = {
  id: string;
  author_name: string | null;
  comment_text: string;
  created_at: string;
};

export function PerformanceReportView() {
  const router = useRouter();
  const [performanceData, setPerformanceData] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  /** تحميل Word على الويب: عرض نافذة تحتوي على رابط التحميل */
  const [wordDownload, setWordDownload] = useState<{ url: string; name: string } | null>(null);
  /** توليد رابط مشاركة التقرير ومشاركته مباشرة عبر شاشة المشاركة الأصلية للجهاز، بلا أي صفحة أو نافذة وسيطة. */
  const { generating: isGeneratingShareLink, generateAndShare: handleShareAchievements } = useAchievementsShareLink();
  /** تعليقات الزوار على رابط التقرير العام (shared_achievement_comments)، تُعرض هنا لتصل للمعلم دون زيارة الرابط نفسه. */
  const [visitorComments, setVisitorComments] = useState<VisitorComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  // إضافة مستمع للتركيز على الصفحة باستخدام useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      // إعادة تحميل البيانات عند العودة إلى الصفحة
      loadPerformanceData();
      loadVisitorComments();
    }, [])
  );

  const loadVisitorComments = async () => {
    setLoadingComments(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setVisitorComments([]);
        return;
      }
      const { data, error } = await supabase
        .from('shared_achievement_comments')
        .select('id, author_name, comment_text, created_at')
        .eq('token', `public-${user.id}`)
        .order('created_at', { ascending: false });
      if (!error && data) setVisitorComments(data as VisitorComment[]);
    } catch (e) {
      console.warn('Could not load visitor comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  // تحميل البيانات الفعلية من AsyncStorage
  useEffect(() => {
    loadPerformanceData();
  }, []);

  // إضافة مستمع لتغيير المهنة
  useEffect(() => {
    const checkProfessionChange = async () => {
      try {
        const basicData = await AsyncStorage.getItem('basicData');
        if (basicData) {
          const parsedBasicData = JSON.parse(basicData);
          const currentProfession = parsedBasicData.profession || 'معلم/ة';
          
          // التحقق من تغيير المهنة وإعادة تحميل البيانات إذا لزم الأمر
          const currentProfessionData = getDefaultPerformanceData(currentProfession);
          if (performanceData.length !== currentProfessionData.length) {
            console.log('Profession changed, reloading data...');
            loadPerformanceData();
          }
        }
      } catch (error) {
        console.log('Error checking profession change:', error);
      }
    };

    // فحص تغيير المهنة كل 3 ثانية (تقليل التكرار)
    const interval = setInterval(checkProfessionChange, 3000);
    return () => clearInterval(interval);
  }, [performanceData.length]);

  const loadPerformanceData = async () => {
    try {
      // تحميل البيانات الأساسية للحصول على المهنة
      const basicData = await AsyncStorage.getItem('basicData');
      let profession = 'معلم/ة';
      if (basicData) {
        const parsedBasicData = JSON.parse(basicData);
        profession = parsedBasicData.profession || 'معلم/ة';
      }

      // تحميل بيانات الأداء
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // التحقق من أن البيانات المحفوظة تتطابق مع المهنة الحالية
        const currentProfessionData = getDefaultPerformanceData(profession);
        
        if (Array.isArray(parsedData) && parsedData.length === currentProfessionData.length) {
          // إذا كانت البيانات المحفوظة تتطابق مع المهنة الحالية — نوفّق
          // الشواهد داخل كل محور مع القالب الحالي (انظر التوثيق أعلى الدالة)
          const reconciled = reconcileEvidenceWithTemplate(parsedData, currentProfessionData);
          setPerformanceData(reconciled);
          await AsyncStorage.setItem('performanceData', JSON.stringify(reconciled));
          console.log('Loaded performanceData from AsyncStorage:', reconciled);
        } else {
          // إذا تغيرت المهنة أو كانت البيانات غير متطابقة، استخدم البيانات الجديدة
          setPerformanceData(currentProfessionData);
          console.log('Profession changed or data mismatch, using new profession data');
          // حفظ البيانات الجديدة
          await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
        }
      } else {
        // إذا لم تكن هناك بيانات محفوظة، استخدم البيانات حسب المهنة
        setPerformanceData(currentProfessionData);
        console.log('No data in AsyncStorage, using default data for profession:', profession);
        // حفظ البيانات الجديدة
        await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
      }

      setLoading(false);
    } catch (error) {
      console.log('Error loading performance data:', error);
      const fallbackData = getDefaultPerformanceData('معلم/ة');
      setPerformanceData(fallbackData);
      // حفظ البيانات الافتراضية في حالة الخطأ
      try {
        await AsyncStorage.setItem('performanceData', JSON.stringify(fallbackData));
      } catch (saveError) {
        console.log('Error saving fallback data:', saveError);
      }
      setLoading(false);
    }
  };

  const getDefaultPerformanceData = (profession: string): PerformanceItem[] => {
    // هيكل المحاور (البيانات المشتركة من constants/performance-axes.ts) — الدرجات الحقيقية تُحمّل من AsyncStorage من صفحة الأداء المهني
    return getPerformanceAxesByProfession(profession).map((axis) => ({
      id: axis.id,
      title: axis.title,
      score: axis.score,
      weight: axis.weight,
      evidence: axis.evidence,
    }));
  };

  /**
   * توفيق شواهد البيانات المحفوظة مع القالب الحالي لكل محور — نفس المنطق
   * المستخدم في app/(tabs)/performance.tsx، حتى ينعكس تعديل القالب (حذف/
   * إضافة شاهد) هنا أيضًا (شاشة "التقرير الكامل") لا في شاشة البطاقات فقط.
   * تُستبقى حالة "متوفر" للشواهد التي بقي اسمها في القالب، وتُستبعد تلقائيًا
   * أي شواهد محفوظة لم تعد موجودة فيه.
   */
  const reconcileEvidenceWithTemplate = (stored: any[], template: PerformanceItem[]): PerformanceItem[] => {
    return template.map((templateAxis, axisIndex) => {
      const storedAxis = stored[axisIndex];
      const storedEvidenceByName = new Map<string, any>(
        (storedAxis?.evidence || []).map((ev: any) => [ev?.name, ev])
      );
      const evidence = (templateAxis.evidence || []).map(templateEv => {
        const storedEv = storedEvidenceByName.get(templateEv.name);
        return {
          name: templateEv.name,
          available: storedEv && typeof storedEv.available === 'boolean' ? storedEv.available : false,
        };
      });
      return {
        ...templateAxis,
        score: typeof storedAxis?.score === 'number' ? storedAxis.score : templateAxis.score,
        evidence,
      };
    });
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
    if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) return 0;
    const items = performanceData.map(item => ({ score: item?.score ?? 0, weight: item?.weight ?? 0 }));
    const hasAnyScore = items.some(item => item.score > 0);
    if (!hasAnyScore) return 0;
    return calculateOverallAverageFivePoint(items);
  };

  type FileInfo = {
    name: string;
    size: string;
    type: string;
    date: string;
  };

  /** الشكل الفعلي المخزَّن في AsyncStorage('uploadedFiles') من
   * app/(tabs)/performance.tsx: كائن ملف واحد لكل مفتاح (لا مصفوفة). */
  type UploadedFiles = {
    [key: string]: FileInfo;
  };

  type Category = {
    name: string;
    average: number;
    count: number;
  };

  const getCategories = (): Category[] => {
    if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) {
      return [];
    }
    
    // استخدام عناوين المحاور بدلاً من الفئات
    return performanceData.map(item => ({
      name: item?.title || 'غير محدد',
      average: item?.score || 0,
      count: 1
    })).filter(cat => cat && cat.name);
  };

  const renderProgressChart = () => {
    const sortedData = [...performanceData].sort((a: PerformanceItem, b: PerformanceItem) => b.score - a.score);
    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>ترتيب المحاور حسب الأداء</ThemedText>
        <ThemedView>
          {sortedData.map((item: PerformanceItem, index: number) => (
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


  const CATEGORY_PIE_COLORS = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#00BCD4', '#8BC34A', '#FFC107', '#3F51B5', '#E91E63', '#795548',
  ];

  const renderCategoriesChart = () => {
    const categories = getCategories();

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

    const pieData = validCategories.map((cat, index) => {
      const name = String(cat.name || 'غير محدد');
      return {
        name: name.length > 12 ? name.substring(0, 12) + '…' : name,
        score: Math.max(0, cat.average || 0),
        color: CATEGORY_PIE_COLORS[index % CATEGORY_PIE_COLORS.length],
        legendFontColor: '#1c1f33',
        legendFontSize: 11,
      };
    });

    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>
        <PieChart
          data={pieData}
          width={Dimensions.get('window').width - 80}
          height={220}
          chartConfig={{ color: (opacity = 1) => `rgba(28, 31, 51, ${opacity})` }}
          accessor="score"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute={false}
          avoidFalseZero
          hasLegend
          style={{ marginVertical: 10 }}
        />
      </ThemedView>
    );
  };

  const renderDashboard = () => {
    const overallAverage = calculateOverallAverage();
    const sortedByScore = [...performanceData].sort((a, b) => b.score - a.score);
    const strongest = sortedByScore.slice(0, 3);
    const weakest = [...sortedByScore].reverse().slice(0, 3);

    return (
      <ThemedView style={styles.dashboardCard}>
        <ThemedText type="subtitle" style={styles.summaryTitle}>لوحة القيادة</ThemedText>

        {/* متوسط الجودة العام */}
        <ThemedView style={styles.dashboardOverallRow}>
          <ThemedText style={[styles.dashboardOverallValue, { color: getScoreColor(overallAverage) }]}>
            {overallAverage}%
          </ThemedText>
          <ThemedText style={styles.dashboardOverallLabel}>
            {formatRTLText(`متوسط الجودة العام — ${getScoreLevel(overallAverage)}`)}
          </ThemedText>
        </ThemedView>

        {/* أقوى وأضعف ثلاثة محاور */}
        <ThemedView style={styles.dashboardTopBottomRow}>
          <ThemedView style={styles.dashboardMiniList}>
            <ThemedText style={styles.dashboardMiniListTitle}>🏆 أقوى 3 محاور</ThemedText>
            {strongest.map((item, i) => (
              <ThemedView key={item.id} style={styles.dashboardMiniRow}>
                <ThemedText style={styles.dashboardMiniRank}>{i + 1}</ThemedText>
                <ThemedText style={styles.dashboardMiniName} numberOfLines={1}>{item.title}</ThemedText>
                <ThemedText style={[styles.dashboardMiniScore, { color: getScoreColor(item.score) }]}>{item.score}%</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
          <ThemedView style={styles.dashboardMiniList}>
            <ThemedText style={styles.dashboardMiniListTitle}>⚠️ أضعف 3 محاور</ThemedText>
            {weakest.map((item, i) => (
              <ThemedView key={item.id} style={styles.dashboardMiniRow}>
                <ThemedText style={styles.dashboardMiniRank}>{i + 1}</ThemedText>
                <ThemedText style={styles.dashboardMiniName} numberOfLines={1}>{item.title}</ThemedText>
                <ThemedText style={[styles.dashboardMiniScore, { color: getScoreColor(item.score) }]}>{item.score}%</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        {/* درجة كل محور */}
        {renderProgressChart()}

        {/* رسم بياني تشخيصي مبسط */}
        {renderCategoriesChart()}
      </ThemedView>
    );
  };

  type ReportData = {
    performanceId: number;
    evidenceIndex: number;
    evidence: Evidence[];
    files: FileInfo[];
  };

  type ReportItem = {
    id: number;
    title: string;
    score: number;
    weight: number;
    evidence: Evidence[];
    /** موجود فعليًا في البيانات المحفوظة (تأتي أصلاً من PerformanceAxis عبر
     * app/(tabs)/performance.tsx) وإن لم يكن جزءًا من الشكل المصغَّر الذي
     * تبنيه getDefaultPerformanceData هنا؛ يُستخدم في التقرير المصدَّر. */
    description?: string;
  };

  const generateReportHTML = async () => {
    // تحميل شعار الوزارة للتقرير المصدر (PDF/HTML) فقط — من ملف moe_logo.png المحلي
    let logoDataUri = '';
    try {
      const Asset = require('expo-asset').Asset;
      const asset = Asset.fromModule(require('@/assets/images/moe_logo.png'));
      await asset.downloadAsync();

      if (Platform.OS === 'web') {
        // على الويب: asset.uri يكون رابط الصورة المُضمّنة، نحمّلها ونحوّلها إلى data URI
        const uri = asset.uri ?? (asset as any).localUri;
        if (uri) {
          const url = typeof uri === 'string' && uri.startsWith('/') ? `${typeof window !== 'undefined' ? window.location.origin : ''}${uri}` : uri;
          const res = await fetch(url);
          const blob = await res.blob();
          logoDataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } else {
        if (asset.localUri) {
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
          if (base64) logoDataUri = `data:image/png;base64,${base64}`;
        }
      }
    } catch (e) {
      // إن لم يوجد الملف أو فشل التحميل، يُترك الشعار فارغاً في التقرير المصدر
      if (__DEV__ && typeof console !== 'undefined') console.warn('تحميل شعار الوزارة للتقرير:', e);
    }

    // تحميل البيانات الشخصية والمهنية
    let userData = {
      fullName: 'غير محدد',
      profession: 'غير محدد',
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
    let uploadedFiles: UploadedFiles = {};
    let performanceDataWithEvidence: ReportItem[] = [];

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

    // استخدام البيانات المحفوظة فعلياً للإحصائيات والتوصيات في التقرير المصدر
    const reportData = Array.isArray(performanceDataWithEvidence) && performanceDataWithEvidence.length > 0
      ? performanceDataWithEvidence
      : performanceData;
    const reportScores = reportData.map((item: { score?: number }) => Number(item?.score ?? 0));
    const reportItems = reportData.map((item: ReportItem) => ({
      ...item,
      score: Number(item?.score ?? 0),
    }));
    const hasAnyScore = reportItems.some(item => item.score > 0);
    const reportAverageScore = hasAnyScore
      ? calculateOverallAverageFivePoint(reportItems.map(item => ({ score: item.score, weight: item?.weight ?? 0 })))
      : 0;
    const maxScore = Math.max(...reportScores, 0);
    const minScore = reportScores.length ? Math.min(...reportScores) : 0;
    const excellentCount = reportScores.filter(s => s >= 90).length;
    const goodCount = reportScores.filter(s => s >= 80 && s < 90).length;
    const needsImprovementCount = reportScores.filter(s => s < 70).length;
    const needsImprovementItems = reportItems
      .filter(item => item.score < 85)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ملف إنجاز الأداء الوظيفي</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          color: #333;
          background: #f5f7fa;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .top-banner {
          background: linear-gradient(135deg, #14b8a6 0%, #2563eb 100%);
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }
        .top-banner .logo {
          width: 56px;
          height: 56px;
          object-fit: contain;
          background: white;
          border-radius: 10px;
          padding: 6px;
        }
        .top-banner .ministry-text {
          text-align: right;
        }
        .top-banner .ministry-text h2 {
          margin: 0;
          font-size: 18px;
        }
        .top-banner .ministry-text p {
          margin: 4px 0 0 0;
          font-size: 13px;
          opacity: 0.9;
        }
        .title-pill-wrap {
          padding: 20px 30px 0 30px;
          text-align: center;
        }
        .title-pill {
          display: inline-block;
          background: #14532d;
          color: white;
          font-size: 20px;
          font-weight: bold;
          padding: 12px 30px;
          border-radius: 30px;
        }
        .content {
          padding: 20px 30px 30px 30px;
        }
        .section-card {
          background: white;
          border: 1px solid #E5E5EA;
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section-title {
          color: #1c1f33;
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 15px 0;
          text-align: center;
          border-bottom: 2px solid #1c1f33;
          padding-bottom: 10px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-table tr:nth-child(even) { background: #f8f9fa; }
        .info-table td {
          padding: 10px 12px;
          font-size: 14px;
          border-bottom: 1px solid #eee;
        }
        .info-table td.label {
          font-weight: bold;
          color: #555;
          width: 40%;
        }
        .info-table td.value {
          color: #1c1f33;
        }
        .summary-row {
          display: flex;
          justify-content: space-around;
          text-align: center;
          margin-bottom: 10px;
        }
        .summary-value {
          font-size: 30px;
          font-weight: bold;
        }
        .summary-label {
          font-size: 13px;
          color: #666;
          margin-top: 4px;
        }
        .badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }
        .badge-card {
          border: 1px solid #e8b64c;
          border-radius: 10px;
          padding: 10px 12px;
          text-align: center;
          background: #fffdf5;
        }
        .badge-card .badge-value {
          font-size: 18px;
          font-weight: bold;
        }
        .badge-card .badge-label {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .axis-section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        .axis-banner {
          background: #14532d;
          color: white;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          padding: 10px 16px;
          border-radius: 10px 10px 0 0;
        }
        .axis-body {
          border: 1px solid #E5E5EA;
          border-top: none;
          border-radius: 0 0 12px 12px;
          padding: 16px;
        }
        .axis-subtitle {
          font-size: 13px;
          color: #666;
          text-align: center;
          margin: 0 0 14px 0;
        }
        .evidence-banner {
          background: #0f6e5c;
          color: white;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 16px 0 12px 0;
        }
        .evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }
        .evidence-card {
          border: 1px solid #e1f5f4;
          border-radius: 8px;
          padding: 10px 12px;
          background: #f8fffe;
        }
        .evidence-card .evidence-name {
          font-weight: bold;
          color: #1c1f33;
          font-size: 13px;
          margin-bottom: 6px;
        }
        .evidence-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: bold;
        }
        .evidence-available { background: #4CAF50; color: white; }
        .evidence-unavailable { background: #9E9E9E; color: white; }
        .evidence-file {
          margin-top: 6px;
          font-size: 11px;
          color: #1976d2;
        }
        .no-evidence {
          text-align: center;
          color: #999;
          font-size: 13px;
          padding: 10px 0;
        }
        .recommendations {
          background: #fff8e1;
          border-right: 5px solid #ff9800;
        }
        .recommendation-item {
          margin-bottom: 8px;
          padding: 10px;
          background: rgba(255, 152, 0, 0.1);
          border-radius: 8px;
          font-size: 14px;
        }
        .signature-section {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }
        .signature-box {
          border: 1px solid #E5E5EA;
          border-radius: 12px;
          padding: 16px 40px;
          text-align: center;
          min-width: 220px;
        }
        .signature-box .signature-label {
          font-weight: bold;
          color: #1c1f33;
          border-bottom: 1px solid #ccc;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .signature-box .signature-value {
          color: #14532d;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 16px;
          border-top: 2px solid #eee;
          color: #999;
          font-size: 12px;
        }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="top-banner">
          <div class="ministry-text">
            <h2>وزارة التعليم</h2>
            <p>${userData.school}</p>
          </div>
          ${logoDataUri ? `<img src="${logoDataUri}" alt="شعار وزارة التعليم" class="logo">` : ''}
        </div>

        <div class="title-pill-wrap">
          <span class="title-pill">ملف إنجاز الأداء الوظيفي</span>
        </div>

        <div class="content">
          <div class="section-card">
            <h3 class="section-title">البيانات الشخصية والمهنية</h3>
            <table class="info-table">
              <tr><td class="label">الاسم الكامل</td><td class="value">${userData.fullName}</td></tr>
              <tr><td class="label">المهنة</td><td class="value">${userData.profession}</td></tr>
              <tr><td class="label">التخصص</td><td class="value">${userData.specialty}</td></tr>
              <tr><td class="label">سنوات الخبرة</td><td class="value">${userData.experience}</td></tr>
              <tr><td class="label">المؤهل العلمي</td><td class="value">${userData.education}</td></tr>
              <tr><td class="label">المدرسة</td><td class="value">${userData.school}</td></tr>
              <tr><td class="label">الإدارة التعليمية</td><td class="value">${userData.educationDepartment}</td></tr>
              <tr><td class="label">المرحلة الدراسية</td><td class="value">${userData.gradeLevel}</td></tr>
              <tr><td class="label">البريد الإلكتروني</td><td class="value">${userData.email}</td></tr>
              <tr><td class="label">رقم الهاتف</td><td class="value">${userData.phone}</td></tr>
              <tr><td class="label">تاريخ التقرير</td><td class="value">${new Date().toLocaleDateString('ar-SA')}</td></tr>
            </table>
          </div>

          <div class="section-card">
            <h3 class="section-title">ملخص الأداء العام</h3>
            <div class="summary-row">
              <div>
                <div class="summary-value" style="color: ${getScoreColor(reportAverageScore)}">${reportAverageScore}%</div>
                <div class="summary-label">المتوسط العام</div>
              </div>
              <div>
                <div class="summary-value" style="color: ${getScoreColor(reportAverageScore)}">${getScoreLevel(reportAverageScore)}</div>
                <div class="summary-label">مستوى الأداء</div>
              </div>
            </div>
            <div class="badge-grid">
              <div class="badge-card"><div class="badge-value">${maxScore}%</div><div class="badge-label">أعلى درجة</div></div>
              <div class="badge-card"><div class="badge-value">${minScore}%</div><div class="badge-label">أقل درجة</div></div>
              <div class="badge-card"><div class="badge-value">${excellentCount}</div><div class="badge-label">محاور ممتازة</div></div>
              <div class="badge-card"><div class="badge-value">${goodCount}</div><div class="badge-label">محاور جيدة</div></div>
              <div class="badge-card"><div class="badge-value">${needsImprovementCount}</div><div class="badge-label">تحتاج تحسين</div></div>
            </div>
          </div>

          <div class="page-break"></div>

          ${reportItems.map((item, index) => `
            <div class="axis-section">
              <div class="axis-banner">${index + 1}. ${item.title}</div>
              <div class="axis-body">
                ${item.description ? `<p class="axis-subtitle">${item.description}</p>` : ''}
                <div class="badge-grid">
                  <div class="badge-card"><div class="badge-value">${item.weight}%</div><div class="badge-label">الوزن</div></div>
                  <div class="badge-card"><div class="badge-value" style="color: ${getScoreColor(item.score)}">${item.score}%</div><div class="badge-label">الدرجة</div></div>
                  <div class="badge-card"><div class="badge-value" style="color: ${getScoreColor(item.score)}">${getScoreLevel(item.score)}</div><div class="badge-label">المستوى</div></div>
                </div>
                ${item.evidence && item.evidence.length > 0 ? `
                  <div class="evidence-banner">شواهد المحور</div>
                  <div class="evidence-grid">
                    ${item.evidence.map((evidence: Evidence, evidenceIndex: number) => {
                      const fileKey = `${item.id}-${evidenceIndex}`;
                      const file = uploadedFiles[fileKey];
                      return `
                        <div class="evidence-card">
                          <div class="evidence-name">${evidence.name}</div>
                          <span class="evidence-status ${evidence.available ? 'evidence-available' : 'evidence-unavailable'}">
                            ${evidence.available ? 'متوفر' : 'غير متوفر'}
                          </span>
                          ${file ? `<div class="evidence-file">📎 ${file.name}</div>` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : '<div class="no-evidence">لا توجد شواهد محددة لهذا المحور.</div>'}
              </div>
            </div>
          `).join('')}

          <div class="section-card recommendations">
            <h3 class="section-title">🔍 توصيات للتحسين</h3>
            ${needsImprovementItems
              .map(item => `
                <div class="recommendation-item">
                  • ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.score}%)
                </div>
              `).join('')}
            ${needsImprovementItems.length === 0 ?
              '<div class="recommendation-item">• ممتاز! جميع المحاور تحصل على درجات عالية. استمر في الأداء المتميز.</div>' : ''}
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">المعلم</div>
              <div class="signature-value">${userData.fullName}</div>
            </div>
          </div>

          <div class="footer">
            <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام تقييم الأداء المهني</p>
            <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  /** على الويب: تحميل التقرير كملف HTML دون الاعتماد على النوافذ المنبثقة */
  const webDownloadReport = (htmlContent: string) => {
    if (typeof document === 'undefined') return;
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_الأداء_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  };

  // على الويب Alert.alert غير مدعوم — نستخدم window.alert/confirm حتى تظهر التنبيهات ونافذة الطباعة
  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: string }>
  ) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert([title, message].filter(Boolean).join('\n\n'));
      const action = buttons?.find((b) => b.onPress);
      if (action && window.confirm(action.text + '؟')) action.onPress?.();
      return;
    }
    AlertService.alert(title, message, buttons);
  };

  const openReportForPrint = async () => {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    try {
      const htmlContent = await generateReportHTML();
      if (isWeb) {
        webDownloadReport(htmlContent);
        showAlert(
          formatRTLText('تم تحميل التقرير'),
          formatRTLText('تم تحميل ملف التقرير. افتح الملف من مجلد التحميلات واختر من المتصفح «طباعة» ثم «حفظ كـ PDF» أو «Print to PDF».')
        );
      } else {
        await exportToPDF();
      }
    } catch (e) {
      console.error('Open report for print:', e);
      showAlert(formatRTLText('خطأ'), formatRTLText('تعذر فتح التقرير.'));
    }
  };

  /** التحقق من تسجيل الدخول والاشتراك قبل التصدير؛ يعيد false مع عرض تنبيه عند الفشل */
  const checkCanExportReport = async (): Promise<boolean> => {
    let user = await AuthService.getCurrentUser();
    if (!user) user = await AuthService.checkAuthStatus();
    if (!user) {
      showAlert(
        formatRTLText('تسجيل الدخول مطلوب'),
        formatRTLText('يرجى تسجيل الدخول مرة أخرى للسماح بتصدير التقرير.'),
        [{ text: formatRTLText('حسناً'), style: 'cancel' as const }]
      );
      return false;
    }
    const status = await SubscriptionService.checkSubscriptionStatus(user.id);
    if (!status?.features?.canExport) {
      showAlert(
        formatRTLText('تنبيه'),
        formatRTLText('لا يمكنك طباعة أو تصدير التقرير إلا بعد الانضمام لإحدى الخطط المدفوعة (الاشتراك السنوي أو النصف سنوي). يرجى ترقية اشتراكك للاستفادة من التصدير والطباعة.'),
        [
          { text: formatRTLText('حسناً'), style: 'cancel' as const },
          { text: formatRTLText('عرض الخطط'), onPress: () => router.push('/subscription') },
        ]
      );
      return false;
    }
    return true;
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    if (!(await checkCanExportReport())) return;
    setIsExporting(true);
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    try {
      if (isWeb) {
        const htmlContent = await generateReportHTML();
        webDownloadReport(htmlContent);
        showAlert(
          formatRTLText('تم تحميل التقرير'),
          formatRTLText('تم تحميل ملف التقرير. افتح الملف من مجلد التحميلات واختر «طباعة» ثم «حفظ كـ PDF» إن رغبت.')
        );
      } else {
        await exportToPDF();
      }
    } catch (err) {
      console.error('Export report PDF error:', err);
      showAlert(
        formatRTLText('خطأ'),
        formatRTLText('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى أو التحقق من الاتصال.'),
        [
          { text: formatRTLText('حسناً'), style: 'cancel' as const },
          { text: formatRTLText('تحميل التقرير'), onPress: () => openReportForPrint() },
        ]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (isExporting) return;
    if (!(await checkCanExportReport())) return;
    setIsExporting(true);
    try {
      await exportToWord();
    } catch (err) {
      console.error('Export report Word error:', err);
      showAlert(
        formatRTLText('خطأ'),
        formatRTLText('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى أو التحقق من الاتصال.')
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = async () => {
    let htmlContent: string;
    try {
      htmlContent = await generateReportHTML();
    } catch (genError) {
      console.error('Error generating report HTML for Word:', genError);
      showAlert(
        formatRTLText('خطأ في إنشاء التقرير'),
        formatRTLText('تعذر إنشاء محتوى التقرير. يرجى المحاولة مرة أخرى أو التأكد من وجود بيانات الأداء.')
      );
      return;
    }
    const fileName = `تقرير_الأداء_${new Date().toISOString().split('T')[0]}.doc`;
    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          showAlert(formatRTLText('تنبيه'), formatRTLText('تصدير Word غير متاح في هذا السياق.'));
          return;
        }
        const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setWordDownload({ url, name: fileName });
        return;
      }
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, '\ufeff' + htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showAlert(formatRTLText('تم إنشاء الملف'), filePath);
        return;
      }
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/msword',
        dialogTitle: formatRTLText('تصدير التقرير Word'),
      });
      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التقرير كملف Word.'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showAlert(
        formatRTLText('فشل التصدير'),
        formatRTLText('تعذر تصدير التقرير كملف Word.') + (msg ? ` (${msg})` : '')
      );
    }
  };

  const closeWordDownload = () => {
    if (wordDownload) {
      URL.revokeObjectURL(wordDownload.url);
      setWordDownload(null);
    }
  };

  const exportToPDF = async () => {
    let htmlContent: string;
    try {
      htmlContent = await generateReportHTML();
    } catch (genError) {
      console.error('Error generating report HTML:', genError);
      showAlert(
        formatRTLText('خطأ في إنشاء التقرير'),
        formatRTLText('تعذر إنشاء محتوى التقرير. يرجى المحاولة مرة أخرى أو التأكد من وجود بيانات الأداء.')
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          showAlert('تنبيه', 'تصدير PDF غير متاح في هذا السياق.');
          return;
        }
        // استخدام iframe في نفس الصفحة بدلاً من نافذة منبثقة لتجنب حظر المتصفح — نافذة الطباعة تفتح مباشرة
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const doPrint = () => {
          try {
            if (iframe.contentWindow) iframe.contentWindow.print();
          } catch (e) {
            console.error('Print error:', e);
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
        iframe.src = url;
        iframe.onload = () => setTimeout(doPrint, 400);
        // احتياطاً إذا تأخر التحميل
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            doPrint();
          }
        }, 3000);
        showAlert(
          formatRTLText('تم فتح نافذة الطباعة'),
          formatRTLText('اختر «حفظ كـ PDF» أو «Save as PDF» في نافذة الطباعة لحفظ الملف.')
        );
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 595,
        height: 842,
      });

      // محاولة فتح الملف في عارض PDF الافتراضي (إن وُجد)
      try {
        const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
        await Linking.openURL(fileUri);
      } catch (_) {
        // تجاهل الفشل — نعرض مشاركة الملف أدناه
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showAlert(
          formatRTLText('تم إنشاء الملف'),
          formatRTLText('تم إنشاء ملف PDF. المسار: ') + uri
        );
        return;
      }

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
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: formatRTLText('حفظ التقرير كـ PDF'),
        });
      }

      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التقرير كملف PDF'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showAlert(
        formatRTLText('فشل التصدير'),
        formatRTLText('فشل في تصدير التقرير كملف PDF. يرجى المحاولة مرة أخرى.') + (msg ? ` (${msg})` : '')
      );
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>جاري تحميل البيانات...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
            <ThemedView style={styles.content}>
              {renderDashboard()}

            <ThemedView style={styles.recommendationsCard}>
                              <ThemedText style={styles.recommendationsTitle}>
                  <IconSymbol size={20} name="lightbulb.fill" color="#FF9800" /> توصيات للتحسين
                </ThemedText>
              <ThemedView style={styles.recommendationsList}>
                {performanceData
                  .map(item => ({ ...item, scoreNum: Number(item?.score ?? 0) }))
                  .filter(item => item.scoreNum < 85)
                  .sort((a, b) => a.scoreNum - b.scoreNum)
                  .slice(0, 3)
                  .map((item) => (
                    <ThemedView key={item.id} style={styles.recommendationItem}>
                      <ThemedText style={styles.recommendationText}>
                        {`• ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.scoreNum}%)`}
                      </ThemedText>
                    </ThemedView>
                  ))}
                {performanceData.filter(item => Number(item?.score ?? 0) < 85).length === 0 && (
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
                onPress={handleShareAchievements}
                disabled={isGeneratingShareLink}
                activeOpacity={0.7}
              >
                {isGeneratingShareLink ? (
                  <ActivityIndicator color="#1c1f33" size="small" />
                ) : (
                  <IconSymbol size={20} name="square.and.arrow.up" color="#1c1f33" />
                )}
                <ThemedText style={styles.buttonText}>
                  {isGeneratingShareLink ? formatRTLText('جارٍ التجهيز...') : formatRTLText('مشاركة التقرير')}
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.exportSectionTitle}>
                {formatRTLText('تصدير التقرير')}
              </ThemedText>
              <View style={styles.exportButtonsRow}>
                <TouchableOpacity 
                  style={[styles.exportButton, styles.exportButtonPdf, isExporting && styles.exportButtonDisabled]}
                  onPress={handleExportPDF}
                  disabled={isExporting}
                  activeOpacity={0.7}
                >
                  {isExporting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <IconSymbol size={20} name="doc.pdf" color="#fff" />
                  )}
                  <ThemedText style={[styles.buttonText, styles.exportOptionButtonText]}>
                    {isExporting ? formatRTLText('جاري التصدير...') : formatRTLText('تصدير PDF')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.exportButton, styles.exportButtonWord, isExporting && styles.exportButtonDisabled]}
                  onPress={handleExportWord}
                  disabled={isExporting}
                  activeOpacity={0.7}
                >
                  {isExporting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <IconSymbol size={20} name="doc.text.fill" color="#fff" />
                  )}
                  <ThemedText style={[styles.buttonText, styles.exportOptionButtonText]}>
                    {formatRTLText('تصدير Word')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>

            <ThemedView style={styles.visitorCommentsCard}>
              <ThemedText style={styles.exportSectionTitle}>
                {formatRTLText('تعليقات الزوار على التقرير')}
              </ThemedText>
              {loadingComments ? (
                <ActivityIndicator color="#1c1f33" style={styles.visitorCommentsLoading} />
              ) : visitorComments.length === 0 ? (
                <ThemedText style={[styles.noVisitorComments, getTextDirection()]}>
                  {formatRTLText('لا توجد تعليقات بعد. تظهر هنا تعليقات الزوار على رابط التقرير الذي تشاركينه.')}
                </ThemedText>
              ) : (
                visitorComments.map((comment) => (
                  <ThemedView key={comment.id} style={styles.visitorCommentItem}>
                    <ThemedText style={[styles.visitorCommentMeta, getTextDirection()]}>
                      {formatRTLText(comment.author_name || 'زائر')} · {new Date(comment.created_at).toLocaleDateString('ar-SA')}
                    </ThemedText>
                    <ThemedText style={[styles.visitorCommentText, getTextDirection()]}>
                      {formatRTLText(comment.comment_text)}
                    </ThemedText>
                  </ThemedView>
                ))
              )}
            </ThemedView>
            </ThemedView>

      <Modal
        visible={!!wordDownload}
        transparent
        animationType="fade"
        onRequestClose={closeWordDownload}
      >
        <View style={styles.wordDownloadOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeWordDownload} />
          <View style={styles.wordDownloadBox}>
            <ThemedText style={[styles.wordDownloadTitle, getTextDirection()]}>
              {formatRTLText('تحميل ملف Word')}
            </ThemedText>
            <ThemedText style={[styles.wordDownloadHint, getTextDirection()]}>
              {formatRTLText('اضغط الزر أدناه لتحميل الملف.')}
            </ThemedText>
            <TouchableOpacity
              style={styles.wordDownloadButton}
              onPress={() => {
                if (!wordDownload) return;
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  const a = document.createElement('a');
                  a.href = wordDownload.url;
                  a.download = wordDownload.name;
                  a.click();
                }
                closeWordDownload();
              }}
            >
              <ThemedText style={styles.wordDownloadButtonText}>
                {formatRTLText('تحميل الملف')}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.wordDownloadCancel} onPress={closeWordDownload}>
              <ThemedText style={styles.wordDownloadCancelText}>{formatRTLText('إلغاء')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create<any>({
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
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',

    marginBottom: 2,
  },
  content: {
    width: '100%',
    padding: 20,
    backgroundColor: 'transparent',
  },
  dashboardCard: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1c1f33',
    textAlign: 'center',

  },
  dashboardOverallRow: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(173, 212, 206, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(173, 212, 206, 0.3)',
    marginBottom: 16,
  },
  dashboardOverallValue: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
  },
  dashboardOverallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'center',
    marginTop: 4,
    writingDirection: 'rtl',
  },
  dashboardTopBottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  dashboardMiniList: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
  },
  dashboardMiniListTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    marginBottom: 10,
    writingDirection: 'rtl',
  },
  dashboardMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#eef0ef',
  },
  dashboardMiniRank: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#999',
    width: 14,
    textAlign: 'center',
  },
  dashboardMiniName: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: '#1c1f33',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  dashboardMiniScore: {
    fontSize: 12,
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
    textAlign: 'left',

    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',

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
    textAlign: 'left',

    marginBottom: 4,
  },
  pieDetails: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',

    marginBottom: 2,
  },
  pieAverage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',

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
    alignSelf: 'flex-end',
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
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  visitorCommentsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  visitorCommentsLoading: { marginTop: 8 },
  noVisitorComments: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 4,
  },
  visitorCommentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  visitorCommentMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0d9488',
    marginBottom: 4,
    textAlign: 'right',
  },
  visitorCommentText: {
    fontSize: 14,
    color: '#1c1f33',
    lineHeight: 20,
    textAlign: 'right',
  },
  exportSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1f33',
    marginBottom: 4,
    textAlign: 'center',
  },
  exportButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  exportButtonPdf: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 120,
  },
  exportButtonWord: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 120,
  },
  exportOptionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',

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
  wordDownloadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  wordDownloadBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  wordDownloadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'center',
  },
  wordDownloadHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  wordDownloadButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  wordDownloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  wordDownloadCancel: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  wordDownloadCancelText: {
    fontSize: 15,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    alignSelf: 'flex-end',
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
