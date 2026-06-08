# Scaffold — Base de Operaciones

## Filosofía

El usuario se centra en funcionalidad y negocio. Claude gestiona todo lo técnico con autonomía alta. El usuario no escribe código ni toma decisiones técnicas salvo cuando se le presenta una elección estratégica con trade-offs claros.

---

## Sistema de Agentes

| Agente | Rol principal | Modo de acceso |
|---|---|---|
| **Jefe** | Orquestador, PM, punto de entrada preferido | Directo o vía invocación |
| **Analista Funcional** | Traduce requisitos a especificaciones | Vía Jefe o directo |
| **Arquitecto** | Diseño técnico y decisiones de sistema | Vía Jefe o directo |
| **UX-UI** | Experiencia de usuario e interfaz | Vía Jefe o directo |
| **Maquetador** | HTML/CSS, sistema de diseño en código, identidad visual | Vía Jefe o directo |
| **Frontend** | Lógica cliente, estado, integración con API | Vía Jefe. Default en proyectos sin backend |
| **Experimentación** | A/B tests, feature flags, análisis estadístico, diseño de experimentos | Vía Jefe o directo |
| **Growth** | Potencial comercial, monetización, funnel, conversión, retención | Vía Jefe o directo |
| **Backend** | API, base de datos, autenticación, servidor | Vía Jefe |
| **Tester** | Pruebas y cobertura | Vía Jefe |
| **QA** | Gate de calidad antes del release | Vía Jefe |
| **Accesibilidad** | Cumplimiento WCAG y a11y | Vía Jefe o directo |
| **Responsabilidad Social** | Sostenibilidad, ética digital, inclusión, bienestar | Vía Jefe o directo |
| **Seguridad** | OWASP, dependencias vulnerables, secrets, cabeceras | Vía Jefe o directo |
| **DevOps** | CI/CD, entornos, secretos, despliegues, observabilidad | Vía Jefe o directo |
| **Documentación** | README, API docs, changelog, ADRs, release notes | Vía Jefe o directo |
| **Abogado** | Revisión legal — siempre antes del release | Automático |

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

---

## Flujos de Trabajo Estándar

### Nueva Feature

```
Usuario describe qué quiere
  → Jefe: clarifica si hay ambigüedad, luego orquesta
  → Analista Funcional: specs, user stories, criterios de aceptación
  → [en paralelo] Arquitecto: diseño técnico | UX-UI: diseño de interfaz
  → [en paralelo] Maquetador: capa visual ← itera con UX-UI hasta aprobación visual ← si aplica al proyecto
              | Backend: API y servidor ← si aplica al proyecto
  → Frontend: lógica cliente e integración con backend
  → Tester: pruebas (unitarias, integración, e2e según aplique)
  → [en paralelo] QA | Accesibilidad | Resp. Social | Seguridad | Documentación
  → Abogado: revisión legal ← OBLIGATORIO
  → Jefe informa al usuario con resumen ejecutivo
  → [usuario confirma] → DevOps: abre PR desde la rama de feature
  → CI verde en la PR → squash merge a main → deploy a producción
```

### Bug Fix

```
Usuario o Jefe reporta el bug
  → Frontend o Backend (según el vector del bug): diagnóstico y fix
  → Tester: pruebas de regresión
  → [en paralelo] QA | Seguridad | Documentación (actualiza changelog)
  → Abogado: revisión legal ← OBLIGATORIO
  → [usuario confirma] → DevOps: ejecuta el deploy
```

Notas sobre gates en bug fix:
- Accesibilidad y Responsabilidad Social: solo si el fix toca interfaz o flujos de usuario
- El Abogado es siempre obligatorio — incluso un fix aparentemente técnico puede tener implicaciones legales

### Hotfix (producción rota, urgencia inmediata)

```
Incidente detectado en producción
  → Frontend o Backend: diagnóstico y fix mínimo sobre rama dedicada hotfix/descripcion
  → Tester: pruebas de regresión acotadas al vector del fallo
  → Si el fix toca infraestructura de experimentos o flujo de pago: notificar a Experimentación o Growth para valoración de impacto
  → Seguridad: revisión solo si el fix toca autenticación, autorización o datos sensibles
  → Abogado: revisión legal ← OBLIGATORIO (puede ser acotada al vector del fix)
  → [usuario confirma] → DevOps: deploy urgente
  → Post-deploy: QA, Accesibilidad, Responsabilidad Social y Documentación revisan el hotfix en el siguiente ciclo normal
```

Nota: el hotfix va por PR igual que cualquier fix; la diferencia es el alcance reducido de los gates y la ausencia de gates no críticos antes del deploy.

### Análisis de potencial comercial (Growth)

