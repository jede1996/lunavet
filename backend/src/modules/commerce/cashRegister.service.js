const { db } = require('../../config/database');
const { ValidationError, NotFoundError, ConflictError } = require('../../core/errors');

class CashRegisterService {
  /**
   * Abre un nuevo turno de caja chica para el cajero/recepcionista
   */
  static async abrirTurno({ usuario_id, sucursal_id, monto_inicial = 0, notas = '' }) {
    if (!usuario_id) {
      throw new ValidationError('El usuario responsable de apertura es requerido');
    }

    // Verificar si ya tiene un turno abierto
    const turnoAbierto = await db('cajas_turnos')
      .where({ usuario_id, estado: 'abierta' })
      .first();

    if (turnoAbierto) {
      throw new ConflictError('Ya cuentas con un turno de caja abierto. Realiza el Corte Z de cierre antes de aperturar uno nuevo.');
    }

    const inicial = parseFloat(monto_inicial) || 0;
    if (inicial < 0) {
      throw new ValidationError('El monto inicial no puede ser negativo');
    }

    const [id] = await db('cajas_turnos').insert({
      usuario_id,
      sucursal_id: sucursal_id || null,
      fecha_apertura: new Date(),
      monto_inicial: inicial,
      monto_cierre_esperado: inicial,
      estado: 'abierta',
      notas: notas || null,
      creado_en: new Date()
    });

    return this.obtenerTurnoPorId(id);
  }

  /**
   * Obtiene el turno activo del usuario o el turno activo global más reciente
   */
  static async obtenerTurnoActivo(usuario_id) {
    let query = db('cajas_turnos as ct')
      .join('usuarios as u', 'ct.usuario_id', 'u.id')
      .where('ct.estado', 'abierta')
      .select('ct.*', 'u.nombre as resp_nombre', 'u.apellido as resp_apellido')
      .orderBy('ct.fecha_apertura', 'desc');

    if (usuario_id) {
      query = query.where('ct.usuario_id', usuario_id);
    }

    const turno = await query.first();
    if (!turno) return null;

    return this.calcularCorteX(turno.id);
  }

  static async obtenerTurnoPorId(id) {
    const turno = await db('cajas_turnos as ct')
      .join('usuarios as u', 'ct.usuario_id', 'u.id')
      .where('ct.id', id)
      .select('ct.*', 'u.nombre as resp_nombre', 'u.apellido as resp_apellido')
      .first();

    if (!turno) {
      throw new NotFoundError('Turno de caja no encontrado');
    }

    return this.calcularCorteX(id);
  }

  /**
   * Registra una entrada o salida manual de efectivo en caja (pago a proveedores, recarga de cambio, etc.)
   */
  static async registrarMovimiento({ caja_turno_id, usuario_id, tipo, monto, motivo }) {
    if (!['entrada', 'salida'].includes(tipo)) {
      throw new ValidationError('El tipo de movimiento debe ser entrada o salida');
    }

    const valor = parseFloat(monto);
    if (isNaN(valor) || valor <= 0) {
      throw new ValidationError('El monto del movimiento debe ser mayor a 0');
    }

    if (!motivo) {
      throw new ValidationError('Debe especificar el motivo del movimiento de efectivo');
    }

    const turno = await db('cajas_turnos').where({ id: caja_turno_id, estado: 'abierta' }).first();
    if (!turno) {
      throw new NotFoundError('No se encontró un turno de caja abierto con ese ID');
    }

    const [id] = await db('movimientos_caja').insert({
      caja_turno_id,
      tipo,
      monto: valor,
      motivo,
      registrado_por_id: usuario_id,
      creado_en: new Date()
    });

    if (tipo === 'entrada') {
      await db('cajas_turnos').where({ id: caja_turno_id }).increment('total_entradas_manuales', valor);
    } else {
      await db('cajas_turnos').where({ id: caja_turno_id }).increment('total_salidas_manuales', valor);
    }

    return db('movimientos_caja').where({ id }).first();
  }

