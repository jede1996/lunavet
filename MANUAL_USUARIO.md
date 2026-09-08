# Manual de Usuario — Plataforma LunaVet
### Clínica Veterinaria, Farmacia & Estética | Acapulco de Juárez, Gro.

**Versión del manual:** 1.0  
**Versión de la plataforma:** 4.2  
**Fecha de emisión:** Septiembre 2026  
**Clasificación:** Uso general — Tutores, Personal Clínico y Administradores

---

## Tabla de Contenidos

1. [Introducción y Propósito](#1-introducción-y-propósito)
2. [Convenciones y Simbología](#2-convenciones-y-simbología)
3. [Requisitos de Acceso](#3-requisitos-de-acceso)
4. [Navegación General y Temas Visuales](#4-navegación-general-y-temas-visuales)
5. [Módulo Público — Sin Iniciar Sesión](#5-módulo-público--sin-iniciar-sesión)
   - 5.1 [Página de Inicio (Landing)](#51-página-de-inicio-landing)
   - 5.2 [Catálogo de Servicios](#52-catálogo-de-servicios)
   - 5.3 [Tienda y Farmacia Veterinaria](#53-tienda-y-farmacia-veterinaria)
   - 5.4 [Agendar una Cita](#54-agendar-una-cita)
   - 5.5 [Blog Veterinario](#55-blog-veterinario)
   - 5.6 [Generador de Placas QR](#56-generador-de-placas-qr)
   - 5.7 [Verificador de Recetas Médicas](#57-verificador-de-recetas-médicas)
6. [Registro e Inicio de Sesión](#6-registro-e-inicio-de-sesión)
   - 6.1 [Crear una Cuenta](#61-crear-una-cuenta)
   - 6.2 [Iniciar Sesión como Cliente](#62-iniciar-sesión-como-cliente)
   - 6.3 [Iniciar Sesión como Personal de Clínica](#63-iniciar-sesión-como-personal-de-clínica)
   - 6.4 [Autenticación de Dos Factores (2FA)](#64-autenticación-de-dos-factores-2fa)
   - 6.5 [Cerrar Sesión](#65-cerrar-sesión)
7. [Portal del Cliente (Tutor de Mascota)](#7-portal-del-cliente-tutor-de-mascota)
   - 7.1 [Panel Principal del Portal](#71-panel-principal-del-portal)
   - 7.2 [Mis Mascotas](#72-mis-mascotas)
   - 7.3 [Expediente Clínico](#73-expediente-clínico)
   - 7.4 [Mis Citas](#74-mis-citas)
   - 7.5 [Compra y Checkout (Click & Collect)](#75-compra-y-checkout-click--collect)
8. [Portal del Personal Clínico (Veterinario / Recepcionista)](#8-portal-del-personal-clínico-veterinario--recepcionista)
   - 8.1 [Agenda del Día](#81-agenda-del-día)
   - 8.2 [Consulta Médica](#82-consulta-médica)
   - 8.3 [Medicamentos Controlados](#83-medicamentos-controlados)
   - 8.4 [Hospitalización](#84-hospitalización)
   - 8.5 [Estética y Grooming](#85-estética-y-grooming)
   - 8.6 [Recordatorios y Notificaciones](#86-recordatorios-y-notificaciones)
   - 8.7 [Punto de Venta (POS)](#87-punto-de-venta-pos)
9. [Panel de Administración](#9-panel-de-administración)
   - 9.1 [Dashboard con KPIs](#91-dashboard-con-kpis)
   - 9.2 [Gestión de Personal (Staff)](#92-gestión-de-personal-staff)
   - 9.3 [Inventario y Control FEFO](#93-inventario-y-control-fefo)
   - 9.4 [Reportes Financieros](#94-reportes-financieros)
   - 9.5 [Explorador de Auditoría](#95-explorador-de-auditoría)
   - 9.6 [Gestor de Contenidos (CMS)](#96-gestor-de-contenidos-cms)
10. [Seguridad y Privacidad](#10-seguridad-y-privacidad)
11. [Preguntas Frecuentes (FAQ)](#11-preguntas-frecuentes-faq)
12. [Soporte Técnico](#12-soporte-técnico)

---

## 1. Introducción y Propósito

La **Plataforma Digital LunaVet** es un sistema integral diseñado para facilitar la atención médica veterinaria, la gestión operativa de la clínica y la comunicación entre el equipo clínico y los tutores de mascotas.

Este manual está dirigido a tres perfiles de usuario:

| Perfil | Acceso | Descripción |
| :--- | :--- | :--- |
| **Tutor / Cliente** | `/portal` | Tutor de mascota que consulta expedientes, agenda citas y realiza compras |
| **Veterinario / Recepcionista** | `/staff/agenda` | Personal clínico que registra consultas, gestiona agenda y opera el POS |
| **Administrador** | `/admin/dashboard` | Gestiona el personal, inventario, finanzas y configuración del sistema |

**Objetivo del manual:** Proporcionar instrucciones claras, paso a paso, para que cualquier usuario pueda utilizar la plataforma de forma autónoma y segura.

---

## 2. Convenciones y Simbología

A lo largo de este manual se utilizan los siguientes indicadores:

| Símbolo | Significado |
| :---: | :--- |
| ℹ️ **Nota** | Información complementaria o aclaración |
| ⚠️ **Advertencia** | Acción que puede tener consecuencias irreversibles |
| ✅ **Buena práctica** | Recomendación para un mejor uso del sistema |
| 🔒 **Seguridad** | Información relacionada con protección de datos |
| ➡️ **Ruta** | Dirección URL dentro de la plataforma (ej. `/portal/mascotas`) |

Los elementos en **negrita** hacen referencia a botones o etiquetas visibles en pantalla.  
Los términos en `código` hacen referencia a rutas de acceso o valores técnicos.

---

## 3. Requisitos de Acceso

### Dispositivos y Navegadores

La plataforma está optimizada para funcionar en cualquier dispositivo moderno:

| Dispositivo | Resolución mínima | Navegadores soportados |
| :--- | :--- | :--- |
| Computadora de escritorio | 1024 × 768 px | Chrome 100+, Firefox 100+, Edge 100+, Safari 15+ |
| Tableta | 768 × 1024 px | Mismos navegadores anteriores |
| Smartphone | 375 × 667 px | Chrome Mobile, Safari iOS |

### Conexión

- Se requiere conexión a internet activa para todas las operaciones.
- No se requiere instalar ninguna aplicación; la plataforma funciona directamente desde el navegador.

### Datos de Acceso

Cada usuario debe contar con:
- **Correo electrónico** registrado en el sistema.
- **Contraseña** asignada o creada durante el registro.

---

## 4. Navegación General y Temas Visuales

### Barra de Navegación (Navbar)

La barra superior está siempre visible y contiene:

| Elemento | Descripción |
| :--- | :--- |
| **Logo Luna-Vet** | Clic regresa al inicio (`/`) |
| **Inicio** | Página principal de la clínica |
| **Servicios** | Catálogo de servicios médicos |
| **Tienda** | Farmacia y tienda veterinaria |
| **Citas** | Agendamiento de citas (público) |
| **Blog** | Artículos de salud veterinaria |
| 🛒 **Carrito** | Abre el panel lateral de compras con el conteo de productos |
| **Iniciar Sesión / Mi Cuenta** | Acceso al perfil o menú de usuario autenticado |
| ☀️/🌙 **Tema** | Alterna entre modo claro, oscuro y alto contraste |

### Temas Visuales

La plataforma ofrece tres modos de visualización accesibles desde el ícono en el navbar:

| Modo | Descripción |
| :--- | :--- |
| **Claro** | Fondo blanco con texto oscuro (predeterminado) |
| **Oscuro** | Fondo oscuro, ideal para uso nocturno o ambientes con poca luz |
| **Alto Contraste** | Colores de máximo contraste para usuarios con dificultades visuales |

✅ La preferencia de tema se guarda automáticamente en el navegador.

---

## 5. Módulo Público — Sin Iniciar Sesión

### 5.1 Página de Inicio (Landing)

**Ruta:** ➡️ `/`

La página de inicio presenta:
- **Hero principal** con el eslogan de la clínica y botones de acceso rápido a citas y la tienda.
- **Sección de Servicios Destacados** con los principales servicios veterinarios.
- **Nuestro Equipo** — Perfiles del personal médico con especialidades.
- **Testimonios** de clientes verificados.
- **Blog** — Últimas publicaciones de salud animal.
- **Contacto y Ubicación** — Mapa, teléfono y dirección (El Coloso, Acapulco, Gro.).

ℹ️ **Nota:** Desde esta página puedes acceder directamente a agendar una cita o explorar la tienda sin necesidad de registrarte.

---

### 5.2 Catálogo de Servicios

**Ruta:** ➡️ `/servicios`

Presenta todos los servicios disponibles con descripción, duración estimada y precio base:

- Consulta General y de Urgencias
- Cirugías programadas y de emergencia
- Vacunación y desparasitación
- Hospitalización y cuidados intensivos
- Estética canina y felina (grooming)
- Farmacia veterinaria

✅ Utiliza esta sección para preparar tu visita o conocer el costo aproximado antes de agendar.

---

### 5.3 Tienda y Farmacia Veterinaria

**Ruta:** ➡️ `/tienda`

#### Buscar productos
1. En la barra de búsqueda superior, escribe el nombre del producto o medicamento.
2. Usa los filtros de **categoría** en el panel lateral para acotar resultados.
3. Cada tarjeta de producto muestra: nombre, precio, stock disponible y calificación.

#### Agregar al carrito
1. Haz clic en **Agregar al carrito** en la tarjeta del producto.
2. El ícono del carrito 🛒 en el navbar mostrará el número de artículos acumulados.
3. Puedes hacer clic en el carrito para ver el resumen y ajustar cantidades.

⚠️ **Medicamentos controlados:** Algunos productos requieren validación de receta médica. El sistema notificará si un producto requiere autorización clínica antes de completar la compra.

ℹ️ **Sistema FEFO:** Los medicamentos se despachan automáticamente del lote con fecha de caducidad más próxima para garantizar la frescura del producto.

---

### 5.4 Agendar una Cita

**Ruta:** ➡️ `/citas`

Este módulo permite solicitar una cita **sin necesidad de iniciar sesión** (aunque se recomienda hacerlo para guardar el historial).

**Pasos:**
1. **Selecciona el servicio** deseado del catálogo (consulta, vacuna, cirugía, estética, etc.).
2. **Elige al veterinario** disponible (o deja "Sin preferencia" para asignación automática).
3. **Selecciona la fecha** en el calendario. Los días y horarios disponibles se muestran en verde.
4. **Elige el horario** disponible. El sistema valida automáticamente que no haya conflictos.
5. **Ingresa los datos del paciente:** nombre de la mascota, especie, raza y motivo de consulta.
6. **Proporciona tus datos de contacto** (nombre, teléfono, correo).
7. Haz clic en **Confirmar Cita**.

✅ Recibirás un correo de confirmación con el resumen de tu cita.

⚠️ Las citas tienen un tiempo de reserva provisional. Si no se confirma la asistencia, pueden cancelarse automáticamente.

---

### 5.5 Blog Veterinario

**Ruta:** ➡️ `/blog`

El blog contiene artículos de salud y bienestar animal escritos por el equipo veterinario de LunaVet.

- Usa la **barra de búsqueda** para encontrar artículos por tema.
- Filtra por **etiquetas** (vacunas, nutrición, dermatología, etc.).
- Haz clic en cualquier artículo para leer el contenido completo.

✅ Los artículos son de acceso libre y no requieren registro.

---

### 5.6 Generador de Placas QR

**Ruta:** ➡️ `/qr`

Herramienta gratuita para crear códigos QR de identificación para tu mascota.

**Pasos:**
1. Completa el formulario con:
   - Nombre de la mascota
   - Tu nombre y número de teléfono de contacto
   - Información médica relevante (alergias, enfermedades crónicas)
2. Selecciona el **estilo visual** de la placa (forma, colores, logo de la clínica).
3. Haz clic en **Generar QR**.
4. Descarga la placa en formato **PNG** (para imprimir en casa) o **PDF vectorial** (para impresión profesional en metal o plástico).

ℹ️ El código QR generado muestra la información de contacto al ser escaneado con cualquier smartphone, sin necesidad de instalar aplicaciones.

---

### 5.7 Verificador de Recetas Médicas

**Ruta:** ➡️ `/receta/:folio`

Permite validar la autenticidad de una receta emitida por LunaVet.

**Pasos:**
1. Ingresa el **folio de la receta** (impreso en el documento PDF).
2. El sistema consulta la base de datos y muestra:
   - Paciente y veterinario que la emitió
   - Medicamento, dosis e instrucciones
   - Fecha de emisión y fecha de vencimiento
   - Estado de validez (vigente / expirada)

🔒 Las recetas incluyen una firma digital hash SHA-256 que garantiza que no han sido alteradas.

---

## 6. Registro e Inicio de Sesión

### 6.1 Crear una Cuenta

**Ruta:** ➡️ `/registro`

El registro está disponible únicamente para **tutores / clientes**. El personal de la clínica es dado de alta por el administrador.

**Pasos:**
1. Haz clic en **Iniciar Sesión** en el navbar y luego en **"¿Aún no tienes cuenta? Regístrate gratis aquí."**
2. Completa el formulario:
   - **Nombre y apellido**
   - **Correo electrónico** (será tu usuario de acceso)
   - **Teléfono de contacto**
   - **Contraseña** (mínimo 8 caracteres; debe incluir mayúsculas, minúsculas y números)
3. Haz clic en **Crear Cuenta**.
4. Serás redirigido automáticamente a tu portal de cliente (`/portal`).

✅ **Buena práctica:** Usa una contraseña única que no utilices en otros servicios.

---

### 6.2 Iniciar Sesión como Cliente

**Ruta:** ➡️ `/login`

1. Asegúrate de que la pestaña **"Soy Cliente"** esté seleccionada (es la predeterminada).
2. Ingresa tu **correo electrónico** y **contraseña**.
3. Haz clic en **Iniciar Sesión**.
4. Serás redirigido a tu portal (`/portal`).

---

### 6.3 Iniciar Sesión como Personal de Clínica

**Ruta:** ➡️ `/login`

1. Haz clic en la pestaña **"Personal de Clínica"**.
2. Ingresa tu **correo institucional** y **contraseña** asignada por el administrador.
3. Haz clic en **Iniciar Sesión**.
4. Serás redirigido según tu rol:
   - **Veterinario / Recepcionista** → `/staff/agenda`
   - **Administrador** → `/admin/dashboard`

⚠️ **Importante:** No compartas tus credenciales con nadie. Cada acceso queda registrado en la bitácora de auditoría del sistema.

---

### 6.4 Autenticación de Dos Factores (2FA)

Si tu cuenta tiene habilitada la **verificación en dos pasos (2FA TOTP)**:

1. Después de ingresar correctamente tu contraseña, el sistema mostrará una pantalla adicional solicitando el **código de seguridad**.
2. Abre tu aplicación de autenticación (Google Authenticator, Authy, etc.) y copia el código de 6 dígitos que se muestra.
3. Ingresa el código en el campo **"Código de seguridad"** y confirma.

ℹ️ Los códigos TOTP cambian cada 30 segundos. Si el código expira, espera al siguiente.

**Para activar 2FA en tu cuenta:**
1. Inicia sesión y ve a tu perfil de usuario.
2. Busca la opción **Seguridad > Activar autenticación de dos factores**.
3. Escanea el código QR con tu app de autenticación.
4. Verifica el primer código y guarda.

🔒 Se recomienda especialmente para el personal clínico y el administrador.

---

### 6.5 Cerrar Sesión

Para salir de forma segura:
1. Haz clic en tu **nombre o foto de perfil** en la esquina superior derecha del navbar.
2. Selecciona **"Cerrar Sesión"** en el menú desplegable.
3. Serás redirigido a la página de inicio (`/`).

✅ La sesión se invalida en el servidor automáticamente. Si usas una computadora compartida, siempre cierra sesión al terminar.

---

## 7. Portal del Cliente (Tutor de Mascota)

**Acceso requerido:** Cuenta de cliente activa  
**Ruta base:** ➡️ `/portal`

---

### 7.1 Panel Principal del Portal

**Ruta:** ➡️ `/portal`

Al iniciar sesión como cliente verás un resumen de:
- **Tus mascotas registradas** con acceso directo a cada expediente.
- **Próximas citas** con fecha, hora y veterinario asignado.
- **Últimos pedidos** de la tienda con su estado.
- **Accesos rápidos** a las secciones más usadas.

---

### 7.2 Mis Mascotas

**Ruta:** ➡️ `/portal/mascotas`

#### Registrar una nueva mascota
1. Haz clic en **"+ Agregar Mascota"**.
2. Completa el formulario:
   - Nombre, especie (perro, gato, ave, etc.), raza
   - Fecha de nacimiento o edad aproximada
   - Sexo y si está esterilizado/a
   - Color y características físicas
3. Sube una **foto de tu mascota** (JPEG, PNG o WebP, máx. 5 MB).
4. Haz clic en **Guardar Mascota**.

#### Ver el perfil de una mascota
- Haz clic en la tarjeta de tu mascota para ver su ficha completa.
- Desde aquí puedes acceder al **expediente clínico**, **historial de citas** y **carnet de vacunación**.

#### Agregar un cotitular
Si varias personas cuidan a la misma mascota (ej. familiares):
1. Abre el perfil de la mascota.
2. Haz clic en **"Agregar Cotitular"**.
3. Ingresa el correo electrónico del cotitular registrado en LunaVet.
4. El cotitular también podrá ver el expediente de la mascota.

ℹ️ Solo el **dueño principal** puede modificar los datos de la mascota o transferir la titularidad.

---

### 7.3 Expediente Clínico

**Ruta:** ➡️ `/portal/expediente/:id`

El expediente clínico contiene el historial médico completo de tu mascota:

#### Secciones del Expediente

| Pestaña | Contenido |
| :--- | :--- |
| **Historial Clínico** | Lista cronológica de consultas con diagnóstico y tratamiento |
| **Vacunas** | Carnet de vacunación con fechas de aplicación y próximas dosis |
| **Peso** | Gráfica de curva de peso corporal con el historial de mediciones |
| **Alergias** | Alertas de sustancias y medicamentos a los que la mascota es alérgica |
| **Recetas** | Recetas médicas digitales con opción de descarga en PDF |

#### Descargar una Receta Médica
1. Ve a la pestaña **Recetas**.
2. Localiza la receta que deseas descargar.
3. Haz clic en el botón **"Descargar PDF"**.
4. El PDF se generará en el servidor y se descargará automáticamente.

🔒 Las recetas incluyen firma digital y folio único para validación farmacéutica.

---

### 7.4 Mis Citas

**Ruta:** ➡️ `/portal/citas`

Visualiza y gestiona el historial de citas de todas tus mascotas:

| Estado | Descripción |
| :--- | :--- |
| **Pendiente** | Cita confirmada en espera de atención |
| **En curso** | La mascota está siendo atendida |
| **Completada** | Consulta finalizada |
| **Cancelada** | Cita cancelada por el cliente o la clínica |

**Para cancelar una cita:**
1. Haz clic en la cita que deseas cancelar.
2. Selecciona **"Cancelar Cita"** y confirma en el diálogo.

⚠️ Se recomienda cancelar con al menos 2 horas de anticipación para liberar el horario a otros pacientes.

---

### 7.5 Compra y Checkout (Click & Collect)

**Ruta:** ➡️ `/checkout`

El modelo de compra es **Click & Collect**: realizas el pedido en línea y lo recoges en la clínica.

**Pasos para completar tu compra:**
1. Desde la **Tienda** (`/tienda`), agrega los productos al carrito.
2. Haz clic en el carrito 🛒 y luego en **"Proceder al Pago"**.
3. Revisa el resumen de tu pedido (productos, cantidades, subtotal).
4. Selecciona el método de pago:
   - **Pago en clínica** al recoger
   - **Transferencia SPEI**
   - **MercadoPago** (tarjeta de crédito/débito)
5. Confirma los datos y haz clic en **"Confirmar Pedido"**.
6. Recibirás un correo con el número de pedido y las instrucciones para recogerlo.

ℹ️ Los medicamentos controlados requieren presentar la receta al momento de recoger el pedido en la clínica.

---

## 8. Portal del Personal Clínico (Veterinario / Recepcionista)

**Acceso requerido:** Cuenta de staff creada por el administrador  
**Ruta base:** ➡️ `/staff/agenda`

ℹ️ El acceso a este módulo se gestiona exclusivamente desde la pestaña **"Personal de Clínica"** en el formulario de login.

---

### 8.1 Agenda del Día

**Ruta:** ➡️ `/staff/agenda`

Vista central del personal clínico con las citas programadas para el día:

- **Vista de agenda** con bloques de tiempo por veterinario.
- **Estado en tiempo real** de cada cita (pendiente, en curso, completada).
- Botón **"Iniciar Consulta"** para abrir el módulo de consulta médica directamente desde la cita.
- Filtro por **veterinario** y **tipo de servicio**.

✅ El sistema bloquea automáticamente los horarios ya ocupados para evitar citas simultáneas.

---

### 8.2 Consulta Médica

**Ruta:** ➡️ `/staff/consultas`

Módulo para registrar el resultado de una consulta médica:

**Campos disponibles:**
- **Motivo de consulta** (texto libre)
- **Exploración física** (peso, temperatura, frecuencia cardíaca, frecuencia respiratoria)
- **Diagnóstico** (texto clínico)
- **Tratamiento indicado** (texto libre)
- **Medicamentos recetados** (selección de catálogo + dosis + frecuencia + duración)
- **Notas adicionales y observaciones**

**Emitir una Receta Médica:**
1. En la sección de medicamentos, agrega los fármacos indicados.
2. Completa la dosis, frecuencia y duración del tratamiento.
3. Haz clic en **"Emitir Receta"**.
4. El sistema generará un PDF con folio único, firma digital y datos del veterinario.
5. El PDF queda disponible para descarga del cliente en su portal.

**Registro de Vacunas:**
- En la misma pantalla de consulta puedes registrar vacunas aplicadas.
- Indica el nombre de la vacuna, lote y fecha de próxima aplicación.

**Registro de Peso:**
- Registra el peso del paciente y se añade automáticamente a la gráfica de evolución.

---

### 8.3 Medicamentos Controlados

**Ruta:** ➡️ `/staff/controlados`

Cola de validación clínica para pedidos de medicamentos que requieren autorización médica:

1. El sistema lista los pedidos pendientes de validación.
2. El veterinario revisa la solicitud del cliente y la receta adjunta (si aplica).
3. Puede **Aprobar** o **Rechazar** el despacho.
4. Al aprobar, el pedido avanza a preparación y el inventario se descuenta del lote FEFO correspondiente.

---

### 8.4 Hospitalización

**Ruta:** ➡️ `/staff/hospitalizacion`

Gestión de pacientes internados en la clínica:

- **Lista de pacientes hospitalizados** con el motivo de internamiento y el veterinario responsable.
- **Registro de evolución diaria:** signos vitales, alimentación, medicación administrada.
- **Alta médica:** marca al paciente como dado de alta y libera la jaula/espacio asignado.

---

### 8.5 Estética y Grooming

**Ruta:** ➡️ `/staff/estetica`

Módulo de check-in para el servicio de estética y grooming canino/felino:

1. Busca al cliente o la mascota por nombre o ID.
2. Registra el servicio solicitado (baño, corte, tratamiento, etc.).
3. Indica observaciones especiales (sensibilidad a productos, comportamiento, etc.).
4. Al finalizar el servicio, marca el check-out y registra el tiempo empleado.

---

### 8.6 Recordatorios y Notificaciones

**Ruta:** ➡️ `/staff/recordatorios`

Panel para gestionar y revisar los recordatorios enviados a clientes:

- **Recordatorios de citas** (enviados automáticamente 24 horas antes).
- **Recordatorios de vacunas** próximas a vencer.
- **Historial de notificaciones** enviadas con estado de entrega.

ℹ️ Los recordatorios se envían automáticamente mediante tareas programadas (cron) en el servidor. El personal puede forzar un envío manual desde esta pantalla.

---

### 8.7 Punto de Venta (POS)

**Ruta:** ➡️ `/staff/pos`

Sistema de cobro en mostrador para ventas directas en la clínica:

**Para realizar una venta:**
1. Busca el producto por nombre o escanea el código de barras (si se tiene lector).
2. Ajusta la **cantidad** deseada.
3. El producto se agrega al ticket activo con precio unitario y subtotal.
4. Selecciona el **método de pago**: efectivo, transferencia o tarjeta.
5. Si es pago en efectivo, ingresa el monto recibido y el sistema calculará el cambio.
6. Haz clic en **"Procesar Venta"** para finalizar.
7. El ticket se puede **imprimir** o **enviar por correo** al cliente.

✅ El inventario se actualiza en tiempo real al procesar cada venta.

---

## 9. Panel de Administración

**Acceso requerido:** Cuenta de administrador  
**Ruta base:** ➡️ `/admin/dashboard`

⚠️ **Este módulo es de acceso exclusivo para el administrador del sistema.** Las acciones realizadas aquí afectan la configuración y los datos de toda la clínica.

---

### 9.1 Dashboard con KPIs

**Ruta:** ➡️ `/admin/dashboard`

Vista ejecutiva con métricas en tiempo real:

| Métrica | Descripción |
| :--- | :--- |
| **Pacientes activos** | Total de mascotas con expediente activo |
| **Citas del mes** | Número de citas agendadas en el mes actual |
| **Ingresos del mes** | Total facturado en el período |
| **Pedidos pendientes** | Pedidos de tienda en espera de preparación |
| **Stock en riesgo** | Productos próximos a agotarse o a caducar |
| **Personal activo** | Número de empleados con acceso activo |

---

### 9.2 Gestión de Personal (Staff)

**Ruta:** ➡️ `/admin/staff`

Administra los usuarios del personal clínico y administrativo:

#### Dar de alta a un nuevo empleado
1. Haz clic en **"+ Agregar Personal"**.
2. Completa los datos: nombre completo, correo institucional, rol (veterinario, recepcionista, administrador) y especialidad.
3. Asigna una **contraseña temporal segura** (el empleado deberá cambiarla en su primer acceso).
4. Haz clic en **Guardar**.

#### Editar datos de un empleado
1. Localiza al empleado en la lista.
2. Haz clic en el ícono de **edición** (lápiz).
3. Modifica los campos necesarios y guarda.

#### Restablecer contraseña
1. Localiza al empleado.
2. Haz clic en **"Restablecer Contraseña"**.
3. Ingresa la nueva contraseña temporal y confirma.

⚠️ Notifica al empleado inmediatamente después del restablecimiento para que no pierda acceso.

---

### 9.3 Inventario y Control FEFO

**Ruta:** ➡️ `/admin/inventario`

Gestión completa del inventario de la farmacia con control de lotes por fecha de caducidad:

- **Lista de productos** con stock total, stock disponible y precio de venta.
- **Gestión de lotes:** cada producto puede tener múltiples lotes con distinta fecha de caducidad.
- **Alertas automáticas** de productos próximos a caducar.
- El sistema aplica la regla **FEFO** (First Expired, First Out) para asegurar que siempre se despacha primero el lote de caducidad más próxima.

#### Registrar un nuevo lote
1. Selecciona el producto en la lista.
2. Haz clic en **"+ Agregar Lote"**.
3. Ingresa: número de lote, fecha de caducidad, cantidad recibida y costo unitario.
4. Guarda el lote.

---

### 9.4 Reportes Financieros

**Ruta:** ➡️ `/admin/reportes`

Reportes de ingresos y desempeño comercial:

| Reporte | Descripción |
| :--- | :--- |
| **Ingresos por período** | Total facturado con desglose por día/semana/mes |
| **Métodos de pago** | Distribución de ventas por forma de pago |
| **Ticket promedio** | Valor promedio por transacción |
| **Productos más vendidos** | Ranking de productos por volumen de venta |
| **Lotes en riesgo** | Inventario próximo a caducar con valor estimado en riesgo |

✅ Los reportes pueden filtrarse por rango de fechas.

---

### 9.5 Explorador de Auditoría

**Ruta:** ➡️ `/admin/auditoria`

Registro forense inmutable de todas las acciones realizadas en el sistema:

- Cada entrada muestra: fecha y hora, usuario, acción realizada, dirección IP de origen.
- Los datos sensibles (contraseñas, tokens, datos financieros) aparecen como `***REDACTED***` por seguridad.
- Permite **filtrar por usuario**, **tipo de acción** y **rango de fechas**.

🔒 Este registro no puede ser modificado ni eliminado desde la interfaz. Su propósito es garantizar la trazabilidad ante cualquier incidente de seguridad.

---

### 9.6 Gestor de Contenidos (CMS)

**Ruta:** ➡️ `/admin/cms`

Permite editar el contenido visible en la plataforma sin necesidad de modificar el código:

| Sección | Descripción |
| :--- | :--- |
| **Secciones de Landing** | Textos e imágenes del hero, servicios y contacto |
| **Blog** | Crear, editar y publicar artículos veterinarios |
| **Testimonios** | Aprobar o rechazar opiniones de clientes |
| **Reseñas de Productos** | Moderar calificaciones y comentarios de la tienda |

#### Publicar un artículo de blog
1. Ve a **CMS > Blog** y haz clic en **"+ Nuevo Artículo"**.
2. Escribe el título, contenido (con formato enriquecido) y agrega una imagen destacada.
3. Asigna **etiquetas** y una categoría.
4. El sistema genera automáticamente el **slug** (URL amigable) a partir del título.
5. Haz clic en **Publicar** para que quede visible en el blog público.

#### Moderar testimonios
1. Ve a **CMS > Testimonios**.
2. Revisa los testimonios pendientes de aprobación.
3. Usa el botón de **visibilidad** para publicar o ocultar cada testimonio.

---

## 10. Seguridad y Privacidad

La plataforma LunaVet implementa los más altos estándares de seguridad para proteger los datos de los pacientes y sus tutores:

| Medida | Descripción |
| :--- | :--- |
| **Cifrado en reposo** | Los datos personales se almacenan cifrados con AES-256-GCM |
| **Transmisión segura** | Toda comunicación usa HTTPS con certificado SSL/TLS |
| **Tokens de sesión** | Los Access Tokens duran 15 minutos y se renuevan automáticamente |
| **Bloqueo por intentos fallidos** | El sistema bloquea el acceso tras múltiples intentos incorrectos |
| **2FA opcional** | Autenticación de dos factores disponible para todos los usuarios |
| **Auditoría inmutable** | Registro forense de todas las acciones con ofuscación de datos sensibles |
| **Cumplimiento LFPDPPP** | Protección de datos bajo la Ley Federal de Protección de Datos Personales |

🔒 **Recomendaciones de seguridad para el usuario:**
- Nunca compartas tu contraseña con nadie, incluido el personal de la clínica.
- Utiliza contraseñas únicas y robustas (mínimo 8 caracteres con mayúsculas, minúsculas y números).
- Activa la autenticación de dos factores (2FA) especialmente si eres personal clínico.
- Siempre cierra sesión al usar dispositivos compartidos o públicos.
- Si sospechas que tu cuenta fue comprometida, contacta a soporte inmediatamente.

---

## 11. Preguntas Frecuentes (FAQ)

**¿Olvidé mi contraseña. ¿Qué hago?**
> Contacta al equipo de soporte en `soporte@lunavet.lat`. Para el personal clínico, el administrador puede restablecer la contraseña desde el panel de gestión de staff.

**¿Puedo tener más de una mascota registrada?**
> Sí. Puedes registrar todas las mascotas que desees desde la sección `/portal/mascotas`.

**¿El expediente clínico es visible para mí como tutor?**
> Sí. Puedes consultar el historial de consultas, vacunas, peso, alergias y descargar recetas en PDF desde `/portal/expediente/:id`.

**¿Puedo cancelar una cita en línea?**
> Sí, desde `/portal/citas`. Se recomienda cancelar con al menos 2 horas de anticipación.

**¿Cómo sé si mi pago fue procesado correctamente?**
> Recibirás un correo de confirmación con el número de pedido. También puedes revisar el estado en `/portal` en la sección "Últimos Pedidos".

**¿El generador de QR tiene algún costo?**
> No. El generador de placas QR en `/qr` es completamente gratuito para todos los usuarios.

**¿Los medicamentos se envían a domicilio?**
> No. El modelo de compra es Click & Collect: realizas el pedido en línea y lo recoges en la clínica.

**¿Los medicamentos controlados se pueden comprar en línea?**
> Puedes agregarlos al carrito, pero requieren validación médica antes de ser despachados. Un veterinario revisará tu solicitud.

**¿Mis datos están seguros?**
> Sí. La plataforma cumple con la LFPDPPP. Consulta el Aviso de Privacidad en `/aviso-privacidad` para más detalles.

**¿Puedo acceder desde mi celular?**
> Sí. La plataforma es 100% responsiva y funciona en smartphones, tabletas y computadoras.

---

## 12. Soporte Técnico

Para consultas, reportes de fallas o asistencia técnica:

| Canal | Detalle |
| :--- | :--- |
| **Correo electrónico** | `soporte@lunavet.lat` |
| **Teléfono / WhatsApp** | `744 213 0868` (Urgencias 24/7) |
| **Dirección** | El Coloso, Acapulco de Juárez, Guerrero |
| **Portal web** | `https://lunavet.lat` |

**Horarios de atención técnica:**
- Lunes a Viernes: 09:00 – 20:00
- Sábados: 09:00 – 16:00
- Domingos: 10:00 – 15:00

Al contactar soporte, proporciona:
1. Tu nombre completo y correo de la cuenta.
2. Descripción detallada del problema.
3. Capturas de pantalla si es posible.
4. Hora aproximada en que ocurrió el problema.

---

*Documento generado por el equipo técnico de LunaVet — Clínica Veterinaria, Farmacia & Estética.*  
*Versión de la plataforma: 4.2 | Última actualización: Septiembre 2026*
