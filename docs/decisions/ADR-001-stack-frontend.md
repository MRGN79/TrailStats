# ADR-001: Stack frontend, parseo de export Strava e i18n

**Fecha:** 2026-06-08
**Estado:** Aceptado
**Decidido por:** Arquitecto

---

## Contexto

TrailStats es una aplicación 100% cliente: el usuario carga su ZIP de export de
Strava, se procesa en el navegador y se muestran estadísticas agregadas. No hay
backend, no hay persistencia en servidor, ningún dato sale del dispositivo.

Necesidades técnicas a resolver:
1. Framework de UI y build tool.
2. Lectura del ZIP de Strava y extracción/parseo de `activities.csv`.
3. Librería de gráficas para tendencias.
4. Solución i18n (EN default, ES).
5. Procesamiento de exports grandes sin congelar la UI.

## Decisión

**Framework + build:** React 18 + TypeScript + Vite.
Vite da arranque y build rápidos y un bundle ligero apto para un sitio estático.
TypeScript aporta seguridad sobre el modelo de datos parseado.

**Lectura del ZIP:** `fizip` no — usamos **`zip.js`** (`@zip.js/zip.js`), que lee
ZIP en streaming en el navegador y solo extrae la entrada `activities.csv` sin
descomprimir el resto del export (que puede pesar mucho: fotos, mensajes).

**Parseo CSV:** **PapaParse**, con parseo en modo worker para no bloquear el hilo
principal. El mapeo de columnas se hace por nombre con fallback heurístico por
posición, porque Strava exporta cabeceras según el idioma de la cuenta.

**Procesamiento pesado:** el parseo + agregación corre en un **Web Worker** para
exports grandes (~5.000+ actividades) y mantiene la UI fluida. El worker devuelve
los datos ya agregados (totales, series semanales/mensuales) al hilo principal.

**Gráficas:** **Recharts** (declarativo sobre React, SVG, accesible y suficiente
para series temporales). Se acompaña de una tabla de datos equivalente para
accesibilidad (criterio US-4).

**i18n:** **react-i18next** + `i18next`. Estructura de claves
`namespace.componente.elemento`. Traducciones en `src/locales/en/translation.json`
y `src/locales/es/translation.json`. Idioma por defecto EN. Formateo de números y
fechas con `Intl.NumberFormat` / `Intl.DateTimeFormat` según el locale activo.

**Estado:** estado local de React + un contexto ligero para los datos parseados.
No se introduce Redux ni librería de estado global: el alcance no lo justifica.

**Modelo de datos (interno, tras parsear):**
```
Activity {
  id: string
  date: Date            // fecha local de la actividad según Strava
  type: string          // "Run", "Ride", ...
  distanceKm: number    // 0 si no aplica
  movingTimeSec: number
  elevationGainM: number
}

AggregatedPeriod {
  key: string           // "2026-W23" o "2026-06"
  label: string
  activities: number
  distanceKm: number
  movingTimeSec: number
  elevationGainM: number
}
```

**Despliegue:** sitio estático (build de Vite en `dist/`). Sin servidor de
aplicación. Apto para Netlify/Vercel/Pages. DevOps lo confirmará en su momento.

## Consecuencias

**Positivas:**
- Sin backend: cero coste de servidor, cero superficie de datos, privacidad por diseño.
- Web Worker mantiene la UI fluida con exports grandes.
- zip.js evita descomprimir el export completo, solo lee `activities.csv`.
- Stack mainstream, bien mantenido, fácil de extender (mapas en el futuro).

**Negativas / trade-offs:**
- Todo el cómputo recae en el dispositivo del usuario; un móvil antiguo con un
  export enorme será más lento (mitigado por el worker).
- Recharts añade peso al bundle; aceptable para el valor que aporta.

**Riesgos:**
- El formato de `activities.csv` de Strava puede variar por idioma/versión del
  export. Mitigación: mapeo por nombre con fallback heurístico y descarte
  controlado de filas no parseables (reportado al usuario, US-1).

## Alternativas consideradas

### Vanilla JS sin framework
**Por qué se descarta:** la gestión de estado de filtros, vistas, i18n y gráficas
se vuelve frágil sin un framework; React reduce el coste de mantenimiento.

### JSZip para el ZIP
**Por qué se descarta:** JSZip carga el archivo completo en memoria; zip.js permite
leer entradas de forma selectiva y en streaming, mejor para exports grandes.

### Chart.js en lugar de Recharts
**Por qué se descarta:** Chart.js (canvas) es válido, pero Recharts (SVG/React)
integra mejor con el modelo declarativo y facilita la alternativa accesible.
Decisión de bajo impacto; reversible.
