class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Error de validación de datos', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Petición inválida o datos erróneos', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Acceso no autorizado o credenciales inválidas') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409, 'CONFLICT');
  }
}

class PayloadTooLargeError extends AppError {
  constructor(message = 'El archivo supera el tamaño máximo permitido') {
    super(message, 413, 'PAYLOAD_TOO_LARGE');
  }
}

class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Tipo de medio no soportado o inválido') {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE');
  }
}

module.exports = {
  AppError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError
};
