# TrailStats

Your training history, in numbers — analiza el export completo de tu plataforma de actividad (Strava, Garmin Connect) sin que ningún dato salga de tu navegador.

## ¿Qué es esto?

TrailStats es una aplicación web 100% cliente para deportistas. Cargas el export oficial de tu histórico desde tu plataforma de actividad (Strava o Garmin Connect), la app detecta automáticamente el formato, extrae y parsea tus actividades **en el propio navegador** y te muestra estadísticas agregadas: totales de todo tu histórico, agregados semanales y mensuales, y gráficas de tendencias en el tiempo.

Está pensada para quien quiere una foto global de su volumen y su progresión sin depender de la API de ninguna plataforma ni subir sus datos a ningún servidor. **Privacidad por diseño:** no hay backend, no hay cuentas, no hay tracking. Una vez cargada la página, la app funciona sin conexión y ningún archivo abandona tu dispositivo.

La interfaz es bilingüe (inglés por defecto, castellano) y todo el procesamiento pesado corre en un Web Worker para que la UI siga fluida incluso con exports de miles de actividades.

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | UI |
| TypeScript | 5.4 | Tipado |
| Vite | 5.3 | Build y dev server |
| @zip.js/zip.js | 2.7 | Lectura en streaming del ZIP del export |
| PapaParse | 5.4 | Parseo del `activities.csv` (export Strava) |
| fit-file-parser | 3.0 | Parseo de archivos FIT (export Garmin Connect) |
| Recharts | 2.12 | Gráficas de tendencias |
| react-i18next / i18next | 14.1 / 23.11 | Internacionalización EN/ES |
| Vitest | 1.6 | Tests |

## Requisitos previos

- **Node.js** 18 o superior (desarrollado y probado con Node 22)
- **npm** 9 o superior (incluido con Node)

No se necesita base de datos, servidor ni servicios externos.

## Instalación y configuración local

```bash
git clone <url-del-repositorio>
cd TrailStats
npm install
```

## Variables de entorno

TrailStats no necesita variables de entorno. Toda la funcionalidad es cliente y no hay configuración secreta ni endpoints externos.

| Variable | Descripción | Obligatoria | Ejemplo |
|---|---|---|---|
| — | No aplica | No | — |

## Cómo ejecutar

Servidor de desarrollo (recarga en caliente):

