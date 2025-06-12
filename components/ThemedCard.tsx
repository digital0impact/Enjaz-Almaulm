
import React from 'react';
import { ViewProps } from 'react-native';
import { ThemedView } from './ThemedView';
import { useThemedStyles } from '@/hooks/useGlobalTheme';

export type ThemedCardProps = ViewProps & {
  children: React.ReactNode;
  padding?: number;
};

export function ThemedCard({ 
  children, 
  style, 
  padding,
  ...props 
}: ThemedCardProps) {
  const styles = useThemedStyles();
  
  const cardStyle = padding !== undefined 
    ? { ...styles.card, padding } 
    : styles.card;

  return (
    <ThemedView style={[cardStyle, style]} {...props}>
      {children}
    </ThemedView>
  );
}
