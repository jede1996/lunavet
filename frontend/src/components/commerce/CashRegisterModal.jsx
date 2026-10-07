import React, { useState, useEffect } from 'react';

export default function CashRegisterModal({ isOpen, onClose, onShiftUpdated }) {
  const [activeTab, setActiveTab] = useState('arqueo'); // 'arqueo' | 'movimiento' | 'cierre' | 'apertura'
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Apertura
  const [montoInicial, setMontoInicial] = useState('1000.00');
  const [notasApertura, setNotasApertura] = useState('');

  // Form Movimiento
  const [tipoMov, setTipoMov] = useState('salida');
  const [montoMov, setMontoMov] = useState('');
  const [motivoMov, setMotivoMov] = useState('');

  // Form Cierre Z
  const [montoRealCierre, setMontoRealCierre] = useState('');
  const [notasCierre, setNotasCierre] = useState('');

  const fetchActiveShift = async () => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/commerce/cash-register/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setShift(json.data || null);
        if (!json.data) {
          setActiveTab('apertura');
        } else {
          setActiveTab('arqueo');
        }
      }
    } catch {
      setError('Error al consultar caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const loadShift = async () => {
      try {
        const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
        const res = await fetch('/api/commerce/cash-register/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!active) return;
        if (res.ok) {
          setShift(json.data || null);
          if (!json.data) {
            setActiveTab('apertura');
          } else {
            setActiveTab('arqueo');
          }
        }
      } catch {
        if (active) setError('Error al consultar caja');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadShift();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenShift = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/commerce/cash-register/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          monto_inicial: parseFloat(montoInicial),
          notas: notasApertura
        })
      });
      const json = await res.json();
      if (res.ok) {
        fetchActiveShift();
        if (onShiftUpdated) onShiftUpdated();
      } else {
        alert(json.message || 'Error al aperturar caja');
      }
    } catch {
      alert('Error de conexión al abrir caja');
    }
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    if (!shift) return;
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/commerce/cash-register/movement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          caja_turno_id: shift.id,
          tipo: tipoMov,
          monto: parseFloat(montoMov),
          motivo: motivoMov
        })
      });
      const json = await res.json();
      if (res.ok) {
        setMontoMov('');
        setMotivoMov('');
        setActiveTab('arqueo');
        fetchActiveShift();
        if (onShiftUpdated) onShiftUpdated();
      } else {
        alert(json.message || 'Error al registrar movimiento');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleCloseShiftZ = async (e) => {
    e.preventDefault();
    if (!shift) return;
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/commerce/cash-register/${shift.id}/cut-z`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          monto_cierre_real: parseFloat(montoRealCierre),
          notas: notasCierre
        })
      });
      const json = await res.json();
      if (res.ok) {
        alert(`Corte Z completado exitosamente.\nDiferencia: $${json.data.diferencia}`);
        onClose();
        if (onShiftUpdated) onShiftUpdated();
      } else {
        alert(json.message || 'Error al cerrar caja');
      }
    } catch {
      alert('Error de conexión al cerrar turno');
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-cash-stack text-success fs-5"></i>
              <h5 className="modal-title fw-bold">Control & Arqueo de Caja Chica</h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {error && (
              <div className="alert alert-danger rounded-4 mb-3 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-octagon-fill"></i>
                <div>{error}</div>
              </div>
            )}
            {loading && !shift && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span className="ms-2 text-muted small">Cargando estado de caja...</span>
              </div>
            )}
            {/* Tabs de Caja */}
            {shift ? (
              <ul className="nav nav-pills nav-fill mb-4 p-1 bg-body-tertiary rounded-pill">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link rounded-pill py-2 fw-semibold ${activeTab === 'arqueo' ? 'active shadow-sm' : ''}`}
                    onClick={() => setActiveTab('arqueo')}
                  >
                    <i className="bi bi-file-earmark-spreadsheet me-1"></i> Corte X (Arqueo)
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link rounded-pill py-2 fw-semibold ${activeTab === 'movimiento' ? 'active shadow-sm' : ''}`}
                    onClick={() => setActiveTab('movimiento')}
                  >
                    <i className="bi bi-arrow-left-right me-1"></i> Movimiento Manual
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link rounded-pill py-2 fw-semibold ${activeTab === 'cierre' ? 'active shadow-sm bg-danger text-white' : ''}`}
                    onClick={() => setActiveTab('cierre')}
                  >
                    <i className="bi bi-lock me-1"></i> Corte Z (Cierre)
                  </button>
                </li>
              </ul>
            ) : (
              <div className="alert alert-warning rounded-4 mb-4 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                <div>
                  <strong>No hay turno de caja abierto:</strong> Aperture la caja indicando el fondo inicial en efectivo para comenzar a cobrar en el mostrador.
                </div>
              </div>
            )}

            {/* VISTA ARQUEO (CORTE X) */}
            {shift && activeTab === 'arqueo' && (
              <div>
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card border-0 bg-body-tertiary rounded-4 p-3 text-center">
                      <span className="text-muted small text-uppercase fw-bold">Fondo Inicial</span>
                      <h4 className="fw-bolder mt-1 text-primary mb-0">${shift.monto_inicial?.toFixed(2)}</h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 bg-success bg-opacity-10 rounded-4 p-3 text-center">
                      <span className="text-muted small text-uppercase fw-bold">Ventas Efectivo</span>
                      <h4 className="fw-bolder mt-1 text-success mb-0">+${shift.total_ventas_efectivo?.toFixed(2)}</h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 bg-body-tertiary rounded-4 p-3 text-center">
                      <span className="text-muted small text-uppercase fw-bold">Entradas / Salidas</span>
                      <h4 className="fw-bolder mt-1 text-dark mb-0">
                        +${shift.total_entradas_manuales?.toFixed(2)} / -${shift.total_salidas_manuales?.toFixed(2)}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card border-0 bg-primary bg-opacity-10 rounded-4 p-3 text-center">
                      <span className="text-muted small text-uppercase fw-bold">Saldo Esperado</span>
                      <h4 className="fw-bolder mt-1 text-primary mb-0">${shift.monto_cierre_esperado?.toFixed(2)}</h4>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">Movimientos del Turno:</h6>
                <div className="table-responsive border rounded-3" style={{ maxHeight: '200px' }}>
                  <table className="table table-sm align-middle mb-0">
                    <thead className="bg-body-tertiary small">
                      <tr>
                        <th>Hora</th>
                        <th>Tipo</th>
                        <th>Concepto / Motivo</th>
                        <th className="text-end pe-3">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shift.movimientos && shift.movimientos.length > 0 ? (
                        shift.movimientos.map(m => (
                          <tr key={m.id}>
                            <td className="small">{new Date(m.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              <span className={`badge rounded-pill ${m.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}`}>
                                {m.tipo}
                              </span>
                            </td>
                            <td className="small">{m.motivo}</td>
                            <td className="text-end pe-3 fw-bold">${parseFloat(m.monto).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-3 small">Sin movimientos manuales en este turno.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VISTA MOVIMIENTO MANUAL */}
            {shift && activeTab === 'movimiento' && (
              <form onSubmit={handleCreateMovement}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Tipo de Movimiento:</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" id="movSalida" value="salida" checked={tipoMov === 'salida'} onChange={() => setTipoMov('salida')} />
                      <label className="form-check-label fw-semibold text-danger" htmlFor="movSalida">Salida / Gasto de Caja</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" id="movEntrada" value="entrada" checked={tipoMov === 'entrada'} onChange={() => setTipoMov('entrada')} />
                      <label className="form-check-label fw-semibold text-success" htmlFor="movEntrada">Entrada / Aporte de Efectivo</label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Monto en Efectivo ($):</label>
                  <input type="number" step="0.50" required min="1" className="form-control rounded-3" placeholder="0.00" value={montoMov} onChange={e => setMontoMov(e.target.value)} />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted">Motivo / Concepto Justificado:</label>
                  <input type="text" required className="form-control rounded-3" placeholder="Ej. Pago de garrafones de agua, recarga de cambio..." value={motivoMov} onChange={e => setMotivoMov(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold">
                  Registrar Movimiento en Caja
                </button>
              </form>
            )}

            {/* VISTA CIERRE Z */}
            {shift && activeTab === 'cierre' && (
              <form onSubmit={handleCloseShiftZ}>
                <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 rounded-4 mb-4 small">
                  <strong>Atención:</strong> El Corte Z cerrará de forma permanente este turno de caja chica y generará la conciliación contable de ingresos en efectivo, tarjeta y transferencias.
                </div>

                <div className="card border-0 bg-body-tertiary rounded-4 p-3 mb-4 text-center">
                  <span className="text-muted small text-uppercase fw-bold">Saldo Teórico Esperado en Caja</span>
                  <h3 className="fw-bolder text-primary mt-1 mb-0">${shift.monto_cierre_esperado?.toFixed(2)}</h3>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Conteo Real de Efectivo en Caja ($):</label>
                  <input type="number" step="0.50" required min="0" className="form-control form-control-lg rounded-3 fw-bold" placeholder="0.00" value={montoRealCierre} onChange={e => setMontoRealCierre(e.target.value)} />
                  {montoRealCierre && (
                    <div className="small mt-1 fw-bold">
                      {parseFloat(montoRealCierre) - shift.monto_cierre_esperado === 0 ? (
                        <span className="text-success">Caja cuadrada con 0 diferencia.</span>
                      ) : parseFloat(montoRealCierre) - shift.monto_cierre_esperado > 0 ? (
                        <span className="text-info">Sobrante: +${(parseFloat(montoRealCierre) - shift.monto_cierre_esperado).toFixed(2)}</span>
                      ) : (
                        <span className="text-danger">Faltante: ${(parseFloat(montoRealCierre) - shift.monto_cierre_esperado).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted">Observaciones de Cierre:</label>
                  <textarea rows="2" className="form-control rounded-3" placeholder="Incidencias o notas del cajero..." value={notasCierre} onChange={e => setNotasCierre(e.target.value)}></textarea>
                </div>

                <button type="submit" className="btn btn-danger rounded-pill px-4 fw-semibold">
                  Confirmar y Realizar Corte Z de Cierre
                </button>
              </form>
            )}

            {/* VISTA APERTURA */}
            {!shift && activeTab === 'apertura' && (
              <form onSubmit={handleOpenShift}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Monto Inicial en Efectivo (Fondo de Cambio):</label>
                  <input type="number" step="10" required min="0" className="form-control form-control-lg rounded-3 fw-bold" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-muted">Notas de Apertura:</label>
                  <input type="text" className="form-control rounded-3" placeholder="Ej. Turno matutino recepcionista..." value={notasApertura} onChange={e => setNotasApertura(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-success rounded-pill px-4 fw-semibold">
                  Aperturar Turno de Caja
                </button>
              </form>
            )}
          </div>

          <div className="modal-footer px-4 py-3 bg-body-tertiary">
            <button type="button" className="btn btn-secondary btn-sm px-4 rounded-pill" onClick={onClose}>
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
