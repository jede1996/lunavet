import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { WeightChart } from '../../components/charts/WeightChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function MedicalRecordPage() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [records, setRecords] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [weights, setWeights] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [downloadingHistory, setDownloadingHistory] = useState(false);

  const handleDownloadMedicalHistoryPdf = async () => {
    setDownloadingHistory(true);
    try {
      const blob = await api.downloadBlob(`/clinical/pets/${id}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Carnet_Expediente_${pet?.nombre || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el carnet oficial: ' + err.message);
    } finally {
      setDownloadingHistory(false);
    }
  };

  useEffect(() => {
    async function loadFullRecord() {
      try {
        const [petRes, recRes, algRes, wRes, vacRes] = await Promise.all([
          api.get(`/pets/${id}`),
          api.get(`/clinical/pets/${id}/records`),
          api.get(`/clinical/pets/${id}/allergies`),
          api.get(`/clinical/pets/${id}/weight`),
          api.get(`/clinical/pets/${id}/vaccines`)
        ]);

        if (petRes.success) setPet(petRes.data);
        if (recRes.success) setRecords(recRes.data || []);
        if (algRes.success) setAllergies(algRes.data || []);
        if (wRes.success) setWeights(wRes.data || []);
        if (vacRes.success) setVaccines(vacRes.data || []);
      } catch (err) {
        console.error('Error cargando expediente:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFullRecord();
  }, [id]);

  const handleDownloadPrescriptionPdf = async (prescriptionId) => {
    setDownloadingPdfId(prescriptionId);
    try {
      const blob = await api.downloadBlob(`/clinical/prescriptions/${prescriptionId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receta_LunaVet_${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar la receta médica: ' + err.message);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Consultando expediente clínico y antecedentes..." />;
  }

  if (!pet) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">No se encontró el paciente solicitado.</div>
        <Link to="/portal/mascotas" className="btn btn-primary rounded-pill btn-sm">Regresar a Mis Mascotas</Link>
      </div>
    );
  }

  const authToken = typeof window !== 'undefined' ? (localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token')) : '';

  return (
    <div className="py-4 bg-body min-vh-100">
      <div className="container">
        {/* Cabecera del Paciente */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-body-tertiary">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center pet-avatar-ring bg-body position-relative flex-shrink-0"
                style={{ width: '70px', height: '70px', overflow: 'hidden' }}
              >
                <img
                  src={`/api/pets/${pet.id}/photo${authToken ? `?token=${authToken}` : ''}`}
                  alt={pet.nombre}
                  className="w-100 h-100 object-fit-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <i className="bi bi-person-bounding-box fs-3 text-secondary position-absolute" style={{ zIndex: 0 }}></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h3 className="fw-bold text-emphasis mb-0">{pet.nombre}</h3>
                  <span className="badge bg-primary-subtle text-primary">{pet.especie}</span>
                </div>
                <p className="text-secondary small mb-0">
                  {pet.raza || 'Mestizo'} • {pet.sexo} • Microchip: {pet.microchip || 'No asignado'}
                </p>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary rounded-pill btn-sm px-3 shadow-sm"
                onClick={handleDownloadMedicalHistoryPdf}
                disabled={downloadingHistory}
              >
                {downloadingHistory ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-medical me-1"></i> Descargar Carnet Oficial PDF
                  </>
                )}
              </button>
              <Link to="/portal/mascotas" className="btn btn-outline-secondary rounded-pill btn-sm px-3">
                <i className="bi bi-arrow-left me-1"></i> Volver a Mascotas
              </Link>
            </div>
          </div>

          {/* Alerta de Alergias Críticas */}
          {allergies.length > 0 && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0 py-2">
              <i className="bi bi-shield-exclamation fs-5 flex-shrink-0"></i>
              <div>
                <strong>Alerta Médica de Alergias Registradas:</strong>{' '}
                {allergies.map(a => `${a.alergeno} (${a.reaccion || 'moderada'})`).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Pestañas de Expediente con Bootstrap 5 */}
        <ul className="nav nav-pills mb-4 gap-2" id="recordTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button className="nav-link active rounded-pill px-4" id="consultas-tab" data-bs-toggle="pill" data-bs-target="#consultas" type="button">
              <i className="bi bi-clipboard2-pulse me-2"></i>Consultas ({records.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link rounded-pill px-4" id="vacunas-tab" data-bs-toggle="pill" data-bs-target="#vacunas" type="button">
              <i className="bi bi-shield-plus me-2"></i>Carnet Vacunación ({vaccines.length})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button className="nav-link rounded-pill px-4" id="peso-tab" data-bs-toggle="pill" data-bs-target="#peso" type="button">
              <i className="bi bi-graph-up me-2"></i>Evolución de Peso
            </button>
          </li>
        </ul>

        {/* Contenido de las Pestañas */}
        <div className="tab-content" id="recordTabsContent">
          {/* 1. Consultas Clínicas */}
          <div className="tab-pane fade show active" id="consultas" role="tabpanel">
            {records.length === 0 ? (
              <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
                <i className="bi bi-clipboard-x text-muted display-4 mb-2 d-block"></i>
                <h6 className="text-secondary">Sin consultas clínicas registradas</h6>
                <p className="small text-muted mb-0">Cuando acudas a la clínica, el veterinario registrará aquí las notas y recetas.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {records.map(rec => (
                  <div key={rec.id} className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="badge bg-primary-subtle text-primary me-2">
                          Consulta #{rec.id}
                        </span>
                        <strong className="text-dark">{rec.motivo}</strong>
                      </div>
                      <span className="text-muted small">
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(rec.fecha_consulta).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="row g-3 my-2 small">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3 h-100">
                          <strong className="text-secondary d-block mb-1">Diagnóstico Médico:</strong>
                          <p className="mb-0 text-dark">{rec.diagnostico || 'Evaluación de rutina sin hallazgos patológicos.'}</p>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3 h-100">
                          <strong className="text-secondary d-block mb-1">Tratamiento e Indicaciones:</strong>
                          <p className="mb-0 text-dark">{rec.tratamiento || 'Cuidados generales y monitoreo.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Descarga de Receta PDF si existe */}
                    {rec.receta_id && (
                      <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="small text-muted">
                          <i className="bi bi-file-earmark-check text-success me-1"></i>
                          Receta Médica Digital #{rec.receta_id} (Firma SHA-256)
                        </span>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-pill px-3"
                          disabled={downloadingPdfId === rec.receta_id}
                          onClick={() => handleDownloadPrescriptionPdf(rec.receta_id)}
                        >
                          {downloadingPdfId === rec.receta_id ? (
                            <span><span className="spinner-border spinner-border-sm me-1"></span>Generando PDF...</span>
                          ) : (
                            <span><i className="bi bi-file-pdf me-1"></i> Descargar Receta Oficial</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Carnet de Vacunación */}
          <div className="tab-pane fade" id="vacunas" role="tabpanel">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3">Carnet Oficial de Vacunación</h5>
              {vaccines.length === 0 ? (
                <p className="text-muted small mb-0">No hay vacunas aplicadas en el historial.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle small mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Vacuna / Biológico</th>
                        <th>Fecha de Aplicación</th>
                        <th>Lote</th>
                        <th>Próximo Refuerzo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccines.map(v => (
                        <tr key={v.id}>
                          <td className="fw-bold">{v.nombre_vacuna}</td>
                          <td>{new Date(v.fecha_aplicacion).toLocaleDateString()}</td>
                          <td><code>{v.lote || 'N/D'}</code></td>
                          <td>{v.fecha_proxima ? new Date(v.fecha_proxima).toLocaleDateString() : 'Sin refuerzo'}</td>
                          <td>
                            <span className="badge bg-success-subtle text-success">
                              <i className="bi bi-check-circle me-1"></i>Aplicada
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 3. Gráfica de Evolución de Peso (Chart.js) */}
          <div className="tab-pane fade" id="peso" role="tabpanel">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Serie Temporal de Peso Corporal</h5>
                <span className="badge bg-primary-subtle text-primary">Chart.js Analytics</span>
              </div>
              <p className="text-muted small mb-4">Monitorea la curva de crecimiento y peso saludable de {pet.nombre}.</p>
              <WeightChart records={weights} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
