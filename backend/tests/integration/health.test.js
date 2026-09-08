const request = require('supertest');
const app = require('../../src/app');

describe('Integration - Endpoints Base y Middlewares de Seguridad', () => {
  test('GET /api/health debe retornar 200 OK y cabeceras de seguridad HTTP', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('LunaVet Backend Core');
    expect(res.body.version).toBe('4.0.0');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    // Debe haber ocultado X-Powered-By
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('GET a una ruta inexistente debe retornar 404 con formato de error estandarizado', async () => {
    const res = await request(app)
      .get('/api/ruta-que-no-existe')
      .set('Accept', 'application/json')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  test('GET / desde un navegador web (Accept: text/html) debe retornar la vista HTML premium de error', async () => {
    const res = await request(app)
      .get('/')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
      .expect(404);

    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('LunaVet v4.0');
    expect(res.text).toContain('ROUTE_NOT_FOUND');
    expect(res.text).toContain('La ruta solicitada GET / no existe en el servidor.');
    expect(res.text).toContain('/api/health');
    expect(res.text).toContain('Payload Técnico JSON');
  });
});
