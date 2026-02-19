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
  const insets = useSafeAreaInsets();

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
  // مطابق لشريط التبويبات الرئيسية (ارتفاع 49 + safe area، padding العنصر 5، نص 10)
  tabBar: {
    position: 'absolute',
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
  },
  tabBarContent: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 10,
    minHeight: 44,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabText: {
    fontSize: 10,
    color: TAB_BAR_TINT_COLOR,
    textAlign: 'center',
    fontWeight: '500',
  },
});
