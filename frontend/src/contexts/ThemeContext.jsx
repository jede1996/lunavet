import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateFavicon } from '../utils/favicon';

const ThemeContext = createContext(null);

export const THEMES = {
  APPLE: 'apple',
  APPLE_DARK: 'apple-dark',
  LIGHT: 'light',
  DARK: 'dark'
};

export const THEME_LIST = [
  { id: 'apple', name: 'Apple Claro', family: 'apple', isDark: false, isDefault: true, icon: 'bi-apple' },
  { id: 'apple-dark', name: 'Apple Oscuro', family: 'apple', isDark: true, isDefault: false, icon: 'bi-apple' },
  { id: 'light', name: 'Neumórfico Claro', family: 'classic', isDark: false, isDefault: false, icon: 'bi-brightness-high' },
  { id: 'dark', name: 'Neumórfico Oscuro', family: 'classic', isDark: true, isDefault: false, icon: 'bi-moon-stars' }
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('lunavet_theme');
    if (['apple', 'apple-dark', 'light', 'dark'].includes(saved)) {
      return saved;
    }
    // Apple Design es el tema oficial por defecto de Luna-Vet
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'apple-dark';
    }
    return 'apple';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('lunavet_high_contrast') === 'true';
  });

  useEffect(() => {
    const isDarkTheme = theme === 'apple-dark' || theme === 'dark';
    const isAppleTheme = theme === 'apple' || theme === 'apple-dark';

    // Sincronización con data-bs-theme para componentes internos de Bootstrap 5
    document.documentElement.setAttribute('data-bs-theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark-mode', isDarkTheme);
    document.documentElement.classList.toggle('light-mode', !isDarkTheme);
    document.documentElement.classList.toggle('theme-apple', isAppleTheme);
    document.documentElement.classList.toggle('apple-design', isAppleTheme);
    document.documentElement.classList.toggle('theme-classic', !isAppleTheme);
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
    setThemeState(prev => {
      if (prev === 'apple') return 'apple-dark';
      if (prev === 'apple-dark') return 'apple';
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return 'apple-dark';
    });
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const setTheme = (newTheme) => {
    if (['apple', 'apple-dark', 'light', 'dark'].includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const cycleTheme = () => {
    const sequence = ['apple', 'apple-dark', 'light', 'dark'];
    setThemeState(prev => {
      const idx = sequence.indexOf(prev);
      return sequence[(idx + 1) % sequence.length];
    });
  };

  const isDark = theme === 'apple-dark' || theme === 'dark';
  const isApple = theme === 'apple' || theme === 'apple-dark';

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

