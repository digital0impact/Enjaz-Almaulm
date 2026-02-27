/**
 * خدمة تنبيه موحّدة: تعرض جميع التنبيهات بهوية التطبيق (ألوان، RTL).
 * استخدم AlertService.alert() بدلاً من Alert.alert() في كل التطبيق.
 */
import { Alert } from 'react-native';
import type { AppAlertButton } from '@/contexts/AppAlertContext';

type AlertHandler = (title: string, message?: string, buttons?: AppAlertButton[]) => void;

let handler: AlertHandler | null = null;

export const AlertService = {
  /** تسجيل الدالة التي تعرض تنبيه التطبيق (يُستدعى من AppAlertProvider) */
  setHandler(h: AlertHandler | null) {
    handler = h;
  },

  /**
   * عرض تنبيه بنفس هيئة التطبيق.
   * إن لم يكن المعالج مسجّلاً (قبل تحميل الواجهة) يُستخدم تنبيه النظام كاحتياطي.
   */
  alert(title: string, message?: string, buttons?: AppAlertButton[]) {
    if (handler) {
      handler(title, message ?? '', buttons && buttons.length > 0 ? buttons : [{ text: 'حسناً', style: 'default' }]);
    } else {
      const nativeButtons = (buttons && buttons.length > 0 ? buttons : [{ text: 'حسناً' }]).map((b) => ({
        text: b.text,
        onPress: b.onPress,
        style: b.style === 'cancel' ? 'cancel' : b.style === 'destructive' ? 'destructive' : ('default' as const),
      }));
      Alert.alert(title, message ?? '', nativeButtons);
    }
  },
};
