import { he } from '@/locales/he';
import { en } from '@/locales/en';

export type Language = 'he' | 'en';
export type TranslationKey = keyof typeof he;

const dictionaries = { he, en } as const;

export function getDirection(language: Language): 'rtl' | 'ltr' {
  return language === 'he' ? 'rtl' : 'ltr';
}

export function getTranslation(language: Language, key: TranslationKey): string {
  return dictionaries[language][key] ?? dictionaries.he[key] ?? key;
}
