import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PerformanceScreen() {
  const [performanceData, setPerformanceData] = useState([
    {
      id: 1,
      title: 'أداء الواجبات الوظيفية',
      score: 95,
      weight: 10,
      description: 'التقيد بالدوام الرسمي، تأدية الحصص وفق الجدول الدراسي، المشاركة في الإشراف والانتظار والمناوبة، إعداد الدروس والاختبارات والواجبات',
      details: 'التزام عالي بالدوام الرسمي، تنفيذ ممتاز للحصص الدراسية وفق الجدول المحدد، ومشاركة فعالة في الإشراف والمناوبة والانتظار. إعداد منتظم ومتقن للدروس والاختبارات والواجبات.',
      evidence: [
        { name: 'سجل الدوام', available: true },
        { name: 'سجل المناوبة', available: true },
        { name: 'سجل الانتظار', available: false },
        { name: 'خطة توزيع المنهج', available: true }
      ],
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 88,
      weight: 10,
      description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الزيارات الصفية، تنفيذ الدروس التطبيقية، بحث الدرس، حضور الدورات والورش التدريبية',
      details: 'مشاركة نشطة في مجتمعات التعلم المهنية، تبادل منتظم للزيارات الصفية، وتنفيذ دروس تطبيقية متميزة. إجراء بحوث دروس وحضور مستمر للدورات التدريبية والورش التطويرية.',
      evidence: [
        { name: 'سجل مجتمعات التعلم المهنية', available: true },
        { name: 'سجل تبادل الزيارات', available: false },
        { name: 'تقرير تنفيذ درس تطبيقي', available: true },
        { name: 'شهادات حضور الدورات', available: true }
      ],
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 92,
      weight: 10,
      description: 'التواصل الفعّال مع أولياء الأمور، تزويد أولياء الأمور بمستويات الطلاب، إيصال الملاحظات الهامة، تفعيل الخطة الأسبوعية للمدرسة، المشاركة في الجمعية العمومية',
      details: 'تواصل ممتاز مع أولياء الأمور وتزويدهم بمستويات أبنائهم بشكل دوري، إيصال الملاحظات الهامة، وتفعيل فعال للخطة الأسبوعية. مشاركة نشطة في الجمعية العمومية.',
      evidence: [
        { name: 'صور من الجمعية العمومية', available: true },
        { name: 'تقرير اجتماع مع ولي أمر', available: false },
        { name: 'نسخة من الخطة الأسبوعية', available: true }
      ],
    },
    {
      id: 4,
      title: 'التنويع في استراتيجيات التدريس',
      score: 87,
      weight: 10,
      description: 'استخدام استراتيجيات متنوعة، مراعاة الفروق الفردية، تطبيق استراتيجيات تناسب مستويات الطلاب',
      details: 'تطبيق متميز لاستراتيجيات تدريس متنوعة ومتطورة، مراعاة دقيقة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم جميع مستويات الطلاب المختلفة.',
      evidence: [
        { name: 'تقرير عن تطبيق استراتيجية', available: true },
        { name: 'ملف إنجاز المعلم', available: false }
      ],
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 85,
      weight: 10,
      description: 'معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف، وضع خطط إثرائية للمتميزين، تكريم الطلاب المتحسنين',
      details: 'جهود متميزة في معالجة الفاقد التعليمي، وضع خطط علاجية شاملة للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم منتظم للطلاب المتحسنين.',
      evidence: [
        { name: 'نتائج الاختبارات القبلية والبعدية', available: true },
        { name: 'كشف متابعة الطلاب', available: true }
      ],
    },
    {
      id: 6,
      title: 'إعداد وتنفيذ خطة التعلم',
      score: 90,
      weight: 10,
      description: 'توزيع المنهج، إعداد الدروس والواجبات والاختبارات',
      details: 'تخطيط منهجي ومتقن لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس شاملة ومتنوعة، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
      evidence: [
        { name: 'نموذج إعداد درس', available: true },
        { name: 'نماذج من الواجبات والاختبارات', available: false }
      ],
    },
    {
      id: 7,
      title: 'توظيف التقنيات ووسائل التعلم',
      score: 82,
      weight: 10,
      description: 'دمج التقنية في التعليم، التنويع في الوسائل التعليمية',
      details: 'استخدام متطور للتقنيات الحديثة في التعليم، تنويع إبداعي في الوسائل التعليمية المستخدمة، مع دمج فعال للتقنية في العملية التعليمية.',
      evidence: [
        { name: 'صور للوسائل المستخدمة', available: true },
        { name: 'تقرير عن برنامج تقني تم استخدامه', available: false }
      ],
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 89,
      weight: 5,
      description: 'مراعاة حاجات الطلاب، تهيئة نفسية ومادية ومعنوية مناسبة',
      details: 'اهتمام ممتاز بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة شاملة لحاجات الطلاب النفسية والمادية والمعنوية، وتصنيف دقيق للطلاب حسب أنماط التعلم.',
      evidence: [
        { name: 'تقرير تصنيف الطلاب وفق أنماط التعلم', available: false },
        { name: 'نماذج من أدوات التحفيز', available: true }
      ],
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 93,
      weight: 5,
      description: 'ضبط سلوك الطلاب، شد انتباه الطلاب، مراعاة الفروق الفردية',
      details: 'إدارة متميزة للصف، مهارات عالية في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة دقيقة للفروق الفردية ومتابعة مستمرة للحضور والانضباط.',
      evidence: [
        { name: 'كشف متابعة الحضور والغياب والتأخر', available: true },
        { name: 'تطبيق إدارة الصف', available: true }
      ],
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 86,
      weight: 10,
      description: 'تحليل نتائج الاختبارات الفصلية والنهائية، تصنيف الطلاب حسب نتائجهم، معالجة الفاقد التعليمي',
      details: 'تحليل شامل ودقيق لنتائج الاختبارات الفصلية والنهائية، تصنيف علمي للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط فعالة لمعالجة الفاقد التعليمي.',
      evidence: [
        { name: 'تقرير تحليل نتائج الطلاب', available: true },
        { name: 'سجل معالجة الفاقد التعليمي', available: false }
      ],
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 84,
      weight: 10,
      description: 'تطبيق الاختبارات الورقية والإلكترونية، المشاريع الطلابية، المهام الأدائية، ملفات الإنجاز',
      details: 'تنويع شامل في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية متنوعة ومبتكرة، وإنشاء مهام أدائية وملفات إنجاز شاملة.',
      evidence: [
        { name: 'نماذج من الاختبارات', available: true },
        { name: 'نماذج من المشاريع والمهام', available: false },
        { name: 'نماذج من ملفات الإنجاز', available: true }
      ],
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
    const weightedSum = performanceData.reduce((acc, item) => acc + (item.score * item.weight), 0);
    const totalWeight = performanceData.reduce((acc, item) => acc + item.weight, 0);
    return Math.round(weightedSum / totalWeight);
  };

  const toggleEvidenceStatus = (performanceId: number, evidenceIndex: number) => {
    setPerformanceData(prevData => 
      prevData.map(item => 
        item.id === performanceId 
          ? {
              ...item,
              evidence: item.evidence.map((evidence, index) => 
                index === evidenceIndex 
                  ? { ...evidence, available: !evidence.available }
                  : evidence
              )
            }
          : item
      )
    );
  };

  const addEvidence = (performanceId: number) => {
    Alert.prompt(
      'إضافة شاهد جديد',
      'أدخل اسم الشاهد الجديد:',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'إضافة',
          onPress: (evidenceName) => {
            if (evidenceName && evidenceName.trim()) {
              setPerformanceData(prevData => 
                prevData.map(item => 
                  item.id === performanceId 
                    ? {
                        ...item,
                        evidence: [...item.evidence, { name: evidenceName.trim(), available: false }]
                      }
                    : item
                )
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const editEvidence = (performanceId: number, evidenceIndex: number, currentName: string) => {
    Alert.prompt(
      'تعديل الشاهد',
      'قم بتعديل اسم الشاهد:',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حفظ',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              setPerformanceData(prevData => 
                prevData.map(item => 
                  item.id === performanceId 
                    ? {
                        ...item,
                        evidence: item.evidence.map((evidence, index) => 
                          index === evidenceIndex 
                            ? { ...evidence, name: newName.trim() }
                            : evidence
                        )
                      }
                    : item
                )
              );
            }
          },
        },
      ],
      'plain-text',
      currentName
    );
  };

  const deleteEvidence = (performanceId: number, evidenceIndex: number) => {
    Alert.alert(
      'حذف الشاهد',
      'هل أنت متأكد من رغبتك في حذف هذا الشاهد؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            setPerformanceData(prevData => 
              prevData.map(item => 
                item.id === performanceId 
                  ? {
                      ...item,
                      evidence: item.evidence.filter((_, index) => index !== evidenceIndex)
                    }
                  : item
              )
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="chart.bar.fill" color="#FF9800" />
        <ThemedText style={styles.subtitle}>
          تقييم شامل لأدائك في المجالات المهنية المختلفة وفقاً للنظام المعتمد
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
            تفاصيل عناصر التقييم
          </ThemedText>

          {performanceData.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.performanceCard}
              onPress={() => 
                setSelectedPerformance(selectedPerformance === item.id ? null : item.id)
              }
            >
              <ThemedView style={styles.cardHeader}>
                <ThemedView style={styles.cardTitleContainer}>
                  <ThemedText style={styles.itemNumber}>
                    {index + 1}.
                  </ThemedText>
                  <ThemedView style={styles.cardContent}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.cardDescription}>
                      {item.description}
                    </ThemedText>
                    <ThemedText style={styles.weightText}>
                      الوزن: {item.weight}%
                    </ThemedText>
                  </ThemedView>
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

                  <ThemedView style={styles.evidenceHeader}>
                    <ThemedText style={styles.evidenceTitle}>الشواهد المطلوبة:</ThemedText>
                    <TouchableOpacity 
                      style={styles.addEvidenceButton}
                      onPress={() => addEvidence(item.id)}
                    >
                      <IconSymbol 
                        size={16} 
                        name="plus.circle.fill" 
                        color="#4CAF50" 
                      />
                      <ThemedText style={styles.addEvidenceText}>إضافة شاهد</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                  <ThemedView style={styles.evidenceList}>
                    {item.evidence.map((evidenceItem, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={[
                          styles.evidenceItem,
                          evidenceItem.available ? styles.evidenceAvailable : styles.evidenceUnavailable
                        ]}
                        onPress={() => toggleEvidenceStatus(item.id, index)}
                      >
                        <TouchableOpacity 
                          style={styles.uploadIcon}
                          onPress={() => Alert.alert('تحميل ملف', `سيتم تحميل ملف لـ: ${evidenceItem.name}`)}
                        >
                          <IconSymbol 
                            size={20} 
                            name="arrow.up.doc.fill" 
                            color="#007AFF" 
                          />
                        </TouchableOpacity>
                        <IconSymbol 
                          size={16} 
                          name={evidenceItem.available ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                          color={evidenceItem.available ? "#4CAF50" : "#F44336"} 
                        />
                        <ThemedText style={[
                          styles.evidenceText,
                          evidenceItem.available ? styles.evidenceAvailableText : styles.evidenceUnavailableText
                        ]}>
                          {evidenceItem.name}
                        </ThemedText>
                        <ThemedText style={[
                          styles.evidenceStatus,
                          evidenceItem.available ? styles.evidenceAvailableStatus : styles.evidenceUnavailableStatus
                        ]}>
                          {evidenceItem.available ? 'متوفر' : 'غير متوفر'}
                        </ThemedText>
                        <ThemedView style={styles.evidenceActions}>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => editEvidence(item.id, index, evidenceItem.name)}
                          >
                            <IconSymbol 
                              size={14} 
                              name="pencil.circle.fill" 
                              color="#FF9800" 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => deleteEvidence(item.id, index)}
                          >
                            <IconSymbol 
                              size={14} 
                              name="trash.circle.fill" 
                              color="#F44336" 
                            />
                          </TouchableOpacity>
                        </ThemedView>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2E8B57',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  performanceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  performanceHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  expandIcon: {
    marginRight: I18nManager.isRTL ? 10 : 0,
    marginLeft: I18nManager.isRTL ? 0 : 10,
  },
  performanceDetails: {
    padding: 15,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceList: {
    marginBottom: 15,
  },
  evidenceItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  evidenceName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scoreInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    minWidth: 60,
  },
  weightContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
  },
  evidenceHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addEvidenceButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 4,
  },
  addEvidenceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceActions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: 8,
    marginRight: I18nManager.isRTL ? 8 : 0,
    marginLeft: I18nManager.isRTL ? 0 : 8,
  },
  editButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  weightText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'right',
    writingDirection: 'rtl',
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