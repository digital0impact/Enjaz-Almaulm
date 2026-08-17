import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedCardProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * بطاقة موحّدة تستمد ألوانها من useTheme() (المصدر الرسمي الوحيد للألوان،
 * مقرر في المرحلة 8) بدل قيم ثابتة، حتى تتبع أي تعديل مستقبلي على الثيم
 * تلقائيًا. الخصائص الهيكلية (radius/padding/shadow) تبقى قيمًا افتراضية
 * معقولة يمكن تجاوزها عبر style كما في السابق.
 *
 * ملاحظة: الخلفية تستخدم colors.surface وليس colors.card، لأن هذا هو
 * اللون الفعلي المستخدم بالفعل في كل "بطاقات" التطبيق الحقيقية (F8F9FA،
 * انظر مثلاً hooks/useGlobalTheme.ts وشاشات مثل absence-management.tsx)
 * بينما colors.card (#FFFFFF) غير مستخدم فعليًا بهذا المعنى في أي مكان.
 *
 * تُمرَّر أي خصائص إضافية (id، testID، onLayout...) مباشرةً إلى ThemedView
 * الداخلي - ضروري مثلاً لشاشات تعتمد على document.getElementById(id) للتمرير
 * لبطاقة معيّنة على الويب (انظر app/student-tracking.tsx).
 */
export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  style,
  ...rest
}) => {
  const { colors } = useTheme();
  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        style,
      ]}
      {...rest}
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
