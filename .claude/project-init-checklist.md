# Checklist de Inicio de Proyecto

Usar este checklist al crear un proyecto nuevo desde el scaffold.
Completarlo en orden — cada paso prepara el terreno para el siguiente.
Cada paso nombra a su responsable en **negrita**; los pasos sin agente los coordina el **Jefe**.

---

## Paso 0 — Instanciar el proyecto (antes de todo)

El proyecto **no se crea clonando el repo scaffold**: un clon hereda el historial git del
scaffold, `.claude/SCAFFOLD_CHANGELOG.md`, `.claude/migrations/` y un `scaffold.json` con
`releasedAt` — señales que harían que el sistema tratara al proyecto como si fuera el propio
scaffold (ver el discriminador de contexto en `jefe.md`).

- [ ] **Usuario**: crear un repositorio nuevo (o abrir el proyecto existente) y abrir Claude Code en él
- [ ] **Usuario**: pegar el contenido de `.claude/sync.md` del repo scaffold — la adopción (MODO A) copia agentes, scripts, templates, CLAUDE.md y GitHub templates, y crea `.claude/scaffold.json` con `adoptedAt`
- [ ] Verificar: `.claude/scaffold.json` del proyecto contiene `adoptedAt` (no `releasedAt`), y NO existen `.claude/SCAFFOLD_CHANGELOG.md` ni `.claude/migrations/`
- [ ] Si a pesar de todo se partió de un clon del scaffold: eliminar `.claude/SCAFFOLD_CHANGELOG.md` y `.claude/migrations/`, cambiar `releasedAt` por `adoptedAt` en `.claude/scaffold.json`, y reiniciar el historial (`rm -rf .git && git init`)

**Excepción de bootstrap:** durante la inicialización (este checklist, hasta que se activa la
branch protection) los commits van directamente a `main` con `safe-commit.sh` — aún no hay
flujo de features. La regla "nunca commits directos a main" aplica desde que la branch
protection se activa. Aviso: el push inicial queda registrado con hora real — si se hace en
ventana sensible (lun–vie 08:00–19:00 Madrid), decidirlo con eso en mente.

---

## Día 0 — Antes de escribir una línea de código

### Definición del proyecto
- [ ] **Usuario + Jefe**: nombre del proyecto definido
- [ ] **Usuario + Jefe**: descripción en una frase: "Este proyecto es un [X] que [hace Y] para [quién]"
- [ ] **Usuario + Jefe**: audiencia objetivo identificada (tipo de usuarios, nivel técnico, geografías)
- [ ] **Usuario + Jefe**: mercados / jurisdicciones objetivo (determina qué regulación aplica al Abogado — si no se define, el Abogado asume España/UE como marco regulatorio por defecto)
- [ ] **Usuario + Jefe**: requisitos de disponibilidad: ¿el proyecto necesita SLA? (default: no, salvo que el usuario lo especifique) — si sí, definir objetivo de uptime e impacto aceptable de downtime; el Arquitecto definirá los SLOs correspondientes
- [ ] **Usuario + Jefe**: idiomas adicionales al EN + ES base (si aplican)
- [ ] Si el proyecto tiene interfaz de usuario o audiencia externa: invocar al **Growth** (modo consultor) para análisis de potencial comercial — el dictamen puede influir en el diseño y las specs antes de comprometerse con una dirección técnica

### Repositorio y acceso
- [ ] **Usuario**: repositorio creado en GitHub (o proveedor elegido), privado inicialmente. Antes de hacerlo público algún día: la carpeta `.claude/`, `CLAUDE.md`, `docs/` y el historial de PRs con sus checkboxes de gates (la maquinaria del scaffold) serían visibles en GitHub aunque nunca se desplieguen — el Jefe lo advierte y el usuario decide (ver "Archivos Privados" en CLAUDE.md)
- [ ] **Usuario**: accesos configurados (quién puede leer, escribir, administrar)
- [ ] Plantilla de PR e issue templates activas (llegan con la adopción del Paso 0: `.github/`)

### Stack y arquitectura
- [ ] Invocar al **Arquitecto** para definir el stack tecnológico → genera `docs/decisions/ADR-001-eleccion-de-stack.md` (o el siguiente número libre si la adopción ya creó un ADR). Nota: a Día 0 el Arquitecto trabaja sin specs del Analista Funcional — su input es la "Definición del proyecto" de arriba; la regla "Analista Funcional antes que Arquitecto" aplica a features, no a la inicialización
- [ ] **Arquitecto o DevOps** (según stack): crear el manifiesto del proyecto (`package.json`, `pyproject.toml`, `Cargo.toml` o `VERSION`) con la versión inicial `0.1.0` — fase de desarrollo `0.y.z` (ver Versionado en CLAUDE.md)
- [ ] Invocar al **DevOps** para diseñar el pipeline CI/CD y la estrategia de entornos
- [ ] Invocar al **Arquitecto** para definir la solución i18n (librería o nativa) y la estructura de claves
- [ ] **Frontend o Backend** (según el stack): implementar la solución i18n según el ADR
- [ ] **Frontend o Backend**: crear la estructura base de locales `/locales/en/` y `/locales/es/` — arrancan vacíos o con placeholders: los textos reales llegan con las primeras specs del Analista Funcional
- [ ] Si el proyecto tiene interfaz, invocar a **UX-UI** para definir el sistema de diseño base (paleta, tipografía, espaciado)

