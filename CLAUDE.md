# Scaffold — Base de Operaciones

## Filosofía

El usuario se centra en funcionalidad y negocio. Claude gestiona todo lo técnico con autonomía alta. El usuario no escribe código ni toma decisiones técnicas salvo cuando se le presenta una elección estratégica con trade-offs claros.

---

<!-- SCAFFOLD:START -->
## El Contrato de este Bloque

Este bloque (entre los marcadores `SCAFFOLD:START` y `SCAFFOLD:END`) define **cómo se trabaja en este proyecto desde el momento de la adopción**. No es documentación de referencia: es normativo y vinculante para cada sesión y cada agente, desde el primer mensaje posterior a la sincronización.

Tres reglas resumen todo lo demás:

1. **Todo trabajo es trabajo de flujo.** Cualquier modificación de archivos del proyecto — una feature, un fix, un typo de una letra — se ejecuta dentro del flujo que le corresponde (ver Flujos de Trabajo Estándar), con su rama, sus gates y el veredicto del Abogado. Solo responder consultas (leer, analizar, explicar) queda fuera.
2. **Los pasos de los flujos no se omiten** porque parezcan menores o porque el usuario no los haya mencionado — ver "Los flujos definidos en este documento no son opcionales" en Reglas de Autonomía.
3. **En materia de proceso, este bloque prevalece.** Si el contenido propio del proyecto (fuera de los marcadores) contradice a este bloque en cómo se trabaja (ramas, commits, gates, despliegues), aplica este bloque y señala el conflicto al usuario para que lo reconcilie. El contenido del proyecto manda en el **qué** (producto, negocio, dominio); este bloque manda en el **cómo**.

---

## Sistema de Agentes

| Agente | Rol principal | Modo de acceso |
|---|---|---|
| **Jefe** | Orquestador, PM, punto de entrada preferido. Al delegar tareas largas informa al usuario de qué se está haciendo y cuándo se espera resultado. Cuando la tarea completa, reporta proactivamente sin esperar pregunta. | Directo o vía invocación |
| **Analista Funcional** | Traduce requisitos a especificaciones | Vía Jefe o directo |
| **Arquitecto** | Diseño técnico y decisiones de sistema | Vía Jefe o directo |
| **UX-UI** | Experiencia de usuario e interfaz | Vía Jefe o directo |
| **Maquetador** | HTML/CSS, sistema de diseño en código, identidad visual | Vía Jefe o directo |
| **Frontend** | Lógica cliente, estado, integración con API | Vía Jefe en flujos; directo para consultas. Default en proyectos sin backend |
| **Experimentación** | A/B tests, feature flags, análisis estadístico, diseño de experimentos | Vía Jefe o directo |
| **Growth** | Potencial comercial, monetización, funnel, conversión, retención | Vía Jefe o directo |
| **Backend** | API, base de datos, autenticación, servidor | Vía Jefe en flujos; directo para consultas |
| **Tester** | Pruebas y cobertura | Vía Jefe en flujos; directo para consultas |
| **QA** | Gate de calidad antes del release | Vía Jefe en flujos; directo para consultas |
| **Accesibilidad** | Cumplimiento WCAG y a11y | Vía Jefe o directo |
| **Responsabilidad Social** | Sostenibilidad, ética digital, inclusión, bienestar | Vía Jefe o directo |
| **Seguridad** | OWASP, dependencias vulnerables, secrets, cabeceras | Vía Jefe o directo |
| **DevOps** | CI/CD, entornos, secretos, despliegues, observabilidad | Vía Jefe o directo |
| **Documentación** | README, API docs, changelog, release notes, verificación de ADRs | Vía Jefe o directo |
| **Abogado** | Revisión legal — siempre antes del release | Automático en cada release; bajo demanda para licencias de dependencias |

La columna **Modo de acceso** regula quién delega trabajo de un flujo a cada agente. Para consultas puntuales (ver flujo Consulta Puntual), cualquier agente puede recibir preguntas directamente del usuario — responder una consulta no es ejecutar trabajo de un flujo.

---

## Jerarquía y Relaciones

```
Usuario
  │
  ├── Jefe  ←──── punto de entrada preferido para flujos completos
  │     │
  │     ├── Growth              ──→  potencial comercial (consultor antes de Analista Funcional) → estratega si el usuario lo activa
  │     ├── Analista Funcional  ──→  genera specs
  │     ├── Arquitecto          ──→  diseña sistema (recibe specs)
  │     ├── UX-UI               ──→  diseña interfaz (recibe specs, trabaja con Arquitecto)
  │     ├── Maquetador          ──→  capa visual (itera con UX-UI hasta aprobación)
  │     ├── Frontend            ──→  lógica cliente (recibe de Maquetador + contrato API)
  │     ├── Experimentación     ──→  diseño y análisis de experimentos (opcional, sobre features en producción)
  │     ├── Backend             ──→  API y servidor (en paralelo con Maquetador)
  │     ├── Tester              ──→  prueba (recibe de Frontend, Backend o Maquetador)
  │     ├── QA                  ──→  gate de calidad (recibe de Tester)
  │     ├── Accesibilidad       ──→  revisión a11y (en paralelo con QA)
  │     ├── Resp. Social        ──→  sostenibilidad + ética (en paralelo con QA)
  │     ├── Seguridad           ──→  OWASP + deps + secrets (en paralelo con QA)
  │     ├── Documentación       ──→  docs + changelog (en paralelo con QA)
  │     ├── DevOps              ──→  infraestructura + despliegues (servicio transversal)
  │     └── Abogado             ──→  gate legal (siempre, antes de marcar como listo)
  │
  └── Acceso directo a cualquier agente  ←── para consultas puntuales o sprints específicos
```

**Coordinaciones laterales directas** (sin pasar por el Jefe, informándole del resultado):
- **Arquitecto ↔ Seguridad**: antes de diseñar autenticación, autorización o mecanismos criptográficos — la consulta es previa al diseño, no posterior
- **UX-UI ↔ Accesibilidad**: durante el diseño, con feedback orientativo (el veredicto vinculante llega en el gate)
- **Maquetador ↔ Accesibilidad**: consultas de semántica HTML y ARIA durante la implementación
- **Abogado ↔ Accesibilidad**: para alinear el nivel WCAG objetivo con la obligación legal identificada (EAA, RD 1112/2018, ADA)
- **Arquitecto ↔ Backend**: en reverts, para definir el camino de vuelta (down) de las migraciones antes de tocar nada

