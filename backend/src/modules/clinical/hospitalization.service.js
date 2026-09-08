const { db } = require('../../config/database');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../core/errors');

class HospitalizationService {
  /**
   * Ingresa un nuevo paciente a hospitalización
   */
  static async ingresarPaciente(data) {
    const {
      mascota_id,
      veterinario_id,
      jaula_numero,
      jaula_tipo = 'canil_chico',
      motivo,
      diagnostico_presuntivo,
      fluidoterapia_config,
      notas_ingreso
    } = data;

    if (!mascota_id || !veterinario_id || !jaula_numero || !motivo) {
      throw new ValidationError('Mascota, veterinario, número de jaula y motivo son requeridos');
    }

    // Verificar si la mascota existe
    const mascota = await db('mascotas').where({ id: mascota_id }).first();
    if (!mascota) {
      throw new NotFoundError('Paciente no encontrado');
    }

    // Verificar si la jaula está ocupada por un paciente activo
    const jaulaOcupada = await db('hospitalizaciones')
      .where({ jaula_numero })
      .whereIn('estado', ['ingresado', 'en_observacion'])
      .first();

    if (jaulaOcupada) {
      throw new ValidationError(`La jaula ${jaula_numero} se encuentra actualmente ocupada por el paciente #${jaulaOcupada.mascota_id}`);
    }

    const [id] = await db('hospitalizaciones').insert({
      mascota_id,
      veterinario_id,
      jaula_numero,
      jaula_tipo,
      estado: 'ingresado',
      motivo,
      diagnostico_presuntivo: diagnostico_presuntivo || null,
      fluidoterapia_config: fluidoterapia_config ? JSON.stringify(fluidoterapia_config) : null,
      notas_ingreso: notas_ingreso || null,
      fecha_ingreso: new Date()
    });

    return this.obtenerHospitalizacionPorId(id);
  }

  /**
   * Obtiene la lista de pacientes hospitalizados activos o filtrados
   */
  static async obtenerHospitalizaciones(filtros = {}) {
    let query = db('hospitalizaciones as h')
      .join('mascotas as m', 'h.mascota_id', 'm.id')
      .join('usuarios as v', 'h.veterinario_id', 'v.id')
      .leftJoin('usuarios_mascotas as um', function() {
        this.on('m.id', '=', 'um.mascota_id').andOn('um.es_propietario_principal', '=', db.raw('?', [true]));
      })
      .leftJoin('usuarios as c', 'um.usuario_id', 'c.id')
      .select(
        'h.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'm.raza as mascota_raza',
        'v.nombre as vet_nombre',
        'v.apellido as vet_apellido',
        'c.nombre as prop_nombre',
        'c.apellido as prop_apellido',
        'c.telefono_cifrado as propietario_telefono'
      )
      .orderBy('h.fecha_ingreso', 'desc');

    if (filtros.estado) {
      query = query.where('h.estado', filtros.estado);
    } else if (filtros.soloActivos !== false) {
      query = query.whereIn('h.estado', ['ingresado', 'en_observacion']);
    }

    if (filtros.jaula_tipo) {
      query = query.where('h.jaula_tipo', filtros.jaula_tipo);
    }

    if (filtros.cliente_id) {
      query = query.where('um.usuario_id', filtros.cliente_id);
    }

    const rows = await query;
    return rows.map(r => ({
      ...r,
      veterinario_nombre: `${r.vet_nombre || ''} ${r.vet_apellido || ''}`.trim(),
      propietario_nombre: `${r.prop_nombre || ''} ${r.prop_apellido || ''}`.trim() || 'Cliente Luna-Vet',
      fluidoterapia_config: r.fluidoterapia_config ? (typeof r.fluidoterapia_config === 'string' ? JSON.parse(r.fluidoterapia_config) : r.fluidoterapia_config) : null
    }));
  }

