import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

export function MyAppointmentsPage() {
  const { t, isEnglish } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.success) setAppointments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/appointments')
      .then(res => {
        if (!active) return;
        if (res.success) setAppointments(res.data || []);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCancelAppointment = async (id) => {
    const confirmPrompt = isEnglish
      ? 'Are you sure you want to cancel this appointment?'
      : '¿Confirmas que deseas cancelar esta cita?';
    if (!window.confirm(confirmPrompt)) return;
    setCancellingId(id);
    try {
      const res = await api.patch(`/appointments/${id}/status`, { estado: 'cancelada' });
      if (res.success) {
        await loadAppointments();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'confirmada':
        return <span className="badge bg-info">{isEnglish ? 'Confirmed' : 'Confirmada'}</span>;
      case 'en_curso':
        return <span className="badge bg-primary">{isEnglish ? 'In Consultation' : 'En Consulta'}</span>;
      case 'completada':
        return <span className="badge bg-success">{isEnglish ? 'Completed' : 'Completada'}</span>;
      case 'cancelada':
        return <span className="badge bg-danger">{isEnglish ? 'Cancelled' : 'Cancelada'}</span>;
      case 'no_asistio':
        return <span className="badge bg-secondary">{isEnglish ? 'No Show' : 'No Asistió'}</span>;
      default:
        return <span className="badge bg-warning text-dark">{isEnglish ? 'Pending' : 'Pendiente'}</span>;
    }
  };

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              {isEnglish ? 'My Appointments' : 'Mis Citas Médicas'}
            </h2>
            <p className="text-muted small mb-0">
              {isEnglish ? 'Complete history of veterinary appointments and current status.' : 'Historial completo de citas veterinarias y estatus actual.'}
            </p>
          </div>
          <Link to="/citas" className="btn btn-primary rounded-pill btn-sm px-3">
            <i className="bi bi-calendar-plus me-1"></i> {t('nav.bookAppointment', 'Agendar Nueva Cita')}
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message={t('common.loading', 'Consultando tus citas...')} />
        ) : appointments.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
            <i className="bi bi-calendar-x text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-secondary">{isEnglish ? 'No appointments on record' : 'No tienes citas registradas'}</h5>
            <p className="small text-muted mb-4">{isEnglish ? 'Book a check-up or vaccination visit.' : 'Agenda una consulta para revisión preventiva o vacunación.'}</p>
            <div>
              <Link to="/citas" className="btn btn-primary rounded-pill px-4 btn-sm">
                {isEnglish ? 'Book My First Appointment' : 'Agendar Mi Primera Cita'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Folio</th>
                    <th>{isEnglish ? 'Date & Time' : 'Fecha y Hora'}</th>
                    <th>{isEnglish ? 'Pet' : 'Mascota'}</th>
                    <th>{isEnglish ? 'Service' : 'Servicio'}</th>
                    <th>{isEnglish ? 'Reason' : 'Motivo'}</th>
                    <th>{t('common.status', 'Estado')}</th>
                    <th className="text-end">{t('common.actions', 'Acciones')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td><strong>#{a.id}</strong></td>
                      <td>
                        <strong>{new Date(a.fecha_hora).toLocaleDateString()}</strong>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {new Date(a.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>{a.mascota_nombre || a.mascota?.nombre || (isEnglish ? 'Patient' : 'Paciente')}</td>
                      <td>{a.servicio_nombre || (isEnglish ? 'Consultation' : 'Consulta')}</td>
                      <td><span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '180px' }}>{a.motivo}</span></td>
                      <td>{getStatusBadge(a.estado)}</td>
                      <td className="text-end">
                        {['pendiente', 'confirmada'].includes(a.estado) && (
                          <button
                            className="btn btn-outline-danger btn-sm rounded-pill px-2 py-0"
                            disabled={cancellingId === a.id}
                            onClick={() => handleCancelAppointment(a.id)}
                            title={isEnglish ? 'Cancel appointment' : 'Cancelar cita'}
                          >
                            {cancellingId === a.id ? (isEnglish ? 'Cancelling...' : 'Cancelando...') : (isEnglish ? 'Cancel' : 'Cancelar')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
