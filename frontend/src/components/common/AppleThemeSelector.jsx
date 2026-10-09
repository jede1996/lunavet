import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * AppleThemeSelector — Selector de Tema Apple Segmented Glassmorphic
 * Implementación basada en Apple Human Interface Guidelines (HIG):
 * Pista translúcida con píldora deslizante para conmutación fluida entre
 * Apple Claro y Apple Oscuro, complementado con control de alto contraste clínico (Quirófano).
 */
export function AppleThemeSelector({ showContrastToggle = true, className = '' }) {
  const { theme, setTheme, isDark, isHighContrast, toggleHighContrast } = useTheme();

  const handleKeyDown = (e, targetTheme) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setTheme(targetTheme);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setTheme('apple-dark');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setTheme('apple');
    }
  };

  return (
    <div className={`d-inline-flex align-items-center gap-1.5 ${className}`}>
      {/* Control Segmentado Apple Liquid Glass */}
      <div
        className="apple-segmented-control"
        role="radiogroup"
        aria-label="Selector de tema visual (Apple Segmented Glassmorphic)"
      >
        {/* Segmento Apple Claro */}
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'apple'}
          tabIndex={theme === 'apple' ? 0 : -1}
          className={`apple-segmented-btn ${theme === 'apple' ? 'active' : ''}`}
          onClick={() => setTheme('apple')}
          onKeyDown={(e) => handleKeyDown(e, 'apple')}
          title="Tema Apple Claro (Liquid Glass)"
          aria-label="Activar tema Apple Claro"
        >
          <i
            className={`bi bi-sun-fill ${theme === 'apple' ? 'text-warning' : 'opacity-75'}`}
            style={{ fontSize: '12px' }}
          ></i>
          <span className="d-none d-sm-inline fw-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
            Claro
          </span>
        </button>

        {/* Segmento Apple Oscuro */}
        <button
          type="button"
          role="radio"
          aria-checked={theme === 'apple-dark'}
          tabIndex={theme === 'apple-dark' ? 0 : -1}
          className={`apple-segmented-btn ${theme === 'apple-dark' ? 'active' : ''}`}
          onClick={() => setTheme('apple-dark')}
          onKeyDown={(e) => handleKeyDown(e, 'apple-dark')}
          title="Tema Apple Oscuro (OLED Glassmorphic)"
          aria-label="Activar tema Apple Oscuro"
        >
          <i
            className={`bi bi-moon-stars-fill ${theme === 'apple-dark' ? 'text-info' : 'opacity-75'}`}
            style={{ fontSize: '11px' }}
          ></i>
          <span className="d-none d-sm-inline fw-semibold" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
            Oscuro
          </span>
        </button>
      </div>

      {/* Accesorio de Accesibilidad: Modo Quirófano / Alto Contraste (WCAG AA) */}
      {showContrastToggle && (
        <button
          type="button"
          className={`btn btn-sm rounded-circle p-0 d-inline-flex align-items-center justify-content-center ${
            isHighContrast ? 'btn-primary shadow-sm' : 'navbar-action-btn'
          }`}
          style={{ width: '32px', height: '32px', minHeight: '32px' }}
          onClick={toggleHighContrast}
          title={
            isHighContrast
              ? 'Modo Quirófano activo (Alto contraste clínico desactivar)'
              : 'Activar Modo Quirófano (Alto contraste clínico)'
          }
          aria-label="Alternar modo quirófano de alto contraste"
          aria-pressed={isHighContrast}
        >
          <i
            className={`bi ${isHighContrast ? 'bi-eye-fill text-white' : 'bi-circle-half text-secondary'}`}
            style={{ fontSize: '12px' }}
          ></i>
        </button>
      )}
    </div>
  );
}
