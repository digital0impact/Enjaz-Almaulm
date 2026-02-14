import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeI18nManager } from './i18n-manager';

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
      SafeI18nManager.allowRTL(true);
      await SafeI18nManager.forceRTL(true);

      // حفظ الإعداد إذا لم يكن موجوداً
      if (savedRTL === null) {
        await AsyncStorage.setItem(RTL_KEY, 'true');
      }
    }

    return {
      isRTL: SafeI18nManager.isRTL(),
      languageCode: 'ar',
      countryCode: 'SA',
    };
  } catch (error) {
    console.error('خطأ في تهيئة RTL:', error);
    return {
      isRTL: true, // Default to RTL for Arabic app
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
    SafeI18nManager.allowRTL(true);
    await SafeI18nManager.forceRTL(true);
    
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
    SafeI18nManager.allowRTL(false);
    await SafeI18nManager.forceRTL(false);
    
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
      isRTL: SafeI18nManager.isRTL(),
      allowRTL: SafeI18nManager.allowRTL,
      forceRTL: SafeI18nManager.forceRTL,
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
    textAlign: SafeI18nManager.getTextAlign(),
    writingDirection: SafeI18nManager.getWritingDirection(),
  },
  view: {
    flexDirection: SafeI18nManager.getFlexDirection(),
  },
  icon: {
    transform: SafeI18nManager.getIconTransform(),
  },
}; 