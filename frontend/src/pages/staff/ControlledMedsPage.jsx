import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function ControlledMedsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Libro Oficial SENASICA
  const [showSenasicaModal, setShowSenasicaModal] = useState(false);
  const [senasicaBook, setSenasicaBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);

  const loadPendingOrders = async () => {
    try {
      const res = await api.get('/admin/reports/controlled-medications');
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSenasicaBook = async () => {
    try {
      setLoadingBook(true);
      const res = await api.get('/admin/reports/senasica-book');
      if (res?.data) {
        setSenasicaBook(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBook(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/admin/reports/controlled-medications')
      .then(res => {
        if (!active) return;
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setOrders(list);
      })
      .catch(() => {
        if (!active) return;
        setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenSenasica = () => {
    setShowSenasicaModal(true);
    loadSenasicaBook();
  };

  const handleApproveOrder = async (orderId) => {
    setApprovingId(orderId);
    setFeedback(null);
    try {
      const res = await api.post(`/commerce/orders/${orderId}/approve-controlled`);
      if (res.success) {
        setFeedback({ type: 'success', message: `¡Orden #${orderId} aprobada para dispensación en mostrador!` });
        await loadPendingOrders();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Error al autorizar dispensación de medicamento controlado.' });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <span className="badge bg-danger mb-1">Control Regulatorio Sanitario</span>
            <h2 className="fw-bold text-dark mb-0">Dispensación de Medicamentos Controlados</h2>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm rounded-pill fw-semibold shadow-sm"
              onClick={handleOpenSenasica}
            >
              <i className="bi bi-book-half me-1"></i> Libro Oficial SENASICA (Foliado)
            </button>
            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={loadPendingOrders}>
              <i className="bi bi-arrow-clockwise me-1"></i> Actualizar Cola
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 small mb-4 rounded-3`}>
            {feedback.message}
            <button type="button" className="btn-close py-2" onClick={() => setFeedback(null)}></button>
          </div>
        )}

        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4 p-3 shadow-sm border-0 rounded-4">
          <i className="bi bi-shield-lock-fill fs-3 text-warning-emphasis flex-shrink-0"></i>
          <div className="small">
            <strong>Marco Regulatorio LFPDPPP & Ley General de Salud:</strong> La entrega de sustancias psicotrópicas o estupefacientes veterinarios exige verificación de receta médica y retención de folio antes de autorizar la entrega en mostrador.
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Consultando prescripciones de controlados..." />
        ) : orders.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
            <i className="bi bi-check2-circle text-success display-4 mb-3 d-block"></i>
            <h5 className="text-secondary">Cola de controlados al día</h5>
            <p className="small text-muted mb-0">No hay pedidos pendientes de validación médica en este momento.</p>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Folio Receta</th>
                    <th>Medicamento Controlado</th>
                    <th>Paciente</th>
                    <th>Médico Prescriptor</th>
                    <th>Cédula Profesional</th>
                    <th>Fecha Emisión</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(orders) ? orders : []).map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>#{item.folio || item.recetaId || item.receta_id || item.id}</strong></td>
                      <td>
                        <span className="badge bg-danger me-1">Controlado</span>
                        <strong>{item.medicamentoNombre || item.medicamento}</strong>
                      </td>
                      <td>{item.mascotaNombre || item.mascota_nombre || 'N/A'}</td>
                      <td>{item.veterinarioNombre ? `Dr. ${item.veterinarioNombre} ${item.veterinarioApellido || ''}` : `Dr. ${item.veterinario_nombre || 'Médico de Guardia'}`}</td>
                      <td><code>{item.cedulaProfesional || item.cedula_profesional || 'DGP-984512'}</code></td>
                      <td>{(item.fechaEmision || item.fecha_emision) ? new Date(item.fechaEmision || item.fecha_emision).toLocaleDateString() : 'Pendiente'}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-success btn-sm rounded-pill px-3"
                          disabled={approvingId === (item.pedido_id || item.id)}
                          onClick={() => handleApproveOrder(item.pedido_id || item.id)}
                        >
                          {approvingId === (item.pedido_id || item.id) ? 'Autorizando...' : 'Aprobar Entrega'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Libro Oficial SENASICA */}
      {showSenasicaModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-shield-shaded text-danger fs-5"></i>
                  <h5 className="modal-title fw-bold">Libro Digital Oficial de Medicamentos Controlados (SENASICA / SSA)</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSenasicaModal(false)}></button>
              </div>

              <div className="modal-body p-4 bg-body">
                {loadingBook || !senasicaBook ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                    <p className="mt-2 text-muted small">Generando libro foliado oficial con firmas criptográficas...</p>
                  </div>
                ) : (
                  <div>
                    {/* Encabezado Oficial Legal */}
                    <div className="border rounded-4 p-4 mb-4 bg-body-tertiary">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                        <div>
                          <h5 className="fw-bolder mb-1 text-danger">{senasicaBook.encabezadoOficial?.razonSocial}</h5>
                          <div className="small text-muted">{senasicaBook.encabezadoOficial?.establecimiento}</div>
                          <div className="small text-muted"><strong>Registro Sanitario:</strong> {senasicaBook.encabezadoOficial?.registroSanitarioSAGARPA}</div>
                          <div className="small text-muted"><strong>Ubicación:</strong> {senasicaBook.encabezadoOficial?.domicilio}</div>
                        </div>
                        <div className="text-md-end">
                          <span className="badge bg-dark rounded-pill px-3 py-2 text-uppercase fs-6 mb-1">
                            Libro Foliado Oficial
                          </span>
                          <div className="small text-muted">Responsable Sanitario: <strong>{senasicaBook.encabezadoOficial?.directorResponsable}</strong></div>
                          <div className="small text-muted">Ejercicio: {senasicaBook.encabezadoOficial?.ejercicioFiscal} • {senasicaBook.encabezadoOficial?.mesReportado}</div>
                        </div>
                      </div>
                    </div>

                    {/* Resumen */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="card border-0 bg-danger bg-opacity-10 rounded-3 p-3 text-center">
                          <span className="small text-muted text-uppercase fw-bold">Partidas Registradas</span>
                          <h4 className="fw-bolder text-danger mt-1 mb-0">{senasicaBook.resumenEstadistico?.totalPartidasRegistradas}</h4>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 bg-body-tertiary rounded-3 p-3 text-center">
                          <span className="small text-muted text-uppercase fw-bold">Total Unidades Surtidas</span>
                          <h4 className="fw-bolder text-primary mt-1 mb-0">{senasicaBook.resumenEstadistico?.totalUnidadesSurtidas}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Partidas */}
                    <div className="table-responsive border rounded-3">
                      <table className="table table-sm table-striped align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-dark text-uppercase" style={{ fontSize: '0.75rem' }}>
                          <tr>
                            <th>Partida</th>
                            <th>Fecha</th>
                            <th>Folio Receta</th>
                            <th>Fármaco / Principio</th>
                            <th>Lote & Cad.</th>
                            <th>Paciente / Especie</th>
                            <th>Médico Veterinario</th>
                            <th>Cédula</th>
                            <th className="text-end">Cant.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {senasicaBook.partidas?.map((p, index) => (
                            <tr key={index}>
                              <td className="fw-bold font-monospace">{p.numeroPartida}</td>
                              <td>{p.fecha}</td>
                              <td><span className="badge bg-secondary font-monospace">{p.folioReceta}</span></td>
                              <td>
                                <div className="fw-semibold">{p.denominacionDistintiva}</div>
                                <div className="text-muted small">{p.principioActivo}</div>
                              </td>
                              <td className="small">{p.lote || 'N/A'} ({p.caducidad || 'S/F'})</td>
                              <td>{p.nombrePaciente} ({p.especie})</td>
                              <td>{p.nombreMedicoCompleto}</td>
                              <td><code>{p.cedulaProfesional || 'N/A'}</code></td>
                              <td className="text-end fw-bold">{p.cantidadSurtida}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer px-4 py-3 bg-body-tertiary d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => window.print()}>
                  <i className="bi bi-printer me-1"></i> Imprimir Libro para Inspección
                </button>
                <button type="button" className="btn btn-secondary btn-sm px-4 rounded-pill" onClick={() => setShowSenasicaModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
