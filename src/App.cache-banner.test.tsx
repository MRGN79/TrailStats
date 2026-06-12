import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParsedDataset } from "./lib/types";

// Mock the storage layer so we control whether a dataset is "restored" from
// IndexedDB on mount, and so saveDataset/clearStorage are no-ops in jsdom.
const loadDatasetMock = vi.fn<[], Promise<ParsedDataset | null>>();
vi.mock("./lib/storage", () => ({
  loadDataset: () => loadDatasetMock(),
  saveDataset: vi.fn().mockResolvedValue(undefined),
  clearStorage: vi.fn().mockResolvedValue(undefined),
  saveLang: vi.fn(),
  loadLang: () => null,
}));

// Mock file processing so handleFile produces a deterministic dataset without
// needing a real zip.
const processFileMock = vi.fn();
vi.mock("./lib/loadDataset", () => ({
  processFile: (...args: unknown[]) => processFileMock(...args),
}));

import i18n from "./i18n";
import App from "./App";

function dataset(count: number, lastIso = "2026-04-10T08:00:00Z"): ParsedDataset {
  const activities = Array.from({ length: count }, (_, idx) => ({
    id: `a-${idx}`,
    // Spread dates so latestDate has a real max to find.
    date: new Date(Date.parse(lastIso) - idx * 86400000),
    type: "Run",
    distanceKm: 10,
    movingTimeSec: 3000,
    elevationGainM: 100,
  }));
  return { activities, activityTypes: ["Run"], discardedRows: 0 };
}

// The cache banner is the element with class .cache-banner. We must NOT match
// on /saved activities/ alone: the sr-only restoring live region renders
// "Loading your saved activities…" which also matches and then mutates to
// "Dashboard ready.", making text-based queries non-deterministic.
function queryCacheBanner(): HTMLElement | null {
  return document.querySelector(".cache-banner");
}

async function findCacheBanner(): Promise<HTMLElement> {
  return await waitFor(() => {
    const el = queryCacheBanner();
    if (!el) throw new Error("cache banner not yet rendered");
    return el as HTMLElement;
  });
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  loadDatasetMock.mockReset();
  processFileMock.mockReset();
});

afterEach(() => cleanup());

describe("App — CacheBanner integration", () => {
  it("shows the cache banner after an IndexedDB restore, with count and latest date", async () => {
    loadDatasetMock.mockResolvedValue(dataset(42, "2026-04-10T08:00:00Z"));
    render(<App />);

    const banner = await findCacheBanner();
    expect(banner.textContent).toContain("42");
    const expectedDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date("2026-04-10T08:00:00Z")
    );
    expect(banner.textContent).toContain(expectedDate);
  });

  it("hides the cache banner when the dismiss button is clicked", async () => {
    loadDatasetMock.mockResolvedValue(dataset(5));
    const user = userEvent.setup();
    render(<App />);

    const banner = await findCacheBanner();
    await user.click(within(banner).getByRole("button", { name: i18n.t("cache.dismiss") }));

    await waitFor(() => {
      expect(queryCacheBanner()).toBeNull();
    });
    // Dashboard still rendered — dismissing only hides the banner.
    expect(screen.queryByRole("button", { name: i18n.t("cache.dismiss") })).toBeNull();
  });

  it("returns to the upload (idle) screen when 'Load another export' is clicked", async () => {
    loadDatasetMock.mockResolvedValue(dataset(5));
    const user = userEvent.setup();
    render(<App />);

    const banner = await findCacheBanner();
    const loadAnotherBtn = within(banner).getByRole("button", {
      name: i18n.t("upload.loadAnother"),
    });
    await user.click(loadAnotherBtn);

    // Idle screen shows the upload dropzone CTA; the banner is gone.
    await waitFor(() => {
      expect(queryCacheBanner()).toBeNull();
    });
    expect(screen.getByText(i18n.t("upload.dropzone"))).toBeTruthy();
  });

  it("does NOT show the cache banner for demo data", async () => {
    // No stored dataset → idle screen with the demo CTA.
    loadDatasetMock.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(i18n.t("demo.cta"));
    await user.click(screen.getByRole("button", { name: i18n.t("demo.cta") }));

    // Dashboard renders (demo banner present) but the cache banner must not.
    await screen.findByText(i18n.t("demo.bannerText"));
    expect(queryCacheBanner()).toBeNull();
  });

  it("does NOT show the cache banner after a fresh file upload (only after IDB restore)", async () => {
    loadDatasetMock.mockResolvedValue(null);
    processFileMock.mockResolvedValue(dataset(12));
    const user = userEvent.setup();
    render(<App />);

    // Wait for idle screen, then upload a file via the hidden input.
    await screen.findByText(i18n.t("upload.dropzone"));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "export.zip", { type: "application/zip" });
    await user.upload(fileInput, file);

    // Dashboard should appear (heatmap/sections), but no cache banner.
    await waitFor(() => {
      expect(processFileMock).toHaveBeenCalled();
    });
    // Wait for the dashboard to actually render after processing completes.
    await screen.findByText(i18n.t("stats.sections.training"));
    expect(queryCacheBanner()).toBeNull();
  });
});

describe("App — latestDate derivation", () => {
  it("renders the maximum activity date in the cache banner, not the first", async () => {
    // Build a dataset whose max date is NOT activities[0] to catch a naive
    // 'use first activity' bug. dataset() puts the newest at index 0, so
    // craft an out-of-order set explicitly.
    const out: ParsedDataset = {
      activities: [
        { id: "1", date: new Date("2025-01-01T00:00:00Z"), type: "Run", distanceKm: 5, movingTimeSec: 1500, elevationGainM: 0 },
        { id: "2", date: new Date("2026-06-09T00:00:00Z"), type: "Run", distanceKm: 5, movingTimeSec: 1500, elevationGainM: 0 },
        { id: "3", date: new Date("2025-12-31T00:00:00Z"), type: "Run", distanceKm: 5, movingTimeSec: 1500, elevationGainM: 0 },
      ],
      activityTypes: ["Run"],
      discardedRows: 0,
    };
    loadDatasetMock.mockResolvedValue(out);
    render(<App />);

    const banner = await findCacheBanner();
    const expectedMax = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date("2026-06-09T00:00:00Z")
    );
    expect(banner.textContent).toContain(expectedMax);
    // Make sure it didn't pick the earliest date.
    const wrongDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date("2025-01-01T00:00:00Z")
    );
    expect(banner.textContent).not.toContain(wrongDate);
  });
});
