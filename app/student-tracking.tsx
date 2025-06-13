import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedHeader } from '@/components/ThemedHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useThemedStyles, useGlobalTheme } from '@/hooks/useGlobalTheme';

export default function StudentTrackingScreen() {
  const router = useRouter();
  const styles = useThemedStyles();
  const { colors } = useGlobalTheme();

  return (
    <ThemedView style={styles.container}>
      {/* الهيدر الموحد */}
      <ThemedHeader 
        title="تتبع حالة متعلم"
        rightButton={{
          icon: "plus",
          onPress: () => {}
        }}
      />

      <ScrollView style={styles.content}>
        <ThemedView style={styles.emptyState}>
          <IconSymbol size={60} name="person.crop.circle.badge.plus" color="#ccc" />
          <ThemedText style={styles.emptyTitle}>لا توجد بيانات متعلمين</ThemedText>
          <ThemedText style={styles.emptySubtitle}>اضغط على + لإضافة متعلم جديد</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}