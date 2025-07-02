
import { Text, type TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const color = lightColor || darkColor || colors.text;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 18,
    lineHeight: 26,
    writingDirection: 'rtl',
  },
  defaultSemiBold: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 38,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  link: {
    lineHeight: 34,
    fontSize: 18,
    color: '#0a7ea4',
    writingDirection: 'rtl',
  },
});
