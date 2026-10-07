import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function MedicalConsultationPage() {
  const [searchParams] = useSearchParams();
  const paramMascotaId = searchParams.get('mascotaId');

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(paramMascotaId || '');
  const [selectedPet, setSelectedPet] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Formulario de consulta
  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [peso, setPeso] = useState('');
  const [temperatura, setTemperatura] = useState('');

  // Formulario de receta médica
  const [prescribeMedicine, setPrescribeMedicine] = useState(false);
  const [medicamento, setMedicamento] = useState('');
  const [dosis, setDosis] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [generatedPrescriptionId, setGeneratedPrescriptionId] = useState(null);

  useEffect(() => {
    async function loadPetsList() {
      try {
        const res = await api.get('/pets');
        if (res.success) {
          setPets(res.data || []);
          setSelectedPetId(curr => curr || (res.data && res.data[0] ? String(res.data[0].id) : ''));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPetsList();
  }, []);

  useEffect(() => {
    async function loadPetDetails() {
      if (!selectedPetId) return;
      try {
        const [petRes, algRes] = await Promise.all([
          api.get(`/pets/${selectedPetId}`),
          api.get(`/clinical/pets/${selectedPetId}/allergies`)
        ]);
        if (petRes.success) setSelectedPet(petRes.data);
        if (algRes.success) setAllergies(algRes.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadPetDetails();
  }, [selectedPetId]);

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Guardar consulta clínica
      await api.post(`/clinical/pets/${selectedPetId}/records`, {
        motivo,
        diagnostico,
        tratamiento,
        temperatura: temperatura ? parseFloat(temperatura) : undefined
      });

      // 2. Si se ingresó peso, registrarlo en la serie temporal
      if (peso) {
        await api.post(`/clinical/pets/${selectedPetId}/weight`, {
          peso_kg: parseFloat(peso)
        });
      }

      // 3. Si se prescribe medicamento, emitir receta oficial
      let presId = null;
      if (prescribeMedicine && medicamento) {
        const presRes = await api.post(`/clinical/pets/${selectedPetId}/prescriptions`, {
          medicamentos: [
            {
              nombre: medicamento,
              dosis: dosis || 'Dosis indicada por el médico',
              frecuencia: 'Según indicaciones',
              duracion: '5 a 7 días',
              instrucciones: instrucciones || 'Administrar con alimento.'
            }
          ]
        });
        if (presRes.success) {
          presId = presRes.data.id;
          setGeneratedPrescriptionId(presId);
        }
      }

      setSuccessMsg(`¡Consulta clínica registrada exitosamente! ${presId ? `Receta #${presId} emitida.` : ''}`);
      setMotivo('');
      setDiagnostico('');
      setTratamiento('');
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar la consulta médica.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (presId) => {
    try {
      const blob = await api.downloadBlob(`/clinical/prescriptions/${presId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receta_Oficial_${presId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error descargando PDF: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparando módulo de consulta clínica..." />;
  }

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container">
        {/* Cabecera */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
          <span className="badge bg-primary-subtle text-primary mb-1 d-inline-block" style={{ width: 'fit-content' }}>
            Atención Clínica Veterinaria
          </span>
          <h2 className="fw-bold text-dark mb-3">Expediente & Consulta Médica</h2>

          {/* Selector de Paciente */}
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Seleccionar Paciente para Consulta:</label>
              <select
                className="form-select"
                value={selectedPetId}
                onChange={(e) => {
                  setSelectedPetId(e.target.value);
                  setGeneratedPrescriptionId(null);
                  setSuccessMsg(null);
                }}
              >
                {pets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.especie} • {p.raza || 'Mestizo'})
                  </option>
                ))}
              </select>
            </div>

            {selectedPet && (
              <div className="col-md-6">
                <div className="p-2 bg-light rounded-3 small">
                  <strong>Ficha Rápida:</strong> {selectedPet.nombre} • Sexo: {selectedPet.sexo} • Microchip: {selectedPet.microchip || 'N/A'} • Peso previo: {selectedPet.peso_actual || 'N/D'} kg
                </div>
              </div>
            )}
          </div>

          {/* ALERTA CRÍTICA DE ALERGIAS */}
          {allergies.length > 0 && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0 py-2">
              <i className="bi bi-shield-exclamation fs-4 flex-shrink-0"></i>
              <div>
                <strong>¡ATENCIÓN MÉDICA INMEDIATA - ALERGIAS REPORTADAS!</strong>{' '}
                {allergies.map(a => `${a.alergeno} (${a.reaccion || 'severa'})`).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Mensajes de Éxito / Error */}
        {successMsg && (
          <div className="alert alert-success d-flex justify-content-between align-items-center mb-4">
            <div><i className="bi bi-check-circle-fill me-2"></i>{successMsg}</div>
            {generatedPrescriptionId && (
              <button
                className="btn btn-outline-success btn-sm rounded-pill"
                onClick={() => handleDownloadPdf(generatedPrescriptionId)}
              >
                <i className="bi bi-file-earmark-pdf me-1"></i> Descargar Receta Oficial
              </button>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger mb-4 py-2 small">{errorMsg}</div>
        )}

        {/* Formulario de Consulta */}
        <form onSubmit={handleSaveConsultation}>
          <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3">1. Evaluación y Signos Vitales</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Peso en Consulta (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="Ej. 14.2"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="Ej. 38.5"
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-dark">Motivo de Consulta / Anamnesis</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Descripción del propietario y hallazgos iniciales..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Diagnóstico Clínico</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Diagnóstico presuntivo o definitivo..."
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Plan Terapéutico / Indicaciones</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Instrucciones clínicas, reposo, dieta..."
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Emisor de Receta Digital Oficial */}
          <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">2. Receta Médica Digital con Firma Hash SHA-256</h5>
                <small className="text-muted">Generación de PDF en memoria compatible con farmacia y cPanel</small>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="recetaSwitch"
                  checked={prescribeMedicine}
                  onChange={(e) => setPrescribeMedicine(e.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="recetaSwitch">Emitir Receta</label>
              </div>
            </div>

            {prescribeMedicine && (
              <div className="p-3 bg-light rounded-3">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Medicamento / Fármaco</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Amoxicilina + Ác. Clavulánico 250mg"
                      value={medicamento}
                      onChange={(e) => setMedicamento(e.target.value)}
                      required={prescribeMedicine}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Dosificación</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 1 tableta cada 12 horas por 7 días"
                      value={dosis}
                      onChange={(e) => setDosis(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-semibold text-dark">Instrucciones de Administración</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Administrar vía oral junto con alimento para evitar malestar gástrico."
                    value={instrucciones}
                    onChange={(e) => setInstrucciones(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary btn-lg rounded-pill shadow-sm" disabled={saving}>
              {saving ? 'Registrando Consulta...' : 'Finalizar y Guardar Consulta Clínica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
