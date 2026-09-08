/**
 * Cliente HTTP unificado para la API REST de LunaVet v4.0.
 * Gestiona autenticación con JWT, rotación automática de refresh tokens y manejo de errores.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = { ...options.headers };

  // Inyectar Access Token si está disponible
  const token = localStorage.getItem('lunavet_access_token');
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Establecer Content-Type JSON si no es FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkErr) {
    throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión a internet.', 0, 'NETWORK_ERROR');
  }

  // Manejar expiración de token y auto-renovación
  if (response.status === 401 && !options._isRetry) {
    const refreshToken = localStorage.getItem('lunavet_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data.accessToken) {
            localStorage.setItem('lunavet_access_token', refreshData.data.accessToken);
            if (refreshData.data.refreshToken) {
              localStorage.setItem('lunavet_refresh_token', refreshData.data.refreshToken);
            }
            // Reintentar la solicitud original con el nuevo token
            return request(endpoint, { ...options, _isRetry: true });
          }
        }
      } catch {
        // Si falla la renovación, limpiar sesión
        localStorage.removeItem('lunavet_access_token');
        localStorage.removeItem('lunavet_refresh_token');
        localStorage.removeItem('lunavet_user');
      }
    }
  }

  // Si la respuesta es blob (PDF o imagen), retornarla directamente
  if (options.isBlob) {
    if (!response.ok) {
      throw new ApiError('Error al descargar el archivo solicitado', response.status, 'BLOB_ERROR');
    }
    return response.blob();
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errObj = data?.error || {};
    throw new ApiError(
      errObj.message || `Error en la solicitud (${response.status})`,
      response.status,
      errObj.code || 'HTTP_ERROR',
      errObj.details || null
    );
  }

  if (data && typeof data === 'object') {
    if (data.status === 'success' && data.success === undefined) {
      data.success = true;
    }
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, {
    method: 'POST',
    body: (body instanceof FormData) ? body : JSON.stringify(body),
    ...options
  }),
  put: (endpoint, body, options) => request(endpoint, {
    method: 'PUT',
    body: (body instanceof FormData) ? body : JSON.stringify(body),
    ...options
  }),
  patch: (endpoint, body, options) => request(endpoint, {
    method: 'PATCH',
    body: (body instanceof FormData) ? body : JSON.stringify(body),
    ...options
  }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  downloadBlob: (endpoint, options) => request(endpoint, { method: 'GET', isBlob: true, ...options })
};
