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
