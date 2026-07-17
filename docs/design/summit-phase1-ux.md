# TrailStats — Spec de diseño "Summit — Fase 1" (UX-UI)

**Autor:** UX-UI
**Estado:** Definitiva — reconciliada con ADR-003. Lista para Maquetador + Frontend.
**Rama:** `feat/summit-ui-phase1`
**Depende de:** `docs/specs/summit-phase1.md` (Analista Funcional), `docs/decisions/ADR-003-summit-animation-tokens.md` (Arquitecto — tokens de animación y color, **aceptado**)
**Alcance:** SOLO Fase 1. Capa de presentación y coreografía sobre el dashboard existente. No toca datos, parseo, privacidad ni publicidad.

> **Fuente única de tokens = ADR-003.** Todas las duraciones, delays, distancias, curvas y colores
> de acento se refieren por su **nombre de token real del ADR-003**, definidos en un bloque único en
> `:root` (`src/styles/app.css`). Ningún componente hardcodea un valor. El Frontend lee los tokens de
> timing que necesite en runtime con el helper `readTimingMs()` (ADR-003 §1, `src/lib/animationTokens.ts`).
> Los valores citados aquí son los del ADR-003; si el ADR se ajusta, manda el ADR (un solo punto).

---

## 0. Principio de diseño que gobierna toda la Fase 1

**El dato primero, la celebración encima.** Los datos reales están montados y son legibles/usables
desde el primer frame. La coreografía solo manipula `opacity` y `transform`. Ninguna animación
retrasa el cálculo, captura input, ni bloquea el hilo principal. Cada animación tiene equivalente
reducido bajo `prefers-reduced-motion: reduce` (contenido inmediato y usable).

**Gatillo de la celebración (CE-1 — RESUELTO en ADR-003).** La revelación "wow marcado" se dispara
**solo** cuando el `ready` proviene de procesamiento activo (`handleFile`) o demo (`handleDemo`). La
restauración desde IndexedDB entra por el camino silencioso (aparición inmediata, sin secuencia). El
contrato es el flag **`shouldCelebrate`** (estado/ref en `App.tsx`, definido por el Arquitecto):
`true` en `handleFile`/`handleDemo`, `false` en restauración. El hook de revelación lo consume una
vez y lo resetea. `shouldCelebrate` se fuerza a `false` cuando `prefers-reduced-motion` matchea.

---

## 1. Beat sheet de la revelación (≤ `--anim-reveal-budget` = 1500 ms)

### 1.1 Modelo mental

El dashboard se revela **de abajo arriba en grupos** ("beats"), como una cordillera que emerge de la
niebla: primero la cabecera, luego las cifras que "suben" (count-up), luego los logros que "encienden"
(halo alpenglow), y en paralelo el terreno de constancia (heatmap) se dibuja en cascada. Cada beat
entra con `translateY(var(--anim-reveal-distance))` (12 px, hacia arriba) + fundido, curva
`var(--anim-ease)` (= `--ease-instrument`), duración `var(--anim-reveal-duration)`.

Solo se coreografían los **grupos por encima del pliegue** (primera pantalla: topbar + Social hasta
records + inicio del heatmap). Lo que queda **bajo el pliegue** (resto de Training) se revela con un
*reveal ligero al entrar en viewport* vía `IntersectionObserver` (mismo lenguaje: opacity +
translateY, `--anim-reveal-duration`), **fuera** del presupuesto de 1,5 s.

### 1.2 Unidades de revelación (qué es un "beat")

No se anima componente a componente (serían 20+). Se agrupan en **5 beats** por encima del pliegue:

| Beat | Contenido (grupo) | Momento firma que arranca aquí |
|---|---|---|
| **B0** | `.topbar` (brand + toggle idioma) | — |
| **B1** | Título sección Social (`stats.sections.social`) + `TotalsCards` (contenedor) | **Count-up** de las 4 cifras héroe |
| **B2** | `StreakRecords` (racha + records) | **Halo alpenglow** del logro |
| **B3** | Resto de Social visible: `BestEfforts`, `RacePredictor`, `EddingtonCards` | — |
| **B4** | Título sección Training + `ActivityHeatmap` (contenedor) | **Cascada** del heatmap |
| **B5+** | (bajo pliegue) resto de Training | reveal por scroll (fuera del budget) |

