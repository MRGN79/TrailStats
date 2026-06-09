# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.2.0] — 2026-06-08

### Added
- **Soporte Garmin Connect:** import del export masivo de Garmin (archivos `.fit`). Detección automática del formato por contenido del ZIP — el usuario no hace nada distinto.
- **Barra de progreso** al procesar exports de Garmin con cientos de archivos FIT.
- **Arquitectura multi-plataforma:** `parserRegistry` extensible para añadir nuevas plataformas sin tocar el flujo existente.
- **SEO baseline:** title descriptivo, meta description, Open Graph y Twitter Card tags, `canonical`, `robots.txt` y `sitemap.xml`.

### Changed
- Tagline y textos de UI actualizados para reflejar el soporte multi-plataforma ("your training history", "Strava, Garmin and more").
- Descargo legal ampliado para incluir la marca Garmin.

### Security
- Librería `fit-file-parser` (MIT) elegida sobre el SDK oficial de Garmin, cuya licencia prohíbe redistribución pública.

## [0.1.0] — 2026-06-08

Primera versión del MVP de TrailStats: analiza tu export de Strava en el navegador,
sin que ningún dato salga de tu dispositivo.

### Added
- Carga del export oficial de Strava (ZIP) arrastrando el archivo o seleccionándolo.
- Lectura del histórico de actividades directamente desde el ZIP, sin necesidad de descomprimir ni preparar nada.
- Totales de todo tu histórico: número de actividades, distancia, tiempo en movimiento y desnivel positivo.
- Estadísticas agregadas por semana y por mes.
- Gráfica de tendencias para ver la evolución de tu volumen en el tiempo, con tabla de datos equivalente.
- Filtro por tipo de actividad (carrera, ciclismo, etc.) que recalcula totales y agregados.
- Interfaz bilingüe inglés / castellano, con formato de números y fechas según el idioma.
- Indicador de progreso durante el procesamiento de exports grandes.
- Aviso cuando alguna fila del export no puede leerse y se descarta.

### Security
- Procesamiento 100% local en el navegador: ningún archivo ni dato del usuario se envía a un servidor. La aplicación funciona sin conexión una vez cargada.
