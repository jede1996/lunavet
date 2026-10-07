import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

export function ClientDashboard() {
  const { user } = useAuth();
  const { t, isEnglish } = useLanguage();
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [petsRes, aptRes] = await Promise.all([
          api.get('/pets'),
          api.get('/appointments')
        ]);
        if (petsRes.success) setPets(Array.isArray(petsRes.data) ? petsRes.data : []);
        if (aptRes.success) setAppointments(Array.isArray(aptRes.data) ? aptRes.data : []);
      } catch {
        setPets([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message={t('common.loading', 'Cargando tu portal de cliente...')} />;
  }

  const upcomingApts = Array.isArray(appointments)
    ? appointments.filter(a => ['pendiente', 'confirmada'].includes(a?.estado))
    : [];

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container">
        {/* Bienvenida */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-primary-subtle text-primary mb-2">
                {isEnglish ? 'Pet Parent Portal' : 'Portal del Dueño'}
              </span>
              <h2 className="fw-bold text-dark mb-1">
                {t('portal.welcome', { name: user?.nombre || 'Tutor' }, `¡Hola, ${user?.nombre}!`)}
              </h2>
              <p className="text-muted small mb-0">
                {t('portal.welcomeLead', 'Bienvenido al expediente digital de tus mascotas y seguimiento clínico en LunaVet.')}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/citas" className="btn btn-primary rounded-pill px-3 btn-sm">
                <i className="bi bi-calendar-plus me-1"></i> {t('nav.bookAppointment', 'Agendar Cita')}
              </Link>
              <Link to="/tienda" className="btn btn-outline-secondary rounded-pill px-3 btn-sm">
                <i className="bi bi-bag me-1"></i> {isEnglish ? 'Pharmacy' : 'Farmacia'}
              </Link>
            </div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          {/* Tarjeta de Resumen Mascotas */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">{t('portal.registeredPetsCount', 'Mis Mascotas Registradas')}</h6>
                <Link to="/portal/mascotas" className="btn btn-link text-primary p-0 small">{t('portal.seeAll', 'Ver todas')}</Link>
              </div>
              <div className="d-flex align-items-center gap-3 my-auto">
                <div className="rounded-circle bg-primary-subtle text-primary p-3">
                  <i className="bi bi-heart-pulse-fill fs-3"></i>
                </div>
                <div>
                  <h3 className="fw-bold mb-0 text-dark">{pets.length}</h3>
                  <small className="text-muted">{t('portal.activePatients', 'Pacientes activos asociados')}</small>
                </div>
              </div>
              <div className="mt-3 pt-2 border-top">
                <Link to="/portal/mascotas" className="btn btn-light w-100 rounded-pill btn-sm text-secondary">
                  <i className="bi bi-plus-circle me-1"></i> {t('portal.addNewPetBtn', 'Registrar Nueva Mascota')}
                </Link>
              </div>
            </div>
          </div>

          {/* Próximas Citas */}
          <div className="col-md-6 col-lg-8">
            <div className="card shadow-sm border-0 rounded-4 p-3 h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">{t('portal.upcomingAppointments', 'Próximas Citas Médicas')}</h6>
                <Link to="/portal/citas" className="btn btn-link text-primary p-0 small">{t('portal.seeHistory', 'Ver historial')}</Link>
              </div>

              {upcomingApts.length === 0 ? (
                <div className="text-center py-4 my-auto">
                  <i className="bi bi-calendar-check text-muted fs-2 d-block mb-1"></i>
                  <p className="small text-muted mb-0">{t('portal.noUpcomingAppointments', 'No tienes citas pendientes agendadas.')}</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle small mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha y Hora</th>
                        <th>Mascota</th>
                        <th>Servicio</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingApts.slice(0, 3).map(a => (
                        <tr key={a.id}>
                          <td><strong>{new Date(a.fecha_hora).toLocaleDateString()}</strong> {new Date(a.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{a.mascota_nombre || a.mascota?.nombre || 'Paciente'}</td>
                          <td>{a.servicio_nombre || 'Consulta'}</td>
                          <td>
                            <span className={`badge ${a.estado === 'confirmada' ? 'bg-info' : 'bg-warning text-dark'}`}>
                              {a.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarjetas de Mascotas Rápidas */}
        <h5 className="fw-bold text-dark mb-3">Fichas de Mis Mascotas</h5>
        <div className="row g-4">
          {pets.map(p => (
            <div key={p.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 rounded-4 p-3 bg-white">
                <div className="d-flex gap-3 align-items-center mb-3">
                  <div
                    className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                    style={{ width: '60px', height: '60px', overflow: 'hidden' }}
                  >
                    <i className="bi bi-person-bounding-box fs-3 text-secondary"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">{p.nombre}</h5>
                    <small className="text-muted">{p.especie} • {p.raza || 'Mestizo'}</small>
                  </div>
                </div>

                <div className="bg-light rounded-3 p-2 small mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Sexo:</span>
                    <strong>{p.sexo || 'No especificado'}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Microchip:</span>
                    <span>{p.microchip || 'Sin microchip'}</span>
                  </div>
                </div>

                <div className="mt-auto d-grid">
                  <Link to={`/portal/expediente/${p.id}`} className="btn btn-outline-primary btn-sm rounded-pill">
                    <i className="bi bi-folder2-open me-1"></i> Abrir Expediente Clínico
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
