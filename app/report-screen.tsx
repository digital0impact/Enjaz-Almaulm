
import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, ImageBackground } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { commonStyles } from '@/styles/common-styles';

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // استقبال البيانات من صفحة الأداء المهني
  const axisResults = params.axisResults ? JSON.parse(params.axisResults as string) : [];
  const overallAverage = params.overallAverage ? parseFloat(params.overallAverage as string) : 0;
  const overallGrade = params.overallGrade as string || '';

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
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
              </TouchableOpacity>

              <IconSymbol size={60} name="doc.text.fill" color="#1c1f33" />
              <ThemedText type="title" style={styles.title}>
                📄 التقرير التفصيلي للأداء المهني
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                تقرير شامل لتقييم الأداء المهني وتحليل النتائج
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.summaryCard}>
              <ThemedText style={styles.summaryTitle}>
                ملخص النتائج العامة
              </ThemedText>
              <ThemedView style={styles.summaryContent}>
                <ThemedText style={[styles.overallScore, { color: getScoreColor(overallAverage) }]}>
                  المتوسط العام: {overallAverage}%
                </ThemedText>
                <ThemedText style={[styles.overallGrade, { color: getScoreColor(overallAverage) }]}>
                  التقدير: {getScoreLevel(overallAverage)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.content}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                تفاصيل محاور الأداء
              </ThemedText>

              {axisResults.map((axis: any, index: number) => (
                <ThemedView key={index} style={styles.axisBox}>
                  <ThemedView style={styles.axisHeader}>
                    <ThemedView style={styles.axisNumberContainer}>
                      <ThemedText style={styles.axisNumber}>
                        {index + 1}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.axisTitleContainer}>
                      <ThemedText style={styles.axisTitle}>
                        {axis.title}
                      </ThemedText>
                      <ThemedText style={[styles.axisScore, { color: getScoreColor(axis.score) }]}>
                        الدرجة: {axis.score}% - {getScoreLevel(axis.score)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.progressBar}>
                    <ThemedView 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${axis.score}%`,
                          backgroundColor: getScoreColor(axis.score)
                        }
                      ]} 
                    />
                  </ThemedView>

                  <ThemedView style={styles.evidenceSection}>
                    <ThemedText style={styles.evidenceHeader}>
                      الشواهد المحققة:
                    </ThemedText>
                    {axis.evidences.filter((e: any) => e.achieved).map((evidence: any) => (
                      <ThemedView key={evidence.id} style={styles.evidenceItem}>
                        <IconSymbol size={12} name="checkmark.circle.fill" color="#4CAF50" />
                        <ThemedText style={styles.evidenceText}>
                          {evidence.label}
                        </ThemedText>
                      </ThemedView>
                    ))}
                    
                    {axis.evidences.filter((e: any) => !e.achieved).length > 0 && (
                      <ThemedView style={styles.missingEvidenceSection}>
                        <ThemedText style={styles.missingEvidenceHeader}>
                          الشواهد غير المحققة:
                        </ThemedText>
                        {axis.evidences.filter((e: any) => !e.achieved).map((evidence: any) => (
                          <ThemedView key={evidence.id} style={styles.missingEvidenceItem}>
                            <IconSymbol size={12} name="xmark.circle.fill" color="#F44336" />
                            <ThemedText style={styles.missingEvidenceText}>
                              {evidence.label}
                            </ThemedText>
                          </ThemedView>
                        ))}
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>
              ))}

              <ThemedView style={styles.recommendationsCard}>
                <ThemedText style={styles.recommendationsTitle}>
                  <IconSymbol size={20} name="lightbulb.fill" color="#FF9800" /> توصيات للتحسين
                </ThemedText>
                <ThemedView style={styles.recommendationsList}>
                  {axisResults
                    .filter((axis: any) => axis.score < 85)
                    .sort((a: any, b: any) => a.score - b.score)
                    .slice(0, 3)
                    .map((axis: any, index: number) => (
                      <ThemedView key={index} style={styles.recommendationItem}>
                        <IconSymbol size={14} name="arrow.up.circle.fill" color="#2196F3" />
                        <ThemedText style={styles.recommendationText}>
                          تطوير مجال "{axis.title}" - النسبة الحالية: {axis.score}%
                        </ThemedText>
                      </ThemedView>
                    ))}
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.actionButtons}>
                <TouchableOpacity style={styles.printButton}>
                  <IconSymbol size={16} name="printer.fill" color="#1c1f33" />
                  <ThemedText style={styles.buttonText}>طباعة التقرير</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton}>
                  <IconSymbol size={16} name="square.and.arrow.up.fill" color="#1c1f33" />
                  <ThemedText style={styles.buttonText}>مشاركة التقرير</ThemedText>
                </TouchableOpacity>
              </ThemedView>
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
  scrollContainer: {
    flex: 1,
    ...commonStyles.scrollViewWithBottomNav,
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
  title: {
    color: '#1c1f33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  subtitle: {
    color: '#1c1f33',
    fontSize: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.9,
  },
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  summaryCard: {
    backgroundColor: '#add4ce',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  summaryContent: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overallScore: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  overallGrade: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 20,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  axisBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  axisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  axisNumberContainer: {
    backgroundColor: '#add4ce',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  axisNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  axisTitleContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  axisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 5,
  },
  axisScore: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  evidenceSection: {
    backgroundColor: 'transparent',
  },
  evidenceHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  evidenceText: {
    fontSize: 12,
    color: '#2E7D32',
    marginRight: 8,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  missingEvidenceSection: {
    marginTop: 15,
    backgroundColor: 'transparent',
  },
  missingEvidenceHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  missingEvidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  missingEvidenceText: {
    fontSize: 12,
    color: '#D32F2F',
    marginRight: 8,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recommendationsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recommendationsList: {
    backgroundColor: 'transparent',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  recommendationText: {
    fontSize: 12,
    color: '#E65100',
    marginRight: 8,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
    backgroundColor: 'transparent',
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
