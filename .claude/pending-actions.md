# Acciones Pendientes

<!--
Formato para añadir una entrada:
  checkbox-vacío AAAA-MM-DD HH:MM | tipo | detalle
  tipo: push · PR · deploy · otro

Para marcar como completado: cambiar checkbox vacío por checkbox marcado.
Los agentes escriben aquí cuando difieren una acción por horario sensible u otro motivo.
-->

## Cierre de Summit Fase 1 (v0.13.0) — pasos administrativos diferidos

La feature "Summit — Fase 1" (v0.13.0) está mergeada (PR #38) y desplegada en producción
(https://mrgn79.github.io/TrailStats/). Quedaron dos pasos administrativos bloqueados en el
remoto; el usuario los ejecutará más adelante desde su propia máquina o la web de GitHub.

- [ ] 2026-07-18 08:13 | push (tag) | Crear y pushear el tag de release v0.13.0 sobre el commit mergeado.
      Comandos:
        git tag v0.13.0 1921285fadba1c5bd0caf5ead325d7c5da109d37
        git push origin v0.13.0
      (Alternativa web: GitHub → Releases → Draft a new release → tag v0.13.0 apuntando a ese commit.)
- [ ] 2026-07-18 08:13 | otro (limpieza) | Borrar la rama remota `feat/summit-ui-phase1`, ya mergeada en la PR #38.
      Comando:
        git push origin --delete feat/summit-ui-phase1
      (Alternativa web: GitHub → Branches → eliminar `feat/summit-ui-phase1`.)

**Nota lateral (DevOps) — sin acción inmediata:** la rama `main` no tiene *branch protection*
activada en GitHub. No bloquea nada ahora, pero conviene revisarlo a futuro (exigir PR + CI verde
antes de merge a `main`) para alinear con la Estrategia de Ramas del proyecto.
