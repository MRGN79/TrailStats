import { describe, expect, it } from "vitest";
import {
  aggregateByPeriod,
  availableYears,
  computeRecords,
  computeStreak,
  computeTotals,
  computeTypeBreakdown,
  computeYearOverYear,
  filterByType,
} from "./aggregate";
import type { Activity } from "./types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function act(date: string, type: string, km: number, sec: number, elev: number): Activity {
  return {
    id: date + type,
    date: new Date(date),
    type,
    distanceKm: km,
    movingTimeSec: sec,
    elevationGainM: elev,
  };
}

const sample: Activity[] = [
  act("2026-01-05", "Run", 10, 3000, 100),
  act("2026-01-06", "Ride", 30, 3600, 200),
  act("2026-03-10", "Run", 5, 1500, 50),
];

describe("computeTotals", () => {
  it("sums all metrics", () => {
    const totals = computeTotals(sample);
    expect(totals.activities).toBe(3);
    expect(totals.distanceKm).toBe(45);
    expect(totals.movingTimeSec).toBe(8100);
    expect(totals.elevationGainM).toBe(350);
  });
});

describe("filterByType", () => {
  it("filters by activity type", () => {
    expect(filterByType(sample, "Run")).toHaveLength(2);
    expect(filterByType(sample, null)).toHaveLength(3);
  });
});

describe("aggregateByPeriod", () => {
  it("fills empty months between first and last activity", () => {
    const periods = aggregateByPeriod(sample, "monthly");
    // Jan, Feb (empty), Mar => 3 periods
    expect(periods).toHaveLength(3);
    expect(periods[0].key).toBe("2026-01");
    expect(periods[1].key).toBe("2026-02");
    expect(periods[1].activities).toBe(0);
    expect(periods[2].key).toBe("2026-03");
  });

  it("aggregates monthly distance correctly", () => {
    const periods = aggregateByPeriod(sample, "monthly");
    expect(periods[0].distanceKm).toBe(40);
    expect(periods[2].distanceKm).toBe(5);
  });
});

describe("computeStreak", () => {
  it("returns zeros for empty input", () => {
    expect(computeStreak([])).toEqual({ current: 0, longest: 0 });
  });

  it("counts consecutive ISO weeks for current and longest", () => {
    // Three consecutive weeks in Jan (longest=3), then a gap, then two consecutive
    // recent weeks ending this/last week (current=2). Dates chosen so the final
    // two weeks are within the stale-streak window relative to today (2026-06-13).
    const acts = [
      act("2026-01-05", "Run", 5, 100, 0),
      act("2026-01-12", "Run", 5, 100, 0),
      act("2026-01-19", "Run", 5, 100, 0),
      act("2026-06-02", "Run", 5, 100, 0), // last week
      act("2026-06-09", "Run", 5, 100, 0), // this week
    ];
    const streak = computeStreak(acts);
    expect(streak.longest).toBe(3);
    expect(streak.current).toBe(2);
  });

  it("collapses multiple activities in the same week", () => {
    // Two recent consecutive weeks; two activities fall in the first week.
    const acts = [
      act("2026-06-02", "Run", 5, 100, 0),  // last week, Monday
      act("2026-06-04", "Ride", 5, 100, 0), // last week, Wednesday (same ISO week)
      act("2026-06-09", "Run", 5, 100, 0),  // this week
    ];
    expect(computeStreak(acts)).toEqual({ current: 2, longest: 2 });
  });
});

describe("computeRecords", () => {
  it("returns nulls for empty input", () => {
    expect(computeRecords([])).toEqual({ bestWeek: null, bestMonth: null });
  });

  it("identifies the best week and best month by distance", () => {
    const acts = [
      act("2026-01-05", "Run", 10, 100, 0),
      act("2026-01-06", "Run", 5, 100, 0),
      act("2026-02-10", "Run", 40, 100, 0),
    ];
    const records = computeRecords(acts);
    expect(records.bestMonth?.distanceKm).toBe(40);
    expect(records.bestMonth?.key).toBe("2026-02");
    expect(records.bestWeek?.distanceKm).toBe(40);
  });
});

describe("computeTypeBreakdown", () => {
  it("returns empty for empty input", () => {
    expect(computeTypeBreakdown([])).toEqual([]);
  });

  it("computes shares summing to 1 and sorts by distance", () => {
    const acts = [
      act("2026-01-05", "Run", 30, 100, 0),
      act("2026-01-06", "Ride", 70, 100, 0),
    ];
    const slices = computeTypeBreakdown(acts);
    expect(slices[0].type).toBe("Ride");
    expect(slices[0].share).toBeCloseTo(0.7, 5);
    expect(slices[1].share).toBeCloseTo(0.3, 5);
    expect(slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 5);
  });
});

describe("availableYears", () => {
  it("returns sorted unique years", () => {
    const acts = [
      act("2026-01-05", "Run", 5, 100, 0),
      act("2024-06-05", "Run", 5, 100, 0),
      act("2026-07-05", "Run", 5, 100, 0),
    ];
    expect(availableYears(acts)).toEqual([2024, 2026]);
  });
});

describe("computeYearOverYear", () => {
  it("returns null with fewer than two years", () => {
    const acts = [act("2026-01-05", "Run", 5, 100, 0)];
    expect(computeYearOverYear(acts, "monthly", MONTHS)).toBeNull();
  });

  it("returns null when the two most recent active years are not consecutive", () => {
    const acts = [
      act("2020-06-01", "Run", 10, 100, 0),
      act("2023-06-01", "Run", 10, 100, 0),
    ];
    expect(computeYearOverYear(acts, "monthly", MONTHS)).toBeNull();
  });

  it("splits the two most recent years into aligned monthly buckets", () => {
    const acts = [
      act("2025-01-15", "Run", 10, 100, 0),
      act("2025-03-15", "Run", 20, 100, 0),
      act("2026-01-10", "Run", 30, 100, 0),
    ];
    const yoy = computeYearOverYear(acts, "monthly", MONTHS);
    expect(yoy).not.toBeNull();
    expect(yoy?.currentYear).toBe(2026);
    expect(yoy?.previousYear).toBe(2025);
    const jan = yoy?.points[0];
    expect(jan?.label).toBe("Jan");
    expect(jan?.current).toBe(30);
    expect(jan?.previous).toBe(10);
    const mar = yoy?.points[2];
    expect(mar?.current).toBeNull();
    expect(mar?.previous).toBe(20);
  });
});