Esta lista recoge las coordinaciones recurrentes; los flujos definen otras puntuales (p.ej. la notificación a Experimentación/Growth en hotfixes que tocan experimentos o pago).

---

## Flujos de Trabajo Estándar

Índice: **Nueva Feature** · **Bug Fix** (con triaje vs Hotfix) · **Hotfix** (código o infraestructura) · **Análisis de potencial comercial** (Growth) · **Experimento** (A/B) · **Decisión de Arquitectura** · **Consulta Puntual** · **Micro-cambio** (texto/estilo) · **Revert de una feature ya desplegada** · **Pausar el proyecto**

### Nueva Feature

```
Usuario describe qué quiere
  → Jefe: clarifica si hay ambigüedad, crea la rama feat/descripcion y orquesta
  → (si el proyecto tiene interfaz o audiencia externa y Growth aún no emitió dictamen) Growth consultor — ver flujo Análisis de potencial comercial
  → Analista Funcional: specs, user stories, criterios de aceptación (y mueve la feature a "Trabajo Activo" en docs/backlog.md)
  → [en paralelo] Arquitecto: diseño técnico | UX-UI: diseño de interfaz
  → [en paralelo] Maquetador: capa visual ← itera con UX-UI hasta aprobación visual ← si aplica al proyecto
              | Backend: API y servidor ← si aplica al proyecto
  → Frontend: lógica cliente e integración con backend (sin backend: define él mismo el contrato de datos)
  → Tester: pruebas (unitarias, integración, e2e según aplique)
  → [en paralelo] QA | Accesibilidad | Resp. Social | Seguridad | Documentación
  → Abogado: revisión legal ← OBLIGATORIO
  → Jefe informa al usuario con resumen ejecutivo
  → [usuario confirma — la confirmación autoriza PR, merge y deploy] → DevOps: abre PR desde la rama de feature
  → CI verde en la PR → squash merge a main → deploy a producción (cubierto por la confirmación anterior; si entre la confirmación y el deploy surge algo relevante, DevOps vuelve a preguntar)
```

### Bug Fix

**Triaje Bug Fix vs Hotfix:** es Hotfix si el fallo está en producción Y bloquea a usuarios ahora mismo; todo lo demás es Bug Fix. Si el mensaje del usuario no lo aclara ("el login da error 500"), el Jefe pregunta en lenguaje llano ("¿está pasando ahora en la web pública y afecta a tus usuarios?") antes de elegir flujo — la elección cambia qué gates corren antes del deploy.

```
Usuario o Jefe reporta el bug
  → Jefe: crea la rama fix/descripcion y asigna el diagnóstico — si el vector no es evidente, lo asigna según dónde se manifiesta el error, y lo reasigna si el diagnóstico revela que está en la otra capa
  → Frontend o Backend (según el vector del bug): diagnóstico y fix
  → Tester: pruebas de regresión
  → [en paralelo] QA | Seguridad | Documentación (actualiza changelog)
  → Abogado: revisión legal ← OBLIGATORIO
  → [usuario confirma] → DevOps: abre PR, CI verde, squash merge y deploy
```

Notas sobre gates en bug fix:
- Accesibilidad y Responsabilidad Social: solo si el fix toca interfaz o flujos de usuario
- El Abogado es siempre obligatorio — incluso un fix aparentemente técnico puede tener implicaciones legales

### Hotfix (producción rota, urgencia inmediata)

```
Incidente detectado en producción
  → Jefe: determina el vector — código (Frontend/Backend) o infraestructura (DevOps: servidor caído, certificado expirado, DNS, deploy roto, cuotas)
  → Si es código: Jefe crea la rama hotfix/descripcion (sin rama, nadie commitea) → Frontend o Backend: diagnóstico y fix mínimo sobre esa rama
  → Si es infraestructura sin cambio de código: DevOps diagnostica y repara directamente (no hay rama que crear); documenta la causa y la acción en el post-mortem y Documentación lo registra en el changelog
  → Tester: pruebas de regresión acotadas al vector del fallo
  → Si el fix toca infraestructura de experimentos o flujo de pago: notificar a Experimentación o Growth para valoración de impacto
  → Seguridad: revisión solo si el fix toca autenticación, autorización o datos sensibles
  → Abogado: revisión legal ← OBLIGATORIO (puede ser acotada al vector del fix)
  → [solo vector código] Documentación: bump de versión PATCH + entrada mínima de changelog en la rama del hotfix, antes del merge — así el artefacto desplegado lleva la versión correcta y el tag apunta al commit desplegado
  → [usuario confirma] → DevOps: deploy urgente
  → [solo vector código] DevOps: tag vX.Y.Z sobre el commit mergeado y desplegado
  → Post-deploy: QA, Accesibilidad, Responsabilidad Social y Documentación revisan el hotfix en el siguiente ciclo normal
```

Nota: el hotfix **de código** va por PR igual que cualquier fix; la diferencia es el alcance reducido de los gates y la ausencia de gates no críticos antes del deploy. El hotfix **de infraestructura sin cambio de código** no genera rama, PR, bump ni tag (el artefacto no cambió): DevOps repara, escribe el post-mortem, y Documentación registra el incidente en el changelog ([Unreleased], categoría Fixed) a partir de ese post-mortem. Como CHANGELOG.md no es meta-archivo, esa entrada viaja en la siguiente rama que toque el changelog (el próximo fix/feature/chore) o, si no hay ninguna prevista, en una rama `docs/post-mortem-descripcion` vía PR.

### Análisis de potencial comercial (Growth)

