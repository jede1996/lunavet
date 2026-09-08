const { db } = require('../../config/database');
const auditService = require('../../core/audit.service');
const passwordService = require('../../core/password.service');
const cryptoService = require('../../core/crypto.service');
const { NotFoundError, BadRequestError, ConflictError } = require('../../core/errors');

class AdminService {
  /**
   * ==========================================
   * GESTIÓN DE PERSONAL / STAFF
   * ==========================================
   */

  /**
   * Mapea un usuario de base de datos a formato seguro para respuesta
   */
  _mapSafeUser(u) {
    if (!u) return null;
    let telefono = null;
    if (u.telefono_cifrado) {
      try {
        telefono = cryptoService.decrypt(u.telefono_cifrado);
      } catch {
        telefono = null;
      }
    }

    return {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      apellido: u.apellido,
      rol: u.rol,
      telefono,
      cedulaProfesional: u.cedula_profesional || null,
      dosFactoresHabilitado: Boolean(u.dos_factores_habilitado),
      activo: Boolean(u.activo),
      ultimoAcceso: u.ultimo_acceso || null,
      createdAt: u.fecha_registro || u.created_at,
      updatedAt: u.actualizado_en || u.updated_at
    };
  }

  /**
   * Listar usuarios con filtros y paginación
   */
  async listStaffUsers({ search, rol, activo, includeClients = false, limit = 50, offset = 0 } = {}) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const query = db('usuarios').select(
      'id',
      'email',
      'nombre',
      'apellido',
      'rol',
      'telefono_cifrado',
      'cedula_profesional',
      'dos_factores_habilitado',
      'activo',
      'ultimo_acceso',
      'fecha_registro as created_at',
      'actualizado_en as updated_at'
    );

    const countQuery = db('usuarios').count('id as total');

    if (!includeClients && !rol) {
      query.whereIn('rol', ['administrador', 'veterinario', 'recepcionista']);
      countQuery.whereIn('rol', ['administrador', 'veterinario', 'recepcionista']);
    } else if (rol) {
      query.where('rol', rol);
      countQuery.where('rol', rol);
    }

    if (activo !== undefined && activo !== null && activo !== '') {
      const boolActivo = String(activo) === 'true' || activo === true || activo === 1 || activo === '1';
      query.where('activo', boolActivo);
      countQuery.where('activo', boolActivo);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      const filterGroup = function () {
        this.whereRaw('LOWER(nombre) LIKE ?', [term])
          .orWhereRaw('LOWER(apellido) LIKE ?', [term])
          .orWhereRaw('LOWER(email) LIKE ?', [term])
          .orWhereRaw('LOWER(COALESCE(cedula_profesional, "")) LIKE ?', [term]);
      };
      query.where(filterGroup);
      countQuery.where(filterGroup);
    }

    const [totalRow] = await countQuery;
    const total = parseInt(totalRow ? totalRow.total : 0, 10);

    const users = await query.orderBy('id', 'asc').limit(lim).offset(off);

