import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Language, STRINGS, StringKey } from './strings';

const STORAGE_KEY = 'ui-language-v1';

interface LanguageValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: StringKey) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'en' || v === 'hi') setLanguageState(v);
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, t: (key: StringKey) => STRINGS[language][key] ?? STRINGS.en[key] }),
    [language, setLanguage]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** `const { t } = useStrings(); t('tasks.title')`. English outside the provider. */
export function useStrings(): LanguageValue {
  return (
    useContext(LanguageContext) ?? {
      language: 'en',
      setLanguage: () => {},
      t: (key: StringKey) => STRINGS.en[key],
    }
  );
}
