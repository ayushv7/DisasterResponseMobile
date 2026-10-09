import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { darkColors, lightColors, ThemeColors, ThemeMode } from './colors';

const THEME_STORAGE_KEY = '@dron_theme_preference';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  fontsLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  colors: lightColors,
  setMode: () => {},
  toggleTheme: () => {},
  fontsLoaded: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  };

  const toggleTheme = () => {
    // Cycles: system -> light -> dark -> system
    if (mode === 'system') {
      setMode('light');
    } else if (mode === 'light') {
      setMode('dark');
    } else {
      setMode('system');
    }
  };

  const isDark =
    mode === 'dark' ? true : mode === 'light' ? false : systemScheme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        setMode,
        toggleTheme,
        fontsLoaded,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
