
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedCard } from '@/components/ThemedCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Comment {
  id: string;
  title: string;
  content: string;
  category: 'عام' | 'تعليمي' | 'إداري' | 'تقني';
  priority: 'عادي' | 'مهم' | 'عاجل';
  status: 'جديد' | 'قيد المراجعة' | 'مكتمل';
  date: string;
}

export default function CommentsScreen() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newComment, setNewComment] = useState({
    title: '',
    content: '',
    category: 'عام' as Comment['category'],
    priority: 'عادي' as Comment['priority']
  });

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const stored = await AsyncStorage.getItem('teacherComments');
      if (stored) {
        setComments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const saveComments = async (commentsData: Comment[]) => {
    try {
      await AsyncStorage.setItem('teacherComments', JSON.stringify(commentsData));
    } catch (error) {
      console.error('Error saving comments:', error);
    }
  };

  const addComment = () => {
    if (!newComment.title.trim() || !newComment.content.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const comment: Comment = {
      id: Date.now().toString(),
      title: newComment.title,
      content: newComment.content,
      category: newComment.category,
      priority: newComment.priority,
      status: 'جديد',
      date: new Date().toLocaleDateString('ar-SA')
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    saveComments(updatedComments);
    
    setNewComment({
      title: '',
      content: '',
      category: 'عام',
      priority: 'عادي'
    });
    setShowAddForm(false);
    
    Alert.alert('نجح', 'تم إضافة التعليق بنجاح');
  };

  const deleteComment = (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا التعليق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const updatedComments = comments.filter(comment => comment.id !== id);
            setComments(updatedComments);
            saveComments(updatedComments);
          }
        }
      ]
    );
  };

  const updateCommentStatus = (id: string, newStatus: Comment['status']) => {
    const updatedComments = comments.map(comment =>
      comment.id === id ? { ...comment, status: newStatus } : comment
    );
    setComments(updatedComments);
    saveComments(updatedComments);
  };

  const getCategoryColor = (category: Comment['category']) => {
    switch (category) {
      case 'تعليمي': return '#4CAF50';
      case 'إداري': return '#2196F3';
      case 'تقني': return '#FF9800';
      default: return '#9C27B0';
    }
  };

  const getPriorityColor = (priority: Comment['priority']) => {
    switch (priority) {
      case 'عاجل': return '#F44336';
      case 'مهم': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const getStatusColor = (status: Comment['status']) => {
    switch (status) {
      case 'مكتمل': return '#4CAF50';
      case 'قيد المراجعة': return '#FF9800';
      default: return '#9C27B0';
    }
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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <ThemedView style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={24} name="arrow.right" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.headerContent}>
                <ThemedView style={styles.headerIcon}>
                  <IconSymbol size={32} name="text.bubble.fill" color="#1c1f33" />
                </ThemedView>
                <ThemedText type="title" style={styles.title}>
                  التعليقات والملاحظات
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  إدارة التعليقات والملاحظات المهنية
                </ThemedText>
                
                <TouchableOpacity
                  style={styles.centerAddButton}
                  onPress={() => setShowAddForm(!showAddForm)}
                >
                  <IconSymbol size={24} name="plus" color="#1c1f33" />
                  <ThemedText style={styles.addButtonText}>إضافة تعليق جديد</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={styles.spacer} />
            </ThemedView>

            <ScrollView style={styles.content}>
              {/* Add Comment Form */}
              {showAddForm && (
                <ThemedView style={styles.addForm}>
                  <ThemedText style={styles.formTitle}>إضافة تعليق جديد</ThemedText>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="عنوان التعليق"
                    value={newComment.title}
                    onChangeText={(text) => setNewComment({ ...newComment, title: text })}
                    textAlign="right"
                    writingDirection="rtl"
                  />

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="محتوى التعليق"
                    value={newComment.content}
                    onChangeText={(text) => setNewComment({ ...newComment, content: text })}
                    multiline
                    numberOfLines={4}
                    textAlign="right"
                    writingDirection="rtl"
                  />

                  <ThemedView style={styles.selectionRow}>
                    <ThemedView style={styles.pickerContainer}>
                      <ThemedText style={styles.pickerLabel}>الفئة:</ThemedText>
                      <ThemedView style={styles.pickerButtons}>
                        {(['عام', 'تعليمي', 'إداري', 'تقني'] as const).map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.pickerButton,
                              newComment.category === category && styles.selectedButton,
                              { backgroundColor: newComment.category === category ? getCategoryColor(category) : '#F8F9FA' }
                            ]}
                            onPress={() => setNewComment({ ...newComment, category })}
                          >
                            <ThemedText style={[
                              styles.pickerButtonText,
                              newComment.category === category && styles.selectedButtonText
                            ]}>
                              {category}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>

                    <ThemedView style={styles.pickerContainer}>
                      <ThemedText style={styles.pickerLabel}>الأولوية:</ThemedText>
                      <ThemedView style={styles.pickerButtons}>
                        {(['عادي', 'مهم', 'عاجل'] as const).map((priority) => (
                          <TouchableOpacity
                            key={priority}
                            style={[
                              styles.pickerButton,
                              newComment.priority === priority && styles.selectedButton,
                              { backgroundColor: newComment.priority === priority ? getPriorityColor(priority) : '#F8F9FA' }
                            ]}
                            onPress={() => setNewComment({ ...newComment, priority })}
                          >
                            <ThemedText style={[
                              styles.pickerButtonText,
                              newComment.priority === priority && styles.selectedButtonText
                            ]}>
                              {priority}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.formButtons}>
                    <TouchableOpacity style={styles.submitButton} onPress={addComment}>
                      <IconSymbol size={20} name="checkmark" color="#fff" />
                      <ThemedText style={styles.submitButtonText}>إضافة</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setShowAddForm(false)}
                    >
                      <IconSymbol size={20} name="xmark" color="#fff" />
                      <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              )}

              {/* Comments List */}
              {comments.length === 0 ? (
                <ThemedView style={styles.emptyState}>
                  <ThemedView style={styles.emptyIconContainer}>
                    <IconSymbol size={60} name="text.bubble" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.emptyTitle}>لا توجد تعليقات</ThemedText>
                  <ThemedText style={styles.emptySubtitle}>اضغط على + لإضافة تعليق جديد</ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={styles.commentsList}>
                  {comments.map((comment) => (
                    <ThemedView key={comment.id} style={styles.commentCard}>
                      <ThemedView style={styles.commentHeader}>
                        <ThemedView style={styles.commentBadges}>
                          <ThemedView style={[styles.badge, { backgroundColor: getCategoryColor(comment.category) }]}>
                            <ThemedText style={styles.badgeText}>{comment.category}</ThemedText>
                          </ThemedView>
                          <ThemedView style={[styles.badge, { backgroundColor: getPriorityColor(comment.priority) }]}>
                            <ThemedText style={styles.badgeText}>{comment.priority}</ThemedText>
                          </ThemedView>
                          <ThemedView style={[styles.badge, { backgroundColor: getStatusColor(comment.status) }]}>
                            <ThemedText style={styles.badgeText}>{comment.status}</ThemedText>
                          </ThemedView>
                        </ThemedView>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteComment(comment.id)}
                        >
                          <IconSymbol size={20} name="trash" color="#F44336" />
                        </TouchableOpacity>
                      </ThemedView>

                      <ThemedText style={styles.commentTitle}>{comment.title}</ThemedText>
                      <ThemedText style={styles.commentContent}>{comment.content}</ThemedText>
                      <ThemedText style={styles.commentDate}>{comment.date}</ThemedText>

                      <ThemedView style={styles.statusButtons}>
                        {(['جديد', 'قيد المراجعة', 'مكتمل'] as const).map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusButton,
                              comment.status === status && { backgroundColor: getStatusColor(status) }
                            ]}
                            onPress={() => updateCommentStatus(comment.id, status)}
                          >
                            <ThemedText style={[
                              styles.statusButtonText,
                              comment.status === status && styles.selectedStatusText
                            ]}>
                              {status}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'transparent',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    padding: 12,
    backgroundColor: '#add4ce',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'center',
    marginBottom: 15,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    writingDirection: 'rtl',
    marginTop: 5,
  },
  addButton: {
    padding: 10,
    backgroundColor: '#add4ce',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  centerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  spacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addForm: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectionRow: {
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'right',
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#1c1f33',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  submitButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  cancelButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyIconContainer: {
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  commentsList: {
    gap: 15,
  },
  commentCard: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  commentBadges: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    color: '#1c1f33',
    writingDirection: 'rtl',
  },
  commentContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    textAlign: 'right',
    color: '#333',
    writingDirection: 'rtl',
  },
  commentDate: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginBottom: 15,
    writingDirection: 'rtl',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonText: {
    fontSize: 12,
    color: '#1c1f33',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedStatusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
