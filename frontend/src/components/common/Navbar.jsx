import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CartDrawer } from './CartDrawer';
import { BrandLogo } from './BrandLogo';

export function Navbar() {
  const { user, isAuthenticated, isClient, isStaff, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, isDark, isApple, isHighContrast, toggleHighContrast, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
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
                <Link className={`nav-link ${isActive('/')}`} to="/">{t('nav.home', 'Inicio')}</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/servicios')}`} to="/servicios">{t('nav.services', 'Servicios')}</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/tienda')}`} to="/tienda">{t('nav.store', 'Farmacia & Tienda')}</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/blog')}`} to="/blog">{t('nav.blog', 'Consejos & Blog')}</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/qr')}`} to="/qr">
                  {t('nav.qrTags', 'Placas QR')}
                </Link>
              </li>
            </ul>

            {/* Acciones de Cabecera: Cita (solo clientes/público), Carrito, Tema, Idioma y Cuenta */}
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              {/* Botón Agendar Cita (Solo visible para visitantes y clientes) */}
              {(!isAuthenticated || isClient) && (
                <Link to="/citas" className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-semibold d-none d-sm-inline-flex align-items-center gap-1 shadow-sm">
                  <i className="bi bi-calendar-check"></i>
                  <span>{t('nav.bookAppointment', 'Agendar Cita')}</span>
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

              {/* Selector de Temas Visuales: Apple Design (Default), Neumórfico y Accesibilidad */}
              <div className="dropdown">
                <button
                  type="button"
                  className="btn navbar-action-btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5"
                  id="themeSelectorDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Cambiar tema visual (Apple Design por defecto, Neumórfico, Quirófano)"
                  aria-label="Selector de temas visuales"
                  style={{ minHeight: '36px' }}
                >
                  <i className={`bi ${isApple ? 'bi-apple text-primary' : isDark ? 'bi-moon-stars-fill text-info' : 'bi-sun-fill text-warning'}`}></i>
                  <span className="small fw-semibold d-none d-md-inline" style={{ fontSize: '11px', letterSpacing: '-0.01em' }}>
                    {theme === 'apple' ? 'Apple Claro' : theme === 'apple-dark' ? 'Apple Oscuro' : theme === 'dark' ? 'Neumórfico Oscuro' : 'Neumórfico Claro'}
                  </span>
                  <i className="bi bi-chevron-down opacity-50 ms-0.5" style={{ fontSize: '9px' }}></i>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end apple-dropdown py-2 shadow-lg border-0"
                  aria-labelledby="themeSelectorDropdown"
                  style={{ minWidth: '235px' }}
                >
                  <li className="dropdown-header text-uppercase fw-bold pb-1 text-primary d-flex align-items-center gap-1.5" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                    <i className="bi bi-apple"></i> Apple Design (HIG)
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${theme === 'apple' ? 'active fw-semibold' : ''}`}
                      onClick={() => setTheme('apple')}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-sun text-warning"></i>
                        <span>Apple Claro</span>
                        <span className="badge bg-primary-subtle text-primary rounded-pill px-1.5 py-0.5" style={{ fontSize: '8.5px' }}>Default</span>
                      </span>
                      {theme === 'apple' && <i className="bi bi-check2 fw-bold text-primary"></i>}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${theme === 'apple-dark' ? 'active fw-semibold' : ''}`}
                      onClick={() => setTheme('apple-dark')}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-moon-stars text-info"></i>
                        <span>Apple Oscuro</span>
                      </span>
                      {theme === 'apple-dark' && <i className="bi bi-check2 fw-bold text-primary"></i>}
                    </button>
                  </li>

                  <li><hr className="dropdown-divider my-1.5 opacity-50" /></li>

                  <li className="dropdown-header text-uppercase fw-bold pb-1 text-secondary d-flex align-items-center gap-1.5" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                    <i className="bi bi-palette"></i> Temas Clásicos
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${theme === 'light' ? 'active fw-semibold' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-brightness-high text-warning"></i>
                        <span>Neumórfico Claro</span>
                      </span>
                      {theme === 'light' && <i className="bi bi-check2 fw-bold text-primary"></i>}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${theme === 'dark' ? 'active fw-semibold' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-moon-fill text-primary"></i>
                        <span>Neumórfico Oscuro</span>
                      </span>
                      {theme === 'dark' && <i className="bi bi-check2 fw-bold text-primary"></i>}
                    </button>
                  </li>

                  <li><hr className="dropdown-divider my-1.5 opacity-50" /></li>

                  <li className="dropdown-header text-uppercase fw-bold pb-1 text-secondary d-flex align-items-center gap-1.5" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                    <i className="bi bi-universal-access"></i> Accesibilidad
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${isHighContrast ? 'active fw-semibold' : ''}`}
                      onClick={toggleHighContrast}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-eye-fill text-success"></i>
                        <span>Modo Alto Contraste</span>
                      </span>
                      {isHighContrast && <i className="bi bi-check2 fw-bold text-success"></i>}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Selector de Idioma (i18n: ES / EN) */}
              <div className="dropdown">
                <button
                  type="button"
                  className="btn navbar-action-btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5"
                  id="langSelectorDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title={t('nav.selectLanguage', 'Seleccionar idioma / Language')}
                  aria-label={t('nav.selectLanguage', 'Idioma')}
                  style={{ minHeight: '36px' }}
                >
                  <i className="bi bi-translate text-primary"></i>
                  <span className="small fw-bold" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                    {lang.toUpperCase()}
                  </span>
                  <i className="bi bi-chevron-down opacity-50 ms-0.5" style={{ fontSize: '9px' }}></i>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end apple-dropdown py-1.5 shadow-lg border-0"
                  aria-labelledby="langSelectorDropdown"
                  style={{ minWidth: '150px' }}
                >
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${lang === 'es' ? 'active fw-semibold' : ''}`}
                      onClick={() => setLang('es')}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <span>🇲🇽</span>
                        <span>Español</span>
                      </span>
                      {lang === 'es' && <i className="bi bi-check2 fw-bold text-primary"></i>}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center justify-content-between py-1.5 px-3 ${lang === 'en' ? 'active fw-semibold' : ''}`}
                      onClick={() => setLang('en')}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <span>🇺🇸</span>
                        <span>English</span>
                      </span>
                      {lang === 'en' && <i className="bi bi-check2 fw-bold text-primary"></i>}
                    </button>
                  </li>
                </ul>
              </div>

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
                    <span className="small fw-semibold">{user?.nombre?.split(' ')[0] || t('nav.myPortal', 'Mi Cuenta')}</span>
                    <span className="navbar-user-badge badge rounded-pill small" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {user?.rol}
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ minWidth: '260px' }}>
                    {isClient && (
                      <>
                        <li><h6 className="dropdown-header text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>{t('nav.portalPatient', 'Portal del Paciente')}</h6></li>
                        <li><Link className="dropdown-item py-1" to="/portal"><i className="bi bi-speedometer2 me-2 text-primary"></i>{t('nav.myPortal', 'Mi Portal')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/portal/mascotas"><i className="bi bi-heart me-2 text-danger"></i>{t('nav.myPets', 'Mis Mascotas')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/portal/citas"><i className="bi bi-calendar2-check me-2 text-success"></i>{t('nav.myAppointments', 'Mis Citas')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/qr"><i className="bi bi-qr-code me-2 text-warning"></i>{t('nav.qrTags', 'Placas QR')}</Link></li>
                        <li><hr className="dropdown-divider my-1" /></li>
                      </>
                    )}

                    {isAdmin ? (
                      <>
                        <li><h6 className="dropdown-header text-uppercase text-primary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>{t('nav.clinicStaff', 'Clínica & Mostrador')}</h6></li>
                        <li><Link className="dropdown-item py-1" to="/staff/hospitalizacion"><i className="bi bi-hospital me-2 text-danger"></i>{t('nav.hospitalization', 'Hospitalización UCI')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/pos"><i className="bi bi-shop me-2 text-success"></i>{t('nav.pos', 'Punto de Venta (POS)')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/agenda"><i className="bi bi-calendar-week me-2 text-primary"></i>{t('nav.agenda', 'Agenda & Citas')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/recordatorios"><i className="bi bi-bell me-2 text-warning"></i>{t('nav.reminders', 'Recordatorios & Estética')}</Link></li>
                        
                        <li><hr className="dropdown-divider my-1" /></li>
                        <li><h6 className="dropdown-header text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>{t('nav.management', 'Gestión & Control')}</h6></li>
                        <li><Link className="dropdown-item py-1" to="/admin/dashboard"><i className="bi bi-bar-chart-line me-2 text-primary"></i>{t('nav.dashboard', 'Dashboard & KPIs')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/staff"><i className="bi bi-people me-2 text-info"></i>{t('nav.medicalStaff', 'Personal Médico')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/controlados"><i className="bi bi-shield-check me-2 text-warning"></i>Libro SENASICA</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/inventario"><i className="bi bi-boxes me-2 text-success"></i>{t('nav.inventory', 'Inventario FEFO')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/reportes"><i className="bi bi-file-earmark-bar-graph me-2 text-secondary"></i>{t('nav.reports', 'Reportes Financieros')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/admin/cms"><i className="bi bi-palette me-2 text-info"></i>{t('nav.cms', 'Gestor CMS & Marca')}</Link></li>
                        <li><hr className="dropdown-divider my-1" /></li>
                      </>
                    ) : isStaff && (
                      <>
                        <li><h6 className="dropdown-header text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>{t('nav.clinicStaff', 'Panel Clínico')}</h6></li>
                        <li><Link className="dropdown-item py-1" to="/staff/agenda"><i className="bi bi-calendar-week me-2 text-primary"></i>{t('nav.agenda', 'Agenda Médica')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/consultas"><i className="bi bi-clipboard2-pulse me-2 text-info"></i>Consultas Clínicas</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/hospitalizacion"><i className="bi bi-hospital me-2 text-danger"></i>{t('nav.hospitalization', 'Hospitalización UCI')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/pos"><i className="bi bi-shop me-2 text-success"></i>{t('nav.pos', 'Punto de Venta (POS)')}</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/estetica"><i className="bi bi-scissors me-2 text-primary"></i>Estética & Grooming</Link></li>
                        <li><Link className="dropdown-item py-1" to="/staff/recordatorios"><i className="bi bi-bell me-2 text-warning"></i>{t('nav.reminders', 'Recordatorios & Post-Op')}</Link></li>
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
                        <i className="bi bi-box-arrow-right"></i> {t('nav.logout', 'Cerrar Sesión')}
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className={`btn ${isDark ? 'btn-outline-light' : 'btn-outline-primary'} btn-sm rounded-pill px-3 py-1 fw-semibold`}>
                  <i className="bi bi-person me-1"></i> {t('nav.login', 'Ingresar')}
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

