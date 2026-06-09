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
