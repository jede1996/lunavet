const { errorHandler, notFoundHandler } = require('../../src/middleware/error.middleware');
const { clientIpMiddleware } = require('../../src/middleware/security.middleware');
const { ValidationError } = require('../../src/core/errors');

describe('Middlewares - Manejo de Errores y Seguridad', () => {
  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    mockReq = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      ip: '127.0.0.1',
      method: 'GET',
      originalUrl: '/api/test'
    };
    mockRes = {
      statusCode: null,
      jsonData: null,
      htmlData: null,
      contentType: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      type: function(t) {
        this.contentType = t;
        return this;
      },
      send: function(data) {
        this.htmlData = data;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      }
    };
    nextFn = jest.fn();
  });

  describe('errorHandler', () => {
    test('debe formatear errores de tipo AppError correctamente', () => {
      const err = new ValidationError('Campo requerido', { campo: 'nombre' });
      errorHandler(err, mockReq, mockRes, nextFn);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.jsonData.success).toBe(false);
      expect(mockRes.jsonData.error.code).toBe('VALIDATION_ERROR');
      expect(mockRes.jsonData.error.message).toBe('Campo requerido');
      expect(mockRes.jsonData.error.details).toEqual({ campo: 'nombre' });
    });

    test('debe manejar errores de sintaxis JSON (body parser)', () => {
      const syntaxErr = new SyntaxError('Unexpected token');
      syntaxErr.body = '{ malformed';
      errorHandler(syntaxErr, mockReq, mockRes, nextFn);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.jsonData.error.code).toBe('INVALID_JSON');
    });

    test('debe manejar errores de bloqueo CORS', () => {
      const corsErr = new Error('CORS bloqueado para el origen: http://malicioso.com');
      errorHandler(corsErr, mockReq, mockRes, nextFn);

      expect(mockRes.statusCode).toBe(403);
      expect(mockRes.jsonData.error.code).toBe('CORS_FORBIDDEN');
    });

    test('debe manejar errores inesperados 500 sin exponer detalles sensibles', () => {
      const generalErr = new Error('Fallo crítico no controlado');
      errorHandler(generalErr, mockReq, mockRes, nextFn);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.jsonData.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(mockRes.jsonData.error.message).toBe('Ha ocurrido un error interno en el servidor.');
    });

    test('debe renderizar vista HTML si el cliente solicita HTML (navegador web)', () => {
      mockReq.accepts = jest.fn().mockReturnValue('html');
      const err = new ValidationError('Dato inválido');
      errorHandler(err, mockReq, mockRes, nextFn);

      expect(mockRes.statusCode).toBe(400);
      expect(mockRes.contentType).toBe('html');
      expect(mockRes.htmlData).toContain('<!DOCTYPE html>');
      expect(mockRes.htmlData).toContain('VALIDATION_ERROR');
    });

    test('debe renderizar vista HTML con stack trace para error 500 en desarrollo', () => {
      mockReq.accepts = jest.fn().mockReturnValue('html');
      const err = new Error('Error de base de datos no capturado');
      errorHandler(err, mockReq, mockRes, nextFn);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.contentType).toBe('html');
      expect(mockRes.htmlData).toContain('Error del Servidor');
      expect(mockRes.htmlData).toContain('Stack Trace (Modo Desarrollo)');
    });
  });

  describe('notFoundHandler', () => {
    test('debe responder con JSON estandarizado 404 cuando el cliente es una API', () => {
      mockReq.method = 'GET';
      mockReq.originalUrl = '/api/ruta-inexistente';
      mockReq.accepts = jest.fn().mockReturnValue('json');

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.jsonData.success).toBe(false);
      expect(mockRes.jsonData.error.code).toBe('ROUTE_NOT_FOUND');
      expect(mockRes.jsonData.error.message).toBe('La ruta solicitada GET /api/ruta-inexistente no existe en el servidor.');
    });

    test('debe responder con vista HTML cuando el cliente es un navegador web (accepts html)', () => {
      mockReq.method = 'GET';
      mockReq.originalUrl = '/';
      mockReq.accepts = jest.fn().mockReturnValue('html');

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.statusCode).toBe(404);
      expect(mockRes.contentType).toBe('html');
      expect(mockRes.htmlData).toContain('<!DOCTYPE html>');
      expect(mockRes.htmlData).toContain('404');
      expect(mockRes.htmlData).toContain('Ruta No Encontrada');
      expect(mockRes.htmlData).toContain('ROUTE_NOT_FOUND');
    });
  });

  describe('clientIpMiddleware', () => {
    test('debe extraer la primera IP de x-forwarded-for si existe', () => {
      mockReq.headers['x-forwarded-for'] = '201.140.50.2, 10.0.0.1';
      clientIpMiddleware(mockReq, mockRes, nextFn);

      expect(mockReq.clientIp).toBe('201.140.50.2');
      expect(nextFn).toHaveBeenCalled();
    });

    test('debe recurrir a socket remoteAddress si no hay cabecera x-forwarded-for', () => {
      clientIpMiddleware(mockReq, mockRes, nextFn);

      expect(mockReq.clientIp).toBe('127.0.0.1');
      expect(nextFn).toHaveBeenCalled();
    });

    test('debe recurrir a req.ip si socket remoteAddress no está definido', () => {
      mockReq.socket = {};
      mockReq.ip = '192.168.1.100';
      clientIpMiddleware(mockReq, mockRes, nextFn);

      expect(mockReq.clientIp).toBe('192.168.1.100');
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('corsOptions', () => {
    const { corsOptions } = require('../../src/middleware/security.middleware');

    test('debe permitir solicitudes sin encabezado Origin (curl o servidor)', () => {
      const cb = jest.fn();
      corsOptions.origin(undefined, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('debe permitir orígenes válidos configurados', () => {
      const cb = jest.fn();
      corsOptions.origin('https://lunavet.lat', cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('debe bloquear orígenes no autorizados en entorno de producción', () => {
      const envConfig = require('../../src/config/env');
      const prevProduction = envConfig.isProduction;
      envConfig.isProduction = true;

      try {
        const cb = jest.fn();
        corsOptions.origin('https://sitio-malicioso.com', cb);
        expect(cb).toHaveBeenCalledWith(expect.any(Error));
        expect(cb.mock.calls[0][0].message).toContain('CORS bloqueado');
      } finally {
        envConfig.isProduction = prevProduction;
      }
    });
  });
});
