const { requireAuth, requireRole } = require('../../src/middleware/auth.middleware');
const tokenService = require('../../src/core/token.service');
const { UnauthorizedError, ForbiddenError } = require('../../src/core/errors');

describe('Auth Middleware - Control de Acceso y RBAC', () => {
  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    nextFn = jest.fn();
  });

  describe('requireAuth', () => {
    test('debe permitir acceso si el token Bearer es válido', () => {
      const validToken = tokenService.generateAccessToken({ id: 1, email: 'test@lunavet.lat', rol: 'cliente' });
      mockReq.headers.authorization = `Bearer ${validToken}`;

      requireAuth(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(1);
    });

    test('debe rechazar si falta la cabecera Authorization o no tiene prefijo Bearer', () => {
      requireAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(UnauthorizedError));

      nextFn.mockClear();
      mockReq.headers.authorization = 'Basic token123';
      requireAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    test('debe rechazar si el token es inválido', () => {
      mockReq.headers.authorization = 'Bearer token_invalido';
      requireAuth(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('requireRole', () => {
    test('debe permitir acceso si el rol del usuario coincide con los permitidos', () => {
      mockReq.user = { id: 1, rol: 'administrador' };
      const middleware = requireRole('administrador', 'veterinario');

      middleware(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith();
    });

    test('debe denegar acceso (403 Forbidden) si el rol no está permitido', () => {
      mockReq.user = { id: 2, rol: 'cliente' };
      const middleware = requireRole('administrador', 'veterinario');

      middleware(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    test('debe denegar acceso (401 Unauthorized) si no hay usuario autenticado', () => {
      mockReq.user = null;
      const middleware = requireRole('administrador');

      middleware(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
