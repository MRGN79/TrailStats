# Scaffold — Sincronización de Proyecto (Adopción o Actualización)

Punto de entrada único para incorporar el scaffold de agentes Claude en cualquier
proyecto o actualizarlo a la última versión desde cualquier versión anterior.

## Cómo usarlo

1. Abre Claude Code **en tu proyecto** (tenga o no el scaffold instalado ya)
2. Copia todo el contenido desde `--- INICIO DEL PROMPT ---` hasta el final del archivo
3. Pégalo en el chat de Claude Code — Claude detecta automáticamente si necesitas adopción
   o actualización, aplica los cambios y pide confirmación antes de hacer el commit

---

--- INICIO DEL PROMPT ---

SCAFFOLD_ORIGEN=github:https://github.com/MRGN79/scaffold

Sincroniza este proyecto con el scaffold de agentes Claude. El prompt detecta
automáticamente si el proyecto necesita adopción completa (primera vez) o actualización
a la última versión, y ejecuta el proceso que corresponda.

---

## FASE 1 — Acceder al scaffold y detectar el modo

**Salvaguarda — no ejecutar dentro del propio repo scaffold:** antes de nada, comprueba el
directorio actual. Si el `.claude/scaffold.json` local **NO contiene `adoptedAt`** y además
contiene `releasedAt` o existe `.claude/SCAFFOLD_CHANGELOG.md`, este repo ES el scaffold (o un
clon intacto de él) — detente inmediatamente e informa: "Estás en el repositorio scaffold o en
un clon sin adoptar. Este prompt es para sincronizar proyectos; ejecutarlo aquí destruiría el
changelog y el manifiesto del scaffold. Si esto es un proyecto que nació de un clon, sigue el
Paso 0 de `.claude/project-init-checklist.md` (limpieza manual) y vuelve a ejecutar este prompt."
No continúes bajo ninguna interpretación.

Si el `scaffold.json` local **SÍ contiene `adoptedAt`**, es un proyecto — continúa aunque arrastre
residuos de clon (`releasedAt` duplicado, `SCAFFOLD_CHANGELOG.md`): la limpieza de FASE 2 los
corregirá.

Lee el valor de `SCAFFOLD_ORIGEN` de la primera línea de este mensaje.

- Si empieza con `ruta:`, usa esa ruta como `SCAFFOLD_DIR`
- Si empieza con `github:`, clona el repo en `/tmp/scaffold-sync` con
  `git clone [url] /tmp/scaffold-sync --depth=1` y usa `/tmp/scaffold-sync` como `SCAFFOLD_DIR`

Verifica que `$SCAFFOLD_DIR/.claude/agents/` existe antes de continuar. Si no existe,
detente e informa al usuario.

Lee `$SCAFFOLD_DIR/.claude/scaffold.json` y guarda el valor de `scaffoldVersion`
como `SCAFFOLD_VERSION`.

Verifica que el proyecto actual tiene `.git/`. Si no existe, inicializa git con
`git init && git add . && git commit -m "chore: commit inicial previo a sincronización del scaffold"`
antes de continuar.

**Determina el modo:**
- Si **NO** existe `.claude/scaffold.json` en la raíz del proyecto → **MODO A: ADOPCIÓN COMPLETA**
- Si **SÍ** existe `.claude/scaffold.json` → lee `scaffoldVersion` como `PROJECT_VERSION`:
  - Si `PROJECT_VERSION` == `SCAFFOLD_VERSION` → el proyecto ya está al día; informa al usuario
    y detente
  - Si `PROJECT_VERSION` != `SCAFFOLD_VERSION` → **MODO B: ACTUALIZACIÓN**

---

## FASE 2 — Sincronizar archivos del scaffold *(ambos modos)*

Estos archivos son responsabilidad del scaffold. Se copian o sobreescriben siempre —
no hay versiones personalizadas en el proyecto; si el proyecto necesitara modificarlos
debe forkear el scaffold.

