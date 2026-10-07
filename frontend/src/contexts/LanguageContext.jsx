import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getTranslation, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLang }) {
  const [lang, setLangState] = useState(() => {
    if (initialLang && (initialLang === 'es' || initialLang === 'en')) {
      return initialLang;
    }
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    
    // 1. Revisar parámetro de URL si existe (ej. ?lang=en)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramLang = urlParams.get('lang');
      if (paramLang && (paramLang === 'es' || paramLang === 'en')) {
        return paramLang;
      }
    } catch {
      // ignore
    }

    // 2. Revisar almacenamiento local explícito
    try {
      const saved = localStorage.getItem('lunavet_lang');
      if (saved && (saved === 'es' || saved === 'en')) {
        return saved;
      }
    } catch {
      // ignore
    }

    return DEFAULT_LANGUAGE;
  });

  const setLang = useCallback((newLang) => {
    if (newLang === 'es' || newLang === 'en') {
      setLangState(newLang);
      localStorage.setItem('lunavet_lang', newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  // Función de traducción flexible
  // Soporta: t('nav.home'), t('portal.welcome', { name: 'Juan' }), t('nav.home', 'Inicio')
  const t = useCallback((key, paramsOrFallback = {}, maybeFallback = '') => {
    let params = {};
    let fallback = '';

    if (typeof paramsOrFallback === 'string') {
      fallback = paramsOrFallback;
    } else if (typeof paramsOrFallback === 'object') {
      params = paramsOrFallback;
      fallback = maybeFallback;
    }

    return getTranslation(lang, key, params, fallback);
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    isSpanish: lang === 'es',
    isEnglish: lang === 'en',
    supportedLanguages: SUPPORTED_LANGUAGES
  }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

const fallbackContext = {
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key, paramsOrFallback = {}, maybeFallback = '') => {
    let params = {};
    let fallback = '';
    if (typeof paramsOrFallback === 'string') {
      fallback = paramsOrFallback;
    } else if (typeof paramsOrFallback === 'object') {
      params = paramsOrFallback;
      fallback = maybeFallback;
    }
    return getTranslation(DEFAULT_LANGUAGE, key, params, fallback);
  },
  isSpanish: true,
  isEnglish: false,
  supportedLanguages: SUPPORTED_LANGUAGES
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return fallbackContext;
  }
  return context;
}

// Alias común para facilidad de uso
export const useTranslation = useLanguage;
