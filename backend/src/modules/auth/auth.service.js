const { db } = require('../../config/database');
const config = require('../../config/env');
const passwordService = require('../../core/password.service');
const tokenService = require('../../core/token.service');
const totpService = require('../../core/totp.service');
const cryptoService = require('../../core/crypto.service');
const auditService = require('../../core/audit.service');
const {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  NotFoundError
} = require('../../core/errors');

class AuthService {
  /**
   * Sanitiza un usuario removiendo hashes y secretos sensibles.
   */
  sanitizeUser(user) {
    if (!user) return null;
    let telefono = null;
    if (user.telefono_cifrado) {
      try {
        telefono = cryptoService.decrypt(user.telefono_cifrado);
      } catch (_e) {
        telefono = null;
      }
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol,
      telefono,
      cedulaProfesional: user.cedula_profesional || null,
      dosFactoresHabilitado: Boolean(user.dos_factores_habilitado),
      debeCambiarPassword: Boolean(user.debe_cambiar_password),
      activo: Boolean(user.activo),
      sucursalId: user.sucursal_id || null
    };
  }

  /**
   * Registra un nuevo cliente (portal público).
   */
  async registerClient({ email, password, nombre, apellido, telefono = null, ipOrigen = null, userAgent = null }) {
    if (!email || !password || !nombre || !apellido) {
      throw new ValidationError('Todos los campos obligatorios deben ser proporcionados.');
    }

    const cleanEmail = email.toLowerCase().trim();
    passwordService.validateStrength(password, false);

    const existingUser = await db('usuarios').where('email', cleanEmail).first();
    if (existingUser) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.');
    }

    const passwordHash = await passwordService.hash(password);
    const telefonoCifrado = telefono ? cryptoService.encrypt(telefono.trim()) : null;

    const [userId] = await db('usuarios').insert({
      email: cleanEmail,
      password_hash: passwordHash,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol: 'cliente',
      telefono_cifrado: telefonoCifrado,
      dos_factores_habilitado: false,
      debe_cambiar_password: false,
      intentos_fallidos: 0,
      activo: true
    });

    const newUser = await db('usuarios').where('id', userId).first();