### Agentes
Crea `.claude/agents/` si no existe. Para cada archivo `.md` en
`$SCAFFOLD_DIR/.claude/agents/`: copia al proyecto, sobreescribiendo si ya existe.

### Scripts
Copia `$SCAFFOLD_DIR/.claude/scripts/safe-commit.sh` → `.claude/scripts/safe-commit.sh`
(crea `.claude/scripts/` si no existe). Ejecuta `chmod +x .claude/scripts/safe-commit.sh`.

### Templates
Crea `.claude/templates/` si no existe. Para cada archivo en
`$SCAFFOLD_DIR/.claude/templates/`: copia al proyecto, sobreescribiendo si ya existe.

### Checklist de inicialización
Copia `$SCAFFOLD_DIR/.claude/project-init-checklist.md` → `.claude/project-init-checklist.md`
(sobreescribe).

### El propio prompt de sincronización
Copia `$SCAFFOLD_DIR/.claude/sync.md` → `.claude/sync.md` (sobreescribe). Así el proyecto
siempre tiene la versión actual del prompt para la próxima sincronización.

### Limpieza de artefactos de versiones anteriores *(solo MODO B)*
Elimina, si existen, los mecanismos obsoletos de versiones antiguas del scaffold:
- `.claude/adopt.md` (mecanismo de adopción pre-v1.8, reemplazado por este archivo)
- `.claude/migrations/` (directorio completo — las migraciones incrementales ya no existen;
  este prompt sincroniza siempre al estado actual)
- `.claude/SCAFFOLD_CHANGELOG.md` (pertenece solo al repo scaffold — si está en el proyecto,
  llegó por un clon del scaffold y confunde al discriminador de contexto de jefe.md)
- Si `.claude/scaffold.json` del proyecto lleva `releasedAt` (señal de clon del scaffold),
  reemplázalo por `adoptedAt` con la fecha de hoy

---

## FASE 3 — Sincronizar CLAUDE.md *(ambos modos)*

**Si NO existe `CLAUDE.md` en el proyecto:**
Copia `$SCAFFOLD_DIR/CLAUDE.md` directamente.

**Si YA existe `CLAUDE.md` en el proyecto:**

1. Lee el CLAUDE.md del proyecto y el del scaffold
2. Localiza los marcadores que delimitan el bloque scaffold:
   - Inicio: línea que contenga exactamente `<!-- SCAFFOLD:START -->`
   - Fin: línea que contenga exactamente `<!-- SCAFFOLD:END -->`
   - Todo lo que está fuera de esos marcadores es contenido del proyecto — preservar íntegro
3. Si los marcadores **existen** en el CLAUDE.md del proyecto:
   Reemplaza el bloque completo entre `<!-- SCAFFOLD:START -->` y `<!-- SCAFFOLD:END -->` (ambos
   marcadores incluidos) con el bloque equivalente del scaffold actual
4. Si los marcadores **no existen** pero sí existe la línea `## Sistema de Agentes`
   (proyecto adoptado con una versión anterior del scaffold):
   - El bloque scaffold legacy empieza en `## Sistema de Agentes` y termina al final de la
     sección `## Añadir Nuevos Agentes` (es decir: en la línea anterior al siguiente
     encabezado `## ` que aparezca después de ella, o al final del archivo si no hay más).
     **Todo lo que haya después de ese punto es contenido del proyecto — presérvalo íntegro**
   - Reemplaza solo ese rango con el bloque scaffold actual (incluyendo los marcadores
     `<!-- SCAFFOLD:START -->` y `<!-- SCAFFOLD:END -->`)
   - Si tienes dudas sobre dónde termina el bloque legacy (secciones renombradas, contenido
     mezclado), muestra al usuario el rango que vas a reemplazar y pide confirmación antes
