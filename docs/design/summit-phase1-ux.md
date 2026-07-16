# TrailStats — Spec de diseño "Summit — Fase 1" (UX-UI)

**Autor:** UX-UI
**Estado:** Para implementación (Maquetador + Frontend)
**Rama:** `feat/summit-ui-phase1`
**Depende de:** `docs/specs/summit-phase1.md` (Analista Funcional), ADR-003 (Arquitecto — tokens de animación, *en definición en paralelo*)
**Alcance:** SOLO Fase 1. Capa de presentación y coreografía sobre el dashboard existente. No toca datos, parseo, privacidad ni publicidad.

> **Convención de tokens.** Todas las duraciones, delays, distancias y curvas de animación se
> refieren por su **nombre de token centralizado**, no por valores hardcodeados. Los nombres
> definitivos los fija el Arquitecto en **ADR-003**; esta spec usa los nombres genéricos acordados
> (`--anim-reveal-*`, `--anim-countup-*`, `--anim-heatmap-*`, `--anim-ember-*`) y propone valores
> objetivo de referencia. **Si un nombre difiere en ADR-003, manda ADR-003**; Maquetador ajusta el
> mapeo en un solo sitio (`:root`). Ningún componente lee un número mágico.

---

## 0. Principio de diseño que gobierna toda la Fase 1

**El dato primero, la celebración encima.** Los datos reales están montados y son legibles/usables
desde el primer frame. La coreografía solo manipula `opacity` y `transform` (propiedades de
compositor). Ninguna animación retrasa el cálculo, captura input, ni bloquea el hilo principal.
Cualquier animación tiene un equivalente reducido bajo `prefers-reduced-motion: reduce` en el que
el contenido aparece **inmediato y usable**.

**Gatillo de la celebración (CE-1).** La revelación "wow marcado" se dispara **solo** cuando el
`ready` proviene de un procesamiento activo (`handleFile`) o de la demo (`handleDemo`). La
restauración desde IndexedDB entra por el camino "silencioso" (aparición inmediata, sin secuencia).
El contrato de diseño es un único flag booleano que Frontend propaga desde el origen del estado:
llamémoslo **`celebrate`** (Frontend decide el nombre real). `celebrate = true` → beat sheet
completo; `celebrate = false` → estado final directo. Este flag también se fuerza a `false` bajo
`prefers-reduced-motion`.

---

## 1. Beat sheet de la revelación (~1,5 s)

### 1.1 Modelo mental

El dashboard se revela **de abajo hacia arriba en grupos** ("beats"), como una cordillera que
emerge de la niebla: primero la cabecera, luego las cifras que "suben" (count-up), luego los logros
que "encienden" (halo alpenglow), y en paralelo el terreno de constancia (heatmap) se dibuja en
cascada. Cada beat entra con un desplazamiento vertical corto (`--anim-reveal-distance`, ~16px
hacia arriba) + fundido, con la curva `--ease-instrument` (ya existe: `cubic-bezier(0.2,0.8,0.2,1)`
— entra ágil, asienta).

Solo se coreografían los **grupos por encima del pliegue** (la primera pantalla: topbar + sección
Social hasta records + inicio del heatmap). Todo lo que queda **bajo el pliegue** (resto de
Training) se revela con un *reveal ligero al entrar en viewport* vía `IntersectionObserver`
(mismo lenguaje: opacity + translateY, `--anim-reveal-duration`), **fuera** del presupuesto de 1,5 s
— así el "completándose en ≤1,5 s desde el primer frame visible" se cumple sobre lo que el usuario
realmente ve, y datasets largos no encarecen la secuencia inicial.

### 1.2 Unidades de revelación (qué es un "beat")

No se anima componente a componente (serían 20+). Se agrupan en **6 beats** por encima del pliegue:

