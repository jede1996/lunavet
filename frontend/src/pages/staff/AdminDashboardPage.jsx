import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { RevenueChart, AppointmentsStatusChart } from '../../components/charts/MetricsChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [dashRes, finRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/reports/financial')
        ]);
        if (dashRes.success) setDashboard(dashRes.data);
        if (finRes.success) setFinancial(finRes.data);
      } catch (err) {
        console.error('Error cargando métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Generando dashboard ejecutivo y métricas en tiempo real..." />;
  }

  const kpis = dashboard?.resumen || {};
  const appointmentsToday = dashboard?.citas_hoy || {};

  return (
    <div className="py-4 min-vh-100">
      <div className="container-fluid px-lg-5">
        {/* Encabezado */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1" style={{ fontSize: '11px' }}>Administración Ejecutiva</span>
              <span className="text-secondary small">• Centro de Mando</span>
            </div>
            <h2 className="fw-bold mb-0 text-emphasis">Dashboard & Analítica (LunaVet v4.0)</h2>
          </div>
          <div className="d-flex gap-2">
            <Link to="/staff/pos" className="btn btn-success btn-sm rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1">
              <i className="bi bi-shop"></i>
              <span>Abrir POS</span>
            </Link>
            <Link to="/admin/reportes" className="btn btn-primary rounded-pill btn-sm px-3 fw-semibold shadow-sm d-flex align-items-center gap-1">
              <i className="bi bi-file-earmark-bar-graph"></i>
              <span>Reportes</span>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-xl-3">
            <div className="card border-0 rounded-4 p-3 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-primary-subtle text-primary p-3 rounded-3">
                  <i className="bi bi-currency-dollar fs-3"></i>
                </div>
                <div>
                  <small className="text-secondary d-block">Ingresos del Mes</small>
                  <h4 className="fw-bold mb-0 text-emphasis">${parseFloat(kpis.ingresos_mes || 0).toFixed(2)}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-xl-3">
            <div className="card border-0 rounded-4 p-3 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-calendar2-week fs-3"></i>
                </div>
                <div>
                  <small className="text-secondary d-block">Citas para Hoy</small>
                  <h4 className="fw-bold mb-0 text-emphasis">{kpis.citas_hoy_total || 0}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-xl-3">
            <div className="card border-0 rounded-4 p-3 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-success-subtle text-success p-3 rounded-3">
                  <i className="bi bi-heart-pulse fs-3"></i>
                </div>
                <div>
                  <small className="text-secondary d-block">Pacientes Registrados</small>
                  <h4 className="fw-bold mb-0 text-emphasis">{kpis.pacientes_activos || 0}</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-xl-3">
            <div className="card border-0 rounded-4 p-3 h-100">
              <div className="d-flex align-items-center gap-3">
                <div className="badge bg-warning-subtle text-warning p-3 rounded-3">
                  <i className="bi bi-exclamation-triangle fs-3"></i>
                </div>
                <div>
                  <small className="text-secondary d-block">Lotes FEFO en Riesgo</small>
                  <h4 className="fw-bold mb-0 text-emphasis">{kpis.inventario_en_riesgo || 0}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficas con Chart.js */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="card border-0 rounded-4 p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-emphasis mb-0">Distribución de Ingresos por Método de Pago</h5>
                <span className="badge bg-primary-subtle text-primary">Finanzas</span>
              </div>
              <p className="text-secondary small mb-3">Ticket promedio actual: ${parseFloat(financial?.ticket_promedio || 0).toFixed(2)} MXN</p>
              <RevenueChart paymentsByMethod={financial?.desglose_metodos || { efectivo: 3500, tarjeta: 8200, spei: 4100, mercadopago: 6400 }} />
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card border-0 rounded-4 p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-emphasis mb-0">Estatus de Citas Clínicas</h5>
                <span className="badge bg-info-subtle text-info">Clínica</span>
              </div>
              <p className="text-secondary small mb-3">Monitoreo de flujo y tasa de completación del día de hoy.</p>
              <AppointmentsStatusChart countsByStatus={appointmentsToday} />
            </div>
          </div>
        </div>

        {/* Paneles de Acceso Rápido Estructurados */}
        <div className="row g-4 mb-4">
          {/* Panel Clínico & Mostrador */}
          <div className="col-12 col-xl-6">
            <div className="card border-0 rounded-4 p-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="badge bg-danger-subtle text-danger p-2 rounded-2">
                    <i className="bi bi-hospital"></i>
                  </div>
                  <h6 className="fw-bold mb-0 text-emphasis">Operación Clínica & Pacientes</h6>
                </div>
                <span className="badge bg-body-tertiary text-secondary border">Mostrador & UCI</span>
              </div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Link to="/staff/hospitalizacion" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-hospital fs-3 text-danger"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Hospitalización UCI</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Mapa de jaulas y triage</small>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-sm-6">
                  <Link to="/staff/pos" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-shop fs-3 text-success"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Punto de Venta (POS)</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Cobro y arqueo de caja</small>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-sm-6">
                  <Link to="/staff/agenda" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-calendar-week fs-3 text-primary"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Agenda Médica</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Citas y quirófano</small>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-sm-6">
                  <Link to="/staff/recordatorios" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-bell fs-3 text-warning"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Recordatorios & Post-Op</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Vacunas y seguimiento 48h</small>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Administrativo & Cumplimiento */}
          <div className="col-12 col-xl-6">
            <div className="card border-0 rounded-4 p-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="badge bg-primary-subtle text-primary p-2 rounded-2">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h6 className="fw-bold mb-0 text-emphasis">Gestión Administrativa & Control</h6>
                </div>
                <span className="badge bg-body-tertiary text-secondary border">Auditoría & Ley</span>
              </div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <Link to="/admin/staff" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-people-fill fs-3 text-info"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Gestión de Personal</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Médicos y roles</small>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-sm-6">
                  <Link to="/staff/controlados" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-shield-check fs-3 text-warning"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Libro SENASICA</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Controlados foliados</small>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-sm-6">
                  <Link to="/admin/inventario" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-boxes fs-3 text-primary"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Inventario FEFO</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Lotes y caducidades</small>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-sm-6">
                  <Link to="/admin/cms" className="card p-3 text-decoration-none border h-100 hover-card">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-palette fs-3 text-secondary"></i>
                      <div>
                        <strong className="d-block text-emphasis small">Gestor CMS & Marca</strong>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>Identidad y contenido</small>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
