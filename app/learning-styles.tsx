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

function getShareBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const url = (env?.EXPO_PUBLIC_APP_URL ?? '').trim();
  return url ? url.replace(/\/$/, '') : '';
}

interface VarkTestRow {
  id: string;
  token: string;
  title: string | null;
  created_at: string;
}

interface VarkResponseRow {
  id: string;
  class_name: string;
  student_name: string;
  dominant_style: string;
  created_at: string;
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
        .select('id, token, title, created_at')
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

  const handleCopyLink = async (link: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      AlertService.alert('تم النسخ', formatRTLText('تم نسخ الرابط'));
      return;
    }
    await handleShareLink(link);
  };

  const handleSelectTest = async (token: string) => {
    if (selectedToken === token) {
      setSelectedToken(null);
      setResponses([]);
      return;
    }
    setSelectedToken(token);
    setLoadingResponses(true);
    try {
      const { data, error } = await supabase
        .from('vark_responses')
        .select('id, class_name, student_name, dominant_style, created_at')
        .eq('test_token', token)
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

  const classSummaries = summarizeByClass(responses);

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
            icon="chevron.right"
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
            tests.map((test) => (
              <ThemedView key={test.id}>
                <TouchableOpacity onPress={() => handleSelectTest(test.token)} activeOpacity={0.8}>
                  <ThemedCard style={styles.testCard}>
                    <ThemedView style={styles.testCardRow}>
                      <IconSymbol
                        size={20}
                        name={selectedToken === test.token ? 'chevron.down' : 'chevron.left'}
                        color="#666"
                      />
                      <ThemedView style={styles.testCardInfo}>
                        <ThemedText style={[styles.testCardTitle, getTextDirection()]}>
                          {formatRTLText(test.title || 'اختبار بدون عنوان')}
                        </ThemedText>
                        <ThemedText style={[styles.testCardDate, getTextDirection()]}>
                          {new Date(test.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  </ThemedCard>
                </TouchableOpacity>

                {selectedToken === test.token && (
                  <ThemedCard style={styles.resultsCard}>
                    {loadingResponses ? (
                      <ActivityIndicator color="#1c1f33" />
                    ) : responses.length === 0 ? (
                      <ThemedText style={[styles.emptyText, getTextDirection()]}>
                        {formatRTLText('لا توجد إجابات بعد على هذا الاختبار.')}
                      </ThemedText>
                    ) : (
                      <>
                        <ThemedText style={[styles.resultsSummaryText, getTextDirection()]}>
                          {formatRTLText(`إجمالي الإجابات: ${responses.length}`)}
                        </ThemedText>
                        {classSummaries.map((cls) => (
                          <ThemedView key={cls.className} style={styles.classBlock}>
                            <ThemedText style={[styles.className, getTextDirection()]}>
                              {formatRTLText(`الصف: ${cls.className}`)} ({cls.total})
                            </ThemedText>
                            {(['V', 'A', 'R', 'K'] as VarkStyle[]).map((style) => (
                              <ThemedView key={style} style={styles.styleRow}>
                                <ThemedText style={[styles.styleLabel, getTextDirection()]}>
                                  {formatRTLText(VARK_STYLE_LABELS[style])}
                                </ThemedText>
                                <ThemedText style={styles.styleCount}>{cls.counts[style]}</ThemedText>
                              </ThemedView>
                            ))}
                            {cls.counts.mixed > 0 && (
                              <ThemedView style={styles.styleRow}>
                                <ThemedText style={[styles.styleLabel, getTextDirection()]}>
                                  {formatRTLText('مختلط')}
                                </ThemedText>
                                <ThemedText style={styles.styleCount}>{cls.counts.mixed}</ThemedText>
                              </ThemedView>
                            )}
                          </ThemedView>
                        ))}
                      </>
                    )}
                  </ThemedCard>
                )}
              </ThemedView>
            ))
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
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 90 : 80,
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1f33',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
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
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1f33' },
  loader: { marginTop: 20 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 16 },
  testCard: { marginBottom: 10, borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  testCardRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  testCardInfo: { flex: 1 },
  testCardTitle: { fontSize: 15, fontWeight: '600', color: '#1c1f33' },
  testCardDate: { fontSize: 12, color: '#888', marginTop: 4 },
  resultsCard: { marginTop: -4, marginBottom: 10, backgroundColor: '#f9fafb' },
  resultsSummaryText: { fontSize: 14, fontWeight: '600', color: '#1c1f33', marginBottom: 12 },
  classBlock: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  className: { fontSize: 15, fontWeight: '700', color: '#1c1f33', marginBottom: 8 },
  styleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  styleLabel: { fontSize: 14, color: '#333' },
  styleCount: { fontSize: 14, fontWeight: '700', color: '#1c1f33' },
});
