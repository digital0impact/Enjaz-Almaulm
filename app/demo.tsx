import React, { useEffect, useState } from 'react';
import { StyleSheet, ImageBackground, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AuthService from '@/services/AuthService';
import { enterDemoMode, seedDemoStorage } from '@/services/DemoModeGuard';
import { buildDemoStorageEntries } from '@/data/demoSeedData';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const DEMO_EMAIL = process.env.EXPO_PUBLIC_DEMO_EMAIL ?? '';
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? '';

/**
 * نقطة دخول العرض التجريبي (Demo): تُفعِّل وضع العرض (لا حفظ حقيقي)،
 * تحقن بيانات تجريبية واقعية، وتسجّل الدخول تلقائيًا بحساب معلم تجريبي
 * جاهز، ثم تنقل الزائر مباشرة إلى الرئيسية — دون أي نموذج تسجيل.
 */
export default function DemoEntryScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!DEMO_EMAIL || !DEMO_PASSWORD) {
        if (!cancelled) {
          setError('العرض التجريبي غير مُهيَّأ حاليًا. حاولي لاحقًا أو أنشئي حسابك مباشرة.');
        }
        return;
      }
      try {
        await enterDemoMode();
        seedDemoStorage(buildDemoStorageEntries());
        await AuthService.signInWithEmail(DEMO_EMAIL, DEMO_PASSWORD);
        if (!cancelled) {
          router.replace('/(tabs)');
        }
      } catch {
        if (!cancelled) {
          setError('تعذّر بدء العرض التجريبي حاليًا. حاولي لاحقًا أو أنشئي حسابك مباشرة.');
        }
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Platform.OS === 'ios' ? 'transparent' : '#E8F5F4'}
        translucent={Platform.OS === 'ios'}
      />
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ThemedView style={styles.content}>
          <ThemedView style={styles.iconContainer}>
            <IconSymbol size={48} name="stars" color="#1c1f33" />
          </ThemedView>
          {error ? (
            <>
              <ThemedText style={[styles.message, getTextDirection()]}>
                {formatRTLText(error)}
              </ThemedText>
              <ThemedButton
                title="العودة للرئيسية"
                onPress={() => router.replace('/login')}
                style={styles.retryButton}
              />
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#0d9488" style={styles.spinner} />
              <ThemedText style={[styles.message, getTextDirection()]}>
                {formatRTLText('جاري تجهيز التجربة النموذجية...')}
              </ThemedText>
            </>
          )}
        </ThemedView>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 24,
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
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
  },
});
