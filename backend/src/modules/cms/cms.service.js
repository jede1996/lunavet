const { db } = require('../../config/database');
const auditService = require('../../core/audit.service');
const blobService = require('../../core/blob.service');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../../core/errors');

function sanitizeHtmlString(str) {
  if (!str) return '';
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>]/g, '')
    .trim();
}

class CmsService {
  /**
   * Helper para generar slugs a partir de texto.
   */
  generateSlug(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // =========================================================================
  // GESTIÓN DE SECCIONES CMS (LANDING PAGE)
  // =========================================================================

  /**
   * Registra o actualiza una sección del CMS (Solo Administrador).
   */
  async upsertSection({ claveSeccion, titulo, contenidoHtml = null, metadatosJson = null }, adminUser) {
    if (!adminUser || !['administrador'].includes(adminUser.rol)) {
      throw new ForbiddenError('Solo los administradores pueden gestionar secciones del CMS.');
    }

    if (!claveSeccion || !claveSeccion.trim()) {
      throw new ValidationError('La clave de la sección es obligatoria.');
    }

    if (!titulo || !titulo.trim()) {
      throw new ValidationError('El título de la sección es obligatorio.');
    }

    const cleanClave = claveSeccion.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const metadatosStr = metadatosJson
      ? (typeof metadatosJson === 'object' ? JSON.stringify(metadatosJson) : String(metadatosJson))
      : null;

    const existing = await db('cms_secciones').where('clave_seccion', cleanClave).first();

    if (existing) {
      await db('cms_secciones')
        .where('id', existing.id)
        .update({
          titulo: titulo.trim(),
          contenido_html: contenidoHtml ? contenidoHtml.trim() : null,
          metadatos_json: metadatosStr,
          actualizado_por_id: adminUser.id
        });

      await auditService.log({
        usuarioId: adminUser.id,
        accion: 'CMS_SECCION_ACTUALIZADA',
        entidad: 'cms_secciones',
        entidadId: existing.id,
        detalles: { claveSeccion: cleanClave, titulo: titulo.trim() },
        nivelCriticidad: 'info'
      });

      return db('cms_secciones').where('id', existing.id).first();
    }

    const [id] = await db('cms_secciones').insert({
      clave_seccion: cleanClave,
      titulo: titulo.trim(),
      contenido_html: contenidoHtml ? contenidoHtml.trim() : null,
      metadatos_json: metadatosStr,
      actualizado_por_id: adminUser.id
    });

    await auditService.log({
      usuarioId: adminUser.id,
      accion: 'CMS_SECCION_CREADA',
      entidad: 'cms_secciones',
      entidadId: id,
      detalles: { claveSeccion: cleanClave, titulo: titulo.trim() },
      nivelCriticidad: 'info'
    });

    return db('cms_secciones').where('id', id).first();
  }

  /**
   * Obtiene una sección específica por su clave única.
   */
  async getSection(claveSeccion) {
    const cleanClave = claveSeccion.trim().toLowerCase();
    const section = await db('cms_secciones').where('clave_seccion', cleanClave).first();
    if (!section) {
      throw new NotFoundError(`Sección CMS "${cleanClave}" no encontrada.`);
    }

    return {
      ...section,
      metadatos_json: section.metadatos_json ? JSON.parse(section.metadatos_json) : null
    };
  }

  /**
   * Lista todas las secciones configuradas en el CMS.
   */
  async listSections() {
    const sections = await db('cms_secciones').select('*').orderBy('id', 'asc');
    return sections.map(s => ({
      ...s,
      metadatos_json: s.metadatos_json ? JSON.parse(s.metadatos_json) : null
    }));
  }

  // =========================================================================
  // BLOG SEO VETERINARIO
  // =========================================================================

  /**
   * Crea un nuevo artículo de blog optimizado para SEO (Veterinario o Administrador).
   */
  async createArticle({
    titulo,
    slug = null,
    extracto = null,
    contenido,
    metaTitle = null,
    metaDescription = null,
    palabrasClave = null,
    publicado = false
  }, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal clínico o administradores pueden redactar artículos de blog.');
    }

    if (!titulo || !titulo.trim() || !contenido || !contenido.trim()) {
      throw new ValidationError('El título y el contenido del artículo son obligatorios.');
    }

    const cleanSlug = slug ? this.generateSlug(slug) : this.generateSlug(titulo);
    if (!cleanSlug) {
      throw new ValidationError('El slug del artículo no es válido.');
    }

    const existing = await db('blog_articulos').where('slug', cleanSlug).first();
    if (existing) {
      throw new ConflictError(`Ya existe un artículo con el slug "${cleanSlug}".`);
    }

    const isPublicado = Boolean(publicado);
    const fechaPub = isPublicado ? new Date() : null;

    const [id] = await db('blog_articulos').insert({
      titulo: titulo.trim(),
      slug: cleanSlug,
      extracto: extracto ? extracto.trim() : null,
      contenido: contenido.trim(),
      meta_title: metaTitle ? metaTitle.trim() : titulo.trim().slice(0, 150),
      meta_description: metaDescription ? metaDescription.trim() : (extracto ? extracto.trim().slice(0, 255) : null),
      palabras_clave: palabrasClave ? palabrasClave.trim() : null,
      autor_id: staffUser.id,
      publicado: isPublicado,
      fecha_publicacion: fechaPub,
      vistas: 0
    });

    await auditService.log({
      usuarioId: staffUser.id,
      accion: 'BLOG_ARTICULO_CREADO',
      entidad: 'blog_articulos',
      entidadId: id,
      detalles: { titulo: titulo.trim(), slug: cleanSlug, publicado: isPublicado },
      nivelCriticidad: 'info'
    });

    return db('blog_articulos').where('id', id).first();
  }

