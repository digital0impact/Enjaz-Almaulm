
import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter, usePathname } from 'expo-router';

export function BottomNavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: 'explore',
      title: 'الأدوات المساعدة',
      icon: 'gear.fill',
      route: '/(tabs)/explore'
    },
    {
      name: 'performance',
      title: 'الأداء المهني',
      icon: 'chart.bar.fill',
      route: '/(tabs)/performance'
    },
    {
      name: 'basicData',
      title: 'البيانات الأساسية',
      icon: 'person.circle.fill',
      route: '/(tabs)/basicData'
    },
    {
      name: 'index',
      title: 'الرئيسية',
      icon: 'house.fill',
      route: '/(tabs)/'
    }
  ];

  return (
    <ThemedView style={styles.tabBar}>
      {tabs.map((tab) => {
        // تحسين منطق التحقق من الصفحة النشطة لتشمل المسارات الفرعية
        const isActive = pathname === tab.route || 
                         pathname.startsWith(`/(tabs)/${tab.name}`) ||
                         (tab.name === 'explore' && pathname === '/settings') ||
                         (tab.name === 'index' && pathname === '/(tabs)');
        
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => router.push(tab.route as any)}
          >
            <IconSymbol 
              size={28} 
              name={tab.icon as any} 
              color={isActive ? '#595b59' : '#999'} 
            />
            <ThemedText style={[
              styles.tabLabel,
              { color: isActive ? '#595b59' : '#999' }
            ]}>
              {tab.title}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E8F5F4',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