| Beat | Contenido (grupo) | Momento firma que arranca aquí |
|---|---|---|
| **B0** | `.topbar` (brand + toggle idioma) | — |
| **B1** | Título sección Social (`stats.sections.social`) + `TotalsCards` (contenedor) | **Count-up** de las 4 cifras héroe |
| **B2** | `StreakRecords` (racha + records) | **Halo alpenglow** (bloom) |
| **B3** | Resto de Social visible: `BestEfforts`, `RacePredictor`, `EddingtonCards` | — |
| **B4** | Título sección Training + `ActivityHeatmap` (contenedor) | **Cascada** del heatmap |
| **B5** | (bajo pliegue) resto de Training | reveal por scroll (fuera del budget) |

> Los **`AdUnit`** (`.ad-unit--between-sections`, `.ad-unit--bottom`) **se excluyen de la
> coreografía**: sin `opacity`/`transform` animados, sin wrapper que altere su layout o visibilidad.
> Renderizan en su estado final estable desde el primer frame (evita CLS sobre los slots y problemas
> de política). Los beats "saltan por encima" de ellos.

### 1.3 Timeline (valores de referencia; los define ADR-003)

Presupuesto total ≤ **1500 ms**. Tokens de referencia:

- `--anim-reveal-duration` ≈ **420 ms** (entrada de cada grupo)
- `--anim-reveal-stagger` ≈ **110 ms** (separación entre el arranque de beats consecutivos)
- `--anim-reveal-distance` ≈ **16 px** (translateY inicial, hacia arriba)
- `--anim-countup-duration` ≈ **900 ms** (conteo de cifras héroe)
- `--anim-ember-bloom-duration` ≈ **640 ms** (encendido del halo, una vez)
- `--anim-heatmap-cell-duration` ≈ **200 ms** (fundido de cada columna del heatmap)
- `--anim-heatmap-stagger` ≈ **22 ms** (retardo por columna), **con tope** (ver §2.5)

```
beat sheet — eje t en ms (celebrate = true, motion normal)

 t=0     120     240     360     480     600     720   ...   1100        1500
 |───────|───────|───────|───────|───────|───────|──── ... ──|────────────|
 B0 ▓▓▓▓▓▓                                    topbar entra (fade+rise, 420ms)
        B1 ▓▓▓▓▓▓▓                            Social title + Totals suben
        └─►  count-up ════════════════════════════════╪  (0 → valor, 900ms, ease-out)
               B2 ▓▓▓▓▓▓▓                     StreakRecords sube
                  └─► halo alpenglow ✺✺✺✺✺✺✺  (bloom 640ms, una vez)
                      B3 ▓▓▓▓▓▓▓              BestEfforts + RacePredictor + Eddington
                          B4 ▓▓▓▓▓▓▓          Training title + Heatmap contenedor sube
                             └─► cascada ▞▞▞▞▞▞▞▞▞▞▞  (columnas, tope ≤ ~760ms)
                                                          [B5+ : reveal por scroll, fuera de budget]

Arranques de beat:  B0=0 · B1≈110 · B2≈220 · B3≈330 · B4≈440   (stagger ≈110ms)
Cierre visual:      count-up termina ≈ t=1010 · cascada termina ≤ t≈1200 · margen a 1500ms
```

**Comprobación de presupuesto:** último beat coreografiado (B4) arranca ≈440 ms + entrada 420 ms
= visible ≈860 ms; el count-up (el elemento de mayor duración) arranca ≈110 ms + 900 ms ≈ **1010 ms**;
la cascada del heatmap arranca ≈440 ms y está **topada** para cerrar antes de ~1200 ms. Todo dentro
de 1,5 s con holgura. Los easings y estos números son **objetivo**; ADR-003 puede afinarlos siempre
que se respete el techo de 1,5 s y el orden de los beats.

**Foco (US-1).** El movimiento de foco actual al `h2.dash-section__title` (ref `dashHeadingRef`,
`tabIndex=-1`) se mantiene **tal cual** y ocurre con independencia de la animación. La animación no
altera el orden de tabulación ni captura input (los grupos animan con `pointer-events` intactos;
`will-change: transform, opacity` solo durante la secuencia). El anuncio SR "Dashboard ready"
(`upload.dashboardReady`) se emite una sola vez, como hoy.

