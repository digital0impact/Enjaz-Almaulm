// styles/theme.ts

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
