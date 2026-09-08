const crypto = require('crypto');
const config = require('../config/env');
const { UnauthorizedError } = require('../core/errors');

/**
 * Realiza una comparación en tiempo constante (resistente a ataques de temporización / Timing Attacks).
 * Hashea ambas cadenas con SHA-256 previo a la comparación para normalizar longitud y evitar fuga de información.
 * @param {string} input 
 * @param {string} expected 
 * @returns {boolean}
 */
function safeTimingCompare(input, expected) {
  if (!input || !expected || typeof input !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const hashInput = crypto.createHash('sha256').update(input).digest();
  const hashExpected = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashInput, hashExpected);
}

/**
 * Middleware de seguridad para proteger los endpoints invocados por Cron Jobs de cPanel a nivel de SO.
 * Requiere una clave secreta precompartida en la cabecera 'X-Cron-Key' o en el query param '?key='.
 */
function requireCronKey(req, res, next) {
  const cronKey = req.headers['x-cron-key'] || req.query.key;

  if (!cronKey || !safeTimingCompare(cronKey, config.cron.secret)) {
    return next(new UnauthorizedError('Acceso denegado: Clave de tarea programada (Cron) inválida o ausente.'));
  }

  next();
}

module.exports = {
  requireCronKey,
  safeTimingCompare
};
