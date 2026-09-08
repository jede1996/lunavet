import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePageSeo } from '../../hooks/usePageSeo';

export function ServicesPage() {
  usePageSeo(
    'Servicios Veterinarios Especializados',
    'Conoce nuestros servicios veterinarios en Acapulco: consultas, campañas de esterilización, baños garrapaticidas, vacunación, desparasitación y cirugías.'
  );
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackServices = [
    {
      id: 1,
      nombre: 'Campaña de Esterilización Canina y Felina',
      descripcion: 'Cirugía segura de esterilización (Ovariohisterectomía / Orquiectomía) preventiva, previene tumores mamarios, piometras y sobrepoblación.',
      duracion_minutos: 60,
      precio: 650.00
    },
    {
      id: 2,
      nombre: 'Baño Garrapaticida & Antipulgas Medicado',
      descripcion: 'Tratamiento dérmico especializado para erradicar infestaciones severas de garrapatas y pulgas, adaptado al clima cálido de Acapulco.',
      duracion_minutos: 45,
      precio: 250.00
    },
    {
      id: 3,
      nombre: 'Consulta Médica Veterinaria General',
      descripcion: 'Evaluación física completa, toma de constantes fisiológicas, diagnóstico certero y prescripción médica formal.',
      duracion_minutos: 30,
      precio: 250.00
    },
    {
      id: 4,
      nombre: 'Vacunación Canina Completa (Séxtuple + Rabia)',
      descripcion: 'Inmunización de alta calidad contra parvovirus, moquillo, hepatitis, leptospira y rabia, incluye carnet oficial.',
      duracion_minutos: 20,
      precio: 350.00
    },
    {
      id: 5,
      nombre: 'Vacunación Felina Integral (Triple Felina + Rabia)',
      descripcion: 'Protección integral contra rinotraqueítis, calicivirus, panleucopenia y rabia para michis de cualquier edad.',
      duracion_minutos: 20,
      precio: 350.00
    },
    {
      id: 6,
      nombre: 'Estética Canina Integral & Corte de Raza',
      descripcion: 'Baño con agua tibia, shampoo hidratante, secado, corte según estándar de raza o corte higiénico, corte de uñas y limpieza de oídos.',
      duracion_minutos: 60,
      precio: 300.00
    },
    {
      id: 7,
      nombre: 'Desparasitación Interna y Externa por Peso',
      descripcion: 'Dosificación exacta de antiparasitarios de amplio espectro contra nematodos, cestodos y ectoparásitos.',
      duracion_minutos: 15,
      precio: 150.00
    },
    {
      id: 8,
      nombre: 'Cirugía de Tejidos Blandos y Urgencias',
      descripcion: 'Intervenciones quirúrgicas generales, cesáreas, retiro de neoplasias y sutura de heridas traumáticas con monitoreo postoperatorio.',
      duracion_minutos: 90,
      precio: 1200.00
    }
  ];

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await api.get('/appointments/services');
        if (res.success && res.data?.length > 0) {
          setServices(res.data);
        } else {
          setServices(fallbackServices);
        }
      } catch {
        setServices(fallbackServices);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  return (
    <div className="py-5 bg-light min-vh-100">
      <div className="container">
        <div className="text-center mb-5">
          <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-2">
            Catálogo Clínico Luna-Vet
          </span>
          <h1 className="fw-bold text-dark">Servicios Veterinarios Especializados</h1>
          <p className="text-muted">
            Tarifas accesibles y transparentes para la comunidad de El Coloso y Acapulco.
          </p>
        </div>

        {/* Alerta de Campañas Especiales */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
          <div className="row align-items-center g-3">
            <div className="col-md-8">
              <h5 className="fw-bold text-dark mb-1">
                <i className="bi bi-megaphone-fill text-primary me-2"></i>
                Campañas Continuas de Esterilización & Baños Garrapaticidas
              </h5>
              <p className="text-secondary small mb-0">
                Pregunta por fechas de campaña y promociones en paquetes de vacunación para camadas y cachorros.
              </p>
            </div>
            <div className="col-md-4 text-md-end">
              <a
                href="https://wa.me/527442130868?text=Hola%20Luna-Vet,%20deseo%20informes%20sobre%20la%20campaña%20de%20esterilización"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success rounded-pill px-4 shadow-sm"
              >
                <i className="bi bi-whatsapp me-1"></i> Consultar Campaña
              </a>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Consultando catálogo de servicios..." />
        ) : (
          <div className="row g-4">
            {services.map(s => (
              <div key={s.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 rounded-4 p-4 d-flex flex-column bg-white">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="badge bg-primary-subtle text-primary p-2 rounded-3">
                      <i className="bi bi-heart-pulse fs-5"></i>
                    </div>
                    <span className="fs-5 fw-bold text-primary">${parseFloat(s.precio).toFixed(2)}</span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{s.nombre}</h5>
                  <p className="text-muted small flex-grow-1">{s.descripcion}</p>

                  <div className="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                    <span className="text-secondary small">
                      <i className="bi bi-clock me-1"></i> {s.duracion_minutos || 30} mins aprox.
                    </span>
                    <Link to={`/citas?servicio=${s.id}`} className="btn btn-sm btn-primary rounded-pill px-3">
                      Agendar <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
