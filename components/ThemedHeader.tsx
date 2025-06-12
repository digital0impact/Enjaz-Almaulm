import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useThemedStyles, useGlobalTheme } from '@/hooks/useGlobalTheme';

export type ThemedHeaderProps = ViewProps & {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
};

export function ThemedHeader({ 
  title, 
  showBackButton = false, 
  onBackPress,
  rightComponent,
  style,
  ...props 
}: ThemedHeaderProps) {
  const styles = useThemedStyles();
  const { colors } = useGlobalTheme();

  return (
    <View style={[styles.header, style]} {...props}>
      {showBackButton && (
        <TouchableOpacity onPress={onBackPress} style={{ padding: 8 }}>
          <IconSymbol size={24} name="chevron.left" color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      <ThemedText style={styles.headerTitle}>{title}</ThemedText>

      {rightComponent && (
        <View>{rightComponent}</View>
      )}
    </View>
  );
}