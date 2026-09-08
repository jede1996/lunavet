import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function MyAppointmentsPage() {
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
    loadAppointments();
  }, []);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('¿Confirmas que deseas cancelar esta cita?')) return;
    setCancellingId(id);
    try {
      const res = await api.patch(`/appointments/${id}/status`, { estado: 'cancelada' });
      if (res.success) {
        await loadAppointments();
      }
    } catch (err) {
      alert('Error al cancelar la cita: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'confirmada':
        return <span className="badge bg-info">Confirmada</span>;
      case 'en_curso':
        return <span className="badge bg-primary">En Consulta</span>;
      case 'completada':
        return <span className="badge bg-success">Completada</span>;
      case 'cancelada':
        return <span className="badge bg-danger">Cancelada</span>;
      case 'no_asistio':
        return <span className="badge bg-secondary">No Asistió</span>;
      default:
        return <span className="badge bg-warning text-dark">Pendiente</span>;
    }
  };

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Mis Citas Médicas</h2>
            <p className="text-muted small mb-0">Historial completo de citas veterinarias y estatus actual.</p>
          </div>
          <Link to="/citas" className="btn btn-primary rounded-pill btn-sm px-3">
            <i className="bi bi-calendar-plus me-1"></i> Agendar Nueva Cita
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Consultando tus citas..." />
        ) : appointments.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
            <i className="bi bi-calendar-x text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-secondary">No tienes citas registradas</h5>
            <p className="small text-muted mb-4">Agenda una consulta para revisión preventiva o vacunación.</p>
            <div>
              <Link to="/citas" className="btn btn-primary rounded-pill px-4 btn-sm">
                Agendar Mi Primera Cita
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
                    <th>Fecha y Hora</th>
                    <th>Mascota</th>
                    <th>Servicio</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
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
                      <td>{a.mascota_nombre || a.mascota?.nombre || 'Paciente'}</td>
                      <td>{a.servicio_nombre || 'Consulta'}</td>
                      <td><span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '180px' }}>{a.motivo}</span></td>
                      <td>{getStatusBadge(a.estado)}</td>
                      <td className="text-end">
                        {['pendiente', 'confirmada'].includes(a.estado) && (
                          <button
                            className="btn btn-outline-danger btn-sm rounded-pill px-2 py-0"
                            disabled={cancellingId === a.id}
                            onClick={() => handleCancelAppointment(a.id)}
                            title="Cancelar cita"
                          >
                            {cancellingId === a.id ? 'Cancelando...' : 'Cancelar'}
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
