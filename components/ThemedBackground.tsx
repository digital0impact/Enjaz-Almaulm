import React from 'react';
import { ImageBackground, StyleSheet, ViewStyle } from 'react-native';

interface ThemedBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ 
  children, 
  style, 
  resizeMode = 'cover' 
}) => {
  return (
    <ImageBackground
      source={require('@/assets/images/background.png')}
      style={[styles.backgroundImage, style]}
      resizeMode={resizeMode}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
}); 