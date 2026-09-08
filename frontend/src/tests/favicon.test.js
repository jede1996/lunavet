import { describe, it, expect, beforeEach } from 'vitest';
import { FAVICON_PRESETS, getFaviconUrl, updateFavicon } from '../utils/favicon';

describe('Favicon Utility Suite - Gestión Dinámica del Icono de Pestaña', () => {
  beforeEach(() => {
    // Limpiar links de favicon previos en head
    const existingLinks = document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']");
    existingLinks.forEach(el => el.remove());
  });

  it('debe contener los 4 presets vectoriales oficiales de Luna-Vet', () => {
    expect(FAVICON_PRESETS['luna-huella']).toBeDefined();
    expect(FAVICON_PRESETS['luna-cruz']).toBeDefined();
    expect(FAVICON_PRESETS['clinica-corazon']).toBeDefined();
    expect(FAVICON_PRESETS['perro-gato']).toBeDefined();

    expect(typeof FAVICON_PRESETS['luna-huella'].getSvg).toBe('function');
  });

  it('debe generar Data URIs SVG válidas adaptadas al tema claro y oscuro', () => {
    const lightSvgUri = getFaviconUrl({ faviconTipo: 'preset', faviconPreset: 'luna-huella' }, false);
    const darkSvgUri = getFaviconUrl({ faviconTipo: 'preset', faviconPreset: 'luna-huella' }, true);

    expect(lightSvgUri).toMatch(/^data:image\/svg\+xml/);
    expect(darkSvgUri).toMatch(/^data:image\/svg\+xml/);
    expect(lightSvgUri).not.toEqual(darkSvgUri); // Colores contrastantes según el tema
  });

  it('debe heredar el logotipo principal cuando faviconTipo es sync', () => {
    // Si el logo principal es una URL externa
    const brandWithUrl = {
      logoTipo: 'url',
      logoUrl: 'https://ejemplo.com/logo-clinica.png',
      faviconTipo: 'sync'
    };
    expect(getFaviconUrl(brandWithUrl, false)).toBe('https://ejemplo.com/logo-clinica.png');

    // Si el logo principal es un preset
    const brandWithPreset = {
      logoTipo: 'preset',
      logoPreset: 'luna-cruz',
      faviconTipo: 'sync'
    };
    const uri = getFaviconUrl(brandWithPreset, false);
    expect(uri).toMatch(/^data:image\/svg\+xml/);
  });

  it('debe retornar la URL personalizada cuando faviconTipo es url o upload', () => {
    const brandCustomFavicon = {
      faviconTipo: 'url',
      faviconUrl: 'https://ejemplo.com/mi-favicon.ico'
    };
    expect(getFaviconUrl(brandCustomFavicon, false)).toBe('https://ejemplo.com/mi-favicon.ico');
  });

  it('debe insertar y actualizar <link rel="icon"> y <link rel="apple-touch-icon"> en el DOM', () => {
    expect(document.querySelector("link[rel~='icon']")).toBeNull();

    updateFavicon({ faviconTipo: 'preset', faviconPreset: 'clinica-corazon' }, false);

    const iconLink = document.querySelector("link[rel~='icon']");
    const appleLink = document.querySelector("link[rel='apple-touch-icon']");

    expect(iconLink).not.toBeNull();
    expect(appleLink).not.toBeNull();
    expect(iconLink.href).toMatch(/^data:image\/svg\+xml/);
    expect(iconLink.type).toBe('image/svg+xml');

    // Cambiar a una imagen PNG
    updateFavicon({ faviconTipo: 'url', faviconUrl: 'https://lunavet.lat/favicon.png' }, false);
    expect(iconLink.href).toBe('https://lunavet.lat/favicon.png');
    expect(iconLink.type).toBe('image/png');
  });
});
