# TrailStats — Diseño UX/UI MVP

**Autor:** UX-UI

## Principios
- Una sola pantalla, flujo lineal: cargar → ver. Sin navegación compleja.
- Móvil primero, escala a escritorio.
- Lenguaje visual deportivo: limpio, con un acento naranja (eco de Strava sin copiar su marca).
- Cero fricción: la zona de carga es lo primero y lo más grande hasta que hay datos.

## Estados de pantalla
1. **Vacío / carga:** hero con título, tagline, nota de privacidad y dropzone grande.
2. **Procesando:** dropzone reemplazada por spinner + texto "Reading your activities…".
3. **Error:** mensaje claro bajo la dropzone, la dropzone sigue disponible.
4. **Resultados:** se oculta el hero, aparece la barra de filtros + tarjetas de totales + selector semanal/mensual + gráfica de tendencias + tabla accesible.

## Layout de resultados
- **Barra superior:** título compacto, toggle de idioma EN/ES, botón "cargar otro export".
- **Filtros:** select de tipo de actividad (incluye "All types").
- **Totales:** 4 tarjetas (actividades, distancia, tiempo, desnivel).
- **Toggle de vista:** Weekly / Monthly (segmented control).
- **Tendencias:** gráfica de barras/líneas de distancia por periodo + tabla equivalente colapsable.

## Accesibilidad (entrada para el gate)
- Dropzone operable por teclado (input file nativo + label).
- Contraste AA en texto y acento naranja sobre fondo.
- Gráfica con tabla de datos equivalente (`<table>`) para lectores de pantalla.
- Toggle de idioma y vista con roles/aria adecuados.
- Foco visible en todos los controles.

## Tokens visuales
- Acento: `#fc5200` (naranja energía). Texto: `#1a1a1a` sobre `#ffffff`; superficies `#f7f7f7`.
- Tipografía del sistema (sin webfont para mantener el bundle ligero y funcionar offline).
- Radio de tarjeta 12px, sombra suave.
- Expansión de texto EN→ES contemplada: botones y labels con padding holgado.
