const { db } = require('../../config/database');
const { ValidationError, NotFoundError } = require('../../core/errors');

class ReminderService {
  // ==========================================
  // RECORDATORIOS PREVENTIVOS (PUNTO 3A)
  // ==========================================

  static async crearRecordatorio(data) {
    const {
      mascota_id,
      cliente_id,
      tipo,
      fecha_programada,
      canal = 'whatsapp',
      mensaje
    } = data;

    if (!mascota_id || !cliente_id || !tipo || !fecha_programada || !mensaje) {
      throw new ValidationError('Mascota, cliente, tipo, fecha programada y mensaje son requeridos');
    }

    const [id] = await db('recordatorios_preventivos').insert({
      mascota_id,
      cliente_id,
      tipo,
      fecha_programada,
      canal,
      mensaje,
      estado: 'pendiente',
      creado_en: new Date()
    });

    return db('recordatorios_preventivos').where({ id }).first();
  }

  static async listarRecordatorios(filtros = {}) {
    let query = db('recordatorios_preventivos as r')
      .join('mascotas as m', 'r.mascota_id', 'm.id')
      .join('usuarios as c', 'r.cliente_id', 'c.id')
      .select(
        'r.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'c.nombre as cli_nombre',
        'c.apellido as cli_apellido',
        'c.telefono_cifrado as cliente_telefono',
        'c.email as cliente_email'
      )
      .orderBy('r.fecha_programada', 'asc');

    if (filtros.estado) {
      query = query.where('r.estado', filtros.estado);
    }
    if (filtros.tipo) {
      query = query.where('r.tipo', filtros.tipo);
    }
    if (filtros.fecha_desde) {
      query = query.where('r.fecha_programada', '>=', filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      query = query.where('r.fecha_programada', '<=', filtros.fecha_hasta);
    }
    if (filtros.cliente_id) {
      query = query.where('r.cliente_id', filtros.cliente_id);
    }

    const rows = await query;
    return rows.map(r => {
      const tel = (r.cliente_telefono || '').replace(/\D/g, '');
      const waUrl = tel
        ? `https://wa.me/${tel.startsWith('52') ? tel : '52' + tel}?text=${encodeURIComponent(r.mensaje)}`
        : null;
      return {
        ...r,
        cliente_nombre: `${r.cli_nombre || ''} ${r.cli_apellido || ''}`.trim() || 'Cliente Luna-Vet',
        whatsappUrl: waUrl
      };
    });
  }

  static async marcarEnviado(id) {
    const rec = await db('recordatorios_preventivos').where({ id }).first();
    if (!rec) {
      throw new NotFoundError('Recordatorio no encontrado');
    }

    await db('recordatorios_preventivos').where({ id }).update({
      estado: 'enviado',
      enviado_en: new Date()
    });

    return db('recordatorios_preventivos').where({ id }).first();
  }

  /**
   * Genera de forma inteligente recordatorios automáticos de vacunas próximas a vencer en los siguientes 30 días
   */
  static async sincronizarVacunasPreventivas() {
    const hoy = new Date().toISOString().split('T')[0];
    const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const proximasVacunas = await db('vacunas as v')
      .join('mascotas as m', 'v.mascota_id', 'm.id')
      .leftJoin('usuarios_mascotas as um', function() {
        this.on('m.id', '=', 'um.mascota_id').andOn('um.es_propietario_principal', '=', db.raw('?', [true]));
      })
      .whereNotNull('v.fecha_proxima_dosis')
      .whereBetween('v.fecha_proxima_dosis', [hoy, en30Dias])
      .select('v.*', 'um.usuario_id as cliente_id', 'm.nombre as mascota_nombre');

    let generados = 0;
    for (const vac of proximasVacunas) {
      if (!vac.cliente_id) continue;

      const existe = await db('recordatorios_preventivos')
        .where({
          mascota_id: vac.mascota_id,
          fecha_programada: vac.fecha_proxima_dosis,
          estado: 'pendiente'
        })
        .first();

      if (!existe) {
        await db('recordatorios_preventivos').insert({
          mascota_id: vac.mascota_id,
          cliente_id: vac.cliente_id,
          tipo: vac.nombre_vacuna.toLowerCase().includes('rabia') ? 'vacuna_rabia' : 'vacuna_sextuple',
          fecha_programada: vac.fecha_proxima_dosis,
          canal: 'whatsapp',
          mensaje: `¡Hola! En Luna-Vet recordamos que a ${vac.mascota_nombre} le toca su refuerzo de vacuna (${vac.nombre_vacuna}) el ${vac.fecha_proxima_dosis}. Agenda su cita con anticipación para mantener su cuadro de salud al día 💉🐾.`,
          estado: 'pendiente',
          creado_en: new Date()
        });
        generados++;
      }
    }

    return { totalSincronizados: generados };
  }

  // ==========================================
  // SEGUIMIENTOS POST-OPERATORIOS (PUNTO 3B)
  // ==========================================

  static async crearSeguimiento(data) {
    const {
      expediente_id,
      mascota_id,
      cliente_id,
      veterinario_id,
      fecha_programada,
      tipo_caso = 'cirugia'
    } = data;

    if (!mascota_id || !cliente_id || !veterinario_id || !fecha_programada) {
      throw new ValidationError('Mascota, cliente, veterinario y fecha programada son requeridos');
    }

    const [id] = await db('seguimientos_clinicos').insert({
      expediente_id: expediente_id || null,
      mascota_id,
      cliente_id,
      veterinario_id,
      fecha_programada,
      estado_paciente: 'pendiente',
      contacto_exitoso: false,
      creado_en: new Date()
    });

    return db('seguimientos_clinicos').where({ id }).first();
  }

  static async listarSeguimientos(filtros = {}) {
    let query = db('seguimientos_clinicos as s')
      .join('mascotas as m', 's.mascota_id', 'm.id')
      .join('usuarios as c', 's.cliente_id', 'c.id')
      .join('usuarios as v', 's.veterinario_id', 'v.id')
      .select(
        's.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'c.nombre as cli_nombre',
        'c.apellido as cli_apellido',
        'c.telefono_cifrado as cliente_telefono',
        'v.nombre as vet_nombre',
        'v.apellido as vet_apellido'
      )
      .orderBy('s.fecha_programada', 'asc');

    if (filtros.estado_paciente) {
      query = query.where('s.estado_paciente', filtros.estado_paciente);
    }
    if (filtros.veterinario_id) {
      query = query.where('s.veterinario_id', filtros.veterinario_id);
    }

    const rows = await query;
    return rows.map(r => ({
      ...r,
      cliente_nombre: `${r.cli_nombre || ''} ${r.cli_apellido || ''}`.trim() || 'Cliente Luna-Vet',
      veterinario_nombre: `${r.vet_nombre || ''} ${r.vet_apellido || ''}`.trim() || 'Médico Luna-Vet'
    }));
  }

  static async registrarContacto(id, data) {
    const { estado_paciente, notas_seguimiento, contacto_exitoso = true } = data;
    const seg = await db('seguimientos_clinicos').where({ id }).first();
    if (!seg) {
      throw new NotFoundError('Seguimiento clínico no encontrado');
    }

    await db('seguimientos_clinicos').where({ id }).update({
      estado_paciente: estado_paciente || seg.estado_paciente,
      notas_seguimiento: notas_seguimiento || seg.notas_seguimiento,
      contacto_exitoso: Boolean(contacto_exitoso),
      fecha_contacto: new Date()
    });

    return db('seguimientos_clinicos').where({ id }).first();
  }
}

module.exports = ReminderService;