5. Si no existen ni los marcadores ni `## Sistema de Agentes` (el proyecto tiene un
   CLAUDE.md propio sin scaffold — el caso normal en una adopción):
   - **No reemplaces nada.** Añade al final del CLAUDE.md del proyecto un separador `---`
     y el bloque scaffold completo envuelto en sus marcadores
   - Todo el contenido previo del proyecto queda intacto por encima del bloque

El resultado: el proyecto conserva su contenido propio (antes de `<!-- SCAFFOLD:START -->` y
después de `<!-- SCAFFOLD:END -->`) y recibe la versión más reciente del bloque scaffold,
incluyendo cualquier sección nueva añadida desde la última sincronización.

Nota: el contenido fuera de los marcadores (título del proyecto, sección Filosofía, contexto de
negocio) es deliberadamente propiedad del proyecto — no se sincroniza nunca en actualizaciones,
solo llega con la copia inicial en adopciones sin CLAUDE.md previo.

**Detección de contradicciones de proceso:** tras fusionar, revisa el contenido propio del
proyecto (fuera de los marcadores). Si contiene instrucciones de proceso que contradicen el
bloque scaffold — commits directos a `main`, trabajar sin ramas, otro formato de mensajes de
commit, deploys sin gates, "no usar PRs" — **no las edites** (son del proyecto), pero lístalas
en la sección Advertencias del resumen de FASE 7 para que el usuario las reconcilie. Mientras
convivan, en materia de proceso prevalece el bloque scaffold (ver "El Contrato de este Bloque"
al inicio del bloque).

---

## FASE 4 — Sincronizar settings.json *(ambos modos)*

**Si no existe `.claude/settings.json`:** copia `$SCAFFOLD_DIR/.claude/settings.json` directamente.

**Si ya existe `.claude/settings.json`:**
- Lee ambos archivos
- Preserva todas las permissions y hooks del archivo existente del proyecto
- Añade del scaffold solo los campos y entradas de hooks que no estén ya presentes
- **Hooks del scaffold**: los hooks cuyo comando contiene la marca `# scaffold-hook` son del
  scaffold — sobreescríbelos siempre con la versión actual del scaffold, sin preguntar (así las
  correcciones de hooks llegan a los proyectos). Los hooks sin esa marca son del proyecto y se
  preservan intactos
- **Deduplicación de versiones pre-marca**: los proyectos adoptados con scaffold ≤ v1.10 tienen
  el hook del scaffold SIN la marca. Antes de añadir un hook del scaffold, elimina cualquier hook
  existente del mismo evento cuyo comando referencie `pending-actions.md` — es la versión antigua
  del mismo hook, no un hook del proyecto. Así no quedan dos avisos duplicados
- Si hay hooks del proyecto (sin marca y sin relación con `pending-actions.md`) con el mismo
  evento y comando parecido a uno del scaffold, advierte al usuario sobre la posible duplicidad
  y pregunta cuál mantener
- Si el proyecto tiene algún mecanismo propio de commit (hook, alias o script) que no pase por
  `.claude/scripts/safe-commit.sh`, recomienda usar `safe-commit.sh` para el control de timestamps
  (ver sección "Visibilidad de Actividad en GitHub" en CLAUDE.md) — el scaffold no lo fuerza con
  un hook, es una convención documentada

---

## FASE 5 — Infraestructura compartida *(ambos modos, salvo donde se indica)*

1. Si no existe `.claude/pending-actions.md`: crea el archivo con el contenido `# Acciones Pendientes`

2. Si no existe `.claude/scaffold-suggestions.md`: crea el archivo con el contenido `# Sugerencias para el Scaffold`

3. **PR template**: copia `$SCAFFOLD_DIR/.github/PULL_REQUEST_TEMPLATE.md` →
   `.github/PULL_REQUEST_TEMPLATE.md`, **sobreescribiendo si existe** (crea `.github/` si no
   existe). Es un archivo gestionado por el scaffold — las mejoras de versiones nuevas deben
   llegar también a los proyectos que actualizan