---

## 2. Especificación de cada momento firma

### 2.1 Hero mejorado (US-4) — pantalla vacía / carga

**Qué cambia (respecto al `.hero` actual):** se refuerza la primera impresión dentro de la
identidad Summit **sin tocar la jerarquía**: la dropzone sigue siendo el elemento más prominente y
el primer CTA; el copy y las claves i18n **no cambian**.

Tratamiento:
1. **Fondo de cordillera en capas.** Sobre la textura de curvas de nivel actual del `body`, el hero
   añade una **silueta de cresta (ridge line)** en SVG, muy tenue, anclada al pie del hero — evoca
   una cumbre bajo la niebla. Color: trazo `rgba(250,248,243,0.10)` sobre el verde profundo
   (decorativo, no portador de información → sin requisito AA propio, pero se mantiene sutil para no
   competir con el texto).
2. **Amanecer de acento (alpenglow) muy contenido.** Un resplandor radial cálido
   (`--alpenglow`, muy baja opacidad, ~0.06) detrás del título, en la esquina superior, que insinúa
   la luz de cumbre. No toca el texto; el título/tagline/nota de privacidad conservan su color
   `--paper` sobre verde profundo (contraste AA ya cumplido hoy y no se degrada).
3. **Deriva ambiental opcional (solo motion normal).** La cresta y el resplandor pueden derivar
   ~2–4 px en un ciclo largo (~8 s, `ease-in-out`, `alternate`), imperceptible pero "vivo".
   **Bajo `prefers-reduced-motion`: estáticos.**
4. **Dropzone.** Se conserva estructura y comportamiento. Refuerzo visual mínimo: en `:hover`/
   `.dragover` el borde ya pasa a `--ember`; añadimos un halo `--ember-glow` suave en ese estado
   (coherente con el nuevo lenguaje de acento). El icono `↑` puede sustituirse por una flecha de
   ascenso más intencional (decisión de Maquetador; sin cambiar el `aria`).

**Restricciones:** el tratamiento no debe retrasar el first paint ni provocar FOUC (el SVG de cresta
es inline, ligero; el resplandor es CSS). Los estados `processing`/`restoring` (spinner) y `error`
siguen renderizando **encima** y legibles: el resplandor va detrás (`z-index` inferior), nunca tapa
el mensaje de error (`.hero .error`, color `#ff9e96`, AA sobre verde).

### 2.2 Count-up de cifras héroe (US-2) — `TotalsCards`

**Cifras héroe:** actividades, distancia (km), tiempo en movimiento, desnivel (m). Las 4 cuentan
desde 0 (o desde valor de arranque) hasta su valor final durante B1.

- **Curva de conteo:** ease-out (desaceleración) — arranca rápido y "asienta" en el valor final,
  coherente con `--ease-instrument`. Token de curva: `--anim-countup-ease` (referencia:
  `cubic-bezier(0.2, 0.8, 0.2, 1)` o equivalente ease-out). Duración: `--anim-countup-duration`.
- **Formato durante el conteo:** cada frame se formatea con **las mismas funciones que hoy**
  (`format.ts`: `formatNumber`, `formatDistance`, `formatDuration`, `splitDecimal`) en el locale
  activo, para que separadores de miles/decimales sean consistentes en todo el conteo. El valor
  final es **idéntico bit a bit** al render sin animación (US-2 CA). La parte fraccionaria
  (`.value__frac`) y la unidad (`.unit`) se mantienen: durante el conteo la fracción puede
  redondearse igual que el formateo normal; en el frame final coincide exactamente.
  - **Tiempo en movimiento:** no es un número lineal simple; se cuenta interpolando **segundos
    totales** de 0 → valor y formateando cada frame con `formatDuration` (no interpolar el string).
