import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeColors } from '@/types';
import { logError } from '@/utils/logger';

interface ThemeContextType {
  themeName: string;
  colors: ThemeColors;
  setThemeName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultTheme: Theme = {
  name: 'default',
  colors: {
    primary: '#add4ce',
    secondary: '#1c1f33',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#1c1f33',
    textSecondary: '#666666',
    border: '#e5e5ea',
    shadow: '#000000',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    inputBackground: '#F8F9FA',
    inputText: '#1c1f33',
    inputPlaceholder: '#999999',
    card: '#FFFFFF',
  }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeNameState] = useState<string>('default');
  const [colors] = useState<ThemeColors>(defaultTheme.colors);

  useEffect(() => {
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const storedThemeName = await AsyncStorage.getItem('themeName');

      if (storedThemeName) {
        setThemeNameState(storedThemeName);
      }
    } catch (error) {
      logError('Error loading theme settings', 'ThemeContext', error);
    }
  };

  const setThemeName = async (name: string) => {
    try {
      await AsyncStorage.setItem('themeName', name);
      setThemeNameState(name);
    } catch (error) {
      logError('Error saving theme name', 'ThemeContext', error);
    }
  };



  const value: ThemeContextType = {
    themeName,
    colors,
    setThemeName,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
