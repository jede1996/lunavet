const request = require('supertest');
const app = require('../../src/app');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const tokenService = require('../../src/core/token.service');

describe('Integration - CMS Ligero, Landing Pública, Blog SEO y Testimonios', () => {
  let adminToken;
  let vetToken;
  let clientToken;
  let strangerToken;

  const VALID_JPEG = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
    0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00,
    0xff, 0xd9
  ]);

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('archivos_adjuntos').del();
    await db('resenas').del();
    await db('testimonios').del();
    await db('blog_articulos').del();
    await db('cms_secciones').del();
    await db('servicios').del();
    await db('productos').del();
    await db('categorias').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [aId] = await db('usuarios').insert({
      email: 'admin.routes@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Admin',
      apellido: 'CMS',
      rol: 'administrador',
      activo: true
    });
    adminToken = tokenService.generateAccessToken({ id: aId, email: 'admin.routes@lunavet.lat', rol: 'administrador' });

    const [vId] = await db('usuarios').insert({
      email: 'vet.routes@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Lucía',
      apellido: 'Dra',
      rol: 'veterinario',
      cedula_profesional: 'CED-998811',
      activo: true
    });
    vetToken = tokenService.generateAccessToken({ id: vId, email: 'vet.routes@lunavet.lat', rol: 'veterinario' });

    const [cId] = await db('usuarios').insert({
      email: 'cliente.routes@test.com',
      password_hash: 'hash',
      nombre: 'Jorge',
      apellido: 'Moran',
      rol: 'cliente',
      activo: true
    });
    clientToken = tokenService.generateAccessToken({ id: cId, email: 'cliente.routes@test.com', rol: 'cliente' });

    const [sId] = await db('usuarios').insert({
      email: 'ajeno@test.com',
      password_hash: 'hash',
      nombre: 'Ajeno',
      apellido: 'User',
      rol: 'cliente',
      activo: true
    });
    strangerToken = tokenService.generateAccessToken({ id: sId, email: 'ajeno@test.com', rol: 'cliente' });
  });

  describe('Secciones y Landing Page Consolidada', () => {
    it('debe permitir a admin gestionar secciones y a público consultar landing consolidada', async () => {
      // 1. Admin crea sección
      const resSec = await request(app)
        .post('/api/cms/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          claveSeccion: 'nosotros',
          titulo: 'Sobre Clínica LunaVet',
          contenidoHtml: '<p>Más de 15 años cuidando a tus mascotas</p>',
          metadatosJson: { experienciaAnos: 15 }
        });

      expect(resSec.status).toBe(200);
      expect(resSec.body.data.clave_seccion).toBe('nosotros');

      // 2. Cliente intenta crear sección -> 403
      const resForbidden = await request(app)
        .post('/api/cms/sections')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ claveSeccion: 'test', titulo: 'test' });
      expect(resForbidden.status).toBe(403);

      // 3. Consulta pública de sección
      const resGetSec = await request(app).get('/api/cms/sections/nosotros');
      expect(resGetSec.status).toBe(200);
      expect(resGetSec.body.data.titulo).toBe('Sobre Clínica LunaVet');

      // 4. Consulta pública de la landing completa consolidada
      const resLanding = await request(app).get('/api/cms/landing');
      expect(resLanding.status).toBe(200);
      expect(resLanding.body.data.secciones.nosotros).toBeDefined();
      expect(resLanding.body.data.clinica.nombre).toBe('Clínica Veterinaria Luna-Vet');
    });
  });

  describe('Blog SEO Veterinario', () => {
    it('debe gestionar ciclo de vida completo de artículos de blog', async () => {
      // 1. Veterinario redacta artículo
      const resCreate = await request(app)
        .post('/api/cms/blog')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          titulo: 'Alimentación Saludable en Gatos Adultos',
          extracto: 'Recomendaciones nutricionales para felinos indoor.',
          contenido: 'La hidratación y la proteína de alto valor biológico...',
          palabrasClave: 'gatos, nutricion, felinos',
          publicado: true
        });

      expect(resCreate.status).toBe(201);
      const articleId = resCreate.body.data.id;
      const slug = resCreate.body.data.slug;
      expect(slug).toBe('alimentacion-saludable-en-gatos-adultos');

      // 2. Consulta pública de lista de blog con filtros
      const resList = await request(app)
        .get('/api/cms/blog?search=nutricionales&tag=felinos');
      expect(resList.status).toBe(200);
      expect(resList.body.data.length).toBe(1);

      // 3. Consulta de artículo por slug (incrementa vistas)
      const resDetail = await request(app).get(`/api/cms/blog/${slug}`);
      expect(resDetail.status).toBe(200);
      expect(resDetail.body.data.vistas).toBe(1);

      // 4. Veterinario actualiza artículo
      const resUpdate = await request(app)
        .put(`/api/cms/blog/${articleId}`)
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          titulo: 'Alimentación Saludable en Gatos Adultos y Senior'
        });
      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.titulo).toBe('Alimentación Saludable en Gatos Adultos y Senior');

      // 4.1 Usuario sin rol clínico intenta actualizar -> 403
      const resForbiddenUpdate = await request(app)
        .put(`/api/cms/blog/${articleId}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ titulo: 'Intento no autorizado' });
      expect(resForbiddenUpdate.status).toBe(403);

      // 5. Admin elimina artículo
      const resDelete = await request(app)
        .delete(`/api/cms/blog/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resDelete.status).toBe(200);
      expect(resDelete.body.data.eliminado).toBe(true);
    });
  });

  describe('Testimonios y Reseñas de Productos', () => {
    it('debe enviar testimonios y moderar visibilidad', async () => {
      // 1. Enviar testimonio público
      const resTest = await request(app)
        .post('/api/cms/testimonials')
        .send({
          nombreCliente: 'Carla San Juan',
          comentario: 'La mejor atención veterinaria.',
          calificacion: 5
        });

      expect(resTest.status).toBe(201);
      const testId = resTest.body.data.id;

      // 2. Listar testimonios
      const resList = await request(app).get('/api/cms/testimonials');
      expect(resList.status).toBe(200);
      expect(resList.body.data.length).toBe(1);

      // 3. Admin modera visibilidad
      const resToggle = await request(app)
        .patch(`/api/cms/testimonials/${testId}/visibility`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ visibleLanding: false });
      expect(resToggle.status).toBe(200);
      expect(Boolean(resToggle.body.data.visible_landing)).toBe(false);
    });

    it('debe permitir a un cliente reseñar un producto y consultar reseñas', async () => {
      const [catId] = await db('categorias').insert({ nombre: 'Farmacia', slug: 'farmacia' });
      const [prodId] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Suplemento Articular',
        slug: 'suplemento-articular',
        precio: 350.00,
        activo: true
      });

      // 1. Cliente publica reseña
      const resReview = await request(app)
        .post(`/api/cms/reviews/product/${prodId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          comentario: 'A mi perro le mejoró mucho la movilidad.',
          calificacion: 5
        });

      expect(resReview.status).toBe(201);

      // 2. Consulta pública de reseñas del producto
      const resGet = await request(app).get(`/api/cms/reviews/product/${prodId}`);
      expect(resGet.status).toBe(200);
      expect(resGet.body.data.totalResenas).toBe(1);
      expect(resGet.body.data.promedioCalificacion).toBe(5.0);
    });
  });

  describe('Almacenamiento y Streaming de Imágenes BLOB del CMS', () => {
    it('debe subir y transmitir imágenes en streaming HTTP', async () => {
      // 1. Subida de imagen por personal clínico
      const resUpload = await request(app)
        .post('/api/cms/images')
        .set('Authorization', `Bearer ${vetToken}`)
        .attach('imagen', VALID_JPEG, 'banner.jpg');

      expect(resUpload.status).toBe(201);
      const imageId = resUpload.body.data.id;
      expect(imageId).toBeDefined();

      // 2. Streaming de imagen
      const resStream = await request(app).get(`/api/cms/images/${imageId}`);
      expect(resStream.status).toBe(200);
      expect(resStream.headers['content-type']).toBe('image/jpeg');
    });
  });
});