### Entornos y secretos
- [ ] **DevOps**: entornos creados: development, staging, production
- [ ] **DevOps**: variables de entorno definidas y documentadas en `.env.example`
- [ ] **DevOps**: secretos configurados en el gestor elegido (GitHub Secrets, Vault, etc.)
- [ ] **DevOps**: CI/CD pipeline configurado y verde con un commit de prueba
- [ ] **Usuario**: activar branch protection en `main` (requerir PR + CI verde) — este paso **cierra la excepción de bootstrap**: desde aquí, nunca commits directos a main (salvo los meta-archivos de proceso, ver "Estrategia de Ramas y PRs" en CLAUDE.md)

### Observabilidad base
- [ ] **DevOps**: error tracking configurado (Sentry o equivalente) — antes del primer deploy real
- [ ] **DevOps** (diseño) + **Backend** (implementación): logging estructurado
- [ ] **Backend**: health check endpoint (`/health`) — en proyectos sin servidor, omitir

### Documentación inicial
- [ ] **Documentación**: README creado con las secciones mínimas obligatorias (¿Qué es esto?, Stack, Requisitos previos, Instalación, Variables de entorno, Cómo ejecutar, Tests, Estructura del proyecto, Desplegar, Contribuir — ver agente Documentación para el detalle)
- [ ] **Documentación**: `CHANGELOG.md` creado con sección `[Unreleased]` (usar plantilla en `.claude/templates/CHANGELOG.md`)
- [ ] **Analista Funcional**: `docs/backlog.md` creado con el contexto inicial (plantilla en `.claude/templates/backlog.md`) — es su propietario: solo él lo crea y lo mantiene

### Legal y privacidad
- [ ] **Jefe**: invocar al **Abogado** en modo inicialización con el contexto completo (tipo de usuarios, mercados, datos que se tratarán, stack tecnológico, intención comercial presente o futura)
- [ ] **Abogado**: confirma qué regulación aplica y qué documentos legales serán necesarios (política de privacidad, ToS, etc.)
- [ ] **Abogado** determina la licencia adecuada (¿MIT, propietaria, source-available, dual? — depende de la intención comercial) y **Documentación** crea el fichero `LICENSE` con ella
- [ ] **Abogado**: valida el `LICENSE` **antes del primer push del repositorio** (o antes de hacerlo público, si nació privado) — ese es el "primer commit público". Cambiar la licencia retroactivamente es posible pero costoso: un `LICENSE` incorrecto desde el día 1 concede permisos difíciles de revocar
- [ ] **Abogado**: revisa las licencias de las dependencias principales del stack elegido y confirma compatibilidad con la licencia del proyecto

---

## Antes del primer deploy a producción

El primer deploy despliega el esqueleto funcional (estructura, i18n, health check) o la primera
feature si ya se construyó — los gates revisan lo que exista, acotados a ese alcance real.

- [ ] Invocar al **Tester** para que ejecute la suite completa de tests y emita informe sin fallos
- [ ] Todos los gates de release han pasado al menos una vez, acotados al alcance del primer deploy: QA, Seguridad, Accesibilidad, Responsabilidad Social, Documentación, Abogado
- [ ] **Documentación**: propone la versión del primer release (`0.1.0` si el manifiesto no ha cambiado) y renombra `[Unreleased]` en el changelog
- [ ] **DevOps**: verificar la exclusión de archivos privados del artefacto (`.claude/`, `CLAUDE.md`, `.github/`, `docs/`, `CHANGELOG.md`) según el mecanismo del deploy (.dockerignore, --exclude, ignore del proveedor), y que el artefacto construido no contiene referencias al scaffold, agentes o flujos internos
- [ ] **DevOps**: backups de base de datos configurados y testados (si hay BD)
- [ ] **DevOps**: alertas básicas configuradas (errores críticos, disponibilidad)
- [ ] **DevOps**: plan de rollback definido y documentado
- [ ] **Documentación**: README refleja el estado real del proyecto
- [ ] **DevOps**: ejecuta el deploy tras confirmación del usuario y crea el tag `v0.1.0` en `main` — recordar el aviso de ventana sensible para push/PR/deploy

---

## Definición de "inicializado"

El proyecto está inicializado cuando el **Jefe** verifica esta lista punto por punto — no de
memoria, confirmando cada uno con su responsable, igual que el checklist de cierre de features:

- [ ] `scaffold.json` con `adoptedAt`; sin `SCAFFOLD_CHANGELOG.md` ni `migrations/` heredados
- [ ] `LICENSE` creado y validado por el Abogado antes del primer push
- [ ] Manifiesto con versión `0.1.0` y tag `v0.1.0` creado tras el primer deploy
- [ ] CI verde y branch protection activa en `main`
- [ ] `/locales/en/` y `/locales/es/` existen y la solución i18n está implementada
- [ ] ADR de stack existe; `docs/backlog.md`, README y CHANGELOG creados
- [ ] Primer deploy ejecutado con los archivos privados excluidos del artefacto

---

## Notas del proyecto

<!-- Usar esta sección para capturar decisiones o contexto específico
     de este proyecto que no encaja en un ADR formal -->
