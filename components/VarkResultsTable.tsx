import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import { supabase } from '@/config/supabase';
import AuthService from '@/services/AuthService';
import { VARK_STYLE_LABELS, VarkStyle } from '@/constants/varkQuestions';

interface VarkResponseRow {
  class_name: string;
  dominant_style: string;
}

interface ClassSummary {
  className: string;
  total: number;
  counts: Record<VarkStyle | 'mixed', number>;
}

const EMPTY_COUNTS = (): Record<VarkStyle | 'mixed', number> => ({
  V: 0,
  A: 0,
  R: 0,
  K: 0,
  mixed: 0,
});

function summarizeByClass(responses: VarkResponseRow[]): ClassSummary[] {
  const map = new Map<string, ClassSummary>();
  responses.forEach((r) => {
    const className = r.class_name || 'غير محدد';
    if (!map.has(className)) {
      map.set(className, { className, total: 0, counts: EMPTY_COUNTS() });
    }
    const entry = map.get(className)!;
    entry.total += 1;
    const style = (r.dominant_style as VarkStyle | 'mixed') || 'mixed';
    entry.counts[style] = (entry.counts[style] || 0) + 1;
  });
  return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className, 'ar'));
}

/**
 * جدول نتائج VARK مجمّع (للقراءة فقط) — يُستخدم كشاهد مضمَّن داخل محور
 * "تحليل نتائج المتعلمين وتشخيص مستوياتهم" في شاشة الأداء المهني، مرتبط
 * مباشرة ببيانات Supabase الفعلية (vark_tests + vark_responses): يجمع
 * إجابات جميع الطلاب من كل اختبارات VARK التي أنشأها المعلم معًا، ويعرض
 * توزيع الأنماط حسب الصف في جدول واحد (نفس منطق شاشة app/learning-styles.tsx).
 */
export function VarkResultsTable() {
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<VarkResponseRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (!user) {
          setResponses([]);
          return;
        }
        const { data: tests, error: testsError } = await supabase
          .from('vark_tests')
          .select('token')
          .eq('user_id', user.id);
        if (testsError || !tests || tests.length === 0) {
          setResponses([]);
          return;
        }
        const tokens = tests.map((t) => t.token);
        const { data: rows, error: responsesError } = await supabase
          .from('vark_responses')
          .select('class_name, dominant_style')
          .in('test_token', tokens);
        if (!responsesError && rows) setResponses(rows as VarkResponseRow[]);
        else setResponses([]);
      } catch (e) {
        console.warn('Could not load VARK results for evidence preview:', e);
        setResponses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator color="#1c1f33" style={styles.loader} />;
  }

  const classSummaries = summarizeByClass(responses);

  if (classSummaries.length === 0) {
    return (
      <ThemedText style={[styles.emptyText, getTextDirection()]}>
        {formatRTLText('لا توجد إجابات على استبيانات VARK بعد.')}
      </ThemedText>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scroll}>
      <ThemedView style={[styles.table, { direction: 'rtl' }]}>
        <ThemedView style={styles.headerRow}>
          <ThemedText style={[styles.headerCell, styles.colClass]}>{formatRTLText('الصف')}</ThemedText>
          {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
            <ThemedText key={style} style={[styles.headerCell, styles.colStyle]}>
              {formatRTLText(VARK_STYLE_LABELS[style])}
            </ThemedText>
          ))}
          <ThemedText style={[styles.headerCell, styles.colStyle]}>{formatRTLText('مختلط')}</ThemedText>
          <ThemedText style={[styles.headerCell, styles.colTotal]}>{formatRTLText('الإجمالي')}</ThemedText>
        </ThemedView>

        {classSummaries.map((cls) => (
          <ThemedView key={cls.className} style={styles.dataRow}>
            <ThemedText style={[styles.cell, styles.colClass]} numberOfLines={1}>
              {formatRTLText(cls.className)}
            </ThemedText>
            {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
              <ThemedText key={style} style={[styles.cell, styles.colStyle]}>
                {cls.counts[style]}
              </ThemedText>
            ))}
            <ThemedText style={[styles.cell, styles.colStyle]}>{cls.counts.mixed}</ThemedText>
            <ThemedText style={[styles.cell, styles.colTotal, styles.totalText]}>{cls.total}</ThemedText>
          </ThemedView>
        ))}

        <ThemedView style={[styles.dataRow, styles.grandTotalRow]}>
          <ThemedText style={[styles.cell, styles.colClass, styles.totalText]}>
            {formatRTLText('الإجمالي')}
          </ThemedText>
          {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
            <ThemedText key={style} style={[styles.cell, styles.colStyle, styles.totalText]}>
              {classSummaries.reduce((sum, cls) => sum + cls.counts[style], 0)}
            </ThemedText>
          ))}
          <ThemedText style={[styles.cell, styles.colStyle, styles.totalText]}>
            {classSummaries.reduce((sum, cls) => sum + cls.counts.mixed, 0)}
          </ThemedText>
          <ThemedText style={[styles.cell, styles.colTotal, styles.totalText]}>
            {responses.length}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 8 },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 8 },
  scroll: { marginTop: 8 },
  table: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5EA' },
  headerRow: { flexDirection: 'row-reverse', backgroundColor: '#e9edf1', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerCell: { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  dataRow: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  grandTotalRow: { backgroundColor: '#f0f2f5', borderBottomWidth: 0 },
  cell: { fontSize: 12, color: '#333', textAlign: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  colClass: { width: 90, textAlign: 'right' },
  colStyle: { width: 56 },
  colTotal: { width: 64, fontWeight: '700' },
  totalText: { fontWeight: '700', color: '#1c1f33' },
});
