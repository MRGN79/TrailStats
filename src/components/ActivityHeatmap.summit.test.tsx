import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { ActivityHeatmap } from "./ActivityHeatmap";
import type { HeatmapData, HeatmapDay, HeatLevel } from "../lib/types";

function buildDays(n: number, filler: (i: number) => Partial<HeatmapDay> = () => ({})): HeatmapDay[] {
  const start = Date.UTC(2025, 0, 6); // a Monday
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(start + i * 86400000);
    const base: HeatmapDay = { date, distanceKm: 0, level: "none" as HeatLevel };
    return { ...base, ...filler(i) };
  });
}

function renderHeatmap(days: HeatmapDay[], locale = "en") {
  const data: HeatmapData = {
    start: days[0]?.date ?? new Date(),
    end: days[days.length - 1]?.date ?? new Date(),
    days,
  };
  return render(
    <I18nextProvider i18n={i18n}>
      <ActivityHeatmap data={data} locale={locale} revealIndex={4} />
    </I18nextProvider>
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => cleanup());

describe("ActivityHeatmap — cascade contract (US-5, CE-7)", () => {
  it("wraps each week in a <g class='heatmap__col'> carrying its --col-index", () => {
    // 5 weeks of data with some activity.
    const days = buildDays(35, (i) =>
      i % 3 === 0 ? { distanceKm: 10, level: "medium" as HeatLevel } : {}
    );
    const { container } = renderHeatmap(days);
    const cols = container.querySelectorAll<SVGGElement>("g.heatmap__col");
    expect(cols.length).toBeGreaterThanOrEqual(5);
    // The stagger is applied per column, never per cell (thousands of <rect>).
    cols.forEach((g, i) => {
      expect(g.style.getPropertyValue("--col-index")).toBe(String(i));
    });
  });

  it("keeps day labels correct so the final state matches the non-animated heatmap", () => {
    const days = buildDays(7, (i) => (i === 0 ? { distanceKm: 12.5, level: "high" as HeatLevel } : {}));
    const { container } = renderHeatmap(days);
    const rects = container.querySelectorAll("rect[aria-label]");
    expect(rects.length).toBe(7);
    // Active day uses dayLabel with a distance; empty days use dayLabelEmpty.
    const labels = Array.from(rects).map((r) => r.getAttribute("aria-label") ?? "");
    expect(labels.some((l) => /km/.test(l))).toBe(true);
    // <title> tooltips mirror the aria-label (unchanged by the cascade).
    expect(container.querySelectorAll("rect > title").length).toBe(7);
  });
});

describe("ActivityHeatmap — no cascade with no data (US-5 empty branch)", () => {
  it("shows the no-activity message and hides the svg from the a11y tree when empty", () => {
    const days = buildDays(30); // all distanceKm 0 → allEmpty
    const { container, getByText } = renderHeatmap(days);
    expect(getByText(i18n.t("stats.heatmap.noRecentActivity"))).toBeTruthy();
    const svg = container.querySelector("svg.heatmap");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
  });
});

describe("ActivityHeatmap — i18n", () => {
  it("renders month and day axis labels in Spanish", async () => {
    await i18n.changeLanguage("es");
    const days = buildDays(35, (i) => (i % 4 === 0 ? { distanceKm: 8, level: "low" as HeatLevel } : {}));
    const { container } = renderHeatmap(days, "es");
    const dayTexts = Array.from(container.querySelectorAll("text.heatmap__day")).map(
      (t) => t.textContent
    );
    // Spanish weekday abbreviation for Monday (mon key).
    expect(dayTexts).toContain(i18n.t("stats.heatmap.days.mon"));
    expect(dayTexts.length).toBe(7);
  });
});
