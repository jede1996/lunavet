const express = require('express');
const multer = require('multer');
const petService = require('./pet.service');
const blobService = require('../../core/blob.service');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

// Configuración de Multer para almacenar en memoria (sin escribir a disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Registrar nueva mascota
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const pet = await petService.createPet(
      req.body,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );
    res.status(201).json({
      success: true,
      message: 'Mascota registrada exitosamente.',
      data: pet
    });
  } catch (err) {
    next(err);
  }
});

// Listar mascotas del usuario (o todas si es staff)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { limit, offset, busqueda } = req.query;
    const pets = await petService.listPets(req.user, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      busqueda: busqueda || ''
    });

    res.status(200).json({
      success: true,
      data: pets
    });
  } catch (err) {
    next(err);
  }
});

// Consultar ficha de una mascota específica
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    const pet = await petService.getPetById(petId, req.user);

    res.status(200).json({
      success: true,
      data: pet
    });
  } catch (err) {
    next(err);
  }
});

// Actualizar datos de una mascota
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    const updated = await petService.updatePet(
      petId,
      req.body,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      message: 'Información de la mascota actualizada.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// Añadir cotitular (dueño adicional)
router.post('/:id/owners', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    const { email } = req.body;
    const result = await petService.addCoOwner(
      petId,
      email,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Remover cotitular
router.delete('/:id/owners/:userId', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const result = await petService.removeCoOwner(
      petId,
      targetUserId,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Transferir titularidad principal a otro usuario
router.post('/:id/transfer', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    const { newOwnerEmail, motivo } = req.body;
    const result = await petService.transferOwnership(
      petId,
      newOwnerEmail,
      motivo,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Subir fotografía de la mascota (Almacenada como BLOB en MySQL)
router.post('/:id/photo', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_REQUIRED', message: 'Debe adjuntar un archivo de imagen en el campo photo.' }
      });
    }

    const fileObj = {
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname
    };

    const result = await petService.uploadPetPhoto(
      petId,
      fileObj,
      req.user,
      req.clientIp,
      req.headers['user-agent']
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Endpoint seguro de streaming para visualizar la fotografía BLOB
router.get('/:id/photo', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    // Validar acceso del usuario
    const access = await petService.checkUserPetAccess(petId, req.user);
    if (!access.canRead) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No tiene permisos para ver la fotografía de esta mascota.' }
      });
    }

    const blobRecord = await petService.getPetPhotoBlob(petId);
    blobService.streamBlobResponse(res, blobRecord, false);
  } catch (err) {
    next(err);
  }
});

// Endpoint seguro para descargar plantilla imprimible de identificación QR
router.get('/:id/qr-pdf', requireAuth, async (req, res, next) => {
  try {
    const petId = parseInt(req.params.id, 10);
    const blobRecord = await petService.getPetQrTagPdf(petId, req.user);
    blobService.streamBlobResponse(res, blobRecord, false);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
