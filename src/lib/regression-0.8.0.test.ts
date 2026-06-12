import { describe, expect, it } from "vitest";
import {
  computePaceZones,
  computeYearOverYear,
} from "./aggregate";
import { generateDemoDataset } from "./demoData";
import { parseActivitiesCsv } from "./stravaParser";
import type { Activity } from "./types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function run(date: string, km: number, sec: number): Activity {
  return {
    id: `${date}-${km}-${sec}`,
    date: new Date(date),
    type: "Run",
    distanceKm: km,
    movingTimeSec: sec,
    elevationGainM: 0,
  };
}

// ── Audit 3/4: computeYearOverYear guards (aggregate.ts) ──────────────
describe("regression: computeYearOverYear empty-input guard", () => {
  it("returns null for an empty activity array (no crash)", () => {
    expect(computeYearOverYear([], "monthly", MONTHS)).toBeNull();
    expect(computeYearOverYear([], "weekly", MONTHS)).toBeNull();
  });

  it("still returns null with a single year present", () => {
    const acts = [run("2026-01-05", 5, 1500)];
    expect(computeYearOverYear(acts, "monthly", MONTHS)).toBeNull();
  });
});

// ── Audit 3: computePaceZones clamp at the 5-activity boundary ────────
describe("regression: computePaceZones at the minimum activity count", () => {
  it("returns null below the 5-activity minimum", () => {
    const acts = [
      run("2024-01-01", 10, 3000),
      run("2024-01-08", 10, 3000),
      run("2024-01-15", 10, 3000),
      run("2024-01-22", 10, 3000),
    ];
    expect(computePaceZones(acts)).toBeNull();
  });

  it("does not crash with exactly 5 running activities", () => {
    const acts = [
      run("2024-01-01", 10, 3000), // 300 s/km (fastest)
      run("2024-01-08", 10, 3300),
      run("2024-01-15", 10, 3600),
      run("2024-01-22", 10, 3900),
      run("2024-01-29", 10, 4200), // 420 s/km (slowest)
    ];
    const result = computePaceZones(acts);
    expect(result).not.toBeNull();
    // 5 zones always present.
    expect(result?.zones).toHaveLength(5);
    // Clamp Math.max(1, floor(5*0.10)=0) => index 1: the second-fastest pace,
    // never the single fastest run.
    expect(result?.thresholdPaceSecPerKm).toBeCloseTo(330, 5);
    // Shares are a valid distribution.
    const totalShare = result!.zones.reduce((s, z) => s + z.share, 0);
    expect(totalShare).toBeCloseTo(1, 5);
    // Not every activity collapses into a single zone (the bug this fixes).
    const nonEmptyZones = result!.zones.filter((z) => z.timeSeconds > 0).length;
    expect(nonEmptyZones).toBeGreaterThan(1);
  });
});

// ── Audit 4: seasonalFactor cap (demoData.ts) ────────────────────────
describe("regression: demo dataset stays physically plausible", () => {
  // seasonalFactor is internal; we exercise it through every month of a
  // multi-year demo window and assert the downstream invariant: the seasonal
  // cap (Math.min(1.0, ...)) keeps weekly activity targets bounded, so no week
  // explodes into an implausible number of activities.
  it("never produces an implausible weekly activity count across all months", () => {
    const { activities } = generateDemoDataset(new Date(2025, 5, 15));
    const byWeek = new Map<string, number>();
    for (const a of activities) {
      const d = a.date;
      const key = `${d.getFullYear()}-${Math.floor(
        (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) /
          (7 * 86400000)
      )}`;
      byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
    }
    // target = round(lerp(2..4) + factor*1.6); with factor capped at 1.0 the
    // theoretical max per week is ~round(4 + 1.6) = 6, plus same-day clustering.
    for (const count of byWeek.values()) {
      expect(count).toBeLessThanOrEqual(10);
    }
  });

  it("does not overflow the day when shifting 18 months back (setDate(1) fix)", () => {
    // Reference date on the 31st: without setDate(1) before setMonth, the month
    // arithmetic would overflow (e.g. Aug 31 - 18mo). The window must still span
    // ~18 months of real data.
    const { activities } = generateDemoDataset(new Date(2025, 7, 31));
    expect(activities.length).toBeGreaterThan(150);
    const first = activities[0].date;
    const last = activities[activities.length - 1].date;
    expect(first.getTime()).toBeLessThan(last.getTime());
    for (const a of activities) {
      expect(Number.isNaN(a.date.getTime())).toBe(false);
    }
  });
});

// ── Audit 4: toNumber comma-decimal handling (stravaParser.ts) ────────
describe("regression: Strava parser handles comma decimal separators", () => {
  it("reads a comma-decimal distance column as a fractional value", () => {
    // Spanish-locale summary distance "22,98" km in the SI distance column.
    // metersToKm divides by 1000, so we feed meters with a comma decimal:
    // "10500,5" m → 10.5005 km.
    const csv = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,"10500,5",3000,100`;
    const ds = parseActivitiesCsv(csv);
    expect(ds.activities).toHaveLength(1);
    expect(ds.activities[0].distanceKm).toBeCloseTo(10.5005, 4);
  });

  it("strips thousands-separator commas in English-locale exports", () => {
    // "1,250.75" m → 1250.75 m → 1.25075 km
    const csv = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,"1,250.75",3000,100`;
    const ds = parseActivitiesCsv(csv);
    expect(ds.activities[0].distanceKm).toBeCloseTo(1.25075, 5);
  });

  it("treats a lone comma as decimal, not thousands", () => {
    // Elevation "8,5" m must read as 8.5, not 85.
    const csv = `Activity ID,Activity Date,Activity Type,Distance,Moving Time,Elevation Gain
1,2026-01-05 08:00:00,Run,10000,3000,"8,5"`;
    const ds = parseActivitiesCsv(csv);
    expect(ds.activities[0].elevationGainM).toBeCloseTo(8.5, 5);
  });
});
