# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added
- **Borrado de datos desde el panel de privacidad:** el panel de privacidad incluye ahora un botón para eliminar las actividades guardadas en este navegador. Solo aparece cuando hay datos almacenados y pide confirmación antes de borrar, para que nunca pierdas tu historial por accidente.

## [0.9.2] — 2026-06-13

### Fixed
- **Racha actual más fiel a la realidad:** si tu última semana con actividad es antigua (anterior a la semana pasada), la racha actual se muestra ahora correctamente como cero, en lugar de mantener una racha que en realidad ya se ha interrumpido.
- **Comparativa año a año más rigurosa:** la comparación entre años solo se muestra cuando los dos años con actividad más recientes son consecutivos. Si hay un hueco entre ellos, ya no se presenta una comparativa engañosa.
- **Las salidas cortas ya cuentan:** las actividades de menos de 1 km se incluyen ahora en el cálculo de las zonas de ritmo, que antes las dejaba fuera.
- **Cálculo de forma física coherente:** el indicador de forma física y el de carga de entrenamiento usan ahora exactamente la misma base de cálculo, eliminando una discrepancia entre ambos.
- **Sin cifras de carga engañosas:** cuando no hay suficiente historial para calcular la carga de entrenamiento de forma fiable, la aplicación lo indica claramente en lugar de mostrar un resultado "normal" que podría inducir a error.
- **Guardado de datos más robusto:** al subir varios exports seguidos, los avisos de guardados ya superados no interfieren con el estado de la aplicación, evitando que se marque como "datos guardados" lo que no corresponde.
- **Mensaje correcto cuando no hay actividades:** si un export de Garmin no contiene ninguna actividad utilizable, se muestra ahora el mensaje adecuado de "sin actividades" en lugar de un error genérico.
- **Carga y forma física sobre todo tu historial:** los indicadores de carga de entrenamiento y forma física se calculan ahora sobre el historial completo de actividades, sin verse afectados por el filtro de tipo de actividad activo.

## [0.9.1] — 2026-06-12

### Fixed
- **Aviso real cuando el navegador se queda sin espacio:** al guardar tus actividades, la aplicación ya no da por hecho que se han almacenado correctamente antes de terminar. Si el navegador rechaza el guardado por falta de espacio, ya no verás un mensaje engañoso diciendo que tus datos están a salvo cuando no lo están.
- **Borrado de datos más seguro:** si al pulsar "Borrar datos guardados" la operación falla, ahora se muestra un aviso y se cancela la acción, en lugar de dar la impresión de que los datos se han eliminado cuando en realidad siguen en tu navegador.
- **El aviso de datos recuperados se queda cerrado:** cuando cierras el aviso de actividades recuperadas, ahora permanece cerrado aunque recargues o vuelvas a abrir la aplicación, en lugar de reaparecer cada vez.
- **Textos en singular y plural correctos:** el aviso de datos guardados muestra ahora "1 actividad guardada" en singular y "N actividades guardadas" en plural, según corresponda.

## [0.9.0] — 2026-06-12

### Added
- **Aviso de datos recuperados:** cuando vuelves a abrir la aplicación y se restauran automáticamente tus actividades guardadas en el navegador, un aviso te lo indica con claridad, mostrando cuántas actividades se han recuperado y la fecha de la actividad más reciente. Puedes cerrar el aviso o cargar otro conjunto de datos directamente desde ahí.
- Nueva batería de pruebas de componentes e integración con `@testing-library/react` (dependencia de testing; no se incluye en la aplicación).

### Fixed
- La fecha de la actividad más reciente que se muestra en el aviso ahora corresponde realmente a la actividad más nueva del conjunto, y no a la primera de la lista.

## [0.8.0] — 2026-06-12

### Added
- **Tus datos se recuerdan entre sesiones:** el idioma elegido y el conjunto de actividades cargado se conservan al cerrar y volver a abrir la aplicación. La próxima vez que entres, tu historial se carga automáticamente sin tener que subir el export de nuevo.
- **Botón "Borrar datos guardados":** nueva opción en la barra lateral para eliminar en cualquier momento los datos almacenados localmente en tu navegador.

### Changed
- El mensaje de privacidad se ha actualizado para reflejar que ahora los datos se guardan localmente en tu dispositivo (en tu navegador), de forma que sigues controlándolos por completo y puedes borrarlos cuando quieras.

