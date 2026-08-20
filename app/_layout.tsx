import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { initializeRTL } from '../utils/rtl-utils';
import { View } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppAlertProvider } from '../contexts/AppAlertContext';
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';
import { AcademicYearService } from '@/services/AcademicYearService';
import { setupAppFocusRefresh } from '@/utils/useAppFocusRefresh';

export default function Layout() {
  useEffect(() => {
    const setup = async () => {
      await initializeRTL();
      await AcademicYearService.migrateToAcademicYearIfNeeded();
    };
    setup();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return setupAppFocusRefresh();
    }
  }, []);

  return (
    <ThemeProvider>
      <AppAlertProvider>
        <View style={{ flex: 1 }}>
          <AppLayoutWrapper>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              {/* نافذة منزلقة من أسفل الشاشة بدل صفحة كاملة منفصلة،
                  حتى لا يشعر المستخدم بمغادرة الصفحة التي فتح منها
                  المشاركة (مثل التقرير الشامل). */}
              <Stack.Screen name="share-achievements" options={{ presentation: 'modal' }} />
            </Stack>
          </AppLayoutWrapper>
        </View>
      </AppAlertProvider>
    </ThemeProvider>
  );
}
