const express = require('express');
const authService = require('./auth.service');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rate-limiter.middleware');

const router = express.Router();

// Registro de clientes
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { email, password, nombre, apellido, telefono } = req.body;
    const result = await authService.registerClient({
      email,
      password,
      nombre,
      apellido,
      telefono,
      ipOrigen: req.clientIp,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Inicio de sesión de clientes
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password, totpToken } = req.body;
    const result = await authService.login({
      email,
      password,
      totpToken,
      ipOrigen: req.clientIp,
      userAgent: req.headers['user-agent'],
      isStaff: false
    });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Inicio de sesión para staff de la clínica
router.post('/staff/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password, totpToken } = req.body;
    const result = await authService.login({
      email,
      password,
      totpToken,
      ipOrigen: req.clientIp,
      userAgent: req.headers['user-agent'],
      isStaff: true
    });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión de staff exitoso.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Rotación de token de refresco (soporta /refresh y alias /refresh-token)
const refreshHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshSession({
      refreshToken,
      ipOrigen: req.clientIp,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente.',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

router.post('/refresh', refreshHandler);
router.post('/refresh-token', refreshHandler);

// Cierre de sesión
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout({ refreshToken });

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente.'
    });
  } catch (err) {
    next(err);
  }
});

// Obtener perfil del usuario autenticado
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { db } = require('../../config/database');
    const user = await db('usuarios').where('id', req.user.id).first();
    res.status(200).json({
      success: true,
      data: authService.sanitizeUser(user)
    });
  } catch (err) {
    next(err);
  }
});

// Cambio de contraseña
router.post('/change-password', requireAuth, authLimiter, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Iniciar configuración 2FA
router.post('/2fa/setup', requireAuth, async (req, res, next) => {
  try {
    const result = await authService.setup2FA(req.user.id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// Confirmar y habilitar 2FA
router.post('/2fa/verify', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body;
    const result = await authService.verifyAndEnable2FA(req.user.id, code);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Creación de usuario Staff por Administrador
router.post('/staff/users', requireAuth, requireRole('administrador'), async (req, res, next) => {
  try {
    const result = await authService.createStaffUser(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Usuario de staff creado exitosamente.',
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
