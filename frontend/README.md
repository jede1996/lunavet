# LunaVet Frontend SPA (React 19 + Vite 6)

Frontend Single Page Application (SPA) para la plataforma médica, operativa y de comercio electrónico de la **Clínica Veterinaria LunaVet**. Diseñado con una interfaz neumórfica moderna, responsiva, accesible y con soporte completo de modo oscuro, alto contraste y tipografía profesional.

> Consulta la documentación global del sistema y arquitectura completa en el archivo raíz:
> [../README.md](../README.md)

---

## Características Principales

1. **Landing Page y Posicionamiento SEO:**
   - Presentación de servicios médicos, urgencias 24/7 y contacto directo en Acapulco (El Coloso).
   - Módulo de Blog veterinario con artículos optimizados para indexación orgánica.
   - Muro de testimonios y reseñas moderadas por el equipo clínico.

2. **Agendamiento Inteligente de Citas:**
   - Reserva de citas médicas, cirugías, vacunas y estética canina/felina.
   - Validación en tiempo real de disponibilidades veterinarias anti-solapamiento.

3. **Farmacia Veterinaria & Tienda (Click & Collect):**
   - Catálogo de productos clasificados con cálculo dinámico de stock por lotes FEFO.
   - Carrito de compras desacoplado con gestión de medicamentos controlados bajo validación médica.

4. **Portal Digital del Tutor (Expediente Clínico):**
   - Ficha médica de cada mascota: carnet de vacunación, curvas de peso, alergias y recetas digitales en PDF firmadas criptográficamente.
   - Gestión de propiedad multi-dueño y transferencia de titularidad.

5. **Generador de Placas y Códigos QR LunaVet:**
   - Creador interactivo de códigos QR para collares de identificación y placas metálicas.
   - Generación de credenciales clínicas y pósters "Escanéame" con exportación instantánea a PNG y PDF vectorial.

6. **Sistema de Temas y UI Neumórfica:**
   - Modo oscuro, modo claro y modo de alto contraste accesible.
   - Diseño neumórfico con sombras suaves, tipografía Inter/Outfit desde Google Fonts.
   - Navbar y footer de ancho completo (`container-fluid`) con micro-animaciones.

---

## Arquitectura y Stack Tecnológico

| Componente | Tecnología / Librería | Propósito |
| :--- | :--- | :--- |
| **Core Framework** | React 19 + Vite 6 | Renderizado reactivo ultrarrápido con Hot Module Replacement (HMR) |
| **Enrutamiento** | React Router 7 (`react-router-dom`) | Navegación protegida por roles (público, cliente, staff, admin) |
| **Diseño y Estilos** | Bootstrap 5.3 + Bootstrap Icons + Custom CSS | Interfaz pulida, adaptable a móviles, tabletas y escritorio |
| **Tipografía** | Inter + Outfit (Google Fonts) | Fuentes profesionales y legibles |
| **Códigos QR** | `qrcode` + Canvas API | Generación dinámica de placas con corrección de errores (ECC) |
| **Documentos PDF** | `jspdf` | Descarga de plantillas de impresión listas para corte |
| **Testing** | Vitest + Testing Library | Pruebas de integración de rutas, contexto y utilitarios |
| **Linter** | ESLint + Oxlint | Análisis estático de código |

### Contextos Globales

| Contexto | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| `AuthContext` | `contexts/AuthContext.jsx` | Sesión JWT, login/logout, 2FA TOTP, localStorage |
| `CartContext` | `contexts/CartContext.jsx` | Carrito de compras desacoplado |
| `ThemeContext` | `contexts/ThemeContext.jsx` | Modo oscuro, claro y alto contraste |
| `BrandContext` | `contexts/BrandContext.jsx` | Nombre, logo y configuración de marca editable |

---

## Scripts de Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173 por defecto)
npm run dev

# Ejecutar suite de pruebas unitarias y de integración (Vitest)
npm test

# Compilar para producción (empaquetado optimizado en dist/)
npm run build

# Previsualizar el bundle compilado de producción
npm run preview

# Ejecutar análisis de linting estático
npm run lint
```

---

## Autenticación y Acceso

El formulario de login se encuentra en `/login` y ofrece dos modos de portal:

| Pestaña | Endpoint Backend | Roles |
| :--- | :--- | :--- |
| **Soy Cliente** | `POST /api/auth/login` | `cliente` |
| **Personal de Clínica** | `POST /api/auth/staff/login` | `administrador`, `veterinario`, `recepcionista` |

> [!IMPORTANT]
> Desde la **v4.2** el formulario de login **no incluye botones de acceso rápido para demostración**. Las credenciales se ingresan manualmente.

### Flujo de Sesión
- **Login exitoso:** Guarda `lunavet_access_token`, `lunavet_refresh_token` y `lunavet_user` en `localStorage` y redirige según rol.
- **Logout:** Invalida el Refresh Token en backend, limpia los 3 keys de `localStorage` y redirige a `/`.
- **2FA TOTP:** Si el usuario tiene 2FA activado, se solicita el código de 6 dígitos antes de emitir la sesión.
- **Token expirado:** El cliente API (`api.client.js`) renueva automáticamente el Access Token usando el Refresh Token.

---

## Seguridad en Frontend

- **Reverse Tabnabbing Mitigado:** Todos los enlaces externos con `target="_blank"` implementan obligatoriamente `rel="noopener noreferrer"`.
- **Sanitización en Impresión:** Los valores dinámicos inyectados en ventanas hijas de impresión (generador de QR) son validados y filtrados para evitar inyección de scripts.
- **Tokens Seguros en Almacenamiento:** Manejo de Access Tokens efímeros con renovación transparente vía Refresh Tokens en endpoints backend protegidos con SameSite y limitación de tasa.
- **CSP Compliant:** La aplicación es 100% compatible con las cabeceras estrictas de `Content-Security-Policy` emitidas por el backend.
- **Rutas Protegidas por Rol:** `PrivateRoute`, `AdminRoute` y `StaffRoute` impiden el acceso a vistas restringidas sin autenticación válida.

---

## Métricas de Pruebas Automatizadas (v4.2)

```bash
✓ src/tests/imageOptimizer.test.js   (7 tests)
✓ src/tests/ThemeContext.test.jsx    (4 tests)
✓ src/tests/routes.test.jsx          (16 tests)

Test Files  3 passed (3)
Tests       27 passed (27)
```

- **100% de pruebas aprobadas sin errores ni regresiones.**
- Suite de rutas actualizada con cobertura de todos los portales (público, cliente, staff, admin).
