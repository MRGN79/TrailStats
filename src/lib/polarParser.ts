import Papa from "papaparse";
import type { Activity, ParsedDataset } from "./types";
import { isValidHr } from "./aggregate";

// Polar Flow CSV column names (varies across export versions and locales)
const COL = {
  date:      ["date", "start time", "start date"],
  sport:     ["sport", "activity type"],
  duration:  ["duration"],
  distance:  ["total distance (km)", "distance (km)", "distance", "total distance", "km"],
  distanceM: ["total distance (m)"],
  avgHr:     ["average heart rate (bpm)", "avg. heart rate (bpm)", "avg hr (bpm)", "avg hr", "average hr"],
  maxHr:     ["maximum heart rate (bpm)", "max. heart rate (bpm)", "max hr (bpm)", "max hr"],
  calories:  ["calories", "kcal"],
  elevation: ["ascent (m)", "elevation (m)", "elevation gain (m)", "total ascent (m)", "climb (m)"],
  name:      ["notes", "title", "name"],
};

const SPORT_MAP: Record<string, string> = {
  RUNNING: "Run",
  TRAIL_RUNNING: "Run",
  ROAD_RUNNING: "Run",
  CYCLING: "Ride",
  ROAD_CYCLING: "Ride",
  MOUNTAIN_BIKING: "MountainBikeRide",
  INDOOR_CYCLING: "VirtualRide",
  WALKING: "Walk",
  HIKING: "Hike",
  SWIMMING: "Swim",
  OPEN_WATER_SWIMMING: "Swim",
  ROWING: "Rowing",
  INDOOR_ROWING: "Rowing",
  SKIING: "AlpineSki",
  DOWNHILL_SKIING: "AlpineSki",
  CROSS_COUNTRY_SKIING: "NordicSki",
  SNOWBOARDING: "Snowboard",
  YOGA: "Yoga",
  STRENGTH_TRAINING: "WeightTraining",
  FUNCTIONAL_TRAINING: "WeightTraining",
  CROSSFIT: "Workout",
  OTHER: "Workout",
  OTHER_INDOOR: "Workout",
};

function findCol(headers: string[], aliases: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseDuration(s: string): number {
  // "0:35:24" or "35:24" or "1:05:30"
  const parts = s.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parsePolarDate(s: string): Date {
  // "15.01.2026" (DD.MM.YYYY) or "2026-01-15" or "01/15/2026"
  const dmy = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const mdy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdy) return new Date(+mdy[3], +mdy[1] - 1, +mdy[2]);
  return new Date(s);
}

function mapSport(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/[\s-]/g, "_");
  return SPORT_MAP[key] ?? (raw.length ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : "Workout");
}

export function parsePolarCsv(csv: string): ParsedDataset {
  const result = Papa.parse<string[]>(csv.trim(), {
    skipEmptyLines: true,
  });

  const rows = result.data as string[][];
  if (rows.length < 2) throw new Error("NO_ACTIVITIES");

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const iDate     = findCol(headers, COL.date);
  const iSport    = findCol(headers, COL.sport);
  const iDuration = findCol(headers, COL.duration);
  const iDistKm   = findCol(headers, COL.distance);
  const iDistM    = findCol(headers, COL.distanceM);
  const iAvgHr    = findCol(headers, COL.avgHr);
  const iMaxHr    = findCol(headers, COL.maxHr);
  const iCal      = findCol(headers, COL.calories);
  const iElev     = findCol(headers, COL.elevation);
  const iName     = findCol(headers, COL.name);

  if (iDate === -1 || iDuration === -1) throw new Error("NO_ACTIVITIES");

  const activities: Activity[] = [];
  let discarded = 0;

  dataRows.forEach((row, i) => {
    const dateStr = row[iDate]?.trim();
    if (!dateStr) { discarded++; return; }

    const date = parsePolarDate(dateStr);
    if (isNaN(date.getTime())) { discarded++; return; }

    const movingTimeSec = parseDuration(row[iDuration] ?? "");

    let distanceKm = 0;
    if (iDistKm !== -1) {
      distanceKm = parseFloat(row[iDistKm] ?? "") || 0;
    } else if (iDistM !== -1) {
      distanceKm = (parseFloat(row[iDistM] ?? "") || 0) / 1000;
    }

    if (movingTimeSec <= 0 && distanceKm <= 0) { discarded++; return; }

    const avgHr   = iAvgHr  !== -1 ? parseFloat(row[iAvgHr] ?? "")  : NaN;
    const maxHr   = iMaxHr  !== -1 ? parseFloat(row[iMaxHr] ?? "")  : NaN;
    const calories = iCal   !== -1 ? parseFloat(row[iCal] ?? "")    : NaN;
    const elevation = iElev !== -1 ? parseFloat(row[iElev] ?? "")   : NaN;
    const name    = iName   !== -1 ? row[iName]?.trim() || null     : null;

    const sport = iSport !== -1 ? row[iSport]?.trim() ?? "" : "";

    activities.push({
      id: `polar-${dateStr}-${i}`,
      date,
      type: mapSport(sport),
      distanceKm,
      movingTimeSec,
      elevationGainM: isNaN(elevation) ? 0 : elevation,
      avgHrBpm: isValidHr(isNaN(avgHr) ? null : avgHr) ? avgHr : null,
      maxHrBpm: isValidHr(isNaN(maxHr) ? null : maxHr) ? maxHr : null,
      avgCadence: null,
      calories: !isNaN(calories) && calories > 0 && calories < 50000 ? Math.round(calories) : null,
      avgPowerW: null,
      activityName: name,
    });
  });

  if (activities.length === 0) throw new Error("NO_ACTIVITIES");

  const activityTypes = Array.from(new Set(activities.map((a) => a.type))).sort();
  return { activities, activityTypes, discardedRows: discarded };
}
