/**
 * Script de inicialización de Superadministrador para LunaVet v4.0
 * Uso: node scripts/seed-admin.js
 * Variables de entorno opcionales:
 * ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE, ADMIN_APELLIDO
 */
const { db, initTestDb } = require('../src/config/database');
const passwordService = require('../src/core/password.service');
const config = require('../src/config/env');

async function seedAdmin() {
  console.log('[LunaVet Seed] Iniciando proceso de sembrado de Administrador...');

  try {
    if (config.db.client === 'sqlite3') {
      await initTestDb();
    }

    const email = (process.env.ADMIN_EMAIL || 'admin@lunavet.lat').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'AdminLunaVet2026!';
    const nombre = process.env.ADMIN_NOMBRE || 'Super';
    const apellido = process.env.ADMIN_APELLIDO || 'Administrador';

    // Validar formato de contraseña con políticas de LunaVet
    passwordService.validateStrength(password, true);

    const existingAdmin = await db('usuarios').where({ email }).first();

    if (existingAdmin) {
      console.log(`[LunaVet Seed] El usuario '${email}' ya existe con rol '${existingAdmin.rol}'.`);
      if (process.argv.includes('--force')) {
        const hashedPassword = await passwordService.hash(password);
        await db('usuarios').where({ id: existingAdmin.id }).update({
          password_hash: hashedPassword,
          rol: 'administrador',
          activo: true
        });
        console.log(`[LunaVet Seed] Credenciales del administrador '${email}' actualizadas exitosamente (--force).`);
      } else {
        console.log('[LunaVet Seed] Omisión: No se realizaron cambios. (Use --force para actualizar contraseña).');
      }
    } else {
      const hashedPassword = await passwordService.hash(password);
      const [id] = await db('usuarios').insert({
        email,
        password_hash: hashedPassword,
        nombre,
        apellido,
        rol: 'administrador',
        telefono_cifrado: null,
        activo: true,
        dos_factores_habilitado: false
      });

      console.log(`[LunaVet Seed] ¡Superadministrador creado exitosamente con ID ${id}!`);
      console.log(`[LunaVet Seed] Email: ${email}`);
      console.log(`[LunaVet Seed] Rol: administrador`);
    }
  } catch (err) {
    console.error('[LunaVet Seed] Error sembrando administrador:', err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
