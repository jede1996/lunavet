# LunaVet Backend Core API (v4.2 - Production Ready)

> Consulta la documentación completa del sistema, arquitectura global, frontend, guía de despliegue en cPanel y matriz de endpoints en el archivo raíz:
> [../README.md](../README.md)
>
> Y el informe detallado de auditoría de seguridad y pentesting en:
> [../walkthrough.md](../walkthrough.md)

---

## Resumen Rápido para Desarrolladores

### Scripts de Ejecución
```bash
# Desarrollo con watch mode
npm run dev

# Ejecutar suite de pruebas completa (277 tests, 29 suites - 100% aprobadas)
npm test

# Ejecutar exclusivamente la suite de Pentesting y Hardening OWASP (14 tests)
npm test -- pentesting.security.test.js

# Ejecutar pruebas con reporte de cobertura (Stmts >92%, Branch >80%)
npm run test:coverage

# Análisis estático y linter (0 errores, 0 advertencias)
npm run lint

# Inicializar esquema de base de datos (DDL)
npm run db:init

# Sembrar superadministrador y datos iniciales
npm run db:seed
```

### Credenciales de Prueba por Rol

| Rol | Endpoint de Login | Email | Contraseña |
| :--- | :--- | :--- | :--- |
| **Administrador** | `POST /api/auth/staff/login` | `admin@lunavet.lat` | `AdminLunaVet2026!` |
| **Veterinario** | `POST /api/auth/staff/login` | `veterinario@lunavet.lat` | `VetLunaVet2026!` |
| **Cliente** | `POST /api/auth/login` | `cliente@lunavet.lat` | `TestClient#2026` |

> [!NOTE]
> El frontend **no expone botones de acceso rápido** desde la versión v4.2. Las credenciales se ingresan manualmente en el formulario de login (`/login`).

### Métricas de Calidad y Blindaje Defensivo (v4.2)
- **Test Suites:** 29 pasadas de 29 (incluye suite de Pentesting automatizado)
- **Tests Totales:** 277 pruebas pasadas de 277 (0 regresiones)
- **Cobertura de Branches:** > 80%
- **Cobertura de Statements:** > 92%
- **ESLint:** 0 errores, 0 advertencias
- **Protecciones Activas:**
  - Rate Limiting por ventana deslizante en memoria (`globalLimiter`, `authLimiter`).
  - Validación de firma en webhooks de pago con `crypto.timingSafeEqual`.
  - Comparación en tiempo constante para token de tareas programadas (`safeTimingCompare`).
  - Redacción automática de PII (`***REDACTED***`) en bitácoras de auditoría (`bitacora_auditoria`).
  - Sanitización de HTML contra Stored XSS en testimonios y reseñas.
  - Mitigación de Prototype Pollution y cabeceras estrictas CSP, HSTS y Anti-Clickjacking.
  - 2FA TOTP RFC 6238 nativo para personal de clínica.
  - Validación binaria de Magic Numbers para archivos BLOB (JPEG, PNG, WebP, PDF).
