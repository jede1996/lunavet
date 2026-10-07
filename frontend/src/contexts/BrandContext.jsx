import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.client';
import { updateFavicon } from '../utils/favicon';

const BrandContext = createContext(null);

export const DEFAULT_BRAND = {
  nombre: 'Luna-Vet',
  nombreCompleto: 'Clínica Veterinaria Luna-Vet',
  slogan: '¡Porque no son solo mascotas, sino un miembro importante de nuestra familia!',
  telefono: '744 213 0868',
  whatsapp: '7442130868',
  facebookUrl: 'https://www.facebook.com/profile.php?id=100083388274818',
  direccion: 'Av. Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero',
  referencia: 'A unos pasos del Colegio Cri-Cri',
  logoTipo: 'preset', // 'preset' | 'url' | 'upload'
  logoPreset: 'luna-huella', // 'luna-huella' | 'luna-cruz' | 'clinica-corazon' | 'perro-gato' | 'facebook'
  logoUrl: 'https://scontent-atl3-2.xx.fbcdn.net/v/t39.30808-1/471619516_578149974974607_1140347807826735240_n.jpg?stp=dst-jpg_tt6&cstp=mx500x500&ctp=s500x500&_nc_cat=101&ccb=1-7&_nc_sid=3ab345&_nc_ohc=uO5k8dJ3pwoQ7kNvwHGya_D&_nc_oc=AdoARYGMP21Rbb6UjW6619PP0VqIoCPby9WPyMXIeQOSyuBzB45Q0nr3zaPWI805aBY&_nc_zt=24&_nc_ht=scontent-atl3-2.xx&_nc_gid=MDVZCpayivw3aWvOOYqOPw&_nc_ss=7b20f&oh=00_AQKSfmi7NHGfyC8oBO2gLXAmXvxkI_fcKFZ5EEtMBWA6TA&oe=6AA40C40',
  faviconTipo: 'sync', // 'sync' | 'preset' | 'url' | 'upload'
  faviconPreset: 'luna-huella', // 'luna-huella' | 'luna-cruz' | 'clinica-corazon' | 'perro-gato'
  faviconUrl: ''
};

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(() => {
    const saved = localStorage.getItem('lunavet_brand_config');
    if (saved) {
      try {
        return { ...DEFAULT_BRAND, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_BRAND;
      }
    }
    return DEFAULT_BRAND;
  });

  const [loading, setLoading] = useState(true);

  // Mantener el favicon del documento sincronizado con la configuración de marca activa
  useEffect(() => {
    const currentTheme = localStorage.getItem('lunavet_theme') || 'apple';
    updateFavicon(brand, currentTheme);
  }, [brand]);

  // Cargar configuración desde el backend
  useEffect(() => {
    async function loadBrandConfig() {
      try {
        const res = await api.get('/cms/landing');
        if (res.success && res.data?.clinica) {
          const remote = res.data.clinica;
          setBrand(prev => {
            const updated = {
              ...prev,
              nombre: remote.nombre || prev.nombre,
              slogan: remote.slogan || prev.slogan,
              telefono: remote.telefonoUrgencias || prev.telefono,
              whatsapp: remote.whatsapp || prev.whatsapp,
              facebookUrl: remote.facebookUrl || prev.facebookUrl,
              direccion: remote.direccion || prev.direccion,
              logoTipo: remote.logoTipo || prev.logoTipo,
              logoPreset: remote.logoPreset || prev.logoPreset,
              logoUrl: remote.logoUrl || prev.logoUrl,
              faviconTipo: remote.faviconTipo || prev.faviconTipo || 'sync',
              faviconPreset: remote.faviconPreset || prev.faviconPreset || 'luna-huella',
              faviconUrl: remote.faviconUrl || prev.faviconUrl || ''
            };
            localStorage.setItem('lunavet_brand_config', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.warn('[BrandContext] Usando configuración local de marca:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBrandConfig();
  }, []);

  const updateBrand = async (newConfig) => {
    const merged = { ...brand, ...newConfig };
    setBrand(merged);
    localStorage.setItem('lunavet_brand_config', JSON.stringify(merged));

    const currentTheme = localStorage.getItem('lunavet_theme') || 'apple';
    updateFavicon(merged, currentTheme);

    // Persistir en CMS backend si el usuario tiene permisos de administrador
    try {
      await api.post('/cms/sections', {
        claveSeccion: 'identidad_marca',
        titulo: 'Identidad de Marca y Logo',
        metadatosJson: merged
      });
    } catch (err) {
      console.warn('[BrandContext] Guardado local exitoso, error persistiendo en API:', err.message);
    }

    return merged;
  };

  return (
    <BrandContext.Provider value={{ brand, updateBrand, loading, DEFAULT_BRAND }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error('useBrand debe usarse dentro de un BrandProvider');
  }
  return ctx;
}