  /**
   * Actualiza un artículo de blog existente.
   */
  async updateArticle(id, updates, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal clínico o administradores pueden editar artículos.');
    }

    const article = await db('blog_articulos').where('id', id).first();
    if (!article) {
      throw new NotFoundError('Artículo no encontrado.');
    }

    const fields = {};
    if (updates.titulo !== undefined) fields.titulo = updates.titulo.trim();
    if (updates.slug !== undefined && updates.slug !== null) {
      const cleanSlug = this.generateSlug(updates.slug);
      const conflict = await db('blog_articulos').where('slug', cleanSlug).andWhereNot('id', id).first();
      if (conflict) {
        throw new ConflictError(`Ya existe otro artículo con el slug "${cleanSlug}".`);
      }
      fields.slug = cleanSlug;
    }
    if (updates.extracto !== undefined) fields.extracto = updates.extracto ? updates.extracto.trim() : null;
    if (updates.contenido !== undefined) fields.contenido = updates.contenido.trim();
    if (updates.metaTitle !== undefined) fields.meta_title = updates.metaTitle ? updates.metaTitle.trim() : null;
    if (updates.metaDescription !== undefined) fields.meta_description = updates.metaDescription ? updates.metaDescription.trim() : null;
    if (updates.palabrasClave !== undefined) fields.palabras_clave = updates.palabrasClave ? updates.palabrasClave.trim() : null;

    if (updates.publicado !== undefined) {
      const wasPublished = Boolean(article.publicado);
      const willBePublished = Boolean(updates.publicado);
      fields.publicado = willBePublished;
      if (willBePublished && !wasPublished) {
        fields.fecha_publicacion = new Date();
      }
    }

    await db('blog_articulos').where('id', id).update(fields);

    await auditService.log({
      usuarioId: staffUser.id,
      accion: 'BLOG_ARTICULO_ACTUALIZADO',
      entidad: 'blog_articulos',
      entidadId: id,
      detalles: { updates: fields },
      nivelCriticidad: 'info'
    });