### Fixed
- La comparativa "Comparar años" se desactiva automáticamente cuando el filtro deja de incluir dos años completos, evitando una vista vacía o confusa.
- Corregidos varios cálculos sobre los datos de demostración que en algunos casos sobreestimaban el volumen de actividad o mostraban fechas incorrectas.
- Las estadísticas ya no fallan cuando el conjunto filtrado está vacío o tiene muy pocas actividades; en su lugar muestran un resultado vacío de forma controlada.
- La base de cálculo de la carga de entrenamiento ahora usa las semanas realmente activas, dando una referencia más fiel.

### Accessibility
- Nuevo enlace "Saltar al contenido principal" al inicio de la página para usuarios de teclado y lectores de pantalla.
- Estructura semántica de la página mejorada (`<header>` y `<main>` identificados correctamente).
- Mejoras de contraste en los botones de idioma y de vista activos, en los títulos de sección y en el texto secundario para una lectura más cómoda.
- Los anuncios para lectores de pantalla son más fiables y el foco del teclado ya no se desvía de forma inesperada al cargar el panel.

### Notes
- Todo sigue siendo 100% local en el navegador: ningún dato sale de tu dispositivo. El almacenamiento utiliza las capacidades del propio navegador (localStorage e IndexedDB) y puedes borrarlo en un clic.
- Calidad: 84 pruebas automáticas cubren el guardado y recuperación de datos, la paridad de traducciones EN/ES y las regresiones de esta versión. Se añade `fake-indexeddb` como dependencia de testing (no se incluye en la aplicación).

## [0.5.0] — 2026-06-09

### Added
- **Número de Eddington:** el mayor número N tal que se han realizado al menos N actividades de N km o más, calculado de forma independiente para carrera (incluye trail y senderismo) y ciclismo. Cada deporte muestra su número y cuántas actividades faltan para alcanzar el siguiente. Solo aparece el deporte que tiene datos suficientes. Respeta el filtro de tipo activo.
- **Historial de actividad (heatmap):** cuadrícula de los últimos 365 días con el volumen diario de distancia codificado por color, etiquetas de mes y día de la semana, leyenda y tooltip por celda con fecha y distancia. Días excepcionales resaltados en color ámbar. Renderizado en SVG sin dependencias externas; en móvil se desplaza horizontalmente.

### Notes
- Todo el cálculo es local en el navegador; ningún dato sale del dispositivo. No se añaden dependencias nuevas. El heatmap solo procesa los últimos 365 días, no todo el historial.

## [0.4.0] — 2026-06-09

### Added
- **Racha y consistencia:** semanas consecutivas con al menos una actividad — racha actual y racha más larga histórica. Se calcula sobre las actividades filtradas, así que respeta el filtro de tipo activo.
- **Récords por periodo:** mejor semana y mejor mes por distancia, con el valor y el periodo al que corresponden.
- **Comparativa año a año:** nuevo conmutador "Comparar años" en Tendencias que superpone el año actual y el anterior en la misma gráfica, alineados por periodo. Solo aparece cuando hay datos de al menos dos años distintos.
- **Desglose por tipo de actividad:** gráfica de donut con el porcentaje de la distancia total que corresponde a cada tipo de actividad. Solo visible cuando el conjunto filtrado tiene más de un tipo. Incluye leyenda y tabla de datos accesible.

### Notes
- Todo el cálculo es local en el navegador; ningún dato sale del dispositivo. No se añaden dependencias nuevas.

## [0.3.0] — 2026-06-09

### Added
- **Modo demo:** botón "Explorar con datos de muestra" junto al área de carga que abre la aplicación con un histórico ficticio realista de ~18 meses (carrera, trail, ciclismo, senderismo, marcha). Permite ver totales, tendencias y filtros antes de subir el propio export. Banner persistente con salida clara. Los datos se generan en el navegador de forma determinista — sin peso extra en el bundle, sin archivos descargados.
- **Panel de privacidad reforzado:** tarjeta destacada en la pantalla de inicio con tres garantías verificables (procesamiento local, sin servidor ni cuenta, sin rastreo ni cookies) y una invitación a comprobarlo con las herramientas de desarrollo del navegador.

### Changed
- El mensaje de privacidad de la pantalla de inicio pasa de una línea a un panel completo; el aviso breve se mantiene en el pie.

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
