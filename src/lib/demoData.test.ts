import { describe, expect, it } from "vitest";
import { generateDemoDataset } from "./demoData";

const FIXED_NOW = new Date(2025, 5, 15);

describe("generateDemoDataset", () => {
  it("is deterministic for a fixed reference date", () => {
    const a = generateDemoDataset(FIXED_NOW);
    const b = generateDemoDataset(FIXED_NOW);
    expect(a.activities.length).toBe(b.activities.length);
    expect(a.activities[0]).toEqual(b.activities[0]);
    expect(a.activities[a.activities.length - 1]).toEqual(
      b.activities[b.activities.length - 1]
    );
  });

  it("produces a non-trivial dataset spanning roughly 18 months", () => {
    const { activities } = generateDemoDataset(FIXED_NOW);
    expect(activities.length).toBeGreaterThan(150);

    const first = activities[0].date;
    const last = activities[activities.length - 1].date;
    const months =
      (last.getFullYear() - first.getFullYear()) * 12 +
      (last.getMonth() - first.getMonth());
    expect(months).toBeGreaterThanOrEqual(16);
    expect(months).toBeLessThanOrEqual(18);
  });

  it("never produces activities in the future", () => {
    const { activities } = generateDemoDataset(FIXED_NOW);
    for (const a of activities) {
      expect(a.date.getTime()).toBeLessThanOrEqual(FIXED_NOW.getTime());
    }
  });

  it("exposes the expected activity types sorted and free of duplicates", () => {
    const { activityTypes } = generateDemoDataset(FIXED_NOW);
    expect(activityTypes.length).toBeGreaterThan(0);
    expect([...activityTypes].sort()).toEqual(activityTypes);
    expect(new Set(activityTypes).size).toBe(activityTypes.length);
    for (const type of activityTypes) {
      expect(["Run", "Trail Run", "Ride", "Hike", "Walk"]).toContain(type);
    }
  });

  it("returns physically plausible activities with no discarded rows", () => {
    const { activities, discardedRows } = generateDemoDataset(FIXED_NOW);
    expect(discardedRows).toBe(0);
    for (const a of activities) {
      expect(a.distanceKm).toBeGreaterThan(0);
      expect(a.movingTimeSec).toBeGreaterThan(0);
      expect(a.elevationGainM).toBeGreaterThanOrEqual(0);
      expect(a.id).toMatch(/^demo-\d+$/);
    }
  });
});
