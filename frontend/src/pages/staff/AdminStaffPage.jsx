import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Formulario creación
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('veterinario');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await api.get('/admin/staff');
      const staffList = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.staff)
        ? res.data.staff
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setStaff(staffList);
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/admin/staff')
      .then(res => {
        if (!active) return;
        const staffList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.staff)
          ? res.data.staff
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setStaff(staffList);
      })
      .catch(err => {
        if (!active) return;
        setFeedback({ type: 'danger', message: err.message });
        setStaff([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await api.post('/admin/staff', {
        nombre,
        apellido,
        email,
        password,
        rol,
        telefono,
        cedulaProfesional: rol === 'veterinario' ? cedula : undefined,
        cedula_profesional: rol === 'veterinario' ? cedula : undefined
      });

      if (res.success) {
        setShowCreateModal(false);
        setNombre('');
        setApellido('');
        setEmail('');
        setPassword('');
        setCedula('');
        setFeedback({ type: 'success', message: '¡Miembro de staff registrado exitosamente!' });
        await loadStaff();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Error al registrar staff.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nuevoEstado = !user.activo;
    try {
      const res = await api.patch(`/admin/staff/${user.id}/status`, { activo: nuevoEstado });
      if (res.success) {
        setFeedback({ type: 'info', message: `Estado de ${user.nombre} actualizado a: ${nuevoEstado ? 'Activo' : 'Inactivo'}` });
        await loadStaff();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/admin/staff/${resettingUser.id}/reset-password`, {
        newPassword,
        nuevaPassword: newPassword
      });
      if (res.success) {
        setFeedback({ type: 'success', message: `Contraseña de ${resettingUser.nombre} actualizada correctamente.` });
        setResettingUser(null);
        setNewPassword('');
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container-fluid px-lg-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <span className="badge bg-primary-subtle text-primary mb-1">Recursos Humanos & Seguridad</span>
            <h2 className="fw-bold text-dark mb-0">Gestión de Personal y Cuentas de Staff</h2>
          </div>
          <button className="btn btn-primary rounded-pill btn-sm px-3" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Dar de Alta Staff
          </button>
        </div>

        {feedback && (
          <div className={`alert alert-${feedback.type} alert-dismissible fade show py-2 small mb-4`}>
            {feedback.message}
            <button type="button" className="btn-close py-2" onClick={() => setFeedback(null)}></button>
          </div>
        )}

        {/* Modal Creación de Staff */}
        {showCreateModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-dark">Alta de Nuevo Miembro de Staff</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <form onSubmit={handleCreateStaff}>
                  <div className="modal-body p-4">
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Nombre</label>
                        <input type="text" className="form-control" value={nombre} onChange={e => setNombre(e.target.value)} required />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Apellido</label>
                        <input type="text" className="form-control" value={apellido} onChange={e => setApellido(e.target.value)} required />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Correo Electrónico Corporativo</label>
                      <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Contraseña Inicial Temporal</label>
                      <input type="password" className="form-control" placeholder="Mínimo 8 caracteres, mayúscula, símbolo" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Rol Asignado</label>
                        <select className="form-select" value={rol} onChange={e => setRol(e.target.value)}>
                          <option value="veterinario">Veterinario</option>
                          <option value="recepcionista">Recepcionista</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Teléfono</label>
                        <input type="tel" className="form-control" value={telefono} onChange={e => setTelefono(e.target.value)} />
                      </div>
                    </div>

                    {rol === 'veterinario' && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-primary">Cédula Profesional (DGP)</label>
                        <input type="text" className="form-control" placeholder="Ej. 9845120" value={cedula} onChange={e => setCedula(e.target.value)} required />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                      {saving ? 'Guardando...' : 'Crear Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Reseteo de Contraseña */}
        {resettingUser && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-dark">Reestablecer Contraseña a {resettingUser.nombre}</h5>
                  <button type="button" className="btn-close" onClick={() => setResettingUser(null)}></button>
                </div>
                <form onSubmit={handleResetPassword}>
                  <div className="modal-body p-4">
                    <p className="small text-muted mb-3">Ingresa la nueva contraseña temporal que se le asignará al usuario.</p>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Nueva Contraseña</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-light rounded-pill" onClick={() => setResettingUser(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-warning rounded-pill px-4">Actualizar Contraseña</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Staff */}
        {loading ? (
          <LoadingSpinner message="Consultando personal registrado..." />
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nombre y Apellido</th>
                    <th>Correo Electrónico</th>
                    <th>Rol</th>
                    <th>Cédula</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(staff) ? staff : []).map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.nombre} {s.apellido}</strong></td>
                      <td>{s.email}</td>
                      <td>
                        <span className={`badge ${s.rol === 'administrador' ? 'bg-primary' : s.rol === 'veterinario' ? 'bg-info' : 'bg-secondary'}`}>
                          {s.rol}
                        </span>
                      </td>
                      <td><code>{s.cedulaProfesional || s.cedula_profesional || 'N/A'}</code></td>
                      <td>
                        <span className={`badge ${s.activo ? 'bg-success' : 'bg-danger'}`}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-warning"
                            title="Reestablecer contraseña"
                            onClick={() => setResettingUser(s)}
                          >
                            <i className="bi bi-key"></i>
                          </button>
                          <button
                            className={`btn ${s.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            title={s.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                            onClick={() => handleToggleStatus(s)}
                          >
                            <i className={`bi ${s.activo ? 'bi-person-x' : 'bi-person-check'}`}></i>
                          </button>
                        </div>
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
