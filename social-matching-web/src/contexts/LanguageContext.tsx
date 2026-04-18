import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { safeLocalStorage } from '@/lib/safeStorage';
import { getDirection, getTranslation, type Language, type TranslationKey } from '@/lib/i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'social-matching-language';
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLanguage(): Language {
  const value = safeLocalStorage.getItem(STORAGE_KEY);
  return value === 'en' ? 'en' : 'he';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    safeLocalStorage.setItem(STORAGE_KEY, next);
  };

  const dir = getDirection(language);
  const isRTL = dir === 'rtl';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [dir, language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      dir,
      isRTL,
      t: (key: TranslationKey) => getTranslation(language, key),
    }),
    [dir, isRTL, language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