- **Técnica (contrato para Frontend):** el conteo NO re-renderiza React por tick. Se anima con
  `requestAnimationFrame` escribiendo en el DOM (o vía variable CSS `--num` + `@property`), sobre un
  nodo `aria-hidden`. Un único frame por tick, cancelable. Se cancela y salta al valor final si el
  componente se desmonta o si cambia el locale/filtro a mitad.
- **Casos (spec §5):**
  - Valor **0** → se muestra 0 directo, **sin conteo** (CE-3, CE-2).
  - **Recálculo por filtro** (CE-6) → los totales se actualizan de inmediato (o transición mínima de
    opacidad ≤150 ms), **sin relanzar el count-up completo**. El count-up completo se reserva a la
    revelación inicial (`celebrate = true`).
- **Accesibilidad:** el nodo que cuenta es `aria-hidden="true"`. El valor final real se expone al SR
  — opción recomendada: el propio `.value` contiene el número final como texto real y el "efecto"
  de conteo se pinta sobre una capa `aria-hidden` encima; alternativa: nodo `visually-hidden` con
  `summit.a11y.countupFinal`. Solo se anuncia el valor final; los intermedios nunca.
- **Reduced-motion:** valor final directo, sin conteo.

### 2.3 Equivalencias humanas (US-6) — `TotalsCards`

Debajo de la cifra héroe (nuevo elemento `.card__equiv`), texto real (no decorativo), por clave
i18n con pluralización, calculado en cliente desde el valor real:

| Cifra héroe | Clave i18n | Constante (confirma Arquitecto) | Umbral de visibilidad |
|---|---|---|---|
| Distancia total | `stats.equivalence.marathons_*` | 42,195 km/maratón | mostrar si ≥ 1 maratón |
| Distancia total (grande) | `stats.equivalence.earthLaps_*` | 40.075 km/vuelta | mostrar si ≥ 1 vuelta (sustituye a maratones cuando aplica) |
| Desnivel positivo total | `stats.equivalence.everests_*` | 8.849 m/Everest | mostrar si ≥ 1 Everest |
| Tiempo en movimiento | `stats.equivalence.daysMoving_*` | 86.400 s/día | mostrar si ≥ 1 día |
| Nº de actividades | — | (sin equivalencia natural) | **nunca** (ausencia, no relleno) |

Reglas:
- **Redondeo legible:** entero cuando el valor es grande; 1 decimal solo si aporta (regla en
  implementación). El número se formatea con el locale activo (`formatNumber`).
- **Umbral (CE-5):** no mostrar equivalencias ridículas (`0,02 vueltas`). Regla recomendada: mostrar
  solo si la equivalencia **redondeada ≥ 1**. Si distancia total ≥ 1 vuelta a la Tierra, se
  **prefiere** "vueltas a la Tierra" sobre "maratones" (una sola equivalencia por cifra, la más
  significativa).
- **Pluralización EN/ES** (`_one`/`_other`); `prefix` opcional ("That's" / "Equivale a").
- **Ubicación visual:** línea secundaria bajo `.value`, estilo tenue tipo `.card__sub` (mono,
  `rgba(250,248,243,~0.6)`, AA sobre verde profundo). En count-up, la equivalencia aparece con el
  valor final (no cuenta) o hace un fundido corto al terminar el conteo — **no** se anima su número.
- **i18n / expansión ES +30 %:** reservar ancho; "ascensos al Everest", "días completos en
  movimiento" y "vueltas a la Tierra" son largas. La línea debe poder **envolver a 2 líneas** sin
  romper la tarjeta (la retícula de `.card` lo admite; verificar en ES).
- **Cambio de idioma (CE-10):** reformatea sin relanzar coreografía.
- **Accesibilidad:** texto real, se anuncia como complemento conciso de la cifra.

### 2.4 Records con jerarquía emocional / halo alpenglow (US-3) — `StreakRecords`

**Objetivo:** que racha activa más larga, mejor semana y mejor mes se sientan **logro**, no dato más.

