const { db } = require('../../config/database');
const cryptoService = require('../../core/crypto.service');
const { ValidationError, NotFoundError, ForbiddenError } = require('../../core/errors');

const PLANTILLAS_CONSENTIMIENTO = {
  anestesia_cirugia: {
    tipo: 'anestesia_cirugia',
    titulo: 'Consentimiento Informado para Procedimientos Quirúrgicos y Anestesia General',
    contenido: `Por medio de la presente, autorizo al cuerpo médico veterinario de Luna-Vet a realizar el procedimiento quirúrgico y la administración de anestesia general necesaria a mi mascota. He sido informado detalladamente sobre los riesgos inherentes a la anestesia y la cirugía, incluyendo reacciones adversas idiosincráticas, paro cardiorrespiratorio y complicaciones postoperatorias. Confirmo haber respetado el ayuno previo indicado y declaro haber reportado todo antecedente médico y alergias conocidas.`
  },
  eutanasia_nom033: {
    tipo: 'eutanasia_nom033',
    titulo: 'Acta de Consentimiento para Eutanasia Humanitaria (NOM-033-SAG/ZOO-2014)',
    contenido: `En estricto apego a la Norma Oficial Mexicana NOM-033-SAG/ZOO-2014 ("Métodos para dar muerte a los animales domésticos y silvestres"), el suscrito propietario o tutor legal manifiesta su libre voluntad para inducir el cese compasivo de la vida del animal, motivado por enfermedad terminal irreversible, sufrimiento intratable o deterioro orgánico severo que compromete su bienestar. Se autoriza la administración del protocolo médico compasivo de sobredosis de barbitúricos previa inducción de anestesia profunda.`
  },
  estetica_braquiocefalico: {
    tipo: 'estetica_braquiocefalico',
    titulo: 'Deslinde de Responsabilidad y Riesgo Respiratorio en Pacientes Braquiocefálicos (Grooming)',
    contenido: `Reconozco que los ejemplares de razas braquiocefálicas (como Bulldog Francés, Bulldog Inglés, Pug, Boston Terrier, Gato Persa, etc.) presentan el Síndrome Braquiocefálico de las Vías Respiratorias (estenosis de narinas, paladar blando elongado y colapso laríngeo). Entiendo que situaciones de estrés, baño caliente o secado con turbina pueden desencadenar hipertermia, disnea aguda o colapso respiratorio, autorizando medidas veterinarias de urgencia inmediatas si el personal lo estima necesario.`
  },
  hospitalizacion_critica: {
    tipo: 'hospitalizacion_critica',
    titulo: 'Autorización de Ingreso a Hospitalización y Cuidados Intensivos',
    contenido: `Autorizo el internamiento de mi mascota en las instalaciones de Luna-Vet, así como la colocación de catéteres intravenosos, fluidoterapia, toma de muestras sanguíneas/orina y administración de fármacos de soporte vital prescritos por el médico veterinario a cargo.`
  }
};

class ConsentService {
  static obtenerPlantillas() {
    return PLANTILLAS_CONSENTIMIENTO;
  }

  static async registrarConsentimiento(data) {
    const {
      mascota_id,
      cliente_id,
      veterinario_id,
      tipo_consentimiento,
      titulo,
      contenido_legal,
      firma_datos_base64,
      metadata_ip,
      user_agent
    } = data;

    if (!mascota_id || !cliente_id || !veterinario_id || !tipo_consentimiento || !firma_datos_base64) {
      throw new ValidationError('Mascota, cliente, veterinario, tipo y trazo de firma son requeridos');
    }

    // Hash criptográfico de integridad SHA-256 (combina trazo de firma + texto legal + ids)
    const datosFirmados = `${contenido_legal}|${firma_datos_base64}|${mascota_id}|${cliente_id}`;
    const firma_base64_hash = cryptoService.sha256(datosFirmados);

    const [id] = await db('consentimientos_firmados').insert({
      mascota_id,
      cliente_id,
      veterinario_id,
      tipo_consentimiento,
      titulo: titulo || PLANTILLAS_CONSENTIMIENTO[tipo_consentimiento]?.titulo || 'Consentimiento Informado',
      contenido_legal: contenido_legal || PLANTILLAS_CONSENTIMIENTO[tipo_consentimiento]?.contenido || '',
      firma_base64_hash,
      firma_datos_base64,
      metadata_ip: metadata_ip || null,
      user_agent: user_agent || null,
      firmado_en: new Date()
    });

    return this.obtenerConsentimientoPorId(id);
  }

  static async obtenerConsentimientoPorId(id, currentUser = null) {
    const doc = await db('consentimientos_firmados as c')
      .join('mascotas as m', 'c.mascota_id', 'm.id')
      .join('usuarios as cli', 'c.cliente_id', 'cli.id')
      .join('usuarios as vet', 'c.veterinario_id', 'vet.id')
      .where('c.id', id)
      .select(
        'c.*',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'm.raza as mascota_raza',
        'cli.nombre as cli_nombre',
        'cli.apellido as cli_apellido',
        'cli.email as cliente_email',
        'cli.telefono_cifrado as cliente_telefono',
        'vet.nombre as vet_nombre',
        'vet.apellido as vet_apellido',
        'vet.cedula_profesional as veterinario_cedula'
      )
      .first();

    if (!doc) {
      throw new NotFoundError('Consentimiento firmado no encontrado');
    }

    if (currentUser && currentUser.rol === 'cliente' && doc.cliente_id !== currentUser.id) {
      throw new ForbiddenError('No tiene permisos para consultar este documento de consentimiento.');
    }

    return {
      ...doc,
      cliente_nombre: `${doc.cli_nombre || ''} ${doc.cli_apellido || ''}`.trim() || 'Cliente Luna-Vet',
      veterinario_nombre: `${doc.vet_nombre || ''} ${doc.vet_apellido || ''}`.trim() || 'Médico Veterinario'
    };
  }

  static async listarConsentimientos(filtros = {}) {
    let query = db('consentimientos_firmados as c')
      .join('mascotas as m', 'c.mascota_id', 'm.id')
      .join('usuarios as cli', 'c.cliente_id', 'cli.id')
      .join('usuarios as vet', 'c.veterinario_id', 'vet.id')
      .select(
        'c.id',
        'c.mascota_id',
        'c.cliente_id',
        'c.veterinario_id',
        'c.tipo_consentimiento',
        'c.titulo',
        'c.firma_base64_hash',
        'c.firmado_en',
        'm.nombre as mascota_nombre',
        'm.especie as mascota_especie',
        'cli.nombre as cli_nombre',
        'cli.apellido as cli_apellido',
        'vet.nombre as vet_nombre',
        'vet.apellido as vet_apellido'
      )
      .orderBy('c.firmado_en', 'desc');

    if (filtros.mascota_id) {
      query = query.where('c.mascota_id', filtros.mascota_id);
    }
    if (filtros.cliente_id) {
      query = query.where('c.cliente_id', filtros.cliente_id);
    }
    if (filtros.tipo_consentimiento) {
      query = query.where('c.tipo_consentimiento', filtros.tipo_consentimiento);
    }

    const rows = await query;
    return rows.map(r => ({
      ...r,
      cliente_nombre: `${r.cli_nombre || ''} ${r.cli_apellido || ''}`.trim() || 'Cliente Luna-Vet',
      veterinario_nombre: `${r.vet_nombre || ''} ${r.vet_apellido || ''}`.trim() || 'Médico Veterinario'
    }));
  }
}

module.exports = ConsentService;
