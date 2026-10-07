import React from 'react';

/**
 * ErrorBoundary con diseño Apple HIG para atrapar errores de renderizado en React.
 * Proporciona recuperación suave sin romper la experiencia global del usuario.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('[Luna-Vet ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container py-5 text-center my-auto" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="card border-0 shadow-sm p-4 p-md-5 mx-auto"
            style={{
              maxWidth: '560px',
              borderRadius: '24px',
              backdropFilter: 'blur(20px)',
              background: 'var(--apple-card-bg, rgba(255, 255, 255, 0.85))'
            }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--apple-red, #dc2626)',
                fontSize: '28px'
              }}
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>

            <h3 className="fw-bold mb-2" style={{ letterSpacing: '-0.02em' }}>
              Algo no salió como esperábamos
            </h3>
            <p className="text-muted mb-4 fs-6">
              Ocurrió un error inesperado al renderizar este componente. Tus datos están a salvo.
            </p>

            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 py-2 fw-medium shadow-sm"
                onClick={this.handleReset}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reintentar
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-medium"
                onClick={() => window.location.assign('/')}
              >
                <i className="bi bi-house me-2"></i>
                Ir al Inicio
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-start p-3 bg-light rounded-3 small text-muted overflow-auto" style={{ maxHeight: '200px' }}>
                <summary className="cursor-pointer fw-semibold text-danger">Detalles del Error (Dev)</summary>
                <pre className="mt-2 mb-0" style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
