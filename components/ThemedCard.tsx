
import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemedStyles } from '@/hooks/useGlobalTheme';

export type ThemedCardProps = ViewProps & {
  variant?: 'default' | 'elevated';
};

export function ThemedCard({ 
  variant = 'default',
  style, 
  children,
  ...props 
}: ThemedCardProps) {
  const styles = useThemedStyles();
  
  const cardStyle = variant === 'elevated' 
    ? [styles.card, { elevation: 4, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' }]
    : styles.card;

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}
