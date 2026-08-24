# ADR-004: Adopción del Scaffold de Agentes Claude

**Fecha:** 2026-07-16
**Estado:** Aceptado
**Decidido por:** Usuario

## Contexto
Este proyecto adopta el scaffold de agentes Claude v1.21.0 para estandarizar
el flujo de desarrollo con un equipo de agentes especializados.

ADR creado retroactivamente durante la actualización a v1.21.0.

## Decisión
Se incorporan los 17 agentes del scaffold (.claude/agents/), el script safe-commit.sh
para control de timestamps, y los flujos de trabajo documentados en CLAUDE.md.
Las convenciones pre-existentes del proyecto se preservan; el scaffold añade la capa
de agentes y flujos sin sobreescribir la configuración existente.

## Consecuencias
- Los commits usan `.claude/scripts/safe-commit.sh` para control de visibilidad de
  actividad en GitHub (en repos públicos, lun–vie 08–19h Madrid → timestamp ajustado;
  en repos privados no hay exposición que evitar y se committea con hora real)
- Para futuras actualizaciones: pegar `.claude/sync.md` en Claude Code abierto en el
  proyecto detecta automáticamente la versión y sincroniza a la última
- `.claude/scaffold.json` registra la versión adoptada para seguimiento

## Alternativas consideradas
- Desarrollo sin scaffold (flujo ad-hoc): descartado — sin gates ni roles definidos