    await auditService.log({
      usuarioId: userId,
      accion: 'REGISTRO_CLIENTE',
      entidad: 'Usuario',
      entidadId: userId,
      detalles: { email: cleanEmail },
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    const { accessToken, refreshToken } = await this.createSession(newUser, ipOrigen, userAgent);

    return {
      user: this.sanitizeUser(newUser),
      accessToken,
      refreshToken
    };
  }

  /**
   * Crea una nueva sesión persistida en BD con rotación de Refresh Token.
   */
  async createSession(user, ipOrigen = null, userAgent = null) {
    const rawRefreshToken = tokenService.generateRefreshToken();
    const tokenHash = tokenService.hashRefreshToken(rawRefreshToken);

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + config.jwt.refreshTokenExpiresDays);

    await db('sesiones_activas').insert({
      usuario_id: user.id,
      refresh_token_hash: tokenHash,
      user_agent: userAgent ? userAgent.substring(0, 255) : null,
      ip_origen: ipOrigen ? ipOrigen.substring(0, 45) : null,
      es_valido: true,
      expira_en: expiraEn
    });

    const accessToken = tokenService.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  /**
   * Inicio de sesión unificado con soporte para separación de portales, control de fuerza bruta y 2FA.
   */
  async login({ email, password, totpToken = null, ipOrigen = null, userAgent = null, isStaff = false }) {
    if (!email || !password) {
      throw new ValidationError('Correo electrónico y contraseña requeridos.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db('usuarios').where('email', cleanEmail).first();

    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas.');
    }

    // 1. Verificar bloqueo por fuerza bruta persistido en BD
    let isBlocked = false;
    if (user.bloqueado_hasta) {
      const lockVal = user.bloqueado_hasta;
      const lockTime = lockVal instanceof Date
        ? lockVal.getTime()
        : (typeof lockVal === 'number'
          ? lockVal
          : (typeof lockVal === 'string' && /^\d+$/.test(lockVal)
            ? Number(lockVal)
            : new Date(lockVal).getTime()));
      isBlocked = !isNaN(lockTime) && lockTime > Date.now();
    }

    if (isBlocked) {
      throw new UnauthorizedError('Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente más tarde.');
    }

    if (!user.activo) {
      throw new UnauthorizedError('La cuenta se encuentra desactivada. Contacte al administrador.');
    }

    // 2. Segregación de portales
    if (isStaff && user.rol === 'cliente') {
      throw new ForbiddenError('Acceso denegado: El portal administrativo es exclusivo para personal clínico.');
    }
    if (!isStaff && user.rol !== 'cliente') {
      throw new ForbiddenError('El personal de la clínica debe acceder exclusivamente por el portal interno (app.lunavet.lat).');
    }

    // 3. Verificación de contraseña
    const passwordMatch = await passwordService.compare(password, user.password_hash);
    if (!passwordMatch) {
      const nuevosIntentos = (user.intentos_fallidos || 0) + 1;
      let bloqueadoHasta = null;

      if (nuevosIntentos >= 5) {
        // Bloqueo temporal por 15 minutos
        const dateBloqueo = new Date(Date.now() + 15 * 60 * 1000);
        bloqueadoHasta = dateBloqueo.toISOString();
      }

      await db('usuarios').where('id', user.id).update({
        intentos_fallidos: nuevosIntentos,
        bloqueado_hasta: bloqueadoHasta
      });

      await auditService.log({
        usuarioId: user.id,
        accion: 'LOGIN_FALLIDO',
        entidad: 'Usuario',
        entidadId: user.id,
        detalles: { intentos: nuevosIntentos, bloqueado: Boolean(bloqueadoHasta) },
        ipOrigen,
        userAgent,
        nivelCriticidad: nuevosIntentos >= 5 ? 'advertencia' : 'info'
      });

      throw new UnauthorizedError('Credenciales incorrectas.');
    }

    // 4. Verificación de 2FA TOTP (Reglas v4.0: obligatorio para Recepcionista; opcional si está activado)
    const requires2FA = user.rol === 'recepcionista' || Boolean(user.dos_factores_habilitado);
    if (requires2FA) {
      if (!totpToken) {
        throw new UnauthorizedError('Código de autenticación de dos factores (2FA) requerido.');
      }

      if (!user.dos_factores_secreto) {
        throw new UnauthorizedError('La cuenta requiere configuración previa de 2FA. Contacte al administrador.');
      }

      const decryptedSecret = cryptoService.decrypt(user.dos_factores_secreto);
      const isTotpValid = totpService.verify(totpToken, decryptedSecret);

      if (!isTotpValid) {
        await auditService.log({
          usuarioId: user.id,
          accion: 'LOGIN_2FA_FALLIDO',
          entidad: 'Usuario',
          entidadId: user.id,
          detalles: 'Código TOTP incorrecto o desfasado',
          ipOrigen,
          userAgent,
          nivelCriticidad: 'advertencia'
        });
        throw new UnauthorizedError('Código 2FA incorrecto o expirado.');
      }
    }

    // 5. Restablecer contador de intentos fallidos
    await db('usuarios').where('id', user.id).update({
      intentos_fallidos: 0,
      bloqueado_hasta: null,
      ultimo_acceso: new Date()
    });

    // 6. Crear sesión y tokens
    const { accessToken, refreshToken } = await this.createSession(user, ipOrigen, userAgent);

    await auditService.log({
      usuarioId: user.id,
      accion: 'LOGIN_EXITOSO',
      entidad: 'Usuario',
      entidadId: user.id,
      ipOrigen,
      userAgent,
      nivelCriticidad: 'info'
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      debeCambiarPassword: Boolean(user.debe_cambiar_password)
    };
  }

  /**
   * Rotación de tokens de refresco con detección de robo y reutilización.
   */
  async refreshSession({ refreshToken, ipOrigen = null, userAgent = null }) {
    if (!refreshToken) {
      throw new UnauthorizedError('Token de refresco requerido.');
    }

    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    const session = await db('sesiones_activas').where('refresh_token_hash', tokenHash).first();

    if (!session || !session.es_valido) {
      // Reutilización detectada: invalidar todas las sesiones del usuario como medida de contención
      if (session) {
        await db('sesiones_activas').where('usuario_id', session.usuario_id).update({ es_valido: false });
        await auditService.log({
          usuarioId: session.usuario_id,
          accion: 'REUTILIZACION_REFRESH_TOKEN_DETECTADA',
          entidad: 'SesionActiva',
          entidadId: session.id,
          detalles: 'Alerta de seguridad: Intento de reutilización de refresh token revocado.',
          ipOrigen,
          userAgent,
          nivelCriticidad: 'critico'
        });
      }
      throw new UnauthorizedError('Token de refresco inválido o revocado.');
    }

    // Verificar si expiró
    if (new Date(session.expira_en) < new Date()) {
      await db('sesiones_activas').where('id', session.id).update({ es_valido: false });
      throw new UnauthorizedError('La sesión ha expirado. Inicie sesión nuevamente.');
    }

    const user = await db('usuarios').where('id', session.usuario_id).first();
    if (!user || !user.activo) {
      throw new UnauthorizedError('Usuario inactivo o no encontrado.');
    }

    // Invalidar el token anterior (ROTACIÓN ESTRICTA)
    await db('sesiones_activas').where('id', session.id).update({ es_valido: false });

    // Generar nuevo par de tokens
    return this.createSession(user, ipOrigen, userAgent);
  }

  /**
   * Cierre de sesión individual.
   */
  async logout({ refreshToken }) {
    if (!refreshToken) return;
    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    await db('sesiones_activas').where('refresh_token_hash', tokenHash).update({ es_valido: false });
  }

  /**
   * Configuración inicial de 2FA: genera secreto y URL otpauth.
   */
  async setup2FA(userId) {
    const user = await db('usuarios').where('id', userId).first();
    if (!user) throw new NotFoundError('Usuario no encontrado.');

    const secret = totpService.generateSecret();
    const otpAuthUrl = totpService.getOtpAuthUrl(user.email, secret);
    const encryptedSecret = cryptoService.encrypt(secret);

    await db('usuarios').where('id', userId).update({
      dos_factores_secreto: encryptedSecret
    });

    return {
      secret,
      otpAuthUrl
    };
  }

  /**
   * Confirmación y activación de 2FA tras validar código de 6 dígitos.
   */
  async verifyAndEnable2FA(userId, code) {
    const user = await db('usuarios').where('id', userId).first();
    if (!user || !user.dos_factores_secreto) {
      throw new ValidationError('Debe iniciar la configuración de 2FA antes de verificar.');
    }

    const decryptedSecret = cryptoService.decrypt(user.dos_factores_secreto);
    const isValid = totpService.verify(code, decryptedSecret);

    if (!isValid) {
      throw new ValidationError('Código de verificación 2FA incorrecto.');
    }

    await db('usuarios').where('id', userId).update({
      dos_factores_habilitado: true
    });

    await auditService.log({
      usuarioId: userId,
      accion: '2FA_HABILITADO',
      entidad: 'Usuario',
      entidadId: userId,
      nivelCriticidad: 'info'
    });

    return { success: true, message: 'Autenticación de dos factores habilitada exitosamente.' };
  }

  /**
   * Cambio de contraseña (con revocación de todas las sesiones activas por seguridad).
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await db('usuarios').where('id', userId).first();
    if (!user) throw new NotFoundError('Usuario no encontrado.');

    const match = await passwordService.compare(currentPassword, user.password_hash);
    if (!match) {
      throw new UnauthorizedError('La contraseña actual es incorrecta.');
    }

    const isStaff = user.rol !== 'cliente';
    passwordService.validateStrength(newPassword, isStaff);

    const newHash = await passwordService.hash(newPassword);

    await db('usuarios').where('id', userId).update({
      password_hash: newHash,
      debe_cambiar_password: false
    });

    // Revocar todas las sesiones existentes para forzar re-autenticación
    await db('sesiones_activas').where('usuario_id', userId).update({ es_valido: false });

    await auditService.log({
      usuarioId: userId,
      accion: 'CAMBIO_PASSWORD',
      entidad: 'Usuario',
      entidadId: userId,
      nivelCriticidad: 'info'
    });

    return { success: true, message: 'Contraseña actualizada. Inicie sesión nuevamente.' };
  }

  /**
   * Creación de usuario de staff por parte de un Administrador.
   */
  async createStaffUser({
    email,
    password,
    nombre,
    apellido,
    rol,
    sucursalId = null,
    telefono = null,
    cedulaProfesional = null
  }, adminId) {
    const cleanEmail = email.toLowerCase().trim();
    if (!['veterinario', 'recepcionista', 'administrador'].includes(rol)) {
      throw new ValidationError('Rol de staff no válido.');
    }

    passwordService.validateStrength(password, true);

    const existing = await db('usuarios').where('email', cleanEmail).first();
    if (existing) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.');
    }

    const passwordHash = await passwordService.hash(password);
    const telefonoCifrado = telefono ? cryptoService.encrypt(telefono.trim()) : null;

    // Para recepcionista generamos secreto 2FA por defecto (obligatorio v4.0)
    let initialSecret = null;
    if (rol === 'recepcionista') {
      const rawSecret = totpService.generateSecret();
      initialSecret = cryptoService.encrypt(rawSecret);
    }

    const [newUserId] = await db('usuarios').insert({
      email: cleanEmail,
      password_hash: passwordHash,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol,
      sucursal_id: sucursalId,
      telefono_cifrado: telefonoCifrado,
      cedula_profesional: cedulaProfesional ? cedulaProfesional.trim() : null,
      dos_factores_habilitado: rol === 'recepcionista', // Obligatorio para Recepcionista
      dos_factores_secreto: initialSecret,
      debe_cambiar_password: true, // Forzoso en primer acceso
      intentos_fallidos: 0,
      activo: true
    });

    await auditService.log({
      usuarioId: adminId,
      accion: 'CREAR_USUARIO_STAFF',
      entidad: 'Usuario',
      entidadId: newUserId,
      detalles: { email: cleanEmail, rol },
      nivelCriticidad: 'advertencia'
    });

    const created = await db('usuarios').where('id', newUserId).first();
    return this.sanitizeUser(created);
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;
