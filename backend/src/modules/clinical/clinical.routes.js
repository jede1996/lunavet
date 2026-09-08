const express = require('express');
const clinicalService = require('./clinical.service');
const blobService = require('../../core/blob.service');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = express.Router();

// Registrar consulta médica (Veterinarios y Administrador)
router.post('/consultations', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const consultation = await clinicalService.createConsultation(
      req.body,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );
    res.status(201).json({
      success: true,
      message: 'Consulta clínica registrada exitosamente.',
      data: consultation
    });
  } catch (err) {
    next(err);
  }
});

// Obtener expediente clínico de una mascota
router.get('/consultations/pet/:petId', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.petId, 10);
    const records = await clinicalService.getPetConsultations(petId, req.user);
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    next(err);
  }
});

// Registrar alergia consolidada
router.post('/allergies', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const { mascotaId, sustancia, severidad, reaccion } = req.body;
    const allergy = await clinicalService.addPetAllergy(
      mascotaId,
      { sustancia, severidad, reaccion },
      req.user
    );
    res.status(201).json({
      success: true,
      message: 'Alergia registrada en el expediente.',
      data: allergy
    });
  } catch (err) {
    next(err);
  }
});

// Consultar lista de alergias de una mascota
router.get('/allergies/pet/:petId', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.petId, 10);
    const allergies = await clinicalService.getPetAllergies(petId, req.user);
    res.status(200).json({
      success: true,
      data: allergies
    });
  } catch (err) {
    next(err);
  }
});

// Registrar peso (serie de tiempo)
router.post('/weight', requireAuth, async (req, res, next) => {
  try {
    const { mascotaId, pesoKg, fechaRegistro, notas } = req.body;
    const record = await clinicalService.addWeightRecord(
      mascotaId,
      { pesoKg, fechaRegistro, notas },
      req.user
    );
    res.status(201).json({
      success: true,
      message: 'Registro de peso añadido exitosamente.',
      data: record
    });
  } catch (err) {
    next(err);
  }
});

// Consultar evolución de peso
router.get('/weight/pet/:petId', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.petId, 10);
    const history = await clinicalService.getPetWeightHistory(petId, req.user);
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
});

// Asentar vacuna en el carnet
router.post('/vaccines', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const { mascotaId, nombreVacuna, lote, fechaAplicacion, fechaProximaDosis } = req.body;
    const vaccine = await clinicalService.addVaccine(
      mascotaId,
      { nombreVacuna, lote, fechaAplicacion, fechaProximaDosis },
      req.user
    );
    res.status(201).json({
      success: true,
      message: 'Vacuna asentada en el carnet.',
      data: vaccine
    });
  } catch (err) {
    next(err);
  }
});

// Consultar carnet de vacunación
router.get('/vaccines/pet/:petId', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.petId, 10);
    const vaccines = await clinicalService.getPetVaccines(petId, req.user);
    res.status(200).json({
      success: true,
      data: vaccines
    });
  } catch (err) {
    next(err);
  }
});

// Emitir receta médica digital (con PDF generado y guardado en MySQL BLOB)
router.post('/prescriptions', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const { mascotaId, expedienteId, vigenciaDias, items } = req.body;
    const prescription = await clinicalService.createPrescription(
      mascotaId,
      { expedienteId, vigenciaDias, items },
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );
    res.status(201).json({
      success: true,
      message: 'Receta médica digital emitida y firmada.',
      data: prescription
    });
  } catch (err) {
    next(err);
  }
});

// Streaming seguro del documento PDF de la receta (BLOB de MySQL)
router.get('/prescriptions/:id/pdf', requireAuth, async (req, res, next) => {
  try {
    const prescriptionId = parseInt(req.params.id, 10);
    const blobRecord = await clinicalService.getPrescriptionPdfBlob(prescriptionId, req.user);
    blobService.streamBlobResponse(res, blobRecord, false);
  } catch (err) {
    next(err);
  }
});

// Streaming del carnet de vacunación y expediente clínico en PDF
router.get('/pets/:petId/pdf', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.petId, 10);
    const blobRecord = await clinicalService.getPetMedicalHistoryPdf(petId, req.user);
    blobService.streamBlobResponse(res, blobRecord, false);
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * PUNTO 5B: VERIFICACIÓN PÚBLICA DE RECETAS
 * ==========================================
 */
