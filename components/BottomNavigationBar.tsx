import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabRoute } from '@/types';
import { getRTLTextStyle } from '@/utils/rtl-utils';

// نفس ألوان شريط التبويبات في الصفحة الرئيسية (app/(tabs)/_layout.tsx)
const TAB_BAR_BG = '#E8F5F4';
const TAB_BAR_TINT_COLOR = '#595b59';
const TAB_BAR_BORDER = '#E5E5EA';

const tabs: TabRoute[] = [
  {
    key: 'explore',
    title: 'الأدوات المساعدة',
    icon: 'gear',
    route: '/(tabs)/explore'
  },
  {
    key: 'performance',
    title: 'الأداء المهني',
    icon: 'chart.bar.fill',
    route: '/(tabs)/performance'
  },
  {
    key: 'basicData',
    title: 'البيانات الأساسية',
    icon: 'person.circle.fill',
    route: '/(tabs)/basicData'
  },
  {
    key: 'index',
    title: 'الرئيسية',
    icon: 'house.fill',
    route: '/(tabs)'
  }
];

export const BottomNavigationBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string): boolean => {
    if (route === '/(tabs)' && pathname === '/') {
      return true;
    }
    return pathname.includes(route);
  };

  const handleTabPress = (tab: TabRoute) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!isActive(tab.route)) {
      router.push(tab.route);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
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
                  size={28}
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
  // مطابق لـ tabBarStyle في app/(tabs)/_layout.tsx
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: TAB_BAR_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 88,
        paddingBottom: 20,
        paddingTop: 8,
        backgroundColor: TAB_BAR_BG,
      },
      default: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        paddingTop: 8,
        backgroundColor: TAB_BAR_BG,
      },
    }),
  },
  tabBarContent: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: TAB_BAR_TINT_COLOR,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '400',
  },
});