> Los **`AdUnit`** (`.ad-unit--between-sections`, `.ad-unit--bottom`) **se excluyen de la
> coreografía**: sin `opacity`/`transform` animados, sin wrapper que altere su layout o visibilidad
> (ADR-003 §4). Renderizan en su estado final estable desde el primer frame (evita CLS). Los beats
> "saltan por encima" de ellos.

### 1.3 Timeline (valores reales del ADR-003)

Tokens: `--anim-reveal-duration` 480 ms · `--anim-reveal-stagger` 90 ms · `--anim-reveal-distance`
12 px · `--anim-countup-delay` 120 ms · `--anim-countup-duration` 1100 ms · `--anim-heatmap-cascade`
260 ms · `--anim-heatmap-stagger` 14 ms · `--anim-records-halo` 2600 ms · `--anim-hero-ambient`
9000 ms · `--anim-ease` = `--ease-instrument`.

```
beat sheet — eje t en ms (shouldCelebrate = true, motion normal)   techo = --anim-reveal-budget 1500

 t=0     180     360     540     720     900    1080    1260    1500
 |───────|───────|───────|───────|───────|───────|───────|───────|
 B0 ▓▓▓▓▓▓▓▓                                topbar entra (fade+rise 480ms)
    B1 ▓▓▓▓▓▓▓▓                             Social title + Totals suben
       └─►(delay 120) count-up ═══════════════════════════╪  (0→valor, 1100ms; fin ≈1310)
       B2 ▓▓▓▓▓▓▓▓                          StreakRecords sube
          └─► halo alpenglow ✺✺✺✺✺✺✺        (bloom único, ≤ --anim-records-halo; asienta estático)
          B3 ▓▓▓▓▓▓▓▓                       BestEfforts + RacePredictor + Eddington
             B4 ▓▓▓▓▓▓▓▓                    Training title + Heatmap contenedor sube
                └─► cascada ▞▞▞▞▞▞▞▞▞▞▞▞     (≈53 columnas × 14ms + 260ms; fin ≈1362)
                                              [B5+ : reveal por scroll, fuera de budget]

Arranques de beat (stagger 90ms):  B0=0 · B1=90 · B2=180 · B3=270 · B4=360
Cierres:  entrada B4 ≈840 · count-up ≈1310 · cascada ≈1362  →  todo < 1500 (holgura)
```

**Comprobación de presupuesto:** los dos elementos más largos son el count-up (arranca B1=90 + delay
120 = 210, dura 1100 → **fin ≈1310 ms**) y la cascada del heatmap (arranca B4=360; el heatmap está
**acotado a 365 días → ≤ 53 columnas** (constante `HEATMAP_DAYS=365` en `aggregate.ts`), 53 × 14 ms =
742 ms de stagger + 260 ms de fade → **fin ≈1362 ms**). Ambos dentro de `--anim-reveal-budget`. Como
el heatmap está acotado a un año, la cascada por columna cabe en el presupuesto **sin necesidad de un
token de tope**; no se introduce ninguno (respeta el bloque único de tokens del ADR-003).

**Foco (US-1).** El movimiento de foco actual al `h2.dash-section__title` (ref `dashHeadingRef`,
`tabIndex=-1`) se mantiene tal cual, con independencia de la animación. La animación no altera el
orden de tabulación ni captura input. `will-change: opacity, transform` solo mientras dura la
animación, retirado en `animationend` (clase efímera, ADR-003 §4). Anuncio SR "Dashboard ready"
(`upload.dashboardReady`) una sola vez, como hoy.

---

## 2. Especificación de cada momento firma

### 2.1 Hero mejorado (US-4) — pantalla vacía / carga

**Qué cambia (respecto al `.hero` actual):** se refuerza la primera impresión dentro de la identidad
Summit **sin tocar la jerarquía**: la dropzone sigue siendo el elemento más prominente y el primer
CTA; el copy y las claves i18n **no cambian**.