    return {
      total,
      limit: lim,
      offset: off,
      data: users.map(u => this._mapSafeUser(u))
    };
  }

  /**
   * Obtener detalle de un usuario staff por ID
   */
  async getStaffUserById(id) {
    const user = await db('usuarios')
      .where({ id })
      .select(
        'id',
        'email',
        'nombre',
        'apellido',
        'rol',
        'telefono_cifrado',
        'cedula_profesional',
        'dos_factores_habilitado',
        'activo',
        'ultimo_acceso',
        'fecha_registro as created_at',
        'actualizado_en as updated_at'
      )
      .first();

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return this._mapSafeUser(user);
  }

  /**
   * Crear nuevo usuario de personal (Staff)
   */
  async createStaffUser(payload, adminUser) {
    const { email, password, nombre, apellido, rol, telefono, cedulaProfesional, activo } = payload;

    if (!email || !password || !nombre || !apellido || !rol) {
      throw new BadRequestError('email, password, nombre, apellido y rol son requeridos');
    }

    const allowedRoles = ['administrador', 'veterinario', 'recepcionista'];
    if (!allowedRoles.includes(rol)) {
      throw new BadRequestError(`Rol '${rol}' inválido para personal de la clínica. Permitidos: ${allowedRoles.join(', ')}`);
    }

    // Validar robustez de contraseña para staff (8+ caracteres, mayúscula, minúscula, número, especial)
    passwordService.validateStrength(password, true);

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db('usuarios').where({ email: normalizedEmail }).first();
    if (existing) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado');
    }

    const hashedPassword = await passwordService.hash(password);
    const telefonoCifrado = telefono ? cryptoService.encrypt(telefono.trim()) : null;

    const cedula = cedulaProfesional || payload.cedula_profesional;
    const [id] = await db('usuarios').insert({
      email: normalizedEmail,
      password_hash: hashedPassword,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol,
      telefono_cifrado: telefonoCifrado,
      cedula_profesional: (rol === 'veterinario' && cedula) ? cedula.trim() : null,
      activo: activo !== undefined ? Boolean(activo) : true,
      dos_factores_habilitado: false
    });

    await auditService.log({
      usuarioId: adminUser ? adminUser.id : null,
      accion: 'STAFF_USER_CREATED',
      entidad: 'usuarios',
      entidadId: id,
      detalles: { email: normalizedEmail, rol, nombre, apellido }
    });

    return this.getStaffUserById(id);
  }

  /**
   * Actualizar usuario staff
   */
  async updateStaffUser(id, payload, adminUser) {
    const user = await db('usuarios').where({ id }).first();
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Proteger cuenta propia del administrador
    if (adminUser && adminUser.id === Number(id)) {
      if (payload.activo !== undefined && !payload.activo) {
        throw new BadRequestError('No puedes desactivar tu propia cuenta de administrador');
      }
      if (payload.rol && payload.rol !== 'administrador') {
        throw new BadRequestError('No puedes cambiar tu propio rol de administrador');
      }
    }

    const updateFields = {};
    if (payload.nombre !== undefined) updateFields.nombre = payload.nombre.trim();
    if (payload.apellido !== undefined) updateFields.apellido = payload.apellido.trim();
    if (payload.telefono !== undefined) {
      updateFields.telefono_cifrado = payload.telefono ? cryptoService.encrypt(payload.telefono.trim()) : null;
    }
    if (payload.cedulaProfesional !== undefined) {
      updateFields.cedula_profesional = payload.cedulaProfesional ? payload.cedulaProfesional.trim() : null;
    }
    if (payload.activo !== undefined) updateFields.activo = Boolean(payload.activo);

    if (payload.rol) {
      const allowedRoles = ['administrador', 'veterinario', 'recepcionista', 'cliente'];
      if (!allowedRoles.includes(payload.rol)) {
        throw new BadRequestError(`Rol '${payload.rol}' no es válido`);
      }
      updateFields.rol = payload.rol;
    }

    if (Object.keys(updateFields).length > 0) {
      await db('usuarios').where({ id }).update(updateFields);

      await auditService.log({
        usuarioId: adminUser ? adminUser.id : null,
        accion: 'STAFF_USER_UPDATED',
        entidad: 'usuarios',
        entidadId: id,
        detalles: { camposModificados: Object.keys(updateFields) }
      });
    }

    return this.getStaffUserById(id);
  }

  /**
   * Restablecer contraseña de personal por administrador
   */
  async resetStaffUserPassword(id, newPassword, adminUser) {
    const user = await db('usuarios').where({ id }).first();
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    passwordService.validateStrength(newPassword, true);
    const hashedPassword = await passwordService.hash(newPassword);

    await db('usuarios').where({ id }).update({
      password_hash: hashedPassword
    });

    await auditService.log({
      usuarioId: adminUser ? adminUser.id : null,
      accion: 'STAFF_PASSWORD_RESET',
      entidad: 'usuarios',
      entidadId: id,
      detalles: { email: user.email }
    });

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente'
    };
  }

  /**
   * Alternar estado activo/inactivo de un usuario
   */
  async toggleUserStatus(id, activo, adminUser) {
    return this.updateStaffUser(id, { activo }, adminUser);
  }

  /**
   * ==========================================
   * DASHBOARD DE MÉTRICAS Y REPORTES
   * ==========================================
   */

  /**
   * Resumen general ejecutivo en tiempo real
   */
  async getDashboardSummary() {
    const today = new Date().toISOString().slice(0, 10);
    const startOfMonth = `${today.slice(0, 7)}-01`;

    // 1. Pacientes activos
    const [mascotasRow] = await db('mascotas').where({ activo: true }).count('id as total');
    const totalPacientesActivos = parseInt(mascotasRow ? mascotasRow.total : 0, 10);

    // 2. Clientes activos
    const [clientesRow] = await db('usuarios').where({ rol: 'cliente', activo: true }).count('id as total');
    const totalClientesActivos = parseInt(clientesRow ? clientesRow.total : 0, 10);

    // 3. Citas de hoy
    const citasHoy = await db('citas')
      .where('fecha_hora_inicio', '>=', `${today} 00:00:00`)
      .where('fecha_hora_inicio', '<=', `${today} 23:59:59`);

    const citasHoyPorEstado = {
      pendiente: 0,
      confirmada: 0,
      en_curso: 0,
      completada: 0,
      cancelada: 0,
      no_asistio: 0
    };
    for (const c of citasHoy) {
      if (citasHoyPorEstado[c.estado] !== undefined) {
        citasHoyPorEstado[c.estado]++;
      }
    }

    // 4. Ventas / Pedidos del mes
    const pedidosMes = await db('pedidos')
      .where('creado_en', '>=', `${startOfMonth} 00:00:00`)
      .whereNot('estado', 'cancelado');

    let ingresosMesTotal = 0;
    for (const p of pedidosMes) {
      ingresosMesTotal += parseFloat(p.total || 0);
    }

    // 5. Alertas de inventario en lotes
    const [stockBajoRow] = await db('lotes')
      .whereRaw('stock_disponible <= stock_minimo_alerta')
      .count('id as total');
    const lotesStockBajo = parseInt(stockBajoRow ? stockBajoRow.total : 0, 10);

    const targetDate30d = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const [lotesEnRiesgoRow] = await db('lotes')
      .where('fecha_caducidad', '<=', targetDate30d)
      .where('stock_disponible', '>', 0)
      .count('id as total');
    const lotesEnRiesgo = parseInt(lotesEnRiesgoRow ? lotesEnRiesgoRow.total : 0, 10);

    return {
      fechaConsulta: today,
      pacientes: {
        totalActivos: totalPacientesActivos
      },
      clientes: {
        totalActivos: totalClientesActivos
      },
      citasHoy: {
        total: citasHoy.length,
        desglose: citasHoyPorEstado
      },
      financieroMes: {
        totalIngresos: Number(ingresosMesTotal.toFixed(2)),
        totalTransacciones: pedidosMes.length
      },
      alertasInventario: {
        lotesStockBajo,
        lotesEnRiesgoCaducidad: lotesEnRiesgo
      }
    };
  }

  /**
   * Reporte financiero detallado por rango de fechas
   */
  async getFinancialReport({ fechaInicio, fechaFin } = {}) {
    let query = db('pedidos').whereNot('estado', 'cancelado');

    if (fechaInicio) {
      query = query.where('creado_en', '>=', `${fechaInicio} 00:00:00`);
    }
    if (fechaFin) {
      query = query.where('creado_en', '<=', `${fechaFin} 23:59:59`);
    }

    const pedidos = await query.orderBy('creado_en', 'asc');

    let totalIngresos = 0;
    const porMetodoPago = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      mercadopago: 0
    };

    const pedidoIds = [];

    for (const p of pedidos) {
      const tot = parseFloat(p.total || 0);
      totalIngresos += tot;
      pedidoIds.push(p.id);

      const m = p.metodo_pago;
      if (porMetodoPago[m] !== undefined) {
        porMetodoPago[m] += tot;
      } else {
        porMetodoPago[m] = (porMetodoPago[m] || 0) + tot;
      }
    }

    for (const k of Object.keys(porMetodoPago)) {
      porMetodoPago[k] = Number(porMetodoPago[k].toFixed(2));
    }

    const ticketPromedio = pedidos.length > 0 ? Number((totalIngresos / pedidos.length).toFixed(2)) : 0;

    // Top productos más vendidos
    let topProductos = [];
    if (pedidoIds.length > 0) {
      topProductos = await db('pedidos_items')
        .join('productos', 'pedidos_items.producto_id', 'productos.id')
        .whereIn('pedidos_items.pedido_id', pedidoIds)
        .select('productos.id', 'productos.nombre')
        .sum('pedidos_items.cantidad as unidadesVendidas')
        .sum('pedidos_items.subtotal as montoTotal')
        .groupBy('productos.id', 'productos.nombre')
        .orderBy('unidadesVendidas', 'desc')
        .limit(5);

      topProductos = topProductos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidadesVendidas: parseInt(p.unidadesVendidas || 0, 10),
        montoTotal: Number(parseFloat(p.montoTotal || 0).toFixed(2))
      }));
    }

    return {
      rango: {
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null
      },
      resumen: {
        totalTransacciones: pedidos.length,
        totalIngresos: Number(totalIngresos.toFixed(2)),
        ticketPromedio
      },
      porMetodoPago,
      topProductos
    };
  }

  /**
   * Reporte de inventario en riesgo (Lotes FEFO por expirar y lotes bajo stock mínimo)
   */
  async getInventoryRiskReport({ diasUmbral = 30 } = {}) {
    const umbral = Math.max(parseInt(diasUmbral, 10) || 30, 1);
    const today = new Date().toISOString().slice(0, 10);
    const targetDate = new Date(Date.now() + umbral * 86400000).toISOString().slice(0, 10);

    // 1. Lotes vencidos
    const lotesVencidos = await db('lotes')
      .join('productos', 'lotes.producto_id', 'productos.id')
      .where('lotes.fecha_caducidad', '<', today)
      .where('lotes.stock_disponible', '>', 0)
      .select(
        'lotes.id as loteId',
        'productos.id as productoId',
        'productos.nombre as productoNombre',
        'lotes.numero_lote as numeroLote',
        'lotes.fecha_caducidad as fechaCaducidad',
        'lotes.stock_disponible as stockDisponible'
      )
      .orderBy('lotes.fecha_caducidad', 'asc');

    // 2. Lotes próximos a vencer dentro del umbral
    const lotesPorVencer = await db('lotes')
      .join('productos', 'lotes.producto_id', 'productos.id')
      .where('lotes.fecha_caducidad', '>=', today)
      .where('lotes.fecha_caducidad', '<=', targetDate)
      .where('lotes.stock_disponible', '>', 0)
      .select(
        'lotes.id as loteId',
        'productos.id as productoId',
        'productos.nombre as productoNombre',
        'lotes.numero_lote as numeroLote',
        'lotes.fecha_caducidad as fechaCaducidad',
        'lotes.stock_disponible as stockDisponible'
      )
      .orderBy('lotes.fecha_caducidad', 'asc');

    // 3. Lotes bajo o igual al umbral de alerta
    const lotesBajoStock = await db('lotes')
      .join('productos', 'lotes.producto_id', 'productos.id')
      .whereRaw('lotes.stock_disponible <= lotes.stock_minimo_alerta')
      .select(
        'lotes.id as loteId',
        'productos.id as productoId',
        'productos.nombre as productoNombre',
        'lotes.numero_lote as numeroLote',
        'lotes.stock_disponible as stockDisponible',
        'lotes.stock_minimo_alerta as stockMinimoAlerta'
      )
      .orderBy('lotes.stock_disponible', 'asc');

    return {
      diasUmbralEvaluados: umbral,
      fechaEvaluacion: today,
      resumen: {
        totalLotesVencidos: lotesVencidos.length,
        totalLotesPorVencer: lotesPorVencer.length,
        totalLotesBajoStock: lotesBajoStock.length
      },
      lotesVencidos,
      lotesPorVencer,
      lotesBajoStock
    };
  }

  /**
   * Reporte de productividad clínica y atención de citas
   */
  async getClinicalProductivityReport({ fechaInicio, fechaFin } = {}) {
    let citasQuery = db('citas')
      .leftJoin('usuarios', 'citas.veterinario_id', 'usuarios.id')
      .select(
        'citas.veterinario_id',
        'usuarios.nombre as veterinarioNombre',
        'usuarios.apellido as veterinarioApellido',
        'citas.estado'
      );

    if (fechaInicio) {
      citasQuery = citasQuery.where('citas.fecha_hora_inicio', '>=', `${fechaInicio} 00:00:00`);
    }
    if (fechaFin) {
      citasQuery = citasQuery.where('citas.fecha_hora_inicio', '<=', `${fechaFin} 23:59:59`);
    }

    const citas = await citasQuery;

    const porVeterinario = {};
    let totalCitas = 0;
    let completadas = 0;
    let canceladas = 0;

    for (const c of citas) {
      totalCitas++;
      const vId = c.veterinario_id || 'sin_asignar';
      const vName = c.veterinarioNombre ? `Dr(a). ${c.veterinarioNombre} ${c.veterinarioApellido || ''}`.trim() : 'Sin Asignar';

      if (!porVeterinario[vId]) {
        porVeterinario[vId] = {
          veterinarioId: c.veterinario_id,
          nombre: vName,
          totalCitas: 0,
          completadas: 0,
          canceladas: 0,
          otras: 0
        };
      }

      porVeterinario[vId].totalCitas++;
      if (c.estado === 'completada') {
        porVeterinario[vId].completadas++;
        completadas++;
      } else if (c.estado === 'cancelada') {
        porVeterinario[vId].canceladas++;
        canceladas++;
      } else {
        porVeterinario[vId].otras++;
      }
    }

    // Recetas médicas emitidas en el periodo
    let recetasQuery = db('recetas');
    if (fechaInicio) {
      recetasQuery = recetasQuery.where('fecha_emision', '>=', fechaInicio);
    }
    if (fechaFin) {
      recetasQuery = recetasQuery.where('fecha_emision', '<=', fechaFin);
    }
    const recetas = await recetasQuery;

    return {
      rango: {
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null
      },
      resumen: {
        totalCitas,
        completadas,
        canceladas,
        tasaEfectividad: totalCitas > 0 ? Number(((completadas / totalCitas) * 100).toFixed(1)) : 0,
        totalRecetasEmitidas: recetas.length
      },
      desgloseVeterinarios: Object.values(porVeterinario)
    };
  }

  /**
   * Registro y trazabilidad de medicamentos controlados
   */
  async getControlledMedicationLog({ fechaInicio, fechaFin, limit = 50, offset = 0 } = {}) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    let query = db('recetas_items')
      .join('recetas', 'recetas_items.receta_id', 'recetas.id')
      .leftJoin('usuarios', 'recetas.veterinario_id', 'usuarios.id')
      .leftJoin('mascotas', 'recetas.mascota_id', 'mascotas.id')
      .leftJoin('productos', 'recetas_items.producto_id', 'productos.id')
      .where('productos.es_controlado', true)
      .select(
        'recetas_items.id as itemRecetaId',
        'recetas.id as recetaId',
        'recetas.folio',
        'recetas.fecha_emision as fechaEmision',
        'recetas_items.nombre_medicamento as medicamentoNombre',
        'recetas_items.dosis',
        'recetas_items.frecuencia',
        'recetas_items.duracion_dias as duracionDias',
        'usuarios.nombre as veterinarioNombre',
        'usuarios.apellido as veterinarioApellido',
        'usuarios.cedula_profesional as cedulaProfesional',
        'mascotas.nombre as mascotaNombre',
        'mascotas.especie as mascotaEspecie'
      );

    let countQuery = db('recetas_items')
      .join('recetas', 'recetas_items.receta_id', 'recetas.id')
      .leftJoin('productos', 'recetas_items.producto_id', 'productos.id')
      .where('productos.es_controlado', true)
      .count('recetas_items.id as total');

    if (fechaInicio) {
      query = query.where('recetas.fecha_emision', '>=', fechaInicio);
      countQuery = countQuery.where('recetas.fecha_emision', '>=', fechaInicio);
    }
    if (fechaFin) {
      query = query.where('recetas.fecha_emision', '<=', fechaFin);
      countQuery = countQuery.where('recetas.fecha_emision', '<=', fechaFin);
    }

    const [totalRow] = await countQuery;
    const total = parseInt(totalRow ? totalRow.total : 0, 10);

    const log = await query
      .orderBy('recetas.fecha_emision', 'desc')
      .orderBy('recetas_items.id', 'desc')
      .limit(lim)
      .offset(off);

    return {
      total,
      limit: lim,
      offset: off,
      data: log
    };
  }

  /**
   * Genera el Libro Digital Oficial de Medicamentos Controlados (SENASICA / SSA / SAGARPA)
   * Formato foliado legal para auditorías sanitarias e inspecciones oficiales
   */
  async getSenasicaOfficialBook({ anio = new Date().getFullYear(), mes = null } = {}) {
    let query = db('recetas_items')
      .join('recetas', 'recetas_items.receta_id', 'recetas.id')
      .leftJoin('usuarios as vet', 'recetas.veterinario_id', 'vet.id')
      .leftJoin('mascotas', 'recetas.mascota_id', 'mascotas.id')
      .leftJoin('usuarios_mascotas as um', function() {
        this.on('mascotas.id', '=', 'um.mascota_id').andOn('um.es_propietario_principal', '=', db.raw('?', [true]));
      })
      .leftJoin('usuarios as tutor', 'um.usuario_id', 'tutor.id')
      .leftJoin('productos', 'recetas_items.producto_id', 'productos.id')
      .leftJoin('lotes', 'productos.id', 'lotes.producto_id')
      .where('productos.es_controlado', true)
      .select(
        'recetas_items.id as renglonId',
        'recetas.folio as folioReceta',
        'recetas.fecha_emision as fecha',
        'recetas.firma_digital_hash as firmaSello',
        'productos.nombre as denominacionDistintiva',
        'recetas_items.nombre_medicamento as principioActivo',
        'lotes.numero_lote as lote',
        'lotes.fecha_caducidad as caducidad',
        'recetas_items.cantidad_prescrita as cantidadSurtida',
        'recetas_items.dosis',
        'recetas_items.frecuencia',
        'recetas_items.duracion_dias as duracionDias',
        'mascotas.nombre as nombrePaciente',
        'mascotas.especie as especie',
        'mascotas.raza as raza',
        'tutor.nombre as nombreTutor',
        'vet.nombre as nombreMedico',
        'vet.apellido as apellidoMedico',
        'vet.cedula_profesional as cedulaProfesional'
      )
      .orderBy('recetas.fecha_emision', 'asc')
      .orderBy('recetas_items.id', 'asc');

    const registros = await query;

    // Calcular folios de libro oficial 001, 002...
    const renglonesFoliados = registros.map((r, index) => ({
      numeroPartida: String(index + 1).padStart(4, '0'),
      ...r,
      nombreMedicoCompleto: `${r.nombreMedico || ''} ${r.apellidoMedico || ''}`.trim() || 'Médico Luna-Vet',
      saldoActualizado: 0
    }));

    return {
      encabezadoOficial: {
        establecimiento: 'Luna-Vet Clínica Veterinaria, Farmacia & Estética',
        razonSocial: 'Servicios Veterinarios Integrales Luna-Vet S.A. de C.V.',
        registroSanitarioSAGARPA: 'SAGARPA-SENASICA-AUT-2026-GRO-0442',
        domicilio: 'Costera Miguel Alemán #123, Fracc. Magallanes, Acapulco, Guerrero',
        directorResponsable: 'Dra. Luna Valenzuela (Céd. Prof. 8492019 / SENASICA-VET-449)',
        ejercicioFiscal: anio,
        mesReportado: mes || 'Consolidado General',
        fechaEmisionLibro: new Date().toISOString()
      },
      resumenEstadistico: {
        totalPartidasRegistradas: renglonesFoliados.length,
        totalUnidadesSurtidas: renglonesFoliados.reduce((acc, curr) => acc + (parseInt(curr.cantidadSurtida, 10) || 0), 0)
      },
      partidas: renglonesFoliados
    };
  }

  /**
   * ==========================================
   * EXPLORADOR DE AUDITORÍA AVANZADA
   * ==========================================
   */

  /**
   * Consultar bitácora de auditoría con filtros multidimensionales y paginación
   */
  async getAuditLogs({ usuarioId, accion, entidad, fechaInicio, fechaFin, limit = 50, offset = 0 } = {}) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    let query = db('bitacora_auditoria')
      .leftJoin('usuarios', 'bitacora_auditoria.usuario_id', 'usuarios.id')
      .select(
        'bitacora_auditoria.id',
        'bitacora_auditoria.usuario_id',
        'usuarios.email as usuarioEmail',
        'usuarios.nombre as usuarioNombre',
        'usuarios.rol as usuarioRol',
        'bitacora_auditoria.accion',
        'bitacora_auditoria.entidad',
        'bitacora_auditoria.entidad_id',
        'bitacora_auditoria.detalles',
        'bitacora_auditoria.ip_origen as ipOrigen',
        'bitacora_auditoria.user_agent as userAgent',
        'bitacora_auditoria.nivel_criticidad as nivelCriticidad',
        'bitacora_auditoria.creado_en as createdAt'
      );

    let countQuery = db('bitacora_auditoria').count('bitacora_auditoria.id as total');

    if (usuarioId) {
      query = query.where('bitacora_auditoria.usuario_id', usuarioId);
      countQuery = countQuery.where('bitacora_auditoria.usuario_id', usuarioId);
    }

    if (accion && accion.trim()) {
      query = query.where('bitacora_auditoria.accion', accion.trim());
      countQuery = countQuery.where('bitacora_auditoria.accion', accion.trim());
    }

    if (entidad && entidad.trim()) {
      query = query.where('bitacora_auditoria.entidad', entidad.trim());
      countQuery = countQuery.where('bitacora_auditoria.entidad', entidad.trim());
    }

    if (fechaInicio) {
      query = query.where('bitacora_auditoria.creado_en', '>=', `${fechaInicio} 00:00:00`);
      countQuery = countQuery.where('bitacora_auditoria.creado_en', '>=', `${fechaInicio} 00:00:00`);
    }

    if (fechaFin) {
      query = query.where('bitacora_auditoria.creado_en', '<=', `${fechaFin} 23:59:59`);
      countQuery = countQuery.where('bitacora_auditoria.creado_en', '<=', `${fechaFin} 23:59:59`);
    }

    const [totalRow] = await countQuery;
    const total = parseInt(totalRow ? totalRow.total : 0, 10);

    const logs = await query
      .orderBy('bitacora_auditoria.id', 'desc')
      .limit(lim)
      .offset(off);

    const parsedLogs = logs.map(l => {
      let detalles = l.detalles;
      if (typeof detalles === 'string') {
        try {
          detalles = JSON.parse(detalles);
        } catch {
          // Si no es JSON válido se preserva como string
        }
      }
      return {
        ...l,
        detalles
      };
    });

    return {
      total,
      limit: lim,
      offset: off,
      data: parsedLogs
    };
  }

  /**
   * ==========================================
   * PARÁMETROS GLOBALES DE LA CLÍNICA
   * ==========================================
   */

  /**
   * Obtener configuración global de la clínica
   */
  async getClinicSettings() {
    const section = await db('cms_secciones')
      .where({ clave_seccion: 'configuracion_clinica' })
      .first();

    const defaultSettings = {
      nombreClinica: 'Clínica Veterinaria Luna-Vet',
      slogan: '¡Porque no son solo mascotas, sino un miembro importante de nuestra familia!',
      telefonoEmergencias: '+52 744 213 0868',
      whatsapp: '7442130868',
      facebookUrl: 'https://www.facebook.com/profile.php?id=100083388274818',
      emailContacto: 'contacto@lunavet.lat',
      direccion: 'Av. Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero',
      horarioAtencion: 'Lunes a Sábado de 09:00 a 20:00 hrs, Domingos 10:00 a 15:00 hrs',
      duracionCitaDefaultMinutos: 30,
      diasAnticipacionCitasMax: 60,
      politicaCancelacionHoras: 24
    };

    if (!section || !section.metadatos_json) {
      return defaultSettings;
    }

    let parsed = section.metadatos_json;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = {};
      }
    }

    return {
      ...defaultSettings,
      ...parsed
    };
  }

  /**
   * Actualizar configuración global de la clínica
   */
  async updateClinicSettings(payload, adminUser) {
    const existing = await db('cms_secciones')
      .where({ clave_seccion: 'configuracion_clinica' })
      .first();

    const settingsJson = JSON.stringify(payload);

    if (existing) {
      await db('cms_secciones')
        .where({ clave_seccion: 'configuracion_clinica' })
        .update({
          titulo: payload.nombreClinica || existing.titulo,
          metadatos_json: settingsJson
        });
    } else {
      await db('cms_secciones').insert({
        clave_seccion: 'configuracion_clinica',
        titulo: payload.nombreClinica || 'Configuración de Clínica',
        contenido_html: '',
        metadatos_json: settingsJson,
        actualizado_por_id: adminUser ? adminUser.id : null
      });
    }

    await auditService.log({
      usuarioId: adminUser ? adminUser.id : null,
      accion: 'CLINIC_SETTINGS_UPDATED',
      entidad: 'cms_secciones',
      entidadId: existing ? existing.id : 1,
      detalles: { payload }
    });

    return this.getClinicSettings();
  }
}

module.exports = new AdminService();
