import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '@/lib/safeStorage';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'social-matching-theme';

function readStoredTheme(): ThemeMode {
  const value = safeLocalStorage.getItem(STORAGE_KEY);
  return value === 'dark' ? 'dark' : 'light';
}

export function useThemeMode(): {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
} {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeLocalStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
