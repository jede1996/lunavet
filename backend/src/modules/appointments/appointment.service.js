const { db } = require('../../config/database');
const auditService = require('../../core/audit.service');
const petService = require('../pets/pet.service');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../../core/errors');

class AppointmentService {
  /**
   * Registra un nuevo servicio en el catálogo (solo Administrador).
   */
  async createService({ nombre, descripcion = null, duracionMinutos = 30, precio }, adminUser) {
    if (!['administrador'].includes(adminUser.rol)) {
      throw new ForbiddenError('Solo los administradores pueden registrar nuevos servicios.');
    }

    if (!nombre || precio === undefined) {
      throw new ValidationError('Nombre y precio del servicio son obligatorios.');
    }

    const [id] = await db('servicios').insert({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      duracion_minutos: parseInt(duracionMinutos, 10) || 30,
      precio: parseFloat(precio),
      activo: true
    });

    return { id, nombre, descripcion, duracionMinutos, precio, activo: true };
  }

  /**
   * Lista los servicios activos del catálogo clínico.
   */
  async listServices() {
    return db('servicios').where('activo', true).orderBy('nombre', 'asc');
  }

  /**
   * Verifica si un veterinario tiene disponibilidad horaria para una cita.
   * Evita solapamiento de horarios (overlapping).
   */
  async checkAvailability(veterinarioId, fechaHoraInicio, fechaHoraFin, excludeCitaId = null) {
    let query = db('citas')
      .where('veterinario_id', veterinarioId)
      .whereNotIn('estado', ['cancelada', 'no_asistio'])
      .andWhere('fecha_hora_inicio', '<', fechaHoraFin)
      .andWhere('fecha_hora_fin', '>', fechaHoraInicio);

    if (excludeCitaId) {
      query = query.andWhereNot('id', excludeCitaId);
    }

    const conflict = await query.first();
    return !conflict; // true si está disponible, false si hay choque
  }