Tratamiento:
1. **Fondo de cordillera en capas.** Sobre la textura de curvas de nivel del `body`, el hero añade
   una **silueta de cresta (ridge line)** en SVG inline, muy tenue, anclada al pie del hero. Trazo
   `rgba(250,248,243,0.10)` sobre verde profundo (decorativo, sin requisito AA propio; se mantiene
   sutil para no competir con el texto).
2. **Amanecer de acento (alpenglow) muy contenido.** Un resplandor radial cálido derivado de
   `--ember-glow-soft` detrás del título, en la esquina superior. No toca el texto; título/tagline/
   nota de privacidad conservan `--paper` sobre verde profundo (AA ya cumplido, no se degrada).
3. **Deriva ambiental (solo motion normal).** La cresta y el resplandor pueden derivar 2–4 px en un
   ciclo largo gobernado por `--anim-hero-ambient` (9 s, `ease-in-out`, `alternate`), imperceptible
   pero "vivo". **Bajo `prefers-reduced-motion`: estáticos** (el token colapsa a 0 ms en el `@media`).
4. **Dropzone.** Estructura y comportamiento intactos. En `:hover`/`.dragover` (borde ya pasa a
   `--ember`) se añade un halo `--ember-glow` suave, coherente con el nuevo lenguaje de acento. El
   icono `↑` puede sustituirse por una flecha de ascenso más intencional (Maquetador; sin tocar el `aria`).

**Restricciones:** no retrasar el first paint ni provocar FOUC (SVG de cresta inline ligero,
resplandor CSS). Los estados `processing`/`restoring` (spinner) y `error` renderizan **encima** y
legibles: el resplandor va detrás (`z-index` inferior), nunca tapa el error (`.hero .error`, `#ff9e96`,
AA sobre verde).

### 2.2 Count-up de cifras héroe (US-2) — `TotalsCards`

**Cifras héroe:** actividades, distancia (km), tiempo en movimiento, desnivel (m). Las 4 cuentan
desde 0 hasta su valor final durante B1, tras `--anim-countup-delay` (120 ms), durante
`--anim-countup-duration` (1100 ms).

- **Curva de conteo:** ease-out (desaceleración) — arranca rápido y "asienta" en el valor final,
  coherente con `--anim-ease`.
- **Formato durante el conteo:** cada frame se formatea con **las mismas funciones que hoy**
  (`format.ts`: `formatNumber`, `formatDistance`, `formatDuration`, `splitDecimal`) en el locale
  activo, para separadores de miles/decimales consistentes. El valor final es **idéntico** al render
  sin animación (US-2 CA). Se conservan `.value__frac` y `.unit`.
  - **Tiempo en movimiento:** se interpolan **segundos totales** de 0 → valor y se formatea cada
    frame con `formatDuration` (no se interpola el string).
- **Técnica (ADR-003 §1 y §4 — vinculante):** un **único bucle `requestAnimationFrame`** por sesión
  de conteo escribe `node.textContent` a través de un `ref`; **cero re-render de React por tick** (no
  `useState` por frame). El bucle solo **escribe**, nunca lee layout (sin thrashing). Se aísla en un
  hook único (`useCountUp`), cancelable; el último frame escribe el valor final exacto. Lee la
  duración con `readTimingMs('--anim-countup-duration')`, cacheada al iniciar (no dentro del `rAF`).
- **Casos (spec §5):** valor **0** → 0 directo sin conteo (CE-3, CE-2). **Recálculo por filtro**
  (CE-6) → totales se actualizan de inmediato (o transición mínima ≤150 ms), **sin relanzar el
  count-up completo** (reservado a la revelación inicial, `shouldCelebrate`).
- **Accesibilidad:** el nodo que cuenta es `aria-hidden="true"`; el valor final real se expone al SR
  (recomendado: el `.value` contiene el número final como texto real y el "efecto" se pinta sobre una
  capa `aria-hidden`; alternativa: nodo `visually-hidden` con `summit.a11y.countupFinal`). Solo se
  anuncia el valor final.
- **Reduced-motion:** el hook consulta `matchMedia('(prefers-reduced-motion: reduce)').matches` (señal
  primaria, ADR-003 §3b) y **salta al valor final** sin bucle `rAF`. (Refuerzo: el token ya vale 0 ms
  en el `@media`; ambas señales coinciden.)

