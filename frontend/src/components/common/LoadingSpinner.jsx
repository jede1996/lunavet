import React from 'react';

export function LoadingSpinner({ message = 'Cargando información...' }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <p className="text-muted small mb-0">{message}</p>
    </div>
  );
}
