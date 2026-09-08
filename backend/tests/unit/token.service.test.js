const tokenService = require('../../src/core/token.service');
const { UnauthorizedError } = require('../../src/core/errors');

describe('TokenService - JWT y Refresh Tokens criptográficos', () => {
  const mockUser = {
    id: 42,
    email: 'vet@lunavet.lat',
    rol: 'veterinario',
    sucursal_id: 1
  };

  test('debe generar y verificar un Access Token JWT válido', () => {
    const token = tokenService.generateAccessToken(mockUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = tokenService.verifyAccessToken(token);
    expect(decoded.id).toBe(42);
    expect(decoded.email).toBe('vet@lunavet.lat');
    expect(decoded.rol).toBe('veterinario');
    expect(decoded.sucursalId).toBe(1);
    expect(decoded.iss).toBe('lunavet-auth');
    expect(decoded.aud).toBe('lunavet-app');
  });

  test('debe lanzar UnauthorizedError ante un token inválido o corrupto', () => {
    expect(() => tokenService.verifyAccessToken('token.falso.invalido')).toThrow(UnauthorizedError);
    expect(() => tokenService.verifyAccessToken(null)).toThrow(UnauthorizedError);
    expect(() => tokenService.verifyAccessToken('')).toThrow(UnauthorizedError);
  });

  test('debe lanzar UnauthorizedError con mensaje específico si el token ha expirado', () => {
    const jwt = require('jsonwebtoken');
    const config = require('../../src/config/env');
    const expiredToken = jwt.sign(
      { id: 42, email: 'vet@lunavet.lat', rol: 'veterinario' },
      config.jwt.secret,
      { expiresIn: '-1s', issuer: 'lunavet-auth', audience: 'lunavet-app' }
    );
    expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow('El token de acceso ha expirado.');
  });

  test('debe generar refresh tokens criptográficos y calcular su hash SHA-256', () => {
    const rawToken = tokenService.generateRefreshToken();
    expect(typeof rawToken).toBe('string');
    expect(rawToken).toHaveLength(64); // 32 bytes en hex

    const hash = tokenService.hashRefreshToken(rawToken);
    expect(typeof hash).toBe('string');
    expect(hash).toHaveLength(64);

    expect(tokenService.hashRefreshToken(null)).toBeNull();
  });
});
