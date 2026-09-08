# Manual de Instalación — Plataforma LunaVet
### Clínica Veterinaria, Farmacia & Estética | Acapulco de Juárez, Gro.

**Versión del manual:** 1.0  
**Versión de la plataforma:** 4.2  
**Fecha de emisión:** Septiembre 2026  
**Audiencia:** Administradores de sistema, DevOps, técnicos de infraestructura

---

## Tabla de Contenidos

1. [Descripción del Sistema](#1-descripción-del-sistema)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
   - 2.1 [Entorno Local (Desarrollo)](#21-entorno-local-desarrollo)
   - 2.2 [Entorno de Producción (cPanel)](#22-entorno-de-producción-cpanel)
3. [Instalación en Entorno Local](#3-instalación-en-entorno-local)
   - 3.1 [Clonar o Descargar el Proyecto](#31-clonar-o-descargar-el-proyecto)
   - 3.2 [Instalar el Backend](#32-instalar-el-backend)
   - 3.3 [Configurar Variables de Entorno](#33-configurar-variables-de-entorno)
   - 3.4 [Inicializar la Base de Datos](#34-inicializar-la-base-de-datos)
   - 3.5 [Sembrar Datos Iniciales](#35-sembrar-datos-iniciales)
   - 3.6 [Iniciar el Backend](#36-iniciar-el-backend)
   - 3.7 [Instalar e Iniciar el Frontend](#37-instalar-e-iniciar-el-frontend)
4. [Verificación de la Instalación](#4-verificación-de-la-instalación)
   - 4.1 [Prueba de API](#41-prueba-de-api)
   - 4.2 [Ejecutar Suite de Pruebas](#42-ejecutar-suite-de-pruebas)
   - 4.3 [Script de Diagnóstico](#43-script-de-diagnóstico)
5. [Referencia Completa de Variables de Entorno](#5-referencia-completa-de-variables-de-entorno)
6. [Esquema de Base de Datos](#6-esquema-de-base-de-datos)
7. [Despliegue en Producción (cPanel + Phusion Passenger)](#7-despliegue-en-producción-cpanel--phusion-passenger)
   - 7.1 [Preparar la Base de Datos MySQL](#71-preparar-la-base-de-datos-mysql)
   - 7.2 [Subir y Configurar el Backend](#72-subir-y-configurar-el-backend)
   - 7.3 [Compilar y Desplegar el Frontend](#73-compilar-y-desplegar-el-frontend)
   - 7.4 [Configurar Tareas Cron](#74-configurar-tareas-cron)
   - 7.5 [Configurar SSL / HTTPS](#75-configurar-ssl--https)
8. [Actualizaciones de la Plataforma](#8-actualizaciones-de-la-plataforma)
9. [Copias de Seguridad (Backup)](#9-copias-de-seguridad-backup)
10. [Solución de Problemas (Troubleshooting)](#10-solución-de-problemas-troubleshooting)
11. [Soporte Técnico](#11-soporte-técnico)

---

## 1. Descripción del Sistema

**LunaVet Web Platform v4.2** es una aplicación web full-stack compuesta por dos capas independientes:

| Capa | Tecnología | Puerto | Descripción |
| :--- | :--- | :---: | :--- |
| **Backend API REST** | Node.js 18+ · Express 4 · Knex · MySQL 8 | `3000` | Lógica de negocio, autenticación, base de datos |
| **Frontend SPA** | React 19 · Vite 6 · Bootstrap 5 | `5173` | Interfaz de usuario |

En desarrollo, el frontend envía peticiones `/api/*` al backend a través de un **proxy Vite** (`localhost:3000`).  
En producción, el backend corre bajo **Phusion Passenger** en cPanel y el frontend se sirve como archivos estáticos en `public_html`.

---

## 2. Requisitos del Sistema

### 2.1 Entorno Local (Desarrollo)

| Componente | Versión mínima | Versión recomendada | Verificar con |
| :--- | :--- | :--- | :--- |
| **Node.js** | 18.0.0 | 20.x LTS | `node --version` |
| **npm** | 9.0.0 | 10.x | `npm --version` |
| **MySQL** | 8.0 | 8.0+ | `mysql --version` |
| **Git** | 2.30 | última | `git --version` |
| **Sistema Operativo** | Windows 10+, macOS 12+, Ubuntu 20.04+ | — | — |

> [!IMPORTANT]
> Node.js 18 es la versión **mínima obligatoria**. Versiones anteriores causarán errores en las dependencias.

### 2.2 Entorno de Producción (cPanel)

| Componente | Requisito |
| :--- | :--- |
| **cPanel** | Versión con soporte a Node.js (Setup Node.js App) |
| **Phusion Passenger** | Integrado con cPanel |
| **Node.js** | 18.x o 20.x disponible en cPanel |
| **MySQL** | 8.0+ (base de datos cPanel) |
| **SSL/TLS** | Certificado Let's Encrypt o equivalente |
| **Acceso SSH** | Recomendado para ejecutar scripts de inicialización |
| **Espacio en disco** | Mínimo 500 MB para la aplicación y dependencias |

---

## 3. Instalación en Entorno Local

### 3.1 Clonar o Descargar el Proyecto

**Opción A — Clonar desde Git:**
```bash
git clone https://github.com/tu-usuario/lunavet.git
cd lunavet
```

**Opción B — Descargar el ZIP:**
1. Descarga el archivo `.zip` del repositorio.
2. Extrae el contenido en una carpeta de tu elección, por ejemplo: `C:\proyectos\lunavet` (Windows) o `~/proyectos/lunavet` (macOS/Linux).
3. Abre una terminal en esa carpeta.

La estructura del proyecto debe verse así:
```
lunavet/
├── backend/
├── frontend/
├── README.md
├── MANUAL_USUARIO.md
└── MANUAL_INSTALACION.md
```

---

### 3.2 Instalar el Backend

```bash
cd backend
npm install
```

> [!NOTE]
> Este comando descarga todas las dependencias listadas en `backend/package.json`. Requiere conexión a internet. El proceso tarda entre 30 segundos y 2 minutos dependiendo de la velocidad de conexión.

**Dependencias principales que se instalan:**

| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `express` | ^4.21.2 | Servidor HTTP y enrutamiento |
| `knex` | ^3.1.0 | Query builder para MySQL y SQLite |
| `mysql2` | ^3.12.0 | Driver MySQL para Node.js |
| `sqlite3` | ^6.0.1 | Base de datos en memoria para testing |
| `bcryptjs` | ^3.0.3 | Hash seguro de contraseñas |
| `jsonwebtoken` | ^9.0.3 | Tokens JWT de autenticación |
| `helmet` | ^8.0.0 | Cabeceras de seguridad HTTP |
| `pdfkit` | ^0.20.2 | Generación de recetas en PDF |
| `qrcode` | ^1.5.4 | Generación de códigos QR |
| `zod` | ^3.24.2 | Validación de esquemas de datos |

---

### 3.3 Configurar Variables de Entorno

El backend requiere un archivo `.env` con las credenciales y configuración del sistema.

**Paso 1: Copiar la plantilla:**
```bash
# Desde la carpeta backend/
cp .env.example .env
```

**Paso 2: Editar el archivo `.env`:**

Abre `backend/.env` con tu editor de texto y completa cada variable:

```dotenv
# =============================================
# SERVIDOR
# =============================================
PORT=3000
NODE_ENV=development

# =============================================
# BASE DE DATOS MySQL
# =============================================
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=lunavet_user
DB_PASSWORD=tu_contraseña_segura_aqui
DB_NAME=lunavet_db

# =============================================
# CIFRADO EN REPOSO (AES-256-GCM)
# OBLIGATORIO: Genera una nueva clave única
# =============================================
ENCRYPTION_KEY=<cadena_hexadecimal_de_64_caracteres>

# =============================================
# AUTENTICACIÓN JWT
# =============================================
JWT_SECRET=<cadena_aleatoria_de_minimo_32_caracteres>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# =============================================
# TAREAS CRON SEGURAS
# =============================================
CRON_SECRET=<cadena_aleatoria_para_tareas_automaticas>

# =============================================
# WEBHOOKS DE PAGO
# =============================================
PAYMENT_WEBHOOK_SECRET=<secreto_compartido_con_pasarela_de_pago>

# =============================================
# CORS — Orígenes permitidos
# =============================================
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# =============================================
# ALMACENAMIENTO BLOB
# =============================================
BLOB_MAX_FILE_SIZE_BYTES=5242880
```

**Paso 3: Generar valores criptográficamente seguros:**

```bash
# Generar ENCRYPTION_KEY (64 caracteres hex = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar JWT_SECRET (cadena aleatoria)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Generar CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar PAYMENT_WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> [!CAUTION]
> **Nunca reutilices claves entre proyectos.** La `ENCRYPTION_KEY` debe generarse una sola vez por instalación. Si se pierde o cambia, los datos cifrados en la base de datos **no podrán descifrarse**.

> [!WARNING]
> El archivo `.env` está en `.gitignore` y **nunca debe ser subido al repositorio**. Contiene credenciales sensibles.

---

### 3.4 Inicializar la Base de Datos

**Paso 1: Crear la base de datos MySQL:**

Conéctate a tu servidor MySQL y ejecuta:
```sql
CREATE DATABASE lunavet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lunavet_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON lunavet_db.* TO 'lunavet_user'@'localhost';
FLUSH PRIVILEGES;
```

**Paso 2: Ejecutar el script DDL (crear tablas):**
```bash
# Desde la carpeta backend/
npm run db:init
```

Este comando crea las siguientes **30 tablas** en la base de datos:

| Módulo | Tablas |
| :--- | :--- |
| **Auth & Seguridad** | `usuarios`, `sesiones_activas`, `bitacora_auditoria` |
| **Archivos** | `archivos_adjuntos` |
| **Mascotas** | `mascotas`, `usuarios_mascotas`, `historial_titularidad` |
| **Expediente Clínico** | `expedientes_clinicos`, `alergias_mascotas`, `registros_peso`, `vacunas` |
| **Recetas** | `recetas`, `recetas_items` |
| **Citas** | `citas`, `servicios` |
| **Comercio** | `categorias`, `productos`, `lotes`, `pedidos`, `pedidos_items`, `pagos`, `validaciones_controlados` |
| **CMS** | `cms_secciones`, `blog_articulos`, `testimonios`, `resenas` |
| **Hospitalización** | `hospitalizaciones`, `monitoreo_pacientes`, `consentimientos_firmados` |
| **Operaciones** | `estetica_checkins`, `recordatorios_preventivos`, `seguimientos_clinicos` |
| **POS** | `cajas_turnos`, `movimientos_caja` |

**Salida esperada:**
```
✓ Conectado a la base de datos
✓ Tablas creadas correctamente
✓ Esquema inicializado
```

---

### 3.5 Sembrar Datos Iniciales

**Paso 1: Crear el superadministrador:**
```bash
npm run db:seed
```

Esto crea la cuenta de administrador principal con las siguientes credenciales por defecto:

| Campo | Valor |
| :--- | :--- |
| **Email** | `admin@lunavet.lat` |
| **Contraseña** | `AdminLunaVet2026!` |
| **Rol** | `administrador` |

> [!IMPORTANT]
> **Cambia la contraseña del administrador inmediatamente después del primer inicio de sesión** desde el panel de administración (`/admin`).

**Paso 2 (opcional): Sembrar datos de prueba completos:**

Para cargar un conjunto de datos de prueba (mascotas, productos, citas, blog, etc.):
```bash
node scripts/seed-rich-test-data.js
```

Esto agrega:
- Personal clínico (veterinario + recepcionista) con datos de prueba
- Mascotas y clientes de ejemplo
- Productos y lotes en inventario
- Artículos de blog publicados
- Testimonios aprobados
- Citas de ejemplo

> [!NOTE]
> Los datos de prueba son solo para desarrollo/demostración. **No los uses en producción.**

---

### 3.6 Iniciar el Backend

```bash
# Desde la carpeta backend/
npm run dev
```

**Salida esperada:**
```
🚀 LunaVet API lista en http://localhost:3000
📦 Base de datos: MySQL (lunavet_db)
🔐 Modo: development
```

> [!TIP]
> `npm run dev` usa `node --watch` para reiniciar automáticamente el servidor cuando detecta cambios en los archivos. Ideal para desarrollo.

Para producción usa:
```bash
npm start
```

---

### 3.7 Instalar e Iniciar el Frontend

Abre una **segunda terminal** (el backend debe seguir corriendo):

```bash
# Desde la raíz del proyecto, entra al frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Salida esperada:**
```
  VITE v8.2.2  ready in 485 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Abre tu navegador en **http://localhost:5173** para ver la aplicación funcionando.

**Dependencias principales del frontend:**

| Paquete | Propósito |
| :--- | :--- |
| `react` + `react-dom` | Framework UI |
| `react-router-dom` | Enrutamiento SPA |
| `bootstrap` + `bootstrap-icons` | Estilos y íconos |
| `@fullcalendar/*` | Calendario de citas |
| `chart.js` + `react-chartjs-2` | Gráficas del dashboard |
| `qrcode` | Generador de placas QR |

---

## 4. Verificación de la Instalación

### 4.1 Prueba de API

Verifica que el backend responde correctamente:

```bash
# Health check (sin autenticación)
curl http://localhost:3000/api/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2026-09-07T...","env":"development"}
```

Prueba de autenticación:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lunavet.lat","password":"AdminLunaVet2026!"}'

# Respuesta esperada: token JWT + datos del usuario
```

### 4.2 Ejecutar Suite de Pruebas

**Suite del backend (277 tests):**
```bash
cd backend
npm test
```

Resultado esperado:
```
Test Suites: 29 passed, 29 total
Tests:       277 passed, 277 total
Snapshots:   0 total
Time:        ~45s
```

**Suite de pentesting OWASP (14 tests):**
```bash
cd backend
npm test -- pentesting.security.test.js
```

**Suite del frontend (27 tests):**
```bash
cd frontend
npm test
```

Resultado esperado:
```
Test Files  3 passed (3)
Tests       27 passed (27)
```

**Reporte de cobertura del backend:**
```bash
cd backend
npm run test:coverage
```

Métricas esperadas:
- Statements: > 92%
- Branches: > 80%

### 4.3 Script de Diagnóstico

El proyecto incluye un script de diagnóstico que verifica el estado general del sistema:

```bash
cd backend
node scripts/doctor.js
```

Verifica automáticamente:
- ✅ Versión de Node.js compatible
- ✅ Variables de entorno correctamente configuradas
- ✅ Conexión a la base de datos MySQL
- ✅ Tablas del esquema existentes
- ✅ Cuenta de administrador creada
- ✅ Clave de cifrado válida (64 caracteres hex)

---

## 5. Referencia Completa de Variables de Entorno

| Variable | Tipo | Obligatoria | Descripción | Ejemplo |
| :--- | :--- | :---: | :--- | :--- |
| `PORT` | Integer | ✅ | Puerto del servidor o `passenger` en cPanel | `3000` |
| `NODE_ENV` | String | ✅ | Entorno: `development`, `production` o `test` | `production` |
| `DB_CLIENT` | String | ✅ | Driver de BD: siempre `mysql2` en prod | `mysql2` |
| `DB_HOST` | String | ✅ | Host del servidor MySQL | `127.0.0.1` |
| `DB_PORT` | Integer | ✅ | Puerto MySQL | `3306` |
| `DB_USER` | String | ✅ | Usuario MySQL con permisos DDL/DML | `lunavet_user` |
| `DB_PASSWORD` | String | ✅ | Contraseña del usuario MySQL | `P4ssw0rd!Seg` |
| `DB_NAME` | String | ✅ | Nombre de la base de datos | `lunavet_db` |
| `ENCRYPTION_KEY` | Hex(64) | ✅ | Clave AES-256-GCM. **No cambiar tras primer uso.** | `0123...abcdef` |
| `JWT_SECRET` | String(32+) | ✅ | Secreto para firmar tokens JWT | `super_secret_...` |
| `JWT_EXPIRES_IN` | Duration | ✅ | Duración del Access Token | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Integer | ✅ | Días de vida del Refresh Token | `7` |
| `CRON_SECRET` | String | ✅ | Token para autenticar tareas cron (`X-Cron-Key`) | `cron_secret_...` |
| `PAYMENT_WEBHOOK_SECRET` | String | ✅ | HMAC secret para webhooks de pago | `webhook_secret_...` |
| `CORS_ORIGIN` | CSV URLs | ✅ | Orígenes permitidos separados por coma | `https://lunavet.lat` |
| `BLOB_MAX_FILE_SIZE_BYTES` | Integer | ❌ | Tamaño máximo de archivo en bytes | `5242880` (5 MB) |

> [!TIP]
> Para producción, cambia `JWT_EXPIRES_IN` a `15m` (no más). Tokens de larga duración son un riesgo de seguridad.

---

## 6. Esquema de Base de Datos

El esquema completo se genera automáticamente con `npm run db:init`. Resumen de la arquitectura relacional:

```
usuarios ──────────────┬── usuarios_mascotas ──── mascotas
                       │                              │
                       └── sesiones_activas       expedientes_clinicos
                       │                              │
                       └── bitacora_auditoria      vacunas
                                                      │
                                                   recetas ── recetas_items
                                                      │
                                                   alergias_mascotas
                                                   registros_peso

servicios ──── citas ──── mascotas
                          clientes

productos ──── lotes ──── pedidos ──── pedidos_items
               │                      pagos
               └── validaciones_controlados

cms_secciones
blog_articulos
testimonios
resenas
```

**Motor:** MySQL 8.0 con charset `utf8mb4` y collation `utf8mb4_unicode_ci` para soporte completo de UTF-8 (emojis, acentos, caracteres especiales).

---

## 7. Despliegue en Producción (cPanel + Phusion Passenger)

### 7.1 Preparar la Base de Datos MySQL

1. Inicia sesión en **cPanel > Bases de datos MySQL**.
2. Crea una nueva base de datos: `usuario_lunavet` (o el nombre que prefieras).
3. Crea un usuario MySQL con contraseña fuerte.
4. Asigna el usuario a la base con **TODOS LOS PRIVILEGIOS**.
5. Anota los datos: host (normalmente `127.0.0.1`), usuario, contraseña y nombre de BD.

---

### 7.2 Subir y Configurar el Backend

**Paso 1: Preparar los archivos localmente**

Crea un archivo `.env` de producción con los datos reales de tu servidor:
```bash
# En tu máquina local, dentro de backend/
cp .env.example .env.production
# Edita .env.production con los datos de producción
```

**Paso 2: Excluir archivos innecesarios**

Antes de subir, asegúrate de **no incluir**:
- `node_modules/` (se instala en el servidor)
- `.env` local (usa el de producción)
- `coverage/` (reportes de tests)
- Archivos de tests (`tests/`)

**Paso 3: Subir los archivos**

Sube el contenido de `backend/` al servidor usando **FTP, SFTP o el Administrador de Archivos de cPanel**.  
Ruta sugerida en el servidor: `/home/usuario/lunavet_backend/`

**Paso 4: Configurar la aplicación Node.js en cPanel**

1. Ve a **cPanel > Software > Setup Node.js App**.
2. Haz clic en **Create Application**:
   - **Node.js Version:** `20.x` (o 18.x)
   - **Application Mode:** `Production`
   - **Application Root:** `lunavet_backend` (ruta relativa a `/home/usuario/`)
   - **Application URL:** `api.lunavet.lat`
   - **Application Startup File:** `src/server.js`
3. Haz clic en **Create**.

**Paso 5: Instalar dependencias en el servidor**

Abre la **terminal SSH** de cPanel y ejecuta:
```bash
# Activar el entorno virtual de Node.js (cPanel lo muestra en la configuración)
source /home/usuario/nodevenv/lunavet_backend/20/bin/activate

# Ir al directorio de la aplicación
cd /home/usuario/lunavet_backend

# Instalar solo dependencias de producción
npm install --omit=dev

# Copiar el .env de producción
cp .env.production .env

# Inicializar la base de datos
npm run db:init

# Crear el superadministrador
npm run db:seed
```

**Paso 6: Configurar variables de entorno en cPanel**

En la configuración de la aplicación Node.js en cPanel, agrega las variables de entorno una por una en la sección **Environment Variables**. Esto es más seguro que usar el archivo `.env` en el servidor.

**Paso 7: Iniciar la aplicación**

Haz clic en **Start App** en el panel de Node.js de cPanel.  
Verifica que el estado cambie a **Running** (verde).

---

### 7.3 Compilar y Desplegar el Frontend

**Paso 1: Configurar la URL del API para producción**

En `frontend/vite.config.js`, el proxy `/api` funciona solo en desarrollo. Para producción, asegúrate de que `VITE_API_URL` o la URL base del API client apunte al dominio correcto (`https://api.lunavet.lat`).

**Paso 2: Compilar el frontend localmente**

```bash
cd frontend
npm run build
```

Esto genera una carpeta `frontend/dist/` con todos los archivos estáticos optimizados.

**Paso 3: Subir el contenido de `dist/` a `public_html`**

Sube **todo el contenido** de `frontend/dist/` al directorio `public_html` de tu dominio en cPanel (o al subdominio configurado).

**Paso 4: Configurar `.htaccess` para React Router**

Crea o edita el archivo `.htaccess` en `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # No reescribir archivos o directorios que existen
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Redirigir todo al index.html para React Router
  RewriteRule . /index.html [L]
</IfModule>

# Caché de assets estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
</IfModule>
```

> [!NOTE]
> El archivo `.htaccess` ya incluido en el proyecto (`backend/.htaccess`) es para el backend. El `.htaccess` del frontend va en `public_html` (donde está el `index.html`).

---

### 7.4 Configurar Tareas Cron

En **cPanel > Avanzada > Tareas Cron**, configura las siguientes tareas:

| Tarea | Frecuencia | Comando |
| :--- | :--- | :--- |
| **Recordatorios de citas** | Diario a las 08:00 | Ver abajo |
| **Expirar reservas pendientes** | Cada 15 minutos | Ver abajo |

```bash
# Recordatorios de citas (diario a las 08:00 AM)
0 8 * * * curl -s -X POST -H "X-Cron-Key: TU_CRON_SECRET" https://api.lunavet.lat/api/appointments/cron/send-reminders >/dev/null 2>&1

# Expirar citas provisionales (cada 15 minutos)
*/15 * * * * curl -s -X POST -H "X-Cron-Key: TU_CRON_SECRET" https://api.lunavet.lat/api/appointments/cron/expire-pending >/dev/null 2>&1
```

Reemplaza `TU_CRON_SECRET` con el valor exacto de tu variable `CRON_SECRET` en el `.env`.

---

### 7.5 Configurar SSL / HTTPS

1. En **cPanel > Seguridad > Let's Encrypt SSL**, genera un certificado para:
   - `lunavet.lat` (dominio principal del frontend)
   - `api.lunavet.lat` (subdominio del backend)
2. Activa la opción **Forzar HTTPS** para redirigir automáticamente las solicitudes HTTP.
3. Verifica que `CORS_ORIGIN` en el `.env` de producción use URLs con `https://`.

---

## 8. Actualizaciones de la Plataforma

Para actualizar a una nueva versión de LunaVet:

**Backend:**
```bash
# 1. Hacer backup de la BD antes de actualizar (ver sección 9)
# 2. Subir los nuevos archivos al servidor (excepto .env y node_modules)
# 3. Instalar dependencias actualizadas
npm install --omit=dev

# 4. Ejecutar migraciones de BD si aplica
npm run db:init

# 5. Reiniciar la aplicación desde cPanel > Node.js App
```

**Frontend:**
```bash
# 1. Compilar localmente
npm run build

# 2. Borrar el contenido de public_html (excepto .htaccess)
# 3. Subir el nuevo contenido de frontend/dist/
```

> [!WARNING]
> Nunca sobreescribas el archivo `.env` de producción durante una actualización. Mantén las claves existentes, especialmente `ENCRYPTION_KEY`.

---

## 9. Copias de Seguridad (Backup)

### Base de Datos

**Backup manual:**
```bash
# En el servidor (vía SSH)
mysqldump -u lunavet_user -p lunavet_db > backup_lunavet_$(date +%Y%m%d).sql
```

**Backup automático con cron:**
```bash
# Backup diario a las 02:00 AM
0 2 * * * mysqldump -u lunavet_user -p'TU_PASSWORD' lunavet_db | gzip > /home/usuario/backups/lunavet_$(date +\%Y\%m\%d).sql.gz
```

**Restaurar un backup:**
```bash
mysql -u lunavet_user -p lunavet_db < backup_lunavet_20260901.sql
```

### Variables de Entorno

Guarda una copia segura del archivo `.env` de producción en un **gestor de contraseñas** (Bitwarden, 1Password, etc.) o en un almacenamiento cifrado fuera del servidor.

> [!CAUTION]
> Si pierdes la `ENCRYPTION_KEY`, los datos personales cifrados (teléfonos, notas clínicas, diagnósticos) serán **irrecuperables**. Esta es la clave más crítica del sistema.

---

## 10. Solución de Problemas (Troubleshooting)

### El backend no inicia

**Síntoma:** `Error: Cannot find module '...'`  
**Solución:** Ejecuta `npm install` en la carpeta `backend/`.

---

**Síntoma:** `Error: connect ECONNREFUSED 127.0.0.1:3306`  
**Solución:** El servidor MySQL no está corriendo o las credenciales en `.env` son incorrectas. Verifica:
```bash
# Verificar que MySQL está corriendo (Linux/macOS)
sudo systemctl status mysql

# Probar conexión
mysql -u lunavet_user -p -h 127.0.0.1 lunavet_db
```

---

**Síntoma:** `Error: Unknown column 'X' in 'field list'`  
**Solución:** El esquema de BD está desactualizado. Ejecuta:
```bash
npm run db:init
```

---

**Síntoma:** `Error: secretOrPrivateKey must have a value`  
**Solución:** La variable `JWT_SECRET` está vacía o no existe en `.env`. Verifica que el archivo `.env` esté correctamente configurado.

---

### El frontend muestra pantalla en blanco

**Síntoma:** La página carga pero no muestra contenido.  
**Causa probable:** El backend no está corriendo o el proxy `/api` no funciona.  
**Solución:**
1. Verifica que el backend esté corriendo en `http://localhost:3000`.
2. Abre las herramientas de desarrollador del navegador (F12) y revisa la pestaña **Console** y **Network** para ver errores.

---

### Error 404 en rutas del frontend (producción)

**Síntoma:** Al acceder a `/portal`, `/login` u otras rutas directamente, el servidor devuelve 404.  
**Causa:** Falta el archivo `.htaccess` o no está configurado correctamente.  
**Solución:** Asegúrate de que el `.htaccess` descrito en la sección 7.3 esté en `public_html`.

---

### Los tests fallan

**Síntoma:** `npm test` muestra errores en el backend.  
**Solución:**
```bash
# Asegúrate de que NODE_ENV=test para usar SQLite en memoria
cross-env NODE_ENV=test npm test

# Si hay problemas de puertos ocupados:
npm test -- --detectOpenHandles --forceExit
```

---

### Rate Limiting activo en desarrollo

**Síntoma:** Recibes respuestas `429 Too Many Requests` al hacer pruebas.  
**Solución:** Espera el tiempo indicado en el header `Retry-After`, o reinicia el servidor backend para limpiar el estado del rate limiter en memoria.

---

### Archivos de imagen no se muestran

**Síntoma:** Las fotos de mascotas o productos no se cargan.  
**Causa:** Los archivos se almacenan como BLOBs en la BD, no en disco. Deben servirse a través de la API.  
**Solución:** Verifica que las rutas de imagen usen el endpoint correcto (`/api/pets/:id/photo`).

---

## 11. Soporte Técnico

Para asistencia técnica durante la instalación o configuración:

| Canal | Detalle |
| :--- | :--- |
| **Correo electrónico** | `soporte@lunavet.lat` |
| **WhatsApp** | `744 213 0868` |
| **Horario de soporte** | Lunes a Viernes 09:00–20:00 · Sáb 09:00–16:00 |

Al reportar un problema de instalación, incluye:
1. Sistema operativo y versión.
2. Versión de Node.js (`node --version`).
3. Versión de npm (`npm --version`).
4. El mensaje de error completo (copia y pega desde la terminal).
5. Los pasos exactos que realizaste antes del error.

---

*Documento generado por el equipo técnico de LunaVet.*  
*Plataforma v4.2 | Manual de Instalación v1.0 | Septiembre 2026*
