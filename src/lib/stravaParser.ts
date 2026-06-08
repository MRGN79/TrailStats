import Papa from "papaparse";
import type { Activity, ParsedDataset } from "./types";

// Strava exports activities.csv with headers that vary by account language.
// We resolve columns by a set of known aliases, falling back gracefully.
const COLUMN_ALIASES: Record<string, string[]> = {
  id: ["activity id", "id de actividad"],
  date: ["activity date", "fecha de la actividad"],
  type: ["activity type", "tipo de actividad"],
  distance: ["distance", "distancia"],
  movingTime: ["moving time", "tiempo en movimiento"],
  elevation: ["elevation gain", "desnivel positivo", "elevation"],
};

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

function buildColumnMap(headers: string[]): Record<string, number> {
  const normalized = headers.map(normalize);
  const map: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1) {
        map[field] = idx;
        break;
      }
    }
  }
  return map;
}

function toNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function metersToKm(meters: number): number {
  return meters / 1000;
}

// Strava distance/elevation in activities.csv are in meters; moving time in seconds.
function rowToActivity(
  cols: string[],
  map: Record<string, number>,
  fallbackId: number
): Activity | null {
  const dateRaw = cols[map.date];
  if (dateRaw === undefined) return null;
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return null;

  return {
    id: cols[map.id]?.trim() || `row-${fallbackId}`,
    date,
    type: cols[map.type]?.trim() || "Unknown",
    distanceKm: metersToKm(toNumber(cols[map.distance])),
    movingTimeSec: toNumber(cols[map.movingTime]),
    elevationGainM: toNumber(cols[map.elevation]),
  };
}

export function parseActivitiesCsv(csv: string): ParsedDataset {
  const result = Papa.parse<string[]>(csv, {
    skipEmptyLines: true,
  });

  const rows = result.data;
  if (rows.length < 2) {
    return { activities: [], activityTypes: [], discardedRows: 0 };
  }

  const headers = rows[0];
  const map = buildColumnMap(headers);

  // If we can't even find a date column, the file isn't a Strava activities export.
  if (map.date === undefined) {
    throw new Error("NO_ACTIVITIES");
  }

  const activities: Activity[] = [];
  let discarded = 0;

  for (let i = 1; i < rows.length; i++) {
    const activity = rowToActivity(rows[i], map, i);
    if (activity) {
      activities.push(activity);
    } else {
      discarded++;
    }
  }

  const activityTypes = Array.from(new Set(activities.map((a) => a.type))).sort();

  return { activities, activityTypes, discardedRows: discarded };
}
