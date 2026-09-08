import React from 'react';
import { QRGenerator } from './QRGenerator';

export function QRGeneratorModal({ show, onClose, initialMode = 'mascota', initialData = {} }) {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div className="modal-header bg-dark text-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary px-3 py-2 rounded-pill">
                <i className="bi bi-qr-code-scan me-1"></i> Generador QR
              </span>
              <h5 className="modal-title fw-bold mb-0">
                Generador de Códigos QR Personalizables
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-4 bg-light">
            <QRGenerator
              initialMode={initialMode}
              initialData={initialData}
              onDone={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
