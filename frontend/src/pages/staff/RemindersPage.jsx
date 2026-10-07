import React, { useState, useEffect } from 'react';

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState('preventivos'); // 'preventivos' | 'seguimientos'
  const [recordatorios, setRecordatorios] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState(null);

  // Form Recordatorio
  const [showRecModal, setShowRecModal] = useState(false);
  const [mascotaId, setMascotaId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('vacuna_rabia');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Form Seguimiento
  const [showSegModal, setShowSegModal] = useState(false);
  const [segMascotaId, setSegMascotaId] = useState('');
  const [segClienteId, setSegClienteId] = useState('');
  const [segFecha, setSegFecha] = useState('');
  const [segTipoCaso, setSegTipoCaso] = useState('cirugia');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');

      const [resRec, resSeg] = await Promise.all([
        fetch('/api/clinical/reminders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/clinical/followups', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [dataRec, dataSeg] = await Promise.all([resRec.json(), resSeg.json()]);

      if (resRec.ok) setRecordatorios(dataRec.data || []);
      if (resSeg.ok) setSeguimientos(dataSeg.data || []);
    } catch {
      setError('Fallo de conexión al cargar datos clínicos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');

    Promise.all([
      fetch('/api/clinical/reminders', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/clinical/followups', { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([resRec, resSeg]) => {
        if (!active) return;
        const [dataRec, dataSeg] = await Promise.all([resRec.json(), resSeg.json()]);
        if (resRec.ok) setRecordatorios(dataRec.data || []);
        if (resSeg.ok) setSeguimientos(dataSeg.data || []);
      })
      .catch(() => {
        if (!active) return;
        setError('Fallo de conexión al cargar datos clínicos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSyncVaccines = async () => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/reminders/sync-vaccines', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMsg(`Sincronización completada: ${json.data?.totalSincronizados || 0} recordatorios automáticos generados.`);
        fetchData();
      }
    } catch {
      alert('Error al sincronizar vacunas');
    }
  };

  const handleMarkSent = async (id) => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/clinical/reminders/${id}/sent`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert('Error al actualizar recordatorio');
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mascota_id: parseInt(mascotaId, 10),
          cliente_id: parseInt(clienteId, 10),
          tipo,
          fecha_programada: fechaProgramada,
          mensaje
        })
      });
      if (res.ok) {
        setShowRecModal(false);
        setSuccessMsg('Recordatorio preventivo programado con éxito.');
        fetchData();
      }
    } catch {
      alert('Error al crear recordatorio');
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/followups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mascota_id: parseInt(segMascotaId, 10),
          cliente_id: parseInt(segClienteId, 10),
          fecha_programada: segFecha,
          tipo_caso: segTipoCaso
        })
      });
      if (res.ok) {
        setShowSegModal(false);
        setSuccessMsg('Seguimiento clínico agendado.');
        fetchData();
      }
    } catch {
      alert('Error al agendar seguimiento');
    }
  };

  const handleUpdateFollowup = async (id, estado, notas) => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/clinical/followups/${id}/contact`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          estado_paciente: estado,
          notas_seguimiento: notas,
          contacto_exitoso: true
        })
      });
      if (res.ok) {
        setSuccessMsg('Estado del paciente actualizado.');
        fetchData();
      }
    } catch {
      alert('Error al registrar contacto');
    }
  };

  return (
    <div className="container-fluid py-4 px-md-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bolder mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-bell text-warning"></i> Recordatorios & Seguimiento Post-Consulta
          </h2>
          <p className="text-muted mb-0 small">
            Fidelización preventiva de pacientes y control postoperatorio a 48h y 72h.
          </p>
        </div>

        <div className="d-flex gap-2">
          {activeTab === 'preventivos' ? (
            <>
              <button
                type="button"
                className="btn btn-outline-primary rounded-pill px-3 fw-semibold shadow-sm"
                onClick={handleSyncVaccines}
              >
                <i className="bi bi-arrow-repeat me-1"></i> Sincronizar Vacunas Próximas
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
                onClick={() => setShowRecModal(true)}
              >
                <i className="bi bi-plus-circle me-1"></i> Programar Recordatorio
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
              onClick={() => setShowSegModal(true)}
            >
              <i className="bi bi-plus-circle me-1"></i> Nuevo Seguimiento Clínico
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-4 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 p-1 bg-body-tertiary rounded-pill d-inline-flex">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link rounded-pill py-2 px-4 fw-semibold ${activeTab === 'preventivos' ? 'active shadow-sm' : ''}`}
            onClick={() => setActiveTab('preventivos')}
          >
            <i className="bi bi-shield-plus me-2"></i> Recordatorios Preventivos ({recordatorios.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link rounded-pill py-2 px-4 fw-semibold ${activeTab === 'seguimientos' ? 'active shadow-sm' : ''}`}
            onClick={() => setActiveTab('seguimientos')}
          >
            <i className="bi bi-heart-pulse me-2"></i> Seguimientos Post-Op (48h/72h) ({seguimientos.length})
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Cargando datos...</p>
        </div>
      ) : activeTab === 'preventivos' ? (
        /* TAB PREVENTIVOS */
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-body-tertiary text-muted small text-uppercase">
                <tr>
                  <th className="ps-4">Paciente & Tutor</th>
                  <th>Tipo de Prevención</th>
                  <th>Fecha Programada</th>
                  <th>Estado</th>
                  <th className="text-end pe-4">Acción WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {recordatorios.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No hay recordatorios preventivos pendientes.
                    </td>
                  </tr>
                ) : (
                  recordatorios.map(r => (
                    <tr key={r.id}>
                      <td className="ps-4">
                        <div className="fw-bold">{r.mascota_nombre}</div>
                        <div className="small text-muted">{r.cliente_nombre} ({r.cliente_telefono || 'Sin tel'})</div>
                      </td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-1 text-uppercase">
                          {r.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="fw-semibold">{r.fecha_programada}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 text-uppercase ${r.estado === 'enviado' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          {r.whatsappUrl && (
                            <a
                              href={r.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-success rounded-pill"
                              onClick={() => handleMarkSent(r.id)}
                            >
                              <i className="bi bi-whatsapp me-1"></i> Enviar WhatsApp
                            </a>
                          )}
                          {r.estado === 'pendiente' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-pill"
                              onClick={() => handleMarkSent(r.id)}
                            >
                              Marcar Enviado
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB SEGUIMIENTOS POST-OP */
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-body-tertiary text-muted small text-uppercase">
                <tr>
                  <th className="ps-4">Paciente & Tutor</th>
                  <th>Veterinario a Cargo</th>
                  <th>Fecha de Llamada</th>
                  <th>Estado del Paciente</th>
                  <th className="text-end pe-4">Registrar Contacto</th>
                </tr>
              </thead>
              <tbody>
                {seguimientos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No hay pacientes agendados para seguimiento postoperatorio.
                    </td>
                  </tr>
                ) : (
                  seguimientos.map(s => (
                    <tr key={s.id}>
                      <td className="ps-4">
                        <div className="fw-bold">{s.mascota_nombre}</div>
                        <div className="small text-muted">{s.cliente_nombre} ({s.cliente_telefono || 'Sin tel'})</div>
                      </td>
                      <td>{s.veterinario_nombre}</td>
                      <td className="fw-semibold">{s.fecha_programada}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 text-uppercase ${s.estado_paciente === 'recuperacion_favorable' ? 'bg-success' : s.estado_paciente === 'urgencia' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {s.estado_paciente.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <select
                          className="form-select form-select-sm rounded-pill d-inline-block w-auto"
                          value={s.estado_paciente}
                          onChange={e => {
                            const notas = prompt('Observaciones del estado del paciente:', s.notas_seguimiento || 'Tutor confirma recuperación favorable.');
                            if (notas !== null) {
                              handleUpdateFollowup(s.id, e.target.value, notas);
                            }
                          }}
                        >
                          <option value="pendiente">Pendiente de Contacto</option>
                          <option value="recuperacion_favorable">Recuperación Favorable 👍</option>
                          <option value="molestia_leve">Molestia Leve (Monitorear)</option>
                          <option value="requiere_revision">Requiere Revisión en Clínica ⚠️</option>
                          <option value="urgencia">Urgencia Quirúrgica 🚨</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuevo Recordatorio */}
      {showRecModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
                <h5 className="modal-title fw-bold">Programar Recordatorio Preventivo</h5>
                <button type="button" className="btn-close" onClick={() => setShowRecModal(false)}></button>
              </div>
              <form onSubmit={handleCreateReminder}>
                <div className="modal-body p-4">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">ID de Mascota:</label>
                      <input type="number" required className="form-control rounded-3" value={mascotaId} onChange={e => setMascotaId(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">ID de Cliente:</label>
                      <input type="number" required className="form-control rounded-3" value={clienteId} onChange={e => setClienteId(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Tipo de Recordatorio:</label>
                    <select className="form-select rounded-3" value={tipo} onChange={e => setTipo(e.target.value)}>
                      <option value="vacuna_rabia">Vacuna Antirrábica</option>
                      <option value="vacuna_sextuple">Vacuna Múltiple / Séxtuple</option>
                      <option value="vacuna_triple_felina">Triple Felina</option>
                      <option value="desparasitacion">Desparasitación Interna / Externa</option>
                      <option value="cita_proxima">Revisión Preventiva General</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Fecha Programada:</label>
                    <input type="date" required className="form-control rounded-3" value={fechaProgramada} onChange={e => setFechaProgramada(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-muted">Mensaje Personalizado WhatsApp:</label>
                    <textarea required rows="3" className="form-control rounded-3" placeholder="Hola, recordamos que a tu mascota le toca..." value={mensaje} onChange={e => setMensaje(e.target.value)}></textarea>
                  </div>
                </div>
                <div className="modal-footer px-4 py-3 bg-body-tertiary">
                  <button type="button" className="btn btn-secondary btn-sm px-3 rounded-pill" onClick={() => setShowRecModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold">Guardar Recordatorio</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Seguimiento */}
      {showSegModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
                <h5 className="modal-title fw-bold">Nuevo Seguimiento Post-Operación (48h/72h)</h5>
                <button type="button" className="btn-close" onClick={() => setShowSegModal(false)}></button>
              </div>
              <form onSubmit={handleCreateFollowup}>
                <div className="modal-body p-4">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">ID Mascota:</label>
                      <input type="number" required className="form-control rounded-3" value={segMascotaId} onChange={e => setSegMascotaId(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">ID Cliente:</label>
                      <input type="number" required className="form-control rounded-3" value={segClienteId} onChange={e => setSegClienteId(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Tipo de Caso:</label>
                    <select className="form-select rounded-3" value={segTipoCaso} onChange={e => setSegTipoCaso(e.target.value)}>
                      <option value="cirugia">Cirugía Mayor / Anestesia</option>
                      <option value="consulta_critica">Tratamiento de Infección / Trauma</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-muted">Fecha Estimada de Llamada (48h/72h):</label>
                    <input type="date" required className="form-control rounded-3" value={segFecha} onChange={e => setSegFecha(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer px-4 py-3 bg-body-tertiary">
                  <button type="button" className="btn btn-secondary btn-sm px-3 rounded-pill" onClick={() => setShowSegModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold">Agendar Seguimiento</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
