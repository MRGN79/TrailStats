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

  it("parses European-format distances (dot=thousands, comma=decimal)", () => {
    // "1.234,56" meters must become 1234.56 m => 1.23456 km, not 1.23456 m.
    // Regression for the toNumber fix: previously "1.234,56" yielded 1.23456.
    const euCsv = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,"1.234,56",3000,"2.500,00"`;
    const ds = parseActivitiesCsv(euCsv);
    expect(ds.activities[0].distanceKm).toBeCloseTo(1.23456, 5);
    expect(ds.activities[0].elevationGainM).toBeCloseTo(2500, 5);
  });

  it("parses English-format distances (comma=thousands, dot=decimal)", () => {
    const enCsv = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,"1,234.56",3000,"2,500.00"`;
    const ds = parseActivitiesCsv(enCsv);
    expect(ds.activities[0].distanceKm).toBeCloseTo(1.23456, 5);
    expect(ds.activities[0].elevationGainM).toBeCloseTo(2500, 5);
  });

  it("parses a comma-only decimal separator ('22,98')", () => {
    const csvComma = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,"22,98",3000,0`;
    const ds = parseActivitiesCsv(csvComma);
    expect(ds.activities[0].distanceKm).toBeCloseTo(0.02298, 5);
  });
});
