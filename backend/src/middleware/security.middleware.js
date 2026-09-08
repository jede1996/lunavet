const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/env');

// Configuración de CORS con lista blanca
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como herramientas de prueba locales, curl o SSR)
    if (!origin) return callback(null, true);

    if (config.cors.origin.includes(origin) || !config.isProduction) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado para el origen: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Cron-Key',
    'X-Webhook-Signature',
    'X-Test-Rate-Limit'
  ]
};

// Configuración de Helmet para cabeceras HTTP seguras (OWASP Top 10 Hardening)
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ...config.cors.origin],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  frameguard: {
    action: 'deny'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware de Permissions-Policy para deshabilitar APIs de navegador innecesarias
function permissionsPolicyMiddleware(req, res, next) {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
}

// Middleware de sanitización contra Prototype Pollution y Parameter Pollution
function prototypePollutionMiddleware(req, res, next) {
  function sanitize(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  }

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

// Middleware para extraer la IP real detrás del proxy inverso de cPanel / LiteSpeed
function clientIpMiddleware(req, res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    req.clientIp = forwarded.split(',')[0].trim();
  } else {
    req.clientIp = req.socket.remoteAddress || req.ip;
  }
  next();
}

module.exports = {
  helmetMiddleware,
  corsMiddleware: cors(corsOptions),
  corsOptions,
  clientIpMiddleware,
  permissionsPolicyMiddleware,
  prototypePollutionMiddleware
};