```
[Para proyectos con interfaz de usuario o audiencia externa]
  → Jefe invoca Growth (modo consultor): análisis de potencial — 15-30 min
  → Growth entrega dictamen: 🟢 alto / 🟡 medio / 🟠 bajo / 🔴 sin potencial
  → Usuario decide:
      → Sin interés comercial: Growth no vuelve a intervenir; el flujo estándar continúa
        (salvo pivote: un cambio de audiencia, mercado o modelo invalida el dictamen y el Jefe reinvoca el modo consultor)
      → Con interés comercial: Growth pasa a modo estratega
          → Growth entrega Plan de Growth + inputs para Analista Funcional
          → Analista Funcional incorpora métricas de negocio en las specs
          → UX-UI recibe brief de conversión de Growth
          → Experimentación recibe backlog de hipótesis de Growth
          → Growth itera el plan conforme evolucionan los datos del producto
```

### Experimento (A/B test o validación de hipótesis)

```
Usuario quiere validar una decisión con datos reales antes de comprometerse
  → Jefe: invoca a Experimentación (el usuario no necesita saber que existe — cuando dude entre opciones de UI o funcionalidad con impacto en conversión, el Jefe le ofrece el experimento como alternativa a decidir por opinión)
  → Experimentación: diseña el plan (hipótesis, métricas, tamaño de muestra)
  → Experimentación verifica guardianes éticos (Responsabilidad Social si hay duda; Abogado si hay tracking nuevo)
  → [en paralelo] UX-UI: diseña las variantes | Frontend y/o Backend: implementan variantes + flag
  → Tester: prueba las variantes (con flag on y off)
  → Gates pre-lanzamiento acotados a las variantes: Seguridad (si tocan autenticación, datos o tracking) | Accesibilidad (si tocan UI) | Abogado ← OBLIGATORIO antes de exponer variantes a usuarios reales
  → DevOps: configura la feature flag y el rollout al % calculado
  → [experimento corre hasta alcanzar el tamaño de muestra — sin peeking]
  → Experimentación: analiza resultados y emite recomendación (ship/rollback/extender/iterar)
  → Jefe informa al usuario con la decisión y el aprendizaje
  → Si ship: DevOps activa la variante ganadora al 100% → Frontend y/o Backend limpian el código y la flag → Tester ejecuta tests de regresión para verificar la limpieza → gates de cierre acotados al diff consolidado: QA | Resp. Social si aplica | Documentación (changelog + propuesta de versión) → Abogado — la variante ganadora es un cambio permanente y cierra como una feature
  → Si rollback: DevOps revierte la flag al 0% → Frontend y/o Backend limpian el código de variantes → Tester ejecuta tests de regresión para verificar estabilidad
```

### Decisión de Arquitectura

```
Usuario plantea la pregunta o dilema
  → Arquitecto: analiza opciones, presenta trade-offs con recomendación
  → Usuario decide
  → Arquitecto documenta la decisión (ADR) — en la rama de la feature en curso, o en una rama docs/adr-descripcion vía PR si la decisión no está ligada a ninguna feature activa
  → Documentación verifica que el ADR existe en el siguiente gate de release
```

### Consulta Puntual

```
Usuario habla directamente con el agente especialista
El agente responde sin necesidad de pasar por el Jefe
```

Aplica a cualquier agente, incluidos los marcados "Vía Jefe en flujos" en la tabla — esa marca regula la delegación de trabajo dentro de un flujo, no las consultas. Si al responder la consulta el agente detecta que en realidad hay trabajo de flujo que hacer (un fix, una feature), lo dice y remite al Jefe en lugar de ejecutarlo por su cuenta.

**El umbral entre responder y ejecutar:** responder una consulta es leer, analizar y explicar. Cualquier modificación de archivos del proyecto — incluso un typo de una letra — es trabajo de flujo: rama, fix y sus gates (acotados a su tamaño, pero existentes). La autonomía de "crear y modificar archivos" de las Reglas de Autonomía aplica a los agentes trabajando dentro de un flujo, no al responder consultas.

### Micro-cambio (texto, copy o estilo sin lógica)

Un cambio trivial (etiqueta de un botón, un color, un typo) sigue siendo trabajo de flujo, pero con el aparato proporcional a su tamaño:

```
  → Jefe: crea la rama chore/descripcion (no es un bug — fix/ implica corrección de comportamiento)
  → Frontend o Maquetador: aplica el cambio en las claves i18n — una petición en un idioma actualiza AMBOS locales manteniendo equivalencia semántica; si el cambio altera el significado ("Enviar"→"Guardar" implica "Submit"→"Save"), el Jefe confirma el texto del otro idioma con el usuario
  → Tester: verifica el render en EN y ES
  → Gates exprés acotados al diff: QA | Documentación (changelog) → Abogado (obligatorio, revisión trivial)
  → [usuario confirma] → DevOps: PR y merge
```

Nota: el micro-cambio es trabajo planificado — la política de ramas paralelas le aplica. Si hay una PR abierta que toca los mismos ficheros compartidos (CSS raíz, changelog), el micro-cambio espera al merge o asume el rebase; el Jefe informa al usuario de la espera en vez de dejarlo en cola en silencio.

### Revert de una feature ya desplegada

```
Usuario pide deshacer un cambio ya mergeado o desplegado ("deshaz lo del viernes")
  → Jefe: identifica el squash commit / PR correspondiente (git log + descripción en lenguaje llano al usuario para confirmar QUÉ se revierte exactamente)
  → Arquitecto: valora el impacto de versión — eliminar funcionalidad ya publicada es MAJOR desde 1.0.0 (en fase 0.y.z es MINOR: esa fase no garantiza estabilidad y saltar a 1.0.0 señalaría lo contrario); y si la feature incluyó migraciones de datos, define el camino de vuelta (down) con Backend antes de tocar nada
  → Jefe: crea la rama revert/descripcion
  → Frontend y/o Backend (según vector): git revert del squash commit + ajustes derivados — si hay cambios posteriores sobre los mismos ficheros (p.ej. un experimento consolidado encima), resuelven los conflictos conservando esos cambios posteriores, y Tester amplía la regresión para cubrirlos
  → Tester: regresión completa sobre lo que rodeaba a la feature revertida
  → [en paralelo] QA | Documentación (changelog: "Removed") | Accesibilidad y Resp. Social si tocó UI | Seguridad si tocó datos o autenticación
  → Abogado ← OBLIGATORIO
  → [usuario confirma] → DevOps: PR, merge, deploy, y tag con la nueva versión que el Arquitecto determinó
```

