import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api.client';
import { useLanguage } from '../../contexts/LanguageContext';

export function CheckoutPage() {
  const { items, subtotal, clearCart, hasControlledItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { t, isEnglish } = useLanguage();

  const [metodoPago, setMetodoPago] = useState('spei');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 rounded-4 p-5 max-w-md mx-auto bg-white" style={{ maxWidth: '500px' }}>
          <i className="bi bi-person-lock text-primary display-4 mb-3 d-block"></i>
          <h4 className="fw-bold text-dark">{t('checkout.loginTitle', 'Inicia sesión para pagar')}</h4>
          <p className="text-muted small mb-4">
            {t('checkout.loginDesc', 'Para garantizar la trazabilidad de tus pedidos y recetas, inicia sesión con tu cuenta de cliente.')}
          </p>
          <div className="d-grid gap-2">
            <Link to="/login" className="btn btn-primary rounded-pill">{t('nav.login', 'Iniciar Sesión')}</Link>
            <Link to="/registro" className="btn btn-outline-secondary rounded-pill">{t('nav.createAccount', 'Registrarme')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderResult) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 rounded-4 p-5 mx-auto bg-white" style={{ maxWidth: '500px' }}>
          <i className="bi bi-cart-x text-muted display-4 mb-3 d-block"></i>
          <h4 className="text-secondary">{t('checkout.emptyTitle', 'Tu carrito está vacío')}</h4>
          <p className="text-muted small mb-4">{t('checkout.emptyDesc', 'Agrega productos o medicamentos antes de proceder al checkout.')}</p>
          <Link to="/tienda" className="btn btn-primary rounded-pill px-4">{t('checkout.goToStore', 'Ir a la Tienda')}</Link>
        </div>
      </div>
    );
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const itemsPayload = items.map(i => ({
        producto_id: i.product.id,
        cantidad: i.quantity
      }));

      const res = await api.post('/commerce/checkout', {
        items: itemsPayload,
        metodo_pago: metodoPago
      });

      if (res.success) {
        setOrderResult(res.data);
        clearCart();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-5 bg-light min-vh-100">
      <div className="container">
        {orderResult ? (
          /* Confirmación de Pedido */
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 text-center bg-white">
                <div className="rounded-circle bg-success-subtle text-success p-3 mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-bag-check-fill display-5"></i>
                </div>
                <h3 className="fw-bold text-dark mb-1">{t('checkout.orderSuccessTitle', '¡Pedido Registrado con Éxito!')}</h3>
                <p className="text-muted small mb-4">
                  {isEnglish ? 'Order Folio:' : 'Folio de Pedido:'} <strong>#{orderResult.pedido?.id || orderResult.id}</strong> • {isEnglish ? 'Fulfillment:' : 'Modalidad:'} <strong>Click & Collect</strong>
                </p>

                {orderResult.requiere_autorizacion_medica && (
                  <div className="alert alert-warning text-start small mb-4">
                    <i className="bi bi-shield-exclamation me-2"></i>
                    <strong>{isEnglish ? 'Medical Review in Progress:' : 'Validación Médica en Proceso:'}</strong> {isEnglish ? 'This order contains controlled medications. A licensed veterinarian will review the prescription before pickup.' : 'Este pedido contiene medicamentos controlados. Un veterinario revisará la prescripción antes de que puedas recolectarlo en mostrador.'}
                  </div>
                )}

                <div className="card bg-light border-0 rounded-3 p-3 text-start small mb-4">
                  <h6 className="fw-bold text-dark mb-2">
                    {isEnglish ? `Payment Instructions (${metodoPago.toUpperCase()}):` : `Instrucciones de Pago (${metodoPago.toUpperCase()}):`}
                  </h6>
                  {metodoPago === 'spei' && (
                    <div>
                      <p className="mb-1 text-muted">
                        {isEnglish ? 'Transfer to the official clinic CLABE account:' : 'Transfiere a la cuenta CLABE oficial de la clínica:'}
                      </p>
                      <div className="input-group mb-2">
                        <input type="text" readOnly className="form-control font-monospace" value="646180123456789012" />
                        <button className="btn btn-outline-secondary" onClick={() => navigator.clipboard.writeText('646180123456789012')}>
                          {isEnglish ? 'Copy CLABE' : 'Copiar CLABE'}
                        </button>
                      </div>
                      <small className="text-muted">Banco: STP • Beneficiario: Clínica Veterinaria LunaVet • Concepto: Pedido #{orderResult.pedido?.id || orderResult.id}</small>
                    </div>
                  )}
                  {metodoPago === 'mercadopago' && (
                    <p className="mb-0 text-muted">
                      {isEnglish
                        ? `Online payment processed via MercadoPago under reference #${orderResult.pedido?.id || orderResult.id}.`
                        : `Pago en línea procesado a través de MercadoPago con referencia #${orderResult.pedido?.id || orderResult.id}.`}
                    </p>
                  )}
                  {metodoPago === 'efectivo' && (
                    <p className="mb-0 text-muted">
                      {isEnglish
                        ? 'Pay directly at the clinic reception upon pickup (cash or debit/credit card).'
                        : 'Paga directamente en la caja de la clínica al momento de recoger tu pedido.'}
                    </p>
                  )}
                </div>

                <div className="d-flex justify-content-center gap-3">
                  <Link to="/portal" className="btn btn-primary rounded-pill px-4">
                    {t('nav.myPortal', 'Ir a Mi Portal')}
                  </Link>
                  <Link to="/tienda" className="btn btn-outline-secondary rounded-pill px-4">
                    {isEnglish ? 'Continue Shopping' : 'Seguir Comprando'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Formulario de Pago / Checkout */
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
                <h4 className="fw-bold text-dark mb-3">{isEnglish ? 'Review Selected Items' : 'Revisión de Productos'}</h4>
                <div className="table-responsive mb-3">
                  <table className="table align-middle small">
                    <thead className="table-light">
                      <tr>
                        <th>{isEnglish ? 'Product' : 'Producto'}</th>
                        <th>{isEnglish ? 'Qty' : 'Cant.'}</th>
                        <th className="text-end">{t('common.total', 'Total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(({ product, quantity }) => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.nombre}</strong>
                            {product.es_controlado && <span className="badge bg-danger ms-2">{isEnglish ? 'Controlled' : 'Controlado'}</span>}
                            {product.requiere_receta && !product.es_controlado && <span className="badge bg-warning text-dark ms-2">{isEnglish ? 'Rx Required' : 'Receta'}</span>}
                          </td>
                          <td>{quantity}</td>
                          <td className="text-end fw-bold text-primary">
                            ${(parseFloat(product.precio) * quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasControlledItems && (
                  <div className="alert alert-danger small py-2 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                    <div>
                      <strong>{isEnglish ? 'Legal Notice:' : 'Nota Legal:'}</strong> {isEnglish ? 'This order includes controlled substances. A medical prescription issued by a licensed veterinarian is required upon pickup.' : 'Este pedido incluye sustancias controladas. Se requerirá receta médica emitida por un veterinario autorizado antes de la entrega.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Selección de Método de Pago */}
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                <h5 className="fw-bold text-dark mb-3">{t('checkout.paymentMethodTitle', 'Método de Pago')}</h5>

                {errorMsg && (
                  <div className="alert alert-danger small py-2">{errorMsg}</div>
                )}

                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="form-check p-3 border rounded-3 bg-light">
                    <input
                      className="form-check-input ms-0 me-3"
                      type="radio"
                      name="metodoPago"
                      id="speiRadio"
                      value="spei"
                      checked={metodoPago === 'spei'}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="speiRadio">
                      <i className="bi bi-bank me-2 text-primary"></i>{t('checkout.paymentSpei', 'Transferencia SPEI (Sin comisiones)')}
                    </label>
                    <small className="d-block text-muted ms-4">
                      {isEnglish ? 'Instant CLABE information to transfer from your mobile banking app.' : 'Recibe datos CLABE inmediatos para transferir desde tu banca móvil.'}
                    </small>
                  </div>

                  <div className="form-check p-3 border rounded-3 bg-light">
                    <input
                      className="form-check-input ms-0 me-3"
                      type="radio"
                      name="metodoPago"
                      id="mpRadio"
                      value="mercadopago"
                      checked={metodoPago === 'mercadopago'}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="mpRadio">
                      <i className="bi bi-credit-card me-2 text-info"></i>{t('checkout.paymentCard', 'Tarjeta de Débito / Crédito (MercadoPago)')}
                    </label>
                    <small className="d-block text-muted ms-4">
                      {isEnglish ? 'Secure tokenized checkout.' : 'Procesamiento seguro tokenizado.'}
                    </small>
                  </div>

                  <div className="form-check p-3 border rounded-3 bg-light">
                    <input
                      className="form-check-input ms-0 me-3"
                      type="radio"
                      name="metodoPago"
                      id="efectivoRadio"
                      value="efectivo"
                      checked={metodoPago === 'efectivo'}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    />
                    <label className="form-check-label fw-bold" htmlFor="efectivoRadio">
                      <i className="bi bi-cash-coin me-2 text-success"></i>{t('checkout.paymentCash', 'Pago en Mostrador al Recoger')}
                    </label>
                    <small className="d-block text-muted ms-4">
                      {isEnglish ? 'Pay in clinic reception with cash or terminal card.' : 'Paga en recepción en efectivo o tarjeta física.'}
                    </small>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    className="btn btn-primary btn-lg rounded-pill shadow-sm"
                    disabled={submitting}
                    onClick={handleCheckoutSubmit}
                  >
                    {submitting
                      ? t('checkout.processingOrder', 'Confirmando Pedido...')
                      : `${t('checkout.confirmOrderBtn', 'Confirmar Pedido Click & Collect')} ($${subtotal.toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen Lateral */}
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 rounded-4 p-4 bg-white sticky-top" style={{ top: '80px' }}>
                <h5 className="fw-bold text-dark mb-3">{t('checkout.orderSummaryTitle', 'Resumen del Pedido')}</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">{t('common.subtotal', 'Subtotal')}:</span>
                  <span className="fw-bold text-dark">${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">{isEnglish ? 'Fulfillment:' : 'Entrega:'}</span>
                  <span className="text-success fw-bold">Click & Collect ($0.00)</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <span className="fs-5 fw-bold text-dark">{isEnglish ? 'Total Due:' : 'Total a Pagar:'}</span>
                  <span className="fs-4 fw-bold text-primary">${subtotal.toFixed(2)} MXN</span>
                </div>
                <div className="small text-muted">
                  <i className="bi bi-geo-alt me-1"></i> {isEnglish ? 'Pickup Location: Luna-Vet Clinic, Main Front Desk.' : 'Punto de Retiro: Clínica Veterinaria LunaVet, Mostrador Principal.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
