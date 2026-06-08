# TrailStats

Your Strava history, in numbers — analiza el export completo de Strava sin que ningún dato salga de tu navegador.

## ¿Qué es esto?

TrailStats es una aplicación web 100% cliente para deportistas que usan Strava. Cargas el ZIP del export oficial de tu histórico, la app extrae y parsea tus actividades **en el propio navegador** y te muestra estadísticas agregadas: totales de todo tu histórico, agregados semanales y mensuales, y gráficas de tendencias en el tiempo.

Está pensada para quien quiere una foto global de su volumen y su progresión sin depender de la API de Strava ni subir sus datos a ningún servidor. **Privacidad por diseño:** no hay backend, no hay cuentas, no hay tracking. Una vez cargada la página, la app funciona sin conexión y ningún archivo abandona tu dispositivo.

La interfaz es bilingüe (inglés por defecto, castellano) y todo el procesamiento pesado corre en un Web Worker para que la UI siga fluida incluso con exports de miles de actividades.

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | UI |
| TypeScript | 5.4 | Tipado |
| Vite | 5.3 | Build y dev server |
| @zip.js/zip.js | 2.7 | Lectura en streaming del ZIP de Strava |
| PapaParse | 5.4 | Parseo del `activities.csv` |
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

1. Descarga tu export de Strava: en Strava, **Ajustes → Mi cuenta → Descargar o eliminar tu cuenta → Solicitar tu archivo**. Strava te envía por email un ZIP con todo tu histórico.
2. Abre TrailStats y arrastra ese ZIP a la zona de carga (o haz clic para seleccionarlo).
3. La app localiza y lee `activities.csv` dentro del ZIP (ignora fotos, mensajes y el resto del export).
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
│   │   ├── stravaParser.ts       Mapeo y parseo de activities.csv
│   │   ├── aggregate.ts          Agregados semanales/mensuales y totales
│   │   ├── format.ts             Formateo de números/fechas por locale
│   │   ├── loadDataset.ts        Orquestación carga → parseo → agregación
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

## Contribuir

- **Reportar bugs o proponer features:** abre un issue describiendo el comportamiento esperado y el observado, con pasos para reproducir.
- **Pull requests:** crea una rama desde `main` (`feat/`, `fix/`, `docs/`…), asegúrate de que `npm run lint` y `npm test` pasan en verde, y abre el PR usando la plantilla del repositorio.
- **i18n:** cualquier texto visible al usuario debe ir mediante clave i18n en `src/locales/en/` y `src/locales/es/` — nunca hardcodeado.

## Privacidad

TrailStats no recoge, almacena ni transmite ningún dato. Todo el procesamiento del export ocurre localmente en tu navegador. Tus archivos nunca se suben a ningún servidor.
