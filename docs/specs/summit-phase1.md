# TrailStats — Especificación Funcional: Rediseño "Summit — Fase 1"

**Autor:** Analista Funcional
**Estado:** Aprobado para implementación
**Fecha:** 2026-07-16
**Rama:** `feat/summit-ui-phase1`
**Depende de:** MVP (`docs/specs/mvp-trailstats.md`) y diseño UX/UI (`docs/design/ui-spec.md`)

---

## 1. Objetivo

Evolucionar la identidad visual actual de TrailStats (papel cálido + verde abeto + ámbar)
hacia una experiencia **más motivadora, única y con "efecto wow"**, sin cambiar la
funcionalidad ni el modelo de datos. El usuario (dueño) ya eligió la dirección **"Summit"**
y ha acotado esta entrega a la **Fase 1**.

La Fase 1 se centra en **cómo aparecen y cómo se sienten los datos que ya calculamos**: no
introduce métricas nuevas, no toca el parseo, no toca la privacidad ni la publicidad. Es una
capa de **presentación y coreografía** sobre el dashboard existente.

**Principio rector:** el "wow" nunca puede costar utilidad. Ninguna animación puede retrasar
el momento en que el usuario ve y puede usar sus datos reales, degradar el rendimiento con
datasets grandes, ni romper la accesibilidad. Toda animación es **decorativa y no bloqueante**.

### Fuera de alcance (Fase 1)

Estos elementos pertenecen a fases posteriores y **no se especifican ni implementan aquí**:

- Pieza histórica "año en cifras" (Fase 2).
- Rediseño de la tarjeta compartible (`SummaryCardModal`) (Fase 2).
- "Dirección C" — evolución visual posterior al feedback de esta entrega.
- Cualquier métrica, cálculo o fuente de datos nueva.
- Cambios en el flujo de carga, parseo, filtros o persistencia (IndexedDB).
- Cambios en el consentimiento publicitario, las unidades de AdSense o el modelo de privacidad.