  /**
   * Genera el arqueo parcial en tiempo real (Corte X)
   */
  static async calcularCorteX(caja_turno_id) {
    const turno = await db('cajas_turnos as ct')
      .join('usuarios as u', 'ct.usuario_id', 'u.id')
      .where('ct.id', caja_turno_id)
      .select('ct.*', 'u.nombre as resp_nombre', 'u.apellido as resp_apellido')
      .first();

    if (!turno) {
      throw new NotFoundError('Turno de caja no encontrado');
    }

    const movimientos = await db('movimientos_caja as mc')
      .join('usuarios as u', 'mc.registrado_por_id', 'u.id')
      .where('mc.caja_turno_id', caja_turno_id)
      .select('mc.*', 'u.nombre as reg_nombre', 'u.apellido as reg_apellido')
      .orderBy('mc.creado_en', 'desc');

    const inicial = parseFloat(turno.monto_inicial) || 0;
    const ventasEfectivo = parseFloat(turno.total_ventas_efectivo) || 0;
    const ventasTarjeta = parseFloat(turno.total_ventas_tarjeta) || 0;
    const ventasTransf = parseFloat(turno.total_ventas_transferencia) || 0;
    const entradas = parseFloat(turno.total_entradas_manuales) || 0;
    const salidas = parseFloat(turno.total_salidas_manuales) || 0;

    const saldoEsperadoEfectivo = parseFloat((inicial + ventasEfectivo + entradas - salidas).toFixed(2));
    const totalIngresosTotales = parseFloat((ventasEfectivo + ventasTarjeta + ventasTransf + entradas).toFixed(2));

    return {
      ...turno,
      responsable_nombre: `${turno.resp_nombre || ''} ${turno.resp_apellido || ''}`.trim() || 'Cajero Luna-Vet',
      monto_inicial: inicial,
      total_ventas_efectivo: ventasEfectivo,
      total_ventas_tarjeta: ventasTarjeta,
      total_ventas_transferencia: ventasTransf,
      total_entradas_manuales: entradas,
      total_salidas_manuales: salidas,
      monto_cierre_esperado: saldoEsperadoEfectivo,
      total_ingresos_global: totalIngresosTotales,
      movimientos: movimientos.map(m => ({
        ...m,
        registrado_por_nombre: `${m.reg_nombre || ''} ${m.reg_apellido || ''}`.trim() || 'Personal Luna-Vet'
      }))
    };
  }

  /**
   * Cierra de forma definitiva el turno de caja (Corte Z)
   */
  static async cerrarTurnoCorteZ(caja_turno_id, { monto_cierre_real, notas = '' }) {
    const arqueo = await this.calcularCorteX(caja_turno_id);

    if (arqueo.estado === 'cerrada') {
      throw new ConflictError('Este turno de caja ya se encuentra cerrado');
    }

    const real = parseFloat(monto_cierre_real);
    if (isNaN(real) || real < 0) {
      throw new ValidationError('Debe ingresar el conteo real de efectivo en caja');
    }

    const esperado = arqueo.monto_cierre_esperado;
    const diferencia = parseFloat((real - esperado).toFixed(2));

    await db('cajas_turnos').where({ id: caja_turno_id }).update({
      monto_cierre_esperado: esperado,
      monto_cierre_real: real,
      diferencia,
      fecha_cierre: new Date(),
      estado: 'cerrada',
      notas: notas || arqueo.notas || null
    });

    return this.obtenerTurnoPorId(caja_turno_id);
  }

  static async listarTurnosHistorial(filtros = {}) {
    let query = db('cajas_turnos as ct')
      .join('usuarios as u', 'ct.usuario_id', 'u.id')
      .select('ct.*', 'u.nombre as resp_nombre', 'u.apellido as resp_apellido')
      .orderBy('ct.fecha_apertura', 'desc');

    if (filtros.estado) {
      query = query.where('ct.estado', filtros.estado);
    }
    if (filtros.usuario_id) {
      query = query.where('ct.usuario_id', filtros.usuario_id);
    }

    const rows = await query;
    return rows.map(r => ({
      ...r,
      responsable_nombre: `${r.resp_nombre || ''} ${r.resp_apellido || ''}`.trim() || 'Cajero Luna-Vet'
    }));
  }
}

module.exports = CashRegisterService;
