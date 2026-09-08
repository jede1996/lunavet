const request = require('supertest');
const app = require('../../src/app');
const tokenService = require('../../src/core/token.service');

describe('Integration - Segregación de Roles (RBAC) y Seguridad IDOR', () => {
  let clientToken;

  beforeAll(() => {
    clientToken = tokenService.generateAccessToken({ id: 101, email: 'cliente@test.com', rol: 'cliente' });
  });

  describe('Punto de Venta (POS) y Caja Chica - Segregación', () => {
    test('Un cliente no debe poder buscar en POS de mostrador (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/commerce/pos/search?q=nexgard')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder ejecutar checkout en POS (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/commerce/pos/checkout')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ items: [] })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder consultar turno activo de caja chica (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/commerce/cash-register/active')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder aperturar turno de caja chica (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/commerce/cash-register/open')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ monto_inicial: 500 })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder registrar movimientos manuales de caja chica (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/commerce/cash-register/movement')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ tipo: 'salida', monto: 100, motivo: 'Prueba' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Hospitalización y Procedimientos Clínicos - Segregación', () => {
    test('Un cliente no debe poder registrar signos vitales de hospitalización (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/clinical/hospitalizations/1/monitoring')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ temperatura: 38.5 })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder crear consentimientos informados en nombre de la clínica (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/clinical/consents')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ tipo_consentimiento: 'anestesia_cirugia' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder registrar checkin de estética en módulo interno (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/clinical/grooming/checkins')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ mascota_id: 1 })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder alterar el estado de estética de una mascota (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/clinical/grooming/checkins/1/status')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ estado: 'listo_entrega' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder programar recordatorios clínicos preventivos (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/clinical/reminders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ mascota_id: 1 })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Un cliente no debe poder acceder a la lista general de seguimientos post-op (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/clinical/followups')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Alias de Refresh Token', () => {
    test('POST /api/auth/refresh-token debe estar disponible y responder 401 si falta el token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
