import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleProps } from '@/types';

interface ThemedCardProps extends StyleProps {
  children: React.ReactNode;
}

/**
 * بطاقة موحّدة تستمد ألوانها من useTheme() (المصدر الرسمي الوحيد للألوان،
 * مقرر في المرحلة 8) بدل قيم ثابتة، حتى تتبع أي تعديل مستقبلي على الثيم
 * تلقائيًا. الخصائص الهيكلية (radius/padding/shadow) تبقى قيمًا افتراضية
 * معقولة يمكن تجاوزها عبر style كما في السابق.
 */
export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  style,
}) => {
  const { colors } = useTheme();
  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {children}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
});
