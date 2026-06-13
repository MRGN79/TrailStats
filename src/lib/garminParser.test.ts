import { afterEach, describe, expect, it, vi } from "vitest";
import { parseFitFiles, sessionToActivity, type FitSession } from "./garminParser";

const parseAsyncMock = vi.fn();

vi.mock("fit-file-parser", () => ({
  default: class {
    parseAsync(...args: unknown[]) {
      return parseAsyncMock(...args);
    }
  },
}));

function fitEntry(filename: string) {
  return { filename, bytes: new Uint8Array([0, 1, 2, 3]) };
}

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

describe("parseFitFiles", () => {
  afterEach(() => {
    parseAsyncMock.mockReset();
  });

  it("throws EMPTY_FIT when every FIT file is discarded (parse failures)", async () => {
    parseAsyncMock.mockRejectedValue(new Error("corrupt fit"));
    await expect(
      parseFitFiles([fitEntry("a.fit"), fitEntry("b.fit")])
    ).rejects.toThrow("EMPTY_FIT");
  });

  it("throws EMPTY_FIT when files parse but contain no sessions", async () => {
    parseAsyncMock.mockResolvedValue({ sessions: [] });
    await expect(parseFitFiles([fitEntry("a.fit")])).rejects.toThrow(
      "EMPTY_FIT"
    );
  });

  it("throws EMPTY_FIT when given no files at all", async () => {
    await expect(parseFitFiles([])).rejects.toThrow("EMPTY_FIT");
  });

  it("returns activities and counts discarded files when some parse", async () => {
    parseAsyncMock
      .mockResolvedValueOnce({
        sessions: [
          {
            start_time: "2026-01-05T08:00:00.000Z",
            sport: "running",
            total_distance: 10,
            total_timer_time: 3000,
            total_ascent: 100,
          },
        ],
      })
      .mockRejectedValueOnce(new Error("corrupt fit"));
    const ds = await parseFitFiles([fitEntry("good.fit"), fitEntry("bad.fit")]);
    expect(ds.activities).toHaveLength(1);
    expect(ds.activities[0].type).toBe("Run");
    expect(ds.discardedRows).toBe(1);
  });
});
