import type {
  Activity,
  AggregatedPeriod,
  BestEffort,
  EddingtonSport,
  EddingtonStat,
  EffortBucket,
  FitnessData,
  FitnessPoint,
  HeatLevel,
  HeatmapData,
  HeatmapDay,
  PaceEvolutionPoint,
  PaceZoneData,
  PaceZonesData,
  PeriodRecord,
  PeriodRecords,
  RacePredictionItem,
  RacePredictorResult,
  StreakStats,
  Totals,
  TrainingLoad,
  TrainingLoadState,
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

  if (points.length === 0) return null;
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

// ── Pace, esfuerzos y carga (running) ───────────────────────
//
// Zonas de FC: NO implementadas. El modelo Activity solo expone
// id/date/type/distanceKm/movingTimeSec/elevationGainM, y ni stravaParser
// (activities.csv) ni garminParser (sesiones FIT) extraen avgHrBpm/maxHrBpm.
// Sin datos de frecuencia cardiaca en origen, una sección de zonas de FC sería
// inventada; se omite hasta que los parsers capturen FC.

// Patrones de tipo que se consideran "carrera a pie" para pace y esfuerzos.
const RUNNING_PATTERNS = ["run", "trail"];

function isRunning(type: string): boolean {
  const lower = type.toLowerCase();
  return RUNNING_PATTERNS.some((p) => lower.includes(p));
}

// Pace medio mensual (segundos por km) sobre actividades de carrera con tiempo
// y distancia válidos. Solo se incluyen meses que tengan al menos una.
export function computePaceEvolution(
  activities: Activity[]
): PaceEvolutionPoint[] {
  const buckets = new Map<string, { distanceKm: number; movingTimeSec: number }>();
  for (const a of activities) {
    if (!isRunning(a.type)) continue;
    if (a.distanceKm <= 0 || a.movingTimeSec <= 0) continue;
    const key = monthKey(a.date);
    const bucket = buckets.get(key) ?? { distanceKm: 0, movingTimeSec: 0 };
    bucket.distanceKm += a.distanceKm;
    bucket.movingTimeSec += a.movingTimeSec;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .map(([key, b]) => ({
      key,
      label: key,
      paceSecPerKm: b.movingTimeSec / b.distanceKm,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

const EFFORT_RANGES: Record<EffortBucket, [number, number]> = {
  "5k": [4.0, 6.5],
  "10k": [8.5, 12.0],
  "21k": [18.0, 24.0],
  "42k": [38.0, 47.0],
};

// Mejor pace (más bajo = mejor) en cada rango de distancia, sobre carreras con
// tiempo y distancia válidos. Devuelve solo los rangos con al menos una marca.
export function computeBestEfforts(activities: Activity[]): BestEffort[] {
  const best = new Map<EffortBucket, BestEffort>();

  for (const a of activities) {
    if (!isRunning(a.type)) continue;
    if (a.distanceKm <= 0 || a.movingTimeSec <= 0) continue;
    const pace = a.movingTimeSec / a.distanceKm;

    for (const bucket of Object.keys(EFFORT_RANGES) as EffortBucket[]) {
      const [min, max] = EFFORT_RANGES[bucket];
      if (a.distanceKm < min || a.distanceKm > max) continue;
      const current = best.get(bucket);
      if (!current || pace < current.paceSecPerKm) {
        best.set(bucket, { bucket, paceSecPerKm: pace, date: a.date });
      }
    }
  }

  const order: EffortBucket[] = ["5k", "10k", "21k", "42k"];
  return order.filter((b) => best.has(b)).map((b) => best.get(b)!);
}

// Factor de carga por tipo de actividad.
function loadFactor(type: string): number {
  const lower = type.toLowerCase();
  if (lower.includes("run") || lower.includes("trail")) return 1.0;
  if (lower.includes("ride") || lower.includes("cycling") || lower.includes("bike"))
    return 0.5;
  if (lower.includes("hike")) return 0.7;
  return 0.8;
}

const LOAD_BASELINE_WEEKS = 6;

function trainingLoadState(index: number): TrainingLoadState {
  if (index < 0.8) return "low";
  if (index <= 1.3) return "normal";
  if (index <= 1.5) return "high";
  return "veryHigh";
}

// Carga semanal = Σ distanceKm × factor por tipo. Compara la semana en curso
// con la media de las LOAD_BASELINE_WEEKS semanas previas. Se ancla a la semana
// de la última actividad (no a today) para que exports antiguos muestren datos útiles.
export function computeTrainingLoad(
  activities: Activity[],
  today: Date = new Date()
): TrainingLoad | null {
  if (activities.length === 0) return null;

  const latestActivity = activities.reduce(
    (max, a) => (a.date > max ? a.date : max),
    activities[0].date
  );
  const anchor = latestActivity < today ? latestActivity : today;
  const currentWeekStart = isoWeekStartUtc(anchor);

  const byWeek = new Map<number, number>();
  for (const a of activities) {
    const week = isoWeekStartUtc(a.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + a.distanceKm * loadFactor(a.type));
  }

  const currentLoad = byWeek.get(currentWeekStart) ?? 0;

  const baselineWeeks: number[] = [];
  for (let i = 1; i <= LOAD_BASELINE_WEEKS; i++) {
    const weekStart = currentWeekStart - i * WEEK_MS;
    baselineWeeks.push(byWeek.get(weekStart) ?? 0);
  }

  const weeksOfHistory = baselineWeeks.filter((w) => w > 0).length;
  if (weeksOfHistory < 3) {
    return {
      currentLoad,
      baselineLoad: 0,
      index: 0,
      state: "normal",
      weeksOfHistory,
    };
  }

  const baselineLoad =
    baselineWeeks.reduce((sum, w) => sum + w, 0) / weeksOfHistory;
  const index = baselineLoad > 0 ? currentLoad / baselineLoad : 0;

  return {
    currentLoad,
    baselineLoad,
    index,
    state: trainingLoadState(index),
    weeksOfHistory,
  };
}

// ── Race Predictor ───────────────────────────────────────────

const BUCKET_DISTANCES: Record<EffortBucket, number> = {
  "5k": 5,
  "10k": 10,
  "21k": 21.0975,
  "42k": 42.195,
};

// Riegel formula: T2 = T1 × (D2/D1)^1.06
function riegelPredict(baseTimeSec: number, baseDistKm: number, targetDistKm: number): number {
  return baseTimeSec * Math.pow(targetDistKm / baseDistKm, 1.06);
}

export function computeRacePredictor(efforts: BestEffort[]): RacePredictorResult {
  if (efforts.length === 0) return { items: [], base: null };

  const order: EffortBucket[] = ["5k", "10k", "21k", "42k"];
  // Build a map for quick lookup
  const effortMap = new Map<EffortBucket, BestEffort>();
  for (const e of efforts) effortMap.set(e.bucket, e);

  // Pick best base: 5K > 10K > 21K
  let baseEffort: BestEffort | null = null;
  for (const b of ["5k", "10k", "21k"] as EffortBucket[]) {
    if (effortMap.has(b)) {
      baseEffort = effortMap.get(b)!;
      break;
    }
  }
  if (!baseEffort) return { items: [], base: null };

  const baseBucket = baseEffort.bucket;
  const baseDistKm = BUCKET_DISTANCES[baseBucket];
  const baseTimeSec = baseEffort.paceSecPerKm * baseDistKm;

  const baseIdx = order.indexOf(baseBucket);
  // Predict all buckets from base onwards (and include base as actual)
  const items: RacePredictionItem[] = [];

  for (const bucket of order) {
    const idx = order.indexOf(bucket);
    if (idx < baseIdx) continue; // don't predict shorter than base

    const actual = effortMap.get(bucket);
    if (actual) {
      items.push({
        bucket,
        distanceKm: BUCKET_DISTANCES[bucket],
        timeSeconds: actual.paceSecPerKm * BUCKET_DISTANCES[bucket],
        isActual: true,
      });
    } else {
      items.push({
        bucket,
        distanceKm: BUCKET_DISTANCES[bucket],
        timeSeconds: riegelPredict(baseTimeSec, baseDistKm, BUCKET_DISTANCES[bucket]),
        isActual: false,
      });
    }
  }

  return { items, base: baseBucket };
}

// ── Pace Zones ───────────────────────────────────────────────

const MIN_RUNNING_ACTIVITIES = 5;

export function computePaceZones(activities: Activity[]): PaceZonesData | null {
  const runActivities = activities.filter(
    (a) =>
      isRunning(a.type) &&
      a.distanceKm >= 1 &&
      a.distanceKm > 0 &&
      a.movingTimeSec > 0
  );

  if (runActivities.length < MIN_RUNNING_ACTIVITIES) return null;

  const paces = runActivities
    .map((a) => a.movingTimeSec / a.distanceKm)
    .sort((a, b) => a - b);

  // Clamp to index ≥ 1 so we never use the single fastest run as threshold —
  // at the 5-activity minimum, Math.floor(5×0.10) = 0, which collapses every
  // other activity into Z1.
  const thresholdIdx = Math.max(1, Math.floor(paces.length * 0.10));
  const thresholdPace = paces[thresholdIdx] ?? paces[paces.length - 1];

  const zoneSeconds = [0, 0, 0, 0, 0]; // index 0 = Z1, ..., 4 = Z5

  for (const a of runActivities) {
    const pace = a.movingTimeSec / a.distanceKm;
    let zoneIdx: number;
    if (pace > thresholdPace * 1.33) zoneIdx = 0;      // Z1
    else if (pace > thresholdPace * 1.14) zoneIdx = 1; // Z2
    else if (pace > thresholdPace * 1.06) zoneIdx = 2; // Z3
    else if (pace > thresholdPace * 0.99) zoneIdx = 3; // Z4
    else zoneIdx = 4;                                   // Z5
    zoneSeconds[zoneIdx] += a.movingTimeSec;
  }

  const totalSeconds = zoneSeconds.reduce((s, v) => s + v, 0);

  const zones: PaceZoneData[] = zoneSeconds.map((timeSeconds, i) => ({
    zone: (i + 1) as 1 | 2 | 3 | 4 | 5,
    timeSeconds,
    share: totalSeconds > 0 ? timeSeconds / totalSeconds : 0,
  }));

  return { zones, thresholdPaceSecPerKm: thresholdPace };
}

// ── Fitness & Freshness (CTL/ATL/TSB) ───────────────────────

function fitnessDayKey(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function fitnessLoadFactor(type: string): number {
  const lower = type.toLowerCase();
  if (lower.includes("run") || lower.includes("trail")) return 1.0;
  if (lower.includes("ride") || lower.includes("cycling") || lower.includes("bike"))
    return 0.5;
  if (lower.includes("hike")) return 0.7;
  return 0.8;
}

const SIX_MONTHS_MS = 183 * DAY_MS;
const DECAY_TAIL_MS = 90 * DAY_MS;

export function computeFitness(activities: Activity[]): FitnessData {
  if (activities.length === 0) return { points: [] };

  // Build daily load map
  const dailyLoad = new Map<number, number>();
  let minKey = Infinity;
  let maxKey = -Infinity;
  for (const a of activities) {
    const key = fitnessDayKey(a.date);
    if (key < minKey) minKey = key;
    if (key > maxKey) maxKey = key;
    dailyLoad.set(key, (dailyLoad.get(key) ?? 0) + a.distanceKm * fitnessLoadFactor(a.type));
  }

  const todayKey = fitnessDayKey(new Date());
  const totalDays = (todayKey - minKey) / DAY_MS + 1;

  if (totalDays < 28) return { points: [] };

  const k_ctl = Math.exp(-1 / 42);
  const k_atl = Math.exp(-1 / 7);

  let ctl = 0;
  let atl = 0;
  // Anchor display window to the last activity: show 6 months before it and up to
  // 90 days of decay after it (capped at today). This ensures the chart always
  // shows the period with real data even if the export is months/years old.
  const displayEnd = Math.min(todayKey, maxKey + DECAY_TAIL_MS);
  const displayStart = Math.max(minKey, displayEnd - SIX_MONTHS_MS);
  const points: FitnessPoint[] = [];

  for (let dayKey = minKey; dayKey <= displayEnd; dayKey += DAY_MS) {
    const load = dailyLoad.get(dayKey) ?? 0;
    ctl = ctl * k_ctl + load * (1 - k_ctl);
    atl = atl * k_atl + load * (1 - k_atl);
    const tsb = ctl - atl;

    if (dayKey >= displayStart) {
      points.push({
        date: new Date(dayKey),
        ctl: Number(ctl.toFixed(1)),
        atl: Number(atl.toFixed(1)),
        tsb: Number(tsb.toFixed(1)),
      });
    }
  }

  return { points };
}
