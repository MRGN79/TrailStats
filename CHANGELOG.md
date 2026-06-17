# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

### Added
- **Soporte multi-plataforma — Apple Health y Polar Flow:** TrailStats detecta ahora automáticamente el origen del export y lo procesa con el parser correspondiente. Se añaden dos nuevas plataformas compatibles:
  - **Apple Health:** importa el archivo `export.xml` dentro del ZIP de Apple Health. Extrae tipo de actividad, distancia, duración, calorías, FC media y máxima, desnivel y cadencia (cuando están disponibles como `WorkoutStatistics`). Las distancias en millas se convierten a km.
  - **Polar Flow:** importa `training-sessions.csv` del export de Polar Flow. Detecta los nombres de columna automáticamente para cubrir distintas versiones y locales de la aplicación (inglés, finlandés, etc.). Convierte las duraciones en formato `H:MM:SS` y las fechas en formato `DD.MM.YYYY`, `MM/DD/YYYY` o ISO.
  - **Coros y Wahoo:** estos dispositivos exportan en formato FIT estándar, que ya soportaba TrailStats, por lo que funcionan sin cambios.
  La zona de carga actualiza su texto para indicar las plataformas compatibles (Strava, Garmin, Apple Health, Polar y más).
- **Licencia propietaria source-available:** TrailStats pasa de MIT a una licencia propietaria que reserva todos los derechos. El código sigue siendo visible en GitHub y puede usarse para uso personal y no comercial; cualquier uso comercial, redistribución u hospedaje del software requiere permiso previo y por escrito del propietario (marugann@gmail.com). El archivo LICENSE contiene los términos completos. Se actualiza `package.json` (campo `license`), el README (sección de licencia y avisos de terceros) y se añade un aviso de copyright en el footer de la aplicación.
- **Compartir resumen como imagen:** el botón "Compartir resumen" de la barra lateral genera una tarjeta 1080×1080 px con las seis métricas clave (actividades, distancia, tiempo, desnivel, racha actual y mejor semana). En móviles usa la API de compartir nativa del sistema; en escritorio descarga un PNG directamente. La tarjeta sigue la misma identidad visual de TrailStats (fondo oscuro, tipografía monoespaciada, patrón topo).
- **Filtro por periodo:** el panel de control incluye ahora un selector de periodo junto al filtro de tipo de actividad. Se pueden elegir presets rápidos (Este año, Año anterior, Últimos 6 meses, Últimos 3 meses) o definir un rango personalizado con fechas de inicio y fin. Al cargar un nuevo archivo o volver al modo demo el periodo se resetea a "Todo el historial".
- **Métricas extendidas — cadencia, potencia y calorías:** TrailStats lee ahora cadencia media, potencia media (vatios) y calorías tanto de los exports de Strava (CSV) como de Garmin (FIT). Con esos datos aparecen automáticamente nuevas secciones en el panel:
  - **Tendencia de cadencia:** evolución mensual de la cadencia media, con unidades adaptadas a la disciplina (ppm para carrera, rpm para ciclismo).
  - **Tendencia de potencia:** evolución mensual de la potencia media en vatios (solo visible cuando hay datos de potencia en actividades de ciclismo).
  - **Calorías totales:** tarjeta en la sección de Totales con las kcal acumuladas (solo si tus actividades incluyen ese dato).
  Como siempre, estas secciones solo aparecen si tus datos incluyen la información correspondiente.
- **Visualización contextual por tipo de actividad:** al filtrar por tipo de actividad mediante el desplegable, el panel muestra ahora solo las secciones relevantes para esa disciplina. Las métricas de carrera (ritmo, zonas de ritmo, mejores esfuerzos, predictor de carrera, tirada larga) se ocultan al filtrar por ciclismo o actividades sin distancia, y la potencia solo aparece en contexto de ciclismo. Cuando se selecciona "Todos los tipos" o una categoría mixta, se muestran todas las secciones disponibles.
- **Frecuencia cardíaca:** TrailStats lee ahora la FC media y máxima de los exports de Strava (CSV) y Garmin (FIT). Con esos datos aparecen automáticamente dos nuevas secciones en el panel de entrenamiento:
  - **Tendencia de FC:** gráfica de línea con la FC media mensual, para ver si tu corazón trabaja menos a igual esfuerzo (señal de mejora aeróbica).
  - **Zonas de FC:** distribución del tiempo de movimiento en cinco zonas de intensidad cardíaca (Z1 recuperación a Z5 máxima), con umbrales fijos expresados en ppm.
  Ambas secciones solo aparecen si tus datos incluyen información de FC; si no, el panel es idéntico al anterior. La FC media global también se muestra en la tarjeta de Totales.
