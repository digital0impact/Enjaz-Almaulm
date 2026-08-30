import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {

  return (
    <Tabs
      // شريط التبويبات الأصلي لهذا المكوّن مُعطَّل نهائيًا (tabBar={() => null}):
      // كل شاشات التطبيق (بما فيها شاشات هذه المجموعة) توحّدت على مكوّن واحد هو
      // BottomNavigationBar، فيظهر نفس الشريط بنفس الترتيب والتنسيق في كل مكان
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="index">
      <Tabs.Screen name="explore" options={{ title: 'الأدوات المساعدة' }} />
      <Tabs.Screen name="performance" options={{ title: 'الأداء المهني' }} />
      <Tabs.Screen name="basicData" options={{ title: 'البيانات الأساسية' }} />
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
    </Tabs>
  );
}
