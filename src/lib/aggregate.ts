import type {
  Activity,
  AggregatedPeriod,
  EddingtonSport,
  EddingtonStat,
  HeatLevel,
  HeatmapData,
  HeatmapDay,
  PeriodRecord,
  PeriodRecords,
  StreakStats,
  Totals,
  TypeBreakdownSlice,
  ViewMode,
  YearOverYearData,
  YearOverYearPoint,
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

// Monday-anchored UTC timestamp for the ISO week containing `date`. Two dates in
// the same ISO week map to the same number, so consecutive-week logic can step
// in 7-day increments without parsing the year-week string.
function isoWeekStartUtc(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.getTime();
}

const WEEK_MS = 7 * 86400000;

export function computeStreak(activities: Activity[]): StreakStats {
  if (activities.length === 0) return { current: 0, longest: 0 };

  const weeks = Array.from(
    new Set(activities.map((a) => isoWeekStartUtc(a.date)))
  ).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] - weeks[i - 1] === WEEK_MS) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  // Current streak: consecutive weeks ending at the most recent active week.
  let current = 1;
  for (let i = weeks.length - 1; i > 0; i--) {
    if (weeks[i] - weeks[i - 1] === WEEK_MS) current += 1;
    else break;
  }

  return { current, longest };
}

function bestPeriod(periods: AggregatedPeriod[]): PeriodRecord | null {
  let best: AggregatedPeriod | null = null;
  for (const p of periods) {
    if (p.activities === 0) continue;
    if (!best || p.distanceKm > best.distanceKm) best = p;
  }
  if (!best) return null;
  return { key: best.key, label: best.label, distanceKm: best.distanceKm };
}

export function computeRecords(activities: Activity[]): PeriodRecords {
  if (activities.length === 0) return { bestWeek: null, bestMonth: null };
  return {
    bestWeek: bestPeriod(aggregateByPeriod(activities, "weekly")),
    bestMonth: bestPeriod(aggregateByPeriod(activities, "monthly")),
  };
}

export function computeTypeBreakdown(activities: Activity[]): TypeBreakdownSlice[] {
  if (activities.length === 0) return [];
  const byType = new Map<string, number>();
  let total = 0;
  for (const a of activities) {
    byType.set(a.type, (byType.get(a.type) ?? 0) + a.distanceKm);
    total += a.distanceKm;
  }
  if (total === 0) return [];
  return Array.from(byType.entries())
    .map(([type, distanceKm]) => ({
      type,
      distanceKm,
      share: distanceKm / total,
    }))
    .sort((a, b) => b.distanceKm - a.distanceKm);
}

export function availableYears(activities: Activity[]): number[] {
  return Array.from(new Set(activities.map((a) => a.date.getFullYear()))).sort(
    (a, b) => a - b
  );
}

// ISO week-of-year (1..53) used to align two years on the same X axis.
function isoWeekOfYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function computeYearOverYear(
  activities: Activity[],
  mode: ViewMode,
  monthLabels: string[]
): YearOverYearData | null {
  const years = availableYears(activities);
  if (years.length < 2) return null;

  const currentYear = years[years.length - 1];
  const previousYear = years[years.length - 2];

  const buckets =
    mode === "monthly"
      ? { count: 12, labelFor: (i: number) => monthLabels[i] ?? String(i + 1) }
      : { count: 53, labelFor: (i: number) => `${i + 1}` };

  const current = new Array<number>(buckets.count).fill(0);
  const previous = new Array<number>(buckets.count).fill(0);
  let currentMaxIdx = -1;
  let previousMaxIdx = -1;

  for (const a of activities) {
    const year = a.date.getFullYear();
    if (year !== currentYear && year !== previousYear) continue;
    const idx =
      mode === "monthly" ? a.date.getMonth() : isoWeekOfYear(a.date) - 1;
    if (idx < 0 || idx >= buckets.count) continue;
    if (year === currentYear) {
      current[idx] += a.distanceKm;
      if (idx > currentMaxIdx) currentMaxIdx = idx;
    } else {
      previous[idx] += a.distanceKm;
      if (idx > previousMaxIdx) previousMaxIdx = idx;
    }
  }

  const lastIdx = Math.max(currentMaxIdx, previousMaxIdx);
  const points: YearOverYearPoint[] = [];
  for (let i = 0; i <= lastIdx; i++) {
    points.push({
      index: i,
      label: buckets.labelFor(i),
      current: current[i] > 0 ? Number(current[i].toFixed(1)) : null,
      previous: previous[i] > 0 ? Number(previous[i].toFixed(1)) : null,
    });
  }

  return { currentYear, previousYear, points };
}

