# Scaffold Changelog

## [1.4.0] — 2026-06-05

Flujo de hotfix, path de rollback de experimento y correcciones de coordinación en múltiples agentes.

### Flujos añadidos en CLAUDE.md
- **Hotfix (producción rota, urgencia inmediata):** nuevo workflow con gates reducidos pre-deploy (solo Tester, Seguridad si aplica, Abogado) y gates post-deploy en el siguiente ciclo normal (QA, Accesibilidad, Responsabilidad Social, Documentación)
- **Rollback de experimento:** path explícito en el flujo Experimento — DevOps revierte flag al 0%, Frontend/Backend limpian código de variantes, Tester ejecuta tests de regresión para verificar estabilidad

### Actualizaciones en CLAUDE.md
- Nomenclatura de ramas: `hotfix/` añadido como tipo de rama permitido
- Diagrama de jerarquía: Growth reposicionado antes de Analista Funcional (refleja su invocación al inicio del proyecto)

### Actualizaciones en agentes
- **jefe.md**: sección explícita de orquestación de hotfix (gates pre/post-deploy diferenciados)
- **devops.md**: checklist pre-deploy diferenciado entre release normal y hotfix; versión SemVer en hotfix clarificada
- **documentacion.md**: comportamiento en hotfix — solo changelog mínimo pre-deploy, resto post-deploy
- **abogado.md**: revisión acotada en hotfix, con escalado si hay riesgo mayor
- **experimentacion.md**: Tester mencionado en el path de rollback; responsabilidad de limpieza de código clarificada (DevOps gestiona flag, Frontend/Backend limpian código)
- **accesibilidad.md**: nota explícita — en hotfix actúa post-deploy
- **responsabilidad-social.md**: nota explícita — en hotfix actúa post-deploy
- **tester.md**: tests de feature flags ampliados — cubre ciclo activo y re-ejecución post-limpieza
- **analista-funcional.md**: paso de coordinación con Growth antes de marcar specs como listas
- **seguridad.md**: nota sobre controles de servidor implementados por Backend

### Actualizaciones en infraestructura
- **PR template**: gates anotados con comportamiento en hotfix (`_(en hotfix: se revisa post-deploy)_`)
- **adopt.md**: flujo Hotfix añadido a la lista de flujos de FASE 6; check de git init en FASE 1; versión actualizada a v1.4.0

---

## [1.3.0] — 2026-06-04

Nuevo agente Growth para análisis de potencial comercial y estrategia de monetización.

### Agentes añadidos
- **Growth** — opera en dos modos: (1) consultor externo al inicio del proyecto, analiza el potencial de monetización con datos de mercado reales y emite un dictamen 🟢/🟡/🟠/🔴; (2) estratega activo si el usuario decide explorar la vía comercial — define North Star metric, modelo de monetización, funnel, brief de conversión para UX-UI y backlog de hipótesis para Experimentación. Incluye guardianes éticos (coordina con Responsabilidad Social y Abogado).

### Flujos añadidos en CLAUDE.md
- **Análisis de potencial comercial (Growth):** nuevo workflow que cubre el modo consultor, el dictamen y la transición opcional a modo estratega

### Actualizaciones en CLAUDE.md
- Tabla de agentes: Growth añadido entre Experimentación y Backend
- Diagrama de jerarquía: Growth como rama consultor/estratega

### Actualizaciones en jefe.md
- Flujo de gestión: Jefe invoca Growth (modo consultor) al inicio de proyectos con interfaz de usuario o audiencia externa, antes de Analista Funcional
- Template de scaffold: lista de agentes actualizada con Growth y Experimentación

---

## [1.2.0] — 2026-06-04

Nuevo agente Experimentación para A/B tests, feature flags y análisis estadístico.

