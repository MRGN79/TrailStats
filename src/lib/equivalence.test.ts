import { describe, expect, it } from "vitest";
import {
  DAY_SEC,
  EARTH_LAP_KM,
  EVEREST_M,
  MARATHON_KM,
  equivalenceForDistance,
  equivalenceForElevation,
  equivalenceForMovingTime,
  roundLegible,
} from "./equivalence";

describe("roundLegible", () => {
  it("returns whole numbers for large magnitudes (>= 10)", () => {
    expect(roundLegible(34.2)).toBe(34);
    expect(roundLegible(99.7)).toBe(100);
  });

  it("keeps one decimal for small magnitudes (< 10)", () => {
    expect(roundLegible(2.34)).toBe(2.3);
    expect(roundLegible(1.05)).toBe(1.1);
    expect(roundLegible(1)).toBe(1);
  });

  it("is defensive against non-finite input", () => {
    expect(roundLegible(NaN)).toBe(0);
    expect(roundLegible(Infinity)).toBe(0);
  });
});

describe("equivalenceForDistance", () => {
  it("returns marathons for typical distances", () => {
    const eq = equivalenceForDistance(MARATHON_KM * 34);
    expect(eq).toEqual({ key: "marathons", count: 34 });
  });

  it("returns exactly one marathon (singular threshold) at one marathon", () => {
    const eq = equivalenceForDistance(MARATHON_KM);
    expect(eq).toEqual({ key: "marathons", count: 1 });
  });

  it("keeps a decimal for small marathon counts", () => {
    const eq = equivalenceForDistance(MARATHON_KM * 2.3);
    expect(eq).toEqual({ key: "marathons", count: 2.3 });
  });

  it("prefers laps around the Earth once distance reaches a full lap", () => {
    const eq = equivalenceForDistance(EARTH_LAP_KM * 2);
    expect(eq).toEqual({ key: "earthLaps", count: 2 });
  });

  it("still shows marathons just below one Earth lap", () => {
    const eq = equivalenceForDistance(EARTH_LAP_KM - 1);
    expect(eq?.key).toBe("marathons");
  });

  it("hides the equivalence when below one marathon (CE-5)", () => {
    // 21 km rounds to 0.5 marathons -> below 1 -> hidden.
    expect(equivalenceForDistance(21)).toBeNull();
  });

  it("returns null for zero or invalid distance", () => {
    expect(equivalenceForDistance(0)).toBeNull();
    expect(equivalenceForDistance(-5)).toBeNull();
    expect(equivalenceForDistance(NaN)).toBeNull();
  });
});

describe("equivalenceForElevation", () => {
  it("returns Everest ascents for large elevation", () => {
    const eq = equivalenceForElevation(EVEREST_M * 5);
    expect(eq).toEqual({ key: "everests", count: 5 });
  });

  it("hides the equivalence below one Everest (CE-5)", () => {
    expect(equivalenceForElevation(EVEREST_M * 0.4)).toBeNull();
    expect(equivalenceForElevation(0)).toBeNull();
  });
});

describe("equivalenceForMovingTime", () => {
  it("returns full days in motion", () => {
    const eq = equivalenceForMovingTime(DAY_SEC * 12);
    expect(eq).toEqual({ key: "daysMoving", count: 12 });
  });

  it("hides the equivalence below one full day (CE-5)", () => {
    expect(equivalenceForMovingTime(DAY_SEC * 0.3)).toBeNull();
    expect(equivalenceForMovingTime(0)).toBeNull();
  });
});
