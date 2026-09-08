const request = require('supertest');
const app = require('../../src/app');
const config = require('../../src/config/env');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const tokenService = require('../../src/core/token.service');
const petService = require('../../src/modules/pets/pet.service');

describe('Integration - Módulo de Agenda de Citas y Cron Jobs cPanel', () => {
  let adminToken;
  let vetToken;
  let clientToken;
  let testPetId;
  let testServiceId;

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
    adminToken = tokenService.generateAccessToken({ id: aId, email: 'admin@lunavet.lat', rol: 'administrador' });

    const [vId] = await db('usuarios').insert({
      email: 'vet@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Dr.',
      apellido: 'Vet',
      rol: 'veterinario',
      activo: true
    });
    vetToken = tokenService.generateAccessToken({ id: vId, email: 'vet@lunavet.lat', rol: 'veterinario' });

    const [cId] = await db('usuarios').insert({
      email: 'cliente@test.com',
      password_hash: 'hash',
      nombre: 'Laura',
      apellido: 'Reyes',
      rol: 'cliente',
      activo: true
    });
    clientToken = tokenService.generateAccessToken({ id: cId, email: 'cliente@test.com', rol: 'cliente' });

    const pet = await petService.createPet({
      nombre: 'Canela',
      especie: 'Canino',
      raza: 'Mestizo'
    }, { id: cId, rol: 'cliente' });
    testPetId = pet.id;

    const [sId] = await db('servicios').insert({
      nombre: 'Consulta Veterinaria General',
      duracion_minutos: 30,
      precio: 500.00,
      activo: true
    });
    testServiceId = sId;
  });

  describe('Servicios y Citas vía HTTP', () => {
    test('POST y GET /api/appointments/services', async () => {
      // Admin crea servicio
      const createRes = await request(app)
        .post('/api/appointments/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Desparasitación Interna',
          duracionMinutos: 15,
          precio: 250.00
        })
        .expect(201);

      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.nombre).toBe('Desparasitación Interna');

      // Catálogo público
      const listRes = await request(app)
        .get('/api/appointments/services')
        .expect(200);

      expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('Flujo completo de agendamiento, consulta y actualización de estado', async () => {
      // 1. Cliente agenda cita
      const inicio = new Date('2026-11-20T10:00:00.000Z').toISOString();
      const citaRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          mascotaId: testPetId,
          veterinarioId: (await db('usuarios').where('rol', 'veterinario').first()).id,
          servicioId: testServiceId,
          fechaHoraInicio: inicio,
          motivo: 'Vacuna anual de rabia'
        })
        .expect(201);

      expect(citaRes.body.success).toBe(true);
      const citaId = citaRes.body.data.id;
      expect(citaId).toBeDefined();

      // 2. Cliente consulta sus citas
      const listRes = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].id).toBe(citaId);
      expect(listRes.body.data[0].estado).toBe('pendiente');

      // 3. Veterinario atiende la cita
      const statusRes = await request(app)
        .patch(`/api/appointments/${citaId}/status`)
        .set('Authorization', `Bearer ${vetToken}`)
        .send({ estado: 'atendiendo' })
        .expect(200);

      expect(statusRes.body.data.nuevoEstado).toBe('atendiendo');
    });
  });

  describe('Endpoints Protegidos para Tareas Programadas (cPanel Cron Jobs)', () => {
    test('debe rechazar invocaciones sin la cabecera X-Cron-Key (401 Unauthorized)', async () => {
      await request(app)
        .post('/api/appointments/cron/reminders')
        .expect(401);

      await request(app)
        .post('/api/appointments/cron/expired-prescriptions')
        .expect(401);

      await request(app)
        .post('/api/appointments/cron/vaccine-boosters')
        .expect(401);
    });

    test('debe ejecutar exitosamente las tareas cron con la clave secreta autorizada X-Cron-Key', async () => {
      const cronSecret = config.cron.secret;

      // 1. Tarea de recordatorios
      const resReminders = await request(app)
        .post('/api/appointments/cron/reminders')
        .set('X-Cron-Key', cronSecret)
        .expect(200);

      expect(resReminders.body.success).toBe(true);
      expect(resReminders.body.task).toBe('CRON_RECORDATORIOS_CITAS');

      // 2. Tarea de recetas vencidas
      const resPrescriptions = await request(app)
        .post('/api/appointments/cron/expired-prescriptions')
        .set('X-Cron-Key', cronSecret)
        .expect(200);

      expect(resPrescriptions.body.success).toBe(true);
      expect(resPrescriptions.body.task).toBe('CRON_RECETAS_VENCIDAS');

      // 3. Tarea de refuerzos de vacunas
      const resVaccines = await request(app)
        .post('/api/appointments/cron/vaccine-boosters')
        .set('X-Cron-Key', cronSecret)
        .expect(200);

      expect(resVaccines.body.success).toBe(true);
      expect(resVaccines.body.task).toBe('CRON_VACUNAS_PROXIMAS');
    });
  });
});
