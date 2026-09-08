const { BlobService } = require('../../src/core/blob.service');
const { 
  PayloadTooLargeError, 
  UnsupportedMediaTypeError, 
  ValidationError 
} = require('../../src/core/errors');

describe('BlobService - Manejo Seguro de Archivos BLOB para MySQL', () => {
  let service;

  // Buffers con cabeceras mágicas reales para pruebas
  const validJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const validPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]); // %PDF-1.4
  const validWebp = Buffer.concat([
    Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
    Buffer.from([0x24, 0x00, 0x00, 0x00]), // Tamaño
    Buffer.from([0x57, 0x45, 0x42, 0x50])  // WEBP
  ]);

  beforeEach(() => {
    service = new BlobService({
      maxFileSizeBytes: 1024 * 1024, // 1MB para pruebas
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    });
  });

  describe('Sanitización de nombres de archivo', () => {
    test('debe limpiar rutas maliciosas de tipo Path Traversal', () => {
      expect(service.sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(service.sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
      expect(service.sanitizeFilename('mi foto clínica (1).jpg')).toBe('mi_foto_cl_nica__1_.jpg');
    });

    test('debe asignar nombre por defecto si no se proporciona o está vacío', () => {
      const sanitized = service.sanitizeFilename('');
      expect(sanitized.startsWith('archivo_')).toBe(true);
      expect(service.sanitizeFilename(null).startsWith('archivo_')).toBe(true);
    });
  });

  describe('Validación de archivos y Magic Bytes', () => {
    test('debe aceptar y validar un archivo JPEG legítimo', () => {
      const result = service.validateFile({
        buffer: validJpeg,
        mimeType: 'image/jpeg',
        originalName: 'mascota_perfil.jpg'
      });

      expect(result.mimeType).toBe('image/jpeg');
      expect(result.size).toBe(validJpeg.length);
      expect(result.hashSha256).toBeDefined();
      expect(result.filename).toBe('mascota_perfil.jpg');
    });

    test('debe aceptar y validar archivos PNG, PDF y WebP legítimos', () => {
      const pngResult = service.validateFile({ buffer: validPng, mimeType: 'image/png', originalName: 'rx.png' });
      expect(pngResult.mimeType).toBe('image/png');

      const pdfResult = service.validateFile({ buffer: validPdf, mimeType: 'application/pdf', originalName: 'receta.pdf' });
      expect(pdfResult.mimeType).toBe('application/pdf');

      const webpResult = service.validateFile({ buffer: validWebp, mimeType: 'image/webp', originalName: 'foto.webp' });
      expect(webpResult.mimeType).toBe('image/webp');
    });

    test('debe rechazar archivo si el buffer es nulo o vacío', () => {
      expect(() => service.validateFile(null)).toThrow(ValidationError);
      expect(() => service.validateFile({ buffer: Buffer.alloc(0), mimeType: 'image/jpeg' })).toThrow(ValidationError);
    });

    test('debe rechazar archivos que superen el límite de tamaño configurado', () => {
      const largeBuffer = Buffer.alloc(1024 * 1024 + 1); // 1MB + 1 byte
      expect(() => service.validateFile({
        buffer: largeBuffer,
        mimeType: 'image/jpeg',
        originalName: 'pesado.jpg'
      })).toThrow(PayloadTooLargeError);
    });

    test('debe rechazar tipos MIME no permitidos (ej. ejecutables o scripts)', () => {
      expect(() => service.validateFile({
        buffer: Buffer.from('malicious script'),
        mimeType: 'application/x-msdownload',
        originalName: 'virus.exe'
      })).toThrow(UnsupportedMediaTypeError);
    });

    test('debe rechazar archivos camuflados (extensión/MIME falso pero contenido malicioso)', () => {
      // Intento de subir script PHP haciéndose pasar por PNG
      const fakePng = Buffer.from('<?php echo "pwned"; ?>');
      expect(() => service.validateFile({
        buffer: fakePng,
        mimeType: 'image/png',
        originalName: 'shell.png'
      })).toThrow(UnsupportedMediaTypeError);
    });
  });

  describe('Streaming de respuesta HTTP segura', () => {
    test('debe establecer cabeceras de seguridad y caché al enviar un BLOB', () => {
      const headersSent = {};
      const mockRes = {
        set: jest.fn((headers) => {
          Object.assign(headersSent, headers);
        }),
        end: jest.fn()
      };

      const record = {
        buffer: validPdf,
        mime_type: 'application/pdf',
        nombre_archivo: 'receta_001.pdf',
        hash_sha256: 'abc123hash'
      };

      service.streamBlobResponse(mockRes, record, false);

      expect(mockRes.set).toHaveBeenCalled();
      expect(headersSent['Content-Type']).toBe('application/pdf');
      expect(headersSent['X-Content-Type-Options']).toBe('nosniff');
      expect(headersSent['Content-Disposition']).toBe('inline; filename="receta_001.pdf"');
      expect(headersSent['Cache-Control']).toContain('private');
      expect(mockRes.end).toHaveBeenCalledWith(validPdf);
    });

    test('debe configurar Content-Disposition como attachment si se solicita descarga forzosa', () => {
      const headersSent = {};
      const mockRes = {
        set: jest.fn((headers) => {
          Object.assign(headersSent, headers);
        }),
        end: jest.fn()
      };

      service.streamBlobResponse(mockRes, {
        buffer: validJpeg,
        mime_type: 'image/jpeg',
        nombre_archivo: 'foto.jpg'
      }, true);

      expect(headersSent['Content-Disposition']).toBe('attachment; filename="foto.jpg"');
    });

    test('debe rechazar streaming si el registro es nulo o no tiene buffer', () => {
      const mockRes = { set: jest.fn(), end: jest.fn() };
      expect(() => service.streamBlobResponse(mockRes, null)).toThrow(ValidationError);
      expect(() => service.streamBlobResponse(mockRes, {})).toThrow(ValidationError);
    });
  });
});
