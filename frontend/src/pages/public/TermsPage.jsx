import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../../hooks/usePageSeo';
import { useBrand } from '../../contexts/BrandContext';
import { useTheme } from '../../contexts/ThemeContext';

export function TermsPage() {
  usePageSeo(
    'Términos y Condiciones de Servicios Veterinarios',
    'Términos y condiciones integrales para consultas médicas, cirugías, estética, farmacia y hospitalización en Clínica Veterinaria Luna-Vet Acapulco.'
  );

  const { brand } = useBrand();
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState('sec-1');

  const scrollTo = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const SECTIONS = [
    { id: 'sec-1', title: '1. Marco Legal y Ámbito de Aplicación' },
    { id: 'sec-2', title: '2. Naturaleza Médica y Consentimiento' },
    { id: 'sec-3', title: '3. Protocolo de Triage y Urgencias' },
    { id: 'sec-4', title: '4. Citas, Puntualidad y Cancelaciones' },
    { id: 'sec-5', title: '5. Cirugías, Anestesia y Exámenes' },
    { id: 'sec-6', title: '6. Estética, Peluquería y Spa' },
    { id: 'sec-7', title: '7. Farmacia y Medicamentos Controlados' },
    { id: 'sec-8', title: '8. Hospitalización y Abandono Animal' },
    { id: 'sec-9', title: '9. Eutanasia y Disposición de Restos' },
    { id: 'sec-10', title: '10. Tienda Online y Click & Collect' },
    { id: 'sec-11', title: '11. Plataforma Web y Códigos QR' },
    { id: 'sec-12', title: '12. Jurisdicción y Controversias' }
  ];

  return (
    <div className="py-5 min-vh-100" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
      <div className="container">
        {/* Encabezado Principal */}
        <div className="text-center max-w-800 mx-auto mb-5">
          <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-semibold shadow-xs">
              <i className="bi bi-file-earmark-medical me-1"></i> Marco Bioético & Legal
            </span>
            <span className="badge bg-body-secondary text-body border px-3 py-2 rounded-pill shadow-xs">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i> Acapulco de Juárez, Gro.
            </span>
            <span className="badge bg-body-secondary text-body border px-3 py-2 rounded-pill shadow-xs">
              <i className="bi bi-calendar-check text-success me-1"></i> Vigencia 2026
            </span>
          </div>

          <h1 className="display-6 fw-bold mb-3">
            Términos y Condiciones de Servicios Médico-Veterinarios
          </h1>
          <p className="lead text-secondary fs-6 mb-4">
            Contrato de adhesión para la prestación de servicios clínicos, quirúrgicos, estéticos, farmacéuticos y hospitalarios ofrecidos por <strong>{brand.nombreCompleto || 'Clínica Veterinaria Luna-Vet'}</strong> a tutores y propietarios de mascotas.
          </p>

          <div className="d-flex justify-content-center gap-2">
            <button onClick={handlePrint} className="btn btn-outline-secondary rounded-pill btn-sm px-3">
              <i className="bi bi-printer me-1"></i> Imprimir o Guardar PDF
            </button>
            <Link to="/aviso-privacidad" className="btn btn-outline-primary rounded-pill btn-sm px-3">
              <i className="bi bi-shield-check me-1"></i> Ver Aviso de Privacidad
            </Link>
          </div>
        </div>

        <div className="row g-4">
          {/* Índice Lateral Sticky */}
          <div className="col-lg-4 col-xl-3 d-none d-lg-block">
            <div className="sticky-top" style={{ top: '95px', zIndex: 10 }}>
              <div className="card rounded-4 p-3 shadow-sm border-0" style={{ backgroundColor: 'var(--bs-card-bg)' }}>
                <h6 className="fw-bold mb-3 px-2 d-flex align-items-center justify-content-between">
                  <span>Índice del Contrato</span>
                  <span className="badge bg-secondary-subtle text-secondary small">12 Secciones</span>
                </h6>
                <nav className="nav nav-pills flex-column gap-1 small">
                  {SECTIONS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollTo(s.id)}
                      className={`nav-link text-start py-2 px-3 rounded-3 text-truncate border-0 ${
                        activeSection === s.id ? 'active fw-bold' : 'text-body-secondary bg-transparent'
                      }`}
                      style={{ transition: 'all 0.2s ease' }}
                    >
                      {s.title}
                    </button>
                  ))}
                </nav>

                <div className="mt-3 pt-3 border-top px-2">
                  <div className="small text-muted mb-2">
                    <i className="bi bi-info-circle me-1"></i> ¿Dudas sobre una cláusula?
                  </div>
                  <a
                    href={`https://wa.me/52${brand.whatsapp || '7442130868'}?text=Hola%20Luna-Vet,%20tengo%20una%20consulta%20sobre%20los%20Términos%20y%20Condiciones`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success btn-sm w-100 rounded-pill"
                  >
                    <i className="bi bi-whatsapp me-1"></i> Consultar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Completo del Contrato */}
          <div className="col-lg-8 col-xl-9">
            <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5" style={{ backgroundColor: 'var(--bs-card-bg)' }}>
              
              {/* Alerta de Declaración Inicial */}
              <div className="alert alert-primary rounded-4 d-flex align-items-start gap-3 p-3 mb-4 shadow-xs">
                <i className="bi bi-info-circle-fill fs-4 mt-1 flex-shrink-0"></i>
                <div className="small mb-0">
                  <strong>Declaración Fundamental de Servicio Veterinario:</strong> Al agendar citas, internar pacientes, adquirir medicamentos o solicitar servicios estéticos en Luna-Vet, el tutor manifiesta haber leído, comprendido y aceptado en su totalidad las presentes cláusulas de responsabilidad compartida, bioética y legalidad sanitaria mexicana.
                </div>
              </div>

              {/* SECCIÓN 1 */}
              <section id="sec-1" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                  Marco Legal y Ámbito de Aplicación
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    El presente contrato de adhesión regula los términos y condiciones bajo los cuales <strong>{brand.nombreCompleto || 'Clínica Veterinaria Luna-Vet'}</strong> (en lo sucesivo "LA CLÍNICA"), ubicada en {brand.direccion || 'Av. Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero'}, presta servicios médico-veterinarios, quirúrgicos, zootécnicos, estéticos y de comercialización de fármacos y alimentos a la persona física o moral que comparece como propietario, tutor o poseedor responsable de la mascota (en lo sucesivo "EL TUTOR").
                  </p>
                  <p>
                    Las presentes disposiciones se fundamentan en el ordenamiento jurídico de los Estados Unidos Mexicanos, observando de manera expresa:
                  </p>
                  <ul className="mb-3">
                    <li><strong>Ley Federal de Sanidad Animal</strong> y su Reglamento.</li>
                    <li><strong>Ley de Bienestar y Protección Animal del Estado de Guerrero</strong>.</li>
                    <li><strong>NOM-012-ZOO-1993:</strong> Especificaciones para la regulación de productos químicos, farmacéuticos, biológicos y alimenticios para uso en animales.</li>
                    <li><strong>NOM-064-ZOO-2000:</strong> Lineamientos para la clasificación y prescripción de productos farmacéuticos veterinarios.</li>
                    <li><strong>NOM-087-SEMARNAT-SSA1-2002:</strong> Manejo integral de Residuos Peligrosos Biológico-Infecciosos (RPBI).</li>
                    <li><strong>Ley Federal de Protección al Consumidor (PROFECO)</strong> y Código Civil del Estado de Guerrero.</li>
                  </ul>
                </div>
              </section>

              {/* SECCIÓN 2 */}
              <section id="sec-2" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                  Naturaleza del Acto Médico y Consentimiento Informado
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>2.1 Obligación de Medios y No de Resultados:</strong> EL TUTOR reconoce que la medicina veterinaria es una disciplina biológica y clínica en la que influyen respuestas fisiológicas imprevisibles, idiosincrasias medicamentosas, enfermedades subyacentes e inmunocompromiso. Por consiguiente, el cuerpo médico veterinario de LA CLÍNICA contrae una <strong>obligación de diligencia profesional y apego a la lex artis ad hoc</strong>, empleando todo el conocimiento científico, tecnología y fármacos aprobados disponibles, sin que ello pueda interpretarse legal o contractualmente como una garantía incondicional de curación, sobrevivencia o resultado absoluto.
                  </p>
                  <p>
                    <strong>2.2 Consentimiento Informado Expreso:</strong> Ningún procedimiento quirúrgico, sedación profunda, anestesia general, transfusión sanguínea, biopsia invasiva, hospitalización en cuidados críticos ni tratamiento oncológico será ejecutado sin la previa suscripción de la responsiva médica de <em>Consentimiento Informado</em> por parte de EL TUTOR o su representante autorizado debidamente identificado.
                  </p>
                  <p>
                    <strong>2.3 Veracidad en la Historia Clínica:</strong> EL TUTOR asume la responsabilidad civil y médica de informar con total veracidad los antecedentes clínicos del paciente (enfermedades previas, cirugías, tratamientos caseros o no prescritos administrados, alergias y posibles ingestiones de tóxicos). La omisión dolosa o culposa de datos exime de toda responsabilidad médica y legal a LA CLÍNICA ante reacciones adversas desencadenadas por dicha desinformación.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 3 */}
              <section id="sec-3" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                  Protocolo de Triage Médico y Atención de Emergencias
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    En beneficio del bienestar y preservación de la vida animal, LA CLÍNICA rige su sala de atención bajo el estándar internacional de <strong>Triage Veterinario</strong>:
                  </p>
                  <div className="row g-3 my-3">
                    <div className="col-md-4">
                      <div className="border border-danger rounded-3 p-3 h-100 bg-danger-subtle text-danger-emphasis">
                        <div className="fw-bold mb-1"><i className="bi bi-heart-pulse-fill me-1"></i> Código Rojo (Crítico)</div>
                        <div className="small">Paro cardiorrespiratorio, politraumatismo por atropello, hemorragia activa incontrolable, shock térmico o dilatación gástrica. <strong>Prioridad inmediata 0 minutos</strong>.</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border border-warning rounded-3 p-3 h-100 bg-warning-subtle text-warning-emphasis">
                        <div className="fw-bold mb-1"><i className="bi bi-exclamation-triangle-fill me-1"></i> Código Amarillo (Urgente)</div>
                        <div className="small">Convulsiones activas, vómito persistente deshidratante, intoxicación reciente confirmada, fracturas expuestas o retención urinaria felina.</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border border-success rounded-3 p-3 h-100 bg-success-subtle text-success-emphasis">
                        <div className="fw-bold mb-1"><i className="bi bi-shield-check me-1"></i> Código Verde (Programada)</div>
                        <div className="small">Vacunación de rutina, desparasitación, corte de uñas, retiro de puntos, certificados de viaje y consultas dermatológicas crónicas.</div>
                      </div>
                    </div>
                  </div>
                  <p>
                    EL TUTOR acepta que los pacientes clasificados en <strong>Código Rojo</strong> desplazarán de forma automática e inmediata el orden cronológico de turnos y citas previamente agendadas, sin que ello genere penalización o incumplimiento contractual imputable a LA CLÍNICA.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 4 */}
              <section id="sec-4" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                  Políticas de Citas, Puntualidad y Cancelaciones
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <ul>
                    <li><strong>Tolerancia:</strong> Se contempla un margen máximo de <strong>15 minutos</strong> de cortesía sobre la hora acordada. Pasado este tiempo, el turno podrá ser reasignado a pacientes en lista de espera presencial, debiendo EL TUTOR aguardar la siguiente disponibilidad de quirófano o consultorio.</li>
                    <li><strong>Cancelaciones y Reprogramación:</strong> Las cancelaciones de citas ordinarias deben realizarse con al menos <strong>2 horas de anticipación</strong> mediante el portal web o vía WhatsApp oficial al {brand.telefono || '744 213 0868'}.</li>
                    <li><strong>Citas Quirúrgicas:</strong> Toda reserva de quirófano programado exige la confirmación con al menos 24 horas de antelación para la esterilización y preparación del equipo instrumental de anestesia inhalatoria.</li>
                  </ul>
                </div>
              </section>

              {/* SECCIÓN 5 */}
              <section id="sec-5" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>5</span>
                  Protocolos Quirúrgicos, Anestesia y Estudios Preoperatorios
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>5.1 Ayuno Preanestésico Obligatorio:</strong> Salvo indicación pediátrica o metabólica contraria, todo paciente sometido a sedación o cirugía debe cumplir con un ayuno de sólidos de 8 a 12 horas y de líquidos de 2 a 4 horas. Romper el ayuno sin previo aviso incrementa severamente el riesgo de regurgitación, broncoaspiración y asfixia perioperatoria.
                  </p>
                  <p>
                    <strong>5.2 Perfil Preoperatorio:</strong> Para salvaguardar la función renal, hepática y hemodinámica del paciente, LA CLÍNICA recomienda y exige la realización de pruebas de laboratorio sanguíneo (Hemograma, Bioquímica Sanguínea, Tiempos de Coagulación y Pruebas Virales). En caso de que EL TUTOR decida voluntariamente declinar dichos estudios por motivos económicos o personales, deberá suscribir la <strong>Carta de Exoneración de Responsabilidad Quirúrgica</strong>, asumiendo los riesgos de complicaciones no detectables clínicamente.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 6 */}
              <section id="sec-6" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>6</span>
                  Servicios de Estética Canina, Felina y Peluquería
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>6.1 Inspección al Ingreso:</strong> Todo ejemplar que ingrese a baño o corte de pelo es inspeccionado previamente en presencia de EL TUTOR para asentar la existencia de nudos apelmazados, verrugas, cicatrices, ectoparásitos (pulgas o garrapatas) y lesiones cutáneas preexistentes.
                  </p>
                  <p>
                    <strong>6.2 Nudos Apelmazados y Pelado Higiénico:</strong> Desenredar mantos severamente apelmazados genera dolor innecesario y micro-desgarros cutáneos. Ante nudos compactos, LA CLÍNICA priorizará el bienestar animal realizando corte higiénico con máquina, advirtiendo a EL TUTOR sobre el riesgo de hematomas auriculares o irritaciones dérmicas previas ocultas bajo el pelaje anudado.
                  </p>
                  <p>
                    <strong>6.3 Mascotas Reactivas o Braquiocefálicas:</strong> Ejemplares de razas chatas (Pug, Bulldog Inglés/Francés, Shih Tzu, gatos Persa) poseen estenosis de vías aéreas y labilidad térmica en el clima cálido de Acapulco. El personal estilista suspenderá de inmediato el secado o acicalamiento ante cualquier signo de disnea o cianosis. LA CLÍNICA se reserva el derecho de no atender o exigir bozal en ejemplares con agresividad extrema que comprometan la seguridad física del personal.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 7 */}
              <section id="sec-7" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>7</span>
                  Farmacia Veterinaria y Fármacos Controlados
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <div className="p-3 border rounded-3 mb-3 bg-body-secondary">
                    <div className="fw-bold mb-1"><i className="bi bi-prescription2 text-primary me-1"></i> Cumplimiento NOM-064-ZOO-2000 (SENASICA / SADER):</div>
                    <div className="small">
                      Los medicamentos veterinarios clasificados en los Grupos I, II y III (psicotrópicos, opioides, antibióticos de reserva, anestésicos y analgésicos controlados) serán dispensados <strong>única y exclusivamente mediante Receta Médica Retenida u Oficial Cuantificada</strong>, emitida por un Médico Veterinario Zootecnista debidamente acreditado con Cédula Profesional Federal.
                    </div>
                  </div>
                  <p>
                    <strong>Política Sanitaria de No Devolución en Fármacos y Biológicos:</strong> Con base en las disposiciones de bioseguridad, trazabilidad de lotes y mantenimiento estricto de la cadena de frío (2°C a 8°C), <strong>no se aceptan cambios ni devoluciones de medicamentos, vacunas, fórmulas reconstituidas ni jeringas</strong> una vez hayan salido de las instalaciones de LA CLÍNICA, toda vez que se pierde la garantía de conservación y potencia terapéutica.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 8 */}
              <section id="sec-8" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>8</span>
                  Hospitalización, Visitas y Protocolo Legal de Abandono
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>8.1 Visitas e Informes:</strong> Los pacientes hospitalizados recibirán supervisión médica continua. Los reportes clínicos serán proporcionados a EL TUTOR en los horarios oficiales o ante variaciones significativas en signos vitales vía telefónica o WhatsApp.
                  </p>
                  <p>
                    <strong>8.2 Protocolo de Prevención de Abandono Animal:</strong> En estricto apego a la <em>Ley de Bienestar y Protección Animal del Estado de Guerrero</em> y al Código Penal aplicable:
                  </p>
                  <div className="alert alert-warning rounded-3 small mb-3">
                    <strong>Cláusula Resolutiva de Abandono:</strong> Si transcurridas <strong>72 horas naturales</strong> contadas a partir de la fecha y hora fijada para el alta médica de la mascota, o del término del servicio de pensión/estética, EL TUTOR no se presenta a retirar al ejemplar, no contesta los requerimientos vía telefónica, mensajería instantánea ni responde a la notificación en el domicilio asentado en su expediente, LA CLÍNICA procederá a levantar el <em>Acta de Abandono de Mascota</em> ante las autoridades competentes (Fiscalía General del Estado y Dirección de Ecología Municipal), canalizando al ejemplar a instituciones protectoras o albergues certificados. Dicho acto no extingue la obligación patrimonial de EL TUTOR de liquidar la totalidad de gastos médicos, hospedaje y honorarios generados.
                  </div>
                </div>
              </section>

              {/* SECCIÓN 9 */}
              <section id="sec-9" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>9</span>
                  Eutanasia Humanitaria y Disposición de Restos Mortales
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>9.1 Criterio Bioético:</strong> La inducción humanitaria de la muerte de un animal se apega rigurosamente a la <strong>NOM-033-SAG/ZOO-2014</strong>. La eutanasia solo será considerada ante diagnósticos irreversibles que comprometan de forma insuperable el bienestar de la mascota, en estados de sufrimiento intratable, falla multiorgánica terminal o enfermedades zoonóticas de alto peligro para la salud pública.
                  </p>
                  <p>
                    <strong>9.2 Requisitos Indispensables:</strong> Se requiere la mayoría de edad de EL TUTOR, identificación oficial vigente y la firma de la <em>Carta de Consentimiento Informado para Eutanasia</em>.
                  </p>
                  <p>
                    <strong>9.3 Disposición Sanitaria de Restos:</strong> Por mandato de la <strong>NOM-087-SEMARNAT-SSA1-2002</strong>, está terminantemente prohibido arrojar cadáveres animales a contenedores de basura municipal o áreas públicas. LA CLÍNICA ofrece enlace con servicios crematorios certificados (cremación individual con urna o colectiva ecológica). Si EL TUTOR opta por el retiro del cuerpo para sepultura privada en predio particular, asume toda responsabilidad sanitaria y ambiental correspondiente.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 10 */}
              <section id="sec-10" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>10</span>
                  Comercio Electrónico, Pagos y Entrega Click & Collect
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>10.1 Precios y Facturación:</strong> Todos los precios publicados en nuestra plataforma web están expresados en Pesos Mexicanos (MXN) e incluyen el Impuesto al Valor Agregado (IVA) correspondiente. EL TUTOR tiene derecho a solicitar su Comprobante Fiscal Digital por Internet (CFDI) dentro del mes en curso de la transacción proporcionando su Constancia de Situación Fiscal.
                  </p>
                  <p>
                    <strong>10.2 Modalidad Click & Collect (Recogida en Tienda):</strong> Las compras realizadas a través del catálogo virtual se preparan para entrega en el mostrador de LA CLÍNICA. El plazo máximo de resguardo de productos pagados es de 15 días naturales.
                  </p>
                  <p>
                    <strong>10.3 Devolución de Alimento y Accesorios:</strong> Accesorios, collares, transportadoras y bultos de alimento balanceado cerrado en su empaque original de fábrica cuentan con garantía de 7 días naturales por defectos de manufactura o caducidad vencida, presentando el ticket de compra. No aplica devolución en alimentos abiertos o consumidos parcialmente.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 11 */}
              <section id="sec-11" className="mb-5 pb-3 border-bottom">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>11</span>
                  Plataforma Digital, Portal de Clientes y Generador QR
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    <strong>11.1 Herramienta QR de Identificación:</strong> LA CLÍNICA provee una utilidad digital gratuita para la creación de placas QR para collares de mascotas. EL TUTOR reconoce que la información telefónica o de auxilio que decida codificar en dicho QR es de carácter voluntario y público para facilitar el rescate del ejemplar extraviado por parte de cualquier ciudadano que escanee el código.
                  </p>
                  <p>
                    <strong>11.2 Acceso y Seguridad de Cuentas:</strong> Las credenciales de acceso al Portal del Cliente son confidenciales e intransferibles. EL TUTOR es responsable de resguardar su contraseña y notificar cualquier sospecha de vulneración.
                  </p>
                </div>
              </section>

              {/* SECCIÓN 12 */}
              <section id="sec-12" className="mb-4">
                <h3 className="h4 fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="badge bg-primary text-white rounded-circle fs-6 p-2" style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>12</span>
                  Jurisdicción, Ley Aplicable y Solución de Controversias
                </h3>
                <div className="text-body" style={{ lineHeight: '1.8' }}>
                  <p>
                    Para la interpretación, cumplimiento y resolución de controversias derivadas de los actos comerciales y servicios médicos prestados al amparo de este contrato, las partes acuerdan someterse en primera instancia a los mecanismos de conciliación y arbitraje de la <strong>Procuraduría Federal del Consumidor (PROFECO)</strong> en su delegación Acapulco, y subsidiariamente a la jurisdicción de los tribunales civiles competentes de la ciudad y puerto de <strong>Acapulco de Juárez, Estado de Guerrero</strong>, renunciando a cualquier otro fuero que por razón de sus domicilios presentes o futuros pudiera corresponderles.
                  </p>
                </div>
              </section>

              {/* Pie de Página del Contrato */}
              <div className="pt-4 border-top text-center">
                <div className="small text-muted mb-3">
                  Documento redactado con estricto apego a las normas zootécnicas y éticas de la medicina veterinaria mexicana.
                </div>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <Link to="/" className="btn btn-primary rounded-pill px-4 btn-sm">
                    <i className="bi bi-house-door me-1"></i> Volver a la Página Principal
                  </Link>
                  <Link to="/citas" className="btn btn-outline-primary rounded-pill px-4 btn-sm">
                    <i className="bi bi-calendar2-plus me-1"></i> Agendar una Cita Médica
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
