
import { useColorScheme } from "react-native";

export function useTheme() {
  const scheme = useColorScheme();
  
  const lightTheme = {
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
    }
  };

  const darkTheme = {
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
    }
  };

  return scheme === "dark" ? darkTheme : lightTheme;
}

// Export useColorScheme for compatibility
export { useColorScheme };
