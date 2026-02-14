import React from 'react';
import { Redirect } from 'expo-router';

// نقطة الدخول للتطبيق على الويب والموبايل.
// ملاحظة: اسم مجموعة المسارات (tabs) بين أقواس لا يظهر في رابط المتصفح،
// لذلك المسار الصحيح لفتح التبويبات هو "/(tabs)" أو ببساطة "/".
// هنا نستخدم "/(tabs)" حتى نضمن فتح تبويب "الرئيسية" الذي عيّناه كـ initialRouteName.
export default function IndexScreen() {
  return <Redirect href="/(tabs)" />;
}