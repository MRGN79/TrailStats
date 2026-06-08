import { describe, expect, it } from "vitest";
import { sessionToActivity, type FitSession } from "./garminParser";

const base: FitSession = {
  start_time: "2026-01-05T08:00:00.000Z",
  sport: "running",
  total_distance: 10,
  total_timer_time: 3000,
  total_ascent: 100,
};

describe("sessionToActivity", () => {
  it("maps a FIT session to the unified activity model", () => {
    const a = sessionToActivity(base, "file.fit#0")!;
    expect(a.id).toBe("file.fit#0");
    expect(a.type).toBe("Run");
    expect(a.distanceKm).toBe(10);
    expect(a.movingTimeSec).toBe(3000);
    expect(a.elevationGainM).toBe(100);
    expect(a.date.getUTCFullYear()).toBe(2026);
  });

  it("maps known FIT sports to Strava-aligned labels", () => {
    expect(sessionToActivity({ ...base, sport: "cycling" }, "x")!.type).toBe(
      "Ride"
    );
    expect(sessionToActivity({ ...base, sport: "hiking" }, "x")!.type).toBe(
      "Hike"
    );
    expect(sessionToActivity({ ...base, sport: "swimming" }, "x")!.type).toBe(
      "Swim"
    );
  });

  it("humanizes unknown sports instead of dropping them", () => {
    expect(
      sessionToActivity({ ...base, sport: "open_water_swimming" }, "x")!.type
    ).toBe("Open water swimming");
  });

  it("falls back to Unknown when sport is missing", () => {
    const { sport, ...noSport } = base;
    void sport;
    expect(sessionToActivity(noSport, "x")!.type).toBe("Unknown");
  });

  it("falls back to total_elapsed_time when timer time is absent", () => {
    const { total_timer_time, ...noTimer } = base;
    void total_timer_time;
    const a = sessionToActivity(
      { ...noTimer, total_elapsed_time: 2500 },
      "x"
    )!;
    expect(a.movingTimeSec).toBe(2500);
  });

  it("treats missing distance and elevation as zero, not discarded", () => {
    const a = sessionToActivity(
      { start_time: base.start_time, sport: "training" },
      "x"
    )!;
    expect(a.distanceKm).toBe(0);
    expect(a.elevationGainM).toBe(0);
    expect(a.type).toBe("Workout");
  });

  it("discards a session with an unparseable start_time", () => {
    expect(sessionToActivity({ ...base, start_time: "not-a-date" }, "x")).toBe(
      null
    );
  });
});
