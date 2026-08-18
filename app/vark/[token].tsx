import React, { useCallback, useEffect, useState, Component } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/config/supabase';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import {
  VARK_QUESTIONS,
  VARK_STYLE_LABELS,
  VarkStyle,
  computeVarkResult,
} from '@/constants/varkQuestions';

// حد أخطاء لتفادي صفحة بيضاء عند أي خطأ غير متوقع (نفس نمط app/share/[token].tsx)
class VarkPageErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.centered, { padding: 24 }]}>
          <Text style={{ fontSize: 16, color: '#c62828', textAlign: 'center', writingDirection: 'rtl' }}>
            حدث خطأ غير متوقع. يرجى المحاولة لاحقاً أو التحقق من الرابط.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function getTokenFromPathname(pathname: string | undefined): string | undefined {
  if (typeof pathname !== 'string' || !pathname.startsWith('/vark/')) return undefined;
  const segment = pathname.replace(/^\/vark\/?/, '').split('/')[0]?.trim();
  return segment || undefined;
}

function VarkFormScreenInner() {
  const params = useLocalSearchParams<{ token?: string }>();
  const pathname = usePathname();
  const token = params?.token ?? getTokenFromPathname(pathname);

  const [loading, setLoading] = useState(true);
  const [testExists, setTestExists] = useState(false);
  const [testTitle, setTestTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [answers, setAnswers] = useState<Record<number, VarkStyle[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultStyle, setResultStyle] = useState<VarkStyle | 'mixed' | null>(null);

  useEffect(() => {
    if (!token) {
      const t = setTimeout(() => {
        setError('رابط غير صالح');
        setLoading(false);
      }, 400);
      return () => clearTimeout(t);
    }
    setError(null);
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const { data: row, error: e } = await supabase
          .from('vark_tests')
          .select('title')
          .eq('token', token)
          .single();
        if (cancelled) return;
        if (e || !row) {
          setError('لم يتم العثور على هذا الاختبار أو انتهت صلاحية الرابط.');
          setLoading(false);
          return;
        }
        setTestExists(true);
        setTestTitle(row.title ?? null);
      } catch {
        if (!cancelled) setError('حدث خطأ أثناء تحميل الاختبار.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const toggleAnswer = useCallback((questionId: number, style: VarkStyle) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const next = current.includes(style)
        ? current.filter((s) => s !== style)
        : [...current, style];
      return { ...prev, [questionId]: next };
    });
  }, []);

  const handleSubmit = async () => {
    if (!studentName.trim() || !className.trim()) {
      AlertService.alert('تنبيه', formatRTLText('يرجى إدخال اسم الطالب والصف.'));
      return;
    }
    const unanswered = VARK_QUESTIONS.filter((q) => !(answers[q.id] && answers[q.id].length > 0));
    if (unanswered.length > 0) {
      AlertService.alert(
        'تنبيه',
        formatRTLText(`يرجى الإجابة على جميع الأسئلة (متبقٍ ${unanswered.length}).`)
      );
      return;
    }
    if (!token) return;

    setSubmitting(true);
    try {
      const { counts, dominant } = computeVarkResult(answers);
      const { error: e } = await supabase.from('vark_responses').insert({
        test_token: token,
        student_name: studentName.trim(),
        class_name: className.trim(),
        answers,
        style_counts: counts,
        dominant_style: dominant,
      });
      if (e) throw e;
      setResultStyle(dominant);
      setSubmitted(true);
    } catch {
      AlertService.alert('خطأ', formatRTLText('لم يتم إرسال إجاباتك. حاول مرة أخرى.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1c1f33" />
        <ThemedText style={[styles.loadingText, getTextDirection()]}>
          {formatRTLText('جاري تحميل الاستبيان...')}
        </ThemedText>
      </View>
    );
  }

  if (error || !testExists) {
    return (
      <View style={styles.centered}>
        <ThemedText style={[styles.errorText, getTextDirection()]}>
          {formatRTLText(error || 'رابط غير صالح')}
        </ThemedText>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.centered}>
        <ThemedText style={[styles.title, getTextDirection()]}>
          {formatRTLText('شكرًا لك!')}
        </ThemedText>
        <ThemedText style={[styles.subtitle, getTextDirection()]}>
          {formatRTLText('تم إرسال إجاباتك بنجاح.')}
        </ThemedText>
        {resultStyle && resultStyle !== 'mixed' && (
          <ThemedText style={[styles.resultText, getTextDirection()]}>
            {formatRTLText(`نمط تعلمك الأساسي: ${VARK_STYLE_LABELS[resultStyle]}`)}
          </ThemedText>
        )}
        {resultStyle === 'mixed' && (
          <ThemedText style={[styles.resultText, getTextDirection()]}>
            {formatRTLText('نمط تعلمك: مختلط بين أكثر من نمط')}
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, getTextDirection()]}>
          {formatRTLText('استبيان تحديد نمط التعلم (VARK)')}
        </ThemedText>
        {testTitle && (
          <ThemedText style={[styles.subtitle, getTextDirection()]}>
            {formatRTLText(testTitle)}
          </ThemedText>
        )}
        <ThemedText style={[styles.hint, getTextDirection()]}>
          {formatRTLText('اختر الإجابة التي تمثّلك بشكل أكبر، ويمكنك اختيار أكثر من إجابة إن لزم الأمر.')}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <TextInput
          style={[styles.input, getTextDirection()]}
          placeholder={formatRTLText('اسم الطالب')}
          placeholderTextColor="#999"
          value={studentName}
          onChangeText={setStudentName}
          editable={!submitting}
        />
        <TextInput
          style={[styles.input, getTextDirection()]}
          placeholder={formatRTLText('الصف')}
          placeholderTextColor="#999"
          value={className}
          onChangeText={setClassName}
          editable={!submitting}
        />
      </ThemedView>

      {VARK_QUESTIONS.map((q) => (
        <ThemedView key={q.id} style={styles.card}>
          <ThemedText style={[styles.questionText, getTextDirection()]}>
            {formatRTLText(`السؤال ${q.id}: ${q.text}`)}
          </ThemedText>
          {q.options.map((opt) => {
            const selected = (answers[q.id] || []).includes(opt.style);
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionRow, selected && styles.optionRowSelected]}
                onPress={() => toggleAnswer(q.id, opt.style)}
                disabled={submitting}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <View style={styles.checkboxDot} />}
                </View>
                <ThemedText style={[styles.optionText, getTextDirection()]}>
                  {formatRTLText(opt.text)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ThemedView>
      ))}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ThemedText style={styles.submitButtonText}>{formatRTLText('إرسال الإجابات')}</ThemedText>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function VarkFormScreen() {
  return (
    <VarkPageErrorBoundary>
      <VarkFormScreenInner />
    </VarkPageErrorBoundary>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    writingDirection: 'rtl',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    writingDirection: 'rtl',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1f33',
    textAlign: 'center',
    marginTop: 16,
    writingDirection: 'rtl',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  input: {
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
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  optionRowSelected: {
    backgroundColor: '#eef7f5',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#0d9488',
  },
  checkboxDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#0d9488',
  },
  submitButton: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
