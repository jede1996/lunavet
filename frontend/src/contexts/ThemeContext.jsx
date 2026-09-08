import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateFavicon } from '../utils/favicon';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lunavet_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('lunavet_high_contrast') === 'true';
  });

  useEffect(() => {
    const isDarkTheme = theme === 'dark';
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.documentElement.classList.toggle('dark-mode', isDarkTheme);
    document.documentElement.classList.toggle('light-mode', !isDarkTheme);
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
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isHighContrast: highContrast,
        isOrMode: highContrast,
        toggleTheme,
        toggleHighContrast,
        toggleOrMode: toggleHighContrast,
        cycleTheme: toggleTheme,
        setTheme
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

