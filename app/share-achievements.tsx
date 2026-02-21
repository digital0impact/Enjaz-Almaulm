import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Platform,
  Share,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import { supabase } from '@/config/supabase';

type LinkType = 'public' | 'private';

function getShareBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const url = (env?.EXPO_PUBLIC_APP_URL ?? '').trim();
  return url ? url.replace(/\/$/, '') : '';
}

const PAID_PLANS = ['yearly', 'half_yearly'];

export default function ShareAchievementsScreen() {
  const router = useRouter();
  const [linkType, setLinkType] = useState<LinkType>('private');
  const [shareLink, setShareLink] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canUseShare, setCanUseShare] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setCanUseShare(false);
        return;
      }
      const subscription = await SubscriptionService.getCurrentSubscription(user.id);
      const plan = subscription?.plan_type ?? 'free';
      setCanUseShare(PAID_PLANS.includes(plan));
    })();
  }, []);

  const generateToken = async (): Promise<string> => {
    const bytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const buildReportSnapshot = async () => {
    const [performanceData, basicData] = await Promise.all([
      AsyncStorage.getItem('performanceData'),
      AsyncStorage.getItem('basicData'),
    ]);
    return {
      performanceData: performanceData ? JSON.parse(performanceData) : [],
      basicData: basicData ? JSON.parse(basicData) : null,
      generatedAt: new Date().toISOString(),
    };
  };

  const handleGenerateLink = async () => {
    const baseUrl = getShareBaseUrl();
    if (!baseUrl) {
      Alert.alert(
        'تنبيه',
        'لم يتم تعيين رابط التطبيق. على الويب يُستخدم عنوان الصفحة تلقائياً. أضف EXPO_PUBLIC_APP_URL في .env للنشر.'
      );
      return;
    }

    const user = await AuthService.getCurrentUser();
    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
      return;
    }
    const subscription = await SubscriptionService.getCurrentSubscription(user.id);
    const plan = subscription?.plan_type ?? 'free';
    if (!PAID_PLANS.includes(plan)) {
      Alert.alert(
        formatRTLText('ترقية الاشتراك مطلوبة'),
        formatRTLText('مشاركة الإنجازات متاحة للاشتراك السنوي أو النصف سنوي فقط. يرجى ترقية اشتراكك للاستفادة من هذه الميزة.'),
        [
          { text: formatRTLText('إلغاء'), style: 'cancel' },
          { text: formatRTLText('عرض خطط الاشتراك'), onPress: () => router.push('/subscription') },
        ]
      );
      return;
    }

    setGenerating(true);
    setShareLink('');
    try {

      const reportSnapshot = await buildReportSnapshot();
      const token = linkType === 'private' ? await generateToken() : encodeURIComponent(user.id);

      const storageToken = linkType === 'private' ? token : `public-${user.id}`;
      try {
        await supabase.from('shared_achievements').upsert(
          {
            token: storageToken,
            user_id: user.id,
            share_type: linkType,
            report_data: reportSnapshot,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );
      } catch (e) {
        console.warn('Could not save shared report (table may not exist):', e);
      }

      const path = `/share/${linkType === 'private' ? token : `public-${user.id}`}`;
      setShareLink(`${baseUrl}${path}`);
    } catch (e) {
      console.error(e);
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الرابط');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      await Share.share({
        message: shareLink,
        title: formatRTLText('رابط الإنجازات'),
      });
    } catch {
      Alert.alert('الرابط', shareLink);
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;
    const message = `${formatRTLText('رابط عرض إنجازاتي المهنية')}\n\n${shareLink}\n\n${formatRTLText('يمكنك مشاركة هذا الرابط مع: المشرف، المدرسة، لجنة التقييم')}`;
    try {
      await Share.share({
        message,
        title: formatRTLText('مشاركة الإنجازات'),
        url: Platform.OS !== 'web' ? shareLink : undefined,
      });
    } catch (e) {
      if ((e as any)?.message !== 'User did not share') {
        Alert.alert('الرابط', shareLink);
      }
    }
  };

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol size={20} name="chevron.right" color="#1c1f33" />
          </TouchableOpacity>

          <ThemedView style={styles.header}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol size={60} name="square.and.arrow.up" color="#1c1f33" />
            </ThemedView>
            <ThemedText type="title" style={[styles.title, getTextDirection()]}>
              {formatRTLText('مشاركة الإنجازات')}
            </ThemedText>
            <ThemedText style={[styles.subtitle, getTextDirection()]}>
              {formatRTLText('إنشاء رابط عام أو خاص لعرض ملخص أدائك المهني ومشاركته مع المشرف أو المدرسة أو لجنة التقييم')}
            </ThemedText>
          </ThemedView>

          {canUseShare === false && (
            <ThemedView style={styles.upgradeBanner}>
              <IconSymbol size={24} name="lock.fill" color="#FF9800" />
              <ThemedView style={styles.upgradeBannerTextWrap}>
                <ThemedText style={[styles.upgradeBannerTitle, getTextDirection()]}>
                  {formatRTLText('مشاركة الإنجازات للخطط المدفوعة')}
                </ThemedText>
                <ThemedText style={[styles.upgradeBannerDesc, getTextDirection()]}>
                  {formatRTLText('هذه الميزة متاحة للاشتراك السنوي أو النصف سنوي فقط. يمكن للزائر عرض التقرير والتعليق عليه دون إمكانية التحرير.')}
                </ThemedText>
                <TouchableOpacity
                  style={styles.upgradeBannerButton}
                  onPress={() => router.push('/subscription')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.upgradeBannerButtonText}>
                    {formatRTLText('عرض خطط الاشتراك')}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          )}

          <ThemedView style={styles.card}>
            <ThemedText style={[styles.cardTitle, getTextDirection()]}>
              {formatRTLText('نوع الرابط')}
            </ThemedText>
            <ThemedView style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleOption, linkType === 'private' && styles.toggleOptionActive]}
                onPress={() => setLinkType('private')}
              >
                <IconSymbol
                  size={22}
                  name="lock.fill"
                  color={linkType === 'private' ? '#fff' : '#666'}
                />
                <ThemedText
                  style={[
                    styles.toggleText,
                    getTextDirection(),
                    linkType === 'private' && styles.toggleTextActive,
                  ]}
                >
                  {formatRTLText('رابط خاص')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, linkType === 'public' && styles.toggleOptionActive]}
                onPress={() => setLinkType('public')}
              >
                <IconSymbol
                  size={22}
                  name="globe"
                  color={linkType === 'public' ? '#fff' : '#666'}
                />
                <ThemedText
                  style={[
                    styles.toggleText,
                    getTextDirection(),
                    linkType === 'public' && styles.toggleTextActive,
                  ]}
                >
                  {formatRTLText('رابط عام')}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
            <ThemedText style={[styles.toggleHint, getTextDirection()]}>
              {linkType === 'private'
                ? formatRTLText('الرابط الخاص: لا يصل إليه إلا من يملك الرابط.')
                : formatRTLText('الرابط العام: يمكن الوصول إليه من يعرف الرابط.')}
            </ThemedText>
          </ThemedView>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (generating || canUseShare === false) && styles.primaryButtonDisabled,
            ]}
            onPress={handleGenerateLink}
            disabled={generating || canUseShare === false}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol size={22} name={canUseShare === false ? 'lock.fill' : 'link'} color="#fff" />
                <ThemedText style={[styles.primaryButtonText, getTextDirection()]}>
                  {canUseShare === false
                    ? formatRTLText('متاح للاشتراك السنوي أو النصف سنوي')
                    : formatRTLText('إنشاء الرابط')}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          {shareLink ? (
            <ThemedView style={styles.linkCard}>
              <ThemedText style={[styles.linkLabel, getTextDirection()]}>
                {formatRTLText('الرابط')}
              </ThemedText>
              <ThemedText style={[styles.linkValue, getTextDirection()]} numberOfLines={3} selectable>
                {shareLink}
              </ThemedText>
              <ThemedView style={styles.linkActions}>
                <TouchableOpacity style={styles.linkButton} onPress={handleCopyLink}>
                  <IconSymbol size={20} name="doc.on.doc" color="#1c1f33" />
                  <ThemedText style={[styles.linkButtonText, getTextDirection()]}>
                    {formatRTLText(copied ? 'تم النسخ' : 'نسخ الرابط')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.linkButton, styles.linkButtonShare]} onPress={handleShare}>
                  <IconSymbol size={20} name="square.and.arrow.up" color="#fff" />
                  <ThemedText style={[styles.linkButtonText, styles.linkButtonTextShare, getTextDirection()]}>
                    {formatRTLText('مشاركة')}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ) : null}

          <ThemedView style={styles.recipientsCard}>
            <IconSymbol size={24} name="person.2.fill" color="#abd6ce" />
            <ThemedText style={[styles.recipientsText, getTextDirection()]}>
              {formatRTLText('يمكنك مشاركة هذا الرابط مع:')}
            </ThemedText>
            <ThemedText style={[styles.recipientsList, getTextDirection()]}>
              {formatRTLText('• المشرف')}{'\n'}
              {formatRTLText('• المدرسة')}{'\n'}
              {formatRTLText('• لجنة التقييم')}
            </ThemedText>
          </ThemedView>
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
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 56,
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 44,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#abd6ce',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 10,
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
    marginBottom: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  upgradeBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.35)',
  },
  upgradeBannerTextWrap: { flex: 1 },
  upgradeBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1f33',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  upgradeBannerDesc: {
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 12,
    lineHeight: 20,
  },
  upgradeBannerButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FF9800',
    borderRadius: 10,
  },
  upgradeBannerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toggleRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 8 },
  toggleOption: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
  },
  toggleOptionActive: {
    borderColor: '#abd6ce',
    backgroundColor: '#abd6ce',
  },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#666666', writingDirection: 'rtl' },
  toggleTextActive: { color: '#fff' },
  toggleHint: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  primaryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#abd6ce',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', writingDirection: 'rtl' },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  linkValue: {
    fontSize: 13,
    color: '#1c1f33',
    textAlign: 'right',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  linkActions: { flexDirection: 'row-reverse', gap: 12 },
  linkButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  linkButtonShare: { backgroundColor: '#abd6ce', borderColor: '#abd6ce' },
  linkButtonText: { fontSize: 15, fontWeight: '600', color: '#1c1f33', writingDirection: 'rtl' },
  linkButtonTextShare: { color: '#fff' },
  recipientsCard: {
    backgroundColor: 'rgba(171, 214, 206, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(199, 219, 217, 0.4)',
  },
  recipientsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recipientsList: {
    fontSize: 15,
    color: '#444',
    textAlign: 'right',
    lineHeight: 28,
    writingDirection: 'rtl',
  },
});