4. **Issue templates**: copia `$SCAFFOLD_DIR/.github/ISSUE_TEMPLATE/` completo →
   `.github/ISSUE_TEMPLATE/`, sobreescribiendo los archivos del scaffold si existen
   (los templates propios del proyecto con otros nombres se preservan)

5. **.dockerignore**: si existe, añade al final las entradas faltantes (las cinco rutas de la
   sección "Archivos Privados — No Desplegar" de CLAUDE.md):
   ```
   .claude/
   CLAUDE.md
   .github/
   docs/
   CHANGELOG.md
   ```
   Si no existe, créalo con esas cinco entradas. Nunca elimines entradas propias del proyecto —
   solo añade las que falten. Aplica en ambos modos: las versiones antiguas del scaffold
   generaban solo 3 entradas y la actualización debe completarlas

6. **ADR de adopción** *(solo MODO A)*: busca directorio de ADRs (`docs/decisions/`, `docs/adr/`,
   `adr/`). Si no existe ninguno, crea `docs/decisions/` (crea también `docs/` si hace falta —
   el proyecto lo va a necesitar de todos modos para backlog y ADRs).
   Crea el ADR con la numeración secuencial estándar: `ADR-001-adopcion-scaffold.md` si no hay
   ningún ADR previo, o el siguiente número libre si ya existen. Usa la estructura de la
   plantilla `.claude/templates/adr.md`:

   ```markdown
   # ADR-NNN: Adopción del Scaffold de Agentes Claude

   **Fecha:** [fecha de hoy]
   **Estado:** Aceptado
   **Decidido por:** [usuario]

   ## Contexto
   Este proyecto adopta el scaffold de agentes Claude v[SCAFFOLD_VERSION] para estandarizar
   el flujo de desarrollo con un equipo de agentes especializados.

   ## Decisión
   Se incorporan los 17 agentes del scaffold (.claude/agents/), el script safe-commit.sh
   para control de timestamps, y los flujos de trabajo documentados en CLAUDE.md.
   Las convenciones pre-existentes del proyecto se preservan; el scaffold añade la capa
   de agentes y flujos sin sobreescribir la configuración existente.

   ## Consecuencias
   - Los commits usan `.claude/scripts/safe-commit.sh` para control de visibilidad de
     actividad en GitHub (lun–vie 08–19h Madrid → timestamp ajustado)
   - Para futuras actualizaciones: pegar `.claude/sync.md` en Claude Code abierto en el
     proyecto detecta automáticamente la versión y sincroniza a la última
   - `.claude/scaffold.json` registra la versión adoptada para seguimiento

   ## Alternativas consideradas
   - Desarrollo sin scaffold (flujo ad-hoc): descartado — sin gates ni roles definidos
   ```

---

## FASE 6 — Actualizar scaffold.json

**En MODO A:** crea `.claude/scaffold.json`:
```json
{
  "scaffoldVersion": "[SCAFFOLD_VERSION]",
  "adoptedAt": "[fecha de hoy en formato YYYY-MM-DD]"
}
```

**En MODO B:** actualiza `.claude/scaffold.json` — conserva el resto de campos existentes
(p. ej. `adoptedAt`) y actualiza solo `scaffoldVersion` a `[SCAFFOLD_VERSION]`.

**En ambos modos:** si existe `docs/backlog.md` con la línea `**Versión actual:**`, actualiza
la parte `scaffold A.B.C` de esa línea a `scaffold [SCAFFOLD_VERSION]` (formato combinado
`X.Y.Z — scaffold A.B.C`; la parte `X.Y.Z` del proyecto no se toca).

---

## FASE 7 — Resumen y commit

Antes del commit, muestra al usuario un resumen:

