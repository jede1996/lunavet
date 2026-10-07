import React, { useState } from 'react';

const PRESET_DRUGS = [
  { id: 'amoxicilina', nombre: 'Amoxicilina + Clavulánico', dosisMgKg: 15, concentracionMgMl: 50, via: 'Oral / SC' },
  { id: 'meloxicam_canino', nombre: 'Meloxicam (Canino)', dosisMgKg: 0.2, concentracionMgMl: 5, via: 'SC / Oral' },
  { id: 'meloxicam_felino', nombre: 'Meloxicam (Felino)', dosisMgKg: 0.05, concentracionMgMl: 0.5, via: 'Oral / SC' },
  { id: 'enrofloxacino', nombre: 'Enrofloxacino 5%', dosisMgKg: 5, concentracionMgMl: 50, via: 'Oral / SC / IM' },
  { id: 'tramadol', nombre: 'Tramadol 50mg/ml', dosisMgKg: 3, concentracionMgMl: 50, via: 'Oral / SC / IV' },
  { id: 'metronidazol', nombre: 'Metronidazol 50mg/ml', dosisMgKg: 15, concentracionMgMl: 50, via: 'Oral / IV' }
];

export default function VeterinaryDoseCalculatorModal({ isOpen, onClose, initialPatient = null }) {
  const [activeTab, setActiveTab] = useState('dosis'); // 'dosis' | 'fluidos'

  // Form Dosis
  const [especie, setEspecie] = useState(initialPatient?.especie || 'canino');
  const [raza, setRaza] = useState(initialPatient?.raza || '');
  const [pesoKg, setPesoKg] = useState(initialPatient?.peso || 10);
  const [farmacoNombre, setFarmacoNombre] = useState('Amoxicilina + Clavulánico');
  const [dosisMgKg, setDosisMgKg] = useState(15);
  const [concentracionMgMl, setConcentracionMgMl] = useState(50);

  // Form Fluidos
  const [deshidratacionPct, setDeshidratacionPct] = useState(5);
  const [tipoGotero, setTipoGotero] = useState('normogotero'); // 20 gotas/ml | microgotero 60 gotas/ml

  // Alerta contraindicaciones calculada de forma pura durante el render
  const esp = (especie || '').toLowerCase();
  const farm = (farmacoNombre || '').toLowerCase();
  const raz = (raza || '').toLowerCase();

  let contraindicacion = null;
  if (esp === 'felino' && (farm.includes('paracetamol') || farm.includes('acetaminofén'))) {
    contraindicacion = {
      nivel: 'mortal',
      titulo: '¡CONTRAINDICACIÓN ABSOLUTA EN FELINOS!',
      mensaje: 'El paracetamol produce metahemoglobinemia letal y necrosis hepática fulminante en gatos por déficit de glucuronil transferasa.'
    };
  } else if (esp === 'felino' && (farm.includes('permetrina') || farm.includes('piretroide'))) {
    contraindicacion = {
      nivel: 'mortal',
      titulo: '¡TOXICIDAD NEUROLÓGICA MORTAL EN GATOS!',
      mensaje: 'La permetrina provoca hiperexcitabilidad, temblores generalizados y convulsiones letales en felinos.'
    };
  } else if (esp === 'canino' && raz.includes('collie') && farm.includes('ivermectina')) {
    contraindicacion = {
      nivel: 'critico',
      titulo: '¡ALERTA MUTACIÓN MDR1 (Collie / Pastoreo)!',
      mensaje: 'Riesgo extremo de neurotoxicidad, ataxia, coma y paro respiratorio por deficiencia de glicoproteína P.'
    };
  }

  if (!isOpen) return null;

  // Cálculos farmacológicos
  const pesoNum = parseFloat(pesoKg) || 0;
  const dosisNum = parseFloat(dosisMgKg) || 0;
  const concNum = parseFloat(concentracionMgMl) || 1;

  const dosisTotalMg = parseFloat((pesoNum * dosisNum).toFixed(2));
  const volumenTotalMl = concNum > 0 ? parseFloat((dosisTotalMg / concNum).toFixed(2)) : 0;

  // Cálculos fluidoterapia
  const mlPorKgDia = especie === 'felino' ? 40 : 50;
  const mantenimientoMl = Math.round(pesoNum * mlPorKgDia);
  const reposicionMl = Math.round((parseFloat(deshidratacionPct) / 100) * pesoNum * 1000);
  const totalFluidos24h = mantenimientoMl + reposicionMl;
  const flujoMlHora = parseFloat((totalFluidos24h / 24).toFixed(1));
  const factorGotero = tipoGotero === 'microgotero' ? 60 : 20;
  const gotasPorMinuto = Math.round((flujoMlHora * factorGotero) / 60);

  const handleSelectPreset = (preset) => {
    setFarmacoNombre(preset.nombre);
    setDosisMgKg(preset.dosisMgKg);
    setConcentracionMgMl(preset.concentracionMgMl);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-calculator text-primary fs-5"></i>
              <h5 className="modal-title fw-bold mb-0">Calculadora Farmacológica y Fluidoterapia Veterinaria</h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body p-4">
            {/* Tabs Selector */}
            <ul className="nav nav-pills nav-fill mb-4 p-1 bg-body-tertiary rounded-pill">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link rounded-pill py-2 fw-semibold ${activeTab === 'dosis' ? 'active shadow-sm' : ''}`}
                  onClick={() => setActiveTab('dosis')}
                >
                  <i className="bi bi-capsule me-2"></i> Dosificación de Fármacos
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link rounded-pill py-2 fw-semibold ${activeTab === 'fluidos' ? 'active shadow-sm' : ''}`}
                  onClick={() => setActiveTab('fluidos')}
                >
                  <i className="bi bi-droplet-half me-2"></i> Fluidoterapia e Infusión
                </button>
              </li>
            </ul>

            {/* Banner de Contraindicación Crítica */}
            {contraindicacion && (
              <div className={`alert ${contraindicacion.nivel === 'mortal' ? 'alert-danger border-danger' : 'alert-warning border-warning'} d-flex align-items-start gap-3 rounded-4 mb-4 shadow-sm animate__animated animate__shakeX`}>
                <i className={`bi ${contraindicacion.nivel === 'mortal' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-exclamation-circle-fill text-warning'} fs-3 mt-1`}></i>
                <div>
                  <h6 className="fw-bold mb-1">{contraindicacion.titulo}</h6>
                  <p className="small mb-0">{contraindicacion.mensaje}</p>
                </div>
              </div>
            )}

            {/* Parámetros Básicos del Paciente */}
            <div className="card border-0 bg-body-tertiary rounded-4 p-3 mb-4">
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Especie:</label>
                  <select
                    className="form-select rounded-3"
                    value={especie}
                    onChange={e => setEspecie(e.target.value)}
                  >
                    <option value="canino">🐕 Canino (Perro)</option>
                    <option value="felino">🐈 Felino (Gato)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Raza (MDR1 check):</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    placeholder="Ej. Collie, Golden, Mestizo..."
                    value={raza}
                    onChange={e => setRaza(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Peso del Paciente (kg):</label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-control rounded-start-3 fw-bold"
                      value={pesoKg}
                      onChange={e => setPesoKg(e.target.value)}
                    />
                    <span className="input-group-text rounded-end-3">kg</span>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === 'dosis' ? (
              <div>
                {/* Presets Rápidos */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-2">Fármacos Frecuentes:</label>
                  <div className="d-flex flex-wrap gap-2">
                    {PRESET_DRUGS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`btn btn-sm rounded-pill ${farmacoNombre === p.nombre ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handleSelectPreset(p)}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulario Dosis */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Nombre del Medicamento:</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={farmacoNombre}
                      onChange={e => setFarmacoNombre(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Dosis Deseada (mg/kg):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control rounded-3"
                      value={dosisMgKg}
                      onChange={e => setDosisMgKg(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted">Concentración (mg/ml):</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.01"
                      className="form-control rounded-3"
                      value={concentracionMgMl}
                      onChange={e => setConcentracionMgMl(e.target.value)}
                    />
                  </div>
                </div>

                {/* Resultado de Dosis */}
                <div className="card border-0 bg-primary bg-opacity-10 rounded-4 p-4 text-center">
                  <div className="row">
                    <div className="col-6 border-end">
                      <span className="text-muted small text-uppercase fw-bold">Dosis Total Activa</span>
                      <h3 className="text-primary fw-bolder mt-1 mb-0">{dosisTotalMg} <span className="fs-6">mg</span></h3>
                      <small className="text-muted">({pesoNum} kg × {dosisNum} mg/kg)</small>
                    </div>
                    <div className="col-6">
                      <span className="text-muted small text-uppercase fw-bold">Volumen a Administrar</span>
                      <h3 className="text-success fw-bolder mt-1 mb-0">{volumenTotalMl} <span className="fs-6">ml</span></h3>
                      <small className="text-muted">({dosisTotalMg} mg ÷ {concNum} mg/ml)</small>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Formulario Fluidoterapia */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Deshidratación Estimada (%):</label>
                    <select
                      className="form-select rounded-3"
                      value={deshidratacionPct}
                      onChange={e => setDeshidratacionPct(e.target.value)}
                    >
                      <option value="0">0% - Sin deshidratación aparente (Mantenimiento)</option>
                      <option value="5">5% - Leve (Pérdida de turgencia cutánea sutil)</option>
                      <option value="7">7% - Moderada (TLLC &gt; 2s, mucosas secas)</option>
                      <option value="10">10% - Severa (Ojos hundidos, shock hipovolémico)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Equipo de Perfusión:</label>
                    <select
                      className="form-select rounded-3"
                      value={tipoGotero}
                      onChange={e => setTipoGotero(e.target.value)}
                    >
                      <option value="normogotero">Normogotero Estándar (20 gotas = 1 ml)</option>
                      <option value="microgotero">Microgotero Pediátrico / UCI (60 gotas = 1 ml)</option>
                    </select>
                  </div>
                </div>

                {/* Resultado Fluidoterapia */}
                <div className="card border-0 bg-info bg-opacity-10 rounded-4 p-4">
                  <div className="row g-3 text-center">
                    <div className="col-md-4 border-end">
                      <span className="text-muted small text-uppercase fw-bold">Volumen 24 Horas</span>
                      <h3 className="text-info fw-bolder mt-1 mb-0">{totalFluidos24h} <span className="fs-6">ml/día</span></h3>
                      <small className="text-muted">Mantenimiento: {mantenimientoMl} ml + Pérdida: {reposicionMl} ml</small>
                    </div>
                    <div className="col-md-4 border-end">
                      <span className="text-muted small text-uppercase fw-bold">Velocidad de Infusión</span>
                      <h3 className="text-primary fw-bolder mt-1 mb-0">{flujoMlHora} <span className="fs-6">ml/h</span></h3>
                      <small className="text-muted">Tasa constante por bomba</small>
                    </div>
                    <div className="col-md-4">
                      <span className="text-muted small text-uppercase fw-bold">Frecuencia de Goteo</span>
                      <h3 className="text-success fw-bolder mt-1 mb-0">{gotasPorMinuto} <span className="fs-6">gotas/min</span></h3>
                      <small className="text-muted">~ 1 gota cada {gotasPorMinuto > 0 ? (60 / gotasPorMinuto).toFixed(1) : 0} seg</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer px-4 py-3 bg-body-tertiary">
            <button type="button" className="btn btn-secondary btn-sm px-4 rounded-pill" onClick={onClose}>
              Cerrar Calculadora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
