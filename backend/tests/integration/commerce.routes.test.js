const request = require('supertest');
const app = require('../../src/app');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const tokenService = require('../../src/core/token.service');
const config = require('../../src/config/env');

describe('Integration - Módulo de E-Commerce, Controlados, Lotes FEFO y Checkout', () => {
  let adminToken;
  let vetToken;
  let receptionistToken;
  let clientToken;
  let strangerToken;

  let clientId;
  let vetId;
  let clientPetId;
  let activeRecetaFolio;

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

    // Crear usuarios
    const [aId] = await db('usuarios').insert({
      email: 'admin@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Admin',
      apellido: 'Vet',
      rol: 'administrador',
      activo: true
    });
    adminToken = tokenService.generateAccessToken({ id: aId, email: 'admin@lunavet.lat', rol: 'administrador' });

    const [vId] = await db('usuarios').insert({
      email: 'vet@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Veterinario',
      apellido: 'Titular',
      rol: 'veterinario',
      cedula_profesional: 'CED-VET-8899',
      activo: true
    });
    vetId = vId;
    vetToken = tokenService.generateAccessToken({ id: vId, email: 'vet@lunavet.lat', rol: 'veterinario' });

    const [rId] = await db('usuarios').insert({
      email: 'recep@lunavet.lat',
      password_hash: 'hash',
      nombre: 'Recepcionista',
      apellido: 'Mostrador',
      rol: 'recepcionista',
      activo: true
    });
    receptionistToken = tokenService.generateAccessToken({ id: rId, email: 'recep@lunavet.lat', rol: 'recepcionista' });

    const [cId] = await db('usuarios').insert({
      email: 'cliente@test.com',
      password_hash: 'hash',
      nombre: 'Valeria',
      apellido: 'Rios',
      rol: 'cliente',
      activo: true
    });
    clientId = cId;
    clientToken = tokenService.generateAccessToken({ id: cId, email: 'cliente@test.com', rol: 'cliente' });

    const [sId] = await db('usuarios').insert({
      email: 'ajeno@test.com',
      password_hash: 'hash',
      nombre: 'Extraño',
      apellido: 'Ajeno',
      rol: 'cliente',
      activo: true
    });
    strangerToken = tokenService.generateAccessToken({ id: sId, email: 'ajeno@test.com', rol: 'cliente' });

    // Crear mascota del cliente
    const [mId] = await db('mascotas').insert({
      nombre: 'Bimba',
      especie: 'perro',
      raza: 'Beagle',
      sexo: 'hembra',
      fecha_nacimiento: '2023-01-01'
    });
    clientPetId = mId;
    await db('usuarios_mascotas').insert({
      usuario_id: clientId,
      mascota_id: clientPetId,
      es_propietario_principal: true
    });

    // Crear receta para la mascota
    activeRecetaFolio = 'REC-INT-2026-001';
    await db('recetas').insert({
      folio: activeRecetaFolio,
      veterinario_id: vetId,
      mascota_id: clientPetId,
      fecha_emision: new Date().toISOString().slice(0, 10),
      vigencia_dias: 30,
      firma_digital_hash: 'hash-digital-firma',
      estado: 'activa'
    });
  });

  describe('Categorías y Productos (Catálogo Público y Administrativo)', () => {
    it('debe gestionar categorías con control de acceso por rol', async () => {
      // Cliente intenta crear -> 403
      const resClient = await request(app)
        .post('/api/commerce/categories')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ nombre: 'Juguetes Caninos' });
      expect(resClient.status).toBe(403);

      // Admin crea categoría -> 201
      const resAdmin = await request(app)
        .post('/api/commerce/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Juguetes Caninos', descripcion: 'Mordederas y pelotas' });
      expect(resAdmin.status).toBe(201);
      expect(resAdmin.body.data.slug).toBe('juguetes-caninos');

      // Catálogo público accesible sin token -> 200
      const resPublic = await request(app).get('/api/commerce/categories');
      expect(resPublic.status).toBe(200);
      expect(resPublic.body.data.length).toBe(1);

      // Actualizar categoría -> 200
      const resUpdate = await request(app)
        .put(`/api/commerce/categories/${resAdmin.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Juguetes y Mordederas' });
      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.nombre).toBe('Juguetes y Mordederas');
    });

    it('debe registrar y consultar productos con lotes y cálculo dinámico de stock', async () => {
      const [catId] = await db('categorias').insert({
        nombre: 'Farmacia',
        slug: 'farmacia'
      });

      // Veterinario registra producto
      const resProd = await request(app)
        .post('/api/commerce/products')
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          categoriaId: catId,
          nombre: 'Desparasitante Interno 10kg',
          precio: 220.00
        });
      expect(resProd.status).toBe(201);
      const prodId = resProd.body.data.id;

      // Veterinario asigna lote con caducidad
      const expDate = new Date();
      expDate.setFullYear(expDate.getFullYear() + 1);

      const resLot = await request(app)
        .post(`/api/commerce/products/${prodId}/lots`)
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          numeroLote: 'DESP-LOTE-2026',
          fechaCaducidad: expDate.toISOString().slice(0, 10),
          stockDisponible: 25,
          stockMinimoAlerta: 5
        });
      expect(resLot.status).toBe(201);
      expect(resLot.body.data.stockDisponible).toBe(25);

      // Consulta pública del producto con stock total consolidado
      const resDetail = await request(app).get(`/api/commerce/products/${prodId}`);
      expect(resDetail.status).toBe(200);
      expect(resDetail.body.data.stock_disponible_total).toBe(25);
      expect(resDetail.body.data.lotes_disponibles.length).toBe(1);

      // Staff consulta alertas de inventario
      const resAlerts = await request(app)
        .get('/api/commerce/inventory/alerts')
        .set('Authorization', `Bearer ${receptionistToken}`);
      expect(resAlerts.status).toBe(200);

      // Veterinario actualiza el producto
      const resUpdateProd = await request(app)
        .put(`/api/commerce/products/${prodId}`)
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          nombre: 'Desparasitante Interno 10kg Plus',
          precio: 250.00
        });
      expect(resUpdateProd.status).toBe(200);
      expect(resUpdateProd.body.data.nombre).toBe('Desparasitante Interno 10kg Plus');

      // Veterinario actualiza el lote
      const resUpdateLot = await request(app)
        .put(`/api/commerce/lots/${resLot.body.data.id}`)
        .set('Authorization', `Bearer ${vetToken}`)
        .send({
          stockDisponible: 30
        });
      expect(resUpdateLot.status).toBe(200);
      expect(resUpdateLot.body.data.stock_disponible).toBe(30);

      // Consulta pública con filtros
      const resFiltered = await request(app)
        .get(`/api/commerce/products?categoriaId=${catId}&search=Plus&esControlado=false&requiereReceta=false`);
      expect(resFiltered.status).toBe(200);
      expect(resFiltered.body.data.length).toBe(1);
    });
  });

  describe('Flujo Completo de Click & Collect: Checkout, SPEI/MercadoPago y Controlados', () => {
    let unprescribedProdId;
    let controlledProdId;

    beforeEach(async () => {
      const [catId] = await db('categorias').insert({
        nombre: 'Medicamentos',
        slug: 'medicamentos'
      });

      // Producto regular
      const [p1] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Colirio Oftálmico',
        slug: 'colirio-oftalmico',
        precio: 150.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      });
      unprescribedProdId = p1;

      // Producto controlado
      const [p2] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Fentanilo Parche Transdérmico',
        slug: 'fentanilo-parche',
        precio: 600.00,
        requiere_receta: true,
        es_controlado: true,
        activo: true
      });
      controlledProdId = p2;

      // Asignar lotes
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().slice(0, 10);

      await db('lotes').insert([
        {
          producto_id: unprescribedProdId,
          numero_lote: 'COL-001',
          fecha_caducidad: nextYearStr,
          stock_disponible: 10,
          stock_minimo_alerta: 2
        },
        {
          producto_id: controlledProdId,
          numero_lote: 'FENT-999',
          fecha_caducidad: nextYearStr,
          stock_disponible: 5,
          stock_minimo_alerta: 1
        }
      ]);
    });

    it('debe completar flujo Click & Collect regular con pago SPEI y entrega en mostrador', async () => {
      // 1. Checkout Click & Collect por el cliente
      const resCheckout = await request(app)
        .post('/api/commerce/checkout')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ productoId: unprescribedProdId, cantidad: 2 }],
          metodoPago: 'spei',
          notasCliente: 'Paso por él en la tarde'
        });

      expect(resCheckout.status).toBe(201);
      const order = resCheckout.body.data;
      expect(order.folio).toMatch(/^PED-/);
      expect(order.total).toBe(300.00);
      expect(order.comprobanteInternoHash).toBeDefined();
      expect(order.estado).toBe('pendiente_pago');

      // 2. Iniciar pago SPEI
      const resPay = await request(app)
        .post(`/api/commerce/orders/${order.id}/pay`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pasarela: 'spei' });

      expect(resPay.status).toBe(201);
      expect(resPay.body.data.transaccionId).toBeDefined();
      expect(resPay.body.data.instrucciones.clabeInterbancaria).toBeDefined();

      // 3. Webhook de confirmación de pago SPEI
      const resWebhook = await request(app)
        .post('/api/commerce/payments/webhook')
        .set('x-webhook-signature', config.payments.webhookSecret)
        .send({
          transaccionId: resPay.body.data.transaccionId,
          pasarela: 'spei',
          estado: 'acreditado'
        });

      expect(resWebhook.status).toBe(200);
      expect(resWebhook.body.data.nuevoEstadoPedido).toBe('listo_recoleccion');

      // 4. Recepcionista entrega el pedido en la clínica
      const resDeliver = await request(app)
        .patch(`/api/commerce/orders/${order.id}/deliver`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(resDeliver.status).toBe(200);
      expect(resDeliver.body.data.estado).toBe('entregado');
    });

    it('debe gestionar medicamentos controlados: validación médica requerida antes de recolectar', async () => {
      // 1. Checkout de medicamento controlado con receta activa
      const resCheckout = await request(app)
        .post('/api/commerce/checkout')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          items: [{ productoId: controlledProdId, cantidad: 1 }],
          metodoPago: 'mercadopago',
          recetaFolio: activeRecetaFolio
        });

      expect(resCheckout.status).toBe(201);
      const orderId = resCheckout.body.data.id;
      expect(resCheckout.body.data.tieneControlados).toBe(true);

      // 2. Iniciar pago MercadoPago
      const resPay = await request(app)
        .post(`/api/commerce/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ pasarela: 'mercadopago' });
      expect(resPay.status).toBe(201);

      // 3. Webhook de acreditación de MercadoPago
      // Como tiene controlados, el pedido debe pasar a "validando_receta" en vez de "listo_recoleccion"
      const resWebhook = await request(app)
        .post('/api/commerce/payments/webhook')
        .set('x-webhook-signature', config.payments.webhookSecret)
        .send({
          transaccionId: resPay.body.data.transaccionId,
          pasarela: 'mercadopago',
          estado: 'approved'
        });

      expect(resWebhook.status).toBe(200);
      expect(resWebhook.body.data.nuevoEstadoPedido).toBe('validando_receta');

      // 4. Veterinario consulta cola de validación clínica
      const resQueue = await request(app)
        .get('/api/commerce/controlled/queue')
        .set('Authorization', `Bearer ${vetToken}`);
      expect(resQueue.status).toBe(200);
      expect(resQueue.body.data.length).toBe(1);
      expect(resQueue.body.data[0].pedido_id).toBe(orderId);

      // 5. Veterinario dictamina y aprueba la receta médica
      const resValidate = await request(app)
        .patch(`/api/commerce/orders/${orderId}/validate-controlled`)
        .set('Authorization', `Bearer ${vetToken}`)
        .send({ decision: 'aprobar' });

      expect(resValidate.status).toBe(200);
      expect(resValidate.body.data.status).toBe('aprobada');
      expect(resValidate.body.data.nuevoEstadoPedido).toBe('listo_recoleccion');

      // 6. Consultar detalle del pedido
      const resOrder = await request(app)
        .get(`/api/commerce/orders/${orderId}`)
        .set('Authorization', `Bearer ${clientToken}`);
      expect(resOrder.status).toBe(200);
      expect(resOrder.body.data.estado).toBe('listo_recoleccion');
      expect(resOrder.body.data.items.length).toBe(1);
      expect(resOrder.body.data.validacion_controlados.estado).toBe('aprobada');

      // Extraño intentando ver pedido ajeno -> 403 Forbidden
      const resStranger = await request(app)
        .get(`/api/commerce/orders/${orderId}`)
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(resStranger.status).toBe(403);

      // Listar pedidos cliente y staff con filtro
      const resClientList = await request(app)
        .get('/api/commerce/orders')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(resClientList.status).toBe(200);
      expect(resClientList.body.data.length).toBe(1);

      const resStaffList = await request(app)
        .get('/api/commerce/orders?estado=listo_recoleccion')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resStaffList.status).toBe(200);
      expect(resStaffList.body.data.length).toBe(1);
    });
  });
});
