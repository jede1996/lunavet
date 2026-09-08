/**
 * imageOptimizer.js
 * Módulo para redimensionamiento, compresión y optimización de imágenes en cliente
 * antes de transmitirse al backend (ahorro del ~80% de almacenamiento y ancho de banda).
 */

/**
 * Obtiene las dimensiones naturales de una imagen sin renderizarla en el DOM.
 * @param {File|Blob} file 
 * @returns {Promise<{width: number, height: number}>}
 */
export function validateImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('El archivo proporcionado no es una imagen válida.'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer el archivo de imagen.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Comprime y redimensiona una imagen en el cliente usando HTML5 Canvas.
 * Convierte por defecto a formato moderno WebP o JPEG optimizado.
 * 
 * @param {File|Blob} file - Archivo de imagen original
 * @param {Object} options - Parámetros de compresión
 * @param {number} [options.maxWidth=1200] - Ancho máximo permitido
 * @param {number} [options.maxHeight=1200] - Alto máximo permitido
 * @param {number} [options.quality=0.82] - Calidad de compresión (0.1 a 1.0)
 * @param {string} [options.outputType='image/webp'] - Tipo MIME de salida
 * @returns {Promise<File>} Archivo comprimido listo para enviarse en FormData
 */
export async function compressImage(file, {
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82,
  outputType = 'image/webp'
} = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('El archivo proporcionado no es una imagen.');
  }

  // Si el entorno no soporta canvas (ej. entornos de test o navegadores muy antiguos), retornar archivo original
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calcular nuevas dimensiones manteniendo la relación de aspecto
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file); // Fallback al archivo original si no hay contexto
      }

      // Si el formato es JPEG, rellenar fondo blanco para transparencias
      if (outputType === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Si canvas.toBlob no está disponible (ej. mock en jsdom), retornar fallback
      if (typeof canvas.toBlob !== 'function') {
        return resolve(file);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // Generar nombre de archivo con la extensión apropiada
          const originalName = file.name || 'image';
          const dotIdx = originalName.lastIndexOf('.');
          const baseName = dotIdx !== -1 ? originalName.substring(0, dotIdx) : originalName;
          const extension = outputType === 'image/webp' ? '.webp' : outputType === 'image/png' ? '.png' : '.jpg';
          const newFileName = `${baseName}${extension}`;

          const optimizedFile = new File([blob], newFileName, {
            type: outputType,
            lastModified: Date.now()
          });

          resolve(optimizedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Fallo al cargar la imagen para compresión.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Formatea bytes en formato legible por humanos (KB, MB).
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
