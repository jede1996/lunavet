const crypto = require('crypto');
const { db } = require('../../config/database');
const config = require('../../config/env');
const auditService = require('../../core/audit.service');
const pdfService = require('../../core/pdf.service');
const petService = require('../pets/pet.service');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../../core/errors');

class CommerceService {
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
  // GESTIÓN DE CATEGORÍAS
  // =========================================================================

  /**
   * Crea una nueva categoría de productos (Solo Administrador).
   */
  async createCategory({ nombre, slug = null, descripcion = null, activo = true }, adminUser) {
    if (!adminUser || !['administrador'].includes(adminUser.rol)) {
      throw new ForbiddenError('Solo los administradores pueden crear categorías de productos.');
    }

    if (!nombre || !nombre.trim()) {
      throw new ValidationError('El nombre de la categoría es obligatorio.');
    }

    const cleanSlug = slug ? this.generateSlug(slug) : this.generateSlug(nombre);
    if (!cleanSlug) {
      throw new ValidationError('El slug de la categoría no es válido.');
    }

    const existing = await db('categorias').where('slug', cleanSlug).first();
    if (existing) {
      throw new ConflictError(`Ya existe una categoría con el slug "${cleanSlug}".`);
    }

    const [id] = await db('categorias').insert({
      nombre: nombre.trim(),
      slug: cleanSlug,
      descripcion: descripcion ? descripcion.trim() : null,
      activo: Boolean(activo)
    });

    return {
      id,
      nombre: nombre.trim(),
      slug: cleanSlug,
      descripcion: descripcion ? descripcion.trim() : null,
      activo: Boolean(activo)
    };
  }

  /**
   * Lista las categorías del catálogo.
   */
  async listCategories({ soloActivas = true } = {}) {
    let query = db('categorias').select('*');
    if (soloActivas) {
      query = query.where('activo', true);
    }
    return query.orderBy('nombre', 'asc');
  }

  /**
   * Actualiza una categoría existente (Solo Administrador).
   */
  async updateCategory(id, { nombre, slug, descripcion, activo } = {}, adminUser) {
    if (!adminUser || !['administrador'].includes(adminUser.rol)) {
      throw new ForbiddenError('Solo los administradores pueden modificar categorías.');
    }

    const category = await db('categorias').where('id', id).first();
    if (!category) {
      throw new NotFoundError('Categoría no encontrada.');
    }

    const updates = {};
    if (nombre !== undefined && nombre !== null) updates.nombre = nombre.trim();
    if (slug !== undefined && slug !== null) {
      const cleanSlug = this.generateSlug(slug);
      const conflict = await db('categorias').where('slug', cleanSlug).andWhereNot('id', id).first();
      if (conflict) {
        throw new ConflictError(`Ya existe otra categoría con el slug "${cleanSlug}".`);
      }
      updates.slug = cleanSlug;
    }
    if (descripcion !== undefined) updates.descripcion = descripcion ? descripcion.trim() : null;
    if (activo !== undefined) updates.activo = Boolean(activo);

    await db('categorias').where('id', id).update(updates);
    return db('categorias').where('id', id).first();
  }

  // =========================================================================
  // GESTIÓN DEL CATÁLOGO DE PRODUCTOS
  // =========================================================================

  /**
   * Registra un nuevo producto (Administrador o Veterinario).
   */
  async createProduct({
    categoriaId,
    nombre,
    slug = null,
    descripcion = null,
    precio,
    imagenUrl = null,
    imagen_url = null,
    requiereReceta = false,
    esControlado = false,
    activo = true
  }, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal veterinario o administrador puede registrar productos.');
    }

    if (!categoriaId || !nombre || precio === undefined) {
      throw new ValidationError('Categoría, nombre y precio son campos obligatorios.');
    }

    const numPrecio = parseFloat(precio);
    if (isNaN(numPrecio) || numPrecio < 0) {
      throw new ValidationError('El precio del producto debe ser un número mayor o igual a cero.');
    }

    const category = await db('categorias').where('id', categoriaId).first();
    if (!category) {
      throw new NotFoundError('La categoría especificada no existe.');
    }

    const cleanSlug = slug ? this.generateSlug(slug) : this.generateSlug(nombre);
    if (!cleanSlug) {
      throw new ValidationError('El slug del producto no es válido.');
    }

    const existing = await db('productos').where('slug', cleanSlug).first();
    if (existing) {
      throw new ConflictError(`Ya existe un producto con el slug "${cleanSlug}".`);
    }

    // Regla de negocio clínica: Todo medicamento controlado exige receta médica forzosamente
    const isControlado = Boolean(esControlado);
    const reqReceta = isControlado ? true : Boolean(requiereReceta);
    const finalImagenUrl = imagenUrl || imagen_url || null;

