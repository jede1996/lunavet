import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { CartDrawer } from './CartDrawer';
import { BrandLogo } from './BrandLogo';

export function Navbar() {
  const { user, isAuthenticated, isClient, isStaff, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { isDark, isHighContrast, toggleTheme, toggleHighContrast } = useTheme();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => (location.pathname === path ? 'active fw-semibold' : '');

  return (
    <>
      <nav className={`navbar navbar-expand-lg ${isDark ? 'navbar-dark' : 'navbar-light'} navbar-refined sticky-top py-2 py-lg-3`}>
        <div className="container-fluid px-3 px-lg-4 px-xl-5">
          {/* Logotipo Luna-Vet Editable & Clickeable */}
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-decoration-none" to="/">
            <BrandLogo size={36} showText={true} textClassName={`fs-5 ${isDark ? 'text-white' : 'text-dark'}`} />
          </Link>

          {/* Botón hamburguesa responsive */}
          <button
            className="navbar-toggler border-0 p-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarLunaVet"
            aria-controls="navbarLunaVet"
            aria-expanded="false"
            aria-label="Alternar navegación"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Enlaces de Navegación Principales */}
          <div className="collapse navbar-collapse" id="navbarLunaVet">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 fw-medium">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/')}`} to="/">Inicio</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/servicios')}`} to="/servicios">Servicios</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/tienda')}`} to="/tienda">Farmacia & Tienda</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/blog')}`} to="/blog">Consejos & Blog</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/qr')}`} to="/qr">
                  Placas QR
                </Link>
              </li>
            </ul>

            {/* Acciones de Cabecera: Cita (solo clientes/público), Carrito, Tema y Cuenta */}
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              {/* Botón Agendar Cita (Solo visible para visitantes y clientes) */}
              {(!isAuthenticated || isClient) && (
                <Link to="/citas" className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-semibold d-none d-sm-inline-flex align-items-center gap-1 shadow-sm">
                  <i className="bi bi-calendar-check"></i>
                  <span>Agendar Cita</span>
                </Link>
              )}

              {/* Botón Carrito con badge flotante */}
              <button
                type="button"
                className="btn navbar-action-btn btn-sm rounded-circle p-2 position-relative d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                onClick={() => setIsCartOpen(true)}
                aria-label="Ver carrito de compras"
              >
                <i className="bi bi-bag-heart text-primary fs-6"></i>
                {totalItems > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Botón Selector de Tema: Claro / Oscuro Instantáneo */}
              <button
                type="button"
                className="btn navbar-action-btn btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                aria-label="Cambiar tema visual"
              >
                <i className={`bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary'}`}></i>
              </button>

              {/* Menú de Autenticación / Cuenta */}
              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn navbar-user-btn btn-sm dropdown-toggle rounded-pill px-3 py-1 d-flex align-items-center gap-2"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle text-primary fs-6"></i>
                    <span className="small fw-semibold">{user?.nombre?.split(' ')[0] || 'Mi Cuenta'}</span>
                    <span className="navbar-user-badge badge rounded-pill small" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {user?.rol}
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ minWidth: '260px' }}>
                    {isClient && (
                      <>
                        <li><h6 className="dropdown-header text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Portal del Paciente</h6></li>
                        <li><Link className="dropdown-item py-1" to="/portal"><i className="bi bi-speedometer2 me-2 text-primary"></i>Mi Portal</Link></li>
                        <li><Link className="dropdown-item py-1" to="/portal/mascotas"><i className="bi bi-heart me-2 text-danger"></i>Mis Mascotas</Link></li>
                        <li><Link className="dropdown-item py-1" to="/portal/citas"><i className="bi bi-calendar2-check me-2 text-success"></i>Mis Citas</Link></li>
                        <li><Link className="dropdown-item py-1" to="/qr"><i className="bi bi-qr-code me-2 text-warning"></i>Placas QR</Link></li>
                        <li><hr className="dropdown-divider my-1" /></li>
                      </>
                    )}

                    {isAdmin ? (
                      <>
                        <li><h6 className="dropdown-header text-uppercase text-primary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>Clínica & Mostrador</h6></li>
                        <li><Link className="dropdown-item py-1" to="/staff/hospitalizacion"><i className="bi bi-hospital me-2 text-danger"></i>Hospitalización UCI</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/pos"><i className="bi bi-shop me-2 text-success"></i>Punto de Venta (POS)</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/agenda"><i className="bi bi-calendar-week me-2 text-primary"></i>Agenda & Citas</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/recordatorios"><i className="bi bi-bell me-2 text-warning"></i>Recordatorios & Estética</Link></li>
                        
                        <li><hr className="dropdown-divider my-1" /></li>
                        <li><h6 className="dropdown-header text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>Gestión & Control</h6></li>
                        <li><Link className="dropdown-item py-1" to="/admin/dashboard"><i className="bi bi-bar-chart-line me-2 text-primary"></i>Dashboard & KPIs</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/staff"><i className="bi bi-people me-2 text-info"></i>Personal Médico</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/controlados"><i className="bi bi-shield-check me-2 text-warning"></i>Libro SENASICA</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/inventario"><i className="bi bi-boxes me-2 text-success"></i>Inventario FEFO</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/reportes"><i className="bi bi-file-earmark-bar-graph me-2 text-secondary"></i>Reportes Financieros</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/cms"><i className="bi bi-palette me-2 text-info"></i>Gestor CMS & Marca</Link></li>
                        <li><hr className="dropdown-divider my-1" /></li>
                      </>
                    ) : isStaff && (
                      <>
                        <li><h6 className="dropdown-header text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Panel Clínico</h6></li>
                        <li><Link className="dropdown-item py-1" to="/staff/agenda"><i className="bi bi-calendar-week me-2 text-primary"></i>Agenda Médica</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/consultas"><i className="bi bi-clipboard2-pulse me-2 text-info"></i>Consultas Clínicas</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/hospitalizacion"><i className="bi bi-hospital me-2 text-danger"></i>Hospitalización UCI</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/pos"><i className="bi bi-shop me-2 text-success"></i>Punto de Venta (POS)</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/estetica"><i className="bi bi-scissors me-2 text-primary"></i>Estética & Grooming</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/recordatorios"><i className="bi bi-bell me-2 text-warning"></i>Recordatorios & Post-Op</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/controlados"><i className="bi bi-shield-check me-2 text-secondary"></i>Medicamentos Controlados</Link></li>
                        <li><hr className="dropdown-divider my-1" /></li>
                      </>
                    )}

                    {/* Opción de Accesibilidad: Alto Contraste */}
                    <li>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center justify-content-between py-1 text-secondary"
                        onClick={toggleHighContrast}
                      >
                        <span className="d-flex align-items-center gap-2 small">
                          <i className="bi bi-circle-half"></i> Alto Contraste
                        </span>
                        <span className={`badge rounded-pill ${isHighContrast ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '9px' }}>
                          {isHighContrast ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </li>

                    <li><hr className="dropdown-divider my-1" /></li>

                    <li>
                      <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-1" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className={`btn ${isDark ? 'btn-outline-light' : 'btn-outline-primary'} btn-sm rounded-pill px-3 py-1 fw-semibold`}>
                  <i className="bi bi-person me-1"></i> Ingresar
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Cajón lateral del Carrito */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

