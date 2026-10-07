import { es } from './locales/es';
import { en } from './locales/en';

export const translations = {
  es,
  en
};

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'en', label: 'English', flag: '🇺🇸' }
];

export const DEFAULT_LANGUAGE = 'es';

/**
 * Resuelve una clave de traducción con notación de punto (ej. "nav.home")
 * y reemplaza parámetros variables {name}.
 */
export function getTranslation(lang, path, params = {}, fallback = '') {
  const dictionary = translations[lang] || translations[DEFAULT_LANGUAGE];
  const keys = path.split('.');
  
  let current = dictionary;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = null;
      break;
    }
  }

  // Si no se encuentra en el idioma actual, buscar en el idioma por defecto
  if (current === null && lang !== DEFAULT_LANGUAGE) {
    let fallbackDict = translations[DEFAULT_LANGUAGE];
    for (const k of keys) {
      if (fallbackDict && typeof fallbackDict === 'object' && k in fallbackDict) {
        fallbackDict = fallbackDict[k];
      } else {
        fallbackDict = null;
        break;
      }
    }
    current = fallbackDict;
  }

  let text = current !== null && current !== undefined ? current : fallback || path;

  if (typeof text === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
  }

  return text;
}
