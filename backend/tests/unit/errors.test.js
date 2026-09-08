const {
  AppError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError
} = require('../../src/core/errors');

describe('Application Errors - Jerarquía y códigos HTTP', () => {
  test('AppError debe instanciarse con defaults correctos', () => {
    const err = new AppError('Error general');
    expect(err.message).toBe('Error general');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.details).toBeNull();
  });

  test('ValidationError debe tener código 400 y defaults correctos', () => {
    const errDefault = new ValidationError();
    expect(errDefault.statusCode).toBe(400);
    expect(errDefault.message).toBe('Error de validación de datos');
    expect(errDefault.details).toBeNull();

    const err = new ValidationError('Dato inválido', { campo: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ campo: 'email' });
  });

  test('BadRequestError debe tener código 400 y código BAD_REQUEST y defaults correctos', () => {
    const errDefault = new BadRequestError();
    expect(errDefault.statusCode).toBe(400);
    expect(errDefault.message).toBe('Petición inválida o datos erróneos');
    expect(errDefault.details).toBeNull();

    const err = new BadRequestError('Parámetros incorrectos');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });

  test('UnauthorizedError debe tener código 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  test('ForbiddenError debe tener código 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  test('NotFoundError debe tener código 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  test('ConflictError debe tener código 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  test('PayloadTooLargeError debe tener código 413', () => {
    const err = new PayloadTooLargeError();
    expect(err.statusCode).toBe(413);
    expect(err.code).toBe('PAYLOAD_TOO_LARGE');
  });

  test('UnsupportedMediaTypeError debe tener código 415', () => {
    const err = new UnsupportedMediaTypeError();
    expect(err.statusCode).toBe(415);
    expect(err.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});
