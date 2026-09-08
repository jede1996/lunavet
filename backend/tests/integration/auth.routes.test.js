const request = require('supertest');
const app = require('../../src/app');
const { initTestDb, closeDb, db } = require('../../src/config/database');
const totpService = require('../../src/core/totp.service');
const cryptoService = require('../../src/core/crypto.service');
const passwordService = require('../../src/core/password.service');

describe('Integration - Módulo de Autenticación, RBAC y 2FA', () => {
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(async () => {
    await db('sesiones_activas').del();
    await db('bitacora_auditoria').del();
    await db('usuarios').del();
  });

  describe('Registro de Clientes (POST /api/auth/register)', () => {
    test('debe registrar un cliente exitosamente y retornar tokens de acceso y refresco', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'maria@ejemplo.com',
          password: 'PasswordSeguro123',
          nombre: 'María',
          apellido: 'González',
          telefono: '5512345678'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('maria@ejemplo.com');
      expect(res.body.data.user.rol).toBe('cliente');
      expect(res.body.data.user.password_hash).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Verificar que el teléfono se guardó cifrado en la base de datos (LFPDPPP)
      const userInDb = await db('usuarios').where('email', 'maria@ejemplo.com').first();
      expect(userInDb.telefono_cifrado).toBeDefined();
      expect(userInDb.telefono_cifrado.startsWith('enc:v1:')).toBe(true);
      expect(cryptoService.decrypt(userInDb.telefono_cifrado)).toBe('5512345678');
    });

    test('debe rechazar registro con correo duplicado (409 Conflict)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicado@ejemplo.com',
          password: 'PasswordSeguro123',
          nombre: 'Cliente',
          apellido: 'Uno'
        })
        .expect(201);

      const resDuplicado = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicado@ejemplo.com',
          password: 'PasswordSeguro123',
          nombre: 'Cliente',
          apellido: 'Dos'
        })
        .expect(409);

      expect(resDuplicado.body.success).toBe(false);
      expect(resDuplicado.body.error.code).toBe('CONFLICT');
    });

    test('debe rechazar contraseñas débiles de menos de 8 caracteres (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'debil@ejemplo.com',
          password: '123',
          nombre: 'Cliente',
          apellido: 'Debil'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Inicio de Sesión y Control de Fuerza Bruta (POST /api/auth/login)', () => {
    beforeEach(async () => {
      const passHash = await passwordService.hash('PasswordSeguro123');
      await db('usuarios').insert({
        email: 'cliente@ejemplo.com',
        password_hash: passHash,
        nombre: 'Carlos',
        apellido: 'Pérez',
        rol: 'cliente',
        activo: true
      });
    });

    test('debe iniciar sesión exitosamente con credenciales válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cliente@ejemplo.com',
          password: 'PasswordSeguro123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('cliente@ejemplo.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    test('debe bloquear temporalmente la cuenta tras 5 intentos fallidos consecutivos', async () => {
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'cliente@ejemplo.com', password: 'PasswordErroneo' })
          .expect(401);
        expect(res.body.error.message).toContain('Credenciales incorrectas');
      }

      // Quinto intento fallido provoca bloqueo
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'cliente@ejemplo.com', password: 'PasswordErroneo' })
        .expect(401);

      // El sexto intento debe ser rechazado inmediatamente por cuenta bloqueada
      const resBloqueado = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cliente@ejemplo.com', password: 'PasswordSeguro123' })
        .expect(401);

      expect(resBloqueado.body.error.message).toContain('Cuenta bloqueada temporalmente');
    });
  });

  describe('Segregación de Portales y 2FA de Recepcionista (v4.0)', () => {
    let rawTotpSecret;

    beforeEach(async () => {
      rawTotpSecret = totpService.generateSecret();
      const encSecret = cryptoService.encrypt(rawTotpSecret);
      const passHash = await passwordService.hash('StaffSeguro#2026');

      // Crear recepcionista con 2FA configurado
      await db('usuarios').insert({
        email: 'recepcion@lunavet.lat',
        password_hash: passHash,
        nombre: 'Ana',
        apellido: 'Recepción',
        rol: 'recepcionista',
        dos_factores_habilitado: true,
        dos_factores_secreto: encSecret,
        activo: true
      });
    });

    test('debe denegar acceso si personal clínico intenta ingresar por login de cliente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'recepcion@lunavet.lat',
          password: 'StaffSeguro#2026'
        })
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('debe exigir código 2FA obligatorio para Recepcionista en portal staff (v4.0)', async () => {
      // Sin código TOTP
      const resSin2FA = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'recepcion@lunavet.lat',
          password: 'StaffSeguro#2026'
        })
        .expect(401);

      expect(resSin2FA.body.error.message).toContain('Código de autenticación de dos factores (2FA) requerido');

      // Con código TOTP válido
      const validCode = totpService.generateToken(rawTotpSecret);
      const resCon2FA = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'recepcion@lunavet.lat',
          password: 'StaffSeguro#2026',
          totpToken: validCode
        })
        .expect(200);

      expect(resCon2FA.body.success).toBe(true);
      expect(resCon2FA.body.data.user.rol).toBe('recepcionista');
    });

    test('debe rechazar código TOTP incorrecto en login con 2FA', async () => {
      const res = await request(app)
        .post('/api/auth/staff/login')
        .send({
          email: 'recepcion@lunavet.lat',
          password: 'StaffSeguro#2026',
          totpToken: '111222'
        })
        .expect(401);

      expect(res.body.error.message).toContain('Código 2FA incorrecto');
    });
  });

  describe('Rotación de Tokens y Detección de Robo/Reutilización', () => {
    test('debe rotar el refresh token y rechazar la reutilización del token viejo', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'roto@ejemplo.com',
          password: 'Password123#',
          nombre: 'Juan',
          apellido: 'Roto'
        })
        .expect(201);

      const tokenOriginal = reg.body.data.refreshToken;

      // 1ra renovación exitosa
      const resRenovacion = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: tokenOriginal })
        .expect(200);

      const nuevoToken = resRenovacion.body.data.refreshToken;
      expect(nuevoToken).toBeDefined();
      expect(nuevoToken).not.toBe(tokenOriginal);

      // Intento de reutilizar el token anterior (debe fallar)
      const resAtaque = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: tokenOriginal })
        .expect(401);

      expect(resAtaque.body.error.message).toContain('Token de refresco inválido o revocado');

      // Verificar que se registró una alerta de auditoría crítica por reutilización
      const logs = await db('bitacora_auditoria')
        .where('accion', 'REUTILIZACION_REFRESH_TOKEN_DETECTADA');
      expect(logs).toHaveLength(1);
      expect(logs[0].nivel_criticidad).toBe('critico');
    });
  });

  describe('Rutas Protegidas: Perfil, Cambio de Password, 2FA y Creación de Staff', () => {
    let adminToken;
    let clientToken;
    let _adminId;
    let clientId;

    beforeEach(async () => {
      const passHash = await passwordService.hash('SuperAdmin#2026');
      const [aId] = await db('usuarios').insert({
        email: 'admin@lunavet.lat',
        password_hash: passHash,
        nombre: 'Admin',
        apellido: 'LunaVet',
        rol: 'administrador',
        activo: true
      });
      _adminId = aId;
      const adminLogin = await request(app)
        .post('/api/auth/staff/login')
        .send({ email: 'admin@lunavet.lat', password: 'SuperAdmin#2026' });
      adminToken = adminLogin.body.data.accessToken;

      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'perfil@ejemplo.com',
          password: 'PasswordSeguro123',
          nombre: 'Cliente',
          apellido: 'Perfil'
        });
      clientToken = reg.body.data.accessToken;
      clientId = reg.body.data.user.id;
    });

    test('GET /api/auth/me debe retornar datos del usuario autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(clientId);
      expect(res.body.data.email).toBe('perfil@ejemplo.com');
    });

    test('POST /api/auth/change-password debe actualizar clave y exigir contraseña actual', async () => {
      // Contraseña actual errónea
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: 'MalPassword', newPassword: 'NuevaPassword123' })
        .expect(401);

      // Éxito
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ currentPassword: 'PasswordSeguro123', newPassword: 'NuevaPassword123' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('Setup y Activación de 2FA por un usuario', async () => {
      const setupRes = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      const secret = setupRes.body.data.secret;
      expect(secret).toBeDefined();

      // Código erróneo
      await request(app)
        .post('/api/auth/2fa/verify')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ code: '000000' })
        .expect(400);

      // Código correcto
      const validCode = totpService.generateToken(secret);
      const verifyRes = await request(app)
        .post('/api/auth/2fa/verify')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ code: validCode })
        .expect(200);

      expect(verifyRes.body.success).toBe(true);
    });

    test('debe rechazar inicio de sesión si la cuenta está inactiva', async () => {
      await db('usuarios').where('email', 'perfil@ejemplo.com').update({ activo: false });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'perfil@ejemplo.com', password: 'PasswordSeguro123' })
        .expect(401);

      expect(res.body.error.message).toContain('desactivada');
    });

    test('debe cerrar sesión correctamente con POST /api/auth/logout', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@ejemplo.com',
          password: 'Password123#',
          nombre: 'Cliente',
          apellido: 'Logout'
        })
        .expect(201);

      const refreshToken = reg.body.data.refreshToken;

      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      // Ahora el token debe estar revocado
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    test('debe rechazar sesión expirada en POST /api/auth/refresh', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'expirado@ejemplo.com',
          password: 'Password123#',
          nombre: 'Cliente',
          apellido: 'Expirado'
        })
        .expect(201);

      const refreshToken = reg.body.data.refreshToken;
      const tokenHash = cryptoService.hashSha256(refreshToken);

      // Modificar fecha de expiración a ayer
      const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await db('sesiones_activas').where('refresh_token_hash', tokenHash).update({ expira_en: ayer });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(res.body.error.message).toContain('expirado');
    });

    test('Creación de staff por Administrador (POST /api/auth/staff/users)', async () => {
      // Intento con token de cliente debe dar 403 Forbidden
      await request(app)
        .post('/api/auth/staff/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          email: 'vet@lunavet.lat',
          password: 'VetPassword#2026',
          nombre: 'Dr. Roberto',
          apellido: 'Soto',
          rol: 'veterinario'
        })
        .expect(403);

      // Con token de Administrador
      const res = await request(app)
        .post('/api/auth/staff/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'vet@lunavet.lat',
          password: 'VetPassword#2026',
          nombre: 'Dr. Roberto',
          apellido: 'Soto',
          rol: 'veterinario',
          cedulaProfesional: 'CED-998877'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('vet@lunavet.lat');
      expect(res.body.data.rol).toBe('veterinario');
      expect(res.body.data.debeCambiarPassword).toBe(true);
    });
  });
});
