
import { useColorScheme } from 'react-native';
import { StyleSheet } from 'react-native';

export const lightTheme = {
  isDark: false,
  colors: {
    primary: "#add6d7",
    secondary: "#bcebec",
    background: "#f2fafa",
    surface: "#e0f0f1",
    muted: "#cadfde",
    border: "#cadcd9",
    accent: "#add4ce",
    textPrimary: "#100f0d",
    textSecondary: "#5a5b58",
    disabled: "#9a9a95",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 20,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
};

export const darkTheme = {
  isDark: true,
  colors: {
    primary: "#add4ce",
    secondary: "#5a5b58",
    background: "#100f0d",
    surface: "#1c1c1a",
    muted: "#333331",
    border: "#2a2a27",
    accent: "#bcebec",
    textPrimary: "#f2fafa",
    textSecondary: "#cadcd9",
    disabled: "#9a9a95",
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  fontSize: lightTheme.fontSize,
};

export function useGlobalTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  
  return {
    colors: theme.colors,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    fontSize: theme.fontSize,
    isDark: theme.isDark,
  };
}

export function useThemedStyles() {
  const { colors, spacing, borderRadius, fontSize } = useGlobalTheme();
  
  return StyleSheet.create({
    // أنماط الحاوية الرئيسية
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    // أنماط الهيدر
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      flex: 1,
      writingDirection: 'rtl',
    },
    
    // أنماط الأزرار
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryButtonText: {
      color: colors.textPrimary,
      fontSize: fontSize.md,
      fontWeight: '600',
      writingDirection: 'rtl',
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontSize: fontSize.md,
      fontWeight: '600',
      writingDirection: 'rtl',
    },
    
    // أنماط البطاقات
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginVertical: spacing.sm,
      boxShadow: `0px 2px 4px ${colors.muted}`,
      borderWidth: 1,
      borderColor: colors.border,
    },
    
    // أنماط المدخلات
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    
    // أنماط النصوص
    title: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    subtitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    bodyText: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    caption: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    
    // أنماط عامة
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xxl,
    },
    emptyStateText: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
}
