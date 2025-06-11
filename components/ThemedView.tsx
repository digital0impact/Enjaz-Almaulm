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
      <ImageBackground 
        source={require('@/assets/images/background.png')} 
        style={[{ backgroundColor: 'transparent' }, style]} 
        resizeMode="cover"
        {...otherProps}
      />
    );
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
