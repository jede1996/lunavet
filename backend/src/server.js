const app = require('./app');
const config = require('./config/env');
const { db } = require('./config/database');

const server = app.listen(config.port, () => {
  console.log(`[LunaVet] Servidor iniciado en modo '${config.env}' en el puerto ${config.port}`);
});

// Manejo de apagado elegante (Graceful Shutdown)
async function gracefulShutdown(signal) {
  console.log(`[LunaVet] Recibida señal ${signal}. Cerrando conexiones...`);
  server.close(async () => {
    try {
      await db.destroy();
      console.log('[LunaVet] Conexiones de base de datos cerradas.');
      process.exit(0);
    } catch (err) {
      console.error('[LunaVet] Error cerrando base de datos:', err);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
