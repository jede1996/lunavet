import React, { useState, useEffect } from 'react';
import CashRegisterModal from '../../components/commerce/CashRegisterModal';
import { useLanguage } from '../../contexts/LanguageContext';

export default function POSPage() {
  const { t, isEnglish } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ productos: [], servicios: [] });
  const [cart, setCart] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Turno de caja activo
  const [activeShift, setActiveShift] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Modal comprobante / ticket
  const [lastSale, setLastSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Pago
  const [paymentMethod, setPaymentMethod] = useState('efectivo'); // 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [montoTarjeta, setMontoTarjeta] = useState('');
  const [montoTransferencia, setMontoTransferencia] = useState('');
  const [notasCliente, setNotasCliente] = useState('');

  const checkActiveShift = async () => {
    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/commerce/cash-register/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setActiveShift(json.data || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (q = '') => {
    try {
      setLoadingSearch(true);
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch(`/api/commerce/pos/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSearchResults(json.data || { productos: [], servicios: [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initPOS = async () => {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      try {
        const [shiftRes, searchRes] = await Promise.all([
          fetch('/api/commerce/cash-register/active', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/commerce/pos/search?q=', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (!active) return;
        if (shiftRes.ok) {
          const shiftJson = await shiftRes.json();
          setActiveShift(shiftJson.data || null);
        }
        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          setSearchResults(searchJson.data || { productos: [], servicios: [] });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingSearch(false);
      }
    };
    initPOS();
    return () => {
      active = false;
    };
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.tipo_item === item.tipo_item);
      if (existing) {
        return prev.map(i =>
          i.id === item.id && i.tipo_item === item.tipo_item
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const updateQuantity = (index, delta) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[index].cantidad + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index].cantidad = newQty;
      }
      return next;
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalCart = cart.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      alert('Agregue productos o servicios al carrito para procesar el cobro.');
      return;
    }

    try {
      const token = localStorage.getItem('lunavet_token') || sessionStorage.getItem('lunavet_token');
      const res = await fetch('/api/commerce/pos/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(i => ({
            id: i.id,
            tipo_item: i.tipo_item,
            nombre: i.nombre,
            precio: i.precio,
            cantidad: i.cantidad
          })),
          metodo_pago: paymentMethod,
          monto_efectivo: paymentMethod === 'mixto' ? parseFloat(montoEfectivo) || 0 : paymentMethod === 'efectivo' ? totalCart : 0,
          monto_tarjeta: paymentMethod === 'mixto' ? parseFloat(montoTarjeta) || 0 : paymentMethod === 'tarjeta' ? totalCart : 0,
          monto_transferencia: paymentMethod === 'mixto' ? parseFloat(montoTransferencia) || 0 : paymentMethod === 'transferencia' ? totalCart : 0,
          notas_cliente: notasCliente
        })
      });
      const json = await res.json();
      if (res.ok) {
        setLastSale(json.data);
        setShowReceiptModal(true);
        setCart([]);
        setMontoEfectivo('');
        setMontoTarjeta('');
        setMontoTransferencia('');
        setNotasCliente('');
        checkActiveShift();
        handleSearch(searchQuery);
      } else {
        alert(json.message || 'Error al procesar la venta');
      }
    } catch {
      alert('Error de conexión al procesar venta');
    }
  };

  return (
    <div className="container-fluid py-4 px-md-5">
      {/* Header & Shift Status */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bolder mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-shop text-primary"></i> {t('staff.posTitle', 'Punto de Venta (POS) Mostrador')}
          </h2>
          <p className="text-muted mb-0 small">
            {isEnglish
              ? 'Unified billing for pharmacy, grooming, vaccines, and medical consultations with cash register reconciliation.'
              : 'Cobro unificado de farmacia, estética, vacunas y honorarios médicos con arqueo de caja chica.'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {activeShift ? (
            <button
              type="button"
              className="btn btn-outline-success rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-2"
              onClick={() => setShowRegisterModal(true)}
            >
              <span className="badge bg-success rounded-circle p-1"></span>
              <span>{isEnglish ? 'Register Open:' : 'Caja Abierta:'} <strong>${activeShift.monto_cierre_esperado?.toFixed(2)}</strong></span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-warning rounded-pill px-3 fw-semibold shadow-sm animate__animated animate__pulse"
              onClick={() => setShowRegisterModal(true)}
            >
              <i className="bi bi-exclamation-circle me-1"></i> {t('staff.openShiftBtn', 'Abrir Turno de Caja')}
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* PANEL IZQUIERDO: BÚSQUEDA Y CATÁLOGO RÁPIDO */}
        <div className="col-lg-7">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100">
            {/* Buscador */}
            <div className="input-group input-group-lg mb-4 rounded-pill overflow-hidden border shadow-sm">
              <span className="input-group-text bg-body border-0 ps-4 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 bg-body shadow-none px-2"
                placeholder="Escriba el nombre del fármaco, servicio o código..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
              {loadingSearch && (
                <span className="input-group-text bg-body border-0 pe-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                </span>
              )}
            </div>

            {/* Lista de Resultados */}
            <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
              {/* Sección Productos */}
              <h6 className="fw-bold text-muted text-uppercase small mb-3">
                <i className="bi bi-capsule me-1 text-primary"></i> Farmacia & Alimentos ({searchResults.productos?.length || 0})
              </h6>
              <div className="row g-2 mb-4">
                {searchResults.productos && searchResults.productos.length > 0 ? (
                  searchResults.productos.map(p => (
                    <div key={`p-${p.id}`} className="col-md-6">
                      <div
                        className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-body-tertiary cursor-pointer"
                        onClick={() => addToCart({ ...p, tipo_item: 'producto' })}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex gap-2 align-items-center mb-2">
                          <div
                            className="rounded-3 p-1 bg-body d-flex align-items-center justify-content-center flex-shrink-0 nm-inset-well"
                            style={{ width: '48px', height: '48px' }}
                          >
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} className="w-100 h-100 object-fit-contain" />
                            ) : (
                              <i className="bi bi-capsule text-primary fs-5"></i>
                            )}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <h6 className="fw-bold mb-0 text-truncate text-emphasis" title={p.nombre}>{p.nombre}</h6>
                            <span className="badge bg-primary rounded-pill mt-1">${parseFloat(p.precio).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center small text-secondary">
                          <span><i className="bi bi-box-seam me-1"></i>Stock: {p.stock_total ?? p.stock_disponible_total ?? 0}</span>
                          {p.es_controlado && <span className="badge bg-danger text-white">Controlado</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-secondary small ps-3">No se encontraron productos coincidentes.</div>
                )}
              </div>

              {/* Sección Servicios */}
              <h6 className="fw-bold text-secondary text-uppercase small mb-3">
                <i className="bi bi-scissors me-1 text-info"></i> Consultas, Estética & Procedimientos ({searchResults.servicios?.length || 0})
              </h6>
              <div className="row g-2">
                {searchResults.servicios && searchResults.servicios.length > 0 ? (
                  searchResults.servicios.map(s => (
                    <div key={`s-${s.id}`} className="col-md-6">
                      <div
                        className="card h-100 border-0 shadow-sm rounded-4 p-3 bg-body-tertiary cursor-pointer"
                        onClick={() => addToCart({ ...s, tipo_item: 'servicio' })}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex gap-2 align-items-center mb-2">
                          <div
                            className="rounded-3 p-1 bg-body d-flex align-items-center justify-content-center flex-shrink-0 nm-inset-well text-info"
                            style={{ width: '48px', height: '48px' }}
                          >
                            <i className="bi bi-scissors fs-5"></i>
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <h6 className="fw-bold mb-0 text-truncate text-emphasis" title={s.nombre}>{s.nombre}</h6>
                            <span className="badge bg-info text-dark rounded-pill mt-1">${parseFloat(s.precio).toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="small text-secondary d-block"><i className="bi bi-clock me-1"></i>{s.duracion_minutos || 30} min</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-secondary small ps-3">No se encontraron servicios coincidentes.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: TICKET & COBRO */}
        <div className="col-lg-5">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100 d-flex flex-column">
            <h5 className="fw-bold mb-3 d-flex justify-content-between align-items-center">
              <span><i className="bi bi-receipt me-2"></i> Ticket de Mostrador</span>
              <span className="badge bg-secondary rounded-pill small">{cart.length} partidas</span>
            </h5>

            {/* Listado Partidas del Carrito */}
            <div className="flex-grow-1 border rounded-3 p-2 mb-3 bg-body-tertiary" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                  Haga clic en los productos o servicios de la izquierda para agregarlos al ticket.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="card border-0 bg-body rounded-3 p-2 mb-2 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1 me-2 text-truncate">
                        <div className="fw-bold small text-truncate">{item.nombre}</div>
                        <div className="small text-muted">${parseFloat(item.precio).toFixed(2)} c/u</div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <div className="btn-group btn-group-sm">
                          <button type="button" className="btn btn-outline-secondary" onClick={() => updateQuantity(idx, -1)}>-</button>
                          <span className="btn btn-outline-secondary disabled fw-bold px-3">{item.cantidad}</span>
                          <button type="button" className="btn btn-outline-secondary" onClick={() => updateQuantity(idx, 1)}>+</button>
                        </div>
                        <span className="fw-bold text-end ps-2" style={{ minWidth: '65px' }}>
                          ${(item.precio * item.cantidad).toFixed(2)}
                        </span>
                        <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={() => removeFromCart(idx)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom mb-3">
              <span className="fs-5 fw-bold">{isEnglish ? 'TOTAL DUE:' : 'TOTAL A COBRAR:'}</span>
              <span className="fs-3 fw-bolder text-primary">${totalCart.toFixed(2)}</span>
            </div>

            {/* Forma de Pago */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted mb-1">{t('common.paymentMethod', 'Método de Pago')}:</label>
              <div className="btn-group w-100" role="group">
                <input type="radio" className="btn-check" name="paymentRadio" id="pagoEfectivo" checked={paymentMethod === 'efectivo'} onChange={() => setPaymentMethod('efectivo')} />
                <label className="btn btn-outline-primary btn-sm rounded-start-pill" htmlFor="pagoEfectivo">{t('common.cash', 'Efectivo')}</label>

                <input type="radio" className="btn-check" name="paymentRadio" id="pagoTarjeta" checked={paymentMethod === 'tarjeta'} onChange={() => setPaymentMethod('tarjeta')} />
                <label className="btn btn-outline-primary btn-sm" htmlFor="pagoTarjeta">{t('common.card', 'Tarjeta')}</label>

                <input type="radio" className="btn-check" name="paymentRadio" id="pagoTransf" checked={paymentMethod === 'transferencia'} onChange={() => setPaymentMethod('transferencia')} />
                <label className="btn btn-outline-primary btn-sm" htmlFor="pagoTransf">{t('common.transfer', 'Transferencia')}</label>

                <input type="radio" className="btn-check" name="paymentRadio" id="pagoMixto" checked={paymentMethod === 'mixto'} onChange={() => setPaymentMethod('mixto')} />
                <label className="btn btn-outline-primary btn-sm rounded-end-pill" htmlFor="pagoMixto">{t('common.mixed', 'Mixto')}</label>
              </div>
            </div>

            {/* Desglose de Pago Mixto */}
            {paymentMethod === 'mixto' && (
              <div className="card border-0 bg-body-tertiary p-3 rounded-3 mb-3 small">
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label text-muted mb-1">{isEnglish ? 'Cash ($):' : 'Efectivo ($):'}</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={montoEfectivo} onChange={e => setMontoEfectivo(e.target.value)} />
                  </div>
                  <div className="col-4">
                    <label className="form-label text-muted mb-1">{isEnglish ? 'Card ($):' : 'Tarjeta ($):'}</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={montoTarjeta} onChange={e => setMontoTarjeta(e.target.value)} />
                  </div>
                  <div className="col-4">
                    <label className="form-label text-muted mb-1">{isEnglish ? 'Wire ($):' : 'Transf. ($):'}</label>
                    <input type="number" step="0.5" className="form-control form-control-sm" value={montoTransferencia} onChange={e => setMontoTransferencia(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Botón Cobro */}
            <button
              type="button"
              className="btn btn-success btn-lg rounded-pill fw-bold shadow mt-auto"
              onClick={handleProcessSale}
              disabled={cart.length === 0}
            >
              <i className="bi bi-check2-circle me-2"></i> {t('staff.payAndPrintTicket', 'Cobrar e Imprimir Ticket')} (${totalCart.toFixed(2)})
            </button>
          </div>
        </div>
      </div>

      {/* Modal Arqueo de Caja */}
      <CashRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onShiftUpdated={() => checkActiveShift()}
      />

      {/* Modal Comprobante / Ticket Exitoso */}
      {showReceiptModal && lastSale && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
                <h5 className="modal-title fw-bold text-success">
                  <i className="bi bi-check-circle-fill me-2"></i> Venta Exitosa en Mostrador
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReceiptModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="badge bg-dark rounded-pill px-3 py-2 fs-6 mb-3">
                  FOLIO: {lastSale.folio}
                </div>
                <h2 className="fw-bolder text-primary mb-1">${lastSale.total?.toFixed(2)}</h2>
                <div className="small text-muted mb-3">Método de Pago: <strong>{lastSale.metodo_pago?.toUpperCase()}</strong></div>

                <div className="alert alert-info rounded-3 text-start small p-3">
                  <div><strong>Sello Criptográfico:</strong></div>
                  <code className="text-break text-muted" style={{ fontSize: '0.75rem' }}>{lastSale.hash_comprobante}</code>
                </div>

                <p className="small text-muted mb-0">
                  El inventario de farmacia y el turno de caja chica han sido actualizados en tiempo real.
                </p>
              </div>
              <div className="modal-footer px-4 py-3 bg-body-tertiary d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => window.print()}>
                  <i className="bi bi-printer me-1"></i> Imprimir Ticket
                </button>
                <button type="button" className="btn btn-primary btn-sm px-4 rounded-pill" onClick={() => setShowReceiptModal(false)}>
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