### 2.3 Equivalencias humanas (US-6) — `TotalsCards`

Debajo de la cifra héroe (nuevo elemento `.card__equiv`), **texto real** (no decorativo) por clave
i18n con pluralización, calculado en cliente. **Módulo puro nuevo y aislado** `src/lib/equivalence.ts`
(ADR-003 §5): recibe primitivas (`km`, `m`, `sec`) y devuelve `{ key, count }`; **no** se mezcla con
`aggregate.ts` (reutilizable por Fase 2 "año en cifras" sin tocar el cálculo).

| Cifra héroe | Clave i18n | Constante (ADR-003, confirmada) | Umbral de visibilidad |
|---|---|---|---|
| Distancia total | `stats.equivalence.marathons_*` | 42,195 km/maratón | mostrar si redondeada ≥ 1 |
| Distancia total (grande) | `stats.equivalence.earthLaps_*` | 40.075 km/vuelta | si ≥ 1 vuelta (sustituye a maratones) |
| Desnivel positivo total | `stats.equivalence.everests_*` | 8.849 m/Everest | mostrar si ≥ 1 |
| Tiempo en movimiento | `stats.equivalence.daysMoving_*` | 86.400 s/día | mostrar si ≥ 1 |
| Nº de actividades | — | (sin equivalencia natural) | **nunca** (ausencia, no relleno) |

Reglas:
- **Redondeo legible:** entero cuando el valor es grande; 1 decimal solo si aporta. Número formateado
  con el locale activo (`formatNumber`).
- **Umbral (CE-5):** mostrar solo si la equivalencia **redondeada ≥ 1** (nada de "0,02 vueltas"). Si
  distancia total ≥ 1 vuelta a la Tierra, se **prefiere** "vueltas a la Tierra" sobre "maratones"
  (una sola equivalencia por cifra, la más significativa).
- **Pluralización EN/ES** (`_one`/`_other` según el valor redondeado); `prefix` opcional
  ("That's" / "Equivale a").
- **Ubicación visual:** línea secundaria bajo `.value`, estilo tenue tipo `.card__sub` (mono,
  `rgba(250,248,243,~0.6)`, AA sobre verde profundo). Aparece con el valor final (no cuenta) o con un
  fundido corto al terminar el conteo — **no** anima su número.
- **i18n / expansión ES +30 %:** reservar ancho; "ascensos al Everest", "días completos en
  movimiento", "vueltas a la Tierra" son largas → la línea debe **envolver a 2 líneas** sin romper la
  tarjeta (verificar en ES).
- **Cambio de idioma (CE-10):** reformatea sin relanzar coreografía.
- **Accesibilidad:** texto real, se anuncia como complemento conciso de la cifra.

### 2.4 Records con jerarquía emocional / halo alpenglow (US-3) — `StreakRecords`

**Objetivo:** que racha activa más larga, mejor semana y mejor mes se sientan **logro**, no dato más.
**Sin badge textual visible** (decisión reconciliada: no hay clave de texto en la spec y no se crea en
Fase 1). La jerarquía la aportan **borde + halo**; la semántica de "logro" para lectores de pantalla
se aporta con un **nombre accesible** (ver §2.4.2).

Tratamiento visual (nuevo modificador `.card--achievement`, aplicado por Frontend según §2.4.1):
1. **Acento de color (estático, siempre que sea logro real).** Borde/edge de la tarjeta con
   `--alpenglow` (#ff8a5c) — generaliza el actual patrón `.card--longest-active` (que hoy usa
   `--ember`). El color NO es movimiento → se conserva bajo reduced-motion.
2. **Halo (bloom único).** Resplandor cálido detrás/alrededor de la tarjeta:
   `box-shadow`/`radial-gradient` con `--ember-glow` (rgba(252,82,0,0.32)) como núcleo y
   **`--ember-glow-soft`** (rgba(255,138,92,0.16)) como **anillo exterior difuso** (alpenglow suave).
   En la revelación hace un **bloom único** cuya duración gobierna `--anim-records-halo` (2600 ms):
   sube 0 → intensidad plena → **asienta en un halo estático tenue**. **Diseño explícito: no pulsa en
   bucle** — un único ciclo y se queda estático (evita distracción / dark-pattern de parpadeo; alinea
   con el gate de Responsabilidad Social). Bajo reduced-motion el token es 0 ms → halo estático directo.
