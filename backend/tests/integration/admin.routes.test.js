const request = require('supertest');
const app = require('../../src/app');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const tokenService = require('../../src/core/token.service');

describe('Integration - Panel Administrativo, Reportes y Hardening (/api/admin)', () => {
  let adminToken;
  let vetToken;
  let clientToken;
  let adminId;

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('bitacora_auditoria').del();
    await db('pedidos_items').del();
    await db('pedidos').del();
    await db('lotes').del();
    await db('productos').del();
    await db('categorias').del();
    await db('recetas_items').del();
    await db('recetas').del();
    await db('citas').del();
    await db('servicios').del();
    await db('mascotas').del();
    await db('cms_secciones').del();
    await db('usuarios').del();

    const [aId] = await db('usuarios').insert({
      email: 'admin.integration@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Admin',
      apellido: 'Master',
      rol: 'administrador',
      activo: true
    });
    adminId = aId;
    adminToken = tokenService.generateAccessToken({ id: aId, email: 'admin.integration@lunavet.lat', rol: 'administrador' });

    const [vId] = await db('usuarios').insert({
      email: 'vet.integration@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Vet',
      apellido: 'Médico',
      rol: 'veterinario',
      cedula_profesional: 'CED-554433',
      activo: true
    });
    vetToken = tokenService.generateAccessToken({ id: vId, email: 'vet.integration@lunavet.lat', rol: 'veterinario' });

    const [cId] = await db('usuarios').insert({
      email: 'client.integration@test.com',
      password_hash: 'hash',
      nombre: 'Cliente',
      apellido: 'Normal',
      rol: 'cliente',
      activo: true
    });
    clientToken = tokenService.generateAccessToken({ id: cId, email: 'client.integration@test.com', rol: 'cliente' });
  });

  describe('Control de Acceso y RBAC Estricto en /api/admin', () => {
    it('debe rechazar solicitudes no autenticadas con 401', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('debe rechazar acceso de clientes con 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
    });

    it('debe rechazar acceso de veterinarios a configuración administrativa con 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${vetToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Gestión de Staff y Usuarios', () => {
    it('debe permitir a admin listar, crear, consultar y actualizar personal', async () => {
      // 1. Listar staff inicial
      const resList = await request(app)
        .get('/api/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resList.status).toBe(200);
      expect(resList.body.data.total).toBe(2); // admin y vet

      // 2. Crear nueva recepcionista
      const resCreate = await request(app)
        .post('/api/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'recep.nueva@lunavet.lat',
          password: 'PassWord123!#',
          nombre: 'Elena',
          apellido: 'Pérez',
          rol: 'recepcionista',
          telefono: '+525599887766'
        });
      expect(resCreate.status).toBe(201);
      const newStaffId = resCreate.body.data.id;
      expect(newStaffId).toBeDefined();

      // 3. Obtener detalle por ID
      const resGet = await request(app)
        .get(`/api/admin/staff/${newStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resGet.status).toBe(200);
      expect(resGet.body.data.email).toBe('recep.nueva@lunavet.lat');

      // 4. Actualizar teléfono y nombre
      const resUpdate = await request(app)
        .put(`/api/admin/staff/${newStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Elena María',
          telefono: '+525511223344'
        });
      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.nombre).toBe('Elena María');

      // 5. Restablecer contraseña
      const resReset = await request(app)
        .post(`/api/admin/staff/${newStaffId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'NewPassword2026!#' });
      expect(resReset.status).toBe(200);

      // 6. Cambiar estado activo
      const resStatus = await request(app)
        .patch(`/api/admin/staff/${newStaffId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: false });
      expect(resStatus.status).toBe(200);
      expect(Boolean(resStatus.body.data.activo)).toBe(false);
    });

    it('debe impedir al administrador auto-desactivarse', async () => {
      const res = await request(app)
        .patch(`/api/admin/staff/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: false });
      expect(res.status).toBe(400);
    });

    it('debe manejar errores de validación y 404 en endpoints de staff', async () => {
      // 1. Post staff inválido -> 400
      const resBadPost = await request(app)
        .post('/api/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'bad' });
      expect(resBadPost.status).toBe(400);

      // 2. Get inexistente -> 404
      const resGet404 = await request(app)
        .get('/api/admin/staff/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resGet404.status).toBe(404);

      // 3. Put inexistente -> 404
      const resPut404 = await request(app)
        .put('/api/admin/staff/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'X' });
      expect(resPut404.status).toBe(404);

      // 4. Reset password inexistente -> 404
      const resReset404 = await request(app)
        .post('/api/admin/staff/99999/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'NewPassword123!#' });
      expect(resReset404.status).toBe(404);

      // 5. Status inexistente -> 404
      const resStatus404 = await request(app)
        .patch('/api/admin/staff/99999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: true });
      expect(resStatus404.status).toBe(404);
    });
  });

  describe('Dashboard, Reportes Ejecutivos y Auditoría', () => {
    it('debe responder con métricas del dashboard en tiempo real', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.pacientes).toBeDefined();
      expect(res.body.data.citasHoy).toBeDefined();
      expect(res.body.data.financieroMes).toBeDefined();
      expect(res.body.data.alertasInventario).toBeDefined();
    });

    it('debe responder a endpoints de reportes financieros, inventario y productividad', async () => {
      const today = new Date().toISOString().slice(0, 10);

      // Reporte financiero
      const resFin = await request(app)
        .get(`/api/admin/reports/financial?fechaInicio=${today}&fechaFin=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resFin.status).toBe(200);
      expect(resFin.body.data.resumen).toBeDefined();

      // Reporte de inventario en riesgo
      const resInv = await request(app)
        .get('/api/admin/reports/inventory-risk?diasUmbral=30')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resInv.status).toBe(200);
      expect(resInv.body.data.resumen).toBeDefined();

      // Reporte de productividad clínica
      const resProd = await request(app)
        .get(`/api/admin/reports/clinical-productivity?fechaInicio=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resProd.status).toBe(200);
      expect(resProd.body.data.resumen).toBeDefined();

      // Reporte de medicamentos controlados
      const resCtrl = await request(app)
        .get('/api/admin/reports/controlled-medications')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resCtrl.status).toBe(200);
      expect(resCtrl.body.data.total).toBe(0);
    });

    it('debe permitir consultar bitácora de auditoría y gestionar configuración global de clínica', async () => {
      // 1. Consultar bitácora
      const resLogs = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resLogs.status).toBe(200);
      expect(Array.isArray(resLogs.body.data.data)).toBe(true);

      // 2. Consultar configuración clínica
      const resSettings = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resSettings.status).toBe(200);
      expect(resSettings.body.data.nombreClinica).toBeDefined();

      // 3. Modificar configuración clínica
      const resPutSettings = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombreClinica: 'LunaVet Animal Care & Hospital',
          telefonoEmergencias: '+52 55 8877 6655',
          duracionCitaDefaultMinutos: 45
        });
      expect(resPutSettings.status).toBe(200);
      expect(resPutSettings.body.data.nombreClinica).toBe('LunaVet Animal Care & Hospital');
      expect(resPutSettings.body.data.duracionCitaDefaultMinutos).toBe(45);
    });
  });
});
