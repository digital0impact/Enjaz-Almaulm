import React, { useEffect, useState, Component } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/config/supabase';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import { VARK_STYLE_LABELS, VarkStyle } from '@/constants/varkQuestions';
import { ClassSummary } from '@/utils/varkResults';
import AuthService from '@/services/AuthService';

// حد أخطاء لتفادي صفحة بيضاء عند أي خطأ غير متوقع (نفس نمط app/share/[token].tsx)
class VarkResultsErrorBoundary extends Component<
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
  if (typeof pathname !== 'string' || !pathname.startsWith('/vark-results/')) return undefined;
  const segment = pathname.replace(/^\/vark-results\/?/, '').split('/')[0]?.trim();
  return segment || undefined;
}

interface SharedResultsRow {
  token: string;
  owner_user_id: string;
  title: string | null;
  class_summary: ClassSummary[];
  total_responses: number;
}

function VarkResultsScreenInner() {
  const params = useLocalSearchParams<{ token?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const token = params?.token ?? getTokenFromPathname(pathname);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<SharedResultsRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('رابط غير صالح');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [{ data, error: e }, user] = await Promise.all([
          supabase
            .from('vark_shared_results')
            .select('token, owner_user_id, title, class_summary, total_responses')
            .eq('token', token)
            .single(),
          AuthService.getCurrentUser(),
        ]);
        if (cancelled) return;
        if (e || !data) {
          setError('لم يتم العثور على نتائج بهذا الرابط، أو لم تُشارَك بعد.');
          setLoading(false);
          return;
        }
        setRow(data as SharedResultsRow);
        setCurrentUserId(user?.id ?? null);
      } catch {
        if (!cancelled) setError('حدث خطأ أثناء تحميل النتائج.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleAddToMyTests = async () => {
    if (!row) return;
    setAdding(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        AlertService.alert('تنبيه', formatRTLText('يجب تسجيل الدخول أولاً بحساب معلمة لإضافة النتائج.'));
        return;
      }
      const bytes = await Crypto.getRandomBytesAsync(16);
      const newToken = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const { error: e } = await supabase.from('vark_tests').insert({
        token: newToken,
        user_id: user.id,
        title: row.title || 'اختبار بدون عنوان',
        imported_summary: row.class_summary,
        imported_total: row.total_responses,
      });
      if (e) throw e;
      setAdded(true);
      AlertService.alert(
        formatRTLText('تمت الإضافة'),
        formatRTLText('أُضيفت النتائج إلى "اختباراتي" في صفحة تحليل أنماط تعلم الطلاب.')
      );
    } catch (e) {
      console.error(e);
      AlertService.alert('خطأ', formatRTLText('تعذّرت إضافة النتائج. حاول مرة أخرى.'));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1c1f33" />
        <ThemedText style={[styles.loadingText, getTextDirection()]}>
          {formatRTLText('جاري تحميل النتائج...')}
        </ThemedText>
      </View>
    );
  }

  if (error || !row) {
    return (
      <View style={styles.centered}>
        <ThemedText style={[styles.errorText, getTextDirection()]}>
          {formatRTLText(error || 'رابط غير صالح')}
        </ThemedText>
      </View>
    );
  }

  const isOwner = !!currentUserId && currentUserId === row.owner_user_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, getTextDirection()]}>
          {formatRTLText('نتائج اختبار نمط التعلم (VARK)')}
        </ThemedText>
        {row.title && (
          <ThemedText style={[styles.subtitle, getTextDirection()]}>{formatRTLText(row.title)}</ThemedText>
        )}
        <ThemedText style={[styles.hint, getTextDirection()]}>
          {formatRTLText(`إجمالي عدد الاستجابات: ${row.total_responses}`)}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.tableCard}>
        <View style={styles.resultsHeaderRow}>
          <ThemedText style={[styles.resultsHeaderCell, styles.resultsColClass]}>
            {formatRTLText('الصف')}
          </ThemedText>
          {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
            <ThemedText key={style} style={[styles.resultsHeaderCell, styles.resultsColStyle]}>
              {formatRTLText(VARK_STYLE_LABELS[style])}
            </ThemedText>
          ))}
          <ThemedText style={[styles.resultsHeaderCell, styles.resultsColStyle]}>
            {formatRTLText('مختلط')}
          </ThemedText>
          <ThemedText style={[styles.resultsHeaderCell, styles.resultsColTotal]}>
            {formatRTLText('الإجمالي')}
          </ThemedText>
        </View>

        {row.class_summary.map((cls) => (
          <View key={cls.className} style={styles.resultsDataRow}>
            <ThemedText style={[styles.resultsCell, styles.resultsColClass]} numberOfLines={1}>
              {formatRTLText(cls.className)}
            </ThemedText>
            {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
              <ThemedText key={style} style={[styles.resultsCell, styles.resultsColStyle]}>
                {cls.counts[style]}
              </ThemedText>
            ))}
            <ThemedText style={[styles.resultsCell, styles.resultsColStyle]}>{cls.counts.mixed}</ThemedText>
            <ThemedText style={[styles.resultsCell, styles.resultsColTotal, styles.resultsTotalText]}>
              {cls.total}
            </ThemedText>
          </View>
        ))}
      </ThemedView>

      {isOwner ? (
        <ThemedText style={[styles.ownerNote, getTextDirection()]}>
          {formatRTLText('هذا اختبارك، ويظهر ضمن "اختباراتي" في صفحة تحليل أنماط تعلم الطلاب.')}
        </ThemedText>
      ) : added ? (
        <ThemedView style={styles.addedBox}>
          <IconSymbol size={22} name="checkmark.circle.fill" color="#0d9488" />
          <ThemedText style={[styles.addedText, getTextDirection()]}>
            {formatRTLText('أُضيفت النتائج إلى حسابك.')}
          </ThemedText>
        </ThemedView>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.addButton, adding && styles.addButtonDisabled]}
            onPress={handleAddToMyTests}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol size={20} name="plus.circle.fill" color="#fff" />
                <ThemedText style={styles.addButtonText}>{formatRTLText('إضافة إلى اختباراتي')}</ThemedText>
              </>
            )}
          </TouchableOpacity>
          <ThemedText style={[styles.addHint, getTextDirection()]}>
            {formatRTLText('يحفظ نسخة من هذا الملخص في حسابك، بدل إنشاء اختبار جديد وإرسال رابط جديد لنفس الطلاب.')}
          </ThemedText>
        </>
      )}

      <TouchableOpacity style={styles.homeLink} onPress={() => router.push('/learning-styles')}>
        <ThemedText style={[styles.homeLinkText, getTextDirection()]}>
          {formatRTLText('الذهاب إلى تحليل أنماط تعلم الطلاب')}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function VarkResultsScreen() {
  return (
    <VarkResultsErrorBoundary>
      <VarkResultsScreenInner />
    </VarkResultsErrorBoundary>
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
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 20,
  },
  resultsHeaderRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#e9edf1',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultsHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  resultsDataRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  resultsCell: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  resultsColClass: { width: 100, textAlign: 'right' },
  resultsColStyle: { width: 64 },
  resultsColTotal: { width: 70, fontWeight: '700' },
  resultsTotalText: { fontWeight: '700', color: '#1c1f33' },
  ownerNote: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  addButton: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addHint: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 10 },
  addedBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eef7f5',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addedText: { color: '#0d9488', fontSize: 15, fontWeight: '700' },
  homeLink: { marginTop: 20, alignItems: 'center' },
  homeLinkText: { fontSize: 14, color: '#1c1f33', fontWeight: '600', textDecorationLine: 'underline' },
});
