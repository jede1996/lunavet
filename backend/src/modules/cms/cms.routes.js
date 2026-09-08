const express = require('express');
const multer = require('multer');
const cmsService = require('./cms.service');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// =========================================================================
// LANDING PAGE CONSOLIDADA Y SECCIONES
// =========================================================================

/**
 * GET /api/cms/landing
 * Retorna todos los datos consolidados para la Landing Page pública.
 */
router.get('/landing', async (req, res, next) => {
  try {
    const data = await cmsService.getLandingData();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cms/sections
 * Lista todas las secciones configuradas en el CMS (Público).
 */
router.get('/sections', async (req, res, next) => {
  try {
    const sections = await cmsService.listSections();
    res.status(200).json({ status: 'success', data: sections });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cms/sections/:key
 * Detalle de una sección específica por su clave única.
 */
router.get('/sections/:key', async (req, res, next) => {
  try {
    const section = await cmsService.getSection(req.params.key);
    res.status(200).json({ status: 'success', data: section });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cms/sections
 * Crea o actualiza una sección del CMS (Solo Administrador).
 */
router.post('/sections', requireAuth, requireRole('administrador'), async (req, res, next) => {
  try {
    const section = await cmsService.upsertSection(req.body, req.user);
    res.status(200).json({ status: 'success', data: section });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// BLOG SEO VETERINARIO
// =========================================================================

/**
 * GET /api/cms/blog
 * Lista artículos del blog con soporte de búsqueda, tags y paginación (Público).
 */
router.get('/blog', async (req, res, next) => {
  try {
    const { search, tag, limit, offset, todos } = req.query;
    const articles = await cmsService.listArticles({
      search,
      tag,
      soloPublicados: todos !== 'true',
      limit: limit ? parseInt(limit, 10) : 10,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.status(200).json({ status: 'success', data: articles });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cms/blog/:slug
 * Consulta un artículo por slug e incrementa visitas (Público).
 */
router.get('/blog/:slug', async (req, res, next) => {
  try {
    const article = await cmsService.getArticleBySlug(req.params.slug);
    res.status(200).json({ status: 'success', data: article });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cms/blog
 * Redacta y publica un artículo de blog (Administrador o Veterinario).
 */
router.post('/blog', requireAuth, requireRole('administrador', 'veterinario'), async (req, res, next) => {
  try {
    const article = await cmsService.createArticle(req.body, req.user);
    res.status(201).json({ status: 'success', data: article });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cms/blog/:id
 * Actualiza un artículo de blog (Administrador o Veterinario).
 */
router.put('/blog/:id', requireAuth, requireRole('administrador', 'veterinario'), async (req, res, next) => {
  try {
    const article = await cmsService.updateArticle(parseInt(req.params.id, 10), req.body, req.user);
    res.status(200).json({ status: 'success', data: article });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cms/blog/:id
 * Elimina un artículo de blog (Solo Administrador).
 */
router.delete('/blog/:id', requireAuth, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await cmsService.deleteArticle(parseInt(req.params.id, 10), req.user);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// TESTIMONIOS DE LA CLÍNICA
// =========================================================================

/**
 * GET /api/cms/testimonials
 * Lista los testimonios de clientes aprobados para la landing (Público).
 */
router.get('/testimonials', async (req, res, next) => {
  try {
    const { todas, limit, offset } = req.query;
    const testimonials = await cmsService.listTestimonials({
      soloVisibles: todas !== 'true',
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.status(200).json({ status: 'success', data: testimonials });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cms/testimonials
 * Envía un testimonio sobre la clínica.
 */
router.post('/testimonials', async (req, res, next) => {
  try {
    // Si viene autenticado lo asociamos, sino se registra con nombre libre
    const currentUser = req.user || null;
    const testimonial = await cmsService.createTestimonial(req.body, currentUser);
    res.status(201).json({ status: 'success', data: testimonial });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/cms/testimonials/:id/visibility
 * Modera la visibilidad de un testimonio (Solo Administrador).
 */
router.patch('/testimonials/:id/visibility', requireAuth, requireRole('administrador'), async (req, res, next) => {
  try {
    const { visibleLanding } = req.body;
    const testimonial = await cmsService.toggleTestimonialVisibility(
      parseInt(req.params.id, 10),
      visibleLanding,
      req.user
    );
    res.status(200).json({ status: 'success', data: testimonial });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// RESEÑAS DE PRODUCTOS
// =========================================================================

/**
 * GET /api/cms/reviews/product/:productId
 * Lista reseñas y promedio de calificación de un producto (Público).
 */
router.get('/reviews/product/:productId', async (req, res, next) => {
  try {
    const reviews = await cmsService.listProductReviews(parseInt(req.params.productId, 10));
    res.status(200).json({ status: 'success', data: reviews });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cms/reviews/product/:productId
 * Publica una reseña sobre un producto (Solo Clientes autenticados).
 */
router.post('/reviews/product/:productId', requireAuth, async (req, res, next) => {
  try {
    const review = await cmsService.createProductReview({
      productoId: parseInt(req.params.productId, 10),
      ...req.body
    }, req.user);
    res.status(201).json({ status: 'success', data: review });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// IMÁGENES DEL CMS (ALMACENAMIENTO BLOB DESACOPLADO)
// =========================================================================

/**
 * POST /api/cms/images
 * Sube una imagen para secciones o artículos (Administrador o Veterinario).
 */
router.post('/images', requireAuth, requireRole('administrador', 'veterinario'), upload.single('imagen'), async (req, res, next) => {
  try {
    const file = req.file;
    const uploaded = await cmsService.uploadCmsImage(file, req.user);
    res.status(201).json({ status: 'success', data: uploaded });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cms/images/:id
 * Transmite en streaming seguro una imagen del CMS (Público).
 */
router.get('/images/:id', async (req, res, next) => {
  try {
    await cmsService.streamCmsImage(parseInt(req.params.id, 10), res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
