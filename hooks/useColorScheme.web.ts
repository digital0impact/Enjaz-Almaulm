// hooks/useTheme.ts
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "../styles/theme";

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
