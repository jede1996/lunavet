const cmsService = require('../../src/modules/cms/cms.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../../src/core/errors');

describe('CmsService - Landing Page, Secciones, Blog SEO, Testimonios y Reseñas', () => {
  let adminUser;
  let vetUser;
  let clientUser;
  let receptionistUser;

  // Buffer JPEG legítimo de 1x1 pixel para pruebas de BLOB
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
      email: 'admin.cms@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Administrador',
      apellido: 'General',
      rol: 'administrador',
      activo: true
    });
    adminUser = { id: aId, rol: 'administrador' };

    const [vId] = await db('usuarios').insert({
      email: 'dr.vet@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Sofía',
      apellido: 'Méndez',
      rol: 'veterinario',
      cedula_profesional: 'CED-112233',
      activo: true
    });
    vetUser = { id: vId, rol: 'veterinario' };

    const [rId] = await db('usuarios').insert({
      email: 'recep@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Recepcionista',
      apellido: 'Luna',
      rol: 'recepcionista',
      activo: true
    });
    receptionistUser = { id: rId, rol: 'recepcionista' };

    const [cId] = await db('usuarios').insert({
      email: 'cliente@test.com',
      password_hash: 'hash',
      nombre: 'Fernando',
      apellido: 'Castro',
      rol: 'cliente',
      activo: true
    });
    clientUser = { id: cId, rol: 'cliente' };
  });

  describe('Secciones del CMS', () => {
    it('debe permitir a un administrador crear y actualizar secciones con metadatos JSON', async () => {
      // Crear sección
      const sec1 = await cmsService.upsertSection({
        claveSeccion: 'hero',
        titulo: 'Cuidado Médico Integral Para Tu Mascota',
        contenidoHtml: '<p>Bienvenido a LunaVet</p>',
        metadatosJson: { ctaTexto: 'Agendar Cita', bannerUrl: '/banner.jpg' }
      }, adminUser);

      expect(sec1.id).toBeDefined();
      expect(sec1.clave_seccion).toBe('hero');
      expect(sec1.titulo).toBe('Cuidado Médico Integral Para Tu Mascota');

      // Actualizar sección existente (upsert)
      const secUpdated = await cmsService.upsertSection({
        claveSeccion: 'hero',
        titulo: 'Atención Veterinaria Avanzada 24/7',
        contenidoHtml: '<p>Servicios de urgencia</p>',
        metadatosJson: { ctaTexto: 'Llamar Urgencias' }
      }, adminUser);

      expect(secUpdated.id).toBe(sec1.id);
      expect(secUpdated.titulo).toBe('Atención Veterinaria Avanzada 24/7');

      // Consultar sección por clave
      const fetched = await cmsService.getSection('hero');
      expect(fetched.titulo).toBe('Atención Veterinaria Avanzada 24/7');
      expect(fetched.metadatos_json.ctaTexto).toBe('Llamar Urgencias');

      // Listar todas las secciones
      const list = await cmsService.listSections();
      expect(list.length).toBe(1);
    });

    it('debe rechazar la gestión de secciones por roles no autorizados', async () => {
      await expect(
        cmsService.upsertSection({ claveSeccion: 'nosotros', titulo: 'Sobre Nosotros' }, vetUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        cmsService.upsertSection({ claveSeccion: 'nosotros', titulo: 'Sobre Nosotros' }, clientUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        cmsService.upsertSection({ claveSeccion: 'nosotros', titulo: 'Sobre Nosotros' }, receptionistUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('debe validar campos obligatorios y secciones inexistentes', async () => {
      await expect(
        cmsService.upsertSection({ claveSeccion: '', titulo: 'Título' }, adminUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        cmsService.upsertSection({ claveSeccion: 'nosotros', titulo: '' }, adminUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        cmsService.getSection('seccion_no_existente')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Blog SEO Veterinario', () => {
    it('debe permitir a un veterinario redactar artículos y listarlos con filtros y visitas', async () => {
      // 1. Redactar artículo publicado
      const art1 = await cmsService.createArticle({
        titulo: 'Guía de Vacunación Canina 2026',
        extracto: 'Conoce el esquema esencial de vacunas para cachorros.',
        contenido: 'El esquema de vacunación inicia a las 6 semanas con la puppy...',
        metaTitle: 'Guía de Vacunación Canina en CDMX | LunaVet',
        metaDescription: 'Descubre todo sobre el calendario de vacunación para cachorros.',
        palabrasClave: 'vacunas, perros, cachorros, salud',
        publicado: true
      }, vetUser);

      expect(art1.id).toBeDefined();
      expect(art1.slug).toBe('guia-de-vacunacion-canina-2026');
      expect(Boolean(art1.publicado)).toBe(true);
      expect(art1.fecha_publicacion).toBeDefined();

      // 2. Redactar borrador no publicado
      await cmsService.createArticle({
        titulo: 'Cuidados Dentales en Felinos',
        contenido: 'Borrador sobre profilaxis dental felina.',
        publicado: false
      }, vetUser);

      // Listar solo publicados (debe retornar 1)
      const pubList = await cmsService.listArticles({ soloPublicados: true });
      expect(pubList.length).toBe(1);
      expect(pubList[0].titulo).toBe('Guía de Vacunación Canina 2026');
      expect(pubList[0].autor_nombre).toBe('Sofía');

      // Listar todos incluyendo borradores (debe retornar 2)
      const allList = await cmsService.listArticles({ soloPublicados: false });
      expect(allList.length).toBe(2);

      // Filtrar por búsqueda y tag
      const searchRes = await cmsService.listArticles({ search: 'esquema' });
      expect(searchRes.length).toBe(1);

      const tagRes = await cmsService.listArticles({ tag: 'cachorros' });
      expect(tagRes.length).toBe(1);

      // Consultar por slug e incrementar vistas
      const artDetail = await cmsService.getArticleBySlug('guia-de-vacunacion-canina-2026');
      expect(artDetail.vistas).toBe(1);

      const artDetail2 = await cmsService.getArticleBySlug('guia-de-vacunacion-canina-2026');
      expect(artDetail2.vistas).toBe(2);
    });

    it('debe actualizar artículos y cambiar estado de borrador a publicado', async () => {
      const art = await cmsService.createArticle({
        titulo: 'Nutrición en Razas Grandes',
        contenido: 'Texto preliminar...',
        publicado: false
      }, adminUser);

      const updated = await cmsService.updateArticle(art.id, {
        titulo: 'Nutrición Avanzada en Razas Grandes',
        publicado: true
      }, adminUser);

      expect(updated.titulo).toBe('Nutrición Avanzada en Razas Grandes');
      expect(Boolean(updated.publicado)).toBe(true);
      expect(updated.fecha_publicacion).toBeDefined();
    });

    it('debe validar slug duplicado, artículo inexistente y permisos de eliminación', async () => {
      await cmsService.createArticle({
        titulo: 'Articulo Unico',
        contenido: 'Contenido A'
      }, vetUser);

      await expect(
        cmsService.createArticle({
          titulo: 'Articulo Unico',
          contenido: 'Contenido B'
        }, vetUser)
      ).rejects.toThrow(ConflictError);

      await expect(
        cmsService.getArticleBySlug('slug-inexistente')
      ).rejects.toThrow(NotFoundError);

      await expect(
        cmsService.deleteArticle(99999, adminUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        cmsService.deleteArticle(1, vetUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('debe permitir a un administrador eliminar un artículo', async () => {
      const art = await cmsService.createArticle({
        titulo: 'Para Eliminar',
        contenido: 'Contenido'
      }, adminUser);

      const res = await cmsService.deleteArticle(art.id, adminUser);
      expect(res.eliminado).toBe(true);

      const list = await cmsService.listArticles({ soloPublicados: false });
      expect(list.length).toBe(0);
    });

    it('debe probar validaciones exhaustivas de artículos, actualización de metadatos y slug collision', async () => {
      const art1 = await cmsService.createArticle({
        titulo: 'Primer Articulo',
        contenido: 'Contenido 1'
      }, vetUser);

      await cmsService.createArticle({
        titulo: 'Segundo Articulo',
        contenido: 'Contenido 2'
      }, vetUser);

      // Actualizar metadatos completos
      const updated = await cmsService.updateArticle(art1.id, {
        extracto: 'Nuevo extracto SEO',
        metaTitle: 'Meta Title Personalizado',
        metaDescription: 'Meta Description Personalizada',
        palabrasClave: 'seo, veterinaria, tips',
        contenido: 'Contenido actualizado'
      }, vetUser);

      expect(updated.extracto).toBe('Nuevo extracto SEO');
      expect(updated.meta_title).toBe('Meta Title Personalizado');
      expect(updated.palabras_clave).toBe('seo, veterinaria, tips');

      // Conflicto de slug en actualización
      await expect(
        cmsService.updateArticle(art1.id, { slug: 'segundo-articulo' }, vetUser)
      ).rejects.toThrow(ConflictError);

      // Validaciones de creación
      await expect(
        cmsService.createArticle({ titulo: '', contenido: 'Texto' }, vetUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        cmsService.createArticle({ titulo: 'Texto', contenido: '' }, vetUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        cmsService.createArticle({ titulo: 'Texto', contenido: 'Texto' }, clientUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        cmsService.updateArticle(99999, { titulo: 'X' }, vetUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        cmsService.updateArticle(art1.id, { titulo: 'X' }, clientUser)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Testimonios de la Clínica', () => {
    it('debe permitir enviar testimonios y moderar su visibilidad en landing', async () => {
      // Envío de testimonio
      const t = await cmsService.createTestimonial({
        nombreCliente: 'Gabriel Morales',
        comentario: 'Excelente atención con mi perro en su cirugía de urgencia.',
        calificacion: 5
      }, clientUser);

      expect(t.id).toBeDefined();
      expect(t.calificacion).toBe(5);
      expect(Boolean(t.visible_landing)).toBe(true);

      // Listar testimonios visibles
      const list = await cmsService.listTestimonials({ soloVisibles: true });
      expect(list.length).toBe(1);

      // Admin oculta testimonio
      const toggled = await cmsService.toggleTestimonialVisibility(t.id, false, adminUser);
      expect(Boolean(toggled.visible_landing)).toBe(false);

      const listHidden = await cmsService.listTestimonials({ soloVisibles: true });
      expect(listHidden.length).toBe(0);

      // Non-admin no puede moderar
      await expect(
        cmsService.toggleTestimonialVisibility(t.id, true, clientUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('debe validar campos requeridos y calificación entre 1 y 5', async () => {
      await expect(
        cmsService.createTestimonial({ nombreCliente: '', comentario: 'Buen servicio' })
      ).rejects.toThrow(ValidationError);

      await expect(
        cmsService.createTestimonial({ nombreCliente: 'Ana', comentario: 'Bueno', calificacion: 6 })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Reseñas de Productos', () => {
    let prodId;

    beforeEach(async () => {
      const [cId] = await db('categorias').insert({
        nombre: 'Nutrición',
        slug: 'nutricion'
      });
      const [pId] = await db('productos').insert({
        categoria_id: cId,
        nombre: 'Croquetas Digestivas 3kg',
        slug: 'croquetas-digestivas',
        precio: 450.00,
        activo: true
      });
      prodId = pId;
    });

    it('debe permitir a un cliente calificar un producto y calcular estadísticas agregadas', async () => {
      await cmsService.createProductReview({
        productoId: prodId,
        comentario: 'Le cayó excelente a mi mascota, digestión perfecta.',
        calificacion: 5
      }, clientUser);

      const reviews = await cmsService.listProductReviews(prodId);
      expect(reviews.totalResenas).toBe(1);
      expect(reviews.promedioCalificacion).toBe(5.0);
      expect(reviews.resenas[0].cliente_nombre).toBe('Fernando');
    });

    it('debe rechazar reseña si no hay usuario autenticado o producto no existe', async () => {
      await expect(
        cmsService.createProductReview({
          productoId: prodId,
          comentario: 'Muy bueno'
        }, null)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        cmsService.createProductReview({
          productoId: 99999,
          comentario: 'Producto fantasma'
        }, clientUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        cmsService.createProductReview({
          productoId: prodId,
          comentario: '',
          calificacion: 5
        }, clientUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        cmsService.createProductReview({
          productoId: prodId,
          comentario: 'Comentario',
          calificacion: 10
        }, clientUser)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Landing Page Consolidada e Imágenes BLOB', () => {
    it('debe retornar estructura completa para Landing Page', async () => {
      // 1. Crear sección hero
      await cmsService.upsertSection({
        claveSeccion: 'hero',
        titulo: 'LunaVet Principal',
        contenidoHtml: '<h1>Bienvenido</h1>'
      }, adminUser);

      // 2. Crear servicio activo
      await db('servicios').insert({
        nombre: 'Consulta General',
        precio: 300,
        duracion_minutos: 30,
        activo: true
      });

      // 3. Crear testimonio
      await cmsService.createTestimonial({
        nombreCliente: 'Pedro',
        comentario: 'Muy profesionales.',
        calificacion: 5
      });

      // 4. Crear artículo publicado
      await cmsService.createArticle({
        titulo: 'Vacunación en Gatos',
        contenido: 'Contenido...',
        publicado: true
      }, vetUser);

      const landing = await cmsService.getLandingData();
      expect(landing.secciones.hero).toBeDefined();
      expect(landing.secciones.hero.titulo).toBe('LunaVet Principal');
      expect(landing.serviciosDestacados.length).toBe(1);
      expect(landing.testimonios.length).toBe(1);
      expect(landing.articulosBlog.length).toBe(1);
      expect(landing.clinica.telefonoUrgencias).toBeDefined();
    });

    it('debe subir y transmitir imágenes del CMS como BLOB desacoplado', async () => {
      const fileMock = {
        originalname: 'banner-clinica.jpg',
        mimetype: 'image/jpeg',
        buffer: VALID_JPEG,
        size: VALID_JPEG.length
      };

      const uploaded = await cmsService.uploadCmsImage(fileMock, vetUser);
      expect(uploaded.id).toBeDefined();
      expect(uploaded.url).toBe(`/api/cms/images/${uploaded.id}`);

      // Verificar registro en archivos_adjuntos
      const record = await db('archivos_adjuntos').where('id', uploaded.id).first();
      expect(record.entidad_tipo).toBe('cms_imagen');
      expect(record.nombre_archivo).toBe('banner-clinica.jpg');

      // Non-staff rechazado
      await expect(
        cmsService.uploadCmsImage(fileMock, clientUser)
      ).rejects.toThrow(ForbiddenError);

      // Streaming
      const mockRes = {
        set: jest.fn(),
        end: jest.fn()
      };
      await cmsService.streamCmsImage(uploaded.id, mockRes);
      expect(mockRes.set).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();

      // Streaming con ID inexistente -> NotFoundError
      await expect(
        cmsService.streamCmsImage(99999, mockRes)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