// ── Número de Eddington ─────────────────────────────────────

const RUN_PATTERNS = ["run", "trail", "hike"];
const CYCLING_PATTERNS = ["ride", "cycling", "bike", "virtual"];

function matchesSport(type: string, patterns: string[]): boolean {
  const lower = type.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

// E = mayor N tal que existen al menos N actividades con distancia >= N km.
// Ordenando las distancias de mayor a menor, E es el mayor índice i (base 1)
// con distancia[i-1] >= i.
function eddingtonNumber(distances: number[]): number {
  const sorted = [...distances].sort((a, b) => b - a);
  let e = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) e = i + 1;
    else break;
  }
  return e;
}

function eddingtonForSport(
  activities: Activity[],
  sport: EddingtonSport
): EddingtonStat | null {
  const patterns = sport === "run" ? RUN_PATTERNS : CYCLING_PATTERNS;
  const distances = activities
    .filter((a) => matchesSport(a.type, patterns))
    .map((a) => a.distanceKm);

  const number = eddingtonNumber(distances);
  if (number === 0) return null;

  const target = number + 1;
  const have = distances.filter((d) => d >= target).length;
  const remaining = Math.max(0, target - have);

  return { sport, number, next: { target, remaining } };
}

export function computeEddington(activities: Activity[]): EddingtonStat[] {
  if (activities.length === 0) return [];
  const stats: EddingtonStat[] = [];
  for (const sport of ["run", "cycling"] as const) {
    const stat = eddingtonForSport(activities, sport);
    if (stat) stats.push(stat);
  }
  return stats;
}

// ── Heatmap de actividad ────────────────────────────────────

const DAY_MS = 86400000;
const HEATMAP_DAYS = 365;

// Umbrales de volumen diario (km).
const LOW_MAX = 10;
const MEDIUM_MAX = 30;
const EXCEPTIONAL_MIN = 50;

function dayKeyUtc(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function heatLevel(distanceKm: number): HeatLevel {
  if (distanceKm <= 0) return "none";
  if (distanceKm >= EXCEPTIONAL_MIN) return "exceptional";
  if (distanceKm < LOW_MAX) return "low";
  if (distanceKm <= MEDIUM_MAX) return "medium";
  return "high";
}

// Cubre los últimos HEATMAP_DAYS días terminando en `today` (incluido).
// Solo itera ese rango, nunca todo el historial.
export function computeHeatmap(
  activities: Activity[],
  today: Date = new Date()
): HeatmapData {
  const endKey = dayKeyUtc(today);
  const startKey = endKey - (HEATMAP_DAYS - 1) * DAY_MS;

  const byDay = new Map<number, number>();
  for (const a of activities) {
    const key = dayKeyUtc(a.date);
    if (key < startKey || key > endKey) continue;
    byDay.set(key, (byDay.get(key) ?? 0) + a.distanceKm);
  }

  const days: HeatmapDay[] = [];
  for (let key = startKey; key <= endKey; key += DAY_MS) {
    const distanceKm = byDay.get(key) ?? 0;
    days.push({
      date: new Date(key),
      distanceKm,
      level: heatLevel(distanceKm),
    });
  }

  return {
    start: new Date(startKey),
    end: new Date(endKey),
    days,
  };
}