Tratamiento visual (nuevo modificador `.card--achievement`, aplicado por Frontend según §2.4.1):
1. **Acento de color (estático, siempre que sea logro real).** Borde superior de la tarjeta en
   `--ember` (ya existe el patrón `.card--longest-active` con `border-top-color: --ember`; se
   generaliza). El color NO es movimiento → se conserva bajo reduced-motion.
2. **Halo alpenglow (bloom, una vez).** Resplandor cálido detrás/alrededor de la tarjeta de logro:
   `box-shadow` o pseudo-radial con `--ember-glow`. En la revelación hace **bloom** una sola vez
   (`--anim-ember-bloom-duration`): sube de 0 → intensidad plena → asienta en un halo estático
   tenue. No pulsa en bucle (evita distracción y dark-pattern de parpadeo).
3. **Badge de logro (opcional, recomendado).** Micro-etiqueta tipo `.race-predictor__badge`
   reutilizando patrón existente: fondo `--ember-text` (#c2410c) + texto `--paper` (contraste
   **AA ≈ 5:1**, patrón ya usado en `.demo-banner__badge`). Texto por clave i18n (p.ej. un "PR" /
   "récord" — clave a definir por Analista si se añade; si no hay clave, se omite el badge en
   Fase 1). El badge es texto real, no decorativo.

**Jerarquía dentro de la sección:** la racha activa que además es la más larga histórica (ya
detectada: `streak.isCurrentLongest`) recibe el tratamiento **más fuerte** (borde + halo + badge).
Mejor semana / mejor mes: borde + halo. Racha actual no-máxima: acento tenue sin halo.

#### 2.4.1 Degradación con dignidad (CE-4)

No celebrar valores triviales/vacíos:
- `streak.current === 0` (sin racha) → **sin halo ni badge**; tarjeta neutra.
- `records.bestWeek` / `records.bestMonth` ausentes → esas tarjetas ya no se renderizan (hoy es así);
  no aplica halo.
- Dataset mínimo (una sola semana, valores triviales) → el halo se atenúa o se omite. Regla de
  diseño: **el halo solo aparece sobre un logro con sustancia** (racha ≥ umbral mínimo, o récord
  con valor > 0). Umbral concreto lo fija Frontend con Analista; recomendación: racha ≥ 2 semanas
  para halo pleno; 1 semana → acento tenue.

**Accesibilidad:** halo y bloom son **decorativos** → sin contenido anunciable, sin alterar el
significado de los valores. El acento de color no transmite información única (el valor y su label
ya lo hacen), así que el requisito AA aplica a **texto/iconografía sobre el acento**, no al halo en
sí. Superficies y contrastes en §5. Reduced-motion: sin bloom ni pulso; acento estático conservado.

### 2.5 Heatmap en cascada (US-5) — `ActivityHeatmap`

El SVG actual dibuja las celdas agrupadas por columnas (semanas). La cascada revela **columna a
columna** de izquierda a derecha (progresión temporal natural: semanas más antiguas → recientes).

- **Técnica (contrato):** envolver cada columna en un `<g class="heatmap__col">` con una variable
  `--col-index` (índice de columna). La animación es **puramente CSS/compositor**: cada `<g>` anima
  `opacity` 0→1 (+ opcional `transform` de un translateY mínimo o scale sutil), con
  `animation-delay: calc(var(--col-index) * var(--anim-heatmap-stagger))` y duración
  `--anim-heatmap-cell-duration`. **No** se re-renderiza React por celda ni por columna (CE-7).
- **Tope de duración (CE-7).** Con históricos de varios años hay ~50–530+ columnas; a 22 ms/columna
  se dispararía el presupuesto. La cascada se **topa**: el retardo efectivo por columna es
  `min(--anim-heatmap-stagger, --anim-heatmap-cap / nColumns)` con `--anim-heatmap-cap` ≈ **760 ms**.
  Así, pocas columnas → cascada perceptible; muchas columnas → columnas casi simultáneas por bloques,
  pero la cascada **siempre cierra dentro del presupuesto**. Maquetador expone `--col-index` y
  `nColumns`; el cálculo del retardo va en CSS con `calc()` (o Frontend fija un `--stagger-effective`
  por dataset — decisión menor de implementación).