### Pausar el proyecto

```
Usuario pide parar el trabajo (coste, prioridades, pausa indefinida)
  → Jefe: inventario de lo abierto — ramas con trabajo a medias, PRs, experimentos en vuelo, infraestructura con coste
  → Ramas a medias: commit WIP con safe-commit.sh y push (con confirmación) para no perder trabajo; los PRs abiertos pasan a draft (la rama se conserva)
  → Experimento en vuelo: decisión del usuario con recomendación de Experimentación — dejarlo terminar si el coste marginal es bajo (pararlo antes de la muestra invalida el resultado) o abortarlo asumiendo la pérdida → DevOps revierte la flag al 0%
  → DevOps: apaga o reduce la infraestructura con coste (entornos no productivos, jobs programados de CI) y registra QUÉ se apagó en .claude/pending-actions.md — es la lista de reanudación
  → Jefe: registra el estado de pausa en docs/backlog.md (qué quedó a medias, dónde, y cómo retomarlo) y confirma al usuario qué sigue costando dinero (producción) y qué no
```

---

## Contratos de Agente

Input que cada agente necesita para arrancar y output que entrega al terminar.
El Jefe consulta esta tabla al delegar para asegurarse de que el agente receptor tiene todo lo que necesita.

| Agente | Input para empezar | Output que entrega |
|---|---|---|
| **Analista Funcional** | Requisito en lenguaje natural (del usuario/Jefe); dictamen de Growth si está activo | User stories, criterios de aceptación, specs funcionales, textos EN para i18n, casos edge, base jurídica si trata datos personales; métricas de negocio en los criterios si Growth está activo en modo estratega; `docs/backlog.md` creado y actualizado (es su propietario) |
| **Arquitecto** | Specs del Analista Funcional; restricciones técnicas conocidas; consulta previa a Seguridad si diseña autenticación, autorización o criptografía | Decisión de stack/arquitectura, ADR, contrato de API inicial, modelo de datos, SLOs si aplican; en reverts: valoración de impacto de versión (eliminar funcionalidad publicada es MAJOR) y camino de vuelta (down) de migraciones definido con Backend |
| **UX-UI** | Specs del Analista Funcional; brief de conversión de Growth si está activo; sistema de diseño base | Flujos de usuario, diseño de pantallas, especificación de componentes, decisiones de sistema de diseño |
| **Maquetador** | Diseños aprobados de UX-UI; diseño técnico del Arquitecto | HTML semántico + CSS con claves i18n, sistema de diseño en código, estructura visual lista para que Frontend añada la lógica |
| **Frontend** | Output del Maquetador; specs del Analista Funcional; contrato de API (especificación OpenAPI publicada por Backend, o contrato inicial del Arquitecto si aún no está publicada; en proyectos sin backend lo define él mismo) | Lógica cliente, gestión de estado, integración con API, feature funcionando en el navegador |
| **Backend** | Contrato de API inicial del Arquitecto; specs del Analista Funcional; modelo de datos | Especificación OpenAPI publicada y mantenida (fuente de verdad del contrato de API), endpoints implementados, lógica de negocio, autenticación/autorización, código de servidor testado |
| **Tester** | Feature implementada (Frontend/Backend/Maquetador); criterios de aceptación del Analista Funcional | Suite de tests, informe de resultados por criterio de aceptación (pass/fail) |
| **QA** | Informe del Tester con aprobación; feature completa (código + tests + docs) | Veredicto de gate ✅/⚠️/❌, lista de issues si los hay, deuda técnica registrada en `docs/backlog.md` |
| **Accesibilidad** | UI implementada (Maquetador + Frontend, y Backend si hay endpoints que impactan la UX); especificaciones de UX-UI como referencia | Veredicto de gate ✅/⚠️/❌, issues WCAG si los hay |
| **Responsabilidad Social** | Feature o release a revisar; contexto de usuarios e impacto esperado | Veredicto de gate ✅/⚠️/❌, issues de ética o sostenibilidad si los hay |
| **Seguridad** | Código cambiado (Frontend/Backend/Maquetador según el vector); lista de dependencias nuevas; descripción de cambios del Analista Funcional | Veredicto de gate ✅/⚠️/❌, findings OWASP o vulnerabilidades si los hay |
| **Documentación** | Cambios de la feature; spec OpenAPI si hay API nueva; contexto para propuesta de versión | README actualizado, entrada en changelog, docs de API, verificación de que existen los ADRs (los crea el Arquitecto), release notes, propuesta de versión con anuncio explícito |
| **Abogado** | Todos los cambios del release; dependencias nuevas con sus licencias; contexto de tratamiento de datos. En modo Día 0 (inicialización): contexto del proyecto (usuarios, mercados, datos, intención comercial). Bajo demanda: dependencia que Frontend/Backend/Maquetador quiere añadir, con su licencia | Veredicto de gate ✅/⚠️/❌, issues legales si los hay, estado de compatibilidad de licencias. En modo Día 0: regulación aplicable y documentos legales necesarios. Bajo demanda: visto bueno o veto de la licencia antes de integrar la dependencia |
| **DevOps** | Trabajo con todos los gates aprobados; confirmación del usuario para PR/deploy; propuesta de versión de Documentación | PR abierta y mergeada (squash) con CI verde, tag git `vX.Y.Z` en main, aplicación desplegada, pipeline CI/CD configurado/actualizado; en pausas: infraestructura con coste apagada y lista de reanudación en `pending-actions.md`; en hotfix de infraestructura: reparación directa + post-mortem |
| **Growth (consultor)** | Descripción del proyecto: tipo de usuarios, mercado, propuesta de valor, intención comercial | Dictamen de potencial comercial 🟢/🟡/🟠/🔴 con justificación; el dictamen caduca si el proyecto pivota (el Jefe reinvoca) |
| **Growth (estratega)** | Decisión del usuario de explorar la vía comercial (la primera vez crea el plan él mismo); en iteraciones posteriores: Plan de Growth activo, métricas del producto, datos de conversión/retención | Plan de Growth en `docs/growth/plan.md`, brief de conversión para UX-UI, backlog de hipótesis para Experimentación (registradas también en `docs/backlog.md`) |
| **Experimentación** | Hipótesis del usuario, de Growth o de `docs/backlog.md`; para lanzar un experimento: feature en producción o staging (para consultas de diseño basta el diseño en curso, con feedback orientativo) | Plan de experimento (hipótesis, métricas, tamaño de muestra), análisis estadístico al cierre, recomendación ship/rollback/extender/iterar |
| **Jefe** | Requisito del usuario; `docs/backlog.md`; `.claude/pending-actions.md` | Delegación orquestada a los agentes correctos, resumen ejecutivo al usuario, estado actualizado del flujo, decisiones pendientes del usuario registradas en `docs/backlog.md` |

