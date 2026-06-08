# Migraciones del Scaffold

Cada archivo de este directorio es un prompt autocontenido para actualizar
un proyecto existente cuando el scaffold lanza una nueva versión.

## Cómo actualizar un proyecto al scaffold más reciente

1. Comprueba la versión de tu proyecto: abre `.claude/scaffold.json` → `scaffoldVersion`
2. Comprueba la versión actual del scaffold: abre `.claude/scaffold.json` en el repo scaffold
3. Si hay diferencia, localiza los archivos de migración intermedios en `.claude/migrations/`
4. Aplícalos **en orden ascendente** (v1.1.0 antes que v1.2.0)
5. Para cada uno: copia el contenido completo y pégalo en Claude Code abierto en tu proyecto
6. Claude aplicará los cambios automáticamente y actualizará `.claude/scaffold.json`

## Formato de los archivos

Un archivo por versión: `vMAJOR.MINOR.PATCH.md`

Cada archivo es un prompt listo para ejecutar — no requiere contexto adicional.
El Jefe puede coordinar la aplicación si se le proporciona el contenido de los prompts.

## Qué versión tiene mi proyecto

```bash
cat .claude/scaffold.json
```

## Cuándo se crea una migración

Cada vez que el scaffold recibe mejoras significativas (agentes nuevos, estándares
nuevos, scripts, templates), se crea un archivo de migración y se actualiza la
versión en `.claude/scaffold.json` y en `SCAFFOLD_CHANGELOG.md`.
