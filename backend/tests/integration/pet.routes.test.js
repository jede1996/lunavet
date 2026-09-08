const request = require('supertest');
const app = require('../../src/app');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const tokenService = require('../../src/core/token.service');

describe('Integration - Módulo de Mascotas (Pacientes, Multi-dueño y Fotos BLOB)', () => {
  let client1Token;
  let client2Token;
  let client3Token;
  let vetToken;
  let _client1Id;
  let client2Id;
  let _client3Id;

  const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('archivos_adjuntos').del();
    await db('historial_titularidad').del();
    await db('usuarios_mascotas').del();
    await db('mascotas').del();
    await db('sesiones_activas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [u1] = await db('usuarios').insert({
      email: 'c1@test.com',
      password_hash: 'h1',
      nombre: 'Cliente',
      apellido: 'Uno',
      rol: 'cliente',
      activo: true
    });
    _client1Id = u1;
    client1Token = tokenService.generateAccessToken({ id: u1, email: 'c1@test.com', rol: 'cliente' });

    const [u2] = await db('usuarios').insert({
      email: 'c2@test.com',
      password_hash: 'h2',
      nombre: 'Cliente',
      apellido: 'Dos',
      rol: 'cliente',
      activo: true
    });
    client2Id = u2;
    client2Token = tokenService.generateAccessToken({ id: u2, email: 'c2@test.com', rol: 'cliente' });

    const [u3] = await db('usuarios').insert({
      email: 'c3@test.com',
      password_hash: 'h3',
      nombre: 'Cliente',
      apellido: 'Tres',
      rol: 'cliente',
      activo: true
    });
    _client3Id = u3;
    client3Token = tokenService.generateAccessToken({ id: u3, email: 'c3@test.com', rol: 'cliente' });

    const [v1] = await db('usuarios').insert({
      email: 'dr.vet@lunavet.lat',
      password_hash: 'hv',
      nombre: 'Dr.',
      apellido: 'Vet',
      rol: 'veterinario',
      activo: true
    });
    vetToken = tokenService.generateAccessToken({ id: v1, email: 'dr.vet@lunavet.lat', rol: 'veterinario' });
  });

  describe('Flujo CRUD y Multi-dueño vía HTTP', () => {
    let petId;

    test('POST /api/pets debe registrar una mascota y asignarla al cliente autenticado', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          nombre: 'Tobby',
          especie: 'Canino',
          raza: 'Pug',
          fechaNacimiento: '2023-01-15',
          sexo: 'macho',
          color: 'Arena',
          notas: 'Cirugía de paladar blando pendiente.'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.nombre).toBe('Tobby');
      expect(res.body.data.notas).toBe('Cirugía de paladar blando pendiente.');
      petId = res.body.data.id;
    });

    test('GET /api/pets debe listar las mascotas del cliente o todas para staff', async () => {
      // Crear 1 mascota para client1
      const createRes = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ nombre: 'Simba', especie: 'Felino', raza: 'Persa' })
        .expect(201);
      petId = createRes.body.data.id;

      // Client1 la lista
      const listClient1 = await request(app)
        .get('/api/pets')
        .set('Authorization', `Bearer ${client1Token}`)
        .expect(200);

      expect(listClient1.body.data).toHaveLength(1);
      expect(listClient1.body.data[0].nombre).toBe('Simba');
      expect(listClient1.body.data[0].esPropietarioPrincipal).toBe(true);

      // Client2 ve lista vacía
      const listClient2 = await request(app)
        .get('/api/pets')
        .set('Authorization', `Bearer ${client2Token}`)
        .expect(200);

      expect(listClient2.body.data).toHaveLength(0);

      // Veterinario puede ver todas las mascotas con búsqueda
      const listVet = await request(app)
        .get('/api/pets?busqueda=Simba')
        .set('Authorization', `Bearer ${vetToken}`)
        .expect(200);

      expect(listVet.body.data).toHaveLength(1);
    });

    test('Gestión de cotitulares (POST /api/pets/:id/owners y DELETE)', async () => {
      const createRes = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ nombre: 'Kira', especie: 'Canino', raza: 'Husky' })
        .expect(201);
      petId = createRes.body.data.id;

      // Client1 agrega a Client2 como cotitular
      const addRes = await request(app)
        .post(`/api/pets/${petId}/owners`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ email: 'c2@test.com' })
        .expect(200);

      expect(addRes.body.success).toBe(true);

      // Client2 ahora puede consultar la ficha de Kira
      const viewRes = await request(app)
        .get(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${client2Token}`)
        .expect(200);

      expect(viewRes.body.data.nombre).toBe('Kira');
      expect(viewRes.body.data.duenos).toHaveLength(2);

      // Client3 sigue sin acceso (403)
      await request(app)
        .get(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${client3Token}`)
        .expect(403);

      // Client1 remueve a Client2
      await request(app)
        .delete(`/api/pets/${petId}/owners/${client2Id}`)
        .set('Authorization', `Bearer ${client1Token}`)
        .expect(200);

      // Client2 ya no tiene acceso
      await request(app)
        .get(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${client2Token}`)
        .expect(403);
    });

    test('Transferencia de titularidad (POST /api/pets/:id/transfer)', async () => {
      const createRes = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ nombre: 'Thor', especie: 'Canino', raza: 'Rottweiler' })
        .expect(201);
      petId = createRes.body.data.id;

      // Client1 transfiere a Client2
      const transRes = await request(app)
        .post(`/api/pets/${petId}/transfer`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ newOwnerEmail: 'c2@test.com', motivo: 'Adopción definitiva' })
        .expect(200);

      expect(transRes.body.success).toBe(true);

      // Ahora Client2 es propietario principal y puede actualizar los datos
      const updateRes = await request(app)
        .put(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${client2Token}`)
        .send({ nombre: 'Thor el Grande' })
        .expect(200);

      expect(updateRes.body.data.nombre).toBe('Thor el Grande');

      // Client1 ya no puede actualizar porque ahora es solo cotitular (403)
      await request(app)
        .put(`/api/pets/${petId}`)
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ nombre: 'Intento de Cambio' })
        .expect(403);
    });
  });

  describe('Subida y Streaming de Fotografías BLOB', () => {
    let petId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ nombre: 'Pancho', especie: 'Canino', raza: 'Chihuahua' })
        .expect(201);
      petId = res.body.data.id;
    });

    test('POST /api/pets/:id/photo debe recibir y almacenar la foto como BLOB', async () => {
      const res = await request(app)
        .post(`/api/pets/${petId}/photo`)
        .set('Authorization', `Bearer ${client1Token}`)
        .attach('photo', validJpegBuffer, 'pancho.jpg')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.photoUrl).toBe(`/api/pets/${petId}/photo`);
      expect(res.body.hashSha256).toBeDefined();

      // Verificar persistencia binaria en MySQL
      const inDb = await db('archivos_adjuntos').where({ entidad_id: petId }).first();
      expect(inDb).toBeDefined();
      expect(inDb.tamano_bytes).toBe(validJpegBuffer.length);
    });

    test('GET /api/pets/:id/photo debe hacer streaming seguro con cabeceras de seguridad y caché', async () => {
      // Subir foto primero
      await request(app)
        .post(`/api/pets/${petId}/photo`)
        .set('Authorization', `Bearer ${client1Token}`)
        .attach('photo', validJpegBuffer, 'pancho.jpg')
        .expect(200);

      // Descargar foto
      const getRes = await request(app)
        .get(`/api/pets/${petId}/photo`)
        .set('Authorization', `Bearer ${client1Token}`)
        .expect(200);

      expect(getRes.headers['content-type']).toBe('image/jpeg');
      expect(getRes.headers['x-content-type-options']).toBe('nosniff');
      expect(getRes.headers['cache-control']).toContain('private');
      expect(getRes.body).toEqual(validJpegBuffer);

      // Usuario sin permiso debe recibir 403
      await request(app)
        .get(`/api/pets/${petId}/photo`)
        .set('Authorization', `Bearer ${client3Token}`)
        .expect(403);
    });

    test('debe rechazar POST /api/pets/:id/photo si no se adjunta archivo (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/pets/${petId}/photo`)
        .set('Authorization', `Bearer ${client1Token}`)
        .expect(400);

      expect(res.body.error.code).toBe('FILE_REQUIRED');
    });
  });
});
