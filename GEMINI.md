# Luna-Vet Acapulco — Multi-Agent Engineering Architecture & SDLC Pipeline
> Directrices maestras para agentes de IA (Gemini, Claude, Cursor) en el proyecto Luna-Vet.

---

## ⚡ 1. REGLAS ESTRICTAS DE ESTILO Y SALIDA

Todo agente operando en este repositorio debe respetar de forma mandatoria la siguiente matriz de estilo:

| Canal / Superficie | Modo Asignado | Directiva Operativa |
| :--- | :--- | :--- |
| **Terminal / CLI / Logs de Agente** | `caveman` | Respuestas telegráficas, directas, sin cortesías, código directo, máximo ahorro de tokens y velocidad. Sin preámbulos ni despedidas. |
| **UI / Frontend / Microcopy** | `humanizer` | Tono natural, empático, sin clichés de IA, microcopy pulido, botones de acción directa y mensajes de error humanos. |
| **Manuales de Usuario Final** | `humanizer` + `user-guide-creator` | Lenguaje centrado en resolver la tarea del usuario, cero jerga de desarrollador, callouts claros (`[!NOTE]`, `[!IMPORTANT]`, `[!WARNING]`). |
| **Manuales Técnicos & Arquitectura** | `technical-writer` + `diataxis-framework` | Estándar formal Diátaxis en 4 cuadrantes: Tutoriales, Guías How-To, Referencia de APIs y Explicaciones de arquitectura con diagramas Mermaid. |

---

## 🧭 2. Índice Canónico de Skills por Fase (`.skills/`)

