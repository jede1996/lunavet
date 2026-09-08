import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export function CartDrawer({ isOpen, onClose }) {
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
    hasControlledItems,
    hasPrescriptionRequired
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="offcanvas-backdrop fade show" onClick={onClose}></div>
      <div
        className="offcanvas offcanvas-end show shadow"
        tabIndex="-1"
        style={{ visibility: 'visible', width: '400px' }}
      >
        <div className="offcanvas-header border-bottom bg-light">
          <h5 className="offcanvas-title d-flex align-items-center gap-2">
            <i className="bi bi-cart3 text-primary"></i>
            Carrito Click & Collect
            <span className="badge bg-primary rounded-pill ms-2">{totalItems}</span>
          </h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>

        <div className="offcanvas-body d-flex flex-column">
          {items.length === 0 ? (
            <div className="text-center my-auto py-5">
              <i className="bi bi-cart-x text-muted display-4 mb-3 d-block"></i>
              <h6 className="text-secondary">Tu carrito está vacío</h6>
              <p className="small text-muted mb-4">Explora nuestra farmacia y tienda de alimentos para mascotas.</p>
              <button className="btn btn-outline-primary btn-sm" onClick={onClose}>
                Explorar Tienda
              </button>
            </div>
          ) : (
            <>
              {/* Alertas regulatorias */}
              {hasControlledItems && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-shield-exclamation fs-5 flex-shrink-0"></i>
                  <div>
                    <strong>Medicamento Controlado:</strong> Requerirá validación médica previa a la entrega.
                  </div>
                </div>
              )}
              {hasPrescriptionRequired && !hasControlledItems && (
                <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-file-earmark-medical fs-5 flex-shrink-0"></i>
                  <div>
                    <strong>Requiere Receta:</strong> Deberás presentar receta vigente al recoger en clínica.
                  </div>
                </div>
              )}

              {/* Lista de productos */}
              <div className="flex-grow-1 overflow-auto pe-1">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="card mb-2 p-2 border-0 bg-light">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-2">
                        <h6 className="mb-0 fs-6 text-dark">{product.nombre}</h6>
                        <span className="text-muted small">${parseFloat(product.precio).toFixed(2)} c/u</span>
                        {product.es_controlado && (
                          <span className="badge bg-danger ms-2" style={{ fontSize: '10px' }}>Controlado</span>
                        )}
                        {product.requiere_receta && !product.es_controlado && (
                          <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '10px' }}>Receta</span>
                        )}
                      </div>
                      <button
                        className="btn btn-link text-danger p-0"
                        title="Eliminar"
                        onClick={() => removeItem(product.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary-subtle">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary py-0 px-2"
                          onClick={() => updateQty(product.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span className="btn btn-light py-0 px-3 disabled text-dark fw-bold">
                          {quantity}
                        </span>
                        <button
                          className="btn btn-outline-secondary py-0 px-2"
                          onClick={() => updateQty(product.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="fw-bold text-primary">
                        ${(parseFloat(product.precio) * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie de carrito y Checkout */}
              <div className="border-top pt-3 mt-2">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-bold fs-5 text-dark">${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted small">Modalidad:</span>
                  <span className="badge bg-info-subtle text-info-emphasis">Click & Collect (Sin costo)</span>
                </div>

                <div className="d-grid gap-2">
                  <Link
                    to="/checkout"
                    className="btn btn-primary"
                    onClick={onClose}
                  >
                    <i className="bi bi-bag-check me-2"></i>
                    Proceder a Pagar
                  </Link>
                  <button
                    className="btn btn-link text-muted btn-sm"
                    onClick={clearCart}
                  >
                    Vaciar Carrito
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
