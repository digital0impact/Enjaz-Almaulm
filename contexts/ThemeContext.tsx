
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Themes } from '@/constants/Colors';

type ThemeMode = 'light' | 'dark';
type ThemeName = keyof typeof Themes;

interface ThemeContextType {
  themeName: ThemeName;
  themeMode: ThemeMode;
  colors: any;
  setThemeName: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
  availableThemes: Array<{ key: ThemeName; name: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [themeName, setThemeNameState] = useState<ThemeName>('default');
  const [themeMode, setThemeModeState] = useState<ThemeMode>(systemColorScheme);

  const availableThemes = Object.keys(Themes).map(key => ({
    key: key as ThemeName,
    name: Themes[key as ThemeName].name
  }));

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const savedThemeName = await AsyncStorage.getItem('themeName');
      const savedThemeMode = await AsyncStorage.getItem('themeMode');
      
      if (savedThemeName && savedThemeName in Themes) {
        setThemeNameState(savedThemeName as ThemeName);
      }
      
      if (savedThemeMode === 'light' || savedThemeMode === 'dark') {
        setThemeModeState(savedThemeMode);
      }
    } catch (error) {
      console.log('Error loading theme settings:', error);
    }
  };

  const setThemeName = async (name: ThemeName) => {
    setThemeNameState(name);
    try {
      await AsyncStorage.setItem('themeName', name);
    } catch (error) {
      console.log('Error saving theme name:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.log('Error saving theme mode:', error);
    }
  };

  const colors = Themes[themeName][themeMode];

  return (
    <ThemeContext.Provider value={{
      themeName,
      themeMode,
      colors,
      setThemeName,
      setThemeMode,
      availableThemes
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
