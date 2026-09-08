/**
 * Script de inicialización de Base de Datos para LunaVet v4.0
 * Compatible con MySQL (cPanel / Local) y SQLite (:memory: / disco local)
 */
const fs = require('fs');
const path = require('path');
const { db, initTestDb } = require('../src/config/database');
const config = require('../src/config/env');

async function initDatabase() {
  console.log(`[LunaVet DB] Iniciando verificación de base de datos en entorno '${config.env}'...`);
  console.log(`[LunaVet DB] Cliente configurado: ${config.db.client}`);

  try {
    if (config.db.client === 'sqlite3') {
      console.log('[LunaVet DB] Creando/verificando tablas en SQLite...');
      await initTestDb();
      console.log('[LunaVet DB] Esquema SQLite inicializado exitosamente.');
    } else {
      console.log(`[LunaVet DB] Conectando a MySQL en ${config.db.host}:${config.db.port}, base '${config.db.database}'...`);
      
      const schemaPath = path.resolve(__dirname, '../src/database/schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // 1. Deshabilitar temporalmente verificación de foreign keys para permitir creación limpia
      await db.raw('SET FOREIGN_KEY_CHECKS = 0;');

      // 2. Limpiar comentarios de bloque (/* ... */) y comentarios de línea (-- ...)
      const cleanSql = schemaSql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, '');

      // 3. Dividir por ';' para obtener cada sentencia individual limpia
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`[LunaVet DB] Procesando ${statements.length} sentencias DDL...`);

      for (const statement of statements) {
        try {
          await db.raw(statement);
        } catch (stmtErr) {
          // Ignorar errores de "Table already exists"
          if (stmtErr.errno !== 1050 && !stmtErr.message.includes('already exists')) {
            console.warn('[LunaVet DB] Advertencia ejecutando sentencia:', stmtErr.message);
          }
        }
      }

      // 4. Reactivar verificación de foreign keys
      await db.raw('SET FOREIGN_KEY_CHECKS = 1;');
      console.log('[LunaVet DB] Tablas MySQL verificadas/creadas exitosamente.');
    }

    // Verificar tabla usuarios
    const hasUsuarios = await db.schema.hasTable('usuarios');
    console.log(`[LunaVet DB] Verificación: Tabla 'usuarios' existe: ${hasUsuarios}`);

    console.log('[LunaVet DB] Inicialización completada exitosamente.');
  } catch (err) {
    console.error('[LunaVet DB] Error crítico inicializando base de datos:', err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
