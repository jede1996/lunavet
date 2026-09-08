const path = require('path');
const dotenv = require('dotenv');

// Cargar .env si existe
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

// En modo test se provee una clave fija de 64 hex si no se ha configurado
const DEFAULT_TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const config = {
  env: NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  port: (/^\d+$/.test(process.env.PORT || '3000')) ? parseInt(process.env.PORT || '3000', 10) : (process.env.PORT || 3000),
  
  db: {
    client: process.env.DB_CLIENT || (NODE_ENV === 'test' ? 'sqlite3' : 'mysql2'),
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || (NODE_ENV === 'test' ? ':memory:' : 'lunavet_db')
  },

  crypto: {
    // Clave AES-256-GCM (32 bytes = 64 caracteres hex)
    encryptionKey: process.env.ENCRYPTION_KEY || (NODE_ENV === 'test' ? DEFAULT_TEST_KEY : '')
  },

  jwt: {
    secret: process.env.JWT_SECRET || (NODE_ENV === 'test' ? 'test_jwt_secret_32_characters_long_key' : ''),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10)
  },

  cron: {
    secret: process.env.CRON_SECRET || 'test_cron_secret'
  },

  payments: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'test_payment_webhook_secret'
  },

  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
      : ['https://lunavet.lat', 'https://app.lunavet.lat', 'http://localhost:3000', 'http://localhost:5173']
  },

  blob: {
    maxFileSizeBytes: parseInt(process.env.BLOB_MAX_FILE_SIZE_BYTES || '5242880', 10), // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]
  }
};

// Validación en producción
if (config.isProduction) {
  if (!config.crypto.encryptionKey || config.crypto.encryptionKey.length !== 64) {
    throw new Error('CONFIG_ERROR: ENCRYPTION_KEY debe ser una cadena hexadecimal válida de 64 caracteres (32 bytes).');
  }
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('CONFIG_ERROR: JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }
}

module.exports = config;
