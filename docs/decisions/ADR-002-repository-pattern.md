# ADR-002: Capa de persistencia desacoplada mediante ActivityRepository

**Fecha:** 2026-06-15
**Estado:** Aceptado
**Decidido por:** Arquitecto

---

## Contexto

TrailStats es actualmente una SPA 100% cliente. La persistencia de actividades
usa IndexedDB directamente desde `App.tsx`, lo que mezcla el "qué guardar" con
el "cómo guardarlo".

Cuando llegue una migración a backend (auth, sync entre dispositivos), hay dos
escenarios posibles:

- **Parseo sigue en cliente:** el usuario carga su ZIP, el navegador parsea y
  extrae las actividades, y *el dataset resultante* (ya limpio, sin el fichero
  original) se sincroniza al backend. La privacidad se mantiene: el fichero
  original nunca sale del dispositivo.
- **Parseo en servidor:** el ZIP se sube al servidor para parsear allí. Rompe la
  propuesta de valor de privacidad. **Descartado.**

El refactor introduce una interfaz `ActivityRepository` para que el código de la
aplicación no sepa cómo ni dónde se persisten los datos.

---

## Decisión

Se introduce una interfaz `ActivityRepository` en `src/lib/repository.ts`:

```typescript
export interface ActivityRepository {
  load(): Promise<ParsedDataset | null>;
  save(dataset: ParsedDataset): Promise<void>;
  clear(): Promise<void>;
}
```

La implementación actual (`IndexedDBRepository`) vive en el mismo fichero y
se exporta como un singleton:

```typescript
export const repository: ActivityRepository = new IndexedDBRepository();
```

`App.tsx` usa únicamente `repository.load/save/clear()`. Si se cambia
la implementación en `repository.ts`, `App.tsx` no se toca.

Las preferencias de UI (idioma, banner) se mueven a `src/lib/preferences.ts`
porque son datos del navegador local que **nunca irán al backend**.

---

## Cómo migrar a un backend (Supabase u otro)

### Paso 1 — Crear la implementación

```typescript
// src/lib/SupabaseRepository.ts
import type { ActivityRepository } from "./repository";
import type { ParsedDataset } from "./types";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export class SupabaseRepository implements ActivityRepository {
  async load(): Promise<ParsedDataset | null> {
    // SELECT de la tabla de actividades del usuario autenticado
    // Reconstruir ParsedDataset desde las filas
    // Retornar null si no hay filas
  }

  async save(dataset: ParsedDataset): Promise<void> {
    // UPSERT de dataset.activities en la tabla de actividades
    // La columna user_id viene del usuario autenticado (supabase.auth.getUser())
  }

  async clear(): Promise<void> {
    // DELETE de todas las filas del usuario autenticado
  }
}
```

### Paso 2 — Conectar el singleton

Cuando el usuario esté autenticado, reemplaza el singleton en `repository.ts`:

```typescript
// src/lib/repository.ts (línea a sustituir)

// Antes (IndexedDB, siempre):
export const repository: ActivityRepository = new IndexedDBRepository();

// Después (condicional auth):
import { SupabaseRepository } from "./SupabaseRepository";

function buildRepository(): ActivityRepository {
  // Si hay sesión activa → backend; si no → IndexedDB local
  return supabase.auth.getSession() ? new SupabaseRepository() : new IndexedDBRepository();
}

export const repository: ActivityRepository = buildRepository();
```

O bien mediante React Context si quieres que el repositorio cambie en tiempo
de ejecución (ej. al hacer login sin recargar la página):

```typescript
// src/lib/RepositoryContext.tsx
const RepositoryContext = React.createContext<ActivityRepository>(
  new IndexedDBRepository()
);
export const useRepository = () => React.useContext(RepositoryContext);
// En App.tsx: <RepositoryContext.Provider value={activeRepository}>
```

### Paso 3 — Migración de datos (IndexedDB → backend)

Al hacer login por primera vez, el usuario puede tener datos en IndexedDB.
La migración es:

```typescript
const local = new IndexedDBRepository();
const remote = new SupabaseRepository();
const existing = await local.load();
if (existing) {
  await remote.save(existing);  // sube al backend
  await local.clear();          // limpia IndexedDB local
}
```

### Paso 4 — Variables de entorno

Añadir a `.env` (nunca al repositorio):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Separación de responsabilidades

| Módulo | Responsabilidad | ¿Irá al backend? |
|---|---|---|
| `src/lib/repository.ts` | Persistencia del dataset de actividades | Sí — la interfaz permanece, la implementación cambia |
| `src/lib/preferences.ts` | Preferencias de UI en localStorage (idioma, banner) | No — siempre cliente |
| `src/lib/aggregate.ts` | Cómputos y agregados | No — siempre cliente (privacidad) |
| Parsers (strava/garmin) | Lectura de ZIPs y FITs | No — siempre cliente (privacidad) |

---

## Consecuencias

**Positivas:**
- `App.tsx` es agnóstico respecto al backend: no cambia al migrar.
- Los tests mockean `repository` como objeto, no funciones sueltas.
- La interfaz documenta el contrato que cualquier backend debe cumplir.
- La migración de datos (IndexedDB → backend) es un script de 5 líneas.

**A tener en cuenta:**
- `repository` es un singleton inicializado al cargar el módulo. Si la
  implementación debe cambiar en tiempo de ejecución (login/logout sin
  recarga), usar React Context en lugar del singleton.
- `ParsedDataset` contiene instancias `Date`. Un backend que serialice a JSON
  devolverá strings; la implementación del repositorio debe rehidratar esas
  fechas antes de retornar el objeto (`new Date(row.date)`).
- Las actividades están en `ParsedDataset.activities[]`. Supabase esperará
  una tabla (`activities`) con una fila por actividad, no un blob del objeto
  entero. El mapping entre la interfaz TypeScript y el esquema SQL va dentro
  de `SupabaseRepository`, no en `App.tsx`.
