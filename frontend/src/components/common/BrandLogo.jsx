import React from 'react';
import { useBrand } from '../../contexts/BrandContext';

export function BrandLogo({ size = 38, className = '', showText = false, textClassName = '', overrideBrand = null }) {
  const { brand: contextBrand } = useBrand();
  const brand = overrideBrand || contextBrand || {};

  const renderIcon = () => {
    // 1. Imagen por URL o archivo subido
    if ((brand.logoTipo === 'url' || brand.logoTipo === 'upload') && brand.logoUrl) {
      return (
        <img
          src={brand.logoUrl}
          alt={brand.nombre || 'Luna-Vet'}
          className="rounded-3 object-fit-cover shadow-sm"
          style={{ width: `${size}px`, height: `${size}px` }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }

    // 2. Foto de Facebook directa
    if (brand.logoPreset === 'facebook' && brand.logoUrl) {
      return (
        <img
          src={brand.logoUrl}
          alt={brand.nombre || 'Luna-Vet'}
          className="rounded-3 object-fit-cover shadow-sm border border-info-subtle"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }

    // 3. Preset: Luna + Huellita (Oficial de Luna-Vet en Facebook)
    if (brand.logoPreset === 'luna-huella') {
      return (
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 shadow-sm ${className}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: 'linear-gradient(135deg, #7c3aed 0%, #0284c7 100%)'
          }}
        >
          <svg width={Math.round(size * 0.65)} height={Math.round(size * 0.65)} viewBox="0 0 24 24" fill="none">
            {/* Luna Creciente */}
            <path
              d="M12.5 2C6.98 2 2.5 6.48 2.5 12C2.5 17.52 6.98 22 12.5 22C14.03 22 15.48 21.65 16.78 21.03C13.09 19.86 10.39 16.42 10.39 12.33C10.39 8.24 13.09 4.8 16.78 3.63C15.48 3.01 14.03 2 12.5 2Z"
              fill="#ffffff"
            />
            {/* Almohadilla central de la huella */}
            <path
              d="M18 14.5C16.8 14.5 15.8 15.4 15.8 16.5C15.8 17.6 16.8 18.5 18 18.5C19.2 18.5 20.2 17.6 20.2 16.5C20.2 15.4 19.2 14.5 18 14.5Z"
              fill="#38bdf8"
            />
            {/* Dedos de la huella */}
            <circle cx="15" cy="13" r="1.1" fill="#fbcfe8" />
            <circle cx="17.2" cy="11.5" r="1.1" fill="#c084fc" />
            <circle cx="19.5" cy="12" r="1.1" fill="#c084fc" />
            <circle cx="21" cy="14" r="1.1" fill="#fbcfe8" />
          </svg>
        </div>
      );
    }

    // 4. Preset: Luna + Cruz Médica
    if (brand.logoPreset === 'luna-cruz') {
      return (
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 shadow-sm ${className}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: 'linear-gradient(135deg, #0284c7 0%, #059669 100%)'
          }}
        >
          <svg width={Math.round(size * 0.65)} height={Math.round(size * 0.65)} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C13.535 22 14.985 21.654 16.287 21.036C12.593 19.866 9.89 16.425 9.89 12.333C9.89 8.241 12.593 4.8 16.287 3.63C14.985 3.012 13.535 2 12 2Z"
              fill="#ffffff"
            />
            {/* Cruz médica */}
            <path d="M16 8H18V16H16V8Z" fill="#38bdf8" />
            <path d="M13 11H21V13H13V11Z" fill="#38bdf8" />
          </svg>
        </div>
      );
    }

    // 5. Preset: Corazón Clínico
    return (
      <div
        className={`d-flex align-items-center justify-content-center rounded-3 shadow-sm ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: 'linear-gradient(135deg, #e11d48 0%, #7c3aed 100%)'
        }}
      >
        <i className="bi bi-heart-pulse-fill text-white" style={{ fontSize: `${Math.round(size * 0.5)}px` }}></i>
      </div>
    );
  };

  return (
    <div className="d-inline-flex align-items-center gap-2">
      {renderIcon()}
      {showText && (
        <span className={`fw-bold ${textClassName}`}>
          {brand.nombre.includes('-') ? (
            <>
              {brand.nombre.split('-')[0]}<span className="text-info">-{brand.nombre.split('-')[1]}</span>
            </>
          ) : (
            brand.nombre
          )}
        </span>
      )}
    </div>
  );
}
