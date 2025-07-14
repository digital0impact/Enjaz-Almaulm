import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { VersionService } from '@/services/VersionService';
import 'react-native-reanimated';
import { I18nManager } from 'react-native';

import { UserProvider } from '@/contexts/UserContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeLocalization, checkRTLStatus } from '@/utils/localization';

// منع إخفاء شاشة السبلاش تلقائياً
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isRTLInitialized, setIsRTLInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // تهيئة RTL قبل أي شيء آخر
        const rtlResult = await initializeLocalization();
        
        // التأكد من تفعيل RTL
        if (!I18nManager.isRTL) {
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(true);
        }

        if (__DEV__) {
          await checkRTLStatus();
        }

        setIsRTLInitialized(true);

        // إخفاء شاشة السبلاش عند اكتمال التحميل
        if (loaded) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Initialization error:', error);
        // حتى في حالة الخطأ، نحاول تفعيل RTL
        setIsRTLInitialized(true);
      }
    };

    initApp();
  }, [loaded]);

  // عرض شاشة السبلاش حتى اكتمال التحميل
  if (!loaded || !isRTLInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <UserProvider>
          <DatabaseProvider>
            <Stack screenOptions={{
              headerShown: false,
            }} />
            <StatusBar style="auto" />
          </DatabaseProvider>
        </UserProvider>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}
