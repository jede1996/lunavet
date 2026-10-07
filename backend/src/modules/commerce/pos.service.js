const { db } = require('../../config/database');
const cryptoService = require('../../core/crypto.service');
const { ValidationError } = require('../../core/errors');

class PosService {
  /**
   * Búsqueda unificada en mostrador (productos, servicios clínicos y estética)
   */
  static async buscarItems(queryStr = '') {
    const q = (queryStr || '').trim();

    // Productos activos
    let prodQuery = db('productos as p')
      .leftJoin('lotes as l', 'p.id', 'l.producto_id')
      .where('p.activo', true)
      .groupBy('p.id')
      .select(
        'p.id',
        'p.nombre',
        'p.slug',
        'p.precio',
        'p.requiere_receta',
        'p.es_controlado',
        db.raw('COALESCE(SUM(l.stock_disponible), 0) as stock_total'),
        db.raw("'producto' as tipo_item")
      );

    if (q) {
      prodQuery = prodQuery.where('p.nombre', 'like', `%${q}%`);
    }

    const productos = await prodQuery.limit(20);

    // Servicios activos
    let servQuery = db('servicios')
      .where('activo', true)
      .select(
        'id',
        'nombre',
        'precio',
        'duracion_minutos',
        db.raw('9999 as stock_total'),
        db.raw('false as requiere_receta'),
        db.raw('false as es_controlado'),
        db.raw("'servicio' as tipo_item")
      );

    if (q) {
      servQuery = servQuery.where('nombre', 'like', `%${q}%`);
    }

    const servicios = await servQuery.limit(20);

    return {
      productos,
      servicios
    };
  }

  /**
   * Procesa la venta directa en mostrador unificando cobros y afectando la caja abierta
   */
  static async procesarVenta({
    usuario_id,
    cliente_id,
    items = [],
    metodo_pago = 'efectivo',
    monto_efectivo = 0,
    monto_tarjeta = 0,
    monto_transferencia = 0,
    notas_cliente = ''
  }) {
    if (!usuario_id) {
      throw new ValidationError('El usuario cajero es requerido');
    }
    if (!items || items.length === 0) {
      throw new ValidationError('El carrito de venta no puede estar vacío');
    }

    // Verificar si hay turno de caja abierto
    const turno = await db('cajas_turnos')
      .where({ usuario_id, estado: 'abierta' })
      .first();

    // Calcular total
    let totalCalculado = 0;
    const itemsProcesados = [];

    for (const it of items) {
      const cantidad = parseInt(it.cantidad, 10) || 1;
      const precioUnitario = parseFloat(it.precio_unitario || it.precio);

      if (cantidad <= 0 || isNaN(precioUnitario) || precioUnitario < 0) {
        throw new ValidationError('Cantidad y precio de cada producto deben ser válidos');
      }

      const subtotal = parseFloat((cantidad * precioUnitario).toFixed(2));
      totalCalculado += subtotal;

      // Si es producto con stock, verificar lote disponible
      let loteSeleccionado = null;
      if (it.tipo_item === 'producto' || it.producto_id) {
        const prodId = it.producto_id || it.id;
        const lote = await db('lotes')
          .where('producto_id', prodId)
          .where('stock_disponible', '>=', cantidad)
          .orderBy('fecha_caducidad', 'asc')
          .first();

        if (lote) {
          loteSeleccionado = lote.id;
          // Descontar inventario
          await db('lotes').where({ id: lote.id }).decrement('stock_disponible', cantidad);
        }
      }

      itemsProcesados.push({
        producto_id: it.tipo_item === 'producto' ? (it.producto_id || it.id) : null,
        nombre: it.nombre,
        lote_id: loteSeleccionado,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal
      });
    }

    totalCalculado = parseFloat(totalCalculado.toFixed(2));

    // Validar montos pagados si es pago mixto
    let efectivo = parseFloat(monto_efectivo) || 0;
    let tarjeta = parseFloat(monto_tarjeta) || 0;
    let transferencia = parseFloat(monto_transferencia) || 0;

    if (metodo_pago === 'efectivo') {
      efectivo = totalCalculado;
      tarjeta = 0;
      transferencia = 0;
    } else if (metodo_pago === 'tarjeta') {
      tarjeta = totalCalculado;
      efectivo = 0;
      transferencia = 0;
    } else if (metodo_pago === 'transferencia') {
      transferencia = totalCalculado;
      efectivo = 0;
      tarjeta = 0;
    } else if (metodo_pago === 'mixto') {
      const sumaMixta = parseFloat((efectivo + tarjeta + transferencia).toFixed(2));
      if (Math.abs(sumaMixta - totalCalculado) > 0.01) {
        throw new ValidationError(`La suma de los pagos (${sumaMixta}) no coincide con el total de la venta (${totalCalculado})`);
      }
    }

    // Generar folio único POS
    const folio = `POS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const hashComprobante = cryptoService.sha256(`${folio}|${totalCalculado}|${usuario_id}|${Date.now()}`);

    // Cliente por defecto (mostrador general) si no se envió
    let idClienteFinal = cliente_id;
    if (!idClienteFinal) {
      const clienteGeneral = await db('usuarios').where({ email: 'mostrador@lunavet.lat' }).first();
      if (clienteGeneral) {
        idClienteFinal = clienteGeneral.id;
      } else {
        idClienteFinal = usuario_id; // fallback al cajero
      }
    }

    // Insertar en tabla pedidos
    const [pedidoId] = await db('pedidos').insert({
      folio,
      cliente_id: idClienteFinal,
      estado: 'completado',
      total: totalCalculado,
      metodo_pago,
      comprobante_interno_hash: hashComprobante,
      notas_cliente: notas_cliente ? `[POS MOSTRADOR]: ${notas_cliente}` : '[VENTA EN CAJA POS]',
      creado_en: new Date(),
      actualizado_en: new Date()
    });

    // Insertar items
    for (const item of itemsProcesados) {
      await db('pedidos_items').insert({
        pedido_id: pedidoId,
        producto_id: item.producto_id || 0,
        lote_id: item.lote_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      });
    }

    // Si hay un turno de caja abierto, sumar a sus totales
    if (turno) {
      await db('cajas_turnos').where({ id: turno.id }).update({
        total_ventas_efectivo: db.raw('total_ventas_efectivo + ?', [efectivo]),
        total_ventas_tarjeta: db.raw('total_ventas_tarjeta + ?', [tarjeta]),
        total_ventas_transferencia: db.raw('total_ventas_transferencia + ?', [transferencia]),
        actualizado_en: new Date()
      });
    }

    return {
      pedidoId,
      folio,
      total: totalCalculado,
      metodo_pago,
      desglose_pagos: {
        efectivo,
        tarjeta,
        transferencia
      },
      hash_comprobante: hashComprobante,
      caja_turno_id: turno ? turno.id : null,
      items: itemsProcesados
    };
  }
}

module.exports = PosService;
