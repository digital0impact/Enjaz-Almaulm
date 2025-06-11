import { View, type ViewProps, ImageBackground } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  useBackgroundImage?: boolean;
};

export function ThemedView({ style, lightColor, darkColor, useBackgroundImage = false, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  if (useBackgroundImage) {
    return (
      <View style={[{ backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }, style]} {...otherProps}>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          opacity: 0.8
        }} />
        {otherProps.children}
      </View>
    );
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
