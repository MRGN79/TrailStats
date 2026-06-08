import { describe, expect, it } from "vitest";
import { parseActivitiesCsv } from "./stravaParser";

const csv = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,10000,3000,100
2,2026-01-06 09:00:00,Ride,30000,3600,200
3,2026-01-07 18:00:00,WeightTraining,,1800,`;

describe("parseActivitiesCsv", () => {
  it("parses meters to km and reads core fields", () => {
    const ds = parseActivitiesCsv(csv);
    expect(ds.activities).toHaveLength(3);
    expect(ds.activities[0].distanceKm).toBe(10);
    expect(ds.activities[0].type).toBe("Run");
    expect(ds.activityTypes).toContain("WeightTraining");
  });

  it("keeps zero-distance activities", () => {
    const ds = parseActivitiesCsv(csv);
    const weights = ds.activities.find((a) => a.type === "WeightTraining");
    expect(weights?.distanceKm).toBe(0);
  });

  it("throws when there is no date column", () => {
    expect(() => parseActivitiesCsv("foo,bar\n1,2")).toThrow("NO_ACTIVITIES");
  });
});
