const tokenService = require('../core/token.service');
const { UnauthorizedError, ForbiddenError } = require('../core/errors');

/**
 * Middleware que valida el Access Token JWT en la cabecera Authorization.
 */
function requireAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return next(new UnauthorizedError('Acceso denegado: Token de autorización no suministrado.'));
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware de control de acceso basado en roles (RBAC).
 * @param  {...string} roles - Lista de roles permitidos ('cliente', 'veterinario', 'recepcionista', 'administrador')
 */
function requireRole(...roles) {
  const allowedRoles = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuario no autenticado.'));
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return next(
        new ForbiddenError(
          `Permisos insuficientes: Esta acción requiere uno de los roles [${allowedRoles.join(', ')}] pero su rol es '${req.user.rol}'.`
        )
      );
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
