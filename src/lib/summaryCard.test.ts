import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SummaryCardData } from "./summaryCard";

const mockData: SummaryCardData = {
  totalActivities: 150,
  totalDistanceKm: 1200.5,
  totalMovingTimeSec: 360000,
  totalElevationGainM: 15000,
  currentStreak: 4,
  bestWeekDistanceKm: 85.2,
  locale: "en",
  labels: {
    activities: "Activities",
    distance: "Distance",
    time: "Moving time",
    elevation: "Elevation",
    currentStreak: "Current streak",
    bestWeek: "Best week",
    weeks: "weeks",
    km: "km",
    m: "m",
  },
};

describe("generateSummaryCard", () => {
  beforeEach(() => {
    // jsdom doesn't implement document.fonts
    Object.defineProperty(document, "fonts", {
      value: { load: vi.fn().mockResolvedValue([]) },
      configurable: true,
    });
  });

  it("resolves to a Blob in a browser-like environment", async () => {
    // jsdom provides canvas via getContext but returns null for 2d in Node.
    // We mock it so the function runs without throwing.
    const ctx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      textAlign: "",
      textBaseline: "",
      font: "",
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      ellipse: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      save: vi.fn(),
      restore: vi.fn(),
    };

    const blobMock = new Blob(["png"], { type: "image/png" });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb: (b: Blob) => void) => cb(blobMock)),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockReturnValueOnce(canvas);

    const { generateSummaryCard } = await import("./summaryCard");
    const result = await generateSummaryCard(mockData);
    expect(result).toBeInstanceOf(Blob);
  });

  it("handles null bestWeekDistanceKm without throwing", async () => {
    const ctx = {
      fillStyle: "", strokeStyle: "", lineWidth: 0, textAlign: "", textBaseline: "", font: "",
      fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      ellipse: vi.fn(), stroke: vi.fn(), fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      save: vi.fn(), restore: vi.fn(),
    };
    const blobMock = new Blob(["png"], { type: "image/png" });
    const canvas = {
      width: 0, height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb: (b: Blob) => void) => cb(blobMock)),
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(canvas);

    const { generateSummaryCard } = await import("./summaryCard");
    const result = await generateSummaryCard({ ...mockData, bestWeekDistanceKm: null });
    expect(result).toBeInstanceOf(Blob);
  });
});
