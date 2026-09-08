const appointmentService = require('../../src/modules/appointments/appointment.service');
const petService = require('../../src/modules/pets/pet.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const { ValidationError, ForbiddenError, NotFoundError, ConflictError } = require('../../src/core/errors');

describe('AppointmentService - Citas, Agenda por Veterinario y Tareas Cron cPanel', () => {
  let adminUser;
  let vetUser;
  let clientUser;
  let strangerUser;
  let serviceGeneral;
  let testPet;

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('archivos_adjuntos').del();
    await db('recetas').del();
    await db('vacunas').del();
    await db('citas').del();
    await db('servicios').del();
    await db('usuarios_mascotas').del();
    await db('mascotas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [aId] = await db('usuarios').insert({
      email: 'admin@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Admin',
      apellido: 'Clinica',
      rol: 'administrador',
      activo: true
    });
    adminUser = { id: aId, rol: 'administrador' };

    const [vId] = await db('usuarios').insert({
      email: 'vet@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Dr.',
      apellido: 'García',
      rol: 'veterinario',
      activo: true
    });
    vetUser = { id: vId, rol: 'veterinario' };

    const [cId] = await db('usuarios').insert({
      email: 'cliente@test.com',
      password_hash: 'hash',
      nombre: 'Sofía',
      apellido: 'Luna',
      rol: 'cliente',
      activo: true
    });
    clientUser = { id: cId, rol: 'cliente' };

    const [sId] = await db('usuarios').insert({
      email: 'ajeno@test.com',
      password_hash: 'hash',
      nombre: 'Ajeno',
      apellido: 'Test',
      rol: 'cliente',
      activo: true
    });
    strangerUser = { id: sId, rol: 'cliente' };

    testPet = await petService.createPet({
      nombre: 'Bruno',
      especie: 'Canino',
      raza: 'Bóxer'
    }, clientUser);

    serviceGeneral = await appointmentService.createService({
      nombre: 'Consulta General Preventiva',
      descripcion: 'Revisión médica completa',
      duracionMinutos: 30,
      precio: 450.00
    }, adminUser);
  });

  describe('Catálogo de Servicios', () => {
    test('debe permitir a los administradores registrar servicios y listarlos públicamente', async () => {
      const s2 = await appointmentService.createService({
        nombre: 'Limpieza Dental Ultrasónica',
        duracionMinutos: 60,
        precio: 1200.00
      }, adminUser);

      expect(s2.id).toBeDefined();

      const list = await appointmentService.listServices();
      expect(list.length).toBeGreaterThanOrEqual(2);
    });

    test('debe rechazar registro de servicios por clientes o con datos incompletos', async () => {
      await expect(appointmentService.createService({ nombre: 'S1', precio: 100 }, clientUser))
        .rejects.toThrow(ForbiddenError);

      await expect(appointmentService.createService({ nombre: '' }, adminUser))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Agendamiento y Detección de Solapamiento', () => {
    test('debe agendar una cita calculando la fecha/hora de finalización correctamente', async () => {
      const inicio = new Date('2026-10-15T10:00:00.000Z').toISOString();
      const cita = await appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Vacunación y chequeo'
      }, clientUser);

      expect(cita.id).toBeDefined();
      expect(cita.estado).toBe('pendiente');
      expect(cita.fechaHoraInicio).toBe(inicio);

      // Duración del servicio es 30 min -> 10:30:00
      const finEsperado = new Date('2026-10-15T10:30:00.000Z').toISOString();
      expect(cita.fechaHoraFin).toBe(finEsperado);
    });

    test('debe detectar conflicto de horario y rechazar citas solapadas (ConflictError)', async () => {
      const inicio = new Date('2026-10-15T11:00:00.000Z').toISOString();
      await appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Primera cita'
      }, clientUser);

      // Intento de agendar en el mismo horario
      await expect(appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Choque de horario'
      }, clientUser)).rejects.toThrow(ConflictError);

      // Intento de agendar 15 minutos después (dentro del rango de 30 min de la anterior)
      const inicioSolapado = new Date('2026-10-15T11:15:00.000Z').toISOString();
      await expect(appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicioSolapado,
        motivo: 'Choque solapado'
      }, clientUser)).rejects.toThrow(ConflictError);
    });

    test('debe permitir agendar citas de urgencia incluso si existe solapamiento', async () => {
      const inicio = new Date('2026-10-15T12:00:00.000Z').toISOString();
      await appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Cita regular'
      }, clientUser);

      // Cita de urgencia en el mismo horario
      const urgencia = await appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Hemorragia traumática',
        esUrgencia: true
      }, clientUser);

      expect(urgencia.id).toBeDefined();
      expect(urgencia.esUrgencia).toBe(true);
      expect(urgencia.estado).toBe('confirmada');
    });

    test('debe rechazar agendamiento para mascotas ajenas o veterinarios no existentes', async () => {
      const inicio = new Date('2026-10-15T14:00:00.000Z').toISOString();

      await expect(appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'No autorizado'
      }, strangerUser)).rejects.toThrow(ForbiddenError);

      await expect(appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: 99999,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Vet no existe'
      }, clientUser)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Gestión de Estados y Filtros de Citas', () => {
    let citaId;

    beforeEach(async () => {
      const inicio = new Date('2026-10-16T09:00:00.000Z').toISOString();
      const c = await appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: inicio,
        motivo: 'Chequeo'
      }, clientUser);
      citaId = c.id;
    });

    test('cliente puede cancelar su propia cita pendiente', async () => {
      const res = await appointmentService.updateAppointmentStatus(citaId, 'cancelada', clientUser);
      expect(res.nuevoEstado).toBe('cancelada');
    });

    test('cliente no puede cambiar estado a atendiendo o completada', async () => {
      await expect(appointmentService.updateAppointmentStatus(citaId, 'completada', clientUser))
        .rejects.toThrow(ForbiddenError);
    });

    test('personal clínico puede transicionar por todos los estados válidos', async () => {
      await appointmentService.updateAppointmentStatus(citaId, 'confirmada', vetUser);
      await appointmentService.updateAppointmentStatus(citaId, 'atendiendo', vetUser);
      const res = await appointmentService.updateAppointmentStatus(citaId, 'completada', vetUser);
      expect(res.nuevoEstado).toBe('completada');
    });

    test('rechaza estados no reconocidos', async () => {
      await expect(appointmentService.updateAppointmentStatus(citaId, 'estado_inventado', vetUser))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Tareas Programadas de cPanel (Cron Jobs)', () => {
    test('processReminders debe marcar citas de las próximas 24 horas', async () => {
      // Cita en 12 horas (debe procesarse)
      const ahora = Date.now();
      const citaProxima = new Date(ahora + 12 * 60 * 60 * 1000).toISOString();
      await appointmentService.createAppointment({
        mascotaId: testPet.id,
        veterinarioId: vetUser.id,
        servicioId: serviceGeneral.id,
        fechaHoraInicio: citaProxima,
        motivo: 'Recordatorio test'
      }, clientUser);

      const res = await appointmentService.processReminders();
      expect(res.procesadas).toBe(1);

      // Si se ejecuta de nuevo inmediatamente, ya no debe haber pendientes
      const res2 = await appointmentService.processReminders();
      expect(res2.procesadas).toBe(0);
    });

    test('processExpiredPrescriptions debe marcar como vencidas recetas con vigencia expirada', async () => {
      // Insertar receta activa emitida hace 40 días con vigencia de 30 días
      const fechaVieja = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await db('recetas').insert({
        folio: 'REC-VIEJA-01',
        veterinario_id: vetUser.id,
        mascota_id: testPet.id,
        fecha_emision: fechaVieja,
        vigencia_dias: 30,
        firma_digital_hash: 'hash123',
        estado: 'activa'
      });

      const res = await appointmentService.processExpiredPrescriptions();
      expect(res.expiradas).toBe(1);

      const updated = await db('recetas').where('folio', 'REC-VIEJA-01').first();
      expect(updated.estado).toBe('vencida');
    });

    test('checkUpcomingVaccineBoosters debe detectar refuerzos de vacunas en los siguientes 15 días', async () => {
      const fechaProxima = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await db('vacunas').insert({
        mascota_id: testPet.id,
        nombre_vacuna: 'Refuerzo Leptospira',
        fecha_aplicacion: '2025-09-01',
        fecha_proxima_dosis: fechaProxima,
        veterinario_id: vetUser.id
      });

      const res = await appointmentService.checkUpcomingVaccineBoosters();
      expect(res.totalProximas).toBe(1);
    });
  });
});
