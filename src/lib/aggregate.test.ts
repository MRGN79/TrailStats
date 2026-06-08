import { describe, expect, it } from "vitest";
import { aggregateByPeriod, computeTotals, filterByType } from "./aggregate";
import type { Activity } from "./types";

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
