import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { RevenueChart } from '../../components/charts/MetricsChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AdminReportsPage() {
  const [financial, setFinancial] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [finRes, prodRes] = await Promise.all([
          api.get('/admin/reports/financial'),
          api.get('/admin/reports/clinical-productivity')
        ]);
        if (finRes.success) setFinancial(finRes.data);
        if (prodRes.success) setProductivity(prodRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculando agregaciones de reportes financieros y clínicos..." />;
  }

  const topProducts = financial?.top_productos || [];
  const vetProductivity = productivity?.productividad_veterinarios || [];

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container-fluid px-lg-5">
        <div className="mb-4">
          <span className="badge bg-primary-subtle text-primary mb-1">Métricas y Rendimiento</span>
          <h2 className="fw-bold text-dark mb-0">Reportes Ejecutivos & Financieros</h2>
        </div>

        {/* Reporte Financiero */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3">Distribución de Ingresos por Método de Pago</h5>
              <p className="text-muted small mb-2">Ingresos Totales Acumulados: <strong>${parseFloat(financial?.ingresos_totales || 0).toFixed(2)} MXN</strong></p>
              <RevenueChart paymentsByMethod={financial?.desglose_metodos || {}} />
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3">Top 5 Productos Más Vendidos</h5>
              {topProducts.length === 0 ? (
                <p className="text-muted small">Sin ventas registradas en el período.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle small mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Unidades</th>
                        <th className="text-end">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((tp, idx) => (
                        <tr key={idx}>
                          <td><strong>{tp.nombre}</strong></td>
                          <td className="text-center"><span className="badge bg-secondary-subtle text-secondary">{tp.unidades_vendidas} u</span></td>
                          <td className="text-end fw-bold text-primary">${parseFloat(tp.ingresos_generados).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Productividad Médica */}
        <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
          <h5 className="fw-bold text-dark mb-3">Productividad Clínica por Médico Veterinario</h5>
          {vetProductivity.length === 0 ? (
            <p className="text-muted small mb-0">Sin citas atendidas en el período seleccionado.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Veterinario</th>
                    <th>Cédula Profesional</th>
                    <th className="text-center">Citas Atendidas</th>
                    <th className="text-center">Tasa de Cancelación</th>
                    <th className="text-center">Recetas Emitidas</th>
                  </tr>
                </thead>
                <tbody>
                  {vetProductivity.map((vp, idx) => (
                    <tr key={idx}>
                      <td><strong>Dr. {vp.veterinario_nombre}</strong></td>
                      <td><code>{vp.cedula_profesional || 'N/D'}</code></td>
                      <td className="text-center"><span className="badge bg-primary">{vp.citas_atendidas}</span></td>
                      <td className="text-center">{vp.tasa_cancelacion ? `${vp.tasa_cancelacion}%` : '0%'}</td>
                      <td className="text-center"><span className="badge bg-success-subtle text-success">{vp.recetas_emitidas || 0}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
