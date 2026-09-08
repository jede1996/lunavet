import React, { useRef, useState, useEffect } from 'react';

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSaveSignature,
  title = 'Firma Digital de Consentimiento',
  legalNotice = 'Al firmar este documento, declaro bajo protesta de decir verdad que soy el propietario o tutor legal de la mascota y otorgo mi pleno consentimiento para el procedimiento.'
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Set canvas display resolution matching client size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setHasSignature(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature) {
      alert('Por favor plasme su firma en el recuadro antes de continuar.');
      return;
    }
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header border-bottom px-4 py-3 bg-body-tertiary">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-pen text-primary fs-5"></i>
              <h5 className="modal-title fw-bold mb-0">{title}</h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body p-4">
            <div className="alert alert-info py-2 px-3 mb-3 small d-flex align-items-start gap-2 rounded-3 border-0 bg-opacity-25">
              <i className="bi bi-shield-check fs-5 text-info mt-1"></i>
              <div>
                <strong>Aviso de Validez Jurídica:</strong> {legalNotice}
              </div>
            </div>

            <label className="form-label small fw-semibold text-muted mb-2">
              Trace su firma con el dedo, stylus táctil o ratón en el recuadro inferior:
            </label>

            <div
              className="border rounded-4 bg-white position-relative shadow-sm overflow-hidden"
              style={{ height: '220px', touchAction: 'none', cursor: 'crosshair' }}
            >
              <canvas
                ref={canvasRef}
                className="w-100 h-100"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div
                className="position-absolute bottom-0 start-0 end-0 border-top border-dashed text-muted text-center py-1 small"
                style={{ pointerEvents: 'none', backgroundColor: 'rgba(255,255,255,0.85)', fontSize: '0.78rem' }}
              >
                <i className="bi bi-x-lg me-1"></i> Línea de firma del propietario / tutor legal
              </div>
            </div>
          </div>

          <div className="modal-footer px-4 py-3 bg-body-tertiary d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 rounded-pill"
              onClick={clearCanvas}
            >
              <i className="bi bi-eraser me-1"></i> Limpiar Trazo
            </button>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm px-3 rounded-pill"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm px-4 rounded-pill fw-semibold shadow-sm"
                onClick={handleConfirm}
                disabled={!hasSignature}
              >
                <i className="bi bi-check2-circle me-1"></i> Confirmar y Firmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
