import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Platform,
  Share,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AuthService from '@/services/AuthService';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import { supabase } from '@/config/supabase';
import { VARK_STYLE_LABELS, VarkStyle } from '@/constants/varkQuestions';
import { ClassSummary, summarizeVarkByClass, getShareBaseUrl } from '@/utils/varkResults';

interface VarkTestRow {
  id: string;
  token: string;
  title: string | null;
  created_at: string;
  /** غير فارغة فقط للاختبارات المستوردة من نتائج معلمة أخرى (انظر vark_shared_results) */
  imported_summary?: ClassSummary[] | null;
  imported_total?: number | null;
}

interface VarkResponseRow {
  id: string;
  class_name: string;
  student_name: string;
  dominant_style: string;
  created_at: string;
}

export default function LearningStylesScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const [tests, setTests] = useState<VarkTestRow[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [responses, setResponses] = useState<VarkResponseRow[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const loadTests = useCallback(async () => {
    setLoadingTests(true);
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setTests([]);
        return;
      }
      const { data, error } = await supabase
        .from('vark_tests')
        .select('id, token, title, created_at, imported_summary, imported_total')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setTests(data as VarkTestRow[]);
    } catch (e) {
      console.warn('Could not load vark tests:', e);
    } finally {
      setLoadingTests(false);
    }
  }, []);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleCreateTest = async () => {
    setCreating(true);
    setShareLink('');
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        AlertService.alert('تنبيه', formatRTLText('يجب تسجيل الدخول أولاً'));
        return;
      }
      const baseUrl = getShareBaseUrl();
      if (!baseUrl) {
        AlertService.alert(
          'تنبيه',
          formatRTLText('لم يتم تعيين رابط التطبيق. على الويب يُستخدم عنوان الصفحة تلقائياً.')
        );
        return;
      }

      const bytes = await Crypto.getRandomBytesAsync(16);
      const token = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase.from('vark_tests').insert({
        token,
        user_id: user.id,
        title: title.trim() || null,
      });
      if (error) throw error;

      setShareLink(`${baseUrl}/vark/${token}`);
      setTitle('');
      await loadTests();
    } catch (e) {
      console.error(e);
      AlertService.alert('خطأ', formatRTLText('حدث خطأ أثناء إنشاء الاختبار'));
    } finally {
      setCreating(false);
    }
  };

  const handleShareLink = async (link: string) => {
    const message = `${formatRTLText('رابط استبيان تحديد نمط التعلم (VARK)')}\n\n${link}`;
    try {
      await Share.share({
        message,
        title: formatRTLText('مشاركة رابط الاختبار'),
        url: Platform.OS !== 'web' ? link : undefined,
      });
    } catch (e) {
      if ((e as any)?.message !== 'User did not share') {
        AlertService.alert('الرابط', link);
      }
    }
  };

  const handleShareResults = async (test: VarkTestRow) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        AlertService.alert('تنبيه', formatRTLText('يجب تسجيل الدخول أولاً'));
        return;
      }

      const baseUrl = getShareBaseUrl();
      // ننشر لقطة (snapshot) لملخص النتائج بالرمز حتى تستطيع معلمة أخرى فتح
      // الرابط ثم إضافة نسخة منه إلى حسابها دون الوصول لبيانات الطلاب الخام
      if (baseUrl) {
        const { error: upsertError } = await supabase.from('vark_shared_results').upsert({
          token: test.token,
          owner_user_id: user.id,
          title: test.title,
          class_summary: classSummaries,
          total_responses: totalResponses,
          updated_at: new Date().toISOString(),
        });
        if (upsertError) throw upsertError;
      }

      const lines: string[] = [
        formatRTLText('نتائج اختبار نمط التعلم (VARK)'),
        formatRTLText(`عنوان الاختبار: ${test.title || 'اختبار بدون عنوان'}`),
        '',
      ];
      classSummaries.forEach((cls) => {
        lines.push(formatRTLText(`الصف: ${cls.className}`));
        (['V', 'A', 'R', 'K'] as VarkStyle[]).forEach((style) => {
          lines.push(formatRTLText(`  ${VARK_STYLE_LABELS[style]}: ${cls.counts[style]}`));
        });
        lines.push(formatRTLText(`  مختلط: ${cls.counts.mixed}`));
        lines.push(formatRTLText(`  الإجمالي: ${cls.total}`));
        lines.push('');
      });
      lines.push(formatRTLText(`الإجمالي الكلي: ${totalResponses}`));
      const resultsLink = baseUrl ? `${baseUrl}/vark-results/${test.token}` : '';
      if (resultsLink) {
        lines.push('');
        lines.push(formatRTLText('لإضافة هذه النتائج مباشرة إلى حسابك (لمعلمة تُدرّس نفس الصف):'));
        lines.push(resultsLink);
      }
      const message = lines.join('\n');
      const shareTitle = formatRTLText('نتائج اختبار نمط التعلم');

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
        try {
          await (navigator as any).share({ title: shareTitle, text: message });
          return;
        } catch (e) {
          if ((e as any)?.name === 'AbortError') return;
        }
      }
      try {
        await Share.share({
          message,
          title: shareTitle,
          url: Platform.OS !== 'web' && resultsLink ? resultsLink : undefined,
        });
      } catch (e) {
        if ((e as any)?.message !== 'User did not share') {
          AlertService.alert('تنبيه', formatRTLText('تعذّرت مشاركة النتائج'));
        }
      }
    } catch (e) {
      console.error(e);
      AlertService.alert('خطأ', formatRTLText('حدث خطأ أثناء تجهيز مشاركة النتائج'));
    }
  };

  const handleCopyLink = async (link: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      AlertService.alert('تم النسخ', formatRTLText('تم نسخ الرابط'));
      return;
    }
    await handleShareLink(link);
  };

  const handleSelectTest = async (test: VarkTestRow) => {
    if (selectedToken === test.token) {
      setSelectedToken(null);
      setResponses([]);
      return;
    }
    setSelectedToken(test.token);
    // نسخة مستوردة من نتائج معلمة أخرى: البيانات لقطة مجمّدة محفوظة في
    // vark_tests.imported_summary مباشرة، لا صفوف vark_responses فعلية لها
    // (ولا صلاحية أصلًا لقراءة استجابات اختبار معلمة أخرى)
    if (test.imported_summary) {
      setResponses([]);
      return;
    }
    setLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('vark_responses')
        .select('id, class_name, student_name, dominant_style, created_at')
        .eq('test_token', test.token)
        .order('created_at', { ascending: false });
      if (!error && data) setResponses(data as VarkResponseRow[]);
      else setResponses([]);
    } catch (e) {
      console.warn('Could not load vark responses:', e);
      setResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  const selectedTest = tests.find((t) => t.token === selectedToken) || null;
  const classSummaries = selectedTest?.imported_summary ?? summarizeVarkByClass(responses);
  const totalResponses = selectedTest?.imported_summary
    ? selectedTest.imported_total ?? classSummaries.reduce((sum, cls) => sum + cls.total, 0)
    : responses.length;

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'}
        backgroundColor={Platform.OS === 'android' ? '#abd6ce' : undefined}
        translucent={false}
      />
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedButton
            icon="chevron.left"
            iconColor="#1c1f33"
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          />

          <ThemedView style={styles.header}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="graduationcap.fill" color="#1c1f33" />
            </ThemedView>
            <ThemedText type="title" style={[styles.title, getTextDirection()]}>
              {formatRTLText('تحليل أنماط تعلم الطلاب')}
            </ThemedText>
            <ThemedText style={[styles.subtitle, getTextDirection()]}>
              {formatRTLText('أنشئ رابط استبيان VARK وشاركه مع طلابك، وستظهر لك النتائج مجمّعة حسب الصف')}
            </ThemedText>
          </ThemedView>

          <ThemedCard style={styles.card}>
            <ThemedText style={[styles.cardTitle, getTextDirection()]}>
              {formatRTLText('إنشاء اختبار جديد')}
            </ThemedText>
            <TextInput
              style={[styles.titleInput, getTextDirection()]}
              placeholder={formatRTLText('عنوان الاختبار (اختياري)، مثال: الصف السادس - الفصل الأول')}
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              editable={!creating}
            />
            <TouchableOpacity
              style={[styles.primaryButton, creating && styles.primaryButtonDisabled]}
              onPress={handleCreateTest}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol size={22} name="plus.circle.fill" color="#fff" />
                  <ThemedText style={[styles.primaryButtonText, getTextDirection()]}>
                    {formatRTLText('إنشاء رابط الاختبار')}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {shareLink ? (
              <ThemedCard style={styles.linkCard}>
                <ThemedText style={[styles.linkLabel, getTextDirection()]}>
                  {formatRTLText('رابط الاختبار — شاركه مع طلابك')}
                </ThemedText>
                <ThemedText style={[styles.linkValue, getTextDirection()]} numberOfLines={3} selectable>
                  {shareLink}
                </ThemedText>
                <ThemedView style={styles.linkActions}>
                  <TouchableOpacity style={styles.linkActionButton} onPress={() => handleCopyLink(shareLink)}>
                    <IconSymbol size={18} name="doc.on.doc.fill" color="#1c1f33" />
                    <ThemedText style={styles.linkActionText}>{formatRTLText('نسخ')}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.linkActionButton} onPress={() => handleShareLink(shareLink)}>
                    <IconSymbol size={18} name="square.and.arrow.up" color="#1c1f33" />
                    <ThemedText style={styles.linkActionText}>{formatRTLText('مشاركة')}</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedCard>
            ) : null}
          </ThemedCard>

          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
              {formatRTLText('اختباراتي')}
            </ThemedText>
          </ThemedView>

          {loadingTests ? (
            <ActivityIndicator color="#1c1f33" style={styles.loader} />
          ) : tests.length === 0 ? (
            <ThemedText style={[styles.emptyText, getTextDirection()]}>
              {formatRTLText('لم تنشئ أي اختبار بعد.')}
            </ThemedText>
          ) : (
            <ThemedCard style={styles.tableCard}>
              <ThemedView style={styles.tableHeaderRow}>
                <ThemedText style={[styles.tableHeaderCell, styles.tableColTitle, getTextDirection()]}>
                  {formatRTLText('عنوان الاختبار')}
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, styles.tableColDate, getTextDirection()]}>
                  {formatRTLText('التاريخ')}
                </ThemedText>
                <ThemedView style={styles.tableColIcon} />
              </ThemedView>

              {tests.map((test) => (
                <React.Fragment key={test.id}>
                  <TouchableOpacity onPress={() => handleSelectTest(test)} activeOpacity={0.7}>
                    <ThemedView
                      style={[styles.tableRow, selectedToken === test.token && styles.tableRowActive]}
                    >
                      <ThemedText
                        style={[styles.tableCell, styles.tableColTitle, getTextDirection()]}
                        numberOfLines={1}
                      >
                        {formatRTLText(test.title || 'اختبار بدون عنوان')}
                        {test.imported_summary ? formatRTLText('  (مستوردة)') : ''}
                      </ThemedText>
                      <ThemedText style={[styles.tableCell, styles.tableColDate, getTextDirection()]}>
                        {new Date(test.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </ThemedText>
                      <ThemedView style={styles.tableColIcon}>
                        <IconSymbol
                          size={18}
                          name={selectedToken === test.token ? 'chevron.down' : 'chevron.left'}
                          color="#666"
                        />
                      </ThemedView>
                    </ThemedView>
                  </TouchableOpacity>

                  {selectedToken === test.token && (
                    <ThemedView style={styles.resultsRow}>
                    {loadingResponses ? (
                      <ActivityIndicator color="#1c1f33" />
                    ) : classSummaries.length === 0 ? (
                      <ThemedText style={[styles.emptyText, getTextDirection()]}>
                        {formatRTLText('لا توجد إجابات بعد على هذا الاختبار.')}
                      </ThemedText>
                    ) : (
                      <>
                      <TouchableOpacity
                        style={styles.resultsShareButton}
                        onPress={() => handleShareResults(test)}
                      >
                        <IconSymbol size={18} name="square.and.arrow.up" color="#1c1f33" />
                        <ThemedText style={styles.resultsShareButtonText}>
                          {formatRTLText('مشاركة النتائج')}
                        </ThemedText>
                      </TouchableOpacity>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <ThemedView style={styles.resultsTable}>
                          <ThemedView style={styles.resultsHeaderRow}>
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
                          </ThemedView>

                          {classSummaries.map((cls) => (
                            <ThemedView key={cls.className} style={styles.resultsDataRow}>
                              <ThemedText style={[styles.resultsCell, styles.resultsColClass]} numberOfLines={1}>
                                {formatRTLText(cls.className)}
                              </ThemedText>
                              {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
                                <ThemedText key={style} style={[styles.resultsCell, styles.resultsColStyle]}>
                                  {cls.counts[style]}
                                </ThemedText>
                              ))}
                              <ThemedText style={[styles.resultsCell, styles.resultsColStyle]}>
                                {cls.counts.mixed}
                              </ThemedText>
                              <ThemedText style={[styles.resultsCell, styles.resultsColTotal, styles.resultsTotalText]}>
                                {cls.total}
                              </ThemedText>
                            </ThemedView>
                          ))}

                          <ThemedView style={[styles.resultsDataRow, styles.resultsGrandTotalRow]}>
                            <ThemedText style={[styles.resultsCell, styles.resultsColClass, styles.resultsTotalText]}>
                              {formatRTLText('الإجمالي')}
                            </ThemedText>
                            {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
                              <ThemedText key={style} style={[styles.resultsCell, styles.resultsColStyle, styles.resultsTotalText]}>
                                {classSummaries.reduce((sum, cls) => sum + cls.counts[style], 0)}
                              </ThemedText>
                            ))}
                            <ThemedText style={[styles.resultsCell, styles.resultsColStyle, styles.resultsTotalText]}>
                              {classSummaries.reduce((sum, cls) => sum + cls.counts.mixed, 0)}
                            </ThemedText>
                            <ThemedText style={[styles.resultsCell, styles.resultsColTotal, styles.resultsTotalText]}>
                              {totalResponses}
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>
                      </ScrollView>
                      </>
                    )}
                    </ThemedView>
                  )}
                </React.Fragment>
              ))}
            </ThemedCard>
          )}
        </ScrollView>
        <BottomNavigationBar />
      </ImageBackground>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
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
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 90 : 80,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  iconContainer: {
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  card: { marginBottom: 20 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1f33',
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#1c1f33',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkCard: { marginTop: 16, backgroundColor: '#f5f5f7' },
  linkLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  linkValue: { fontSize: 14, color: '#1c1f33', fontWeight: '600' },
  linkActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  linkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  linkActionText: { fontSize: 13, color: '#1c1f33', fontWeight: '600' },
  resultsShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  resultsShareButtonText: { fontSize: 13, color: '#1c1f33', fontWeight: '600' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1f33' },
  loader: { marginTop: 20 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 16 },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tableHeaderCell: { fontSize: 13, fontWeight: '700', color: '#555' },
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#fff',
  },
  tableRowActive: { backgroundColor: '#eef7f5' },
  tableCell: { fontSize: 14, color: '#1c1f33' },
  tableColTitle: { flex: 1, fontWeight: '600', marginHorizontal: 8 },
  tableColDate: { width: 90, color: '#888', fontSize: 12 },
  tableColIcon: { width: 24, alignItems: 'center' },
  resultsRow: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultsTable: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5EA' },
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
  resultsGrandTotalRow: { backgroundColor: '#f0f2f5', borderBottomWidth: 0 },
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
});
