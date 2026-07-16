# ADR-003: Tokens de animación y color para "Summit — Fase 1"

**Fecha:** 2026-07-16
**Estado:** Aceptado
**Decidido por:** Arquitecto
**Rama:** `feat/summit-ui-phase1`
**Relacionado:** specs `docs/specs/summit-phase1.md`, ADR-001 (stack), ADR-002 (persistencia)

---

## Contexto

La Fase 1 de "Summit" añade una **capa de presentación y coreografía** sobre el
dashboard existente (revelación escalonada ≤ 1,5 s, count-up de cifras héroe,
halo ámbar en records, hero reforzado, heatmap en cascada, equivalencias humanas).
No introduce datos, cálculos ni tratamiento nuevos.

Fuerzas en juego:

1. El usuario (dueño) prevé pedir **ajustes finos de velocidad** de piezas concretas
   más adelante. Las duraciones y delays no pueden quedar dispersos por el CSS y el
   TS: deben vivir en **un único bloque etiquetado** para que tocar el timing sea trivial.
2. Los acentos ámbar nuevos (halo/alpenglow) deben tener **valores concretos** partiendo
   del `--ember #fc5200` existente, y su contraste lo verificará Accesibilidad en el gate.
3. `prefers-reduced-motion` debe respetarse con **una sola palanca coherente**, no con
   parches por componente.
4. El rendimiento no es negociable (CE-7): datasets de decenas de miles de actividades,
   el first-render real de datos **nunca se retrasa** por la coreografía.
5. Las decisiones de Fase 1 **no deben cerrar puertas a la Dirección C** (backlog): la
   capa de animación/presentación queda desacoplada del cálculo y del modelo de datos.

El estado actual (`src/styles/app.css`) ya define tokens en `:root`, un
`--ease-instrument` con carácter, y un bloque global `@media (prefers-reduced-motion:
reduce)` que neutraliza transiciones. Esta decisión se construye encima, sin romperlo.

---

## Decisión

### 1. Tokens de TIMING — CSS custom properties como fuente única

Todas las duraciones, delays y pasos de stagger de la coreografía Summit viven en **un
único bloque etiquetado** dentro de `:root` en `src/styles/app.css`, con el prefijo
común `--anim-`. **El CSS es la única fuente de verdad.** El Frontend, cuando necesite
un valor en JS (count-up con `requestAnimationFrame`, orquestación de stagger), lo **lee
en runtime** desde la custom property mediante un helper tipado, en lugar de duplicar la
constante en TS.

**Por qué CSS como fuente única y no un módulo TS (ni ambos duplicados):**
- Un único lugar para tocar la velocidad → cumple el requisito explícito del usuario.
- La palanca de `prefers-reduced-motion` (decisión 3) colapsa los tokens en un solo
  `@media`; como el JS los **lee** de ahí, la reducción de movimiento se propaga a las
  animaciones JS sin código extra.
- Evita el riesgo de divergencia entre un valor CSS y su gemelo en TS.

**Helper de lectura (contrato para Frontend):** `src/lib/animationTokens.ts`

```typescript
// Lee una custom property de timing de :root y la devuelve en milisegundos.
// Fuente única = CSS. Este módulo NO define valores, solo los parsea.
export function readTimingMs(token: string, fallbackMs = 0): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  if (raw.endsWith("ms")) return parseFloat(raw);
  if (raw.endsWith("s")) return parseFloat(raw) * 1000;
  return fallbackMs;
}
```

**Bloque de tokens (Maquetador lo añade a `:root`):**

```css
/* ══════════════════════════════════════════════════════════════════
   SUMMIT — TOKENS DE ANIMACIÓN  (fuente única de timing)
   Ajustar la velocidad de cualquier pieza = editar UN valor aquí.
   Consumidos por CSS (@keyframes) y por JS vía readTimingMs().
   ══════════════════════════════════════════════════════════════════ */

/* Easing compartido (reutiliza el carácter del instrumento) */
--anim-ease:                 var(--ease-instrument);

/* US-1 · Revelación coreografiada del dashboard (presupuesto total ≤ 1,5 s) */
--anim-reveal-budget:        1500ms; /* techo duro de la coreografía completa */
--anim-reveal-duration:       480ms; /* fade+translate de cada sección */
--anim-reveal-stagger:         90ms; /* retardo entre secciones consecutivas */
--anim-reveal-distance:        12px; /* desplazamiento inicial translateY (transform) */

/* US-2 · Count-up de cifras héroe */
--anim-countup-duration:     1100ms; /* conteo 0 → valor final */
--anim-countup-delay:         120ms; /* espera tras aparecer las tarjetas */

/* US-5 · Heatmap en cascada (cascada POR COLUMNA, no por celda — ver rendimiento) */
--anim-heatmap-cascade:       260ms; /* fade de cada columna */
--anim-heatmap-stagger:        14ms; /* retardo entre columnas */

/* US-3 · Halo ámbar de records (pulso opcional; el color es estático) */
--anim-records-halo:         2600ms; /* periodo del pulso del halo, si lo hay */

/* US-4 · Movimiento ambiental del hero (opcional) */
--anim-hero-ambient:         9000ms; /* periodo del acento ambiental del hero */
```

