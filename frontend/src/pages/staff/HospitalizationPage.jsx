import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SignaturePadModal from '../../components/clinical/SignaturePadModal';
import VeterinaryDoseCalculatorModal from '../../components/clinical/VeterinaryDoseCalculatorModal';

export default function HospitalizationPage() {
  const { user } = useAuth();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modales
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showMonitoreoModal, setShowMonitoreoModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedHosp, setSelectedHosp] = useState(null);

  // Form Ingreso
  const [mascotaId, setMascotaId] = useState('');
  const [jaulaNumero, setJaulaNumero] = useState('UCI-01');
  const [jaulaTipo, setJaulaTipo] = useState('uci');
  const [motivo, setMotivo] = useState('');
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState('');
  const [notasIngreso, setNotasIngreso] = useState('');

  // Form Monitoreo
  const [temperatura, setTemperatura] = useState('38.5');
  const [fc, setFc] = useState('90');
  const [fr, setFr] = useState('22');
  const [pa, setPa] = useState('120/80');
  const [tllc, setTllc] = useState('2');
  const [escalaDolor, setEscalaDolor] = useState('1');
  const [estadoConciencia, setEstadoConciencia] = useState('alerta');
  const [observacionesMonitoreo, setObservacionesMonitoreo] = useState('');

  const fetchHospitalizaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/hospitalizations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setHospitalizaciones(json.data || []);
      } else {
        setError(json.message || 'Error al cargar hospitalizaciones');
      }
    } catch (err) {
      setError('Fallo de conexión al cargar pacientes hospitalizados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalizaciones();
  }, []);

  const handleIngresar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/clinical/hospitalizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mascota_id: parseInt(mascotaId, 10),
          jaula_numero: jaulaNumero,
          jaula_tipo: jaulaTipo,
          motivo,
          diagnostico_presuntivo: diagnosticoPresuntivo,
          notas_ingreso: notasIngreso
        })
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMsg(`Paciente ingresado exitosamente en ${jaulaNumero}`);
        setShowIngresoModal(false);
        setMotivo('');
        setDiagnosticoPresuntivo('');
        setMascotaId('');
        fetchHospitalizaciones();
      } else {
        alert(json.message || 'Error al ingresar paciente');
      }
    } catch (err) {
      alert('Error de conexión al registrar ingreso');
    }
  };

  const handleRegistrarMonitoreo = async (e) => {
    e.preventDefault();
    if (!selectedHosp) return;
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/clinical/hospitalizations/${selectedHosp.id}/monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          temperatura: parseFloat(temperatura),
          frecuencia_cardiaca: parseInt(fc, 10),
          frecuencia_respiratoria: parseInt(fr, 10),
          presion_arterial: pa,
          tllc_segundos: parseInt(tllc, 10),
          escala_dolor: parseInt(escalaDolor, 10),
          estado_conciencia: estadoConciencia,
          observaciones: observacionesMonitoreo
        })
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessMsg(`Signos vitales registrados para ${selectedHosp.mascota_nombre}`);
        setShowMonitoreoModal(false);
        setObservacionesMonitoreo('');
        fetchHospitalizaciones();
      } else {
        alert(json.message || 'Error al guardar signos');
      }
    } catch (err) {
      alert('Error de red al guardar monitoreo');
    }
  };

  const handleDarAlta = async (hosp) => {
    const notasAlta = prompt(`Confirmar alta médica de ${hosp.mascota_nombre}. Ingrese indicaciones de egreso:`, 'Paciente hemodinámicamente estable con alta médica a domicilio.');
    if (notasAlta === null) return;

    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/clinical/hospitalizations/${hosp.id}/discharge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notas_alta: notasAlta })
      });
      if (res.ok) {
        setSuccessMsg(`Alta confirmada para ${hosp.mascota_nombre}`);
        fetchHospitalizaciones();
      }
    } catch (err) {
      alert('Error al registrar alta');
    }
  };

  return (
    <div className="container-fluid py-4 px-md-5">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bolder mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-hospital text-danger"></i> Hospitalización & Triage UCI
          </h2>
          <p className="text-muted mb-0 small">
            Monitoreo periódico de signos vitales, control de jaulas activas y soporte de cuidados intensivos.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-info rounded-pill px-3 fw-semibold shadow-sm"
            onClick={() => setShowCalculatorModal(true)}
          >
            <i className="bi bi-calculator me-1"></i> Calculadora & Fluidos
          </button>
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"
            onClick={() => setShowIngresoModal(true)}
          >
            <i className="bi bi-plus-circle me-1"></i> Nuevo Ingreso a Jaula
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show rounded-4 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger rounded-4 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* Grid de Jaulas / Pacientes Hospitalizados */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Cargando monitor de hospitalización...</p>
        </div>
      ) : hospitalizaciones.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-body-tertiary">
          <i className="bi bi-heart-pulse text-muted fs-1 mb-3"></i>
          <h5 className="fw-bold">No hay pacientes hospitalizados en este momento</h5>
          <p className="text-muted small mb-3">Todas las jaulas y cubículos de UCI se encuentran disponibles.</p>
          <div>
            <button
              type="button"
              className="btn btn-outline-primary rounded-pill px-4"
              onClick={() => setShowIngresoModal(true)}
            >
              Registrar Admisión
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {hospitalizaciones.map(hosp => (
            <div key={hosp.id} className="col-12 col-md-6 col-xl-4">
              <div className="card h-100 border-0 rounded-4 shadow-sm overflow-hidden position-relative">
                {/* Header Jaula y Triage */}
                <div className={`p-3 d-flex justify-content-between align-items-center ${hosp.jaula_tipo === 'uci' ? 'bg-danger bg-opacity-10 text-danger border-bottom border-danger border-opacity-25' : 'bg-body-tertiary border-bottom'}`}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark rounded-pill px-3 py-2 fw-bold fs-6">
                      {hosp.jaula_numero}
                    </span>
                    <span className="small text-uppercase fw-bold">
                      {hosp.jaula_tipo.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`badge rounded-pill px-3 py-2 text-uppercase ${hosp.estado === 'ingresado' ? 'bg-warning text-dark' : 'bg-info'}`}>
                    {hosp.estado.replace('_', ' ')}
                  </span>
                </div>

                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle overflow-hidden flex-shrink-0 pet-avatar-ring d-flex align-items-center justify-content-center bg-body position-relative"
                      style={{ width: '64px', height: '64px' }}
                    >
                      <img
                        src={`/api/pets/${hosp.mascota_id}/photo${token ? `?token=${token}` : ''}`}
                        alt={hosp.mascota_nombre}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <span className="fs-3" style={{ display: 'none' }}>
                        {hosp.mascota_especie?.toLowerCase().includes('gato') || hosp.mascota_especie?.toLowerCase().includes('felin') ? '🐈' : '🐕'}
                      </span>
                    </div>
                    <div>
                      <h5 className="fw-bolder mb-1 text-emphasis">{hosp.mascota_nombre}</h5>
                      <div className="text-secondary small">
                        {hosp.mascota_especie} • {hosp.mascota_raza || 'Mestizo'}
                      </div>
                      <div className="text-secondary small">
                        Tutor: <strong>{hosp.propietario_nombre}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-secondary small text-uppercase fw-bold">Motivo de Internamiento:</span>
                    <p className="small mb-1 text-emphasis text-break">{hosp.motivo}</p>
                    {hosp.diagnostico_presuntivo && (
                      <div className="small text-danger fw-semibold">
                        Dx Presuntivo: {hosp.diagnostico_presuntivo}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="d-flex flex-wrap gap-2 pt-2 border-top mt-auto">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill flex-grow-1"
                      onClick={() => {
                        setSelectedHosp(hosp);
                        setShowMonitoreoModal(true);
                      }}
                    >
                      <i className="bi bi-activity me-1"></i> Signos Vitales
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      onClick={() => handleDarAlta(hosp)}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i> Alta Médica
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Ingreso */}
      {showIngresoModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
                <h5 className="modal-title fw-bold">Admisión a Hospitalización</h5>
                <button type="button" className="btn-close" onClick={() => setShowIngresoModal(false)}></button>
              </div>
              <form onSubmit={handleIngresar}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">ID de la Mascota / Paciente:</label>
                    <input
                      type="number"
                      required
                      className="form-control rounded-3"
                      placeholder="Ej. 1"
                      value={mascotaId}
                      onChange={e => setMascotaId(e.target.value)}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">No. de Jaula:</label>
                      <input
                        type="text"
                        required
                        className="form-control rounded-3"
                        value={jaulaNumero}
                        onChange={e => setJaulaNumero(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Tipo de Jaula:</label>
                      <select
                        className="form-select rounded-3"
                        value={jaulaTipo}
                        onChange={e => setJaulaTipo(e.target.value)}
                      >
                        <option value="uci">UCI / Cuidados Críticos</option>
                        <option value="canil_grande">Canil Grande</option>
                        <option value="canil_chico">Canil Chico</option>
                        <option value="gatera">Gatera Aislada</option>
                        <option value="aislamiento">Infecciosos / Aislamiento</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Motivo de Internamiento:</label>
                    <textarea
                      required
                      rows="2"
                      className="form-control rounded-3"
                      placeholder="Causa clínica de ingreso..."
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Diagnóstico Presuntivo:</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="Ej. Gastroenteritis, Trauma, Pancreatitis..."
                      value={diagnosticoPresuntivo}
                      onChange={e => setDiagnosticoPresuntivo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-semibold text-muted">Plan Inicial / Notas:</label>
                    <textarea
                      rows="2"
                      className="form-control rounded-3"
                      placeholder="Instrucciones de guardia..."
                      value={notasIngreso}
                      onChange={e => setNotasIngreso(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer px-4 py-3 bg-body-tertiary">
                  <button type="button" className="btn btn-secondary btn-sm px-3 rounded-pill" onClick={() => setShowIngresoModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold">
                    Confirmar Ingreso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Monitoreo Signos Vitales */}
      {showMonitoreoModal && selectedHosp && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
                <h5 className="modal-title fw-bold">
                  Monitoreo de Signos Vitales - {selectedHosp.mascota_nombre} ({selectedHosp.jaula_numero})
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowMonitoreoModal(false)}></button>
              </div>
              <form onSubmit={handleRegistrarMonitoreo}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Temperatura (°C):</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="form-control rounded-3"
                        value={temperatura}
                        onChange={e => setTemperatura(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Frecuencia Cardíaca (lpm):</label>
                      <input
                        type="number"
                        required
                        className="form-control rounded-3"
                        value={fc}
                        onChange={e => setFc(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Frecuencia Respiratoria (rpm):</label>
                      <input
                        type="number"
                        required
                        className="form-control rounded-3"
                        value={fr}
                        onChange={e => setFr(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Presión Arterial:</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="120/80"
                        value={pa}
                        onChange={e => setPa(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">TLLC (segundos):</label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        value={tllc}
                        onChange={e => setTllc(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-muted">Escala de Dolor (0 a 4):</label>
                      <select
                        className="form-select rounded-3"
                        value={escalaDolor}
                        onChange={e => setEscalaDolor(e.target.value)}
                      >
                        <option value="0">0 - Sin dolor aparente</option>
                        <option value="1">1 - Dolor leve / Molestia</option>
                        <option value="2">2 - Dolor moderado</option>
                        <option value="3">3 - Dolor severo</option>
                        <option value="4">4 - Dolor refractario extremo</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Estado de Conciencia:</label>
                    <select
                      className="form-select rounded-3"
                      value={estadoConciencia}
                      onChange={e => setEstadoConciencia(e.target.value)}
                    >
                      <option value="alerta">Alerta y responsivo</option>
                      <option value="deprimido">Deprimido / Aletargado</option>
                      <option value="estuporoso">Estuporoso (solo responde a estímulo doloroso)</option>
                      <option value="comatoso">Comatoso / No responsivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label small fw-semibold text-muted">Observaciones y Evolución Clínica:</label>
                    <textarea
                      rows="3"
                      className="form-control rounded-3"
                      placeholder="Micción, heces, respuesta a fluidos o medicamentos..."
                      value={observacionesMonitoreo}
                      onChange={e => setObservacionesMonitoreo(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer px-4 py-3 bg-body-tertiary">
                  <button type="button" className="btn btn-secondary btn-sm px-3 rounded-pill" onClick={() => setShowMonitoreoModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold">
                    Guardar Monitoreo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Calculadora */}
      <VeterinaryDoseCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
      />

      {/* Modal Firma Digital */}
      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSaveSignature={(signatureBase64) => {
          setSuccessMsg('Firma de consentimiento informada guardada correctamente.');
        }}
      />
    </div>
  );
}
