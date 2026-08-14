import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ToolCard } from '@/components/ToolCard';
import type { ToolMenuItem } from '@/data/toolsMenu';

/**
 * شبكة بطاقات أدوات، تحل محل الشبكتين شبه المتطابقتين اللتين كانتا
 * مكتوبتين يدويًا في app/(tabs)/index.tsx وapp/(tabs)/explore.tsx (نفس
 * البنية والأنماط بالضبط، فرق فقط في قائمة الأدوات نفسها).
 */
export interface ToolsGridProps {
  tools: ToolMenuItem[];
}

export function ToolsGrid({ tools }: ToolsGridProps) {
  const router = useRouter();

  return (
    <ThemedView style={styles.toolsGrid}>
      {tools.map((tool) => (
        <ToolCard
          key={tool.title}
          icon={tool.icon}
          title={tool.title}
          description={tool.description}
          onPress={() => router.push(tool.route)}
        />
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  toolsGrid: {
    flexDirection: 'column',
    gap: 15,
    backgroundColor: 'transparent',
  },
});
