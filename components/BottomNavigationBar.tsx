import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabRoute } from '@/types';
import { getRTLTextStyle } from '@/utils/rtl-utils';

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
    if (!isActive(tab.route)) {
      if (Platform.OS === 'ios') {
        // يمكن إضافة Haptics هنا إذا كان مطلوباً
      }
      router.push(tab.route);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.activeTab]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <IconSymbol
                size={24}
                name={tab.icon as any}
                color={active ? '#1c1f33' : '#666666'}
                style={styles.tabIcon}
              />
              <ThemedText style={[styles.tabText, active && styles.activeTabText]}>
                {tab.title}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E8F5F4',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    ...Platform.select({
      ios: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 88,
        paddingBottom: 20,
        paddingTop: 8,
      },
      default: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        paddingTop: 8,
      },
    }),
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
  activeTab: {
    backgroundColor: 'rgba(28, 31, 51, 0.05)',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    textAlign: 'center',
    ...getRTLTextStyle(),
    fontWeight: '400',
  },
  activeTabText: {
    color: '#1c1f33',
    fontWeight: '600',
    ...getRTLTextStyle(),
  },
});
