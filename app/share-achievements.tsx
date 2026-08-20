import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { ShareAchievementsPanel } from '@/components/ShareAchievementsPanel';

/**
 * صفحة مستقلة (للوصول المباشر عبر الرابط) تعرض لوحة إنشاء رابط
 * الإنجازات كاملة مع بطاقة الرابط وخياري النسخ/المشاركة الصريحين.
 * زر "مشاركة الإنجازات" السريع داخل التقرير الشامل لا يمر بهذه
 * الصفحة إطلاقًا — ينشئ الرابط ويفتح شاشة مشاركة الجهاز مباشرة
 * (انظر hooks/useAchievementsShareLink.ts).
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