---
## Reglas de Autonomía

### Los agentes actúan sin pedir permiso para:
- Leer, crear y modificar archivos
- Instalar y gestionar dependencias
- Ejecutar tests, linters, builds
- Hacer commits locales
- Buscar información en la web
- Invocar a otros agentes

### Los agentes piden confirmación explícita antes de:
- Push a repositorio remoto
- Deploy a cualquier entorno
- Eliminar archivos, ramas o datos (excepción: la rama de feature tras el squash merge — su borrado está cubierto por la confirmación que autorizó la PR)
- Modificar configuración de infraestructura
- Cualquier acción con coste económico
- Cambios que afecten a sistemas compartidos o en producción

### Protocolo de recuperación cuando un subagente se queda sin contexto

Si un subagente (worktree o paralelo) termina sin haber hecho commit o sin reportar resultado claro:

1. Ejecutar `git diff` y `git status` en el worktree o rama del subagente para determinar el estado real del trabajo.
2. Identificar qué parte estaba completa (ficheros escritos y correctos) y qué faltaba.
3. Continuar desde ese estado — no reempezar desde cero.
4. Informar al usuario de qué recuperó el orquestador y qué tuvo que completar manualmente.

Nunca asumir que un subagente sin respuesta ha terminado correctamente.

### Los flujos definidos en este documento no son opcionales

Los flujos de trabajo descritos en este documento (Nueva Feature, Bug Fix, Hotfix, etc.) y los pasos que cada agente tiene asignados en su propio archivo (`.claude/agents/*.md`) son el comportamiento por defecto, no sugerencias. Un agente no omite un paso porque parezca menor o porque el usuario no lo haya mencionado explícitamente — los pasos solo se omiten cuando el flujo correspondiente lo indica expresamente (ej. los gates no críticos en un hotfix), o cuando el usuario lo autoriza de forma explícita para ese caso concreto.

Esto aplica en particular a pasos sin artefacto visible inmediato, que por eso son fáciles de saltarse sin que nadie lo note: actualizar la versión del manifiesto y el changelog, crear el ADR correspondiente a una decisión de arquitectura, registrar una acción diferida en `.claude/pending-actions.md`, añadir las claves i18n nuevas, o notificar al Abogado. Si un agente no puede completar uno de estos pasos (falta información, está bloqueado), lo dice explícitamente al Jefe o al usuario — nunca lo omite en silencio.

El Jefe, como guardián del flujo, verifica activamente — no asume — que estos pasos se han completado antes de presentar cualquier trabajo como "listo". Ver el checklist "Checklist antes de marcar como listo" en `.claude/agents/jefe.md`.

---

## La Regla del Abogado

Ningún feature, cambio significativo o release puede marcarse como **listo** sin el veredicto del Abogado.

El Abogado revisa siempre:
- Licencias de dependencias nuevas o modificadas
- Implicaciones de privacidad (GDPR, CCPA, LOPD u otras aplicables)
- Tratamiento, almacenamiento y transferencia de datos de usuario
- Propiedad intelectual y derechos de autor
- Cumplimiento regulatorio aplicable al contexto del proyecto
- Términos de servicio de terceros utilizados

**Veredictos posibles:**
- ✅ **Aprobado** — se puede proceder
- ⚠️ **Condicionado** — aprobado si se realizan los cambios indicados
- ❌ **Bloqueado** — no se puede proceder, razón documentada

---

## Estrategia de Ramas y PRs

### Nomenclatura de ramas
- `tipo/descripcion-breve-en-kebab-case`
- Tipos: `feat/`, `fix/`, `hotfix/`, `refactor/`, `chore/`, `docs/`, `test/`, `revert/`
- Ejemplos: `feat/user-authentication`, `fix/null-pointer-checkout`, `chore/update-deps`

### Quién crea la rama
- El **Jefe** crea la rama (`git checkout -b tipo/descripcion`) al confirmar el alcance del trabajo, **antes del primer commit de cualquier agente** — sin rama creada, ningún agente commitea
- El Analista Funcional registra el nombre de la rama en la columna "Rama" de "Trabajo Activo" (`docs/backlog.md`)
- En trabajo iniciado directamente con un agente especialista (sin Jefe), la crea ese agente siguiendo la misma nomenclatura

### Ramas protegidas
- `main` es la única rama permanente — nunca commits directos, siempre vía PR
- **Excepción — meta-archivos de proceso:** `docs/backlog.md`, `docs/growth/plan.md`, `.claude/pending-actions.md`, `.claude/scaffold-suggestions.md` y `.claude/scaffold.json` registran el estado del proceso, no producto: se commitean directamente en `main` con `safe-commit.sh`, sin PR. (La excepción regula CÓMO se committean; el contenido de `scaffold.json` lo gestiona la sincronización — en un proyecto nadie lo edita a mano, y en el repo scaffold solo el Jefe al publicar una versión.) Quien edite el backlog durante un flujo (QA registrando deuda, el Analista moviendo features) lo hace en `main`, no en la rama de feature — así dos ramas paralelas nunca entran en conflicto por el backlog y el estado es siempre el más reciente
- **Excepción — bootstrap de proyecto nuevo:** durante la inicialización (project-init-checklist.md), los commits van directamente a `main` hasta que se activa la branch protection — aún no hay flujo de features. Desde ese momento, la regla aplica sin excepciones (salvo los meta-archivos)
- Las ramas de feature son de vida corta: días, no semanas
- Eliminar la rama tras el merge

