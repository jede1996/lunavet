const config = require('../config/env');
const { 
  PayloadTooLargeError, 
  UnsupportedMediaTypeError, 
  ValidationError 
} = require('./errors');
const cryptoService = require('./crypto.service');

// Firmas mágicas de archivos soportados
const MAGIC_NUMBERS = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF]
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46] // %PDF
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (primeros 4 bytes)
  ]
};

class BlobService {
  constructor(customConfig = {}) {
    this.maxSize = customConfig.maxFileSizeBytes || config.blob.maxFileSizeBytes;
    this.allowedMimeTypes = customConfig.allowedMimeTypes || config.blob.allowedMimeTypes;
  }

  /**
   * Sanitiza un nombre de archivo para prevenir Path Traversal e inyecciones de cabecera.
   * @param {string} originalName 
   * @returns {string} Nombre sanitizado
   */
  sanitizeFilename(originalName) {
    if (!originalName || typeof originalName !== 'string') {
      return `archivo_${Date.now()}`;
    }
    // Remover rutas absolutas o relativas (../) y caracteres no alfanuméricos salvo puntos y guiones
    const baseName = originalName.replace(/^.*[\\/]/, '');
    const clean = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return clean || `archivo_${Date.now()}`;
  }

  /**
   * Verifica los bytes mágicos del buffer contra el MIME type declarado.
   * Previene ataques de extensión falsa (ej. archivo .php o .exe con MIME image/png).
   * @param {Buffer} buffer 
   * @param {string} mimeType 
   * @returns {boolean}
   */
  verifyMagicBytes(buffer, mimeType) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
      return false;
    }

    const signatures = MAGIC_NUMBERS[mimeType];
    if (!signatures) {
      return false;
    }

    // Para WebP verificar RIFF al inicio y WEBP en bytes 8-11
    if (mimeType === 'image/webp') {
      if (buffer.length < 12) return false;
      const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
      const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
      return isRiff && isWebp;
    }

    return signatures.some(sig => {
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) return false;
      }
      return true;
    });
  }

  /**
   * Valida integralmente un archivo recibido para persistencia como BLOB.
   * @param {Object} fileObj { buffer, mimeType, originalName }
   * @returns {Object} { buffer, mimeType, filename, size, hashSha256 }
   */
  validateFile(fileObj) {
    if (!fileObj || !fileObj.buffer) {
      throw new ValidationError('No se ha proporcionado el buffer de datos del archivo.');
    }

    const buffer = Buffer.isBuffer(fileObj.buffer) ? fileObj.buffer : Buffer.from(fileObj.buffer);
    const mimeType = (fileObj.mimeType || fileObj.mimetype || '').toLowerCase().trim();

    // 1. Validar tamaño máximo
    if (buffer.length === 0) {
      throw new ValidationError('El archivo proporcionado está vacío.');
    }

    if (buffer.length > this.maxSize) {
      const maxMb = (this.maxSize / (1024 * 1024)).toFixed(2);
      throw new PayloadTooLargeError(`El archivo supera el tamaño máximo permitido de ${maxMb} MB.`);
    }

    // 2. Validar lista blanca de MIME Types
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new UnsupportedMediaTypeError(
        `Tipo de archivo '${mimeType}' no permitido. Permitidos: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    // 3. Validar firmas de bytes mágicos
    const isValidSignature = this.verifyMagicBytes(buffer, mimeType);
    if (!isValidSignature) {
      throw new UnsupportedMediaTypeError(
        `El contenido binario no coincide con la firma real del tipo ${mimeType}. Archivo sospechoso rechazado.`
      );
    }

    const filename = this.sanitizeFilename(
      fileObj.originalName || fileObj.filename || fileObj.originalname
    );
    const hashSha256 = cryptoService.hashSha256(buffer);

    return {
      buffer,
      mimeType,
      filename,
      size: buffer.length,
      hashSha256
    };
  }

  /**
   * Envía de forma segura un BLOB a través de una respuesta Express HTTP.
   * Aplica cabeceras de prevención de sniffing y control de caché.
   * @param {Object} res Objeto Response de Express
   * @param {Object} blobRecord Registro con { buffer, mime_type, nombre_archivo, tamano_bytes, hash_sha256 }
   * @param {boolean} [asAttachment=false] Si debe forzar la descarga o mostrarse inline
   */
  streamBlobResponse(res, blobRecord, asAttachment = false) {
    if (!blobRecord || !blobRecord.buffer) {
      throw new ValidationError('Registro de archivo inválido para streaming.');
    }

    const mime = blobRecord.mime_type || blobRecord.mimeType || 'application/octet-stream';
    const filename = this.sanitizeFilename(blobRecord.nombre_archivo || blobRecord.filename || 'archivo');
    const dispositionType = asAttachment ? 'attachment' : 'inline';
    const etag = `"${blobRecord.hash_sha256 || cryptoService.hashSha256(blobRecord.buffer)}"`;

    res.set({
      'Content-Type': mime,
      'Content-Length': blobRecord.buffer.length,
      'Content-Disposition': `${dispositionType}; filename="${filename}"`,
      'Cache-Control': 'private, max-age=86400, must-revalidate',
      'ETag': etag,
      'X-Content-Type-Options': 'nosniff'
    });

    return res.end(blobRecord.buffer);
  }
}

module.exports = new BlobService();
module.exports.BlobService = BlobService;
