import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ParsedDataset } from "./lib/types";

// Control whether the local persistence (save) succeeds or fails so we
// can exercise the saveError branch surfaced in App's handleFile catch.
const saveMock = vi.fn<[ParsedDataset], Promise<void>>();
vi.mock("./lib/repository", () => ({
  repository: {
    load: vi.fn().mockResolvedValue(null),
    save: (ds: ParsedDataset) => saveMock(ds),
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

// Deterministic dataset from a file upload, bypassing real zip parsing.
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
    type: "Run",
    distanceKm: 10,
    movingTimeSec: 3000,
    elevationGainM: 100,
  }));
  return { activities, activityTypes: ["Run"], discardedRows: 0 };
}

async function uploadFile(user: ReturnType<typeof userEvent.setup>) {
  // The file input only exists once the idle upload screen has rendered.
  await screen.findByText(i18n.t("upload.dropzone"));
  const input = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  const file = new File(["zip-bytes"], "export.zip", {
    type: "application/zip",
  });
  await user.upload(input, file);
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  saveMock.mockReset();
  processFileMock.mockReset();
  processFileMock.mockResolvedValue(dataset(20));
});

afterEach(() => cleanup());

describe("App — local save error handling", () => {
  it("shows the save-failed alert when repository.save rejects", async () => {
    saveMock.mockRejectedValue(new Error("quota exceeded"));
    const user = userEvent.setup();
    render(<App />);

    await uploadFile(user);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(i18n.t("upload.error.saveFailed"));
  });

  it("does NOT show the save-failed alert when repository.save resolves", async () => {
    saveMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<App />);

    await uploadFile(user);

    // Dashboard renders successfully; give the resolved save a chance to flush.
    await screen.findByText(i18n.t("stats.sections.social"));
    await waitFor(() => {
      expect(
        screen.queryByText(i18n.t("upload.error.saveFailed"))
      ).toBeNull();
    });
  });
});
