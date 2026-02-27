import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, I18nManager, ImageBackground, Dimensions, Platform, Share } from 'react-native';
import { AlertService } from '@/services/AlertService';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import { calculateOverallAverageFivePoint } from '@/utils/performance-five-point';

// Types
interface Evidence {
  name: string;
  available: boolean;
}

interface PerformanceItem {
  id: number;
  title: string;
  score: number;
  weight: number;
  category: string;
  details: string;
  strengths: string[];
  improvements: string[];
  evidence: Evidence[];
}

const { width } = Dimensions.get('window');

export default function DetailedReportScreen() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState('overview');
  const [performanceData, setPerformanceData] = useState<PerformanceItem[]>([]);

  // البيانات الحقيقية للمحاور والشواهد
  const initialAxes = [
    {
      id: 1,
      title: 'أداء الواجبات الوظيفية',
      score: 85,
      weight: 10,
      category: 'وظيفي',
      details: 'التزام بالدوام الرسمي، تنفيذ الحصص الدراسية وفق الجدول المحدد، ومشاركة في الإشراف والمناوبة.',
      strengths: ['الالتزام بالدوام', 'تنفيذ الحصص بانتظام', 'المشاركة في الإشراف'],
      improvements: ['تطوير مهارات التخطيط الدرسي المتقدم'],
      evidence: [
        { name: 'التقيد بالدوام الرسمي', available: true },
        { name: 'تأدية الحصص وفق الجدول الدراسي', available: true },
        { name: 'المشاركة في الإشراف والمناوبة', available: false },
        { name: 'إعداد الدروس والاختبارات والواجبات', available: true },
        { name: 'حفظ الأنظمة والتعليمات', available: true },
        { name: 'تنفيذ مهام التوجيه والإرشاد', available: false },
        { name: 'متابعة التوزيع الزمني للمنهج', available: true }
      ]
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 78,
      weight: 10,
      category: 'تفاعلي',
      details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للزيارات الصفية، وتنفيذ دروس تطبيقية.',
      strengths: ['المشاركة النشطة', 'تبادل الخبرات', 'الدروس التطبيقية'],
      improvements: ['زيادة عدد ورش العمل المحضورة', 'تطوير مهارات القيادة التربوية'],
      evidence: [
        { name: 'المشاركة في مجتمعات التعلم المهنية', available: true },
        { name: 'الزيارات التبادلية', available: false },
        { name: 'تنفيذ درس تطبيقي', available: true },
        { name: 'إجراء بحث درس', available: false },
        { name: 'حضور الدورات التدريبية', available: true },
        { name: 'حضور ورش العمل', available: false },
        { name: 'المشاركة في الملتقيات التربوية', available: true }
      ]
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 92,
      weight: 10,
      category: 'تفاعلي',
      details: 'تواصل ممتاز مع أولياء الأمور وتزويدهم بمستويات أبنائهم، إيصال الملاحظات الهامة.',
      strengths: ['التواصل المستمر', 'الشفافية في التقييم', 'المتابعة الدورية'],
      improvements: ['تنويع وسائل التواصل', 'تطوير برامج إشراك أولياء الأمور'],
      evidence: [
        { name: 'التواصل الفعال مع أولياء الأمور', available: true },
        { name: 'إيصال الملاحظات الهامة', available: true },
        { name: 'تفعيل الخطة الأسبوعية', available: true },
        { name: 'المشاركة في الجمعية العمومية', available: true },
        { name: 'إرسال التقارير الدورية', available: false },
        { name: 'تنظيم اللقاءات الفردية', available: true }
      ]
    },
    {
      id: 4,
      title: 'التنويع في استراتيجيات التدريس',
      score: 87,
      weight: 10,
      category: 'تعليمي',
      details: 'تطبيق استراتيجيات تدريس متنوعة ومتطورة، مراعاة للفروق الفردية بين الطلاب.',
      strengths: ['التنويع في الاستراتيجيات', 'مراعاة الفروق الفردية', 'استخدام طرق حديثة'],
      improvements: ['دمج المزيد من التقنيات الحديثة', 'تطوير استراتيجيات التعلم النشط'],
      evidence: [
        { name: 'تطبيق استراتيجيات تدريس متنوعة', available: true },
        { name: 'مراعاة الفروق الفردية', available: true },
        { name: 'استخدام استراتيجيات حديثة', available: false },
        { name: 'تنويع أساليب الشرح', available: true },
        { name: 'التدريس وفق أنماط التعلم', available: true },
        { name: 'استخدام التعلم التعاوني', available: false }
      ]
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 85,
      weight: 10,
      category: 'تعليمي',
      details: 'جهود في معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف وخطط إثرائية للمتميزين.',
      strengths: ['معالجة الفاقد التعليمي', 'الخطط العلاجية', 'برامج الإثراء'],
      improvements: ['تطوير أساليب التقييم التكويني', 'تعزيز برامج الدعم الأكاديمي'],
      evidence: [
        { name: 'معالجة الفاقد التعليمي', available: true },
        { name: 'وضع الخطط العلاجية', available: true },
        { name: 'إعداد برامج الإثراء', available: false },
        { name: 'تكريم الطلاب المتحسنين', available: true },
        { name: 'متابعة الطلاب ضعيفي التحصيل', available: true },
        { name: 'تنفيذ برامج التدخل المبكر', available: false }
      ]
    },
    {
      id: 6,
      title: 'إعداد وتنفيذ خطة التعلم',
      score: 90,
      weight: 10,
      category: 'تخطيطي',
      details: 'تخطيط منهجي لتوزيع المنهج، إعداد دروس شاملة، وتصميم واجبات واختبارات متماشية مع أهداف التعلم.',
      strengths: ['التخطيط المنهجي', 'توزيع المنهج المتوازن', 'إعداد الدروس الشاملة'],
      improvements: ['تطوير خطط تعلم مخصصة', 'دمج التكنولوجيا في التخطيط'],
      evidence: [
        { name: 'إعداد توزيع زمني للمنهج', available: true },
        { name: 'إعداد دروس متنوعة ومشوقة', available: true },
        { name: 'إعداد واجبات واختبارات متنوعة', available: true },
        { name: 'ربط التعلم بالحياة العملية', available: false },
        { name: 'تحديد أهداف واضحة للتعلم', available: true },
        { name: 'التخطيط للأنشطة اللاصفية', available: false }
      ]
    },
    {
      id: 7,
      title: 'توظيف التقنيات ووسائل التعلم',
      score: 82,
      weight: 10,
      category: 'تقني',
      details: 'استخدام التقنيات الحديثة في التعليم، تنويع في الوسائل التعليمية، مع دمج فعال للتقنية.',
      strengths: ['استخدام التقنيات الحديثة', 'التنويع في الوسائل', 'الدمج الفعال للتقنية'],
      improvements: ['تطوير مهارات الذكاء الاصطناعي', 'استخدام منصات تعليمية متقدمة'],
      evidence: [
        { name: 'استخدام التقنيات الحديثة في التدريس', available: true },
        { name: 'التنويع في الوسائل التعليمية', available: true },
        { name: 'دمج التقنية في التعلم', available: false },
        { name: 'استخدام البرمجيات التعليمية', available: true },
        { name: 'توظيف الإنترنت في التعلم', available: false },
        { name: 'إنتاج وسائل تعليمية رقمية', available: false }
      ]
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 89,
      weight: 5,
      category: 'بيئي',
      details: 'تهيئة بيئة تعليمية محفزة ومناسبة، مراعاة حاجات الطلاب النفسية والمادية والمعنوية.',
      strengths: ['البيئة المحفزة', 'مراعاة الحاجات النفسية', 'التصنيف حسب أنماط التعلم'],
      improvements: ['تطوير بيئات تعلم تفاعلية', 'تعزيز الأنشطة اللامنهجية'],
      evidence: [
        { name: 'تهيئة بيئة تعليمية مناسبة ومحفزة', available: true },
        { name: 'مراعاة حاجات الطلاب النفسية والمادية والمعنوية', available: true },
        { name: 'تصنيف الطلاب حسب أنماط التعلم', available: true },
        { name: 'تنظيم الصف بطريقة فعالة', available: false },
        { name: 'توفير مصادر التعلم المتنوعة', available: true }
      ]
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 93,
      weight: 5,
      category: 'إداري',
      details: 'إدارة متميزة للصف، مهارات في ضبط سلوك الطلاب وشد انتباههم، متابعة الحضور والانضباط.',
      strengths: ['الإدارة المتميزة', 'ضبط السلوك', 'شد الانتباه', 'متابعة الحضور'],
      improvements: ['تطوير استراتيجيات إدارة الوقت', 'تعزيز مهارات التحفيز'],
      evidence: [
        { name: 'الإدارة الناجحة للصف', available: true },
        { name: 'ضبط سلوك الطلاب وشد انتباههم', available: true },
        { name: 'مراعاة الفروق الفردية بين الطلاب', available: true },
        { name: 'متابعة الحضور والانضباط', available: true },
        { name: 'استخدام أساليب التعزيز الإيجابي', available: false }
      ]
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 86,
      weight: 10,
      category: 'تحليلي',
      details: 'تحليل شامل لنتائج الاختبارات، تصنيف الطلاب حسب نتائجهم، ووضع خطط لمعالجة الفاقد التعليمي.',
      strengths: ['التحليل الشامل', 'التصنيف العلمي', 'خطط معالجة الفاقد'],
      improvements: ['استخدام أدوات تحليل متقدمة', 'تطوير نظم التتبع الإلكترونية'],
      evidence: [
        { name: 'تحليل نتائج الاختبارات الفصلية والنهائية', available: true },
        { name: 'تصنيف الطلاب حسب نتائجهم ومستوياتهم', available: true },
        { name: 'وضع خطط لمعالجة الفاقد التعليمي', available: false },
        { name: 'إعداد تقارير دورية عن مستوى الطلاب', available: true },
        { name: 'تحليل نقاط القوة والضعف لكل طالب', available: false }
      ]
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 84,
      weight: 10,
      category: 'تقويمي',
      details: 'تنويع في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية متنوعة.',
      strengths: ['التنويع الشامل', 'المشاريع المبتكرة', 'المهام الأدائية'],
      improvements: ['تطوير التقويم الإلكتروني', 'تعزيز التقويم التكويني المستمر'],
      evidence: [
        { name: 'التنويع في أساليب التقويم (ورقي – إلكتروني)', available: true },
        { name: 'إنجاز مشاريع طلابية متنوعة ومبتكرة', available: true },
        { name: 'إنشاء مهام أدائية وملفات إنجاز', available: false },
        { name: 'استخدام التقويم التكويني', available: true },
        { name: 'تقويم مهارات القرن الحادي والعشرين', available: false }
      ]
    }
  ];

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        setPerformanceData(JSON.parse(storedData));
      } else {
        setPerformanceData(initialAxes);
      }
    } catch (error) {
      console.log('Error loading performance data:', error);
      setPerformanceData(initialAxes);
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
    if (!performanceData?.length) return 0;
    return calculateOverallAverageFivePoint(
      performanceData.map(item => ({ score: item.score, weight: item.weight }))
    );
  };

  const renderOverviewTab = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.summarySection}>
        <ThemedText style={[styles.sectionTitle, getTextDirection()]}>📊 ملخص الأداء العام</ThemedText>
        <ThemedView style={styles.scoreCard}>
          <ThemedText style={[styles.mainScore, { color: getScoreColor(calculateOverallAverage()) }]}>
            {calculateOverallAverage()}%
          </ThemedText>
          <ThemedText style={[styles.scoreLabel, getTextDirection()]}>
            {formatRTLText(getScoreLevel(calculateOverallAverage()))}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.categoriesGrid}>
        {performanceData.map((item, index) => (
          <ThemedView key={item.id} style={styles.categoryCard}>
            <ThemedView style={styles.cardHeader}>
              <ThemedView style={styles.cardNumberContainer}>
                <ThemedText style={styles.itemNumber}>
                  {index + 1}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.cardContent}>
                <ThemedText style={[styles.categoryTitle, getTextDirection()]} numberOfLines={2}>
                  {formatRTLText(item.title)}
                </ThemedText>
                <ThemedText style={[styles.weightText, getTextDirection()]}>
                  {formatRTLText('الوزن:')} {item.weight}%
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.scoreContainer}>
                <ThemedText style={[styles.categoryScore, getTextDirection(), { color: getScoreColor(item.score) }]}>
                  {item.score}%
                </ThemedText>
                <ThemedText style={[styles.scoreLevelSmall, getTextDirection(), { color: getScoreColor(item.score) }]}>
                  {formatRTLText(getScoreLevel(item.score))}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.progressBarSmall}>
              <ThemedView 
                style={[
                  styles.progressFillSmall,
                  { 
                    width: `${item.score}%`,
                    backgroundColor: getScoreColor(item.score)
                  }
                ]}
              />
            </ThemedView>
            
            {/* عرض الشواهد المحققة */}
            <ThemedView style={styles.evidenceSection}>
              <ThemedText style={[styles.evidenceTitle, getTextDirection()]}>الشواهد المحققة:</ThemedText>
              {item.evidence?.filter(e => e.available).slice(0, 2).map((evidence, index) => (
                <ThemedView key={index} style={styles.evidenceItem}>
                  <IconSymbol size={10} name="checkmark.circle.fill" color="#4CAF50" />
                  <ThemedText style={[styles.evidenceText, getTextDirection()]} numberOfLines={1}>
                    {formatRTLText(evidence.name)}
                  </ThemedText>
                </ThemedView>
              ))}
              {item.evidence?.filter(e => e.available).length > 2 && (
                <ThemedText style={[styles.moreEvidence, getTextDirection()]}>
                  {formatRTLText(`+${item.evidence.filter(e => e.available).length - 2} شواهد أخرى`)}
                </ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );

  const renderDetailedTab = () => (
    <ThemedView style={styles.tabContent}>
      <ScrollView style={styles.detailedList}>
        {performanceData.map((item) => (
          <ThemedView key={item.id} style={styles.detailedCard}>
            <ThemedView style={styles.detailedHeader}>
              <ThemedText style={[styles.detailedTitle, getTextDirection()]}>{formatRTLText(item.title)}</ThemedText>
              <ThemedText style={[styles.detailedScore, { color: getScoreColor(item.score) }]}>
                {item.score}%
              </ThemedText>
            </ThemedView>

            <ThemedText style={[styles.detailedDescription, getTextDirection()]}>
              {formatRTLText(item.details)}
            </ThemedText>

            {/* عرض جميع الشواهد */}
            <ThemedView style={styles.allEvidenceSection}>
              <ThemedText style={[styles.subsectionTitle, getTextDirection()]}>📋 الشواهد والأدلة:</ThemedText>
              {item.evidence?.map((evidence, index) => (
                <ThemedView key={index} style={styles.bulletPoint}>
                  <IconSymbol 
                    size={12} 
                    name={evidence.available ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                    color={evidence.available ? "#4CAF50" : "#F44336"} 
                  />
                  <ThemedText style={[styles.bulletText, getTextDirection(), { 
                    color: evidence.available ? '#333' : '#999',
                    textDecorationLine: evidence.available ? 'none' : 'line-through'
                  }]}>
                    {formatRTLText(evidence.name)}
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.strengthsSection}>
              <ThemedText style={[styles.subsectionTitle, getTextDirection()]}>💪 نقاط القوة:</ThemedText>
              {item.strengths?.map((strength, index) => (
                <ThemedView key={index} style={styles.bulletPoint}>
                  <IconSymbol size={8} name="star.fill" color="#4CAF50" />
                  <ThemedText style={[styles.bulletText, getTextDirection()]}>{formatRTLText(strength)}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.improvementsSection}>
              <ThemedText style={[styles.subsectionTitle, getTextDirection()]}>🎯 مجالات التحسين:</ThemedText>
              {item.improvements?.map((improvement, index) => (
                <ThemedView key={index} style={styles.bulletPoint}>
                  <IconSymbol size={8} name="target" color="#FF9800" />
                  <ThemedText style={[styles.bulletText, getTextDirection()]}>{formatRTLText(improvement)}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );

  const renderStatisticsTab = () => {
    const excellentCount = performanceData.filter(item => item.score >= 90).length;
    const goodCount = performanceData.filter(item => item.score >= 80 && item.score < 90).length;
    const needsImprovementCount = performanceData.filter(item => item.score < 80).length;
    
    const totalEvidences = performanceData.reduce((acc, item) => acc + (item.evidence?.length || 0), 0);
    const achievedEvidences = performanceData.reduce((acc, item) => 
      acc + (item.evidence?.filter(e => e.available).length || 0), 0);
    const evidencePercentage = Math.round((achievedEvidences / totalEvidences) * 100);

    return (
      <ThemedView style={styles.tabContent}>
        <ThemedView style={styles.statisticsContainer}>
          <ThemedText style={[styles.sectionTitle, getTextDirection()]}>📈 إحصائيات التقرير</ThemedText>

          <ThemedView style={styles.statCard}>
            <ThemedText style={[styles.statTitle, getTextDirection()]}>توزيع الدرجات</ThemedText>
            <ThemedView style={styles.statsGrid}>
              <ThemedView style={[styles.statItem, { backgroundColor: '#E8F5E8' }]}>
                <IconSymbol size={24} name="star.fill" color="#4CAF50" />
                <ThemedText style={styles.statValue}>{excellentCount}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>ممتاز (90%+)</ThemedText>
              </ThemedView>
              <ThemedView style={[styles.statItem, { backgroundColor: '#FFF3E0' }]}>
                <IconSymbol size={24} name="checkmark.circle.fill" color="#FF9800" />
                <ThemedText style={styles.statValue}>{goodCount}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>جيد (80-89%)</ThemedText>
              </ThemedView>
              <ThemedView style={[styles.statItem, { backgroundColor: needsImprovementCount > 0 ? '#FFEBEE' : '#E8F5E8' }]}>
                <IconSymbol size={24} name="exclamationmark.triangle.fill" color={needsImprovementCount > 0 ? "#F44336" : "#4CAF50"} />
                <ThemedText style={styles.statValue}>{needsImprovementCount}</ThemedText>
                <ThemedText style={[styles.statLabel, getTextDirection()]}>تحتاج تحسين</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.statCard}>
            <ThemedText style={[styles.statTitle, getTextDirection()]}>إحصائيات الشواهد</ThemedText>
            <ThemedView style={styles.evidenceStats}>
              <ThemedView style={styles.evidenceStatItem}>
                <ThemedText style={styles.evidenceStatNumber}>{achievedEvidences}</ThemedText>
                <ThemedText style={[styles.evidenceStatLabel, getTextDirection()]}>شاهد محقق</ThemedText>
              </ThemedView>
              <ThemedView style={styles.evidenceStatItem}>
                <ThemedText style={styles.evidenceStatNumber}>{totalEvidences - achievedEvidences}</ThemedText>
                <ThemedText style={[styles.evidenceStatLabel, getTextDirection()]}>شاهد غير محقق</ThemedText>
              </ThemedView>
              <ThemedView style={styles.evidenceStatItem}>
                <ThemedText style={[styles.evidenceStatNumber, { color: getScoreColor(evidencePercentage) }]}>
                  {evidencePercentage}%
                </ThemedText>
                <ThemedText style={[styles.evidenceStatLabel, getTextDirection()]}>نسبة التحقق</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.statCard}>
            <ThemedText style={[styles.statTitle, getTextDirection()]}>أعلى المحاور أداءً</ThemedText>
            {performanceData
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map((item, index) => (
                <ThemedView key={item.id} style={styles.topPerformerItem}>
                  <ThemedView style={styles.rankBadge}>
                    <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.topPerformerContent}>
                    <ThemedText style={[styles.topPerformerTitle, getTextDirection()]}>{formatRTLText(item.title)}</ThemedText>
                    <ThemedText style={[styles.topPerformerScore, getTextDirection(), { color: getScoreColor(item.score) }]}>
                      {item.score}%
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              ))}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderRecommendationsTab = () => {
    const lowPerformanceAxes = performanceData.filter(item => item.score < 85);
    
    return (
      <ThemedView style={styles.tabContent}>
        <ThemedView style={styles.recommendationsContainer}>
          <ThemedText style={[styles.sectionTitle, getTextDirection()]}>💡 التوصيات والخطط المقترحة</ThemedText>

          <ThemedView style={styles.recommendationCard}>
            <ThemedText style={[styles.recommendationTitle, getTextDirection()]}>
              <IconSymbol size={16} name="target" color="#2196F3" /> {formatRTLText('التوصيات الفورية')}
            </ThemedText>
            {lowPerformanceAxes.length > 0 ? (
              lowPerformanceAxes.map(item => (
                <ThemedText key={item.id} style={[styles.recommendationText, getTextDirection()]}>
                  {formatRTLText(`• ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.score}%)`)}
                </ThemedText>
              ))
            ) : (
              <ThemedText style={[styles.recommendationText, getTextDirection()]}>
                {formatRTLText('• أداء ممتاز في جميع المحاور! استمر في الحفاظ على هذا المستوى')}
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView style={styles.recommendationCard}>
            <ThemedText style={[styles.recommendationTitle, getTextDirection()]}>
              <IconSymbol size={16} name="calendar" color="#9C27B0" /> {formatRTLText('خطة التطوير الشهرية')}
            </ThemedText>
            <ThemedText style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('• الشهر الأول: التركيز على تطوير استراتيجيات التقييم')}
            </ThemedText>
            <ThemedText style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('• الشهر الثاني: دمج التقنيات الرقمية في العملية التعليمية')}
            </ThemedText>
            <ThemedText style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('• الشهر الثالث: تعزيز التفاعل مع المجتمع المهني')}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.recommendationCard}>
            <ThemedText style={[styles.recommendationTitle, getTextDirection()]}>
              <IconSymbol size={16} name="star.fill" color="#FF9800" /> {formatRTLText('موارد مقترحة')}
            </ThemedText>
            <ThemedText style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('• دورات تدريبية في التقييم التكويني والختامي')}
            </ThemedText>
            <ThemedText style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('• ورش عمل حول استخدام التقنيات التعليمية الحديثة')}
            </ThemedText>
            <ThemedText style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('• برامج التطوير المهني المستمر')}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  };

  const renderCurrentTab = () => {
    switch (selectedView) {
      case 'detailed':
        return renderDetailedTab();
      case 'statistics':
        return renderStatisticsTab();
      case 'recommendations':
        return renderRecommendationsTab();
      default:
        return renderOverviewTab();
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        overallAverage: calculateOverallAverage(),
        overallGrade: getScoreLevel(calculateOverallAverage()),
        axes: performanceData.map(item => ({
          title: item.title,
          score: item.score,
          evidences: item.evidence?.map(e => ({
            name: e.name,
            achieved: e.available
          }))
        })),
        generatedAt: new Date().toLocaleDateString('ar-SA')
      };

      const reportText = `📊 التقرير التفصيلي للأداء المهني
      
المتوسط العام: ${reportData.overallAverage}% - ${reportData.overallGrade}
تاريخ التقرير: ${reportData.generatedAt}

${reportData.axes.map(axis => `
${axis.title}: ${axis.score}%
الشواهد المحققة: ${axis.evidences?.filter(e => e.achieved).length || 0}/${axis.evidences?.length || 0}
`).join('')}`;

      await Share.share({
        message: reportText,
        title: 'التقرير التفصيلي للأداء المهني'
      });
    } catch (error) {
      AlertService.alert('خطأ', 'فشل في تصدير التقرير');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        
          <ThemedView style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
            </TouchableOpacity>

            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="doc.text.fill" color="#1c1f33" />
            </ThemedView>
            <ThemedText type="title" style={[styles.headerTitle, getTextDirection()]}>
              {formatRTLText('التقرير التفصيلي')}
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, getTextDirection()]}>
              {formatRTLText('تحليل شامل ومفصل لجميع جوانب أدائك المهني مع الشواهد والأدلة')}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'overview' && styles.activeTabButton]}
              onPress={() => setSelectedView('overview')}
            >
              <IconSymbol size={14} name="chart.pie.fill" color={selectedView === 'overview' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'overview' && styles.activeTabButtonText]}>
                {formatRTLText('نظرة عامة')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'detailed' && styles.activeTabButton]}
              onPress={() => setSelectedView('detailed')}
            >
              <IconSymbol size={14} name="list.bullet" color={selectedView === 'detailed' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'detailed' && styles.activeTabButtonText]}>
                {formatRTLText('التفاصيل')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'statistics' && styles.activeTabButton]}
              onPress={() => setSelectedView('statistics')}
            >
              <IconSymbol size={14} name="chart.bar.fill" color={selectedView === 'statistics' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'statistics' && styles.activeTabButtonText]}>
                {formatRTLText('إحصائيات')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'recommendations' && styles.activeTabButton]}
              onPress={() => setSelectedView('recommendations')}
            >
              <IconSymbol size={14} name="lightbulb.fill" color={selectedView === 'recommendations' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'recommendations' && styles.activeTabButtonText]}>
                {formatRTLText('توصيات')}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.content}>
            {renderCurrentTab()}

            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleExportReport}
              >
                <IconSymbol size={20} name="square.and.arrow.up.fill" color="#1c1f33" />
                <ThemedText style={[styles.buttonText, getTextDirection()]}>📤 تصدير ومشاركة</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.interactiveButton}
                onPress={() => router.push('/interactive-report')}
              >
                <IconSymbol size={20} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
                <ThemedText style={[styles.buttonText, getTextDirection()]}>📊 التقرير التفاعلي</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* قسم التقرير التفاعلي */}
            <ThemedView style={styles.interactiveReportSection}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>📊 التقرير التفاعلي</ThemedText>
              <ThemedText style={[styles.interactiveDescription, getTextDirection()]}>
                {formatRTLText('احصل على تحليل تفاعلي شامل لأدائك المهني مع مخططات بيانية ديناميكية ومؤشرات تفصيلية')}
              </ThemedText>
              
              <ThemedView style={styles.interactiveFeatures}>
                <ThemedView style={styles.featureItem}>
                  <IconSymbol size={16} name="chart.bar.fill" color="#4CAF50" />
                  <ThemedText style={[styles.featureText, getTextDirection()]}>مخططات بيانية تفاعلية</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.featureItem}>
                  <IconSymbol size={16} name="chart.pie.fill" color="#2196F3" />
                  <ThemedText style={[styles.featureText, getTextDirection()]}>إحصائيات متقدمة</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.featureItem}>
                  <IconSymbol size={16} name="lightbulb.fill" color="#FF9800" />
                  <ThemedText style={[styles.featureText, getTextDirection()]}>توصيات ذكية</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.featureItem}>
                  <IconSymbol size={16} name="arrow.triangle.2.circlepath" color="#9C27B0" />
                  <ThemedText style={[styles.featureText, getTextDirection()]}>تحليل مقارن</ThemedText>
                </ThemedView>
              </ThemedView>

              <TouchableOpacity 
                style={styles.mainInteractiveButton}
                onPress={() => router.push('/interactive-report')}
              >
                <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color="#fff" />
                <ThemedText style={[styles.mainInteractiveButtonText, getTextDirection()]}>افتح التقرير التفاعلي</ThemedText>
                <IconSymbol size={16} name="chevron.left" color="#fff" />
              </TouchableOpacity>
            </ThemedView>
          </ScrollView>
        
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 25,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 20,
    gap: 4,
  },
  activeTabButton: {
    backgroundColor: '#1c1f33',
  },
  tabButtonText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  tabContent: {
    backgroundColor: 'transparent',
  },
  summarySection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  scoreCard: {
    alignItems: 'center',
  },
  mainScore: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  categoriesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  categoryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginBottom: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
    width: width < 400 ? '100%' : width < 600 ? '48%' : '31%',
    minWidth: 280,
    maxWidth: width < 400 ? '100%' : 350,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 18,
    marginHorizontal: 5,
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumberContainer: {
    backgroundColor: '#add4ce',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  itemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  cardContent: {
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
    paddingHorizontal: 5,
  },
  weightText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 15,
    minWidth: 80,
  },
  categoryScore: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreLevelSmall: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBarSmall: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
    width: '100%',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 4,
  },
  evidenceSection: {
    marginTop: 10,
    backgroundColor: 'rgba(248, 249, 250, 0.6)',
    borderRadius: 10,
    padding: 12,
  },
  evidenceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
    paddingVertical: 2,
  },
  evidenceText: {
    fontSize: 11,
    color: '#555',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 16,
  },
  moreEvidence: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    fontWeight: '500',
  },
  detailedList: {
    flex: 1,
  },
  detailedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailedScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailedDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  allEvidenceSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  strengthsSection: {
    marginBottom: 15,
  },
  improvementsSection: {
    marginBottom: 0,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  bulletText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statisticsContainer: {
    gap: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 24,
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
  evidenceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  evidenceStatItem: {
    alignItems: 'center',
  },
  evidenceStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  evidenceStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  topPerformerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1c1f33',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topPerformerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topPerformerTitle: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  topPerformerScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    gap: 15,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
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
  interactiveButton: {
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
  interactiveReportSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginTop: 20,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  interactiveDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
    marginBottom: 20,
  },
  interactiveFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    width: '48%',
  },
  featureText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  mainInteractiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1f33',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  mainInteractiveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    textAlign: 'center',
  },

});
