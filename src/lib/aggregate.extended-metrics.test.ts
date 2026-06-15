import { describe, expect, it } from "vitest";
import {
  computeCadenceTrend,
  computePowerTrend,
  computeTotalCalories,
  detectSportCategory,
  hasCadenceData,
  hasPowerData,
} from "./aggregate";
import type { Activity } from "./types";

interface Overrides {
  type?: string;
  sec?: number;
  km?: number;
  avgCadence?: number | null;
  avgPowerW?: number | null;
  calories?: number | null;
}

function act(date: string, o: Overrides = {}): Activity {
  return {
    id: date,
    date: new Date(date),
    type: o.type ?? "Run",
    distanceKm: o.km ?? 10,
    movingTimeSec: o.sec ?? 3600,
    elevationGainM: 0,
    avgHrBpm: null,
    maxHrBpm: null,
    avgCadence: o.avgCadence ?? null,
    avgPowerW: o.avgPowerW ?? null,
    calories: o.calories ?? null,
    activityName: null,
  };
}

// ── detectSportCategory ──────────────────────────────────────

describe("detectSportCategory", () => {
  it("returns mixed for null", () => {
    expect(detectSportCategory(null)).toBe("mixed");
  });

  it("detects running", () => {
    expect(detectSportCategory("Run")).toBe("running");
    expect(detectSportCategory("Trail Run")).toBe("running");
  });

  it("detects cycling", () => {
    expect(detectSportCategory("Ride")).toBe("cycling");
    expect(detectSportCategory("VirtualRide")).toBe("cycling");
  });

  it("returns other for unrelated types", () => {
    expect(detectSportCategory("Hike")).toBe("other");
  });
});

// ── hasCadenceData ───────────────────────────────────────────

describe("hasCadenceData", () => {
  it("returns false for empty", () => {
    expect(hasCadenceData([])).toBe(false);
  });

  it("returns false when no activity has cadence", () => {
    expect(hasCadenceData([act("2024-01-01"), act("2024-01-02")])).toBe(false);
  });

  it("returns true when any activity has valid cadence", () => {
    expect(hasCadenceData([act("2024-01-01"), act("2024-01-02", { avgCadence: 165 })])).toBe(true);
  });
});

// ── hasPowerData ─────────────────────────────────────────────

describe("hasPowerData", () => {
  it("returns false for empty", () => {
    expect(hasPowerData([])).toBe(false);
  });

  it("returns false when no activity has power", () => {
    expect(hasPowerData([act("2024-01-01"), act("2024-01-02")])).toBe(false);
  });

  it("returns true when any activity has valid power", () => {
    expect(hasPowerData([act("2024-01-01", { avgPowerW: 220 })])).toBe(true);
  });
});

// ── computeTotalCalories ─────────────────────────────────────

describe("computeTotalCalories", () => {
  it("returns null when no activity has calories", () => {
    expect(computeTotalCalories([act("2024-01-01"), act("2024-01-02")])).toBe(null);
  });

  it("sums calories across activities", () => {
    expect(
      computeTotalCalories([
        act("2024-01-01", { calories: 500 }),
        act("2024-01-02", { calories: 320 }),
      ])
    ).toBe(820);
  });

  it("excludes null calories from the sum", () => {
    expect(
      computeTotalCalories([
        act("2024-01-01", { calories: 500 }),
        act("2024-01-02", { calories: null }),
        act("2024-01-03", { calories: 200 }),
      ])
    ).toBe(700);
  });
});

// ── computeCadenceTrend ──────────────────────────────────────

describe("computeCadenceTrend", () => {
  it("returns empty for empty input", () => {
    expect(computeCadenceTrend([])).toEqual([]);
  });

  it("returns empty with fewer than 2 months of data", () => {
    expect(
      computeCadenceTrend([act("2024-01-01", { avgCadence: 160 })])
    ).toEqual([]);
  });

  it("returns one point per month with 2+ months", () => {
    const points = computeCadenceTrend([
      act("2024-01-10", { avgCadence: 160 }),
      act("2024-02-10", { avgCadence: 170 }),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0].avgCadence).toBe(160);
    expect(points[1].avgCadence).toBe(170);
  });

  it("weights by moving time within a month", () => {
    const points = computeCadenceTrend([
      act("2024-01-10", { avgCadence: 160, sec: 3600 }),
      act("2024-01-20", { avgCadence: 180, sec: 1200 }),
      act("2024-02-10", { avgCadence: 150 }),
    ]);
    // (160*3600 + 180*1200) / 4800 = 165
    expect(points[0].avgCadence).toBe(165);
  });
});

// ── computePowerTrend ────────────────────────────────────────

describe("computePowerTrend", () => {
  it("returns empty for empty input", () => {
    expect(computePowerTrend([])).toEqual([]);
  });

  it("returns empty with fewer than 2 months of data", () => {
    expect(
      computePowerTrend([act("2024-01-01", { avgPowerW: 200 })])
    ).toEqual([]);
  });

  it("returns one point per month with 2+ months", () => {
    const points = computePowerTrend([
      act("2024-01-10", { avgPowerW: 200 }),
      act("2024-02-10", { avgPowerW: 240 }),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0].avgPowerW).toBe(200);
    expect(points[1].avgPowerW).toBe(240);
  });

  it("weights by moving time within a month", () => {
    const points = computePowerTrend([
      act("2024-01-10", { avgPowerW: 200, sec: 3600 }),
      act("2024-01-20", { avgPowerW: 260, sec: 1200 }),
      act("2024-02-10", { avgPowerW: 180 }),
    ]);
    // (200*3600 + 260*1200) / 4800 = 215
    expect(points[0].avgPowerW).toBe(215);
  });
});
