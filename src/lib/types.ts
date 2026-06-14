export interface Activity {
  id: string;
  date: Date;
  type: string;
  distanceKm: number;
  movingTimeSec: number;
  elevationGainM: number;
}

export interface Totals {
  activities: number;
  distanceKm: number;
  movingTimeSec: number;
  elevationGainM: number;
}

export interface AggregatedPeriod {
  key: string;
  label: string;
  activities: number;
  distanceKm: number;
  movingTimeSec: number;
  elevationGainM: number;
}

export interface ParsedDataset {
  activities: Activity[];
  activityTypes: string[];
  discardedRows: number;
}

export type ViewMode = "weekly" | "monthly";

export interface StreakStats {
  current: number;
  longest: number;
}

export interface PeriodRecord {
  key: string;
  label: string;
  distanceKm: number;
}

export interface PeriodRecords {
  bestWeek: PeriodRecord | null;
  bestMonth: PeriodRecord | null;
}

export interface TypeBreakdownSlice {
  type: string;
  distanceKm: number;
  share: number;
}

export interface YearOverYearPoint {
  index: number;
  label: string;
  current: number | null;
  previous: number | null;
}

export interface YearOverYearData {
  currentYear: number;
  previousYear: number;
  points: YearOverYearPoint[];
}

export type EddingtonSport = "run" | "cycling";

export interface EddingtonStat {
  sport: EddingtonSport;
  number: number;
  next: {
    target: number;
    remaining: number;
  };
}

export type HeatLevel = "none" | "low" | "medium" | "high" | "exceptional";

export interface HeatmapDay {
  date: Date;
  distanceKm: number;
  level: HeatLevel;
}

export interface HeatmapData {
  start: Date;
  end: Date;
  days: HeatmapDay[];
}

export interface PaceEvolutionPoint {
  key: string;
  label: string;
  paceSecPerKm: number;
}

export type EffortBucket = "5k" | "10k" | "21k" | "42k";

export interface BestEffort {
  bucket: EffortBucket;
  paceSecPerKm: number;
  date: Date;
}

export type TrainingLoadState = "low" | "normal" | "high" | "veryHigh";

export interface TrainingLoad {
  currentLoad: number;
  baselineLoad: number;
  index: number;
  state: TrainingLoadState;
  weeksOfHistory: number;
}

// ── Race Predictor ───────────────────────────────────────────

export interface RacePredictionItem {
  bucket: EffortBucket;
  distanceKm: number;
  timeSeconds: number;
  isActual: boolean;
}

export interface RacePredictorResult {
  items: RacePredictionItem[];
  base: EffortBucket | null;
}

// ── Pace Zones ───────────────────────────────────────────────

export interface PaceZoneData {
  zone: 1 | 2 | 3 | 4 | 5;
  timeSeconds: number;
  share: number;
}

export interface PaceZonesData {
  zones: PaceZoneData[];
  thresholdPaceSecPerKm: number;
}

// ── Fitness & Freshness (CTL/ATL/TSB) ───────────────────────

export interface FitnessPoint {
  date: Date;
  ctl: number;
  atl: number;
  tsb: number;
}

export interface FitnessData {
  points: FitnessPoint[];
}

export interface DayOfWeekStat {
  dayIndex: number; // 0 = Mon … 6 = Sun (ISO)
  distanceKm: number;
  count: number;
}

export interface DistanceHistogramBucket {
  key: string;
  min: number;
  max: number;
  count: number;
}

export interface LongRunPoint {
  date: Date;
  distanceKm: number;
}
