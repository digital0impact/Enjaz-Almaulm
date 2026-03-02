import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { initializeRTL } from '../utils/rtl-utils';
import { View } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppAlertProvider } from '../contexts/AppAlertContext';
import { UserProvider } from '../contexts/UserContext';
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
        <UserProvider>
          <View style={{ flex: 1 }}>
            <AppLayoutWrapper>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </AppLayoutWrapper>
          </View>
        </UserProvider>
      </AppAlertProvider>
    </ThemeProvider>
  );
}