  /**
   * Obtiene una hospitalización con su último monitoreo y datos de paciente
   */
  static async obtenerHospitalizacionPorId(id, currentUser = null) {
    const hosp = await db('hospitalizaciones as h')
      .join('mascotas as m', 'h.mascota_id', 'm.id')
      .join('usuarios as v', 'h.veterinario_id', 'v.id')
      .leftJoin('usuarios_mascotas as um', function() {
        this.on('m.id', '=', 'um.mascota_id').andOn('um.es_propietario_principal', '=', db.raw('?', [true]));
      })
      .leftJoin('usuarios as c', 'um.usuario_id', 'c.id')
      .where('h.id', id)
      .select(
        'h.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'm.raza as mascota_raza',
        'v.nombre as vet_nombre',
        'v.apellido as vet_apellido',
        'c.nombre as prop_nombre',
        'c.apellido as prop_apellido',
        'c.telefono_cifrado as propietario_telefono'
      )
      .first();

    if (!hosp) {
      throw new NotFoundError('Registro de hospitalización no encontrado');
    }

    if (currentUser && currentUser.rol === 'cliente') {
      const relation = await db('usuarios_mascotas')
        .where({ mascota_id: hosp.mascota_id, usuario_id: currentUser.id })
        .first();
      if (!relation) {
        throw new ForbiddenError('No tiene permisos para acceder a esta hospitalización.');
      }
    }

    hosp.veterinario_nombre = `${hosp.vet_nombre || ''} ${hosp.vet_apellido || ''}`.trim();
    hosp.propietario_nombre = `${hosp.prop_nombre || ''} ${hosp.prop_apellido || ''}`.trim() || 'Cliente Luna-Vet';

    if (hosp.fluidoterapia_config && typeof hosp.fluidoterapia_config === 'string') {
      try {
        hosp.fluidoterapia_config = JSON.parse(hosp.fluidoterapia_config);
      } catch (e) {
        hosp.fluidoterapia_config = null;
      }
    }

    const monitoreos = await db('monitoreo_pacientes as mp')
      .join('usuarios as u', 'mp.registrado_por_id', 'u.id')
      .where('mp.hospitalizacion_id', id)
      .select(
        'mp.*',
        'u.nombre as reg_nombre',
        'u.apellido as reg_apellido'
      )
      .orderBy('mp.fecha_hora', 'desc');

    return {
      ...hosp,
      monitoreos: monitoreos.map(m => ({
        ...m,
        registrado_por_nombre: `${m.reg_nombre || ''} ${m.reg_apellido || ''}`.trim()
      }))
    };
  }

  /**
   * Registra una toma de signos vitales periódica para un paciente hospitalizado
   */
  static async registrarMonitoreo(hospitalizacionId, data) {
    const hosp = await db('hospitalizaciones').where({ id: hospitalizacionId }).first();
    if (!hosp) {
      throw new NotFoundError('Registro de hospitalización no encontrado');
    }

    const {
      registrado_por_id,
      temperatura,
      frecuencia_cardiaca,
      frecuencia_respiratoria,
      presion_arterial,
      tllc_segundos,
      escala_dolor,
      estado_conciencia = 'alerta',
      observaciones
    } = data;

    if (!registrado_por_id) {
      throw new ValidationError('El usuario que registra el monitoreo es requerido');
    }

    const [id] = await db('monitoreo_pacientes').insert({
      hospitalizacion_id: hospitalizacionId,
      registrado_por_id,
      fecha_hora: new Date(),
      temperatura: temperatura !== undefined && temperatura !== null ? parseFloat(temperatura) : null,
      frecuencia_cardiaca: frecuencia_cardiaca ? parseInt(frecuencia_cardiaca, 10) : null,
      frecuencia_respiratoria: frecuencia_respiratoria ? parseInt(frecuencia_respiratoria, 10) : null,
      presion_arterial: presion_arterial || null,
      tllc_segundos: tllc_segundos ? parseInt(tllc_segundos, 10) : null,
      escala_dolor: escala_dolor !== undefined && escala_dolor !== null ? parseInt(escala_dolor, 10) : null,
      estado_conciencia,
      observaciones: observaciones || null
    });

    const registro = await db('monitoreo_pacientes as mp')
      .join('usuarios as u', 'mp.registrado_por_id', 'u.id')
      .where('mp.id', id)
      .select('mp.*', 'u.nombre as reg_nombre', 'u.apellido as reg_apellido')
      .first();

    return {
      ...registro,
      registrado_por_nombre: `${registro.reg_nombre || ''} ${registro.reg_apellido || ''}`.trim()
    };
  }

  /**
   * Da de alta a un paciente hospitalizado
   */
  static async darDeAlta(hospitalizacionId, { notas_alta = '', estado = 'alta' }) {
    const hosp = await db('hospitalizaciones').where({ id: hospitalizacionId }).first();
    if (!hosp) {
      throw new NotFoundError('Hospitalización no encontrada');
    }

    await db('hospitalizaciones')
      .where({ id: hospitalizacionId })
      .update({
        estado,
        fecha_alta: new Date(),
        notas_ingreso: hosp.notas_ingreso ? `${hosp.notas_ingreso}\n[ALTA]: ${notas_alta}` : `[ALTA]: ${notas_alta}`,
        actualizado_en: new Date()
      });

    return this.obtenerHospitalizacionPorId(hospitalizacionId);
  }
}

module.exports = HospitalizationService;
