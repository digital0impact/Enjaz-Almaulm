
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "./useGlobalTheme";

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
