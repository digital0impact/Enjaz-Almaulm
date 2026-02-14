import { StyleSheet } from 'react-native';
import { 
  isRTL, 
  getRTLTextStyle, 
  getRTLMargins, 
  getRTLPadding, 
  getFlexDirection,
  getIconDirection 
} from '../utils/rtl-utils';

export const rtlStyles = StyleSheet.create({
  // أنماط الحاويات
  container: {
    flex: 1,
    ...getFlexDirection(),
  },
  
  // أنماط النصوص
  text: {
    ...getRTLTextStyle(),
  },
  
  // أنماط الأيقونات
  icon: {
    ...getIconDirection(),
  },
  
  // أنماط الأزرار
  button: {
    ...getFlexDirection(),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // أنماط المدخلات
  input: {
    ...getRTLTextStyle(),
    textAlignVertical: 'center',
  },
  
  // أنماط القوائم
  list: {
    ...getFlexDirection(),
    width: '100%',
  },
  
  // أنماط العناصر في القوائم
  listItem: {
    ...getFlexDirection(),
    width: '100%',
    alignItems: 'center',
  },
  
  // أنماط الهوامش الشائعة
  marginStart8: getRTLMargins(8, 0),
  marginEnd8: getRTLMargins(0, 8),
  marginHorizontal8: getRTLMargins(8, 8),
  
  // أنماط الحشو الشائعة
  paddingStart16: getRTLPadding(16, 0),
  paddingEnd16: getRTLPadding(0, 16),
  paddingHorizontal16: getRTLPadding(16, 16),
  
  // أنماط إضافية للتخطيط
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  row: {
    flexDirection: 'row',
  },
  alignStart: {
    alignItems: isRTL() ? 'flex-end' : 'flex-start',
  },
  alignEnd: {
    alignItems: isRTL() ? 'flex-start' : 'flex-end',
  },
}); 