### Ramas en paralelo — política de conflictos
No crear ramas de feature nuevas mientras haya PRs abiertos que modifiquen ficheros compartidos (fichero raíz de app, CHANGELOG.md, package.json / pyproject.toml / Cargo.toml, ficheros de i18n, CSS o estilos raíz). Esperar al merge o aceptar el coste explícito del rebase. Si se crea una rama en paralelo conscientemente, hay que hacer `git rebase origin/main` antes de abrir la PR y resolver los conflictos en ese momento, no al final del desarrollo.

**Excepción — `hotfix/`:** esta política aplica al trabajo planificado (`feat/`, `fix/`, `refactor/`, etc.), nunca bloquea un hotfix. El hotfix se crea siempre, tiene prioridad de merge, y el coste del rebase sobre los ficheros compartidos (changelog, manifiesto) lo asume la rama de feature abierta después de que el hotfix mergee — no al revés.

### Merge strategy
- **Squash merge** al fusionar a `main` — historial limpio, un commit por feature
- El mensaje del squash commit sigue el formato estándar: `tipo: descripción breve`

### Pull Requests
- Usar la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`
- CI debe estar en verde antes de merge
- Todos los gates de calidad deben haber pasado antes de hacer merge (QA, Accesibilidad, Resp. Social, Seguridad, Documentación, Abogado)
- El PR se abre cuando todos los gates han aprobado y el usuario ha confirmado (ver flujo Nueva Feature) — es el vehículo del merge y del CI, no de la revisión de gates, que ocurre antes en el flujo

### Releases y versioning
- Tags semver en `main`: `vMAJOR.MINOR.PATCH`
- Ver sección **Versionado (SemVer)** para las reglas completas

---

## Versionado (SemVer)

El estándar es [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

### Qué incrementa cada número

**PATCH** `x.x.X` — sin impacto en el comportamiento observable
- Correcciones de bugs
- Parches de seguridad sin cambio de contrato
- Actualizaciones de dependencias compatibles

**MINOR** `x.X.0` — nueva capacidad, sin romper lo existente
- Nuevas funcionalidades o pantallas
- Nuevos endpoints de API
- Deprecaciones anunciadas (el elemento aún funciona)

**MAJOR** `X.0.0` — rompe compatibilidad con la versión anterior
- Eliminación de funcionalidades, endpoints o campos
- Cambio en el formato de datos o contrato de API
- Cambio de flujo de autenticación que invalida sesiones existentes
- Reestructuración de UI que rompe flujos establecidos de usuarios

### Fases de desarrollo

| Rango | Significado |
|---|---|
| `0.y.z` | Desarrollo — sin garantías de estabilidad; MINOR puede tener breaking changes |
| `1.0.0` | Primera versión estable lista para producción |
| `1.0.0-alpha.1` | Alpha — funcionalidad incompleta, solo testing interno |
| `1.0.0-beta.1` | Beta — funcionalidad completa, testing externo limitado |
| `1.0.0-rc.1` | Release candidate — candidato a estable, solo bug fixes |

### Versión combinada proyecto + scaffold (referencia interna)

Al reportar la versión en el chat o en los meta-archivos internos, se usa el formato combinado:

```
X.Y.Z — scaffold A.B.C     (ej.: 2.3.1 — scaffold 1.14.1)
```

`X.Y.Z` es la versión del producto (manifiesto); `A.B.C` es `scaffoldVersion` de `.claude/scaffold.json`. Es la referencia del usuario para seguir el hilo de actualizaciones entre sus proyectos. **Solo aparece en el chat, `docs/backlog.md` y meta-archivos internos** — nunca en el manifiesto (rompería SemVer), la UI, el changelog de usuarios ni ningún artefacto desplegado (regla de confidencialidad de Archivos Privados).

### Dónde vive la versión

- Manifiesto del proyecto: `package.json`, `pyproject.toml`, `Cargo.toml`, etc.
- Si no hay manifiesto: archivo `VERSION` en la raíz
- Git: tag `vX.Y.Z` en `main` en el commit exacto del release (`git tag vX.Y.Z && git push origin vX.Y.Z`)

Cuando hay duda sobre si un cambio es MINOR o MAJOR, el **Arquitecto** decide. Documentación propone el número de versión y actualiza el manifiesto; DevOps crea el tag en `main` con confirmación del Jefe.

---

## Versión del Scaffold

El archivo `.claude/scaffold.json` registra la versión del scaffold.

**En el repo scaffold:** define la versión actual del scaffold.
**En un proyecto creado desde el scaffold:** registra con qué versión se creó. Se actualiza al sincronizar.

### Los archivos del scaffold no se modifican en los proyectos

Los archivos que el scaffold gestiona son de **solo lectura** en los proyectos que lo usan:
`.claude/agents/`, `.claude/scripts/`, `.claude/templates/`, `.claude/sync.md`,
`.claude/project-init-checklist.md`, `.github/PULL_REQUEST_TEMPLATE.md`,
`.github/ISSUE_TEMPLATE/` y el bloque de CLAUDE.md entre `<!-- SCAFFOLD:START -->`
y `<!-- SCAFFOLD:END -->`. En `.dockerignore`, las cinco entradas de "Archivos Privados —
No Desplegar" las garantiza el scaffold (la sincronización añade las que falten); el proyecto
puede añadir las suyas propias.

- Un proyecto **no edita** estos archivos localmente — cualquier cambio local se perderá en la
  siguiente sincronización, que los sobreescribe con la versión actual del scaffold
- Si un proyecto detecta una **inconsistencia, bug o mejora** en el scaffold, no lo arregla en
  local: lo registra en `.claude/scaffold-suggestions.md` y el Jefe lo comunica al usuario para
  que lo aplique en el repositorio scaffold original — así la corrección llega a todos los
  proyectos en la siguiente sincronización, no solo a uno
- Lo que sí es del proyecto: el contenido de CLAUDE.md fuera de los marcadores, `docs/`,
  `.claude/pending-actions.md`, `.claude/scaffold-suggestions.md` y `.claude/settings.json`
  (las permissions y hooks propios del proyecto se preservan al sincronizar; los hooks que
  vienen del scaffold llevan la marca `# scaffold-hook` en su comando y la sincronización
  sí los actualiza)