### Fase 1: Setup & Discovery
1. [claude-code-setup](file:///.skills/phase-1-setup/claude-code-setup/SKILL.md) — Configuración del entorno de desarrollo y validación de toolchains.
2. [find-skills](file:///.skills/phase-1-setup/find-skills/SKILL.md) — Detección y activación dinámica de las reglas pertinentes a cada tarea.
3. [omniroute](file:///.skills/phase-1-setup/omniroute/SKILL.md) — Ruteo inteligente de modelos LLM y optimización de ventana de contexto.

### Fase 2: Architecture, Contracts & Planning
4. [napkin](file:///.skills/phase-2-architecture/napkin/SKILL.md) — Esquemas visuales de arquitectura, diagramas de flujo y modelos conceptuales.
5. [llm-council](file:///.skills/phase-2-architecture/llm-council/SKILL.md) — Síntesis de compensaciones técnicas (*tradeoffs*) y consenso multi-modelo.
6. [grill-with-docs](file:///.skills/phase-2-architecture/grill-with-docs/SKILL.md) — Verificación de APIs contra documentación oficial para erradicar alucinaciones.
7. [api-contract](file:///.skills/phase-2-architecture/api-contract/SKILL.md) — Especificación OpenAPI 3.1, contratos Zod y validación de schemas cliente-servidor.
8. [prompt-master](file:///.skills/phase-2-architecture/prompt-master/SKILL.md) — Calibración y diseño de meta-instrucciones para subagentes especializados.

### Fase 3: Core Engineering & Persistence
9. [tdd](file:///.skills/phase-3-core-engineering/tdd/SKILL.md) — Ciclo estricto Red-Green-Refactor en Vitest, Jest y Supertest.
10. [db-optimizer](file:///.skills/phase-3-core-engineering/db-optimizer/SKILL.md) — Optimización SQL/PostgreSQL, prevención de consultas N+1 y cumplimiento SENASICA.
11. [loop-engineering](file:///.skills/phase-3-core-engineering/loop-engineering/SKILL.md) — Ciclo de autoevaluación iterativo paso a paso de criterios de aceptación.

### Fase 4: UI/UX Craft, Copy & Frontend Performance
12. [ui-ux-pro-max](file:///.skills/phase-4-ui-ux/ui-ux-pro-max/SKILL.md) — Inteligencia de diseño visual, jerarquía tipográfica y sistemas de color.
13. [apple-design-skill](file:///.skills/phase-4-ui-ux/apple-design-skill/SKILL.md) — Estándares Apple Human Interface Guidelines (HIG) y Liquid Glass.
14. [taste-skill](file:///.skills/phase-4-ui-ux/taste-skill/SKILL.md) — Criterio estético curado y eliminación de componentes genéricos de IA.
15. [impeccable](file:///.skills/phase-4-ui-ux/impeccable/SKILL.md) — Pulido de CSS, alineaciones submétricas y accesibilidad WCAG AA.
16. [emilkowalski-skills](file:///.skills/phase-4-ui-ux/emilkowalski-skills/SKILL.md) — Micro-interacciones, física de resortes y transiciones fluidas.
17. [web-vitals](file:///.skills/phase-4-ui-ux/web-vitals/SKILL.md) — Optimización de Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms).
18. [humanizer (UI)](file:///.skills/phase-4-ui-ux/humanizer/SKILL.md) — Motor exclusivo para todo copy y microcopy de interfaz de usuario.

### Fase 5: Testing E2E, Observability & Security
19. [playwright-e2e](file:///.skills/phase-5-testing-security/playwright-e2e/SKILL.md) — Pruebas funcionales y de flujo de usuario completo en navegadores reales.
20. [diagnose](file:///.skills/phase-5-testing-security/diagnose/SKILL.md) — Diagnóstico determinista de causa raíz mediante trazas y registros de ejecución.
21. [dependency-hygiene](file:///.skills/phase-5-testing-security/dependency-hygiene/SKILL.md) — Auditoría de dependencias, eliminación de paquetes huérfanos y parches de seguridad.
22. [security-audit](file:///.skills/phase-5-testing-security/security-audit/SKILL.md) — Análisis estático contra OWASP Top 10, sanitización y protección JWT.
23. [sentry-telemetry](file:///.skills/phase-5-testing-security/sentry-telemetry/SKILL.md) — Monitoreo de excepciones en tiempo real, Error Boundaries y purga de PII.

### Fase 6: Documentation, Delivery & Terminal Output
24. [technical-writer](file:///.skills/phase-6-delivery/technical-writer/SKILL.md) — Documentación técnica formal de arquitectura y contratos.
25. [diataxis-framework](file:///.skills/phase-6-delivery/diataxis-framework/SKILL.md) — Arquitectura de información estructurada en 4 cuadrantes.
26. [user-guide-creator](file:///.skills/phase-6-delivery/user-guide-creator/SKILL.md) — Manuales de usuario final orientados a roles sin tecnicismos.
27. [git-workflow](file:///.skills/phase-6-delivery/git-workflow/SKILL.md) — Commits atómicos bajo estándar Conventional Commits (`feat:`, `fix:`, `refactor:`).
28. [token-optimizer](file:///.skills/phase-6-delivery/token-optimizer/SKILL.md) — Compactación y gestión eficiente de la memoria de contexto del agente.
29. [caveman](file:///.skills/phase-6-delivery/caveman/SKILL.md) — Modo ultra-compacto exclusivo para salidas de terminal y CLI.

---

## 🏛️ 3. Directivas Estrictas de Ingeniería

### A. Directivas de Diseño y Frontend
- **Apple HIG como Sistema por Defecto**: Las interfaces deben aplicar las directrices de diseño de Apple: bordes sutiles (`border: 1px solid var(--apple-border)`), esquinas redondeadas generosas (`border-radius: 16px` o `20px`), fondos con desenfoque de cristal (`backdrop-filter: blur(20px)`), tipografía moderna (San Francisco / Plus Jakarta Sans / Inter).
- **Soporte Multi-Tema Obligatorio**: Todo componente nuevo debe utilizar variables CSS temáticas (`var(--apple-...)`, `var(--bg-card)`, etc.) para conmutar sin rupturas entre Apple Claro, Apple Oscuro, Neumórfico y Alto Contraste Clínico.
- **Sin Renders en Cascada (`react(set-state-in-effect)`)**: Las cargas iniciales de datos deben implementar guardas de cancelación (`active = false`) o derivarse síncronamente durante el render.
- **Rendimiento**: Todo nuevo componente que pese más de 20KB debe cargarse mediante `React.lazy()` en [App.jsx](file:///frontend/src/App.jsx).

### B. Directivas de Base de Datos y Persistencia
- **Prevención Estricta de Problemas N+1**: En listados de pacientes, expedientes o ventas, cargar siempre los datos relacionales mediante `JOIN` o batch loading en una sola consulta.
- **Indexación Mandatoria**: Toda clave foránea (`mascota_id`, `usuario_id`, `propietario_id`) y campo de consulta frecuente (`folio`, `estado`, `fecha_creacion`) debe contar con índice explícito en la base de datos.
- **Trazabilidad SENASICA**: Toda mutación sobre medicamentos controlados, recetas veterinarias o anestésicos debe registrarse dentro de una transacción ACID (`BEGIN...COMMIT`) auditada con cédula profesional del médico firmante.

### C. Directivas de Seguridad y Autenticación
- **Unificación de Tokens**: Los clientes deben persistir tanto `lunavet_access_token` como `lunavet_token` usando la utilidad [authStorage.js](file:///frontend/src/utils/authStorage.js).
- **Cero Secretos en Código**: Claves privadas, variables de conexión a base de datos y credenciales de AWS/Cloudflare jamás deben incluirse en archivos versionados. Usar estrictamente variables de entorno (`.env`).
- **Autenticación en Dos Factores (2FA)**: Las acciones administrativas y médicas que involucren cambios de rol, anulación de pagos o descarte de inventario deben requerir validación de sesión activa o TOTP.

---

## 🔄 4. Protocolo de Ejecución del Pipeline (6 Fases)

Cuando se asigne una tarea de ingeniería a un agente de IA:
1. **Fase 1 (Setup & Ruteo)**: Ejecutar `find-skills` para activar las reglas aplicables y `omniroute` para determinar la estrategia de contexto.
2. **Fase 2 (Arquitectura & Contratos)**: Elaborar el esquema con `napkin`, validar tradeoffs con `llm-council`, auditar la documentación con `grill-with-docs`, y definir contratos con `api-contract`. **Presentar este plan antes de modificar código.**
3. **Fase 3 (Core Engineering & TDD)**: Escribir primero las pruebas unitarias que fallen (`tdd`), auditar modelos de persistencia con `db-optimizer`, y aplicar el bucle `loop-engineering`.
4. **Fase 4 (UI/UX & Copy)**: Ajustar estilos con `apple-design-skill`, `taste-skill` e `impeccable`, micro-interacciones con `emilkowalski-skills`, microcopy con `humanizer` y validar `web-vitals`.
5. **Fase 5 (Testing E2E & Seguridad)**: Validar flujos de usuario con `playwright-e2e`, aislar anomalías con `diagnose`, asegurar dependencias con `dependency-hygiene` y escanear vulnerabilidades con `security-audit`.
6. **Fase 6 (Documentación & Entrega)**: Documentar técnicamente con `technical-writer` + `diataxis-framework`, manuales de usuario con `user-guide-creator` + `humanizer`, commits bajo `git-workflow` y respuestas de terminal en `caveman`.
