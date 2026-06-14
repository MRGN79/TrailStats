import FitParser from "fit-file-parser";
import type { Activity, ParsedDataset } from "./types";
import type { FitEntry } from "./zipReader";
import { isValidHr } from "./aggregate";

// fit-file-parser only re-exports FitParser from its public entry point, so we
// model the subset of the parsed shape we consume rather than importing internals.
type ParsedFit = Awaited<ReturnType<FitParser["parseAsync"]>>;

export interface FitSession {
  start_time: string;
  sport?: string;
  total_distance?: number;
  total_timer_time?: number;
  total_elapsed_time?: number;
  total_ascent?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
}

// Map FIT `sport` enum to a human label aligned with Strava activity types.
const SPORT_LABEL: Record<string, string> = {
  running: "Run",
  cycling: "Ride",
  e_biking: "EBikeRide",
  walking: "Walk",
  hiking: "Hike",
  swimming: "Swim",
  rowing: "Rowing",
  alpine_skiing: "AlpineSki",
  cross_country_skiing: "NordicSki",
  snowboarding: "Snowboard",
  snowshoeing: "Snowshoe",
  inline_skating: "InlineSkate",
  rock_climbing: "RockClimbing",
  mountaineering: "Mountaineering",
  stand_up_paddleboarding: "StandUpPaddling",
  kayaking: "Kayaking",
  surfing: "Surfing",
  training: "Workout",
  fitness_equipment: "Workout",
};

function labelFor(sport: string | undefined): string {
  if (!sport) return "Unknown";
  return SPORT_LABEL[sport] ?? capitalize(sport.replace(/_/g, " "));
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function sessionToActivity(
  session: FitSession,
  fallbackId: string
): Activity | null {
  const utc = new Date(session.start_time);
  if (Number.isNaN(utc.getTime())) return null;
  // FIT start_time is UTC. Create a local-time Date from the UTC components so
  // date-bucketing (getFullYear/Month/Date) is consistent with Strava CSV dates,
  // which parse as local time.
  const date = new Date(
    utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(),
    utc.getUTCHours(), utc.getUTCMinutes(), utc.getUTCSeconds()
  );

  const movingTimeSec =
    session.total_timer_time ?? session.total_elapsed_time ?? 0;

  return {
    id: fallbackId,
    date,
    type: labelFor(session.sport),
    // FitParser is configured with lengthUnit "km", so total_distance is km.
    distanceKm: session.total_distance ?? 0,
    movingTimeSec,
    elevationGainM: session.total_ascent ?? 0,
    avgHrBpm: isValidHr(session.avg_heart_rate) ? session.avg_heart_rate : null,
    maxHrBpm: isValidHr(session.max_heart_rate) ? session.max_heart_rate : null,
  };
}

function sessionsFrom(parsed: ParsedFit): FitSession[] {
  const top = (parsed as { sessions?: FitSession[] }).sessions;
  if (top?.length) return top;
  const nested = (parsed as { activity?: { sessions?: FitSession[] } }).activity
    ?.sessions;
  if (nested?.length) return nested;
  return [];
}

export async function parseFitFiles(entries: FitEntry[]): Promise<ParsedDataset> {
  const activities: Activity[] = [];
  let discarded = 0;

  for (let f = 0; f < entries.length; f++) {
    const parser = new FitParser({
      mode: "list",
      lengthUnit: "km",
      speedUnit: "km/h",
      force: true,
    });
    const entry = entries[f];
    let parsed: ParsedFit;
    try {
      parsed = await parser.parseAsync(toArrayBuffer(entry.bytes));
    } catch {
      discarded++;
      continue;
    }

    const sessions = sessionsFrom(parsed);
    if (sessions.length === 0) {
      discarded++;
      continue;
    }

    sessions.forEach((session, s) => {
      const activity = sessionToActivity(session, `${entry.filename}#${s}`);
      if (activity) {
        activities.push(activity);
      } else {
        discarded++;
      }
    });
  }

  if (activities.length === 0) {
    throw new Error("EMPTY_FIT");
  }

  const activityTypes = Array.from(new Set(activities.map((a) => a.type))).sort();
  return { activities, activityTypes, discardedRows: discarded };
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}
