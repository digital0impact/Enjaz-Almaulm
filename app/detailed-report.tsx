
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DetailedReportScreen() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState('overview');
  
  const performanceData = [
    {
      id: 1,
      title: 'أداء الواجبات الوظيفية',
      score: 95,
      weight: 10,
      category: 'وظيفي',
      details: 'التزام عالي بالدوام الرسمي، تنفيذ ممتاز للحصص الدراسية وفق الجدول المحدد، ومشاركة فعالة في الإشراف والمناوبة والانتظار. إعداد منتظم ومتقن للدروس والاختبارات والواجبات.',
      strengths: ['الالتزام بالدوام', 'تنفيذ الحصص بانتظام', 'المشاركة في الإشراف', 'إعداد الدروس والاختبارات'],
      improvements: ['تطوير مهارات التخطيط الدرسي المتقدم'],
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 88,
      weight: 10,
      category: 'تفاعلي',
      details: 'مشاركة نشطة في مجتمعات التعلم المهنية، تبادل منتظم للزيارات الصفية، وتنفيذ دروس تطبيقية متميزة. إجراء بحوث دروس وحضور مستمر للدورات التدريبية والورش التطويرية.',
      strengths: ['المشاركة النشطة', 'تبادل الخبرات', 'الدروس التطبيقية', 'بحث الدرس'],
      improvements: ['زيادة عدد ورش العمل المحضورة', 'تطوير مهارات القيادة التربوية'],
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 92,
      weight: 10,
      category: 'تفاعلي',
      details: 'تواصل ممتاز مع أولياء الأمور وتزويدهم بمستويات أبنائهم بشكل دوري، إيصال الملاحظات الهامة، وتفعيل فعال للخطة الأسبوعية. مشاركة نشطة في الجمعية العمومية.',
      strengths: ['التواصل المستمر', 'الشفافية في التقييم', 'المتابعة الدورية', 'المشاركة في الجمعية العمومية'],
      improvements: ['تنويع وسائل التواصل', 'تطوير برامج إشراك أولياء الأمور'],
    },
    {
      id: 4,
      title: 'التنويع في استراتيجيات التدريس',
      score: 87,
      weight: 10,
      category: 'تعليمي',
      details: 'تطبيق متميز لاستراتيجيات تدريس متنوعة ومتطورة، مراعاة دقيقة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم جميع مستويات الطلاب المختلفة.',
      strengths: ['التنويع في الاستراتيجيات', 'مراعاة الفروق الفردية', 'استخدام طرق حديثة', 'تلبية احتياجات جميع المستويات'],
      improvements: ['دمج المزيد من التقنيات الحديثة', 'تطوير استراتيجيات التعلم النشط'],
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 85,
      weight: 10,
      category: 'تعليمي',
      details: 'جهود متميزة في معالجة الفاقد التعليمي، وضع خطط علاجية شاملة للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم منتظم للطلاب المتحسنين.',
      strengths: ['معالجة الفاقد التعليمي', 'الخطط العلاجية', 'برامج الإثراء', 'تكريم الطلاب المتحسنين'],
      improvements: ['تطوير أساليب التقييم التكويني', 'تعزيز برامج الدعم الأكاديمي'],
    },
    {
      id: 6,
      title: 'إعداد وتنفيذ خطة التعلم',
      score: 90,
      weight: 10,
      category: 'تخطيطي',
      details: 'تخطيط منهجي ومتقن لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس شاملة ومتنوعة، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
      strengths: ['التخطيط المنهجي', 'توزيع المنهج المتوازن', 'إعداد الدروس الشاملة', 'تصميم التقييمات الهادفة'],
      improvements: ['تطوير خطط تعلم مخصصة', 'دمج التكنولوجيا في التخطيط'],
    },
    {
      id: 7,
      title: 'توظيف التقنيات ووسائل التعلم',
      score: 82,
      weight: 10,
      category: 'تقني',
      details: 'استخدام متطور للتقنيات الحديثة في التعليم، تنويع إبداعي في الوسائل التعليمية المستخدمة، مع دمج فعال للتقنية في العملية التعليمية.',
      strengths: ['استخدام التقنيات الحديثة', 'التنويع في الوسائل', 'الدمج الفعال للتقنية', 'الإبداع في التطبيق'],
      improvements: ['تطوير مهارات الذكاء الاصطناعي', 'استخدام منصات تعليمية متقدمة'],
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 89,
      weight: 5,
      category: 'بيئي',
      details: 'اهتمام ممتاز بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة شاملة لحاجات الطلاب النفسية والمادية والمعنوية، وتصنيف دقيق للطلاب حسب أنماط التعلم.',
      strengths: ['البيئة المحفزة', 'مراعاة الحاجات النفسية', 'التصنيف حسب أنماط التعلم', 'الاهتمام بالجوانب المعنوية'],
      improvements: ['تطوير بيئات تعلم تفاعلية', 'تعزيز الأنشطة اللامنهجية'],
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 93,
      weight: 5,
      category: 'إداري',
      details: 'إدارة متميزة للصف، مهارات عالية في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة دقيقة للفروق الفردية ومتابعة مستمرة للحضور والانضباط.',
      strengths: ['الإدارة المتميزة', 'ضبط السلوك', 'شد الانتباه', 'متابعة الحضور والانضباط'],
      improvements: ['تطوير استراتيجيات إدارة الوقت', 'تعزيز مهارات التحفيز'],
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 86,
      weight: 10,
      category: 'تحليلي',
      details: 'تحليل شامل ودقيق لنتائج الاختبارات الفصلية والنهائية، تصنيف علمي للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط فعالة لمعالجة الفاقد التعليمي.',
      strengths: ['التحليل الشامل', 'التصنيف العلمي', 'خطط معالجة الفاقد', 'التشخيص الدقيق'],
      improvements: ['استخدام أدوات تحليل متقدمة', 'تطوير نظم التتبع الإلكترونية'],
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 84,
      weight: 10,
      category: 'تقويمي',
      details: 'تنويع شامل في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية متنوعة ومبتكرة، وإنشاء مهام أدائية وملفات إنجاز شاملة.',
      strengths: ['التنويع الشامل', 'المشاريع المبتكرة', 'المهام الأدائية', 'ملفات الإنجاز'],
      improvements: ['تطوير التقويم الإلكتروني', 'تعزيز التقويم التكويني المستمر'],
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
    const weightedSum = performanceData.reduce((acc, item) => acc + (item.score * item.weight), 0);
    const totalWeight = performanceData.reduce((acc, item) => acc + item.weight, 0);
    return Math.round(weightedSum / totalWeight);
  };

  const renderOverviewTab = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.summarySection}>
        <ThemedText style={styles.sectionTitle}>ملخص الأداء العام</ThemedText>
        <ThemedView style={styles.scoreCard}>
          <ThemedText style={[styles.mainScore, { color: getScoreColor(calculateOverallAverage()) }]}>
            {calculateOverallAverage()}%
          </ThemedText>
          <ThemedText style={styles.scoreLabel}>
            {getScoreLevel(calculateOverallAverage())}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.categoriesGrid}>
        {performanceData.map((item) => (
          <ThemedView key={item.id} style={styles.categoryCard}>
            <ThemedText style={styles.categoryTitle} numberOfLines={2}>
              {item.title}
            </ThemedText>
            <ThemedText style={[styles.categoryScore, { color: getScoreColor(item.score) }]}>
              {item.score}%
            </ThemedText>
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
              <ThemedText style={styles.detailedTitle}>{item.title}</ThemedText>
              <ThemedText style={[styles.detailedScore, { color: getScoreColor(item.score) }]}>
                {item.score}%
              </ThemedText>
            </ThemedView>
            
            <ThemedText style={styles.detailedDescription}>
              {item.details}
            </ThemedText>

            <ThemedView style={styles.strengthsSection}>
              <ThemedText style={styles.subsectionTitle}>نقاط القوة:</ThemedText>
              {item.strengths.map((strength, index) => (
                <ThemedView key={index} style={styles.bulletPoint}>
                  <IconSymbol size={8} name="checkmark.circle.fill" color="#4CAF50" />
                  <ThemedText style={styles.bulletText}>{strength}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.improvementsSection}>
              <ThemedText style={styles.subsectionTitle}>مجالات التحسين:</ThemedText>
              {item.improvements.map((improvement, index) => (
                <ThemedView key={index} style={styles.bulletPoint}>
                  <IconSymbol size={8} name="exclamationmark.triangle.fill" color="#FF9800" />
                  <ThemedText style={styles.bulletText}>{improvement}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>
        ))}
      </ScrollView>
    </ThemedView>
  );

  const renderRecommendationsTab = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.recommendationsContainer}>
        <ThemedText style={styles.sectionTitle}>التوصيات والخطط المقترحة</ThemedText>
        
        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={styles.recommendationTitle}>
            <IconSymbol size={16} name="target" color="#2196F3" /> التوصيات الفورية
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • ركز على تحسين مجال "تحسين نتائج المتعلمين" من خلال تطوير أساليب التقييم التكويني
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • زيادة استخدام التقنيات الحديثة في التدريس لتحسين محور "توظيف التقنيات"
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • حضور المزيد من ورش العمل المتخصصة في التطوير المهني
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={styles.recommendationTitle}>
            <IconSymbol size={16} name="calendar" color="#9C27B0" /> خطة التطوير الشهرية
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • الشهر الأول: التركيز على تطوير استراتيجيات التقييم
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • الشهر الثاني: دمج التقنيات الرقمية في العملية التعليمية
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • الشهر الثالث: تعزيز التفاعل مع المجتمع المهني
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={styles.recommendationTitle}>
            <IconSymbol size={16} name="star.fill" color="#FF9800" /> موارد مقترحة
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • دورات تدريبية في التقييم التكويني والختامي
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • ورش عمل حول استخدام التقنيات التعليمية الحديثة
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • برامج التطوير المهني المستمر
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  const renderCurrentTab = () => {
    switch (selectedView) {
      case 'detailed':
        return renderDetailedTab();
      case 'recommendations':
        return renderRecommendationsTab();
      default:
        return renderOverviewTab();
    }
  };

  const handleExportReport = () => {
    Alert.alert(
      'تصدير التقرير التفصيلي',
      'اختر تنسيق التصدير:',
      [
        {
          text: 'PDF كامل',
          onPress: () => Alert.alert('تصدير PDF', 'سيتم تصدير التقرير التفصيلي كملف PDF شامل')
        },
        {
          text: 'Excel مفصل',
          onPress: () => Alert.alert('تصدير Excel', 'سيتم تصدير جميع البيانات والتوصيات في ملف Excel')
        },
        {
          text: 'Word تقرير',
          onPress: () => Alert.alert('تصدير Word', 'سيتم إنشاء تقرير مفصل بصيغة Word')
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
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
          <ThemedView style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol size={24} name="chevron.right" color="#1c1f33" />
            </TouchableOpacity>
            <ThemedView style={styles.headerContent}>
              <IconSymbol size={50} name="doc.text.fill" color="#1c1f33" />
              <ThemedText type="title" style={styles.headerTitle}>
                التقرير التفصيلي
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                تحليل شامل ومفصل لجميع جوانب أدائك المهني
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'overview' && styles.activeTabButton]}
              onPress={() => setSelectedView('overview')}
            >
              <IconSymbol size={16} name="chart.pie.fill" color={selectedView === 'overview' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, selectedView === 'overview' && styles.activeTabButtonText]}>
                نظرة عامة
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'detailed' && styles.activeTabButton]}
              onPress={() => setSelectedView('detailed')}
            >
              <IconSymbol size={16} name="list.bullet.rectangle" color={selectedView === 'detailed' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, selectedView === 'detailed' && styles.activeTabButtonText]}>
                تفصيلي
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'recommendations' && styles.activeTabButton]}
              onPress={() => setSelectedView('recommendations')}
            >
              <IconSymbol size={16} name="lightbulb.fill" color={selectedView === 'recommendations' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, selectedView === 'recommendations' && styles.activeTabButtonText]}>
                التوصيات
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
                <IconSymbol size={20} name="square.and.arrow.up.fill" color="white" />
                <ThemedText style={styles.buttonText}>تصدير التقرير التفصيلي</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.interactiveButton}
                onPress={() => router.push('/interactive-report')}
              >
                <IconSymbol size={20} name="chart.line.uptrend.xyaxis" color="white" />
                <ThemedText style={styles.buttonText}>التقرير التفاعلي</ThemedText>
              </TouchableOpacity>
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
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  headerContent: {
    flex: 1,
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
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 5,
  },
  activeTabButton: {
    backgroundColor: '#1c1f33',
  },
  tabButtonText: {
    fontSize: 12,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
    height: 32,
  },
  categoryScore: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 2,
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
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  interactiveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