```
[Para proyectos con interfaz de usuario o audiencia externa]
  → Jefe invoca Growth (modo consultor): análisis de potencial — 15-30 min
  → Growth entrega dictamen: 🟢 alto / 🟡 medio / 🟠 bajo / 🔴 sin potencial
  → Usuario decide:
      → Sin interés comercial: Growth no vuelve a intervenir; el flujo estándar continúa
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
  → Experimentación: diseña el plan (hipótesis, métricas, tamaño de muestra)
  → Experimentación verifica guardianes éticos (Responsabilidad Social si hay duda; Abogado si hay tracking nuevo)
  → [en paralelo] UX-UI: diseña las variantes | Frontend y/o Backend: implementan variantes + flag
  → DevOps: configura la feature flag y el rollout al % calculado
  → [experimento corre hasta alcanzar el tamaño de muestra — sin peeking]
  → Experimentación: analiza resultados y emite recomendación (ship/rollback/extender/iterar)
  → Jefe informa al usuario con la decisión y el aprendizaje
  → Si ship: DevOps activa la variante ganadora al 100% → Frontend y/o Backend limpian el código y la flag
  → Si rollback: DevOps revierte la flag al 0% → Frontend y/o Backend limpian el código de variantes → Tester ejecuta tests de regresión para verificar estabilidad
```

### Decisión de Arquitectura

```
Usuario plantea la pregunta o dilema
  → Arquitecto: analiza opciones, presenta trade-offs con recomendación
  → Usuario decide
  → Arquitecto documenta la decisión (ADR)
```

### Consulta Puntual

```
Usuario habla directamente con el agente especialista
El agente responde sin necesidad de pasar por el Jefe
```

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
- Eliminar archivos, ramas o datos
- Modificar configuración de infraestructura
- Cualquier acción con coste económico
- Cambios que afecten a sistemas compartidos o en producción

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
- Tipos: `feat/`, `fix/`, `hotfix/`, `refactor/`, `chore/`, `docs/`, `test/`
- Ejemplos: `feat/user-authentication`, `fix/null-pointer-checkout`, `chore/update-deps`

### Ramas protegidas
- `main` es la única rama permanente — nunca commits directos, siempre vía PR
- Las ramas de feature son de vida corta: días, no semanas
- Eliminar la rama tras el merge

### Merge strategy
- **Squash merge** al fusionar a `main` — historial limpio, un commit por feature
- El mensaje del squash commit sigue el formato estándar: `tipo: descripción breve`

