const knex = require('knex');
const config = require('./env');

let dbConfig;

if (config.isTest) {
  dbConfig = {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 }
  };
} else {
  dbConfig = {
    client: 'mysql2',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      charset: 'utf8mb4'
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000
    }
  };
}

const db = knex(dbConfig);

/**
 * Inicializa el esquema en memoria para las pruebas automatizadas (SQLite).
 */
async function initTestDb() {
  if (!config.isTest) return;

  // Tabla usuarios
  if (!(await db.schema.hasTable('usuarios'))) {
    await db.schema.createTable('usuarios', (t) => {
      t.increments('id').primary();
      t.integer('sucursal_id').nullable();
      t.string('email', 191).notNullable().unique();
      t.string('password_hash', 255).notNullable();
      t.string('nombre', 100).notNullable();
      t.string('apellido', 100).notNullable();
      t.string('rol', 50).notNullable();
      t.string('telefono_cifrado', 255).nullable();
      t.string('cedula_profesional', 50).nullable();
      t.boolean('dos_factores_habilitado').defaultTo(false);
      t.string('dos_factores_secreto', 255).nullable();
      t.boolean('debe_cambiar_password').defaultTo(false);
      t.integer('intentos_fallidos').defaultTo(0);
      t.dateTime('bloqueado_hasta').nullable();
      t.boolean('activo').defaultTo(true);
      t.dateTime('ultimo_acceso').nullable();
      t.timestamp('fecha_registro').defaultTo(db.fn.now());
      t.timestamp('actualizado_en').defaultTo(db.fn.now());
      t.timestamps(true, true);
    });
  }

  // Tabla sesiones_activas
  if (!(await db.schema.hasTable('sesiones_activas'))) {
    await db.schema.createTable('sesiones_activas', (t) => {
      t.increments('id').primary();
      t.integer('usuario_id').notNullable();
      t.string('refresh_token_hash', 64).notNullable().unique();
      t.string('user_agent', 255).nullable();
      t.string('ip_origen', 45).nullable();
      t.boolean('es_valido').defaultTo(true);
      t.dateTime('expira_en').notNullable();
      t.timestamps(true, true);
    });
  }

  // Tabla archivos_adjuntos (BLOB)
  if (!(await db.schema.hasTable('archivos_adjuntos'))) {
    await db.schema.createTable('archivos_adjuntos', (t) => {
      t.increments('id').primary();
      t.string('entidad_tipo', 50).notNullable();
      t.integer('entidad_id').notNullable();
      t.string('nombre_archivo', 255).notNullable();
      t.string('mime_type', 100).notNullable();
      t.integer('tamano_bytes').notNullable();
      t.string('hash_sha256', 64).notNullable();
      t.binary('buffer_datos').notNullable();
      t.integer('subido_por_id').nullable();
      t.timestamps(true, true);
    });
  }

  // Tabla bitacora_auditoria
  if (!(await db.schema.hasTable('bitacora_auditoria'))) {
    await db.schema.createTable('bitacora_auditoria', (t) => {
      t.increments('id').primary();
      t.integer('usuario_id').nullable();
      t.string('accion', 100).notNullable();
      t.string('entidad', 100).notNullable();
      t.string('entidad_id', 50).nullable();
      t.text('detalles').nullable();
      t.string('ip_origen', 45).nullable();
      t.string('user_agent', 255).nullable();
      t.string('nivel_criticidad', 30).defaultTo('info');
      t.timestamp('creado_en').defaultTo(db.fn.now());
      t.timestamps(true, true);
    });
  }

  // Tabla mascotas
  if (!(await db.schema.hasTable('mascotas'))) {
    await db.schema.createTable('mascotas', (t) => {
      t.increments('id').primary();
      t.string('nombre', 100).notNullable();
      t.string('especie', 50).notNullable();
      t.string('raza', 100).notNullable();
      t.date('fecha_nacimiento').nullable();
      t.string('sexo', 20).defaultTo('desconocido');
      t.string('color', 100).nullable();
      t.boolean('esterilizado').defaultTo(false);
      t.string('microchip', 100).nullable().unique();
      t.text('notas_cifradas').nullable();
      t.boolean('activo').defaultTo(true);
      t.timestamps(true, true);
    });
  }

  // Tabla usuarios_mascotas (Relación N:M)
  if (!(await db.schema.hasTable('usuarios_mascotas'))) {
    await db.schema.createTable('usuarios_mascotas', (t) => {
      t.increments('id').primary();
      t.integer('usuario_id').notNullable();
      t.integer('mascota_id').notNullable();
      t.boolean('es_propietario_principal').defaultTo(false);
      t.string('nivel_permiso', 50).defaultTo('lectura');
      t.timestamps(true, true);
    });
  }

  // Tabla historial_titularidad
  if (!(await db.schema.hasTable('historial_titularidad'))) {
    await db.schema.createTable('historial_titularidad', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('usuario_anterior_id').nullable();
      t.integer('usuario_nuevo_id').notNullable();
      t.integer('transferido_por_id').notNullable();
      t.text('motivo').nullable();
      t.timestamps(true, true);
    });
  }

  // Tabla expedientes_clinicos
  if (!(await db.schema.hasTable('expedientes_clinicos'))) {
    await db.schema.createTable('expedientes_clinicos', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('veterinario_id').notNullable();
      t.dateTime('fecha_consulta').notNullable();
      t.text('motivo_consulta').notNullable();
      t.text('sintomas').nullable();
      t.text('diagnostico_cifrado').notNullable();
      t.text('tratamiento_cifrado').notNullable();
      t.text('notas_privadas_cifradas').nullable();
      t.timestamps(true, true);
    });
  }

  // Tabla alergias_mascotas
  if (!(await db.schema.hasTable('alergias_mascotas'))) {
    await db.schema.createTable('alergias_mascotas', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.string('sustancia', 150).notNullable();
      t.string('severidad', 50).defaultTo('moderada');
      t.text('reaccion').nullable();
      t.integer('creado_por_id').notNullable();
      t.timestamps(true, true);
    });
  }

  // Tabla registros_peso
  if (!(await db.schema.hasTable('registros_peso'))) {
    await db.schema.createTable('registros_peso', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.decimal('peso_kg', 5, 2).notNullable();
      t.date('fecha_registro').notNullable();
      t.string('notas', 255).nullable();
      t.integer('registrado_por_id').notNullable();
      t.timestamps(true, true);
    });
  }

  // Tabla vacunas
  if (!(await db.schema.hasTable('vacunas'))) {
    await db.schema.createTable('vacunas', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.string('nombre_vacuna', 100).notNullable();
      t.string('lote', 50).nullable();
      t.date('fecha_aplicacion').notNullable();
      t.date('fecha_proxima_dosis').nullable();
      t.integer('veterinario_id').notNullable();
      t.timestamps(true, true);
    });
  }

  // Tabla recetas
  if (!(await db.schema.hasTable('recetas'))) {
    await db.schema.createTable('recetas', (t) => {
      t.increments('id').primary();
      t.string('folio', 50).notNullable().unique();
      t.integer('expediente_id').nullable();
      t.integer('veterinario_id').notNullable();
      t.integer('mascota_id').notNullable();
      t.date('fecha_emision').notNullable();
      t.integer('vigencia_dias').defaultTo(30);
      t.string('firma_digital_hash', 64).notNullable();
      t.string('estado', 50).defaultTo('activa');
      t.timestamps(true, true);
    });
  }

  // Tabla recetas_items
  if (!(await db.schema.hasTable('recetas_items'))) {
    await db.schema.createTable('recetas_items', (t) => {
      t.increments('id').primary();
      t.integer('receta_id').notNullable();
      t.integer('producto_id').nullable();
      t.string('nombre_medicamento', 150).notNullable();
      t.string('dosis', 100).notNullable();
      t.string('frecuencia', 100).notNullable();
      t.integer('duracion_dias').notNullable();
      t.integer('cantidad_prescrita').notNullable();
      t.text('indicaciones').nullable();
    });
  }

  // Tabla servicios
  if (!(await db.schema.hasTable('servicios'))) {
    await db.schema.createTable('servicios', (t) => {
      t.increments('id').primary();
      t.string('nombre', 150).notNullable();
      t.text('descripcion').nullable();
      t.integer('duracion_minutos').defaultTo(30);
      t.decimal('precio', 10, 2).notNullable();
      t.string('imagen_url', 500).nullable();
      t.boolean('activo').defaultTo(true);
      t.timestamps(true, true);
    });
  } else {
    const hasColServ = await db.schema.hasColumn('servicios', 'imagen_url');
    if (!hasColServ) {
      await db.schema.alterTable('servicios', (t) => {
        t.string('imagen_url', 500).nullable();
      });
    }
  }

  // Tabla citas
  if (!(await db.schema.hasTable('citas'))) {
    await db.schema.createTable('citas', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('cliente_id').notNullable();
      t.integer('veterinario_id').notNullable();
      t.integer('servicio_id').notNullable();
      t.dateTime('fecha_hora_inicio').notNullable();
      t.dateTime('fecha_hora_fin').notNullable();
      t.string('estado', 50).defaultTo('pendiente');
      t.boolean('es_urgencia').defaultTo(false);
      t.string('motivo', 255).notNullable();
      t.boolean('recordatorio_enviado').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  // Tabla categorias
  if (!(await db.schema.hasTable('categorias'))) {
    await db.schema.createTable('categorias', (t) => {
      t.increments('id').primary();
      t.string('nombre', 100).notNullable();
      t.string('slug', 120).notNullable().unique();
      t.text('descripcion').nullable();
      t.boolean('activo').defaultTo(true);
    });
  }

  // Tabla productos
  if (!(await db.schema.hasTable('productos'))) {
    await db.schema.createTable('productos', (t) => {
      t.increments('id').primary();
      t.integer('categoria_id').notNullable();
      t.string('nombre', 150).notNullable();
      t.string('slug', 180).notNullable().unique();
      t.text('descripcion').nullable();
      t.decimal('precio', 10, 2).notNullable();
      t.string('imagen_url', 500).nullable();
      t.boolean('requiere_receta').defaultTo(false);
      t.boolean('es_controlado').defaultTo(false);
      t.boolean('activo').defaultTo(true);
      t.timestamps(true, true);
    });
  } else {
    const hasColProd = await db.schema.hasColumn('productos', 'imagen_url');
    if (!hasColProd) {
      await db.schema.alterTable('productos', (t) => {
        t.string('imagen_url', 500).nullable();
      });
    }
  }

  // Tabla lotes
  if (!(await db.schema.hasTable('lotes'))) {
    await db.schema.createTable('lotes', (t) => {
      t.increments('id').primary();
      t.integer('producto_id').notNullable();
      t.string('numero_lote', 50).notNullable();
      t.date('fecha_caducidad').notNullable();
      t.integer('stock_disponible').defaultTo(0);
      t.integer('stock_minimo_alerta').defaultTo(5);
      t.timestamps(true, true);
    });
  }

  // Tabla pedidos
  if (!(await db.schema.hasTable('pedidos'))) {
    await db.schema.createTable('pedidos', (t) => {
      t.increments('id').primary();
      t.string('folio', 50).notNullable().unique();
      t.integer('cliente_id').notNullable();
      t.string('estado', 50).defaultTo('pendiente_pago');
      t.decimal('total', 10, 2).notNullable();
      t.string('metodo_pago', 50).notNullable();
      t.string('comprobante_interno_hash', 64).notNullable();
      t.text('notas_cliente').nullable();
      t.timestamp('creado_en').defaultTo(db.fn.now());
      t.timestamp('actualizado_en').defaultTo(db.fn.now());
      t.timestamps(true, true);
    });
  }

  // Tabla pedidos_items
  if (!(await db.schema.hasTable('pedidos_items'))) {
    await db.schema.createTable('pedidos_items', (t) => {
      t.increments('id').primary();
      t.integer('pedido_id').notNullable();
      t.integer('producto_id').notNullable();
      t.integer('lote_id').nullable();
      t.integer('cantidad').notNullable();
      t.decimal('precio_unitario', 10, 2).notNullable();
      t.decimal('subtotal', 10, 2).notNullable();
    });
  }

  // Tabla validaciones_controlados
  if (!(await db.schema.hasTable('validaciones_controlados'))) {
    await db.schema.createTable('validaciones_controlados', (t) => {
      t.increments('id').primary();
      t.integer('pedido_id').notNullable();
      t.integer('receta_id').notNullable();
      t.integer('validado_por_id').nullable();
      t.string('estado', 50).defaultTo('pendiente');
      t.text('motivo_rechazo').nullable();
      t.dateTime('fecha_validacion').nullable();
      t.timestamps(true, true);
    });
  }

  // Tabla pagos
  if (!(await db.schema.hasTable('pagos'))) {
    await db.schema.createTable('pagos', (t) => {
      t.increments('id').primary();
      t.integer('pedido_id').notNullable();
      t.string('pasarela', 50).notNullable();
      t.string('transaccion_id', 100).notNullable();
      t.decimal('monto', 10, 2).notNullable();
      t.string('estado', 50).defaultTo('pendiente');
      t.text('payload_referencia').nullable();
      t.timestamps(true, true);
    });
  }

  // Tabla cms_secciones
  if (!(await db.schema.hasTable('cms_secciones'))) {
    await db.schema.createTable('cms_secciones', (t) => {
      t.increments('id').primary();
      t.string('clave_seccion', 80).notNullable().unique();
      t.string('titulo', 200).notNullable();
      t.text('contenido_html').nullable();
      t.text('metadatos_json').nullable();
      t.integer('actualizado_por_id').nullable();
      t.timestamps(true, true);
    });
  }

  // Tabla testimonios
  if (!(await db.schema.hasTable('testimonios'))) {
    await db.schema.createTable('testimonios', (t) => {
      t.increments('id').primary();
      t.integer('cliente_id').nullable();
      t.string('nombre_cliente', 100).notNullable();
      t.text('comentario').notNullable();
      t.integer('calificacion').defaultTo(5);
      t.boolean('visible_landing').defaultTo(true);
      t.timestamps(true, true);
    });
  }

  // Tabla resenas
  if (!(await db.schema.hasTable('resenas'))) {
    await db.schema.createTable('resenas', (t) => {
      t.increments('id').primary();
      t.integer('producto_id').notNullable();
      t.integer('cliente_id').notNullable();
      t.text('comentario').notNullable();
      t.integer('calificacion').defaultTo(5);
      t.boolean('visible').defaultTo(true);
      t.timestamps(true, true);
    });
  }

  // Tabla blog_articulos
  if (!(await db.schema.hasTable('blog_articulos'))) {
    await db.schema.createTable('blog_articulos', (t) => {
      t.increments('id').primary();
      t.string('titulo', 200).notNullable();
      t.string('slug', 220).notNullable().unique();
      t.string('extracto', 500).nullable();
      t.text('contenido').notNullable();
      t.string('meta_title', 150).nullable();
      t.string('meta_description', 255).nullable();
      t.string('palabras_clave', 255).nullable();
      t.integer('autor_id').notNullable();
      t.boolean('publicado').defaultTo(false);
      t.dateTime('fecha_publicacion').nullable();
      t.integer('vistas').defaultTo(0);
      t.timestamps(true, true);
    });
  }

  // Tabla hospitalizaciones
  if (!(await db.schema.hasTable('hospitalizaciones'))) {
    await db.schema.createTable('hospitalizaciones', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('veterinario_id').notNullable();
      t.string('jaula_numero', 20).notNullable();
      t.string('jaula_tipo', 50).defaultTo('canil_chico');
      t.string('estado', 50).defaultTo('ingresado');
      t.text('motivo').notNullable();
      t.text('diagnostico_presuntivo').nullable();
      t.text('fluidoterapia_config').nullable();
      t.text('notas_ingreso').nullable();
      t.dateTime('fecha_ingreso').notNullable();
      t.dateTime('fecha_alta').nullable();
      t.timestamp('creado_en').defaultTo(db.fn.now());
      t.timestamp('actualizado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla monitoreo_pacientes
  if (!(await db.schema.hasTable('monitoreo_pacientes'))) {
    await db.schema.createTable('monitoreo_pacientes', (t) => {
      t.increments('id').primary();
      t.integer('hospitalizacion_id').notNullable();
      t.integer('registrado_por_id').notNullable();
      t.dateTime('fecha_hora').notNullable();
      t.decimal('temperatura', 4, 1).nullable();
      t.integer('frecuencia_cardiaca').nullable();
      t.integer('frecuencia_respiratoria').nullable();
      t.string('presion_arterial', 20).nullable();
      t.integer('tllc_segundos').nullable();
      t.integer('escala_dolor').nullable();
      t.string('estado_conciencia', 50).defaultTo('alerta');
      t.text('observaciones').nullable();
      t.timestamp('creado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla consentimientos_firmados
  if (!(await db.schema.hasTable('consentimientos_firmados'))) {
    await db.schema.createTable('consentimientos_firmados', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('cliente_id').notNullable();
      t.integer('veterinario_id').notNullable();
      t.string('tipo_consentimiento', 80).notNullable();
      t.string('titulo', 200).notNullable();
      t.text('contenido_legal').notNullable();
      t.string('firma_base64_hash', 64).notNullable();
      t.text('firma_datos_base64').notNullable();
      t.string('metadata_ip', 45).nullable();
      t.string('user_agent', 255).nullable();
      t.dateTime('firmado_en').notNullable();
      t.timestamp('creado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla estetica_checkins
  if (!(await db.schema.hasTable('estetica_checkins'))) {
    await db.schema.createTable('estetica_checkins', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('cita_id').nullable();
      t.integer('estilista_id').notNullable();
      t.string('tipo_manto', 100).nullable();
      t.string('corte_solicitado', 150).notNullable();
      t.boolean('nudos_severos').defaultTo(false);
      t.text('lesiones_previas').nullable();
      t.text('observaciones').nullable();
      t.string('estado', 50).defaultTo('en_espera');
      t.boolean('notificacion_enviada').defaultTo(false);
      t.timestamp('creado_en').defaultTo(db.fn.now());
      t.timestamp('actualizado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla recordatorios_preventivos
  if (!(await db.schema.hasTable('recordatorios_preventivos'))) {
    await db.schema.createTable('recordatorios_preventivos', (t) => {
      t.increments('id').primary();
      t.integer('mascota_id').notNullable();
      t.integer('cliente_id').notNullable();
      t.string('tipo', 80).notNullable();
      t.date('fecha_programada').notNullable();
      t.string('canal', 20).defaultTo('whatsapp');
      t.text('mensaje').notNullable();
      t.string('estado', 50).defaultTo('pendiente');
      t.dateTime('enviado_en').nullable();
      t.timestamp('creado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla seguimientos_clinicos
  if (!(await db.schema.hasTable('seguimientos_clinicos'))) {
    await db.schema.createTable('seguimientos_clinicos', (t) => {
      t.increments('id').primary();
      t.integer('expediente_id').nullable();
      t.integer('mascota_id').notNullable();
      t.integer('cliente_id').notNullable();
      t.integer('veterinario_id').notNullable();
      t.date('fecha_programada').notNullable();
      t.dateTime('fecha_contacto').nullable();
      t.string('estado_paciente', 50).defaultTo('pendiente');
      t.text('notas_seguimiento').nullable();
      t.boolean('contacto_exitoso').defaultTo(false);
      t.timestamp('creado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla cajas_turnos
  if (!(await db.schema.hasTable('cajas_turnos'))) {
    await db.schema.createTable('cajas_turnos', (t) => {
      t.increments('id').primary();
      t.integer('usuario_id').notNullable();
      t.integer('sucursal_id').nullable();
      t.dateTime('fecha_apertura').notNullable();
      t.dateTime('fecha_cierre').nullable();
      t.decimal('monto_inicial', 10, 2).defaultTo(0.00);
      t.decimal('total_ventas_efectivo', 10, 2).defaultTo(0.00);
      t.decimal('total_ventas_tarjeta', 10, 2).defaultTo(0.00);
      t.decimal('total_ventas_transferencia', 10, 2).defaultTo(0.00);
      t.decimal('total_entradas_manuales', 10, 2).defaultTo(0.00);
      t.decimal('total_salidas_manuales', 10, 2).defaultTo(0.00);
      t.decimal('monto_cierre_esperado', 10, 2).defaultTo(0.00);
      t.decimal('monto_cierre_real', 10, 2).nullable();
      t.decimal('diferencia', 10, 2).nullable();
      t.text('notas').nullable();
      t.string('estado', 50).defaultTo('abierta');
      t.timestamp('creado_en').defaultTo(db.fn.now());
      t.timestamp('actualizado_en').defaultTo(db.fn.now());
    });
  }

  // Tabla movimientos_caja
  if (!(await db.schema.hasTable('movimientos_caja'))) {
    await db.schema.createTable('movimientos_caja', (t) => {
      t.increments('id').primary();
      t.integer('caja_turno_id').notNullable();
      t.string('tipo', 50).notNullable();
      t.decimal('monto', 10, 2).notNullable();
      t.string('motivo', 255).notNullable();
      t.integer('registrado_por_id').notNullable();
      t.timestamp('creado_en').defaultTo(db.fn.now());
    });
  }
}

async function closeDb() {
  await db.destroy();
}

module.exports = {
  db,
  initTestDb,
  closeDb
};
