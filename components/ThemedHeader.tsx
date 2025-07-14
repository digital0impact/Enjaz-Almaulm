import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useThemedStyles, useGlobalTheme } from '@/hooks/useGlobalTheme';
import { useRouter } from 'expo-router';

export type ThemedHeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightButton?: {
    icon: string;
    onPress: () => void;
  };
  onBackPress?: () => void;
};

export function ThemedHeader({ 
  title, 
  showBackButton = true, 
  rightButton,
  onBackPress 
}: ThemedHeaderProps) {
  const styles = useThemedStyles();
  const { colors } = useGlobalTheme();
  const router = useRouter();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <ThemedView style={styles.header}>
      {showBackButton && (
        <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
      )}
      
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      
      {rightButton ? (
        <TouchableOpacity style={styles.headerButton} onPress={rightButton.onPress}>
          <IconSymbol size={24} name={rightButton.icon as any} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <ThemedView style={{ width: 40 }} />
      )}
    </ThemedView>
  );
}
