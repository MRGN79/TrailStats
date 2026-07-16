import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParsedDataset } from "./lib/types";

// Control IndexedDB restore + local persistence, and bypass real zip parsing.
const loadMock = vi.fn<[], Promise<ParsedDataset | null>>();
vi.mock("./lib/repository", () => ({
  repository: {
    load: () => loadMock(),
    save: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("./lib/preferences", () => ({
  saveLang: vi.fn(),
  loadLang: () => null,
  saveBannerDismissed: vi.fn(),
  loadBannerDismissed: () => false,
  clearBannerDismissed: vi.fn(),
}));
const processFileMock = vi.fn();
vi.mock("./lib/loadDataset", () => ({
  processFile: (...args: unknown[]) => processFileMock(...args),
}));

import i18n from "./i18n";
import App from "./App";

function dataset(count: number): ParsedDataset {
  const activities = Array.from({ length: count }, (_, idx) => ({
    id: `a-${idx}`,
    date: new Date(Date.parse("2026-04-10T08:00:00Z") - idx * 86400000),
    type: idx % 2 === 0 ? "Run" : "Ride",
    distanceKm: 10,
    movingTimeSec: 3000,
    elevationGainM: 100,
  }));
  return { activities, activityTypes: ["Run", "Ride"], discardedRows: 0 };
}

function choreo(): HTMLElement | null {
  return document.querySelector(".summit-choreo");
}

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes("reduce"),
    media: q,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}
function clearMatchMedia() {
  // @ts-expect-error deliberately removing the mock so jsdom's absence is restored
  delete window.matchMedia;
}

async function uploadFile(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText(i18n.t("upload.dropzone"));
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["zip-bytes"], "export.zip", { type: "application/zip" });
  await user.upload(input, file);
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  loadMock.mockReset();
  processFileMock.mockReset();
  clearMatchMedia();
});

afterEach(() => {
  cleanup();
  clearMatchMedia();
});

describe("App — Summit reveal choreography gate (CE-1)", () => {
  it("scenario (a): processing a new file plays the 'wow' reveal (.is-revealing)", async () => {
    mockMatchMedia(false); // motion allowed
    loadMock.mockResolvedValue(null); // idle, no cached data
    processFileMock.mockResolvedValue(dataset(20));
    const user = userEvent.setup();
    render(<App />);

    await uploadFile(user);
    await screen.findByText(i18n.t("stats.sections.social"));

    await waitFor(() => {
      const el = choreo();
      expect(el).not.toBeNull();
      expect(el?.classList.contains("is-revealing")).toBe(true);
    });
  });

  it("scenario (b): restoring from IndexedDB shows the dashboard with NO reveal", async () => {
    mockMatchMedia(false);
    loadMock.mockResolvedValue(dataset(30)); // cached dataset restored
    render(<App />);

    // Dashboard renders from cache…
    await screen.findByText(i18n.t("stats.sections.training"));
    // …but the celebratory reveal must not fire on a plain reload.
    expect(choreo()).not.toBeNull();
    expect(choreo()?.classList.contains("is-revealing")).toBe(false);
  });

  it("scenario (c): changing a filter on loaded data does not start a new reveal", async () => {
    mockMatchMedia(false);
    loadMock.mockResolvedValue(dataset(30)); // restored → nonce stays 0
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(i18n.t("stats.sections.training"));
    expect(choreo()?.classList.contains("is-revealing")).toBe(false);

    // Change the activity-type filter — recalculates totals/records/heatmap.
    const select = screen.getByLabelText(i18n.t("filter.activityType")) as HTMLSelectElement;
    await user.selectOptions(select, "Run");

    // Still no celebratory reveal after a filter-driven recalculation.
    expect(choreo()?.classList.contains("is-revealing")).toBe(false);
    // No count-up screen-reader helper nodes were injected either.
    expect(document.querySelector(".value--countup .sr-only")).toBeNull();
  });

  it("scenario (d): with prefers-reduced-motion, processing shows content with NO reveal", async () => {
    mockMatchMedia(true); // reduced motion
    loadMock.mockResolvedValue(null);
    processFileMock.mockResolvedValue(dataset(20));
    const user = userEvent.setup();
    render(<App />);

    await uploadFile(user);
    await screen.findByText(i18n.t("stats.sections.social"));

    // Content is present and usable, but the reveal choreography is suppressed.
    expect(choreo()).not.toBeNull();
    expect(choreo()?.classList.contains("is-revealing")).toBe(false);
    // And no count-up loop ran → no sr-only count helper.
    expect(document.querySelector(".value--countup .sr-only")).toBeNull();
  });

  it("announces 'Dashboard ready' once via the live region on processing", async () => {
    mockMatchMedia(false);
    loadMock.mockResolvedValue(null);
    processFileMock.mockResolvedValue(dataset(20));
    const user = userEvent.setup();
    render(<App />);

    await uploadFile(user);
    await screen.findByText(i18n.t("stats.sections.social"));

    await waitFor(() => {
      const live = document.querySelector("[aria-live='polite']");
      expect(live?.textContent).toBe(i18n.t("upload.dashboardReady"));
    });
  });
});