- **Dirección:** izquierda→derecha (cronológica). Alternativa aceptable: diagonal suave, pero la
  horizontal por semanas es la más legible y barata.
- **Estado final:** todas las celdas en su color/valor final correcto; tooltips (`<title>`) y
  `aria-label` (`stats.heatmap.dayLabel` / `dayLabelEmpty`) intactos; la cascada no genera anuncios.
- **Sin actividad (`stats.heatmap.noRecentActivity`, `allEmpty`):** el mensaje se muestra **sin
  cascada** (no hay celdas). El bloque entra con el reveal normal de su beat, nada más.
- **Reduced-motion:** heatmap completo e inmediato, sin cascada.
- **Leyenda** (`.heatmap-legend`, `aria-hidden`): no se anima (o fundido simple con el bloque).

---

## 3. Equivalentes `prefers-reduced-motion` (tabla)

Regla transversal (CE-8): sin movimiento intrusivo; contenido inmediato y usable; se permite como
mucho un **fundido de opacidad ≤150 ms sin desplazamiento**. El **color** estático (ember/alpenglow)
se conserva: el color no es movimiento.

| Momento | Comportamiento normal | Comportamiento reducido |
|---|---|---|
| **Revelación (US-1)** | 6 beats escalonados, entrada con translateY+fade, ≤1,5 s | Todo el dashboard aparece a la vez; opcional fade global ≤150 ms; **sin** translateY, **sin** stagger |
| **Count-up (US-2)** | Cifras cuentan 0→valor, ~900 ms, ease-out | Cifras en su **valor final directo**, sin conteo |
| **Equivalencias (US-6)** | Aparecen con/tras el valor final (fundido corto), número no anima | Presentes en su texto final directo |
| **Records / halo (US-3)** | Borde ember estático + **bloom** de halo alpenglow una vez (~640 ms) | Borde ember y halo **estáticos** (sin bloom, sin pulso); misma jerarquía de color |
| **Hero (US-4)** | Cresta + resplandor con deriva ambiental lenta (~8 s) | Cresta y resplandor **estáticos**; hero plenamente usable |
| **Heatmap (US-5)** | Cascada por columnas, izq→der, con tope | Heatmap **completo e inmediato**, sin cascada |
| **Reveal bajo pliegue (B5+)** | translateY+fade al entrar en viewport | Aparición directa (o fade ≤150 ms) sin desplazamiento |

Implementación: un único bloque `@media (prefers-reduced-motion: reduce)` (ya existe uno en
`app.css:1097`) neutraliza `animation`/`transition` de estos momentos y deja los estados finales.
Frontend además fuerza `celebrate = false` y omite el count-up/cascada por JS cuando la media query
matchea (no basta con CSS: el count-up y la cascada tienen lógica JS que debe respetar la preferencia).

---

## 4. Deltas concretos sobre el diseño actual

Solo se listan cambios de Fase 1. Componentes no mencionados **no se tocan**.

### 4.1 `App.tsx` / estructura del dashboard
- Introducir el flag **`celebrate`** (origen del `ready`: `handleFile`/`handleDemo` → `true`;
  restauración de caché → `false`; reduced-motion → `false`). Propagar a la capa de revelación.
- Envolver los grupos de beats con una clase/estado que dispare la secuencia (p.ej.
  `data-reveal` + `style="--beat-index"` por grupo). No cambia el orden del DOM ni el foco.
- **No** envolver los `AdUnit` en contenedores animados.

### 4.2 `TotalsCards.tsx` + CSS
- `.value`: pasa a soportar count-up (nodo animado `aria-hidden` + valor final accesible). El markup
  de `integer` / `.value__frac` / `.unit` se conserva.
- **Nuevo** `.card__equiv` bajo `.value`: línea de equivalencia humana (texto i18n, mono tenue, AA),
  con capacidad de envolver a 2 líneas en ES. Solo presente si hay equivalencia (§2.3).
