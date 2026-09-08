const jwt = require('jsonwebtoken');
const config = require('../config/env');
const cryptoService = require('./crypto.service');
const { UnauthorizedError } = require('./errors');

class TokenService {
  /**
   * Genera un Access Token JWT de corta duración (default 15m).
   * @param {Object} user 
   * @returns {string} JWT
   */
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      sucursalId: user.sucursal_id || null
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'lunavet-auth',
      audience: 'lunavet-app'
    });
  }

  /**
   * Verifica y decodifica un Access Token JWT.
   * @param {string} token 
   * @returns {Object} Payload decodificado
   */
  verifyAccessToken(token) {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedError('Token no proporcionado o formato inválido.');
    }

    try {
      return jwt.verify(token, config.jwt.secret, {
        issuer: 'lunavet-auth',
        audience: 'lunavet-app'
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('El token de acceso ha expirado.');
      }
      throw new UnauthorizedError('Token de acceso inválido o firma alterada.');
    }
  }

  /**
   * Genera un Refresh Token criptográficamente seguro (32 bytes = 64 hex chars).
   * @returns {string} Token en texto plano para entregar al cliente
   */
  generateRefreshToken() {
    return cryptoService.generateSecureToken(32);
  }

  /**
   * Calcula el hash SHA-256 del Refresh Token para almacenarlo en la BD.
   * Previene robo de credenciales en caso de lectura no autorizada de la BD.
   * @param {string} token 
   * @returns {string} Hash SHA-256
   */
  hashRefreshToken(token) {
    if (!token) return null;
    return cryptoService.hashSha256(token);
  }
}

module.exports = new TokenService();
module.exports.TokenService = TokenService;
