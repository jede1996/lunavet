# CLAUDE.md — Directrices de Desarrollo & Suite de Skills para Claude Code
> Configuración oficial de comandos rápidos, triggers y directivas de estilo para Claude Code en Luna-Vet Acapulco.

---

## ⚡ 1. REGLAS ESTRICTAS DE ESTILO Y SALIDA
- **En Terminal / CLI / Respuestas de Agente:** Modo `caveman` obligatorio. Respuestas telegráficas, directas, sin cortesías ni fórmulas introductorias, código directo, máximo ahorro de tokens.
- **En UI / Frontend / Copy:** Modo `humanizer` obligatorio. Microcopy empático, natural, sin clichés de IA.
- **En Documentación de Usuario:** `user-guide-creator` + `humanizer`. Enfocado en tareas, sin tecnicismos, con callouts claros.
- **En Documentación Técnica:** `technical-writer` + `diataxis-framework`. 4 cuadrantes (Tutoriales, How-To, Referencia, Explicación con diagramas Mermaid).

---

## 🚀 2. Comandos Rápidos y Triggers por Fase

| Fase | Comando / Trigger | Skill Asociada | Ruta Canónica | Propósito Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Fase 1** | `/setup` | `claude-code-setup` | `.skills/phase-1-setup/claude-code-setup` | Validación de toolchains y entorno local. |
| **Fase 1** | `/find` | `find-skills` | `.skills/phase-1-setup/find-skills` | Descubrimiento y carga dinámica de skills. |
| **Fase 1** | `/route` | `omniroute` | `.skills/phase-1-setup/omniroute` | Ruteo de modelos y presupuesto de tokens. |
| **Fase 2** | `/napkin` | `napkin` | `.skills/phase-2-architecture/napkin` | Diagramas y esquemas visuales de arquitectura. |
| **Fase 2** | `/council` | `llm-council` | `.skills/phase-2-architecture/llm-council` | Síntesis de compensaciones y consenso técnico. |
| **Fase 2** | `/grill` | `grill-with-docs` | `.skills/phase-2-architecture/grill-with-docs` | Confrontación con documentación oficial de librerías. |
| **Fase 2** | `/api-contract` | `api-contract` | `.skills/phase-2-architecture/api-contract` | Esquemas Zod y especificación OpenAPI 3.1. |
| **Fase 2** | `/prompt-master` | `prompt-master` | `.skills/phase-2-architecture/prompt-master` | Optimización de prompts para subagentes. |
| **Fase 3** | `/tdd` | `tdd` | `.skills/phase-3-core-engineering/tdd` | Ciclo Red-Green-Refactor en Vitest/Jest. |
| **Fase 3** | `/db-opt` | `db-optimizer` | `.skills/phase-3-core-engineering/db-optimizer` | Índices, eliminación de N+1 y control SENASICA. |
| **Fase 3** | `/loop` | `loop-engineering` | `.skills/phase-3-core-engineering/loop-engineering` | Bucle de verificación de criterios de aceptación. |
| **Fase 4** | `/ui-ux` | `ui-ux-pro-max` | `.skills/phase-4-ui-ux/ui-ux-pro-max` | Paletas de color, tipografía y jerarquía visual. |
| **Fase 4** | `/apple-design` | `apple-design-skill` | `.skills/phase-4-ui-ux/apple-design-skill` | Apple HIG, Liquid Glass y accesibilidad. |
| **Fase 4** | `/taste` | `taste-skill` | `.skills/phase-4-ui-ux/taste-skill` | Estética cuidada, sin plantillas genéricas. |
| **Fase 4** | `/impeccable` | `impeccable` | `.skills/phase-4-ui-ux/impeccable` | Pulido de CSS, alineación y WCAG AA. |
| **Fase 4** | `/animations` | `emilkowalski-skills` | `.skills/phase-4-ui-ux/emilkowalski-skills` | Micro-interacciones y física de resortes. |
| **Fase 4** | `/web-vitals` | `web-vitals` | `.skills/phase-4-ui-ux/web-vitals` | Auditoría Core Web Vitals (LCP, CLS, INP). |
| **Fase 4** | `/copy` | `humanizer` | `.skills/phase-4-ui-ux/humanizer` | Redacción de microcopy y textos de interfaz. |
| **Fase 5** | `/e2e` | `playwright-e2e` | `.skills/phase-5-testing-security/playwright-e2e` | Pruebas funcionales automatizadas en navegador. |
| **Fase 5** | `/diagnose` | `diagnose` | `.skills/phase-5-testing-security/diagnose` | Aislamiento de causa raíz con trazas reales. |
| **Fase 5** | `/dep-check` | `dependency-hygiene` | `.skills/phase-5-testing-security/dependency-hygiene` | Auditoría y limpieza de dependencias npm. |
| **Fase 5** | `/audit` | `security-audit` | `.skills/phase-5-testing-security/security-audit` | Escaneo estático OWASP y validación de tokens. |
| **Fase 5** | `/sentry` | `sentry-telemetry` | `.skills/phase-5-testing-security/sentry-telemetry` | Error Boundaries y monitoreo sin fuga de PII. |
| **Fase 6** | `/docs-tech` | `technical-writer` | `.skills/phase-6-delivery/technical-writer` | Documentación técnica bajo estándar Diátaxis. |
| **Fase 6** | `/docs-user` | `user-guide-creator` | `.skills/phase-6-delivery/user-guide-creator` | Manuales de usuario final orientados a tareas. |
| **Fase 6** | `/git-commit` | `git-workflow` | `.skills/phase-6-delivery/git-workflow` | Conventional Commits estructurados. |
| **Fase 6** | `/token-opt` | `token-optimizer` | `.skills/phase-6-delivery/token-optimizer` | Poda y optimización de contexto de sesión. |
| **Fase 6** | `/caveman` | `caveman` | `.skills/phase-6-delivery/caveman` | Conmutar a modo telegráfico de ultra-ahorro. |

---

## 🛠️ 3. Comandos de Desarrollo del Proyecto

### Frontend (`frontend/`)
```powershell
npm run dev           # Servidor local de desarrollo
npm test -- --run     # Suite de pruebas unitarias y de rutas (Vitest)
npx oxlint src        # Linter ultrarrápido (0 warnings esperado)
npm run build         # Compilación de producción optimizada
```

### Backend (`backend/`)
```powershell
npm run dev           # Servidor API REST
npm test              # Pruebas automatizadas backend
```
