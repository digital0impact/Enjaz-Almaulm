import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabRoute } from '@/types';
import { getRTLTextStyle } from '@/utils/rtl-utils';

// مطابق لشريط التبويبات الرئيسية: @react-navigation/bottom-tabs (TABBAR_HEIGHT_UIKIT = 49 + safe area، labelBeneath fontSize 10)
const TAB_BAR_HEIGHT_UIKIT = 49;
const TAB_BAR_BG = '#E8F5F4';
const TAB_BAR_TINT_COLOR = '#595b59';
const TAB_BAR_BORDER = '#E5E5EA';

// ترتيب التبويبات من اليمين لليسار: الرئيسية أولاً (أقصى اليمين) ثم البيانات ثم الأداء ثم الأدوات المساعدة
const tabs: TabRoute[] = [
  {
    key: 'index',
    title: 'الرئيسية',
    icon: 'house.fill',
    route: '/(tabs)'
  },
  {
    key: 'basicData',
    title: 'البيانات الأساسية',
    icon: 'person.circle.fill',
    route: '/(tabs)/basicData'
  },
  {
    key: 'performance',
    title: 'الأداء المهني',
    icon: 'chart.bar.fill',
    route: '/(tabs)/performance'
  },
  {
    key: 'explore',
    title: 'الأدوات المساعدة',
    icon: 'gear',
    route: '/(tabs)/explore'
  },
];

export const BottomNavigationBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string): boolean => {
    // مجموعات المسارات مثل (tabs) لا تظهر في pathname الفعلي (usePathname)،
    // لذا نطابق بعد إزالتها بدلًا من مطابقة النص الخام لمسار التبويب
    const normalized = route.replace('/(tabs)', '') || '/';
    if (normalized === '/') {
      return pathname === '/';
    }
    return pathname === normalized || pathname.startsWith(`${normalized}/`);
  };

  const handleTabPress = (tab: TabRoute) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!isActive(tab.route)) {
      router.push(tab.route);
    }
  };

  const tabBarHeight = TAB_BAR_HEIGHT_UIKIT + insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }]}>
        {Platform.OS === 'ios' && (
          <BlurView
            tint="systemChromeMaterial"
            intensity={100}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.tabBarContent}>
          {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  size={22}
                  name={tab.icon as any}
                  color={TAB_BAR_TINT_COLOR}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabText, getRTLTextStyle()]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  // مطابق لشريط التبويبات الرئيسية (ارتفاع 49 + safe area، padding العنصر 5، نص 10)
  tabBar: {
    // على الويب نستخدم 'fixed' بدلاً من 'absolute' حتى يبقى الشريط ثابتًا
    // بالنسبة لنافذة العرض (viewport) دائمًا، بصرف النظر عن ارتفاع/تحريك
    // (transform) أي عنصر أب — وهو ما كان يسبب تحرك الشريط أثناء التمرير
    // في صفحات معينة (كالإعدادات وخطط الاشتراك) تحتوي حاوية المحتوى القابلة
    // للتمرير فيها على transform للأنيميشن. 'fixed' غير مدعوم في React Native
    // الأصلي (لذا cast) لكنه مدعوم في React Native Web.
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: TAB_BAR_BORDER,
    paddingTop: 0,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: TAB_BAR_BG,
    direction: 'rtl',
  },
  // الحاوية بداخل tabBar التي direction:'rtl' فيها rtl، لذا flexDirection:'row' هنا
  // (وليس 'row-reverse') يضع أول عنصر في مصفوفة tabs (الرئيسية) في أقصى اليمين،
  // ثم بقية العناصر تليه يسارًا بنفس ترتيب المصفوفة
  tabBarContent: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    // عمودي (أيقونة أعلى، عنوان أسفل) — لا يتأثر بمشاكل row-reverse مع
    // اتجاه الصفحة RTL التي تصيب التخطيط الأفقي (انظر tabBarContent أعلاه)
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 10,
    minHeight: 44,
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabText: {
    fontSize: 10,
    color: TAB_BAR_TINT_COLOR,
    textAlign: 'center',
    fontWeight: '500',
  },
});
