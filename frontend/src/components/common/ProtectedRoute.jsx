import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol)) {
    // Redirección inteligente al portal correspondiente
    if (user?.rol === 'cliente') {
      return <Navigate to="/portal" replace />;
    } else if (['veterinario', 'recepcionista', 'administrador'].includes(user?.rol)) {
      return <Navigate to="/staff/agenda" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
