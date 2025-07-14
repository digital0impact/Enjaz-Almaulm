import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RTL_KEY = '@app_rtl_enabled';

/**
 * تهيئة إعدادات اللغة والاتجاه
 */
export const initializeLocalization = async () => {
  try {
    // محاولة استرجاع الإعدادات المحفوظة
    const savedRTL = await AsyncStorage.getItem(RTL_KEY);
    const shouldEnableRTL = savedRTL === 'true' || savedRTL === null; // تفعيل RTL افتراضياً

    // تطبيق RTL
    if (shouldEnableRTL) {
      // إعادة تعيين RTL أولاً
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);

      // حفظ الإعداد إذا لم يكن موجوداً
      if (savedRTL === null) {
        await AsyncStorage.setItem(RTL_KEY, 'true');
      }
    }

    return {
      isRTL: I18nManager.isRTL,
      languageCode: 'ar',
      countryCode: 'SA',
    };
  } catch (error) {
    console.error('خطأ في تهيئة RTL:', error);
    return {
      isRTL: false,
      languageCode: 'ar',
      countryCode: 'SA',
    };
  }
};

/**
 * تفعيل RTL
 */
export const enableRTL = async () => {
  try {
    // تفعيل RTL
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    
    // حفظ الإعداد
    await AsyncStorage.setItem(RTL_KEY, 'true');
    
    // إعادة تحميل التطبيق في وضع التطوير
    if (__DEV__) {
      console.log('🔄 يرجى إعادة تشغيل التطبيق لتطبيق التغييرات');
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في تفعيل RTL:', error);
    return false;
  }
};

/**
 * تعطيل RTL
 */
export const disableRTL = async () => {
  try {
    // تعطيل RTL
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
    
    // حفظ الإعداد
    await AsyncStorage.setItem(RTL_KEY, 'false');
    
    // إعادة تحميل التطبيق في وضع التطوير
    if (__DEV__) {
      console.log('🔄 يرجى إعادة تشغيل التطبيق لتطبيق التغييرات');
    }
    
    return true;
  } catch (error) {
    console.error('خطأ في تعطيل RTL:', error);
    return false;
  }
};

/**
 * التحقق من حالة RTL
 */
export const checkRTLStatus = async () => {
  try {
    const savedRTL = await AsyncStorage.getItem(RTL_KEY);
    
    const status = {
      isRTL: I18nManager.isRTL,
      allowRTL: I18nManager.allowRTL,
      forceRTL: I18nManager.forceRTL,
      savedSetting: savedRTL,
    };
    
    console.log('=== RTL Status ===');
    console.log('📊 حالة RTL:', status);
    return status;
  } catch (error) {
    console.error('خطأ في فحص حالة RTL:', error);
    return null;
  }
};

/**
 * أنماط النصوص للـ RTL
 */
export const RTLStyles = {
  text: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  view: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  icon: {
    transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
  },
}; 