**En MODO A:**
```
## Resumen de la adopción — scaffold v[SCAFFOLD_VERSION]

### Archivos creados o copiados desde el scaffold
[lista detallada]

### CLAUDE.md
[creado desde cero / fusionado — indica qué secciones se añadieron]

### Advertencias
[conflictos en settings.json u otras personalizaciones que el usuario deba revisar;
instrucciones del CLAUDE.md propio del proyecto que contradicen el proceso del scaffold (FASE 3)]
```

**En MODO B:**
```
## Resumen de la actualización — v[PROJECT_VERSION] → v[SCAFFOLD_VERSION]

### Archivos sincronizados (sobrescritos con versión actual del scaffold)
[lista: agentes, scripts, templates, project-init-checklist.md, sync.md, PR/issue templates]

### Limpieza y completado
[artefactos obsoletos eliminados (adopt.md, migrations/); entradas añadidas a .dockerignore]

### CLAUDE.md
[bloque scaffold actualizado entre <!-- SCAFFOLD:START --> y <!-- SCAFFOLD:END -->; contenido del proyecto preservado]

### Advertencias
[conflictos detectados en settings.json u otras personalizaciones;
instrucciones del CLAUDE.md propio del proyecto que contradicen el proceso del scaffold (FASE 3)]
```

Espera confirmación explícita del usuario ("sí", "ok", "confirma", etc.) antes de hacer el commit.

Una vez confirmado:

**En MODO A:**
```bash
git add .claude/ CLAUDE.md .github/ .dockerignore docs/
.claude/scripts/safe-commit.sh -m "chore: adoptar scaffold v[SCAFFOLD_VERSION]"
```

**En MODO B:**
```bash
git add -A
.claude/scripts/safe-commit.sh -m "chore: actualizar scaffold de v[PROJECT_VERSION] a v[SCAFFOLD_VERSION]"
```

Limpia el directorio temporal si se clonó desde GitHub:
```bash
rm -rf /tmp/scaffold-sync
```

---

## FASE 8 — Activación del workflow *(ambos modos)*

La sincronización no termina con el commit. Desde este momento el proyecto se rige por los
flujos del bloque scaffold de CLAUDE.md — y eso incluye **el resto de esta misma sesión**.

1. **Para ti, Claude, en esta sesión:** el CLAUDE.md que cargaste al arrancar no incluía el
   bloque scaffold (o incluía una versión anterior). Lee ahora el bloque recién escrito
   (entre `<!-- SCAFFOLD:START -->` y `<!-- SCAFFOLD:END -->`) y trátalo como vinculante para
   toda petición posterior de esta sesión: cualquier modificación de archivos del proyecto es
   trabajo de flujo (rama `tipo/descripcion` + gates + veredicto del Abogado), los commits van
   con `.claude/scripts/safe-commit.sh`, y nada se marca como listo sin el Abogado. No existe
   un periodo de gracia entre la sincronización y la primera sesión nueva.

2. **Limitación de esta sesión:** los subagentes de `.claude/agents/` se registran al inicio
   de sesión — en esta sesión probablemente aún no sean invocables (en MODO B, los ya
   existentes siguen cargados con su definición anterior). Si el usuario pide trabajo de flujo
   antes de reiniciar, **no lo ejecutes de forma ad-hoc saltándote el flujo**: explícale que
   los agentes se activan al abrir una sesión nueva y recomiéndale reiniciar. Si la plataforma
   sí permite invocar los agentes recién copiados sin reiniciar, procede por el flujo normal.

3. **Mensaje final al usuario** — informa de que la sincronización está completa e incluye
   explícitamente estos dos puntos:
   - Desde este momento, todo el trabajo del proyecto sigue los flujos del scaffold (ramas,
     gates de calidad, revisión legal del Abogado). Ningún cambio, por pequeño que sea, se
     hace ya "directamente".
   - Conviene reiniciar la sesión de Claude Code para activar los agentes; en la sesión nueva,
     basta con pedir lo que se necesite y el Jefe orquestará el flujo.
