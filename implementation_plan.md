# Plan de Pentesting, Auditoría de Seguridad (OWASP Top 10) y Blindaje Integral de Luna-Vet

Auditoría técnica de vulnerabilidades y plan de endurecimiento (hardening) defensivo en backend y frontend conforme a los estándares **OWASP Top 10**, **SANS Top 25** y **CWE/SANS**:

---

## 1. Vulnerabilidades Identificadas en el Pentesting Inicial

> [!CAUTION]
> ### 1. Bypass Crítico de Autenticación en Webhook de Pagos (CWE-306 / CWE-347)
> En `commerce.service.js:763`, la condición `if (firmaWebhook && firmaWebhook !== config.payments.webhookSecret)` solo valida la firma si el atacante la envía. Si se omite `firmaWebhook` (valor `null` o vacío), la verificación se ignora por completo, permitiendo a un atacante enviar transacciones falsificadas y marcar pedidos como acreditados y listos para recolección sin pagar.
> **Mitigación**: Exigir firma obligatoria de webhook y validar en tiempo constante con `crypto.timingSafeEqual`.

> [!WARNING]
> ### 2. Vulnerabilidad de Ataques de Tiempo (Timing Attacks) en Secretos (CWE-208)
> En `cron.middleware.js:11`, `cronKey !== config.cron.secret` utiliza comparación de cadenas estándar. La comparación byte a byte permite a un atacante inferir el secreto midiendo microsegundos de respuesta.
> **Mitigación**: Implementar `safeCompare` utilizando `crypto.timingSafeEqual`.

> [!WARNING]
> ### 3. Ausencia de Rate Limiting a Nivel de Transporte HTTP (CWE-307 / CWE-770)
> La aplicación no cuenta con limitador de tasa de peticiones (Rate Limiter). Un atacante puede ejecutar ataques de fuerza bruta masiva (credential stuffing / spraying) contra `/api/auth/login`, `/api/auth/register`, `/api/auth/change-password` o provocar denegación de servicio (DoS) solicitando generación de PDFs en bucle.
> **Mitigación**: Implementar middleware de Rate Limiting (Token Bucket / Sliding Window) con políticas diferenciadas:
>   - Global: 300 peticiones / 15 min.
>   - Autenticación: 10 intentos / 15 min por IP.
>   - Operaciones sensibles (pagos, checkout, PDFs): 30 peticiones / 15 min.

> [!WARNING]
> ### 4. Auto-Aprobación Insegura de Testimonios Anónimos (CWE-20 / Content Injection)
> En `cms.service.js:361`, `POST /api/cms/testimonials` es público y asigna `visible_landing: true` de forma automática. Un atacante o bot puede inyectar spam, contenido difamatorio o enlaces de phishing que se publican de inmediato en la página de inicio.
> **Mitigación**: Testimonios anónimos o no validados por staff deben registrarse como `visible_landing: false` (pendientes de moderación).

> [!NOTE]
> ### 5. Exposición Potencial de Datos Sensibles en Bitácora de Auditoría (CWE-532 / LFPDPPP)
> En `audit.service.js`, el objeto `detalles` se serializa sin censurar campos sensibles (`password`, `token`, `secret`, `cvv`, etc.), lo que podría dejar contraseñas o secretos en texto plano en la base de datos de auditoría.
> **Mitigación**: Filtro recursivo de redacción de PII y secretos antes de persistir en `bitacora_auditoria`.

> [!NOTE]
> ### 6. Cabeceras HTTP y Reverse Tabnabbing (CWE-1022)
> - Fortalecer Content Security Policy (CSP), añadir `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`.
> - En el frontend, añadir `rel="noopener noreferrer"` en todos los enlaces con `target="_blank"`.

---

## Proposed Changes

### Backend — Blindaje y Endurecimiento

#### [NEW] [rate-limiter.middleware.js](file:///c:/Users/diego/Desktop/vet/backend/src/middleware/rate-limiter.middleware.js)
- Middleware de limitación de tasa en memoria de alto rendimiento y cero dependencias externas (compatible con cPanel y entornos serverless/contenedores).
- Bloqueo con cabeceras estándar RFC `RateLimit-*` y respuesta HTTP 429 (`TOO_MANY_REQUESTS`).
- 3 perfiles: `globalLimiter`, `authLimiter`, `sensitiveOpLimiter`.

#### [MODIFY] [app.js](file:///c:/Users/diego/Desktop/vet/backend/src/app.js)
- Incorporar `globalLimiter`.
- Reducir el límite de JSON parser a `2mb` (suficiente para payloads normales; uploads usan Multer).
- Sanitización contra Prototype Pollution (`__proto__`, `constructor`, `prototype`).