  /**
   * Agenda una nueva cita veterinaria con validación de disponibilidad y urgencias.
   */
  async createAppointment({
    mascotaId,
    veterinarioId,
    servicioId,
    fechaHoraInicio,
    motivo,
    esUrgencia = false
  }, currentUser, ipOrigen = null, userAgent = null) {
    if (!mascotaId || !veterinarioId || !servicioId || !fechaHoraInicio || !motivo) {
      throw new ValidationError('Mascota, veterinario, servicio, fecha/hora y motivo son obligatorios.');
    }

    // 1. Validar acceso sobre la mascota
    const access = await petService.checkUserPetAccess(mascotaId, currentUser);
    if (!access.canRead) {
      throw new ForbiddenError('No tiene permisos para agendar citas para esta mascota.');
    }

    // 2. Validar que el profesional sea veterinario
    const vet = await db('usuarios').where({ id: veterinarioId, activo: true }).first();
    if (!vet || !['veterinario', 'administrador'].includes(vet.rol)) {
      throw new NotFoundError('El médico veterinario seleccionado no existe o no está disponible.');
    }

    // 3. Validar servicio y calcular hora de finalización
    const servicio = await db('servicios').where({ id: servicioId, activo: true }).first();
    if (!servicio) {
      throw new NotFoundError('El servicio seleccionado no está activo o no existe.');
    }

    const inicio = new Date(fechaHoraInicio);
    if (isNaN(inicio.getTime())) {
      throw new ValidationError('Formato de fecha y hora de inicio inválido.');
    }

    const duracionMs = (servicio.duracion_minutos || 30) * 60 * 1000;
    const fin = new Date(inicio.getTime() + duracionMs);

    const inicioIso = inicio.toISOString();
    const finIso = fin.toISOString();

    // 4. Validar disponibilidad si no es urgencia
    if (!esUrgencia) {
      const isAvailable = await this.checkAvailability(veterinarioId, inicioIso, finIso);
      if (!isAvailable) {
        throw new ConflictError('El médico veterinario no tiene disponibilidad en el horario seleccionado.');
      }
    }

    // Determinar cliente_id (el dueño principal o el usuario actual si es cliente)
    let clienteId = currentUser.id;
    if (['administrador', 'veterinario', 'recepcionista'].includes(currentUser.rol)) {
      const primaryOwnerRel = await db('usuarios_mascotas')
        .where({ mascota_id: mascotaId, es_propietario_principal: true })
        .first();
      clienteId = primaryOwnerRel ? primaryOwnerRel.usuario_id : currentUser.id;
    }

    const [citaId] = await db('citas').insert({
      mascota_id: mascotaId,
      cliente_id: clienteId,
      veterinario_id: veterinarioId,
      servicio_id: servicioId,
      fecha_hora_inicio: inicioIso,
      fecha_hora_fin: finIso,
      estado: esUrgencia ? 'confirmada' : 'pendiente',
      es_urgencia: Boolean(esUrgencia),
      motivo: motivo.trim(),
      recordatorio_enviado: false
    });

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'AGENDAR_CITA',
      entidad: 'Cita',
      entidadId: citaId,
      detalles: { mascotaId, veterinarioId, inicioIso, esUrgencia },
      ipOrigen,
      userAgent,
      nivelCriticidad: esUrgencia ? 'advertencia' : 'info'
    });

    return {
      id: citaId,
      mascotaId,
      clienteId,
      veterinarioId,
      servicioId,
      servicioNombre: servicio.nombre,
      fechaHoraInicio: inicioIso,
      fechaHoraFin: finIso,
      estado: esUrgencia ? 'confirmada' : 'pendiente',
      esUrgencia: Boolean(esUrgencia),
      motivo
    };
  }

  /**
   * Consulta las citas según el rol y filtros.
   */
  async listAppointments(currentUser, { fecha = null, veterinarioId = null, estado = null, limit = 50, offset = 0 } = {}) {
    let query = db('citas')
      .join('mascotas', 'citas.mascota_id', 'mascotas.id')
      .join('servicios', 'citas.servicio_id', 'servicios.id')
      .join('usuarios as vets', 'citas.veterinario_id', 'vets.id')
      .join('usuarios as clientes', 'citas.cliente_id', 'clientes.id')
      .select(
        'citas.*',
        'mascotas.nombre as mascota_nombre',
        'servicios.nombre as servicio_nombre',
        'vets.nombre as vet_nombre',
        'vets.apellido as vet_apellido',
        'clientes.nombre as cliente_nombre',
        'clientes.apellido as cliente_apellido'
      )
      .orderBy('citas.fecha_hora_inicio', 'asc');

    // Segregación RBAC: los clientes solo ven sus citas
    if (currentUser.rol === 'cliente') {
      query = query.where('citas.cliente_id', currentUser.id);
    } else if (veterinarioId) {
      query = query.where('citas.veterinario_id', veterinarioId);
    }

    if (estado) query = query.where('citas.estado', estado);
    if (fecha) query = query.whereRaw('DATE(citas.fecha_hora_inicio) = ?', [fecha]);

    const results = await query.limit(Math.min(limit, 100)).offset(offset);

    return results.map(r => ({
      id: r.id,
      mascota: { id: r.mascota_id, nombre: r.mascota_nombre },
      servicio: { id: r.servicio_id, nombre: r.servicio_nombre },
      veterinario: { id: r.veterinario_id, nombre: `${r.vet_nombre} ${r.vet_apellido}` },
      cliente: { id: r.cliente_id, nombre: `${r.cliente_nombre} ${r.cliente_apellido}` },
      fechaHoraInicio: r.fecha_hora_inicio,
      fechaHoraFin: r.fecha_hora_fin,
      estado: r.estado,
      esUrgencia: Boolean(r.es_urgencia),
      motivo: r.motivo,
      recordatorioEnviado: Boolean(r.recordatorio_enviado)
    }));
  }

  /**
   * Actualiza el estado de una cita médica.
   */
  async updateAppointmentStatus(citaId, nuevoEstado, currentUser) {
    const validStates = ['pendiente', 'confirmada', 'atendiendo', 'completada', 'cancelada', 'no_asistio'];
    if (!validStates.includes(nuevoEstado)) {
      throw new ValidationError(`Estado inválido. Permitidos: ${validStates.join(', ')}`);
    }

    const cita = await db('citas').where('id', citaId).first();
    if (!cita) throw new NotFoundError('Cita no encontrada.');

    // Un cliente solo puede cancelar su propia cita pendiente o confirmada
    if (currentUser.rol === 'cliente') {
      if (cita.cliente_id !== currentUser.id) {
        throw new ForbiddenError('No tiene permisos para modificar esta cita.');
      }
      if (nuevoEstado !== 'cancelada') {
        throw new ForbiddenError('Los clientes únicamente pueden cancelar citas programadas.');
      }
      if (!['pendiente', 'confirmada'].includes(cita.estado)) {
        throw new ConflictError(`No es posible cancelar una cita en estado '${cita.estado}'.`);
      }
    }

    await db('citas').where('id', citaId).update({ estado: nuevoEstado });

    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'ACTUALIZAR_ESTADO_CITA',
      entidad: 'Cita',
      entidadId: citaId,
      detalles: { anterior: cita.estado, nuevo: nuevoEstado },
      nivelCriticidad: 'info'
    });

    return { id: citaId, estadoAnterior: cita.estado, nuevoEstado };
  }

  // ===========================================================================
  // Tareas Programadas invocadas por Cron Jobs de cPanel (SO)
  // ===========================================================================

  /**
   * Procesa y marca recordatorios para citas programadas en las próximas 24 horas.
   */
  async processReminders() {
    const ahora = new Date();
    const proxima24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const citasParaRecordar = await db('citas')
      .where('recordatorio_enviado', false)
      .whereIn('estado', ['pendiente', 'confirmada'])
      .andWhere('fecha_hora_inicio', '>=', ahora.toISOString())
      .andWhere('fecha_hora_inicio', '<=', proxima24h.toISOString());

    if (citasParaRecordar.length === 0) {
      return { procesadas: 0, message: 'No hay recordatorios pendientes para enviar.' };
    }

    const ids = citasParaRecordar.map(c => c.id);
    await db('citas').whereIn('id', ids).update({ recordatorio_enviado: true });

    await auditService.log({
      usuarioId: null,
      accion: 'CRON_RECORDATORIOS_CITAS',
      entidad: 'Cita',
      detalles: { cantidadProcesadas: ids.length, citasIds: ids },
      nivelCriticidad: 'info'
    });

    return { procesadas: ids.length, citasIds: ids };
  }

  /**
   * Marca como vencidas las recetas médicas cuya vigencia ha expirado.
   */
  async processExpiredPrescriptions() {
    const ahora = new Date().toISOString().split('T')[0];

    // En SQLite/MySQL calculamos recetas donde fecha_emision + vigencia_dias < hoy
    const recetasActivas = await db('recetas').where('estado', 'activa');
    const expiradasIds = [];

    for (const rec of recetasActivas) {
      const emision = new Date(rec.fecha_emision);
      const vigenciaDias = rec.vigencia_dias || 30;
      const fechaVencimiento = new Date(emision.getTime() + vigenciaDias * 24 * 60 * 60 * 1000);

      if (fechaVencimiento.toISOString().split('T')[0] < ahora) {
        expiradasIds.push(rec.id);
      }
    }

    if (expiradasIds.length > 0) {
      await db('recetas').whereIn('id', expiradasIds).update({ estado: 'vencida' });
      await auditService.log({
        usuarioId: null,
        accion: 'CRON_RECETAS_VENCIDAS',
        entidad: 'Receta',
        detalles: { cantidadVencidas: expiradasIds.length, ids: expiradasIds },
        nivelCriticidad: 'info'
      });
    }

    return { expiradas: expiradasIds.length, ids: expiradasIds };
  }

  /**
   * Monitorea vacunas con refuerzo próximo en los siguientes 15 días.
   */
  async checkUpcomingVaccineBoosters() {
    const ahora = new Date().toISOString().split('T')[0];
    const fechaLimite = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const proximas = await db('vacunas')
      .whereNotNull('fecha_proxima_dosis')
      .andWhere('fecha_proxima_dosis', '>=', ahora)
      .andWhere('fecha_proxima_dosis', '<=', fechaLimite);

    return { totalProximas: proximas.length, vacunas: proximas.map(v => ({ id: v.id, mascotaId: v.mascota_id, fechaProximaDosis: v.fecha_proxima_dosis })) };
  }
}

module.exports = new AppointmentService();
module.exports.AppointmentService = AppointmentService;
