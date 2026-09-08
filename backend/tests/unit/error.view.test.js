const { renderErrorHtml } = require('../../src/views/error.view');

describe('Views - Error HTML View Renderer', () => {
  it('debe renderizar la vista 404 por defecto con branding LunaVet', () => {
    const html = renderErrorHtml();
    expect(html).toContain('404');
    expect(html).toContain('Ruta No Encontrada');
    expect(html).toContain('ROUTE_NOT_FOUND');
    expect(html).toContain('LunaVet v4.0');
    expect(html).toContain('/api/health');
  });

  it('debe renderizar la vista cuando se pasa un objeto vacío como opción', () => {
    const html = renderErrorHtml({});
    expect(html).toContain('404');
    expect(html).toContain('ROUTE_NOT_FOUND');
  });

  it('debe renderizar vista no-404 (ej. 403 o 500) con estilos de advertencia y sin stack cuando es null', () => {
    const html = renderErrorHtml({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'No autorizado',
      details: null,
      method: 'DELETE',
      url: '/api/pets/1',
      stack: null
    });

    expect(html).toContain('403');
    expect(html).toContain('Error del Servidor');
    expect(html).toContain('FORBIDDEN');
    expect(html).toContain('#fbbf24');
    expect(html).not.toContain('Stack Trace (Modo Desarrollo)');
  });

  it('debe renderizar vista 500 con título de error del servidor, detalles y stack trace si se proporciona', () => {
    const fakeStack = 'Error: Fallo de conexión\n    at test.js:10:15';
    const html = renderErrorHtml({
      statusCode: 500,
      code: 'DB_CONNECTION_ERROR',
      message: 'No se pudo conectar a la base de datos',
      details: { host: '127.0.0.1' },
      method: 'POST',
      url: '/api/commerce/checkout',
      stack: fakeStack
    });

    expect(html).toContain('500');
    expect(html).toContain('Error del Servidor');
    expect(html).toContain('DB_CONNECTION_ERROR');
    expect(html).toContain('No se pudo conectar a la base de datos');
    expect(html).toContain('POST');
    expect(html).toContain('/api/commerce/checkout');
    expect(html).toContain('Stack Trace (Modo Desarrollo)');
    expect(html).toContain('Fallo de conexión');
    expect(html).toContain('host');
  });

  it('debe escapar caracteres HTML en parámetros para prevenir XSS y manejar valores vacíos', () => {
    const xssPayload = '<script>alert("xss")</script>&"\'';
    const html = renderErrorHtml({
      message: xssPayload,
      code: '<b>INJECTION</b>',
      url: null
    });

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert');
    expect(html).toContain('&amp;&quot;&#039;');
    expect(html).toContain('&lt;b&gt;INJECTION&lt;/b&gt;');
  });
});