> **Nota sobre equivalencias humanas y Fase 2:** la preferencia de "equivalencias humanas"
> (traducir cifras a referencias tangibles) se aplica en Fase 1 **solo a las cifras héroe de
> totales**. Las equivalencias que encajan mejor en el relato "año en cifras" (p.ej. "este año
> subiste 2,3 veces el Everest") quedan **anotadas para Fase 2**, no se implementan ahora.

---

## 2. Nota sobre tratamiento de datos personales

**Esta feature NO introduce ningún tratamiento de datos personales nuevo.**

- No se recogen, transmiten ni almacenan datos nuevos. Todo sigue ocurriendo en el navegador.
- Las animaciones, el count-up y las equivalencias humanas se calculan **en cliente** sobre las
  cifras ya derivadas del export del usuario (las mismas que hoy se muestran en el dashboard).
- No se añade telemetría, tracking, cookies ni llamadas de red de ningún tipo.
- No cambia la relación con Google AdSense ni con el consentimiento publicitario.

**Base jurídica RGPD:** no aplica ningún cambio respecto al MVP — no hay tratamiento del lado
del responsable. **Input para el Abogado en el gate:** confirmar únicamente que ningún texto
nuevo (equivalencias incluidas) hace afirmaciones que puedan interpretarse como consejo médico
o deportivo, y que ninguna animación constituye un "dark pattern" (ver gate de Responsabilidad
Social).

---

## 3. User Stories y criterios de aceptación

Convención: las cifras héroe son las cuatro de totales — **actividades, distancia (km), tiempo
en movimiento y desnivel positivo (m)** — más las de la sección de records/rachas donde aplique.

---

### US-1 — Revelación coreografiada del dashboard

```
Como deportista que acaba de procesar su export
Quiero que mi dashboard aparezca con una secuencia viva y celebratoria
Para sentir que el esfuerzo de todo mi histórico "se revela", no que se pinta una tabla
```

**Alcance:** al pasar de `processing` a `ready` (primer render del dashboard tras procesar un
archivo o cargar la demo), las secciones aparecen en una **secuencia escalonada** ("wow marcado",
**~1.5 s de duración total máxima**), en lugar de un render plano simultáneo.

**Criterios de aceptación:**

- Dado un export procesado con éxito, cuando el estado pasa a `ready`, entonces las secciones del
  dashboard aparecen de forma escalonada (stagger) completándose en **≤ 1,5 s** desde el primer
  frame visible.
- Dado el inicio de la secuencia, cuando comienza la revelación, entonces **los datos reales ya
  están montados y presentes en el DOM** desde el primer frame (la animación afecta a opacidad y
  transform, nunca retrasa el cálculo ni la disponibilidad del contenido).
- Dado un usuario que interactúa durante la animación (scroll, foco, clic en un control), cuando
  actúa, entonces la interacción funciona inmediatamente y **la animación no bloquea ni captura el
  input**.
- Dado que la app mueve el foco al encabezado del dashboard al quedar `ready` (comportamiento
  actual), cuando corre la revelación, entonces **el foco sigue llegando al encabezado** y el
  orden de tabulación no se altera por la animación.
- Dado un usuario con `prefers-reduced-motion: reduce`, cuando el dashboard queda `ready`, entonces
  **no hay secuencia de movimiento**: el contenido aparece de forma inmediata y usable (se permite
  como máximo un fundido de opacidad muy breve, ≤ 150 ms, sin desplazamiento).
- Dado un dataset restaurado desde caché (IndexedDB) al abrir la app, cuando el dashboard aparece,
  entonces **la revelación coreografiada NO se dispara en cada recarga** (ver caso edge CE-1): la
  celebración "wow marcado" se reserva para el procesamiento activo de un export o la demo.
- Dado el lector de pantalla, cuando el dashboard queda listo, entonces se sigue anunciando
  "Dashboard ready" (`upload.dashboardReady`) una sola vez, sin anuncios adicionales generados por
  la animación.

---

### US-2 — Count-up de cifras héroe

```
Como deportista
Quiero ver las cifras principales contando hacia arriba hasta su valor
Para percibir la magnitud de mi histórico como un logro que "sube"
```

**Alcance:** las cifras héroe de totales (actividades, distancia, tiempo, desnivel) animan
**contando desde 0 (o desde un valor de arranque) hasta su valor final** durante la revelación.

**Criterios de aceptación:**

- Dado un dashboard que se revela, cuando aparecen las tarjetas de totales, entonces cada cifra
  héroe cuenta hacia arriba hasta su valor final y **termina exactamente en el valor real**
  (mismo número, unidad y formato de locale que sin animación).
- Dado que el count-up ha terminado, cuando el usuario lee la cifra, entonces el valor mostrado es
  **idéntico** al que produce el formateo actual (`format.ts`), incluidos separadores de miles y
  decimales del locale activo (EN/ES).
- Dado un cambio de filtro (tipo de actividad o rango de fechas) que recalcula los totales, cuando
  las cifras cambian, entonces el count-up **no se vuelve a disparar de forma intrusiva en cada
  recálculo**: los totales se actualizan de forma inmediata o con una transición mínima (el "wow"
  del count-up completo se reserva a la revelación inicial — ver CE-6).
- Dado un valor de 0 (p.ej. filtro sin resultados, métrica ausente), cuando se muestra la cifra,
  entonces se muestra **0 directamente sin animación de conteo** (no tiene sentido "contar hasta 0").
- Dado un usuario con `prefers-reduced-motion: reduce`, cuando aparecen las cifras, entonces se
  muestran **directamente en su valor final sin conteo**.
- Dado el lector de pantalla, cuando corre el count-up, entonces **solo se anuncia el valor final**
  (los valores intermedios del conteo no se anuncian: la cifra animada es `aria-hidden` o el valor
  se expone vía un nodo con el resultado final).
- Dado un dataset enorme (decenas de miles de actividades, cifras de 5-6 dígitos), cuando corre el
  count-up, entonces la animación mantiene **60 fps o degrada con elegancia** y nunca bloquea el
  hilo principal (ver requisitos no funcionales).

---

### US-3 — Records con jerarquía emocional / halo ámbar (ember)

```
Como deportista
Quiero que mis records y rachas tengan un tratamiento visual de "logro"
Para que mis mejores marcas se sientan celebradas, no listadas como datos más
```

**Alcance:** la sección de records/rachas (`StreakRecords`: racha actual, racha más larga, mejor
semana, mejor mes) gana un tratamiento visual de logro con un **halo/acento ámbar-alpenglow
("ember")** que le da peso emocional.

**Criterios de aceptación:**

- Dado un dashboard con records disponibles, cuando el usuario ve la sección de records/rachas,
  entonces esta presenta un tratamiento visual diferenciado (halo/acento ámbar-alpenglow) que la
  jerarquiza como "logro" frente al resto de tarjetas.
- Dado el nuevo acento ámbar-glow/alpenglow, cuando se muestra texto o iconografía sobre él,
  entonces **el contraste cumple WCAG 2.1 AA** (≥ 4,5:1 para texto normal, ≥ 3:1 para texto grande
  y para los límites de componentes/gráficos no textuales que transmitan información).
- Dado un usuario que no tiene aún records significativos (dataset mínimo, racha 0), cuando ve la
  sección, entonces el tratamiento de logro **degrada con dignidad**: no se muestra un halo
  celebratorio alrededor de un valor 0 o vacío (ver CE-4).
- Dado un usuario con `prefers-reduced-motion: reduce`, cuando el halo tiene cualquier componente
  animado (pulso, brillo), entonces **ese movimiento se suprime**; el acento estático de color se
  conserva (el color no es movimiento).
- Dado que el halo es un recurso **decorativo**, cuando lo procesa un lector de pantalla, entonces
  no introduce contenido anunciable adicional ni altera el significado de los valores.
- Dado el modo claro y el modo oscuro (si el proyecto los soporta), cuando se aplica el acento
  ámbar, entonces **cumple AA en ambos**.

---

### US-4 — Hero mejorado (primera impresión)

```
Como visitante que abre TrailStats por primera vez
Quiero que la pantalla inicial (hero + dropzone) se sienta cuidada y viva
Para confiar en la herramienta y querer cargar mi export
```

**Alcance:** la pantalla vacía / de carga (hero con título, tagline, nota de privacidad y
dropzone) se refuerza visualmente como primera impresión, dentro de la identidad "Summit".

**Criterios de aceptación:**

- Dado un usuario sin datos cargados, cuando abre la app, entonces ve un hero reforzado
  visualmente (identidad "Summit") que mantiene **la dropzone como el elemento más prominente y
  el primer llamado a la acción**.
- Dado el hero mejorado, cuando el usuario usa solo teclado, entonces **puede alcanzar y activar la
  dropzone y el botón de demo sin ratón**, con foco visible (se mantiene el comportamiento del MVP).
- Dado que el hero puede incluir movimiento ambiental (p.ej. un fondo o acento animado), cuando el
  usuario tiene `prefers-reduced-motion: reduce`, entonces **ese movimiento se suprime** y el hero
  se muestra estático y plenamente usable.
- Dado el texto del hero sobre el nuevo fondo/tratamiento, cuando se renderiza, entonces **el
  contraste del título, tagline y nota de privacidad cumple AA**.
- Dado el estado de `processing`/`restoring` (spinner) y el estado de `error`, cuando se muestran
  dentro del hero, entonces **siguen siendo legibles y no quedan tapados** por el nuevo tratamiento
  visual.
- Dado que el hero es la primera pintura de la página, cuando carga, entonces el tratamiento visual
  **no retrasa perceptiblemente el first paint** ni introduce parpadeos (FOUC).

---

### US-5 — Heatmap en cascada

```
Como deportista
Quiero que mi mapa de calor de actividad aparezca "dibujándose" en cascada
Para percibir mi constancia como algo que se despliega en el tiempo
```

**Alcance:** el mapa de calor de actividad (`ActivityHeatmap`) aparece con una animación en
cascada (las celdas/columnas se revelan progresivamente) al entrar en la revelación del dashboard.

**Criterios de aceptación:**

- Dado que el dashboard se revela, cuando aparece el heatmap, entonces sus celdas se revelan en
  **cascada** (progresión ordenada, p.ej. por semanas/columnas) en lugar de aparecer todas a la vez.
- Dado el final de la cascada, cuando termina, entonces **todas las celdas quedan en su color/valor
  final correcto** y el heatmap es idéntico al estado sin animación (mismos tooltips, mismas
  etiquetas accesibles `stats.heatmap.dayLabel`).
- Dado un usuario con `prefers-reduced-motion: reduce`, cuando aparece el heatmap, entonces se
  muestra **completo e inmediato sin cascada**.
- Dado un heatmap con muchas celdas (histórico de varios años), cuando corre la cascada, entonces
  la animación es **puramente CSS/compositor (opacity/transform)** y no re-renderiza React celda a
  celda ni bloquea el hilo principal (ver requisitos no funcionales).
- Dado un usuario sin actividad en el último año (`stats.heatmap.noRecentActivity`), cuando se
  muestra el heatmap, entonces el mensaje de "sin actividad" aparece **sin animación de cascada**
  (no hay celdas que cascada-ear).
- Dado el lector de pantalla, cuando recorre el heatmap durante o tras la cascada, entonces las
  etiquetas por día siguen siendo correctas y **la cascada no genera anuncios** intermedios.

---

### US-6 — Equivalencias humanas en cifras héroe

```
Como deportista
Quiero ver mis grandes cifras traducidas a referencias humanas y tangibles
Para dimensionar de forma emocional lo que he acumulado ("son 34 maratones")
```

**Alcance:** junto a las cifras héroe de totales de Fase 1 se muestra una **equivalencia humana**
como recurso motivador. Aplica a las cifras donde existe una equivalencia natural y significativa.

**Equivalencias contempladas para Fase 1 (cifras héroe de totales):**

| Cifra héroe | Equivalencia | Constante de referencia |
|---|---|---|
| Distancia total | Nº de maratones | 42,195 km / maratón |
| Distancia total (opcional, si es grande) | Vueltas a la Tierra | 40.075 km / vuelta (ecuador) |
| Desnivel positivo total | Ascensos al Everest | 8.849 m / Everest (altura sobre el nivel del mar) |
| Tiempo en movimiento total | Días completos en movimiento | 24 h / día |

**Criterios de aceptación:**

- Dado un total de distancia, cuando se muestra la cifra héroe, entonces se muestra junto a ella
  una equivalencia humana en la clave i18n correspondiente (p.ej. "≈ 34 marathons"), **calculada
  en cliente** a partir del valor real.
- Dado que una equivalencia se muestra, cuando el usuario la lee, entonces el número de la
  equivalencia está **redondeado de forma legible** (p.ej. entero o 1 decimal) y respeta el formato
  de número del locale activo.
- Dado un valor demasiado pequeño para que la equivalencia sea significativa (p.ej. distancia total
  < 1 maratón, desnivel < ~10 % de un Everest), cuando se evalúa la equivalencia, entonces **no se
  muestra una equivalencia ridícula** ("0,02 vueltas a la Tierra"): se oculta la equivalencia o se
  usa el umbral de singular/plural apropiado (ver CE-5).
- Dado el singular/plural, cuando la equivalencia es 1, entonces el texto usa la forma singular
  correcta en EN y ES (pluralización i18n: `_one` / `_other`).
- Dado que **no toda cifra héroe tiene una equivalencia natural** (p.ej. "nº de actividades"),
  cuando no la tiene, entonces **simplemente no se muestra equivalencia** para esa cifra (ausencia,
  no texto de relleno).
- Dado un usuario que cambia de idioma EN↔ES, cuando se muestra la equivalencia, entonces el texto
  y las unidades se **reformatean al locale** manteniendo equivalencia semántica.
- Dado el lector de pantalla, cuando la cifra héroe tiene equivalencia, entonces la equivalencia es
  **texto real** (no solo decorativa) y se anuncia como complemento de la cifra, de forma concisa.

---

## 4. Textos de interfaz (i18n) — referencia EN

Todos los textos nuevos van por clave i18n en **ambos** locales (EN por defecto + ES). El
Arquitecto/Maquetador ubicará las claves siguiendo la estructura del proyecto (`namespace.componente.elemento`);
la propuesta de namespacing es `stats.equivalence.*` para las equivalencias y `summit.a11y.*`
para cualquier texto ligado a la experiencia de revelación. **Recordatorio de expansión ES +30 %:**
reservar espacio; las equivalencias en ES son más largas ("maratones", "vueltas a la Tierra",
"ascensos al Everest").

### Equivalencias humanas (con pluralización)

| Clave | Valor EN de referencia | Nota |
|---|---|---|
| `stats.equivalence.marathons_one` | `≈ {{count}} marathon` | distancia total |
| `stats.equivalence.marathons_other` | `≈ {{count}} marathons` | |
| `stats.equivalence.earthLaps_one` | `≈ {{count}} lap around the Earth` | solo si distancia grande |
| `stats.equivalence.earthLaps_other` | `≈ {{count}} laps around the Earth` | |
| `stats.equivalence.everests_one` | `≈ {{count}} Everest climbed` | desnivel positivo total |
| `stats.equivalence.everests_other` | `≈ {{count}} Everests climbed` | |
| `stats.equivalence.daysMoving_one` | `≈ {{count}} full day in motion` | tiempo en movimiento total |
| `stats.equivalence.daysMoving_other` | `≈ {{count}} full days in motion` | |
| `stats.equivalence.prefix` | `That's` | prefijo opcional para lectura ("That's ≈ 34 marathons") |

> **ES de referencia (para el Maquetador/Frontend, a confirmar en implementación):**
> `maratones` · `vueltas a la Tierra` · `ascensos al Everest` · `días completos en movimiento`.
> El equivalente de `prefix` en ES: "Equivale a".

### Accesibilidad / experiencia de revelación

| Clave | Valor EN de referencia | Nota |
|---|---|---|
| `summit.a11y.countupFinal` | `{{label}}: {{value}}` | (opcional) etiqueta del nodo con el valor final del count-up, si se necesita separar del nodo animado |

> No se añaden textos para las animaciones de revelación, count-up en curso, ember o cascada:
> son **decorativos** y no deben generar contenido anunciable. El anuncio "Dashboard ready" ya
> existe (`upload.dashboardReady`) y se reutiliza.

---

## 5. Casos edge

- **CE-1 — Restauración desde caché:** al abrir la app con un dataset persistido en IndexedDB, el
  estado pasa directamente a `ready` en cada recarga. La revelación coreografiada "wow marcado"
  **no debe dispararse en cada recarga** (sería fatigante y percibiría lento). La celebración se
  reserva al procesamiento activo de un export o de la demo; la restauración muestra el dashboard
  de forma inmediata (o con un fundido mínimo). Distinguir la fuente del `ready`
  (`handleFile`/`handleDemo` vs restauración) es requisito de implementación.
- **CE-2 — Dataset vacío / sin resultados tras filtrar:** si el filtro deja 0 actividades, las
  cifras héroe son 0, no hay records ni heatmap con datos. No debe animarse count-up hasta 0, ni
  mostrarse halo de logro sobre valores vacíos, ni cascada sobre un heatmap sin celdas.
- **CE-3 — Valores 0 en métricas concretas:** una métrica puede ser 0 aunque el dataset no lo sea
  (p.ej. desnivel 0 en actividades de piscina). Esa cifra se muestra directamente en 0 sin conteo
  y sin equivalencia.
- **CE-4 — Records mínimos / racha 0:** con histórico muy corto, el "logro" ámbar no debe
  celebrar un valor trivial o vacío. Degradar el tratamiento de logro (acento tenue o ausencia de
  halo) cuando no hay marca significativa.
- **CE-5 — Cifras sin equivalencia natural o demasiado pequeñas:** "nº de actividades" no tiene
  equivalencia → no se muestra. Distancia < 1 maratón o desnivel muy por debajo de un Everest →
  ocultar la equivalencia en vez de mostrar fracciones ridículas. Umbral mínimo definido en
  implementación (recomendado: mostrar solo si la equivalencia redondeada ≥ 1).
- **CE-6 — Recálculo por filtros durante la sesión:** cambiar tipo o rango de fechas recalcula
  totales, records y heatmap. Los recálculos posteriores a la revelación inicial se actualizan sin
  relanzar la coreografía completa (evitar animaciones repetidas e intrusivas en cada cambio de
  filtro).
- **CE-7 — Dataset enorme (10+ años, decenas de miles de actividades):** el heatmap tiene miles de
  celdas y las cifras 5-6 dígitos. Las animaciones deben ser CSS/compositor (opacity/transform), no
  re-render React por celda ni por tick de conteo; deben mantener fluidez o degradar con elegancia,
  y **nunca retrasar el first-render real de los datos**.
- **CE-8 — `prefers-reduced-motion: reduce`:** transversal a US-1..US-6. Sin movimiento intrusivo;
  el contenido aparece inmediato y usable; se permite como mucho un fundido de opacidad muy breve
  sin desplazamiento. El color estático del ember se conserva (no es movimiento).
- **CE-9 — Interacción durante la animación:** scroll, foco o clic durante la revelación funcionan
  al instante; la animación no captura input ni desplaza elementos bajo el cursor/foco de forma que
  provoque errores de clic.
- **CE-10 — Cambio de idioma con la vista ya montada:** cambiar EN↔ES reformatea cifras y
  equivalencias sin relanzar la coreografía.

---

## 6. Requisitos no funcionales

- **Rendimiento:** la revelación completa dura **≤ 1,5 s** y **no retrasa el first-render real de
  los datos** — los datos ya están en el DOM desde el primer frame; la animación solo afecta a
  propiedades compuestas (opacity/transform). Con datasets grandes (objetivo: exports de miles de
  actividades, hasta decenas de miles), las animaciones mantienen fluidez percibida o degradan con
  elegancia, sin bloquear el hilo principal ni disparar reflows costosos. El count-up y la cascada
  no deben provocar re-renders de React por tick/celda.
- **Accesibilidad:** WCAG 2.1 AA de contraste en todos los acentos nuevos (ámbar-glow/alpenglow),
  en claro y oscuro. `prefers-reduced-motion` respetado en toda animación. Foco y orden de
  tabulación preservados. Sin anuncios ARIA espurios por las animaciones.
- **i18n:** todo texto nuevo (equivalencias incluidas) en EN y ES con pluralización correcta;
  contemplar expansión ES +30 %. Ningún string literal en el código.
- **Privacidad / negocio:** cero interferencia con las unidades de AdSense (`AdUnit`) ni con el
  consentimiento; cero datos nuevos; todo client-side. Las animaciones no deben provocar layout
  shift sobre los slots de anuncio.
- **Compatibilidad:** mismos navegadores objetivo que el MVP (últimas 2 versiones de Chrome,
  Firefox, Safari, Edge), escritorio y móvil.

---

## 7. Dependencias

- **Arquitecto:** define cómo se distingue la fuente del estado `ready` (procesamiento/demo vs
  restauración de caché) para CE-1, y valida que la técnica de animación elegida (CSS vs librería)
  no compromete el bundle ni el rendimiento con datasets grandes; **decisión que no debe cerrar
  puertas a la "Dirección C"** (ver backlog, Próximas Iteraciones). Confirma las constantes de
  referencia de las equivalencias.
- **UX-UI:** define la coreografía concreta (orden y timing del stagger), el tratamiento ámbar
  ember de records, el hero "Summit" y el patrón de cascada del heatmap, verificando contraste AA
  con Accesibilidad.
- **Maquetador:** implementa la capa visual y las animaciones CSS con las claves i18n nuevas.
- **Frontend:** implementa count-up, cascada, la lógica de "solo revelar en procesamiento activo"
  (CE-1) y el cálculo de equivalencias humanas; integra `prefers-reduced-motion`.
- **Accesibilidad:** gate de contraste y reduced-motion.
- **Growth:** no activo en modo estratega en esta entrega; si se activa, las equivalencias humanas
  y el "wow" son palancas candidatas — registrar métricas solo si Growth lo pide.

---

## 8. Asunciones explícitas

- Se asume que la identidad "Summit" (paleta ember/alpenglow concreta, tokens) la fija UX-UI +
  Maquetador; esta spec fija el **comportamiento y los criterios verificables**, no los valores de
  color exactos.
- Se asume que las cuatro cifras de totales siguen siendo las cifras héroe de Fase 1; si UX-UI
  promociona otra cifra a "héroe", hereda automáticamente los criterios de US-2 (count-up) y, si
  tiene equivalencia natural, US-6.
- Se asume que el proyecto está en fase `0.y.z`: esta entrega es una capa de presentación aditiva,
  candidata a **MINOR** (Documentación/Arquitecto confirman el número en el gate).