#### [MODIFY] [security.middleware.js](file:///c:/Users/diego/Desktop/vet/backend/src/middleware/security.middleware.js)
- Reforzar CSP: `frameAncestors: ["'none'"]`, `objectSrc: ["'none'"]`.
- Añadir cabeceras: `Permissions-Policy`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`.
- Sanitización de parámetros duplicados (HTTP Parameter Pollution).

#### [MODIFY] [cron.middleware.js](file:///c:/Users/diego/Desktop/vet/backend/src/middleware/cron.middleware.js)
- Reemplazar comparación `!==` por `crypto.timingSafeEqual`.
- Priorizar lectura por cabecera `X-Cron-Key` y advertir/bloquear uso inseguro en query string.

#### [MODIFY] [commerce.service.js](file:///c:/Users/diego/Desktop/vet/backend/src/modules/commerce/commerce.service.js)
- En `handlePaymentWebhook`: exigir firma obligatoria y validarla en tiempo constante con `crypto.timingSafeEqual`.

#### [MODIFY] [cms.service.js](file:///c:/Users/diego/Desktop/vet/backend/src/modules/cms/cms.service.js)
- En `createTestimonial`: testimonios públicos/anónimos se registran con `visible_landing: false` para requerir aprobación explícita del administrador.

#### [MODIFY] [audit.service.js](file:///c:/Users/diego/Desktop/vet/backend/src/core/audit.service.js)
- Función de enmascaramiento recursivo `redactSensitiveData` para eliminar contraseñas, tokens y datos de tarjetas antes de guardar la auditoría.

#### [MODIFY] [auth.routes.js](file:///c:/Users/diego/Desktop/vet/backend/src/modules/auth/auth.routes.js)
- Aplicar `authLimiter` a `/register`, `/login`, `/staff/login`, `/change-password`.

---

### Frontend — Blindaje de Enlaces y Manejo Seguro de DOM

#### [MODIFY] [QRGenerator.jsx](file:///c:/Users/diego/Desktop/vet/frontend/src/components/qr/QRGenerator.jsx)
- Reemplazar inyección directa en `document.write` con construcción segura de DOM o sanitización estricta para prevenir XSS en la ventana de impresión.

#### [MODIFY] [Footer.jsx](file:///c:/Users/diego/Desktop/vet/frontend/src/components/common/Footer.jsx), [ServicesPage.jsx](file:///c:/Users/diego/Desktop/vet/frontend/src/pages/public/ServicesPage.jsx), [LandingPage.jsx](file:///c:/Users/diego/Desktop/vet/frontend/src/pages/public/LandingPage.jsx)
- Asegurar `rel="noopener noreferrer"` en todos los enlaces externos con `target="_blank"`.

---

### Suite de Pentesting Automatizada

#### [NEW] [pentesting.security.test.js](file:///c:/Users/diego/Desktop/vet/backend/tests/security/pentesting.security.test.js)
Batería de pruebas de seguridad que validará activamente:
1. **Inyección SQL / Caracteres Maliciosos**: Intentos de escape en login, búsqueda de mascotas y catálogo.
2. **Control de Acceso y BOLA / IDOR**:
   - Cliente A intentando ver mascotas de Cliente B.
   - Cliente A intentando ver pedidos de Cliente B.
   - Cliente A intentando cancelar citas ajenas o acceder a rutas de administración.
3. **Bypass de Webhooks de Pago**:
   - Webhook sin firma -> HTTP 403 / 401 Rechazado.
   - Webhook con firma alterada -> Rechazado en tiempo constante.
   - Webhook con firma válida -> Acreditado correctamente.
4. **Fuerza Bruta y Rate Limiting**:
   - Exceder el límite de intentos de login -> HTTP 429 Too Many Requests.
5. **Ataques de Timing en Cron Key**:
   - Clave incorrecta rechazada sin fuga de tiempo.
6. **Upload de Archivos Peligrosos**:
   - Archivo ejecutable (.exe / .sh) camuflado con extensión `.png` -> Rechazado por Magic Bytes.
   - Path Traversal en nombre de archivo (`../../malicioso.png`) -> Sanitizado.
7. **Cabeceras de Seguridad HTTP**:
   - Comprobar presencia de CSP, HSTS, X-Content-Type-Options, X-Frame-Options y ausencia de `x-powered-by`.
8. **Enmascaramiento de Auditoría**:
   - Verificar que passwords o tokens no queden registrados en texto plano en la bitácora.

---

## Verification Plan

### Automated Tests
1. **Ejecutar la suite de pentesting y seguridad**:
   - `npm.cmd test -- tests/security/pentesting.security.test.js` en `backend/`.
2. **Ejecutar la suite completa del backend**:
   - `npm.cmd test` en `backend/` (todas las 26 suites en verde).
3. **Ejecutar la suite del frontend**:
   - `npm.cmd test` en `frontend/` (todas las pruebas en verde).
4. **Validación de Linters**:
   - `npm.cmd run lint` en `backend/` y `frontend/`.
