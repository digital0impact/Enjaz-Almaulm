import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PWAInstallButton } from './PWAInstallButton';

/**
 * يلف كل شاشات التطبيق.
 * المحتوى يعرض بعرض كامل الصفحة (ويب وموبايل) كصفحة ويب عادية.
 */
export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      {children}
      <PWAInstallButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
});