```bash
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

Build de producción (genera el sitio estático en `dist/`):

```bash
npm run build
```

Previsualizar el build de producción localmente:

```bash
npm run preview
```

## Cómo usar la app

1. Descarga el export oficial de tu plataforma de actividad:
   - **Strava:** **Ajustes → Mi cuenta → Descargar o eliminar tu cuenta → Solicitar tu archivo**. Strava te envía por email un ZIP con todo tu histórico (incluye `activities.csv`).
   - **Garmin Connect:** **Account Management Center → Exportar tus datos**. Garmin te envía un ZIP con el export masivo de tu histórico (incluye los archivos `.fit` de tus actividades).
2. Abre TrailStats y arrastra ese ZIP a la zona de carga (o haz clic para seleccionarlo).
3. La app detecta automáticamente la plataforma de origen y lee el contenido relevante del ZIP: `activities.csv` en el export de Strava, o los archivos `.fit` en el export masivo de Garmin (ignora fotos, mensajes y el resto del export).
4. Explora los totales de tu histórico, cambia entre vista semanal y mensual, filtra por tipo de actividad y revisa la gráfica de tendencias.
5. Cambia el idioma con el selector EN/ES en la barra superior.

## Cómo ejecutar los tests

```bash
npm test
```

Para el lint:

```bash
npm run lint
```

## Estructura del proyecto

```
TrailStats/
├── src/
│   ├── components/          Componentes de UI
│   │   ├── UploadZone.tsx        Zona de carga del ZIP
│   │   ├── Toolbar.tsx           Barra de filtros y acciones
│   │   ├── TotalsCards.tsx       Tarjetas de totales del histórico
│   │   ├── TrendsChart.tsx       Gráfica de tendencias + tabla accesible
│   │   └── LanguageToggle.tsx    Selector de idioma EN/ES
│   ├── lib/                 Lógica de dominio (sin UI)
│   │   ├── zipReader.ts          Lectura en streaming del ZIP (zip.js)
│   │   ├── parserRegistry.ts     Detección automática y registro de parsers por plataforma
│   │   ├── stravaParser.ts       Mapeo y parseo de activities.csv (export Strava)
│   │   ├── garminParser.ts       Parseo de archivos FIT (Garmin Connect, Coros, Wahoo)
│   │   ├── appleHealthParser.ts  Parseo de export.xml (export Apple Health)
│   │   ├── polarParser.ts        Parseo de training-sessions.csv (export Polar Flow)
│   │   ├── repository.ts         Interfaz ActivityRepository + IndexedDB (ver ADR-002)
│   │   ├── preferences.ts        Preferencias de UI en localStorage (idioma, banner)
│   │   ├── aggregate.ts          Agregados semanales/mensuales y totales
│   │   ├── format.ts             Formateo de números/fechas por locale
│   │   ├── loadDataset.ts        Orquestación carga → parseo → agregación
│   │   ├── summaryCard.ts        Generación de tarjeta PNG para compartir
│   │   ├── demoData.ts           Datos de muestra para el modo demo
│   │   ├── dateRange.ts          Utilidades de filtrado por rango de fechas
│   │   ├── processor.worker.ts   Web Worker para procesamiento pesado
│   │   └── types.ts              Modelo de datos interno
│   ├── locales/             Traducciones
│   │   ├── en/translation.json   Inglés (por defecto)
│   │   └── es/translation.json   Castellano
│   ├── styles/              CSS de la app
│   ├── i18n.ts              Configuración de i18next
│   ├── App.tsx              Componente raíz
│   └── main.tsx             Punto de entrada
├── docs/
│   ├── decisions/           ADRs (decisiones de arquitectura)
│   ├── specs/               Especificación funcional del MVP
│   └── design/              Diseño UX/UI
├── public/                  Assets estáticos
├── index.html              HTML base
└── package.json
```

## Cómo desplegar

TrailStats es un sitio estático. El build produce `dist/`, que puede servirse desde cualquier hosting de estáticos (Netlify, Vercel, GitHub Pages, S3, etc.):

```bash
npm run build
# sube el contenido de dist/ a tu hosting de estáticos
```

No requiere servidor de aplicación, runtime de Node en producción ni variables de entorno.

## Reportar bugs

Para reportar bugs o proponer mejoras, abre un issue describiendo el comportamiento esperado y el observado, con pasos para reproducir. Las contribuciones de código externas (pull requests) no son aceptadas sin acuerdo previo por escrito con el propietario. Consultas: marugann@gmail.com

## Privacidad

TrailStats no recoge, almacena ni transmite ningún dato. Todo el procesamiento del export ocurre localmente en tu navegador. Tus archivos nunca se suben a ningún servidor.

## Aviso legal

TrailStats es una herramienta independiente y no está afiliada a Strava, Inc. ni a Garmin Ltd., ni cuenta con su respaldo o patrocinio. "Strava" y "Garmin" son marcas registradas de sus respectivos titulares. TrailStats trabaja exclusivamente con el archivo de export que el propio usuario descarga de su cuenta de Strava o de Garmin Connect.

## Licencia

TrailStats es software **source-available**, no open source.

Copyright (c) 2026 MRGN79. All rights reserved.

Se permite ver el código fuente y ejecutar TrailStats para uso personal y no comercial. Cualquier uso comercial, redistribución u hospedaje del software (o de un derivado) requiere permiso previo y por escrito del propietario. Consulta el archivo [LICENSE](./LICENSE) para los términos completos, o contacta a marugann@gmail.com para consultas de licenciamiento comercial.

## Third-Party Notices

TrailStats incorpora los siguientes componentes de terceros, bajo sus respectivas licencias:

| Componente | Licencia |
|---|---|
| [@zip.js/zip.js](https://github.com/gildas-lormeau/zip.js) | BSD-3-Clause |
| [fit-file-parser](https://github.com/jimmykane/fit-parser) | MIT |
| [Inter](https://rsms.me/inter/) (via @fontsource/inter) | SIL Open Font License 1.1 |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (via @fontsource/jetbrains-mono) | SIL Open Font License 1.1 |
| [Space Grotesk](https://github.com/floriankarsten/space-grotesk) (via @fontsource/space-grotesk) | SIL Open Font License 1.1 |
| [PapaParse](https://www.papaparse.com/) | MIT |
| [React](https://react.dev/) | MIT |
| [Recharts](https://recharts.org/) | MIT |
| [i18next](https://www.i18next.com/) / [react-i18next](https://react.i18next.com/) | MIT |

Los textos completos de las licencias de los componentes de terceros están disponibles en sus repositorios y en el directorio `node_modules/` correspondiente.
