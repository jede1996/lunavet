/**
 * Utilidad para la gestión y actualización dinámica del Favicon (icono de pestaña de navegador).
 * Soporta presets vectoriales SVG adaptativos a temas claro/oscuro y URLs de imágenes personalizadas.
 */

// Generadores de SVGs vectoriales optimizados para favicon (32x32 / 48x48)
export const FAVICON_PRESETS = {
  'luna-huella': {
    nombre: 'Luna + Huellita Oficial',
    getSvg: (isDark) => {
      const moonFill = isDark ? '#a78bfa' : '#7c3aed';
      const pawPad = isDark ? '#38bdf8' : '#0284c7';
      const toe = isDark ? '#f472b6' : '#ec4899';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="${isDark ? '#0f172a' : '#f8fafc'}" stroke="${isDark ? '#334155' : '#cbd5e1'}" stroke-width="1"/>
        <path d="M15 5C9.48 5 5 9.48 5 15C5 20.52 9.48 25 15 25C16.53 25 17.98 24.65 19.28 24.03C15.59 22.86 12.89 19.42 12.89 15.33C12.89 11.24 15.59 7.8 19.28 6.63C17.98 6.01 16.53 5 15 5Z" fill="${moonFill}"/>
        <ellipse cx="21" cy="19" rx="2.5" ry="2" fill="${pawPad}"/>
        <circle cx="18" cy="15" r="1.3" fill="${toe}"/>
        <circle cx="21" cy="13.5" r="1.3" fill="${toe}"/>
        <circle cx="24" cy="15" r="1.3" fill="${toe}"/>
      </svg>`;
    }
  },
  'luna-cruz': {
    nombre: 'Luna + Cruz Médica',
    getSvg: (isDark) => {
      const moonFill = isDark ? '#818cf8' : '#4f46e5';
      const crossFill = isDark ? '#34d399' : '#059669';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="${isDark ? '#0f172a' : '#f8fafc'}" stroke="${isDark ? '#334155' : '#cbd5e1'}" stroke-width="1"/>
        <path d="M14 5C8.48 5 4 9.48 4 15C4 20.52 8.48 25 14 25C15.53 25 16.98 24.65 18.28 24.03C14.59 22.86 11.89 19.42 11.89 15.33C11.89 11.24 14.59 7.8 18.28 6.63C16.98 6.01 15.53 5 14 5Z" fill="${moonFill}"/>
        <path d="M21 9H25V21H21V9Z" fill="${crossFill}"/>
        <path d="M17 13H29V17H17V13Z" fill="${crossFill}"/>
      </svg>`;
    }
  },
  'clinica-corazon': {
    nombre: 'Corazón Clínico Vital',
    getSvg: (isDark) => {
      const heartFill = isDark ? '#fb7185' : '#e11d48';
      const pulseColor = isDark ? '#ffffff' : '#ffffff';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="${isDark ? '#0f172a' : '#f8fafc'}" stroke="${isDark ? '#334155' : '#cbd5e1'}" stroke-width="1"/>
        <path d="M16 26S5 19 5 12a5.5 5.5 0 0 1 10-3.3A5.5 5.5 0 0 1 25 12c0 7-9 14-9 14z" fill="${heartFill}"/>
        <polyline points="9,13 13,13 14.5,9 17.5,17 19,13 23,13" fill="none" stroke="${pulseColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
  },
  'perro-gato': {
    nombre: 'Silueta Lomito y Michi',
    getSvg: (isDark) => {
      const petFill = isDark ? '#38bdf8' : '#0284c7';
      const catFill = isDark ? '#fbbf24' : '#f59e0b';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="${isDark ? '#0f172a' : '#f8fafc'}" stroke="${isDark ? '#334155' : '#cbd5e1'}" stroke-width="1"/>
        <path d="M10 22C8 20 7 16 9 13C10.5 10.7 13 10 16 10C17.5 10 19 10.5 20 12C22 10 24 11 24 13C24 17 21 21 16 22C13 22.5 11 23 10 22Z" fill="${petFill}"/>
        <polygon points="8,12 11,8 12,12" fill="${catFill}"/>
        <polygon points="18,10 20,6 22,10" fill="${catFill}"/>
      </svg>`;
    }
  }
};

/**
 * Obtiene la URL o Data URI del favicon a partir de la configuración de marca y el tema.
 * @param {Object} brand Configuración de marca actual.
 * @param {boolean} isDark Indica si el tema oscuro está activo.
 * @returns {string} URL o Data URI lista para asignar a <link rel="icon">
 */
export function getFaviconUrl(brand = {}, isDark = false) {
  const tipo = brand.faviconTipo || 'sync';

  // Si se seleccionó sincronizar con el logotipo principal
  if (tipo === 'sync') {
    if ((brand.logoTipo === 'url' || brand.logoTipo === 'upload') && brand.logoUrl) {
      return brand.logoUrl;
    }
    if (brand.logoPreset === 'facebook' && brand.logoUrl) {
      return brand.logoUrl;
    }
    const preset = FAVICON_PRESETS[brand.logoPreset] || FAVICON_PRESETS['luna-huella'];
    return `data:image/svg+xml;utf8,${encodeURIComponent(preset.getSvg(isDark))}`;
  }

  // Si se seleccionó una URL o carga directa de imagen para el favicon
  if ((tipo === 'url' || tipo === 'upload') && brand.faviconUrl) {
    return brand.faviconUrl;
  }

  // Si se seleccionó un preset específico de favicon
  const presetKey = brand.faviconPreset || 'luna-huella';
  const preset = FAVICON_PRESETS[presetKey] || FAVICON_PRESETS['luna-huella'];
  return `data:image/svg+xml;utf8,${encodeURIComponent(preset.getSvg(isDark))}`;
}

/**
 * Aplica el favicon dinámicamente en el encabezado (<head>) del documento actual.
 * Modifica o inserta elementos <link rel="icon"> y <link rel="apple-touch-icon">.
 * @param {Object} brand Configuración de marca.
 * @param {boolean|string} themeOrIsDark 'dark', 'light' o booleano isDark.
 */
export function updateFavicon(brand = {}, themeOrIsDark = false) {
  if (typeof document === 'undefined') return;

  const isDark = typeof themeOrIsDark === 'string'
    ? themeOrIsDark === 'dark'
    : Boolean(themeOrIsDark);

  const faviconUrl = getFaviconUrl(brand, isDark);
  if (!faviconUrl) return;

  // Actualizar favicon estándar
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  if (faviconUrl.startsWith('data:image/svg+xml')) {
    link.type = 'image/svg+xml';
  } else if (faviconUrl.endsWith('.png')) {
    link.type = 'image/png';
  } else if (faviconUrl.endsWith('.ico')) {
    link.type = 'image/x-icon';
  } else {
    link.removeAttribute('type');
  }

  link.href = faviconUrl;

  // Actualizar apple-touch-icon para dispositivos iOS y móviles
  let appleLink = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = faviconUrl;
}
