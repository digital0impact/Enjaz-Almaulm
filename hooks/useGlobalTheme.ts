
import { GlobalStyles } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

export function useGlobalTheme() {
  const { colors, themeMode } = useTheme();
  
  return {
    colors,
    styles: GlobalStyles,
    isDark: themeMode === 'dark',
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
      backgroundColor: colors.headerBackground,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...styles.headerTitle,
      color: colors.headerText,
    },
    primaryButton: {
      ...styles.primaryButton,
      backgroundColor: colors.buttonPrimary,
    },
    secondaryButton: {
      ...styles.secondaryButton,
      backgroundColor: colors.buttonSecondary,
      borderColor: colors.border,
    },
    primaryButtonText: {
      ...styles.primaryButtonText,
      color: colors.buttonText,
    },
    secondaryButtonText: {
      ...styles.secondaryButtonText,
      color: colors.buttonTextSecondary,
    },
    card: {
      ...styles.card,
      backgroundColor: colors.card,
      shadowColor: colors.cardShadow,
      borderColor: colors.border,
    },
    textInput: {
      ...styles.textInput,
      backgroundColor: colors.inputBackground,
      borderColor: colors.inputBorder,
      color: colors.inputText,
    },
    toolbar: {
      ...styles.toolbar,
      backgroundColor: colors.toolbarBackground,
      borderBottomColor: colors.toolbarBorder,
    },
    toolButton: {
      ...styles.toolButton,
      backgroundColor: colors.alternateBackground,
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
      backgroundColor: colors.divider,
    },
    emptyStateText: {
      ...styles.emptyStateText,
      color: colors.placeholderText,
    },
  };
  
  return themedStyles;
}
