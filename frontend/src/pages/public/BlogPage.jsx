import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePageSeo } from '../../hooks/usePageSeo';
import { useLanguage } from '../../contexts/LanguageContext';

const fallbackArticles = [
  {
    id: 1,
    titulo: 'La Importancia de la Esterilización Temprana en Perros y Gatos',
    categoria: 'Cirugía & Prevención',
    autor_nombre: 'Dra. Luna • Equipo Luna-Vet',
    resumen: 'Conoce cómo la esterilización previene infecciones uterinas mortales (piometras) y tumores, además de evitar la sobrepoblación en Acapulco.',
    contenido: `¿Sabías que esterilizar a tu mascota salva vidas y prolonga sus años de felicidad?

En Clínica Veterinaria Luna-Vet (Av. Peña Blanca, Etapa 38, El Coloso) promovemos de manera permanente campañas de esterilización a bajo costo para perros y gatos.

Beneficios comprobados:
1. En hembras: Elimina por completo el riesgo de piometra y reduce al mínimo el riesgo de tumores mamarios si se opera a edad temprana.
2. En machos: Previene afecciones prostáticas y tumores testiculares, reduciendo además peleas y escapes territoriales.
3. En la comunidad: Ayuda a reducir el abandono de camadas en las calles de Acapulco.

¡Pide informes de nuestras próximas campañas en clínica o al WhatsApp 744 213 0868!`
  },
  {
    id: 2,
    titulo: 'Cómo Combatir las Garrapatas y el Golpe de Calor en Acapulco',
    categoria: 'Cuidados en Clima Tropical',
    autor_nombre: 'Equipo Médico Luna-Vet',
    resumen: 'Guía práctica para proteger a tus mascotas del calor extremo y erradicar garrapatas con baños medicados y pastillas Bravecto / Simparica.',
    contenido: `El calor y la humedad constante en Acapulco facilitan la proliferación rápida de garrapatas y pulgas, además de poner en riesgo a perros braquicéfalos (Pug, Bulldog) por golpe de calor.

Recomendaciones esenciales de Luna-Vet:
1. No pasees a tu perro sobre pavimento caliente entre las 11:00 y las 16:30 hrs para evitar quemaduras plantares y descompensación térmica.
2. Aplica baños medicados garrapaticidas si observas parásitos en orejas, cuello o entre los dedos.
3. Administra antiparasitarios orales de larga duración (como Bravecto o Simparica) para prevenir enfermedades sanguíneas graves como Ehrlichia.
4. Mantén siempre agua fresca a la sombra y rehidrata con suero oral si notas jadeo excesivo.`
  },
  {
    id: 3,
    titulo: 'Esquema de Vacunación: Protege a tu Cachorro desde sus Primeras Semanas',
    categoria: 'Medicina Preventiva',
    autor_nombre: 'Dra. Luna • Luna-Vet',
    resumen: 'Conoce las edades y vacunas obligatorias para evitar virus mortales como el parvovirus canino y moquillo.',
    contenido: `El parvovirus y el moquillo son enfermedades altamente contagiosas en cachorros que no cuentan con su cuadro de vacunación completo.

Calendario sugerido en Luna-Vet:
• 6 a 8 semanas: Vacuna Puppy (Parvovirus + Moquillo).
• 9 a 11 semanas: Refuerzo Múltiple / Séxtuple.
• 12 a 14 semanas: Segundo refuerzo y Vacuna Antirrábica obligatoria.
• Refuerzo anual: Séxtuple y Rabia para mantener anticuerpos activos.

En Luna-Vet expedimos carnet digital oficial con registro de lote y fecha de vencimiento.`
  }
];

export function BlogPage() {
  const { t, isEnglish } = useLanguage();
  usePageSeo(
    isEnglish
      ? 'Veterinary Health & Wellness Blog | Luna-Vet'
      : 'Blog de Consejos Veterinarios & Salud Animal',
    isEnglish
      ? 'Veterinary articles, nutrition tips, tropical heat care in Acapulco, vaccines, and wellness by the Luna-Vet medical team.'
      : 'Artículos veterinarios, consejos de nutrición, cuidados en clima cálido de Acapulco, vacunas y prevención médica por el equipo clínico de Luna-Vet.'
  );
  const [articles, setArticles] = useState([]);
  const [activeArticle, setActiveArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const res = await api.get('/cms/blog');
        if (res.success && res.data?.length > 0) {
          setArticles(res.data);
        } else {
          setArticles(fallbackArticles);
        }
      } catch {
        setArticles(fallbackArticles);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, []);

  return (
    <div className="py-5 bg-light min-vh-100">
      <div className="container">
        <div className="text-center mb-5">
          <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill mb-2">
            {t('blog.badge', 'Educación y Salud Animal')}
          </span>
          <h1 className="fw-bold text-dark">{t('blog.title', 'Blog de Consejos Veterinarios')}</h1>
          <p className="text-muted">{t('blog.subtitle', 'Artículos prácticos escritos por nuestro equipo médico para el cuidado de tu mascota.')}</p>
        </div>

        {/* Modal / Vista de Lectura de Artículo */}
        {activeArticle && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-bottom">
                  <div>
                    <span className="badge bg-info-subtle text-info-emphasis mb-2">
                      {activeArticle.categoria || t('blog.generalHealth', 'Salud General')}
                    </span>
                    <h4 className="modal-title fw-bold text-dark">{activeArticle.titulo}</h4>
                    <small className="text-muted">
                      {t('blog.byAuthor', {
                        author: activeArticle.autor_nombre || 'Equipo Médico Luna-Vet',
                        date: activeArticle.creado_en ? new Date(activeArticle.creado_en).toLocaleDateString() : (isEnglish ? 'Recent' : 'Reciente')
                      }, `Por ${activeArticle.autor_nombre || 'Equipo Médico Luna-Vet'}`)}
                    </small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setActiveArticle(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="text-secondary" style={{ lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                    {activeArticle.contenido}
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setActiveArticle(null)}>
                    {t('common.close', 'Cerrar')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listado de Artículos */}
        {loading ? (
          <LoadingSpinner message={t('blog.loading', 'Consultando artículos del blog...')} />
        ) : articles.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-white">
            <i className="bi bi-journal-text text-muted display-4 mb-3 d-block"></i>
            <h5 className="text-secondary">{t('blog.noArticles', 'Próximamente más artículos')}</h5>
            <p className="small text-muted mb-0">{t('blog.noArticlesDesc', 'Nuestro equipo está redactando nuevas guías veterinarias.')}</p>
          </div>
        ) : (
          <div className="row g-4">
            {articles.map(art => (
              <div key={art.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 rounded-4 p-4 d-flex flex-column bg-white">
                  <div className="mb-2">
                    <span className="badge bg-primary-subtle text-primary small">
                      {art.categoria || t('blog.badge', 'Consejos')}
                    </span>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{art.titulo}</h5>
                  <p className="text-muted small flex-grow-1">
                    {art.resumen || (art.contenido ? `${art.contenido.substring(0, 120)}...` : '')}
                  </p>
                  <div className="border-top pt-3 mt-3 d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="bi bi-person me-1"></i> {art.autor_nombre || 'Luna-Vet'}
                    </small>
                    <button
                      className="btn btn-outline-primary btn-sm rounded-pill px-3"
                      onClick={() => setActiveArticle(art)}
                    >
                      {t('blog.readMore', 'Leer más')} <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
