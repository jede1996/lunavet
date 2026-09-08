const config = require('../config/env');
const { AppError } = require('../core/errors');
const { renderErrorHtml } = require('../views/error.view');

function errorHandler(err, req, res, _next) {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Ha ocurrido un error interno en el servidor.';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'El cuerpo de la solicitud no contiene un JSON válido.';
  } else if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    code = 'CORS_FORBIDDEN';
    message = err.message;
  }

  // Si el cliente solicita HTML (navegador web), renderizar vista visual premium
  if (req.accepts && req.accepts(['json', 'html']) === 'html') {
    return res.status(statusCode).type('html').send(renderErrorHtml({
      statusCode,
      code,
      message,
      details,
      method: req.method,
      url: req.originalUrl,
      stack: (!config.isProduction && statusCode === 500) ? err.stack : null
    }));
  }

  // En desarrollo o pruebas, se adjunta el stack trace si no es AppError esperado
  const responsePayload = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...((!config.isProduction && statusCode === 500) ? { stack: err.stack } : {})
    }
  };

  res.status(statusCode).json(responsePayload);
}

function notFoundHandler(req, res) {
  const statusCode = 404;
  const code = 'ROUTE_NOT_FOUND';
  const message = `La ruta solicitada ${req.method} ${req.originalUrl} no existe en el servidor.`;

  // Si el cliente solicita HTML (navegador web), renderizar vista visual premium
  if (req.accepts && req.accepts(['json', 'html']) === 'html') {
    return res.status(statusCode).type('html').send(renderErrorHtml({
      statusCode,
      code,
      message,
      method: req.method,
      url: req.originalUrl
    }));
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
