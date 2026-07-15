# [Nombre del Proyecto] — Backlog

<!-- Este archivo es la memoria viva del proyecto. El Jefe lo lee al iniciar
     cada sesión para recuperar el contexto.

     Propietarios por sección:
     - Estructura del archivo, features (Trabajo Activo / Backlog / Historial): Analista Funcional
     - Decisiones Pendientes: Jefe
     - Deuda Técnica: QA
     - Hipótesis de Experimentación: Growth escribe, Experimentación resuelve

     Este archivo es un meta-archivo de proceso: se commitea DIRECTAMENTE en main con
     safe-commit.sh, sin PR y nunca en una rama de feature (ver "Estrategia de Ramas y PRs"
     en CLAUDE.md) -->

## Contexto del Proyecto

**Qué es:** [Una frase: "Este proyecto es un X que Y para Z"]
**Problema que resuelve:** [2-3 líneas]
**Usuarios objetivo:** [Quiénes son, nivel técnico, geografías]
**Stack:** [Tecnologías principales con versiones]
**Versión actual:** [X.Y.Z — scaffold A.B.C] <!-- proyecto (manifiesto) + scaffold (.claude/scaffold.json); Documentación actualiza la primera al cerrar release, la sincronización actualiza la segunda -->
**Estado:** [En desarrollo / Beta / Producción]
**Entornos:** [dev / staging / prod — URLs si existen]

---

## Trabajo Activo

<!-- Máximo 3 items en curso. Más de 3 indica que algo está bloqueado. -->

| Feature | Agente(s) activo(s) | Estado | Rama |
|---|---|---|---|
| [nombre] | [Frontend / Backend / ...] | [En progreso / Bloqueado / En revisión] | [rama git] |

---

## Backlog

### Alta prioridad
- [ ] [Feature] — [descripción en una línea] — agentes: [lista]

### Media prioridad
- [ ] [Feature] — [descripción en una línea]

### Baja prioridad / Exploración
- [ ] [Feature] — [descripción en una línea]

---

## Decisiones Pendientes

<!-- Preguntas que el usuario debe responder antes de poder continuar.
     El Jefe las registra cuando una decisión del usuario bloquea una feature. -->

- [ ] [Pregunta o decisión] — bloqueante para: [qué feature]

---

## Deuda Técnica

<!-- QA registra aquí los problemas que no bloquean release pero deben resolverse -->

- [ ] [Issue técnico conocido] — impacto: [Alto / Medio / Bajo]

---

## Hipótesis de Experimentación

<!-- Ideas para validar con A/B tests. Growth (o el usuario vía Jefe) las registra;
     Experimentación las revisa al diseñar experimentos y las marca como
     validadas/refutadas al cierre. -->

- [ ] [Hipótesis] — métrica a medir: [qué], palanca: [Growth / UX-UI / Backend]

---

## Historial (últimas 5 features completadas)

| Feature | Versión | Fecha | Notas |
|---|---|---|---|
| [nombre] | [X.Y.Z] | [YYYY-MM-DD] | [aprendizaje clave si lo hay] |
