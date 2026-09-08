import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { useBrand } from '../../contexts/BrandContext';
import { useTheme } from '../../contexts/ThemeContext';

export function Footer() {
  const { brand } = useBrand();
  const { isDark } = useTheme();

  return (
    <footer className="pt-5 pb-3 mt-auto border-top" style={{ backgroundColor: 'var(--navbar-bg)', borderColor: 'var(--navbar-border)', color: 'var(--bs-body-color)' }}>
      <div className="container-fluid px-3 px-lg-4 px-xl-5">
        <div className="row g-4 mb-4">
          {/* Marca e Información Oficial */}
          <div className="col-12 col-lg-4">
            <div className="mb-3">
              <BrandLogo size={32} showText={true} textClassName={`fs-5 fw-bold ${isDark ? 'text-white' : 'text-dark'}`} />
            </div>
            <p className="text-secondary small mb-3 pe-lg-4" style={{ lineHeight: '1.6' }}>
              Atención médica integral con calidez humana, rigor diagnóstico y bienestar animal en Acapulco de Juárez.
            </p>
            <div className="small text-secondary mb-3 d-flex align-items-start gap-2">
              <i className="bi bi-geo-alt-fill text-danger flex-shrink-0 mt-1"></i>
              <span>{brand.direccion || 'Av. Peña Blanca, Etapa 38, El Coloso, Acapulco de Juárez, Gro.'}</span>
            </div>
            <div className="d-flex gap-2">
              <a
                href={brand.facebookUrl || "https://www.facebook.com/profile.php?id=100083388274818"}
                target="_blank"
                rel="noopener noreferrer"
                className="btn navbar-action-btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px' }}
                title="Facebook Oficial"
              >
                <i className="bi bi-facebook fs-6"></i>
              </a>
              <a
                href={`https://wa.me/52${brand.whatsapp || '7442130868'}?text=Hola%20Luna-Vet,%20deseo%20agendar%20una%20cita%20o%20consultar%20información`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn navbar-action-btn btn-sm rounded-circle d-flex align-items-center justify-content-center text-success"
                style={{ width: '34px', height: '34px' }}
                title="WhatsApp Directo"
              >
                <i className="bi bi-whatsapp fs-6"></i>
              </a>
              <a
                href="https://maps.google.com/?q=Av.+Peña+Blanca+El+Coloso+Acapulco"
                target="_blank"
                rel="noopener noreferrer"
                className="btn navbar-action-btn btn-sm rounded-circle d-flex align-items-center justify-content-center text-info"
                style={{ width: '34px', height: '34px' }}
                title="Ubicación en Google Maps"
              >
                <i className="bi bi-map fs-6"></i>
              </a>
            </div>
          </div>

          {/* Enlaces de Navegación */}
          <div className="col-6 col-sm-4 col-lg-2">
            <h6 className="text-uppercase fw-bold mb-3 small" style={{ letterSpacing: '0.06em', color: 'var(--bs-emphasis-color)' }}>Servicios</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li><Link to="/servicios" className="text-secondary text-decoration-none hover-primary">Consultas Clínicas</Link></li>
              <li><Link to="/tienda" className="text-secondary text-decoration-none hover-primary">Farmacia & Tienda</Link></li>
              <li><Link to="/servicios" className="text-secondary text-decoration-none hover-primary">Estética & Grooming</Link></li>
              <li><Link to="/qr" className="text-secondary text-decoration-none hover-primary">Placas QR Identificación</Link></li>
              <li><Link to="/blog" className="text-secondary text-decoration-none hover-primary">Consejos de Salud</Link></li>
            </ul>
          </div>

          {/* Horarios de Atención */}
          <div className="col-6 col-sm-4 col-lg-3">
            <h6 className="text-uppercase fw-bold mb-3 small" style={{ letterSpacing: '0.06em', color: 'var(--bs-emphasis-color)' }}>Horarios & Citas</h6>
            <div className="small text-secondary d-flex flex-column gap-1 mb-2">
              <div className="d-flex justify-content-between">
                <span>Lun – Sáb:</span>
                <span className="fw-semibold text-body">09:00 – 20:00</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Domingos:</span>
                <span className="fw-semibold text-body">10:00 – 15:00</span>
              </div>
            </div>
            <div className="p-2 rounded-3 border bg-body-tertiary mt-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-telephone-fill text-primary"></i>
                <a href="tel:7442130868" className="text-decoration-none fw-bold small text-body">744 213 0868</a>
              </div>
              <small className="text-secondary d-block mt-1" style={{ fontSize: '11px' }}>Urgencias 24/7 vía WhatsApp</small>
            </div>
          </div>

          {/* Legalidad y Privacidad */}
          <div className="col-12 col-sm-4 col-lg-3">
            <h6 className="text-uppercase fw-bold mb-3 small" style={{ letterSpacing: '0.06em', color: 'var(--bs-emphasis-color)' }}>Legal & Privacidad</h6>
            <p className="text-secondary small mb-3" style={{ fontSize: '12px', lineHeight: '1.5' }}>
              Plataforma protegida con cifrado en reposo AES-256-GCM y cumplimiento normativo LFPDPPP y NOM-012-ZOO.
            </p>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/aviso-privacidad" className="text-secondary text-decoration-none d-flex align-items-center gap-1 hover-primary">
                  <i className="bi bi-shield-check text-primary"></i>
                  <span>Aviso de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link to="/terminos-condiciones" className="text-secondary text-decoration-none d-flex align-items-center gap-1 hover-primary">
                  <i className="bi bi-file-earmark-medical text-info"></i>
                  <span>Términos y Condiciones</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="border-top pt-3 d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary" style={{ borderColor: 'var(--bs-border-color)' }}>
          <div style={{ fontSize: '12px' }}>
            &copy; {new Date().getFullYear()} Clínica Veterinaria Luna-Vet • Acapulco de Juárez, Gro.
          </div>
          <div className="mt-2 mt-md-0 d-flex align-items-center gap-2" style={{ fontSize: '11px' }}>
            <span className="badge bg-body-tertiary text-secondary border">v4.0 Producción</span>
            <span>Atención Médica Veterinaria Ética</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
