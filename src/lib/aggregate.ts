import type {
  Activity,
  AggregatedPeriod,
  Totals,
  ViewMode,
} from "./types";

export function filterByType(activities: Activity[], type: string | null): Activity[] {
  if (!type) return activities;
  return activities.filter((a) => a.type === type);
}

export function computeTotals(activities: Activity[]): Totals {
  return activities.reduce<Totals>(
    (acc, a) => ({
      activities: acc.activities + 1,
      distanceKm: acc.distanceKm + a.distanceKm,
      movingTimeSec: acc.movingTimeSec + a.movingTimeSec,
      elevationGainM: acc.elevationGainM + a.elevationGainM,
    }),
    { activities: 0, distanceKm: 0, movingTimeSec: 0, elevationGainM: 0 }
  );
}

function isoWeekKey(date: Date): string {
  // ISO-8601 week number, week starts Monday.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addPeriod(target: AggregatedPeriod, a: Activity): void {
  target.activities += 1;
  target.distanceKm += a.distanceKm;
  target.movingTimeSec += a.movingTimeSec;
  target.elevationGainM += a.elevationGainM;
}

function emptyPeriod(key: string): AggregatedPeriod {
  return {
    key,
    label: key,
    activities: 0,
    distanceKm: 0,
    movingTimeSec: 0,
    elevationGainM: 0,
  };
}

function enumerateWeekKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  // Align cursor to Monday.
  const day = cursor.getUTCDay() || 7;
  cursor.setUTCDate(cursor.getUTCDate() - (day - 1));
  const last = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  while (cursor <= last) {
    keys.push(isoWeekKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return Array.from(new Set(keys));
}

function enumerateMonthKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    keys.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

export function aggregateByPeriod(
  activities: Activity[],
  mode: ViewMode
): AggregatedPeriod[] {
  if (activities.length === 0) return [];

  const keyFn = mode === "weekly" ? isoWeekKey : monthKey;
  const buckets = new Map<string, AggregatedPeriod>();

  let min = activities[0].date;
  let max = activities[0].date;
  for (const a of activities) {
    if (a.date < min) min = a.date;
    if (a.date > max) max = a.date;
    const key = keyFn(a.date);
    if (!buckets.has(key)) buckets.set(key, emptyPeriod(key));
    addPeriod(buckets.get(key)!, a);
  }

  // Fill empty periods so trends are not distorted (US-3 criterion).
  const allKeys =
    mode === "weekly" ? enumerateWeekKeys(min, max) : enumerateMonthKeys(min, max);
  for (const key of allKeys) {
    if (!buckets.has(key)) buckets.set(key, emptyPeriod(key));
  }

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}