3. **Sin badge visible.** No se renderiza etiqueta "PR"/"récord" textual en Fase 1.

**Jerarquía dentro de la sección:** la racha activa que además es la más larga histórica (ya detectada:
`streak.isCurrentLongest`) recibe el tratamiento **más fuerte** (borde `--alpenglow` + halo pleno con
anillo `--ember-glow-soft`). Mejor semana / mejor mes: borde + halo. Racha actual no-máxima: acento
tenue sin halo.

#### 2.4.1 Degradación con dignidad (CE-4, ADR-003 §2)

No celebrar valores triviales/vacíos:
- `streak.current === 0` → **sin halo**; tarjeta neutra.
- `records.bestWeek` / `records.bestMonth` ausentes → esas tarjetas no se renderizan (hoy es así); no
  aplica halo.
- Dataset mínimo → halo atenuado u omitido. Regla: **el halo solo aparece sobre un logro con
  sustancia** (racha ≥ umbral, récord con valor > 0). Umbral concreto lo fija Frontend con Analista;
  recomendación: racha ≥ 2 semanas → halo pleno; 1 semana → acento tenue sin halo.

#### 2.4.2 Accesibilidad — semántica de logro sin badge visible (coordinar con gate Accesibilidad)

El halo/borde son **puramente visuales**: un lector de pantalla no percibe "esto es un logro". Para no
perder esa semántica al eliminar el badge, cada tarjeta que reciba `.card--achievement` lleva un
**nombre accesible** que comunique "logro/récord", con clave del namespace `summit.a11y.*` (el que el
Analista definió para la experiencia Summit). Patrón recomendado: `aria-label` o nodo `visually-hidden`
que anteponga la semántica al valor (p.ej. "Récord: {label} {value}"), **clave `summit.a11y.achievement`
a confirmar/añadir por el Analista** si aún no existe (hoy la spec solo lista `summit.a11y.countupFinal`).
Esto **no es blocker de Maquetador** (la estructura HTML/CSS se implementa igual); es un ítem de
contenido i18n + wiring de Frontend, a cerrar con el gate de Accesibilidad. El halo en sí sigue siendo
decorativo (sin contenido anunciable adicional).

Reduced-motion: sin bloom; borde `--alpenglow` y halo estáticos conservados (el color no es movimiento).

### 2.5 Heatmap en cascada (US-5) — `ActivityHeatmap`

El SVG dibuja las celdas agrupadas por columnas (semanas). La cascada revela **columna a columna** de
izquierda a derecha (progresión temporal natural). **Por columna, no por celda** (ADR-003 §4, CE-7):
el stagger se aplica a los `<g>` de columna (decenas de nodos), nunca a los `<rect>` (miles).

- **Técnica (contrato):** envolver cada columna en un `<g class="heatmap__col" style="--col-index:N">`.
  Animación **puramente CSS/compositor**: cada `<g>` anima `opacity` 0→1 (+ opcional translateY
  mínimo), con `animation-delay: calc(var(--anim-heatmap-stagger) * var(--col-index))` (14 ms/columna)
  y duración `var(--anim-heatmap-cascade)` (260 ms). **Cero re-render de React** por celda/columna: los
  `<rect>` ya están pintados, solo anima el CSS. `will-change` preferentemente sobre el contenedor de
  columna, no sobre cada celda (ADR-003 §4).
- **Presupuesto:** heatmap acotado a 365 días → ≤ 53 columnas; 53 × 14 ms + 260 ms ≈ 1362 ms, dentro
  de `--anim-reveal-budget`. **No se necesita token de tope.**
- **Dirección:** izquierda→derecha (cronológica).
- **Estado final:** todas las celdas en su color/valor final; tooltips (`<title>`) y `aria-label`
  (`stats.heatmap.dayLabel` / `dayLabelEmpty`) intactos; la cascada no genera anuncios.
- **Sin actividad (`stats.heatmap.noRecentActivity`, `allEmpty`):** mensaje **sin cascada** (no hay
  celdas). El bloque entra con el reveal normal de su beat.
