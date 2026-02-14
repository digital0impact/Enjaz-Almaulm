import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { StyleProps } from '@/types';

interface ThemedCardProps extends StyleProps {
  children: React.ReactNode;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ 
  children, 
  style 
}) => {
  return (
    <ThemedView style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});
