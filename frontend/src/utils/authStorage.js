/**
 * Utilidades para almacenamiento seguro y consistente de tokens y sesión de usuario.
 * Provee compatibilidad retroactiva entre 'lunavet_access_token' y 'lunavet_token'.
 */

export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('lunavet_access_token') ||
         localStorage.getItem('lunavet_token') ||
         sessionStorage.getItem('lunavet_token') ||
         '';
}

export function setAuthSession({ user, accessToken, refreshToken }) {
  if (typeof window === 'undefined') return;
  if (accessToken) {
    localStorage.setItem('lunavet_access_token', accessToken);
    localStorage.setItem('lunavet_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('lunavet_refresh_token', refreshToken);
  }
  if (user) {
    localStorage.setItem('lunavet_user', JSON.stringify(user));
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('lunavet_access_token');
  localStorage.removeItem('lunavet_token');
  localStorage.removeItem('lunavet_refresh_token');
  localStorage.removeItem('lunavet_user');
  sessionStorage.removeItem('lunavet_token');
}
