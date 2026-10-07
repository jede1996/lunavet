import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function TestComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'yes' : 'no'}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Alternar
      </button>
    </div>
  );
}

describe('ThemeContext & ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
    document.documentElement.className = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe inicializarse en apple por defecto si no hay preferencia en localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('apple');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('no');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light-mode')).toBe(true);
    expect(document.documentElement.classList.contains('theme-apple')).toBe(true);
    expect(localStorage.getItem('lunavet_theme')).toBe('apple');
  });

  it('debe respetar el valor persistido en localStorage', () => {
    localStorage.setItem('lunavet_theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('yes');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
  });

  it('debe alternar entre claro y oscuro al invocar toggleTheme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    expect(screen.getByTestId('current-theme')).toHaveTextContent('apple');

    // Cambiar a oscuro (apple-dark)
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('apple-dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('yes');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('lunavet_theme')).toBe('apple-dark');

    // Cambiar a claro nuevamente (apple)
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('apple');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('no');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    expect(localStorage.getItem('lunavet_theme')).toBe('apple');
  });

  it('debe permitir cambiar directamente entre todos los temas disponibles con setTheme', () => {
    function SwitcherComponent() {
      const { theme, isApple, isDark, setTheme, toggleHighContrast, isHighContrast } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="is-apple">{isApple ? 'yes' : 'no'}</span>
          <span data-testid="is-dark">{isDark ? 'yes' : 'no'}</span>
          <span data-testid="is-hc">{isHighContrast ? 'yes' : 'no'}</span>
          <button data-testid="set-apple-dark" onClick={() => setTheme('apple-dark')}>Apple Dark</button>
          <button data-testid="set-light" onClick={() => setTheme('light')}>Neumórfico Claro</button>
          <button data-testid="set-dark" onClick={() => setTheme('dark')}>Neumórfico Dark</button>
          <button data-testid="set-apple" onClick={() => setTheme('apple')}>Apple Claro</button>
          <button data-testid="toggle-hc" onClick={toggleHighContrast}>Alto Contraste</button>
        </div>
      );
    }

    render(
      <ThemeProvider>
        <SwitcherComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('apple');
    expect(screen.getByTestId('is-apple')).toHaveTextContent('yes');

    // Cambiar a Apple Dark
    fireEvent.click(screen.getByTestId('set-apple-dark'));
    expect(screen.getByTestId('theme')).toHaveTextContent('apple-dark');
    expect(screen.getByTestId('is-apple')).toHaveTextContent('yes');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('yes');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-apple')).toBe(true);

    // Cambiar a Neumórfico Claro
    fireEvent.click(screen.getByTestId('set-light'));
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('is-apple')).toHaveTextContent('no');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('no');
    expect(document.documentElement.classList.contains('theme-classic')).toBe(true);
    expect(document.documentElement.classList.contains('theme-apple')).toBe(false);

    // Cambiar a Neumórfico Oscuro
    fireEvent.click(screen.getByTestId('set-dark'));
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-apple')).toHaveTextContent('no');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('yes');
    expect(document.documentElement.classList.contains('theme-classic')).toBe(true);

    // Activar Alto Contraste
    fireEvent.click(screen.getByTestId('toggle-hc'));
    expect(screen.getByTestId('is-hc')).toHaveTextContent('yes');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('debe lanzar error si useTheme se ejecuta fuera de un ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useTheme debe usarse dentro de un ThemeProvider');

    spy.mockRestore();
  });
});
