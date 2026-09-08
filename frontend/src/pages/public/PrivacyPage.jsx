import React from 'react';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../../hooks/usePageSeo';

export function PrivacyPage() {
  usePageSeo(
    'Aviso de Privacidad Integral',
    'Aviso de Privacidad de Clínica Veterinaria Luna-Vet en Acapulco conforme a la LFPDPPP. Medidas de seguridad, derechos ARCO y confidencialidad médica.'
  );

  return (
    <div className="py-5 min-vh-100" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5" style={{ backgroundColor: 'var(--bs-card-bg)' }}>
              <span className="badge bg-secondary-subtle text-secondary mb-2" style={{ width: 'fit-content' }}>
                Marco Legal LFPDPPP
              </span>
              <h1 className="h2 fw-bold mb-3">Aviso de Privacidad Integral</h1>
              <p className="text-muted small">Última actualización: Septiembre 2026 • Clínica Veterinaria Luna-Vet (Acapulco)</p>
              <hr />

              <div className="text-secondary small" style={{ lineHeight: '1.8' }}>
                <h5 className="fw-bold mb-3">1. Identidad y Domicilio del Responsable</h5>
                <p>
                  Clínica Veterinaria Luna-Vet, con domicilio en Avenida Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero, es responsable del uso, protección y tratamiento de sus datos personales conforme a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
                </p>

                <h5 className="fw-bold mb-3">2. Datos Personales Recabados</h5>
                <p>
                  Para la prestación de los servicios clínicos, agendamiento de citas y venta de medicamentos veterinarios, recabamos: nombre completo, teléfono de contacto, correo electrónico y datos generales de sus mascotas (nombre, especie, raza, edad, peso y antecedentes clínicos).
                </p>

                <h5 className="fw-bold mb-3">3. Finalidades del Tratamiento</h5>
                <ul>
                  <li>Apertura y resguardo del expediente clínico electrónico veterinario.</li>
                  <li>Emisión de recetas médicas oficiales y trazabilidad de medicamentos controlados.</li>
                  <li>Envío de recordatorios automatizados de citas y refuerzos de vacunación.</li>
                  <li>Gestión de compras bajo la modalidad de entrega en mostrador (Click & Collect).</li>
                </ul>

                <h5 className="fw-bold mb-3">4. Medidas de Seguridad y Cifrado</h5>
                <p>
                  Sus datos de contacto y antecedentes clínicos son protegidos mediante mecanismos de cifrado simétrico AES-256-GCM y protocolos de comunicación segura HTTPS. No almacenamos datos de tarjetas bancarias en texto plano.
                </p>

                <h5 className="fw-bold mb-3">5. Ejercicio de Derechos ARCO</h5>
                <p>
                  Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros (Cancelación) oponerse al uso de sus datos para fines específicos (Oposición).
                </p>
              </div>

              <div className="mt-4 pt-3 border-top d-flex justify-content-center gap-2 flex-wrap">
                <Link to="/" className="btn btn-primary rounded-pill px-4 btn-sm">
                  <i className="bi bi-house me-1"></i> Volver al Inicio
                </Link>
                <Link to="/terminos-condiciones" className="btn btn-outline-secondary rounded-pill px-4 btn-sm">
                  <i className="bi bi-file-earmark-medical me-1"></i> Ver Términos y Condiciones
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
