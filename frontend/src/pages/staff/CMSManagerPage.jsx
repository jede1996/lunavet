import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useBrand } from '../../contexts/BrandContext';
import { useTheme } from '../../contexts/ThemeContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { QRGenerator } from '../../components/qr/QRGenerator';
import { getFaviconUrl, updateFavicon, FAVICON_PRESETS } from '../../utils/favicon';

export function CMSManagerPage() {
  const { brand, updateBrand, DEFAULT_BRAND } = useBrand();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('marca'); // 'marca' | 'blog' | 'qr'

  // Estado del formulario de Marca & Logotipo
  const [brandForm, setBrandForm] = useState({
    nombre: brand.nombre || 'Luna-Vet',
    nombreCompleto: brand.nombreCompleto || 'Clínica Veterinaria Luna-Vet',
    slogan: brand.slogan || '',
    telefono: brand.telefono || '744 213 0868',
    whatsapp: brand.whatsapp || '7442130868',
    facebookUrl: brand.facebookUrl || '',
    direccion: brand.direccion || '',
    referencia: brand.referencia || '',
    logoTipo: brand.logoTipo || 'preset',
    logoPreset: brand.logoPreset || 'luna-huella',
    logoUrl: brand.logoUrl || '',
    faviconTipo: brand.faviconTipo || 'sync',
    faviconPreset: brand.faviconPreset || 'luna-huella',
    faviconUrl: brand.faviconUrl || ''
  });

  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [brandFeedback, setBrandFeedback] = useState(null);

  // Sincronizar formulario si cambia el contexto externamente tras el montaje inicial
  const initialBrandRef = useRef(brand);
  useEffect(() => {
    if (initialBrandRef.current !== brand) {
      initialBrandRef.current = brand;
      setBrandForm({
        nombre: brand.nombre || 'Luna-Vet',
        nombreCompleto: brand.nombreCompleto || 'Clínica Veterinaria Luna-Vet',
        slogan: brand.slogan || '',
        telefono: brand.telefono || '744 213 0868',
        whatsapp: brand.whatsapp || '7442130868',
        facebookUrl: brand.facebookUrl || '',
        direccion: brand.direccion || '',
        referencia: brand.referencia || '',
        logoTipo: brand.logoTipo || 'preset',
        logoPreset: brand.logoPreset || 'luna-huella',
        logoUrl: brand.logoUrl || '',
        faviconTipo: brand.faviconTipo || 'sync',
        faviconPreset: brand.faviconPreset || 'luna-huella',
        faviconUrl: brand.faviconUrl || ''
      });
    }
  }, [brand]);

  // Estado del Blog
  const [blogPosts, setBlogPosts] = useState([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [blogFeedback, setBlogFeedback] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Salud Preventiva');
  const [resumen, setResumen] = useState('');
  const [contenido, setContenido] = useState('');
  const [savingBlog, setSavingBlog] = useState(false);

  const loadBlog = async () => {
    try {
      const res = await api.get('/cms/blog');
      if (res.success) setBlogPosts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBlog(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/cms/blog')
      .then(res => {
        if (active && res.success) setBlogPosts(res.data || []);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoadingBlog(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    setSavingBrand(true);
    setBrandFeedback(null);

    try {
      await updateBrand(brandForm);
      updateFavicon(brandForm, isDark);
      setBrandFeedback({
        type: 'success',
        message: '¡Identidad de marca, logotipo y favicon de pestaña actualizados con éxito! Los cambios se aplican de inmediato en toda la aplicación y en el navegador.'
      });
    } catch (err) {
      setBrandFeedback({
        type: 'danger',
        message: 'Ocurrió un error al guardar la configuración de marca: ' + err.message
      });
    } finally {
      setSavingBrand(false);
    }
  };

  const handleResetBrand = async () => {
    if (window.confirm('¿Deseas restablecer el logotipo, favicon y datos a la configuración oficial basada en Facebook?')) {
      setBrandForm(DEFAULT_BRAND);
      await updateBrand(DEFAULT_BRAND);
      updateFavicon(DEFAULT_BRAND, isDark);
      setBrandFeedback({
        type: 'info',
        message: 'Se han restablecido los valores por defecto oficiales de Luna-Vet Acapulco.'
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setBrandFeedback(null);

    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const res = await api.post('/cms/images', formData);
      if (res.status === 'success' || res.success) {
        const imageUrl = res.data.url;
        setBrandForm(prev => ({
          ...prev,
          logoTipo: 'upload',
          logoUrl: imageUrl
        }));
        setBrandFeedback({
          type: 'success',
          message: `¡Imagen subida correctamente! Guarda los cambios para que se active en todo el sitio.`
        });
      }
    } catch (err) {
      setBrandFeedback({
        type: 'danger',
        message: 'Error al subir la imagen: ' + err.message
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setBrandFeedback(null);

    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const res = await api.post('/cms/images', formData);
      if (res.status === 'success' || res.success) {
        const imageUrl = res.data.url;
        setBrandForm(prev => ({
          ...prev,
          faviconTipo: 'upload',
          faviconUrl: imageUrl
        }));
        setBrandFeedback({
          type: 'success',
          message: '¡Icono de favicon subido correctamente! Se mostrará en la pestaña del navegador al guardar.'
        });
      }
    } catch (err) {
      setBrandFeedback({
        type: 'danger',
        message: 'Error al subir el icono de favicon: ' + err.message
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setSavingBlog(true);
    setBlogFeedback(null);

    try {
      const res = await api.post('/cms/blog', {
        titulo,
        categoria,
        resumen,
        contenido
      });

      if (res.success) {
        setBlogFeedback({ type: 'success', message: '¡Artículo publicado exitosamente en el blog!' });
        setTitulo('');
        setResumen('');
        setContenido('');
        await loadBlog();
      }
    } catch (err) {
      setBlogFeedback({ type: 'danger', message: err.message || 'Error al publicar artículo.' });
    } finally {
      setSavingBlog(false);
    }
  };

  return (
    <div className="py-4 bg-light min-vh-100">
      <div className="container-fluid px-lg-5">
        {/* Encabezado Principal */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <span className="badge bg-primary-subtle text-primary mb-1">
              <i className="bi bi-palette-fill me-1"></i> Administración del Portal
            </span>
            <h2 className="fw-bold text-dark mb-0">Gestor de Contenido & Marca (CMS)</h2>
          </div>

          {/* Navegación por Pestañas */}
          <ul className="nav nav-pills bg-white p-1 rounded-pill shadow-sm border">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === 'marca' ? 'active' : 'text-secondary'}`}
                onClick={() => setActiveTab('marca')}
              >
                <i className="bi bi-brush-fill me-1 text-warning"></i> Logotipo & Marca
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === 'blog' ? 'active' : 'text-secondary'}`}
                onClick={() => setActiveTab('blog')}
              >
                <i className="bi bi-journal-text me-1 text-info"></i> Artículos de Blog
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === 'qr' ? 'active' : 'text-secondary'}`}
                onClick={() => setActiveTab('qr')}
              >
                <i className="bi bi-qr-code-scan me-1 text-primary"></i> Generador de QR
              </button>
            </li>
          </ul>
        </div>

        {/* PESTAÑA 1: IDENTIDAD DE MARCA Y LOGOTIPO */}
        {activeTab === 'marca' && (
          <div>
            {brandFeedback && (
              <div className={`alert alert-${brandFeedback.type} alert-dismissible fade show py-2 small mb-4 shadow-sm`}>
                {brandFeedback.message}
                <button type="button" className="btn-close py-2" onClick={() => setBrandFeedback(null)}></button>
              </div>
            )}

            <div className="row g-4">
              {/* Formulario de Configuración del Icono y Marca */}
              <div className="col-lg-7">
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0">
                      <i className="bi bi-star-fill text-warning me-2"></i>
                      Editor del Logotipo & Icono de Luna-Vet
                    </h5>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-pill"
                      onClick={handleResetBrand}
                      title="Restablecer valores por defecto de Facebook"
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i> Restablecer
                    </button>
                  </div>

                  <p className="text-muted small mb-4">
                    Selecciona uno de los presets vectoriales de alta resolución, la fotografía oficial de Facebook, o sube una imagen personalizada desde tu equipo. El cambio se aplicará instantáneamente en toda la aplicación.
                  </p>

                  <form onSubmit={handleSaveBrand}>
                    {/* Selector de Tipo de Logo */}
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-secondary">1. Elige el Estilo o Fuente del Icono:</label>
                      <div className="row g-2">
                        {/* Preset 1: Luna + Huella Oficial */}
                        <div className="col-sm-6 col-md-4">
                          <div
                            className={`p-3 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.logoTipo === 'preset' && brandForm.logoPreset === 'luna-huella'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, logoTipo: 'preset', logoPreset: 'luna-huella' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mb-2 d-flex justify-content-center">
                              <BrandLogo
                                size={44}
                                overrideBrand={{ logoTipo: 'preset', logoPreset: 'luna-huella', nombre: 'Luna-Vet' }}
                              />
                            </div>
                            <div className="small fw-bold text-dark">Luna + Huella</div>
                            <div className="badge bg-primary text-white" style={{ fontSize: '10px' }}>Oficial Facebook</div>
                          </div>
                        </div>

                        {/* Preset 2: Luna + Cruz Médica */}
                        <div className="col-sm-6 col-md-4">
                          <div
                            className={`p-3 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.logoTipo === 'preset' && brandForm.logoPreset === 'luna-cruz'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, logoTipo: 'preset', logoPreset: 'luna-cruz' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mb-2 d-flex justify-content-center">
                              <BrandLogo
                                size={44}
                                overrideBrand={{ logoTipo: 'preset', logoPreset: 'luna-cruz', nombre: 'Luna-Vet' }}
                              />
                            </div>
                            <div className="small fw-bold text-dark">Luna + Cruz Médica</div>
                            <div className="badge bg-success" style={{ fontSize: '10px' }}>Clínico Veterinario</div>
                          </div>
                        </div>

                        {/* Preset 3: Corazón Clínico */}
                        <div className="col-sm-6 col-md-4">
                          <div
                            className={`p-3 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.logoTipo === 'preset' && brandForm.logoPreset === 'clinica-corazon'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, logoTipo: 'preset', logoPreset: 'clinica-corazon' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mb-2 d-flex justify-content-center">
                              <BrandLogo
                                size={44}
                                overrideBrand={{ logoTipo: 'preset', logoPreset: 'clinica-corazon', nombre: 'Luna-Vet' }}
                              />
                            </div>
                            <div className="small fw-bold text-dark">Corazón Vital</div>
                            <div className="badge bg-danger" style={{ fontSize: '10px' }}>Urgencias & Amor</div>
                          </div>
                        </div>

                        {/* Preset 4: Foto de Perfil Facebook */}
                        <div className="col-sm-6 col-md-4">
                          <div
                            className={`p-3 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.logoTipo === 'preset' && brandForm.logoPreset === 'facebook'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({
                              ...p,
                              logoTipo: 'preset',
                              logoPreset: 'facebook',
                              logoUrl: DEFAULT_BRAND.logoUrl
                            }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mb-2 d-flex justify-content-center">
                              <BrandLogo
                                size={44}
                                overrideBrand={{ logoTipo: 'preset', logoPreset: 'facebook', logoUrl: DEFAULT_BRAND.logoUrl, nombre: 'Luna-Vet' }}
                              />
                            </div>
                            <div className="small fw-bold text-dark">Foto Facebook</div>
                            <div className="badge bg-info text-dark" style={{ fontSize: '10px' }}>Perfil Real</div>
                          </div>
                        </div>

                        {/* Opción 5: Imagen por URL */}
                        <div className="col-sm-6 col-md-4">
                          <div
                            className={`p-3 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.logoTipo === 'url'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, logoTipo: 'url' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mb-2 d-flex justify-content-center">
                              <i className="bi bi-link-45deg fs-2 text-primary"></i>
                            </div>
                            <div className="small fw-bold text-dark">Enlace URL</div>
                            <div className="badge bg-secondary" style={{ fontSize: '10px' }}>Enlace Web</div>
                          </div>
                        </div>

                        {/* Opción 6: Subir Archivo Local */}
                        <div className="col-sm-6 col-md-4">
                          <div
                            className={`p-3 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.logoTipo === 'upload'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, logoTipo: 'upload' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mb-2 d-flex justify-content-center">
                              <i className="bi bi-cloud-arrow-up-fill fs-2 text-success"></i>
                            </div>
                            <div className="small fw-bold text-dark">Subir Imagen</div>
                            <div className="badge bg-success" style={{ fontSize: '10px' }}>Archivo Local</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campo adicional si eligió URL */}
                    {brandForm.logoTipo === 'url' && (
                      <div className="mb-4 p-3 bg-light rounded-3 border border-primary-subtle">
                        <label className="form-label small fw-bold">URL Directa de la Imagen (PNG, SVG o JPG):</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://ejemplo.com/mi-logotipo.png"
                          value={brandForm.logoUrl}
                          onChange={e => setBrandForm(p => ({ ...p, logoUrl: e.target.value }))}
                          required
                        />
                        <div className="form-text small">Pega el link de la imagen pública para usar como logotipo.</div>
                      </div>
                    )}

                    {/* Campo adicional si eligió Subir Imagen */}
                    {brandForm.logoTipo === 'upload' && (
                      <div className="mb-4 p-3 bg-light rounded-3 border border-success-subtle">
                        <label className="form-label small fw-bold">Subir archivo de logotipo (almacenamiento en base de datos):</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={handleFileUpload}
                          disabled={uploadingImage}
                        />
                        <div className="form-text small">
                          {uploadingImage ? 'Subiendo imagen al servidor...' : 'Formatos recomendados: PNG o SVG con fondo transparente, o JPG cuadrado.'}
                        </div>
                        {brandForm.logoUrl && (
                          <div className="mt-2 small text-success">
                            <i className="bi bi-check-circle-fill me-1"></i> Imagen actual: <code>{brandForm.logoUrl}</code>
                          </div>
                        )}
                      </div>
                    )}

                    <hr className="my-4" />

                    {/* 2. Icono de la Pestaña del Navegador (Favicon Dinámico) */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-bold text-secondary mb-0">
                          <i className="bi bi-window-sidebar text-primary me-1"></i>
                          2. Icono de la Pestaña del Navegador (Favicon):
                        </label>
                        <span className="badge bg-primary-subtle text-primary small">
                          {brandForm.faviconTipo === 'sync' ? 'Sincronizado' : 'Personalizado'}
                        </span>
                      </div>
                      <p className="text-muted small mb-3">
                        Configura el icono que los clientes ven en la pestaña de Google Chrome, Edge o Firefox. Puedes vincularlo directamente al logotipo principal o asignar un distintivo vectorial específico.
                      </p>

                      <div className="row g-2 mb-3">
                        {/* Opción A: Sincronizar con el Logotipo Principal */}
                        <div className="col-12">
                          <div
                            className={`p-3 rounded-3 border d-flex align-items-center gap-3 cursor-pointer ${
                              brandForm.faviconTipo === 'sync'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, faviconTipo: 'sync' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="p-2 rounded-2 bg-white shadow-sm d-flex align-items-center justify-content-center">
                              <img
                                src={getFaviconUrl({ ...brandForm, faviconTipo: 'sync' }, isDark)}
                                alt="Favicon Sync"
                                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                              />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold text-dark small">Vincular al Logotipo Principal (Recomendado)</div>
                              <div className="small text-muted">Hereda automáticamente el estilo del logotipo oficial o la foto de Facebook.</div>
                            </div>
                            {brandForm.faviconTipo === 'sync' && (
                              <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                            )}
                          </div>
                        </div>

                        {/* Presets específicos para Favicon */}
                        {Object.entries(FAVICON_PRESETS).map(([key, item]) => (
                          <div key={key} className="col-sm-6 col-md-3">
                            <div
                              className={`p-2 rounded-3 border text-center cursor-pointer h-100 ${
                                brandForm.faviconTipo === 'preset' && brandForm.faviconPreset === key
                                  ? 'border-primary bg-primary-subtle shadow-sm'
                                  : 'border-secondary-subtle bg-light'
                              }`}
                              onClick={() => setBrandForm(p => ({ ...p, faviconTipo: 'preset', faviconPreset: key }))}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="mb-2 d-flex justify-content-center">
                                <div className="p-1 rounded-2 bg-white shadow-sm d-inline-flex">
                                  <img
                                    src={`data:image/svg+xml;utf8,${encodeURIComponent(item.getSvg(isDark))}`}
                                    alt={item.nombre}
                                    style={{ width: '24px', height: '24px' }}
                                  />
                                </div>
                              </div>
                              <div className="small fw-semibold text-dark text-truncate" style={{ fontSize: '11px' }}>
                                {item.nombre}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Opción Favicon por URL / Archivo */}
                        <div className="col-sm-6 col-md-6">
                          <div
                            className={`p-2 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.faviconTipo === 'url'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, faviconTipo: 'url' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <i className="bi bi-link-45deg fs-5 text-primary"></i>
                              <span className="small fw-semibold text-dark">URL Directa para Favicon</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-sm-6 col-md-6">
                          <div
                            className={`p-2 rounded-3 border text-center cursor-pointer h-100 ${
                              brandForm.faviconTipo === 'upload'
                                ? 'border-primary bg-primary-subtle shadow-sm'
                                : 'border-secondary-subtle bg-light'
                            }`}
                            onClick={() => setBrandForm(p => ({ ...p, faviconTipo: 'upload' }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <i className="bi bi-cloud-arrow-up-fill fs-5 text-success"></i>
                              <span className="small fw-semibold text-dark">Subir Archivo de Favicon</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input si seleccionó URL para Favicon */}
                      {brandForm.faviconTipo === 'url' && (
                        <div className="p-3 bg-light rounded-3 border border-primary-subtle mb-3">
                          <label className="form-label small fw-bold">URL del Favicon (.ico, .png o .svg):</label>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="https://ejemplo.com/favicon.ico"
                            value={brandForm.faviconUrl}
                            onChange={e => setBrandForm(p => ({ ...p, faviconUrl: e.target.value }))}
                            required
                          />
                        </div>
                      )}

                      {/* Input si seleccionó Subir Archivo para Favicon */}
                      {brandForm.faviconTipo === 'upload' && (
                        <div className="p-3 bg-light rounded-3 border border-success-subtle mb-3">
                          <label className="form-label small fw-bold">Subir Icono para Pestaña (PNG, ICO o SVG cuadrado):</label>
                          <input
                            type="file"
                            accept="image/*,.ico"
                            className="form-control"
                            onChange={handleFaviconUpload}
                            disabled={uploadingImage}
                          />
                          {brandForm.faviconUrl && (
                            <div className="mt-2 small text-success">
                              <i className="bi bi-check-circle-fill me-1"></i> Icono asignado: <code>{brandForm.faviconUrl}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <hr className="my-4" />

                    {/* 3. Datos de la Clínica & Marca */}
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i>
                      3. Nombre, Slogan y Datos de Contacto Oficiales:
                    </h6>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Nombre Corto de la Marca</label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandForm.nombre}
                          onChange={e => setBrandForm(p => ({ ...p, nombre: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Nombre Completo de la Clínica</label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandForm.nombreCompleto}
                          onChange={e => setBrandForm(p => ({ ...p, nombreCompleto: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Slogan Oficial (Visible en Inicio, Login y Pie de Página)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandForm.slogan}
                        onChange={e => setBrandForm(p => ({ ...p, slogan: e.target.value }))}
                        placeholder="Ej. ¡Porque no son solo mascotas, sino un miembro importante de nuestra familia!"
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Teléfono Urgencias</label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandForm.telefono}
                          onChange={e => setBrandForm(p => ({ ...p, telefono: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">WhatsApp (Solo dígitos)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandForm.whatsapp}
                          onChange={e => setBrandForm(p => ({ ...p, whatsapp: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Página Oficial de Facebook</label>
                      <input
                        type="url"
                        className="form-control"
                        value={brandForm.facebookUrl}
                        onChange={e => setBrandForm(p => ({ ...p, facebookUrl: e.target.value }))}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Dirección de la Clínica</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandForm.direccion}
                        onChange={e => setBrandForm(p => ({ ...p, direccion: e.target.value }))}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-semibold">Referencia de Ubicación</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandForm.referencia}
                        onChange={e => setBrandForm(p => ({ ...p, referencia: e.target.value }))}
                      />
                    </div>

                    {/* Botón Guardar */}
                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg rounded-pill fw-bold shadow-sm"
                        disabled={savingBrand || uploadingImage}
                      >
                        {savingBrand ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Guardando y sincronizando marca...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check2-circle me-2"></i> Guardar y Actualizar Logotipo en Toda la Web
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Vista Previa en Vivo (Live Preview) */}
              <div className="col-lg-5">
                <div className="sticky-top" style={{ top: '85px' }}>
                  <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
                    <h5 className="fw-bold text-dark mb-3">
                      <i className="bi bi-eye-fill text-info me-2"></i>
                      Vista Previa en Vivo
                    </h5>
                    <p className="small text-muted mb-3">
                      Así es como tus visitantes y clientes verán el logotipo y la marca en las diferentes secciones:
                    </p>

                    {/* Vista Previa: Icono de la Pestaña del Navegador (Favicon) */}
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-secondary">
                        <i className="bi bi-window-sidebar text-primary me-1"></i>
                        En la Pestaña del Navegador Web:
                      </label>
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="browser-tab-preview">
                          <img
                            src={getFaviconUrl(brandForm, isDark)}
                            alt="Favicon Actual"
                            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                          />
                          <span className="small fw-semibold text-truncate" style={{ maxWidth: '170px' }}>
                            {brandForm.nombre || 'Luna-Vet'} | Clínica Veterinaria
                          </span>
                          <span className="text-secondary small ms-1" style={{ fontSize: '10px' }}>✕</span>
                        </div>
                        <div className="mt-2 small text-muted d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-check-circle-fill text-success me-1"></i>
                            Previsualización interactiva
                          </span>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                            onClick={() => {
                              updateFavicon(brandForm, isDark);
                              setBrandFeedback({
                                type: 'info',
                                message: '¡Icono aplicado inmediatamente a la pestaña de tu navegador!'
                              });
                            }}
                          >
                            Probar en pestaña ahora
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Vista Previa: Barra de Navegación (Dark) */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">En la Barra de Navegación Superior:</label>
                      <div className="bg-dark p-3 rounded-3 d-flex align-items-center justify-content-between text-white shadow-sm">
                        <BrandLogo
                          size={40}
                          showText={true}
                          textClassName="fs-5 text-white"
                          overrideBrand={brandForm}
                        />
                        <div className="d-flex gap-2">
                          <span className="badge bg-secondary-subtle text-light small">Inicio</span>
                          <span className="badge bg-secondary-subtle text-light small">Servicios</span>
                          <span className="badge bg-primary text-white small">Citas</span>
                        </div>
                      </div>
                    </div>

                    {/* Vista Previa: Pie de Página (Footer) */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary">En el Pie de Página (Footer):</label>
                      <div className="bg-dark p-3 rounded-3 text-white shadow-sm border-top border-info border-3">
                        <div className="mb-2">
                          <BrandLogo
                            size={34}
                            showText={true}
                            textClassName="fs-5 text-white"
                            overrideBrand={brandForm}
                          />
                        </div>
                        <p className="small text-secondary mb-2 fst-italic">
                          "{brandForm.slogan || '¡Porque no son solo mascotas, sino un miembro importante de nuestra familia!'}"
                        </p>
                        <div className="small text-secondary" style={{ fontSize: '11px' }}>
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                          {brandForm.direccion || 'El Coloso, Acapulco'}
                        </div>
                      </div>
                    </div>

                    {/* Vista Previa: Tarjeta de Inicio / Acceso */}
                    <div>
                      <label className="form-label small fw-bold text-secondary">En Tarjetas Principales y Login:</label>
                      <div className="card border-0 bg-light p-3 rounded-3 text-center shadow-sm">
                        <div className="d-flex justify-content-center mb-2">
                          <BrandLogo
                            size={56}
                            overrideBrand={brandForm}
                          />
                        </div>
                        <h6 className="fw-bold text-dark mb-1">{brandForm.nombreCompleto || brandForm.nombre}</h6>
                        <span className="badge bg-success-subtle text-success mx-auto mb-2">Icono Activo</span>
                        <p className="text-muted small fst-italic mb-0" style={{ fontSize: '12px' }}>
                          "{brandForm.slogan}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: ARTÍCULOS DE BLOG */}
        {activeTab === 'blog' && (
          <div>
            {blogFeedback && (
              <div className={`alert alert-${blogFeedback.type} alert-dismissible fade show py-2 small mb-4 shadow-sm`}>
                {blogFeedback.message}
                <button type="button" className="btn-close py-2" onClick={() => setBlogFeedback(null)}></button>
              </div>
            )}

            <div className="row g-4">
              {/* Publicar Artículo */}
              <div className="col-lg-5">
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-dark mb-3">Redactar Nuevo Artículo para Blog</h5>
                  <form onSubmit={handleCreatePost}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Título del Post</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Cuidados esenciales para cachorros..."
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Categoría</label>
                      <select className="form-select" value={categoria} onChange={e => setCategoria(e.target.value)}>
                        <option value="Salud Preventiva">Salud Preventiva</option>
                        <option value="Nutrición Animal">Nutrición Animal</option>
                        <option value="Vacunación">Vacunación</option>
                        <option value="Cirugía & Cuidados">Cirugía & Cuidados</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Resumen Breve (SEO)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Resumen para tarjeta y buscadores..."
                        value={resumen}
                        onChange={e => setResumen(e.target.value)}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-semibold">Cuerpo del Artículo</label>
                      <textarea
                        className="form-control"
                        rows="6"
                        placeholder="Texto completo del artículo..."
                        value={contenido}
                        onChange={e => setContenido(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary rounded-pill" disabled={savingBlog}>
                        {savingBlog ? 'Publicando...' : 'Publicar Artículo en Blog'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Artículos Publicados */}
              <div className="col-lg-7">
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-dark mb-3">Artículos de Blog Publicados</h5>
                  {loadingBlog ? (
                    <LoadingSpinner message="Consultando publicaciones..." />
                  ) : blogPosts.length === 0 ? (
                    <p className="text-muted small">No hay publicaciones activas.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle small mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Título</th>
                            <th>Categoría</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blogPosts.map(p => (
                            <tr key={p.id}>
                              <td><strong>{p.titulo}</strong></td>
                              <td><span className="badge bg-info-subtle text-info-emphasis">{p.categoria || 'General'}</span></td>
                              <td>{p.creado_en ? new Date(p.creado_en).toLocaleDateString() : 'Reciente'}</td>
                              <td><span className="badge bg-success-subtle text-success">Publicado</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: GENERADOR DE CÓDIGOS QR */}
        {activeTab === 'qr' && (
          <div>
            <div className="mb-4">
              <span className="badge bg-primary-subtle text-primary mb-1">
                <i className="bi bi-qr-code-scan me-1"></i> Herramienta Clínica
              </span>
              <h4 className="fw-bold text-dark mb-1">Generador de Códigos QR Personalizables</h4>
              <p className="text-secondary small mb-0">
                Diseña códigos QR oficiales para campañas, carnets de vacunación, recetas médicas, acceso a Wi-Fi en recepción o placas de identificación canina y felina.
              </p>
            </div>
            <QRGenerator initialMode="clinica" />
          </div>
        )}
      </div>
    </div>
  );
}
