
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemedStyles } from '@/hooks/useGlobalTheme';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
};

export function ThemedButton({ 
  title, 
  variant = 'primary', 
  size = 'medium',
  style,
  ...props 
}: ThemedButtonProps) {
  const styles = useThemedStyles();
  
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText;
  
  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16 },
    medium: { paddingVertical: 12, paddingHorizontal: 20 },
    large: { paddingVertical: 16, paddingHorizontal: 24 },
  };

  return (
    <TouchableOpacity 
      style={[buttonStyle, sizeStyles[size], style]} 
      {...props}
    >
      <ThemedText style={textStyle}>{title}</ThemedText>
    </TouchableOpacity>
  );
}
