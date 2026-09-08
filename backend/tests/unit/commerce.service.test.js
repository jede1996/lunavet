const commerceService = require('../../src/modules/commerce/commerce.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const config = require('../../src/config/env');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../../src/core/errors');

describe('CommerceService - E-Commerce, Controlados, Lotes FEFO y Pagos', () => {
  let adminUser;
  let vetUser;
  let clientUser;
  let strangerUser;
  let receptionistUser;

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('pagos').del();
    await db('validaciones_controlados').del();
    await db('pedidos_items').del();
    await db('pedidos').del();
    await db('lotes').del();
    await db('productos').del();
    await db('categorias').del();
    await db('recetas_items').del();
    await db('recetas').del();
    await db('usuarios_mascotas').del();
    await db('mascotas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();

    const [aId] = await db('usuarios').insert({
      email: 'admin@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Admin',
      apellido: 'Principal',
      rol: 'administrador',
      activo: true
    });
    adminUser = { id: aId, rol: 'administrador' };

    const [vId] = await db('usuarios').insert({
      email: 'dr.vet@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Carlos',
      apellido: 'Mendez',
      rol: 'veterinario',
      cedula_profesional: 'CED-9988',
      activo: true
    });
    vetUser = { id: vId, rol: 'veterinario' };

    const [rId] = await db('usuarios').insert({
      email: 'recepcion@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Lucia',
      apellido: 'Recepcionista',
      rol: 'recepcionista',
      activo: true
    });
    receptionistUser = { id: rId, rol: 'recepcionista' };

    const [cId] = await db('usuarios').insert({
      email: 'cliente@test.com',
      password_hash: 'hash',
      nombre: 'Mario',
      apellido: 'Gomez',
      rol: 'cliente',
      activo: true
    });
    clientUser = { id: cId, rol: 'cliente' };

    const [sId] = await db('usuarios').insert({
      email: 'extrano@test.com',
      password_hash: 'hash',
      nombre: 'Extrano',
      apellido: 'User',
      rol: 'cliente',
      activo: true
    });
    strangerUser = { id: sId, rol: 'cliente' };
  });

  describe('Categorías de E-Commerce', () => {
    it('debe permitir a un administrador crear categorías y listar activas', async () => {
      const cat = await commerceService.createCategory({
        nombre: 'Alimentos Premium',
        descripcion: 'Croquetas de prescripción y dieta especial'
      }, adminUser);

      expect(cat.id).toBeDefined();
      expect(cat.slug).toBe('alimentos-premium');

      const list = await commerceService.listCategories();
      expect(list.length).toBe(1);
      expect(list[0].nombre).toBe('Alimentos Premium');
    });

    it('debe rechazar la creación de categoría por un rol no autorizado', async () => {
      await expect(
        commerceService.createCategory({ nombre: 'Juguetes' }, vetUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        commerceService.createCategory({ nombre: 'Juguetes' }, clientUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('debe rechazar slug duplicado y validar nombres vacíos', async () => {
      await commerceService.createCategory({ nombre: 'Medicinas' }, adminUser);

      await expect(
        commerceService.createCategory({ nombre: 'Medicinas' }, adminUser)
      ).rejects.toThrow(ConflictError);

      await expect(
        commerceService.createCategory({ nombre: '   ' }, adminUser)
      ).rejects.toThrow(ValidationError);
    });

    it('debe actualizar una categoría y validar conflicto de slug', async () => {
      const cat1 = await commerceService.createCategory({ nombre: 'Farmacia' }, adminUser);
      await commerceService.createCategory({ nombre: 'Higiene' }, adminUser);

      const updated = await commerceService.updateCategory(cat1.id, {
        nombre: 'Farmacia Veterinaria',
        activo: false
      }, adminUser);

      expect(updated.nombre).toBe('Farmacia Veterinaria');
      expect(Boolean(updated.activo)).toBe(false);

      // Conflicto de slug con cat2
      await expect(
        commerceService.updateCategory(cat1.id, { slug: 'higiene' }, adminUser)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('Catálogo de Productos', () => {
    let catId;

    beforeEach(async () => {
      const cat = await commerceService.createCategory({ nombre: 'Farmacia' }, adminUser);
      catId = cat.id;
    });

    it('debe permitir a un veterinario registrar un medicamento normal y uno controlado', async () => {
      const pNormal = await commerceService.createProduct({
        categoriaId: catId,
        nombre: 'Amoxicilina 500mg',
        precio: 150.50,
        requiereReceta: true,
        esControlado: false
      }, vetUser);

      expect(pNormal.id).toBeDefined();
      expect(pNormal.slug).toBe('amoxicilina-500mg');
      expect(pNormal.requiereReceta).toBe(true);
      expect(pNormal.esControlado).toBe(false);

      const pControlado = await commerceService.createProduct({
        categoriaId: catId,
        nombre: 'Fenobarbital 100mg',
        precio: 350.00,
        esControlado: true // Debe forzar requiere_receta = true
      }, adminUser);

      expect(pControlado.esControlado).toBe(true);
      expect(pControlado.requiereReceta).toBe(true);
    });

    it('debe rechazar registro de productos por recepcionista o cliente', async () => {
      await expect(
        commerceService.createProduct({
          categoriaId: catId,
          nombre: 'Pelota',
          precio: 50
        }, receptionistUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('debe validar precio inválido y categorías inexistentes', async () => {
      await expect(
        commerceService.createProduct({
          categoriaId: 9999,
          nombre: 'Producto X',
          precio: 100
        }, vetUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.createProduct({
          categoriaId: catId,
          nombre: 'Producto X',
          precio: -10
        }, vetUser)
      ).rejects.toThrow(ValidationError);
    });

    it('debe listar productos con cálculo consolidado de stock unexpired y búsqueda', async () => {
      const p = await commerceService.createProduct({
        categoriaId: catId,
        nombre: 'Antipulgas Pipeta',
        precio: 200
      }, vetUser);

      // Crear lotes: 1 vigente y 1 vencido
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2);

      await commerceService.createLot({
        productoId: p.id,
        numeroLote: 'LOTE-VIGENTE-1',
        fechaCaducidad: futureDate.toISOString().slice(0, 10),
        stockDisponible: 15
      }, vetUser);

      await commerceService.createLot({
        productoId: p.id,
        numeroLote: 'LOTE-VENCIDO-1',
        fechaCaducidad: pastDate.toISOString().slice(0, 10),
        stockDisponible: 20
      }, vetUser);

      const products = await commerceService.listProducts({ search: 'Antipulgas' });
      expect(products.length).toBe(1);
      // Solo el lote vigente (15) debe sumarse al stock disponible total
      expect(products[0].stock_disponible_total).toBe(15);

      const detail = await commerceService.getProductById(p.id);
      expect(detail.stock_disponible_total).toBe(15);
      expect(detail.lotes_disponibles.length).toBe(1);
      expect(detail.lotes_disponibles[0].numero_lote).toBe('LOTE-VIGENTE-1');
    });

    it('debe permitir actualizar un producto y validar conflictos de slug o categorías inexistentes', async () => {
      const p = await commerceService.createProduct({
        categoriaId: catId,
        nombre: 'Pomada Cicatrizante',
        precio: 90
      }, vetUser);

      const updated = await commerceService.updateProduct(p.id, {
        nombre: 'Pomada Cicatrizante Forte',
        precio: 110,
        esControlado: true,
        descripcion: 'Uso tópico avanzado'
      }, vetUser);

      expect(updated.nombre).toBe('Pomada Cicatrizante Forte');
      expect(updated.precio).toBe(110);
      expect(Boolean(updated.es_controlado)).toBe(true);
      expect(Boolean(updated.requiere_receta)).toBe(true);

      // Conflictos y validaciones de actualización
      await expect(
        commerceService.updateProduct(99999, { nombre: 'X' }, vetUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.updateProduct(p.id, { categoriaId: 99999 }, vetUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.updateProduct(p.id, { precio: -5 }, vetUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.updateProduct(p.id, { nombre: 'X' }, clientUser)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Control de Lotes y Alertas de Inventario', () => {
    let prodId;

    beforeEach(async () => {
      const cat = await commerceService.createCategory({ nombre: 'Antibióticos' }, adminUser);
      const prod = await commerceService.createProduct({
        categoriaId: cat.id,
        nombre: 'Ketamina 10ml',
        precio: 500,
        esControlado: true
      }, adminUser);
      prodId = prod.id;
    });

    it('debe registrar lotes de medicamentos controlados y emitir bitácora crítica', async () => {
      const lot = await commerceService.createLot({
        productoId: prodId,
        numeroLote: 'KETA-2026-A',
        fechaCaducidad: '2027-12-31',
        stockDisponible: 10,
        stockMinimoAlerta: 3
      }, vetUser);

      expect(lot.id).toBeDefined();
      expect(lot.numeroLote).toBe('KETA-2026-A');

      const audit = await db('bitacora_auditoria')
        .where('accion', 'LOTE_CONTROLADO_REGISTRADO')
        .first();
      expect(audit).toBeDefined();
      expect(audit.nivel_criticidad).toBe('critico');
    });

    it('debe rechazar duplicación de número de lote para el mismo producto', async () => {
      await commerceService.createLot({
        productoId: prodId,
        numeroLote: 'KETA-LOTE-1',
        fechaCaducidad: '2027-12-31',
        stockDisponible: 5
      }, vetUser);

      await expect(
        commerceService.createLot({
          productoId: prodId,
          numeroLote: 'KETA-LOTE-1',
          fechaCaducidad: '2027-12-31',
          stockDisponible: 8
        }, vetUser)
      ).rejects.toThrow(ConflictError);
    });

    it('debe alertar lotes con stock bajo y próximos a caducar', async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 10);

      await commerceService.createLot({
        productoId: prodId,
        numeroLote: 'EXP-SOON',
        fechaCaducidad: soon.toISOString().slice(0, 10),
        stockDisponible: 2,
        stockMinimoAlerta: 5
      }, adminUser);

      const alerts = await commerceService.getInventoryAlerts({ diasPorCaducar: 30 }, receptionistUser);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      const alert = alerts.find(a => a.numero_lote === 'EXP-SOON');
      expect(alert.alerta_stock_bajo).toBe(true);
      expect(alert.alerta_caducidad).toBe(true);
    });

    it('debe permitir actualizar un lote existente y auditar si es controlado', async () => {
      const lot = await commerceService.createLot({
        productoId: prodId,
        numeroLote: 'KETA-UP-1',
        fechaCaducidad: '2027-01-01',
        stockDisponible: 10
      }, adminUser);

      const updated = await commerceService.updateLot(lot.id, {
        stockDisponible: 20,
        stockMinimoAlerta: 8
      }, vetUser);

      expect(updated.stock_disponible).toBe(20);
      expect(updated.stock_minimo_alerta).toBe(8);

      await expect(
        commerceService.updateLot(99999, { stockDisponible: 5 }, vetUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.updateLot(lot.id, { stockDisponible: -1 }, vetUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.updateLot(lot.id, { stockDisponible: 5 }, clientUser)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Checkout Click & Collect, FEFO y Comprobante Hash', () => {
    let normalProdId;
    let controlledProdId;
    let petId;
    let activeRecetaFolio;

    beforeEach(async () => {
      const cat = await commerceService.createCategory({ nombre: 'Farmacia' }, adminUser);

      const p1 = await commerceService.createProduct({
        categoriaId: cat.id,
        nombre: 'Shampoo Medicado',
        precio: 180.00
      }, adminUser);
      normalProdId = p1.id;

      const p2 = await commerceService.createProduct({
        categoriaId: cat.id,
        nombre: 'Tramadol Gotas 20ml',
        precio: 250.00,
        esControlado: true
      }, adminUser);
      controlledProdId = p2.id;

      // Crear 2 lotes con distintas fechas de caducidad para probar FEFO
      const exp1 = new Date(); exp1.setMonth(exp1.getMonth() + 3);
      const exp2 = new Date(); exp2.setMonth(exp2.getMonth() + 6);

      await commerceService.createLot({
        productoId: normalProdId,
        numeroLote: 'SHAMP-LOT-EARLY',
        fechaCaducidad: exp1.toISOString().slice(0, 10),
        stockDisponible: 5
      }, adminUser);

      await commerceService.createLot({
        productoId: normalProdId,
        numeroLote: 'SHAMP-LOT-LATER',
        fechaCaducidad: exp2.toISOString().slice(0, 10),
        stockDisponible: 10
      }, adminUser);

      await commerceService.createLot({
        productoId: controlledProdId,
        numeroLote: 'TRAMA-LOT-1',
        fechaCaducidad: exp2.toISOString().slice(0, 10),
        stockDisponible: 10
      }, adminUser);

      // Crear mascota del cliente
      const [mId] = await db('mascotas').insert({
        nombre: 'Rocco',
        especie: 'perro',
        raza: 'Labrador',
        sexo: 'macho',
        fecha_nacimiento: '2022-01-01'
      });
      petId = mId;
      await db('usuarios_mascotas').insert({
        usuario_id: clientUser.id,
        mascota_id: petId,
        es_propietario_principal: true
      });

      // Crear receta médica activa para la mascota
      activeRecetaFolio = 'REC-TEST-2026-001';
      await db('recetas').insert({
        folio: activeRecetaFolio,
        veterinario_id: vetUser.id,
        mascota_id: petId,
        fecha_emision: new Date().toISOString().slice(0, 10),
        vigencia_dias: 30,
        firma_digital_hash: 'hash-firma-digital-mock',
        estado: 'activa'
      });
    });

    it('debe realizar checkout exitoso aplicando FEFO para descontar inventario y emitir hash', async () => {
      // Pedimos 8 unidades: debe consumir 5 de SHAMP-LOT-EARLY y 3 de SHAMP-LOT-LATER
      const order = await commerceService.checkoutOrder({
        items: [{ productoId: normalProdId, cantidad: 8 }],
        metodoPago: 'mercadopago',
        notasCliente: 'Recoger el sábado por la mañana'
      }, clientUser);

      expect(order.id).toBeDefined();
      expect(order.folio).toMatch(/^PED-\d{8}-[A-F0-9]{6}$/);
      expect(order.total).toBe(1440.00); // 8 * 180
      expect(order.estado).toBe('pendiente_pago');
      expect(order.comprobanteInternoHash).toBeDefined();
      expect(order.comprobanteInternoHash.length).toBe(64); // SHA-256

      // Verificar deducción FEFO
      const lotEarly = await db('lotes').where('numero_lote', 'SHAMP-LOT-EARLY').first();
      const lotLater = await db('lotes').where('numero_lote', 'SHAMP-LOT-LATER').first();
      expect(lotEarly.stock_disponible).toBe(0);
      expect(lotLater.stock_disponible).toBe(7); // 10 - 3

      // Verificar ítems asociados
      const items = await db('pedidos_items').where('pedido_id', order.id);
      expect(items.length).toBe(2);
      expect(items[0].cantidad).toBe(5);
      expect(items[1].cantidad).toBe(3);
    });

    it('debe rechazar el pedido si no hay stock suficiente', async () => {
      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: normalProdId, cantidad: 999 }],
          metodoPago: 'spei'
        }, clientUser)
      ).rejects.toThrow(ConflictError);
    });

    it('debe exigir receta activa para medicamentos controlados y encolar validación clínica', async () => {
      // Intento sin receta
      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: controlledProdId, cantidad: 1 }],
          metodoPago: 'mercadopago'
        }, clientUser)
      ).rejects.toThrow(ValidationError);

      // Intento con receta de mascota ajena (extraño)
      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: controlledProdId, cantidad: 1 }],
          metodoPago: 'mercadopago',
          recetaFolio: activeRecetaFolio
        }, strangerUser)
      ).rejects.toThrow(ForbiddenError);

      // Compra exitosa por el dueño legítimo
      const order = await commerceService.checkoutOrder({
        items: [{ productoId: controlledProdId, cantidad: 2 }],
        metodoPago: 'spei',
        recetaFolio: activeRecetaFolio
      }, clientUser);

      expect(order.tieneControlados).toBe(true);

      // Verificar encolamiento en validaciones_controlados
      const val = await db('validaciones_controlados').where('pedido_id', order.id).first();
      expect(val).toBeDefined();
      expect(val.estado).toBe('pendiente');

      // Verificar bitácora de auditoría crítica
      const audit = await db('bitacora_auditoria')
        .where('accion', 'PEDIDO_CREADO_CLICK_AND_COLLECT')
        .andWhere('entidad_id', order.id)
        .first();
      expect(audit).toBeDefined();
      expect(audit.nivel_criticidad).toBe('critico');
    });

    it('debe validar items vacíos, productos inactivos o cantidades menores a 1', async () => {
      await expect(
        commerceService.checkoutOrder({ items: [] }, clientUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: 9999, cantidad: 1 }],
          metodoPago: 'spei'
        }, clientUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: normalProdId, cantidad: 0 }],
          metodoPago: 'spei'
        }, clientUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: normalProdId, cantidad: 1 }],
          metodoPago: 'transferencia_invalida'
        }, clientUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: normalProdId, cantidad: 1 }],
          metodoPago: 'spei'
        }, null)
      ).rejects.toThrow(ForbiddenError);

      // Receta inexistente
      await expect(
        commerceService.checkoutOrder({
          items: [{ productoId: controlledProdId, cantidad: 1 }],
          metodoPago: 'spei',
          recetaFolio: 'RECETA-INVENTADA-999'
        }, clientUser)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Pasarela de Pagos y Webhook (MercadoPago y SPEI)', () => {
    let orderNormalId;
    let orderControlledId;

    beforeEach(async () => {
      const cat = await commerceService.createCategory({ nombre: 'Alimentos' }, adminUser);
      const p1 = await commerceService.createProduct({
        categoriaId: cat.id,
        nombre: 'Lata Paté',
        precio: 60.00
      }, adminUser);

      const p2 = await commerceService.createProduct({
        categoriaId: cat.id,
        nombre: 'Analgésico Controlado',
        precio: 100.00,
        esControlado: true
      }, adminUser);

      await commerceService.createLot({
        productoId: p1.id,
        numeroLote: 'L-1',
        fechaCaducidad: '2028-01-01',
        stockDisponible: 20
      }, adminUser);

      await commerceService.createLot({
        productoId: p2.id,
        numeroLote: 'L-2',
        fechaCaducidad: '2028-01-01',
        stockDisponible: 20
      }, adminUser);

      const [mId] = await db('mascotas').insert({
        nombre: 'Luna',
        especie: 'gato',
        raza: 'Común',
        sexo: 'hembra',
        fecha_nacimiento: '2021-01-01'
      });
      await db('usuarios_mascotas').insert({
        usuario_id: clientUser.id,
        mascota_id: mId,
        es_propietario_principal: true
      });

      await db('recetas').insert({
        folio: 'REC-CONTROL-LUNA',
        veterinario_id: vetUser.id,
        mascota_id: mId,
        fecha_emision: new Date().toISOString().slice(0, 10),
        vigencia_dias: 30,
        firma_digital_hash: 'hash-firma',
        estado: 'activa'
      });

      const o1 = await commerceService.checkoutOrder({
        items: [{ productoId: p1.id, cantidad: 2 }],
        metodoPago: 'spei'
      }, clientUser);
      orderNormalId = o1.id;

      const o2 = await commerceService.checkoutOrder({
        items: [{ productoId: p2.id, cantidad: 1 }],
        metodoPago: 'mercadopago',
        recetaFolio: 'REC-CONTROL-LUNA'
      }, clientUser);
      orderControlledId = o2.id;
    });

    it('debe generar preferencia de pago SPEI y MercadoPago', async () => {
      const prefSpei = await commerceService.createPaymentPreference(orderNormalId, 'spei', clientUser);
      expect(prefSpei.transaccionId).toMatch(/^SPEI-/);
      expect(prefSpei.instrucciones.clabeInterbancaria).toBeDefined();

      const prefMp = await commerceService.createPaymentPreference(orderControlledId, 'mercadopago', clientUser);
      expect(prefMp.transaccionId).toMatch(/^MERCADOPAGO-/);
      expect(prefMp.instrucciones.checkoutUrl).toBeDefined();
    });

    it('debe procesar webhook acreditado para pedido regular y mover a "listo_recoleccion"', async () => {
      const pref = await commerceService.createPaymentPreference(orderNormalId, 'spei', clientUser);

      const webhookResult = await commerceService.handlePaymentWebhook({
        transaccionId: pref.transaccionId,
        pasarela: 'spei',
        estado: 'acreditado',
        firmaWebhook: config.payments.webhookSecret
      });

      expect(webhookResult.status).toBe('acreditado');
      expect(webhookResult.nuevoEstadoPedido).toBe('listo_recoleccion');

      const updatedOrder = await db('pedidos').where('id', orderNormalId).first();
      expect(updatedOrder.estado).toBe('listo_recoleccion');

      // Prueba de idempotencia si el webhook se dispara dos veces
      const secondWebhook = await commerceService.handlePaymentWebhook({
        transaccionId: pref.transaccionId,
        pasarela: 'spei',
        estado: 'acreditado'
      });
      expect(secondWebhook.status).toBe('ya_acreditado');
    });

    it('debe procesar webhook para pedido controlado y mover a "validando_receta" en vez de recolección inmediata', async () => {
      const pref = await commerceService.createPaymentPreference(orderControlledId, 'mercadopago', clientUser);

      const webhookResult = await commerceService.handlePaymentWebhook({
        transaccionId: pref.transaccionId,
        pasarela: 'mercadopago',
        estado: 'approved'
      });

      expect(webhookResult.status).toBe('acreditado');
      expect(webhookResult.nuevoEstadoPedido).toBe('validando_receta');

      const updatedOrder = await db('pedidos').where('id', orderControlledId).first();
      expect(updatedOrder.estado).toBe('validando_receta');
    });

    it('debe rechazar webhook con firma no coincidente', async () => {
      await expect(
        commerceService.handlePaymentWebhook({
          transaccionId: 'TRX-FAKED',
          pasarela: 'spei',
          estado: 'acreditado',
          firmaWebhook: 'firma-invalida'
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('debe validar errores en pasarela de pago y webhook', async () => {
      await expect(
        commerceService.createPaymentPreference(99999, 'spei', clientUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.createPaymentPreference(orderNormalId, 'bitcoin', clientUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.createPaymentPreference(orderNormalId, 'spei', strangerUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        commerceService.handlePaymentWebhook({ transaccionId: null, pasarela: 'spei', estado: 'acreditado' })
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.handlePaymentWebhook({ transaccionId: 'NON-EXISTENT', pasarela: 'spei', estado: 'acreditado' })
      ).rejects.toThrow(NotFoundError);

      // Webhook con pago rechazado
      const pref = await commerceService.createPaymentPreference(orderNormalId, 'spei', clientUser);
      const resReject = await commerceService.handlePaymentWebhook({
        transaccionId: pref.transaccionId,
        pasarela: 'spei',
        estado: 'rejected'
      });
      expect(resReject.status).toBe('rechazado');
    });
  });

  describe('Dictamen Clínico de Medicamentos Controlados y Entrega', () => {
    let orderId;
    let controlledLotId;

    beforeEach(async () => {
      const cat = await commerceService.createCategory({ nombre: 'Controlados' }, adminUser);
      const prod = await commerceService.createProduct({
        categoriaId: cat.id,
        nombre: 'Morfina Solución',
        precio: 400.00,
        esControlado: true
      }, adminUser);

      const lot = await commerceService.createLot({
        productoId: prod.id,
        numeroLote: 'MORF-2026',
        fechaCaducidad: '2028-01-01',
        stockDisponible: 10
      }, adminUser);
      controlledLotId = lot.id;

      const [mId] = await db('mascotas').insert({
        nombre: 'Sol',
        especie: 'perro',
        raza: 'Pastor',
        sexo: 'macho',
        fecha_nacimiento: '2020-01-01'
      });
      await db('usuarios_mascotas').insert({
        usuario_id: clientUser.id,
        mascota_id: mId,
        es_propietario_principal: true
      });

      await db('recetas').insert({
        folio: 'REC-MORF-SOL',
        veterinario_id: vetUser.id,
        mascota_id: mId,
        fecha_emision: new Date().toISOString().slice(0, 10),
        vigencia_dias: 30,
        firma_digital_hash: 'hash-firma',
        estado: 'activa'
      });

      const order = await commerceService.checkoutOrder({
        items: [{ productoId: prod.id, cantidad: 3 }],
        metodoPago: 'spei',
        recetaFolio: 'REC-MORF-SOL'
      }, clientUser);
      orderId = order.id;

      // Pagar orden
      const pref = await commerceService.createPaymentPreference(orderId, 'spei', clientUser);
      await commerceService.handlePaymentWebhook({
        transaccionId: pref.transaccionId,
        pasarela: 'spei',
        estado: 'acreditado'
      });
    });

    it('debe listar cola de pendientes y permitir a un veterinario aprobar la receta pasando a "listo_recoleccion"', async () => {
      const queue = await commerceService.listPendingControlledValidations(vetUser);
      expect(queue.length).toBe(1);
      expect(queue[0].pedido_id).toBe(orderId);

      const res = await commerceService.validateControlledOrder(orderId, {
        decision: 'aprobar'
      }, vetUser);

      expect(res.status).toBe('aprobada');
      expect(res.nuevoEstadoPedido).toBe('listo_recoleccion');

      const updated = await db('pedidos').where('id', orderId).first();
      expect(updated.estado).toBe('listo_recoleccion');

      // Ahora recepcionista entrega el pedido en mostrador
      const delivered = await commerceService.markOrderDelivered(orderId, receptionistUser);
      expect(delivered.estado).toBe('entregado');
    });

    it('debe permitir rechazar receta, cancelando el pedido y restaurando el stock del lote', async () => {
      // Stock actual antes de rechazar: 10 - 3 = 7
      let currentLot = await db('lotes').where('id', controlledLotId).first();
      expect(currentLot.stock_disponible).toBe(7);

      const res = await commerceService.validateControlledOrder(orderId, {
        decision: 'rechazar',
        motivoRechazo: 'Dosificación no coincide con la patología del canino'
      }, vetUser);

      expect(res.status).toBe('rechazada');

      // Verificar que el pedido fue cancelado
      const order = await db('pedidos').where('id', orderId).first();
      expect(order.estado).toBe('cancelado');

      // Verificar que los 3 medicamentos se restauraron al inventario
      currentLot = await db('lotes').where('id', controlledLotId).first();
      expect(currentLot.stock_disponible).toBe(10);
    });

    it('debe consultar pedido con filtros de acceso según rol', async () => {
      const clientOrders = await commerceService.listOrders({}, clientUser);
      expect(clientOrders.length).toBe(1);

      const staffOrders = await commerceService.listOrders({}, adminUser);
      expect(staffOrders.length).toBe(1);

      // Extraño intentando consultar pedido de otro cliente
      await expect(
        commerceService.getOrderById(orderId, strangerUser)
      ).rejects.toThrow(ForbiddenError);

      const orderDetail = await commerceService.getOrderById(orderId, clientUser);
      expect(orderDetail.items.length).toBe(1);
      expect(orderDetail.pagos.length).toBe(1);
      expect(orderDetail.validacion_controlados).toBeDefined();

      await expect(
        commerceService.getOrderById(99999, clientUser)
      ).rejects.toThrow(NotFoundError);
    });

    it('debe validar errores en la dictaminación clínica y entrega en mostrador', async () => {
      await expect(
        commerceService.validateControlledOrder(orderId, { decision: 'invalid_decision' }, vetUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.validateControlledOrder(orderId, { decision: 'aprobar' }, clientUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        commerceService.validateControlledOrder(99999, { decision: 'aprobar' }, vetUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        commerceService.validateControlledOrder(orderId, { decision: 'rechazar', motivoRechazo: '' }, vetUser)
      ).rejects.toThrow(ValidationError);

      await expect(
        commerceService.markOrderDelivered(orderId, clientUser)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        commerceService.markOrderDelivered(99999, receptionistUser)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
