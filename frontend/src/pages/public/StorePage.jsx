import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { useCart } from '../../contexts/CartContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePageSeo } from '../../hooks/usePageSeo';

export function StorePage() {
  usePageSeo(
    'Farmacia Veterinaria & Tienda Click & Collect',
    'Compra medicamentos veterinarios, antiparasitarios Bravecto, Simparica, alimentos premium y accesorios con recogida en mostrador en El Coloso, Acapulco.'
  );
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedAlert, setAddedAlert] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewQty, setPreviewQty] = useState(1);

  const { addItem } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/commerce/products'),
          api.get('/commerce/categories')
        ]);
        const isProdOk = prodRes?.success || prodRes?.status === 'success';
        const isCatOk = catRes?.success || catRes?.status === 'success';
        if (isProdOk) setProducts(prodRes.data?.productos || prodRes.data || []);
        if (isCatOk) setCategories(catRes.data || []);
      } catch {
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddToCart = (prod, qty = 1) => {
    addItem(prod, qty);
    setAddedAlert(`${prod.nombre} (${qty > 1 ? `${qty} unidades` : '1 unidad'})`);
    setTimeout(() => setAddedAlert(null), 3500);
  };

  const openPreview = (prod) => {
    setPreviewProduct(prod);
    setPreviewQty(1);
  };

  const closePreview = () => {
    setPreviewProduct(null);
    setPreviewQty(1);
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat === 'all' || String(p.categoria_id) === String(selectedCat);
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="py-5 bg-body min-vh-100">
      <div className="container">
        {/* Encabezado */}
        <div className="text-center mb-4">
          <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-2 fw-semibold">
            <i className="bi bi-hospital me-1"></i> Farmacia Oficial Luna-Vet • Acapulco
          </span>
          <h1 className="fw-bold text-emphasis">Medicamentos Veterinarios & Alimentos</h1>
          <p className="text-secondary mb-1">
            Recoge en mostrador (<em>Click & Collect</em>) en <strong>Av. Peña Blanca, Etapa 38, El Coloso</strong> sin costo de envío.
          </p>
          <small className="text-secondary">
            Para dudas sobre dosis o recetas, escríbenos al WhatsApp{' '}
            <a
              href="https://wa.me/527442130868"
              target="_blank"
              rel="noopener noreferrer"
              className="text-success text-decoration-none fw-bold"
            >
              <i className="bi bi-whatsapp me-1"></i>744 213 0868
            </a>.
          </small>
        </div>

        {/* Notificación flotante de agregado al carrito */}
        {addedAlert && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm text-center py-2 mb-4" role="alert">
            <i className="bi bi-check2-circle me-2"></i>
            ¡<strong>{addedAlert}</strong> se agregó a tu carrito Click & Collect!
            <button type="button" className="btn-close py-2" onClick={() => setAddedAlert(null)}></button>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-body-tertiary">
          <div className="row g-3 align-items-center">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-body border-end-0 text-secondary">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-body border-start-0"
                  placeholder="Buscar medicamentos, alimentos, antiparasitarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-5">
              <select
                className="form-select bg-body"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                <option value="all">Todas las Categorías ({products.length} productos)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Catálogo de Productos */}
        {loading ? (
          <LoadingSpinner message="Consultando inventario de farmacia..." />
        ) : filteredProducts.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-body-tertiary">
            <i className="bi bi-inboxes text-secondary display-4 mb-3 d-block"></i>
            <h5 className="text-secondary">No se encontraron productos</h5>
            <p className="small text-secondary mb-0">Intenta con otro término de búsqueda o selecciona otra categoría.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="col-sm-6 col-lg-4 col-xl-3">
                <div className="card h-100 shadow-sm border-0 rounded-4 p-3 d-flex flex-column bg-body-tertiary transition-transform hover-lift">
                  {/* Insignias Sanitarias & Categoría */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
                    <span
                      className="badge bg-secondary-subtle text-secondary small text-truncate"
                      style={{ maxWidth: '58%' }}
                      title={p.categoria_nombre || 'General'}
                    >
                      {p.categoria_nombre || 'General'}
                    </span>
                    <div className="ms-auto flex-shrink-0">
                      {p.es_controlado ? (
                        <span className="badge bg-danger text-white small" title="Requiere receta médica retenida oficial">
                          <i className="bi bi-shield-exclamation me-1"></i>Controlado
                        </span>
                      ) : p.requiere_receta ? (
                        <span className="badge bg-warning text-dark small" title="Requiere receta médica para surtir">
                          <i className="bi bi-file-earmark-medical me-1"></i>Receta
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success small" title="Venta libre sin receta">
                          <i className="bi bi-check2 me-1"></i>Libre
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Imagen del Producto centrada con Inset Neumórfico y Clic a Vista Previa */}
                  <div
                    className="rounded-4 d-flex align-items-center justify-content-center p-3 mb-3 nm-inset-well position-relative overflow-hidden"
                    style={{ height: '160px', cursor: 'pointer' }}
                    onClick={() => openPreview(p)}
                    title="Haz clic para ver detalles y especificaciones completas"
                  >
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-100 h-100 object-fit-contain"
                        style={{ maxHeight: '140px' }}
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="align-items-center justify-content-center w-100 h-100"
                      style={{ display: p.imagen_url ? 'none' : 'flex' }}
                    >
                      <i className="bi bi-capsule-pill text-primary display-4 opacity-50"></i>
                    </div>

                    {/* Botón flotante para vista previa rápida */}
                    <button
                      type="button"
                      className="btn btn-sm btn-light rounded-circle shadow-sm position-absolute bottom-0 end-0 m-2 opacity-85 hover-opacity-100"
                      style={{ width: '32px', height: '32px', padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(p);
                      }}
                      title="Vista previa rápida"
                    >
                      <i className="bi bi-eye text-primary"></i>
                    </button>
                  </div>

                  {/* Datos del producto */}
                  <h6
                    className="fw-bold text-emphasis mb-1"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.6rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => openPreview(p)}
                    title={p.nombre}
                  >
                    {p.nombre}
                  </h6>
                  <p
                    className="text-secondary small mb-3 flex-grow-1"
                    style={{
                      fontSize: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.3rem'
                    }}
                  >
                    {p.descripcion || 'Sin descripción disponible.'}
                  </p>

                  {/* Precio y Botón de Carrito */}
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top border-translucent mt-auto">
                    <div>
                      <span className="fs-5 fw-bold text-primary">${parseFloat(p.precio).toFixed(2)}</span>
                      <small className="text-secondary d-block" style={{ fontSize: '10px' }}>MXN IVA incl.</small>
                    </div>
                    <button
                      className="btn btn-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
                      onClick={() => handleAddToCart(p, 1)}
                    >
                      <i className="bi bi-cart-plus"></i> Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE VISTA PREVIA RÁPIDA DE PRODUCTO */}
      {previewProduct && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          onClick={closePreview}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content rounded-4 border-0 shadow-lg bg-body-tertiary">
              <div className="modal-header border-bottom border-translucent p-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary rounded-pill">
                    {previewProduct.categoria_nombre || 'Farmacia & Tienda'}
                  </span>
                  {previewProduct.es_controlado ? (
                    <span className="badge bg-danger text-white">
                      <i className="bi bi-shield-exclamation me-1"></i>Controlado
                    </span>
                  ) : previewProduct.requiere_receta ? (
                    <span className="badge bg-warning text-dark">
                      <i className="bi bi-file-earmark-medical me-1"></i>Requiere Receta
                    </span>
                  ) : (
                    <span className="badge bg-success-subtle text-success">
                      <i className="bi bi-check2 me-1"></i>Venta Libre
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closePreview}
                  aria-label="Cerrar"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4 align-items-center">
                  {/* Columna Izquierda: Imagen en alta resolución con marco neumórfico */}
                  <div className="col-md-5 text-center">
                    <div
                      className="rounded-4 p-4 nm-inset-well d-flex align-items-center justify-content-center bg-body"
                      style={{ height: '240px' }}
                    >
                      {previewProduct.imagen_url ? (
                        <img
                          src={previewProduct.imagen_url}
                          alt={previewProduct.nombre}
                          className="w-100 h-100 object-fit-contain"
                          style={{ maxHeight: '210px' }}
                        />
                      ) : (
                        <i className="bi bi-capsule-pill text-primary display-1 opacity-50"></i>
                      )}
                    </div>
                    <small className="text-secondary d-block mt-2">
                      <i className="bi bi-check-circle-fill text-success me-1"></i>
                      Producto 100% Original Certificado
                    </small>
                  </div>

                  {/* Columna Derecha: Especificaciones y Compra */}
                  <div className="col-md-7">
                    <h4 className="fw-bold text-emphasis mb-2">{previewProduct.nombre}</h4>
                    <p className="text-secondary mb-3" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {previewProduct.descripcion || 'Sin descripción adicional disponible para este producto.'}
                    </p>

                    {/* Ficha Sanitaria */}
                    <div className="rounded-3 p-3 bg-body mb-3 small border border-translucent">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Disponibilidad:</span>
                        <span className="fw-semibold text-success">
                          <i className="bi bi-box-seam me-1"></i>En Stock para Recogida Inmediata
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-secondary">Modalidad:</span>
                        <span className="fw-semibold text-emphasis">Click & Collect (Sin costo de envío)</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-secondary">Sucursal:</span>
                        <span className="fw-semibold text-emphasis">El Coloso, Av. Peña Blanca</span>
                      </div>
                    </div>

                    {/* Precio y Cantidad */}
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div>
                        <span className="fs-3 fw-bold text-primary">
                          ${(parseFloat(previewProduct.precio) * previewQty).toFixed(2)}
                        </span>
                        <small className="text-secondary d-block">
                          ${parseFloat(previewProduct.precio).toFixed(2)} c/u • IVA incluido
                        </small>
                      </div>

                      {/* Selector de Cantidad */}
                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-secondary fw-semibold">Cantidad:</span>
                        <div className="input-group input-group-sm" style={{ width: '120px' }}>
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setPreviewQty(Math.max(1, previewQty - 1))}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          <input
                            type="text"
                            className="form-control text-center bg-body fw-bold"
                            value={previewQty}
                            readOnly
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setPreviewQty(previewQty + 1)}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary flex-grow-1 rounded-pill py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        onClick={() => {
                          handleAddToCart(previewProduct, previewQty);
                          closePreview();
                        }}
                      >
                        <i className="bi bi-cart-plus-fill"></i>
                        Añadir al Carrito ({previewQty})
                      </button>

                      <a
                        href={`https://wa.me/527442130868?text=${encodeURIComponent(`Hola Luna-Vet, tengo una duda médica sobre: ${previewProduct.nombre}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success rounded-pill px-3 py-2 d-flex align-items-center gap-1"
                        title="Consultar por WhatsApp"
                      >
                        <i className="bi bi-whatsapp"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
