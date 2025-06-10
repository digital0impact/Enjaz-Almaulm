
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
      title: 'أداء الواجبات الوظيفية',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 4,
      examples: [
        'التقيد بالدوام الرسمي',
        'تأدية الحصص الدراسية وفق الجدول الدراسي',
        'المشاركة في الإشراف والمناوبة وحصص الانتظار',
        'إعداد ومتابعة الدروس والواجبات والاختبارات'
      ],
      evidenceRequired: [
        'سجل الدوام الرسمي',
        'سجل المناوبة والإشراف اليومي',
        'سجل الانتظار',
        'خطة توزيع المنهج'
      ]
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 4,
      examples: [
        'المشاركة الفاعلة في مجتمعات التعلم المهنية',
        'تبادل الزيارات',
        'الدروس التطبيقية',
        'بحث الدرس',
        'حضور الدورات والورش التدريبية'
      ],
      evidenceRequired: [
        'سجل مجتمعات التعلم المهنية',
        'سجل تبادل الزيارات',
        'تقرير تنفيذ درس تطبيقي',
        'شهادات حضور الدورات والورش التدريبية'
      ]
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 3,
      examples: [
        'التواصل الفعال مع أولياء الأمور بالتنسيق مع الموجه الطلابي',
        'تزويد أولياء الأمور بمستويات الطلاب',
        'إيصال الملاحظات الهامة لأولياء الأمور',
        'تفعيل الخطة الأسبوعية للمدرسة',
        'المشاركة الفاعلة في الجمعية العمومية للمعلمين وأولياء الأمور'
      ],
      evidenceRequired: [
        'صور من الجمعية العمومية لأولياء الأمور والمعلمين',
        'تقرير اجتماع ولي الأمر مع المعلم',
        'نسخة من الخطة الأسبوعية للمدرسة'
      ]
    },
    {
      id: 4,
      title: 'التنويع في استراتيجيات التدريس',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 2,
      examples: [
        'استخدام استراتيجيات متنوعة',
        'تناسب مستويات الطلاب',
        'مراعاة الفروق الفردية'
      ],
      evidenceRequired: [
        'تقرير عن تطبيق استراتيجية',
        'ملف إنجاز المعلم'
      ]
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 2,
      examples: [
        'معالجة الفاقد التعليمي',
        'وضع الخطط العلاجية للطلاب الضعاف',
        'وضع الخطط الإثرائية للطلاب المتميزين',
        'تكريم الطلاب المتميزين والذين تحسن مستواهم'
      ],
      evidenceRequired: [
        'نتائج الاختبار القبلي والبعدي',
        'كشف متابعة الطلاب'
      ]
    },
    {
      id: 6,
      title: 'إعداد وتنفيذ خطة التعلم',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 3,
      examples: [
        'توزيع المنهج وإعداد الدروس',
        'إعداد الواجبات والاختبارات',
        'تنفيذ الدروس'
      ],
      evidenceRequired: [
        'خطة توزيع المنهج',
        'نموذج من إعداد الدروس',
        'نماذج من الواجبات والاختبارات'
      ]
    },
    {
      id: 7,
      title: 'توظيف تقنيات ووسائل التعلم المناسبة',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 2,
      examples: [
        'دمج التقنية في التعليم',
        'التنويع في الوسائل التعليمية'
      ],
      evidenceRequired: [
        'صور من الوسائل التعليمية المستخدمة',
        'تقرير عن برنامج تقني تم استخدامه'
      ]
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 0,
      weight: 5,
      evidenceCompletion: 0,
      totalEvidence: 2,
      examples: [
        'مراعاة حاجات الطلاب',
        'التهيئة النفسية للطلاب',
        'التحفيز المادي والمعنوي',
        'توفير متطلبات الدرس'
      ],
      evidenceRequired: [
        'تقرير تصنيف الطلاب وفق أنماط التعلم',
        'نماذج من التحفيز المادي والمعنوي'
      ]
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 0,
      weight: 5,
      evidenceCompletion: 0,
      totalEvidence: 2,
      examples: [
        'ضبط سلوك الطلاب',
        'شد انتباه الطلاب',
        'مراعاة الفروق الفردية',
        'متابعة الحضور والغياب والتأخر'
      ],
      evidenceRequired: [
        'كشف المتابعة',
        'تطبيق إدارة الصف'
      ]
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 2,
      examples: [
        'تحليل نتائج الاختبارات الفترية والنهائية',
        'تصنيف الطلاب وفق نتائجهم',
        'معالجة الفاقد التعليمي',
        'تحديد نقاط القوة والضعف'
      ],
      evidenceRequired: [
        'تقرير تحليل نتائج الطلاب',
        'سجل معالجة الفاقد التعليمي'
      ]
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 0,
      weight: 10,
      evidenceCompletion: 0,
      totalEvidence: 3,
      examples: [
        'تطبيق الاختبارات الورقية والإلكترونية',
        'المشاريع الطلابية',
        'المهام الأدائية',
        'ملفات إنجاز الطلاب'
      ],
      evidenceRequired: [
        'نماذج من الاختبارات',
        'نماذج من ملفات إنجاز الطلاب',
        'نماذج من المهام الأدائية ومشاريع الطلاب'
      ]
    }
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

  const getEvidenceCompletionPercentage = (evidenceCompletion: number, totalEvidence: number) => {
    return totalEvidence > 0 ? Math.round((evidenceCompletion / totalEvidence) * 100) : 0;
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="chart.bar.fill" color="#FF9800" />
        <ThemedText type="title" style={styles.title}>
          عناصر تقييم الأداء الوظيفي للمعلمين
        </ThemedText>
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
                    <ThemedText style={styles.weightText}>
                      وزن {item.weight}%
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.scoreContainer}>
                  <ThemedText style={[styles.score, { color: getScoreColor(item.score) }]}>
                    {item.score}%
                  </ThemedText>
                  <ThemedText style={styles.evidenceCompletion}>
                    اكتمال الشواهد
                  </ThemedText>
                  <ThemedText style={styles.evidenceCount}>
                    {getEvidenceCompletionPercentage(item.evidenceCompletion, item.totalEvidence)}%
                  </ThemedText>
                  <ThemedText style={styles.evidenceRatio}>
                    {item.evidenceCompletion}/{item.totalEvidence}
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

              <ThemedView style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.saveButton}>
                  <ThemedText style={styles.actionButtonText}>حفظ</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton}>
                  <ThemedText style={styles.actionButtonText}>تحرير</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {selectedPerformance === item.id && (
                <ThemedView style={styles.detailsContainer}>
                  <ThemedText style={styles.examplesTitle}>أمثلة على تحقق العنصر:</ThemedText>
                  {item.examples.map((example, idx) => (
                    <ThemedText key={idx} style={styles.exampleText}>• {example}</ThemedText>
                  ))}
                  
                  <ThemedText style={styles.evidenceTitle}>الشواهد المطلوبة:</ThemedText>
                  <TouchableOpacity style={styles.addEvidenceButton}>
                    <ThemedText style={styles.addEvidenceText}>إضافة شاهد</ThemedText>
                  </TouchableOpacity>
                  
                  {item.evidenceRequired.map((evidence, idx) => (
                    <ThemedView key={idx} style={styles.evidenceItem}>
                      <ThemedText style={styles.evidenceText}>{evidence}</ThemedText>
                      <ThemedText style={styles.evidenceStatus}>غير متوفر</ThemedText>
                    </ThemedView>
                  ))}
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
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
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
    flexDirection: 'row',
    marginRight: 15,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  evidenceCompletion: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  evidenceCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  evidenceRatio: {
    fontSize: 12,
    color: '#666666',
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
  },
  exampleText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 5,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#4CAF50',
  },
  addEvidenceButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  addEvidenceText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  evidenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 5,
  },
  evidenceText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  evidenceStatus: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
  weightText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 3,
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
