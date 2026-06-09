import { describe, expect, it } from "vitest";
import {
  computeBestEfforts,
  computePaceEvolution,
  computeTrainingLoad,
} from "./aggregate";
import type { Activity } from "./types";

function act(
  date: string,
  type: string,
  km: number,
  sec: number
): Activity {
  return {
    id: date + type + km,
    date: new Date(date),
    type,
    distanceKm: km,
    movingTimeSec: sec,
    elevationGainM: 0,
  };
}

describe("computePaceEvolution", () => {
  it("returns empty when there are no running activities", () => {
    const activities = [act("2024-01-10", "Ride", 40, 7200)];
    expect(computePaceEvolution(activities)).toEqual([]);
  });

  it("aggregates monthly pace from total time over total distance", () => {
    // 10km in 3000s (5:00/km) + 10km in 3600s (6:00/km) in same month
    // → 20km / 6600s = 330 s/km (5:30/km)
    const activities = [
      act("2024-03-05", "Run", 10, 3000),
      act("2024-03-20", "Run", 10, 3600),
    ];
    const result = computePaceEvolution(activities);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("2024-03");
    expect(result[0].paceSecPerKm).toBeCloseTo(330, 5);
  });

  it("includes trail runs and ignores zero-distance or zero-time activities", () => {
    const activities = [
      act("2024-04-01", "Trail Run", 12, 4200),
      act("2024-04-02", "Run", 0, 1800),
      act("2024-04-03", "Run", 5, 0),
    ];
    const result = computePaceEvolution(activities);
    expect(result).toHaveLength(1);
    expect(result[0].paceSecPerKm).toBeCloseTo(350, 5);
  });

  it("sorts months chronologically", () => {
    const activities = [
      act("2024-05-01", "Run", 10, 3000),
      act("2024-02-01", "Run", 10, 3000),
    ];
    const result = computePaceEvolution(activities);
    expect(result.map((p) => p.key)).toEqual(["2024-02", "2024-05"]);
  });
});

describe("computeBestEfforts", () => {
  it("returns only buckets with matching activities", () => {
    const activities = [act("2024-01-10", "Run", 5, 1500)];
    const result = computeBestEfforts(activities);
    expect(result.map((e) => e.bucket)).toEqual(["5k"]);
  });

  it("keeps the fastest pace per bucket", () => {
    const activities = [
      act("2024-01-10", "Run", 10, 3600), // 6:00/km
      act("2024-02-10", "Run", 10, 3000), // 5:00/km — faster
    ];
    const result = computeBestEfforts(activities);
    const tenK = result.find((e) => e.bucket === "10k");
    expect(tenK?.paceSecPerKm).toBeCloseTo(300, 5);
    expect(tenK?.date).toEqual(new Date("2024-02-10"));
  });

  it("classifies distances into the right ranges", () => {
    const activities = [
      act("2024-01-01", "Run", 5, 1500),
      act("2024-01-02", "Run", 10, 3000),
      act("2024-01-03", "Run", 21, 7200),
      act("2024-01-04", "Run", 42, 15000),
    ];
    const buckets = computeBestEfforts(activities).map((e) => e.bucket);
    expect(buckets).toEqual(["5k", "10k", "21k", "42k"]);
  });

  it("ignores distances outside any range and non-running types", () => {
    const activities = [
      act("2024-01-01", "Run", 7, 2100), // between 5k and 10k ranges
      act("2024-01-02", "Ride", 5, 600), // not running
    ];
    expect(computeBestEfforts(activities)).toEqual([]);
  });
});

describe("computeTrainingLoad", () => {
  it("returns null with no activities", () => {
    expect(computeTrainingLoad([])).toBeNull();
  });

  it("reports insufficient history below 3 baseline weeks", () => {
    const today = new Date("2024-03-25"); // Monday
    const activities = [
      act("2024-03-25", "Run", 10, 3000),
      act("2024-03-18", "Run", 10, 3000),
    ];
    const result = computeTrainingLoad(activities, today);
    expect(result?.weeksOfHistory).toBe(1);
    expect(result?.index).toBe(0);
  });

  it("computes index versus the 6-week baseline", () => {
    const today = new Date("2024-03-25"); // current week
    // Baseline: 6 prior weeks each with a 10km run (load 10 each) → baseline 10
    // Current week: 20km run → load 20 → index 2.0 → veryHigh
    const activities: Activity[] = [act("2024-03-25", "Run", 20, 6000)];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(Date.UTC(2024, 2, 25 - i * 7));
      activities.push(act(d.toISOString().slice(0, 10), "Run", 10, 3000));
    }
    const result = computeTrainingLoad(activities, today);
    expect(result?.weeksOfHistory).toBe(6);
    expect(result?.baselineLoad).toBeCloseTo(10, 5);
    expect(result?.currentLoad).toBeCloseTo(20, 5);
    expect(result?.index).toBeCloseTo(2.0, 5);
    expect(result?.state).toBe("veryHigh");
  });

  it("applies per-type load factors", () => {
    const today = new Date("2024-03-25");
    // current week: 100km ride → load 100 * 0.5 = 50
    const activities: Activity[] = [act("2024-03-25", "Ride", 100, 12000)];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(Date.UTC(2024, 2, 25 - i * 7));
      activities.push(act(d.toISOString().slice(0, 10), "Ride", 100, 12000));
    }
    const result = computeTrainingLoad(activities, today);
    expect(result?.currentLoad).toBeCloseTo(50, 5);
    expect(result?.baselineLoad).toBeCloseTo(50, 5);
    expect(result?.state).toBe("normal");
  });
});
