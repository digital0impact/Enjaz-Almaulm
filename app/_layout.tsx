import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider } from '@/contexts/UserContext';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="detailed-report" options={{ headerShown: false }} />
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
          <Stack.Screen name="interactive-report" options={{ headerShown: false }} />
          <Stack.Screen name="report-screen" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}