- **Privacidad de datos de salud:** el panel de privacidad informa ahora explícitamente de que la FC es un dato de salud y se procesa únicamente en tu dispositivo, sin transmitirse a ningún servidor. También se precisa que el almacenamiento usa IndexedDB (no solo "local storage").
- **Borrado de datos desde el panel de privacidad:** el panel de privacidad incluye ahora un botón para eliminar las actividades guardadas en este navegador. Solo aparece cuando hay datos almacenados y pide confirmación antes de borrar, para que nunca pierdas tu historial por accidente.
- CI en GitHub Actions: cada PR hacia `main` ejecuta automáticamente la verificación de tipos TypeScript y la batería de tests antes de permitir el merge.

### Changed
- **Selector Semanal/Mensual junto a la sección Tendencias:** el selector de vista Semanal/Mensual aparece ahora junto a la gráfica de Tendencias, en lugar de en la barra de controles global. Así queda más cerca de la gráfica a la que afecta y la barra de controles superior queda más despejada. El funcionamiento es el mismo de siempre.
- **Toggle "Comparar años" junto a la sección Tendencias:** el conmutador "Comparar años" aparece ahora junto al título de la sección Tendencias, en lugar de en la barra de controles global. Así queda más cerca de la gráfica a la que afecta y la barra de controles superior queda más despejada.
- **Ritmo visual del panel más uniforme:** se ha homogeneizado la separación vertical entre las secciones del dashboard, eliminando huecos desiguales para que la lectura de arriba a abajo sea más regular. También se ha unificado el tamaño de las etiquetas pequeñas (subtítulos de sección, descargos, distintivos) para una apariencia más consistente.

### Fixed
- **Día de la semana correcto fuera de la zona horaria UTC:** la gráfica de patrón de entrenamiento asignaba el día de la semana equivocado a las actividades de usuarios en husos horarios distintos de UTC. Ahora cada actividad cuenta en su día real según tu hora local.
- **Comparativa año a año más precisa:** la comparación entre años localiza ahora de forma explícita el año anterior al actual, en lugar de deducirlo. El resultado que ves es el mismo, pero el cálculo es más robusto.
- **Procesado más fiable de los exports de Garmin:** cada archivo `.fit` se interpreta ahora de forma totalmente independiente, evitando que los datos de una actividad pudieran contaminar la lectura de otra dentro del mismo export.
- **El globo de ayuda (ⓘ) ya no se sale de la pantalla:** la explicación que aparece al pulsar el botón de información se ajusta ahora a los bordes de la pantalla, para que se vea entera también en móviles y pantallas pequeñas.
- **El número de Eddington de carrera ya no se infla con el senderismo:** las actividades de tipo "Hike" dejan de contar para el número de Eddington de carrera; ahora solo se tienen en cuenta las carreras y las actividades de trail.
- **El gráfico "Distancia por tipo de actividad" oculta los tipos sin distancia:** los tipos de actividad que no registran distancia (por ejemplo, entrenamiento de fuerza o yoga) dejan de aparecer en el gráfico y en su leyenda, para que la vista se centre en lo que sí tiene kilómetros.

### Accessibility
- **Mejoras de contraste (WCAG AA):** se ha aumentado el contraste de varios textos secundarios (la nota de las zonas de ritmo y la versión de la app en el pie) para que se lean con más comodidad.
- **Indicador de foco en los campos de entrada:** los campos de texto muestran ahora el mismo anillo de foco visible que el resto de controles al navegar con teclado.

## [0.11.0] — 2026-06-14

### Added
- **Botón de información (ⓘ) en las tarjetas de métricas:** cada tarjeta de métrica incluye ahora un botón de información que abre una explicación en lenguaje claro de qué significa el dato y cómo se calcula, disponible en inglés y castellano. Pensado para que cualquiera entienda métricas como la racha, el número de Eddington o la predicción de carrera sin conocimientos previos.
- **Rango de fechas en los totales históricos:** debajo de "Totales históricos" se muestra ahora, de forma discreta, el periodo que cubren tus datos (primera – última actividad), para situar de un vistazo a qué tramo de tiempo corresponden las cifras.

### Changed
- **Decimales de distancia más pequeños en Racha y Récords:** en las tarjetas de mejor semana y mejor mes, la parte decimal de la distancia se muestra ahora en un tamaño menor, para que la cifra principal destaque y se lea con más facilidad.

## [0.10.0] — 2026-06-14

### Added
- **Patrón de entrenamiento:** nueva gráfica de barras que muestra la distancia total acumulada por día de la semana (de lunes a domingo). De un vistazo descubres qué días entrenas más y cuáles sueles dejar para descansar.
- **Perfil de distancias:** nuevo histograma que reparte tus actividades según su distancia (menos de 5 km, de 5 a 10, de 10 a 20, de 20 a 42 y más de 42 km). Te ayuda a ver si predominan las salidas cortas, las medias o las largas.
- **Evolución de la tirada larga:** nueva gráfica de líneas con la carrera más larga de cada mes (solo actividades de carrera). Sirve para seguir cómo progresa tu salida más exigente a lo largo del tiempo.

