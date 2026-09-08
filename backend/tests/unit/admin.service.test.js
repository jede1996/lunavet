const adminService = require('../../src/modules/admin/admin.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const { NotFoundError, BadRequestError, ConflictError } = require('../../src/core/errors');

describe('AdminService - Gestión de Staff, Reportes y Auditoría', () => {
  let adminUser;
  let vetUser;
  let recUser;
  let clientUser;

  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('bitacora_auditoria').del();
    await db('pedidos_items').del();
    await db('pedidos').del();
    await db('lotes').del();
    await db('productos').del();
    await db('categorias').del();
    await db('recetas_items').del();
    await db('recetas').del();
    await db('citas').del();
    await db('servicios').del();
    await db('mascotas').del();
    await db('cms_secciones').del();
    await db('usuarios').del();

    const [aId] = await db('usuarios').insert({
      email: 'admin.unit@lunavet.lat',
      password_hash: '$2a$12$eXampleHashAdmin123456789012345678901234567890',
      nombre: 'Admin',
      apellido: 'Principal',
      rol: 'administrador',
      activo: true
    });
    adminUser = { id: aId, email: 'admin.unit@lunavet.lat', rol: 'administrador' };

    const [vId] = await db('usuarios').insert({
      email: 'vet.unit@lunavet.lat',
      password_hash: '$2a$12$eXampleHashAdmin123456789012345678901234567890',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      rol: 'veterinario',
      cedula_profesional: 'VET-990011',
      activo: true
    });
    vetUser = { id: vId, email: 'vet.unit@lunavet.lat', rol: 'veterinario', cedulaProfesional: 'VET-990011' };

    const [rId] = await db('usuarios').insert({
      email: 'recep.unit@lunavet.lat',
      password_hash: '$2a$12$eXampleHashAdmin123456789012345678901234567890',
      nombre: 'Mariana',
      apellido: 'López',
      rol: 'recepcionista',
      activo: true
    });
    recUser = { id: rId, email: 'recep.unit@lunavet.lat', rol: 'recepcionista' };

    const [cId] = await db('usuarios').insert({
      email: 'cliente.unit@test.com',
      password_hash: '$2a$12$eXampleHashAdmin123456789012345678901234567890',
      nombre: 'Roberto',
      apellido: 'Gómez',
      rol: 'cliente',
      activo: true
    });
    clientUser = { id: cId, email: 'cliente.unit@test.com', rol: 'cliente' };
  });

  describe('Gestión de Personal (Staff Management)', () => {
    it('debe listar solo personal de staff por defecto, excluyendo clientes', async () => {
      const res = await adminService.listStaffUsers();
      expect(res.total).toBe(3);
      expect(res.data.length).toBe(3);
      const roles = res.data.map(u => u.rol);
      expect(roles).toContain('administrador');
      expect(roles).toContain('veterinario');
      expect(roles).toContain('recepcionista');
      expect(roles).not.toContain('cliente');
    });

    it('debe filtrar personal por rol y por término de búsqueda', async () => {
      const resRol = await adminService.listStaffUsers({ rol: 'veterinario' });
      expect(resRol.total).toBe(1);
      expect(resRol.data[0].email).toBe('vet.unit@lunavet.lat');

      const resSearch = await adminService.listStaffUsers({ search: '990011' });
      expect(resSearch.total).toBe(1);
      expect(resSearch.data[0].cedulaProfesional).toBe('VET-990011');
    });

    it('debe obtener detalle de usuario por ID y lanzar NotFoundError si no existe', async () => {
      const u = await adminService.getStaffUserById(vetUser.id);
      expect(u.nombre).toBe('Carlos');
      expect(u.cedulaProfesional).toBe('VET-990011');

      await expect(adminService.getStaffUserById(99999)).rejects.toThrow(NotFoundError);
    });

    it('debe crear un nuevo usuario de staff exitosamente y registrar auditoría', async () => {
      const nuevo = await adminService.createStaffUser(
        {
          email: 'nuevo.vet@lunavet.lat',
          password: 'PassWord123!#',
          nombre: 'Ana',
          apellido: 'Soto',
          rol: 'veterinario',
          cedulaProfesional: 'VET-771122'
        },
        adminUser
      );

      expect(nuevo.id).toBeDefined();
      expect(nuevo.email).toBe('nuevo.vet@lunavet.lat');
      expect(nuevo.rol).toBe('veterinario');

      const audit = await db('bitacora_auditoria')
        .where({ accion: 'STAFF_USER_CREATED', entidad_id: nuevo.id })
        .first();
      expect(audit).toBeDefined();
      expect(audit.usuario_id).toBe(adminUser.id);
    });

    it('debe rechazar creación con rol inválido o campos faltantes', async () => {
      await expect(
        adminService.createStaffUser({ email: 'a@b.com', password: 'P1!', nombre: 'A', apellido: 'B' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        adminService.createStaffUser({
          email: 'a@b.com',
          password: 'PassWord123!#',
          nombre: 'A',
          apellido: 'B',
          rol: 'hacker'
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('debe rechazar creación con email duplicado', async () => {
      await expect(
        adminService.createStaffUser(
          {
            email: 'admin.unit@lunavet.lat',
            password: 'PassWord123!#',
            nombre: 'Otro',
            apellido: 'Admin',
            rol: 'administrador'
          },
          adminUser
        )
      ).rejects.toThrow(ConflictError);
    });

    it('debe actualizar campos de perfil de un miembro del staff', async () => {
      const updated = await adminService.updateStaffUser(
        vetUser.id,
        {
          nombre: 'Carlos Eduardo',
          telefono: '+525544332211'
        },
        adminUser
      );

      expect(updated.nombre).toBe('Carlos Eduardo');
      expect(updated.telefono).toBe('+525544332211');
    });

    it('debe impedir que el administrador desactive su propia cuenta o cambie su rol', async () => {
      await expect(
        adminService.updateStaffUser(adminUser.id, { activo: false }, adminUser)
      ).rejects.toThrow(BadRequestError);

      await expect(
        adminService.updateStaffUser(adminUser.id, { rol: 'recepcionista' }, adminUser)
      ).rejects.toThrow(BadRequestError);
    });

    it('debe permitir restablecer la contraseña de un miembro del staff', async () => {
      const res = await adminService.resetStaffUserPassword(recUser.id, 'NewRecepPass2026!#', adminUser);
      expect(res.success).toBe(true);

      const audit = await db('bitacora_auditoria')
        .where({ accion: 'STAFF_PASSWORD_RESET', entidad_id: recUser.id })
        .first();
      expect(audit).toBeDefined();
    });

    it('debe permitir alternar el estado activo de un usuario no admin', async () => {
      const toggled = await adminService.toggleUserStatus(recUser.id, false, adminUser);
      expect(Boolean(toggled.activo)).toBe(false);
    });
  });

  describe('Dashboard de Métricas y KPIs', () => {
    it('debe generar el resumen ejecutivo con datos reales', async () => {
      const today = new Date().toISOString().slice(0, 10);

      // Crear paciente
      const [mId] = await db('mascotas').insert({
        nombre: 'Luna',
        especie: 'perro',
        raza: 'Husky',
        sexo: 'hembra',
        activo: true
      });

      // Crear servicio y cita
      const [sId] = await db('servicios').insert({
        nombre: 'Consulta General',
        precio: 350.00,
        duracion_minutos: 30,
        activo: true
      });

      await db('citas').insert({
        mascota_id: mId,
        veterinario_id: vetUser.id,
        cliente_id: clientUser.id,
        servicio_id: sId,
        fecha_hora_inicio: `${today} 10:00:00`,
        fecha_hora_fin: `${today} 10:30:00`,
        motivo: 'Chequeo general',
        estado: 'completada'
      });

      // Crear pedido del mes
      await db('pedidos').insert({
        cliente_id: clientUser.id,
        folio: 'PED-2026-001',
        total: 580,
        metodo_pago: 'tarjeta',
        estado: 'pagado',
        comprobante_interno_hash: 'hash-test-123',
        created_at: `${today} 11:00:00`
      });

      // Crear categoría, producto y lote con stock bajo
      const [catId] = await db('categorias').insert({
        nombre: 'Vacunas',
        slug: 'vacunas'
      });

      const [pId] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Vacuna Puppy',
        slug: 'vacuna-puppy',
        precio: 250,
        activo: true
      });

      await db('lotes').insert({
        producto_id: pId,
        numero_lote: 'LOTE-VAC-01',
        fecha_caducidad: `${today}`,
        stock_disponible: 2,
        stock_minimo_alerta: 5
      });

      const summary = await adminService.getDashboardSummary();
      expect(summary.pacientes.totalActivos).toBe(1);
      expect(summary.clientes.totalActivos).toBe(1);
      expect(summary.citasHoy.total).toBe(1);
      expect(summary.citasHoy.desglose.completada).toBe(1);
      expect(summary.financieroMes.totalIngresos).toBe(580);
      expect(summary.alertasInventario.lotesStockBajo).toBe(1);
    });
  });

  describe('Reportes Financieros, Inventario y Productividad', () => {
    it('debe generar reporte financiero con desglose de métodos de pago y top productos', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [catId] = await db('categorias').insert({ nombre: 'Alimentos', slug: 'alimentos' });

      const [pId] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Alimento Premium',
        slug: 'alimento-premium',
        precio: 600,
        activo: true
      });

      const [pedId] = await db('pedidos').insert({
        cliente_id: clientUser.id,
        folio: 'PED-2026-002',
        total: 1200,
        metodo_pago: 'efectivo',
        estado: 'pagado',
        comprobante_interno_hash: 'hash-test-456',
        created_at: `${today} 12:00:00`
      });

      await db('pedidos_items').insert({
        pedido_id: pedId,
        producto_id: pId,
        cantidad: 2,
        precio_unitario: 600,
        subtotal: 1200
      });

      const report = await adminService.getFinancialReport({ fechaInicio: today, fechaFin: today });
      expect(report.resumen.totalTransacciones).toBe(1);
      expect(report.resumen.totalIngresos).toBe(1200);
      expect(report.porMetodoPago.efectivo).toBe(1200);
      expect(report.topProductos.length).toBe(1);
      expect(report.topProductos[0].nombre).toBe('Alimento Premium');
      expect(report.topProductos[0].unidadesVendidas).toBe(2);
    });

    it('debe generar reporte de inventario en riesgo (lotes vencidos y por vencer)', async () => {
      const [catId] = await db('categorias').insert({ nombre: 'Fármacos', slug: 'farmacos' });

      const [pId] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Antibiótico Canino',
        slug: 'antibiotico-canino',
        precio: 350,
        activo: true
      });

      // Lote vencido
      await db('lotes').insert({
        producto_id: pId,
        numero_lote: 'LOTE-EXPIRED',
        fecha_caducidad: '2025-01-01',
        stock_disponible: 3,
        stock_minimo_alerta: 10
      });

      // Lote próximo a vencer en 15 días
      const nearFuture = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
      await db('lotes').insert({
        producto_id: pId,
        numero_lote: 'LOTE-NEAR',
        fecha_caducidad: nearFuture,
        stock_disponible: 5,
        stock_minimo_alerta: 10
      });

      const riskReport = await adminService.getInventoryRiskReport({ diasUmbral: 30 });
      expect(riskReport.resumen.totalLotesVencidos).toBe(1);
      expect(riskReport.resumen.totalLotesPorVencer).toBe(1);
      expect(riskReport.resumen.totalLotesBajoStock).toBe(2);
      expect(riskReport.lotesVencidos[0].numeroLote).toBe('LOTE-EXPIRED');
      expect(riskReport.lotesPorVencer[0].numeroLote).toBe('LOTE-NEAR');
    });

    it('debe generar reporte de productividad clínica y recetas emitidas', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [mId] = await db('mascotas').insert({
        nombre: 'Tom',
        especie: 'gato',
        raza: 'Europeo',
        activo: true
      });

      const [sId] = await db('servicios').insert({
        nombre: 'Consulta Felina',
        precio: 300,
        duracion_minutos: 30,
        activo: true
      });

      await db('citas').insert({
        mascota_id: mId,
        veterinario_id: vetUser.id,
        cliente_id: clientUser.id,
        servicio_id: sId,
        fecha_hora_inicio: `${today} 15:00:00`,
        fecha_hora_fin: `${today} 15:30:00`,
        motivo: 'Control de rutina',
        estado: 'completada'
      });

      await db('recetas').insert({
        folio: 'REC-TEST-99',
        mascota_id: mId,
        veterinario_id: vetUser.id,
        fecha_emision: today,
        firma_digital_hash: 'hash-receta-99'
      });

      const prodReport = await adminService.getClinicalProductivityReport({ fechaInicio: today, fechaFin: today });
      expect(prodReport.resumen.totalCitas).toBe(1);
      expect(prodReport.resumen.completadas).toBe(1);
      expect(prodReport.resumen.tasaEfectividad).toBe(100);
      expect(prodReport.resumen.totalRecetasEmitidas).toBe(1);
      expect(prodReport.desgloseVeterinarios.length).toBe(1);
      expect(prodReport.desgloseVeterinarios[0].veterinarioId).toBe(vetUser.id);
    });

    it('debe registrar y auditar medicamentos controlados dispensados', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [catId] = await db('categorias').insert({ nombre: 'Controlados', slug: 'controlados' });

      const [pId] = await db('productos').insert({
        categoria_id: catId,
        nombre: 'Fenobarbital 100mg',
        slug: 'fenobarbital-100mg',
        precio: 450,
        es_controlado: true,
        activo: true
      });

      const [mId] = await db('mascotas').insert({
        nombre: 'Rocky',
        especie: 'perro',
        raza: 'Pastor Alemán',
        activo: true
      });

      const [rId] = await db('recetas').insert({
        folio: 'REC-CTRL-123',
        mascota_id: mId,
        veterinario_id: vetUser.id,
        fecha_emision: today,
        firma_digital_hash: 'hash-ctrl-123'
      });

      await db('recetas_items').insert({
        receta_id: rId,
        producto_id: pId,
        nombre_medicamento: 'Fenobarbital 100mg',
        dosis: '1 tableta',
        frecuencia: 'cada 12 horas',
        duracion_dias: 30,
        cantidad_prescrita: 60
      });

      const ctrlReport = await adminService.getControlledMedicationLog({ fechaInicio: today, fechaFin: today });
      expect(ctrlReport.total).toBe(1);
      expect(ctrlReport.data[0].medicamentoNombre).toBe('Fenobarbital 100mg');
      expect(ctrlReport.data[0].mascotaNombre).toBe('Rocky');
      expect(ctrlReport.data[0].cedulaProfesional).toBe('VET-990011');
    });
  });

  describe('Explorador de Auditoría y Configuración Global', () => {
    it('debe consultar y filtrar bitácora de auditoría', async () => {
      await db('bitacora_auditoria').insert({
        usuario_id: adminUser.id,
        accion: 'LOGIN_SUCCESS',
        entidad: 'auth',
        entidad_id: String(adminUser.id),
        detalles: JSON.stringify({ ip: '127.0.0.1' }),
        ip_origen: '127.0.0.1'
      });

      const logs = await adminService.getAuditLogs({ accion: 'LOGIN_SUCCESS' });
      expect(logs.total).toBe(1);
      expect(logs.data[0].accion).toBe('LOGIN_SUCCESS');
      expect(logs.data[0].detalles.ip).toBe('127.0.0.1');
      expect(logs.data[0].ipOrigen).toBe('127.0.0.1');
    });

    it('debe obtener y actualizar configuración global de la clínica', async () => {
      const settings = await adminService.getClinicSettings();
      expect(settings.nombreClinica).toBe('Clínica Veterinaria Luna-Vet');

      const updated = await adminService.updateClinicSettings(
        {
          nombreClinica: 'LunaVet Specialty Hospital',
          telefonoEmergencias: '+52 55 1122 3344'
        },
        adminUser
      );

      expect(updated.nombreClinica).toBe('LunaVet Specialty Hospital');
      expect(updated.telefonoEmergencias).toBe('+52 55 1122 3344');

      const audit = await db('bitacora_auditoria')
        .where({ accion: 'CLINIC_SETTINGS_UPDATED' })
        .first();
      expect(audit).toBeDefined();
    });

    it('debe actualizar configuración existente y manejar metadatos no JSON', async () => {
      // 1. Actualizar de nuevo cuando ya existe en DB
      const reUpdated = await adminService.updateClinicSettings(
        {
          nombreClinica: 'LunaVet Animal Center',
          telefonoEmergencias: '+52 55 0000 1111'
        },
        adminUser
      );
      expect(reUpdated.nombreClinica).toBe('LunaVet Animal Center');

      // 2. Probar cuando metadatos_json no es JSON válido
      await db('cms_secciones')
        .where({ clave_seccion: 'configuracion_clinica' })
        .update({ metadatos_json: 'invalido' });
      const fallback = await adminService.getClinicSettings();
      expect(fallback.nombreClinica).toBe('Clínica Veterinaria Luna-Vet');
    });

    it('debe filtrar bitácora con usuarioId, entidad, rango de fechas y detalles de texto plano', async () => {
      const today = new Date().toISOString().slice(0, 10);
      await db('bitacora_auditoria').insert({
        usuario_id: adminUser.id,
        accion: 'SECURITY_ALERT',
        entidad: 'sistema',
        entidad_id: '1',
        detalles: 'Texto no serializado como JSON',
        ip_origen: '192.168.1.1',
        created_at: `${today} 10:00:00`
      });

      const logs = await adminService.getAuditLogs({
        usuarioId: adminUser.id,
        accion: 'SECURITY_ALERT',
        entidad: 'sistema',
        fechaInicio: today,
        fechaFin: today
      });
      expect(logs.total).toBe(1);
      expect(logs.data[0].detalles).toBe('Texto no serializado como JSON');
    });

    it('debe listar incluyendo clientes y filtrar por activo boolean', async () => {
      const resWithClients = await adminService.listStaffUsers({ includeClients: true });
      expect(resWithClients.total).toBe(4);

      const resActivo = await adminService.listStaffUsers({ activo: 'true' });
      expect(resActivo.total).toBe(3);

      const resInactivo = await adminService.listStaffUsers({ activo: 'false' });
      expect(resInactivo.total).toBe(0);
    });

    it('debe manejar errores de actualización: rol inválido y usuario inexistente', async () => {
      await expect(
        adminService.updateStaffUser(99999, { nombre: 'Test' }, adminUser)
      ).rejects.toThrow(NotFoundError);

      await expect(
        adminService.updateStaffUser(vetUser.id, { rol: 'invalido' }, adminUser)
      ).rejects.toThrow(BadRequestError);

      await expect(
        adminService.resetStaffUserPassword(99999, 'Password123!#', adminUser)
      ).rejects.toThrow(NotFoundError);
    });

    it('debe manejar reporte financiero sin ventas y con otros métodos de pago', async () => {
      const emptyReport = await adminService.getFinancialReport({ fechaInicio: '2020-01-01', fechaFin: '2020-01-02' });
      expect(emptyReport.resumen.totalTransacciones).toBe(0);
      expect(emptyReport.resumen.ticketPromedio).toBe(0);
    });

    it('debe desglosar citas canceladas y pendientes en productividad clínica', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [sId] = await db('servicios').insert({ nombre: 'Vacunación', precio: 200, activo: true });
      const [mId] = await db('mascotas').insert({ nombre: 'Bobi', especie: 'perro', raza: 'Mestizo', activo: true });

      await db('citas').insert([
        {
          mascota_id: mId,
          veterinario_id: vetUser.id,
          cliente_id: clientUser.id,
          servicio_id: sId,
          fecha_hora_inicio: `${today} 08:00:00`,
          fecha_hora_fin: `${today} 08:30:00`,
          motivo: 'Cancelada por cliente',
          estado: 'cancelada'
        },
        {
          mascota_id: mId,
          veterinario_id: vetUser.id,
          cliente_id: clientUser.id,
          servicio_id: sId,
          fecha_hora_inicio: `${today} 09:00:00`,
          fecha_hora_fin: `${today} 09:30:00`,
          motivo: 'Pendiente de confirmación',
          estado: 'pendiente'
        }
      ]);

      const prod = await adminService.getClinicalProductivityReport({ fechaInicio: today, fechaFin: today });
      expect(prod.resumen.canceladas).toBe(1);
      expect(prod.desgloseVeterinarios[0].canceladas).toBe(1);
      expect(prod.desgloseVeterinarios[0].otras).toBe(1);
    });
  });
});
