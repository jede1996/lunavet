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

  it('debe inicializarse en light por defecto si no hay preferencia en localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('no');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light-mode')).toBe(true);
    expect(localStorage.getItem('lunavet_theme')).toBe('light');
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
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Cambiar a oscuro
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('yes');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('lunavet_theme')).toBe('dark');

    // Cambiar a claro nuevamente
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('no');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    expect(localStorage.getItem('lunavet_theme')).toBe('light');
  });

  it('debe lanzar error si useTheme se ejecuta fuera de un ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useTheme debe usarse dentro de un ThemeProvider');

    spy.mockRestore();
  });
});
