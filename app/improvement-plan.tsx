
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, I18nManager, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface ImprovementGoal {
  id: number;
  title: string;
  description: string;
  targetScore: number;
  currentScore: number;
  deadline: string;
  actions: string[];
  resources: string[];
  completed: boolean;
}

export default function ImprovementPlanScreen() {
  const router = useRouter();
  const [improvementGoals, setImprovementGoals] = useState<ImprovementGoal[]>([
    {
      id: 1,
      title: 'تحسين توظيف التقنيات ووسائل التعلم',
      description: 'زيادة استخدام التقنية في التعليم وتنويع الوسائل التعليمية',
      targetScore: 90,
      currentScore: 82,
      deadline: '2024-06-30',
      actions: [
        'حضور دورة في التعليم الإلكتروني',
        'استخدام تطبيقات تعليمية جديدة',
        'إنشاء محتوى تفاعلي للدروس'
      ],
      resources: [
        'منصة التعليم الإلكتروني',
        'أجهزة العرض',
        'تطبيقات الهاتف الذكي'
      ],
      completed: false
    },
    {
      id: 2,
      title: 'تطوير تنويع أساليب التقويم',
      description: 'تحسين استخدام أساليب التقويم المختلفة وزيادة فعاليتها',
      targetScore: 92,
      currentScore: 84,
      deadline: '2024-07-15',
      actions: [
        'تطبيق المشاريع الطلابية',
        'استخدام ملفات الإنجاز',
        'تنويع الاختبارات الإلكترونية'
      ],
      resources: [
        'منصة الاختبارات الإلكترونية',
        'نماذج ملفات الإنجاز',
        'أدوات التقييم'
      ],
      completed: false
    },
    {
      id: 3,
      title: 'تحسين نتائج المتعلمين',
      description: 'رفع مستوى الطلاب وتحسين نتائجهم الأكاديمية',
      targetScore: 93,
      currentScore: 85,
      deadline: '2024-08-30',
      actions: [
        'وضع خطط علاجية للطلاب الضعاف',
        'برامج إثرائية للمتميزين',
        'متابعة دورية للتقدم'
      ],
      resources: [
        'أوراق عمل إضافية',
        'مصادر تعليمية متنوعة',
        'برامج دعم الطلاب'
      ],
      completed: false
    }
  ]);

  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [newAction, setNewAction] = useState('');
  const [newResource, setNewResource] = useState('');

  useEffect(() => {
    loadImprovementPlan();
  }, []);

  const loadImprovementPlan = async () => {
    try {
      const storedPlan = await AsyncStorage.getItem('improvementPlan');
      if (storedPlan) {
        setImprovementGoals(JSON.parse(storedPlan));
      }
    } catch (error) {
      console.log('Error loading improvement plan:', error);
    }
  };

  const saveImprovementPlan = async (updatedGoals: ImprovementGoal[]) => {
    try {
      await AsyncStorage.setItem('improvementPlan', JSON.stringify(updatedGoals));
      setImprovementGoals(updatedGoals);
    } catch (error) {
      console.log('Error saving improvement plan:', error);
    }
  };

  const toggleGoalCompletion = (goalId: number) => {
    const updatedGoals = improvementGoals.map(goal =>
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    );
    saveImprovementPlan(updatedGoals);
  };

  const addAction = (goalId: number) => {
    if (newAction.trim()) {
      const updatedGoals = improvementGoals.map(goal =>
        goal.id === goalId 
          ? { ...goal, actions: [...goal.actions, newAction.trim()] }
          : goal
      );
      saveImprovementPlan(updatedGoals);
      setNewAction('');
    }
  };

  const addResource = (goalId: number) => {
    if (newResource.trim()) {
      const updatedGoals = improvementGoals.map(goal =>
        goal.id === goalId 
          ? { ...goal, resources: [...goal.resources, newResource.trim()] }
          : goal
      );
      saveImprovementPlan(updatedGoals);
      setNewResource('');
    }
  };

  const removeAction = (goalId: number, actionIndex: number) => {
    const updatedGoals = improvementGoals.map(goal =>
      goal.id === goalId 
        ? { ...goal, actions: goal.actions.filter((_, index) => index !== actionIndex) }
        : goal
    );
    saveImprovementPlan(updatedGoals);
  };

  const removeResource = (goalId: number, resourceIndex: number) => {
    const updatedGoals = improvementGoals.map(goal =>
      goal.id === goalId 
        ? { ...goal, resources: goal.resources.filter((_, index) => index !== resourceIndex) }
        : goal
    );
    saveImprovementPlan(updatedGoals);
  };

  const addNewGoal = () => {
    Alert.prompt(
      'إضافة هدف جديد',
      'أدخل عنوان الهدف:',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إضافة',
          onPress: (title) => {
            if (title && title.trim()) {
              const newGoal: ImprovementGoal = {
                id: Date.now(),
                title: title.trim(),
                description: '',
                targetScore: 90,
                currentScore: 80,
                deadline: '',
                actions: [],
                resources: [],
                completed: false
              };
              const updatedGoals = [...improvementGoals, newGoal];
              saveImprovementPlan(updatedGoals);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = getProgressPercentage(current, target);
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#FF9800';
    return '#F44336';
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
              <IconSymbol size={50} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
              <ThemedText type="title" style={styles.headerTitle}>
                خطة التحسين المهني
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                خطة شاملة لتطوير أدائك المهني وتحقيق أهدافك التعليمية
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ScrollView style={styles.content}>
            <ThemedView style={styles.overviewCard}>
              <ThemedText style={styles.overviewTitle}>
                نظرة عامة على الأهداف
              </ThemedText>
              <ThemedView style={styles.statsRow}>
                <ThemedView style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>
                    {improvementGoals.filter(goal => goal.completed).length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>مكتملة</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>
                    {improvementGoals.filter(goal => !goal.completed).length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>قيد التنفيذ</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>
                    {improvementGoals.length}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>إجمالي الأهداف</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.goalsSection}>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  أهداف التحسين
                </ThemedText>
                <TouchableOpacity 
                  style={styles.addGoalButton}
                  onPress={addNewGoal}
                >
                  <IconSymbol size={16} name="plus.circle.fill" color="#4CAF50" />
                  <ThemedText style={styles.addGoalText}>إضافة هدف</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {improvementGoals.map((goal) => (
                <ThemedView key={goal.id} style={[
                  styles.goalCard,
                  goal.completed && styles.completedGoalCard
                ]}>
                  <ThemedView style={styles.goalHeader}>
                    <TouchableOpacity
                      onPress={() => toggleGoalCompletion(goal.id)}
                      style={styles.checkboxContainer}
                    >
                      <IconSymbol 
                        size={20} 
                        name={goal.completed ? "checkmark.circle.fill" : "circle"} 
                        color={goal.completed ? "#4CAF50" : "#666"} 
                      />
                    </TouchableOpacity>
                    <ThemedView style={styles.goalInfo}>
                      <ThemedText style={[
                        styles.goalTitle,
                        goal.completed && styles.completedGoalTitle
                      ]}>
                        {goal.title}
                      </ThemedText>
                      <ThemedText style={styles.goalDescription}>
                        {goal.description}
                      </ThemedText>
                    </ThemedView>
                    <TouchableOpacity
                      onPress={() => setEditingGoal(editingGoal === goal.id ? null : goal.id)}
                      style={styles.editButton}
                    >
                      <IconSymbol 
                        size={18} 
                        name="pencil.circle.fill" 
                        color="#007AFF" 
                      />
                    </TouchableOpacity>
                  </ThemedView>

                  <ThemedView style={styles.progressSection}>
                    <ThemedView style={styles.progressInfo}>
                      <ThemedText style={styles.progressLabel}>
                        التقدم: {goal.currentScore} / {goal.targetScore}
                      </ThemedText>
                      <ThemedText style={[
                        styles.progressPercentage,
                        { color: getProgressColor(goal.currentScore, goal.targetScore) }
                      ]}>
                        {getProgressPercentage(goal.currentScore, goal.targetScore)}%
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.progressBar}>
                      <ThemedView 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${getProgressPercentage(goal.currentScore, goal.targetScore)}%`,
                            backgroundColor: getProgressColor(goal.currentScore, goal.targetScore)
                          }
                        ]}
                      />
                    </ThemedView>
                    {goal.deadline && (
                      <ThemedText style={styles.deadline}>
                        الموعد المستهدف: {goal.deadline}
                      </ThemedText>
                    )}
                  </ThemedView>

                  {editingGoal === goal.id && (
                    <ThemedView style={styles.editingSection}>
                      <ThemedView style={styles.actionsSection}>
                        <ThemedText style={styles.subsectionTitle}>الإجراءات المطلوبة:</ThemedText>
                        {goal.actions.map((action, index) => (
                          <ThemedView key={index} style={styles.actionItem}>
                            <ThemedText style={styles.actionText}>• {action}</ThemedText>
                            <TouchableOpacity
                              onPress={() => removeAction(goal.id, index)}
                              style={styles.removeButton}
                            >
                              <IconSymbol size={14} name="xmark.circle.fill" color="#F44336" />
                            </TouchableOpacity>
                          </ThemedView>
                        ))}
                        <ThemedView style={styles.addItemRow}>
                          <TextInput
                            style={styles.addItemInput}
                            placeholder="إضافة إجراء جديد..."
                            value={newAction}
                            onChangeText={setNewAction}
                            multiline
                          />
                          <TouchableOpacity
                            onPress={() => addAction(goal.id)}
                            style={styles.addItemButton}
                          >
                            <IconSymbol size={16} name="plus" color="#4CAF50" />
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>

                      <ThemedView style={styles.resourcesSection}>
                        <ThemedText style={styles.subsectionTitle}>الموارد المطلوبة:</ThemedText>
                        {goal.resources.map((resource, index) => (
                          <ThemedView key={index} style={styles.resourceItem}>
                            <ThemedText style={styles.resourceText}>• {resource}</ThemedText>
                            <TouchableOpacity
                              onPress={() => removeResource(goal.id, index)}
                              style={styles.removeButton}
                            >
                              <IconSymbol size={14} name="xmark.circle.fill" color="#F44336" />
                            </TouchableOpacity>
                          </ThemedView>
                        ))}
                        <ThemedView style={styles.addItemRow}>
                          <TextInput
                            style={styles.addItemInput}
                            placeholder="إضافة مورد جديد..."
                            value={newResource}
                            onChangeText={setNewResource}
                            multiline
                          />
                          <TouchableOpacity
                            onPress={() => addResource(goal.id)}
                            style={styles.addItemButton}
                          >
                            <IconSymbol size={16} name="plus" color="#4CAF50" />
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>
                  )}
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={() => {
                  Alert.alert('تم الحفظ', 'تم حفظ خطة التحسين بنجاح');
                }}
              >
                <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
                <ThemedText style={styles.buttonText}>حفظ الخطة</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.exportButton}
                onPress={() => {
                  Alert.alert('تصدير', 'سيتم تصدير خطة التحسين قريباً');
                }}
              >
                <IconSymbol size={20} name="square.and.arrow.up.fill" color="#1c1f33" />
                <ThemedText style={styles.buttonText}>تصدير الخطة</ThemedText>
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
  content: {
    flex: 1,
    padding: 15,
  },
  overviewCard: {
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
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  addGoalText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  completedGoalCard: {
    backgroundColor: '#f9f9f9',
    opacity: 0.8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  checkboxContainer: {
    marginLeft: 10,
    marginTop: 2,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 5,
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  editButton: {
    padding: 5,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  deadline: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editingSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 15,
  },
  actionsSection: {
    marginBottom: 20,
  },
  resourcesSection: {
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  resourceText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  removeButton: {
    padding: 2,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addItemButton: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  saveButton: {
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
  buttonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
