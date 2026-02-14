import { TextStyle, ViewStyle } from 'react-native';
import { SafeI18nManager } from './i18n-manager';

// تهيئة RTL
export const initializeRTL = async (): Promise<{ isRTL: boolean; direction: 'rtl' | 'ltr' }> => {
  return SafeI18nManager.initializeRTL();
};

// التحقق من اتجاه النص
export const isRTL = (): boolean => {
  return SafeI18nManager.isRTL();
};

// توجيه النص
export const getTextDirection = (): TextStyle => ({
  textAlign: 'right',
  writingDirection: 'rtl',
});

// توجيه العناصر
export const getFlexDirection = (): ViewStyle => ({
  flexDirection: SafeI18nManager.getFlexDirection(),
});

// توجيه العناصر العمودية
export const getColumnDirection = (): ViewStyle => ({
  flexDirection: 'column',
});

// هوامش RTL
export const getRTLMargins = (left: number, right: number): ViewStyle => ({
  marginLeft: isRTL() ? right : left,
  marginRight: isRTL() ? left : right,
});

// padding RTL
export const getRTLPadding = (left: number, right: number): ViewStyle => ({
  paddingLeft: isRTL() ? right : left,
  paddingRight: isRTL() ? left : right,
});

// توجيه الأيقونات
export const getIconDirection = (): ViewStyle => ({
  transform: SafeI18nManager.getIconTransform(),
});

// توجيه النص مع دعم RTL
export const getRTLTextStyle = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  textAlignVertical: 'center',
});

// توجيه القوائم
export const getListDirection = (): ViewStyle => ({
  flexDirection: SafeI18nManager.getFlexDirection(),
  alignItems: 'center',
});

// توجيه البطاقات
export const getCardDirection = (): ViewStyle => ({
  flexDirection: SafeI18nManager.getFlexDirection(),
  alignItems: 'center',
});

// توجيه الأزرار
export const getButtonDirection = (): ViewStyle => ({
  flexDirection: SafeI18nManager.getFlexDirection(),
  alignItems: 'center',
  justifyContent: 'center',
});

// توجيه النماذج
export const getFormDirection = (): ViewStyle => ({
  flexDirection: 'column',
  alignItems: isRTL() ? 'flex-end' : 'flex-start',
});

// توجيه العناوين
export const getHeaderDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontWeight: 'bold',
});

// توجيه الوصف
export const getDescriptionDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#666666',
});

// توجيه الأخطاء
export const getErrorDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#D32F2F',
});

// توجيه النجاح
export const getSuccessDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#4CAF50',
});

// توجيه التنبيهات
export const getWarningDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#FF9800',
});

// توجيه الروابط
export const getLinkDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#2196F3',
  textDecorationLine: 'underline',
});

// توجيه العداد
export const getCounterDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontWeight: 'bold',
  fontSize: 16,
});

// توجيه التاريخ
export const getDateDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#666666',
  fontSize: 14,
});

// توجيه الوقت
export const getTimeDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  color: '#666666',
  fontSize: 14,
});

// توجيه السعر
export const getPriceDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontWeight: 'bold',
  fontSize: 18,
  color: '#FF9800',
});

// توجيه العنوان
export const getTitleDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontWeight: 'bold',
  fontSize: 20,
});

// توجيه العنوان الفرعي
export const getSubtitleDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontSize: 16,
  color: '#666666',
});

// توجيه النص الأساسي
export const getBodyTextDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontSize: 14,
});

// توجيه النص الصغير
export const getCaptionDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontSize: 12,
  color: '#999999',
});

// توجيه القائمة
export const getListItemDirection = (): ViewStyle => ({
  flexDirection: SafeI18nManager.getFlexDirection(),
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 16,
});

// توجيه البطاقة
export const getCardStyle = (): ViewStyle => ({
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  marginHorizontal: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
});

// توجيه الحقل
export const getInputDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontSize: 16,
  paddingHorizontal: 12,
  paddingVertical: 8,
});

// توجيه التسمية
export const getLabelDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 4,
});

// توجيه المساعدة
export const getHelperDirection = (): TextStyle => ({
  textAlign: SafeI18nManager.getTextAlign(),
  writingDirection: SafeI18nManager.getWritingDirection(),
  fontSize: 12,
  color: '#666666',
  marginTop: 4,
});

// دالة مساعدة لتحويل النص
export const formatRTLText = (text: string): string => {
  if (isRTL()) {
    // إضافة علامات RTL للنص العربي
    return `\u202B${text}\u202C`;
  }
  return text;
};

// دالة مساعدة لترتيب العناصر
export const getRTLOrder = (defaultOrder: number): number => {
  return isRTL() ? -defaultOrder : defaultOrder;
};

// دالة مساعدة للتحقق من الاتجاه
export const getDirection = (): 'rtl' | 'ltr' => {
  return isRTL() ? 'rtl' : 'ltr';
};

// دالة مساعدة لتحويل الأرقام
export const formatRTLNumber = (num: number): string => {
  if (isRTL()) {
    // تحويل الأرقام الإنجليزية إلى عربية
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().replace(/\d/g, (d) => arabicNumbers[parseInt(d)]);
  }
  return num.toString();
};

// دالة مساعدة لتنسيق التاريخ
export const formatRTLDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    locale: isRTL() ? 'ar-SA' : 'en-US'
  };
  
  return date.toLocaleDateString(isRTL() ? 'ar-SA' : 'en-US', options);
};

// دالة مساعدة لتنسيق الوقت
export const formatRTLTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    locale: isRTL() ? 'ar-SA' : 'en-US'
  };
  
  return date.toLocaleTimeString(isRTL() ? 'ar-SA' : 'en-US', options);
}; 