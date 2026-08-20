import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { ShareAchievementsPanel } from '@/components/ShareAchievementsPanel';

/**
 * صفحة مستقلة (للوصول المباشر عبر الرابط)، تعرض نفس محتوى
 * ShareAchievementsPanel المستخدم أيضًا كنافذة منزلقة داخل التقرير
 * الشامل (components/PerformanceReportView.tsx).
 */
export default function ShareAchievementsScreen() {
  const router = useRouter();

  return (
    <ThemedView style={{ flex: 1 }}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'}
        backgroundColor={Platform.OS === 'android' ? '#abd6ce' : undefined}
        translucent={false}
      />
      <ShareAchievementsPanel onClose={() => router.back()} />
      <BottomNavigationBar />
    </ThemedView>
  );
}