Convención de nombres: `--anim-<pieza>-<propiedad>`.
`<pieza>` = `reveal | countup | heatmap | records | hero`;
`<propiedad>` = `duration | stagger | delay | distance | budget | cascade`.
Añadir una pieza nueva = añadir una línea en este bloque, nunca un valor suelto en otro sitio.

### 2. Tokens de COLOR — halo/acento del logro (ember / alpenglow)

Se añaden al bloque `/* Naranja — acento escaso */` de `:root`, partiendo del
`--ember #fc5200` existente:

```css
/* Acento de logro Summit (records) — parte de --ember #fc5200 */
--alpenglow:      #ff8a5c;              /* acento cálido claro: borde/edge/icono del logro */
--ember-glow:     rgba(252, 82, 0, 0.32);  /* aura del halo — SOLO box-shadow / radial-gradient */
--ember-glow-soft: rgba(255, 138, 92, 0.16); /* anillo exterior suave del halo (alpenglow difuso) */
```

**Superficies sobre las que se usan (para que Accesibilidad verifique contraste):**

| Token | Uso | Superficie(s) | Requisito WCAG aplicable |
|---|---|---|---|
| `--alpenglow #ff8a5c` | Borde/edge e icono del logro; texto de acento si hiciera falta | `--forest-deep #16271e` (primaria, app en fondo verde profundo) y `--surface #f3efe6` / papel (secundaria, si algún elemento del logro cae sobre superficie clara) | Borde que transmite estado ≥ 3:1; si se usa como texto normal ≥ 4,5:1. Estimación sobre `--forest-deep` ≈ 6:1 (holgado) — **verifica Accesibilidad** |
| `--ember-glow` / `--ember-glow-soft` | Aura decorativa del halo (`box-shadow`, `radial-gradient`) | `--forest-deep` | **Decorativo puro** (no textual, no límite informativo): exento de ratio. Accesibilidad confirma que no degrada la legibilidad del texto que envuelve |
| `--ember #fc5200` (existente) | Cifra héroe grande (`.card:first-child .value`, `step-stat`) | `--forest-deep` | Texto grande ≥ 3:1. Uso ya presente en el MVP; se mantiene |

**Regla de uso:** el texto pequeño y las etiquetas del bloque de records siguen usando
`--paper` (contraste ya validado sobre forest). El ámbar se reserva para la **cifra grande**
y para elementos **decorativos** (halo). Ningún texto normal nuevo depende de un ámbar por
validar. Modo claro/oscuro: el proyecto es hoy un único tema oscuro (fondo forest); si Fase 2
introduce superficie clara para el logro, los tokens se re-verifican sobre papel — anotado.

**Degradación con dignidad (CE-4):** el halo y el alpenglow **no se aplican** cuando el
valor del record es trivial/vacío (racha 0, sin marca significativa). Es una decisión de
presentación condicionada por dato, la aplica Maquetador/Frontend; no requiere token nuevo.

### 3. `prefers-reduced-motion` — una sola palanca

**Palanca conceptual única:** `prefers-reduced-motion: reduce`. Dos implementaciones,
cada una centralizada (no parches por componente):

