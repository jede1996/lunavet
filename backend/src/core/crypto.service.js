const crypto = require('crypto');
const config = require('../config/env');
const { AppError } = require('./errors');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const PREFIX = 'enc:v1';

class CryptoService {
  constructor(keyHex = undefined) {
    const rawKey = keyHex !== undefined ? keyHex : config.crypto.encryptionKey;
    if (!rawKey || typeof rawKey !== 'string' || rawKey.length !== 64) {
      throw new Error('CryptoService requiere una clave de 32 bytes en formato hexadecimal (64 caracteres).');
    }
    this.key = Buffer.from(rawKey, 'hex');
  }

  /**
   * Cifra un texto plano utilizando AES-256-GCM.
   * @param {string} plaintext 
   * @returns {string} Formato enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
   */
  encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) {
      return null;
    }

    const textToEncrypt = typeof plaintext === 'string' ? plaintext : String(plaintext);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let ciphertext = cipher.update(textToEncrypt, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${PREFIX}:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
  }

  /**
   * Descifra un texto cifrado con el formato enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
   * @param {string} encryptedString 
   * @returns {string} Texto plano original
   */
  decrypt(encryptedString) {
    if (encryptedString === null || encryptedString === undefined) {
      return null;
    }

    if (typeof encryptedString !== 'string') {
      throw new AppError('El valor a descifrar debe ser una cadena de texto.', 400, 'CRYPTO_INVALID_INPUT');
    }

    if (!encryptedString.startsWith(`${PREFIX}:`)) {
      // Si no tiene el prefijo de cifrado, retornar como está o advertir
      return encryptedString;
    }

    const parts = encryptedString.split(':');
    if (parts.length !== 5) { // 'enc', 'v1', iv, tag, ciphertext
      throw new AppError('Formato de datos cifrados inválido.', 400, 'CRYPTO_INVALID_FORMAT');
    }

    const [, , ivHex, tagHex, ciphertextHex] = parts;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err) {
      throw new AppError('Fallo en descifrado: Datos manipulados, corruptos o clave incorrecta.', 500, 'CRYPTO_TAMPERED');
    }
  }

  /**
   * Cifra un objeto serializable a JSON.
   */
  encryptJson(obj) {
    if (obj === null || obj === undefined) return null;
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Descifra y parsea un objeto JSON previamente cifrado.
   */
  decryptJson(encryptedString) {
    const decryptedStr = this.decrypt(encryptedString);
    if (!decryptedStr) return null;
    try {
      return JSON.parse(decryptedStr);
    } catch (err) {
      throw new AppError('El contenido descifrado no es un JSON válido.', 500, 'CRYPTO_JSON_PARSE_ERROR');
    }
  }

  /**
   * Genera un hash criptográfico SHA-256 (ideal para verificar integridad de BLOBs).
   */
  hashSha256(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Alias de conveniencia para hashSha256
   */
  sha256(data) {
    return this.hashSha256(data);
  }

  /**
   * Genera un sello criptográfico HMAC-SHA256 para validación de recetas
   */
  hmacSha256(data, secretKey = null) {
    if (!data) return null;
    const key = secretKey || this.key;
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Genera un token criptográficamente seguro (para resets de clave, refresh tokens, etc.).
   */
  generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }
}

module.exports = new CryptoService();
module.exports.CryptoService = CryptoService;
