const { CryptoService } = require('../../src/core/crypto.service');

describe('CryptoService - Cifrado en Reposo AES-256-GCM y Hashing', () => {
  const TEST_KEY = 'a'.repeat(64); // 32 bytes en hex
  let service;

  beforeEach(() => {
    service = new CryptoService(TEST_KEY);
  });

  test('debe inicializarse correctamente con una clave válida de 64 caracteres hex', () => {
    expect(service.key).toBeDefined();
    expect(service.key.length).toBe(32);
  });

  test('debe lanzar error si la clave es inválida o tiene longitud incorrecta', () => {
    expect(() => new CryptoService('clave_corta')).toThrow();
    expect(() => new CryptoService(null)).toThrow();
  });

  test('debe cifrar y descifrar una cadena de texto plano conservando la integridad', () => {
    const textoOriginal = 'Paciente diagnosticado con dermatitis alérgica severa. Recetar prednisona.';
    const cifrado = service.encrypt(textoOriginal);

    expect(cifrado).toBeDefined();
    expect(cifrado.startsWith('enc:v1:')).toBe(true);
    expect(cifrado).not.toEqual(textoOriginal);

    const descifrado = service.decrypt(cifrado);
    expect(descifrado).toEqual(textoOriginal);
  });

  test('debe manejar valores nulos y no definidos devolviendo null', () => {
    expect(service.encrypt(null)).toBeNull();
    expect(service.encrypt(undefined)).toBeNull();
    expect(service.decrypt(null)).toBeNull();
    expect(service.decrypt(undefined)).toBeNull();
  });

  test('debe detectar manipulación o alteración de datos cifrados (Tamper Detection)', () => {
    const cifrado = service.encrypt('Datos médicos confidenciales');
    const partes = cifrado.split(':');
    
    // Alterar el último carácter del ciphertext
    const alteradoCiphertext = partes[4].slice(0, -2) + (partes[4].endsWith('00') ? 'ff' : '00');
    const paqueteAlterado = `${partes[0]}:${partes[1]}:${partes[2]}:${partes[3]}:${alteradoCiphertext}`;

    expect(() => service.decrypt(paqueteAlterado)).toThrow(/manipulados, corruptos o clave incorrecta/);
  });

  test('debe lanzar error si el formato del paquete cifrado es inválido', () => {
    expect(() => service.decrypt('enc:v1:incompleto')).toThrow(/Formato de datos cifrados inválido/);
    expect(() => service.decrypt(12345)).toThrow(/debe ser una cadena de texto/);
  });

  test('debe retornar el texto intacto si no tiene el prefijo de cifrado', () => {
    const textoSinCifrar = 'Texto normal';
    expect(service.decrypt(textoSinCifrar)).toBe(textoSinCifrar);
  });

  test('debe cifrar y descifrar objetos JSON estructurados', () => {
    const expediente = {
      alergias: ['penicilina', 'sulfamidas'],
      historial: 'Cirugía de fémur en 2024',
      pesoKg: 14.5
    };

    const cifrado = service.encryptJson(expediente);
    expect(typeof cifrado).toBe('string');

    const recuperado = service.decryptJson(cifrado);
    expect(recuperado).toEqual(expediente);

    expect(service.encryptJson(null)).toBeNull();
    expect(service.decryptJson(null)).toBeNull();
  });

  test('debe generar hashes SHA-256 consistentes y tokens seguros', () => {
    const data = Buffer.from('contenido_binario_de_prueba');
    const hash1 = service.hashSha256(data);
    const hash2 = service.hashSha256(data);

    expect(hash1).toHaveLength(64);
    expect(hash1).toEqual(hash2);
    expect(service.hashSha256(null)).toBeNull();

    const token = service.generateSecureToken(16);
    expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
  });
});
