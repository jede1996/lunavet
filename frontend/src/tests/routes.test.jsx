import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import { BrandProvider } from '../contexts/BrandContext';
import { CartProvider } from '../contexts/CartContext';

function renderWithProviders(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrandProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </BrandProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Frontend Routing & Navigation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock fetch global para llamadas de inicio y navegación
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const urlStr = String(url);
      let data = {};
      if (urlStr.includes('/auth/me')) {
        const saved = localStorage.getItem('lunavet_user');
        data = saved ? JSON.parse(saved) : { id: 1, rol: 'cliente' };
      } else if (urlStr.includes('/pets') || urlStr.includes('/appointments')) {
        data = [];
      } else {
        data = {
          clinica: { nombre: 'Luna-Vet', telefono: '7442130868' },
          servicios: [],
          productos: [],
          articulos: []
        };
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            status: 'success',
            data
          })
      });
    });
  });

  it('debe renderizar la página de inicio (LandingPage) en la ruta /', async () => {
    renderWithProviders('/');
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: /servicios/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /tienda/i }).length).toBeGreaterThan(0);
    });
  });

  it('debe renderizar la página de Aviso de Privacidad en /aviso-privacidad', async () => {
    renderWithProviders('/aviso-privacidad');
    await waitFor(() => {
      expect(screen.getByText(/aviso de privacidad/i)).toBeInTheDocument();
    });
  });

  it('debe renderizar el Generador de Placas QR en /qr', async () => {
    renderWithProviders('/qr');
    await waitFor(() => {
      expect(screen.getByText(/generador de códigos qr/i)).toBeInTheDocument();
    });
  });

  it('debe renderizar los Términos y Condiciones en /terminos-condiciones', async () => {
    renderWithProviders('/terminos-condiciones');
    await waitFor(() => {
      expect(screen.getByText(/términos y condiciones de servicios médico-veterinarios/i)).toBeInTheDocument();
      expect(screen.getByText(/protocolo de triage y urgencias/i)).toBeInTheDocument();
    });
  });

  it('debe renderizar la página de Login en /login con opción de ingreso', async () => {
    renderWithProviders('/login');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar a mi cuenta/i })).toBeInTheDocument();
      expect(screen.getByText(/soy cliente/i)).toBeInTheDocument();
    });
  });

  it('debe renderizar la página de Registro en /registro', async () => {
    renderWithProviders('/registro');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear mi cuenta/i })).toBeInTheDocument();
    });
  });

  it('debe mostrar la pantalla 404 ante rutas no registradas', async () => {
    renderWithProviders('/esta-ruta-no-existe-en-la-app');
    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Página No Encontrada')).toBeInTheDocument();
    });
  });

  it('debe proteger la ruta /portal redirigiendo a /login si no está autenticado', async () => {
    renderWithProviders('/portal');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar a mi cuenta/i })).toBeInTheDocument();
    });
  });

  it('debe proteger la ruta /staff/agenda redirigiendo a /login para usuarios no autenticados', async () => {
    renderWithProviders('/staff/agenda');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar a mi cuenta/i })).toBeInTheDocument();
    });
  });

  it('debe proteger la ruta /admin/dashboard redirigiendo a /login para usuarios no autenticados', async () => {
    renderWithProviders('/admin/dashboard');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar a mi cuenta/i })).toBeInTheDocument();
    });
  });

  it('debe permitir el acceso a /portal cuando el usuario cliente está autenticado', async () => {
    localStorage.setItem(
      'lunavet_user',
      JSON.stringify({
        id: 1,
        nombre: 'Carlos',
        apellido: 'Morales',
        email: 'carlos@ejemplo.com',
        rol: 'cliente'
      })
    );
    localStorage.setItem('lunavet_access_token', 'fake-jwt-token');

    renderWithProviders('/portal');
    await waitFor(() => {
      expect(screen.getByText(/bienvenido al expediente digital/i)).toBeInTheDocument();
    });
  });
});
