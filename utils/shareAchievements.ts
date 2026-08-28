import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/config/supabase';

/**
 * منطق مشترك لتوليد ومشاركة "رابط الإنجازات" العام، مُستخرَج حتى لا
 * يتكرر بين شاشة مشاركة الإنجازات المستقلة (app/share-achievements.tsx
 * عبر components/ShareAchievementsPanel.tsx) وزر "مشاركة" السريع في
 * التقرير الشامل (components/PerformanceReportView.tsx عبر
 * hooks/useAchievementsShareLink.ts).
 */

export function getShareBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const url = (env?.EXPO_PUBLIC_APP_URL ?? '').trim();
  return url ? url.replace(/\/$/, '') : '';
}

export async function buildAchievementsReportSnapshot() {
  const [performanceData, basicDataRaw] = await Promise.all([
    AsyncStorage.getItem('performanceData'),
    AsyncStorage.getItem('basicData'),
  ]);
  // نخزّن فقط الحقول المعروضة فعليًا في صفحة العرض العامة (share/[token].tsx):
  // الاسم والمهنة. سياسة القراءة على جدول shared_achievements مفتوحة للجميع
  // (USING (true)) — لذا لا نخزّن هنا أي بيانات حساسة (بريد، جوال، اسم مدرسة...)
  // حتى لا تُعرَّض فعليًا لأي شخص يعرف الرابط أو يستعلم عن الجدول مباشرة.
  const fullBasicData = basicDataRaw ? JSON.parse(basicDataRaw) : null;
  const basicData = fullBasicData
    ? {
        fullName: fullBasicData.fullName,
        profession: fullBasicData.profession,
      }
    : null;
  return {
    performanceData: performanceData ? JSON.parse(performanceData) : [],
    basicData,
    generatedAt: new Date().toISOString(),
  };
}

/** يحفظ/يحدّث لقطة التقرير في Supabase تحت رمز عام ثابت لكل مستخدم، ويعيد ذلك الرمز. */
export async function upsertAchievementsShare(userId: string, reportSnapshot: unknown): Promise<string> {
  const storageToken = `public-${userId}`;
  try {
    await supabase.from('shared_achievements').upsert(
      {
        token: storageToken,
        user_id: userId,
        share_type: 'public',
        report_data: reportSnapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );
  } catch (e) {
    console.warn('Could not save shared report (table may not exist):', e);
  }
  return storageToken;
}
