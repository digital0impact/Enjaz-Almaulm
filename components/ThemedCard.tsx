
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './ThemedView';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: any;
}

export function ThemedCard({ children, style }: ThemedCardProps) {
  const { colors } = useTheme();
  
  return (
    <ThemedView style={[{
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    }, style]}>
      {children}
    </ThemedView>
  );
}
