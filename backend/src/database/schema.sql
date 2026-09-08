-- =============================================================================
-- Plataforma Web Integral LunaVet - Esquema de Base de Datos MySQL v4.0
-- Single-Tenant para cPanel + Passenger
-- Soporta Cifrado en Reposo (ALE), BLOBs desacoplados y Auditoría LFPDPPP
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de Sucursales (extensibilidad futura: sucursal_id nullable en tablas clave)
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT NULL,
    telefono VARCHAR(30) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Usuarios y Roles (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sucursal_id INT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol ENUM('cliente', 'veterinario', 'recepcionista', 'administrador') NOT NULL,
    telefono_cifrado VARCHAR(255) NULL,
    cedula_profesional VARCHAR(50) NULL,
    dos_factores_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
    dos_factores_secreto VARCHAR(255) NULL,
    debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,
    intentos_fallidos INT NOT NULL DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso DATETIME NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL,
    INDEX idx_usuarios_rol (rol),
    INDEX idx_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Control de Sesiones y Refresh Tokens rotativos persistidos en BD
CREATE TABLE IF NOT EXISTS sesiones_activas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_agent VARCHAR(255) NULL,
    ip_origen VARCHAR(45) NULL,
    es_valido BOOLEAN NOT NULL DEFAULT TRUE,
    expira_en DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_sesiones_token (refresh_token_hash),
    INDEX idx_sesiones_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Pacientes (Mascotas)
CREATE TABLE IF NOT EXISTS mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NULL,
    sexo ENUM('macho', 'hembra', 'desconocido') NOT NULL DEFAULT 'desconocido',
    color VARCHAR(100) NULL,
    esterilizado BOOLEAN NOT NULL DEFAULT FALSE,
    microchip VARCHAR(100) NULL UNIQUE,
    notas_cifradas TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mascotas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Relación Multi-dueño (N:M)
CREATE TABLE IF NOT EXISTS usuarios_mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mascota_id INT NOT NULL,
    es_propietario_principal BOOLEAN NOT NULL DEFAULT FALSE,
    nivel_permiso ENUM('lectura', 'administracion') NOT NULL DEFAULT 'lectura',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuario_mascota (usuario_id, mascota_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    INDEX idx_um_mascota (mascota_id),
    INDEX idx_um_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Historial de Transferencia de Titularidad (Trazabilidad legal)
CREATE TABLE IF NOT EXISTS historial_titularidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    usuario_anterior_id INT NULL,
    usuario_nuevo_id INT NOT NULL,
    transferido_por_id INT NOT NULL,
    motivo TEXT NULL,
    fecha_transferencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_anterior_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_nuevo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (transferido_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Expediente Clínico Electrónico
CREATE TABLE IF NOT EXISTS expedientes_clinicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    fecha_consulta DATETIME NOT NULL,
    motivo_consulta TEXT NOT NULL,
    sintomas TEXT NULL,
    diagnostico_cifrado TEXT NOT NULL,
    tratamiento_cifrado TEXT NOT NULL,
    notas_privadas_cifradas TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_expediente_mascota (mascota_id),
    INDEX idx_expediente_fecha (fecha_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Lista de Alergias Consolidadas por Mascota
CREATE TABLE IF NOT EXISTS alergias_mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    sustancia VARCHAR(150) NOT NULL,
    severidad ENUM('leve', 'moderada', 'grave') NOT NULL DEFAULT 'moderada',
    reaccion TEXT NULL,
    creado_por_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_alergias_mascota (mascota_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Historial de Peso (Serie de Tiempo)
CREATE TABLE IF NOT EXISTS registros_peso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    peso_kg DECIMAL(5,2) NOT NULL,
    fecha_registro DATE NOT NULL,
    notas VARCHAR(255) NULL,
    registrado_por_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_peso_mascota_fecha (mascota_id, fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Carnet de Vacunas
CREATE TABLE IF NOT EXISTS vacunas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    nombre_vacuna VARCHAR(100) NOT NULL,
    lote VARCHAR(50) NULL,
    fecha_aplicacion DATE NOT NULL,
    fecha_proxima_dosis DATE NULL,
    veterinario_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_vacunas_mascota (mascota_id),
    INDEX idx_vacunas_proxima (fecha_proxima_dosis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Catálogo de Servicios
CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    duracion_minutos INT NOT NULL DEFAULT 30,
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Agenda de Citas
CREATE TABLE IF NOT EXISTS citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    cliente_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'atendiendo', 'completada', 'cancelada', 'no_asistio') NOT NULL DEFAULT 'pendiente',
    es_urgencia BOOLEAN NOT NULL DEFAULT FALSE,
    motivo VARCHAR(255) NOT NULL,
    recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE RESTRICT,
    INDEX idx_citas_vet_fecha (veterinario_id, fecha_hora_inicio),
    INDEX idx_citas_estado (estado),
    INDEX idx_citas_recordatorio (recordatorio_enviado, fecha_hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Categorías y Productos de E-Commerce
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    precio DECIMAL(10,2) NOT NULL,
    requiere_receta BOOLEAN NOT NULL DEFAULT FALSE,
    es_controlado BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_productos_controlado (es_controlado),
    INDEX idx_productos_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Lotes e Inventario (Trazabilidad y Caducidad)
CREATE TABLE IF NOT EXISTS lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_caducidad DATE NOT NULL,
    stock_disponible INT NOT NULL DEFAULT 0,
    stock_minimo_alerta INT NOT NULL DEFAULT 5,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_producto_lote (producto_id, numero_lote),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_lotes_caducidad (fecha_caducidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Recetas Médicas Digitales
CREATE TABLE IF NOT EXISTS recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(50) NOT NULL UNIQUE,
    expediente_id INT NULL,
    veterinario_id INT NOT NULL,
    mascota_id INT NOT NULL,
    fecha_emision DATE NOT NULL,
    vigencia_dias INT NOT NULL DEFAULT 30,
    firma_digital_hash VARCHAR(64) NOT NULL,
    estado ENUM('activa', 'surtida', 'cancelada', 'vencida') NOT NULL DEFAULT 'activa',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediente_id) REFERENCES expedientes_clinicos(id) ON DELETE SET NULL,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE RESTRICT,
    INDEX idx_recetas_folio (folio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recetas_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receta_id INT NOT NULL,
    producto_id INT NULL,
    nombre_medicamento VARCHAR(150) NOT NULL,
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    duracion_dias INT NOT NULL,
    cantidad_prescrita INT NOT NULL,
    indicaciones TEXT NULL,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Pedidos, Items y Pagos (Click & Collect, Sin CFDI - v4.0)
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    estado ENUM('pendiente_pago', 'validando_receta', 'listo_recoleccion', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente_pago',
    total DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('mercadopago', 'spei') NOT NULL,
    comprobante_interno_hash VARCHAR(64) NOT NULL,
    notas_cliente TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_pedidos_estado (estado),
    INDEX idx_pedidos_cliente (cliente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedidos_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    lote_id INT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS validaciones_controlados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    receta_id INT NOT NULL,
    validado_por_id INT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    motivo_rechazo TEXT NULL,
    fecha_validacion DATETIME NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE RESTRICT,
    FOREIGN KEY (validado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    pasarela ENUM('mercadopago', 'spei') NOT NULL,
    transaccion_id VARCHAR(100) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'acreditado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    payload_referencia TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pagos_transaccion (transaccion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Almacenamiento Desacoplado de Archivos BLOB
-- Previene degradación del InnoDB Buffer Pool en consultas operativas
CREATE TABLE IF NOT EXISTS archivos_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('mascota_foto', 'receta_pdf', 'pago_comprobante', 'cms_imagen', 'usuario_firma') NOT NULL,
    entidad_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes INT NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    buffer_datos LONGBLOB NOT NULL,
    subido_por_id INT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subido_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_archivos_entidad (entidad_tipo, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Bitácora de Auditoría Inmutable (LFPDPPP y Medicamentos Controlados)
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id VARCHAR(50) NULL,
    detalles TEXT NULL,
    ip_origen VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    nivel_criticidad ENUM('info', 'advertencia', 'critico') NOT NULL DEFAULT 'info',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_auditoria_entidad (entidad, entidad_id),
    INDEX idx_auditoria_usuario (usuario_id),
    INDEX idx_auditoria_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. CMS Ligero, Testimonios y Reseñas
CREATE TABLE IF NOT EXISTS cms_secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave_seccion VARCHAR(80) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    contenido_html LONGTEXT NULL,
    metadatos_json JSON NULL,
    actualizado_por_id INT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (actualizado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NULL,
    nombre_cliente VARCHAR(100) NOT NULL,
    comentario TEXT NOT NULL,
    calificacion INT NOT NULL DEFAULT 5,
    visible_landing BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    cliente_id INT NOT NULL,
    comentario TEXT NOT NULL,
    calificacion INT NOT NULL DEFAULT 5,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Artículos de Blog SEO
CREATE TABLE IF NOT EXISTS blog_articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    extracto VARCHAR(500) NULL,
    contenido LONGTEXT NOT NULL,
    meta_title VARCHAR(150) NULL,
    meta_description VARCHAR(255) NULL,
    palabras_clave VARCHAR(255) NULL,
    autor_id INT NOT NULL,
    publicado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_publicacion DATETIME NULL,
    vistas INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_blog_slug (slug),
    INDEX idx_blog_publicado (publicado, fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Módulo de Hospitalización y Triage UCI
CREATE TABLE IF NOT EXISTS hospitalizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    jaula_numero VARCHAR(20) NOT NULL,
    jaula_tipo ENUM('canil_chico', 'canil_grande', 'gatera', 'aislamiento', 'uci') NOT NULL DEFAULT 'canil_chico',
    estado ENUM('ingresado', 'en_observacion', 'alta', 'fallecido') NOT NULL DEFAULT 'ingresado',
    motivo TEXT NOT NULL,
    diagnostico_presuntivo TEXT NULL,
    fluidoterapia_config JSON NULL,
    notas_ingreso TEXT NULL,
    fecha_ingreso DATETIME NOT NULL,
    fecha_alta DATETIME NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_hosp_mascota (mascota_id),
    INDEX idx_hosp_estado (estado),
    INDEX idx_hosp_jaula (jaula_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS monitoreo_pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospitalizacion_id INT NOT NULL,
    registrado_por_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    temperatura DECIMAL(4,1) NULL,
    frecuencia_cardiaca INT NULL,
    frecuencia_respiratoria INT NULL,
    presion_arterial VARCHAR(20) NULL,
    tllc_segundos INT NULL,
    escala_dolor INT NULL,
    estado_conciencia ENUM('alerta', 'deprimido', 'estuporoso', 'comatoso') NOT NULL DEFAULT 'alerta',
    observaciones TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospitalizacion_id) REFERENCES hospitalizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_monitoreo_hosp (hospitalizacion_id, fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Consentimientos Informados con Firma Digital
CREATE TABLE IF NOT EXISTS consentimientos_firmados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    cliente_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    tipo_consentimiento ENUM('anestesia_cirugia', 'eutanasia_nom033', 'estetica_braquiocefalico', 'hospitalizacion_critica', 'general') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido_legal LONGTEXT NOT NULL,
    firma_base64_hash VARCHAR(64) NOT NULL,
    firma_datos_base64 LONGTEXT NOT NULL,
    metadata_ip VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    firmado_en DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_consent_mascota (mascota_id),
    INDEX idx_consent_tipo (tipo_consentimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Ficha de Admisión de Estética Anatómica
CREATE TABLE IF NOT EXISTS estetica_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    cita_id INT NULL,
    estilista_id INT NOT NULL,
    tipo_manto VARCHAR(100) NULL,
    corte_solicitado VARCHAR(150) NOT NULL,
    nudos_severos BOOLEAN NOT NULL DEFAULT FALSE,
    lesiones_previas JSON NULL,
    observaciones TEXT NULL,
    estado ENUM('en_espera', 'en_bano', 'secado_corte', 'listo_entrega', 'entregado') NOT NULL DEFAULT 'en_espera',
    notificacion_enviada BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL,
    FOREIGN KEY (estilista_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_estetica_mascota (mascota_id),
    INDEX idx_estetica_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Cola de Recordatorios Preventivos y Notificaciones
CREATE TABLE IF NOT EXISTS recordatorios_preventivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mascota_id INT NOT NULL,
    cliente_id INT NOT NULL,
    tipo ENUM('vacuna_rabia', 'vacuna_sextuple', 'vacuna_triple_felina', 'desparasitacion', 'cita_proxima', 'cumpleanos') NOT NULL,
    fecha_programada DATE NOT NULL,
    canal ENUM('whatsapp', 'email') NOT NULL DEFAULT 'whatsapp',
    mensaje TEXT NOT NULL,
    estado ENUM('pendiente', 'enviado', 'cancelado', 'fallido') NOT NULL DEFAULT 'pendiente',
    enviado_en DATETIME NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_recordatorios_estado_fecha (estado, fecha_programada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Seguimientos Post-Consulta y Post-Cirugía (48h/72h)
CREATE TABLE IF NOT EXISTS seguimientos_clinicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expediente_id INT NULL,
    mascota_id INT NOT NULL,
    cliente_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    fecha_programada DATE NOT NULL,
    fecha_contacto DATETIME NULL,
    estado_paciente ENUM('pendiente', 'recuperacion_favorable', 'molestia_leve', 'requiere_revision', 'urgencia') NOT NULL DEFAULT 'pendiente',
    notas_seguimiento TEXT NULL,
    contacto_exitoso BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediente_id) REFERENCES expedientes_clinicos(id) ON DELETE SET NULL,
    FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_seg_fecha (fecha_programada, estado_paciente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Punto de Venta (POS) y Turnos de Caja
CREATE TABLE IF NOT EXISTS cajas_turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sucursal_id INT NULL,
    fecha_apertura DATETIME NOT NULL,
    fecha_cierre DATETIME NULL,
    monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_ventas_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_ventas_tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_ventas_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_entradas_manuales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_salidas_manuales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_cierre_esperado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_cierre_real DECIMAL(10,2) NULL,
    diferencia DECIMAL(10,2) NULL,
    notas TEXT NULL,
    estado ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL,
    INDEX idx_cajas_estado (estado, fecha_apertura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caja_turno_id INT NOT NULL,
    tipo ENUM('entrada', 'salida') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    registrado_por_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_turno_id) REFERENCES cajas_turnos(id) ON DELETE CASCADE,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_mov_caja (caja_turno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