### Agentes añadidos
- **Experimentación** — diseño de experimentos (A/B, MVT, holdout), cálculo de tamaño de muestra, análisis estadístico, gestión del ciclo de vida de feature flags y decisión de ship/rollback. Coordina con UX-UI para variantes, Frontend/Backend para implementación y DevOps para flags. Incluye guardianes éticos (coordina con Responsabilidad Social y Abogado antes de lanzar si aplica).

### Flujos añadidos en CLAUDE.md
- **Experimento (A/B test o validación de hipótesis):** nuevo workflow estándar que cubre desde el diseño del plan hasta la limpieza de flags tras la decisión

### Actualizaciones en CLAUDE.md
- Tabla de agentes: Experimentación añadido entre Frontend y Backend
- Diagrama de jerarquía: Experimentación como rama opcional sobre features en producción
- Sección "Inicialización de Proyecto": añadida subsección de adopción para proyectos existentes

### Herramientas añadidas
- **`.claude/adopt.md`** — prompt autocontenido para adoptar el scaffold en un proyecto existente que no nació del scaffold. Inventaria el stack, copia agentes y scripts, crea o fusiona CLAUDE.md preservando convenciones existentes, y pide confirmación antes del commit.

---

## [1.1.0] — 2026-06-03

Split del agente Desarrollador en tres agentes especializados + corrección de inconsistencias internas.

### Agentes añadidos
- **Maquetador** — capa visual: HTML semántico, CSS, sistema de diseño, identidad visual, micro-interacciones. Itera con UX-UI hasta aprobación visual antes de entregar al Frontend
- **Frontend** — lógica cliente: componentes con comportamiento, estado, integración con APIs, routing, i18n. Agente de desarrollo por defecto en proyectos sin backend
- **Backend** — servidor: APIs REST/GraphQL, base de datos, autenticación, caché, colas

### Agentes eliminados
- **Desarrollador** — sustituido por los tres agentes anteriores

### Correcciones
- Flujo Bug Fix: Abogado ahora siempre obligatorio (no condicional); añadidos gates de Seguridad y Documentación
- Jerarquía: referencias al Tester, Maquetador/Frontend/Backend y flujos de trabajo actualizadas en todos los agentes
- jefe.md: lista de agentes en template del scaffold y lista de gates en "Cuándo registrar sugerencia" actualizadas
- tester.md: paso 6 ahora menciona los 5 gates paralelos
- CHANGELOG.md: descripción corregida de "historial interno" a "historial de versiones visible en GitHub"
- maquetador.md: referencia explícita a coordinación con el Experto en Accesibilidad
- responsabilidad-social.md y abogado.md: corrección de "QA y Accesibilidad" → todos los gates paralelos

---

## [1.0.0] — 2025-06-03

Versión inicial completa del scaffold.

### Agentes (13)
Jefe, Analista Funcional, Arquitecto, UX-UI, Desarrollador, Tester, QA,
Accesibilidad, Abogado, Responsabilidad Social, Seguridad, DevOps, Documentación

### Estándares y flujos documentados en CLAUDE.md
- Flujo completo: 5 gates paralelos (QA, Accesibilidad, Resp. Social, Seguridad, Documentación) → Abogado → DevOps deploy
- Internacionalización obligatoria: EN + ES desde el día 1
- Estrategia de ramas y PRs con SemVer
- Política de dependencias
- Archivos privados excluidos de despliegue
- Control de visibilidad de actividad en GitHub (ventana sensible lun-vie 08-19h Madrid)
- Mecanismo de retroalimentación scaffold ↔ proyecto

### Configuración
- `.claude/settings.json`: permisos máximos + hook UserPromptSubmit para pendientes
- `.claude/scripts/safe-commit.sh`: wrapper git commit con control de horario
- `.claude/pending-actions.md`: log de acciones diferidas
- `.claude/scaffold-suggestions.md`: sugerencias proyecto → scaffold
- `.claude/project-init-checklist.md`: checklist día cero
- `.dockerignore` + `.gitignore` configurados

### Templates
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.claude/templates/adr.md`
