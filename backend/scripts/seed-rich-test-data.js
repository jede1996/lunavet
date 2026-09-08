/**
 * Script de siembra enriquecida de datos de prueba para Luna-Vet Acapulco
 * Pobla productos con imágenes reales, clientes, mascotas con fotos BLOB,
 * citas, consultas médicas, hospitalización UCI, estética y caja chica.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { db } = require('../src/config/database');
const passwordService = require('../src/core/password.service');
const cryptoService = require('../src/core/crypto.service');

async function seedRichTestData() {
  console.log('[Luna-Vet Rich Seed] Iniciando siembra de datos de prueba completos con imágenes...');

  try {
    // 1. Asegurar columnas imagen_url en productos y servicios
    const hasColProd = await db.schema.hasColumn('productos', 'imagen_url');
    if (!hasColProd) {
      await db.schema.alterTable('productos', (t) => {
        t.string('imagen_url', 500).nullable();
      });
      console.log('[Luna-Vet Rich Seed] Columna imagen_url agregada a productos.');
    }

    const hasColServ = await db.schema.hasColumn('servicios', 'imagen_url');
    if (!hasColServ) {
      await db.schema.alterTable('servicios', (t) => {
        t.string('imagen_url', 500).nullable();
      });
      console.log('[Luna-Vet Rich Seed] Columna imagen_url agregada a servicios.');
    }

    // 2. Veterinario y Administrador
    const vet = await db('usuarios').where({ email: 'veterinario@lunavet.lat' }).first();
    const vetId = vet ? vet.id : 1;
    const admin = await db('usuarios').where({ email: 'admin@lunavet.lat' }).first();
    const adminId = admin ? admin.id : 1;

    // 3. Clientes de prueba
    const clientPassHash = await passwordService.hash('ClienteLunaVet2026!');
    const clientsData = [
      {
        email: 'cliente@lunavet.lat',
        password_hash: clientPassHash,
        nombre: 'María Elena',
        apellido: 'González Solís',
        rol: 'cliente',
        activo: true
      },
      {
        email: 'carlos.mendoza@gmail.com',
        password_hash: clientPassHash,
        nombre: 'Carlos',
        apellido: 'Mendoza Radilla',
        rol: 'cliente',
        activo: true
      },
      {
        email: 'patricia.silva@outlook.com',
        password_hash: clientPassHash,
        nombre: 'Patricia',
        apellido: 'Silva Alarcón',
        rol: 'cliente',
        activo: true
      }
    ];

    const clientIds = [];
    for (const c of clientsData) {
      const existing = await db('usuarios').where({ email: c.email }).first();
      if (!existing) {
        const [id] = await db('usuarios').insert(c);
        clientIds.push(id);
        console.log(`[Luna-Vet Rich Seed] Cliente creado: ${c.email}`);
      } else {
        clientIds.push(existing.id);
      }
    }

    // 4. Categorías & Productos con imágenes reales
    const catMap = {};
    const categorias = await db('categorias').select('*');
    for (const cat of categorias) {
      catMap[cat.slug] = cat.id;
    }

    const productsUpdate = [
      {
        slug: 'nexgard-spectra-7-5-15kg',
        categoria_id: catMap['antiparasitarios-garrapaticidas'],
        nombre: 'NexGard Spectra 7.5 a 15 kg (1 Tableta)',
        descripcion: 'Tratamiento masticable mensual de amplio espectro contra pulgas, garrapatas, nematodos intestinales y prevención de gusano del corazón con sabor a carne de res.',
        precio: 490.00,
        imagen_url: '/images/products/nexgard-spectra.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'bravecto-perros-10-20kg',
        categoria_id: catMap['antiparasitarios-garrapaticidas'],
        nombre: 'Bravecto Perros 10 a 20 kg (1 Masticable)',
        descripcion: 'Protección continua y prolongada de 12 semanas (3 meses completos) contra pulgas y garrapatas. Fácil administración oral que no se altera con el agua de mar o albercas.',
        precio: 780.00,
        imagen_url: '/images/products/bravecto-chewable.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'simparica-trio-5-10kg',
        categoria_id: catMap['antiparasitarios-garrapaticidas'],
        nombre: 'Simparica Trío 5 a 10 kg (Tableta Masticable)',
        descripcion: 'Triple protección mensual en una sola tableta masticable: erradica pulgas, garrapatas, parásitos intestinales y previene la dirofilariosis canina.',
        precio: 420.00,
        imagen_url: '/images/products/simparica-trio.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'nupec-adulto-razas-medianas-5kg',
        categoria_id: catMap['alimentos-nutricion'],
        nombre: 'Nupec Adulto Razas Medianas 5 kg',
        descripcion: 'Alimento premium con balance nutricional científico, 90% de digestibilidad proteica, extracto de yuca y omegas 3 y 6 para piel sana y pelaje reluciente.',
        precio: 580.00,
        imagen_url: '/images/products/nupec-adulto.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'royal-canin-gastrointestinal-2kg',
        categoria_id: catMap['alimentos-nutricion'],
        nombre: 'Royal Canin Gastrointestinal Veterinary 2 kg',
        descripcion: 'Dieta clínica de prescripción formulada para perros con trastornos digestivos agudos, diarreas, vómitos o en periodos de convalecencia médica.',
        precio: 650.00,
        imagen_url: '/images/products/royal-canin-gastro.svg',
        requiere_receta: true,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'shampoo-garrapaticida-antipulgas-500ml',
        categoria_id: catMap['higiene-estetica'],
        nombre: 'Shampoo Garrapaticida & Antipulgas Luna-Vet 500ml',
        descripcion: 'Fórmula farmacéutica exclusiva con extracto orgánico de neem, citronela y aloe vera hidratante. Elimina pulgas y garrapatas al contacto sin irritar la dermis.',
        precio: 185.00,
        imagen_url: '/images/products/shampoo-garrapaticida.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'suero-oral-electrolitos-500ml',
        categoria_id: catMap['farmacia-medicamentos'],
        nombre: 'Suero Oral Electrolitos Mascotas 500 ml',
        descripcion: 'Solución balanceada de rehidratación con electrolitos, glucosa y aminoácidos sabor a carne. Vital para prevenir deshidratación y golpes de calor en Acapulco.',
        precio: 95.00,
        imagen_url: '/images/products/suero-oral.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'meloxicam-suspension-oral-10ml',
        categoria_id: catMap['farmacia-medicamentos'],
        nombre: 'Meloxicam Suspensión Oral 0.5% 10 ml',
        descripcion: 'Antiinflamatorio no esteroideo (AINE) con dosificador en gotas. Eficaz contra el dolor osteoarticular, traumatismos y analgesia postquirúrgica.',
        precio: 190.00,
        imagen_url: '/images/products/meloxicam.svg',
        requiere_receta: true,
        es_controlado: false,
        activo: true
      },
      {
        slug: 'tramadol-solucion-gotas-10ml',
        categoria_id: catMap['farmacia-medicamentos'],
        nombre: 'Tramadol Gotas Orales 50 mg/ml 10 ml',
        descripcion: 'Analgésico opioide de acción central para el manejo del dolor severo oncológico o postoperatorio mayor. Sustancia regulada bajo normativa SENASICA / SSA.',
        precio: 280.00,
        imagen_url: '/images/products/tramadol.svg',
        requiere_receta: true,
        es_controlado: true,
        activo: true
      },
      {
        slug: 'pechera-tactica-ergonomica-mediana',
        categoria_id: catMap['accesorios-cuidado'],
        nombre: 'Pechera Táctica Ergonómica Antijalones Talla M',
        descripcion: 'Arnés de alta resistencia con bandas reflejantes para paseos nocturnos, acolchado transpirable y anilla frontal anti-tirones.',
        precio: 350.00,
        imagen_url: '/images/products/pechera-ergonomica.svg',
        requiere_receta: false,
        es_controlado: false,
        activo: true
      }
    ];

    for (const p of productsUpdate) {
      const prod = await db('productos').where({ slug: p.slug }).first();
      let prodId;
      if (!prod) {
        const [id] = await db('productos').insert(p);
        prodId = id;
        console.log(`[Luna-Vet Rich Seed] Nuevo producto insertado con imagen: ${p.nombre}`);
      } else {
        await db('productos').where({ id: prod.id }).update({
          imagen_url: p.imagen_url,
          descripcion: p.descripcion,
          precio: p.precio,
          es_controlado: p.es_controlado,
          requiere_receta: p.requiere_receta
        });
        prodId = prod.id;
        console.log(`[Luna-Vet Rich Seed] Producto actualizado con imagen: ${p.nombre}`);
      }

      // Asegurar lote con stock
      const lote = await db('lotes').where({ producto_id: prodId }).first();
      if (!lote) {
        await db('lotes').insert({
          producto_id: prodId,
          numero_lote: `LV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          fecha_caducidad: '2027-12-31',
          stock_disponible: 45,
          stock_minimo_alerta: 5
        });
      } else {
        await db('lotes').where({ id: lote.id }).update({
          stock_disponible: Math.max(lote.stock_disponible, 25),
          fecha_caducidad: '2027-12-31'
        });
      }
    }

    // 5. Mascotas de prueba con fotografías BLOB
    const petsData = [
      {
        nombre: 'Toby',
        especie: 'perro',
        raza: 'Golden Retriever',
        fecha_nacimiento: '2021-04-12',
        sexo: 'macho',
        color: 'Dorado Claro',
        esterilizado: true,
        microchip: '985141002345671',
        notas: 'Paciente muy cariñoso, tolera perfectamente la auscultación y la toma de temperatura.',
        propietario_id: clientIds[0],
        avatar_svg: 'toby-retriever.svg'
      },
      {
        nombre: 'Luna',
        especie: 'perro',
        raza: 'Husky Siberiano',
        fecha_nacimiento: '2022-08-25',
        sexo: 'hembra',
        color: 'Gris y Blanco',
        esterilizado: false,
        microchip: '985141002345672',
        notas: 'Sensible al calor intenso de Acapulco. Requiere hidratación constante y baños refrescantes.',
        propietario_id: clientIds[0],
        avatar_svg: 'luna-husky.svg'
      },
      {
        nombre: 'Michi',
        especie: 'gato',
        raza: 'Siamés',
        fecha_nacimiento: '2023-01-15',
        sexo: 'macho',
        color: 'Crema con Puntos Seal',
        esterilizado: true,
        microchip: '985141002345673',
        notas: 'Gatito de interior, vacunación triple felina vigente. Muy dócil en consulta.',
        propietario_id: clientIds[1],
        avatar_svg: 'michi-siames.svg'
      },
      {
        nombre: 'Rocky',
        especie: 'perro',
        raza: 'Bulldog Francés',
        fecha_nacimiento: '2022-11-03',
        sexo: 'macho',
        color: 'Leonado (Fawn)',
        esterilizado: true,
        microchip: '985141002345674',
        notas: 'Paciente braquiocefálico. Cuidar vías respiratorias en días calurosos. Evitar sedaciones pesadas.',
        propietario_id: clientIds[1],
        avatar_svg: 'rocky-bulldog.svg'
      },
      {
        nombre: 'Max',
        especie: 'perro',
        raza: 'Schnauzer Miniatura',
        fecha_nacimiento: '2020-09-18',
        sexo: 'macho',
        color: 'Sal y Pimienta',
        esterilizado: true,
        microchip: '985141002345675',
        notas: 'Cliente regular de estética y corte higiénico. Propenso a sarro dental.',
        propietario_id: clientIds[2],
        avatar_svg: 'max-schnauzer.svg'
      },
      {
        nombre: 'Chloe',
        especie: 'perro',
        raza: 'Beagle',
        fecha_nacimiento: '2023-05-30',
        sexo: 'hembra',
        color: 'Tricolor',
        esterilizado: false,
        microchip: '985141002345676',
        notas: 'Muy enérgica y curiosa. Excelente estado nutricional con Nupec Adulto.',
        propietario_id: clientIds[2],
        avatar_svg: 'chloe-beagle.svg'
      }
    ];

    const petRecords = [];
    const petsImgDir = path.resolve(__dirname, '../../frontend/public/images/pets');

    for (const p of petsData) {
      let pet = await db('mascotas').where({ microchip: p.microchip }).first();
      let petId;

      if (!pet) {
        const encryptedNotes = p.notas ? cryptoService.encrypt(p.notas) : null;
        const [id] = await db('mascotas').insert({
          nombre: p.nombre,
          especie: p.especie,
          raza: p.raza,
          fecha_nacimiento: p.fecha_nacimiento,
          sexo: p.sexo,
          color: p.color,
          esterilizado: p.esterilizado,
          microchip: p.microchip,
          notas_cifradas: encryptedNotes,
          activo: true
        });
        petId = id;
        console.log(`[Luna-Vet Rich Seed] Mascota creada: ${p.nombre} (${p.raza})`);
      } else {
        petId = pet.id;
      }
      petRecords.push({ id: petId, ...p });

      // Asociar dueño en usuarios_mascotas
      const rel = await db('usuarios_mascotas').where({ usuario_id: p.propietario_id, mascota_id: petId }).first();
      if (!rel) {
        await db('usuarios_mascotas').insert({
          usuario_id: p.propietario_id,
          mascota_id: petId,
          es_propietario_principal: true,
          nivel_permiso: 'administracion'
        });
      }

      // Asociar también al admin para que siempre tenga acceso en el portal
      const adminRel = await db('usuarios_mascotas').where({ usuario_id: adminId, mascota_id: petId }).first();
      if (!adminRel) {
        await db('usuarios_mascotas').insert({
          usuario_id: adminId,
          mascota_id: petId,
          es_propietario_principal: false,
          nivel_permiso: 'administracion'
        });
      }

      // Insertar o actualizar fotografía BLOB en archivos_adjuntos
      const svgFilePath = path.join(petsImgDir, p.avatar_svg);
      if (fs.existsSync(svgFilePath)) {
        const fileBuffer = fs.readFileSync(svgFilePath);
        const hashSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const existingPhoto = await db('archivos_adjuntos')
          .where({ entidad_tipo: 'mascota_foto', entidad_id: petId })
          .first();

        if (existingPhoto) {
          await db('archivos_adjuntos').where({ id: existingPhoto.id }).update({
            nombre_archivo: p.avatar_svg,
            mime_type: 'image/svg+xml',
            tamano_bytes: fileBuffer.length,
            hash_sha256: hashSha256,
            buffer_datos: fileBuffer,
            subido_por_id: adminId
          });
        } else {
          await db('archivos_adjuntos').insert({
            entidad_tipo: 'mascota_foto',
            entidad_id: petId,
            nombre_archivo: p.avatar_svg,
            mime_type: 'image/svg+xml',
            tamano_bytes: fileBuffer.length,
            hash_sha256: hashSha256,
            buffer_datos: fileBuffer,
            subido_por_id: adminId
          });
        }
        console.log(`[Luna-Vet Rich Seed] Fotografía BLOB guardada para: ${p.nombre}`);
      }
    }

    // 6. Citas médicas de demostración
    const servicios = await db('servicios').select('*');
    const servConsulta = servicios.find(s => s.nombre.includes('Consulta')) || servicios[0];
    const servEstetica = servicios.find(s => s.nombre.includes('Estética')) || servicios[1];
    const servVacuna = servicios.find(s => s.nombre.includes('Vacunación')) || servicios[2];
    const servEsteril = servicios.find(s => s.nombre.includes('Esterilización')) || servicios[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const sampleAppointments = [
      {
        mascota_id: petRecords[0].id, // Toby
        cliente_id: petRecords[0].propietario_id,
        veterinario_id: vetId,
        servicio_id: servConsulta.id,
        fecha_hora_inicio: `${todayStr} 09:30:00`,
        fecha_hora_fin: `${todayStr} 10:15:00`,
        estado: 'completada',
        es_urgencia: false,
        motivo: 'Revisión periódica y refuerzo de desparasitación'
      },
      {
        mascota_id: petRecords[3].id, // Rocky
        cliente_id: petRecords[3].propietario_id,
        veterinario_id: vetId,
        servicio_id: servConsulta.id,
        fecha_hora_inicio: `${todayStr} 11:00:00`,
        fecha_hora_fin: `${todayStr} 12:00:00`,
        estado: 'atendiendo',
        es_urgencia: true,
        motivo: 'Jadeo continuo por temperatura ambiental alta'
      },
      {
        mascota_id: petRecords[2].id, // Michi
        cliente_id: petRecords[2].propietario_id,
        veterinario_id: vetId,
        servicio_id: servVacuna.id,
        fecha_hora_inicio: `${todayStr} 15:00:00`,
        fecha_hora_fin: `${todayStr} 15:30:00`,
        estado: 'confirmada',
        es_urgencia: false,
        motivo: 'Refuerzo de vacuna Triple Felina anual'
      },
      {
        mascota_id: petRecords[4].id, // Max
        cliente_id: petRecords[4].propietario_id,
        veterinario_id: vetId,
        servicio_id: servEstetica.id,
        fecha_hora_inicio: `${todayStr} 16:30:00`,
        fecha_hora_fin: `${todayStr} 17:30:00`,
        estado: 'pendiente',
        es_urgencia: false,
        motivo: 'Corte de raza Schnauzer y baño medicado'
      }
    ];

    for (const apt of sampleAppointments) {
      const existing = await db('citas')
        .where({ mascota_id: apt.mascota_id, fecha_hora_inicio: apt.fecha_hora_inicio })
        .first();
      if (!existing) {
        await db('citas').insert(apt);
        console.log(`[Luna-Vet Rich Seed] Cita programada para mascota ID ${apt.mascota_id} [${apt.estado}]`);
      }
    }

    // 7. Expediente Clínico de Toby con Constantes y Receta
    const expExists = await db('expedientes_clinicos').where({ mascota_id: petRecords[0].id }).first();
    let expId;
    if (!expExists) {
      const [id] = await db('expedientes_clinicos').insert({
        mascota_id: petRecords[0].id,
        veterinario_id: vetId,
        fecha_consulta: `${todayStr} 10:00:00`,
        motivo_consulta: 'Control anual y chequeo preventivo contra ectoparásitos en Acapulco',
        sintomas: 'Constantes fisiológicas dentro de rangos normales. Mucosas rosadas y húmedas, apetito conservado.',
        diagnostico_cifrado: cryptoService.encrypt('Paciente sano en condiciones óptimas para administración de ectoparasiticida'),
        tratamiento_cifrado: cryptoService.encrypt('Administrar NexGard Spectra 1 tableta masticable. Cita de revisión en 6 meses.'),
        notas_privadas_cifradas: cryptoService.encrypt('Excelente temperamento, tolera bien la báscula y el termómetro.')
      });
      expId = id;
      console.log(`[Luna-Vet Rich Seed] Consulta médica registrada para Toby (Expediente ID ${expId})`);

      // Registro de peso
      await db('registros_peso').insert({
        mascota_id: petRecords[0].id,
        peso_kg: 28.5,
        fecha_registro: todayStr,
        notas: 'Peso ideal para complexión',
        registrado_por_id: vetId
      });

      // Receta médica
      const folioReceta = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const prodNexgard = await db('productos').where({ slug: 'nexgard-spectra-7-5-15kg' }).first();
      const [recetaId] = await db('recetas').insert({
        folio: folioReceta,
        expediente_id: expId,
        veterinario_id: vetId,
        mascota_id: petRecords[0].id,
        fecha_emision: todayStr,
        vigencia_dias: 30,
        firma_digital_hash: crypto.createHash('sha256').update(`${folioReceta}-${todayStr}-${vetId}`).digest('hex'),
        estado: 'activa'
      });

      if (prodNexgard) {
        await db('recetas_items').insert({
          receta_id: recetaId,
          producto_id: prodNexgard.id,
          nombre_medicamento: prodNexgard.nombre,
          dosis: '1 tableta masticable',
          frecuencia: 'Cada 30 días',
          duracion_dias: 30,
          cantidad_prescrita: 1,
          indicaciones: 'Administrar vía oral directamente o mezclada con alimento húmedo.'
        });
        console.log(`[Luna-Vet Rich Seed] Receta médica emitida: ${folioReceta}`);
      }
    } else {
      expId = expExists.id;
    }

    // 8. Hospitalización Activa (UCI)
    if (await db.schema.hasTable('hospitalizacion_estancias')) {
      const hospExists = await db('hospitalizacion_estancias')
        .where({ estado: 'activa' })
        .first();

      if (!hospExists) {
        const [hospId] = await db('hospitalizacion_estancias').insert({
          mascota_id: petRecords[3].id, // Rocky (Bulldog)
          jaula_identificador: 'UCI-01',
          motivo_ingreso: 'Monitoreo por hipertermia leve y golpe de calor post-paseo en El Coloso',
          diagnostico_uci: 'Hipertermia no maligna controlada, vías aéreas estables',
          veterinario_a_cargo_id: vetId,
          fecha_ingreso: `${todayStr} 11:30:00`,
          estado: 'activa',
          oxigenoterapia: true,
          plan_fluidoterapia: 'Solución Hartmann 40 ml/kg/día a 25 gotas/min',
          alertas_especiales: 'Paciente braquiocefálico. Mantener ventilador a 22°C.'
        });

        if (await db.schema.hasTable('hospitalizacion_signos')) {
          await db('hospitalizacion_signos').insert({
            estancia_id: hospId,
            temperatura: 38.6,
            fc: 110,
            fr: 28,
            presion_arterial: '120/80',
            spo2: 98,
            nivel_dolor_glasgow: 1,
            orina_ml: 180,
            observaciones: 'Paciente descansando tranquilo con lengua humedecida y suero IV permeable.',
            registrado_por_id: vetId
          });
        }
        console.log(`[Luna-Vet Rich Seed] Rocky ingresado a UCI-01 con signos vitales.`);
      }
    }

    // 9. Turno de Caja Chica Activo (POS)
    if (await db.schema.hasTable('caja_turnos')) {
      const turnoActivo = await db('caja_turnos').where({ estado: 'abierto' }).first();
      if (!turnoActivo) {
        const [turnoId] = await db('caja_turnos').insert({
          sucursal_id: 1,
          usuario_apertura_id: adminId,
          fondo_inicial: 2000.00,
          ventas_efectivo: 490.00,
          ventas_tarjeta: 780.00,
          ventas_transferencia: 0.00,
          total_ingresos_manuales: 0.00,
          total_egresos_manuales: 150.00,
          estado: 'abierto'
        });

        if (await db.schema.hasTable('caja_movimientos')) {
          await db('caja_movimientos').insert({
            turno_id: turnoId,
            tipo: 'egreso',
            concepto: 'Compra de agua purificada y hielo para consultorio',
            monto: 150.00,
            metodo_pago: 'efectivo',
            usuario_id: adminId
          });
        }
        console.log(`[Luna-Vet Rich Seed] Turno de Caja Chica abierto con fondo de $2,000.00 MXN.`);
      }
    }

    // 10. Check-in de Estética (Grooming)
    if (await db.schema.hasTable('estetica_servicios')) {
      const esteticaActiva = await db('estetica_servicios').where({ estado: 'en_proceso' }).first();
      if (!esteticaActiva) {
        await db('estetica_servicios').insert({
          mascota_id: petRecords[4].id, // Max
          cliente_id: petRecords[4].propietario_id,
          tipo_corte: 'Corte Schnauzer Estándar con Barba y Cejas',
          bano_medicado: true,
          corte_unas: true,
          limpieza_oidos: true,
          mapa_lesiones_json: JSON.stringify([
            { zona: 'lomo_posterior', tipo: 'irritacion_leve', notas: 'Pápula por picadura de pulga previa' }
          ]),
          observaciones_recepcion: 'Mascota tranquila, cabello ligeramente anudado en patas.',
          estado: 'en_proceso',
          precio: 300.00,
          atendido_por_id: adminId
        });
        console.log(`[Luna-Vet Rich Seed] Check-in de Estética para Max en proceso.`);
      }
    }

    console.log('[Luna-Vet Rich Seed] ¡Siembra de datos enriquecidos completada con éxito!');
  } catch (err) {
    console.error('[Luna-Vet Rich Seed] Error al sembrar datos enriquecidos:', err);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  seedRichTestData();
}

module.exports = seedRichTestData;
