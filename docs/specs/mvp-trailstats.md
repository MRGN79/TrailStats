# TrailStats — Especificación Funcional MVP

**Autor:** Analista Funcional
**Estado:** Aprobado para implementación
**Fecha:** 2026-06-08

## Contexto

TrailStats permite a un deportista cargar su export completo de Strava (ZIP) y ver
estadísticas agregadas de su histórico de actividades: totales, agregados semanales
y mensuales, y tendencias en el tiempo. Todo el procesamiento ocurre en el navegador.
Ningún dato sale del dispositivo del usuario.

## Alcance del MVP

### Dentro de alcance
- Carga del export oficial de Strava (archivo ZIP completo del histórico)
- Parseo en el navegador del `activities.csv` contenido en el ZIP
- Vista de totales del histórico (nº actividades, distancia, tiempo, desnivel)
- Agregados semanales y mensuales
- Tendencias temporales (gráficas de evolución)
- Filtro por tipo de actividad (carrera, ciclismo, etc.)
- Interfaz multiidioma EN (default) / ES

### Fuera de alcance (MVP)
- Mapas y rutas (datos GPS/GPX de actividades individuales)
- Análisis de actividad individual
- Conexión con la API de Strava
- Carga de archivos sueltos (.gpx, .fit) fuera del ZIP
- Persistencia entre sesiones / guardado en servidor
- Cuentas de usuario / login
- Comparación entre varios atletas

## User Stories

### US-1 — Cargar el export de Strava
```
Como deportista con un export de Strava
Quiero arrastrar o seleccionar mi ZIP descargado
Para que la aplicación lea mi histórico sin que yo prepare nada
```
**Criterios de aceptación:**
- Dado un ZIP de export de Strava, cuando lo cargo, entonces la app localiza y lee `activities.csv` automáticamente.
- Dado un archivo que no es un ZIP válido o no contiene `activities.csv`, cuando lo cargo, entonces veo un mensaje de error claro y no se rompe la app.
- Dado un ZIP grande (miles de actividades), cuando lo proceso, entonces veo un indicador de progreso/carga.
- Dado que el procesamiento ocurre en el navegador, cuando termino, entonces ningún archivo se sube a un servidor (verificable: funciona sin red tras cargar la app).
- Dado que el usuario solo usa teclado, cuando navega la zona de carga, entonces puede seleccionar el archivo y activarla sin ratón.

### US-2 — Ver totales del histórico
```
Como deportista
Quiero ver los totales de todo mi histórico
Para tener una foto global de mi actividad
```
**Criterios de aceptación:**
- Dado un export cargado, cuando se procesa, entonces veo: nº total de actividades, distancia total, tiempo en movimiento total, desnivel positivo total.
- Dado un conjunto de actividades de distintos tipos, cuando aplico un filtro de tipo, entonces los totales se recalculan solo con ese tipo.
- Dado un valor numérico, cuando se muestra, entonces respeta unidades legibles (km, h:m, m de desnivel) y el formato de número del idioma activo.

### US-3 — Ver agregados semanales y mensuales
```
Como deportista
Quiero ver mis estadísticas agrupadas por semana y por mes
Para entender mi volumen reciente y mi consistencia
```
**Criterios de aceptación:**
- Dado un export cargado, cuando elijo la vista semanal o mensual, entonces veo distancia, tiempo y desnivel agregados por cada periodo.
- Dado un periodo sin actividades, cuando se muestra la serie, entonces el periodo aparece con valor 0 (no se omite, para no falsear la tendencia).
- Dado un filtro de tipo de actividad activo, cuando cambio de vista, entonces el filtro se mantiene.

### US-4 — Ver tendencias temporales
```
Como deportista
Quiero ver la evolución de mis métricas en el tiempo
Para identificar progresión o caídas de volumen
```
**Criterios de aceptación:**
- Dado un export cargado, cuando veo la sección de tendencias, entonces veo una gráfica de evolución de al menos distancia por periodo (semana/mes).
- Dado que paso el cursor o foco sobre un punto, entonces veo el valor exacto de ese periodo.
- Dado un usuario con lector de pantalla, cuando llega a la gráfica, entonces existe una alternativa textual o tabla equivalente de los datos.

### US-5 — Cambiar de idioma
```
Como usuario hispanohablante o angloparlante
Quiero cambiar el idioma de la interfaz
Para usar la app en mi lengua
```
**Criterios de aceptación:**
- Dado el idioma por defecto EN, cuando selecciono ES, entonces todos los textos visibles cambian sin recargar datos.
- Dado un cambio de idioma, cuando hay números/fechas, entonces se reformatean al locale activo.

## Casos edge identificados
- ZIP con `activities.csv` pero columnas en idioma distinto (Strava exporta cabeceras según el idioma de la cuenta) → el parser debe mapear por posición/heurística, no solo por nombre exacto en inglés.
- Actividades sin distancia (ej. entrenamiento de fuerza) → contar la actividad pero no sumar distancia.
- Filas corruptas o incompletas en el CSV → ignorarlas y reportar cuántas se descartaron.
- Fechas en distintas zonas horarias → agrupar por la fecha local de la actividad tal como la da Strava.
- Export muy grande (10+ años) → no bloquear el hilo principal de forma perceptible.
- ZIP que contiene también el resto de export de Strava (mensajes, fotos, etc.) → ignorar todo salvo `activities.csv`.

## Textos de interfaz (i18n) — referencia EN
- `app.title` → "TrailStats"
- `app.tagline` → "Your Strava history, in numbers"
- `upload.dropzone` → "Drop your Strava export ZIP here or click to browse"
- `upload.processing` → "Reading your activities…"
- `upload.error.invalidZip` → "This doesn't look like a Strava export. Make sure it's the full ZIP you downloaded."
- `upload.error.noActivities` → "Couldn't find activities in this export."
- `upload.discarded` → "{count} rows could not be read and were skipped."
- `stats.totals.title` → "All-time totals"
- `stats.totals.activities` → "Activities"
- `stats.totals.distance` → "Distance"
- `stats.totals.time` → "Moving time"
- `stats.totals.elevation` → "Elevation gain"
- `stats.view.weekly` → "Weekly"
- `stats.view.monthly` → "Monthly"
- `stats.trends.title` → "Trends"
- `filter.activityType` → "Activity type"
- `filter.allTypes` → "All types"
- `lang.toggle` → "Language"
- `privacy.note` → "Everything runs in your browser. Your data never leaves this device."

## Requisitos no funcionales
- **Rendimiento:** procesar un export de ~5.000 actividades sin congelar la interfaz de forma perceptible; primer render de estadísticas en pocos segundos.
- **Privacidad:** cero envío de datos a servidor. La app debe poder funcionar offline una vez cargada.
- **Compatibilidad:** navegadores modernos de escritorio y móvil (últimas 2 versiones de Chrome, Firefox, Safari, Edge).

## Base jurídica del tratamiento de datos
- La app **no recoge ni transmite** datos personales: todo el tratamiento es local en el navegador del usuario sobre datos que él mismo aporta.
- No hay base jurídica RGPD que documentar para tratamiento por parte del responsable, porque no existe tratamiento del lado servidor. **Punto clave para el Abogado:** confirmar que el aviso de privacidad refleje fielmente este modelo "zero data" y revisar implicaciones de marca/IP por usar "Strava" en el nombre/funcionalidad.

## Dependencias
- El Arquitecto debe definir: stack frontend, librería de parseo de ZIP, librería de gráficas, solución i18n y estructura de claves.
- El formato real de `activities.csv` del export de Strava debe verificarse para mapear columnas.
