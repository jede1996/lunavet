const express = require('express');
const {
  helmetMiddleware,
  corsMiddleware,
  clientIpMiddleware,
  permissionsPolicyMiddleware,
  prototypePollutionMiddleware
} = require('./middleware/security.middleware');
const { compressionMiddleware } = require('./core/compression.middleware');
const { globalLimiter } = require('./middleware/rate-limiter.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const petRoutes = require('./modules/pets/pet.routes');
const clinicalRoutes = require('./modules/clinical/clinical.routes');
const appointmentRoutes = require('./modules/appointments/appointment.routes');
const commerceRoutes = require('./modules/commerce/commerce.routes');
const cmsRoutes = require('./modules/cms/cms.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// Seguridad base y cabeceras
app.use(helmetMiddleware);
app.use(permissionsPolicyMiddleware);
app.use(corsMiddleware);
app.use(clientIpMiddleware);

// Compresión nativa HTTP (gzip, br, deflate)
app.use(compressionMiddleware());

// Limitación de tasa global contra denegación de servicio (DoS)
app.use(globalLimiter);

// Parseo de payloads JSON y urlencoded (límite de 2MB para mitigar agotamiento de memoria)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Protección contra Prototype Pollution en parámetros y cuerpos de petición
app.use(prototypePollutionMiddleware);

// Deshabilitar cabecera X-Powered-By para evitar fingerprinting de tecnología
app.disable('x-powered-by');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/commerce', commerceRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de verificación de salud (Liveness / Readiness)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LunaVet Backend Core',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Manejador de rutas no encontradas (404)
app.use(notFoundHandler);

// Manejador centralizado de errores (500, 400, etc.)
app.use(errorHandler);

module.exports = app;
