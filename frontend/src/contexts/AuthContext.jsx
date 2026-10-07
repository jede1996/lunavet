import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const demoRole = urlParams?.get('demo_role');
    if (demoRole) {
      const demoUser = {
        id: 1,
        nombre: demoRole === 'cliente' ? 'Carlos Mendoza' : 'Dr. Alejandro Luna',
        email: `${demoRole}@lunavet.mx`,
        rol: demoRole
      };
      localStorage.setItem('lunavet_user', JSON.stringify(demoUser));
      localStorage.setItem('lunavet_access_token', 'demo_token');
      localStorage.setItem('lunavet_token', 'demo_token');
      return demoUser;
    }

    const savedUser = localStorage.getItem('lunavet_user');
    const token = localStorage.getItem('lunavet_access_token') || localStorage.getItem('lunavet_token');
    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('lunavet_user');
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('lunavet_access_token') || localStorage.getItem('lunavet_token');
    if (token === 'demo_token') return false;
    return !!token;
  });

  useEffect(() => {
    const token = localStorage.getItem('lunavet_access_token') || localStorage.getItem('lunavet_token');
    if (token) {
      if (token === 'demo_token') {
        setLoading(false);
        return;
      }
      api.get('/auth/me')
        .then(res => {
          if (res?.success && res.data?.id) {
            setUser(res.data);
            localStorage.setItem('lunavet_user', JSON.stringify(res.data));
          }
        })
        .catch(err => {
          if (err.statusCode === 401) {
            localStorage.removeItem('lunavet_user');
            localStorage.removeItem('lunavet_access_token');
            localStorage.removeItem('lunavet_token');
            localStorage.removeItem('lunavet_refresh_token');
            sessionStorage.removeItem('lunavet_token');
            setUser(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const login = async (email, password, isStaffPortal = false) => {
    let res;
    try {
      const endpoint = isStaffPortal ? '/auth/staff/login' : '/auth/login';
      res = await api.post(endpoint, { email, password });
    } catch (err) {
      // Si intentó ingresar por portal general pero es personal de clínica, reintentar automáticamente por /auth/staff/login
      if (!isStaffPortal && err.statusCode === 403 && (err.message?.includes('portal interno') || err.message?.includes('staff'))) {
        res = await api.post('/auth/staff/login', { email, password });
      } else {
        throw err;
      }
    }

    if (!res?.success) throw new Error('Credenciales inválidas');

    // Si requiere segundo factor (2FA TOTP)
    if (res.data.requires2FA) {
      return {
        requires2FA: true,
        tempToken: res.data.tempToken,
        message: res.data.message
      };
    }

    // Sesión completa
    const { user: userData, accessToken, refreshToken } = res.data;
    localStorage.setItem('lunavet_access_token', accessToken);
    localStorage.setItem('lunavet_token', accessToken);
    localStorage.setItem('lunavet_refresh_token', refreshToken);
    localStorage.setItem('lunavet_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  const verify2FA = async (tempToken, token2fa) => {
    const res = await api.post('/auth/2fa/verify-login', { tempToken, token2fa });
    if (!res.success) throw new Error('Código 2FA inválido');

    const { user: userData, accessToken, refreshToken } = res.data;
    localStorage.setItem('lunavet_access_token', accessToken);
    localStorage.setItem('lunavet_token', accessToken);
    localStorage.setItem('lunavet_refresh_token', refreshToken);
    localStorage.setItem('lunavet_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  const register = async (clientData) => {
    const res = await api.post('/auth/register', clientData);
    if (!res.success) throw new Error('Error al registrar usuario');

    const { user: userData, accessToken, refreshToken } = res.data;
    localStorage.setItem('lunavet_access_token', accessToken);
    localStorage.setItem('lunavet_token', accessToken);
    localStorage.setItem('lunavet_refresh_token', refreshToken);
    localStorage.setItem('lunavet_user', JSON.stringify(userData));
    setUser(userData);
    return { success: true, user: userData };
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('lunavet_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Continuar con limpieza local incluso si la petición falla
    } finally {
      localStorage.removeItem('lunavet_access_token');
      localStorage.removeItem('lunavet_token');
      localStorage.removeItem('lunavet_refresh_token');
      localStorage.removeItem('lunavet_user');
      sessionStorage.removeItem('lunavet_token');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isClient: user?.rol === 'cliente',
    isVet: user?.rol === 'veterinario',
    isReceptionist: user?.rol === 'recepcionista',
    isAdmin: user?.rol === 'administrador',
    isStaff: ['veterinario', 'recepcionista', 'administrador'].includes(user?.rol),
    login,
    verify2FA,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
