const request = require('supertest');
const app = require('../../src/app');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const tokenService = require('../../src/core/token.service');
const petService = require('../../src/modules/pets/pet.service');

describe('Integration - Módulo Clínico (Expediente, Alergias, Peso, Vacunas y Recetas)', () => {
  let vetToken;
  let clientToken;
  let strangerToken;
  let testPetId;

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('archivos_adjuntos').del();
    await db('recetas_items').del();
    await db('recetas').del();
    await db('vacunas').del();
    await db('registros_peso').del();
    await db('alergias_mascotas').del();
    await db('expedientes_clinicos').del();
    await db('usuarios_mascotas').del();
    await db('mascotas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [vId] = await db('usuarios').insert({
      email: 'veterinario@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Elena',
      apellido: 'Rivas',
      rol: 'veterinario',
      cedula_profesional: 'CED-776655',
      activo: true
    });
    vetToken = tokenService.generateAccessToken({ id: vId, email: 'veterinario@lunavet.lat', rol: 'veterinario' });

    const [cId] = await db('usuarios').insert({
      email: 'dueno@test.com',
      password_hash: 'hash',
      nombre: 'Mariana',
      apellido: 'Paz',
      rol: 'cliente',
      activo: true
    });
    clientToken = tokenService.generateAccessToken({ id: cId, email: 'dueno@test.com', rol: 'cliente' });

    const [sId] = await db('usuarios').insert({
      email: 'ajeno@test.com',
      password_hash: 'hash',
      nombre: 'Extraño',
      apellido: 'Pérez',
      rol: 'cliente',
      activo: true
    });
    strangerToken = tokenService.generateAccessToken({ id: sId, email: 'ajeno@test.com', rol: 'cliente' });

    const pet = await petService.createPet({
      nombre: 'Coco',
      especie: 'Canino',
      raza: 'Schnauzer'
    }, { id: cId, rol: 'cliente' });
    testPetId = pet.id;
  });

  describe('Consultas Clínicas', () => {
    test('POST /api/clinical/consultations debe registrar una consulta y alertar alergias', async () => {
      // Registrar una alergia previa
      await request(app)
        .post('/api/clinical/allergies')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          mascotaId: testPetId,
          sustancia: 'Sulfas',
          severidad: 'grave',
          reaccion: 'Dermatitis exfoliativa'
        })
        .expect(201);

      const res = await request(app)
        .post('/api/clinical/consultations')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          mascotaId: testPetId,
          motivoConsulta: 'Chequeo general preventivo',
          sintomas: 'Ninguno aparente',
          diagnostico: 'Paciente clínicamente sano',
          tratamiento: 'Continuar con dieta habitual y desparasitación semestral',
          notasPrivadas: 'Propietaria muy puntual y comprometida con el cuidado.'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.alergiasAlertadas).toContain('Sulfas');
    });

    test('GET /api/clinical/consultations/pet/:petId debe permitir consulta a dueños', async () => {
      await request(app)
        .post('/api/clinical/consultations')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          mascotaId: testPetId,
          motivoConsulta: 'Vacunación',
          diagnostico: 'Apto para vacunar',
          tratamiento: 'Vacuna quíntuple aplicada'
        })
        .expect(201);

      const res = await request(app)
        .get(`/api/clinical/consultations/pet/${testPetId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].diagnostico).toBe('Apto para vacunar');
    });

    test('debe denegar registro de consulta a usuarios con rol cliente (403 Forbidden)', async () => {
      await request(app)
        .post('/api/clinical/consultations')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          mascotaId: testPetId,
          motivoConsulta: 'Intento de registro',
          diagnostico: 'Dx',
          tratamiento: 'Tx'
        })
        .expect(403);
    });
  });

  describe('Alergias, Peso y Vacunas', () => {
    test('POST y GET /api/clinical/weight (Evolución de peso)', async () => {
      await request(app)
        .post('/api/clinical/weight')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          mascotaId: testPetId,
          pesoKg: 8.4,
          fechaRegistro: '2026-05-01',
          notas: 'Peso post-paseo'
        })
        .expect(201);

      const res = await request(app)
        .get(`/api/clinical/weight/pet/${testPetId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].pesoKg).toBe(8.4);
    });

    test('POST y GET /api/clinical/vaccines (Carnet de vacunación)', async () => {
      await request(app)
        .post('/api/clinical/vaccines')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          mascotaId: testPetId,
          nombreVacuna: 'Múltiple Canina',
          lote: 'LOTE-2026-MC',
          fechaAplicacion: '2026-04-10',
          fechaProximaDosis: '2027-04-10'
        })
        .expect(201);

      const res = await request(app)
        .get(`/api/clinical/vaccines/pet/${testPetId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombreVacuna).toBe('Múltiple Canina');
    });
  });

  describe('Recetas Médicas Digitales y Streaming PDF BLOB', () => {
    test('Emisión de receta y descarga de PDF generado por JavaScript puro (pdfkit)', async () => {
      // 1. Emitir receta
      const emisionRes = await request(app)
        .post('/api/clinical/prescriptions')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          mascotaId: testPetId,
          vigenciaDias: 30,
          items: [
            {
              nombreMedicamento: 'Tramadol Gotas 50mg/ml',
              dosis: '5 gotas',
              frecuencia: 'cada 8 horas',
              duracionDias: 5,
              cantidadPrescrita: 1,
              indicaciones: 'Vía oral para manejo del dolor agudo.'
            }
          ]
        })
        .expect(201);

      expect(emisionRes.body.success).toBe(true);
      const prescriptionId = emisionRes.body.data.id;
      expect(prescriptionId).toBeDefined();

      // 2. Descargar PDF vía streaming
      const pdfRes = await request(app)
        .get(`/api/clinical/prescriptions/${prescriptionId}/pdf`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.headers['x-content-type-options']).toBe('nosniff');
      expect(pdfRes.headers['cache-control']).toContain('private');

      // Validar contenido binario PDF
      expect(pdfRes.body.slice(0, 4).toString('ascii')).toBe('%PDF');

      // 3. Usuario ajeno no puede descargar la receta (403 Forbidden)
      await request(app)
        .get(`/api/clinical/prescriptions/${prescriptionId}/pdf`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);
    });
  });
});