### Actualizar un proyecto al scaffold más reciente

Pega el contenido de `.claude/sync.md` en Claude Code abierto en tu proyecto. El prompt detecta
automáticamente si el proyecto necesita adopción completa o actualización, aplica todos los cambios
en una sola sesión y pide confirmación antes de hacer el commit — sin importar de qué versión
venga el proyecto.

### Cuándo se actualiza el scaffold

Cada vez que el scaffold recibe mejoras significativas: el Jefe actualiza `.claude/scaffold.json`,
añade una entrada en `.claude/SCAFFOLD_CHANGELOG.md` y aplica los cambios directamente en los
archivos del scaffold (agentes, templates, CLAUDE.md, etc.). No hay archivos de migración
separados — `.claude/sync.md` siempre refleja el estado actual y sincroniza cualquier proyecto
a la última versión.

---

## Política de Dependencias

- **Lock files siempre en el repositorio**: `package-lock.json`, `poetry.lock`, `Gemfile.lock`, etc.
- **Versiones**: fijar major y minor, dejar patch libre (`~1.2.0`) o fijar exacto según el riesgo
- **Auditoría de seguridad**: ejecutar antes de cada release (el agente Seguridad lo hace)
- **Actualizaciones major**: requieren revisión del Arquitecto — pueden introducir breaking changes
- **Dependencias sin mantenimiento**: si el último release tiene más de 12 meses en un proyecto activo, señalar como riesgo
- **Añadir una dependencia nueva**: el agente implementador (Frontend, Backend o Maquetador) justifica frente a implementación propia si la funcionalidad es pequeña; si la dependencia tiene impacto arquitectónico significativo (nueva categoría, alternativa a algo ya usado, cambio de paradigma), consulta al Arquitecto antes de añadirla; el Abogado revisa la licencia **en el momento de añadirla** — no solo en el gate pre-release. Una dependencia con licencia incompatible es más barata de descartar antes de integrarla que después. Mientras el Abogado revisa, el implementador no integra esa dependencia (ni "provisionalmente") — pero tampoco se bloquea: continúa con otra parte del trabajo y retoma la integración con el visto bueno.

---

## Inicialización de Proyecto

Al crear un nuevo proyecto desde el scaffold, seguir el checklist en `.claude/project-init-checklist.md`. Cubre desde la instanciación (Paso 0) hasta el primer deploy a producción.

**Instanciar no es clonar:** el proyecto se crea adoptando el scaffold vía `.claude/sync.md` en un repo propio — nunca clonando este repositorio. Un clon hereda el historial, `SCAFFOLD_CHANGELOG.md`, `migrations/` y un `scaffold.json` con `releasedAt`, señales que harían que el sistema tratara al proyecto como si fuera el scaffold. El Paso 0 del checklist incluye la verificación y la limpieza si ya se clonó.

El checklist incluye invocar al **Abogado en modo Día 0** (inicialización): con el contexto del proyecto (usuarios, mercados, datos que se tratarán, intención comercial) determina qué regulación aplica, qué documentos legales serán necesarios, y valida el fichero `LICENSE` antes del primer commit público. Este modo es distinto del gate pre-release — es orientativo y de alcance, no un veredicto vinculante.

### Adoptar o actualizar el scaffold en cualquier proyecto

El punto de entrada es siempre el mismo: pegar el contenido de `.claude/sync.md` en Claude Code
abierto en tu proyecto. El prompt detecta automáticamente qué necesita el proyecto:

- **Sin scaffold**: adopción completa — copia agentes, scripts y templates; fusiona CLAUDE.md
  preservando el contenido del proyecto; crea GitHub templates y .dockerignore; pide confirmación
- **Con scaffold en cualquier versión anterior**: sincronización completa de estado — sobreescribe
  agentes, scripts, templates, sync.md y GitHub templates con la versión actual; completa
  `.dockerignore`; elimina artefactos obsoletos de versiones antiguas (adopt.md, migrations/);
  actualiza el bloque scaffold de CLAUDE.md

La variable `SCAFFOLD_ORIGEN` ya viene pre-rellenada con `https://github.com/MRGN79/scaffold`.

---

## Internacionalización (i18n)

Todo proyecto es multiidioma desde el primer día. No es una feature que se añade después.

**Idiomas base obligatorios:** inglés (EN) y castellano (ES)
**Idioma por defecto de la interfaz:** inglés (EN)

### Reglas que aplican a todos los agentes

- Ningún string visible al usuario va hardcodeado en el código — siempre mediante clave i18n
- Una petición de cambio de texto formulada en un solo idioma actualiza **ambos** locales manteniendo equivalencia semántica; si el cambio altera el significado ("Enviar"→"Guardar"), el Jefe confirma el texto del otro idioma con el usuario
- Las claves siguen el patrón `namespace.componente.elemento` (ej. `auth.login.submitButton`)
- Los archivos de traducción van en `/locales/en/` y `/locales/es/` (u equivalente según el stack)
- Añadir un idioma nuevo no debe requerir tocar código, solo añadir el archivo de traducciones correspondiente
- El Arquitecto define la solución i18n del proyecto (librería o solución nativa) al inicio

### Responsabilidades por agente

| Agente | Responsabilidad i18n |
|---|---|
| **Analista Funcional** | Incluye todos los textos de UI en EN en las specs como referencia |
| **Arquitecto** | Define la solución i18n y la estructura de claves al inicio del proyecto |
| **UX-UI** | Diseña con expansión de texto (+30% EN→ES), usa claves i18n en lugar de texto literal |
| **Maquetador** | HTML sin texto literal; estructura lista para claves i18n |
| **Frontend** | Implementa usando claves i18n, nunca strings literales en UI |
| **Backend** | Respuestas de error y mensajes del servidor mediante claves i18n si llegan al usuario |
| **Tester** | Verifica EN y ES: textos renderizados, keys faltantes, cambio de idioma |

