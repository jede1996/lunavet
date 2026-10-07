import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { QRGeneratorModal } from '../../components/qr/QRGeneratorModal';
import { compressImage } from '../../utils/imageOptimizer';
import { useLanguage } from '../../contexts/LanguageContext';

export function PetsPage() {
  const { t, isEnglish } = useLanguage();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrModalPet, setQrModalPet] = useState(null);
  const [previewPhotoPet, setPreviewPhotoPet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Campos de nueva mascota
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('perro');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('macho');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [pesoActual, setPesoActual] = useState('');

  const loadPets = async () => {
    try {
      const res = await api.get('/pets');
      if (res.success) setPets(res.data || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/pets')
      .then(res => {
        if (!active) return;
        if (res.success) setPets(res.data || []);
      })
      .catch(err => {
        if (!active) return;
        setErrorMsg(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreatePet = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/pets', {
        nombre,
        especie,
        raza,
        sexo,
        fecha_nacimiento: fechaNacimiento || undefined,
        microchip: microchip || undefined,
        peso_actual: pesoActual ? parseFloat(pesoActual) : undefined
      });

      if (res.success) {
        setShowModal(false);
        setNombre('');
        setRaza('');
        setMicrochip('');
        setPesoActual('');
        await loadPets();
      }
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo registrar a la mascota.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (petId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(petId);
    try {
      // Optimizar y redimensionar imagen en el cliente antes de la subida
      const optimizedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
      const formData = new FormData();
      formData.append('photo', optimizedFile);

      const res = await api.post(`/pets/${petId}/photo`, formData);
      if (res.success) {
        await loadPets();
      }
    } catch (err) {
      alert(err.message || 'Error al procesar o subir la fotografía.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleDownloadQrPdf = async (petId, petNombre) => {
    setDownloadingDocId(`qr-${petId}`);
    try {
      const blob = await api.downloadBlob(`/pets/${petId}/qr-pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Placa_QR_${(petNombre || 'Mascota').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar la placa en PDF: ' + err.message);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDownloadMedicalPdf = async (petId, petNombre) => {
    setDownloadingDocId(`med-${petId}`);
    try {
      const blob = await api.downloadBlob(`/clinical/pets/${petId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Carnet_Salud_${(petNombre || 'Mascota').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el carnet en PDF: ' + err.message);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const authToken = typeof window !== 'undefined' ? (localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token')) : '';

  return (
    <div className="py-4 bg-body min-vh-100">
      <div className="container">
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-emphasis mb-1">{t('portal.petsTitle', 'Mis Mascotas')}</h2>
            <p className="text-secondary small mb-0">{t('portal.petsSubtitle', 'Administra a tus pacientes y actualiza sus datos médicos.')}</p>
          </div>
          <button className="btn btn-primary rounded-pill px-3 btn-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> {t('portal.addNewPetBtn', 'Registrar Mascota')}
          </button>
        </div>

        {errorMsg && (
          <div className="alert alert-danger py-2 small mb-4">{errorMsg}</div>
        )}

        {/* Modal de Alta de Mascota */}
        {showModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 border-0 shadow bg-body-tertiary">
                <div className="modal-header border-bottom border-translucent">
                  <h5 className="modal-title fw-bold text-emphasis">
                    {isEnglish ? 'Register New Pet' : 'Registrar Nueva Mascota'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleCreatePet}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-emphasis">
                        {isEnglish ? 'Pet Name' : 'Nombre de la Mascota'}
                      </label>
                      <input
                        type="text"
                        className="form-control bg-body"
                        placeholder="Ej. Toby, Mishi..."
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-emphasis">
                          {isEnglish ? 'Species' : 'Especie'}
                        </label>
                        <select className="form-select bg-body" value={especie} onChange={(e) => setEspecie(e.target.value)}>
                          <option value="perro">{isEnglish ? 'Canine (Dog)' : 'Canino (Perro)'}</option>
                          <option value="gato">{isEnglish ? 'Feline (Cat)' : 'Felino (Gato)'}</option>
                          <option value="ave">{isEnglish ? 'Bird' : 'Ave'}</option>
                          <option value="otro">{isEnglish ? 'Other' : 'Otro'}</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-emphasis">
                          {isEnglish ? 'Gender' : 'Sexo'}
                        </label>
                        <select className="form-select bg-body" value={sexo} onChange={(e) => setSexo(e.target.value)}>
                          <option value="macho">{isEnglish ? 'Male' : 'Macho'}</option>
                          <option value="hembra">{isEnglish ? 'Female' : 'Hembra'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-emphasis">Raza</label>
                        <input
                          type="text"
                          className="form-control bg-body"
                          placeholder="Ej. Golden Retriever"
                          value={raza}
                          onChange={(e) => setRaza(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-emphasis">Peso Actual (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control bg-body"
                          placeholder="Ej. 12.5"
                          value={pesoActual}
                          onChange={(e) => setPesoActual(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-emphasis">Fecha Nacimiento</label>
                        <input
                          type="date"
                          className="form-control bg-body"
                          value={fechaNacimiento}
                          onChange={(e) => setFechaNacimiento(e.target.value)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-emphasis">Nº Microchip (Opcional)</label>
                        <input
                          type="text"
                          className="form-control bg-body"
                          placeholder="15 dígitos"
                          value={microchip}
                          onChange={(e) => setMicrochip(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top border-translucent">
                    <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar Mascota'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Listado de Mascotas */}
        {loading ? (
          <LoadingSpinner message="Consultando tus mascotas..." />
        ) : pets.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-body-tertiary">
            <i className="bi bi-heart text-secondary display-4 mb-3 d-block"></i>
            <h5 className="text-secondary">No tienes mascotas registradas</h5>
            <p className="small text-secondary mb-3">Registra a tu primera mascota para dar de alta su expediente clínico.</p>
            <div>
              <button className="btn btn-primary rounded-pill px-4 btn-sm" onClick={() => setShowModal(true)}>
                Registrar Mi Primera Mascota
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {pets.map(p => (
              <div key={p.id} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 rounded-4 p-4 d-flex flex-column bg-body-tertiary shadow-sm">
                  <div className="d-flex gap-3 align-items-center mb-3">
                    {/* Foto o Avatar con Anillo Neumórfico y Clic a Vista Previa */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center position-relative flex-shrink-0 pet-avatar-ring"
                      style={{
                        width: '74px',
                        height: '74px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onClick={() => setPreviewPhotoPet(p)}
                      title="Ver fotografía en tamaño completo"
                    >
                      <img
                        src={`/api/pets/${p.id}/photo${authToken ? `?token=${authToken}` : ''}`}
                        alt={p.nombre}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <i className="bi bi-person-bounding-box fs-3 text-secondary position-absolute" style={{ zIndex: 0 }}></i>
                    </div>

                    <div className="flex-grow-1">
                      <h5 className="fw-bold text-emphasis mb-1">{p.nombre}</h5>
                      <span className="badge bg-primary-subtle text-primary small mb-1">
                        {p.especie.toUpperCase()}
                      </span>
                      <small className="text-secondary d-block">{p.raza || 'Mestizo'} • {p.sexo}</small>
                    </div>
                  </div>

                  {/* Subir / Cambiar Foto */}
                  <div className="mb-3">
                    <label className="btn btn-light btn-sm rounded-pill w-100 small py-1 border text-secondary">
                      {uploadingId === p.id ? (
                        <span><span className="spinner-border spinner-border-sm me-1"></span>Subiendo...</span>
                      ) : (
                        <span><i className="bi bi-camera me-1 text-primary"></i> Actualizar Foto</span>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="d-none"
                        onChange={(e) => handlePhotoUpload(p.id, e)}
                        disabled={uploadingId === p.id}
                      />
                    </label>
                  </div>

                  {/* Detalles médicos rápidos en pozo hundido */}
                  <div className="rounded-4 p-3 small mb-3 nm-inset-well">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-secondary">{isEnglish ? 'Microchip:' : 'Microchip:'}</span>
                      <span className="fw-semibold text-emphasis">{p.microchip || (isEnglish ? 'Unassigned' : 'No asignado')}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-secondary">{isEnglish ? 'Birth Date:' : 'Fecha Nac.:'}</span>
                      <span className="text-emphasis">{p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toLocaleDateString() : (isEnglish ? 'Unknown' : 'Desconocida')}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">{isEnglish ? 'Last Weight:' : 'Último Peso:'}</span>
                      <strong className="text-primary">{p.peso_actual ? `${p.peso_actual} kg` : (isEnglish ? 'Not recorded' : 'Sin registrar')}</strong>
                    </div>
                  </div>

                  {/* Acceso a Expediente, Placa QR y Descargas PDF */}
                  <div className="mt-auto d-flex flex-column gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm rounded-pill fw-semibold py-2"
                      onClick={() => setQrModalPet(p)}
                    >
                      <i className="bi bi-qr-code-scan me-1"></i> {isEnglish ? 'Generate QR Tag' : 'Generar Placa QR'}
                    </button>
                    <Link to={`/portal/expediente/${p.id}`} className="btn btn-light btn-sm rounded-pill border text-secondary py-2">
                      <i className="bi bi-folder2-open me-1 text-primary"></i> {isEnglish ? 'View Medical Record' : 'Ver Expediente Clínico'}
                    </Link>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-sm rounded-pill flex-fill py-1 small"
                        onClick={() => handleDownloadQrPdf(p.id, p.nombre)}
                        disabled={downloadingDocId === `qr-${p.id}`}
                        title={isEnglish ? 'Download PDF collar tag template' : 'Descargar plantilla de placa en PDF'}
                      >
                        {downloadingDocId === `qr-${p.id}` ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <span><i className="bi bi-file-earmark-pdf text-danger me-1"></i> {isEnglish ? 'Tag PDF' : 'Placa PDF'}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-pill flex-fill py-1 small"
                        onClick={() => handleDownloadMedicalPdf(p.id, p.nombre)}
                        disabled={downloadingDocId === `med-${p.id}`}
                        title={isEnglish ? 'Download official health record in PDF' : 'Descargar carnet oficial en PDF'}
                      >
                        {downloadingDocId === `med-${p.id}` ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <span><i className="bi bi-file-earmark-medical text-primary me-1"></i> {isEnglish ? 'Record PDF' : 'Carnet PDF'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Generación de Placa QR */}
        {qrModalPet && (
          <QRGeneratorModal
            show={!!qrModalPet}
            onClose={() => setQrModalPet(null)}
            initialMode="mascota"
            initialData={{
              petId: qrModalPet.id,
              petName: qrModalPet.nombre,
              petSpecies: qrModalPet.especie,
              petBreed: qrModalPet.raza,
              emergencyPhone: '7442130868'
            }}
          />
        )}

        {/* Modal de Fotografía en Alta Resolución */}
        {previewPhotoPet && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
            onClick={() => setPreviewPhotoPet(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content rounded-4 border-0 shadow-lg bg-body-tertiary text-center p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-emphasis mb-0">
                    <i className="bi bi-camera me-2 text-primary"></i>
                    {previewPhotoPet.nombre}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setPreviewPhotoPet(null)}
                  ></button>
                </div>
                <div
                  className="rounded-4 p-3 nm-inset-well bg-body mb-3 d-flex align-items-center justify-content-center"
                  style={{ maxHeight: '350px', overflow: 'hidden' }}
                >
                  <img
                    src={`/api/pets/${previewPhotoPet.id}/photo${authToken ? `?token=${authToken}` : ''}`}
                    alt={previewPhotoPet.nombre}
                    className="w-100 h-100 object-fit-contain"
                    style={{ maxHeight: '320px' }}
                  />
                </div>
                <div className="small text-secondary">
                  <span className="badge bg-primary-subtle text-primary me-2">{previewPhotoPet.especie?.toUpperCase()}</span>
                  <span>{previewPhotoPet.raza || 'Mestizo'} • {previewPhotoPet.sexo}</span>
                  {previewPhotoPet.microchip && <span className="d-block mt-1">Microchip: {previewPhotoPet.microchip}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
