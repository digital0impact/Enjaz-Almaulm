import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemedStyles } from '@/hooks/useGlobalTheme';
import { useTheme } from '@/contexts/ThemeContext';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

type IconSymbolProps = React.ComponentProps<typeof IconSymbol>;

export type ThemedButtonProps = TouchableOpacityProps & {
  /** نص الزر. اختياري الآن كي يدعم النمط icon-only (icon بلا title). */
  title?: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  /** اسم الأيقونة (من IconSymbol) لعرضها. مطلوب في النمط icon-only. */
  icon?: IconSymbolProps['name'];
  /** حجم الأيقونة عند استخدام icon-only. الافتراضي مشتق من size. */
  iconSize?: number;
  /** لون الأيقونة عند استخدام icon-only. الافتراضي أبيض للـ primary ولون النص للـ secondary. */
  iconColor?: string;
};

const ICON_ONLY_SIZE_MAP: Record<NonNullable<ThemedButtonProps['size']>, number> = {
  small: 32,
  medium: 40,
  large: 48,
};

const ICON_SIZE_MAP: Record<NonNullable<ThemedButtonProps['size']>, number> = {
  small: 16,
  medium: 20,
  large: 24,
};

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconSize,
  iconColor,
  style,
  ...props
}: ThemedButtonProps) {
  const styles = useThemedStyles();
  const { colors } = useTheme();
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText;

  // نمط icon-only: بلا title، مع icon محدد — زر دائري مضغوط بلا نص.
  if (!title && icon) {
    const dimension = ICON_ONLY_SIZE_MAP[size];
    const resolvedIconColor =
      iconColor || (variant === 'primary' ? '#FFFFFF' : colors.text);
    return (
      <TouchableOpacity
        style={[
          buttonStyle,
          {
            width: dimension,
            height: dimension,
            paddingVertical: 0,
            paddingHorizontal: 0,
            borderRadius: dimension / 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
        {...props}
      >
        <IconSymbol name={icon} size={iconSize ?? ICON_SIZE_MAP[size]} color={resolvedIconColor} />
      </TouchableOpacity>
    );
  }

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
      <ThemedText style={[textStyle, getTextDirection()]}>{formatRTLText(title ?? '')}</ThemedText>
    </TouchableOpacity>
  );
}
