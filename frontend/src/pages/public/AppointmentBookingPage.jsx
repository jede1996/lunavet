import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePageSeo } from '../../hooks/usePageSeo';

export function AppointmentBookingPage() {
  usePageSeo(
    'Agendar Cita en Línea',
    'Agenda tu consulta médica veterinaria, esterilización, vacunación o estética canina en Clínica Veterinaria Luna-Vet en El Coloso, Acapulco.'
  );
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('servicio');

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Datos del formulario
  const [servicioId, setServicioId] = useState(preselectedService || '');
  const [mascotaId, setMascotaId] = useState('');
  const [mascotaNombre, setMascotaNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('09:00');
  const [esUrgencia, setEsUrgencia] = useState(false);
  const [motivo, setMotivo] = useState('');

  // Disponibilidad y envío
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  useEffect(() => {
    async function loadInitData() {
      try {
        const servRes = await api.get('/appointments/services');
        if (servRes.success) {
          setServices(servRes.data);
          if (!servicioId && servRes.data.length > 0) {
            setServicioId(String(servRes.data[0].id));
          }
        }

        // Si está autenticado como cliente, cargar sus mascotas
        if (isAuthenticated) {
          try {
            const petsRes = await api.get('/pets');
            if (petsRes.success && petsRes.data.length > 0) {
              setUserPets(petsRes.data);
              setMascotaId(String(petsRes.data[0].id));
            }
          } catch {
            setUserPets([]);
          }
        }
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    loadInitData();
  }, [isAuthenticated]);

  // Verificar disponibilidad cada vez que cambia fecha, hora o servicio
  const checkSlotAvailability = async () => {
    if (!fecha || !hora || !servicioId) return;
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    setErrorMsg(null);

    const fechaHora = `${fecha}T${hora}:00`;
    try {
      const res = await api.post('/appointments/check-availability', {
        fechaHora,
        servicioId: parseInt(servicioId, 10)
      });
      if (res.success) {
        setAvailabilityResult(res.data);
      }
    } catch (err) {
      setAvailabilityResult({ disponible: false, mensaje: err.message || 'Horario no disponible' });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthenticated) {
      setErrorMsg('Debes iniciar sesión o registrarte para confirmar y asociar tu cita.');
      return;
    }

    setSubmitting(true);
    const fechaHora = `${fecha}T${hora}:00`;

    try {
      const payload = {
        servicio_id: parseInt(servicioId, 10),
        mascota_id: mascotaId ? parseInt(mascotaId, 10) : null,
        mascota_nombre: mascotaNombre || undefined,
        fecha_hora: fechaHora,
        es_urgencia: esUrgencia,
        motivo: motivo || 'Consulta veterinaria regular'
      };

      const res = await api.post('/appointments', payload);
      if (res.success) {
        setSuccessBooking(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo programar la cita. Revisa el horario.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparando el sistema de agendamiento..." />;
  }

  return (
    <div className="py-5 bg-light min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Pantalla de Éxito al Agendar */}
            {successBooking ? (
              <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
                <div className="rounded-circle bg-success-subtle text-success p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-calendar-check display-5"></i>
                </div>
                <h3 className="fw-bold text-dark mb-2">¡Cita Programada con Éxito!</h3>
                <p className="text-muted mb-4">
                  Hemos reservado tu horario en nuestra clínica. Recibirás recordatorios automáticos previos a tu cita.
                </p>

                <div className="card bg-light border-0 rounded-3 p-3 mb-4 text-start">
                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Folio de Cita:</span>
                      <strong>#{successBooking.id}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Fecha y Hora:</span>
                      <strong>{new Date(successBooking.fecha_hora).toLocaleString()}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Servicio:</span>
                      <strong>{services.find(s => String(s.id) === String(servicioId))?.nombre || 'Consulta'}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Estado:</span>
                      <span className="badge bg-warning text-dark">Pendiente de Confirmación</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <Link to="/portal/citas" className="btn btn-primary rounded-pill px-4">
                    Ver en Mis Citas
                  </Link>
                  <button
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => {
                      setSuccessBooking(null);
                      setMotivo('');
                    }}
                  >
                    Agendar Otra Cita
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario Principal de Agendamiento */
              <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 bg-white">
                <div className="text-center mb-4">
                  <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-2">
                    Citas en Línea • Luna-Vet Acapulco
                  </span>
                  <h1 className="h2 fw-bold text-dark">Agendar Consulta o Servicio</h1>
                  <p className="text-muted small mb-2">
                    📍 Atención en clínica: <strong>Av. Peña Blanca, Etapa 38, El Coloso, Acapulco</strong> (Cerca de Colegio Cri-Cri).
                  </p>
                  <p className="text-muted small">
                    Para dudas urgentes comunícate también vía WhatsApp al{' '}
                    <a href="https://wa.me/527442130868" target="_blank" rel="noopener noreferrer" className="text-success fw-bold text-decoration-none">
                      <i className="bi bi-whatsapp"></i> 744 213 0868
                    </a>.
                  </p>
                </div>

                {errorMsg && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                    <div>{errorMsg}</div>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="alert alert-info py-2 px-3 small d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <i className="bi bi-info-circle me-2"></i>
                      ¿Ya tienes cuenta en LunaVet? Inicia sesión para vincular a tu mascota directamente.
                    </div>
                    <Link to="/login" className="btn btn-primary btn-sm rounded-pill ms-2 text-nowrap">
                      Iniciar Sesión
                    </Link>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit}>
                  {/* Selección de Servicio */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark">Servicio Veterinario</label>
                    <select
                      className="form-select"
                      value={servicioId}
                      onChange={(e) => {
                        setServicioId(e.target.value);
                        setAvailabilityResult(null);
                      }}
                      required
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} — ${parseFloat(s.precio).toFixed(2)} ({s.duracion_minutos || 30} mins)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selección o Entrada de Mascota */}
                  {isAuthenticated && userPets.length > 0 ? (
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Selecciona a tu Mascota</label>
                      <select
                        className="form-select"
                        value={mascotaId}
                        onChange={(e) => setMascotaId(e.target.value)}
                        required
                      >
                        {userPets.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.especie} - {p.raza || 'Mestizo'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Nombre de la Mascota</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Lucas, Luna, Rocky..."
                        value={mascotaNombre}
                        onChange={(e) => setMascotaNombre(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Fecha y Hora con botón de Comprobación */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">Fecha de Cita</label>
                      <input
                        type="date"
                        className="form-control"
                        min={new Date().toISOString().split('T')[0]}
                        value={fecha}
                        onChange={(e) => {
                          setFecha(e.target.value);
                          setAvailabilityResult(null);
                        }}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-dark">Hora Preferida</label>
                      <select
                        className="form-select"
                        value={hora}
                        onChange={(e) => {
                          setHora(e.target.value);
                          setAvailabilityResult(null);
                        }}
                        required
                      >
                        {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                          '12:00', '12:30', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00',
                          '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'].map(h => (
                          <option key={h} value={h}>{h} hrs</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Verificación de Disponibilidad */}
                  <div className="mb-3 d-flex align-items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                      onClick={checkSlotAvailability}
                      disabled={checkingAvailability}
                    >
                      {checkingAvailability ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Verificando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-clock-history me-1"></i> Verificar Disponibilidad
                        </>
                      )}
                    </button>

                    {availabilityResult && (
                      <span className={`badge ${availabilityResult.disponible ? 'bg-success' : 'bg-danger'} py-2 px-3`}>
                        {availabilityResult.disponible ? '✓ Horario Disponible' : '✗ Horario Ocupado'}
                      </span>
                    )}
                  </div>

                  {/* Urgencia Médica */}
                  <div className="form-check form-switch mb-3 p-3 bg-light rounded-3">
                    <input
                      className="form-check-input ms-0 me-3"
                      type="checkbox"
                      id="urgenciaCheck"
                      checked={esUrgencia}
                      onChange={(e) => setEsUrgencia(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold text-danger" htmlFor="urgenciaCheck">
                      <i className="bi bi-exclamation-octagon-fill me-1"></i>
                      Marcar como Urgencia Médica Prioritaria
                    </label>
                    <p className="text-muted small mb-0 mt-1">
                      Las urgencias se priorizan en la cola de recepción inmediatamente.
                    </p>
                  </div>

                  {/* Motivo de Consulta */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark">Motivo o Síntomas Notados</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Describe brevemente si presenta vómito, tos, pérdida de apetito, vacunas de rutina..."
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Botón de Confirmación */}
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg rounded-pill shadow-sm"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando Reservación...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-2"></i>
                          Confirmar Cita Médica
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