- **Reduced-motion:** heatmap completo e inmediato (tokens `--anim-heatmap-cascade`/`-stagger` a 0 ms
  en el `@media`).
- **Leyenda** (`.heatmap-legend`, `aria-hidden`): no se anima (o fundido simple con el bloque).

---

## 3. Equivalentes `prefers-reduced-motion` (tabla) — una sola palanca (ADR-003 §3)

Implementación centralizada, sin parches por componente:
**(a) CSS** — un único `@media (prefers-reduced-motion: reduce)` colapsa **todos** los tokens de
timing (`--anim-*` a 0 ms, `--anim-reveal-duration` a 120 ms como máximo fundido permitido,
`--anim-reveal-distance` a 0 px). Como toda animación CSS Summit se define en términos de esos tokens,
redefinirlos neutraliza la coreografía completa de golpe.
**(b) JS** — el hook único de animación (`useCountUp`/`useReveal`) consulta una vez
`matchMedia('(prefers-reduced-motion: reduce)').matches` (**señal primaria**); si `true`, salta al
valor final sin bucle `rAF`. El color estático de ember/alpenglow **se conserva**.

| Momento | Comportamiento normal | Comportamiento reducido |
|---|---|---|
| **Revelación (US-1)** | 5 beats escalonados, translateY 12px + fade, ≤ 1,5 s | Todo a la vez; fade global ≤ 120 ms; **sin** translateY, **sin** stagger |
| **Count-up (US-2)** | Cuenta 0→valor, 1100 ms tras delay 120 ms, ease-out | **Valor final directo**, sin conteo (hook salta vía `matchMedia`) |
| **Equivalencias (US-6)** | Aparecen con/tras el valor final, número no anima | Texto final directo |
| **Records / halo (US-3)** | Borde `--alpenglow` estático + **bloom único** del halo (`--anim-records-halo`) | Borde y halo **estáticos** (sin bloom); misma jerarquía de color |
| **Hero (US-4)** | Cresta + resplandor con deriva ambiental (`--anim-hero-ambient` 9 s) | Cresta y resplandor **estáticos**; hero plenamente usable |
| **Heatmap (US-5)** | Cascada por columnas izq→der (14 ms/col, 260 ms) | Heatmap **completo e inmediato**, sin cascada |
| **Reveal bajo pliegue (B5+)** | translateY+fade al entrar en viewport | Aparición directa (fade ≤ 120 ms) sin desplazamiento |

Se mantiene el bloque global existente (`app.css:1097`, `* { transition-duration: 0.01ms }`) y se
añade el `@media` que colapsa los tokens Summit (ADR-003 §3a).

---

## 4. Deltas concretos sobre el diseño actual

Solo cambios de Fase 1. Componentes no mencionados **no se tocan**.

### 4.1 `App.tsx` / estructura del dashboard
- Introducir el flag **`shouldCelebrate`** (ADR-003 / Frontend): `true` en `handleFile`/`handleDemo`,
  `false` en restauración de caché; `false` bajo reduced-motion. Consumido una vez por el hook de
  revelación y reseteado. Propagar a la capa de revelación.
- Envolver los grupos de beats con clase/estado que dispare la secuencia (p.ej. `data-reveal` +
  `style="--beat-index:N"`). La animación se activa añadiendo una clase tras doble `requestAnimationFrame`
  posterior al paint (ADR-003 §4); **nunca** montando componentes de forma progresiva. No cambia el
  orden del DOM ni el foco.
- **No** envolver los `AdUnit` en contenedores animados.

### 4.2 `TotalsCards.tsx` + CSS
- `.value`: soporta count-up (nodo animado `aria-hidden` + valor final accesible) vía hook `useCountUp`
  con escritura por `ref`. Markup `integer` / `.value__frac` / `.unit` conservado.
- **Nuevo** `.card__equiv` bajo `.value`: equivalencia humana (texto i18n desde `equivalence.ts`, mono
  tenue AA), con capacidad de envolver a 2 líneas en ES. Solo si hay equivalencia (§2.3).
- Sin cambios en `ShareButton` ni en la lógica de datos.

