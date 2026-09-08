import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ANATOMICAL_ZONES = [
  { id: 'orejas', nombre: 'Orejas (Otitis / Irritación)', icon: '👂' },
  { id: 'ojos', nombre: 'Ojos (Secreción / Conjuntivitis)', icon: '👀' },
  { id: 'cuello', nombre: 'Cuello y Garganta', icon: '🧣' },
  { id: 'lomo', nombre: 'Lomo / Espalda', icon: '🐾' },
  { id: 'vientre', nombre: 'Vientre / Zona Inguinal', icon: '🐕' },
  { id: 'patas_delanteras', nombre: 'Patas Delanteras', icon: '🦴' },
  { id: 'patas_traseras', nombre: 'Patas Traseras', icon: '🦴' },
  { id: 'cola', nombre: 'Cola / Región Perianal', icon: '🐩' }
];

export default function GroomingCheckinPage() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [mascotaId, setMascotaId] = useState('');
  const [tipoManto, setTipoManto] = useState('Pelo Corto');
  const [corteSolicitado, setCorteSolicitado] = useState('Baño desodorizante y corte de uñas');
  const [nudosSeveros, setNudosSeveros] = useState(false);
  const [lesiones, setLesiones] = useState([]);
  const [observaciones, setObservaciones] = useState('');

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/grooming/checkins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setCheckins(json.data || []);
      } else {
        setError(json.message || 'Error al cargar fichas de estética');
      }
    } catch (err) {
      setError('Fallo de conexión al cargar admisiones de estética');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  const toggleZone = (zoneId) => {
    setLesiones(prev => {
      const exists = prev.find(l => l.zona === zoneId);
      if (exists) {
        return prev.filter(l => l.zona !== zoneId);
      } else {
        return [...prev, { zona: zoneId, nota: 'Anomalía reportada al ingreso' }];
      }
    });
  };

  const handleCreateCheckin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/grooming/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mascota_id: parseInt(mascotaId, 10),
          tipo_manto: tipoManto,
          corte_solicitado: corteSolicitado,
          nudos_severos: nudosSeveros,
          lesiones_previas: lesiones,
          observaciones
        })
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMsg('Ficha de admisión de estética guardada exitosamente');
        setShowModal(false);
        setMascotaId('');
        setLesiones([]);
        setObservaciones('');
        fetchCheckins();
      } else {
        alert(json.message || 'Error al guardar check-in');
      }
    } catch (err) {
      alert('Error de conexión al registrar estética');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/clinical/grooming/checkins/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) {
        fetchCheckins();
      }
    } catch (err) {
      alert('Error al actualizar estado de estética');
    }
  };

  const handleNotifyWhatsApp = async (id) => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/clinical/grooming/checkins/${id}/whatsapp`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.data?.whatsappUrl) {
        window.open(json.data.whatsappUrl, '_blank');
      } else {
        alert('El cliente no tiene registrado un número telefónico válido para WhatsApp.');
      }
    } catch (err) {
      alert('Error al generar enlace de WhatsApp');
    }
  };

  return (
    <div className="container-fluid py-4 px-md-5">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bolder mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-scissors text-primary"></i> Estética & Check-in Anatómico
          </h2>
          <p className="text-muted mb-0 small">
            Admisión de grooming con marcado de anomalías dérmicas preexistentes y avisos automáticos por WhatsApp.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-circle me-1"></i> Nueva Ficha de Admisión
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {/* Grid de Check-ins */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Cargando servicios de estética...</p>
        </div>
      ) : checkins.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-body-tertiary">
          <i className="bi bi-balloon-heart text-muted fs-1 mb-3"></i>
          <h5 className="fw-bold">No hay pacientes en sala de estética</h5>
          <p className="text-muted small mb-3">Registra el ingreso de una mascota para iniciar su sesión de spa y estilismo.</p>
          <div>
            <button
              type="button"
              className="btn btn-outline-primary rounded-pill px-4"
              onClick={() => setShowModal(true)}
            >
              Registrar Check-in
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {checkins.map(item => (
            <div key={item.id} className="col-12 col-md-6 col-xl-4">
              <div className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bolder mb-1">{item.mascota_nombre}</h5>
                      <span className="text-muted small">
                        {item.mascota_especie} • {item.mascota_raza || 'Mestizo'}
                      </span>
                    </div>
                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 text-uppercase fw-bold">
                      {item.estado.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-body-tertiary rounded-3 p-3 mb-3 small">
                    <div><strong>Tutor:</strong> {item.cliente_nombre}</div>
                    <div><strong>Servicio:</strong> {item.corte_solicitado}</div>
                    {item.nudos_severos && (
                      <div className="text-danger fw-semibold mt-1">
                        ⚠️ Presenta nudos severos (Riesgo de rasurado profundo)
                      </div>
                    )}
                  </div>

                  {/* Anomalías Marcadas */}
                  <div className="mb-3">
                    <span className="text-muted small text-uppercase fw-bold d-block mb-1">Mapa Anatómico:</span>
                    {item.lesiones_previas && item.lesiones_previas.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {item.lesiones_previas.map((l, idx) => (
                          <span key={idx} className="badge bg-warning bg-opacity-25 text-dark rounded-pill px-2 py-1">
                            {l.zona}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">Sin anomalías ni lesiones previas.</span>
                    )}
                  </div>

                  {/* Estado Pipeline */}
                  <div className="mt-auto pt-3 border-top">
                    <label className="form-label small fw-semibold text-muted mb-1">Actualizar Proceso:</label>
                    <select
                      className="form-select form-select-sm rounded-pill mb-2"
                      value={item.estado}
                      onChange={e => handleUpdateStatus(item.id, e.target.value)}
                    >
                      <option value="en_espera">En Espera</option>
                      <option value="en_bano">En Baño / Deslanado</option>
                      <option value="secado_corte">Secado & Corte</option>
                      <option value="listo_entrega">Listo para Entrega 🐾</option>
                      <option value="entregado">Entregado al Tutor</option>
                    </select>

                    <button
                      type="button"
                      className="btn btn-sm btn-success w-100 rounded-pill fw-semibold shadow-sm"
                      onClick={() => handleNotifyWhatsApp(item.id)}
                    >
                      <i className="bi bi-whatsapp me-1"></i> Notificar al Tutor por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Check-in Anatómico */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
                <h5 className="modal-title fw-bold">Ficha de Admisión de Estética Anatómica</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCheckin}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">ID de la Mascota:</label>
                      <input
                        type="number"
                        required
                        className="form-control rounded-3"
                        placeholder="Ej. 1"
                        value={mascotaId}
                        onChange={e => setMascotaId(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Tipo de Manto / Pelo:</label>
                      <select
                        className="form-select rounded-3"
                        value={tipoManto}
                        onChange={e => setTipoManto(e.target.value)}
                      >
                        <option value="Pelo Corto">Pelo Corto</option>
                        <option value="Pelo Largo / Lacio">Pelo Largo / Lacio</option>
                        <option value="Pelo Rizado / Caniche">Pelo Rizado / Caniche</option>
                        <option value="Doble Capa / Nórdico">Doble Capa / Subpelo</option>
                        <option value="Pelo Duro">Pelo Duro</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Servicio / Corte:</label>
                      <input
                        type="text"
                        required
                        className="form-control rounded-3"
                        value={corteSolicitado}
                        onChange={e => setCorteSolicitado(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Checklist Nudos y Parásitos */}
                  <div className="form-check form-switch mb-4 p-3 bg-body-tertiary rounded-3 ms-0">
                    <input
                      className="form-check-input ms-0 me-3"
                      type="checkbox"
                      id="nudosCheck"
                      checked={nudosSeveros}
                      onChange={e => setNudosSeveros(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="nudosCheck">
                      Presenta nudos severos / motas compactas (Acepta deslinde de irritación post-corte)
                    </label>
                  </div>

                  {/* Selector Anatómico Interactivo */}
                  <label className="form-label small fw-semibold text-muted mb-2">
                    Marque las regiones anatómicas donde se observen anomalías preexistentes:
                  </label>
                  <div className="row g-2 mb-3">
                    {ANATOMICAL_ZONES.map(zone => {
                      const isSelected = lesiones.some(l => l.zona === zone.id);
                      return (
                        <div key={zone.id} className="col-6 col-md-3">
                          <button
                            type="button"
                            className={`btn btn-sm w-100 p-2 text-start rounded-3 d-flex align-items-center gap-2 ${isSelected ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                            onClick={() => toggleZone(zone.id)}
                          >
                            <span>{zone.icon}</span>
                            <span className="small text-truncate">{zone.nombre.split(' ')[0]}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="form-label small fw-semibold text-muted">Observaciones / Pertenencias:</label>
                    <textarea
                      rows="2"
                      className="form-control rounded-3"
                      placeholder="Collar, correa, comportamiento especial, verrugas..."
                      value={observaciones}
                      onChange={e => setObservaciones(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-body-tertiary">
                  <button type="button" className="btn btn-secondary btn-sm px-3 rounded-pill" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold">
                    Guardar Admisión
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
