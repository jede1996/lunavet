const { db } = require('../../config/database');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../core/errors');

class GroomingService {
  /**
   * Registra un check-in de estética canina/felina con mapeo de lesiones anatómicas
   */
  static async registrarCheckin(data) {
    const {
      mascota_id,
      cita_id,
      estilista_id,
      tipo_manto,
      corte_solicitado,
      nudos_severos = false,
      lesiones_previas = [],
      observaciones
    } = data;

    if (!mascota_id || !estilista_id || !corte_solicitado) {
      throw new ValidationError('Mascota, estilista y corte solicitado son requeridos');
    }

    const mascota = await db('mascotas').where({ id: mascota_id }).first();
    if (!mascota) {
      throw new NotFoundError('Paciente no encontrado');
    }

    const [id] = await db('estetica_checkins').insert({
      mascota_id,
      cita_id: cita_id || null,
      estilista_id,
      tipo_manto: tipo_manto || null,
      corte_solicitado,
      nudos_severos: Boolean(nudos_severos),
      lesiones_previas: JSON.stringify(lesiones_previas),
      observaciones: observaciones || null,
      estado: 'en_espera',
      notificacion_enviada: false,
      creado_en: new Date()
    });

    return this.obtenerCheckinPorId(id);
  }

  static async obtenerCheckinPorId(id, currentUser = null) {
    const checkin = await db('estetica_checkins as e')
      .join('mascotas as m', 'e.mascota_id', 'm.id')
      .join('usuarios as est', 'e.estilista_id', 'est.id')
      .leftJoin('usuarios_mascotas as um', function() {
        this.on('m.id', '=', 'um.mascota_id').andOn('um.es_propietario_principal', '=', db.raw('?', [true]));
      })
      .leftJoin('usuarios as cli', 'um.usuario_id', 'cli.id')
      .where('e.id', id)
      .select(
        'e.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'm.raza as mascota_raza',
        'est.nombre as est_nombre',
        'est.apellido as est_apellido',
        'cli.nombre as cli_nombre',
        'cli.apellido as cli_apellido',
        'cli.telefono_cifrado as cliente_telefono'
      )
      .first();

    if (!checkin) {
      throw new NotFoundError('Ficha de estética no encontrada');
    }

    if (currentUser && currentUser.rol === 'cliente') {
      const relation = await db('usuarios_mascotas')
        .where({ mascota_id: checkin.mascota_id, usuario_id: currentUser.id })
        .first();
      if (!relation) {
        throw new ForbiddenError('No tiene permisos para consultar esta ficha de estética.');
      }
    }

    checkin.estilista_nombre = `${checkin.est_nombre || ''} ${checkin.est_apellido || ''}`.trim() || 'Estilista Luna-Vet';
    checkin.cliente_nombre = `${checkin.cli_nombre || ''} ${checkin.cli_apellido || ''}`.trim() || 'Cliente Luna-Vet';

    if (checkin.lesiones_previas && typeof checkin.lesiones_previas === 'string') {
      try {
        checkin.lesiones_previas = JSON.parse(checkin.lesiones_previas);
      } catch (e) {
        checkin.lesiones_previas = [];
      }
    }

    return checkin;
  }

  static async listarCheckins(filtros = {}) {
    let query = db('estetica_checkins as e')
      .join('mascotas as m', 'e.mascota_id', 'm.id')
      .join('usuarios as est', 'e.estilista_id', 'est.id')
      .leftJoin('usuarios_mascotas as um', function() {
        this.on('m.id', '=', 'um.mascota_id').andOn('um.es_propietario_principal', '=', db.raw('?', [true]));
      })
      .leftJoin('usuarios as cli', 'um.usuario_id', 'cli.id')
      .select(
        'e.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'm.raza as mascota_raza',
        'est.nombre as est_nombre',
        'est.apellido as est_apellido',
        'cli.nombre as cli_nombre',
        'cli.apellido as cli_apellido',
        'cli.telefono_cifrado as cliente_telefono'
      )
      .orderBy('e.creado_en', 'desc');

    if (filtros.estado) {
      query = query.where('e.estado', filtros.estado);
    }
    if (filtros.estilista_id) {
      query = query.where('e.estilista_id', filtros.estilista_id);
    }
    if (filtros.mascota_id) {
      query = query.where('e.mascota_id', filtros.mascota_id);
    }
    if (filtros.cliente_id) {
      query = query.where('um.usuario_id', filtros.cliente_id);
    }

    const list = await query;
    return list.map(item => {
      if (item.lesiones_previas && typeof item.lesiones_previas === 'string') {
        try {
          item.lesiones_previas = JSON.parse(item.lesiones_previas);
        } catch (e) {
          item.lesiones_previas = [];
        }
      }
      return {
        ...item,
        estilista_nombre: `${item.est_nombre || ''} ${item.est_apellido || ''}`.trim() || 'Estilista Luna-Vet',
        cliente_nombre: `${item.cli_nombre || ''} ${item.cli_apellido || ''}`.trim() || 'Cliente Luna-Vet'
      };
    });
  }

  static async actualizarEstado(id, nuevoEstado) {
    const estadosValidos = ['en_espera', 'en_bano', 'secado_corte', 'listo_entrega', 'entregado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new ValidationError(`Estado no válido. Opciones: ${estadosValidos.join(', ')}`);
    }

    const checkin = await db('estetica_checkins').where({ id }).first();
    if (!checkin) {
      throw new NotFoundError('Registro de estética no encontrado');
    }

    await db('estetica_checkins').where({ id }).update({
      estado: nuevoEstado,
      actualizado_en: new Date()
    });

    return this.obtenerCheckinPorId(id);
  }

  /**
   * Genera el enlace y mensaje URL codificado para notificación rápida por WhatsApp Web
   */
  static async generarEnlaceWhatsApp(id) {
    const item = await this.obtenerCheckinPorId(id);
    const telefono = (item.cliente_telefono || '').replace(/\D/g, '');

    const texto = `Hola ${item.cliente_nombre || 'estimado cliente'}, te informamos desde Luna-Vet que tu consentido(a) *${item.mascota_nombre}* ya se encuentra *${item.estado === 'listo_entrega' ? 'LISTO(A) PARA ENTREGA' : item.estado.toUpperCase()}* de su sesión de estética y baño 🐾. ¡Te esperamos!`;

    const url = telefono
      ? `https://wa.me/${telefono.startsWith('52') ? telefono : '52' + telefono}?text=${encodeURIComponent(texto)}`
      : null;

    return {
      telefono,
      mensaje: texto,
      whatsappUrl: url
    };
  }
}

module.exports = GroomingService;
