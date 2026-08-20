import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getTextDirection } from '@/utils/rtl-utils';
import type { ToolMenuItem } from '@/data/toolsMenu';

/**
 * بطاقة أداة واحدة في شبكة الأدوات. الأنماط منقولة حرفيًا (نفس القيم
 * بالضبط) من app/(tabs)/index.tsx وapp/(tabs)/explore.tsx، اللذين كانا
 * يعرّفان نفس كائنات toolCard/toolIconWrapper/toolTitle/toolDescription
 * بقيم متطابقة تمامًا في كلا الملفين قبل هذا الاستخراج.
 */
export interface ToolCardProps extends Pick<ToolMenuItem, 'icon' | 'title' | 'description'> {
  onPress: () => void;
}

export function ToolCard({ icon, title, description, onPress }: ToolCardProps) {
  return (
    <TouchableOpacity style={styles.toolCard} onPress={onPress}>
      <ThemedView style={styles.toolIconWrapper}>
        <IconSymbol size={28} name={icon} color="#1c1f33" />
      </ThemedView>
      <ThemedText style={[styles.toolTitle, getTextDirection()]}>{title}</ThemedText>
      <ThemedText style={[styles.toolDescription, getTextDirection()]}>{description}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toolCard: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toolIconWrapper: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
});