### 4.3 `StreakRecords.tsx` + CSS
- **Nuevo** modificador `.card--achievement` (borde `--alpenglow` + halo `--ember-glow`/`--ember-glow-soft`),
  condicional (§2.4.1). Generaliza `.card--longest-active`.
- Regla de degradación para racha 0 / dataset mínimo (sin halo).
- **Sin badge visible.** Añadir **nombre accesible** de "logro" vía `summit.a11y.*` (§2.4.2) — wiring
  de Frontend + clave a confirmar con Analista/gate Accesibilidad.

### 4.4 `ActivityHeatmap.tsx` + CSS
- Envolver cada columna en `<g class="heatmap__col" style="--col-index:N">`.
- **Nuevo** CSS de cascada (opacity/transform por `--col-index`, `--anim-heatmap-stagger` /
  `--anim-heatmap-cascade`). Sin token de tope (acotado a 365 días).
- Rama `allEmpty` sin cascada. `aria-label`/`<title>` intactos.

### 4.5 `UploadZone.tsx` / hero (en `App.tsx`) + CSS
- Hero: **nuevo** fondo de cresta (SVG inline ligero) + resplandor `--ember-glow-soft` detrás del
  título (§2.1). Copy y claves **sin cambios**. Dropzone: halo `--ember-glow` en hover/dragover.
  Deriva ambiental solo en motion normal (`--anim-hero-ambient`).

### 4.6 `app.css` (sistema) — lo añade Maquetador según ADR-003
- **Bloque único de tokens de animación** `--anim-*` en `:root` (ADR-003 §1) y **tokens de color**
  `--alpenglow` / `--ember-glow` / `--ember-glow-soft` en el bloque "Naranja — acento escaso"
  (ADR-003 §2).
- **Bloque `@media (prefers-reduced-motion: reduce)`** que colapsa los tokens Summit (ADR-003 §3a),
  además del bloque global existente.
- `@keyframes` de reveal, count-up (si se usa `@property`) y cascada, definidos **en términos de los
  tokens** (nunca números sueltos).
- No se alteran tokens base (papel/verde/ember existentes, tipografías, espaciado, radios).

### 4.7 `src/lib/` (Frontend, contratos del ADR-003)
- `src/lib/animationTokens.ts` — helper `readTimingMs()` (lee tokens de timing de `:root`).
- `src/lib/equivalence.ts` — módulo puro de equivalencias humanas (primitivas → `{ key, count }`).
- Hook único de animación (`useCountUp` / `useReveal`) con la comprobación `matchMedia` de
  reduced-motion.

---

## 5. Tokens de color de acento (ADR-003 §2 — valores definitivos)

| Token | Valor (ADR-003) | Qué es | Dónde se usa |
|---|---|---|---|
| `--ember` *(ya existe)* | `#fc5200` | Naranja energía | Cifra héroe grande (existente), hover dropzone |
| `--ember-text` *(ya existe)* | `#c2410c` | Ember oscuro | Textos/fondos que requieran ember con texto paper (patrones existentes) |
| `--alpenglow` *(nuevo)* | `#ff8a5c` | Acento cálido claro | **Borde/edge/icono del logro** (`.card--achievement`); resplandor del hero |
| `--ember-glow` *(nuevo)* | `rgba(252, 82, 0, 0.32)` | Aura del halo — **solo** `box-shadow`/`radial-gradient` | Núcleo del halo de logro; halo hover dropzone |
| `--ember-glow-soft` *(nuevo)* | `rgba(255, 138, 92, 0.16)` | Anillo exterior suave (alpenglow difuso) | Borde exterior del halo de logro; resplandor del hero |

### 5.1 Superficies y verificación AA (WCAG 2.1 AA — confirma Accesibilidad en el gate)

Superficie base = **verde profundo** (`--forest-deep #16271e`). Los halos/glow son **decorativos**
(no portan información) → exentos de ratio; se mantienen sutiles para no degradar la legibilidad.

