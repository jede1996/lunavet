const totpService = require('../../src/core/totp.service');

describe('TotpService - Autenticación de Dos Factores (2FA TOTP)', () => {
  test('debe generar secretos Base32 válidos y URIs otpauth para QR', () => {
    const secret = totpService.generateSecret();
    expect(secret).toBeDefined();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThanOrEqual(16);

    const otpAuthUrl = totpService.getOtpAuthUrl('doctor@lunavet.lat', secret, 'LunaVet');
    expect(otpAuthUrl).toContain('otpauth://totp/');
    expect(otpAuthUrl).toContain('doctor%40lunavet.lat');
    expect(otpAuthUrl).toContain('secret=' + secret);
    expect(otpAuthUrl).toContain('issuer=LunaVet');
  });

  test('debe verificar un código TOTP generado correctamente', () => {
    const secret = totpService.generateSecret();
    const validToken = totpService.generateToken(secret);

    expect(validToken).toHaveLength(6);
    expect(totpService.verify(validToken, secret)).toBe(true);
  });

  test('debe rechazar tokens incorrectos o nulos', () => {
    const secret = totpService.generateSecret();
    expect(totpService.verify('000000', secret)).toBe(false);
    expect(totpService.verify(null, secret)).toBe(false);
    expect(totpService.verify('123456', null)).toBe(false);
    expect(totpService.verify('123', secret)).toBe(false); // Longitud menor a 6
    expect(totpService.generateToken(null)).toBeNull();
    expect(totpService.generateToken('')).toBeNull();
  });

  test('debe manejar cadenas Base32 con padding o caracteres no válidos', () => {
    const secret = totpService.generateSecret(17); // Longitud no divisible por 5
    expect(secret).toBeDefined();
    const token = totpService.generateToken(secret);
    expect(totpService.verify(token, secret)).toBe(true);
  });
});
