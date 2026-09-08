const crypto = require('crypto');

const RFC4648_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica un Buffer a Base32 conforme a RFC 4648.
 */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += RFC4648_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += RFC4648_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Decodifica una cadena Base32 a Buffer.
 */
function base32Decode(input) {
  if (!input || typeof input !== 'string') return Buffer.alloc(0);
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = RFC4648_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

class TotpService {
  constructor() {
    this.step = 30; // Segundos por ventana (estándar TOTP RFC 6238)
    this.window = 1; // Tolerancia de +/- 1 ventana para desfase de reloj
  }

  /**
   * Genera un secreto criptográfico aleatorio Base32 de 20 bytes (160 bits).
   * @returns {string} Secreto Base32
   */
  generateSecret(bytes = 20) {
    return base32Encode(crypto.randomBytes(bytes));
  }

  /**
   * Genera la URL estándar otpauth:// para escaneo en apps como Google Authenticator o Authy.
   */
  getOtpAuthUrl(email, secret, issuer = 'LunaVet') {
    const encIssuer = encodeURIComponent(issuer);
    const encEmail = encodeURIComponent(email);
    return `otpauth://totp/${encIssuer}:${encEmail}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=${this.step}`;
  }

  /**
   * Genera el token TOTP actual de 6 dígitos (RFC 6238).
   * @param {string} secretBase32 
   * @param {number} [timeOffsetSteps=0] 
   * @returns {string} Token de 6 dígitos
   */
  generateToken(secretBase32, timeOffsetSteps = 0) {
    if (!secretBase32) return null;
    const secretBuffer = base32Decode(secretBase32);
    if (secretBuffer.length === 0) return null;

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / this.step) + timeOffsetSteps;

    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', secretBuffer).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
    const token = (binary % 1000000).toString().padStart(6, '0');

    return token;
  }

  /**
   * Verifica un token de 6 dígitos con protección contra ataques de temporización (timing attacks).
   * @param {string} token 
   * @param {string} secretBase32 
   * @returns {boolean}
   */
  verify(token, secretBase32) {
    if (!token || !secretBase32) return false;
    const cleanToken = String(token).trim();
    if (cleanToken.length !== 6) return false;

    const tokenBuf = Buffer.from(cleanToken);

    for (let offset = -this.window; offset <= this.window; offset++) {
      const expected = this.generateToken(secretBase32, offset);
      if (!expected) continue;
      const expectedBuf = Buffer.from(expected);

      if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
        return true;
      }
    }

    return false;
  }
}

module.exports = new TotpService();
module.exports.TotpService = TotpService;
