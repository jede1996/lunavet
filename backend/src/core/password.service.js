const bcrypt = require('bcryptjs');
const { ValidationError } = require('./errors');

const SALT_ROUNDS = 10;

class PasswordService {
  /**
   * Valida la robustez de la contraseña según el rol.
   * Staff requiere al menos 8 caracteres, mayúscula, minúscula, número y símbolo.
   * Cliente requiere al menos 8 caracteres.
   * @param {string} password 
   * @param {boolean} isStaff 
   */
  validateStrength(password, isStaff = false) {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('La contraseña es requerida y debe ser texto.');
    }

    if (password.length < 8) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres.');
    }

    if (isStaff) {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new ValidationError(
          'La contraseña para personal de la clínica debe contener al menos una mayúscula, una minúscula, un número y un símbolo especial.'
        );
      }
    }

    return true;
  }

  /**
   * Genera el hash de la contraseña usando bcryptjs.
   * @param {string} password 
   * @returns {Promise<string>}
   */
  async hash(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compara una contraseña en texto plano contra su hash bcrypt.
   * @param {string} plain 
   * @param {string} hash 
   * @returns {Promise<boolean>}
   */
  async compare(plain, hash) {
    if (!plain || !hash) return false;
    return bcrypt.compare(plain, hash);
  }
}

module.exports = new PasswordService();
module.exports.PasswordService = PasswordService;
