const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const adminService = require('./admin.service');

const router = express.Router();

// Todas las rutas del panel administrativo exigen autenticación y rol de administrador
router.use(requireAuth, requireRole('administrador'));

/**
 * ==========================================
 * RUTAS DE GESTIÓN DE PERSONAL / STAFF
 * ==========================================
 */

// Listar usuarios con filtros y paginación
router.get('/staff', async (req, res, next) => {
  try {
    const result = await adminService.listStaffUsers(req.query);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
});

// Obtener detalle de usuario staff por ID
router.get('/staff/:id', async (req, res, next) => {
  try {
    const user = await adminService.getStaffUserById(req.params.id);
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
});

// Crear nuevo usuario staff
router.post('/staff', async (req, res, next) => {
  try {
    const user = await adminService.createStaffUser(req.body, req.user);
    res.status(201).json({ status: 'success', message: 'Usuario staff creado exitosamente', data: user });
  } catch (err) {
    next(err);
  }
});

// Actualizar perfil de usuario staff
router.put('/staff/:id', async (req, res, next) => {
  try {
    const user = await adminService.updateStaffUser(req.params.id, req.body, req.user);
    res.status(200).json({ status: 'success', message: 'Usuario actualizado exitosamente', data: user });
  } catch (err) {
    next(err);
  }
});

// Restablecer contraseña de staff por administrador
router.post('/staff/:id/reset-password', async (req, res, next) => {
  try {
    const newPassword = req.body.newPassword || req.body.nuevaPassword;
    const result = await adminService.resetStaffUserPassword(req.params.id, newPassword, req.user);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (err) {
    next(err);
  }
});

// Cambiar estado activo/inactivo de staff
router.patch('/staff/:id/status', async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id, req.body.activo, req.user);
    res.status(200).json({ status: 'success', message: 'Estado de usuario actualizado', data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * RUTAS DE DASHBOARD Y REPORTES
 * ==========================================
 */

// Resumen general de KPIs en tiempo real
router.get('/dashboard', async (req, res, next) => {
  try {
    const summary = await adminService.getDashboardSummary();
    res.status(200).json({ status: 'success', data: summary });
  } catch (err) {
    next(err);
  }
});

// Reporte financiero y desglose de ventas
router.get('/reports/financial', async (req, res, next) => {
  try {
    const report = await adminService.getFinancialReport(req.query);
    res.status(200).json({ status: 'success', data: report });
  } catch (err) {
    next(err);
  }
});

// Reporte de inventario en riesgo (FEFO)
router.get('/reports/inventory-risk', async (req, res, next) => {
  try {
    const report = await adminService.getInventoryRiskReport(req.query);
    res.status(200).json({ status: 'success', data: report });
  } catch (err) {
    next(err);
  }
});

// Reporte de productividad clínica y citas
router.get('/reports/clinical-productivity', async (req, res, next) => {
  try {
    const report = await adminService.getClinicalProductivityReport(req.query);
    res.status(200).json({ status: 'success', data: report });
  } catch (err) {
    next(err);
  }
});

// Trazabilidad de medicamentos controlados
router.get('/reports/controlled-medications', async (req, res, next) => {
  try {
    const report = await adminService.getControlledMedicationLog(req.query);
    res.status(200).json({ status: 'success', data: report });
  } catch (err) {
    next(err);
  }
});

// Libro oficial de medicamentos controlados formato legal foliado (SENASICA / SSA)
router.get('/reports/senasica-book', async (req, res, next) => {
  try {
    const book = await adminService.getSenasicaOfficialBook(req.query);
    res.status(200).json({ status: 'success', data: book });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * RUTAS DE AUDITORÍA Y CONFIGURACIÓN
 * ==========================================
 */

// Explorador de bitácora de auditoría
router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await adminService.getAuditLogs(req.query);
    res.status(200).json({ status: 'success', data: logs });
  } catch (err) {
    next(err);
  }
});

// Consultar parámetros globales de la clínica
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await adminService.getClinicSettings();
    res.status(200).json({ status: 'success', data: settings });
  } catch (err) {
    next(err);
  }
});

// Actualizar parámetros globales de la clínica
router.put('/settings', async (req, res, next) => {
  try {
    const settings = await adminService.updateClinicSettings(req.body, req.user);
    res.status(200).json({ status: 'success', message: 'Configuración actualizada', data: settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
