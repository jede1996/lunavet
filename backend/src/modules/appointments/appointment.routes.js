const express = require('express');
const appointmentService = require('./appointment.service');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { requireCronKey } = require('../../middleware/cron.middleware');

const router = express.Router();

// Registrar servicio en catálogo (Administrador)
router.post('/services', requireAuth, requireRole('administrador'), async (req, res, next) => {
  try {
    const service = await appointmentService.createService(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Servicio registrado en catálogo.',
      data: service
    });
  } catch (err) {
    next(err);
  }
});

// Listar servicios disponibles (Público / Clientes)
router.get('/services', async (req, res, next) => {
  try {
    const services = await appointmentService.listServices();
    res.status(200).json({
      success: true,
      data: services
    });
  } catch (err) {
    next(err);
  }
});

// Agendar cita
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );
    res.status(201).json({
      success: true,
      message: 'Cita agendada exitosamente.',
      data: appointment
    });
  } catch (err) {
    next(err);
  }
});

// Listar citas
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { fecha, veterinarioId, estado, limit, offset } = req.query;
    const appointments = await appointmentService.listAppointments(req.user, {
      fecha,
      veterinarioId: veterinarioId ? parseInt(veterinarioId, 10) : null,
      estado,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
});

// Actualizar estado de cita
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const citaId = parseInt(req.params.id, 10);
    const { estado } = req.body;
    const result = await appointmentService.updateAppointmentStatus(citaId, estado, req.user);

    res.status(200).json({
      success: true,
      message: 'Estado de la cita actualizado.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// Endpoints invocados por Tareas Cron de cPanel a nivel de Sistema Operativo
// ===========================================================================

// Procesar recordatorios de citas
router.post('/cron/reminders', requireCronKey, async (req, res, next) => {
  try {
    const result = await appointmentService.processReminders();
    res.status(200).json({
      success: true,
      task: 'CRON_RECORDATORIOS_CITAS',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Procesar recetas vencidas
router.post('/cron/expired-prescriptions', requireCronKey, async (req, res, next) => {
  try {
    const result = await appointmentService.processExpiredPrescriptions();
    res.status(200).json({
      success: true,
      task: 'CRON_RECETAS_VENCIDAS',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Monitorear vacunas próximas
router.post('/cron/vaccine-boosters', requireCronKey, async (req, res, next) => {
  try {
    const result = await appointmentService.checkUpcomingVaccineBoosters();
    res.status(200).json({
      success: true,
      task: 'CRON_VACUNAS_PROXIMAS',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
