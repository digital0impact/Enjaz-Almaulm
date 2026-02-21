import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  useLocalSearchParams,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/config/supabase';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

type ReportSnapshot = {
  performanceData?: Array<{ title: string; score: number; weight: number }>;
  basicData?: { fullName?: string; profession?: string } | null;
  generatedAt?: string;
};

type CommentRow = {
  id: string;
  token: string;
  author_name: string | null;
  comment_text: string;
  created_at: string;
};

export default function SharedAchievementsViewScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportSnapshot | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadComments = useCallback(async (t: string) => {
    try {
      const { data: rows, error: e } = await supabase
        .from('shared_achievement_comments')
        .select('id, token, author_name, comment_text, created_at')
        .eq('token', t)
        .order('created_at', { ascending: true });
      if (!e && rows) setComments((rows as CommentRow[]) || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!token) {
      setError('رابط غير صالح');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: row, error: e } = await supabase
          .from('shared_achievements')
          .select('report_data')
          .eq('token', token)
          .single();
        if (e || !row?.report_data) {
          setError('لم يتم العثور على التقرير أو انتهت صلاحية الرابط.');
          setLoading(false);
          return;
        }
        setData(row.report_data as ReportSnapshot);
        await loadComments(token);
      } catch (err) {
        setError('حدث خطأ أثناء تحميل التقرير.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, loadComments]);

  const submitComment = async () => {
    const text = (commentText || '').trim();
    if (!text) {
      Alert.alert('تنبيه', formatRTLText('يرجى كتابة التعليق.'));
      return;
    }
    if (!token) return;
    setCommentSubmitting(true);
    try {
      const { error: e } = await supabase.from('shared_achievement_comments').insert({
        token,
        author_name: (commentAuthor || '').trim() || null,
        comment_text: text,
      });
      if (e) throw e;
      setCommentText('');
      setCommentAuthor('');
      await loadComments(token);
    } catch (err) {
      Alert.alert('خطأ', formatRTLText('لم يتم إرسال التعليق. حاول مرة أخرى.'));
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <ThemedText style={[styles.loadingText, getTextDirection()]}>
          {formatRTLText('جاري تحميل التقرير...')}
        </ThemedText>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <ThemedText style={[styles.errorText, getTextDirection()]}>
          {formatRTLText(error || 'لا توجد بيانات')}
        </ThemedText>
      </View>
    );
  }

  const performanceData = data.performanceData || [];
  const basicData = data.basicData;
  const overall = performanceData.length
    ? Math.round(
        performanceData.reduce((s, p) => s + (p.score || 0) * (p.weight || 0), 0) /
          Math.max(1, performanceData.reduce((s, p) => s + (p.weight || 0), 0))
      )
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, getTextDirection()]}>
          {formatRTLText('عرض الإنجازات المهنية')}
        </ThemedText>
        {basicData?.fullName && (
          <ThemedText style={[styles.subtitle, getTextDirection()]}>
            {formatRTLText(basicData.fullName)}
            {basicData.profession ? ` • ${basicData.profession}` : ''}
          </ThemedText>
        )}
        <ThemedText style={[styles.viewOnlyNotice, getTextDirection()]}>
          {formatRTLText('عرض فقط — لا يمكنك التحرير. يمكنك التعليق على الإنجازات أدناه.')}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={[styles.cardTitle, getTextDirection()]}>
          {formatRTLText('المعدل العام')}
        </ThemedText>
        <ThemedText style={[styles.overallValue, getTextDirection()]}>{overall}%</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText style={[styles.cardTitle, getTextDirection()]}>
          {formatRTLText('محاور الأداء')}
        </ThemedText>
        {performanceData.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <ThemedText style={[styles.axisTitle, getTextDirection()]} numberOfLines={2}>
              {formatRTLText(item.title)}
            </ThemedText>
            <ThemedText style={[styles.axisScore, getTextDirection()]}>{item.score}%</ThemedText>
          </View>
        ))}
      </ThemedView>

      {data.generatedAt && (
        <ThemedText style={[styles.footer, getTextDirection()]}>
          {formatRTLText('تاريخ الإنشاء:')}{' '}
          {new Date(data.generatedAt).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </ThemedText>
      )}

      <ThemedView style={styles.card}>
        <ThemedText style={[styles.cardTitle, getTextDirection()]}>
          {formatRTLText('التعليقات على الإنجازات')}
        </ThemedText>
        <ThemedText style={[styles.commentsHint, getTextDirection()]}>
          {formatRTLText('يمكنك إضافة تعليقك دون إمكانية تعديل التقرير.')}
        </ThemedText>

        <TextInput
          style={[styles.commentInput, getTextDirection()]}
          placeholder={formatRTLText('اسمك (اختياري)')}
          placeholderTextColor="#999"
          value={commentAuthor}
          onChangeText={setCommentAuthor}
          editable={!commentSubmitting}
        />
        <TextInput
          style={[styles.commentInput, styles.commentTextArea, getTextDirection()]}
          placeholder={formatRTLText('اكتب تعليقك هنا...')}
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          numberOfLines={3}
          editable={!commentSubmitting}
        />
        <TouchableOpacity
          style={[styles.commentSubmitButton, commentSubmitting && styles.commentSubmitDisabled]}
          onPress={submitComment}
          disabled={commentSubmitting}
          activeOpacity={0.8}
        >
          {commentSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.commentSubmitText}>
              {formatRTLText('إرسال التعليق')}
            </ThemedText>
          )}
        </TouchableOpacity>

        <View style={styles.commentsList}>
          {comments.length === 0 ? (
            <ThemedText style={[styles.noComments, getTextDirection()]}>
              {formatRTLText('لا توجد تعليقات بعد.')}
            </ThemedText>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <ThemedText style={[styles.commentItemMeta, getTextDirection()]}>
                  {c.author_name || formatRTLText('زائر')}
                  {' · '}
                  {new Date(c.created_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
                <ThemedText style={[styles.commentItemText, getTextDirection()]}>
                  {formatRTLText(c.comment_text)}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f7',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666', writingDirection: 'rtl' },
  errorText: { fontSize: 16, color: '#c62828', textAlign: 'center', writingDirection: 'rtl' },
  header: { marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1c1f33',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  overallValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A90E2',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  axisTitle: { flex: 1, fontSize: 15, color: '#333', textAlign: 'right', writingDirection: 'rtl' },
  axisScore: { fontSize: 16, fontWeight: '600', color: '#4A90E2', marginRight: 12, writingDirection: 'rtl' },
  footer: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 16, writingDirection: 'rtl' },
  viewOnlyNotice: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
    writingDirection: 'rtl',
    fontStyle: 'italic',
  },
  commentsHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: '#fff',
  },
  commentTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  commentSubmitDisabled: { opacity: 0.7 },
  commentSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  commentsList: { gap: 12 },
  commentItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    borderRightWidth: 3,
    borderRightColor: '#4A90E2',
  },
  commentItemMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  commentItemText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noComments: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 16,
    writingDirection: 'rtl',
  },
});