router.get('/prescriptions/verify/:folio', async (req, res, next) => {
  try {
    const verification = await clinicalService.verifyPrescriptionPublic(req.params.folio);
    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * PUNTO 1D: CALCULADORA FARMACOLÓGICA VETERINARIA
 * ==========================================
 */
const { VeterinaryDoseCalculator } = require('../../core/veterinaryDoseCalculator');

router.get('/calculator/drugs', (req, res) => {
  res.status(200).json({
    success: true,
    data: VeterinaryDoseCalculator.obtenerFarmacosPredefinidos()
  });
});

router.post('/calculator/dose', (req, res, next) => {
  try {
    const result = VeterinaryDoseCalculator.calcularDosis(req.body);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

router.post('/calculator/fluids', (req, res, next) => {
  try {
    const result = VeterinaryDoseCalculator.calcularFluidoterapia(req.body);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * PUNTO 1A: HOSPITALIZACIÓN Y TRIAGE UCI
 * ==========================================
 */
const HospitalizationService = require('./hospitalization.service');

router.post('/hospitalizations', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const data = await HospitalizationService.ingresarPaciente({
      ...req.body,
      veterinario_id: req.body.veterinario_id || req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Paciente ingresado a hospitalización exitosamente.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get('/hospitalizations', requireAuth, async (req, res, next) => {
  try {
    const filtros = { ...req.query };
    if (req.user.rol === 'cliente') {
      filtros.cliente_id = req.user.id;
    }
    const data = await HospitalizationService.obtenerHospitalizaciones(filtros);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/hospitalizations/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await HospitalizationService.obtenerHospitalizacionPorId(parseInt(req.params.id, 10), req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/hospitalizations/:id/monitoring', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const data = await HospitalizationService.registrarMonitoreo(parseInt(req.params.id, 10), {
      ...req.body,
      registrado_por_id: req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Monitoreo de signos vitales registrado.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.put('/hospitalizations/:id/discharge', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const data = await HospitalizationService.darDeAlta(parseInt(req.params.id, 10), req.body);
    res.status(200).json({
      success: true,
      message: 'Alta médica de hospitalización registrada.',
      data
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * PUNTO 1B: CONSENTIMIENTOS INFORMADOS DIGITALES
 * ==========================================
 */
const ConsentService = require('./consent.service');

router.get('/consents/templates', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: ConsentService.obtenerPlantillas()
  });
});

router.post('/consents', requireAuth, requireRole('veterinario', 'administrador', 'recepcionista'), async (req, res, next) => {
  try {
    const data = await ConsentService.registrarConsentimiento({
      ...req.body,
      veterinario_id: req.body.veterinario_id || req.user.id,
      metadata_ip: req.clientIp,
      user_agent: req.headers['user-agent']
    });
    res.status(201).json({
      success: true,
      message: 'Consentimiento informado firmado y sellado criptográficamente.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get('/consents', requireAuth, async (req, res, next) => {
  try {
    const filtros = { ...req.query };
    if (req.user.rol === 'cliente') {
      filtros.cliente_id = req.user.id;
    }
    const data = await ConsentService.listarConsentimientos(filtros);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/consents/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await ConsentService.obtenerConsentimientoPorId(parseInt(req.params.id, 10), req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * PUNTO 2A: ADMISIÓN DE ESTÉTICA ANATÓMICA
 * ==========================================
 */
const GroomingService = require('./grooming.service');

router.post('/grooming/checkins', requireAuth, requireRole('veterinario', 'recepcionista', 'administrador'), async (req, res, next) => {
  try {
    const data = await GroomingService.registrarCheckin({
      ...req.body,
      estilista_id: req.body.estilista_id || req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Check-in de estética registrado con mapa anatómico.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get('/grooming/checkins', requireAuth, async (req, res, next) => {
  try {
    const filtros = { ...req.query };
    if (req.user.rol === 'cliente') {
      filtros.cliente_id = req.user.id;
    }
    const data = await GroomingService.listarCheckins(filtros);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/grooming/checkins/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await GroomingService.obtenerCheckinPorId(parseInt(req.params.id, 10), req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.patch('/grooming/checkins/:id/status', requireAuth, requireRole('veterinario', 'recepcionista', 'administrador'), async (req, res, next) => {
  try {
    const data = await GroomingService.actualizarEstado(parseInt(req.params.id, 10), req.body.estado);
    res.status(200).json({
      success: true,
      message: 'Estado de estética actualizado.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get('/grooming/checkins/:id/whatsapp', requireAuth, requireRole('veterinario', 'recepcionista', 'administrador'), async (req, res, next) => {
  try {
    const data = await GroomingService.generarEnlaceWhatsApp(parseInt(req.params.id, 10));
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * ==========================================
 * PUNTOS 3A & 3B: RECORDATORIOS Y SEGUIMIENTOS
 * ==========================================
 */
const ReminderService = require('./reminder.service');

router.post('/reminders', requireAuth, requireRole('veterinario', 'recepcionista', 'administrador'), async (req, res, next) => {
  try {
    const data = await ReminderService.crearRecordatorio(req.body);
    res.status(201).json({
      success: true,
      message: 'Recordatorio preventivo programado.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reminders', requireAuth, async (req, res, next) => {
  try {
    const filtros = { ...req.query };
    if (req.user.rol === 'cliente') {
      filtros.cliente_id = req.user.id;
    }
    const data = await ReminderService.listarRecordatorios(filtros);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.patch('/reminders/:id/sent', requireAuth, requireRole('veterinario', 'recepcionista', 'administrador'), async (req, res, next) => {
  try {
    const data = await ReminderService.marcarEnviado(parseInt(req.params.id, 10));
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/reminders/sync-vaccines', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const data = await ReminderService.sincronizarVacunasPreventivas();
    res.status(200).json({
      success: true,
      message: 'Recordatorios de vacunas sincronizados.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.post('/followups', requireAuth, requireRole('veterinario', 'administrador'), async (req, res, next) => {
  try {
    const data = await ReminderService.crearSeguimiento({
      ...req.body,
      veterinario_id: req.body.veterinario_id || req.user.id
    });
    res.status(201).json({
      success: true,
      message: 'Seguimiento post-operatorio/consulta agendado.',
      data
    });
  } catch (err) {
    next(err);
  }
});

router.get('/followups', requireAuth, requireRole('veterinario', 'administrador', 'recepcionista'), async (req, res, next) => {
  try {
    const data = await ReminderService.listarSeguimientos(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.patch('/followups/:id/contact', requireAuth, requireRole('veterinario', 'administrador', 'recepcionista'), async (req, res, next) => {
  try {
    const data = await ReminderService.registrarContacto(parseInt(req.params.id, 10), req.body);
    res.status(200).json({
      success: true,
      message: 'Contacto de seguimiento registrado.',
      data
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
