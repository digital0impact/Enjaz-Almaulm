import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useResponsiveLayout, CONTENT_MAX_WIDTH_WEB } from '@/hooks/useResponsiveLayout';

interface ResponsiveScreenWrapperProps {
  children: React.ReactNode;
  /** عند true يتم توسيط المحتوى على الويب مع حد أقصى للعرض */
  centerOnWeb?: boolean;
  /** حد أقصى مخصص للعرض على الويب (اختياري) */
  maxWidth?: number;
  style?: object;
}

/**
 * يلف محتوى الشاشة لتحسين الظهور على الويب والهواتف:
 * - على الويب: حد أقصى للعرض وتوسيط (إن centerOnWeb = true)
 * - هوامش أفقية متجاوبة
 */
export function ResponsiveScreenWrapper({
  children,
  centerOnWeb = true,
  maxWidth = CONTENT_MAX_WIDTH_WEB,
  style,
}: ResponsiveScreenWrapperProps) {
  const { screenWidth, isWeb, horizontalPadding } = useResponsiveLayout();
  const effectiveMaxWidth = isWeb ? Math.min(screenWidth, maxWidth) : screenWidth;

  const wrapperStyle = [
    styles.wrapper,
    { paddingHorizontal: horizontalPadding },
    isWeb && centerOnWeb && {
      maxWidth: effectiveMaxWidth,
      width: '100%',
      alignSelf: 'center',
      flex: 1,
    },
    style,
  ];

  return <View style={wrapperStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
  },
});