| Elemento | Fg | Bg | Ratio aprox. (ADR-003) | Estado |
|---|---|---|---|---|
| Cifra héroe grande | `--ember #fc5200` | verde profundo | ≥ 3:1 (texto grande) | ✅ (uso ya presente en MVP) |
| Valor de cifra (paper) | `--paper #faf8f3` | verde profundo | ~13:1 | ✅ (sin cambio) |
| Equivalencia `.card__equiv` | `rgba(250,248,243,0.6)` | verde profundo | ≥ 4.5:1 | ✅ (verificar alpha final) |
| Borde de logro `--alpenglow` | `--alpenglow #ff8a5c` | verde profundo | ≈ 6:1 (estimación ADR) | ✅ no-textual ≥ 3:1 con holgura |
| Halo `--ember-glow` / `-soft` | — | verde profundo | decorativo | ✅ exento (confirmar que no reduce legibilidad del texto envuelto) |
| Título/tagline hero sobre resplandor | `--paper` | verde profundo (resplandor detrás) | ~13:1 | ✅ (el resplandor no reduce el contraste efectivo) |

**Regla de uso (ADR-003 §2):** el texto pequeño y las etiquetas del bloque de records siguen usando
`--paper` (contraste ya validado). El ámbar se reserva para la **cifra grande** y elementos
**decorativos** (halo) + el **borde/edge** del logro (`--alpenglow`, ~6:1, apto incluso como texto si
hiciera falta). **Ningún texto normal nuevo depende de un ámbar por validar.** Como el badge textual
se omite, no hay texto sobre fondo ámbar saturado en Fase 1.

**Modo claro/oscuro:** hoy tema único oscuro (fondo forest). Si Fase 2 introduce superficie clara para
el logro, los tokens se re-verifican sobre papel — anotado, fuera de alcance Fase 1.

---

## 6. Estado de dependencias — TODAS resueltas (reconciliación ADR-003)

| # | Dependencia (era bloqueo suave) | Estado |
|---|---|---|
| 1 | Nombres exactos de tokens de animación/acento | ✅ ADR-003 §1–2. Remapeados en esta spec; fuente única en `:root`. |
| 2 | CE-1 — origen del `ready` | ✅ Flag `shouldCelebrate` (ADR-003 CE-1). |
| 3 | Técnica count-up / cascada | ✅ `rAF` único con `textContent` por `ref`; cascada por columna (`<g>`) (ADR-003 §1, §4). |
| 4 | Constantes de equivalencias | ✅ Confirmadas (ADR-003), en `equivalence.ts`. |
| 5 | Badge "récord/PR" | ✅ **Omitido** (sin clave, no se crea). Sustituido por **nombre accesible** `summit.a11y.*` (§2.4.2). |

**No queda ningún bloqueo para que Maquetador arranque.** Único ítem abierto, y **no bloquea a
Maquetador**: la clave i18n del nombre accesible de logro (`summit.a11y.achievement`, §2.4.2) es
contenido i18n + wiring de Frontend, a cerrar con el Analista en el gate de Accesibilidad. La
estructura HTML/CSS y los tokens están totalmente especificados.

---

## 7. Resumen para Maquetador y Frontend

- **Maquetador:** bloque único de tokens `--anim-*` y colores (`--alpenglow`/`--ember-glow`/
  `--ember-glow-soft`) en `:root` (ADR-003); `@media (prefers-reduced-motion)` que colapsa los tokens;
  hero Summit (cresta SVG + resplandor); `@keyframes` de reveal/count-up/cascada **en términos de
  tokens**; `.card--achievement` (borde `--alpenglow` + halo con `--ember-glow`/`-soft`, bloom único);
  `.card__equiv`; `<g class="heatmap__col">` con `--col-index`. **Puede arrancar ya.**
- **Frontend:** flag `shouldCelebrate` (CE-1); `useCountUp` (rAF por `ref`, valor final exacto, 0 sin
  conteo, `matchMedia`); `equivalence.ts` (umbral ≥1, pluralización); `animationTokens.ts`
  (`readTimingMs`); `IntersectionObserver` para el reveal bajo pliegue; nombre accesible de logro
  (`summit.a11y.*`, coordinar clave con Analista); `--col-index` al heatmap; degradación de logro (CE-4).
- **Verificar siempre en EN y ES** (expansión +30 %): equivalencias a 2 líneas, labels.
- **No tocar:** datos, parseo, privacidad, `AdUnit`, consentimiento, `SummaryCardModal` (Fase 2).
