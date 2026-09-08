import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AuditExplorerPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      const logsList = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.logs)
        ? res.data.logs
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setLogs(logsList);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter(l => {
    const term = searchTerm.toLowerCase();
    const user = l.usuarioNombre || l.usuario_nombre || '';
    const ip = l.ipOrigen || l.ip_origen || '';
    return (l.accion && l.accion.toLowerCase().includes(term)) ||
           (l.entidad && l.entidad.toLowerCase().includes(term)) ||
           user.toLowerCase().includes(term) ||
           ip.toLowerCase().includes(term);
  });

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container-fluid px-lg-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <span className="badge bg-secondary-subtle text-secondary mb-1">Trazabilidad LFPDPPP</span>
            <h2 className="fw-bold text-dark mb-0">Explorador de Bitácora de Auditoría</h2>
          </div>
          <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={loadLogs}>
            <i className="bi bi-arrow-clockwise me-1"></i> Actualizar Registros
          </button>
        </div>

        {/* Buscador */}
        <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              className="form-control bg-light border-start-0"
              placeholder="Filtrar por acción (ej. CREAR, LOGIN, APROBAR_CONTROLADO), entidad, usuario o IP..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de Logs */}
        {loading ? (
          <LoadingSpinner message="Consultando bitácora inmutable de seguridad..." />
        ) : filteredLogs.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
            <i className="bi bi-journal-check text-muted display-4 mb-2 d-block"></i>
            <h5 className="text-secondary">No se encontraron eventos de auditoría</h5>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Usuario Responsable</th>
                    <th>IP Origen</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td><strong>{new Date(log.createdAt || log.creado_en || log.fecha || Date.now()).toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${(log.accion || '').includes('CONTROLADO') || (log.accion || '').includes('PASSWORD') ? 'bg-danger' : 'bg-primary-subtle text-primary'}`}>
                          {log.accion}
                        </span>
                      </td>
                      <td><code>{log.entidad}</code></td>
                      <td>{log.usuarioNombre || log.usuario_nombre || (log.usuario_id || log.usuarioId ? `Usuario #${log.usuario_id || log.usuarioId}` : 'Sistema')}</td>
                      <td><span className="font-monospace text-muted">{log.ipOrigen || log.ip_origen || '127.0.0.1'}</span></td>
                      <td>
                        <small className="text-secondary text-truncate d-inline-block" style={{ maxWidth: '240px' }}>
                          {typeof log.detalles === 'object' ? JSON.stringify(log.detalles) : (log.detalles || 'Sin detalles adicionales')}
                        </small>
                      </td>
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
