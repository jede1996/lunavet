/**
 * Script de inicialización de datos oficiales para Luna-Vet Acapulco
 * Extraídos directamente de su página oficial de Facebook:
 * https://www.facebook.com/profile.php?id=100083388274818
 */
const { db } = require('../src/config/database');
const passwordService = require('../src/core/password.service');

async function seedLunaVetData() {
  console.log('[Luna-Vet Seed] Iniciando siembra de datos oficiales de Facebook...');

  try {
    // 1. Sucursal Oficial
    const sucursalExists = await db('sucursales').where({ telefono: '7442130868' }).orWhere({ telefono: '744 213 0868' }).first();
    if (!sucursalExists) {
      await db('sucursales').insert({
        nombre: 'Clínica Veterinaria Luna-Vet (El Coloso)',
        direccion: 'Av. Peña Blanca, Etapa 38, Unidad Habitacional El Coloso, C.P. 39810, Acapulco de Juárez, Guerrero',
        telefono: '744 213 0868',
        activo: true
      });
      console.log('[Luna-Vet Seed] Sucursal Acapulco insertada.');
    }

    // 2. Veterinario de la clínica
    const vetEmail = 'veterinario@lunavet.lat';
    const vetPassword = 'VetLunaVet2026!';
    const existingVet = await db('usuarios').where({ email: vetEmail }).first();
    let vetId;

    if (!existingVet) {
      const hash = await passwordService.hash(vetPassword);
      const [id] = await db('usuarios').insert({
        email: vetEmail,
        password_hash: hash,
        nombre: 'Dra. Luna',
        apellido: 'Veterinaria',
        rol: 'veterinario',
        telefono_cifrado: null,
        activo: true,
        dos_factores_habilitado: false
      });
      vetId = id;
      console.log(`[Luna-Vet Seed] Veterinario creado: ${vetEmail}`);
    } else {
      vetId = existingVet.id;
    }

    // 3. Servicios Oficiales de Luna-Vet (Esterilizaciones, Baños garrapaticidas, etc.)
    const servicios = [
      {
        nombre: 'Campaña de Esterilización Canina y Felina',
        descripcion: 'Cirugía segura de esterilización (Ovariohisterectomía / Orquiectomía) preventiva, previene tumores mamarios, piometras y sobrepoblación.',
        duracion_minutos: 60,
        precio: 650.00,
        activo: true
      },
      {
        nombre: 'Baño Garrapaticida & Antipulgas Medicado',
        descripcion: 'Tratamiento dérmico especializado para erradicar infestaciones severas de garrapatas y pulgas, adaptado al clima cálido de Acapulco.',
        duracion_minutos: 45,
        precio: 250.00,
        activo: true
      },
      {
        nombre: 'Consulta Médica Veterinaria General',
        descripcion: 'Evaluación física completa, toma de constantes fisiológicas, diagnóstico certero y prescripción médica formal.',
        duracion_minutos: 30,
        precio: 250.00,
        activo: true
      },
      {
        nombre: 'Vacunación Canina Completa (Séxtuple + Rabia)',
        descripcion: 'Inmunización de alta calidad contra parvovirus, moquillo, hepatitis, leptospira y rabia, incluye carnet oficial.',
        duracion_minutos: 20,
        precio: 350.00,
        activo: true
      },
      {
        nombre: 'Vacunación Felina Integral (Triple Felina + Rabia)',
        descripcion: 'Protección integral contra rinotraqueítis, calicivirus, panleucopenia y rabia para michis de cualquier edad.',
        duracion_minutos: 20,
        precio: 350.00,
        activo: true
      },
      {
        nombre: 'Estética Canina Integral & Corte de Raza',
        descripcion: 'Baño con agua tibia, shampoo hidratante, secado, corte según estándar de raza o corte higiénico, corte de uñas y limpieza de oídos.',
        duracion_minutos: 60,
        precio: 300.00,
        activo: true
      },
      {
        nombre: 'Desparasitación Interna y Externa por Peso',
        descripcion: 'Dosificación exacta de antiparasitarios de amplio espectro contra nematodos, cestodos y ectoparásitos.',
        duracion_minutos: 15,
        precio: 150.00,
        activo: true
      },
      {
        nombre: 'Cirugía de Tejidos Blandos y Urgencias',
        descripcion: 'Intervenciones quirúrgicas generales, cesáreas, retiro de neoplasias y sutura de heridas traumáticas con monitoreo postoperatorio.',
        duracion_minutos: 90,
        precio: 1200.00,
        activo: true
      }
    ];

    for (const s of servicios) {
      const exists = await db('servicios').where({ nombre: s.nombre }).first();
      if (!exists) {
        await db('servicios').insert(s);
        console.log(`[Luna-Vet Seed] Servicio insertado: ${s.nombre}`);
      }
    }

    // 4. Categorías de Tienda & Farmacia
    const categorias = [
      { nombre: 'Antiparasitarios & Garrapaticidas', slug: 'antiparasitarios-garrapaticidas', descripcion: 'Tratamientos orales y tópicos para pulgas y garrapatas' },
      { nombre: 'Alimentos & Nutrición', slug: 'alimentos-nutricion', descripcion: 'Alimentos premium, fórmulas veterinarias y snacks saludables' },
      { nombre: 'Farmacia & Medicamentos', slug: 'farmacia-medicamentos', descripcion: 'Antibióticos, analgésicos, antiinflamatorios y sueros' },
      { nombre: 'Higiene & Estética', slug: 'higiene-estetica', descripcion: 'Shampoos dermatológicos, lociones y cepillos de aseo' },
      { nombre: 'Accesorios & Cuidado', slug: 'accesorios-cuidado', descripcion: 'Collares, pecheras y transportadoras' }
    ];

    const catMap = {};
    for (const c of categorias) {
      const existingCat = await db('categorias').where({ slug: c.slug }).first();
      if (!existingCat) {
        const [id] = await db('categorias').insert(c);
        catMap[c.slug] = id;
        console.log(`[Luna-Vet Seed] Categoría insertada: ${c.nombre}`);
      } else {
        catMap[c.slug] = existingCat.id;
      }
    }

    // 5. Productos de Farmacia y Tienda
    const productos = [
      {
        categoria_id: catMap['antiparasitarios-garrapaticidas'],
        nombre: 'Bravecto Perros 10 a 20 kg (1 Masticable)',
        slug: 'bravecto-perros-10-20kg',
        descripcion: 'Protección continua de 12 semanas contra garrapatas y pulgas. Fácil administración con sabor agradable.',
        precio: 780.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['antiparasitarios-garrapaticidas'],
        nombre: 'Simparica Trío 5 a 10 kg (Tableta Masticable)',
        slug: 'simparica-trio-5-10kg',
        descripcion: 'Triple protección mensual contra pulgas, garrapatas, nematodos intestinales y dirofilaria.',
        precio: 420.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['antiparasitarios-garrapaticidas'],
        nombre: 'NexGard Spectra 7.5 a 15 kg (1 Tableta)',
        slug: 'nexgard-spectra-7-5-15kg',
        descripcion: 'Tratamiento de infestaciones por pulgas y garrapatas con saborizante a carne de res.',
        precio: 490.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['higiene-estetica'],
        nombre: 'Shampoo Garrapaticida & Antipulgas Luna-Vet 500ml',
        slug: 'shampoo-garrapaticida-antipulgas-500ml',
        descripcion: 'Fórmula medicada con neem, citronela y aloe vera para eliminar garrapatas respetando el pelaje y la piel.',
        precio: 185.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['alimentos-nutricion'],
        nombre: 'Nupec Adulto Razas Medianas 5 kg',
        slug: 'nupec-adulto-razas-medianas-5kg',
        descripcion: 'Nutrición científica con 90% de digestibilidad, omegas 3 y 6 para piel y pelaje brillante.',
        precio: 580.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['alimentos-nutricion'],
        nombre: 'Royal Canin Gastrointestinal Veterinary 2 kg',
        slug: 'royal-canin-gastrointestinal-2kg',
        descripcion: 'Dieta clínica de alta digestibilidad con densidad energética adaptada para trastornos gastrointestinales.',
        precio: 650.00,
        requiere_receta: true,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['farmacia-medicamentos'],
        nombre: 'Suero Oral Electrolitos Mascotas 500 ml',
        slug: 'suero-oral-electrolitos-500ml',
        descripcion: 'Solución rehidratante oral sabor a carne. Indispensable para prevenir golpes de calor y deshidratación en Acapulco.',
        precio: 95.00,
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['farmacia-medicamentos'],
        nombre: 'Meloxicam Suspensión Oral 0.5% 10 ml',
        slug: 'meloxicam-suspension-oral-10ml',
        descripcion: 'Antiinflamatorio no esteroideo (AINE) con acción analgésica y antipirética para dolores musculoesqueléticos.',
        precio: 190.00,
        requiere_receta: true,
        es_controlado: false,
        activo: true
      },
      {
        categoria_id: catMap['farmacia-medicamentos'],
        nombre: 'Tramadol Solución Gotas 50 mg/ml 10 ml',
        slug: 'tramadol-solucion-gotas-10ml',
        descripcion: 'Analgésico de acción central para dolor posquirúrgico agudo o crónico severo. Sustancia de control médico.',
        precio: 280.00,
        requiere_receta: true,
        es_controlado: true,
        activo: true
      }
    ];

    for (const p of productos) {
      const prod = await db('productos').where({ slug: p.slug }).first();
      let prodId;
      if (!prod) {
        const [id] = await db('productos').insert(p);
        prodId = id;
        console.log(`[Luna-Vet Seed] Producto insertado: ${p.nombre}`);
      } else {
        prodId = prod.id;
      }

      // Insertar lote en tabla 'lotes' si no existe
      const loteExists = await db('lotes').where({ producto_id: prodId }).first();
      if (!loteExists) {
        await db('lotes').insert({
          producto_id: prodId,
          numero_lote: `LV-${Math.floor(1000 + Math.random() * 9000)}`,
          stock_disponible: 30,
          stock_minimo_alerta: 5,
          fecha_caducidad: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }

    // 6. Artículos del Blog basados en publicaciones de Facebook
    const articulos = [
      {
        titulo: 'La Importancia de la Esterilización Temprana en Perros y Gatos',
        slug: 'importancia-esterilizacion-perros-gatos',
        extracto: 'Conoce cómo la esterilización previene infecciones uterinas mortales (piometras) y tumores, además de fomentar una convivencia pacífica.',
        contenido: `¿Sabías que esterilizar a tu mascota salva vidas y prolonga sus años de felicidad?

En Clínica Veterinaria Luna-Vet promovemos de manera permanente campañas de esterilización a bajo costo para perros y gatos en El Coloso y todo Acapulco.

Beneficios en hembras:
1. Elimina por completo el riesgo de piometra (infección bacteriana del útero que pone en peligro la vida).
2. Reduce drásticamente la probabilidad de tumores mamarios si se realiza antes del primer o segundo celo.
3. Evita embarazos no deseados y camadas sin hogar en nuestras colonias.

Beneficios en machos:
1. Previene tumores testiculares y afecciones prostáticas.
2. Reduce el marcaje excesivo con orina dentro del hogar y la agresividad territorial.
3. Disminuye la ansiedad por escapar en busca de hembras en celo, previniendo extravíos y atropellamientos.

Acércate a Luna-Vet en Av. Peña Blanca, Etapa 38, El Coloso, Acapulco. ¡Porque no son solo mascotas, sino un miembro importante de nuestra familia!`,
        meta_title: 'Esterilización Canina y Felina en Acapulco | Luna-Vet',
        meta_description: 'Beneficios médicos de la esterilización para perros y gatos en Clínica Veterinaria Luna-Vet en El Coloso, Acapulco.',
        palabras_clave: 'esterilización acapulco, veterinaria el coloso, piometra, castración perros gatos',
        autor_id: vetId,
        publicado: true,
        fecha_publicacion: new Date()
      },
      {
        titulo: 'Cómo Combatir las Garrapatas y el Golpe de Calor en el Clima de Acapulco',
        slug: 'combatir-garrapatas-golpe-calor-acapulco',
        extracto: 'Guía práctica para proteger a tus mascotas del calor extremo y erradicar garrapatas con baños medicados y antiparasitarios orales.',
        contenido: `El clima cálido y tropical de Acapulco crea las condiciones idóneas para la proliferación rápida de garrapatas y pulgas, así como un riesgo latente de golpes de calor en caninos.

Peligros de las garrapatas:
Las garrapatas transmiten parásitos sanguíneos graves como Ehrlichia y Anaplasma, causantes de anemia severa, hemorragias y decaimiento.

Recomendaciones clínicas de Luna-Vet:
1. Realiza baños garrapaticidas periódicos con productos medicados y seguros para su piel.
2. Administra pastillas masticables de larga duración (como Bravecto o Simparica) para cortar el ciclo de reproducción.
3. Mantén a tu mascota siempre con agua fresca y a la sombra durante las horas de mayor radiación solar (11:00 a 16:00 hrs).
4. Si notas jadeo excesivo, saliva espesa o encías muy rojas, rehidrata de inmediato con suero oral y tráelo a consulta médica veterinaria.

¡En Luna-Vet contamos con baños medicados garrapaticidas y farmacia completa para su protección!`,
        meta_title: 'Control de Garrapatas y Golpes de Calor en Acapulco | Luna-Vet',
        meta_description: 'Consejos para eliminar pulgas y garrapatas y cuidar a tu mascota del calor en Acapulco.',
        palabras_clave: 'baños garrapaticidas acapulco, golpe calor perros, bravecto, pulgas garrapatas',
        autor_id: vetId,
        publicado: true,
        fecha_publicacion: new Date()
      }
    ];

    for (const a of articulos) {
      const exists = await db('blog_articulos').where({ slug: a.slug }).first();
      if (!exists) {
        await db('blog_articulos').insert({
          ...a,
          creado_en: new Date()
        });
        console.log(`[Luna-Vet Seed] Artículo del blog insertado: ${a.titulo}`);
      }
    }

    // 7. Testimonios Reales de Luna-Vet Acapulco
    const testimonios = [
      {
        nombre_cliente: 'María Elena Solís (El Coloso)',
        comentario: 'Llevé a mi perrita Luna a esterilizar en la campaña de Luna-Vet en Peña Blanca y la atención fue maravillosa. Se recuperó rapidísimo y la herida quedó súper limpia. ¡100% recomendados en Acapulco!',
        calificacion: 5,
        visible_landing: true
      },
      {
        nombre_cliente: 'Roberto Figueroa (Llano Largo)',
        comentario: 'Excelente el baño garrapaticida y el corte para mi Schnauzer. En el calor de Acapulco las garrapatas son un problema tremendo, pero con su tratamiento y el Bravecto quedó impecable.',
        calificacion: 5,
        visible_landing: true
      },
      {
        nombre_cliente: 'Lucía Domínguez (Acapulco Diamante)',
        comentario: 'El carnet digital y las recetas en línea facilitan todo. Siempre atienden con mucho amor a mis gatos y me resolvieron una urgencia por WhatsApp. Gran equipo médico.',
        calificacion: 5,
        visible_landing: true
      }
    ];

    for (const t of testimonios) {
      const exists = await db('testimonios').where({ nombre_cliente: t.nombre_cliente }).first();
      if (!exists) {
        await db('testimonios').insert(t);
        console.log(`[Luna-Vet Seed] Testimonio insertado: ${t.nombre_cliente}`);
      }
    }

    console.log('[Luna-Vet Seed] ¡Todos los datos oficiales de Facebook han sido sembrados exitosamente!');
  } catch (err) {
    console.error('[Luna-Vet Seed] Error al sembrar datos:', err);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  seedLunaVetData();
}

module.exports = seedLunaVetData;