    const [id] = await db('productos').insert({
      categoria_id: categoriaId,
      nombre: nombre.trim(),
      slug: cleanSlug,
      descripcion: descripcion ? descripcion.trim() : null,
      precio: numPrecio,
      imagen_url: finalImagenUrl,
      requiere_receta: reqReceta,
      es_controlado: isControlado,
      activo: Boolean(activo)
    });

    return {
      id,
      categoriaId,
      nombre: nombre.trim(),
      slug: cleanSlug,
      descripcion: descripcion ? descripcion.trim() : null,
      precio: numPrecio,
      imagen_url: finalImagenUrl,
      requiereReceta: reqReceta,
      esControlado: isControlado,
      activo: Boolean(activo)
    };
  }

  /**
   * Actualiza los datos de un producto (Administrador o Veterinario).
   */
  async updateProduct(id, updates, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal veterinario o administrador puede modificar productos.');
    }

    const product = await db('productos').where('id', id).first();
    if (!product) {
      throw new NotFoundError('Producto no encontrado.');
    }

    const fields = {};
    if (updates.categoriaId !== undefined) {
      const cat = await db('categorias').where('id', updates.categoriaId).first();
      if (!cat) throw new NotFoundError('La categoría especificada no existe.');
      fields.categoria_id = updates.categoriaId;
    }
    if (updates.nombre !== undefined) fields.nombre = updates.nombre.trim();
    if (updates.slug !== undefined) {
      const cleanSlug = this.generateSlug(updates.slug);
      const conflict = await db('productos').where('slug', cleanSlug).andWhereNot('id', id).first();
      if (conflict) {
        throw new ConflictError(`Ya existe otro producto con el slug "${cleanSlug}".`);
      }
      fields.slug = cleanSlug;
    }
    if (updates.descripcion !== undefined) fields.descripcion = updates.descripcion ? updates.descripcion.trim() : null;
    if (updates.precio !== undefined) {
      const numPrecio = parseFloat(updates.precio);
      if (isNaN(numPrecio) || numPrecio < 0) throw new ValidationError('Precio inválido.');
      fields.precio = numPrecio;
    }
    if (updates.imagenUrl !== undefined || updates.imagen_url !== undefined) {
      fields.imagen_url = updates.imagenUrl !== undefined ? updates.imagenUrl : updates.imagen_url;
    }
    if (updates.esControlado !== undefined) {
      fields.es_controlado = Boolean(updates.esControlado);
      if (fields.es_controlado) fields.requiere_receta = true;
    }
    if (updates.requiereReceta !== undefined && !fields.es_controlado) {
      fields.requiere_receta = Boolean(updates.requiereReceta);
    }
    if (updates.activo !== undefined) fields.activo = Boolean(updates.activo);

    await db('productos').where('id', id).update(fields);
    return db('productos').where('id', id).first();
  }

  /**
   * Lista productos con filtro de categorías, búsqueda y cálculo dinámico de stock disponible vigente.
   */
  async listProducts({
    categoriaId = null,
    esControlado = null,
    requiereReceta = null,
    soloActivos = true,
    search = ''
  } = {}) {
    const today = new Date().toISOString().slice(0, 10);

    let query = db('productos')
      .leftJoin('categorias', 'productos.categoria_id', 'categorias.id')
      .leftJoin('lotes', function() {
        this.on('productos.id', '=', 'lotes.producto_id')
          .andOn('lotes.fecha_caducidad', '>=', db.raw('?', [today]))
          .andOn('lotes.stock_disponible', '>', db.raw('?', [0]));
      })
      .select(
        'productos.*',
        'categorias.nombre as categoria_nombre',
        'categorias.slug as categoria_slug'
      )
      .sum({ stock_disponible_total: 'lotes.stock_disponible' })
      .groupBy('productos.id');

    if (soloActivos) {
      query = query.where('productos.activo', true);
    }

    if (categoriaId) {
      query = query.where('productos.categoria_id', categoriaId);
    }

    if (esControlado !== null) {
      query = query.where('productos.es_controlado', Boolean(esControlado));
    }

    if (requiereReceta !== null) {
      query = query.where('productos.requiere_receta', Boolean(requiereReceta));
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(productos.nombre) LIKE ?', [term])
          .orWhereRaw('LOWER(productos.descripcion) LIKE ?', [term]);
      });
    }

    const results = await query.orderBy('productos.nombre', 'asc');
    return results.map(row => ({
      ...row,
      stock_disponible_total: parseInt(row.stock_disponible_total || 0, 10)
    }));
  }

  /**
   * Obtiene el detalle de un producto con sus lotes vigentes y stock consolidado.
   */
  async getProductById(id) {
    const today = new Date().toISOString().slice(0, 10);

    const product = await db('productos')
      .leftJoin('categorias', 'productos.categoria_id', 'categorias.id')
      .where('productos.id', id)
      .select(
        'productos.*',
        'categorias.nombre as categoria_nombre',
        'categorias.slug as categoria_slug'
      )
      .first();

    if (!product) {
      throw new NotFoundError('Producto no encontrado.');
    }

    const lotes = await db('lotes')
      .where('producto_id', id)
      .andWhere('fecha_caducidad', '>=', today)
      .andWhere('stock_disponible', '>', 0)
      .orderBy('fecha_caducidad', 'asc');

    const totalStock = lotes.reduce((acc, l) => acc + l.stock_disponible, 0);

    return {
      ...product,
      stock_disponible_total: totalStock,
      lotes_disponibles: lotes
    };
  }

  // =========================================================================
  // GESTIÓN DE LOTES, CADUCIDAD Y CONTROL DE STOCK (FEFO)
  // =========================================================================

  /**
   * Registra un nuevo lote de producto con fecha de caducidad.
   */
  async createLot({
    productoId,
    numeroLote,
    fechaCaducidad,
    stockDisponible,
    stockMinimoAlerta = 5
  }, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal clínico autorizado puede registrar lotes de inventario.');
    }

    if (!productoId || !numeroLote || !fechaCaducidad || stockDisponible === undefined) {
      throw new ValidationError('Producto, número de lote, fecha de caducidad y stock son obligatorios.');
    }

    const numStock = parseInt(stockDisponible, 10);
    if (isNaN(numStock) || numStock < 0) {
      throw new ValidationError('El stock disponible debe ser un entero mayor o igual a cero.');
    }

    const product = await db('productos').where('id', productoId).first();
    if (!product) {
      throw new NotFoundError('El producto especificado no existe.');
    }

    const cleanLote = numeroLote.trim().toUpperCase();
    const existing = await db('lotes')
      .where('producto_id', productoId)
      .andWhere('numero_lote', cleanLote)
      .first();

    if (existing) {
      throw new ConflictError(`El lote "${cleanLote}" ya está registrado para este producto.`);
    }

    const [id] = await db('lotes').insert({
      producto_id: productoId,
      numero_lote: cleanLote,
      fecha_caducidad: fechaCaducidad,
      stock_disponible: numStock,
      stock_minimo_alerta: parseInt(stockMinimoAlerta, 10) || 5
    });

    if (product.es_controlado) {
      await auditService.log({
        usuarioId: staffUser.id,
        accion: 'LOTE_CONTROLADO_REGISTRADO',
        entidad: 'lotes',
        entidadId: id,
        detalles: { productoId, numeroLote: cleanLote, stockDisponible: numStock, fechaCaducidad },
        nivelCriticidad: 'critico'
      });
    }

    return {
      id,
      productoId,
      numeroLote: cleanLote,
      fechaCaducidad,
      stockDisponible: numStock,
      stockMinimoAlerta: parseInt(stockMinimoAlerta, 10) || 5
    };
  }

  /**
   * Actualiza existencias o parámetros de un lote.
   */
  async updateLot(id, { numeroLote, fechaCaducidad, stockDisponible, stockMinimoAlerta }, staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal clínico autorizado puede modificar lotes.');
    }

    const lot = await db('lotes').where('id', id).first();
    if (!lot) {
      throw new NotFoundError('Lote no encontrado.');
    }

    const product = await db('productos').where('id', lot.producto_id).first();

    const updates = {};
    if (numeroLote !== undefined) updates.numero_lote = numeroLote.trim().toUpperCase();
    if (fechaCaducidad !== undefined) updates.fecha_caducidad = fechaCaducidad;
    if (stockDisponible !== undefined) {
      const num = parseInt(stockDisponible, 10);
      if (isNaN(num) || num < 0) throw new ValidationError('Stock inválido.');
      updates.stock_disponible = num;
    }
    if (stockMinimoAlerta !== undefined) {
      updates.stock_minimo_alerta = parseInt(stockMinimoAlerta, 10) || 0;
    }

    await db('lotes').where('id', id).update(updates);

    if (product && product.es_controlado) {
      await auditService.log({
        usuarioId: staffUser.id,
        accion: 'LOTE_CONTROLADO_ACTUALIZADO',
        entidad: 'lotes',
        entidadId: id,
        detalles: { valoresAnteriores: lot, valoresNuevos: updates },
        nivelCriticidad: 'critico'
      });
    }

    return db('lotes').where('id', id).first();
  }

  /**
   * Consulta alertas de inventario: lotes con stock bajo y/o próximos a caducar.
   */
  async getInventoryAlerts({ diasPorCaducar = 30 } = {}, staffUser) {
    if (!staffUser || !['administrador', 'veterinario', 'recepcionista'].includes(staffUser.rol)) {
      throw new ForbiddenError('Acceso denegado a las alertas de inventario.');
    }

    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + parseInt(diasPorCaducar, 10));

    const todayStr = today.toISOString().slice(0, 10);
    const thresholdStr = thresholdDate.toISOString().slice(0, 10);

    const alerts = await db('lotes')
      .join('productos', 'lotes.producto_id', 'productos.id')
      .select(
        'lotes.*',
        'productos.nombre as producto_nombre',
        'productos.es_controlado',
        'productos.requiere_receta'
      )
      .where(function() {
        this.where('lotes.stock_disponible', '<=', db.ref('lotes.stock_minimo_alerta'))
          .orWhere('lotes.fecha_caducidad', '<=', thresholdStr);
      })
      .orderBy('lotes.fecha_caducidad', 'asc');

    return alerts.map(item => ({
      ...item,
      alerta_stock_bajo: item.stock_disponible <= item.stock_minimo_alerta,
      alerta_caducidad: item.fecha_caducidad <= thresholdStr,
      esta_vencido: item.fecha_caducidad < todayStr
    }));
  }

  // =========================================================================
  // CHECKOUT (CLICK & COLLECT) Y GENERACIÓN DE COMPROBANTE INTERNO
  // =========================================================================

  /**
   * Procesa el checkout de un pedido para Click & Collect.
   * Aplica FEFO en el descuento de inventario y genera comprobante con hash SHA-256 inmutable.
   */
  async checkoutOrder({
    items,
    metodoPago,
    notasCliente = null,
    recetaFolio = null
  }, currentUser, ipOrigen = null, userAgent = null) {
    if (!currentUser) {
      throw new ForbiddenError('Debe iniciar sesión para realizar un pedido.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('El pedido debe contener al menos un producto.');
    }

    if (!['mercadopago', 'spei'].includes(metodoPago)) {
      throw new ValidationError('Método de pago inválido. Solo se acepta "mercadopago" o "spei".');
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Obtener y validar todos los productos solicitados
    const productIds = items.map(i => i.productoId);
    const productsInDb = await db('productos')
      .whereIn('id', productIds)
      .andWhere('activo', true);

    const productMap = new Map();
    productsInDb.forEach(p => productMap.set(p.id, p));

    let requiresPrescription = false;
    let hasControlledProduct = false;

    for (const item of items) {
      if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
        throw new ValidationError('Cada ítem debe indicar un productoId válido y una cantidad mayor a cero.');
      }
      const product = productMap.get(item.productoId);
      if (!product) {
        throw new NotFoundError(`El producto con ID ${item.productoId} no está disponible o no existe.`);
      }
      if (product.requiere_receta) requiresPrescription = true;
      if (product.es_controlado) hasControlledProduct = true;
    }

    // 2. Validación de Receta Médica si algún producto la requiere
    let validatedReceta = null;
    if (requiresPrescription || hasControlledProduct) {
      if (!recetaFolio || !recetaFolio.trim()) {
        throw new ValidationError('Este pedido contiene medicamentos que requieren receta médica válida.');
      }

      validatedReceta = await db('recetas')
        .where('folio', recetaFolio.trim())
        .first();

      if (!validatedReceta) {
        throw new ValidationError(`No se encontró la receta médica con folio "${recetaFolio}".`);
      }

      if (validatedReceta.estado !== 'activa') {
        throw new ValidationError(`La receta médica no está activa (estado actual: ${validatedReceta.estado}).`);
      }

      // Validar vigencia de la receta
      const emision = new Date(validatedReceta.fecha_emision);
      const vigenciaMs = (validatedReceta.vigencia_dias || 30) * 24 * 60 * 60 * 1000;
      const fechaVencimiento = new Date(emision.getTime() + vigenciaMs);
      if (new Date() > fechaVencimiento) {
        throw new ValidationError('La receta médica presentada ha caducado.');
      }

      // Validar titularidad si el comprador es cliente
      if (currentUser.rol === 'cliente') {
        const access = await petService.checkUserPetAccess(validatedReceta.mascota_id, currentUser);
        if (!access.canRead || !access.isOwner) {
          throw new ForbiddenError('La receta médica proporcionada no corresponde a ninguna de sus mascotas registradas.');
        }
      }
    }

    // 3. Verificación de stock disponible por FEFO (First-Expired First-Out)
    const lotDeductionPlan = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productoId);
      let needed = item.cantidad;

      // Obtener lotes vigentes ordenados por fecha de caducidad más próxima
      const availableLots = await db('lotes')
        .where('producto_id', product.id)
        .andWhere('fecha_caducidad', '>=', todayStr)
        .andWhere('stock_disponible', '>', 0)
        .orderBy('fecha_caducidad', 'asc');

      const totalAvailable = availableLots.reduce((acc, l) => acc + l.stock_disponible, 0);
      if (totalAvailable < needed) {
        throw new ConflictError(
          `Stock insuficiente para "${product.nombre}". Disponible: ${totalAvailable}, Solicitado: ${needed}.`
        );
      }

      const itemSubtotal = parseFloat((product.precio * item.cantidad).toFixed(2));
      calculatedTotal += itemSubtotal;

      for (const lot of availableLots) {
        if (needed <= 0) break;
        const take = Math.min(lot.stock_disponible, needed);
        lotDeductionPlan.push({
          pedidoItem: {
            producto_id: product.id,
            lote_id: lot.id,
            cantidad: take,
            precio_unitario: product.precio,
            subtotal: parseFloat((product.precio * take).toFixed(2))
          },
          lotId: lot.id,
          take
        });
        needed -= take;
      }
    }

    calculatedTotal = parseFloat(calculatedTotal.toFixed(2));

    let result;
    await db.transaction(async (trx) => {
      // Generar Folio Único
      const datePart = todayStr.replace(/-/g, '');
      const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      const folio = `PED-${datePart}-${randPart}`;

      // Generar hash criptográfico del comprobante interno de venta
      // Inmutable para trazabilidad fiscal y auditoría interna (sin CFDI según alcance v4.0)
      const rawComprobante = `${folio}|${currentUser.id}|${calculatedTotal.toFixed(2)}|${metodoPago}|${new Date().toISOString()}|${config.jwt.secret}`;
      const comprobanteInternoHash = crypto.createHash('sha256').update(rawComprobante).digest('hex');

      // Determinar estado inicial
      const estadoInicial = 'pendiente_pago';

      const [pedidoId] = await trx('pedidos').insert({
        folio,
        cliente_id: currentUser.id,
        estado: estadoInicial,
        total: calculatedTotal,
        metodo_pago: metodoPago,
        comprobante_interno_hash: comprobanteInternoHash,
        notas_cliente: notasCliente ? notasCliente.trim() : null
      });

      // Insertar items y decrementar stock en lotes
      for (const plan of lotDeductionPlan) {
        await trx('pedidos_items').insert({
          pedido_id: pedidoId,
          ...plan.pedidoItem
        });

        await trx('lotes')
          .where('id', plan.lotId)
          .decrement('stock_disponible', plan.take);
      }

      // Si incluye medicamentos controlados, registrar en cola de validación clínica
      if (hasControlledProduct && validatedReceta) {
        await trx('validaciones_controlados').insert({
          pedido_id: pedidoId,
          receta_id: validatedReceta.id,
          estado: 'pendiente'
        });
      }

      result = {
        id: pedidoId,
        folio,
        clienteId: currentUser.id,
        estado: estadoInicial,
        total: calculatedTotal,
        metodoPago,
        comprobanteInternoHash,
        tieneControlados: hasControlledProduct,
        recetaFolio: recetaFolio || null
      };
    });

    // Auditoría inmutable ejecutada tras el commit de la transacción
    await auditService.log({
      usuarioId: currentUser.id,
      accion: 'PEDIDO_CREADO_CLICK_AND_COLLECT',
      entidad: 'pedidos',
      entidadId: result.id,
      detalles: {
        folio: result.folio,
        total: calculatedTotal,
        metodoPago,
        tieneControlados: hasControlledProduct,
        recetaFolio: recetaFolio || null,
        comprobanteInternoHash: result.comprobanteInternoHash
      },
      ipOrigen,
      userAgent,
      nivelCriticidad: hasControlledProduct ? 'critico' : 'info'
    });

    return result;
  }

  // =========================================================================
  // PASARELA DE PAGOS Y SIMULACIÓN / WEBHOOK (MERCADOPAGO & SPEI)
  // =========================================================================

  /**
   * Inicia la preferencia o intención de pago para un pedido Click & Collect.
   */
  async createPaymentPreference(pedidoId, pasarela, currentUser) {
    if (!['mercadopago', 'spei'].includes(pasarela)) {
      throw new ValidationError('Pasarela no soportada. Use "mercadopago" o "spei".');
    }

    const order = await db('pedidos').where('id', pedidoId).first();
    if (!order) {
      throw new NotFoundError('Pedido no encontrado.');
    }

    if (currentUser.rol === 'cliente' && order.cliente_id !== currentUser.id) {
      throw new ForbiddenError('No tiene autorización para pagar este pedido.');
    }

    if (order.estado !== 'pendiente_pago') {
      throw new ConflictError(`El pedido se encuentra en estado "${order.estado}" y no admite nuevos pagos.`);
    }

    const timestamp = Date.now();
    const transaccionId = `${pasarela.toUpperCase()}-${order.folio}-${timestamp}`;

    await db('pagos').insert({
      pedido_id: order.id,
      pasarela,
      transaccion_id: transaccionId,
      monto: order.total,
      estado: 'pendiente',
      payload_referencia: JSON.stringify({
        folio: order.folio,
        monto: order.total,
        clienteId: order.cliente_id,
        iniciadoEn: new Date().toISOString()
      })
    });

    return {
      transaccionId,
      pedidoId: order.id,
      folio: order.folio,
      monto: order.total,
      pasarela,
      instrucciones: pasarela === 'spei'
        ? {
            banco: 'STP / LunaVet Pay',
            clabeInterbancaria: '646180123456789012',
            concepto: order.folio,
            beneficiario: 'LunaVet Clínica Veterinaria'
          }
        : {
            checkoutUrl: `https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=${transaccionId}`,
            sandboxUrl: `https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=${transaccionId}`
          }
    };
  }

  /**
   * Procesa la notificación (webhook) de una pasarela de pago.
   */
  async handlePaymentWebhook({ transaccionId, pasarela, estado, firmaWebhook = null }, ipOrigen = null) {
    if (!transaccionId || !pasarela || !estado) {
      throw new ValidationError('transaccionId, pasarela y estado son obligatorios en el webhook de pago.');
    }

    // Validación de firma / token secreto de webhook obligatoria (previene bypass de pago y timing attacks)
    if (firmaWebhook) {
      const hashSignature = crypto.createHash('sha256').update(String(firmaWebhook)).digest();
      const hashExpected = crypto.createHash('sha256').update(String(config.payments.webhookSecret)).digest();
      if (!crypto.timingSafeEqual(hashSignature, hashExpected)) {
        throw new ForbiddenError('Firma de autenticación de webhook inválida.');
      }
    } else if (config.isProduction) {
      throw new ForbiddenError('Firma de autenticación de webhook ausente o no suministrada.');
    }

    const pago = await db('pagos')
      .where('transaccion_id', transaccionId)
      .andWhere('pasarela', pasarela)
      .first();

    if (!pago) {
      throw new NotFoundError(`No se encontró el registro de pago para la transacción "${transaccionId}".`);
    }

    if (pago.estado === 'acreditado') {
      return { status: 'ya_acreditado', transaccionId, pedidoId: pago.pedido_id };
    }

    const esAprobado = ['acreditado', 'approved', 'paid'].includes(estado.toLowerCase());

    let result;
    await db.transaction(async (trx) => {
      const nuevoEstadoPago = esAprobado ? 'acreditado' : 'rechazado';

      await trx('pagos')
        .where('id', pago.id)
        .update({
          estado: nuevoEstadoPago
        });

      if (esAprobado) {
        // Verificar si el pedido tiene medicamentos controlados que requieran validación clínica
        const validacionControlado = await trx('validaciones_controlados')
          .where('pedido_id', pago.pedido_id)
          .first();

        let nuevoEstadoPedido = 'listo_recoleccion';
        if (validacionControlado && validacionControlado.estado === 'pendiente') {
          nuevoEstadoPedido = 'validando_receta';
        }

        await trx('pedidos')
          .where('id', pago.pedido_id)
          .update({
            estado: nuevoEstadoPedido
          });

        result = {
          status: 'acreditado',
          transaccionId,
          pedidoId: pago.pedido_id,
          nuevoEstadoPedido
        };
      } else {
        result = {
          status: 'rechazado',
          transaccionId,
          pedidoId: pago.pedido_id
        };
      }
    });

    if (result.status === 'acreditado') {
      await auditService.log({
        usuarioId: null,
        accion: 'PAGO_WEBHOOK_ACREDITADO',
        entidad: 'pagos',
        entidadId: pago.id,
        detalles: {
          transaccionId,
          pasarela,
          monto: pago.monto,
          nuevoEstadoPedido: result.nuevoEstadoPedido
        },
        ipOrigen,
        nivelCriticidad: 'info'
      });
    } else {
      await auditService.log({
        usuarioId: null,
        accion: 'PAGO_WEBHOOK_RECHAZADO',
        entidad: 'pagos',
        entidadId: pago.id,
        detalles: { transaccionId, pasarela, estadoOriginal: estado },
        ipOrigen,
        nivelCriticidad: 'info'
      });
    }

    return result;
  }

  // =========================================================================
  // COLA DE VALIDACIÓN DE MEDICAMENTOS CONTROLADOS
  // =========================================================================

  /**
   * Consulta los pedidos que tienen medicamentos controlados pendientes de validación clínica.
   */
  async listPendingControlledValidations(staffUser) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo veterinarios o administradores pueden acceder a la cola de validación.');
    }

    return db('validaciones_controlados')
      .join('pedidos', 'validaciones_controlados.pedido_id', 'pedidos.id')
      .join('recetas', 'validaciones_controlados.receta_id', 'recetas.id')
      .join('usuarios as clientes', 'pedidos.cliente_id', 'clientes.id')
      .join('mascotas', 'recetas.mascota_id', 'mascotas.id')
      .join('usuarios as veterinarios', 'recetas.veterinario_id', 'veterinarios.id')
      .select(
        'validaciones_controlados.*',
        'pedidos.folio as pedido_folio',
        'pedidos.total as pedido_total',
        'pedidos.estado as pedido_estado',
        'clientes.nombre as cliente_nombre',
        'clientes.email as cliente_email',
        'mascotas.nombre as mascota_nombre',
        'recetas.folio as receta_folio',
        'recetas.fecha_emision as receta_emision',
        'veterinarios.nombre as veterinario_prescriptor'
      )
      .where('validaciones_controlados.estado', 'pendiente')
      .orderBy('validaciones_controlados.id', 'asc');
  }

  /**
   * Valida (aprueba o rechaza) la receta médica para un pedido con medicamentos controlados.
   */
  async validateControlledOrder(pedidoId, { decision, motivoRechazo = null }, staffUser, ipOrigen = null) {
    if (!staffUser || !['administrador', 'veterinario'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo veterinarios o administradores pueden dictaminar recetas de controlados.');
    }

    if (!['aprobar', 'rechazar'].includes(decision)) {
      throw new ValidationError('Decisión inválida. Debe ser "aprobar" o "rechazar".');
    }

    const validacion = await db('validaciones_controlados')
      .where('pedido_id', pedidoId)
      .first();

    if (!validacion) {
      throw new NotFoundError('No existe solicitud de validación de controlados para este pedido.');
    }

    if (validacion.estado !== 'pendiente') {
      throw new ConflictError(`Esta validación ya fue dictaminada previamente como "${validacion.estado}".`);
    }

    const order = await db('pedidos').where('id', pedidoId).first();

    let result;
    await db.transaction(async (trx) => {
      if (decision === 'aprobar') {
        await trx('validaciones_controlados')
          .where('id', validacion.id)
          .update({
            estado: 'aprobada',
            validado_por_id: staffUser.id,
            fecha_validacion: new Date()
          });

        // Si el pedido ya estaba pagado y esperando validación, liberarlo a recolección
        let nuevoEstadoPedido = order.estado;
        if (order.estado === 'validando_receta') {
          nuevoEstadoPedido = 'listo_recoleccion';
          await trx('pedidos').where('id', pedidoId).update({
            estado: 'listo_recoleccion'
          });
        }

        result = { status: 'aprobada', pedidoId, nuevoEstadoPedido };
      } else {
        // Decisión === 'rechazar'
        if (!motivoRechazo || !motivoRechazo.trim()) {
          throw new ValidationError('Debe especificar un motivo clínico o normativo para rechazar la receta.');
        }

        await trx('validaciones_controlados')
          .where('id', validacion.id)
          .update({
            estado: 'rechazada',
            motivo_rechazo: motivoRechazo.trim(),
            validado_por_id: staffUser.id,
            fecha_validacion: new Date()
          });

        // Restaurar stock descontado en los lotes correspondientes
        const items = await trx('pedidos_items').where('pedido_id', pedidoId);
        for (const it of items) {
          if (it.lote_id) {
            await trx('lotes')
              .where('id', it.lote_id)
              .increment('stock_disponible', it.cantidad);
          }
        }

        // Cancelar el pedido
        await trx('pedidos').where('id', pedidoId).update({
          estado: 'cancelado'
        });

        result = { status: 'rechazada', pedidoId, motivoRechazo: motivoRechazo.trim() };
      }
    });

    if (result.status === 'aprobada') {
      await auditService.log({
        usuarioId: staffUser.id,
        accion: 'CONTROLADO_RECETA_APROBADA',
        entidad: 'validaciones_controlados',
        entidadId: validacion.id,
        detalles: { pedidoId, nuevoEstadoPedido: result.nuevoEstadoPedido },
        ipOrigen,
        nivelCriticidad: 'critico'
      });
    } else {
      await auditService.log({
        usuarioId: staffUser.id,
        accion: 'CONTROLADO_RECETA_RECHAZADA',
        entidad: 'validaciones_controlados',
        entidadId: validacion.id,
        detalles: { pedidoId, motivoRechazo: result.motivoRechazo },
        ipOrigen,
        nivelCriticidad: 'critico'
      });
    }

    return result;
  }

  // =========================================================================
  // CONSULTA DE PEDIDOS Y ENTREGA EN CLÍNICA
  // =========================================================================

  /**
   * Lista los pedidos con filtros de cliente o estado.
   */
  async listOrders({ clienteId = null, estado = null, limit = 50, offset = 0 } = {}, currentUser) {
    if (!currentUser) {
      throw new ForbiddenError('Debe iniciar sesión para consultar pedidos.');
    }

    let query = db('pedidos')
      .join('usuarios', 'pedidos.cliente_id', 'usuarios.id')
      .select(
        'pedidos.*',
        'usuarios.nombre as cliente_nombre',
        'usuarios.email as cliente_email'
      );

    if (currentUser.rol === 'cliente') {
      query = query.where('pedidos.cliente_id', currentUser.id);
    } else if (clienteId) {
      query = query.where('pedidos.cliente_id', clienteId);
    }

    if (estado) {
      query = query.where('pedidos.estado', estado);
    }

    return query
      .orderBy('pedidos.id', 'desc')
      .limit(parseInt(limit, 10) || 50)
      .offset(parseInt(offset, 10) || 0);
  }

  /**
   * Obtiene el detalle completo de un pedido con sus ítems, lotes, pagos y comprobante hash.
   */
  async getOrderById(id, currentUser) {
    if (!currentUser) {
      throw new ForbiddenError('Debe iniciar sesión para ver el pedido.');
    }

    const order = await db('pedidos')
      .join('usuarios', 'pedidos.cliente_id', 'usuarios.id')
      .where('pedidos.id', id)
      .select(
        'pedidos.*',
        'usuarios.nombre as cliente_nombre',
        'usuarios.email as cliente_email'
      )
      .first();

    if (!order) {
      throw new NotFoundError('Pedido no encontrado.');
    }

    if (currentUser.rol === 'cliente' && order.cliente_id !== currentUser.id) {
      throw new ForbiddenError('No tiene autorización para ver los detalles de este pedido.');
    }

    const items = await db('pedidos_items')
      .join('productos', 'pedidos_items.producto_id', 'productos.id')
      .leftJoin('lotes', 'pedidos_items.lote_id', 'lotes.id')
      .where('pedidos_items.pedido_id', id)
      .select(
        'pedidos_items.*',
        'productos.nombre as producto_nombre',
        'productos.es_controlado',
        'productos.requiere_receta',
        'lotes.numero_lote',
        'lotes.fecha_caducidad'
      );

    const pagos = await db('pagos').where('pedido_id', id).orderBy('id', 'desc');
    const validacion = await db('validaciones_controlados').where('pedido_id', id).first();

    return {
      ...order,
      items,
      pagos,
      validacion_controlados: validacion || null
    };
  }

  /**
   * Registra la entrega presencial de un pedido Click & Collect en clínica.
   */
  async markOrderDelivered(orderId, staffUser, ipOrigen = null) {
    if (!staffUser || !['administrador', 'veterinario', 'recepcionista'].includes(staffUser.rol)) {
      throw new ForbiddenError('Solo el personal de clínica puede marcar pedidos como entregados.');
    }

    const order = await db('pedidos').where('id', orderId).first();
    if (!order) {
      throw new NotFoundError('Pedido no encontrado.');
    }

    if (order.estado !== 'listo_recoleccion') {
      throw new ConflictError(`El pedido está en estado "${order.estado}". Solo se pueden entregar pedidos en "listo_recoleccion".`);
    }

    await db('pedidos').where('id', orderId).update({
      estado: 'entregado'
    });

    await auditService.log({
      usuarioId: staffUser.id,
      accion: 'PEDIDO_ENTREGADO_CLICK_AND_COLLECT',
      entidad: 'pedidos',
      entidadId: orderId,
      detalles: { estadoAnterior: 'listo_recoleccion', nuevoEstado: 'entregado' },
      ipOrigen,
      nivelCriticidad: 'info'
    });

    return db('pedidos').where('id', orderId).first();
  }

  /**
   * Genera el recibo o comprobante Click & Collect en PDF.
   */
  async getOrderReceiptPdf(orderId, currentUser) {
    const order = await db('pedidos').where('id', orderId).first();
    if (!order) throw new NotFoundError('Pedido no encontrado.');

    if (currentUser.rol === 'cliente' && order.cliente_id !== currentUser.id) {
      throw new ForbiddenError('No tiene permisos para ver este comprobante de compra.');
    }

    const items = await db('pedidos_items')
      .join('productos', 'pedidos_items.producto_id', 'productos.id')
      .where('pedidos_items.pedido_id', orderId)
      .select(
        'productos.nombre',
        'pedidos_items.cantidad',
        'pedidos_items.precio_unitario',
        'pedidos_items.subtotal'
      );

    const cliente = await db('usuarios').where('id', order.cliente_id).first() || {
      nombre: currentUser.nombre,
      apellido: currentUser.apellido,
      email: currentUser.email
    };

    const pdfBuffer = await pdfService.generateOrderReceiptPdf({
      pedido: order,
      items,
      cliente
    });

    return {
      buffer: pdfBuffer,
      mime_type: 'application/pdf',
      nombre_archivo: `recibo_pedido_${order.folio || order.id}.pdf`,
      hash_sha256: crypto.createHash('sha256').update(pdfBuffer).digest('hex')
    };
  }
}

module.exports = new CommerceService();
