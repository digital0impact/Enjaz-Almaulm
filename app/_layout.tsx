import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { UserProvider } from '@/contexts/UserContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { NavigationContainer, DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';

function NavigationContent() {
  const { themeMode } = useTheme();

  return (
    <NavigationThemeProvider value={themeMode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="azkar" options={{ headerShown: false }} />
        <Stack.Screen name="password-tracker" options={{ headerShown: false }} />
        <Stack.Screen name="student-tracking" options={{ headerShown: false }} />
        <Stack.Screen name="comments" options={{ headerShown: false }} />
        <Stack.Screen name="schedule" options={{ headerShown: false }} />
        <Stack.Screen name="calendar" options={{ headerShown: false }} />
        <Stack.Screen name="monthly-calendar" options={{ headerShown: false }} />
        <Stack.Screen name="official-holidays" options={{ headerShown: false }} />
        <Stack.Screen name="absence-management" options={{ headerShown: false }} />
        <Stack.Screen name="add-absence" options={{ headerShown: false }} />
        <Stack.Screen name="add-student" options={{ headerShown: false }} />
        <Stack.Screen name="alerts-management" options={{ headerShown: false }} />
        <Stack.Screen name="edit-alert" options={{ headerShown: false }} />
        <Stack.Screen name="improvement-plan" options={{ headerShown: false }} />
        <Stack.Screen name="remedial-plans" options={{ headerShown: false }} />
        <Stack.Screen name="report-screen" options={{ headerShown: false }} />
        <Stack.Screen name="detailed-report" options={{ headerShown: false }} />
        <Stack.Screen name="interactive-report" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <DatabaseProvider userId="550e8400-e29b-41d4-a716-446655440000">
        <CustomThemeProvider>
          <NavigationContent />
</CustomThemeProvider>
      </DatabaseProvider>
    </UserProvider>
  );
}