import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VerifyPrescriptionPage() {
  const { folio } = useParams();
  const { t, isEnglish } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/clinical/prescriptions/verify/${encodeURIComponent(folio)}`);
        const json = await res.json();
        if (res.ok && json.data) {
          setData(json.data);
        } else {
          setError(json.message || (isEnglish ? 'No official record found for this prescription folio.' : 'No se encontró un registro oficial correspondiente a este folio de receta.'));
        }
      } catch {
        setError(isEnglish ? 'Connection error with Luna-Vet verification server.' : 'Error de conexión con el servidor de validación de Luna-Vet.');
      } finally {
        setLoading(false);
      }
    };

    if (folio) {
      verify();
    }
  }, [folio, isEnglish]);

  return (
    <div className="container py-5 px-3">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-8">
          {/* Header de Verificación */}
          <div className="text-center mb-4">
            <Link to="/" className="text-decoration-none">
              <span className="fs-2 fw-bolder text-primary">Luna-Vet</span>
              <span className="d-block small text-muted text-uppercase tracking-wider">
                {t('prescriptionVerify.systemTitle', 'Sistema Oficial de Verificación de Recetas Médicas Digitales')}
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-body">
              <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
              <h5 className="fw-bold">{t('prescriptionVerify.validating', 'Validando autenticidad criptográfica...')}</h5>
              <p className="text-muted small mb-0">{t('prescriptionVerify.validatingSub', 'Consultando libro oficial de emisiones clínicas.')}</p>
            </div>
          ) : error ? (
            <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-body">
              <i className="bi bi-shield-x text-danger fs-1 mb-3"></i>
              <h4 className="fw-bold text-danger">{t('prescriptionVerify.invalidTitle', 'Receta Médica No Válida o Inexistente')}</h4>
              <p className="text-muted mb-4">{error}</p>
              <div>
                <Link to="/" className="btn btn-outline-primary rounded-pill px-4">
                  {t('prescriptionVerify.backHome', 'Ir al Inicio')}
                </Link>
              </div>
            </div>
          ) : data && (
            <div className="card border-0 rounded-4 shadow-lg overflow-hidden bg-body">
              {/* Status Banner */}
              <div className={`p-4 text-center text-white ${data.esVigente ? 'bg-success' : 'bg-danger'}`}>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <i className={`bi ${data.esVigente ? 'bi-shield-check' : 'bi-shield-exclamation'} fs-2`}></i>
                  <h4 className="fw-bolder mb-0">
                    {data.esVigente
                      ? (isEnglish ? 'AUTHENTIC & ACTIVE DIGITAL VETERINARY PRESCRIPTION' : 'RECETA MÉDICA DIGITAL AUTÉNTICA Y VIGENTE')
                      : (isEnglish ? 'EXPIRED OR INACTIVE PRESCRIPTION' : 'RECETA EXPIRADA O INACTIVA')}
                  </h4>
                </div>
                <div className="small opacity-90">
                  {data.esVigente
                    ? (isEnglish ? `Valid for ${data.diasRestantes} more day(s) (Expires: ${data.fechaVencimiento})` : `Vigente por ${data.diasRestantes} día(s) más (Vence: ${data.fechaVencimiento})`)
                    : (isEnglish ? `The official validity of ${data.vigenciaDias} days has ended.` : `La vigencia oficial de ${data.vigenciaDias} días ha concluido.`)}
                </div>
              </div>

              <div className="card-body p-4 p-md-5">
                {/* Folio y Detalles Emisión */}
                <div className="row g-3 mb-4 pb-3 border-bottom">
                  <div className="col-sm-6">
                    <span className="text-muted small text-uppercase fw-bold">
                      {isEnglish ? 'Cryptographic Folio:' : 'Folio Criptográfico:'}
                    </span>
                    <div className="fs-5 fw-bold font-monospace text-primary">{data.folio}</div>
                  </div>
                  <div className="col-sm-6 text-sm-end">
                    <span className="text-muted small text-uppercase fw-bold">
                      {isEnglish ? 'Issue Date:' : 'Fecha de Emisión:'}
                    </span>
                    <div className="fs-6 fw-semibold">{data.fechaEmision}</div>
                  </div>
                </div>

                {/* Médico y Paciente */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 bg-body-tertiary rounded-3 p-3 h-100">
                      <span className="text-muted small text-uppercase fw-bold mb-1">
                        <i className="bi bi-person-badge me-1"></i> {isEnglish ? 'Doctor of Veterinary Medicine (DVM)' : 'Médico Veterinario Zootecnista'}
                      </span>
                      <h6 className="fw-bold mb-1">{data.veterinario?.nombreCompleto}</h6>
                      <div className="small text-muted">
                        {isEnglish ? 'License #:' : 'Cédula Profesional:'} <strong>{data.veterinario?.cedulaProfesional}</strong>
                      </div>
                      <div className="small text-muted mt-1">{data.entidadEmisora}</div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card border-0 bg-body-tertiary rounded-3 p-3 h-100">
                      <span className="text-muted small text-uppercase fw-bold mb-1">
                        <i className="bi bi-heart me-1 text-danger"></i> {isEnglish ? 'Veterinary Patient' : 'Paciente Veterinario'}
                      </span>
                      <h6 className="fw-bold mb-1">{data.paciente?.nombre}</h6>
                      <div className="small text-muted">
                        {isEnglish ? 'Species:' : 'Especie:'} <strong className="text-capitalize">{data.paciente?.especie}</strong> • {isEnglish ? 'Breed:' : 'Raza:'} {data.paciente?.raza || (isEnglish ? 'Mixed' : 'Mestizo')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medicamentos Prescritos */}
                <div className="mb-4">
                  <h6 className="fw-bold text-uppercase small text-muted mb-3">
                    <i className="bi bi-capsule me-1 text-primary"></i> {isEnglish ? 'Prescribed Medications' : 'Medicamentos Prescritos'}
                  </h6>
                  <div className="table-responsive border rounded-3">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-body-tertiary small text-muted">
                        <tr>
                          <th className="ps-3">{isEnglish ? 'Medication' : 'Medicamento'}</th>
                          <th>{isEnglish ? 'Dose & Frequency' : 'Dosis & Frecuencia'}</th>
                          <th>{isEnglish ? 'Duration' : 'Duración'}</th>
                          <th className="text-end pe-3">{isEnglish ? 'Qty' : 'Cant. Surtir'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.medicamentos?.map((item, i) => (
                          <tr key={i}>
                            <td className="ps-3">
                              <div className="fw-bold">{item.nombreMedicamento}</div>
                              {item.indicaciones && (
                                <div className="small text-muted fst-italic">{item.indicaciones}</div>
                              )}
                            </td>
                            <td className="small">{item.dosis} • {item.frecuencia}</td>
                            <td className="small">{item.duracionDias} {isEnglish ? 'days' : 'días'}</td>
                            <td className="text-end pe-3 fw-bold">{item.cantidadPrescrita} {isEnglish ? 'units' : 'unid.'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sello de Seguridad */}
                <div className="card border-0 bg-dark text-light rounded-3 p-3 small">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-fingerprint text-success fs-5"></i>
                    <span className="fw-bold text-success">
                      {isEnglish ? 'Cryptographic HMAC-SHA256 Digital Seal:' : 'Sello Digital Criptográfico HMAC-SHA256:'}
                    </span>
                  </div>
                  <code className="text-break text-light font-monospace opacity-75" style={{ fontSize: '0.78rem' }}>
                    {data.selloCriptografico}
                  </code>
                </div>
              </div>

              <div className="card-footer bg-body-tertiary px-4 py-3 d-flex justify-content-between align-items-center small text-muted">
                <span>© 2026 Luna-Vet • {isEnglish ? 'Animal Pharmaceutical Safety' : 'Seguridad Farmacéutica Animal'}</span>
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => window.print()}>
                  <i className="bi bi-printer me-1"></i> {t('common.print', 'Imprimir Comprobante')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
