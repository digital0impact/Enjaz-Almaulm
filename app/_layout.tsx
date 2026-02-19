import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initializeRTL } from '../utils/rtl-utils';
import { View } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppAlertProvider } from '../contexts/AppAlertContext';
import { UserProvider } from '../contexts/UserContext';
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';

export default function Layout() {
  useEffect(() => {
    // تهيئة RTL عند بدء التطبيق
    const setupRTL = async () => {
      const rtlConfig = await initializeRTL();
      console.log('تم تهيئة RTL:', rtlConfig);
    };
    
    setupRTL();
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
