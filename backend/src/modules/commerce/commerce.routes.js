const express = require('express');
const commerceService = require('./commerce.service');
const blobService = require('../../core/blob.service');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { ForbiddenError } = require('../../core/errors');

const router = express.Router();

// =========================================================================
// CATEGORÍAS
// =========================================================================

/**
 * GET /api/commerce/categories
 * Catálogo de categorías (Público).
 */
router.get('/categories', async (req, res, next) => {
  try {
    const soloActivas = req.query.todas !== 'true';
    const categories = await commerceService.listCategories({ soloActivas });
    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/commerce/categories
 * Crea una nueva categoría (Solo Administrador).
 */
router.post('/categories', requireAuth, requireRole(['administrador']), async (req, res, next) => {
  try {
    const category = await commerceService.createCategory(req.body, req.user);
    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/commerce/categories/:id
 * Actualiza una categoría existente (Solo Administrador).
 */
router.put('/categories/:id', requireAuth, requireRole(['administrador']), async (req, res, next) => {
  try {
    const category = await commerceService.updateCategory(req.params.id, req.body, req.user);
    res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// PRODUCTOS Y CATÁLOGO
// =========================================================================

/**
 * GET /api/commerce/products
 * Lista productos con filtros y cálculo dinámico de stock disponible (Público).
 */
router.get('/products', async (req, res, next) => {
  try {
    const { categoriaId, esControlado, requiereReceta, search, todas } = req.query;
    const products = await commerceService.listProducts({
      categoriaId: categoriaId ? parseInt(categoriaId, 10) : null,
      esControlado: esControlado !== undefined ? esControlado === 'true' : null,
      requiereReceta: requiereReceta !== undefined ? requiereReceta === 'true' : null,
      soloActivos: todas !== 'true',
      search: search || ''
    });
    res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/commerce/products/:id
 * Detalle de producto con lotes vigentes (Público).
 */
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await commerceService.getProductById(req.params.id);
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/commerce/products
 * Registra un nuevo producto (Administrador o Veterinario).
 */
router.post('/products', requireAuth, requireRole(['administrador', 'veterinario']), async (req, res, next) => {
  try {
    const product = await commerceService.createProduct(req.body, req.user);
    res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/commerce/products/:id
 * Actualiza un producto existente (Administrador o Veterinario).
 */
router.put('/products/:id', requireAuth, requireRole(['administrador', 'veterinario']), async (req, res, next) => {
  try {
    const product = await commerceService.updateProduct(req.params.id, req.body, req.user);
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// LOTES, CADUCIDAD Y CONTROL DE STOCK
// =========================================================================

/**
 * POST /api/commerce/products/:id/lots
 * Registra un lote para un producto con fecha de caducidad.
 */
router.post('/products/:id/lots', requireAuth, requireRole(['administrador', 'veterinario']), async (req, res, next) => {
  try {
    const lot = await commerceService.createLot({
      productoId: parseInt(req.params.id, 10),
      ...req.body
    }, req.user);
    res.status(201).json({ status: 'success', data: lot });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/commerce/lots/:id
 * Actualiza existencias o parámetros de un lote.
 */
router.put('/lots/:id', requireAuth, requireRole(['administrador', 'veterinario']), async (req, res, next) => {
  try {
    const lot = await commerceService.updateLot(req.params.id, req.body, req.user);
    res.status(200).json({ status: 'success', data: lot });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/commerce/inventory/alerts
 * Consulta alertas de stock bajo y lotes por caducar.
 */
router.get('/inventory/alerts', requireAuth, requireRole(['administrador', 'veterinario', 'recepcionista']), async (req, res, next) => {
  try {
    const alerts = await commerceService.getInventoryAlerts(req.query, req.user);
    res.status(200).json({ status: 'success', data: alerts });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// CHECKOUT CLICK & COLLECT Y COMPROBANTE INTERNO
// =========================================================================

/**
 * POST /api/commerce/checkout
 * Genera el pedido Click & Collect, descuenta inventario por FEFO y emite hash de comprobante interno.
 */
router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const order = await commerceService.checkoutOrder(
      req.body,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );
    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/commerce/orders/:id/pay
 * Inicia la preferencia o intención de pago (MercadoPago o SPEI).
 */
router.post('/orders/:id/pay', requireAuth, async (req, res, next) => {
  try {
    const { pasarela } = req.body;
    const payment = await commerceService.createPaymentPreference(
      parseInt(req.params.id, 10),
      pasarela,
      req.user
    );
    res.status(201).json({ status: 'success', data: payment });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/commerce/payments/webhook
 * Recibe la notificación de pago de la pasarela y actualiza estado del pedido.
 */
router.post('/payments/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.query.signature || null;
    if (!signature) {
      throw new ForbiddenError('Firma de autenticación de webhook ausente o no suministrada.');
    }
    const result = await commerceService.handlePaymentWebhook({
      ...req.body,
      firmaWebhook: signature
    }, req.clientIp);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// COLA DE VALIDACIÓN DE MEDICAMENTOS CONTROLADOS
// =========================================================================

/**
 * GET /api/commerce/controlled/queue
 * Cola de pedidos con medicamentos controlados pendientes de dictamen clínico.
 */
router.get('/controlled/queue', requireAuth, requireRole(['administrador', 'veterinario']), async (req, res, next) => {
  try {
    const queue = await commerceService.listPendingControlledValidations(req.user);
    res.status(200).json({ status: 'success', data: queue });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/commerce/orders/:id/validate-controlled
 * Aprueba o rechaza la receta médica de medicamentos controlados.
 */
router.patch('/orders/:id/validate-controlled', requireAuth, requireRole(['administrador', 'veterinario']), async (req, res, next) => {
  try {
    const result = await commerceService.validateControlledOrder(
      parseInt(req.params.id, 10),
      req.body,
      req.user,
      req.clientIp
    );
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

// =========================================================================
// CONSULTA DE PEDIDOS Y ENTREGA EN CLÍNICA
// =========================================================================

/**
 * GET /api/commerce/orders
 * Lista pedidos (clientes ven solo los propios, staff ve todos).
 */
router.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const orders = await commerceService.listOrders(req.query, req.user);
    res.status(200).json({ status: 'success', data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/commerce/orders/:id
 * Detalle completo de un pedido con ítems, pagos y comprobante hash.
 */
router.get('/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await commerceService.getOrderById(parseInt(req.params.id, 10), req.user);
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/commerce/orders/:id/deliver
 * Registra la entrega física del pedido en mostrador de la clínica.
 */
router.patch('/orders/:id/deliver', requireAuth, requireRole(['administrador', 'veterinario', 'recepcionista']), async (req, res, next) => {
  try {
    const order = await commerceService.markOrderDelivered(
      parseInt(req.params.id, 10),
      req.user,
      req.clientIp
    );
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/commerce/orders/:id/receipt-pdf
 * Descarga el comprobante de pedido Click & Collect en PDF.
 */
router.get('/orders/:id/receipt-pdf', requireAuth, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const blobRecord = await commerceService.getOrderReceiptPdf(orderId, req.user);
    blobService.streamBlobResponse(res, blobRecord, false);
  } catch (error) {
    next(error);
  }
});

/**
 * =========================================================================
 * PUNTOS 4A & 4B: PUNTO DE VENTA (POS) Y TURNOS DE CAJA
 * =========================================================================
 */
const PosService = require('./pos.service');
const CashRegisterService = require('./cashRegister.service');
const CASHIER_ROLES = ['administrador', 'recepcionista', 'veterinario'];

// Búsqueda en mostrador POS (productos y servicios)
router.get('/pos/search', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const results = await PosService.buscarItems(req.query.q);
    res.status(200).json({ status: 'success', data: results });
  } catch (error) {
    next(error);
  }
});

// Cobro directo en POS
router.post('/pos/checkout', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const sale = await PosService.procesarVenta({
      ...req.body,
      usuario_id: req.user.id
    });
    res.status(201).json({
      status: 'success',
      message: 'Venta procesada exitosamente en punto de venta.',
      data: sale
    });
  } catch (error) {
    next(error);
  }
});

// Obtener turno activo de caja
router.get('/cash-register/active', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const active = await CashRegisterService.obtenerTurnoActivo(req.user.id);
    res.status(200).json({ status: 'success', data: active });
  } catch (error) {
    next(error);
  }
});

// Abrir turno de caja
router.post('/cash-register/open', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const turno = await CashRegisterService.abrirTurno({
      ...req.body,
      usuario_id: req.user.id
    });
    res.status(201).json({
      status: 'success',
      message: 'Turno de caja aperturado exitosamente.',
      data: turno
    });
  } catch (error) {
    next(error);
  }
});

// Registrar entrada/salida manual de efectivo
router.post('/cash-register/movement', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const mov = await CashRegisterService.registrarMovimiento({
      ...req.body,
      usuario_id: req.user.id
    });
    res.status(201).json({
      status: 'success',
      message: 'Movimiento de caja registrado.',
      data: mov
    });
  } catch (error) {
    next(error);
  }
});

// Arqueo parcial Corte X
router.get('/cash-register/:id/cut-x', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const corteX = await CashRegisterService.calcularCorteX(parseInt(req.params.id, 10));
    res.status(200).json({ status: 'success', data: corteX });
  } catch (error) {
    next(error);
  }
});

// Cierre definitivo Corte Z
router.post('/cash-register/:id/cut-z', requireAuth, requireRole(CASHIER_ROLES), async (req, res, next) => {
  try {
    const corteZ = await CashRegisterService.cerrarTurnoCorteZ(parseInt(req.params.id, 10), req.body);
    res.status(201).json({
      status: 'success',
      message: 'Cierre de caja (Corte Z) finalizado.',
      data: corteZ
    });
  } catch (error) {
    next(error);
  }
});

// Historial de turnos de caja
router.get('/cash-register/history', requireAuth, requireRole(['administrador', 'recepcionista']), async (req, res, next) => {
  try {
    const history = await CashRegisterService.listarTurnosHistorial(req.query);
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