- Sin cambios en `ShareButton` ni en la lógica de datos.

### 4.3 `StreakRecords.tsx` + CSS
- **Nuevo** modificador `.card--achievement` (borde ember + halo alpenglow + badge opcional),
  aplicado condicionalmente (§2.4.1). Generaliza el actual `.card--longest-active`.
- Regla de degradación para racha 0 / dataset mínimo (sin halo).
- Badge de logro solo si Analista provee clave i18n; si no, se omite en Fase 1.

### 4.4 `ActivityHeatmap.tsx` + CSS
- Envolver cada columna en `<g class="heatmap__col" style="--col-index:N">`.
- **Nuevo** CSS de cascada (opacity/transform por `--col-index`, con tope §2.5).
- Rama `allEmpty` sin cascada. `aria-label`/`<title>` intactos.

### 4.5 `UploadZone.tsx` / hero (en `App.tsx`) + CSS
- Hero: **nuevo** fondo de cresta (SVG inline ligero) + resplandor `--alpenglow` detrás del título
  (§2.1). Copy y claves **sin cambios**. Dropzone: halo `--ember-glow` en hover/dragover.
- Deriva ambiental solo en motion normal.

### 4.6 `app.css` (sistema)
- **Nuevos tokens** de color de acento en `:root` (§5) y **nuevos tokens de animación** (mapeados a
  los nombres de ADR-003).
- Reforzar el bloque `@media (prefers-reduced-motion)` existente para cubrir los nuevos momentos.
- No se alteran tokens base (papel/verde/ember existentes, tipografías, espaciado, radios).

---

## 5. Tokens de color de acento (coordinar nombres con ADR-003)

> Los **nombres** definitivos los fija ADR-003 (el Arquitecto centraliza tokens de animación y de
> acento). Aquí van los **nombres propuestos + valores objetivo + superficie de uso + verificación
> AA**. Si ADR-003 renombra, Maquetador ajusta el mapeo en `:root`. **Ningún componente hardcodea el
> valor.**

### 5.1 Tokens propuestos

| Token | Valor objetivo | Qué es | Dónde se usa |
|---|---|---|---|
| `--ember` *(ya existe)* | `#fc5200` | Naranja energía | Bordes de acento de logro, hover dropzone |
| `--ember-text` *(ya existe)* | `#c2410c` | Ember oscuro para texto/fondos de badge | Fondo del badge de logro (texto paper encima) |
| `--ember-glow` *(nuevo)* | `rgba(252, 82, 0, 0.22)` | Halo cálido semitransparente **decorativo** | `box-shadow`/radial del halo de logro; halo hover dropzone |
| `--alpenglow` *(nuevo)* | degradado `#fc5200 → #ff8a5b` (ámbar→melocotón cálido) | Luz de cumbre **decorativa** | Resplandor del hero; fondo del bloom de logro (baja opacidad) |

> `--alpenglow` se define como **degradado decorativo de baja opacidad detrás de superficies**, no
> como fondo de texto. El "rosa" del alpenglow original se mantiene contenido en el extremo melocotón
> para no chocar con la paleta cálida existente; Maquetador puede afinar el segundo stop.

### 5.2 Superficies y verificación AA (WCAG 2.1 AA)

La superficie base de las tarjetas y del hero es el **verde profundo** (`--forest-deep #16271e` /
fondo del `body`). Regla: **los halos/glow son decorativos** (no portan información → sin requisito
de contraste propio, solo se mantienen sutiles). El requisito AA aplica a **texto e iconografía**:

