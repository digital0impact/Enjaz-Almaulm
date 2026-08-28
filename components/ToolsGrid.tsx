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

  /**
   * الشبكة مبنية من صفوف بطاقتين، لا من flexWrap واحد على كل العناصر،
   * حتى يمكن توسيط البطاقة الأخيرة عندما يكون عدد البطاقات فرديًا
   * (بدل أن تلتصق بأحد طرفي الصف الأخير كما يحدث مع justifyContent
   * ثابت لكل الصفوف).
   */
  const rows: ToolMenuItem[][] = [];
  for (let i = 0; i < tools.length; i += 2) {
    rows.push(tools.slice(i, i + 2));
  }

  return (
    <ThemedView style={styles.toolsGrid}>
      {rows.map((row, rowIndex) => (
        <ThemedView
          key={rowIndex}
          style={[styles.toolsRow, { justifyContent: row.length === 2 ? 'space-between' : 'center' }]}
        >
          {row.map((tool) => (
            <ToolCard
              key={tool.title}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              onPress={() => router.push(tool.route)}
            />
          ))}
        </ThemedView>
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
  toolsRow: {
    flexDirection: 'row',
    gap: 15,
    backgroundColor: 'transparent',
  },
});
