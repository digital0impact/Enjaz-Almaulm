import { GlobalStyles } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export function useGlobalTheme() {
  const { colors, themeName } = useTheme();
  
  return {
    colors,
    styles: GlobalStyles,
    isDark: false, // Currently only supporting light theme
  };
}

export function useThemedStyles() {
  const { colors, styles } = useGlobalTheme();
  
  // دمج الألوان مع الأنماط
  const themedStyles = {
    ...styles,
    // تحديث الأنماط بالألوان الحالية
    header: {
      ...styles.header,
      backgroundColor: colors.primary,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...styles.headerTitle,
      color: colors.text,
    },
    primaryButton: {
      ...styles.primaryButton,
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      ...styles.secondaryButton,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    primaryButtonText: {
      ...styles.primaryButtonText,
      color: colors.text,
    },
    secondaryButtonText: {
      ...styles.secondaryButtonText,
      color: colors.textSecondary,
    },
    card: {
      ...styles.card,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      borderColor: colors.border,
    },
    textInput: {
      ...styles.textInput,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
    toolbar: {
      ...styles.toolbar,
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    toolButton: {
      ...styles.toolButton,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    toolButtonText: {
      ...styles.toolButtonText,
      color: colors.text,
    },
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    divider: {
      ...styles.divider,
      backgroundColor: colors.border,
    },
    emptyStateText: {
      ...styles.emptyStateText,
      color: colors.textSecondary,
    },
  };

  return themedStyles;
}