| Elemento con texto | Fg | Bg | Ratio aprox. | Estado |
|---|---|---|---|---|
| Valor de cifra héroe | `--paper #faf8f3` | verde profundo | ~13:1 | ✅ AA (sin cambio) |
| Equivalencia humana `.card__equiv` | `rgba(250,248,243,0.6)` | verde profundo | ≥ 4.5:1 | ✅ AA (verificar el alpha final con Accesibilidad) |
| Badge de logro (texto) | `--paper` | `--ember-text #c2410c` | ~5:1 | ✅ AA (patrón ya usado en `.demo-banner__badge`) |
| Borde de logro `--ember` (no textual) | `--ember` | verde profundo | ≥ 3:1 | ✅ AA no-textual (límite de componente) |
| Título/tagline hero sobre resplandor | `--paper` | verde profundo (resplandor detrás, ~0.06) | ~13:1 | ✅ AA (el resplandor no reduce el contraste efectivo del texto) |

**Prohibido:** texto `--paper` normal directamente sobre `--ember #fc5200` como fondo (da ~2.7:1,
falla). Por eso el badge usa `--ember-text`, no `--ember`. Si Maquetador necesita texto sobre ember
saturado, usar **tinta oscura** (`--forest-deep`, ~5:1) en vez de paper.

**Modo claro/oscuro:** el proyecto hoy es un único tema oscuro (verde profundo). Si en el futuro
hay tema claro, estos tokens deben revalidarse en AA sobre superficie clara (los glow decorativos
pierden contraste sobre papel; el badge y bordes necesitarán variante). **Fuera de alcance Fase 1**,
pero se anota para no cerrar la puerta.

**Gate:** todos los ratios marcados se **confirman con el agente Accesibilidad** antes de cerrar la
implementación (los alphas exactos de `--ember-glow`, `--alpenglow` y del `.card__equiv` se ajustan
si algún cálculo real queda por debajo del umbral).

---

## 6. Dependencias abiertas del Arquitecto (bloqueos suaves)

Ninguna impide empezar la maqueta; sí deben cerrarse antes del gate:

1. **ADR-003 — nombres exactos de los tokens de animación y acento.** Esta spec usa
   `--anim-reveal-*`, `--anim-countup-*`, `--anim-heatmap-*`, `--anim-ember-*`, `--ember-glow`,
   `--alpenglow`. Si difieren, se remapean en `:root` (un solo punto).
2. **Mecanismo de distinción del origen del `ready` (CE-1).** El flag `celebrate` depende de que
   Arquitecto/Frontend definan cómo se distingue procesamiento/demo vs restauración de caché.
3. **Técnica de count-up y cascada (CSS `@property`/`--num` vs `rAF` en JS).** Debe garantizar
   0 re-render React por tick/celda y no cerrar puertas a "Dirección C". Es decisión del Arquitecto;
   el diseño es agnóstico a cuál se elija.
4. **Constantes de referencia de equivalencias** (42,195 km/maratón; 40.075 km/vuelta;
   8.849 m/Everest; 86.400 s/día) — a confirmar por Arquitecto.
5. **Clave i18n del badge de logro** (si se incluye) — la aporta el Analista Funcional; sin clave,
   el badge se omite en Fase 1 (el halo + borde bastan para la jerarquía).

---

## 7. Resumen para Maquetador y Frontend

- **Maquetador:** hero Summit (cresta SVG + resplandor), tokens nuevos en `:root`, CSS de los beats
  (translateY+fade por `--beat-index`), CSS del count-up si es vía `@property`, CSS de la cascada del
  heatmap (`--col-index` + tope), `.card--achievement` (borde + halo + badge), `.card__equiv`,
  refuerzo de `@media (prefers-reduced-motion)`.
- **Frontend:** flag `celebrate` (CE-1), lógica de count-up (rAF, cancelable, valor final exacto,
  0 sin conteo), cálculo de equivalencias con umbral y pluralización, `IntersectionObserver` para el
  reveal bajo pliegue, respeto de `prefers-reduced-motion` en JS (no solo CSS), `--col-index`/
  `nColumns` al heatmap, condiciones de degradación de logro (CE-4).
- **Verificar siempre en EN y ES** (expansión +30 %): equivalencias a 2 líneas, badges y labels.
- **No tocar:** datos, parseo, privacidad, `AdUnit`, consentimiento, `SummaryCardModal` (Fase 2).
