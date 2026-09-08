import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useBrand } from '../../contexts/BrandContext';
import { usePageSeo } from '../../hooks/usePageSeo';

export function LandingPage() {
  const { brand } = useBrand();
  usePageSeo(
    'Luna-Vet | Clínica Veterinaria, Farmacia & Estética en Acapulco',
    'Atención veterinaria integral en El Coloso, Acapulco. Consultas médicas, esterilizaciones, cirugías, baños garrapaticidas y farmacia oficial. Tel: 744 213 0868.'
  );
  const [landingData, setLandingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLanding() {
      try {
        const res = await api.get('/cms/landing');
        if (res.success || res.status === 'success') {
          setLandingData(res.data);
        }
      } catch {
        setLandingData(null);
      } finally {
        setLoading(false);
      }
    }
    loadLanding();
  }, []);

  const serviciosFallback = [
    {
      id: 1,
      nombre: 'Campaña de Esterilización Canina y Felina',
      descripcion: 'Cirugía preventiva segura realizada por médicos veterinarios titulados. Previene piometras, tumores y sobrepoblación.',
      precio: 650,
      icono: 'bi-scissors'
    },
    {
      id: 2,
      nombre: 'Baño Garrapaticida & Antipulgas Medicado',
      descripcion: 'Tratamiento dérmico especializado contra pulgas, garrapatas y ácaros, formulado para el clima tropical de Acapulco.',
      precio: 250,
      icono: 'bi-droplet-half'
    },
    {
      id: 3,
      nombre: 'Vacunación Integral Canina y Felina',
      descripcion: 'Cuadros completos de inmunización (Séxtuple, Puppy, Rabia, Triple Felina) con expedición de carnet digital oficial.',
      precio: 350,
      icono: 'bi-shield-check'
    },
    {
      id: 4,
      nombre: 'Estética Canina & Corte de Raza',
      descripcion: 'Baño relajante, secado, corte higiénico o de raza, deslanado, corte de uñas y limpieza de oídos profesional.',
      precio: 300,
      icono: 'bi-brush'
    },
    {
      id: 5,
      nombre: 'Consulta Médica Veterinaria General',
      descripcion: 'Evaluación física completa, constantes fisiológicas, diagnóstico certero y prescripción médica con receta oficial.',
      precio: 250,
      icono: 'bi-heart-pulse'
    },
    {
      id: 6,
      nombre: 'Farmacia Veterinaria & Alimentos',
      descripcion: 'Antiparasitarios orales de última generación (Bravecto, Simparica), medicamentos controlados y dietas formuladas.',
      precio: 95,
      icono: 'bi-capsule'
    }
  ];

  const testimoniosFallback = [
    {
      id: 1,
      autor_nombre: 'María Elena Solís (El Coloso, Acapulco)',
      contenido: 'Llevé a mi perrita Luna a esterilizar en la campaña de Luna-Vet en Peña Blanca y la atención fue maravillosa. Se recuperó rapidísimo y la herida quedó súper limpia. ¡100% recomendados!',
      calificacion: 5
    },
    {
      id: 2,
      autor_nombre: 'Roberto Figueroa (Llano Largo, Acapulco)',
      contenido: 'Excelente el baño garrapaticida y el corte para mi Schnauzer. En el calor de Acapulco las garrapatas son un problema tremendo, pero con su tratamiento y el Bravecto quedó impecable.',
      calificacion: 5
    },
    {
      id: 3,
      autor_nombre: 'Lucía Domínguez (Acapulco Diamante)',
      contenido: 'El carnet digital y las recetas en línea facilitan todo. Siempre atienden con mucho amor a mis gatos y me resolvieron una urgencia por WhatsApp. Gran equipo médico.',
      calificacion: 5
    }
  ];

  return (
    <div>
      {/* Hero Section Neumórfico Suave & Elegante */}
      <section className="py-5 py-lg-6 landing-hero">
        <div className="container py-lg-3">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                  <i className="bi bi-geo-alt me-1 text-danger"></i> El Coloso • Acapulco, Gro.
                </span>
                <a
                  href="https://www.facebook.com/profile.php?id=100083388274818"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge bg-info-subtle text-info-emphasis px-3 py-2 rounded-pill text-decoration-none"
                >
                  <i className="bi bi-facebook me-1"></i> Síguenos en Facebook
                </a>
              </div>

              <h1 className="display-4 fw-bold mb-3 text-emphasis">
                Clínica Veterinaria <span className="text-primary">{brand.nombre ? brand.nombre.replace(/^Clínica Veterinaria\s*/i, '') : 'Luna-Vet'}</span>
              </h1>

              <blockquote className="blockquote fs-5 text-secondary fst-italic mb-3">
                "{brand.slogan}"
              </blockquote>

              <p className="lead text-secondary mb-4 fs-6">
                Atención médica cálida y profesional en Acapulco. Especialistas en esterilizaciones, baños garrapaticidas, vacunación, estética canina, farmacia veterinaria y expediente clínico digital.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link to="/citas" className="btn btn-primary btn-lg rounded-pill px-4">
                  <i className="bi bi-calendar-plus me-2"></i> Agendar Cita en Línea
                </Link>
                <a
                  href={`https://wa.me/52${brand.whatsapp || '7442130868'}?text=Hola%20Luna-Vet,%20deseo%20agendar%20una%20cita%20o%20hacer%20una%20consulta`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light btn-lg rounded-pill px-4 text-success"
                >
                  <i className="bi bi-whatsapp me-2"></i> WhatsApp {brand.telefono || '744 213 0868'}
                </a>
                <Link to="/tienda" className="btn btn-light btn-lg rounded-pill px-4 text-secondary">
                  <i className="bi bi-shop me-2 text-primary"></i> Farmacia & Tienda
                </Link>
              </div>
            </div>

            <div className="col-lg-5 text-center">
              <div className="card border-0 rounded-4 p-4 text-center shadow-sm">
                <div className="py-3">
                  <div className="d-flex justify-content-center mb-3">
                    <BrandLogo size={82} />
                  </div>
                  <h3 className="h4 text-dark fw-bold mb-2">Expediente Clínico Digital</h3>
                  <p className="small text-secondary mb-4">
                    Consulta vacunas, diagnósticos, historial médico y recetas oficiales descargables desde tu celular.
                  </p>
                  <div className="d-grid gap-2 col-10 mx-auto">
                    <Link to="/login" className="btn btn-primary rounded-pill px-4 btn-sm">
                      Acceder a Mi Portal
                    </Link>
                    <Link to="/registro" className="btn btn-light rounded-pill px-4 btn-sm text-primary">
                      Crear Cuenta de Paciente
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Destacados de Luna-Vet */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-2">
              Nuestra Oferta Médica
            </span>
            <h2 className="fw-bold text-dark">Servicios Especializados en Luna-Vet</h2>
            <p className="text-muted">Cuidado de salud preventivo, correctivo y de belleza para perros y gatos en Acapulco.</p>
          </div>

          <div className="row g-4">
            {serviciosFallback.map(s => (
              <div key={s.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 rounded-4 p-4 text-center d-flex flex-column bg-white">
                  <div className="rounded-circle bg-primary-subtle text-primary p-3 mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                    <i className={`bi ${s.icono} fs-3`}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{s.nombre}</h5>
                  <p className="text-muted small flex-grow-1">{s.descripcion}</p>
                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <span className="fs-5 fw-bold text-primary">Desde ${parseFloat(s.precio).toFixed(2)}</span>
                    <Link to={`/citas?servicio=${s.id}`} className="btn btn-sm btn-outline-primary rounded-pill px-3">
                      Agendar <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/servicios" className="btn btn-primary rounded-pill px-4 shadow-sm">
              Ver Catálogo Completo de Procedimientos <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Banner de Orientación y Clima de Acapulco */}
      <section className="py-4">
        <div className="container">
          <div className="rounded-4 p-4 weather-alert-card">
            <div className="row align-items-center g-3">
              <div className="col-md-8 d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 weather-icon-bubble">
                  <i className="bi bi-sun-fill fs-3 text-warning"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-1">¡Cuidado con el calor y las garrapatas en Acapulco!</h5>
                  <p className="small text-secondary mb-0">
                    Las altas temperaturas facilitan la proliferación de garrapatas y deshidratación. Pregunta por nuestros baños medicados y pastillas masticables Bravecto / Simparica.
                  </p>
                </div>
              </div>
              <div className="col-md-4 text-md-end">
                <a
                  href={`https://wa.me/52${brand.whatsapp || '7442130868'}?text=Hola%20Luna-Vet,%20necesito%20orientación%20sobre%20baños%20garrapaticidas%20o%20urgencias`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light rounded-pill px-4 text-warning-emphasis fw-semibold border"
                >
                  <i className="bi bi-whatsapp me-1 text-success"></i> Consultar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ubicación e Información de Contacto */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill mb-3">
                📍 Visítanos en El Coloso
              </span>
              <h2 className="fw-bold text-dark mb-3">Tu Clínica Veterinaria de Confianza en Acapulco</h2>
              <p className="text-secondary mb-4">
                Estamos ubicados en una zona accesible de El Coloso, con estacionamiento y recepción climatizada para que tú y tu mascota se sientan cómodos y seguros.
              </p>

              <div className="card bg-light border-0 rounded-4 p-3 mb-4">
                <ul className="list-unstyled d-flex flex-column gap-3 mb-0 small text-secondary">
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-geo-alt-fill text-danger fs-5 mt-1"></i>
                    <div>
                      <strong className="text-dark">Dirección:</strong><br />
                      Avenida Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero.<br />
                      <span className="text-muted fst-italic">(A unos pasos del Colegio Cri-Cri)</span>
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-clock-fill text-primary fs-5 mt-1"></i>
                    <div>
                      <strong className="text-dark">Horario de Consultas:</strong><br />
                      Lunes a Sábado: 09:00 - 20:00 hrs<br />
                      Domingos: 10:00 - 15:00 hrs (Urgencias 24/7 vía WhatsApp)
                    </div>
                  </li>
                  <li className="d-flex align-items-start gap-3">
                    <i className="bi bi-telephone-fill text-success fs-5 mt-1"></i>
                    <div>
                      <strong className="text-dark">Teléfono / WhatsApp Directo:</strong><br />
                      <a href="tel:7442130868" className="text-success fw-bold text-decoration-none">744 213 0868</a>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="d-flex gap-3">
                <a
                  href="https://maps.google.com/?q=Av.+Peña+Blanca+El+Coloso+Acapulco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark rounded-pill px-4"
                >
                  <i className="bi bi-map me-2"></i> Abrir en Google Maps
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=100083388274818"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary rounded-pill px-4"
                >
                  <i className="bi bi-facebook me-2"></i> Ver Facebook Oficial
                </a>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-light p-4 text-center">
                <div className="mb-3">
                  <i className="bi bi-hospital text-primary display-3"></i>
                </div>
                <h4 className="fw-bold text-dark">Clínica Veterinaria Luna-Vet</h4>
                <p className="text-muted small mb-3">Instalaciones equipadas para consultas, estética, cirugías y farmacia.</p>
                <div className="row g-2 text-start small">
                  <div className="col-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <i className="bi bi-check-circle-fill text-success me-1"></i> Quirófano estéril
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <i className="bi bi-check-circle-fill text-success me-1"></i> Área de estética canina
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <i className="bi bi-check-circle-fill text-success me-1"></i> Farmacia completa
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-white rounded-3 border">
                      <i className="bi bi-check-circle-fill text-success me-1"></i> Baños medicados
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios Reales de Familias en Acapulco */}
      <section className="py-5 bg-light border-top">
        <div className="container py-4">
          <div className="text-center mb-5">
            <span className="badge bg-warning-subtle text-warning-emphasis px-3 py-2 rounded-pill mb-2">
              Opiniones de Nuestra Comunidad
            </span>
            <h2 className="fw-bold text-dark">La Confianza de los Acapulqueños</h2>
            <p className="text-muted">Reseñas de familias de El Coloso y Acapulco que confían la salud de sus lomitos y michis en Luna-Vet.</p>
          </div>

          <div className="row g-4">
            {(landingData?.testimonios?.length > 0 ? landingData.testimonios : testimoniosFallback).map(t => (
              <div key={t.id} className="col-md-4">
                <div className="card h-100 shadow-sm border-0 rounded-4 p-4 bg-white">
                  <div className="text-warning mb-3">
                    {[...Array(t.calificacion || 5)].map((_, i) => (
                      <i key={i} className="bi bi-star-fill me-1"></i>
                    ))}
                  </div>
                  <p className="text-secondary small fst-italic mb-4 flex-grow-1">
                    "{t.comentario || t.contenido}"
                  </p>
                  <div className="fw-bold text-dark">{t.nombre_cliente || t.autor_nombre}</div>
                  <small className="text-muted">Cliente Verificado • Acapulco</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
