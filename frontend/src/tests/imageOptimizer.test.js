import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatBytes, compressImage, validateImageDimensions } from '../utils/imageOptimizer';

describe('imageOptimizer Utility', () => {
  describe('formatBytes', () => {
    it('debe formatear 0 bytes correctamente', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(null)).toBe('0 Bytes');
    });

    it('debe formatear kilobytes correctamente', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('debe formatear megabytes correctamente', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });
  });

  describe('compressImage', () => {
    it('debe rechazar archivos que no sean imágenes', async () => {
      const textFile = new File(['hello text'], 'test.txt', { type: 'text/plain' });
      await expect(compressImage(textFile)).rejects.toThrow('El archivo proporcionado no es una imagen.');
      await expect(compressImage(null)).rejects.toThrow('El archivo proporcionado no es una imagen.');
    });

    it('debe procesar un archivo de imagen válido y retornar un File optimizado', async () => {
      // Mock de Image para simular carga exitosa en jsdom
      const originalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          setTimeout(() => {
            this.width = 1600;
            this.height = 1200;
            this.naturalWidth = 1600;
            this.naturalHeight = 1200;
            if (this.onload) this.onload();
          }, 10);
        }
      };

      const file = new File(['fake-image-bytes'], 'mascota.jpg', { type: 'image/jpeg' });
      const result = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8, outputType: 'image/webp' });

      expect(result).toBeDefined();
      expect(result.name).toBe('mascota.webp');
      expect(result.type).toBe('image/webp');

      globalThis.Image = originalImage;
    });
  });

  describe('validateImageDimensions', () => {
    it('debe rechazar archivo si no es imagen', async () => {
      const textFile = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      await expect(validateImageDimensions(textFile)).rejects.toThrow('El archivo proporcionado no es una imagen válida.');
    });

    it('debe resolver las dimensiones de una imagen válida', async () => {
      const originalImage = globalThis.Image;
      globalThis.Image = class {
        constructor() {
          setTimeout(() => {
            this.width = 1920;
            this.height = 1080;
            this.naturalWidth = 1920;
            this.naturalHeight = 1080;
            if (this.onload) this.onload();
          }, 10);
        }
      };

      const imgFile = new File(['fake-png'], 'foto.png', { type: 'image/png' });
      const dims = await validateImageDimensions(imgFile);

      expect(dims).toEqual({ width: 1920, height: 1080 });

      globalThis.Image = originalImage;
    });
  });
});
