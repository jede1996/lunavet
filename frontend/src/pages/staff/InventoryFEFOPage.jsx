import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function InventoryFEFOPage() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      const res = await api.get('/admin/reports/inventory-risk');
      if (res.success) setRiskData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/admin/reports/inventory-risk')
      .then(res => {
        if (active && res.success) setRiskData(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Auditando inventario por lotes y caducidades (FEFO)..." />;
  }

  const expiredLots = riskData?.lotesVencidos || riskData?.lotes_caducados || [];
  const nearExpiryLots = riskData?.lotesPorVencer || riskData?.lotes_proximos_caducar || [];
  const lowStock = riskData?.lotesBajoStock || riskData?.productos_stock_bajo || [];

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container-fluid px-lg-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <span className="badge bg-primary-subtle text-primary mb-1">Control de Calidad Sanitaria</span>
            <h2 className="fw-bold text-dark mb-0">Inventario FEFO (First-Expired-First-Out)</h2>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={loadInventory}>
            <i className="bi bi-arrow-clockwise me-1"></i> Re-auditar Lotes
          </button>
        </div>

        {/* Resumen de Alertas */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-danger-subtle text-danger p-3 rounded-3">
                  <i className="bi bi-calendar-x fs-3"></i>
                </div>
                <div>
                  <small className="text-muted d-block">Lotes Caducados</small>
                  <h4 className="fw-bold mb-0 text-danger">{expiredLots.length}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-warning-subtle text-warning p-3 rounded-3">
                  <i className="bi bi-hourglass-split fs-3"></i>
                </div>
                <div>
                  <small className="text-muted d-block">Por Vencer (&lt; 30 días)</small>
                  <h4 className="fw-bold mb-0 text-warning">{nearExpiryLots.length}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-box-seam fs-3"></i>
                </div>
                <div>
                  <small className="text-muted d-block">Productos con Stock Bajo</small>
                  <h4 className="fw-bold mb-0 text-info">{lowStock.length}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Lotes Próximos a Vencer */}
        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
          <h5 className="fw-bold text-dark mb-3">Lotes Próximos a Caducar (Atención Prioritaria)</h5>
          {nearExpiryLots.length === 0 ? (
            <div className="text-muted small">No hay lotes en ventana crítica de vencimiento.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Lote</th>
                    <th>Producto</th>
                    <th>Existencias</th>
                    <th>Fecha Caducidad</th>
                    <th>Estado Sanitario</th>
                  </tr>
                </thead>
                <tbody>
                  {nearExpiryLots.map((l, i) => (
                    <tr key={i}>
                      <td><code>{l.numeroLote || l.codigo_lote || l.lote}</code></td>
                      <td><strong>{l.productoNombre || l.producto_nombre}</strong></td>
                      <td>{l.stockDisponible ?? l.stock_actual} unidades</td>
                      <td>{new Date(l.fechaCaducidad || l.fecha_caducidad).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-exclamation-triangle me-1"></i>Expira Pronto
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla de Lotes Caducados */}
        {expiredLots.length > 0 && (
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h5 className="fw-bold text-danger mb-3">Lotes Caducados (Bloqueados para Venta)</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Lote</th>
                    <th>Producto</th>
                    <th>Stock Bloqueado</th>
                    <th>Fecha Expiración</th>
                    <th>Acción Requerida</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredLots.map((l, i) => (
                    <tr key={i}>
                      <td><code>{l.numeroLote || l.codigo_lote || l.lote}</code></td>
                      <td><strong>{l.productoNombre || l.producto_nombre}</strong></td>
                      <td className="text-danger fw-bold">{l.stockDisponible ?? l.stock_actual} unidades</td>
                      <td>{new Date(l.fechaCaducidad || l.fecha_caducidad).toLocaleDateString()}</td>
                      <td><span className="badge bg-danger">Baja Sanitaria Obligatoria</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
