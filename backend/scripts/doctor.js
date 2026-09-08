/**
 * LunaVet Doctor - Diagnóstico y Verificación Pre-Vuelo para Producción / cPanel
 * Ejecución: node scripts/doctor.js (o npm run doctor)
 */
const { db, initTestDb } = require('../src/config/database');
const config = require('../src/config/env');
const cryptoService = require('../src/core/crypto.service');
const pdfService = require('../src/core/pdf.service');

async function runDoctor() {
  console.log('================================================================');
  console.log('🩺 LUNAVET SYSTEM DOCTOR - AUDITORÍA PRE-VUELO (v4.0)');
  console.log('================================================================');

  let errors = 0;
  let warnings = 0;

  // 1. Verificación de Node.js
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
  if (majorVersion >= 18) {
    console.log(`✅ [Node.js] Versión ${nodeVersion} soportada (>= 18.0.0).`);
  } else {
    console.error(`❌ [Node.js] Versión actual ${nodeVersion} obsoleta. LunaVet requiere Node.js >= 18.0.0.`);
    errors++;
  }

  // 2. Verificación de Entorno
  console.log(`ℹ️ [Entorno] Modo activo: '${config.env}' | Producción: ${config.isProduction}`);

  // 3. Verificación de Clave Criptográfica AES-256-GCM
  const key = config.crypto.encryptionKey;
  if (!key) {
    console.error('❌ [Crypto] ENCRYPTION_KEY no está definida en el entorno.');
    errors++;
  } else if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    console.error('❌ [Crypto] ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes).');
    errors++;
  } else {
    // Probar cifrado y descifrado en memoria
    try {
      const testMsg = 'LunaVet Diagnostic Test String 2026';
      const enc = cryptoService.encrypt(testMsg);
      const dec = cryptoService.decrypt(enc);
      if (dec === testMsg) {
        console.log('✅ [Crypto] Cifrado/Descifrado AES-256-GCM verificado exitosamente.');
      } else {
        throw new Error('Discrepancia en descifrado');
      }
    } catch (cErr) {
      console.error('❌ [Crypto] Error probando motor AES-256-GCM:', cErr.message);
      errors++;
    }
  }

  // 4. Verificación de Secretos de Seguridad
  if (!config.jwt.secret || config.jwt.secret.length < 16) {
    console.warn('⚠️ [JWT] JWT_SECRET es corto o está ausente. Se recomienda clave de alta entropía (>= 32 chars).');
    warnings++;
  } else {
    console.log('✅ [JWT] JWT_SECRET configurado.');
  }

  if (!config.cron.secret || config.cron.secret === 'test_cron_secret') {
    if (config.isProduction) {
      console.warn('⚠️ [Cron] CRON_SECRET tiene el valor por defecto. Cambiar para producción en cPanel.');
      warnings++;
    } else {
      console.log('ℹ️ [Cron] CRON_SECRET configurado para desarrollo.');
    }
  } else {
    console.log('✅ [Cron] CRON_SECRET personalizado configurado.');
  }

  // 5. Verificación de Motor de Generación de Recetas PDF (Pure JS)
  try {
    const testPdfBuffer = await pdfService.generatePrescriptionPdf({
      folio: 'REC-DOCTOR-TEST',
      fechaEmision: new Date().toISOString().slice(0, 10),
      vigenciaDias: 30,
      veterinario: { nombre: 'Dr. Test', apellido: 'Vet', cedulaProfesional: 'CED-001' },
      mascota: { nombre: 'Luna', especie: 'Perro', duenoNombre: 'Cliente Test' },
      alergias: [],
      items: [{ nombreMedicamento: 'TestMed', dosis: '1 tableta', frecuencia: '24h', duracionDias: 5 }]
    });

    if (Buffer.isBuffer(testPdfBuffer) && testPdfBuffer.length > 500) {
      console.log(`✅ [PDF Engine] Generación de PDF en memoria (pdfkit) operativa (${testPdfBuffer.length} bytes).`);
    } else {
      throw new Error('Buffer generado vacío o corrupto');
    }
  } catch (pdfErr) {
    console.error('❌ [PDF Engine] Error generando PDF:', pdfErr.message);
    errors++;
  }

  // 6. Verificación de Base de Datos
  try {
    if (config.db.client === 'sqlite3') {
      await initTestDb();
      console.log('ℹ️ [Base de Datos] Conectado a SQLite (:memory:).');
    } else {
      console.log(`ℹ️ [Base de Datos] Probando conexión a MySQL en ${config.db.host}:${config.db.port}, base '${config.db.database}'...`);
      await db.raw('SELECT 1+1 AS result');
      console.log('✅ [Base de Datos] Conexión a MySQL exitosa.');
    }

    // Comprobar tablas requeridas
    const requiredTables = [
      'usuarios',
      'mascotas',
      'citas',
      'servicios',
      'categorias',
      'productos',
      'lotes',
      'pedidos',
      'pedidos_items',
      'recetas',
      'recetas_items',
      'archivos_adjuntos',
      'bitacora_auditoria',
      'cms_secciones'
    ];

    const missingTables = [];
    for (const table of requiredTables) {
      const exists = await db.schema.hasTable(table);
      if (!exists) {
        missingTables.push(table);
      }
    }

    if (missingTables.length === 0) {
      console.log(`✅ [Esquema DB] Todas las tablas requeridas (${requiredTables.length}) están presentes.`);
    } else {
      console.error(`❌ [Esquema DB] Faltan las siguientes tablas: ${missingTables.join(', ')}`);
      console.error('👉 Ejecuta `npm run db:init` para crear el esquema.');
      errors++;
    }

    // Comprobar existencia de al menos un administrador
    const adminCount = await db('usuarios').where({ rol: 'administrador' }).count('id as total').first();
    const totalAdmins = parseInt(adminCount ? adminCount.total : 0, 10);
    if (totalAdmins > 0) {
      console.log(`✅ [Staff] Superadministrador presente en el sistema (${totalAdmins} activo(s)).`);
    } else {
      console.warn('⚠️ [Staff] No se encontró ningún usuario con rol de administrador.');
      console.warn('👉 Ejecuta `npm run db:seed` para sembrar el superadministrador inicial.');
      warnings++;
    }

  } catch (dbErr) {
    console.error('❌ [Base de Datos] Error de conexión a la base de datos:', dbErr.message);
    errors++;
  } finally {
    await db.destroy();
  }

  console.log('================================================================');
  if (errors === 0) {
    console.log(`🎉 SISTEMA SALUDABLE: 0 errores, ${warnings} advertencia(s). ¡Listo para producción!`);
    console.log('================================================================');
    process.exit(0);
  } else {
    console.error(`🛑 ATENCIÓN: Se encontraron ${errors} error(es) crítico(s) y ${warnings} advertencia(s).`);
    console.log('================================================================');
    process.exit(1);
  }
}

if (require.main === module) {
  runDoctor();
}

module.exports = runDoctor;
