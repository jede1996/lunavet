/**
 * rate-limiter.middleware.js
 * Middleware de limitación de tasa (Rate Limiter) en memoria de alto rendimiento.
 * Protege contra ataques de fuerza bruta, credential stuffing y denegación de servicio (DoS).
 */

const config = require('../config/env');

class MemoryStore {
  constructor() {
    this.hits = new Map();
    // Limpieza periódica de registros vencidos cada 5 minutos para evitar fugas de memoria
    this.cleanupInterval = setInterval(() => this.prune(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  increment(key, windowMs) {
    const now = Date.now();
    let record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      this.hits.set(key, record);
      return record;
    }

    record.count += 1;
    return record;
  }

  prune() {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (now > record.resetTime) {
        this.hits.delete(key);
      }
    }
  }

  reset() {
    this.hits.clear();
  }
}

const sharedStore = new MemoryStore();

/**
 * Genera un middleware de limitación de tasa.
 * @param {Object} options
 * @param {number} [options.windowMs=900000] - Ventana de tiempo en milisegundos (default 15m)
 * @param {number} [options.max=100] - Máximo de peticiones permitidas por ventana
 * @param {string} [options.message] - Mensaje de error personalizado
 * @param {boolean} [options.skipInTest=true] - Si true, no aplica límite durante pruebas automatizadas
 * @param {string} [options.prefix='rl'] - Prefijo para aislar buckets de distintos endpoints
 */
function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Demasiadas solicitudes recibidas desde esta dirección IP. Por favor intente más tarde.',
  skipInTest = true,
  prefix = 'rl'
} = {}) {
  return (req, res, next) => {
    // Si estamos en entorno de prueba y la opción de omitir está activa, permitir pase directo
    // a menos que la petición incluya el header 'x-test-rate-limit: true' para pruebas activas de pentesting
    const enforceInTest = req.headers['x-test-rate-limit'] === 'true';
    if (config.isTest && skipInTest && !enforceInTest) {
      return next();
    }

    const ip = req.clientIp || req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${prefix}:${ip}`;

    const record = sharedStore.increment(key, windowMs);
    const now = Date.now();
    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil(Math.max(0, record.resetTime - now) / 1000);

    // Cabeceras estándar RFC de RateLimit
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message,
          retryAfterSeconds: resetSeconds
        }
      });
    }

    next();
  };
}

// 1. Limitador Global: 300 peticiones cada 15 minutos por IP
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Límite de solicitudes generales superado. Intente más tarde.',
  prefix: 'global',
  skipInTest: true
});

// 2. Limitador Estricto para Autenticación: 10 intentos cada 15 minutos por IP
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de autenticación. Por seguridad, intente nuevamente en 15 minutos.',
  prefix: 'auth',
  skipInTest: true
});

// 3. Limitador para Operaciones Sensibles (Checkout, Webhooks, Generación de PDFs): 30 peticiones cada 15 min
const sensitiveOpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Límite de operaciones sensibles alcanzado. Intente más tarde.',
  prefix: 'sensitive',
  skipInTest: true
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
  sensitiveOpLimiter,
  rateLimitStore: sharedStore
};
