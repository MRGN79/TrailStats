import { describe, expect, it } from "vitest";
import { computeEddington, computeHeatmap } from "./aggregate";
import type { Activity } from "./types";

function act(date: string, type: string, km: number): Activity {
  return {
    id: date + type + km,
    date: new Date(date),
    type,
    distanceKm: km,
    movingTimeSec: 0,
    elevationGainM: 0,
  };
}

function runs(distances: number[], type = "Run"): Activity[] {
  return distances.map((km, i) =>
    act(`2025-01-${String((i % 28) + 1).padStart(2, "0")}`, type, km)
  );
}

describe("computeEddington", () => {
  it("returns empty for no activities", () => {
    expect(computeEddington([])).toEqual([]);
  });

  it("omits a sport when its Eddington would be 0", () => {
    // A single 5 km run: at most index 1 needs >= 1 km (ok), but index 2 would
    // need a second run >= 2 km. E = 1 here, so it IS shown. Use 0.5 km to force E=0.
    const stats = computeEddington(runs([0.5]));
    expect(stats).toEqual([]);
  });

  it("computes E correctly: 5 runs of 5km gives E=5", () => {
    const stats = computeEddington(runs([5, 5, 5, 5, 5]));
    expect(stats).toHaveLength(1);
    expect(stats[0].sport).toBe("run");
    expect(stats[0].number).toBe(5);
  });

  it("E is the largest N with at least N activities of >= N km", () => {
    // distances sorted desc: 50,40,30,20,10 -> idx1:50>=1, idx2:40>=2,
    // idx3:30>=3, idx4:20>=4, idx5:10>=5 -> E=5
    const stats = computeEddington(runs([10, 20, 30, 40, 50]));
    expect(stats[0].number).toBe(5);
  });

  it("does not over-count: 3 runs of 100km still gives E=3", () => {
    const stats = computeEddington(runs([100, 100, 100]));
    expect(stats[0].number).toBe(3);
  });

  it("reports how many activities remain to reach E+1", () => {
    // 5 runs of 5km: E=5, target=6, runs >= 6km = 0 -> remaining = 6
    const stats = computeEddington(runs([5, 5, 5, 5, 5]));
    expect(stats[0].next.target).toBe(6);
    expect(stats[0].next.remaining).toBe(6);
  });

  it("counts partial progress toward E+1", () => {
    // sorted: 7,7,5,5,5 -> E=5 (idx5:5>=5). target=6, runs>=6km=2 -> remaining=4
    const stats = computeEddington(runs([7, 7, 5, 5, 5]));
    expect(stats[0].number).toBe(5);
    expect(stats[0].next.target).toBe(6);
    expect(stats[0].next.remaining).toBe(4);
  });

  it("separates running and cycling independently", () => {
    const stats = computeEddington([
      ...runs([5, 5, 5, 5, 5], "Trail Run"),
      ...runs([20, 20, 20], "Ride"),
    ]);
    const run = stats.find((s) => s.sport === "run");
    const cyc = stats.find((s) => s.sport === "cycling");
    expect(run?.number).toBe(5);
    expect(cyc?.number).toBe(3);
  });

  it("matches sport types case-insensitively across aliases", () => {
    const stats = computeEddington([
      ...runs([3, 3, 3], "HIKE"),
      ...runs([4, 4, 4, 4], "VirtualRide"),
    ]);
    expect(stats.find((s) => s.sport === "run")?.number).toBe(3);
    expect(stats.find((s) => s.sport === "cycling")?.number).toBe(4);
  });
});

describe("computeHeatmap", () => {
  const today = new Date("2025-06-01T12:00:00Z");

  it("always spans exactly 365 days", () => {
    const data = computeHeatmap([], today);
    expect(data.days).toHaveLength(365);
  });

  it("ends on today (inclusive)", () => {
    const data = computeHeatmap([], today);
    const last = data.days[data.days.length - 1].date;
    expect(last.getUTCFullYear()).toBe(2025);
    expect(last.getUTCMonth()).toBe(5); // June
    expect(last.getUTCDate()).toBe(1);
  });

  it("ignores activities outside the 365-day window", () => {
    const data = computeHeatmap(
      [act("2020-01-01", "Run", 42)],
      today
    );
    expect(data.days.every((d) => d.distanceKm === 0)).toBe(true);
  });

  it("sums multiple activities on the same day", () => {
    const data = computeHeatmap(
      [act("2025-05-30", "Run", 8), act("2025-05-30", "Ride", 5)],
      today
    );
    const cell = data.days.find(
      (d) => d.date.getUTCMonth() === 4 && d.date.getUTCDate() === 30
    );
    expect(cell?.distanceKm).toBe(13);
  });

  it("classifies volume into levels including the exceptional band", () => {
    const data = computeHeatmap(
      [
        act("2025-05-25", "Run", 0), // implicitly none anyway
        act("2025-05-26", "Run", 5), // low
        act("2025-05-27", "Run", 20), // medium
        act("2025-05-28", "Run", 40), // high
        act("2025-05-29", "Run", 60), // exceptional
      ],
      today
    );
    const at = (day: number) =>
      data.days.find(
        (d) => d.date.getUTCMonth() === 4 && d.date.getUTCDate() === day
      );
    expect(at(25)?.level).toBe("none");
    expect(at(26)?.level).toBe("low");
    expect(at(27)?.level).toBe("medium");
    expect(at(28)?.level).toBe("high");
    expect(at(29)?.level).toBe("exceptional");
  });

  it("marks days without activity as none", () => {
    const data = computeHeatmap([], today);
    expect(data.days.every((d) => d.level === "none")).toBe(true);
  });
});
