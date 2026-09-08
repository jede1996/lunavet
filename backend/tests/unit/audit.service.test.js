const auditService = require('../../src/core/audit.service');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const { ValidationError } = require('../../src/core/errors');

describe('AuditService - Bitácora Inmutable de Auditoría (LFPDPPP y Controlados)', () => {
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('bitacora_auditoria').del();
  });

  test('debe registrar un evento de auditoría exitosamente', async () => {
    const logId = await auditService.log({
      usuarioId: 10,
      accion: 'CONSULTA_EXPEDIENTE',
      entidad: 'ExpedienteClinico',
      entidadId: '45',
      detalles: { motivo: 'Revisión periódica de dermatitis' },
      ipOrigen: '189.200.10.5',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      nivelCriticidad: 'info'
    });

    expect(logId).toBeDefined();
    expect(typeof logId).toBe('number');

    const logs = await auditService.getLogs({ entidad: 'ExpedienteClinico' });
    expect(logs).toHaveLength(1);
    expect(logs[0].accion).toBe('CONSULTA_EXPEDIENTE');
    expect(logs[0].usuario_id).toBe(10);
    expect(logs[0].entidad_id).toBe('45');
    expect(logs[0].nivel_criticidad).toBe('info');

    const parsedDetalles = JSON.parse(logs[0].detalles);
    expect(parsedDetalles.motivo).toBe('Revisión periódica de dermatitis');
  });

  test('debe registrar y filtrar eventos críticos (ej. auditoría de medicamentos controlados)', async () => {
    await auditService.log({
      usuarioId: 2,
      accion: 'VALIDACION_CONTROLADO',
      entidad: 'Receta',
      entidadId: '99',
      detalles: 'Aprobación de dispensación de Fentanilo veterinario',
      nivelCriticidad: 'critico'
    });

    await auditService.log({
      usuarioId: 5,
      accion: 'LOGIN_EXITOSO',
      entidad: 'Usuario',
      entidadId: '5',
      nivelCriticidad: 'info'
    });

    const logsUsuario2 = await auditService.getLogs({ usuarioId: 2 });
    expect(logsUsuario2).toHaveLength(1);
    expect(logsUsuario2[0].accion).toBe('VALIDACION_CONTROLADO');
    expect(logsUsuario2[0].nivel_criticidad).toBe('critico');
  });

  test('debe lanzar error de validación si faltan acción o entidad requeridas', async () => {
    await expect(auditService.log({ entidad: 'Mascota' })).rejects.toThrow(ValidationError);
    await expect(auditService.log({ accion: 'CREAR' })).rejects.toThrow(ValidationError);
  });
});
