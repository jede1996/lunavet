const { db } = require('../config/database');
const { ValidationError } = require('./errors');

const SENSITIVE_KEYS = /password|contrasena|token|secret|cvv|tarjeta|authheader|authorization|private_key/i;

/**
 * Enmascara recursivamente contraseñas, tokens y datos financieros antes de persistir auditoría.
 * Cumplimiento con OWASP Logging Cheat Sheet y LFPDPPP.
 */
function redactSensitiveData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }
  if (typeof data === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      if (SENSITIVE_KEYS.test(k)) {
        clean[k] = '***REDACTED***';
      } else if (typeof v === 'object' && v !== null) {
        clean[k] = redactSensitiveData(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }
  return data;
}

class AuditService {
  /**
   * Registra un evento inmutable en la bitácora de auditoría.
   * @param {Object} entry 
   * @param {number|null} entry.usuarioId
   * @param {string} entry.accion - Ej: 'LOGIN_EXITOSO', 'CONSULTA_EXPEDIENTE', 'VALIDACION_CONTROLADO'
   * @param {string} entry.entidad - Ej: 'ExpedienteClinico', 'Receta', 'Usuario'
   * @param {string|number|null} entry.entidadId
   * @param {Object|string|null} entry.detalles
   * @param {string|null} entry.ipOrigen
   * @param {string|null} entry.userAgent
   * @param {string} [entry.nivelCriticidad='info'] - 'info', 'advertencia', 'critico'
   * @returns {Promise<number>} ID del registro de auditoría
   */
  async log({
    usuarioId = null,
    accion,
    entidad,
    entidadId = null,
    detalles = null,
    ipOrigen = null,
    userAgent = null,
    nivelCriticidad = 'info'
  }) {
    if (!accion || typeof accion !== 'string') {
      throw new ValidationError('El campo acción es obligatorio para el registro de auditoría.');
    }
    if (!entidad || typeof entidad !== 'string') {
      throw new ValidationError('El campo entidad es obligatorio para el registro de auditoría.');
    }

    const cleanDetalles = (typeof detalles === 'object' && detalles !== null)
      ? redactSensitiveData(detalles)
      : detalles;

    const detallesStr = cleanDetalles 
      ? (typeof cleanDetalles === 'object' ? JSON.stringify(cleanDetalles) : String(cleanDetalles))
      : null;

    const [id] = await db('bitacora_auditoria').insert({
      usuario_id: usuarioId,
      accion: accion.toUpperCase(),
      entidad,
      entidad_id: entidadId ? String(entidadId) : null,
      detalles: detallesStr,
      ip_origen: ipOrigen ? ipOrigen.substring(0, 45) : null,
      user_agent: userAgent ? userAgent.substring(0, 255) : null,
      nivel_criticidad: ['info', 'advertencia', 'critico'].includes(nivelCriticidad) 
        ? nivelCriticidad 
        : 'info'
    });

    return id;
  }

  /**
   * Consulta registros de auditoría con filtros y paginación.
   */
  async getLogs({ entidad = null, entidadId = null, usuarioId = null, limit = 50, offset = 0 } = {}) {
    let query = db('bitacora_auditoria').select('*').orderBy('id', 'desc');

    if (entidad) query = query.where('entidad', entidad);
    if (entidadId) query = query.where('entidad_id', String(entidadId));
    if (usuarioId) query = query.where('usuario_id', usuarioId);

    return query.limit(Math.min(limit, 100)).offset(offset);
  }
}

module.exports = new AuditService();
module.exports.AuditService = AuditService;
module.exports.redactSensitiveData = redactSensitiveData;
