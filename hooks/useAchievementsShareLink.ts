import { useState } from 'react';
import { Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertService } from '@/services/AlertService';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { formatRTLText } from '@/utils/rtl-utils';
import {
  getShareBaseUrl,
  buildAchievementsReportSnapshot,
  upsertAchievementsShare,
} from '@/utils/shareAchievements';

const PAID_PLANS = ['yearly', 'half_yearly'];

/**
 * يولّد رابط مشاركة التقرير العام ثم يفتح شاشة المشاركة الأصلية
 * للجهاز مباشرة (Share.share على الجوال، navigator.share على الويب)
 * بلا أي شاشة أو نافذة وسيطة داخل التطبيق.
 */
export function useAchievementsShareLink() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  const generateAndShare = async () => {
    const baseUrl = getShareBaseUrl();
    if (!baseUrl) {
      AlertService.alert(
        'تنبيه',
        'لم يتم تعيين رابط التطبيق. على الويب يُستخدم عنوان الصفحة تلقائياً. أضف EXPO_PUBLIC_APP_URL في .env للنشر.'
      );
      return;
    }

    const user = await AuthService.getCurrentUser();
    if (!user) {
      AlertService.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
      return;
    }
    const subscription = await SubscriptionService.getCurrentSubscription(user.id);
    const plan = subscription?.plan_type ?? 'free';
    if (!PAID_PLANS.includes(plan)) {
      AlertService.alert(
        formatRTLText('ترقية الاشتراك مطلوبة'),
        formatRTLText('مشاركة التقرير متاحة للاشتراك السنوي أو النصف سنوي فقط. يرجى ترقية اشتراكك للاستفادة من هذه الميزة.'),
        [
          { text: formatRTLText('إلغاء'), style: 'cancel' },
          { text: formatRTLText('عرض خطط الاشتراك'), onPress: () => router.push('/subscription') },
        ]
      );
      return;
    }

    setGenerating(true);
    try {
      const reportSnapshot = await buildAchievementsReportSnapshot();
      const storageToken = await upsertAchievementsShare(user.id, reportSnapshot);
      const link = `${baseUrl}/share/${storageToken}`;
      const message = `${formatRTLText('رابط عرض تقرير الأداء المهني')}\n\n${link}\n\n${formatRTLText('يمكنك مشاركة هذا الرابط مع: المشرف، المدرسة، لجنة التقييم')}`;

      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        typeof (navigator as any).share === 'function'
      ) {
        try {
          await (navigator as any).share({ title: formatRTLText('مشاركة التقرير'), text: message, url: link });
          return;
        } catch (e) {
          if ((e as any)?.name === 'AbortError') return; // ألغى المستخدم نافذة المشاركة
          // متصفحات لا تدعم navigator.share فعليًا رغم وجودها، أو رفضت السياق — ننتقل للنسخ الاحتياطي أدناه
        }
      }

      try {
        await Share.share({
          message,
          title: formatRTLText('مشاركة التقرير'),
          url: Platform.OS !== 'web' ? link : undefined,
        });
        return;
      } catch (e) {
        if ((e as any)?.message === 'User did not share') return;
      }

      // نسخ احتياطي أخير إن تعذّرت كل واجهات المشاركة (مثل متصفحات الويب المكتبية بلا navigator.share)
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        AlertService.alert(formatRTLText('تم نسخ الرابط'), link);
      } else {
        AlertService.alert(formatRTLText('الرابط'), link);
      }
    } catch (e) {
      console.error(e);
      AlertService.alert('خطأ', 'حدث خطأ أثناء إنشاء الرابط');
    } finally {
      setGenerating(false);
    }
  };

  return { generating, generateAndShare };
}
