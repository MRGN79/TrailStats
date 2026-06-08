# Scaffold — Prompt de Adopción para Proyectos Existentes

Este archivo contiene el prompt que debes pegar en Claude Code abierto en tu proyecto existente.

## Cómo usarlo

1. Abre Claude Code **en tu proyecto existente** (no en el repo del scaffold)
2. Localiza la línea `SCAFFOLD_ORIGEN=` al inicio del prompt
3. Rellena el valor con la ubicación del scaffold:
   - Ruta local si lo tienes clonado: `SCAFFOLD_ORIGEN=ruta:/home/tu-usuario/scaffold`
   - URL de GitHub si quieres clonarlo: `SCAFFOLD_ORIGEN=github:https://github.com/tu-usuario/scaffold`
4. Copia todo el contenido desde `--- INICIO DEL PROMPT ---` hasta el final del archivo
5. Pégalo en el chat de Claude Code y espera — Claude hará todo automáticamente y pedirá confirmación antes de hacer el commit

---

--- INICIO DEL PROMPT ---

SCAFFOLD_ORIGEN=[rellena aquí antes de pegar: ruta:/ruta/local o github:https://github.com/...]

Adopta el scaffold de agentes Claude en este proyecto existente siguiendo estas fases en orden.

---

## FASE 1 — Acceder al scaffold

Lee el valor de `SCAFFOLD_ORIGEN` de la primera línea de este mensaje.

- Si empieza con `ruta:`, usa esa ruta como `SCAFFOLD_DIR`
- Si empieza con `github:`, clona el repo en `/tmp/scaffold-adoption` con `git clone [url] /tmp/scaffold-adoption --depth=1` y usa `/tmp/scaffold-adoption` como `SCAFFOLD_DIR`

Verifica que `$SCAFFOLD_DIR/.claude/agents/` existe antes de continuar. Si no existe, detente e informa al usuario.

Verifica también que el proyecto actual tiene `.git/` (ejecuta `ls .git/`). Si no existe, inicializa git con `git init && git add . && git commit -m "chore: commit inicial previo a adopción del scaffold"` antes de continuar — la adopción requiere git para poder hacer el commit final.

---

## FASE 2 — Inventario del proyecto actual

Lee y registra:

1. **Stack tecnológico**: busca en la raíz `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, `composer.json`. Si hay `package.json`, lee el campo `dependencies` para identificar el framework principal.
2. **Estado de .claude/**: ¿existe? ¿tiene agents/? ¿tiene scripts/? ¿tiene settings.json?
3. **CLAUDE.md**: ¿existe? Si existe, léelo completo.
4. **Convenciones de ramas**: ejecuta `git log --oneline -10` y `git branch -r | head -20` para detectar naming conventions existentes.
5. **CI/CD**: ¿existe `.github/workflows/`? ¿Qué archivos hay?
6. **PR template**: ¿existe `.github/PULL_REQUEST_TEMPLATE.md`?
7. **Docker**: ¿existe `.dockerignore`?
8. **Documentación**: ¿existe `docs/`? ¿Tiene ADRs (`docs/decisions/` o similar)?
9. **Versión**: ¿hay `package.json`, `pyproject.toml` u otro manifiesto con versión?

---

## FASE 3 — Copiar agentes

Crea `.claude/agents/` si no existe.

Para cada archivo `.md` en `$SCAFFOLD_DIR/.claude/agents/`:
- Si NO existe ya un archivo con ese nombre en `.claude/agents/`: cópialo
- Si YA existe: omítelo y añádelo a la lista de omitidos

Al final de la fase, informa qué agentes se copiaron y cuáles se omitieron por ya existir.

---

## FASE 4 — Scripts e infraestructura

1. Crea `.claude/scripts/` si no existe
2. Copia `$SCAFFOLD_DIR/.claude/scripts/safe-commit.sh` → `.claude/scripts/safe-commit.sh`
3. Ejecuta `chmod +x .claude/scripts/safe-commit.sh`
4. Si no existe `.claude/pending-actions.md`:
   ```
   # Acciones Pendientes
   ```
5. Si no existe `.claude/scaffold-suggestions.md`:
   ```
   # Sugerencias para el Scaffold
   ```
6. Copia `$SCAFFOLD_DIR/.claude/migrations/` completo (README.md + todos los vX.Y.Z.md) a `.claude/migrations/`
   - Si ya existe `.claude/migrations/`, añade solo los ficheros que no estén
7. Copia `$SCAFFOLD_DIR/.claude/templates/` completo a `.claude/templates/`
   - Si ya existe `.claude/templates/`, añade solo los ficheros que no estén
   - Estos son la plantilla ADR (usada por el Arquitecto) y la plantilla CHANGELOG (usada en la inicialización del proyecto)

---

## FASE 5 — settings.json

**Si no existe `.claude/settings.json`**: copia `$SCAFFOLD_DIR/.claude/settings.json` directamente.

**Si ya existe `.claude/settings.json`**:
- Lee ambos archivos
- Preserva todas las permissions y hooks del archivo existente
- Añade del scaffold solo los campos y entradas de hooks que no estén ya presentes
- Si `hooks` es un array en ambos, fusiona sin duplicar
- Si hay hooks con el mismo nombre pero valores diferentes, advierte al usuario sobre el conflicto y pregunta cuál mantener — en particular, si el proyecto tiene un hook `git-commit` distinto a `.claude/scripts/safe-commit.sh`, recomienda usar `safe-commit.sh` para control de timestamps (ver sección "Visibilidad de Actividad en GitHub" en CLAUDE.md)

---

## FASE 6 — CLAUDE.md

**Si NO existe `CLAUDE.md` en el proyecto**:
Copia `$SCAFFOLD_DIR/CLAUDE.md` directamente. Luego edita la sección **Estándares Generales** para mencionar el stack detectado en FASE 2 si es relevante.

**Si YA existe `CLAUDE.md` en el proyecto**:
Lee el CLAUDE.md del proyecto y el del scaffold. Añade al final del CLAUDE.md del proyecto las secciones del scaffold que no estén ya presentes (aunque sean con otro nombre o formato):

- Sistema de Agentes (tabla de 17 agentes)
- Jerarquía y Relaciones (diagrama de árbol)
- Flujos de Trabajo Estándar (Nueva Feature, Bug Fix, Hotfix, Análisis de potencial comercial, Experimento, Decisión de Arquitectura, Consulta Puntual)
- Reglas de Autonomía
- La Regla del Abogado
- Versión del Scaffold
- Internacionalización (i18n)
- Archivos Privados — No Desplegar
- Visibilidad de Actividad en GitHub

Para **Estrategia de Ramas y PRs** y **Versionado (SemVer)**: añade solo si el proyecto no tiene ya una estrategia definida. Si tiene una, respétala y omite estas secciones. Si en FASE 2 detectaste convenciones de ramas existentes (output de `git branch -r`), documéntalas explícitamente en la sección "Nomenclatura de ramas" en lugar de copiar el default del scaffold.

Preserva siempre el contenido original del CLAUDE.md existente íntegro — solo añades, nunca eliminas ni modificas lo que ya había.

---

## FASE 7 — scaffold.json

Crea `.claude/scaffold.json`:
```json
{
  "scaffoldVersion": "1.4.0",
  "adoptedAt": "[fecha de hoy en formato YYYY-MM-DD]"
}
```

---

## FASE 8 — Templates de GitHub

**PR template**: si no existe `.github/PULL_REQUEST_TEMPLATE.md`:
- Crea `.github/` si no existe
- Copia `$SCAFFOLD_DIR/.github/PULL_REQUEST_TEMPLATE.md`

**Issue templates**: si no existe `.github/ISSUE_TEMPLATE/`:
- Copia `$SCAFFOLD_DIR/.github/ISSUE_TEMPLATE/` completo

Si ya existen, no los modifiques.

---

## FASE 9 — .dockerignore

Si existe `.dockerignore` en el proyecto, añade al final las entradas que no estén ya presentes:
```
.claude/
CLAUDE.md
docs/
```

Si no existe `.dockerignore`, créalo con esas tres entradas.

---

## FASE 10 — ADR de adopción

Determina el directorio de ADRs: busca `docs/decisions/`, `docs/adr/`, `adr/` en ese orden. Si ninguno existe pero sí hay un directorio `docs/`, crea `docs/decisions/`. Si no hay `docs/`, omite este paso.

Crea `[directorio-adr]/[fecha-hoy]-adopcion-scaffold.md`:

```markdown
# ADR: Adopción del Scaffold de Agentes Claude

**Fecha:** [fecha de hoy]
**Estado:** Aceptado

## Contexto

Este proyecto adopta el scaffold de agentes Claude v1.4.0 para estandarizar
el flujo de desarrollo con un equipo de agentes especializados.

## Decisión

Se incorporan los 17 agentes del scaffold (.claude/agents/), el script
safe-commit.sh para control de timestamps, y los flujos de trabajo
documentados en CLAUDE.md.

Las convenciones pre-existentes del proyecto se preservan; el scaffold
añade la capa de agentes y flujos sin sobreescribir la configuración existente.

## Agentes disponibles tras la adopción

Jefe, Analista Funcional, Arquitecto, UX-UI, Maquetador, Frontend,
Experimentación, Growth, Backend, Tester, QA, Accesibilidad, Responsabilidad Social,
Seguridad, DevOps, Documentación, Abogado.

## Consecuencias

- Los commits usan `.claude/scripts/safe-commit.sh` para control de
  visibilidad de actividad en GitHub (lun–vie 08–19h Madrid → timestamp ajustado)
- Las futuras mejoras del scaffold se aplican mediante los prompts de
  migración en `.claude/migrations/`
- `.claude/scaffold.json` registra la versión adoptada para seguimiento de migraciones
```

---

## FASE 11 — Resumen y commit

Antes de hacer el commit, muestra al usuario un resumen completo:

```
## Resumen de la adopción

### Archivos creados
[lista]

### Archivos copiados desde el scaffold
[lista]

### Archivos omitidos (ya existían)
[lista]

### CLAUDE.md
[creado desde cero / fusionado con el existente — secciones añadidas: ...]

### Advertencias
[cualquier cosa que el usuario deba revisar manualmente]
```

Espera confirmación explícita del usuario ("sí", "ok", "confirma", etc.) antes de hacer el commit.

Una vez confirmado, ejecuta:
```bash
git add .claude/ CLAUDE.md .github/ .dockerignore
.claude/scripts/safe-commit.sh -m "chore: adoptar scaffold v1.4.0"
```

Si se clonó el scaffold desde GitHub, limpia el directorio temporal:
```bash
rm -rf /tmp/scaffold-adoption
```

Informa al usuario que la adopción está completa y que puede empezar a invocar los agentes desde Claude Code.
