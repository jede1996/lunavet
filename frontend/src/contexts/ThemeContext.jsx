import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateFavicon } from '../utils/favicon';

const ThemeContext = createContext(null);

export const THEMES = {
  APPLE: 'apple',
  APPLE_DARK: 'apple-dark'
};

export const THEME_LIST = [
  { id: 'apple', name: 'Apple Claro', family: 'apple', isDark: false, isDefault: true, icon: 'bi-sun-fill' },
  { id: 'apple-dark', name: 'Apple Oscuro', family: 'apple', isDark: true, isDefault: false, icon: 'bi-moon-stars-fill' }
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlTheme = urlParams?.get('theme');
    if (urlTheme === 'apple' || urlTheme === 'apple-dark') {
      return urlTheme;
    }

    let saved = localStorage.getItem('lunavet_theme');
    // Normalizar temas heredados o descartados a la variante Apple correspondiente
    if (saved === 'light') saved = 'apple';
    if (saved === 'dark') saved = 'apple-dark';
    
    if (saved === 'apple' || saved === 'apple-dark') {
      return saved;
    }
    // Apple Segmented Glassmorphic es el estándar oficial de Luna-Vet
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'apple-dark';
    }
    return 'apple';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('lunavet_high_contrast') === 'true';
  });

  useEffect(() => {
    const isDarkTheme = theme === 'apple-dark';

    // Sincronización con data-bs-theme para componentes internos de Bootstrap 5
    document.documentElement.setAttribute('data-bs-theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark-mode', isDarkTheme);
    document.documentElement.classList.toggle('light-mode', !isDarkTheme);
    document.documentElement.classList.add('theme-apple', 'apple-design', 'apple-glassmorphic');
    document.documentElement.classList.remove('theme-classic');
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('or-mode', highContrast);

    localStorage.setItem('lunavet_theme', theme);
    localStorage.setItem('lunavet_high_contrast', String(highContrast));

    // Actualización de favicon asíncrona no bloqueante
    const updateFav = () => {
      try {
        const savedBrand = localStorage.getItem('lunavet_brand_config');
        const brand = savedBrand ? JSON.parse(savedBrand) : null;
        updateFavicon(brand || {}, isDarkTheme ? 'dark' : 'light');
      } catch {
        updateFavicon({}, isDarkTheme ? 'dark' : 'light');
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(updateFav);
    } else {
      setTimeout(updateFav, 0);
    }
  }, [theme, highContrast]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'apple' ? 'apple-dark' : 'apple'));
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const setTheme = (newTheme) => {
    let target = newTheme;
    // Normalización de compatibilidad
    if (target === 'light') target = 'apple';
    if (target === 'dark') target = 'apple-dark';
    if (['apple', 'apple-dark'].includes(target)) {
      setThemeState(target);
    }
  };

  const cycleTheme = () => {
    setThemeState(prev => (prev === 'apple' ? 'apple-dark' : 'apple'));
  };

  const isDark = theme === 'apple-dark';
  const isApple = true;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isApple,
        isHighContrast: highContrast,
        isOrMode: highContrast,
        toggleTheme,
        toggleHighContrast,
        toggleOrMode: toggleHighContrast,
        cycleTheme,
        setTheme,
        themes: THEME_LIST
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return ctx;
}