**(a) CSS — un solo `@media` que colapsa TODOS los tokens de timing:**

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --anim-reveal-duration:  120ms;  /* máx. fundido breve permitido (≤ 150ms) */
    --anim-reveal-stagger:     0ms;
    --anim-reveal-distance:    0px;  /* sin desplazamiento */
    --anim-countup-duration:   0ms;
    --anim-countup-delay:      0ms;
    --anim-heatmap-cascade:    0ms;
    --anim-heatmap-stagger:    0ms;
    --anim-records-halo:       0ms;  /* halo estático; conserva el color */
    --anim-hero-ambient:       0ms;
  }
}
```

Como toda animación CSS Summit se define en términos de estos tokens, redefinirlos aquí
neutraliza la coreografía completa de golpe. El color estático del ember/alpenglow **se
conserva** (el color no es movimiento). Se mantiene el bloque global existente
(`* { transition-duration: 0.01ms }`).

**(b) JS — una sola comprobación en el hook compartido de animación:**

El count-up y cualquier orquestación JS pasan por **un único hook** (p.ej.
`useCountUp` / `useReveal` en `src/lib/`). Ese hook consulta una vez
`window.matchMedia('(prefers-reduced-motion: reduce)').matches`; si es `true`, **salta al
valor final inmediatamente** sin bucle `rAF`. No hay comprobaciones dispersas en los
componentes. (Como refuerzo, `readTimingMs('--anim-countup-duration')` ya devolvería 0 por
el bloque (a); ambas señales coinciden.)

Resultado: contenido inmediato y usable, sin movimiento intrusivo, cumpliendo US-1..US-6 y
CE-8 con una única fuente de verdad para "reducir movimiento".

### 4. Rendimiento — pautas técnicas vinculantes

- **Solo `opacity` y `transform`.** Ninguna animación toca `width/height/top/left/margin`
  ni propiedades que disparen layout. La revelación es fade + `translateY(var(--anim-reveal-distance))`.
- **Los datos reales están en el DOM desde el primer frame.** La coreografía es una capa
  visual sobre contenido ya montado: React renderiza el árbol completo de inmediato; la
  animación se activa añadiendo una clase (con doble `requestAnimationFrame` tras el paint),
  nunca montando componentes de forma progresiva. El first-render real **no se retrasa**.
- **Cascada del heatmap POR COLUMNA, no por celda (CE-7).** El stagger se aplica a las
  columnas (`<g>` por semana, decenas de nodos) y no a las celdas (`<rect>`, miles). Cada
  columna recibe su delay vía custom property inline `--col-index` y
  `animation-delay: calc(var(--anim-heatmap-stagger) * var(--col-index))`. Cero re-render de
  React por celda: los `<rect>` ya están pintados, solo anima el CSS/compositor.
- **Count-up sin re-render de React.** Un único bucle `requestAnimationFrame` por sesión de
  conteo escribe `node.textContent` a través de un `ref` — **no** `useState` por tick. El
  bucle solo **escribe**, nunca lee layout (sin thrashing). El último frame escribe el valor
  final exacto formateado por `format.ts` (mismo número, unidad y locale que sin animación).
  Valor 0 → se muestra 0 sin conteo (CE-3). Recálculo por filtro → actualización directa sin
  relanzar el conteo (CE-6).
- **`will-change` con criterio.** Se aplica `will-change: opacity, transform` solo mientras
  dura la animación y se retira en `animationend` (clase efímera). **Nunca** permanente ni
  sobre miles de celdas: promover capas de forma indefinida consume memoria y perjudica en
  móvil. Preferir promover el contenedor de columna, no cada celda.
- **Sin layout shift sobre los slots de anuncio** (`AdUnit`): la coreografía solo anima
  opacity/transform de las secciones de datos; los reservados de anuncio conservan su caja.

### 5. Puertas abiertas a la Dirección C

La Dirección C es una evolución visual posterior al feedback de la B/"Summit" (backlog,
Próximas Iteraciones). Estas decisiones de Fase 1 se toman para **no cerrarle puertas**:

- **La capa de animación es puramente presentacional y desacoplada del cálculo.** Los tokens
  `--anim-*` y `--alpenglow/--ember-glow`, las clases CSS y el hook único de animación no
  tocan `aggregate.ts`, `types.ts` ni el modelo de datos. C puede re-secuenciar, re-colorear o
  eliminar la coreografía editando tokens/CSS sin tocar lógica.
- **El count-up consume los valores ya calculados** (`totals` de `aggregate.ts`) por su forma
  actual; no altera el shape de datos. Cambiar la dirección visual no obliga a recalcular nada.
- **Las equivalencias humanas van en un módulo puro nuevo y aislado**
  (`src/lib/equivalence.ts`): recibe primitivas (`km`, `m`, `sec`) y devuelve `{ key, count }`
  con las constantes de referencia; **no** se mezcla con la agregación. C (o Fase 2, que reusa
  equivalencias en "año en cifras") lo reutiliza tal cual o lo reubica sin tocar el cálculo.
- **La cascada del heatmap es una capa CSS sobre el SVG existente**; `computeHeatmap` queda
  intacto. C puede sustituir la visual del heatmap (u otro chart) sin reescribir el cómputo.
- **Recharts no se acopla a la coreografía.** La animación Summit no envuelve ni depende de la
  API de Recharts; un cambio de librería o de dirección visual de charts en C no arrastra la
  capa de presentación Summit.
- **La coreografía se dispara con un único flag booleano** (`celebrate`, ver CE-1 abajo)
  desacoplado de la máquina de estados; C puede cambiar el disparo o el efecto sin tocar la
  lógica de `status`.

### CE-1 — Distinguir la fuente del estado `ready`

La celebración "wow marcado" solo debe dispararse en **procesamiento activo** (`handleFile`)
o **demo** (`handleDemo`), nunca en cada restauración desde IndexedDB (efecto de montaje).
Decisión: un único flag `shouldCelebrate` (estado/ref en `App.tsx`) puesto a `true` en
`handleFile`/`handleDemo` y `false` en la ruta de restauración; el hook de revelación lo
consume una vez y lo resetea. La restauración muestra el dashboard inmediato (o fundido
mínimo ≤ 150 ms). Frontend implementa; no cambia el contrato de datos.

### Constantes de referencia de equivalencias (confirmadas)

Dependencia de la spec (§7): el Arquitecto confirma las constantes para `equivalence.ts`.

| Equivalencia | Constante | Nota |
|---|---|---|
| Maratones | `42.195` km / maratón | distancia total |
| Vueltas a la Tierra | `40075` km / vuelta (ecuador) | solo si distancia grande |
| Ascensos al Everest | `8849` m / Everest (altura s.n.m.) | desnivel positivo total |
| Días en movimiento | `86400` s / día (24 h) | tiempo en movimiento total |

**Umbral (CE-5):** mostrar la equivalencia solo si el valor redondeado **≥ 1**; en caso
contrario, ausencia (no texto de relleno, no fracciones ridículas). Pluralización i18n
`_one`/`_other` según el valor redondeado.

---

## Consecuencias

**Positivas:**
- Ajustar la velocidad de cualquier pieza = editar un valor en un bloque etiquetado. Cumple
  el requisito explícito del usuario de timing centralizado y fácil de tocar a futuro.
- `prefers-reduced-motion` es una sola palanca: un `@media` colapsa los tokens y un check en
  el hook cubre el JS; cero parches por componente.
- El rendimiento está acotado por diseño (opacity/transform, cascada por columna, count-up sin
  re-render), cumpliendo CE-7 sin retrasar el first-render.
- La capa de presentación queda desacoplada del cálculo → Dirección C y Fase 2 no heredan
  deuda ni reescrituras de lógica.

**Negativas / trade-offs:**
- Leer timing en runtime con `getComputedStyle` tiene un coste mínimo; se mitiga leyendo una
  vez al iniciar la animación (no en el bucle `rAF`) y cacheando el valor.
- Mantener el count-up fuera del ciclo de React (mutación de `textContent` por `ref`) es menos
  idiomático; se aísla en un hook único y testeable para contenerlo.

**Riesgos:**
- Si un componente futuro introdujera una animación con una duración hardcodeada fuera del
  bloque de tokens, rompería la palanca de reduced-motion y el ajuste centralizado. Mitigación:
  esta ADR es normativa; Tester/QA verifican que EN y ES respetan reduced-motion y que no hay
  duraciones sueltas.
- `getComputedStyle` devuelve el valor **ya colapsado** bajo reduced-motion; el hook debe usar
  además `matchMedia` como señal primaria para el branch de "saltar al valor final", no inferirlo
  solo del número.

## Alternativas consideradas

### Módulo TS como fuente única de timing (y CSS lee de TS)
**Por qué se descarta:** el CSS no puede leer variables de un módulo TS sin inyectarlas en
`:root` en runtime (JS escribiendo custom properties), lo que añade un paso de arranque y
un punto de fallo antes del primer paint (riesgo de FOUC en la coreografía). Con CSS como
fuente, las animaciones puramente CSS funcionan sin esperar a JS.

### CSS y TS con valores duplicados (dos fuentes sincronizadas a mano)
**Por qué se descarta:** garantiza divergencia con el tiempo; un ajuste de velocidad tocaría
dos sitios y rompería reduced-motion si solo se actualiza uno. Contradice el requisito.

### Librería de animación (Framer Motion / GSAP)
**Por qué se descarta:** añade peso al bundle de un sitio estático 100% cliente para un efecto
que se resuelve con CSS + un hook `rAF` mínimo. Acoplaría la capa de presentación a una API de
terceros, cerrando puertas a la Dirección C. CSS/compositor da mejor garantía de rendimiento
con miles de celdas. Reconsiderable en C si la ambición visual lo justificara.

### Cascada del heatmap por celda (stagger por `<rect>`)
**Por qué se descarta:** miles de nodos animados y miles de `animation-delay` distintos
degradan en datasets grandes (CE-7). La cascada por columna da el mismo efecto percibido con
decenas de nodos.

---
<!-- Numeración secuencial: ADR-003. No reutilizar el número aunque se deprece. -->
