const passwordService = require('../../src/core/password.service');
const { ValidationError } = require('../../src/core/errors');

describe('PasswordService - Políticas de Contraseña y Hashing', () => {
  describe('Validación de fortaleza', () => {
    test('debe validar contraseñas de cliente con al menos 8 caracteres', () => {
      expect(passwordService.validateStrength('12345678', false)).toBe(true);
      expect(() => passwordService.validateStrength('corta', false)).toThrow(ValidationError);
      expect(() => passwordService.validateStrength(null, false)).toThrow(ValidationError);
      expect(() => passwordService.validateStrength(12345678, false)).toThrow(ValidationError);
    });

    test('debe exigir requisitos estrictos para contraseñas de staff (mayúscula, minúscula, número y símbolo)', () => {
      // Válida
      expect(passwordService.validateStrength('VetLuna#2026', true)).toBe(true);

      // Sin mayúscula
      expect(() => passwordService.validateStrength('vetluna#2026', true)).toThrow(ValidationError);

      // Sin minúscula
      expect(() => passwordService.validateStrength('VETLUNA#2026', true)).toThrow(ValidationError);

      // Sin número
      expect(() => passwordService.validateStrength('VetLuna#Clave', true)).toThrow(ValidationError);

      // Sin símbolo
      expect(() => passwordService.validateStrength('VetLuna2026', true)).toThrow(ValidationError);
    });
  });

  describe('Hashing y Comparación', () => {
    test('debe generar un hash bcrypt válido y verificarlo', async () => {
      const plain = 'ContrasenaSegura#1';
      const hash = await passwordService.hash(plain);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plain);
      expect(hash.startsWith('$2')).toBe(true);

      const isMatch = await passwordService.compare(plain, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await passwordService.compare('PasswordIncorrecta', hash);
      expect(isWrongMatch).toBe(false);
    });

    test('debe retornar false al comparar con valores vacíos o nulos', async () => {
      expect(await passwordService.compare(null, 'hash')).toBe(false);
      expect(await passwordService.compare('plain', null)).toBe(false);
    });
  });
});
