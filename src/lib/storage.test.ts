import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStorage,
  loadDataset,
  loadLang,
  saveDataset,
  saveLang,
} from "./storage";
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

describe("storage: IndexedDB dataset persistence", () => {
  beforeEach(async () => {
    await clearStorage();
  });

  it("returns null when nothing has been saved", async () => {
    expect(await loadDataset()).toBeNull();
  });

  it("round-trips a dataset through save and load", async () => {
    await saveDataset(dataset);
    const loaded = await loadDataset();
    expect(loaded).not.toBeNull();
    expect(loaded?.activities).toHaveLength(1);
    expect(loaded?.activities[0].id).toBe("a1");
    expect(loaded?.activities[0].distanceKm).toBe(10);
    expect(loaded?.activityTypes).toEqual(["Run"]);
  });

  it("preserves Date instances across the IndexedDB structured clone", async () => {
    await saveDataset(dataset);
    const loaded = await loadDataset();
    expect(loaded?.activities[0].date).toBeInstanceOf(Date);
    expect(loaded?.activities[0].date.getTime()).toBe(
      dataset.activities[0].date.getTime()
    );
  });

  it("overwrites the previous dataset on a second save (single 'current' slot)", async () => {
    await saveDataset(dataset);
    const second: ParsedDataset = {
      ...dataset,
      activities: [
        { ...dataset.activities[0], id: "b1", distanceKm: 42 },
        { ...dataset.activities[0], id: "b2", distanceKm: 21 },
      ],
    };
    await saveDataset(second);
    const loaded = await loadDataset();
    expect(loaded?.activities).toHaveLength(2);
    expect(loaded?.activities.map((a) => a.id)).toEqual(["b1", "b2"]);
  });

  it("clearStorage removes the stored dataset", async () => {
    await saveDataset(dataset);
    expect(await loadDataset()).not.toBeNull();
    await clearStorage();
    expect(await loadDataset()).toBeNull();
  });
});

describe("storage: language persistence in localStorage", () => {
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

describe("storage: language helpers never throw when storage is unavailable", () => {
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
