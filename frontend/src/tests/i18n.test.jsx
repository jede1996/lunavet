import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getTranslation, SUPPORTED_LANGUAGES } from '../i18n';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

describe('i18n Core Engine Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'es';
  });

  describe('getTranslation() resolver', () => {
    it('debe resolver claves válidas en español y en inglés', () => {
      const homeEs = getTranslation('es', 'nav.home');
      const homeEn = getTranslation('en', 'nav.home');

      expect(homeEs).toBe('Inicio');
      expect(homeEn).toBe('Home');
    });

    it('debe interpolar parámetros dinámicos en strings', () => {
      const welcomeEs = getTranslation('es', 'portal.welcome', { name: 'Luna' });
      const welcomeEn = getTranslation('en', 'portal.welcome', { name: 'Luna' });

      expect(welcomeEs).toBe('¡Hola, Luna!');
      expect(welcomeEn).toBe('Welcome, Luna!');
    });

    it('debe hacer fallback al idioma por defecto (es) si falta la clave en otro idioma', () => {
      const translated = getTranslation('en', 'portal.downloadCarnetPdf');
      expect(typeof translated).toBe('string');
      expect(translated.length).toBeGreaterThan(0);
    });

    it('debe retornar el fallback explícito si la clave no existe en ningún diccionario', () => {
      const missing = getTranslation('es', 'non.existent.key', {}, 'Texto de respaldo');
      expect(missing).toBe('Texto de respaldo');
    });

    it('debe tener lista de idiomas soportados con códigos y banderas', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(2);
      expect(SUPPORTED_LANGUAGES.map(l => l.code)).toEqual(['es', 'en']);
    });
  });

  describe('LanguageProvider & useLanguage Hook', () => {
    function TestConsumer() {
      const { lang, setLang, t, isSpanish, isEnglish } = useLanguage();
      return (
        <div>
          <span data-testid="current-lang">{lang}</span>
          <span data-testid="is-spanish">{String(isSpanish)}</span>
          <span data-testid="is-english">{String(isEnglish)}</span>
          <p data-testid="translated-text">{t('nav.services')}</p>
          <button onClick={() => setLang('en')}>Switch EN</button>
          <button onClick={() => setLang('es')}>Switch ES</button>
        </div>
      );
    }

    it('debe iniciar en idioma español por defecto', () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-lang')).toHaveTextContent('es');
      expect(screen.getByTestId('is-spanish')).toHaveTextContent('true');
      expect(screen.getByTestId('is-english')).toHaveTextContent('false');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Servicios');
      expect(document.documentElement.lang).toBe('es');
    });

    it('debe alternar de español a inglés y persistir en localStorage y html.lang', () => {
      render(
        <LanguageProvider>
          <TestConsumer />
        </LanguageProvider>
      );

      const btnEn = screen.getByRole('button', { name: /switch en/i });
      fireEvent.click(btnEn);

      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('is-spanish')).toHaveTextContent('false');
      expect(screen.getByTestId('is-english')).toHaveTextContent('true');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Services');
      expect(localStorage.getItem('lunavet_lang')).toBe('en');
      expect(document.documentElement.lang).toBe('en');

      // Cambiar de vuelta a español
      const btnEs = screen.getByRole('button', { name: /switch es/i });
      fireEvent.click(btnEs);

      expect(screen.getByTestId('current-lang')).toHaveTextContent('es');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Servicios');
      expect(localStorage.getItem('lunavet_lang')).toBe('es');
      expect(document.documentElement.lang).toBe('es');
    });

    it('debe respetar initialLang cuando se provee explícitamente', () => {
      render(
        <LanguageProvider initialLang="en">
          <TestConsumer />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Services');
    });
  });
});
