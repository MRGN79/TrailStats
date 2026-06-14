import { describe, expect, it } from "vitest";
import {
  computeDayOfWeekStats,
  computeDistanceHistogram,
  computeLongRunTrend,
} from "./aggregate";
import type { Activity } from "./types";

function act(overrides: Partial<Activity> = {}): Activity {
  return {
    id: Math.random().toString(),
    date: new Date(2024, 0, 1, 10, 0, 0), // Monday 2024-01-01, local time
    type: "Run",
    distanceKm: 10,
    movingTimeSec: 3600,
    elevationGainM: 100,
    ...overrides,
  };
}

// ── computeDayOfWeekStats ────────────────────────────────────────────────────

describe("computeDayOfWeekStats", () => {
  it("returns 7 slots with zeros for empty input", () => {
    const result = computeDayOfWeekStats([]);
    expect(result).toHaveLength(7);
    expect(result.every((s) => s.distanceKm === 0 && s.count === 0)).toBe(true);
    expect(result.map((s) => s.dayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("maps Monday (2024-01-01) to index 0", () => {
    const result = computeDayOfWeekStats([act({ date: new Date(2024, 0, 1, 10, 0, 0) })]);
    expect(result[0].count).toBe(1);
    expect(result[0].distanceKm).toBe(10);
  });

  it("maps Sunday to index 6", () => {
    const result = computeDayOfWeekStats([act({ date: new Date(2024, 0, 7, 10, 0, 0) })]);
    expect(result[6].count).toBe(1);
  });

  it("accumulates multiple activities on the same day", () => {
    const result = computeDayOfWeekStats([
      act({ date: new Date(2024, 0, 1, 8, 0, 0), distanceKm: 5 }),
      act({ date: new Date(2024, 0, 8, 9, 0, 0), distanceKm: 8 }),
    ]);
    expect(result[0].count).toBe(2);
    expect(result[0].distanceKm).toBeCloseTo(13);
  });

  it("skips activities with distanceKm <= 0", () => {
    const result = computeDayOfWeekStats([act({ distanceKm: 0 }), act({ distanceKm: -1 })]);
    expect(result.every((s) => s.count === 0)).toBe(true);
  });
});

// ── computeDistanceHistogram ─────────────────────────────────────────────────

describe("computeDistanceHistogram", () => {
  it("returns empty array for no activities", () => {
    expect(computeDistanceHistogram([])).toHaveLength(0);
  });

  it("places a 3 km run in the lt5 bucket", () => {
    const result = computeDistanceHistogram([act({ distanceKm: 3 })]);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("lt5");
    expect(result[0].count).toBe(1);
  });

  it("places a 5 km run in the 5to10 bucket (min inclusive)", () => {
    const result = computeDistanceHistogram([act({ distanceKm: 5 })]);
    expect(result[0].key).toBe("5to10");
  });

  it("places a 42 km run in the gt42 bucket (min inclusive at boundary)", () => {
    const result = computeDistanceHistogram([act({ distanceKm: 42 })]);
    expect(result[0].key).toBe("gt42");
  });

  it("places 41.9 km in 20to42 bucket", () => {
    const result = computeDistanceHistogram([act({ distanceKm: 41.9 })]);
    expect(result[0].key).toBe("20to42");
  });

  it("omits empty buckets from the result", () => {
    const result = computeDistanceHistogram([act({ distanceKm: 7 })]);
    expect(result.every((b) => b.count > 0)).toBe(true);
  });

  it("skips activities with distanceKm <= 0", () => {
    expect(computeDistanceHistogram([act({ distanceKm: 0 })])).toHaveLength(0);
  });
});

// ── computeLongRunTrend ──────────────────────────────────────────────────────

describe("computeLongRunTrend", () => {
  it("returns empty array for no activities", () => {
    expect(computeLongRunTrend([])).toHaveLength(0);
  });

  it("ignores non-running activities", () => {
    const result = computeLongRunTrend([act({ type: "Ride", distanceKm: 50 })]);
    expect(result).toHaveLength(0);
  });

  it("returns one point per month with the longest run", () => {
    const result = computeLongRunTrend([
      act({ date: new Date("2024-01-10T10:00:00Z"), distanceKm: 15 }),
      act({ date: new Date("2024-01-20T10:00:00Z"), distanceKm: 22 }),
      act({ date: new Date("2024-02-05T10:00:00Z"), distanceKm: 18 }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].distanceKm).toBe(22);
    expect(result[1].distanceKm).toBe(18);
  });

  it("points are sorted chronologically", () => {
    const result = computeLongRunTrend([
      act({ date: new Date("2024-03-01T10:00:00Z"), distanceKm: 10 }),
      act({ date: new Date("2024-01-01T10:00:00Z"), distanceKm: 12 }),
      act({ date: new Date("2024-02-01T10:00:00Z"), distanceKm: 8 }),
    ]);
    const dates = result.map((p) => p.date.toISOString().slice(0, 7));
    expect(dates).toEqual(["2024-01", "2024-02", "2024-03"]);
  });

  it("sets the date to the first of the month UTC", () => {
    const result = computeLongRunTrend([
      act({ date: new Date("2024-06-15T10:00:00Z"), distanceKm: 20 }),
    ]);
    expect(result[0].date.getUTCDate()).toBe(1);
    expect(result[0].date.getUTCMonth()).toBe(5); // June = 5
  });

  it("accepts TrailRun as running activity", () => {
    const result = computeLongRunTrend([
      act({ type: "TrailRun", distanceKm: 30, date: new Date("2024-05-01T10:00:00Z") }),
    ]);
    expect(result).toHaveLength(1);
  });

  it("skips activities with distanceKm <= 0", () => {
    const result = computeLongRunTrend([act({ distanceKm: 0 })]);
    expect(result).toHaveLength(0);
  });
});