    return db('blog_articulos').where('id', id).first();
  }

  /**
   * Elimina un artículo de blog (Solo Administrador).
   */
  async deleteArticle(id, adminUser) {
    if (!adminUser || !['administrador'].includes(adminUser.rol)) {
      throw new ForbiddenError('Solo los administradores pueden eliminar artículos del blog.');
    }

    const article = await db('blog_articulos').where('id', id).first();
    if (!article) {
      throw new NotFoundError('Artículo no encontrado.');
    }

    await db('blog_articulos').where('id', id).del();

    await auditService.log({
      usuarioId: adminUser.id,
      accion: 'BLOG_ARTICULO_ELIMINADO',
      entidad: 'blog_articulos',
      entidadId: id,
      detalles: { titulo: article.titulo, slug: article.slug },
      nivelCriticidad: 'advertencia'
    });

    return { id, eliminado: true };
  }

  /**
   * Lista artículos de blog con paginación, búsqueda por título/contenido y filtro por tag/keyword.
   */
  async listArticles({
    search = '',
    tag = '',
    soloPublicados = true,
    limit = 10,
    offset = 0
  } = {}) {
    let query = db('blog_articulos')
      .join('usuarios', 'blog_articulos.autor_id', 'usuarios.id')
      .select(
        'blog_articulos.*',
        'usuarios.nombre as autor_nombre',
        'usuarios.apellido as autor_apellido',
        'usuarios.cedula_profesional as autor_cedula'
      );

    if (soloPublicados) {
      query = query.where('blog_articulos.publicado', true);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(blog_articulos.titulo) LIKE ?', [term])
          .orWhereRaw('LOWER(blog_articulos.extracto) LIKE ?', [term])
          .orWhereRaw('LOWER(blog_articulos.contenido) LIKE ?', [term]);
      });
    }

    if (tag && tag.trim()) {
      const term = `%${tag.trim().toLowerCase()}%`;
      query = query.whereRaw('LOWER(blog_articulos.palabras_clave) LIKE ?', [term]);
    }

    return query
      .orderBy('blog_articulos.id', 'desc')
      .limit(parseInt(limit, 10) || 10)
      .offset(parseInt(offset, 10) || 0);
  }

  /**
   * Consulta un artículo por su slug único incrementando el contador de visitas.
   */
  async getArticleBySlug(slug, { incrementarVistas = true } = {}) {
    const article = await db('blog_articulos')
      .join('usuarios', 'blog_articulos.autor_id', 'usuarios.id')
      .where('blog_articulos.slug', slug.trim())
      .select(
        'blog_articulos.*',
        'usuarios.nombre as autor_nombre',
        'usuarios.apellido as autor_apellido',
        'usuarios.cedula_profesional as autor_cedula'
      )
      .first();

    if (!article) {
      throw new NotFoundError(`Artículo con slug "${slug}" no encontrado.`);
    }

    if (incrementarVistas) {
      await db('blog_articulos')
        .where('id', article.id)
        .increment('vistas', 1);
      article.vistas = (article.vistas || 0) + 1;
    }

    return article;
  }

  // =========================================================================
  // TESTIMONIOS DE LA CLÍNICA
  // =========================================================================

  /**
   * Registra un testimonio de cliente sobre los servicios de la clínica.
   */
  async createTestimonial({ nombreCliente, comentario, calificacion = 5 }, currentUser = null) {
    if (!nombreCliente || !nombreCliente.trim() || !comentario || !comentario.trim()) {
      throw new ValidationError('Nombre del cliente y comentario son obligatorios.');
    }

    const numCalificacion = parseInt(calificacion, 10);
    if (isNaN(numCalificacion) || numCalificacion < 1 || numCalificacion > 5) {
      throw new ValidationError('La calificación debe ser un entero entre 1 y 5.');
    }

    const cleanNombre = sanitizeHtmlString(nombreCliente);
    const cleanComentario = sanitizeHtmlString(comentario);

    if (!cleanNombre || !cleanComentario) {
      throw new ValidationError('El nombre y el comentario no pueden estar vacíos ni contener código no permitido.');
    }

    const [id] = await db('testimonios').insert({
      cliente_id: currentUser ? currentUser.id : null,
      nombre_cliente: cleanNombre,
      comentario: cleanComentario,
      calificacion: numCalificacion,
      visible_landing: true
    });

    return db('testimonios').where('id', id).first();
  }

  /**
   * Modera la visibilidad de un testimonio en la Landing Page (Solo Administrador).
   */
  async toggleTestimonialVisibility(id, visibleLanding, adminUser) {
    if (!adminUser || !['administrador'].includes(adminUser.rol)) {
      throw new ForbiddenError('Solo los administradores pueden moderar testimonios.');
    }

    const test = await db('testimonios').where('id', id).first();
    if (!test) {
      throw new NotFoundError('Testimonio no encontrado.');
    }

    const isVisible = Boolean(visibleLanding);
    await db('testimonios').where('id', id).update({ visible_landing: isVisible });

    return db('testimonios').where('id', id).first();
  }

  /**
   * Lista testimonios aprobados o en moderación.
   */
  async listTestimonials({ soloVisibles = true, limit = 20, offset = 0 } = {}) {
    let query = db('testimonios').select('*');
    if (soloVisibles) {
      query = query.where('visible_landing', true);
    }

    return query
      .orderBy('calificacion', 'desc')
      .orderBy('id', 'desc')
      .limit(parseInt(limit, 10) || 20)
      .offset(parseInt(offset, 10) || 0);
  }

  // =========================================================================
  // RESEÑAS DE PRODUCTOS DE E-COMMERCE
  // =========================================================================

  /**
   * Publica una reseña y calificación sobre un producto del catálogo.
   */
  async createProductReview({ productoId, comentario, calificacion = 5 }, clientUser) {
    if (!clientUser) {
      throw new ForbiddenError('Debe iniciar sesión para dejar una reseña.');
    }

    if (!productoId || !comentario || !comentario.trim()) {
      throw new ValidationError('El ID del producto y el comentario son requeridos.');
    }

    const numCalificacion = parseInt(calificacion, 10);
    if (isNaN(numCalificacion) || numCalificacion < 1 || numCalificacion > 5) {
      throw new ValidationError('La calificación debe estar entre 1 y 5.');
    }

    const product = await db('productos').where('id', productoId).first();
    if (!product) {
      throw new NotFoundError('El producto especificado no existe.');
    }

    const cleanComentario = sanitizeHtmlString(comentario);
    if (!cleanComentario) {
      throw new ValidationError('El comentario no puede estar vacío ni contener código no permitido.');
    }

    const [id] = await db('resenas').insert({
      producto_id: productoId,
      cliente_id: clientUser.id,
      comentario: cleanComentario,
      calificacion: numCalificacion,
      visible: true
    });

    return db('resenas').where('id', id).first();
  }

  /**
   * Lista reseñas de un producto con métricas de calificación agregada.
   */
  async listProductReviews(productoId, { soloVisibles = true } = {}) {
    let query = db('resenas')
      .join('usuarios', 'resenas.cliente_id', 'usuarios.id')
      .where('resenas.producto_id', productoId)
      .select(
        'resenas.*',
        'usuarios.nombre as cliente_nombre'
      );

    if (soloVisibles) {
      query = query.where('resenas.visible', true);
    }

    const reviews = await query.orderBy('resenas.id', 'desc');

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.calificacion, 0) / totalReviews).toFixed(1))
      : 5.0;

    return {
      productoId: parseInt(productoId, 10),
      promedioCalificacion: avgRating,
      totalResenas: totalReviews,
      resenas: reviews
    };
  }

  // =========================================================================
  // LANDING PAGE CONSOLIDADA Y GESTIÓN DE IMÁGENES BLOB
  // =========================================================================

  /**
   * Endpoint de alto rendimiento que consolida todos los datos necesarios para la Landing Page.
   */
  async getLandingData() {
    const [secciones, servicios, testimonios, articulosRecientes] = await Promise.all([
      this.listSections(),
      db('servicios').where('activo', true).orderBy('precio', 'asc').limit(8),
      this.listTestimonials({ soloVisibles: true, limit: 6 }),
      this.listArticles({ soloPublicados: true, limit: 3 })
    ]);

    // Construir mapa de secciones indexadas por clave para fácil consumo en frontend
    const mapaSecciones = {};
    secciones.forEach((s) => {
      mapaSecciones[s.clave_seccion] = {
        titulo: s.titulo,
        contenidoHtml: s.contenido_html,
        metadatos: s.metadatos_json
      };
    });

    // Leer personalización de identidad de marca si existe en BD
    let customBrand = {};
    if (mapaSecciones['identidad_marca']?.metadatos) {
      try {
        customBrand = typeof mapaSecciones['identidad_marca'].metadatos === 'string'
          ? JSON.parse(mapaSecciones['identidad_marca'].metadatos)
          : mapaSecciones['identidad_marca'].metadatos;
      } catch {
        customBrand = {};
      }
    }

    return {
      secciones: mapaSecciones,
      serviciosDestacados: servicios,
      testimonios,
      articulosBlog: articulosRecientes,
      clinica: {
        nombre: customBrand.nombre || 'Clínica Veterinaria Luna-Vet',
        slogan: customBrand.slogan || '¡Porque no son solo mascotas, sino un miembro importante de nuestra familia!',
        telefonoUrgencias: customBrand.telefonoUrgencias || '+52 744 213 0868',
        whatsapp: customBrand.whatsapp || '7442130868',
        facebookUrl: customBrand.facebookUrl || 'https://www.facebook.com/profile.php?id=100083388274818',
        horarioUrgencias: customBrand.horarioUrgencias || 'Lunes a Sábado 09:00 - 20:00 | Domingos 10:00 - 15:00 | Urgencias WhatsApp 24/7',
        direccion: customBrand.direccion || 'Av. Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero',
        logoTipo: customBrand.logoTipo || 'preset', // 'preset' | 'url' | 'image'
        logoPreset: customBrand.logoPreset || 'luna-cruz', // 'luna-cruz' | 'luna-huella' | 'clinica-corazon' | 'perro-gato' | 'facebook'
        logoUrl: customBrand.logoUrl || 'https://scontent-atl3-2.xx.fbcdn.net/v/t39.30808-1/471619516_578149974974607_1140347807826735240_n.jpg?stp=dst-jpg_tt6&cstp=mx500x500&ctp=s500x500&_nc_cat=101&ccb=1-7&_nc_sid=3ab345&_nc_ohc=uO5k8dJ3pwoQ7kNvwHGya_D&_nc_oc=AdoARYGMP21Rbb6UjW6619PP0VqIoCPby9WPyMXIeQOSyuBzB45Q0nr3zaPWI805aBY&_nc_zt=24&_nc_ht=scontent-atl3-2.xx&_nc_gid=MDVZCpayivw3aWvOOYqOPw&_nc_ss=7b20f&oh=00_AQKSfmi7NHGfyC8oBO2gLXAmXvxkI_fcKFZ5EEtMBWA6TA&oe=6AA40C40',
        faviconTipo: customBrand.faviconTipo || 'sync',
        faviconPreset: customBrand.faviconPreset || 'luna-huella',
        faviconUrl: customBrand.faviconUrl || ''
      }
    };
  }

  /**
   * Almacena una imagen del CMS desacoplada en MySQL como BLOB.
   */
  async uploadCmsImage(file, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal autorizado puede subir imágenes para el CMS.');
    }

    const validated = blobService.validateFile(file);

    const [id] = await db('archivos_adjuntos').insert({
      entidad_tipo: 'cms_imagen',
      entidad_id: 0, // Se asociará a una sección o artículo
      nombre_archivo: validated.filename,
      mime_type: validated.mimeType,
      tamano_bytes: validated.size,
      hash_sha256: validated.hashSha256,
      buffer_datos: validated.buffer,
      subido_por_id: staffUser.id
    });

    return {
      id,
      nombreArchivo: validated.filename,
      mimeType: validated.mimeType,
      tamanoBytes: validated.size,
      url: `/api/cms/images/${id}`
    };
  }

  /**
   * Envía en streaming HTTP una imagen del CMS.
   */
  async streamCmsImage(id, res) {
    const record = await db('archivos_adjuntos')
      .where('id', id)
      .andWhere('entidad_tipo', 'cms_imagen')
      .first();

    if (!record) {
      throw new NotFoundError('Imagen no encontrada.');
    }

    const blobRecord = {
      buffer: Buffer.isBuffer(record.buffer_datos)
        ? record.buffer_datos
        : Buffer.from(record.buffer_datos),
      mime_type: record.mime_type,
      nombre_archivo: record.nombre_archivo,
      hash_sha256: record.hash_sha256
    };

    blobService.streamBlobResponse(res, blobRecord, false);
  }
}

module.exports = new CmsService();