### Changed
- **Panel reordenado para una lectura más natural:** se ha reorganizado el orden de las secciones del panel para que la información fluya mejor y encuentres antes lo que más miras.
  - Sección social: Totales → Racha y récords → Mejores marcas → Predictor de carreras → Eddington.
  - Sección de entrenamiento: Historial de actividad → Carga de entrenamiento → Forma física y frescura → Tendencias → Evolución de la tirada larga → Evolución del ritmo → Zonas de ritmo → Patrón de entrenamiento → Perfil de distancias → Desglose por tipo de actividad.

### Notes
- Todo el cálculo sigue siendo 100% local en el navegador; ningún dato sale de tu dispositivo. Las tres gráficas nuevas no añaden dependencias.

## [0.9.5] — 2026-06-13

### Fixed
- **La racha ignora actividades con fecha futura:** si pre-registras una carrera con fecha posterior a hoy, la racha ya no aparece como activa por ese motivo. Antes, una actividad fechada en el futuro mantenía la racha "viva" aunque llevaras semanas sin entrenar.
- **La comparativa año a año ignora actividades con fecha futura:** las actividades fechadas en el futuro dejan de contar en la comparación entre años. Antes, una salida pre-registrada para julio de 2026 aparecía en la gráfica como si ya hubiera ocurrido.
- **El predictor de carreras explica por qué no aparece:** cuando tienes mejores marcas pero ninguna en 5K, 10K o media maratón (solo en maratón), la sección ya no desaparece sin avisar. En su lugar muestra el mensaje "A best effort at 5K, 10K, or half marathon is needed for race predictions."

## [0.9.4] — 2026-06-13

### Fixed
- **La carga de entrenamiento no muestra datos obsoletos:** si tu última actividad es de hace más de seis semanas, la carga de entrenamiento deja de mostrarse como si fuera tu carga actual. En su lugar, aparece un mensaje que explica que no hay datos recientes suficientes, en vez de desaparecer sin avisar.
- **Aviso en el historial de actividad cuando no hay datos del último año:** si el mapa de calor no tiene ninguna actividad en los últimos doce meses, ahora se muestra el mensaje "Sin actividades en el último año" en lugar de una cuadrícula vacía.
- **Las zonas de ritmo explican por qué no aparecen:** cuando no hay suficientes carreras para calcularlas (hacen falta al menos cinco), la sección muestra ahora un mensaje claro en lugar de quedar oculta sin explicación.
- **El número de Eddington explica por qué no aparece:** igual que las zonas de ritmo, cuando no hay actividades suficientes para calcularlo, ahora se muestra un mensaje en lugar de ocultar la sección en silencio.

### Accessibility
- Los cuatro nuevos mensajes de estado vacío (carga de entrenamiento, historial de actividad, zonas de ritmo y número de Eddington) se anuncian correctamente a los lectores de pantalla (`role="status"`, WCAG 4.1.3).
- El mapa de calor se oculta a los lectores de pantalla (`aria-hidden`) cuando no contiene actividad, para que no lean una cuadrícula vacía.

## [0.9.3] — 2026-06-13

### Added
- **Compartir tu racha más larga:** la tarjeta de la racha más larga incluye ahora un botón para compartirla, igual que el resto de tarjetas de récords.

### Fixed
- **Distancias correctas en exports de Strava no ingleses:** las cifras con formato europeo (punto para los miles, coma para los decimales) se interpretan ahora correctamente. Antes, los exports de Strava en idiomas como el castellano podían mostrar distancias erróneas.
- **Meses sin actividad distinguibles del periodo sin datos:** en la comparativa año a año, los meses sin ninguna salida dentro de tu rango de datos aparecen ahora como 0, en lugar de quedar vacíos. Así se diferencian los periodos de descanso de los tramos para los que simplemente no hay historial.
- **Mensaje claro cuando ningún archivo de Garmin se puede leer:** si todos los archivos `.fit` de un export de Garmin fallan al procesarse, se muestra ahora el aviso adecuado de "sin actividades" en lugar de un error genérico.
- **Aviso cuando los datos no se pueden guardar:** si la aplicación no consigue guardar tus actividades en el navegador, ahora te lo indica claramente ("los datos no se han podido guardar localmente") en lugar de descartar el fallo en silencio.
- **Nivel de calor excepcional con leyenda:** en el historial de actividad (heatmap), los días con un volumen excepcional (50 km o más) cuentan ahora con su propia entrada en la leyenda, en inglés y en castellano.

### Changed
- Mejoras internas de mantenimiento y rendimiento: simplificación del cálculo de la fecha más reciente, unificación de la lógica de cálculo de forma física, y optimización del formateo de fechas y los estilos compartidos de las gráficas. Sin cambios visibles en el uso de la aplicación.

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