### Pull Requests
- Usar la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`
- CI debe estar en verde antes de merge
- Todos los gates de calidad deben haber pasado antes de hacer merge (QA, Accesibilidad, Resp. Social, Seguridad, Documentación, Abogado)
- El PR se abre cuando el trabajo está listo para revisión final; el merge se hace solo con todos los gates aprobados

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

### Dónde vive la versión

- Manifiesto del proyecto: `package.json`, `pyproject.toml`, `Cargo.toml`, etc.
- Si no hay manifiesto: archivo `VERSION` en la raíz
- Git: tag `vX.Y.Z` en `main` en el commit exacto del release (`git tag vX.Y.Z && git push origin vX.Y.Z`)

Cuando hay duda sobre si un cambio es MINOR o MAJOR, el **Arquitecto** decide. Documentación propone el número de versión y actualiza el manifiesto; DevOps crea el tag en `main` con confirmación del Jefe.

---

## Versión del Scaffold

El archivo `.claude/scaffold.json` registra la versión del scaffold.

**En el repo scaffold:** define la versión actual del scaffold.
**En un proyecto creado desde el scaffold:** registra con qué versión se creó. No se modifica salvo al aplicar una migración.

### Actualizar un proyecto al scaffold más reciente

Cuando el scaffold evoluciona (nuevos agentes, estándares, templates), se publican prompts de migración en `.claude/migrations/`. Para aplicarlos:

1. Comprobar versión del proyecto: `cat .claude/scaffold.json`
2. Comprobar versión actual del scaffold: mismo archivo en el repo scaffold
3. Localizar los archivos de migración intermedios en `.claude/migrations/` del scaffold
4. Aplicar **en orden ascendente** (v1.1.0 antes que v1.2.0): copiar el contenido de cada prompt y pegarlo en Claude Code abierto en el proyecto
5. Claude aplica los cambios y actualiza `.claude/scaffold.json` con la nueva versión

Los prompts de migración son autocontenidos — no requieren contexto adicional del proyecto origen.
Ver `.claude/migrations/README.md` para instrucciones detalladas.

### Cuándo se crea una migración

Cada vez que el scaffold recibe mejoras significativas: el Jefe actualiza `.claude/scaffold.json`, añade una entrada en `.claude/SCAFFOLD_CHANGELOG.md` y escribe el prompt de migración en `.claude/migrations/vX.Y.Z.md`.

---

## Política de Dependencias

- **Lock files siempre en el repositorio**: `package-lock.json`, `poetry.lock`, `Gemfile.lock`, etc.
- **Versiones**: fijar major y minor, dejar patch libre (`~1.2.0`) o fijar exacto según el riesgo
- **Auditoría de seguridad**: ejecutar antes de cada release (el agente Seguridad lo hace)
- **Actualizaciones major**: requieren revisión del Arquitecto — pueden introducir breaking changes
- **Dependencias sin mantenimiento**: si el último release tiene más de 12 meses en un proyecto activo, señalar como riesgo
- **Añadir una dependencia nueva**: el agente implementador (Frontend o Backend) justifica frente a implementación propia si la funcionalidad es pequeña; si la dependencia tiene impacto arquitectónico significativo (nueva categoría, alternativa a algo ya usado, cambio de paradigma), consulta al Arquitecto antes de añadirla; el Abogado revisa la licencia en el gate pre-release

---

## Inicialización de Proyecto

Al crear un nuevo proyecto desde el scaffold, seguir el checklist en `.claude/project-init-checklist.md`. Cubre desde la definición del proyecto hasta el primer deploy a producción.

### Adoptar el scaffold en un proyecto existente

Si el proyecto ya existe y no nació del scaffold, usar el prompt de adopción en `.claude/adopt.md`:

1. Abre Claude Code en tu proyecto existente
2. Rellena el campo `SCAFFOLD_ORIGEN=` con la ruta local o URL de GitHub del scaffold
3. Copia y pega el contenido del prompt en el chat
4. Claude inventaria el proyecto, copia los agentes, adapta CLAUDE.md y pide confirmación antes de hacer el commit

La adopción preserva las convenciones existentes del proyecto y añade la capa de agentes sin sobreescribir nada.

---

## Internacionalización (i18n)

Todo proyecto es multiidioma desde el primer día. No es una feature que se añade después.

**Idiomas base obligatorios:** inglés (EN) y castellano (ES)
**Idioma por defecto de la interfaz:** inglés (EN)

### Reglas que aplican a todos los agentes

- Ningún string visible al usuario va hardcodeado en el código — siempre mediante clave i18n
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
- No se añaden abstracciones, patrones ni features no solicitadas
- No se crean documentos de planificación o análisis intermedios sin pedirlo
- El Jefe siempre resume los resultados en lenguaje no técnico para el usuario
- Los agentes se comunican entre sí de forma asíncrona; el Jefe coordina el orden

---

## Archivos Privados — No Desplegar

Los siguientes archivos y directorios son **internos al proceso de desarrollo** y nunca deben llegar al servidor, imagen Docker, bundle ni ningún artefacto desplegado:

| Ruta | Razón |
|---|---|
| `.claude/` | Configuración de agentes, scripts internos, logs de proceso |
| `CLAUDE.md` | Instrucciones de trabajo, estrategia interna |
| `.github/` | Templates de PR/issues, workflows de CI — solo para GitHub |
| `docs/` | ADRs, documentación interna de decisiones |
| `CHANGELOG.md` | Historial de versiones — visible en GitHub para usuarios, no necesario en el artefacto desplegado |

**Estos archivos deben estar en git** (Claude Code los necesita y son parte del flujo de trabajo). La exclusión ocurre en el momento del despliegue, no en `.gitignore`.

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

El script detecta si estamos en ventana sensible y ajusta automáticamente `GIT_AUTHOR_DATE` y `GIT_COMMITTER_DATE` a la víspera entre las 20:00 y las 22:59. Fuera de la ventana sensible, el commit se hace con la hora real.

### Push, PRs y deploys — timestamp NO modificable ⚠️

GitHub registra el push y la creación de PR con la hora real del servidor. Esto **no se puede cambiar**.

Antes de ejecutar cualquiera de estas acciones durante la ventana sensible, el agente responsable **debe**:

1. Informar al usuario de que la acción quedará registrada con hora real
2. Ofrecer dos opciones:
   - **Proceder igualmente** — se ejecuta ahora con timestamp real
   - **Postponer** — el agente anota la acción pendiente y espera instrucción explícita del usuario para ejecutarla

El agente no toma esta decisión por su cuenta. Siempre pregunta.

---

## Añadir Nuevos Agentes

Para incorporar un agente nuevo:
1. Crear `.claude/agents/<nombre>.md` siguiendo la estructura de los existentes
2. Actualizar la tabla de agentes y el diagrama de jerarquía en este documento
3. Definir cuándo y cómo se integra en los flujos existentes
