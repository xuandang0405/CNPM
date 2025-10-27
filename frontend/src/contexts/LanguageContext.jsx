import React, { createContext, useContext } from 'react';
import { useUserStore } from '../store/useUserStore';
import { availableLangs } from '../i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Use a single source of truth for language from the global store
  const { lang, setLang } = useUserStore(state => ({ lang: state.lang, setLang: state.setLang }));
  const langs = availableLangs();

  const toggleLanguage = () => {
    const idx = Math.max(0, langs.indexOf(lang));
    const next = langs[(idx + 1) % langs.length];
    setLang(next);
  };
  const changeLanguage = (next) => {
    if (langs.includes(next)) setLang(next);
  };

  return (
    <LanguageContext.Provider value={{ language: lang, languages: langs, toggleLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
