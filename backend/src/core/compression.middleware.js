const zlib = require('zlib');

/**
 * Middleware nativo de compresión HTTP sin dependencias externas usando node:zlib
 */
function compressionMiddleware(thresholdBytes = 1024) {
  return (req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Si no acepta compresión o la respuesta ya viene codificada, omitir
    if (!acceptEncoding) {
      return next();
    }

    const originalSend = res.send.bind(res);

    res.send = function (body) {
      // Si ya tiene Content-Encoding configurado o no hay body, no hacer nada
      if (res.getHeader('Content-Encoding') || !body) {
        return originalSend(body);
      }

      let buffer;
      if (Buffer.isBuffer(body)) {
        buffer = body;
      } else if (typeof body === 'string') {
        buffer = Buffer.from(body, 'utf8');
      } else if (typeof body === 'object') {
        buffer = Buffer.from(JSON.stringify(body), 'utf8');
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      } else {
        return originalSend(body);
      }

      // Solo comprimir si supera el umbral
      if (buffer.length < thresholdBytes) {
        return originalSend(buffer);
      }

      // No comprimir tipos binarios ya comprimidos (imágenes, audio, video)
      const contentType = (res.getHeader('Content-Type') || '').toString().toLowerCase();
      if (
        contentType.includes('image/') ||
        contentType.includes('video/') ||
        contentType.includes('audio/') ||
        contentType.includes('application/zip') ||
        contentType.includes('application/gzip')
      ) {
        return originalSend(buffer);
      }

      // Priorizar Brotli (br) si está soportado y disponible en node
      if (acceptEncoding.includes('br') && typeof zlib.brotliCompressSync === 'function') {
        try {
          const compressed = zlib.brotliCompressSync(buffer);
          res.setHeader('Content-Encoding', 'br');
          res.removeHeader('Content-Length');
          return originalSend(compressed);
        } catch (e) {
          // Si falla br, continuar a gzip
        }
      }

      // Gzip
      if (acceptEncoding.includes('gzip')) {
        try {
          const compressed = zlib.gzipSync(buffer);
          res.setHeader('Content-Encoding', 'gzip');
          res.removeHeader('Content-Length');
          return originalSend(compressed);
        } catch (e) {
          // Fallback a original
        }
      }

      // Deflate
      if (acceptEncoding.includes('deflate')) {
        try {
          const compressed = zlib.deflateSync(buffer);
          res.setHeader('Content-Encoding', 'deflate');
          res.removeHeader('Content-Length');
          return originalSend(compressed);
        } catch (e) {
          // Fallback a original
        }
      }

      return originalSend(buffer);
    };

    next();
  };
}

module.exports = {
  compressionMiddleware
};
