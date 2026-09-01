import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import AuthService from '@/services/AuthService';
import { isDemoModeActive, exitDemoMode } from '@/services/DemoModeGuard';
import { getRTLTextStyle } from '@/utils/rtl-utils';

/**
 * يلف كل شاشات التطبيق.
 * المحتوى يعرض بعرض كامل الصفحة (ويب وموبايل) كصفحة ويب عادية.
 */
export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // usePathname يتغيّر مع كل تنقّل، فيُعاد رسم هذا المكوّن ويُقرأ isDemoModeActive()
  // من جديد — بذلك يظهر شريط الوضع التجريبي فور اكتمال الدخول لصفحة /demo
  // دون الحاجة لآلية اشتراك (pub/sub) منفصلة.
  usePathname();
  const showDemoBanner = isDemoModeActive();

  const handleExitDemo = async () => {
    await exitDemoMode();
    try {
      await AuthService.signOut();
    } catch {
      // نتابع الخروج من الوضع التجريبي حتى لو فشل تسجيل الخروج من Supabase
    }
    router.replace('/login');
  };

  return (
    <View style={styles.root}>
      {showDemoBanner && (
        <View style={styles.demoBanner}>
          <ThemedText style={[styles.demoBannerText, getRTLTextStyle()]}>
            وضع تجريبي — لا تُحفظ أي تغييرات
          </ThemedText>
          <TouchableOpacity style={styles.demoExitButton} onPress={handleExitDemo}>
            <ThemedText style={[styles.demoExitButtonText, getRTLTextStyle()]}>
              الخروج
            </ThemedText>
            <IconSymbol size={14} name="xmark" color="#1c1f33" />
          </TouchableOpacity>
        </View>
      )}
      {children}
      <PWAInstallButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFD54F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  demoBannerText: {
    color: '#1c1f33',
    fontSize: 12,
    fontWeight: '700',
  },
  demoExitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(28,31,51,0.1)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  demoExitButtonText: {
    color: '#1c1f33',
    fontSize: 12,
    fontWeight: '700',
  },
});
