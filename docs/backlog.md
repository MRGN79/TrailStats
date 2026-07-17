# TrailStats — Backlog

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

**Qué es:** TrailStats es una app web 100% cliente que analiza el export histórico deportivo del usuario (Strava, Garmin, Apple Health, Polar, FIT) y muestra estadísticas agregadas.
**Problema que resuelve:** Da a un deportista una foto global de su volumen y progresión histórica sin depender de la API de ninguna plataforma ni subir sus datos a ningún servidor.
**Usuarios objetivo:** Deportistas (running, ciclismo, multideporte) con un export de su plataforma; nivel técnico variado; interfaz bilingüe EN/ES.
**Stack:** React 18.3 + TypeScript 5.4 + Vite 5.3; zip.js, PapaParse, fit-file-parser, DOMParser; Recharts 2.12; react-i18next/i18next; Vitest. Sin backend (procesamiento en Web Worker + IndexedDB).
**Versión actual:** 0.12.0 — scaffold 1.16.0
**Estado:** En desarrollo
**Entornos:** dev (local) — sitio estático desplegable a cualquier hosting de estáticos

---

## Trabajo Activo

<!-- Máximo 3 items en curso. Más de 3 indica que algo está bloqueado. -->

| Feature | Agente(s) activo(s) | Estado | Rama |
|---|---|---|---|
| Rediseño "Summit — Fase 1" (revelación coreografiada, count-up, ember en records, hero mejorado, heatmap en cascada, equivalencias humanas) | Completada (todos los agentes del flujo) | Gates 6/6 ✅ (QA, Accesibilidad, Resp. Social, Seguridad, Documentación, Abogado). Rama basada en `main`, diff solo-Summit. Pendiente OK del usuario para PR/merge/deploy | `feat/summit-ui-phase1` |

---

## Backlog

### Alta prioridad
- [ ] _(sin items registrados)_

### Media prioridad
- [ ] _(sin items registrados)_

### Baja prioridad / Exploración
- [ ] _(sin items registrados)_

---

## Próximas Iteraciones

<!-- Iteraciones ya previstas y acordadas con el dueño, con dependencia explícita
     con el trabajo activo. -->

- [ ] **Summit — Fase 2** — Pieza histórica "año en cifras" + rediseño de la tarjeta compartible (`SummaryCardModal`). La preferencia de **equivalencias humanas** se aplica aquí a la narrativa "año en cifras" (p.ej. "este año subiste 2,3 veces el Everest"), además de las equivalencias de totales ya cubiertas en Fase 1. Depende de: cierre de Summit Fase 1.
- [ ] **Dirección C** — Evolución visual prevista **tras recoger feedback de la Fase 1 (Dirección B / "Summit")**. No es un rediseño desde cero: parte del aprendizaje de la B. ⚠️ **Restricción para el Arquitecto y UX-UI en Fase 1:** las decisiones de arquitectura de datos y de charts que se tomen en Fase 1 **no deben cerrar puertas a la Dirección C** (mantener la capa de animación/presentación desacoplada del cálculo y del modelo de datos, evitar acoplar Recharts de forma que un cambio de dirección visual obligue a reescribir la lógica).

---

## Decisiones Pendientes

<!-- Preguntas que el usuario debe responder antes de poder continuar.
     El Jefe las registra cuando una decisión del usuario bloquea una feature. -->

- [ ] _(sin decisiones pendientes registradas)_

---

## Deuda Técnica

<!-- QA registra aquí los problemas que no bloquean release pero deben resolverse -->

Identificada durante los gates de Summit Fase 1 (todos impacto bajo, ninguno bloquea el release):

- [ ] **[Accesibilidad → Maquetador]** El acento ambiental del hero (`.hero__glow` / `.hero__ridge`) anima en bucle infinito de forma incondicional para usuarios sin `prefers-reduced-motion` (WCAG 2.2.2 Pause/Stop/Hide). Amplitud sub-perceptual (2-4px) y se detiene bajo reduced-motion, por eso no bloqueó. Gatear ambas bajo `.is-revealing` como el resto de piezas, o documentar que la amplitud es imperceptible por diseño. (Corroborado también por Responsabilidad Social.)
- [ ] **[Seguridad → Arquitecto]** `npm audit` reporta 5 vulnerabilidades confinadas al toolchain de dev (vite/vitest/esbuild/jsdom vía form-data) — no llegan al bundle de producción. Su corrección implica bumps mayores con posibles breaking changes: valorar actualización coordinada del toolchain.
- [ ] **[QA] Scroll-reveal a clase CSS** — `useScrollReveal` aplica estilos inline vía JS en vez de una clase CSS dedicada del Maquetador; mover al patrón de clases para alinear con el contrato Maquetador→Frontend.
- [ ] **[QA] Snap del count-up en recálculo a mitad de conteo** — si el usuario cambia el filtro durante los ~1,3s de la coreografía inicial, hay un transitorio breve donde el overlay va hacia el valor previo mientras la equivalencia ya refleja el nuevo (se autocorrige al asentar; el valor final siempre es correcto). Hacer "snap" al valor nuevo cortaría ese transitorio.
- [ ] **[QA] Unificar secciones bajo pliegue al patrón de beats** — BestEfforts / RacePredictor / Eddington usan scroll-reveal inmediato en vez del patrón de beats coreografiados; unificar para coherencia.
- [ ] **[QA] Smoke test opcional del hero** — añadir un smoke test para el acento ambiental del hero.

---

## Hipótesis de Experimentación

<!-- Ideas para validar con A/B tests. Growth (o el usuario vía Jefe) las registra;
     Experimentación las revisa al diseñar experimentos y las marca como
     validadas/refutadas al cierre. -->

- [ ] _(sin hipótesis registradas)_

---

## Historial (últimas 5 features completadas)

| Feature | Versión | Fecha | Notas |
|---|---|---|---|
| _(sin releases registrados en el backlog todavía)_ | | | |
