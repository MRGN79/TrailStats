import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { repository } from "./repository";
import { loadLang, saveLang } from "./preferences";
import type { ParsedDataset } from "./types";

const dataset: ParsedDataset = {
  activities: [
    {
      id: "a1",
      date: new Date("2026-01-05T08:00:00Z"),
      type: "Run",
      distanceKm: 10,
      movingTimeSec: 3000,
      elevationGainM: 100,
    },
  ],
  activityTypes: ["Run"],
  discardedRows: 0,
};

describe("IndexedDBRepository: dataset persistence", () => {
  beforeEach(async () => {
    await repository.clear();
  });

  it("returns null when nothing has been saved", async () => {
    expect(await repository.load()).toBeNull();
  });

  it("round-trips a dataset through save and load", async () => {
    await repository.save(dataset);
    const loaded = await repository.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.activities).toHaveLength(1);
    expect(loaded?.activities[0].id).toBe("a1");
    expect(loaded?.activities[0].distanceKm).toBe(10);
    expect(loaded?.activityTypes).toEqual(["Run"]);
  });

  it("preserves Date instances across the IndexedDB structured clone", async () => {
    await repository.save(dataset);
    const loaded = await repository.load();
    expect(loaded?.activities[0].date).toBeInstanceOf(Date);
    expect(loaded?.activities[0].date.getTime()).toBe(
      dataset.activities[0].date.getTime()
    );
  });

  it("overwrites the previous dataset on a second save (single 'current' slot)", async () => {
    await repository.save(dataset);
    const second: ParsedDataset = {
      ...dataset,
      activities: [
        { ...dataset.activities[0], id: "b1", distanceKm: 42 },
        { ...dataset.activities[0], id: "b2", distanceKm: 21 },
      ],
    };
    await repository.save(second);
    const loaded = await repository.load();
    expect(loaded?.activities).toHaveLength(2);
    expect(loaded?.activities.map((a) => a.id)).toEqual(["b1", "b2"]);
  });

  it("clear removes the stored dataset", async () => {
    await repository.save(dataset);
    expect(await repository.load()).not.toBeNull();
    await repository.clear();
    expect(await repository.load()).toBeNull();
  });
});

describe("preferences: language persistence in localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no language has been stored", () => {
    expect(loadLang()).toBeNull();
  });

  it("round-trips the selected language", () => {
    saveLang("es");
    expect(loadLang()).toBe("es");
    saveLang("en");
    expect(loadLang()).toBe("en");
  });
});

describe("preferences: language helpers never throw when storage is unavailable", () => {
  const original = globalThis.localStorage;

  afterEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: original,
      configurable: true,
    });
  });

  it("saveLang swallows errors and loadLang returns null", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => {
          throw new Error("blocked");
        }),
        setItem: vi.fn(() => {
          throw new Error("blocked");
        }),
      },
    });
    expect(() => saveLang("es")).not.toThrow();
    expect(loadLang()).toBeNull();
  });
});
