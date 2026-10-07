import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.client';
import { AgendaCalendar } from '../../components/calendar/AgendaCalendar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';

export function StaffAgendaPage() {
  const { t, isEnglish } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState(null);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

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
        if (active && res.success) setAppointments(res.data || []);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = async (newStatus) => {
    if (!selectedApt) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/appointments/${selectedApt.id}/status`, { estado: newStatus });
      if (res.success) {
        setSelectedApt(prev => ({ ...prev, estado: newStatus }));
        await loadAppointments();
      }
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container-fluid px-lg-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <span className="badge bg-primary-subtle text-primary mb-1">
              {isEnglish ? 'Medical Staff & Reception' : 'Staff Médico & Recepción'}
            </span>
            <h2 className="fw-bold text-dark mb-0">{t('staff.agendaTitle', 'Agenda Médica General (FullCalendar)')}</h2>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={loadAppointments}>
              <i className="bi bi-arrow-clockwise me-1"></i> {t('staff.refreshAgenda', 'Actualizar Agenda')}
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message={t('common.loading', 'Cargando calendario interactivo de citas...')} />
        ) : (
          <AgendaCalendar
            appointments={appointments}
            onEventClick={(apt) => setSelectedApt(apt)}
          />
        )}

        {/* Modal de Detalle y Cambio de Estado de la Cita */}
        {selectedApt && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-bottom">
                  <div>
                    <span className="badge bg-primary-subtle text-primary mb-1">Cita #{selectedApt.id}</span>
                    <h5 className="modal-title fw-bold text-dark">{selectedApt.mascota_nombre || selectedApt.mascota?.nombre || 'Paciente'}</h5>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedApt(null)}></button>
                </div>

                <div className="modal-body p-4">
                  <div className="bg-light rounded-3 p-3 small mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Servicio:</span>
                      <strong>{selectedApt.servicio_nombre || 'Consulta'}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Horario:</span>
                      <span>{new Date(selectedApt.fecha_hora).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Estado Actual:</span>
                      <span className="badge bg-info">{selectedApt.estado}</span>
                    </div>
                    {selectedApt.es_urgencia && (
                      <div className="alert alert-danger py-1 px-2 small mb-0 mt-2">
                        <i className="bi bi-exclamation-octagon-fill me-1"></i> Paciente con Urgencia Prioritaria
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <strong className="small text-muted d-block mb-1">Motivo Reportado:</strong>
                    <p className="small text-dark mb-0">{selectedApt.motivo || 'Sin detalles especificados.'}</p>
                  </div>

                  {/* Acciones de Estado */}
                  <div className="border-top pt-3">
                    <label className="form-label small fw-semibold text-dark mb-2">Transición Rápida de Estado:</label>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-outline-info btn-sm rounded-pill"
                        disabled={updating || selectedApt.estado === 'confirmada'}
                        onClick={() => handleStatusChange('confirmada')}
                      >
                        Confirmar Cita
                      </button>
                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        disabled={updating || selectedApt.estado === 'en_curso'}
                        onClick={() => handleStatusChange('en_curso')}
                      >
                        Iniciar Consulta
                      </button>
                      <button
                        className="btn btn-outline-success btn-sm rounded-pill"
                        disabled={updating || selectedApt.estado === 'completada'}
                        onClick={() => handleStatusChange('completada')}
                      >
                        Completar
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm rounded-pill"
                        disabled={updating || selectedApt.estado === 'no_asistio'}
                        onClick={() => handleStatusChange('no_asistio')}
                      >
                        No Asistió
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm rounded-pill"
                        disabled={updating || selectedApt.estado === 'cancelada'}
                        onClick={() => handleStatusChange('cancelada')}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  {selectedApt.mascota_id && (
                    <button
                      className="btn btn-primary rounded-pill btn-sm px-3"
                      onClick={() => navigate(`/staff/consultas?mascotaId=${selectedApt.mascota_id}&citaId=${selectedApt.id}`)}
                    >
                      <i className="bi bi-clipboard2-pulse me-1"></i> Atender en Consulta
                    </button>
                  )}
                  <button type="button" className="btn btn-light rounded-pill btn-sm" onClick={() => setSelectedApt(null)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
