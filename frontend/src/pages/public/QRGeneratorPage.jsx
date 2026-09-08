import React from 'react';
import { QRGenerator } from '../../components/qr/QRGenerator';
import { useBrand } from '../../contexts/BrandContext';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../../hooks/usePageSeo';

export function QRGeneratorPage() {
  usePageSeo(
    'Generador de Placas y Códigos QR para Mascotas',
    'Crea e imprime códigos QR para collares de identificación de mascotas, placas metálicas, credenciales clínicas y conexión Wi-Fi con exportación a PDF y PNG.'
  );
  const { brand } = useBrand();

  return (
    <div className="py-5 min-vh-100" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
      <div className="container">
        {/* Encabezado Principal */}
        <div className="text-center max-w-700 mx-auto mb-5">
          <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold mb-2 shadow-sm">
            <i className="bi bi-qr-code-scan me-1"></i> Herramienta Luna-Vet
          </span>
          <h1 className="display-5 fw-bold mb-3">
            Generador de Códigos QR & Placas de Mascotas
          </h1>
          <p className="lead text-secondary fs-6 mb-4">
            Crea placas de identificación inteligentes para el collar de tu mascota, accesos directos a WhatsApp, enlaces para agendar citas, ubicación satelital y conexión Wi-Fi para tu clínica o negocio.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <span className="badge bg-body-secondary text-body border px-3 py-2 rounded-pill">
              <i className="bi bi-shield-check text-success me-1"></i> 100% Gratuito y Permanente
            </span>
            <span className="badge bg-body-secondary text-body border px-3 py-2 rounded-pill">
              <i className="bi bi-filetype-png text-primary me-1"></i> Descarga en Alta Resolución
            </span>
            <span className="badge bg-body-secondary text-body border px-3 py-2 rounded-pill">
              <i className="bi bi-printer text-info me-1"></i> Listo para Imprimir y Enmicar
            </span>
          </div>
        </div>

        {/* Componente Generador QR Interactivo */}
        <div className="mb-5">
          <QRGenerator initialMode="mascota" />
        </div>

        {/* Guía: ¿Cómo funciona la Placa QR para Mascotas? */}
        <div className="card shadow-sm border-0 rounded-4 p-4 p-lg-5 mb-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold mb-2">¿Cómo funciona la Placa QR de Luna-Vet?</h3>
            <p className="text-secondary small">
              Protege a tu perro o gato ante extravíos en 4 sencillos pasos:
            </p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-md-3">
              <div
                className="rounded-circle bg-primary-subtle text-primary mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-pencil-square fs-3"></i>
              </div>
              <h5 className="fw-bold fs-6">1. Personaliza los Datos</h5>
              <p className="small text-muted mb-0">
                Escribe el nombre de tu mascota, raza y el teléfono / WhatsApp directo donde responderás.
              </p>
            </div>

            <div className="col-md-3">
              <div
                className="rounded-circle bg-info-subtle text-info-emphasis mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-palette fs-3"></i>
              </div>
              <h5 className="fw-bold fs-6">2. Elige Colores & Logo</h5>
              <p className="small text-muted mb-0">
                Ajusta el color que combine con el collar o pechera e incrusta el logo o foto de tu peludo.
              </p>
            </div>

            <div className="col-md-3">
              <div
                className="rounded-circle bg-success-subtle text-success mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-printer fs-3"></i>
              </div>
              <h5 className="fw-bold fs-6">3. Descarga o Imprime</h5>
              <p className="small text-muted mb-0">
                Descarga en PNG de alta resolución o imprime en formato placa para acrílico, resina o collar.
              </p>
            </div>

            <div className="col-md-3">
              <div
                className="rounded-circle bg-warning-subtle text-warning-emphasis mx-auto d-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: '64px', height: '64px' }}
              >
                <i className="bi bi-phone fs-3"></i>
              </div>
              <h5 className="fw-bold fs-6">4. Rescate Instantáneo</h5>
              <p className="small text-muted mb-0">
                Cualquier persona que lo encuentre apuntará la cámara de su celular y podrá contactarte al instante sin instalar apps.
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Preguntas Frecuentes */}
        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">
            <h4 className="fw-bold text-center mb-4">Preguntas Frecuentes</h4>
            <div className="accordion shadow-sm rounded-4 overflow-hidden" id="accordionQR">
              <div className="accordion-item border-0 border-bottom">
                <h2 className="accordion-header">
                  <button className="accordion-button fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                    ¿La persona que encuentre a mi mascota necesita descargar alguna aplicación?
                  </button>
                </h2>
                <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#accordionQR">
                  <div className="accordion-body small text-body">
                    No. El 99% de los teléfonos inteligentes actuales (iPhone y Android) leen códigos QR de manera nativa al abrir la cámara fotográfica estándar. Al escanearlo, se abrirá automáticamente una ventana de WhatsApp o llamada directa a tu número registrado.
                  </div>
                </div>
              </div>

              <div className="accordion-item border-0 border-bottom">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                    ¿El código QR expira o tiene algún costo mensual?
                  </button>
                </h2>
                <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#accordionQR">
                  <div className="accordion-body small text-body">
                    No expira jamás y es 100% gratuito. Los códigos generados son estáticos y codifican directamente el enlace de auxilio y contacto, por lo que funcionarán de por vida sin necesidad de suscripciones.
                  </div>
                </div>
              </div>

              <div className="accordion-item border-0">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                    ¿Puedo imprimirlo para colocarlo en una placa de aluminio o resina?
                  </button>
                </h2>
                <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#accordionQR">
                  <div className="accordion-body small text-body">
                    ¡Por supuesto! El generador permite descargar la imagen en formato PNG a alta resolución (hasta 800x800 píxeles) o en formato vectorial SVG, ideal para talleres de grabado láser, sublimación o enmicado térmico.
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <Link to="/citas" className="btn btn-outline-primary rounded-pill px-4">
                <i className="bi bi-calendar2-check me-2"></i> Agendar Cita de Vacunación o Consulta en Luna-Vet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
