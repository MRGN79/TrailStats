import { describe, expect, it } from "vitest";
import { computeStreak, computeYearOverYear } from "./aggregate";
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

// A date guaranteed to be in the future relative to "now" so the filter under
// test is exercised regardless of when the suite runs.
function futureDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function futureActivity(km = 5): Activity {
  const d = futureDate();
  return {
    id: "future",
    date: d,
    type: "Run",
    distanceKm: km,
    movingTimeSec: 100,
    elevationGainM: 0,
  };
}

describe("computeStreak — future-dated activities (Fix 1)", () => {
  // CA-1: an activity pre-registered for the future must not fabricate a streak.
  it("returns zeros when the only activity is in the future", () => {
    expect(computeStreak([futureActivity()])).toMatchObject({ current: 0, longest: 0, longestStart: null, longestEnd: null });
  });

  // CA-2: a future activity counts for neither the current nor the longest streak.
  it("ignores a future activity when ranking past streaks", () => {
    // Three consecutive past weeks form the longest run; the current streak is
    // stale (last past activity is months ago) so it must be 0 — and the future
    // activity must not resurrect it as "current".
    const acts = [
      act("2025-01-06", "Run", 5, 100, 0), // Mon
      act("2025-01-13", "Run", 5, 100, 0),
      act("2025-01-20", "Run", 5, 100, 0),
      futureActivity(),
    ];
    const streak = computeStreak(acts);
    expect(streak.longest).toBe(3);
    expect(streak.current).toBe(0);
  });

  it("does not extend the longest streak with a future week adjacent to past weeks", () => {
    // Two past consecutive weeks. Without the future filter, a future week
    // immediately following could be miscounted; here we assert longest stays 2.
    const acts = [
      act("2025-01-06", "Run", 5, 100, 0),
      act("2025-01-13", "Run", 5, 100, 0),
      futureActivity(),
    ];
    expect(computeStreak(acts).longest).toBe(2);
  });

  // CA-3: behaviour with no future dates is unchanged (regression).
  it("computes streaks normally when no future activity is present", () => {
    const acts = [
      act("2025-01-06", "Run", 5, 100, 0),
      act("2025-01-13", "Run", 5, 100, 0),
      act("2025-01-20", "Run", 5, 100, 0),
    ];
    expect(computeStreak(acts)).toMatchObject({ current: 0, longest: 3 });
  });
});

describe("computeYearOverYear — future-dated activities (Fix 2)", () => {
  // CA-4: a future activity does not appear in the current-year YoY series.
  it("excludes a future activity from the current-year data", () => {
    const future = futureActivity(40);
    const futureYear = future.date.getFullYear();
    const acts = [
      // Two real consecutive past years so YoY can be computed at all.
      act(`${futureYear - 2}-01-15`, "Run", 10, 100, 0),
      act(`${futureYear - 1}-01-15`, "Run", 20, 100, 0),
      future,
    ];
    const yoy = computeYearOverYear(acts, "monthly", MONTHS);
    expect(yoy).not.toBeNull();
    // The compared years are the two PAST ones, not the future one.
    expect(yoy?.currentYear).toBe(futureYear - 1);
    expect(yoy?.previousYear).toBe(futureYear - 2);
    // No bucket carries the future activity's distance (40 km).
    for (const p of yoy?.points ?? []) {
      expect(p.current ?? 0).not.toBe(40);
      expect(p.previous ?? 0).not.toBe(40);
    }
  });

  // CA-5: if the only year with data is in the future, there are not two past
  // years to compare, so the result is null.
  it("returns null when the only year with data is in the future", () => {
    expect(computeYearOverYear([futureActivity()], "monthly", MONTHS)).toBeNull();
  });

  // CA-6: past activities of the two compared years still accumulate correctly.
  it("accumulates the two compared past years correctly (regression)", () => {
    const acts = [
      act("2025-01-15", "Run", 10, 100, 0),
      act("2025-03-15", "Run", 20, 100, 0),
      act("2026-01-10", "Run", 30, 100, 0),
      futureActivity(99), // must not perturb the comparison
    ];
    const yoy = computeYearOverYear(acts, "monthly", MONTHS);
    expect(yoy).not.toBeNull();
    expect(yoy?.currentYear).toBe(2026);
    expect(yoy?.previousYear).toBe(2025);
    expect(yoy?.points[0].current).toBe(30);
    expect(yoy?.points[0].previous).toBe(10);
    expect(yoy?.points[2].previous).toBe(20);
  });
});
