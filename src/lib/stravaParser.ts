import Papa from "papaparse";
import type { Activity, ParsedDataset } from "./types";
import { isValidHr } from "./aggregate";

// Strava exports activities.csv with headers that vary by account language.
// We resolve columns by a set of known aliases, falling back gracefully.
const COLUMN_ALIASES: Record<string, string[]> = {
  id: ["activity id", "id de actividad"],
  date: ["activity date", "fecha de la actividad"],
  type: ["activity type", "tipo de actividad"],
  distance: ["distance", "distancia"],
  movingTime: ["moving time", "tiempo en movimiento"],
  elevation: ["elevation gain", "desnivel positivo", "elevation"],
  avgHr: ["average heart rate", "pulsaciones medias", "frecuencia cardiaca media", "fc media"],
  maxHr: ["max heart rate", "pulsaciones máximas", "frecuencia cardiaca máxima", "fc máxima"],
};

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

// Spanish Strava exports use locale month abbreviations and "de" connectors
// that JS Date can't parse. E.g. "1 de ene. de 2024, 8:00:00".
const ES_MONTH: Record<string, string> = {
  ene: "jan",
  abr: "apr",
  ago: "aug",
  dic: "dec",
  sept: "sep",
};

function parseActivityDate(raw: string): Date {
  let s = raw.trim();
  // "1 de ene. de 2024, 8:00" → "1 ene 2024, 8:00"
  s = s.replace(/\bde\s+/gi, "");
  s = s.replace(/([a-záéíóúñ])\./gi, "$1");
  s = s.replace(
    /\b(ene|abr|ago|dic|sept)\b/gi,
    (m) => ES_MONTH[m.toLowerCase()]
  );
  return new Date(s);
}

function buildColumnMap(headers: string[]): Record<string, number> {
  const normalized = headers.map(normalize);
  const map: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      // Use lastIndexOf so that when a column appears twice (e.g. Spanish exports
      // have "Distancia" twice — first in km, second in meters), we pick the
      // second occurrence, which is always in SI units with dot decimal separators.
      const idx = normalized.lastIndexOf(alias);
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
  const s = raw.trim();
  const dotIdx = s.lastIndexOf(".");
  const commaIdx = s.lastIndexOf(",");
  if (dotIdx === -1 && commaIdx === -1) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  if (dotIdx === -1) {
    // No dot: comma is the decimal separator ("22,98")
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  if (commaIdx === -1) {
    // No comma: dot is the decimal separator ("1234.56")
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }
  let n: number;
  if (commaIdx > dotIdx) {
    // European format: "1.234,56" — dot=thousands, comma=decimal
    n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  } else {
    // English format: "1,234.56" — comma=thousands, dot=decimal
    n = parseFloat(s.replace(/,/g, ""));
  }
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
  const date = parseActivityDate(dateRaw);
  if (Number.isNaN(date.getTime())) return null;

  const avgHrRaw = toNumber(cols[map.avgHr]);
  const maxHrRaw = toNumber(cols[map.maxHr]);

  return {
    id: cols[map.id]?.trim() || `row-${fallbackId}`,
    date,
    type: cols[map.type]?.trim() || "Unknown",
    distanceKm: metersToKm(toNumber(cols[map.distance])),
    movingTimeSec: toNumber(cols[map.movingTime]),
    elevationGainM: toNumber(cols[map.elevation]),
    avgHrBpm: isValidHr(avgHrRaw) ? avgHrRaw : null,
    maxHrBpm: isValidHr(maxHrRaw) ? maxHrRaw : null,
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
