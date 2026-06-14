import { describe, expect, it } from "vitest";
import {
  computeAvgHr,
  computeHrTrend,
  computeHrZones,
  hasHeartRateData,
  isValidHr,
} from "./aggregate";
import type { Activity } from "./types";

function act(date: string, avgHr: number | null, sec = 3600, km = 10): Activity {
  return {
    id: date,
    date: new Date(date),
    type: "Run",
    distanceKm: km,
    movingTimeSec: sec,
    elevationGainM: 0,
    avgHrBpm: avgHr,
    maxHrBpm: avgHr != null ? avgHr + 15 : null,
  };
}

// ── isValidHr ────────────────────────────────────────────────

describe("isValidHr", () => {
  it("accepts valid HR values", () => {
    expect(isValidHr(120)).toBe(true);
    expect(isValidHr(30)).toBe(true);
    expect(isValidHr(240)).toBe(true);
  });

  it("rejects null and undefined", () => {
    expect(isValidHr(null)).toBe(false);
    expect(isValidHr(undefined)).toBe(false);
  });

  it("rejects 0 (sensor failure marker)", () => {
    expect(isValidHr(0)).toBe(false);
  });

  it("rejects values out of physiological range", () => {
    expect(isValidHr(29)).toBe(false);
    expect(isValidHr(241)).toBe(false);
    expect(isValidHr(-1)).toBe(false);
  });
});

// ── hasHeartRateData ─────────────────────────────────────────

describe("hasHeartRateData", () => {
  it("returns false for empty list", () => {
    expect(hasHeartRateData([])).toBe(false);
  });

  it("returns false when all activities have null HR", () => {
    expect(hasHeartRateData([act("2025-01-01", null)])).toBe(false);
  });

  it("returns true when at least one activity has valid HR", () => {
    const acts = [act("2025-01-01", null), act("2025-01-02", 140)];
    expect(hasHeartRateData(acts)).toBe(true);
  });
});

// ── computeHrZones ───────────────────────────────────────────

describe("computeHrZones", () => {
  it("returns null for empty input", () => {
    expect(computeHrZones([])).toBeNull();
  });

  it("returns null when fewer than 5 activities have HR", () => {
    const acts = [1, 2, 3, 4].map((i) => act(`2025-01-0${i}`, 130));
    expect(computeHrZones(acts)).toBeNull();
  });

  it("returns null when activities have no HR data", () => {
    const acts = [1, 2, 3, 4, 5].map((i) => act(`2025-01-0${i}`, null));
    expect(computeHrZones(acts)).toBeNull();
  });

  it("classifies Z1 correctly (< 120 bpm)", () => {
    const acts = Array.from({ length: 5 }, (_, i) =>
      act(`2025-01-0${i + 1}`, 100)
    );
    const result = computeHrZones(acts);
    expect(result).not.toBeNull();
    expect(result!.zones[0].zone).toBe(1);
    expect(result!.zones[0].share).toBeCloseTo(1, 5);
  });

  it("classifies Z5 correctly (> 165 bpm)", () => {
    const acts = Array.from({ length: 5 }, (_, i) =>
      act(`2025-01-0${i + 1}`, 175)
    );
    const result = computeHrZones(acts);
    expect(result!.zones[4].zone).toBe(5);
    expect(result!.zones[4].share).toBeCloseTo(1, 5);
  });

  it("zone shares sum to 1", () => {
    const acts = [
      act("2025-01-01", 100),
      act("2025-01-02", 130),
      act("2025-01-03", 145),
      act("2025-01-04", 160),
      act("2025-01-05", 170),
    ];
    const result = computeHrZones(acts);
    const total = result!.zones.reduce((s, z) => s + z.share, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("reports the number of activities used", () => {
    const acts = Array.from({ length: 7 }, (_, i) =>
      act(`2025-01-${String(i + 1).padStart(2, "0")}`, 140)
    );
    const result = computeHrZones(acts);
    expect(result!.basedOn).toBe(7);
  });

  it("excludes activities without HR from zone calculation", () => {
    const acts = [
      ...Array.from({ length: 5 }, (_, i) =>
        act(`2025-01-${String(i + 1).padStart(2, "0")}`, 130)
      ),
      act("2025-01-06", null),
    ];
    const result = computeHrZones(acts);
    expect(result!.basedOn).toBe(5);
  });
});

// ── computeHrTrend ───────────────────────────────────────────

describe("computeHrTrend", () => {
  it("returns empty for no activities", () => {
    expect(computeHrTrend([])).toEqual([]);
  });

  it("returns empty when no activity has HR data", () => {
    expect(computeHrTrend([act("2025-01-01", null)])).toEqual([]);
  });

  it("groups by month and returns one point per month with HR", () => {
    const acts = [
      act("2025-01-10", 140),
      act("2025-01-20", 150),
      act("2025-02-05", 135),
    ];
    const trend = computeHrTrend(acts);
    expect(trend).toHaveLength(2);
    expect(trend[0].key).toBe("2025-01");
    expect(trend[1].key).toBe("2025-02");
  });

  it("weights by movingTimeSec within a month", () => {
    // Two activities in same month: 1h at 140, 3h at 160
    // Weighted avg = (140*3600 + 160*10800) / (3600+10800) = (504000+1728000)/14400 = 155
    const acts = [
      act("2025-01-10", 140, 3600),
      act("2025-01-20", 160, 10800),
    ];
    const trend = computeHrTrend(acts);
    expect(trend[0].avgHrBpm).toBe(155);
  });

  it("is sorted chronologically", () => {
    const acts = [
      act("2025-03-01", 150),
      act("2025-01-01", 140),
      act("2025-02-01", 145),
    ];
    const trend = computeHrTrend(acts);
    expect(trend[0].key).toBe("2025-01");
    expect(trend[1].key).toBe("2025-02");
    expect(trend[2].key).toBe("2025-03");
  });
});

// ── computeAvgHr ─────────────────────────────────────────────

describe("computeAvgHr", () => {
  it("returns null for empty list", () => {
    expect(computeAvgHr([])).toBeNull();
  });

  it("returns null when no activity has HR", () => {
    expect(computeAvgHr([act("2025-01-01", null)])).toBeNull();
  });

  it("returns time-weighted average", () => {
    // 1h at 140, 3h at 160 → weighted avg = 155
    const acts = [act("2025-01-10", 140, 3600), act("2025-01-20", 160, 10800)];
    expect(computeAvgHr(acts)).toBe(155);
  });

  it("excludes activities with null HR from the average", () => {
    const acts = [act("2025-01-10", 150, 3600), act("2025-01-20", null, 3600)];
    expect(computeAvgHr(acts)).toBe(150);
  });
});
