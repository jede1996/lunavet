# LunaVet Web Platform (v4.2 - Production Ready)

> **Plataforma Web Integral de Nivel Productivo para Clínicas Veterinarias: Gestión Clínica, E-Commerce con Control de Lotes FEFO, Landing Pública SEO, Generador de Placas QR, Panel Administrativo y Blindaje Defensivo OWASP Top 10.**

[![Quality Gate](https://img.shields.io/badge/Quality_Gate-Passed-brightgreen.svg)]()
[![Test Suites](https://img.shields.io/badge/Test_Suites-32_Passed_(29_Back_+_3_Front)-success.svg)]()
[![Tests](https://img.shields.io/badge/Tests-304_Passed_(277_Back_+_27_Front)-success.svg)]()
[![Coverage](https://img.shields.io/badge/Coverage-92%25_Stmts_|_80%25_Branch-brightgreen.svg)]()
[![ESLint](https://img.shields.io/badge/ESLint-0_Errors_|_0_Warnings-blue.svg)]()
[![OWASP Top 10](https://img.shields.io/badge/Security-OWASP_Top_10_Pentested_(14/14)-orange.svg)]()
[![Target Deployment](https://img.shields.io/badge/Deployment-cPanel_+_Phusion_Passenger-informational.svg)]()

---

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Arquitectura y Principios de Diseño](#arquitectura-y-principios-de-diseño)
3. [Módulos del Sistema](#módulos-del-sistema)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Requisitos Previos y Variables de Entorno](#requisitos-previos-y-variables-de-entorno)
6. [Instalación y Puesta en Marcha Local](#instalación-y-puesta-en-marcha-local)
7. [Credenciales de Acceso por Rol](#credenciales-de-acceso-por-rol)
8. [Validación de Calidad, Testing y Pentesting](#validación-de-calidad-testing-y-pentesting)
9. [Matriz de Seguridad y Blindaje OWASP Top 10](#matriz-de-seguridad-y-blindaje-owasp-top-10)
10. [Guía de Despliegue en cPanel + Phusion Passenger](#guía-de-despliegue-en-cpanel--phusion-passenger)
11. [Mapa de Endpoints y Matriz RBAC](#mapa-de-endpoints-y-matriz-rbac)

---

## Descripción General

**LunaVet Web Platform** es una solución enterprise diseñada para la operación clínica, comercial y administrativa de clínicas veterinarias modernas. Su arquitectura prioriza la **estabilidad operativa, alta seguridad defensiva en reposo y en tránsito, trazabilidad inmutable y compatibilidad nativa con entornos de hosting basados en cPanel y Phusion Passenger**.

### Capacidades Destacadas
- **Expediente Clínico Electrónico Completo:** Historiales clínicos cronológicos, carnet de vacunación digital, curvas de peso corporal y advertencias visuales de alergias.
- **Recetas Médicas Digitales en PDF:** Emisión en memoria con `pdfkit`, folio único de receta, verificación de vigencia y firma hash criptográfica SHA-256 sin depender de navegadores headless.
- **E-Commerce Veterinario con Trazabilidad FEFO:** Dispensación controlada de medicamentos por lote de caducidad más cercana (*First-Expired-First-Out*), flujo Click & Collect y cola de validación médica para fármacos regulados.
- **Motor de Agendamiento Anti-Colisión:** Algoritmo que previene el solapamiento de agendas veterinarias y soporte para tareas cron desatendidas vía HTTP seguro (`X-Cron-Key`) con protección contra ataques de tiempo.
- **Generador de Placas y Códigos QR para Mascotas:** Creador interactivo de placas metálicas para collares, credenciales de staff y pósters clínicos con exportación vectorial a PDF y PNG.
- **Seguridad y Cifrado en Reposo:** Cifrado simétrico AES-256-GCM para datos personales (PII) bajo la normativa LFPDPPP y almacenamiento desacoplado de imágenes en BLOBs seguros.
- **Autenticación Fuerte & 2FA:** Tokens JWT con rotación de refresh tokens opacos, políticas de contraseñas diferenciadas y autenticación de dos factores (2FA TOTP RFC 6238) nativa.
- **Auditoría con Redacción de Datos:** Bitácora inmutable `bitacora_auditoria` con ofuscación automática (`***REDACTED***`) de contraseñas, tokens y datos financieros.
- **UI Neumórfica Full-Width:** Diseño moderno con modo oscuro, alto contraste, tipografía profesional (Inter/Outfit) y soporte de temas por vista, sin botones de demostración en producción.

---

## Arquitectura y Principios de Diseño

```
                                  +---------------------------------------+
                                  |   Frontend SPA (React 19 + Vite 6)    |
                                  |   Bootstrap 5 + Context API + QR Core |
                                  +---------------------------------------+
                                                     |  (HTTPS / REST)
                                                     v
+---------------------------------------------------------------------------------------------------+
|                            cPanel Hosting Server (Phusion Passenger)                              |
|                                                                                                   |
|  [Security Middlewares]                                                                           |
|   ├── Rate Limiting (Sliding Window en memoria + Headers RFC + 429)                               |
|   ├── Helmet Hardened (CSP frame-ancestors none, object-src none, HSTS, DENY)                    |
|   ├── Prototype Pollution Sanitizer (__proto__, constructor, prototype)                           |
|   ├── CORS Dinámico (Whitelist por variable de entorno)                                           |
|   └── Safe Timing Compare (crypto.timingSafeEqual con Pre-Hash SHA-256)                           |
|                                                                                                   |
|  [Core Application Services]                                                                      |
|   ├── AES-256-GCM CryptoService (Cifrado PII en reposo)                                          |
|   ├── Pure-JS PDFService (pdfkit sin Chromium)                                                   |
|   ├── RFC 6238 TOTP Engine (Autenticación 2FA con HMAC-SHA1 nativo)                               |
|   ├── BLOB Service (Validación de Magic Numbers: JPEG, PNG, WebP, PDF)                           |
|   └── AuditTrail Service (Bitácora inmutable con redacción de PII)                                |
|                                                                                                   |
|  [Business Modules]                                                                               |
|   ├── /api/auth          (Registro, Login, Refresh, 2FA TOTP, Rate Limiter)                       |
|   ├── /api/pets          (Pacientes, N:M Multi-Dueño, Transferencias, Fotos)                     |
|   ├── /api/clinical      (Expediente, Alergias, Peso, Vacunas, Recetas PDF)                      |
|   ├── /api/appointments  (Agenda, Conflicto de Horarios, Cron cPanel Seguro)                     |
|   ├── /api/commerce      (Catálogo, Lotes FEFO, Click & Collect, Webhooks con Firma)             |
|   ├── /api/cms           (Landing Consolidada, Blog SEO, Testimonios Sanitizados)                |
|   └── /api/admin         (Staff CRUD, Reportes KPIs, Finanzas, Lotes en Riesgo, Auditoría)       |
+---------------------------------------------------------------------------------------------------+
                                                     |  (Knex Query Builder)
                                                     v
+---------------------------------------------------------------------------------------------------+
|                                  Capa de Persistencia de Datos                                    |
|  [MySQL 8.0 (Producción cPanel)] / [SQLite :memory: (Testing Automatizado)]                       |
|   ├── Relacional: usuarios, roles, mascotas, citas, pedidos, pagos, recetas, lotes, cms          |
|   ├── Archivos Aislados: archivos_adjuntos (BLOBs fuera del hot path de MySQL)                    |
|   └── Forense: bitacora_auditoria (Historial inmutable con IP, usuario, acción y PII protegida)   |
+---------------------------------------------------------------------------------------------------+
```

---

## Módulos del Sistema

| Módulo | Nombre | Descripción Técnica |
| :---: | :--- | :--- |
| **M1** | **Architecture Core & Security** | DDL relacional, cifrado AES-256-GCM, validación de Magic Bytes para BLOBs, redactor de PII y jerarquía de errores tipados. |
| **M2** | **Auth, RBAC & 2FA TOTP** | JWT con refresh rotation, contraseñas diferenciadas, bloqueo por fuerza bruta, Rate Limiting y 2FA TOTP (RFC 6238). |
| **M3** | **Pacientes & Multi-Dueño N:M** | Ficha de mascotas con relación N:M (`usuarios_mascotas`), transferencias auditadas y fotos en streaming seguro. |
| **M4** | **Expediente Clínico & Recetas** | Consultas médicas, alergias, peso, vacunas y recetas en PDF emitidas en memoria con firma digital hash. |
| **M5** | **Motor de Citas & Crontab** | Algoritmo anti-solapamiento, duración por servicio y cron desatendido protegido contra ataques de tiempo (`safeTimingCompare`). |
| **M6** | **E-Commerce & Lotes FEFO** | Inventario por lote con caducidad más cercana (FEFO), validación médica para controlados y webhooks blindados con firma obligatoria. |
| **M7** | **Landing Pública, Blog & CMS** | Endpoint consolidado `/api/cms/landing`, blog con auto-slug SEO y sanitización estricta anti-XSS en testimonios y reseñas. |
| **M8** | **Panel de Staff, Reportes & Admin**| Directorio de personal, dashboard con KPIs en tiempo real, reportes financieros y explorador forense de auditoría. |
| **M9** | **Frontend SPA & Placas QR** | Single Page Application en React 19 + Vite con generador de placas QR, portal de clientes y tienda Click & Collect. |

---

## Estructura del Proyecto

```text
vet/
├── backend/
│   ├── package.json               # Dependencias y scripts de backend
│   ├── jest.config.js             # Configuración del runner de pruebas Jest
│   ├── .eslintrc.json             # Reglas estrictas de calidad y estilo
│   ├── .env.example               # Plantilla de variables de entorno documentada
│   ├── scripts/
│   │   ├── init-db.js             # Script de inicialización y migración DDL
│   │   └── seed-admin.js          # Script de sembrado del superadministrador
│   ├── src/
│   │   ├── app.js                 # Express, middlewares de seguridad y montaje de rutas
│   │   ├── server.js              # Entrypoint compatible con Phusion Passenger
│   │   ├── config/
│   │   │   ├── env.js             # Validación y parseo centralizado de variables de entorno
│   │   │   └── database.js        # Configuración Knex (MySQL en prod, SQLite en test)
│   │   ├── core/
│   │   │   ├── audit.service.js   # Registro inmutable con redactor de PII sensible
│   │   │   ├── blob.service.js    # Validación binaria de magic numbers y sanitización
│   │   │   ├── crypto.service.js  # Cifrado AES-256-GCM y hashing SHA-256
│   │   │   ├── errors.js          # Jerarquía de clases de error HTTP tipadas
│   │   │   ├── password.service.js# Hashing bcryptjs y robustez por rol
│   │   │   ├── pdf.service.js     # Generación de recetas PDF con pdfkit
│   │   │   ├── token.service.js   # JWT y refresh tokens criptográficos
│   │   │   └── totp.service.js    # Generación y verificación 2FA TOTP
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js # Verificación JWT y validación RBAC
│   │   │   ├── cron.middleware.js # Validación de X-Cron-Key en tiempo constante
│   │   │   ├── error.middleware.js# Manejo centralizado de errores y vistas HTML
│   │   │   ├── rate-limiter.middleware.js # Limitador de tasa por ventana deslizante
│   │   │   └── security.middleware.js     # Helmet, CSP, Prototype Pollution, CORS
│   │   └── modules/
│   │       ├── admin/             # Módulo 8: Personal, Reportes y Auditoría
│   │       ├── appointments/      # Módulo 5: Citas y Cron
│   │       ├── auth/              # Módulo 2: Autenticación, RBAC y 2FA
│   │       ├── clinical/          # Módulo 4: Expediente, Vacunas y Recetas
│   │       ├── cms/               # Módulo 7: Landing, Blog y Testimonios
│   │       ├── commerce/          # Módulo 6: Tienda, Lotes FEFO y Webhooks
│   │       └── pets/              # Módulo 3: Mascotas y Propiedad N:M
│   └── tests/
│       ├── integration/           # Pruebas de integración HTTP (Supertest)
│       ├── security/              # Suite de Pentesting Automatizado OWASP Top 10
│       └── unit/                  # Pruebas unitarias de servicios de negocio
├── frontend/
│   ├── package.json               # Dependencias de React 19 y Vite
│   ├── vite.config.js             # Configuración de Vite y proxy de API
│   ├── index.html                 # Entrypoint HTML con metadatos SEO
│   ├── src/
│   │   ├── components/            # Componentes modulares (QR, Navbar, Footer, etc.)
│   │   ├── contexts/              # Contextos globales (Auth, Brand, Cart, Theme)
│   │   ├── pages/                 # Vistas públicas, de cliente y administrativas
│   │   ├── services/              # Clientes de consumo de API backend
│   │   └── tests/                 # Pruebas de rutas, optimización y contexto (Vitest)
├── walkthrough.md                 # Informe técnico de Pentesting y Blindaje de Seguridad
└── README.md                      # Documentación maestra del repositorio
```

---

## Requisitos Previos y Variables de Entorno

### Requisitos del Sistema
- **Node.js:** Versión `>= 18.0.0` (LTS recomendada: 18.x o 20.x).
- **npm:** `>= 9.0.0`.
- **MySQL:** `8.0+` o MariaDB `10.5+` (en producción).
- **Git:** Para control de versiones.

### Configuración del Archivo `.env` (Backend)
```bash
cp backend/.env.example backend/.env
```

| Variable | Descripción | Valor por Defecto / Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto de escucha o socket de Passenger | `3000` (o `passenger` en cPanel) |
| `NODE_ENV` | Entorno de ejecución | `development` o `production` |
| `DB_CLIENT` | Driver de base de datos | `mysql2` |
| `DB_HOST` | Host de la base de datos MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto de conexión MySQL | `3306` |
| `DB_USER` | Usuario de MySQL con permisos DDL/DML | `lunavet_user` |
| `DB_PASSWORD` | Contraseña segura de MySQL | `lunavet_password_segura` |
| `DB_NAME` | Nombre de la base de datos | `lunavet_db` |
| `ENCRYPTION_KEY` | Clave maestra AES-256-GCM (hexadecimal 64 car.) | Generar con `crypto.randomBytes(32)` |
| `JWT_SECRET` | Secreto para firma de tokens JWT | Cadena compleja de al menos 32 caracteres |
| `JWT_EXPIRES_IN` | Tiempo de vida del Access Token | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Días de validez del Refresh Token | `7` |
| `CRON_SECRET` | Secreto para tareas desatendidas cPanel (`X-Cron-Key`) | Cadena secreta y compleja |
| `PAYMENT_WEBHOOK_SECRET` | Secreto obligatorio para webhooks de pago | Cadena secreta compartida |
| `CORS_ORIGIN` | Orígenes autorizados separados por coma | `https://lunavet.lat,http://localhost:5173` |
| `BLOB_MAX_FILE_SIZE_BYTES` | Tamaño máximo de archivo subido | `5242880` (5 MB) |

> [!TIP]
> Genera una clave `ENCRYPTION_KEY` criptográficamente segura ejecutando:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## Instalación y Puesta en Marcha Local

### 1. Inicialización de Git (si es la primera vez en el proyecto)
Si descargaste o clonaste el proyecto sin inicializar el repositorio:
```bash
git init
git add .
git commit -m "feat: LunaVet v4.2 - Production Ready"
```

### 2. Puesta en Marcha del Backend
```bash
cd backend
npm install
cp .env.example .env
# Configura tus credenciales en el archivo .env

# Inicializar tablas y sembrar superadministrador
npm run db:init
npm run db:seed

# Iniciar servidor en desarrollo con hot-reload
npm run dev
```
El backend estará disponible en `http://localhost:3000`. Verifica el estado con:
```bash
curl http://localhost:3000/api/health
```

### 3. Puesta en Marcha del Frontend
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:5173`.

---

## Credenciales de Acceso por Rol

> [!IMPORTANT]
> El formulario de login **no incluye botones de acceso rápido** (removidos en v4.2). Ingresa manualmente las credenciales según el rol deseado.

### Selección de Portal

El formulario de autenticación (`/login`) ofrece dos pestañas:
- **"Soy Cliente"** → usa el endpoint `POST /api/auth/login`
- **"Personal de Clínica"** → usa el endpoint `POST /api/auth/staff/login`

### Cuentas de Prueba

| Rol | Portal a Seleccionar | Email | Contraseña | Redirige a |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Personal de Clínica | `admin@lunavet.lat` | `AdminLunaVet2026!` | `/admin/dashboard` |
| **Veterinario** | Personal de Clínica | `veterinario@lunavet.lat` | `VetLunaVet2026!` | `/staff/agenda` |
| **Cliente** | Soy Cliente | `cliente@lunavet.lat` | `TestClient#2026` | `/portal` |

### Flujo de Logout

El botón **"Cerrar Sesión"** en el navbar:
1. Invalida el Refresh Token en el backend (`POST /api/auth/logout`).
2. Limpia `lunavet_access_token`, `lunavet_refresh_token` y `lunavet_user` del `localStorage`.
3. Redirige al usuario a `/`.

> [!NOTE]
> Si el usuario tiene **2FA TOTP** activado, después del login con contraseña correcta se solicitará el código de 6 dígitos del autenticador antes de emitir la sesión.

---

## Validación de Calidad, Testing y Pentesting

El proyecto cuenta con validación automatizada continua en backend y frontend, alcanzando un **100% de pruebas aprobadas con 0 regresiones**:

### Resumen Global de Pruebas
| Capa | Framework | Suites Pasadas | Pruebas Pasadas | Cobertura / Estado |
| :--- | :--- | :---: | :---: | :--- |
| **Backend Core** | Jest + Supertest | **29 / 29** | **277 / 277** | Stmts >92%, Branch >80% |
| **Pentesting Suite** | Jest + Supertest | Incluida | 14 / 14 | OWASP Top 10 & CWE Blindados |
| **Frontend SPA** | Vitest + Testing Library | **3 / 3** | **27 / 27** | 100% Aprobadas |
| **Total Global** | — | **32 / 32** | **304 / 304** | **Cero Regresiones** |

### Comandos de Verificación
```bash
# 1. Ejecutar suite completa de backend (277 tests)
cd backend
npm test

# 2. Ejecutar exclusivamente la suite de Pentesting automatizado (14 tests)
npm test -- pentesting.security.test.js

# 3. Reporte de cobertura del backend
npm run test:coverage

# 4. Linter de backend (0 errores)
npm run lint

# 5. Ejecutar suite de frontend (27 tests)
cd ../frontend
npm test

# 6. Linter de frontend (0 errores)
npm run lint
```

---

## Matriz de Seguridad y Blindaje OWASP Top 10

| Categoría OWASP | Riesgo / Vector Mitigado | Blindaje Implementado en LunaVet |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Bypass de webhook de pagos (`CWE-306/347`) e IDOR/BOLA (`CWE-639`) | Firma obligatoria en webhooks con rechazo `403 Forbidden`; verificación criptográfica `crypto.timingSafeEqual`; validación de propiedad en mascotas (`checkUserPetAccess`), citas y recetas. |
| **A02: Cryptographic Failures** | Timing Attacks (`CWE-208`) y fuga de datos en reposo | Comparación en tiempo constante con `safeTimingCompare()` y pre-hash SHA-256 en cron secrets; cifrado AES-256-GCM para teléfonos y notas; hashing bcryptjs. |
| **A03: Injection** | Inyección SQL y Stored XSS (`CWE-79`) | Consultas parametrizadas con Knex; sanitización estricta de HTML y eliminación de `<script>` en testimonios y reseñas (`sanitizeHtmlString`). |
| **A04: Insecure Design** | Dispensación no autorizada de fármacos y colisiones | Cola de dictamen clínico obligatorio para fármacos controlados; algoritmo FEFO automático; reserva atómica de stock; motor anti-colisión de citas. |
| **A05: Security Misconfiguration** | Clickjacking, MIME sniffing y Prototype Pollution (`CWE-1321`) | Helmet con CSP estricto (`frameAncestors: none`, `objectSrc: none`); `X-Frame-Options: DENY`; `nosniff`; middleware anti-pollution; `X-Powered-By` deshabilitado; límite de payload a 2MB. |
| **A06: Vulnerable Components** | Librerías riesgosas | Dependencias mínimas y auditadas; uso exclusivo de primitivas nativas de `crypto` y `pdfkit` en JS puro sin navegadores headless. |
| **A07: Identification & Auth** | Ataques de fuerza bruta y saturación (`CWE-307`) | Rate Limiting por ventana deslizante (`rate-limiter.middleware.js`) con cabeceras RFC y HTTP 429; bloqueo tras intentos fallidos; 2FA TOTP RFC 6238 nativo. |
| **A08: Software & Data Integrity** | Subida de archivos maliciosos y camuflados | Validación binaria estricta de Magic Numbers (JPEG, PNG, WebP, PDF) en memoria sin tocar disco; streaming seguro con cabeceras `Content-Disposition`. |
| **A09: Logging & Monitoring** | Exposición de PII en logs (`CWE-532`) | Función recursiva `redactSensitiveData()` que enmascara contraseñas, tokens y tarjetas con `***REDACTED***` en la bitácora de auditoría inmutable. |
| **A10: SSRF & Tabnabbing** | Solicitudes falsificadas y manipulación de ventanas (`CWE-1022`) | Enlaces externos del frontend con `rel="noopener noreferrer"`; sanitización en ventana de impresión de placas QR; webhooks validados criptográficamente. |

---

## Guía de Despliegue en cPanel + Phusion Passenger

El sistema está optimizado para funcionar en hosting compartido o VPS administrado con **cPanel**:

### 1. Configuración de Base de Datos MySQL
1. En cPanel, ingresa a **Bases de datos MySQL** y crea la base de datos (ej. `usuario_lunavet`).
2. Crea un usuario MySQL con contraseña segura y asígnalo a la base con **TODOS LOS PRIVILEGIOS**.

### 2. Despliegue del Backend (Node.js App)
1. En cPanel, ve a **Software > Setup Node.js App** y presiona **Create Application**:
   - **Node.js Version:** `18.x` o `20.x`.
   - **Application Mode:** `Production`.
   - **Application Root:** `backend` (o la ruta donde subas los archivos de backend).
   - **Application URL:** `api.lunavet.lat` (o subdominio asignado).
   - **Application Startup File:** `src/server.js`.
2. Sube los archivos de `backend/` excluyendo la carpeta `node_modules`.
3. Ingresa por terminal cPanel, activa el entorno virtual mostrado por cPanel y ejecuta:
   ```bash
   npm install --omit=dev
   npm run db:init
   npm run db:seed
   ```
4. Configura las variables de entorno en el archivo `.env` del backend en el servidor.
5. Reinicia la aplicación desde el panel de Node.js en cPanel.

### 3. Despliegue del Frontend SPA
1. En tu máquina local, compila la aplicación para producción:
   ```bash
   cd frontend
   npm run build
   ```
2. Sube todo el contenido de la carpeta `frontend/dist/` al directorio `public_html` (o al subdominio configurado para la web pública en cPanel).
3. Asegúrate de que exista un archivo `.htaccess` en `public_html` para soportar el enrutamiento SPA de React Router:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### 4. Tareas Programadas en cPanel (Cron)
En **cPanel > Avanzada > Tareas Cron**, añade las siguientes ejecuciones:
- **Recordatorios de Citas (Diario a las 08:00 AM):**
  ```bash
  curl -s -H "X-Cron-Key: TU_CRON_SECRET" https://api.lunavet.lat/api/appointments/cron/send-reminders >/dev/null 2>&1
  ```
- **Depuración de Reservas Expiradas (Cada 15 minutos):**
  ```bash
  curl -s -H "X-Cron-Key: TU_CRON_SECRET" https://api.lunavet.lat/api/appointments/cron/expire-pending >/dev/null 2>&1
  ```

---

## Mapa de Endpoints y Matriz RBAC

### Autenticación y Perfil (`/api/auth`)
| Método | Endpoint | Roles Permitidos | Rate Limit | Descripción |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Público | 10 / 15m | Registro de cliente titular |
| `POST` | `/api/auth/login` | Público | 10 / 15m | Autenticación de clientes con soporte 2FA |
| `POST` | `/api/auth/staff/login` | Público | 10 / 15m | Autenticación exclusiva para personal de la clínica |
| `POST` | `/api/auth/refresh` | Público | Global | Rotación de Refresh Token por nuevo Access Token |
| `POST` | `/api/auth/logout` | Autenticado | Global | Revocación inmediata de sesión activa |
| `GET` | `/api/auth/me` | Autenticado | Global | Consulta de perfil del usuario en sesión |
| `POST` | `/api/auth/change-password` | Autenticado | 10 / 15m | Cambio voluntario de contraseña |
| `POST` | `/api/auth/2fa/setup` | Autenticado | Global | Generación de secreto Base32 y QR para 2FA |

### Pacientes y Mascotas (`/api/pets`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pets` | Autenticado | Listado de mascotas vinculadas |
| `POST` | `/api/pets` | Autenticado | Registro de nueva mascota con titularidad inicial |
| `GET` | `/api/pets/:id` | Dueño / Staff | Consulta detallada de paciente y cotitulares |
| `PUT` | `/api/pets/:id` | Dueño Principal / Staff | Modificación de datos de la mascota |
| `POST` | `/api/pets/:id/owners` | Dueño Principal / Staff | Asignación de cotitular adicional N:M |
| `POST` | `/api/pets/:id/photo` | Dueño / Staff | Subida y validación binaria de foto en BLOB |
| `GET` | `/api/pets/:id/photo` | Dueño / Staff | Streaming HTTP de fotografía de la mascota |

### Expediente Clínico y Recetas (`/api/clinical`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/clinical/pets/:id/records` | Dueño / Staff | Historial médico cronológico |
| `POST` | `/api/clinical/pets/:id/records` | Admin / Vet | Registro de nueva consulta clínica |
| `GET` | `/api/clinical/pets/:id/allergies`| Dueño / Staff | Alertas de alergias activas |
| `POST` | `/api/clinical/pets/:id/allergies`| Admin / Vet | Registro de sustancia alérgena |
| `GET` | `/api/clinical/pets/:id/weight` | Dueño / Staff | Serie temporal de peso corporal |
| `GET` | `/api/clinical/pets/:id/vaccines` | Dueño / Staff | Consulta del carnet de vacunación |
| `POST` | `/api/clinical/prescriptions` | Admin / Vet | Emisión de receta digital con firma hash y PDF |
| `GET` | `/api/clinical/prescriptions/:id/pdf`| Dueño / Staff | Streaming HTTP de receta en PDF generada en memoria |

### Motor de Citas (`/api/appointments`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments/services` | Público | Catálogo de servicios veterinarios y precios |
| `POST` | `/api/appointments/check-availability`| Público / Auth | Validación de disponibilidad anti-colisión |
| `GET` | `/api/appointments` | Autenticado | Listado de citas de cliente o staff |
| `POST` | `/api/appointments` | Autenticado | Agendamiento formal de cita previa validación |
| `PATCH`| `/api/appointments/:id/status` | Staff (o cliente cancela)| Transición de estado de cita |
| `POST` | `/api/appointments/cron/send-reminders`| Cron Key | Disparo desatendido de recordatorios por cPanel |
| `POST` | `/api/appointments/cron/expire-pending`| Cron Key | Depuración de citas provisionales expiradas |

### E-Commerce y Farmacia con Control FEFO (`/api/commerce`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/commerce/categories` | Público | Categorías activas de la farmacia |
| `GET` | `/api/commerce/products` | Público | Catálogo con cálculo dinámico de stock disponible |
| `POST` | `/api/commerce/checkout` | Autenticado | Checkout Click & Collect con reserva FEFO |
| `GET` | `/api/commerce/orders` | Autenticado | Historial de pedidos |
| `GET` | `/api/commerce/controlled/queue`| Admin / Vet | Cola de validación clínica de medicamentos controlados |
| `POST` | `/api/commerce/payments/webhook`| Webhook Signature | Confirmación segura de pagos SPEI / MercadoPago |

### CMS Ligero y Landing Pública (`/api/cms`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cms/landing` | Público | Datos consolidados de landing (servicios, blog, reseñas) |
| `GET` | `/api/cms/sections/:key` | Público | Detalle de sección específica |
| `POST` | `/api/cms/sections` | Admin | Creación o actualización de secciones |
| `GET` | `/api/cms/blog` | Público | Artículos de blog con soporte de búsqueda y tags |
| `GET` | `/api/cms/blog/:slug` | Público | Consulta de artículo e incremento de vistas |
| `POST` | `/api/cms/blog` | Admin / Vet | Publicación de artículo de blog con auto-slug |
| `GET` | `/api/cms/testimonials` | Público | Testimonios aprobados para la landing |
| `POST` | `/api/cms/testimonials` | Público | Envío de opinión por cliente (sanitizado anti-XSS) |
| `PATCH`| `/api/cms/testimonials/:id/visibility`| Admin | Moderación de visibilidad de testimonios |
| `GET` | `/api/cms/reviews/product/:id`| Público | Reseñas y promedio de calificación de un producto |
| `POST` | `/api/cms/reviews/product/:id`| Autenticado | Reseña verificada de producto (sanitizada) |

### Panel Administrativo y Auditoría (`/api/admin`)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Admin | KPIs en tiempo real de pacientes, citas y ventas |
| `GET` | `/api/admin/staff` | Admin | Directorio de personal médico y administrativo |
| `POST` | `/api/admin/staff` | Admin | Alta de personal con contraseña robusta |
| `PUT` | `/api/admin/staff/:id` | Admin | Actualización de perfil y roles |
| `POST` | `/api/admin/staff/:id/reset-password`| Admin | Restablecimiento administrativo de credenciales |
| `GET` | `/api/admin/reports/financial`| Admin | Reporte de ingresos, métodos de pago y ticket medio |
| `GET` | `/api/admin/reports/inventory-risk`| Admin | Lotes en riesgo de caducidad y stock bajo |
| `GET` | `/api/admin/audit-logs` | Admin | Explorador forense con PII sensible ofuscada |

---

## Licencia y Soporte

Desarrollado bajo estándares estrictos de ingeniería de software para **Clínica Veterinaria LunaVet**.

Para soporte técnico, despliegue o dudas arquitectónicas:
- **Email:** `soporte@lunavet.lat`
- **Portal:** [https://lunavet.lat](https://lunavet.lat)