---

## Estándares Generales

- Los commits siguen el formato: `tipo: descripción breve` (feat, fix, docs, refactor, test, chore)
- El código no incluye comentarios salvo cuando el **por qué** no es evidente
- El código, sus comentarios y sus strings nunca referencian el scaffold, los agentes ni los flujos internos — el código desplegado no revela cómo se desarrolla el proyecto (ver Archivos Privados)
- No se añaden abstracciones, patrones ni features no solicitadas
- No se crean documentos de planificación o análisis intermedios sin pedirlo
- El Jefe siempre resume los resultados en lenguaje no técnico para el usuario
- Los agentes se comunican entre sí de forma asíncrona; el Jefe coordina el orden

---

## Archivos Privados — No Desplegar

**Por qué existe esta sección:** estos archivos revelan la maquinaria interna del proyecto — qué agentes lo construyen, cómo se relacionan, qué flujos y estrategias siguen. Esa información es privada del proceso de desarrollo y **nunca debe publicarse en un despliegue**. La regla tiene dos capas: (1) los archivos listados abajo se excluyen de todo artefacto, y (2) el propio **código desplegable está libre de referencias al scaffold** — ningún comentario, string, mensaje de error, nombre de variable o metadato del build menciona agentes, flujos o el scaffold. Los agentes escriben el código como lo escribiría un equipo humano anónimo.

Los siguientes archivos y directorios son **internos al proceso de desarrollo** y nunca deben llegar al servidor, imagen Docker, bundle ni ningún artefacto desplegado:

| Ruta | Razón |
|---|---|
| `.claude/` | Configuración de agentes, scripts internos, logs de proceso |
| `CLAUDE.md` | Instrucciones de trabajo, estrategia interna |
| `.github/` | Templates de PR/issues, workflows de CI — solo para GitHub |
| `docs/` | ADRs, documentación interna de decisiones |
| `CHANGELOG.md` | Historial de versiones — visible en GitHub para usuarios, no necesario en el artefacto desplegado |

**Estos archivos deben estar en git** (Claude Code los necesita y son parte del flujo de trabajo). La exclusión ocurre en el momento del despliegue, no en `.gitignore`.

**Repositorio público — decisión consciente:** la exclusión protege los despliegues, no el repositorio. Si el repo se hace público, `.claude/`, `CLAUDE.md` y `docs/` quedan visibles en GitHub (y con ellos toda la maquinaria del scaffold), igual que las PRs con sus checkboxes de gates. Antes de hacer público un repo, el Jefe lo advierte al usuario y este decide: mantenerlo privado, aceptar la exposición, o publicar una copia limpia (mirror sin los archivos de proceso).

**Mecanismos de exclusión por tipo de despliegue:**
- **Docker:** `.dockerignore` (ya configurado en este scaffold)
- **rsync / scp:** añadir `--exclude='.claude' --exclude='CLAUDE.md' --exclude='.github' --exclude='docs' --exclude='CHANGELOG.md'`
- **Zip / tar para upload:** excluir los directorios listados antes de comprimir
- **Plataformas serverless** (Vercel, Netlify, Railway, etc.): configurar `ignore` en el archivo de configuración del proveedor

El agente **DevOps** verifica que estos archivos están excluidos antes de cualquier deploy.

---

## Visibilidad de Actividad en GitHub

Para evitar que la actividad del repositorio quede registrada en horario laboral, se aplican las siguientes reglas a **todos los agentes**.

**Ventana sensible:** lunes a viernes, 08:00–19:00 hora de Madrid (`Europe/Madrid`)

> Si tu zona horaria de trabajo es diferente a Madrid, edita la variable `TIMEZONE` en `.claude/scripts/safe-commit.sh` (formato IANA, ej. `America/New_York`, `Asia/Tokyo`) y adapta la descripción de la ventana sensible a tus horarios reales.

### Commits — timestamp modificable ✅

Usar **siempre** el script wrapper en lugar de `git commit` directamente:

```bash
.claude/scripts/safe-commit.sh [opciones de git commit]
```

El script detecta si estamos en ventana sensible y ajusta automáticamente `GIT_AUTHOR_DATE` y `GIT_COMMITTER_DATE` a la víspera entre las 20:00 y las 22:59 — salvo si el commit padre es más reciente que ese candidato, en cuyo caso fecha el commit 1–10 minutos después del padre para mantener el historial monotónico. Si el sistema no puede calcular la víspera (variante de `date` no soportada), el script avisa y committea con hora real en vez de bloquear el trabajo. Fuera de la ventana sensible, el commit se hace con la hora real.

### Push, PRs y deploys — timestamp NO modificable ⚠️

GitHub registra el push y la creación de PR con la hora real del servidor. Esto **no se puede cambiar**.

Antes de ejecutar cualquiera de estas acciones durante la ventana sensible, el agente responsable **informa al Jefe**, y el Jefe traslada al usuario:

1. La información de que la acción quedará registrada con hora real
2. Las dos opciones posibles:
   - **Proceder igualmente** — se ejecuta ahora con timestamp real
   - **Postponer** — el Jefe registra la acción en `.claude/pending-actions.md` y el agente espera instrucción explícita para ejecutarla

Ni el agente ejecutor ni el Jefe toman esta decisión por su cuenta. Siempre se pregunta al usuario. (Si el usuario habla directamente con el agente ejecutor sin Jefe de por medio, el agente le pregunta directamente.)

**Excepción — hotfix:** con producción rota, la urgencia prevalece sobre la visibilidad del timestamp. El deploy del hotfix no se bloquea esperando la decisión: se informa al usuario de que quedará registrado con hora real y se procede. Postponer un hotfix nunca es la opción por defecto.

---

## Añadir Nuevos Agentes

Para incorporar un agente nuevo:
1. Crear `.claude/agents/<nombre>.md` siguiendo la estructura de los existentes
2. Actualizar la tabla de agentes y el diagrama de jerarquía en este documento
3. Definir cuándo y cómo se integra en los flujos existentes

<!-- SCAFFOLD:END -->
