import { useEffect } from 'react';

const DEFAULT_TITLE = 'Luna-Vet | Clínica Veterinaria, Farmacia & Estética en Acapulco';
const DEFAULT_DESC = 'Clínica Veterinaria Luna-Vet en El Coloso, Acapulco. Consultas médicas, esterilizaciones, cirugías, baños garrapaticidas, vacunación, estética y farmacia.';

/**
 * Hook personalizado para actualización dinámica de títulos y metadatos SEO en SPA.
 * @param {string} title - Título descriptivo de la vista
 * @param {string} [description] - Descripción meta optimizada para buscadores
 */
export function usePageSeo(title, description) {
  useEffect(() => {
    const fullTitle = title
      ? (title.includes('Luna-Vet') ? title : `${title} | Luna-Vet Acapulco`)
      : DEFAULT_TITLE;

    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }

    const previousDesc = metaDesc.getAttribute('content');
    if (description) {
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (previousDesc) {
        metaDesc.setAttribute('content', previousDesc);
      } else {
        metaDesc.setAttribute('content', DEFAULT_DESC);
      }
    };
  }, [title, description]);
}
