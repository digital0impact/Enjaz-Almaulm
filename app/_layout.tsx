import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initializeRTL } from '../utils/rtl-utils';
import { View } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { UserProvider } from '../contexts/UserContext';

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
      <UserProvider>
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
      </UserProvider>
    </ThemeProvider>
  );
}
